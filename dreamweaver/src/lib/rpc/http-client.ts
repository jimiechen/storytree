/**
 * HTTP RPC Client Implementation
 *
 * Implements the IRPCClient interface using the Fetch API for
 * browser/server-side HTTP communication.
 *
 * Features:
 * - Automatic JSON-RPC protocol wrapping
 * - Timeout control with AbortController
 * - Exponential backoff retry mechanism
 * - Request/response middleware support
 * - Detailed error handling and logging
 */

import type {
  ActionName,
  ErrorCode,
  IPCRequest,
  IPCResponse,
} from "./ipc-protocol";
import {
  createErrorResponse,
  createRequest,
} from "./ipc-protocol";
import type {
  BaseRPCClientConfig,
  HTTPClientConfig,
  IRPCClient,
  RequestMiddleware,
  ResponseMiddleware,
  ErrorHandler,
  RPCClientEvent,
  RPCEventListener,
} from "./types";

// ============================================================
// Default Configuration
// ============================================================

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1000; // 1 second

// ============================================================
// HTTP RPC Client Class
// ============================================================

export class HTTPRPCClient implements IRPCClient {
  private config: Required<HTTPClientConfig> & { baseUrl: string };
  private requestMiddlewares: RequestMiddleware[] = [];
  private responseMiddlewares: ResponseMiddleware[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private eventListeners: Map<RPCClientEvent, Set<RPCEventListener>> = new Map();
  private requestIdCounter: number = 0;

  constructor(config: HTTPClientConfig) {
    this.config = {
      timeout: config.timeout ?? DEFAULT_TIMEOUT,
      debug: config.debug ?? false,
      maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
      baseUrl: config.baseUrl.replace(/\/+$/, ""), // Remove trailing slash
      defaultHeaders: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...config.defaultHeaders,
      },
      credentials: config.credentials ?? "same-origin",
    };

    this.log("HTTPRPCClient initialized", { baseUrl: this.config.baseUrl });
  }

  // ============================================================
  // Core Request Method
  // ============================================================

  async request<T = unknown>(
    action: ActionName,
    params?: Record<string, unknown>,
    options?: Partial<BaseRPCClientConfig>
  ): Promise<T> {
    const requestId = this.generateRequestId();
    const request = createRequest(requestId, action, params ?? {});

    // Apply request middlewares
    const processedRequest = await this.applyRequestMiddlewares(request);

    // Merge options with defaults
    const timeout = options?.timeout ?? this.config.timeout;
    const maxRetries = options?.maxRetries ?? this.config.maxRetries;

    try {
      const response = await this.executeWithRetry<T>(
        processedRequest,
        timeout,
        maxRetries
      );

      return response.data as T;
    } catch (error) {
      throw this.handleError(error as Error, processedRequest);
    }
  }

  // ============================================================
  // Batch Request Support
  // ============================================================

  async batch<T = unknown>(
    requests: Array<{ action: ActionName; params?: Record<string, unknown> }>
  ): Promise<T[]> {
    const batchRequests = requests.map(({ action, params }) =>
      createRequest(this.generateRequestId(), action, params ?? {})
    );

    try {
      const response = await fetch(`${this.config.baseUrl}/rpc/batch`, {
        method: "POST",
        headers: this.config.defaultHeaders,
        credentials: this.config.credentials,
        body: JSON.stringify({ requests: batchRequests }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!Array.isArray(data.responses)) {
        throw new Error("Invalid batch response format");
      }

      return data.responses.map((res: IPCResponse<T>) => {
        if (res.status === "error") {
          throw new Error(res.error.message);
        }
        return res.data as T;
      });
    } catch (error) {
      throw new Error(`Batch request failed: ${(error as Error).message}`);
    }
  }

  // ============================================================
  // Notification (Fire-and-Forget)
  // ============================================================

  notify(action: ActionName, params?: Record<string, unknown>): void {
    const request = {
      jsonrpc: "2.0",
      action,
      payload: params ?? {},
      timestamp: new Date().toISOString(),
    };

    // Fire and forget - don't wait for response
    fetch(`${this.config.baseUrl}/rpc/notification`, {
      method: "POST",
      headers: this.config.defaultHeaders,
      credentials: this.config.credentials,
      body: JSON.stringify(request),
    }).catch((error) => {
      this.log("Notification failed", { error: error.message });
    });
  }

  // ============================================================
  // Client Info
  // ============================================================

  getTransportType(): "http" | "ipc" {
    return "http";
  }

  isReady(): boolean {
    return typeof fetch !== "undefined";
  }

  dispose(): void {
    this.requestMiddlewares = [];
    this.responseMiddlewares = [];
    this.errorHandlers = [];
    this.eventListeners.clear();
    this.log("HTTPRPCClient disposed");
  }

  // ============================================================
  // Middleware Registration
  // ============================================================

  useRequest(middleware: RequestMiddleware): this {
    this.requestMiddlewares.push(middleware);
    return this;
  }

  useResponse(middleware: ResponseMiddleware): this {
    this.responseMiddlewares.push(middleware);
    return this;
  }

  onError(handler: ErrorHandler): this {
    this.errorHandlers.push(handler);
    return this;
  }

  on(event: RPCClientEvent, listener: RPCEventListener): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(event)?.delete(listener);
    };
  }

  // ============================================================
  // Private Methods
  // ============================================================

  /**
   * Execute HTTP request with retry logic
   */
  private async executeWithRetry<T>(
    request: IPCRequest,
    timeout: number,
    maxRetries: number,
    attempt: number = 0
  ): Promise<IPCResponse<T>> {
    this.emit(RPCClientEvent.REQUEST_SENT, { request, attempt });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const url = `${this.config.baseUrl}/rpc`;
      const response = await fetch(url, {
        method: "POST",
        headers: this.config.defaultHeaders,
        credentials: this.config.credentials,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        throw new Error(
          `HTTP ${response.status}: ${response.statusText}${errorBody ? ` - ${errorBody}` : ""}`
        );
      }

      let responseData: IPCResponse<T>;
      try {
        responseData = await response.json();
      } catch (parseError) {
        throw new Error(`Failed to parse response JSON: ${(parseError as Error).message}`);
      }

      // Apply response middlewares
      const processedResponse = await this.applyResponseMiddlewares(responseData);

      this.emit(RPCClientEvent.RESPONSE_RECEIVED, { response: processedResponse });

      // Check for error response from server
      if (processedResponse.status === "error") {
        throw new Error(processedResponse.error.message);
      }

      return processedResponse;
    } catch (error) {
      const err = error as Error;

      // Don't retry on abort or client errors (4xx)
      if (err.name === "AbortError") {
        this.emit(RPCClientEvent.TIMEOUT, { request, timeout });
        throw new Error(`Request timed out after ${timeout}ms`);
      }

      // Retry with exponential backoff
      if (attempt < maxRetries && this.isRetryableError(err)) {
        const delay = RETRY_BASE_DELAY * Math.pow(2, attempt);
        this.log(`Retrying request (attempt ${attempt + 1}/${maxRetries})`, {
          delay,
          error: err.message,
        });
        this.emit(RPCClientEvent.RETRY, { request, attempt: attempt + 1, delay });

        await this.sleep(delay);
        return this.executeWithRetry(request, timeout, maxRetries, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryablePatterns = [
      /network/i,
      /timeout/i,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /5\d{2}/, // Server errors (5xx)
    ];

    return retryablePatterns.some((pattern) => pattern.test(error.message));
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `http-${Date.now()}-${++this.requestIdCounter}`;
  }

  /**
   * Apply all request middlewares in order
   */
  private async applyRequestMiddlewares(request: IPCRequest): Promise<IPCRequest> {
    let processed = request;
    for (const middleware of this.requestMiddlewares) {
      processed = await middleware(processed);
    }
    return processed;
  }

  /**
   * Apply all response middlewares in order
   */
  private async applyResponseMiddlewares<T>(
    response: IPCResponse<T>
  ): Promise<IPCResponse<T>> {
    let processed = response;
    for (const middleware of this.responseMiddlewares) {
      processed = await middleware(processed);
    }
    return processed;
  }

  /**
   * Handle errors through registered handlers
   */
  private handleError(error: Error, request: IPCRequest): Error {
    this.emit(RPCClientEvent.ERROR, { error, request });

    for (const handler of this.errorHandlers) {
      handler(error, request);
    }

    return error;
  }

  /**
   * Emit event to listeners
   */
  private emit(event: RPCClientEvent, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => listener(data));
    }
  }

  /**
   * Sleep utility for retries
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Conditional logging
   */
  private log(message: string, data?: Record<string, unknown>): void {
    if (this.config.debug) {
      console.log(`[HTTPRPCClient] ${message}`, data ?? "");
    }
  }
}

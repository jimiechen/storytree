/**
 * IPC RPC Client Implementation
 *
 * Implements the IRPCClient interface using VS Code Webview API
 * for communication between the webview and extension host.
 *
 * Features:
 * - Automatic message correlation via request IDs
 * - Timeout control for pending requests
 * - Request/response middleware support
 * - Event-driven architecture with Promise-based API
 */

import type {
  ActionName,
  IPCRequest,
  IPCResponse,
  IPCNotification,
} from "./ipc-protocol";
import { createRequest } from "./ipc-protocol";
import type {
  BaseRPCClientConfig,
  IPCClientConfig,
  IRPCClient,
  RequestMiddleware,
  ResponseMiddleware,
  ErrorHandler,
  RPCClientEvent,
  RPCEventListener,
} from "./types";

// ============================================================
// VS Code API Types (Minimal definitions to avoid dependency)
// ============================================================

interface VSCodeAPI {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

// ============================================================
// Default Configuration
// ============================================================

const DEFAULT_TIMEOUT = 30000; // 30 seconds

// ============================================================
// Pending Request Tracker
// ============================================================

interface PendingRequest {
  resolve: (response: IPCResponse) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  timestamp: number;
}

// ============================================================
// IPC RPC Client Class
// ============================================================

export class IPCRPCClient implements IRPCClient {
  private config: Required<BaseRPCClientConfig> & { vscodeAPI: VSCodeAPI };
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private requestMiddlewares: RequestMiddleware[] = [];
  private responseMiddlewares: ResponseMiddleware[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private eventListeners: Map<RPCClientEvent, Set<RPCEventListener>> = new Map();
  private messageIdCounter: number = 0;
  private isListening: boolean = false;

  constructor(config: IPCClientConfig) {
    this.config = {
      timeout: config.timeout ?? DEFAULT_TIMEOUT,
      debug: config.debug ?? false,
      maxRetries: config.maxRetries ?? 1, // IPC doesn't retry by default
      vscodeAPI: config.vscodeAPI as VSCodeAPI,
    };

    this.startListening();
    this.log("IPCRPCClient initialized");
  }

  // ============================================================
  // Core Request Method
  // ============================================================

  async request<T = unknown>(
    action: ActionName,
    params?: Record<string, unknown>,
    options?: Partial<BaseRPCClientConfig>
  ): Promise<T> {
    if (!this.isReady()) {
      throw new Error("IPC client not ready: VS Code API not available");
    }

    const requestId = this.generateRequestId();
    const request = createRequest(requestId, action, params ?? {});

    // Apply request middlewares
    const processedRequest = await this.applyRequestMiddlewares(request);

    return new Promise<T>((resolve, reject) => {
      const timeout = options?.timeout ?? this.config.timeout;

      // Set up timeout
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        this.emit(RPCClientEvent.TIMEOUT, { request: processedRequest, timeout });
        reject(new Error(`IPC request timed out after ${timeout}ms`));
      }, timeout);

      // Track the pending request
      this.pendingRequests.set(requestId, {
        resolve: resolve as (response: IPCResponse) => void,
        reject,
        timer,
        timestamp: Date.now(),
      });

      this.emit(RPCClientEvent.REQUEST_SENT, { request: processedRequest });

      // Send message to extension host
      try {
        this.config.vscodeAPI.postMessage(processedRequest);
      } catch (error) {
        clearTimeout(timer);
        this.pendingRequests.delete(requestId);
        this.handleError(error as Error, processedRequest);
        reject(error);
      }
    }).then((response) => {
      const typedResponse = response as IPCResponse<T>;

      // Apply response middlewares
      return this.applyResponseMiddlewares(typedResponse).then((processed) => {
        this.emit(RPCClientEvent.RESPONSE_RECEIVED, { response: processed });

        if (processed.status === "error") {
          throw new Error(processed.error.message);
        }

        return processed.data as T;
      });
    });
  }

  // ============================================================
  // Batch Request Support
  // ============================================================

  async batch<T = unknown>(
    requests: Array<{ action: ActionName; params?: Record<string, unknown> }>
  ): Promise<T[]> {
    if (!this.isReady()) {
      throw new Error("IPC client not ready: VS Code API not available");
    }

    const batchRequestId = `batch-${this.generateRequestId()}`;
    const batchRequests = requests.map(({ action, params }) =>
      createRequest(this.generateRequestId(), action, params ?? {})
    );

    return new Promise<T[]>((resolve, reject) => {
      const timeout = this.config.timeout * 2; // Longer timeout for batches
      const responses: T[] = [];
      let completedCount = 0;
      const totalRequests = batchRequests.length;

      const timer = setTimeout(() => {
        this.cleanupBatchRequests(batchRequests);
        reject(new Error(`Batch request timed out after ${timeout}ms`));
      }, timeout);

      // Track all individual requests in the batch
      batchRequests.forEach((req, index) => {
        this.pendingRequests.set(req.id, {
          resolve: (response) => {
            completedCount++;
            responses[index] = (response as IPCResponse<T>).data as T;

            if (completedCount === totalRequests) {
              clearTimeout(timer);
              resolve(responses);
            }
          },
          reject: (error) => {
            clearTimeout(timer);
            this.cleanupBatchRequests(batchRequests);
            reject(error);
          },
          timer,
          timestamp: Date.now(),
        });

        // Send each request
        this.config.vscodeAPI.postMessage(req);
      });
    });
  }

  // ============================================================
  // Notification (Fire-and-Forget)
  // ============================================================

  notify(action: ActionName, params?: Record<string, unknown>): void {
    if (!this.isReady()) {
      this.log("Cannot send notification: IPC client not ready");
      return;
    }

    const notification: IPCNotification = {
      jsonrpc: "2.0",
      action,
      payload: params ?? {},
      timestamp: new Date().toISOString(),
    };

    try {
      this.config.vscodeAPI.postMessage(notification);
    } catch (error) {
      this.log("Notification send failed", { error: (error as Error).message });
    }
  }

  // ============================================================
  // Client Info
  // ============================================================

  getTransportType(): "http" | "ipc" {
    return "ipc";
  }

  isReady(): boolean {
    return (
      typeof this.config.vscodeAPI !== "undefined" &&
      this.config.vscodeAPI !== null &&
      typeof this.config.vscodeAPI.postMessage === "function"
    );
  }

  dispose(): void {
    this.stopListening();

    // Reject all pending requests
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error("IPC client disposed"));
    }
    this.pendingRequests.clear();

    this.requestMiddlewares = [];
    this.responseMiddlewares = [];
    this.errorHandlers = [];
    this.eventListeners.clear();

    this.log("IPCRPCClient disposed");
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

    return () => {
      this.eventListeners.get(event)?.delete(listener);
    };
  }

  // ============================================================
  // Message Handling (Private)
  // ============================================================

  /**
   * Start listening for messages from extension host
   */
  private startListening(): void {
    if (typeof window !== "undefined" && !this.isListening) {
      window.addEventListener("message", this.handleMessage);
      this.isListening = true;
    }
  }

  /**
   * Stop listening for messages
   */
  private stopListening(): void {
    if (typeof window !== "undefined" && this.isListening) {
      window.removeEventListener("message", this.handleMessage);
      this.isListening = false;
    }
  }

  /**
   * Handle incoming message from extension host
   */
  private handleMessage = (event: MessageEvent): void => {
    const data = event.data as IPCResponse;

    if (!data || !data.id || !data.jsonrpc) {
      return; // Ignore non-RPC messages
    }

    const pending = this.pendingRequests.get(data.id);

    if (!pending) {
      this.log("Received response for unknown request", { id: data.id });
      return;
    }

    clearTimeout(pending.timer);
    this.pendingRequests.delete(data.id);

    pending.resolve(data);
  };

  /**
   * Clean up batch request trackers
   */
  private cleanupBatchRequests(requests: IPCRequest[]): void {
    requests.forEach((req) => {
      const pending = this.pendingRequests.get(req.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(req.id);
      }
    });
  }

  // ============================================================
  // Private Utility Methods
  // ============================================================

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `ipc-${Date.now()}-${++this.messageIdCounter}`;
  }

  /**
   * Apply request middlewares
   */
  private async applyRequestMiddlewares(request: IPCRequest): Promise<IPCRequest> {
    let processed = request;
    for (const middleware of this.requestMiddlewares) {
      processed = await middleware(processed);
    }
    return processed;
  }

  /**
   * Apply response middlewares
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
   * Conditional logging
   */
  private log(message: string, data?: Record<string, unknown>): void {
    if (this.config.debug) {
      console.log(`[IPCRPCClient] ${message}`, data ?? "");
    }
  }
}

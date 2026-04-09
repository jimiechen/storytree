import {
  type IPCRequest,
  type IPCResponse,
  type RequestId,
  type ActionName,
  createRequest,
  createErrorResponse,
  ErrorCode,
} from "../types/ipc-protocol";

/**
 * RPC Client Interface
 * Abstracts the communication mechanism (HTTP vs IPC)
 */
export interface IRPCClient {
  request<T>(action: ActionName, params: unknown): Promise<T>;
  isInitialized(): boolean;
  dispose(): void;
}

/**
 * HTTP RPC Client for Browser Environment
 * Uses fetch API to communicate with backend server
 */
export class HTTPRPCClient implements IRPCClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private initialized = false;

  constructor(baseUrl: string, headers: Record<string, string> = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.headers = {
      "Content-Type": "application/json",
      ...headers,
    };
    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async request<T>(action: ActionName, params: unknown): Promise<T> {
    if (!this.initialized) {
      throw new RPCError(
        ErrorCode.INTERNAL_ERROR,
        "RPC Client not initialized",
        { action }
      );
    }

    const requestId = generateRequestId();
    const request = createRequest(requestId, action, params);

    try {
      const response = await fetch(`${this.baseUrl}/api/rpc`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new RPCError(
          ErrorCode.SERVER_ERROR_START,
          `HTTP ${response.status}: ${response.statusText}`,
          { action, status: response.status }
        );
      }

      const rpcResponse = (await response.json()) as IPCResponse;
      return this.handleResponse(rpcResponse);
    } catch (error) {
      if (error instanceof RPCError) {
        throw error;
      }
      throw new RPCError(
        ErrorCode.NETWORK_ERROR,
        error instanceof Error ? error.message : "Network request failed",
        { action, originalError: error }
      );
    }
  }

  private handleResponse<T>(response: IPCResponse): T {
    if (response.status === "error") {
      throw new RPCError(
        response.error?.code || ErrorCode.INTERNAL_ERROR,
        response.error?.message || "Unknown error",
        response.error
      );
    }
    return response.data as T;
  }

  dispose(): void {
    this.initialized = false;
  }
}

/**
 * IPC Client for VS Code Webview Environment
 * Uses VS Code's postMessage API for communication
 */
export class IPCClient implements IRPCClient {
  private vscode: VSCodeAPI | null = null;
  private initialized = false;
  private pendingRequests = new Map<
    RequestId,
    { resolve: (value: unknown) => void; reject: (error: Error) => void }
  >();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pendingRequestsTyped = this.pendingRequests as Map<
    RequestId,
    { resolve: (value: any) => void; reject: (error: Error) => void }
  >;

  constructor() {
    this.tryInitialize();
  }

  private tryInitialize(): void {
    try {
      if (typeof acquireVsCodeApi === "function") {
        this.vscode = acquireVsCodeApi();
        this.initialized = true;
        this.setupMessageListener();
      }
    } catch {
      this.initialized = false;
    }
  }

  private setupMessageListener(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("message", (event) => {
      const response = event.data as IPCResponse;
      if (!response || !response.id) return;

      const pending = this.pendingRequestsTyped.get(response.id);
      if (!pending) return;

      this.pendingRequestsTyped.delete(response.id);

      if (response.status === "error") {
        pending.reject(
          new RPCError(
            response.error?.code || ErrorCode.INTERNAL_ERROR,
            response.error?.message || "Unknown error",
            response.error
          )
        );
      } else {
        pending.resolve(response.data);
      }
    });
  }

  isInitialized(): boolean {
    return this.initialized && this.vscode !== null;
  }

  async request<T>(action: ActionName, params: unknown): Promise<T> {
    if (!this.isInitialized()) {
      throw new RPCError(
        ErrorCode.INTERNAL_ERROR,
        "RPC Client not initialized",
        { action }
      );
    }

    const requestId = generateRequestId();
    const request = createRequest(requestId, action, params);

    return new Promise<T>((resolve, reject) => {
      this.pendingRequestsTyped.set(requestId, { resolve, reject });

      // Set timeout for request
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(
            new RPCError(
              ErrorCode.SERVER_TIMEOUT,
              "Request timeout after 30s",
              { action, requestId }
            )
          );
        }
      }, 30000);

      this.vscode!.postMessage(request);
    });
  }

  dispose(): void {
    this.pendingRequests.forEach(({ reject }) => {
      reject(new RPCError(ErrorCode.INTERNAL_ERROR, "Client disposed"));
    });
    this.pendingRequests.clear();
    this.initialized = false;
    this.vscode = null;
  }
}

/**
 * RPC Adapter - Factory and Singleton Manager
 * Automatically detects environment and creates appropriate client
 */
export class RPCAdapter {
  private static instance: RPCAdapter | null = null;
  private client: IRPCClient | null = null;
  private httpFallbackUrl: string | null = null;

  private constructor() {}

  static getInstance(): RPCAdapter {
    if (!RPCAdapter.instance) {
      RPCAdapter.instance = new RPCAdapter();
    }
    return RPCAdapter.instance;
  }

  /**
   * Detect if running in VS Code Webview environment
   */
  static isVSCode(): boolean {
    try {
      return (
        typeof acquireVsCodeApi === "function" ||
        (typeof window !== "undefined" &&
          window.location.protocol === "vscode-webview:")
      );
    } catch {
      return false;
    }
  }

  /**
   * Initialize the RPC client
   * Automatically detects environment and creates appropriate client
   */
  initialize(options?: { httpFallbackUrl?: string }): void {
    if (this.client?.isInitialized()) {
      return; // Already initialized
    }

    this.httpFallbackUrl = options?.httpFallbackUrl ?? null;

    if (RPCAdapter.isVSCode()) {
      this.client = new IPCClient();
      if (!this.client.isInitialized()) {
        // Fall back to HTTP if IPC initialization fails
        this.initializeHTTP();
      }
    } else {
      this.initializeHTTP();
    }
  }

  private initializeHTTP(): void {
    const baseUrl = this.httpFallbackUrl ?? "http://localhost:3000";
    this.client = new HTTPRPCClient(baseUrl);
  }

  /**
   * Get the current RPC client
   */
  getClient(): IRPCClient {
    if (!this.client?.isInitialized()) {
      throw new RPCError(
        ErrorCode.INTERNAL_ERROR,
        "RPC Client not initialized. Call initialize() first."
      );
    }
    return this.client;
  }

  /**
   * Check if adapter is initialized
   */
  isInitialized(): boolean {
    return this.client?.isInitialized() ?? false;
  }

  /**
   * Get current environment type
   */
  getEnvironment(): "vscode" | "browser" {
    return RPCAdapter.isVSCode() ? "vscode" : "browser";
  }

  /**
   * Unified request method
   */
  async request<T>(action: ActionName, params: unknown): Promise<T> {
    return this.getClient().request<T>(action, params);
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.client?.dispose();
    this.client = null;
    RPCAdapter.instance = null;
  }
}

/**
 * RPC Error Class
 */
export class RPCError extends Error {
  code: ErrorCode;
  data?: unknown;

  constructor(code: ErrorCode, message: string, data?: unknown) {
    super(message);
    this.name = "RPCError";
    this.code = code;
    this.data = data;
  }
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * VS Code API type definition
 */
interface VSCodeAPI {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

// Global acquireVsCodeApi function declaration
declare function acquireVsCodeApi(): VSCodeAPI;

// Add NETWORK_ERROR to ErrorCode enum (extension)
export const ExtendedErrorCode = {
  ...ErrorCode,
  NETWORK_ERROR: -32090,
} as const;

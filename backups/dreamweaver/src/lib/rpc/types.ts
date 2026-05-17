/**
 * RPC Client Interface Definitions
 *
 * Defines the abstract interface for RPC communication,
 * supporting both HTTP (browser) and IPC (VS Code Webview) transports.
 */

import type {
  ActionName,
  IPCRequest,
  IPCResponse,
  RequestId,
} from "../../../../../caiode/vscode-extension/src/types/ipc-protocol";

// ============================================================
// Configuration Types
// ============================================================

/** Base configuration shared by all clients */
export interface BaseRPCClientConfig {
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Enable request/response logging (default: false in production) */
  debug?: boolean;
  /** Maximum retry attempts for failed requests (default: 3) */
  maxRetries?: number;
}

/** HTTP Client specific configuration */
export interface HTTPClientConfig extends BaseRPCClientConfig {
  /** API base URL (e.g., "http://localhost:3000/api") */
  baseUrl: string;
  /** Default headers to include in every request */
  defaultHeaders?: Record<string, string>;
  /** Credentials mode for fetch requests */
  credentials?: RequestCredentials;
}

/** IPC Client specific configuration */
export interface IPCClientConfig extends BaseRPCClientConfig {
  /** VS Code API instance (acquireVsCodeApi()) */
  vscodeAPI: unknown;
}

/** Union type for client configuration */
export type RPCClientConfig = HTTPClientConfig | IPCClientConfig;

// ============================================================
// IRPCClient Interface
// ============================================================

/**
 * Abstract RPC Client Interface
 *
 * Provides a unified API for making RPC calls regardless of the
 * underlying transport (HTTP or IPC).
 *
 * @example
 * ```typescript
 * const client = createRPCClient(config);
 *
 * // Type-safe request with generic response
 * const projects = await client.request<ProjectList>("project.list", { page: 1 });
 *
 * // Error handling
 * try {
 *   const result = await client.request("chapter.get", { id: "123" });
 *   if (isSuccessResponse(result)) {
 *     console.log(result.data);
 *   }
 * } catch (error) {
 *   if (isErrorResponse(error)) {
 *     console.error(error.error.message);
 *   }
 * }
 * ```
 */
export interface IRPCClient {
  /**
   * Make an RPC request
   *
   * @param action - The action name to invoke
   * @param params - The parameters/payload for the action
   * @param options - Optional request options (overrides config defaults)
   * @returns Promise resolving to the response data or throwing on error
   */
  request<T = unknown>(
    action: ActionName,
    params?: Record<string, unknown>,
    options?: Partial<BaseRPCClientConfig>
  ): Promise<T>;

  /**
   * Make a batch of RPC requests (atomic execution)
   *
   * @param requests - Array of {action, params} tuples
   * @returns Promise resolving to array of responses
   */
  batch<T = unknown>(
    requests: Array<{ action: ActionName; params?: Record<string, unknown> }>
  ): Promise<T[]>;

  /**
   * Send a notification (fire-and-forget, no response expected)
   *
   * @param action - The notification action name
   * @param params - The notification payload
   */
  notify(
    action: ActionName,
    params?: Record<string, unknown>
  ): void;

  /**
   * Get client transport type
   */
  getTransportType(): "http" | "ipc";

  /**
   * Check if client is initialized and ready
   */
  isReady(): boolean;

  /**
   * Dispose/cleanup resources
   */
  dispose?(): void;
}

// ============================================================
// Request/Response Middleware Types
// ============================================================

/**
 * Request middleware function
 *
 * Called before the request is sent, can modify the request object.
 */
export type RequestMiddleware = (
  request: IPCRequest
) => IPCRequest | Promise<IPCRequest>;

/**
 * Response middleware function
 *
 * Called after the response is received, can modify or inspect it.
 */
export type ResponseMiddleware = <T>(
  response: IPCResponse<T>
) => IPCResponse<T> | Promise<IPCResponse<T>>;

/**
 * Error handler function
 *
 * Called when an error occurs during the request.
 */
export type ErrorHandler = (error: Error, request: IPCRequest) => void | Promise<void>;

// ============================================================
// Event Types
// ============================================================

/** Events that can be emitted by the RPC client */
export enum RPCClientEvent {
  REQUEST_SENT = "request:sent",
  RESPONSE_RECEIVED = "response:received",
  ERROR = "error",
  RETRY = "retry",
  TIMEOUT = "timeout",
}

/** Event listener signature */
export type RPCEventListener<T = unknown> = (data: T) => void;

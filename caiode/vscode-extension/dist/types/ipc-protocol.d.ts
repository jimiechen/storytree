/**
 * StoryTree IPC Protocol - JSON-RPC 2.0 Compatible Type Definitions
 *
 * This module defines the standard communication protocol between:
 * - Webview (Dreamweaver frontend)
 * - VS Code Extension Host (Caiode backend)
 *
 * Based on JSON-RPC 2.0 specification with extensions for:
 * - Batch request/response support
 * - Error code taxonomy
 * - Metadata and timestamp tracking
 */
/** Unique request identifier (string or number) */
export type RequestId = string | number;
/** ISO 8601 timestamp string */
export type Timestamp = string;
/** Action name (e.g., "project.list", "chapter.create") */
export type ActionName = string;
/** RPC Version (fixed to "2.0" for JSON-RPC 2.0) */
export declare const JSON_RPC_VERSION: "2.0";
/**
 * Standard JSON-RPC Request
 *
 * @example
 * ```typescript
 * const request: IPCRequest = {
 *   jsonrpc: "2.0",
 *   id: "req-001",
 *   action: "project.list",
 *   payload: { page: 1, limit: 20 },
 *   timestamp: "2026-04-07T10:30:00Z"
 * };
 * ```
 */
export interface IPCRequest {
    /** JSON-RPC version (always "2.0") */
    jsonrpc: typeof JSON_RPC_VERSION;
    /** Unique request identifier for correlation */
    id: RequestId;
    /** Action name to invoke on the server */
    action: ActionName;
    /** Action parameters/payload */
    payload: unknown;
    /** Client-side timestamp for latency measurement */
    timestamp?: Timestamp;
    /** Optional metadata for debugging/tracing */
    metadata?: Record<string, unknown>;
}
/**
 * Batch Request (array of individual requests)
 *
 * Server MUST process all requests in order and return
 * a batch response with corresponding results.
 */
export interface IPCBatchRequest {
    /** Array of requests to process atomically */
    requests: IPCRequest[];
}
/**
 * Successful Response
 *
 * @example
 * ```typescript
 * const response: IPCSuccessResponse = {
 *   jsonrpc: "2.0",
 *   id: "req-001",
 *   status: "success",
 *   data: { projects: [...], total: 42 },
 *   timestamp: "2026-04-07T10:30:05Z"
 * };
 * ```
 */
export interface IPCSuccessResponse<T = unknown> {
    /** JSON-RPC version */
    jsonrpc: typeof JSON_RPC_VERSION;
    /** Matching request ID */
    id: RequestId;
    /** Response status (always "success" for this type) */
    status: "success";
    /** Response data (typed by generic parameter) */
    data: T;
    /** Server-side processing timestamp */
    timestamp: Timestamp;
    /** Optional processing duration in milliseconds */
    durationMs?: number;
}
/**
 * Error Response
 *
 * Follows JSON-RPC 2.0 error object format with
 * extended error codes for domain-specific errors.
 *
 * @example
 * ```typescript
 * const error: IPCErrorResponse = {
 *   jsonrpc: "2.0",
 *   id: "req-001",
 *   status: "error",
 *   error: {
 *     code: ErrorCode.NOT_FOUND,
 *     message: "Project not found",
 *     data: { projectId: "invalid-id" }
 *   },
 *   timestamp: "2026-04-07T10:30:05Z"
 * };
 * ```
 */
export interface IPCErrorResponse {
    /** JSON-RPC version */
    jsonrpc: typeof JSON_RPC_VERSION;
    /** Matching request ID (null for notifications) */
    id: RequestId | null;
    /** Response status (always "error" for this type) */
    status: "error";
    /** Error details */
    error: IPCError;
    /** Server-side timestamp */
    timestamp: Timestamp;
}
/**
 * Error object structure
 */
export interface IPCError {
    /** Numeric error code (see ErrorCode enum) */
    code: ErrorCode;
    /** Human-readable error message */
    message: string;
    /** Optional additional error data */
    data?: unknown;
    /** Stack trace (development only) */
    stack?: string;
}
/** Union type for success or error response */
export type IPCResponse<T = unknown> = IPCSuccessResponse<T> | IPCErrorResponse;
/**
 * Batch Response (array of individual responses)
 *
 * Order matches the original batch request order.
 */
export interface IPCBatchResponse {
    /** Array of responses (one per request) */
    responses: IPCResponse[];
}
/**
 * Notification (fire-and-forget request)
 *
 * Used for events that don't require a response,
 * such as logging, telemetry, or UI state updates.
 */
export interface IPCNotification {
    /** JSON-RPC version */
    jsonrpc: typeof JSON_RPC_VERSION;
    /** No id field for notifications */
    id?: never;
    /** Action name */
    action: ActionName;
    /** Notification payload */
    payload: unknown;
    /** Timestamp */
    timestamp?: Timestamp;
}
/**
 * Standard error codes (extends JSON-RPC 2.0)
 *
 * Range assignments:
 * - -32700 to -32000: JSON-RPC 2.0 reserved errors
 * - -32099 to -32000: Server error range
 * - -31999 to -31000: Application-specific errors
 * - -30999 to -30000: Domain-specific errors (StoryTree)
 */
export declare enum ErrorCode {
    INVALID_JSON = -32700,
    INVALID_REQUEST = -32600,
    METHOD_NOT_FOUND = -32601,
    INVALID_PARAMS = -32602,
    INTERNAL_ERROR = -32603,
    SERVER_ERROR_START = -32099,
    SERVER_TIMEOUT = -32098,
    SERVER_OVERLOADED = -32097,
    PARSE_ERROR = -31999,
    AUTHENTICATION_FAILED = -31998,
    AUTHORIZATION_FAILED = -31997,
    RATE_LIMIT_EXCEEDED = -31996,
    QUOTA_EXCEEDED = -31995,
    PROJECT_NOT_FOUND = -30999,
    CHAPTER_NOT_FOUND = -30998,
    CHARACTER_NOT_FOUND = -30997,
    WORLD_SETTING_NOT_FOUND = -30996,
    DUPLICATE_RESOURCE = -30995,
    VALIDATION_ERROR = -30994,
    FILE_SYSTEM_ERROR = -30993,
    DATABASE_ERROR = -30992,
    AI_SERVICE_ERROR = -30991,
    AI_MODEL_OVERLOADED = -30990,
    CONTEXT_LENGTH_EXCEEDED = -30989,
    SANDBOX_VIOLATION = -30988,
    ENCRYPTION_ERROR = -30987
}
/**
 * Project Actions
 */
export declare const ProjectAction: {
    readonly LIST: "project.list";
    readonly GET: "project.get";
    readonly CREATE: "project.create";
    readonly UPDATE: "project.update";
    readonly DELETE: "project.delete";
};
/**
 * Chapter Actions
 */
export declare const ChapterAction: {
    readonly LIST: "chapter.list";
    readonly GET: "chapter.get";
    readonly CREATE: "chapter.create";
    readonly UPDATE: "chapter.update";
    readonly DELETE: "chapter.delete";
    readonly SAVE_CONTENT: "chapter.saveContent";
};
/**
 * Character Actions
 */
export declare const CharacterAction: {
    readonly LIST: "character.list";
    readonly GET: "character.get";
    readonly CREATE: "character.create";
    readonly UPDATE: "character.update";
    readonly DELETE: "character.delete";
};
/**
 * AI / Chat Actions
 */
export declare const AIAction: {
    readonly CHAT: "ai.chat";
    readonly STREAM_CHAT: "ai.streamChat";
    readonly GENERATE_OUTLINE: "ai.generateOutline";
    readonly SUGGEST_TEXT: "ai.suggestText";
};
/**
 * System Actions
 */
export declare const SystemAction: {
    readonly HEALTH_CHECK: "system.healthCheck";
    readonly GET_CONFIG: "system.getConfig";
    readonly SET_CONFIG: "system.setConfig";
    readonly GET_VERSION: "system.getVersion";
};
/**
 * Extract the data type from a success response
 */
export type ExtractResponseData<T extends IPCResponse> = T extends IPCSuccessResponse<infer D> ? D : never;
/**
 * Type guard to check if response is successful
 */
export declare function isSuccessResponse<T>(response: IPCResponse<T>): response is IPCSuccessResponse<T>;
/**
 * Type guard to check if response is an error
 */
export declare function isErrorResponse<T>(response: IPCResponse<T>): response is IPCErrorResponse;
/**
 * Create a success response helper
 */
export declare function createSuccessResponse<T>(id: RequestId, data: T, options?: {
    durationMs?: number;
}): IPCSuccessResponse<T>;
/**
 * Create an error response helper
 */
export declare function createErrorResponse(id: RequestId | null, code: ErrorCode, message: string, data?: unknown): IPCErrorResponse;
/**
 * Create a request helper
 */
export declare function createRequest(id: RequestId, action: ActionName, payload: unknown, metadata?: Record<string, unknown>): IPCRequest;
//# sourceMappingURL=ipc-protocol.d.ts.map
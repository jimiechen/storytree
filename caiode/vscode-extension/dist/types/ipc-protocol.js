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
/** RPC Version (fixed to "2.0" for JSON-RPC 2.0) */
export const JSON_RPC_VERSION = "2.0";
// ============================================================
// Error Codes
// ============================================================
/**
 * Standard error codes (extends JSON-RPC 2.0)
 *
 * Range assignments:
 * - -32700 to -32000: JSON-RPC 2.0 reserved errors
 * - -32099 to -32000: Server error range
 * - -31999 to -31000: Application-specific errors
 * - -30999 to -30000: Domain-specific errors (StoryTree)
 */
export var ErrorCode;
(function (ErrorCode) {
    // === JSON-RPC 2.0 Reserved (-32700 to -32000) ===
    ErrorCode[ErrorCode["INVALID_JSON"] = -32700] = "INVALID_JSON";
    ErrorCode[ErrorCode["INVALID_REQUEST"] = -32600] = "INVALID_REQUEST";
    ErrorCode[ErrorCode["METHOD_NOT_FOUND"] = -32601] = "METHOD_NOT_FOUND";
    ErrorCode[ErrorCode["INVALID_PARAMS"] = -32602] = "INVALID_PARAMS";
    ErrorCode[ErrorCode["INTERNAL_ERROR"] = -32603] = "INTERNAL_ERROR";
    // === Server Errors (-32099 to -32000) ===
    ErrorCode[ErrorCode["SERVER_ERROR_START"] = -32099] = "SERVER_ERROR_START";
    ErrorCode[ErrorCode["SERVER_TIMEOUT"] = -32098] = "SERVER_TIMEOUT";
    ErrorCode[ErrorCode["SERVER_OVERLOADED"] = -32097] = "SERVER_OVERLOADED";
    // === Application Errors (-31999 to -31000) ===
    ErrorCode[ErrorCode["PARSE_ERROR"] = -31999] = "PARSE_ERROR";
    ErrorCode[ErrorCode["AUTHENTICATION_FAILED"] = -31998] = "AUTHENTICATION_FAILED";
    ErrorCode[ErrorCode["AUTHORIZATION_FAILED"] = -31997] = "AUTHORIZATION_FAILED";
    ErrorCode[ErrorCode["RATE_LIMIT_EXCEEDED"] = -31996] = "RATE_LIMIT_EXCEEDED";
    ErrorCode[ErrorCode["QUOTA_EXCEEDED"] = -31995] = "QUOTA_EXCEEDED";
    // === StoryTree Domain Errors (-30999 to -30000) ===
    ErrorCode[ErrorCode["PROJECT_NOT_FOUND"] = -30999] = "PROJECT_NOT_FOUND";
    ErrorCode[ErrorCode["CHAPTER_NOT_FOUND"] = -30998] = "CHAPTER_NOT_FOUND";
    ErrorCode[ErrorCode["CHARACTER_NOT_FOUND"] = -30997] = "CHARACTER_NOT_FOUND";
    ErrorCode[ErrorCode["WORLD_SETTING_NOT_FOUND"] = -30996] = "WORLD_SETTING_NOT_FOUND";
    ErrorCode[ErrorCode["DUPLICATE_RESOURCE"] = -30995] = "DUPLICATE_RESOURCE";
    ErrorCode[ErrorCode["VALIDATION_ERROR"] = -30994] = "VALIDATION_ERROR";
    ErrorCode[ErrorCode["FILE_SYSTEM_ERROR"] = -30993] = "FILE_SYSTEM_ERROR";
    ErrorCode[ErrorCode["DATABASE_ERROR"] = -30992] = "DATABASE_ERROR";
    ErrorCode[ErrorCode["AI_SERVICE_ERROR"] = -30991] = "AI_SERVICE_ERROR";
    ErrorCode[ErrorCode["AI_MODEL_OVERLOADED"] = -30990] = "AI_MODEL_OVERLOADED";
    ErrorCode[ErrorCode["CONTEXT_LENGTH_EXCEEDED"] = -30989] = "CONTEXT_LENGTH_EXCEEDED";
    ErrorCode[ErrorCode["SANDBOX_VIOLATION"] = -30988] = "SANDBOX_VIOLATION";
    ErrorCode[ErrorCode["ENCRYPTION_ERROR"] = -30987] = "ENCRYPTION_ERROR";
})(ErrorCode || (ErrorCode = {}));
// ============================================================
// Action Name Constants (Domain-Specific)
// ============================================================
/**
 * Project Actions
 */
export const ProjectAction = {
    LIST: "project.list",
    GET: "project.get",
    CREATE: "project.create",
    UPDATE: "project.update",
    DELETE: "project.delete",
};
/**
 * Chapter Actions
 */
export const ChapterAction = {
    LIST: "chapter.list",
    GET: "chapter.get",
    CREATE: "chapter.create",
    UPDATE: "chapter.update",
    DELETE: "chapter.delete",
    SAVE_CONTENT: "chapter.saveContent",
};
/**
 * Character Actions
 */
export const CharacterAction = {
    LIST: "character.list",
    GET: "character.get",
    CREATE: "character.create",
    UPDATE: "character.update",
    DELETE: "character.delete",
};
/**
 * AI / Chat Actions
 */
export const AIAction = {
    CHAT: "ai.chat",
    STREAM_CHAT: "ai.streamChat",
    GENERATE_OUTLINE: "ai.generateOutline",
    SUGGEST_TEXT: "ai.suggestText",
};
/**
 * System Actions
 */
export const SystemAction = {
    HEALTH_CHECK: "system.healthCheck",
    GET_CONFIG: "system.getConfig",
    SET_CONFIG: "system.setConfig",
    GET_VERSION: "system.getVersion",
};
/**
 * Type guard to check if response is successful
 */
export function isSuccessResponse(response) {
    return response.status === "success";
}
/**
 * Type guard to check if response is an error
 */
export function isErrorResponse(response) {
    return response.status === "error";
}
/**
 * Create a success response helper
 */
export function createSuccessResponse(id, data, options) {
    return {
        jsonrpc: JSON_RPC_VERSION,
        id,
        status: "success",
        data,
        timestamp: new Date().toISOString(),
        ...options,
    };
}
/**
 * Create an error response helper
 */
export function createErrorResponse(id, code, message, data) {
    return {
        jsonrpc: JSON_RPC_VERSION,
        id,
        status: "error",
        error: { code, message, data },
        timestamp: new Date().toISOString(),
    };
}
/**
 * Create a request helper
 */
export function createRequest(id, action, payload, metadata) {
    return {
        jsonrpc: JSON_RPC_VERSION,
        id,
        action,
        payload,
        timestamp: new Date().toISOString(),
        ...(metadata && { metadata }),
    };
}
//# sourceMappingURL=ipc-protocol.js.map
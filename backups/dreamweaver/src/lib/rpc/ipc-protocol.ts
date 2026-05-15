/**
 * IPC Protocol Type Definitions (Local Copy for Dreamweaver)
 *
 * This file contains the essential type definitions from the
 * caiode vscode-extension project, adapted for use in the
 * Dreamweaver frontend without cross-project dependencies.
 */

// ============================================================
// Core Types
// ============================================================

export type RequestId = string | number;
export type Timestamp = string;
export type ActionName = string;

export const JSON_RPC_VERSION = "2.0" as const;

// ============================================================
// Request Types
// ============================================================

export interface IPCRequest {
  jsonrpc: typeof JSON_RPC_VERSION;
  id: RequestId;
  action: ActionName;
  payload: unknown;
  timestamp?: Timestamp;
  metadata?: Record<string, unknown>;
}

export interface IPCBatchRequest {
  requests: IPCRequest[];
}

// ============================================================
// Response Types
// ============================================================

export interface IPCSuccessResponse<T = unknown> {
  jsonrpc: typeof JSON_RPC_VERSION;
  id: RequestId;
  status: "success";
  data: T;
  timestamp: Timestamp;
  durationMs?: number;
}

export interface IPCError {
  code: number;
  message: string;
  data?: unknown;
  stack?: string;
}

export interface IPCErrorResponse {
  jsonrpc: typeof JSON_RPC_VERSION;
  id: RequestId | null;
  status: "error";
  error: IPCError;
  timestamp: Timestamp;
}

export type IPCResponse<T = unknown> =
  | IPCSuccessResponse<T>
  | IPCErrorResponse;

export interface IPCBatchResponse {
  responses: IPCResponse[];
}

// ============================================================
// Notification Types
// ============================================================

export interface IPCNotification {
  jsonrpc: typeof JSON_RPC_VERSION;
  action: ActionName;
  payload: unknown;
  timestamp?: Timestamp;
}

// ============================================================
// Error Codes
// ============================================================

export enum ErrorCode {
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
  ENCRYPTION_ERROR = -30987,
}

// ============================================================
// Action Name Constants
// ============================================================

export const ProjectAction = {
  LIST: "project.list" as const,
  GET: "project.get" as const,
  CREATE: "project.create" as const,
  UPDATE: "project.update" as const,
  DELETE: "project.delete" as const,
} as const;

export const ChapterAction = {
  LIST: "chapter.list" as const,
  GET: "chapter.get" as const,
  CREATE: "chapter.create" as const,
  UPDATE: "chapter.update" as const,
  DELETE: "chapter.delete" as const,
  SAVE_CONTENT: "chapter.saveContent" as const,
} as const;

export const CharacterAction = {
  LIST: "character.list" as const,
  GET: "character.get" as const,
  CREATE: "character.create" as const,
  UPDATE: "character.update" as const,
  DELETE: "character.delete" as const,
} as const;

export const AIAction = {
  CHAT: "ai.chat" as const,
  STREAM_CHAT: "ai.streamChat" as const,
  GENERATE_OUTLINE: "ai.generateOutline" as const,
  SUGGEST_TEXT: "ai.suggestText" as const,
} as const;

export const SystemAction = {
  HEALTH_CHECK: "system.healthCheck" as const,
  GET_CONFIG: "system.getConfig" as const,
  SET_CONFIG: "system.setConfig" as const,
  GET_VERSION: "system.getVersion" as const,
} as const;

// ============================================================
// Utility Functions
// ============================================================

export function isSuccessResponse<T>(
  response: IPCResponse<T>
): response is IPCSuccessResponse<T> {
  return response.status === "success";
}

export function isErrorResponse<T>(
  response: IPCResponse<T>
): response is IPCErrorResponse {
  return response.status === "error";
}

export function createSuccessResponse<T>(
  id: RequestId,
  data: T,
  options?: { durationMs?: number }
): IPCSuccessResponse<T> {
  return {
    jsonrpc: JSON_RPC_VERSION,
    id,
    status: "success" as const,
    data,
    timestamp: new Date().toISOString(),
    ...options,
  };
}

export function createErrorResponse(
  id: RequestId | null,
  code: ErrorCode,
  message: string,
  data?: unknown
): IPCErrorResponse {
  return {
    jsonrpc: JSON_RPC_VERSION,
    id,
    status: "error" as const,
    error: { code, message, data },
    timestamp: new Date().toISOString(),
  };
}

export function createRequest(
  id: RequestId,
  action: ActionName,
  payload: unknown,
  metadata?: Record<string, unknown>
): IPCRequest {
  return {
    jsonrpc: JSON_RPC_VERSION,
    id,
    action,
    payload,
    timestamp: new Date().toISOString(),
    ...(metadata && { metadata }),
  };
}

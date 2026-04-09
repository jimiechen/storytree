export interface IPCMessage {
  id: string;
  method: string;
  params?: any;
}

export interface IPCEvent {
  type: string;
  data?: any;
}

export type IPCMethodHandler = (params: any) => Promise<any>;

export interface IPCMethodMap {
  [key: string]: IPCMethodHandler;
}

export enum IPCErrorCode {
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
  PARSE_ERROR = -32700,
}

export enum SystemAction {
  HEALTH_CHECK = "system.healthCheck",
  GET_CONFIG = "system.getConfig",
}

export enum ProjectAction {
  LIST = "project.list",
  GET = "project.get",
  CREATE = "project.create",
  UPDATE = "project.update",
  DELETE = "project.delete",
}

export enum ChapterAction {
  LIST = "chapter.list",
  GET = "chapter.get",
  CREATE = "chapter.create",
  UPDATE = "chapter.update",
  DELETE = "chapter.delete",
}

export enum CharacterAction {
  LIST = "character.list",
  GET = "character.get",
  CREATE = "character.create",
  UPDATE = "character.update",
  DELETE = "character.delete",
}

export enum ErrorCode {
  INTERNAL_ERROR = 500,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  UNAUTHORIZED = 401,
  METHOD_NOT_FOUND = -32601,
  INVALID_REQUEST = -32600,
  PROJECT_NOT_FOUND = 404,
  SERVER_ERROR_START = 500,
  NETWORK_ERROR = 503,
  SERVER_TIMEOUT = 504,
}

export interface IPCRequest {
  jsonrpc: string;
  id: string | number;
  action: string;
  payload?: any;
  timestamp: string;
}

export interface IPCResponse {
  jsonrpc: string;
  id: string | number;
  status: "success" | "error";
  data?: any;
  error?: {
    code: number;
    message: string;
  };
  timestamp: string;
  durationMs?: number;
}

export interface IPCSuccessResponse extends IPCResponse {
  status: "success";
  data: any;
  error?: never;
}

export interface IPCErrorResponse extends IPCResponse {
  status: "error";
  data?: never;
  error: {
    code: number;
    message: string;
  };
}

export interface IPCNotification {
  jsonrpc: string;
  action: string;
  payload?: any;
  timestamp: string;
}

export function createRequest(id: string | number, action: string, payload: any = {}): IPCRequest {
  return {
    jsonrpc: "2.0",
    id,
    action,
    payload,
    timestamp: new Date().toISOString(),
  };
}

export function isSuccessResponse(response: IPCResponse): boolean {
  return response.status === "success";
}

export function isErrorResponse(response: IPCResponse): boolean {
  return response.status === "error";
}

export type ActionName = string;
export type RequestId = string | number;

export function createSuccessResponse(
  id: string | number | null,
  data: any,
  options?: {
    durationMs?: number;
  }
): IPCSuccessResponse {
  return {
    jsonrpc: "2.0",
    id: id || "null",
    status: "success",
    data,
    timestamp: new Date().toISOString(),
    durationMs: options?.durationMs,
  };
}

export function createErrorResponse(
  id: string | number | null,
  code: number,
  message: string
): IPCErrorResponse {
  return {
    jsonrpc: "2.0",
    id: id || "null",
    status: "error",
    error: {
      code,
      message,
    },
    timestamp: new Date().toISOString(),
  };
}

export interface IPCMessage {
  id: string;
  method: string;
  params?: any;
}

export interface IPCResponse {
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
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

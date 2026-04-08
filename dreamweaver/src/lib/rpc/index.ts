/**
 * RPC Client Module - Public API
 *
 * Re-exports all RPC client functionality for convenient imports.
 */

export type {
  IRPCClient,
  BaseRPCClientConfig,
  HTTPClientConfig,
  IPCClientConfig,
  RPCClientConfig,
  RequestMiddleware,
  ResponseMiddleware,
  ErrorHandler,
  RPCEventListener,
} from "./types";

export { RPCClientEvent } from "./types";

export { HTTPRPCClient } from "./http-client";
export { IPCRPCClient } from "./ipc-client";

export {
  createRPCClient,
  createHTTPClient,
  createIPCClient,
  createAutoDetectClient,
  getRPCClient,
  disposeRPCClient,
  reinitializeRPCClient,
  isVSCodeEnvironment,
  getEnvironmentType,
  resetEnvironmentCache,
} from "./client";

export default {
  createRPCClient,
  isVSCodeEnvironment,
};

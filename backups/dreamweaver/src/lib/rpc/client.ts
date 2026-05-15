/**
 * RPC Client Factory & Environment Detection
 *
 * Provides factory functions for creating the appropriate RPC client
 * based on the runtime environment (browser vs VS Code Webview).
 *
 * Usage:
 * ```typescript
 * import { createRPCClient, isVSCodeEnvironment } from './client';
 *
 * // Auto-detect environment and create client
 * const rpc = createRPCClient({
 *   baseUrl: 'http://localhost:3000/api', // For HTTP fallback
 * });
 *
 * // Or explicitly specify transport
 * const ipcClient = createIPCClient({ vscodeAPI: acquireVsCodeApi() });
 * ```
 */

import { HTTPRPCClient } from "./http-client";
import { IPCRPCClient } from "./ipc-client";
import type {
  IRPCClient,
  HTTPClientConfig,
  IPCClientConfig,
  RPCClientConfig,
} from "./types";

// ============================================================
// Environment Detection
// ============================================================

interface VSCodeWebviewContext {
  /** VS Code API instance (acquireVsCodeApi) */
  vscodeAPI?: unknown;
}

let cachedEnvironment: "vscode" | "browser" | null = null;

/**
 * Detect if running inside a VS Code Webview
 *
 * Detection strategy:
 * 1. Check for acquireVsCodeApi global function
 * 2. Check for specific VS Code user agent strings
 * 3. Check for URL parameters (common in webviews)
 */
export function isVSCodeEnvironment(): boolean {
  if (cachedEnvironment !== null) {
    return cachedEnvironment === "vscode";
  }

  const isVSCode =
    typeof window !== "undefined" &&
    (typeof (window as Record<string, unknown>).acquireVsCodeApi === "function" ||
      navigator.userAgent.includes("VSCode") ||
      new URLSearchParams(window.location.search).get("webview") === "true");

  cachedEnvironment = isVSCode ? "vscode" : "browser";

  return isVSCode;
}

/**
 * Get current environment type
 */
export function getEnvironmentType(): "vscode" | "browser" {
  isVSCodeEnvironment(); // Ensure cached
  return cachedEnvironment!;
}

/**
 * Reset environment cache (for testing)
 */
export function resetEnvironmentCache(): void {
  cachedEnvironment = null;
}

// ============================================================
// Singleton Instance Management
// ============================================================

let singletonInstance: IRPCClient | null = null;
let singletonConfig: RPCClientConfig | null = null;

/**
 * Get or create the global RPC client singleton
 *
 * @param config - Configuration for creating the client (only used on first call)
 * @returns The global IRPCClient instance
 *
 * @example
 * ```typescript
 * // First call creates the instance
 * const rpc = getRPCClient({ baseUrl: '/api' });
 *
 * // Subsequent calls return the same instance
 * const sameRpc = getRPCClient();
 * ```
 */
export function getRPCClient(config?: RPCClientConfig): IRPCClient {
  if (!singletonInstance) {
    if (!config) {
      throw new Error(
        "RPC client not initialized. Call getRPCClient(config) with configuration first."
      );
    }
    singletonInstance = createRPCClient(config);
    singletonConfig = config;
  }

  return singletonInstance;
}

/**
 * Dispose the global singleton instance
 */
export function disposeRPCClient(): void {
  if (singletonInstance) {
    singletonInstance.dispose?.();
    singletonInstance = null;
    singletonConfig = null;
  }
}

/**
 * Reinitialize the global singleton with new config
 */
export function reinitializeRPCClient(config: RPCClientConfig): IRPCClient {
  disposeRPCClient();
  return getRPCClient(config);
}

// ============================================================
// Factory Functions
// ============================================================

/**
 * Create an RPC client based on environment auto-detection
 *
 * This is the recommended way to create a client. It will:
 * 1. Detect if running in VS Code Webview or browser
 * 2. Create the appropriate client implementation
 * 3. Apply default configurations
 *
 * @param config - Configuration object (supports both HTTP and IPC configs)
 * @returns Configured IRPCClient instance
 */
export function createRPCClient(config: RPCClientConfig): IRPCClient {
  if ("baseUrl" in config) {
    return createHTTPClient(config as HTTPClientConfig);
  } else if ("vscodeAPI" in config) {
    return createIPCClient(config as IPCClientConfig);
  }

  throw new Error(
    "Invalid configuration: must include either 'baseUrl' (HTTP) or 'vscodeAPI' (IPC)"
  );
}

/**
 * Create an HTTP-based RPC client (for browser/server environments)
 *
 * @param config - HTTP client configuration including base URL
 * @returns Configured HTTPRPCClient instance
 */
export function createHTTPClient(config: HTTPClientConfig): HTTPRPCClient {
  const client = new HTTPRPCClient(config);

  if (!config.baseUrl) {
    console.warn("[RPC] HTTP client created without baseUrl");
  }

  return client;
}

/**
 * Create an IPC-based RPC client (for VS Code Webview environments)
 *
 * @param config - IPC client configuration including VS Code API
 * @returns Configured IPCRPCClient instance
 */
export function createIPCClient(config: IPCClientConfig): IPCRPCClient {
  if (!config.vscodeAPI) {
    throw new Error("IPC client requires vscodeAPI to be provided");
  }

  return new IPCRPCClient(config);
}

/**
 * Create the appropriate client based on environment detection
 *
 * Convenience function that:
 * 1. Checks if in VS Code Webview → returns IPC client
 * 2. Otherwise → returns HTTP client with provided config
 *
 * @param httpConfig - Fallback HTTP configuration (used when not in VS Code)
 * @param vscodeAPI - Optional VS Code API (auto-detected if not provided)
 * @returns The appropriate client instance
 */
export function createAutoDetectClient(
  httpConfig: Omit<HTTPClientConfig, "baseUrl"> & { baseUrl?: string },
  vscodeAPI?: unknown
): IRPCClient {
  if (isVSCodeEnvironment()) {
    const api = vscodeAPI ?? (typeof window !== "undefined"
      ? (window as Record<string, unknown>).acquireVsCodeApi
      : undefined);

    if (api) {
      return createIPCClient({ vscodeAPI: api, ...httpConfig });
    }
  }

  const baseUrl = httpConfig.baseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? "/api";
  return createHTTPClient({ ...httpConfig, baseUrl } as HTTPClientConfig);
}

// ============================================================
// Default Export (Convenience)
// ============================================================

export default {
  createRPCClient,
  createHTTPClient,
  createIPCClient,
  createAutoDetectClient,
  getRPCClient,
  disposeRPCClient,
  reinitializeRPCClient,
  isVSCodeEnvironment,
  getEnvironmentType,
};

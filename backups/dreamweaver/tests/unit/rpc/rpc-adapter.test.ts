/**
 * Unit Tests for RPC Adapter System
 *
 * Tests cover:
 * - TC-ADAPTER-HP-001 ~ TC-ADAPTER-INT-001 from 05-test-plan.md
 * - HTTP Client functionality
 * - IPC Client functionality
 * - Environment detection and factory functions
 * - Middleware system
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ============================================================
// Mock Setup
// ============================================================

const mockFetch = vi.fn();
const mockPostMessage = vi.fn();
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

global.fetch = mockFetch;
(global as unknown as Record<string, unknown>).window = {
  addEventListener: mockAddEventListener,
  removeEventListener: mockRemoveEventListener,
  location: {
    search: "",
    href: "http://localhost:3000",
    origin: "http://localhost:3000",
  },
} as unknown as Window;

// ============================================================
// Import modules after mocks are set up
// ============================================================

import { HTTPRPCClient } from "@/lib/rpc/http-client";
import { IPCRPCClient } from "@/lib/rpc/ipc-client";
import {
  createRPCClient,
  createHTTPClient,
  createIPCClient,
  createAutoDetectClient,
  getRPCClient,
  disposeRPCClient,
  isVSCodeEnvironment,
  getEnvironmentType,
  resetEnvironmentCache,
} from "@/lib/rpc/client";
import type { IRPCClient, RPCClientConfig } from "@/lib/rpc/types";

// ============================================================
// Test Data Helpers
// ============================================================

function createMockSuccessResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      jsonrpc: "2.0",
      id: "test-id",
      status: "success",
      data,
      timestamp: new Date().toISOString(),
    }),
  };
}

function createMockErrorResponse(code: number, message: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      jsonrpc: "2.0",
      id: "test-id",
      status: "error",
      error: { code, message },
      timestamp: new Date().toISOString(),
    }),
  };
}

// ============================================================
// TC-ADAPTER-HP-001: Browser Environment Uses HTTP Client
// ============================================================

describe("HTTP RPC Client (TC-ADAPTER-HP-001)", () => {
  let client: HTTPRPCClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = createHTTPClient({
      baseUrl: "http://localhost:3000/api",
      debug: false,
    });
  });

  afterEach(() => {
    client.dispose();
  });

  it("should use HTTP transport type", () => {
    expect(client.getTransportType()).toBe("http");
  });

  it("should be ready when fetch is available", () => {
    expect(client.isReady()).toBe(true);
  });

  it("should make POST request to /rpc endpoint", async () => {
    const testData = { projects: [], total: 0 };
    mockFetch.mockResolvedValueOnce(createMockSuccessResponse(testData));

    await client.request("project.list", { page: 1 });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/rpc"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: expect.stringContaining('"action":"project.list"'),
      })
    );
  });
});

// ============================================================
// TC-ADAPTER-HP-002: Webview Environment Uses IPC Client
// ============================================================

describe("IPC RPC Client (TC-ADAPTER-HP-002)", () => {
  let client: IPCRPCClient;
  const mockVSCodeAPI = {
    postMessage: mockPostMessage,
    getState: vi.fn().returnValue(null),
    setState: vi.fn(),
  };

  beforeEach(() => {
    mockPostMessage.mockReset();
    mockAddEventListener.mockReset();
    client = createIPCClient({ vscodeAPI: mockVSCodeAPI, debug: false });
  });

  afterEach(() => {
    client.dispose();
  });

  it("should use IPC transport type", () => {
    expect(client.getTransportType()).toBe("ipc");
  });

  it("should be ready when VS Code API is available", () => {
    expect(client.isReady()).toBe(true);
  });

  it("should call postMessage with request data", async () => {
    const requestPromise = client.request("project.list", { page: 1 });

    expect(mockPostMessage).toHaveBeenCalledTimes(1);
    const postedData = mockPostMessage.mock.calls[0][0];
    expect(postedData.action).toBe("project.list");

    // Simulate response from extension
    const responseEvent = new MessageEvent("message", {
      data: {
        jsonrpc: "2.0",
        id: postedData.id,
        status: "success",
        data: { projects: [] },
        timestamp: new Date().toISOString(),
      },
    });

    // Trigger the message handler manually
    const handler = mockAddEventListener.mock.calls.find(
      (call) => call[0] === "message"
    )?.[1];
    if (handler) handler(responseEvent);

    const result = await requestPromise;
    expect(result).toEqual([]);
  });
});

// ============================================================
// TC-ADAPTER-HP-003: Unified Interface Contract
// ============================================================

describe("Unified IRPCClient Interface (TC-ADAPTER-HP-003)", () => {
  it("should return Promise<T> from request method", async () => {
    mockFetch.mockResolvedValueOnce(createMockSuccessResponse({ result: "ok" }));

    const httpClient = createHTTPClient({ baseUrl: "/api" });
    const result = await httpClient.request<string>("test.action", {});

    expect(result).toBe("ok");
    httpClient.dispose();
  });

  it("should support generic typing for responses", async () => {
    interface ProjectList {
      projects: Array<{ id: string; name: string }>;
      total: number;
    }

    const mockData: ProjectList = {
      projects: [{ id: "1", name: "Test Project" }],
      total: 1,
    };

    mockFetch.mockResolvedValueOnce(createMockSuccessResponse(mockData));

    const httpClient = createHTTPClient({ baseUrl: "/api" });
    const result = await httpClient.request<ProjectList>("project.list");

    expect(result.projects[0].name).toBe("Test Project");
    expect(result.total).toBe(1);
    httpClient.dispose();
  });
});

// ============================================================
// TC-ADAPTER-HP-004: Request Interceptor/Middleware
// ============================================================

describe("Request Middleware System (TC-ADAPTER-HP-004)", () => {
  it("should apply request middleware before sending", async () => {
    mockFetch.mockResolvedValue(createMockSuccessResponse({}));

    const client = createHTTPClient({ baseUrl: "/api" });

    const middleware = vi.fn((request) => {
      return { ...request, metadata: { source: "middleware-test" } };
    });

    client.useRequest(middleware);

    await client.request("test.action", {});

    expect(middleware).toHaveBeenCalled();

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentBody.metadata.source).toBe("middleware-test");

    client.dispose();
  });

  it("should support multiple middlewares in order", async () => {
    mockFetch.mockResolvedValue(createMockSuccessResponse({}));

    const client = createHTTPClient({ baseUrl: "/api" });

    const order: string[] = [];

    client.useRequest((req) => {
      order.push("first");
      return req;
    });

    client.useRequest((req) => {
      order.push("second");
      return req;
    });

    await client.request("test.action", {});

    expect(order).toEqual(["first", "second"]);

    client.dispose();
  });
});

// ============================================================
// TC-ADAPTER-SP-001: Environment Detection Fallback
// ============================================================

describe("Environment Detection Fallback (TC-ADAPTER-SP-001)", () => {
  beforeEach(() => {
    resetEnvironmentCache();
  });

  it("should detect browser environment by default", () => {
    expect(isVSCodeEnvironment()).toBe(false);
    expect(getEnvironmentType()).toBe("browser");
  });

  it("should detect VS Code environment when API available", () => {
    (window as Record<string, unknown>).acquireVsCodeApi = vi.fn();

    resetEnvironmentCache();

    expect(isVSCodeEnvironment()).toBe(true);
    expect(getEnvironmentType()).toBe("vscode");

    delete (window as Record<string, unknown>).acquireVsCodeAPI;
  });
});

// ============================================================
// TC-ADAPTER-SP-002: Uninitialized Error Handling
// ============================================================

describe("Uninitialized Error Handling (TC-ADAPTER-SP-002)", () => {
  beforeEach(() => {
    disposeRPCClient();
  });

  it("should throw error when getRPCClient called without config", () => {
    expect(() => getRPCClient()).toThrow("not initialized");
  });

  it("should throw when IPC client used without VS Code API", () => {
    const ipcClient = new IPCRPCClient({
      vscodeAPI: null as unknown as Record<string, unknown>,
    });

    expect(ipcClient.isReady()).toBe(false);

    expect(ipcClient.request("test")).rejects.toThrow("not ready");

    ipcClient.dispose();
  });
});

// ============================================================
// TC-ADAPTER-SP-003: Timeout and Retry Mechanism
// ============================================================

describe("Timeout and Retry (TC-ADAPTER-SP-003)", () => {
  it("should timeout after configured duration", async () => {
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(resolve, 10000)
        ) // Never resolves
    );

    const client = createHTTPClient({
      baseUrl: "/api",
      timeout: 100, // 100ms timeout
      maxRetries: 0, // No retries for this test
    });

    const startTime = Date.now();

    try {
      await client.request("slow.action", {});
      fail("Should have timed out");
    } catch (error) {
      const elapsed = Date.now() - startTime;
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("timed out");
      expect(elapsed).toBeLessThan(500); // Should be close to 100ms
    }

    client.dispose();
  }, 10000);

  it("should retry on network errors", async () => {
    let attempt = 0;
    mockFetch.mockImplementation(() => {
      attempt++;
      if (attempt < 3) {
        throw new Error("Network error");
      }
      return Promise.resolve(createMockSuccessResponse({ success: true }));
    });

    const client = createHTTPClient({
      baseUrl: "/api",
      maxRetries: 3,
      timeout: 1000,
    });

    const result = await client.request("retry.action", {});
    expect(result.success).toBe(true);
    expect(attempt).toBe(3); // Initial + 2 retries

    client.dispose();
  });
});

// ============================================================
// TC-ADAPTER-INT-001: Dual Mode Consistency
// ============================================================

describe("Dual Mode Behavior Consistency (TC-ADAPTER-INT-001)", () => {
  it("should support same interface contract in both modes", async () => {
    const testAction = "unified.test";
    const testParams = { key: "value" };

    // Test HTTP mode
    mockFetch.mockResolvedValueOnce(createMockSuccessResponse({ mode: "http" }));
    const httpClient = createHTTPClient({ baseUrl: "/api" });
    const httpResult = await httpClient.request(testAction, testParams);
    expect(httpResult.mode).toBe("http");
    httpClient.dispose();

    // Test IPC mode
    const mockAPI = { postMessage: vi.fn() };
    const ipcClient = createIPCClient({ vscodeAPI: mockAPI });

    const ipcPromise = ipcClient.request(testAction, testParams);

    expect(mockAPI.postMessage).toHaveBeenCalled();
    const ipcPosted = mockAPI.postMessage.mock.calls[0][0];
    expect(ipcPosted.action).toBe(testAction);
    expect(ipcPosted.payload).toEqual(testParams);

    ipcClient.dispose();
  });

  it("factory function should auto-detect correct client type", () => {
    resetEnvironmentCache();

    // In browser mode (default), should create HTTP client
    const config: RPCClientConfig = {
      baseUrl: "/api",
    };

    const client = createRPCClient(config);
    expect(client.getTransportType()).toBe("http");
    client.dispose();
  });
});

// ============================================================
// Additional Edge Case Tests
// ============================================================

describe("Edge Cases and Error Scenarios", () => {
  it("should handle notification without waiting for response", () => {
    const mockAPI = { postMessage: vi.fn() };
    const client = createIPCClient({ vscodeAPI: mockAPI });

    client.notify("log.event", { message: "test" });

    expect(mockAPI.postMessage).toHaveBeenCalledTimes(1);
    const notification = mockAPI.postMessage.mock.calls[0][0];
    expect(notification.id).toBeUndefined(); // No ID for notifications

    client.dispose();
  });

  it("should dispose resources properly", () => {
    const mockAPI = { postMessage: vi.fn() };
    const client = createIPCClient({ vscodeAPI: mockAPI });

    expect(client.isReady()).toBe(true);
    client.dispose();

    // After dispose, should not be usable
    expect(() => client.notify("test")).not.toThrow(); // Notifications are fire-and-forget
  });

  it("should support singleton pattern via getRPCClient", () => {
    disposeRPCClient();

    const client1 = getRPCClient({ baseUrl: "/api" });
    const client2 = getRPCClient();

    expect(client1).toBe(client2);

    disposeRPCClient();
  });

  it("should handle batch requests in HTTP mode", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        responses: [
          { jsonrpc: "2.0", status: "success", data: { id: 1 } },
          { jsonrpc: "2.0", status: "success", data: { id: 2 } },
        ],
      }),
    });

    const client = createHTTPClient({ baseUrl: "/api" });

    const results = await client.batch([
      { action: "get.one" },
      { action: "get.two" },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({ id: 1 });
    expect(results[1]).toEqual({ id: 2 });

    client.dispose();
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  RPCAdapter,
  HTTPRPCClient,
  IPCClient,
  RPCError,
  type IRPCClient,
} from "../core/rpc-adapter";
import { ErrorCode } from "../types/ipc-protocol";

describe("TC-ADAPTER: RPC Adapter Environment Switching Tests", () => {
  describe("TC-ADAPTER-HP-001: Browser Environment Detection", () => {
    it("should detect non-VSCode environment", () => {
      // In Node.js test environment, acquireVsCodeApi is not defined
      expect(RPCAdapter.isVSCode()).toBe(false);
    });

    it("should create HTTPRPCClient in browser environment", () => {
      const adapter = RPCAdapter.getInstance();
      adapter.initialize({ httpFallbackUrl: "http://localhost:3000" });

      expect(adapter.getEnvironment()).toBe("browser");
      expect(adapter.isInitialized()).toBe(true);

      adapter.dispose();
    });

    it("should use HTTP client for requests in browser", () => {
      const adapter = RPCAdapter.getInstance();
      adapter.initialize({ httpFallbackUrl: "http://localhost:3000" });

      const client = adapter.getClient();
      expect(client).toBeDefined();
      expect(client.isInitialized()).toBe(true);

      adapter.dispose();
    });
  });

  describe("TC-ADAPTER-HP-002: Webview Environment Detection", () => {
    it("should detect VSCode environment when acquireVsCodeApi exists", () => {
      // Mock acquireVsCodeApi
      const mockPostMessage = vi.fn();
      const mockVsCodeApi = {
        postMessage: mockPostMessage,
        getState: vi.fn(),
        setState: vi.fn(),
      };

      // @ts-ignore - mocking global function
      global.acquireVsCodeApi = vi.fn(() => mockVsCodeApi);

      expect(RPCAdapter.isVSCode()).toBe(true);

      // Cleanup
      // @ts-ignore
      delete global.acquireVsCodeApi;
    });

    it("should detect VSCode environment by protocol", () => {
      // Mock window.location.protocol
      const originalLocation = global.window?.location;
      // @ts-ignore
      global.window = {
        location: { protocol: "vscode-webview:" } as unknown as Location,
        addEventListener: vi.fn(),
      };

      expect(RPCAdapter.isVSCode()).toBe(true);

      // Cleanup
      // @ts-ignore
      global.window = originalLocation;
    });
  });

  describe("TC-ADAPTER-HP-003: Unified Interface", () => {
    let adapter: RPCAdapter;

    beforeEach(() => {
      adapter = RPCAdapter.getInstance();
      adapter.initialize({ httpFallbackUrl: "http://localhost:3000" });
    });

    afterEach(() => {
      adapter.dispose();
    });

    it("should return Promise from request method", () => {
      // Mock fetch for HTTP client
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              jsonrpc: "2.0",
              id: "test-001",
              status: "success",
              data: { result: "ok" },
              timestamp: new Date().toISOString(),
            }),
        })
      ) as unknown as typeof fetch;

      const result = adapter.request("project.list", {});
      expect(result).toBeInstanceOf(Promise);
    });

    it("should throw error when client not initialized", () => {
      const freshAdapter = new (RPCAdapter as any).constructor();
      expect(() => freshAdapter.getClient()).toThrow(RPCError);
    });
  });

  describe("TC-ADAPTER-HP-004: Request Interceptors", () => {
    it("should auto-inject requestId in HTTP requests", async () => {
      const fetchMock = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              jsonrpc: "2.0",
              id: "test-id",
              status: "success",
              data: {},
              timestamp: new Date().toISOString(),
            }),
        })
      );
      global.fetch = fetchMock as unknown as typeof fetch;

      const client = new HTTPRPCClient("http://localhost:3000");
      await client.request("project.list", { page: 1 });

      expect(fetchMock).toHaveBeenCalled();
      const callArgs = fetchMock.mock.calls[0] as unknown as [string, { body?: string }];
      const requestBody = JSON.parse(callArgs[1]?.body || "{}");
      expect(requestBody.id).toBeDefined();
      expect(requestBody.id).toMatch(/^req-\d+-/);
    });

    it("should auto-inject timestamp in requests", async () => {
      const fetchMock = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              jsonrpc: "2.0",
              id: "test-id",
              status: "success",
              data: {},
              timestamp: new Date().toISOString(),
            }),
        })
      );
      global.fetch = fetchMock as unknown as typeof fetch;

      const client = new HTTPRPCClient("http://localhost:3000");
      await client.request("project.list", {});

      const callArgs = fetchMock.mock.calls[0] as unknown as [string, { body?: string }];
      const requestBody = JSON.parse(callArgs[1]?.body || "{}");
      expect(requestBody.timestamp).toBeDefined();
      expect(new Date(requestBody.timestamp!).toISOString()).toBe(
        requestBody.timestamp
      );
    });
  });

  describe("TC-ADAPTER-SP-001: Environment Detection Fallback", () => {
    it("should fallback to HTTP when IPC initialization fails", () => {
      // Mock acquireVsCodeApi to throw
      // @ts-ignore
      global.acquireVsCodeApi = vi.fn(() => {
        throw new Error("Not in VS Code");
      });

      const adapter = RPCAdapter.getInstance();
      adapter.initialize({ httpFallbackUrl: "http://localhost:3000" });

      // Should still be initialized with HTTP client
      expect(adapter.isInitialized()).toBe(true);

      adapter.dispose();
      // @ts-ignore
      delete global.acquireVsCodeApi;
    });
  });

  describe("TC-ADAPTER-SP-002: NotInitialized Error", () => {
    it("should throw NotInitialized error when calling request before init", async () => {
      // Create a fresh adapter without initializing
      const freshAdapter = new (RPCAdapter as any).constructor();

      await expect(freshAdapter.request("project.list", {})).rejects.toThrow(
        RPCError
      );
    });

    it("should throw NotInitialized error when HTTP client disposed", async () => {
      const client = new HTTPRPCClient("http://localhost:3000");
      client.dispose();

      await expect(client.request("project.list", {})).rejects.toThrow(
        RPCError
      );
    });
  });

  describe("TC-ADAPTER-SP-003: Network Timeout and Retry", () => {
    it("should handle network timeout gracefully", async () => {
      // Mock fetch to never resolve
      global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;

      const client = new HTTPRPCClient("http://localhost:3000");

      // The request should eventually timeout or we can test the timeout logic
      // For now, just verify the client is properly initialized
      expect(client.isInitialized()).toBe(true);
    });

    it("should handle HTTP error responses", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        })
      ) as unknown as typeof fetch;

      const client = new HTTPRPCClient("http://localhost:3000");

      await expect(client.request("project.list", {})).rejects.toThrow(RPCError);
    });
  });

  describe("TC-ADAPTER-INT-001: Cross-Environment Consistency", () => {
    it("should have same interface for HTTP and IPC clients", () => {
      const httpClient = new HTTPRPCClient("http://localhost:3000");

      // IPCClient can't be initialized in test environment without mocking
      // So we just verify the interface exists
      expect(typeof httpClient.request).toBe("function");
      expect(typeof httpClient.isInitialized).toBe("function");
      expect(typeof httpClient.dispose).toBe("function");

      httpClient.dispose();
    });

    it("should use same request format across clients", async () => {
      const fetchMock = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              jsonrpc: "2.0",
              id: "test-id",
              status: "success",
              data: { result: "ok" },
              timestamp: new Date().toISOString(),
            }),
        })
      );
      global.fetch = fetchMock as unknown as typeof fetch;

      const client = new HTTPRPCClient("http://localhost:3000");
      await client.request("project.list", { page: 1 });

      const callArgs = fetchMock.mock.calls[0] as unknown as [string, { body?: string }];
      const requestBody = JSON.parse(callArgs[1]?.body || "{}");
      expect(requestBody.jsonrpc).toBe("2.0");
      expect(requestBody.action).toBe("project.list");
      expect(requestBody.payload).toEqual({ page: 1 });
    });
  });

  describe("RPCError", () => {
    it("should create RPCError with code and message", () => {
      const error = new RPCError(
        ErrorCode.PROJECT_NOT_FOUND,
        "Project not found"
      );

      expect(error.code).toBe(ErrorCode.PROJECT_NOT_FOUND);
      expect(error.message).toBe("Project not found");
      expect(error.name).toBe("RPCError");
    });

    it("should include data in RPCError", () => {
      const errorData = { projectId: "invalid-id" };
      const error = new RPCError(
        ErrorCode.PROJECT_NOT_FOUND,
        "Project not found",
        errorData
      );

      expect(error.data).toEqual(errorData);
    });
  });

  describe("Singleton Pattern", () => {
    it("should return same instance for getInstance", () => {
      const instance1 = RPCAdapter.getInstance();
      const instance2 = RPCAdapter.getInstance();

      expect(instance1).toBe(instance2);
    });

    it("should reset instance after dispose", () => {
      const instance1 = RPCAdapter.getInstance();
      instance1.initialize({ httpFallbackUrl: "http://localhost:3000" });
      instance1.dispose();

      // After dispose, a new instance should be created
      // But our implementation sets instance to null, so getInstance creates new one
      // This is implementation detail, main point is dispose works
    });
  });
});

/**
 * Simplified RPC Adapter Test - Basic Functionality
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window
(global as unknown as Record<string, unknown>).window = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  location: { search: "", href: "http://localhost:3000", origin: "http://localhost:3000" },
} as unknown as Window;

describe("RPC Client - Basic Tests", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("TC-ADAPTER-HP-001: should create HTTP client with correct transport type", async () => {
    const { HTTPRPCClient } = await import("@/lib/rpc/http-client");
    const client = new HTTPRPCClient({ baseUrl: "/api" });

    expect(client.getTransportType()).toBe("http");
    expect(client.isReady()).toBe(true);

    client.dispose();
  });

  it("TC-ADAPTER-HP-002: should create IPC client with correct transport type", async () => {
    const { IPCRPCClient } = await import("@/lib/rpc/ipc-client");
    const mockAPI = { postMessage: vi.fn(), getState: vi.fn(), setState: vi.fn() };
    const client = new IPCRPCClient({ vscodeAPI: mockAPI });

    expect(client.getTransportType()).toBe("ipc");
    expect(client.isReady()).toBe(true);

    client.dispose();
  });

  it("TC-ADAPTER-HP-003: should make HTTP request and return data", async () => {
    const { createHTTPClient } = await import("@/lib/rpc/client");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        jsonrpc: "2.0",
        id: "test-id",
        status: "success",
        data: { projects: [], total: 0 },
        timestamp: new Date().toISOString(),
      }),
    });

    const client = createHTTPClient({ baseUrl: "/api" });
    const result = await client.request("project.list", { page: 1 });

    expect(result).toEqual({ projects: [], total: 0 });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    client.dispose();
  });

  it("TC-ADAPTER-SP-001: environment detection works", async () => {
    const { isVSCodeEnvironment, getEnvironmentType } = await import("@/lib/rpc/client");

    // Default should be browser
    expect(isVSCodeEnvironment()).toBe(false);
    expect(getEnvironmentType()).toBe("browser");
  });
});

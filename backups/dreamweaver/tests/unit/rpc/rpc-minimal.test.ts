/**
 * Minimal RPC Test - Quick Validation
 */

import { describe, it, expect } from "vitest";

describe("RPC Module Existence Check", () => {
  it("should import all modules without errors", async () => {
    const types = await import("@/lib/rpc/types");
    const protocol = await import("@/lib/rpc/ipc-protocol");

    expect(types).toBeDefined();
    expect(protocol).toBeDefined();
    expect(protocol.createRequest).toBeTypeOf("function");
    expect(protocol.createSuccessResponse).toBeTypeOf("function");
    expect(protocol.ErrorCode).toBeDefined();
  });

  it("should have correct protocol version", async () => {
    const { JSON_RPC_VERSION } = await import("@/lib/rpc/ipc-protocol");
    expect(JSON_RPC_VERSION).toBe("2.0");
  });

  it("should have all error codes defined", async () => {
    const { ErrorCode } = await import("@/lib/rpc/ipc-protocol");
    expect(ErrorCode.INVALID_JSON).toBe(-32700);
    expect(ErrorCode.PROJECT_NOT_FOUND).toBe(-30999);
  });
});

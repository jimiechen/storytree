import { describe, it, expect } from "vitest";
import { MessageRouter } from "../core/message-router";
import { createRequest, isSuccessResponse, type IPCSuccessResponse } from "../types/ipc-protocol";

/**
 * TC-EXT-HP-008: 并发 5 个 IPC 请求无阻塞或乱序
 */
describe("TC-EXT-HP-008: Concurrent IPC Requests", () => {
  it("should handle 5 concurrent requests without blocking or disorder", async () => {
    const router = new MessageRouter();

    // Register handlers for different routes using 'on' method
    router.on("test.1", async (request) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      const payload = request.payload as { id?: number } | undefined;
      return { result: "response-1", id: payload?.id };
    });
    router.on("test.2", async (request) => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      const payload = request.payload as { id?: number } | undefined;
      return { result: "response-2", id: payload?.id };
    });
    router.on("test.3", async (request) => {
      await new Promise((resolve) => setTimeout(resolve, 15));
      const payload = request.payload as { id?: number } | undefined;
      return { result: "response-3", id: payload?.id };
    });
    router.on("test.4", async (request) => {
      await new Promise((resolve) => setTimeout(resolve, 8));
      const payload = request.payload as { id?: number } | undefined;
      return { result: "response-4", id: payload?.id };
    });
    router.on("test.5", async (request) => {
      await new Promise((resolve) => setTimeout(resolve, 12));
      const payload = request.payload as { id?: number } | undefined;
      return { result: "response-5", id: payload?.id };
    });

    // Send 5 concurrent requests using processMessage
    const requests = [
      router.processMessage(createRequest("req-1", "test.1", { id: 1 })),
      router.processMessage(createRequest("req-2", "test.2", { id: 2 })),
      router.processMessage(createRequest("req-3", "test.3", { id: 3 })),
      router.processMessage(createRequest("req-4", "test.4", { id: 4 })),
      router.processMessage(createRequest("req-5", "test.5", { id: 5 })),
    ];

    const startTime = performance.now();
    const results = await Promise.all(requests);
    const endTime = performance.now();

    // All requests should complete
    expect(results).toHaveLength(5);
    expect(results.every((r) => isSuccessResponse(r))).toBe(true);

    // Total time should be less than sequential execution (10+5+15+8+12=50ms)
    // Concurrent execution should take roughly the longest request time (~15ms)
    expect(endTime - startTime).toBeLessThan(100); // Allow some overhead

    // Verify all responses are present
    const successResults = results as IPCSuccessResponse<{ id?: number }>[];
    const responseIds = successResults.map((r) => r.data.id).sort((a, b) => (a ?? 0) - (b ?? 0));
    expect(responseIds).toEqual([1, 2, 3, 4, 5]);

    console.log(`[TC-EXT-HP-008] 5 concurrent requests completed in ${(endTime - startTime).toFixed(2)}ms`);

    router.dispose();
  });

  it("should maintain request-response order consistency", async () => {
    const router = new MessageRouter();

    router.on("order.test", async (request) => {
      const payload = request.payload as { value?: string } | undefined;
      return { echo: payload?.value };
    });

    const values = ["a", "b", "c", "d", "e"];
    const requests = values.map((v, i) =>
      router.processMessage(createRequest(`order-${i}`, "order.test", { value: v }))
    );

    const results = await Promise.all(requests);

    // Each response should match its request
    const successResults2 = results as IPCSuccessResponse<{ echo?: string }>[];
    successResults2.forEach((result, index) => {
      expect(result.data.echo).toBe(values[index]);
    });

    router.dispose();
  });
});

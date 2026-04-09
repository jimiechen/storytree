/**
 * Unit Tests for Message Router
 *
 * Tests cover:
 * - TC-EXT-HP-005 ~ TC-EXT-SP-007 from 05-test-plan.md
 * - Request parsing and routing
 * - Handler registration and execution
 * - Middleware pipeline
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { MessageRouter } from "../core/message-router";
import type {
  ActionHandler,
  BeforeMiddleware,
  AfterMiddleware,
  RouterContext,
} from "../core/message-router";
import type { IPCRequest } from "../types/ipc-protocol";
import { ErrorCode } from "../types/ipc-protocol";

// ============================================================
// Test Helpers
// ============================================================

function createTestRequest(
  action: string,
  payload: unknown = {},
  id: string | number = "test-1"
): IPCRequest {
  return {
    jsonrpc: "2.0",
    id,
    action,
    payload,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================
// Test Suite
// ============================================================

describe("MessageRouter Core Tests", () => {
  let router: MessageRouter;

  beforeEach(() => {
    router = new MessageRouter({ debug: false });
  });

  afterEach(() => {
    router.dispose();
  });

  // ============================================================
  // TC-EXT-HP-005: Request Parsing & Routing
  // ============================================================

  describe("Request Processing (TC-EXT-HP-005)", () => {
    it("should parse valid JSON-RPC request", async () => {
      const request = createTestRequest("test.action", { foo: "bar" });

      const response = await router.processMessage(request);

      expect(response.status).toBe("success");
      if (response.status === "success") {
        expect(response.id).toBe("test-1");
      }
    });

    it("should route request to correct handler", async () => {
      const handler = vi.fn().mockResolvedValue({ result: "ok" });
      router.on("my.action", handler);

      const request = createTestRequest("my.action");
      await router.processMessage(request);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ action: "my.action" }),
        expect.any(Object)
      );
    });

    it("should return handler result in response data", async () => {
      router.on("get.data", () => ({ items: [1, 2, 3] }));

      const request = createTestRequest("get.data");
      const response = await router.processMessage(request);

      if (response.status === "success") {
        expect(response.data).toEqual({ items: [1, 2, 3] });
      }
    });
  });

  // ============================================================
  // TC-EXT-HP-006: Response Generation & Return
  // ============================================================

  describe("Response Handling (TC-EXT-HP-006)", () => {
    it("should return success response with correct structure", async () => {
      router.on("ping", () => "pong");

      const request = createTestRequest("ping");
      const response = await router.processMessage(request);

      expect(response.jsonrpc).toBe("2.0");
      expect(response.id).toBe("test-1");
      expect(response.status).toBe("success");
      expect(response.timestamp).toBeDefined();

      if (response.status === "success") {
        expect(response.data).toBe("pong");
      }
    });

    it("should include durationMs in successful response", async () => {
      router.on("fast", () => "done");

      const request = createTestRequest("fast");
      const response = await router.processMessage(request);

      if (response.status === "success") {
        expect(typeof response.durationMs).toBe("number");
        expect(response.durationMs!).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ============================================================
  // TC-EXT-SP-005: Unknown Action Error
  // ============================================================

  describe("Error Handling (TC-EXT-SP-005)", () => {
    it("should return METHOD_NOT_FOUND for unknown action", async () => {
      const request = createTestRequest("unknown.action");
      const response = await router.processMessage(request);

      expect(response.status).toBe("error");

      if (response.status === "error") {
        expect(response.error.code).toBe(ErrorCode.METHOD_NOT_FOUND);
        expect(response.error.message).toContain("unknown.action");
      }
    });

    it("should return INVALID_REQUEST for invalid message format", async () => {
      const response = await router.processMessage(null);

      expect(response.status).toBe("error");

      if (response.status === "error") {
        expect(response.error.code).toBe(ErrorCode.INVALID_REQUEST);
      }
    });

    it("should return INVALID_REQUEST for non-object message", async () => {
      const response = await router.processMessage("not an object");

      expect(response.status).toBe("error");
    });

    it("should handle handler errors gracefully", async () => {
      router.on("failing.action", () => {
        throw new Error("Handler exploded!");
      });

      const request = createTestRequest("failing.action");
      const response = await router.processMessage(request);

      expect(response.status).toBe("error");

      if (response.status === "error") {
        expect(response.error.code).toBe(ErrorCode.INTERNAL_ERROR);
        expect(response.error.message).toContain("Handler exploded!");
      }
    });
  });

  // ============================================================
  // TC-EXT-SP-006: Missing ID / Notification
  // ============================================================

  describe("Notification Handling (TC-EXT-SP-006)", () => {
    it("should process notifications without id field", async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      router.on("log.event", handler);

      const notification = {
        jsonrpc: "2.0",
        action: "log.event",
        payload: { message: "test" },
        timestamp: new Date().toISOString(),
      };

      const response = await router.processMessage(notification);

      expect(handler).toHaveBeenCalled();
      expect(response.status).toBe("success");
    });

    it("should not fail when no handler registered for notification", async () => {
      const notification = {
        jsonrpc: "2.0",
        action: "unhandled.notification",
        payload: {},
        timestamp: new Date().toISOString(),
      };

      const response = await router.processMessage(notification);

      expect(response.status).toBe("success");
    });
  });

  // ============================================================
  // Middleware Pipeline Tests
  // ============================================================

  describe("Middleware Pipeline", () => {
    it("should execute before middlewares in order", async () => {
      const order: string[] = [];

      router.useBefore(async (req) => {
        order.push("before-1");
        return req;
      });

      router.useBefore(async (req) => {
        order.push("before-2");
        return req;
      });

      router.on("test.middleware", () => {
        order.push("handler");
        return "ok";
      });

      await router.processMessage(createTestRequest("test.middleware"));

      expect(order).toEqual(["before-1", "before-2", "handler"]);
    });

    it("should abort request when before middleware returns null", async () => {
      router.useBefore(async () => null);

      router.on("abort.me", () => "should not reach");

      const response = await router.processMessage(createTestRequest("abort.me"));

      expect(response.status).toBe("error");

      if (response.status === "error") {
        expect(response.error.message).toContain("aborted by middleware");
      }
    });

    it("should execute after middlewares in order", async () => {
      const transformations: string[] = [];

      router.useAfter((res) => {
        transformations.push("after-1");
        return res;
      });

      router.useAfter((res) => {
        transformations.push("after-2");
        return res;
      });

      router.on("test.after", () => "data");

      await router.processMessage(createTestRequest("test.after"));

      expect(transformations).toEqual(["after-1", "after-2"]);
    });
  });

  // ============================================================
  // Route Management Tests
  // ============================================================

  describe("Route Management", () => {
    it("should register multiple routes at once", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      router.registerRoutes({
        "action.1": handler1,
        "action.2": { handler: handler2, options: { description: "Second action" } },
      });

      expect(router.hasHandler("action.1")).toBe(true);
      expect(router.hasHandler("action.2")).toBe(true);
    });

    it("should list all registered actions", () => {
      router.on("a.b", () => {});
      router.on("c.d", () => {});

      const actions = router.getRegisteredActions();

      expect(actions).toContain("a.b");
      expect(actions).toContain("c.d");
      expect(actions).toHaveLength(2);
    });

    it("should remove handler with off()", () => {
      router.on("removable", () => {});
      expect(router.hasHandler("removable")).toBe(true);

      const removed = router.off("removable");
      expect(removed).toBe(true);
      expect(router.hasHandler("removable")).toBe(false);
    });
  });

  // ============================================================
  // Event System Tests
  // ============================================================

  describe("Event System", () => {
    it("should emit events during request processing", async () => {
      const events: string[] = [];

      router.onEvent((data) => {
        events.push(data.event);
      });

      router.on("event.test", () => "data");

      await router.processMessage(createTestRequest("event.test"));

      expect(events.length).toBeGreaterThan(0);
      expect(events).toContain("request:received");
      expect(events).toContain("response:sent");
    });

    it("should allow unsubscribing from events", async () => {
      const listener = vi.fn();
      const unsubscribe = router.onEvent(listener);

      unsubscribe();

      router.on("silent", () => {});

      await router.processMessage(createTestRequest("silent"));

      expect(listener).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // Lifecycle & Stats Tests
  // ============================================================

  describe("Lifecycle & Statistics", () => {
    it("should provide accurate stats", () => {
      router.on("stat.1", () => {});
      router.on("stat.2", () => {});
      router.useBefore(async (req) => req);
      router.useAfter((res) => res);

      const stats = router.getStats();

      expect(stats.registeredHandlers).toBe(2);
      expect(stats.beforeMiddlewares).toBe(1);
      expect(stats.afterMiddlewares).toBe(1);
    });

    it("should cleanup on dispose", () => {
      router.on("cleanup", () => {});
      router.useBefore(async (req) => req);

      router.dispose();

      const stats = router.getStats();
      expect(stats.registeredHandlers).toBe(0);
      expect(stats.beforeMiddlewares).toBe(0);
    });
  });
});

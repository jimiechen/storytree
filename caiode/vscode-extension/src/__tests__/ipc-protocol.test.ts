/**
 * Unit Tests for IPC Protocol Type Definitions
 *
 * Tests cover:
 * - TC-IPC-HP-001 to TC-IPC-EC-004 from 05-test-plan.md
 */

import { describe, it, expect } from "vitest";
import {
  ErrorCode,
  ProjectAction,
  ChapterAction,
  SystemAction,
  createErrorResponse,
  createRequest,
  createSuccessResponse,
  isErrorResponse,
  isSuccessResponse,
  type IPCBatchRequest,
  type IPCErrorResponse,
  type IPCNotification,
  type IPCRequest,
  type IPCSuccessResponse,
} from "../types/ipc-protocol";

// ============================================================
// TC-IPC-HP-001: Standard Request Serialization
// ============================================================

describe("IPC Protocol - Request Serialization (TC-IPC-HP-001)", () => {
  it("should serialize standard request to valid JSON", () => {
    const request: IPCRequest = {
      jsonrpc: "2.0",
      id: "req-001",
      action: "project.list",
      payload: { page: 1, limit: 20 },
      timestamp: "2026-04-07T10:30:00Z",
    };

    const json = JSON.stringify(request);
    const parsed = JSON.parse(json);

    expect(parsed.jsonrpc).toBe("2.0");
    expect(parsed.id).toBe("req-001");
    expect(parsed.action).toBe("project.list");
    expect(parsed.payload).toEqual({ page: 1, limit: 20 });
  });

  it("should support numeric request IDs", () => {
    const request = createRequest(123, ProjectAction.LIST, {});

    expect(request.id).toBe(123);
    expect(typeof request.id).toBe("number");
  });

  it("should include timestamp when created via helper", () => {
    const request = createRequest("req-002", ProjectAction.GET, { id: "proj-1" });

    expect(request.timestamp).toBeDefined();
    expect(new Date(request.timestamp!).getTime()).not.toBeNaN();
  });
});

// ============================================================
// TC-IPC-HP-002: Standard Response Deserialization
// ============================================================

describe("IPC Protocol - Response Deserialization (TC-IPC-HP-002)", () => {
  it("should deserialize success response correctly", () => {
    const responseJSON = `{
      "jsonrpc": "2.0",
      "id": "req-001",
      "status": "success",
      "data": { "projects": [], "total": 0 },
      "timestamp": "2026-04-07T10:30:05Z"
    }`;

    const response: IPCSuccessResponse = JSON.parse(responseJSON);

    expect(response.jsonrpc).toBe("2.0");
    expect(response.id).toBe("req-001");
    expect(response.status).toBe("success");
    expect(response.data).toEqual({ projects: [], total: 0 });
    expect(response.timestamp).toBe("2026-04-07T10:30:05Z");
  });

  it("should deserialize error response with correct structure", () => {
    const errorResponseJSON = `{
      "jsonrpc": "2.0",
      "id": "req-002",
      "status": "error",
      "error": {
        "code": -30999,
        "message": "Project not found",
        "data": { "projectId": "invalid-id" }
      },
      "timestamp": "2026-04-07T10:30:06Z"
    }`;

    const response: IPCErrorResponse = JSON.parse(errorResponseJSON);

    expect(response.status).toBe("error");
    expect(response.error.code).toBe(ErrorCode.PROJECT_NOT_FOUND);
    expect(response.error.message).toBe("Project not found");
    expect(response.error.data).toEqual({ projectId: "invalid-id" });
  });
});

// ============================================================
// TC-IPC-HP-003: Batch Request Support
// ============================================================

describe("IPC Protocol - Batch Requests (TC-IPC-HP-003)", () => {
  it("should handle batch requests with multiple items", () => {
    const batchRequest: IPCBatchRequest = {
      requests: [
        createRequest("req-001", ProjectAction.LIST, {}),
        createRequest("req-002", ProjectAction.GET, { id: "proj-1" }),
        createRequest(3, ProjectAction.CREATE, { name: "New Project" }),
      ],
    };

    expect(batchRequest.requests).toHaveLength(3);
    expect(batchRequest.requests[0].action).toBe(ProjectAction.LIST);
    expect(batchRequest.requests[1].action).toBe(ProjectAction.GET);
    expect(batchRequest.requests[2].action).toBe(ProjectAction.CREATE);
    // Verify mixed ID types
    expect(typeof batchRequest.requests[0].id).toBe("string");
    expect(typeof batchRequest.requests[2].id).toBe("number");
  });

  it("should serialize batch request to valid JSON", () => {
    const batch: IPCBatchRequest = {
      requests: [createRequest(1, "test.action", {})],
    };

    const json = JSON.stringify(batch);
    const parsed = JSON.parse(json);

    expect(Array.isArray(parsed.requests)).toBe(true);
    expect(parsed.requests).toHaveLength(1);
  });
});

// ============================================================
// TC-IPC-HP-004: Error Response Format Validation
// ============================================================

describe("IPC Protocol - Error Response Format (TC-IPC-HP-004)", () => {
  it("should validate error response structure with all required fields", () => {
    const error = createErrorResponse(
      "req-003",
      ErrorCode.INVALID_PARAMS,
      "Missing required field: name",
      { field: "name" }
    );

    expect(error.jsonrpc).toBe("2.0");
    expect(error.id).toBe("req-003");
    expect(error.status).toBe("error");
    expect(error.error.code).toBe(ErrorCode.INVALID_PARAMS);
    expect(error.error.message).toContain("Missing required field");
    expect(error.error.data).toEqual({ field: "name" });
    expect(error.timestamp).toBeDefined();
  });

  it("should allow null id for notification errors", () => {
    const error = createErrorResponse(null, ErrorCode.INTERNAL_ERROR, "Server crashed");

    expect(error.id).toBeNull();
  });
});

// ============================================================
// TC-IPC-SP-001: Invalid JSON Handling
// ============================================================

describe("IPC Protocol - Invalid JSON Handling (TC-IPC-SP-001)", () => {
  it("should throw on invalid JSON string", () => {
    const invalidJSON = "{ invalid json }";

    expect(() => JSON.parse(invalidJSON)).toThrow();
  });

  it("should detect missing required fields in parsed object", () => {
    const incompleteRequest = `{ "jsonrpc": "2.0", "action": "test" }`;
    const parsed = JSON.parse(incompleteRequest);

    // Missing 'id' and 'payload' fields
    expect(parsed.id).toBeUndefined();
    expect(parsed.payload).toBeUndefined();

    // This would fail validation at runtime
    const isValidRequest = (obj: unknown): obj is IPCRequest =>
      typeof obj === "object" &&
      obj !== null &&
      "jsonrpc" in obj &&
      "id" in obj &&
      "action" in obj &&
      "payload" in obj;

    expect(isValidRequest(parsed)).toBe(false);
  });
});

// ============================================================
// TC-IPC-SP-002: Missing Required Fields Error
// ============================================================

describe("IPC Protocol - Missing Fields Validation (TC-IPC-SP-002)", () => {
  it("should return INVALID_REQUEST error for missing action", () => {
    const response = createErrorResponse(
      null,
      ErrorCode.INVALID_REQUEST,
      "Missing required field: action"
    );

    expect(response.error.code).toBe(ErrorCode.INVALID_REQUEST);
    expect(response.error.message).toContain("action");
  });

  it("should return INVALID_PARAMS error for missing payload fields", () => {
    const response = createErrorResponse(
      "req-004",
      ErrorCode.INVALID_PARAMS,
      "Payload validation failed: name is required"
    );

    expect(response.error.code).toBe(ErrorCode.INVALID_PARAMS);
  });
});

// ============================================================
// TC-IPC-SP-003: Null Payload Defaulting
// ============================================================

describe("IPC Protocol - Null Payload Handling (TC-IPC-SP-003)", () => {
  it("should accept null payload and default to empty object", () => {
    const request: IPCRequest = {
      jsonrpc: "2.0",
      id: "req-005",
      action: "system.ping",
      payload: null,
    };

    // In practice, middleware should convert null to {}
    const normalizedPayload = request.payload ?? {};

    expect(normalizedPayload).toEqual({});
  });
});

// ============================================================
// TC-IPC-EC-001: Special Character Escaping
// ============================================================

describe("IPC Protocol - Special Characters (TC-IPC-EC-001)", () => {
  it("should handle Chinese characters in payload", () => {
    const request = createRequest("req-006", ProjectAction.CREATE, {
      name: "我的小说项目",
      description: "这是一个测试 🎉",
    });

    const json = JSON.stringify(request);
    const roundtrip = JSON.parse(json) as IPCRequest;

    expect(roundtrip.payload.name).toBe("我的小说项目");
    expect(roundtrip.payload.description).toContain("🎉");
  });

  it("should handle HTML tags in strings (JSON preserves them)", () => {
    const htmlContent = "<script>alert('xss')</script>";
    const request = createRequest("req-007", ChapterAction.SAVE_CONTENT, {
      content: htmlContent,
    });

    const json = JSON.stringify(request);
    // JSON.stringify does NOT escape < > by default (only special chars like quotes)
    expect(json).toContain("<script>alert('xss')</script>");
    // The content should survive roundtrip
    const roundtrip = JSON.parse(json) as IPCRequest;
    expect((roundtrip.payload as { content: string }).content).toBe(htmlContent);
  });
});

// ============================================================
// TC-IPC-EC-003: Circular Reference Detection
// ============================================================

describe("IPC Protocol - Circular Reference (TC-IPC-EC-003)", () => {
  it("should throw TypeError on circular reference during serialization", () => {
    const circularObj: Record<string, unknown> = { name: "test" };
    circularObj.self = circularObj;

    expect(() => JSON.stringify(circularObj)).toThrow(TypeError);
  });
});

// ============================================================
// Type Guard Tests
// ============================================================

describe("Type Guards", () => {
  it("isSuccessResponse should return true for success responses", () => {
    const success = createSuccessResponse("req-010", { ok: true });
    expect(isSuccessResponse(success)).toBe(true);
    expect(isErrorResponse(success)).toBe(false);
  });

  it("isErrorResponse should return true for error responses", () => {
    const error = createErrorResponse("req-011", ErrorCode.NOT_FOUND, "Not found");
    expect(isErrorResponse(error)).toBe(true);
    expect(isSuccessResponse(error)).toBe(false);
  });
});

// ============================================================
// Helper Function Tests
// ============================================================

describe("Helper Functions", () => {
  it("createSuccessResponse should include durationMs when provided", () => {
    const response = createSuccessResponse("req-012", { data: [] }, {
      durationMs: 42,
    });

    expect(response.durationMs).toBe(42);
  });

  it("createRequest should include metadata when provided", () => {
    const request = createRequest(
      "req-013",
      SystemAction.HEALTH_CHECK,
      {},
      { source: "webview", "version": "1.0.0" }
    );

    expect(request.metadata).toEqual({
      source: "webview",
      version: "1.0.0",
    });
  });
});

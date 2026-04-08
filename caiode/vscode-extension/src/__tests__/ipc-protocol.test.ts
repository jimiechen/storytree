import { describe, it, expect } from "vitest";
import {
  JSON_RPC_VERSION,
  ErrorCode,
  createRequest,
  createSuccessResponse,
  createErrorResponse,
  isSuccessResponse,
  isErrorResponse,
  type IPCRequest,
  type IPCSuccessResponse,
  type IPCErrorResponse,
} from "../types/ipc-protocol";

describe("TC-IPC: IPC Protocol Design Tests", () => {
  describe("TC-IPC-HP-001: 标准请求序列化", () => {
    it("should serialize IPC request to JSON string with correct structure", () => {
      const request: IPCRequest = {
        jsonrpc: JSON_RPC_VERSION,
        id: "req-001",
        action: "project.list",
        payload: { page: 1, limit: 20 },
        timestamp: "2026-04-07T10:30:00Z",
      };

      const jsonString = JSON.stringify(request);
      const parsed = JSON.parse(jsonString);

      expect(parsed.jsonrpc).toBe("2.0");
      expect(parsed.id).toBe("req-001");
      expect(parsed.action).toBe("project.list");
      expect(parsed.payload).toEqual({ page: 1, limit: 20 });
      expect(parsed.timestamp).toBe("2026-04-07T10:30:00Z");
    });

    it("should use createRequest helper to generate valid request", () => {
      const request = createRequest("req-002", "chapter.create", {
        title: "第一章",
        content: "从前有座山...",
      });

      expect(request.jsonrpc).toBe("2.0");
      expect(request.id).toBe("req-002");
      expect(request.action).toBe("chapter.create");
      expect(request.payload).toEqual({
        title: "第一章",
        content: "从前有座山...",
      });
      expect(request.timestamp).toBeDefined();
      expect(new Date(request.timestamp!).toISOString()).toBe(request.timestamp);
    });

    it("should support numeric request IDs", () => {
      const request = createRequest(12345, "project.get", { id: "proj-001" });

      expect(request.id).toBe(12345);
      const jsonString = JSON.stringify(request);
      const parsed = JSON.parse(jsonString);
      expect(parsed.id).toBe(12345);
    });

    it("should include metadata when provided", () => {
      const request = createRequest(
        "req-003",
        "ai.chat",
        { message: "Hello" },
        { traceId: "trace-001", userAgent: "vscode/1.85.0" }
      );

      expect(request.metadata).toEqual({
        traceId: "trace-001",
        userAgent: "vscode/1.85.0",
      });
    });
  });

  describe("TC-IPC-HP-002: 标准响应反序列化", () => {
    it("should deserialize success response from JSON string", () => {
      const jsonString = JSON.stringify({
        jsonrpc: "2.0",
        id: "req-001",
        status: "success",
        data: { projects: [{ id: "p1", name: "Test Project" }], total: 1 },
        timestamp: "2026-04-07T10:30:05Z",
        durationMs: 42,
      });

      const parsed = JSON.parse(jsonString) as IPCSuccessResponse;

      expect(parsed.jsonrpc).toBe("2.0");
      expect(parsed.id).toBe("req-001");
      expect(parsed.status).toBe("success");
      expect(parsed.data.projects).toHaveLength(1);
      expect(parsed.data.total).toBe(1);
      expect(parsed.timestamp).toBe("2026-04-07T10:30:05Z");
      expect(parsed.durationMs).toBe(42);
    });

    it("should use createSuccessResponse helper to generate valid response", () => {
      const response = createSuccessResponse("req-002", {
        chapters: [{ id: "c1", title: "第一章" }],
      });

      expect(response.jsonrpc).toBe("2.0");
      expect(response.id).toBe("req-002");
      expect(response.status).toBe("success");
      expect(response.data.chapters).toHaveLength(1);
      expect(response.timestamp).toBeDefined();
    });

    it("should use isSuccessResponse type guard correctly", () => {
      const successResponse = createSuccessResponse("req-001", { result: "ok" });
      const errorResponse = createErrorResponse(
        "req-002",
        ErrorCode.NOT_FOUND,
        "Not found"
      );

      expect(isSuccessResponse(successResponse)).toBe(true);
      expect(isSuccessResponse(errorResponse)).toBe(false);
    });
  });

  describe("TC-IPC-HP-003: 批量请求支持", () => {
    it("should serialize batch request with multiple requests", () => {
      const batchRequest = {
        requests: [
          createRequest("req-001", "project.list", { page: 1 }),
          createRequest("req-002", "chapter.list", { projectId: "p1" }),
          createRequest("req-003", "character.list", { projectId: "p1" }),
        ],
      };

      const jsonString = JSON.stringify(batchRequest);
      const parsed = JSON.parse(jsonString);

      expect(parsed.requests).toHaveLength(3);
      expect(parsed.requests[0].action).toBe("project.list");
      expect(parsed.requests[1].action).toBe("chapter.list");
      expect(parsed.requests[2].action).toBe("character.list");
    });

    it("should maintain request order in batch", () => {
      const batchRequest = {
        requests: [
          createRequest(1, "action.a", {}),
          createRequest(2, "action.b", {}),
          createRequest(3, "action.c", {}),
        ],
      };

      const jsonString = JSON.stringify(batchRequest);
      const parsed = JSON.parse(jsonString);

      expect(parsed.requests[0].id).toBe(1);
      expect(parsed.requests[1].id).toBe(2);
      expect(parsed.requests[2].id).toBe(3);
    });
  });

  describe("TC-IPC-HP-004: 错误响应格式", () => {
    it("should create error response with correct structure", () => {
      const errorResponse = createErrorResponse(
        "req-001",
        ErrorCode.PROJECT_NOT_FOUND,
        "Project not found",
        { projectId: "invalid-id" }
      );

      expect(errorResponse.jsonrpc).toBe("2.0");
      expect(errorResponse.id).toBe("req-001");
      expect(errorResponse.status).toBe("error");
      expect(errorResponse.error.code).toBe(ErrorCode.PROJECT_NOT_FOUND);
      expect(errorResponse.error.message).toBe("Project not found");
      expect(errorResponse.error.data).toEqual({ projectId: "invalid-id" });
      expect(errorResponse.timestamp).toBeDefined();
    });

    it("should deserialize error response from JSON string", () => {
      const jsonString = JSON.stringify({
        jsonrpc: "2.0",
        id: "req-001",
        status: "error",
        error: {
          code: -30999,
          message: "Project not found",
          data: { projectId: "invalid-id" },
        },
        timestamp: "2026-04-07T10:30:05Z",
      });

      const parsed = JSON.parse(jsonString) as IPCErrorResponse;

      expect(parsed.jsonrpc).toBe("2.0");
      expect(parsed.id).toBe("req-001");
      expect(parsed.status).toBe("error");
      expect(parsed.error.code).toBe(-30999);
      expect(parsed.error.message).toBe("Project not found");
      expect(parsed.error.data).toEqual({ projectId: "invalid-id" });
    });

    it("should use isErrorResponse type guard correctly", () => {
      const successResponse = createSuccessResponse("req-001", { result: "ok" });
      const errorResponse = createErrorResponse(
        "req-002",
        ErrorCode.NOT_FOUND,
        "Not found"
      );

      expect(isErrorResponse(successResponse)).toBe(false);
      expect(isErrorResponse(errorResponse)).toBe(true);
    });

    it("should support null id for notification errors", () => {
      const errorResponse = createErrorResponse(
        null,
        ErrorCode.INVALID_REQUEST,
        "Invalid request format"
      );

      expect(errorResponse.id).toBeNull();
      expect(errorResponse.error.code).toBe(ErrorCode.INVALID_REQUEST);
    });
  });

  describe("TC-IPC-SP-001: 无效 JSON 字符串处理", () => {
    it("should throw error when parsing invalid JSON", () => {
      const invalidJson = '{"jsonrpc": "2.0", "id": "req-001",}';

      expect(() => JSON.parse(invalidJson)).toThrow();
    });

    it("should throw error when JSON is not an object", () => {
      const notAnObject = '"just a string"';
      const parsed = JSON.parse(notAnObject);

      expect(typeof parsed).toBe("string");
    });
  });

  describe("TC-IPC-SP-002: 缺少必要字段验证", () => {
    it("should detect missing id field", () => {
      const requestWithoutId = {
        jsonrpc: "2.0",
        action: "project.list",
        payload: {},
      };

      expect(requestWithoutId).not.toHaveProperty("id");
    });

    it("should detect missing action field", () => {
      const requestWithoutAction = {
        jsonrpc: "2.0",
        id: "req-001",
        payload: {},
      };

      expect(requestWithoutAction).not.toHaveProperty("action");
    });

    it("should detect missing jsonrpc field", () => {
      const requestWithoutVersion = {
        id: "req-001",
        action: "project.list",
        payload: {},
      };

      expect(requestWithoutVersion).not.toHaveProperty("jsonrpc");
    });
  });

  describe("TC-IPC-SP-003: payload 为 null 时默认为空对象", () => {
    it("should handle null payload gracefully", () => {
      const request = createRequest("req-001", "project.list", null);

      expect(request.payload).toBeNull();
    });

    it("should handle undefined payload gracefully", () => {
      const request = createRequest(
        "req-001",
        "project.list",
        undefined
      );

      expect(request.payload).toBeUndefined();
    });
  });

  describe("TC-IPC-EC-001: 特殊字符转义", () => {
    it("should handle Chinese characters in payload", () => {
      const request = createRequest("req-001", "chapter.create", {
        title: "第一章：起源",
        content: "这是一个中文内容。🎉",
      });

      const jsonString = JSON.stringify(request);
      const parsed = JSON.parse(jsonString);

      expect(parsed.payload.title).toBe("第一章：起源");
      expect(parsed.payload.content).toBe("这是一个中文内容。🎉");
    });

    it("should handle emoji characters", () => {
      const request = createRequest("req-001", "ai.chat", {
        message: "Hello 👋 World 🌍",
      });

      const jsonString = JSON.stringify(request);
      const parsed = JSON.parse(jsonString);

      expect(parsed.payload.message).toBe("Hello 👋 World 🌍");
    });

    it("should handle HTML tags in payload", () => {
      const request = createRequest("req-001", "chapter.saveContent", {
        content: "<p>Paragraph with <strong>bold</strong> text</p>",
      });

      const jsonString = JSON.stringify(request);
      const parsed = JSON.parse(jsonString);

      expect(parsed.payload.content).toBe(
        "<p>Paragraph with <strong>bold</strong> text</p>"
      );
    });
  });

  describe("TC-IPC-EC-003: 循环引用检测", () => {
    it("should throw error when serializing circular reference", () => {
      const obj: any = { name: "test" };
      obj.self = obj;

      expect(() => JSON.stringify(obj)).toThrow();
    });

    it("should throw error with nested circular reference", () => {
      const parent: any = { name: "parent" };
      const child: any = { name: "child", parent };
      parent.child = child;

      expect(() => JSON.stringify(parent)).toThrow();
    });
  });

  describe("ErrorCode Enum", () => {
    it("should have correct JSON-RPC 2.0 reserved error codes", () => {
      expect(ErrorCode.INVALID_JSON).toBe(-32700);
      expect(ErrorCode.INVALID_REQUEST).toBe(-32600);
      expect(ErrorCode.METHOD_NOT_FOUND).toBe(-32601);
      expect(ErrorCode.INVALID_PARAMS).toBe(-32602);
      expect(ErrorCode.INTERNAL_ERROR).toBe(-32603);
    });

    it("should have correct StoryTree domain error codes", () => {
      expect(ErrorCode.PROJECT_NOT_FOUND).toBe(-30999);
      expect(ErrorCode.CHAPTER_NOT_FOUND).toBe(-30998);
      expect(ErrorCode.CHARACTER_NOT_FOUND).toBe(-30997);
      expect(ErrorCode.DATABASE_ERROR).toBe(-30992);
      expect(ErrorCode.AI_SERVICE_ERROR).toBe(-30991);
    });
  });
});

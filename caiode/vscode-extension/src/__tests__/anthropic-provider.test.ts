import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnthropicProvider } from "../core/ai/anthropic-provider";
import type {
  ChatCompletionOptions,
  ChatCompletionResult,
  StreamChunk,
} from "../core/ai/types";

const TEST_API_KEY = "sk-ant-test-key-12345";
const TEST_MODEL = "claude-sonnet-4-20250514";

function createProvider(overrides?: Partial<ConstructorParameters<typeof AnthropicProvider>[0]>) {
  return new AnthropicProvider({
    apiKey: TEST_API_KEY,
    defaultModel: TEST_MODEL,
    ...overrides,
  });
}

function mockFetchResponse(data: unknown, status = 200, ok = true): Response {
  return {
    ok,
    status,
    statusText: status === 200 ? "OK" : `Error ${status}`,
    json: async () => data,
    text: async () => JSON.stringify(data),
    body: null,
  } as unknown as Response;
}

function mockStreamBody(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]));
        index++;
      } else {
        controller.close();
      }
    },
  });
}

describe("AnthropicProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Constructor & Configuration", () => {
    it("should set providerName to 'anthropic'", () => {
      const provider = createProvider();
      expect(provider.providerName).toBe("anthropic");
    });

    it("should have supported models list including Claude series", () => {
      const provider = createProvider();
      expect(provider.supportedModels).toContain("claude-sonnet-4-20250514");
      expect(provider.supportedModels).toContain("claude-haiku-4-20250514");
      expect(provider.supportedModels).toContain("claude-opus-4-20250514");
    });

    it("should use default baseUrl when not provided", () => {
      const provider = createProvider();
      expect((provider as { baseUrl: string }).baseUrl).toBe(
        "https://api.anthropic.com/v1",
      );
    });

    it("should use custom baseUrl when provided", () => {
      const provider = createProvider({ baseUrl: "https://custom.anthropic.com/v1" });
      expect((provider as { baseUrl: string }).baseUrl).toBe(
        "https://custom.anthropic.com/v1",
      );
    });

    it("should clear apiKey on dispose", () => {
      const provider = createProvider();
      provider.dispose();
      expect((provider as { apiKey: string }).apiKey).toBe("");
    });
  });

  describe("chatCompletion - Request Format", () => {
    it("should send POST to /messages endpoint", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          id: "msg_test",
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: "Hello" }],
          model: TEST_MODEL,
          stop_reason: "end_turn",
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
      );

      const provider = createProvider();
      await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "Hi" }],
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/messages"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("should use x-api-key header (not Bearer)", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          id: "msg_test",
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: "OK" }],
          model: TEST_MODEL,
          stop_reason: "end_turn",
          usage: { input_tokens: 5, output_tokens: 2 },
        }),
      );

      const provider = createProvider();
      await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "test" }],
      });

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const headers = callArgs[1]?.headers as Record<string, string>;
      expect(headers?.["x-api-key"]).toBe(TEST_API_KEY);
      expect(headers?.Authorization).toBeUndefined();
    });

    it("should include anthropic-version header", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          id: "msg_test",
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: "OK" }],
          model: TEST_MODEL,
          stop_reason: "end_turn",
          usage: { input_tokens: 5, output_tokens: 2 },
        }),
      );

      const provider = createProvider();
      await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "test" }],
      });

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const headers = callArgs[1]?.headers as Record<string, string>;
      expect(headers?.["anthropic-version"]).toBe("2023-06-01");
    });

    it("should extract system message into top-level system field", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          id: "msg_sys",
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: "resp" }],
          model: TEST_MODEL,
          stop_reason: "end_turn",
          usage: { input_tokens: 15, output_tokens: 3 },
        }),
      );

      const provider = createProvider();
      await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [
          { role: "system", content: "You are a writer." },
          { role: "user", content: "Hello" },
        ],
      });

      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
      expect(body.system).toBe("You are a writer.");
      expect(body.messages).toEqual([{ role: "user", content: "Hello" }]);
      expect(body.messages.find((m: { role: string }) => m.role === "system")).toBeUndefined();
    });

    it("should include max_tokens in request (required by Anthropic)", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          id: "msg_max",
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: "x" }],
          model: TEST_MODEL,
          stop_reason: "end_turn",
          usage: { input_tokens: 5, output_tokens: 1 },
        }),
      );

      const provider = createProvider();
      await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "test" }],
      });

      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
      expect(body.max_tokens).toBe(4096); // fallback
    });

    it("should use custom maxTokens when provided", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          id: "msg_custom",
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: "x" }],
          model: TEST_MODEL,
          stop_reason: "end_turn",
          usage: { input_tokens: 5, output_tokens: 1 },
        }),
      );

      const provider = createProvider();
      await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "test" }],
        maxTokens: 8192,
      });

      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
      expect(body.max_tokens).toBe(8192);
    });
  });

  describe("chatCompletion - Response Parsing", () => {
    it("should parse successful response into ChatCompletionResult", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          id: "msg_abc123",
          type: "message",
          role: "assistant",
          content: [
            { type: "text", text: "Hello! How can I assist?" },
            { type: "text", text: " I'm Claude." },
          ],
          model: "claude-sonnet-4-20250514",
          stop_reason: "end_turn",
          usage: { input_tokens: 25, output_tokens: 12 },
        }),
      );

      const provider = createProvider();
      const result = await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "Hi" }],
      });

      expect(result.id).toBe("msg_abc123");
      expect(result.model).toBe("claude-sonnet-4-20250514");
      expect(result.content).toBe("Hello! How can I assist? I'm Claude.");
      expect(result.usage.promptTokens).toBe(25);
      expect(result.usage.completionTokens).toBe(12);
      expect(result.usage.totalTokens).toBe(37);
      expect(result.finishReason).toBe("stop");
    });

    it("should map end_turn finish reason to 'stop'", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          id: "msg_stop",
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: "done" }],
          model: TEST_MODEL,
          stop_reason: "end_turn",
          usage: { input_tokens: 5, output_tokens: 2 },
        }),
      );

      const provider = createProvider();
      const result = await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "hi" }],
      });

      expect(result.finishReason).toBe("stop");
    });

    it("should map max_tokens finish reason to 'length'", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          id: "msg_len",
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: "cut off..." }],
          model: TEST_MODEL,
          stop_reason: "max_tokens",
          usage: { input_tokens: 100, output_tokens: 200 },
        }),
      );

      const provider = createProvider();
      const result = await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "long" }],
      });

      expect(result.finishReason).toBe("length");
    });

    it("should map tool_use finish reason correctly", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          id: "msg_tool",
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: "" }, { type: "tool_use", id: "tool_1", name: "get_weather" }],
          model: TEST_MODEL,
          stop_reason: "tool_use",
          usage: { input_tokens: 20, output_tokens: 15 },
        }),
      );

      const provider = createProvider();
      const result = await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "weather" }],
      });

      expect(result.finishReason).toBe("tool_calls");
    });

    it("should handle empty content array gracefully", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          id: "msg_empty",
          type: "message",
          role: "assistant",
          content: [],
          model: TEST_MODEL,
          stop_reason: "end_turn",
          usage: { input_tokens: 5, output_tokens: 0 },
        }),
      );

      const provider = createProvider();
      const result = await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "empty" }],
      });

      expect(result.content).toBe("");
    });
  });

  describe("chatCompletion - Error Handling", () => {
    it("should throw error with status code on non-2xx response", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({ error: { message: "Unauthorized" } }, 401, false),
      );

      const provider = createProvider();
      await expect(
        provider.chatCompletion({ model: TEST_MODEL, messages: [{ role: "user", content: "bad" }] }),
      ).rejects.toThrow("Anthropic API error 401");
    });

    it("should retry on 429 rate limit errors", async () => {
      vi.mocked(globalThis.fetch)
        .mockResolvedValueOnce(mockFetchResponse({ error: { message: "Rate limit" } }, 429, false))
        .mockResolvedValueOnce(mockFetchResponse({ error: { message: "Rate limit" } }, 429, false))
        .mockResolvedValueOnce(
          mockFetchResponse({
            id: "msg_retry_ok",
            type: "message",
            role: "assistant",
            content: [{ type: "text", text: "Success after retry" }],
            model: TEST_MODEL,
            stop_reason: "end_turn",
            usage: { input_tokens: 10, output_tokens: 3 },
          }),
        );

      const provider = createProvider({ maxRetries: 3, timeoutMs: 5000 });
      const result = await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "retry me" }],
      });

      expect(result.content).toBe("Success after retry");
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it("should retry on overloaded (529) errors", async () => {
      vi.mocked(globalThis.fetch)
        .mockResolvedValueOnce(mockFetchResponse({ error: { message: "Overloaded" } }, 529, false))
        .mockResolvedValueOnce(
          mockFetchResponse({
            id: "msg_overloaded_ok",
            type: "message",
            role: "assistant",
            content: [{ type: "text", text: "Recovered" }],
            model: TEST_MODEL,
            stop_reason: "end_turn",
            usage: { input_tokens: 8, output_tokens: 1 },
          }),
        );

      const provider = createProvider({ maxRetries: 3, timeoutMs: 5000 });
      const result = await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "overload test" }],
      });

      expect(result.content).toBe("Recovered");
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it("should throw after exhausting all retries", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue(
        mockFetchResponse({ error: { message: "Always failing" } }, 500, false),
      );

      const provider = createProvider({ maxRetries: 2, timeoutMs: 100 });
      await expect(
        provider.chatCompletion({ model: TEST_MODEL, messages: [{ role: "user", content: "fail" }] }),
      ).rejects.toThrow();

      expect(fetch).toHaveBeenCalledTimes(3); // initial + 2 retries
    });
  });

  describe("streamChatCompletion - SSE Stream Parsing", () => {
    it("should parse Anthropic SSE event stream format", async () => {
      const sseChunks = [
        'data: {"type":"message_start","message":{"id":"msg_stream_1","type":"message","role":"assistant","content":[],"model":"claude-sonnet-4-20250514","stop_reason":null,"usage":{"input_tokens":15,"output_tokens":0}}}\n\n',
        'data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""},"index":0}\n\n',
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}\n\n',
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" world"}}\n\n',
        'data: {"type":"content_block_stop","index":0}\n\n',
        'data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":8}}\n\n',
        'data: {"type":"message_stop"}\n\n',
      ];

      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockStreamBody(sseChunks),
      } as unknown as Response);

      const collectedChunks: StreamChunk[] = [];
      const provider = createProvider({ timeoutMs: 5000 });
      const result = await provider.streamChatCompletion(
        { model: TEST_MODEL, messages: [{ role: "user", content: "Hi" }] },
        (chunk) => collectedChunks.push(chunk),
      );

      expect(collectedChunks).toHaveLength(2);
      expect(collectedChunks[0].content).toBe("Hello");
      expect(collectedChunks[1].content).toBe(" world");
      expect(result.content).toBe("Hello world");
      expect(result.finishReason).toBe("stop");
    });

    it("should accumulate full content across delta events", async () => {
      const sseChunks = [
        'data: {"type":"message_start","message":{"id":"msg_s1","type":"message","role":"assistant","content":[],"model":"","stop_reason":null,"usage":{"input_tokens":10,"output_tokens":0}}}\n\n',
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"A"}}\n\n',
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"B"}}\n\n',
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"C"},"index":0}\n\n',
        'data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":5}}\n\n',
      ];

      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockStreamBody(sseChunks),
      } as unknown as Response);

      const provider = createProvider({ timeoutMs: 5000 });
      const result = await provider.streamChatCompletion(
        { model: TEST_MODEL, messages: [{ role: "user", content: "go" }] },
        () => {},
      );

      expect(result.content).toBe("ABC");
    });

    it("should map stop_reason max_tokens to length in streaming", async () => {
      const sseChunks = [
        'data: {"type":"message_start","message":{"id":"msg_s2","type":"message","role":"assistant","content":[],"model":"","stop_reason":null,"usage":{"input_tokens":50,"output_tokens":0}}}\n\n',
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"truncated..."}}\n\n',
        'data: {"type":"message_delta","delta":{"stop_reason":"max_tokens"},"usage":{"output_tokens":200}}\n\n',
      ];

      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockStreamBody(sseChunks),
      } as unknown as Response);

      const provider = createProvider({ timeoutMs: 5000 });
      const result = await provider.streamChatCompletion(
        { model: TEST_MODEL, messages: [{ role: "user", content: "long" }] },
        () => {},
      );

      expect(result.finishReason).toBe("length");
    });

    it("should throw on non-OK response during streaming", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => '{"error":{"type":"permission_error"}}',
      } as unknown as Response);

      const provider = createProvider({ timeoutMs: 5000 });
      await expect(
        provider.streamChatCompletion(
          { model: TEST_MODEL, messages: [{ role: "user", content: "bad" }] },
          () => {},
        ),
      ).rejects.toThrow("Anthropic API error 403");
    });

    it("should throw when response has no body for streaming", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: null,
      } as unknown as Response);

      const provider = createProvider({ timeoutMs: 5000 });
      await expect(
        provider.streamChatCompletion(
          { model: TEST_MODEL, messages: [{ role: "user", content: "no body" }] },
          () => {},
        ),
      ).rejects.toThrow("no stream body");
    });

    it("should skip malformed SSE lines without crashing", async () => {
      const sseChunks = [
        'data: not-json-at-all\n\n',
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"valid"}}\n\n',
        ': comment line\n',
        'data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":2}}\n\n',
      ];

      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockStreamBody(sseChunks),
      } as unknown as Response);

      const collectedChunks: StreamChunk[] = [];
      const provider = createProvider({ timeoutMs: 5000 });
      const result = await provider.streamChatCompletion(
        { model: TEST_MODEL, messages: [{ role: "user", content: "malformed" }] },
        (chunk) => collectedChunks.push(chunk),
      );

      expect(result.content).toBe("valid");
      expect(collectedChunks).toHaveLength(1);
    });
  });
});

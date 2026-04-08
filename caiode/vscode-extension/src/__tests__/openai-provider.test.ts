import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenAIProvider } from "../core/ai/openai-provider";
import type {
  ChatCompletionOptions,
  ChatCompletionResult,
  StreamChunk,
} from "../core/ai/types";

const TEST_API_KEY = "sk-test-key-12345";
const TEST_MODEL = "gpt-4o-mini";

function createProvider(overrides?: Partial<ConstructorParameters<typeof OpenAIProvider>[0]>) {
  return new OpenAIProvider({
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

describe("OpenAIProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Constructor & Configuration", () => {
    it("should set providerName to 'openai'", () => {
      const provider = createProvider();
      expect(provider.providerName).toBe("openai");
    });

    it("should have supported models list", () => {
      const provider = createProvider();
      expect(provider.supportedModels).toContain("gpt-4o");
      expect(provider.supportedModels).toContain("gpt-4o-mini");
      expect(provider.supportedModels).toContain("gpt-4-turbo");
      expect(provider.supportedModels).toContain("gpt-3.5-turbo");
    });

    it("should use default baseUrl when not provided", () => {
      const provider = createProvider();
      expect((provider as { baseUrl: string }).baseUrl).toBe(
        "https://api.openai.com/v1",
      );
    });

    it("should use custom baseUrl when provided", () => {
      const provider = createProvider({ baseUrl: "https://custom.api/v1" });
      expect((provider as { baseUrl: string }).baseUrl).toBe(
        "https://custom.api/v1",
      );
    });

    it("should default timeout to 30000ms", () => {
      const provider = createProvider();
      expect((provider as { timeoutMs: number }).timeoutMs).toBe(30_000);
    });

    it("should accept custom timeout", () => {
      const provider = createProvider({ timeoutMs: 60_000 });
      expect((provider as { timeoutMs: number }).timeoutMs).toBe(60_000);
    });

    it("should default maxRetries to 3", () => {
      const provider = createProvider();
      expect((provider as { maxRetries: number }).maxRetries).toBe(3);
    });

    it("should clear apiKey on dispose", () => {
      const provider = createProvider();
      provider.dispose();
      expect((provider as { apiKey: string }).apiKey).toBe("");
    });
  });

  describe("chatCompletion - Request Format", () => {
    it("should send POST to /chat/completions endpoint", async () => {
      const mockResponse = mockFetchResponse({
        id: "chatcmpl-test",
        object: "chat.completion",
        created: 1234567890,
        model: TEST_MODEL,
        choices: [{ index: 0, message: { role: "assistant", content: "Hello" }, finish_reason: "stop" }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

      vi.mocked(globalThis.fetch).mockResolvedValueOnce(mockResponse);

      const provider = createProvider();
      await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "Hi" }],
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/chat/completions"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("should include Authorization Bearer header", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          id: "chatcmpl-test",
          object: "chat.completion",
          created: 1234567890,
          model: TEST_MODEL,
          choices: [{ index: 0, message: { role: "assistant", content: "OK" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 },
        }),
      );

      const provider = createProvider();
      await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "test" }],
      });

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const headers = callArgs[1]?.headers as Record<string, string>;
      expect(headers?.Authorization).toBe(`Bearer ${TEST_API_KEY}`);
    });

    it("should include Content-Type application/json header", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          id: "chatcmpl-test",
          object: "chat.completion",
          created: 1234567890,
          model: TEST_MODEL,
          choices: [{ index: 0, message: { role: "assistant", content: "OK" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 },
        }),
      );

      const provider = createProvider();
      await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "test" }],
      });

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const headers = callArgs[1]?.headers as Record<string, string>;
      expect(headers?.["Content-Type"]).toBe("application/json");
    });

    it("should include organization header when configured", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          id: "chatcmpl-test",
          object: "chat.completion",
          created: 1234567890,
          model: TEST_MODEL,
          choices: [{ index: 0, message: { role: "assistant", content: "OK" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 },
        }),
      );

      const provider = createProvider({ organization: "org-abc" });
      await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "test" }],
      });

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const headers = callArgs[1]?.headers as Record<string, string>;
      expect(headers?.["OpenAI-Organization"]).toBe("org-abc");
    });

    it("should correctly serialize message array in request body", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          id: "chatcmpl-test",
          object: "chat.completion",
          created: 1234567890,
          model: TEST_MODEL,
          choices: [{ index: 0, message: { role: "assistant", content: "resp" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 20, completion_tokens: 3, total_tokens: 23 },
        }),
      );

      const provider = createProvider();
      await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [
          { role: "system", content: "You are helpful." },
          { role: "user", content: "Hello" },
        ],
        temperature: 0.7,
        maxTokens: 1024,
      });

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);
      expect(body.messages).toEqual([
        { role: "system", content: "You are helpful." },
        { role: "user", content: "Hello" },
      ]);
      expect(body.temperature).toBe(0.7);
      expect(body.max_tokens).toBe(1024);
      expect(body.model).toBe(TEST_MODEL);
    });

    it("should include optional parameters when provided", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          id: "chatcmpl-test",
          object: "chat.completion",
          created: 1234567890,
          model: TEST_MODEL,
          choices: [{ index: 0, message: { role: "assistant", content: "x" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 5, completion_tokens: 1, total_tokens: 6 },
        }),
      );

      const provider = createProvider();
      await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "test" }],
        topP: 0.9,
        stopSequences: ["\n\n"],
        presencePenalty: 0.1,
        frequencyPenalty: 0.2,
      });

      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
      expect(body.top_p).toBe(0.9);
      expect(body.stop).toEqual(["\n\n"]);
      expect(body.presence_penalty).toBe(0.1);
      expect(body.frequency_penalty).toBe(0.2);
    });
  });

  describe("chatCompletion - Response Parsing", () => {
    it("should parse successful response into ChatCompletionResult", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          id: "chatcmpl-abc123",
          object: "chat.completion",
          created: 1700000000,
          model: "gpt-4o-mini",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: "Hello! How can I help you today?" },
              finish_reason: "stop",
            },
          ],
          usage: { prompt_tokens: 25, completion_tokens: 10, total_tokens: 35 },
        }),
      );

      const provider = createProvider();
      const result = await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "Hi" }],
      });

      expect(result.id).toBe("chatcmpl-abc123");
      expect(result.object).toBe("chat.completion");
      expect(result.created).toBe(1700000000);
      expect(result.model).toBe("gpt-4o-mini");
      expect(result.content).toBe("Hello! How can I help you today?");
      expect(result.usage.promptTokens).toBe(25);
      expect(result.usage.completionTokens).toBe(10);
      expect(result.usage.totalTokens).toBe(35);
      expect(result.finishReason).toBe("stop");
    });

    it("should handle null content gracefully (return empty string)", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          id: "chatcmpl-null",
          object: "chat.completion",
          created: 1700000000,
          model: TEST_MODEL,
          choices: [
            { index: 0, message: { role: "assistant", content: null }, finish_reason: "stop" },
          ],
          usage: { prompt_tokens: 5, completion_tokens: 0, total_tokens: 5 },
        }),
      );

      const provider = createProvider();
      const result = await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "hi" }],
      });

      expect(result.content).toBe("");
    });

    it("should map finish_reason length correctly", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          id: "chatcmpl-length",
          object: "chat.completion",
          created: 1700000000,
          model: TEST_MODEL,
          choices: [
            { index: 0, message: { role: "assistant", content: "truncated..." }, finish_reason: "length" },
          ],
          usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
        }),
      );

      const provider = createProvider();
      const result = await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "long" }],
      });

      expect(result.finishReason).toBe("length");
    });
  });

  describe("chatCompletion - Error Handling", () => {
    it("should throw error with status code on non-2xx response", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({ error: { message: "Invalid API key" } }, 401, false),
      );

      const provider = createProvider();
      await expect(
        provider.chatCompletion({
          model: TEST_MODEL,
          messages: [{ role: "user", content: "test" }],
        }),
      ).rejects.toThrow("OpenAI API error 401");
    });

    it("should retry on 429 rate limit errors", async () => {
      vi.mocked(globalThis.fetch)
        .mockResolvedValueOnce(mockFetchResponse({ error: { message: "Rate limit" } }, 429, false))
        .mockResolvedValueOnce(mockFetchResponse({ error: { message: "Rate limit" } }, 429, false))
        .mockResolvedValueOnce(
          mockFetchResponse({
            id: "chatcmpl-retry",
            object: "chat.completion",
            created: 1700000000,
            model: TEST_MODEL,
            choices: [{ index: 0, message: { role: "assistant", content: "Success after retry" }, finish_reason: "stop" }],
            usage: { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 },
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

    it("should retry on 500 server errors", async () => {
      vi.mocked(globalThis.fetch)
        .mockResolvedValueOnce(mockFetchResponse({ error: { message: "Internal error" } }, 500, false))
        .mockResolvedValueOnce(
          mockFetchResponse({
            id: "chatcmpl-ok",
            object: "chat.completion",
            created: 1700000000,
            model: TEST_MODEL,
            choices: [{ index: 0, message: { role: "assistant", content: "Recovered" }, finish_reason: "stop" }],
            usage: { prompt_tokens: 8, completion_tokens: 1, total_tokens: 9 },
          }),
        );

      const provider = createProvider({ maxRetries: 3, timeoutMs: 5000 });
      const result = await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "500 test" }],
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
        provider.chatCompletion({
          model: TEST_MODEL,
          messages: [{ role: "user", content: "fail" }],
        }),
      ).rejects.toThrow();

      expect(fetch).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it("should use exponential backoff between retries", async () => {
      const start = Date.now();
      vi.mocked(globalThis.fetch)
        .mockResolvedValueOnce(mockFetchResponse({ error: {} }, 429, false))
        .mockResolvedValueOnce(
          mockFetchResponse({
            id: "chatcmpl-backoff",
            object: "chat.completion",
            created: 1700000000,
            model: TEST_MODEL,
            choices: [{ index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" }],
            usage: { prompt_tokens: 5, completion_tokens: 1, total_tokens: 6 },
          }),
        );

      const provider = createProvider({ maxRetries: 3, timeoutMs: 100 });
      await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "backoff" }],
      });

      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(900); // ~1000ms base delay for first retry
    });
  });

  describe("streamChatCompletion - SSE Stream Parsing", () => {
    it("should parse SSE chunks and invoke callback for each delta", async () => {
      const sseChunks = [
        'data: {"id":"cmpl-stream-1","created":1700000000,"model":"gpt-4o-mini","choices":[{"delta":{"role":"assistant","content":"Hello"},"finish_reason":null}]}\n\n',
        'data: {"id":"cmpl-stream-1","created":1700000000,"model":"gpt-4o-mini","choices":[{"delta":{"content":" world"},"finish_reason":null}]}\n\n',
        'data: [DONE]\n\n',
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

    it("should accumulate full content across all chunks", async () => {
      const sseChunks = [
        'data: {"choices":[{"delta":{"content":"A"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"B"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"C"},"finish_reason":"stop"}]}\n\n',
        'data: [DONE]\n\n',
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

    it("should handle empty stream gracefully", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockStreamBody(["data: [DONE]\n\n"]),
      } as unknown as Response);

      const provider = createProvider({ timeoutMs: 5000 });
      const result = await provider.streamChatCompletion(
        { model: TEST_MODEL, messages: [{ role: "user", content: "empty" }] },
        () => {},
      );

      expect(result.content).toBe("");
    });

    it("should pass usage info when present in final chunk", async () => {
      const sseChunks = [
        'data: {"choices":[{"delta":{"content":"done"},"finish_reason":"stop"}],"usage":{"prompt_tokens":20,"completion_tokens":3,"total_tokens":23}}\n\n',
        'data: [DONE]\n\n',
      ];

      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockStreamBody(sseChunks),
      } as unknown as Response);

      const provider = createProvider({ timeoutMs: 5000 });
      const result = await provider.streamChatCompletion(
        { model: TEST_MODEL, messages: [{ role: "user", content: "usage" }] },
        () => {},
      );

      expect(result.usage.promptTokens).toBe(20);
      expect(result.usage.completionTokens).toBe(3);
      expect(result.usage.totalTokens).toBe(23);
    });

    it("should throw on non-OK response during streaming", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        text: async () => '{"error":"Forbidden"}',
      } as unknown as Response);

      const provider = createProvider({ timeoutMs: 5000 });
      await expect(
        provider.streamChatCompletion(
          { model: TEST_MODEL, messages: [{ role: "user", content: "bad" }] },
          () => {},
        ),
      ).rejects.toThrow("OpenAI API error 403");
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

    it("should support abort via signal parameter", async () => {
      const controller = new AbortController();

      vi.mocked(globalThis.fetch).mockImplementationOnce(async (_url, opts) => {
        controller.abort();
        return new Response(null, { status: 200, body: mockStreamBody([]) });
      });

      const provider = createProvider({ timeoutMs: 60_000 });
      setTimeout(() => controller.abort(), 10);

      await expect(
        provider.streamChatCompletion(
          { model: TEST_MODEL, messages: [{ role: "user", content: "abort" }] },
          () => {},
          controller.signal,
        ),
      ).resolves.toBeDefined();
    });
  });

  describe("listModels", () => {
    it("should fetch models list from /models endpoint", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { id: "gpt-4o" },
            { id: "gpt-4o-mini" },
            { id: "custom-model" },
          ],
        }),
      } as unknown as Response);

      const provider = createProvider({ timeoutMs: 5000 });
      const models = await provider.listModels();

      expect(models).toEqual(["gpt-4o", "gpt-4o-mini", "custom-model"]);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/models"),
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("should throw on failed list models request", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as unknown as Response);

      const provider = createProvider({ timeoutMs: 5000 });
      await expect(provider.listModels()).rejects.toThrow("401");
    });
  });
});

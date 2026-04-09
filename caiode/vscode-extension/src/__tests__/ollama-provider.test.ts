import { describe, it, expect, vi, beforeEach } from "vitest";
import { OllamaProvider } from "../core/ai/ollama-provider";
import type {
  ChatCompletionOptions,
  StreamChunk,
} from "../core/ai/types";

const TEST_MODEL = "qwen2.5:7b";

function createProvider(overrides?: Partial<ConstructorParameters<typeof OllamaProvider>[0]>) {
  return new OllamaProvider({
    apiKey: "",
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

describe("OllamaProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  describe("Constructor & Configuration", () => {
    it("should set providerName to 'ollama'", () => {
      const provider = createProvider();
      expect(provider.providerName).toBe("ollama");
    });

    it("should have empty supportedModels (populated at runtime)", () => {
      const provider = createProvider();
      expect(provider.supportedModels).toEqual([]);
    });

    it("should use default baseUrl localhost:11434", () => {
      const provider = createProvider();
      expect((provider as unknown as { baseUrl: string }).baseUrl).toBe(
        "http://localhost:11434",
      );
    });

    it("should use custom baseUrl when provided", () => {
      const provider = createProvider({ baseUrl: "http://192.168.1.100:11434" });
      expect((provider as unknown as { baseUrl: string }).baseUrl).toBe(
        "http://192.168.1.100:11434",
      );
    });

    it("should default timeout to 120000ms (longer for local LLM)", () => {
      const provider = createProvider();
      expect((provider as unknown as { timeoutMs: number }).timeoutMs).toBe(120_000);
    });

    it("should accept custom timeout", () => {
      const provider = createProvider({ timeoutMs: 60_000 });
      expect((provider as unknown as { timeoutMs: number }).timeoutMs).toBe(60_000);
    });

    it("dispose should be a no-op", () => {
      const provider = createProvider();
      expect(() => provider.dispose()).not.toThrow();
    });
  });

  describe("chatCompletion - Request Format", () => {
    it("should send POST to /api/chat endpoint", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          model: TEST_MODEL,
          created_at: "2024-01-01T00:00:00Z",
          message: { role: "assistant", content: "Hello!" },
          done: true,
          prompt_eval_count: 10,
          eval_count: 5,
        }),
      );

      const provider = createProvider();
      await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "Hi" }],
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/chat"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("should not include Authorization header (Ollama is local)", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          model: TEST_MODEL,
          created_at: "2024-01-01T00:00:00Z",
          message: { role: "assistant", content: "OK" },
          done: true,
        }),
      );

      const provider = createProvider();
      await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "test" }],
      });

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const headers = callArgs[1]?.headers as Record<string, string>;
      expect(headers?.Authorization).toBeUndefined();
      expect(headers?.["x-api-key"]).toBeUndefined();
      expect(headers?.["Content-Type"]).toBe("application/json");
    });

    it("should include stream:false in request body", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          model: TEST_MODEL,
          created_at: "2024-01-01T00:00:00Z",
          message: { role: "assistant", content: "resp" },
          done: true,
        }),
      );

      const provider = createProvider();
      await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "test" }],
      });

      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
      expect(body.stream).toBe(false);
    });

    it("should correctly serialize messages including system role", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          model: TEST_MODEL,
          created_at: "2024-01-01T00:00:00Z",
          message: { role: "assistant", content: "ok" },
          done: true,
        }),
      );

      const provider = createProvider();
      await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [
          { role: "system", content: "Be concise." },
          { role: "user", content: "Hello" },
        ],
      });

      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
      expect(body.messages).toEqual([
        { role: "system", content: "Be concise." },
        { role: "user", content: "Hello" },
      ]);
    });

    it("should pass options.temperature and num_predict when provided", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          model: TEST_MODEL,
          created_at: "2024-01-01T00:00:00Z",
          message: { role: "assistant", content: "x" },
          done: true,
        }),
      );

      const provider = createProvider();
      await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "test" }],
        temperature: 0.8,
        maxTokens: 2048,
      });

      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
      expect(body.options.temperature).toBe(0.8);
      expect(body.options.num_predict).toBe(2048);
    });
  });

  describe("chatCompletion - Response Parsing", () => {
    it("should parse successful response into ChatCompletionResult", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          model: "qwen2.5:7b",
          created_at: "2024-06-15T12:30:00Z",
          message: { role: "assistant", content: "Hello! I'm a local LLM." },
          done: true,
          prompt_eval_count: 25,
          eval_count: 15,
          total_duration: 5000000000,
          prompt_eval_duration: 2000000000,
          eval_duration: 3000000000,
        }),
      );

      const provider = createProvider();
      const result = await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "Hi" }],
      });

      expect(result.model).toBe("qwen2.5:7b");
      expect(result.content).toBe("Hello! I'm a local LLM.");
      expect(result.usage.promptTokens).toBe(25);
      expect(result.usage.completionTokens).toBe(15);
      expect(result.usage.totalTokens).toBe(40);
      expect(result.finishReason).toBe("stop");
    });

    it("should handle missing usage fields gracefully (default to 0)", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          model: TEST_MODEL,
          created_at: "2024-01-01T00:00:00Z",
          message: { role: "assistant", content: "no stats" },
          done: true,
        }),
      );

      const provider = createProvider();
      const result = await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "hi" }],
      });

      expect(result.usage.promptTokens).toBe(0);
      expect(result.usage.completionTokens).toBe(0);
    });

    it("should handle null message content gracefully", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({
          model: TEST_MODEL,
          created_at: "2024-01-01T00:00:00Z",
          message: { role: "assistant", content: null as unknown as string },
          done: true,
        }),
      );

      const provider = createProvider();
      const result = await provider.chatCompletion({
        model: TEST_MODEL,
        messages: [{ role: "user", content: "null" }],
      });

      expect(result.content).toBe("");
    });
  });

  describe("chatCompletion - Error Handling", () => {
    it("should throw error with status code on non-2xx response", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse({ error: "model not found" }, 404, false),
      );

      const provider = createProvider();
      await expect(
        provider.chatCompletion({ model: TEST_MODEL, messages: [{ role: "user", content: "bad" }] }),
      ).rejects.toThrow("Ollama API error 404");
    });

    it("should throw connection error when Ollama unreachable", async () => {
      vi.mocked(globalThis.fetch).mockRejectedValueOnce(new Error("ECONNREFUSED"));

      const provider = createProvider({ timeoutMs: 3000 });
      await expect(
        provider.chatCompletion({ model: TEST_MODEL, messages: [{ role: "user", content: "unreachable" }] }),
      ).rejects.toThrow();
    });
  });

  describe("streamChatCompletion - NDJSON Stream Parsing", () => {
    it("should parse NDJSON chunks and invoke callback for each delta", async () => {
      const ndjsonChunks = [
        JSON.stringify({
          model: TEST_MODEL,
          created_at: "2024-01-01T00:00:00Z",
          message: { role: "assistant", content: "Hello" },
          done: false,
        }) + "\n",
        JSON.stringify({
          model: TEST_MODEL,
          created_at: "2024-01-01T00:00:01Z",
          message: { role: "assistant", content: " world" },
          done: false,
        }) + "\n",
        JSON.stringify({
          model: TEST_MODEL,
          created_at: "2024-01-01T00:00:02Z",
          message: { role: "assistant", content: "" },
          done: true,
          prompt_eval_count: 10,
          eval_count: 6,
        }) + "\n",
      ];

      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockStreamBody(ndjsonChunks),
      } as unknown as Response);

      const collectedChunks: StreamChunk[] = [];
      const provider = createProvider({ timeoutMs: 30_000 });
      const result = await provider.streamChatCompletion(
        { model: TEST_MODEL, messages: [{ role: "user", content: "Hi" }] },
        (chunk) => collectedChunks.push(chunk),
      );

      expect(collectedChunks).toHaveLength(2);
      expect(collectedChunks[0].content).toBe("Hello");
      expect(collectedChunks[1].content).toBe(" world");
      expect(result.content).toBe("Hello world");
      expect(result.usage.promptTokens).toBe(10);
      expect(result.usage.completionTokens).toBe(6);
    });

    it("should accumulate full content across all NDJSON lines", async () => {
      const ndjsonChunks = [
        JSON.stringify({ model: TEST_MODEL, message: { content: "A" }, done: false }) + "\n",
        JSON.stringify({ model: TEST_MODEL, message: { content: "B" }, done: false }) + "\n",
        JSON.stringify({ model: TEST_MODEL, message: { content: "C" }, done: true }) + "\n",
      ];

      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockStreamBody(ndjsonChunks),
      } as unknown as Response);

      const provider = createProvider({ timeoutMs: 30_000 });
      const result = await provider.streamChatCompletion(
        { model: TEST_MODEL, messages: [{ role: "user", content: "go" }] },
        () => {},
      );

      expect(result.content).toBe("ABC");
    });

    it("should handle empty stream gracefully", async () => {
      const ndjsonChunks = [
        JSON.stringify({ model: TEST_MODEL, message: { content: "" }, done: true }) + "\n",
      ];

      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockStreamBody(ndjsonChunks),
      } as unknown as Response);

      const provider = createProvider({ timeoutMs: 30_000 });
      const result = await provider.streamChatCompletion(
        { model: TEST_MODEL, messages: [{ role: "user", content: "empty" }] },
        () => {},
      );

      expect(result.content).toBe("");
    });

    it("should throw on non-OK response during streaming", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => '{"error":"bad request"}',
      } as unknown as Response);

      const provider = createProvider({ timeoutMs: 30_000 });
      await expect(
        provider.streamChatCompletion(
          { model: TEST_MODEL, messages: [{ role: "user", content: "bad" }] },
          () => {},
        ),
      ).rejects.toThrow("Ollama API error 400");
    });

    it("should skip malformed NDJSON lines without crashing", async () => {
      const ndjsonChunks = [
        "this-is-not-json\n",
        JSON.stringify({ model: TEST_MODEL, message: { content: "valid" }, done: false }) + "\n",
        JSON.stringify({ model: TEST_MODEL, message: { content: "" }, done: true }) + "\n",
      ];

      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockStreamBody(ndjsonChunks),
      } as unknown as Response);

      const collectedChunks: StreamChunk[] = [];
      const provider = createProvider({ timeoutMs: 30_000 });
      const result = await provider.streamChatCompletion(
        { model: TEST_MODEL, messages: [{ role: "user", content: "malformed" }] },
        (chunk) => collectedChunks.push(chunk),
      );

      expect(result.content).toBe("valid");
      expect(collectedChunks).toHaveLength(1);
    });
  });

  describe("listModels", () => {
    it("should fetch models list from /api/tags endpoint", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [
            { name: "qwen2.5:7b" },
            { name: "llama3.1:8b" },
            { name: "mistral:7b" },
          ],
        }),
      } as unknown as Response);

      const provider = createProvider({ timeoutMs: 5000 });
      const models = await provider.listModels();

      expect(models).toEqual(["qwen2.5:7b", "llama3.1:8b", "mistral:7b"]);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/tags"),
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("should throw on failed list models request", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
        status: 503,
      } as unknown as Response);

      const provider = createProvider({ timeoutMs: 5000 });
      await expect(provider.listModels()).rejects.toThrow("503");
    });

    it("should throw descriptive error when Ollama service is unreachable", async () => {
      vi.mocked(globalThis.fetch).mockRejectedValueOnce(new DOMException("", "AbortError"));

      const provider = createProvider({ timeoutMs: 3000 });
      await expect(provider.listModels()).rejects.toThrow("unreachable");
    });
  });

  describe("checkConnection", () => {
    it("should return true when Ollama responds OK", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as unknown as Response);

      const provider = createProvider();
      const connected = await provider.checkConnection();
      expect(connected).toBe(true);
    });

    it("should return false when Ollama is unreachable", async () => {
      vi.mocked(globalThis.fetch).mockRejectedValueOnce(new Error("ECONNREFUSED"));

      const provider = createProvider();
      const connected = await provider.checkConnection();
      expect(connected).toBe(false);
    });

    it("should return false on non-OK response", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
        status: 503,
      } as unknown as Response);

      const provider = createProvider();
      const connected = await provider.checkConnection();
      expect(connected).toBe(false);
    });
  });
});

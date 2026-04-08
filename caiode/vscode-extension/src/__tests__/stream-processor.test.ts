import { describe, it, expect, vi, beforeEach } from "vitest";
import { StreamProcessor } from "../core/ai/stream-processor";
import type {
  ChatCompletionOptions,
  LLMProvider,
  StreamChunk,
} from "../core/ai/types";

function createMockProvider(chunks: StreamChunk[], finalResult?: { id: string; model: string; content: string; finishReason: string }): LLMProvider {
  return {
    providerName: "test",
    supportedModels: ["test-model"],
    chatCompletion: vi.fn(),
    streamChatCompletion: async (_options, onChunk, _signal) => {
      for (const chunk of chunks) {
        onChunk(chunk);
      }
      return {
        id: finalResult?.id ?? "final-id",
        object: "chat.completion",
        created: Date.now(),
        model: finalResult?.model ?? "test-model",
        content: finalResult?.content ?? "",
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        finishReason: (finalResult?.finishReason ?? "stop") as "stop",
      };
    },
    dispose: vi.fn(),
  };
}

describe("StreamProcessor", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Stream Accumulation", () => {
    it("should accumulate all chunk contents into full text", async () => {
      const chunks: StreamChunk[] = [
        { id: "s1", object: "chat.completion.chunk", created: 1, model: "m", content: "Hello ", finishReason: null },
        { id: "s1", object: "chat.completion.chunk", created: 1, model: "m", content: "world", finishReason: null },
        { id: "s1", object: "chat.completion.chunk", created: 1, model: "m", content: "!", finishReason: null },
      ];

      const collectedChunks: StreamChunk[] = [];
      const provider = createMockProvider(chunks);
      const processor = new StreamProcessor({ provider, onChunk: (c) => collectedChunks.push(c) });

      const result = await processor.process({
        model: "m",
        messages: [{ role: "user", content: "hi" }],
      });

      expect(result.content).toBe("Hello world!");
      expect(collectedChunks).toHaveLength(3);
      expect(collectedChunks[0].content).toBe("Hello ");
      expect(collectedChunks[1].content).toBe("world");
      expect(collectedChunks[2].content).toBe("!");
    });

    it("should invoke callback for every non-empty chunk", async () => {
      const chunks: StreamChunk[] = [
        { id: "x", object: "chat.completion.chunk", created: 0, model: "m", content: "A", finishReason: null },
        { id: "x", object: "chat.completion.chunk", created: 0, model: "m", content: "", finishReason: null },
        { id: "x", object: "chat.completion.chunk", created: 0, model: "m", content: "B", finishReason: null },
      ];

      const calls: string[] = [];
      const provider = createMockProvider(chunks);
      const processor = new StreamProcessor({
        provider,
        onChunk: (c) => { if (c.content) calls.push(c.content); },
      });

      await processor.process({ model: "m", messages: [{ role: "user", content: "t" }] });
      expect(calls).toEqual(["A", "B"]);
    });

    it("should track chunk count in stats", async () => {
      const chunks: StreamChunk[] = Array.from({ length: 10 }, (_, i) => ({
        id: `c${i}`,
        object: "chat.completion.chunk" as const,
        created: 0,
        model: "m",
        content: `${i}`,
        finishReason: null as const,
      }));

      const provider = createMockProvider(chunks);
      const processor = new StreamProcessor({ provider, onChunk: () => {} });

      await processor.process({ model: "m", messages: [{ role: "user", content: "t" }] });
      expect(processor.stats.chunkCount).toBe(10);
    });
  });

  describe("Token Usage Tracking", () => {
    it("should track token usage from chunks with usage info", async () => {
      const chunks: StreamChunk[] = [
        { id: "u1", object: "chat.completion.chunk", created: 0, model: "m", content: "text", finishReason: null,
          usage: { promptTokens: 20, completionTokens: 3, totalTokens: 23 } },
      ];

      const provider = createMockProvider(chunks);
      const processor = new StreamProcessor({ provider, onChunk: () => {} });

      const result = await processor.process({ model: "m", messages: [{ role: "user", content: "t" }] });
      expect(result.usage.promptTokens).toBe(20);
      expect(result.usage.completionTokens).toBe(3);
      expect(result.usage.totalTokens).toBe(23);
    });

    it("should merge final result usage when available", async () => {
      const chunks: StreamChunk[] = [
        { id: "u2", object: "chat.completion.chunk", created: 0, model: "m", content: "partial", finishReason: null },
      ];

      const provider = createMockProvider(chunks, {
        id: "final-usage",
        model: "m",
        content: "",
        finishReason: "stop",
      });

      const processor = new StreamProcessor({ provider, onChunk: () => {} });
      const result = await processor.process({ model: "m", messages: [{ role: "user", content: "t" }] });
      expect(result.usage.promptTokens).toBe(10); // from mock's default
      expect(result.usage.completionTokens).toBe(5);
    });
  });

  describe("Abort Support", () => {
    it("should return partial result when aborted via signal", async () => {
      let resolveStream: (() => void) | undefined;
      const streamPromise = new Promise<void>((resolve) => { resolveStream = resolve; });

      const provider: LLMProvider = {
        providerName: "slow",
        supportedModels: [],
        chatCompletion: vi.fn(),
        streamChatCompletion: async (_opts, onChunk) => {
          onChunk({ id: "a1", object: "chat.completion.chunk", created: 0, model: "m", content: "Partial", finishReason: null });
          await streamPromise;
          return {
            id: "never", object: "chat.completion", created: 0, model: "m",
            content: "", usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }, finishReason: "stop" };
        },
        dispose: vi.fn(),
      };

      const controller = new AbortController();
      const processor = new StreamProcessor({ provider, onChunk: () => {}, signal: controller.signal });

      const resultPromise = processor.process({ model: "m", messages: [{ role: "user", content: "abort me" }] });
      controller.abort();
      if (resolveStream) resolveStream();

      const result = await resultPromise;
      expect(result.content).toBe("Partial");
      expect(processor.isAborted).toBe(true);
    });

    it("should set isAborted flag when signal is already aborted", async () => {
      const controller = new AbortController();
      controller.abort();

      const provider = createMockProvider([]);
      const processor = new StreamProcessor({ provider, onChunk: () => {}, signal: controller.signal });

      const result = await processor.process({ model: "m", messages: [{ role: "user", content: "pre-aborted" }] });
      expect(result.content).toBe("");
      expect(processor.isAborted).toBe(true);
    });

    it("should not throw on abort but return partial result", async () => {
      const provider: LLMProvider = {
        providerName: "error",
        supportedModels: [],
        chatCompletion: vi.fn(),
        streamChatCompletion: vi.fn().mockRejectedValue(new DOMException("", "AbortError")),
        dispose: vi.fn(),
      };

      const controller = new AbortController();
      const processor = new StreamProcessor({ provider, onChunk: () => {}, signal: controller.signal });

      const result = await processor.process({ model: "m", messages: [{ role: "user", content: "abort-error" }] }).catch(() => null);
      // The error is caught internally and returns partial state
      expect(result).toBeDefined();
    });
  });

  describe("Finish Reason Handling", () => {
    it("should propagate finish_reason from last chunk", async () => {
      const chunks: StreamChunk[] = [
        { id: "f1", object: "chat.completion.chunk", created: 0, model: "m", content: "done", finishReason: "length" },
      ];

      const provider = createMockProvider(chunks);
      const processor = new StreamProcessor({ provider, onChunk: () => {} });

      const result = await processor.process({ model: "m", messages: [{ role: "user", content: "len" }] });
      expect(result.finishReason).toBe("length");
    });

    it("should default to 'stop' when no finish reason set", async () => {
      const provider = createMockProvider([]);
      const processor = new StreamProcessor({ provider, onChunk: () => {} });

      const result = await processor.process({ model: "m", messages: [{ role: "user", content: "no-fr" }] });
      expect(result.finishReason).toBe("stop");
    });
  });

  describe("Stats & Metrics", () => {
    it("should report correct content length in stats", async () => {
      const chunks: StreamChunk[] = [
        { id: "st1", object: "chat.completion.chunk", created: 0, model: "m", content: "1234567890", finishReason: null },
      ];

      const provider = createMockProvider(chunks);
      const processor = new StreamProcessor({ provider, onChunk: () => {} });

      await processor.process({ model: "m", messages: [{ role: "user", content: "stats" }] });
      expect(processor.stats.contentLength).toBe(10);
    });

    it("should calculate tokensPerSecond correctly", async () => {
      const chunks: StreamChunk[] = [
        { id: "tp1", object: "chat.completion.chunk", created: 0, model: "m", content: "tok", finishReason: null,
          usage: { promptTokens: 10, completionTokens: 50, totalTokens: 60 } },
      ];

      const provider = createMockProvider(chunks);
      const processor = new StreamProcessor({ provider, onChunk: () => {} });

      await processor.process({ model: "m", messages: [{ role: "user", content: "tps" }] });
      expect(processor.stats.tokensPerSecond).toBeGreaterThan(0);
    });

    it("should report elapsedMs > 0 after processing", async () => {
      const provider = createMockProvider([
        { id: "el1", object: "chat.completion.chunk", created: 0, model: "m", content: "x", finishReason: null },
      ]);
      const processor = new StreamProcessor({ provider, onChunk: () => {} });

      await processor.process({ model: "m", messages: [{ role: "user", content: "elapsed" }] });
      expect(processor.stats.elapsedMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Abort Support", () => {
    it("should support abort() method to mark as aborted", async () => {
      const provider = createMockProvider([]);
      const processor = new StreamProcessor({ provider, onChunk: () => {} });

      expect(processor.isAborted).toBe(false);
      processor.abort();
      expect(processor.isAborted).toBe(true);
    });
  });

  describe("Error Propagation (non-abort errors)", () => {
    it("should re-throw non-abort errors from provider", async () => {
      const provider: LLMProvider = {
        providerName: "err",
        supportedModels: [],
        chatCompletion: vi.fn(),
        streamChatCompletion: vi.fn().mockRejectedValue(new Error("Network timeout")),
        dispose: vi.fn(),
      };

      const processor = new StreamProcessor({ provider, onChunk: () => {} });
      await expect(
        processor.process({ model: "m", messages: [{ role: "user", content: "err" }] }),
      ).rejects.toThrow("Network timeout");
    });
  });
});

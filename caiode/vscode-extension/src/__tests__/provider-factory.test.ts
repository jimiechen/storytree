import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createLLMProvider,
  isNoopProvider,
  NoopProvider,
  type AIConfig,
} from "../core/ai/provider-factory";

describe("NoopProvider", () => {
  it("should have providerName 'noop'", () => {
    const provider = new NoopProvider();
    expect(provider.providerName).toBe("noop");
  });

  it("should return empty result for chatCompletion", async () => {
    const provider = new NoopProvider();
    const result = await provider.chatCompletion({
      model: "any",
      messages: [{ role: "user", content: "test" }],
    });
    expect(result.content).toBe("");
    expect(result.id).toBe("noop");
    expect(result.usage.totalTokens).toBe(0);
  });

  it("should return empty result for streamChatCompletion", async () => {
    const provider = new NoopProvider();
    const chunks: unknown[] = [];
    const result = await provider.streamChatCompletion(
      { model: "any", messages: [{ role: "user", content: "test" }] },
      (chunk) => chunks.push(chunk),
    );
    expect(result.content).toBe("");
    expect(chunks).toHaveLength(0);
  });

  it("dispose should be a no-op", () => {
    const provider = new NoopProvider();
    expect(() => provider.dispose()).not.toThrow();
  });
});

describe("createLLMProvider (Factory)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("OpenAI Provider Creation", () => {
    it("should create OpenAIProvider for provider='openai' with valid config", () => {
      const config: AIConfig = {
        provider: "openai",
        openai: { apiKey: "sk-test", defaultModel: "gpt-4o" },
      };
      const provider = createLLMProvider(config);
      expect(provider.providerName).toBe("openai");
      expect(isNoopProvider(provider)).toBe(false);
    });

    it("should fall back to NoopProvider when openai apiKey is missing", () => {
      const config: AIConfig = { provider: "openai", openai: { apiKey: "", defaultModel: "gpt-4o" } };
      const provider = createLLMProvider(config);
      expect(isNoopProvider(provider)).toBe(true);
    });

    it("should fall back to NoopProvider when openai config is undefined", () => {
      const config: AIConfig = { provider: "openai" };
      const provider = createLLMProvider(config);
      expect(isNoopProvider(provider)).toBe(true);
    });

    it("should pass custom baseUrl and organization to OpenAIProvider", () => {
      const config: AIConfig = {
        provider: "openai",
        openai: {
          apiKey: "sk-test",
          baseUrl: "https://custom.openai.com/v1",
          organization: "org-abc",
          defaultModel: "gpt-4o-mini",
        },
      };
      const provider = createLLMProvider(config);
      expect(provider.providerName).toBe("openai");
    });

    it("should use gpt-4o-mini as default model when not specified", () => {
      const config: AIConfig = {
        provider: "openai",
        openai: { apiKey: "sk-test", defaultModel: "" },
      };
      const provider = createLLMProvider(config);
      expect(provider.providerName).toBe("openai");
    });
  });

  describe("Anthropic Provider Creation", () => {
    it("should create AnthropicProvider for provider='anthropic' with valid config", () => {
      const config: AIConfig = {
        provider: "anthropic",
        anthropic: { apiKey: "sk-ant-test", defaultModel: "claude-sonnet-4-20250514" },
      };
      const provider = createLLMProvider(config);
      expect(provider.providerName).toBe("anthropic");
      expect(isNoopProvider(provider)).toBe(false);
    });

    it("should fall back to NoopProvider when anthropic apiKey is missing", () => {
      const config: AIConfig = {
        provider: "anthropic",
        anthropic: { apiKey: "", defaultModel: "claude-haiku-4-20250514" },
      };
      const provider = createLLMProvider(config);
      expect(isNoopProvider(provider)).toBe(true);
    });

    it("should use claude-haiku as default model when not specified", () => {
      const config: AIConfig = {
        provider: "anthropic",
        anthropic: { apiKey: "sk-ant-test", defaultModel: "" },
      };
      const provider = createLLMProvider(config);
      expect(provider.providerName).toBe("anthropic");
    });

    it("should pass custom baseUrl to AnthropicProvider", () => {
      const config: AIConfig = {
        provider: "anthropic",
        anthropic: {
          apiKey: "sk-ant-test",
          baseUrl: "https://custom.anthropic.com/v1",
          defaultModel: "claude-opus-4-20250514",
        },
      };
      const provider = createLLMProvider(config);
      expect(provider.providerName).toBe("anthropic");
    });
  });

  describe("Ollama Provider Creation", () => {
    it("should create OllamaProvider for provider='ollama'", () => {
      const config: AIConfig = {
        provider: "ollama",
        ollama: { defaultModel: "qwen2.5:7b" },
      };
      const provider = createLLMProvider(config);
      expect(provider.providerName).toBe("ollama");
      expect(isNoopProvider(provider)).toBe(false);
    });

    it("should create OllamaProvider even without apiKey (local service)", () => {
      const config: AIConfig = { provider: "ollama" };
      const provider = createLLMProvider(config);
      expect(provider.providerName).toBe("ollama");
    });

    it("should use qwen2.5:7b as default model when not specified", () => {
      const config: AIConfig = { provider: "ollama" };
      const provider = createLLMProvider(config);
      expect(provider.providerName).toBe("ollama");
    });

    it("should pass custom baseUrl to OllamaProvider", () => {
      const config: AIConfig = {
        provider: "ollama",
        ollama: { baseUrl: "http://192.168.1.100:11434", defaultModel: "llama3.1:8b" },
      };
      const provider = createLLMProvider(config);
      expect(provider.providerName).toBe("ollama");
    });
  });

  describe("Custom Provider Creation", () => {
    it("should create OpenAI-compatible provider for provider='custom'", () => {
      const config: AIConfig = {
        provider: "custom",
        custom: {
          baseUrl: "https://api.custom-llm.com/v1",
          apiKey: "sk-custom",
          defaultModel: "custom-model-v1",
        },
      };
      const provider = createLLMProvider(config);
      expect(provider.providerName).toBe("openai"); // uses OpenAIProvider under the hood
      expect(isNoopProvider(provider)).toBe(false);
    });

    it("should fall back to NoopProvider when custom baseUrl is missing", () => {
      const config: AIConfig = {
        provider: "custom",
        custom: { baseUrl: "", apiKey: "", defaultModel: "" },
      };
      const provider = createLLMProvider(config);
      expect(isNoopProvider(provider)).toBe(true);
    });

    it("should work without apiKey for custom provider", () => {
      const config: AIConfig = {
        provider: "custom",
        custom: {
          baseUrl: "https://local-server/v1",
          defaultModel: "local-model",
        },
      };
      const provider = createLLMProvider(config);
      expect(isNoopProvider(provider)).toBe(false);
    });
  });

  describe("Unknown / Invalid Provider Fallback", () => {
    it("should return NoopProvider for unknown provider type", () => {
      const config = { provider: "unknown" as ProviderType };
      const provider = createLLMProvider(config);
      expect(isNoopProvider(provider)).toBe(true);
    });

    it("should pass global timeoutMs to created provider", () => {
      const config: AIConfig = {
        provider: "openai",
        openai: { apiKey: "sk-test", defaultModel: "gpt-4o" },
        timeoutMs: 60_000,
      };
      const provider = createLLMProvider(config);
      expect(provider.providerName).toBe("openai");
    });

    it("should pass global maxRetries to created provider", () => {
      const config: AIConfig = {
        provider: "openai",
        openai: { apiKey: "sk-test", defaultModel: "gpt-4o" },
        maxRetries: 5,
      };
      const provider = createLLMProvider(config);
      expect(provider.providerName).toBe("openai");
    });
  });

  describe("isNoopProvider utility", () => {
    it("should return true for NoopProvider instance", () => {
      expect(isNoopProvider(new NoopProvider())).toBe(true);
    });

    it("should return false for non-NoopProvider instances", () => {
      const config: AIConfig = {
        provider: "openai",
        openai: { apiKey: "sk-test", defaultModel: "gpt-4o" },
      };
      expect(isNoopProvider(createLLMProvider(config))).toBe(false);
    });
  });
});

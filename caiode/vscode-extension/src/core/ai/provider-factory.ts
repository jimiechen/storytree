import type {
  ChatCompletionOptions,
  ChatCompletionResult,
  LLMProvider,
  LLMProviderConfig,
  StreamCallback,
} from "./types";
import { OpenAIProvider } from "./openai-provider";
import { AnthropicProvider } from "./anthropic-provider";
import { OllamaProvider } from "./ollama-provider";

export type ProviderType = "openai" | "anthropic" | "ollama" | "custom";

export interface AIConfig {
  provider: ProviderType;
  openai?: { apiKey: string; baseUrl?: string; organization?: string; defaultModel: string };
  anthropic?: { apiKey: string; baseUrl?: string; defaultModel: string };
  ollama?: { baseUrl?: string; defaultModel: string };
  custom?: { baseUrl: string; apiKey: string; defaultModel: string };
  timeoutMs?: number;
  maxRetries?: number;
}

export class NoopProvider implements LLMProvider {
  readonly providerName = "noop";
  readonly supportedModels = [] as const;

  async chatCompletion(_options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    return {
      id: "noop",
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: _options.model,
      content: "",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      finishReason: "stop",
    };
  }

  async streamChatCompletion(
    _options: ChatCompletionOptions,
    _onChunk: StreamCallback,
  ): Promise<ChatCompletionResult> {
    return {
      id: "noop-stream",
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: _options.model,
      content: "",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      finishReason: "stop",
    };
  }

  dispose(): void {}
}

export function createLLMProvider(config: AIConfig): LLMProvider {
  const baseConfig: Partial<LLMProviderConfig> = {
    timeoutMs: config.timeoutMs,
    maxRetries: config.maxRetries,
  };

  switch (config.provider) {
    case "openai": {
      if (!config.openai?.apiKey) {
        return new NoopProvider();
      }
      return new OpenAIProvider({
        apiKey: config.openai.apiKey,
        baseUrl: config.openai.baseUrl,
        defaultModel: config.openai.defaultModel || "gpt-4o-mini",
        organization: config.openai.organization,
        ...baseConfig,
      });
    }

    case "anthropic": {
      if (!config.anthropic?.apiKey) {
        return new NoopProvider();
      }
      return new AnthropicProvider({
        apiKey: config.anthropic.apiKey,
        baseUrl: config.anthropic.baseUrl,
        defaultModel: config.anthropic.defaultModel || "claude-haiku-4-20250514",
        ...baseConfig,
      });
    }

    case "ollama": {
      return new OllamaProvider({
        apiKey: "",
        baseUrl: config.ollama?.baseUrl,
        defaultModel: config.ollama?.defaultModel || "qwen2.5:7b",
        ...baseConfig,
      });
    }

    case "custom": {
      if (!config.custom?.baseUrl) {
        return new NoopProvider();
      }
      return new OpenAIProvider({
        apiKey: config.custom.apiKey || "",
        baseUrl: config.custom.baseUrl,
        defaultModel: config.custom.defaultModel || "gpt-4o-mini",
        ...baseConfig,
      });
    }

    default:
      return new NoopProvider();
  }
}

export function isNoopProvider(provider: LLMProvider): boolean {
  return provider.providerName === "noop";
}

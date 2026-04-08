import type {
  ChatCompletionOptions,
  ChatCompletionResult,
  LLMProvider,
  LLMProviderConfig,
  StreamCallback,
} from "./types";

const DEFAULT_TIMEOUT = 120_000;
const OLLAMA_DEFAULT_BASE = "http://localhost:11434";
const OLLAMA_SUPPORTED_MODELS: string[] = [];

interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OllamaChatRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
    top_p?: number;
    stop?: string[];
    presence_penalty?: number;
    frequency_penalty?: number;
  };
}

interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: { role: string; content: string };
  done: boolean;
  total_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface OllamaStreamChunk {
  model: string;
  created_at: string;
  message: { role: string; content: string };
  done: boolean;
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

function buildMessages(options: ChatCompletionOptions): OllamaMessage[] {
  return options.messages.map((m) => ({
    role: m.role as OllamaMessage["role"],
    content: m.content,
  }));
}

function parseResponse(resp: OllamaChatResponse): ChatCompletionResult {
  return {
    id: `ollama-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(new Date(resp.created_at).getTime() / 1000),
    model: resp.model,
    content: resp.message?.content ?? "",
    usage: {
      promptTokens: resp.prompt_eval_count ?? 0,
      completionTokens: resp.eval_count ?? 0,
      totalTokens: (resp.prompt_eval_count ?? 0) + (resp.eval_count ?? 0),
    },
    finishReason: "stop",
  };
}

export class OllamaProvider implements LLMProvider {
  readonly providerName = "ollama";
  readonly supportedModels = [...OLLAMA_SUPPORTED_MODELS];

  private baseUrl: string;
  private timeoutMs: number;

  constructor(config: LLMProviderConfig) {
    this.baseUrl = (config.baseUrl ?? OLLAMA_DEFAULT_BASE).replace(/\/+$/, "");
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT;
  }

  async chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const payload: OllamaChatRequest = {
      model: options.model,
      messages: buildMessages(options),
      stream: false,
      options: {
        temperature: options.temperature,
        num_predict: options.maxTokens,
        top_p: options.topP,
        stop: options.stopSequences,
        presence_penalty: options.presencePenalty,
        frequency_penalty: options.frequencyPenalty,
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Ollama API error ${response.status}: ${body || response.statusText}`);
      }

      const json = (await response.json()) as OllamaChatResponse;
      return parseResponse(json);
    } finally {
      clearTimeout(timeout);
    }
  }

  async streamChatCompletion(
    options: ChatCompletionOptions,
    onChunk: StreamCallback,
    signal?: AbortSignal,
  ): Promise<ChatCompletionResult> {
    const payload: OllamaChatRequest = {
      model: options.model,
      messages: buildMessages(options),
      stream: true,
      options: {
        temperature: options.temperature,
        num_predict: options.maxTokens,
        top_p: options.topP,
        stop: options.stopSequences,
      },
    };

    const controller = new AbortController();
    const effectiveSignal = signal ?? controller.signal;
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: effectiveSignal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Ollama API error ${response.status}: ${body || response.statusText}`);
      }

      if (!response.body) {
        throw new Error("Ollama API returned no stream body");
      }

      return await this.processNDJSONStream(response.body, options.model, onChunk);
    } finally {
      clearTimeout(timeout);
    }
  }

  async listModels(): Promise<string[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Ollama list models failed: ${response.status}`);
      }

      const data = (await response.json()) as { models: Array<{ name: string }> };
      return data.models.map((m) => m.name);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("Ollama service unreachable at " + this.baseUrl);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  dispose(): void {}

  private async processNDJSONStream(
    body: ReadableStream<Uint8Array>,
    model: string,
    onChunk: StreamCallback,
  ): Promise<ChatCompletionResult> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    let promptEvalCount = 0;
    let evalCount = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.trim());

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line) as OllamaStreamChunk;
            const text = parsed.message?.content ?? "";
            if (text) {
              fullContent += text;
              onChunk({
                id: `ollama-${Date.now()}`,
                object: "chat.completion.chunk",
                created: Math.floor(new Date(parsed.created_at).getTime() / 1000),
                model: parsed.model || model,
                content: text,
                finishReason: null,
              });
            }
            if (parsed.done) {
              if (parsed.prompt_eval_count != null) {
                promptEvalCount = parsed.prompt_eval_count;
              }
              if (parsed.eval_count != null) {
                evalCount = parsed.eval_count;
              }
            }
          } catch {
            // skip malformed NDJSON lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      id: `ollama-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model,
      content: fullContent,
      usage: {
        promptTokens: promptEvalCount,
        completionTokens: evalCount,
        totalTokens: promptEvalCount + evalCount,
      },
      finishReason: "stop",
    };
  }
}

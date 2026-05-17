import type {
  ChatCompletionOptions,
  ChatCompletionResult,
  LLMProvider,
  LLMProviderConfig,
  StreamCallback,
  StreamChunk,
  TokenUsage,
} from "./types";

const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1_000;
const ANTHROPIC_DEFAULT_BASE = "https://api.anthropic.com/v1";
const ANTHROPIC_SUPPORTED_MODELS = [
  "claude-sonnet-4-20250514",
  "claude-haiku-4-20250514",
  "claude-opus-4-20250514",
  "claude-3-5-sonnet-latest",
  "claude-3-5-haiku-latest",
] as const;
const MAX_TOKENS_FALLBACK = 4096;

interface AnthropicMessageParam {
  role: "user" | "assistant";
  content: string | Array<{ type: "text"; text: string }>;
}

interface AnthropicRequestPayload {
  model: string;
  max_tokens: number;
  system?: string;
  messages: AnthropicMessageParam[];
  temperature?: number;
  top_p?: number;
  stop_sequences?: string[];
  stream?: boolean;
}

interface AnthropicResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: Array<{ type: "text"; text: string }>;
  model: string;
  stop_reason: "end_turn" | "max_tokens" | "stop_sequence" | "tool_use";
  usage: { input_tokens: number; output_tokens: number };
}

function extractSystemMessage(messages: Array<{ role: string; content: string }>): { system: string; rest: AnthropicMessageParam[] } {
  const systemMsg = messages.find((m) => m.role === "system");
  const system = systemMsg?.content ?? "";
  const rest = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
  return { system, rest };
}

function mapFinishReason(reason: string): ChatCompletionResult["finishReason"] {
  switch (reason) {
    case "end_turn":
    case "stop_sequence":
      return "stop";
    case "max_tokens":
      return "length";
    case "tool_use":
      return "tool_calls";
    default:
      return "stop";
  }
}

function parseAnthropicUsage(usage: { input_tokens: number; output_tokens: number }): TokenUsage {
  return {
    promptTokens: usage.input_tokens,
    completionTokens: usage.output_tokens,
    totalTokens: usage.input_tokens + usage.output_tokens,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class AnthropicProvider implements LLMProvider {
  readonly providerName = "anthropic";
  readonly supportedModels = [...ANTHROPIC_SUPPORTED_MODELS];

  private apiKey: string;
  private baseUrl: string;
  private timeoutMs: number;
  private maxRetries: number;

  constructor(config: LLMProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? ANTHROPIC_DEFAULT_BASE).replace(/\/+$/, "");
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  async chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.doRequest(options);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const isRetryable =
          lastError.message.includes("429") ||
          lastError.message.includes("500") ||
          lastError.message.includes("502") ||
          lastError.message.includes("503") ||
          lastError.message.includes("overloaded");
        if (!isRetryable || attempt >= this.maxRetries) throw lastError;
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
    throw lastError ?? new Error("Max retries exceeded");
  }

  async streamChatCompletion(
    options: ChatCompletionOptions,
    onChunk: StreamCallback,
    signal?: AbortSignal,
  ): Promise<ChatCompletionResult> {
    const { system, rest } = extractSystemMessage(options.messages);

    const payload: AnthropicRequestPayload = {
      model: options.model,
      max_tokens: options.maxTokens ?? MAX_TOKENS_FALLBACK,
      ...(system ? { system } : {}),
      messages: rest.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options.temperature,
      top_p: options.topP,
      stop_sequences: options.stopSequences?.length ? options.stopSequences : undefined,
      stream: true,
    };

    const controller = new AbortController();
    const effectiveSignal = signal ?? controller.signal;
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
        signal: effectiveSignal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Anthropic API error ${response.status}: ${body || response.statusText}`);
      }

      if (!response.body) {
        throw new Error("Anthropic API returned no stream body");
      }

      return await this.processSSEStream(response.body, options.model, onChunk);
    } finally {
      clearTimeout(timeout);
    }
  }

  dispose(): void {
    this.apiKey = "";
  }

  private buildHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "x-api-key": this.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    };
  }

  private buildPayload(options: ChatCompletionOptions): AnthropicRequestPayload {
    const { system, rest } = extractSystemMessage(options.messages);
    return {
      model: options.model,
      max_tokens: options.maxTokens ?? MAX_TOKENS_FALLBACK,
      ...(system ? { system } : {}),
      messages: rest.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options.temperature,
      top_p: options.topP,
      stop_sequences: options.stopSequences?.length ? options.stopSequences : undefined,
    };
  }

  private async doRequest(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const payload = this.buildPayload(options);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Anthropic API error ${response.status}: ${body || response.statusText}`);
      }

      const json = (await response.json()) as AnthropicResponse;
      return this.parseResponse(json);
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseResponse(resp: AnthropicResponse): ChatCompletionResult {
    const textContent = resp.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    return {
      id: resp.id,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: resp.model,
      content: textContent,
      usage: parseAnthropicUsage(resp.usage),
      finishReason: mapFinishReason(resp.stop_reason),
    };
  }

  private async processSSEStream(
    body: ReadableStream<Uint8Array>,
    model: string,
    onChunk: StreamCallback,
  ): Promise<ChatCompletionResult> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let id = "";
    let fullContent = "";
    let finishReason: StreamChunk["finishReason"] = null;
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;
          if (!trimmed.startsWith("data:")) continue;

          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data) as {
              type: string;
              index?: number;
              message?: { id?: string };
              delta?: { type: string; text?: string };
              usage?: { output_tokens: number };
              message_stop?: boolean;
              content_block_delta?: { index: number; delta: { type: string; text?: string } };
              message_delta?: { delta: { stop_reason: string }; usage: { output_tokens: number } };
            };

            if (parsed.type === "message_start" && parsed.message) {
              id = parsed.message.id ?? id;
            }

            if (
              parsed.type === "content_block_delta" &&
              parsed.content_block_delta?.delta?.type === "text_delta"
            ) {
              const text = parsed.content_block_delta.delta.text ?? "";
              fullContent += text;

              onChunk({
                id,
                object: "chat.completion.chunk",
                created: Math.floor(Date.now() / 1000),
                model,
                content: text,
                finishReason: null,
              });
            }

            if (parsed.type === "message_delta" && parsed.message_delta) {
              finishReason = mapFinishReason(parsed.message_delta.delta.stop_reason);
              if (parsed.message_delta.usage) {
                outputTokens = parsed.message_delta.usage.output_tokens;
              }
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      id,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model,
      content: fullContent,
      usage: {
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
      finishReason: finishReason ?? "stop",
    };
  }
}

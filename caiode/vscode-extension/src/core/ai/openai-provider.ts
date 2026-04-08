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
const OPENAI_DEFAULT_BASE = "https://api.openai.com/v1";
const OPENAI_SUPPORTED_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "gpt-4",
  "gpt-3.5-turbo",
] as const;

interface OpenAIRequestPayload {
  model: string;
  messages: Array<{
    role: string;
    content: string;
    name?: string;
    tool_call_id?: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stop?: string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  stream?: boolean;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string | null };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

function buildPayload(options: ChatCompletionOptions): OpenAIRequestPayload {
  return {
    model: options.model,
    messages: options.messages.map((m) => ({
      role: m.role,
      content: m.content,
      ...(m.name ? { name: m.name } : {}),
      ...(m.toolCallId ? { tool_call_id: m.toolCallId } : {}),
    })),
    temperature: options.temperature,
    max_tokens: options.maxTokens,
    top_p: options.topP,
    stop: options.stopSequences?.length ? options.stopSequences : undefined,
    presence_penalty: options.presencePenalty,
    frequency_penalty: options.frequencyPenalty,
  };
}

function parseResponse(resp: OpenAIResponse): ChatCompletionResult {
  const choice = resp.choices[0];
  return {
    id: resp.id,
    object: resp.object as ChatCompletionResult["object"],
    created: resp.created,
    model: resp.model,
    content: choice.message.content ?? "",
    usage: {
      promptTokens: resp.usage.prompt_tokens,
      completionTokens: resp.usage.completion_tokens,
      totalTokens: resp.usage.total_tokens,
    },
    finishReason: choice.finish_reason as ChatCompletionResult["finishReason"],
  };
}

function parseUsage(raw?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }): TokenUsage | undefined {
  if (!raw) return undefined;
  return {
    promptTokens: raw.prompt_tokens,
    completionTokens: raw.completion_tokens,
    totalTokens: raw.total_tokens,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class OpenAIProvider implements LLMProvider {
  readonly providerName = "openai";
  readonly supportedModels = [...OPENAI_SUPPORTED_MODELS];

  private apiKey: string;
  private baseUrl: string;
  private timeoutMs: number;
  private maxRetries: number;
  private organization?: string;

  constructor(config: LLMProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? OPENAI_DEFAULT_BASE).replace(/\/+$/, "");
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.organization = config.organization;
  }

  async chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.doRequest(buildPayload(options));
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const isRetryable =
          lastError.message.includes("429") ||
          lastError.message.includes("500") ||
          lastError.message.includes("502") ||
          lastError.message.includes("503") ||
          lastError.name === "AbortError" === false;
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
    const payload = buildPayload({ ...options });
    payload.stream = true;

    const controller = new AbortController();
    const effectiveSignal = signal ?? controller.signal;
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
        signal: effectiveSignal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(
          `OpenAI API error ${response.status}: ${body || response.statusText}`,
        );
      }

      if (!response.body) {
        throw new Error("OpenAI API returned no stream body");
      }

      return await this.processSSEStream(response.body, onChunk);
    } finally {
      clearTimeout(timeout);
    }
  }

  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/models`, {
      method: "GET",
      headers: this.buildHeaders(),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`OpenAI list models failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      data: Array<{ id: string }>;
    };
    return data.data.map((m) => m.id);
  }

  dispose(): void {
    this.apiKey = "";
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };
    if (this.organization) {
      headers["OpenAI-Organization"] = this.organization;
    }
    return headers;
  }

  private async doRequest(payload: OpenAIRequestPayload): Promise<ChatCompletionResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(
          `OpenAI API error ${response.status}: ${body || response.statusText}`,
        );
      }

      const json = (await response.json()) as OpenAIResponse;
      return parseResponse(json);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async processSSEStream(
    body: ReadableStream<Uint8Array>,
    onChunk: StreamCallback,
  ): Promise<ChatCompletionResult> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let id = "";
    let created = 0;
    let model = options.model;
    let fullContent = "";
    let finishReason: StreamChunk["finishReason"] = null;
    let usage: TokenUsage | undefined;

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
              id?: string;
              created?: number;
              model?: string;
              choices: Array<{
                delta: { role?: string; content?: string };
                finish_reason: string | null;
              }>;
              usage?: TokenUsage;
            };

            id = parsed.id ?? id;
            created = parsed.created ?? created;
            model = parsed.model ?? model;

            const choice = parsed.choices?.[0];
            if (choice) {
              const deltaContent = choice.delta?.content ?? "";
              fullContent += deltaContent;
              finishReason = choice.finish_reason as StreamChunk["finishReason"];

              onChunk({
                id,
                object: "chat.completion.chunk",
                created,
                model,
                content: deltaContent,
                finishReason: null,
              });
            }
            if (parsed.usage) {
              usage = parseUsage(parsed.usage);
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
      created,
      model,
      content: fullContent,
      usage: usage ?? { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      finishReason: finishReason ?? "stop",
    };
  }
}

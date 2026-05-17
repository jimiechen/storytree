import type {
  ChatCompletionOptions,
  ChatCompletionResult,
  LLMProvider,
  StreamCallback,
  StreamChunk,
} from "./types";

export interface StreamProcessorConfig {
  provider: LLMProvider;
  onChunk: StreamCallback;
  signal?: AbortSignal;
}

interface AccumulatedState {
  id: string;
  model: string;
  created: number;
  content: string;
  finishReason: StreamChunk["finishReason"];
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  chunkCount: number;
  startTime: number;
}

function createInitialState(model: string): AccumulatedState {
  return {
    id: "",
    model,
    created: Math.floor(Date.now() / 1000),
    content: "",
    finishReason: null,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    chunkCount: 0,
    startTime: Date.now(),
  };
}

function stateToResult(state: AccumulatedState): ChatCompletionResult {
  return {
    id: state.id || `stream-${Date.now()}`,
    object: "chat.completion",
    created: state.created,
    model: state.model,
    content: state.content,
    usage: {
      promptTokens: state.promptTokens,
      completionTokens: state.completionTokens,
      totalTokens: state.totalTokens || state.promptTokens + state.completionTokens,
    },
    finishReason: state.finishReason ?? "stop",
  };
}

export class StreamProcessor {
  private config: StreamProcessorConfig;
  private state: AccumulatedState;
  private aborted = false;

  constructor(config: StreamProcessorConfig, options?: { model?: string }) {
    this.config = config;
    this.state = createInitialState(options?.model ?? "unknown");
  }

  async process(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    this.aborted = false;
    this.state = createInitialState(options.model);

    const controller = new AbortController();
    const effectiveSignal = this.config.signal ?? controller.signal;

    if (effectiveSignal.aborted) {
      return stateToResult(this.state);
    }

    effectiveSignal.addEventListener("abort", () => {
      this.aborted = true;
    });

    try {
      const result = await this.config.provider.streamChatCompletion(
        options,
        (chunk) => this.accumulate(chunk),
        effectiveSignal,
      );

      if (!this.aborted) {
        this.mergeFinalResult(result);
      }
      return stateToResult(this.state);
    } catch (err) {
      if (this.aborted || (err instanceof Error && err.name === "AbortError")) {
        return stateToResult(this.state);
      }
      throw err;
    }
  }

  get stats(): {
    chunkCount: number;
    contentLength: number;
    elapsedMs: number;
    tokensPerSecond: number;
  } {
    const elapsed = Date.now() - this.state.startTime;
    return {
      chunkCount: this.state.chunkCount,
      contentLength: this.state.content.length,
      elapsedMs: elapsed,
      tokensPerSecond:
        elapsed > 0 && this.state.completionTokens > 0
          ? (this.state.completionTokens / elapsed) * 1000
          : 0,
    };
  }

  get isAborted(): boolean {
    return this.aborted;
  }

  abort(): void {
    this.aborted = true;
  }

  private accumulate(chunk: StreamChunk): void {
    if (this.aborted) return;

    this.state.chunkCount++;
    if (chunk.id) this.state.id = chunk.id;
    if (chunk.model) this.state.model = chunk.model;
    if (chunk.content) this.state.content += chunk.content;
    if (chunk.finishReason) this.state.finishReason = chunk.finishReason;
    if (chunk.usage) {
      this.state.promptTokens = chunk.usage.promptTokens;
      this.state.completionTokens = chunk.usage.completionTokens;
      this.state.totalTokens = chunk.usage.totalTokens;
    }

    this.config.onChunk(chunk);
  }

  private mergeFinalResult(result: ChatCompletionResult): void {
    if (result.id) this.state.id = result.id;
    if (result.model) this.state.model = result.model;
    if (result.content && !this.state.content) {
      this.state.content = result.content;
    }
    if (result.finishReason) this.state.finishReason = result.finishReason;
    if (result.usage) {
      this.state.promptTokens = result.usage.promptTokens;
      this.state.completionTokens = result.usage.completionTokens;
      this.state.totalTokens = result.usage.totalTokens;
    }
  }
}

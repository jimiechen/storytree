export type MessageRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: MessageRole;
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
  presencePenalty?: number;
  frequencyPenalty?: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatCompletionResult {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  content: string;
  usage: TokenUsage;
  finishReason: "stop" | "length" | "tool_calls" | "content_filter";
}

export interface StreamChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  content: string;
  finishReason: "stop" | "length" | "tool_calls" | "content_filter" | null;
  usage?: TokenUsage;
}

export type StreamCallback = (chunk: StreamChunk) => void;

export interface LLMProviderConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel: string;
  timeoutMs?: number;
  maxRetries?: number;
  organization?: string;
}

export interface LLMProvider {
  readonly providerName: string;
  readonly supportedModels: readonly string[];

  chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResult>;

  streamChatCompletion(
    options: ChatCompletionOptions,
    onChunk: StreamCallback,
    signal?: AbortSignal,
  ): Promise<ChatCompletionResult>;

  listModels?(): Promise<string[]>;

  dispose?(): void;
}

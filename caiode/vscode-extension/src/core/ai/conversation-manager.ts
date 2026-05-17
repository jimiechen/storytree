import type { ChatMessage, MessageRole } from "./types";

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  tokenCount?: number;
}

export interface Conversation {
  id: string;
  projectId: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, string>;
}

export type TruncationStrategy = "sliding_window" | "summary" | "none";

export interface ConversationManagerConfig {
  maxContextTokens: number;
  maxMessagesBeforeTruncate: number;
  defaultTruncationStrategy: TruncationStrategy;
  estimateTokens: (text: string) => number;
  generateSummary?: (messages: ConversationMessage[]) => Promise<string>;
}

const DEFAULT_CONFIG: ConversationManagerConfig = {
  maxContextTokens: 128_000,
  maxMessagesBeforeTruncate: 50,
  defaultTruncationStrategy: "sliding_window",
  estimateTokens: (text) => Math.ceil(text.length / 4),
};

function generateId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function messageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class ConversationManager {
  private conversations: Map<string, Conversation> = new Map();
  private config: ConversationManagerConfig;

  constructor(config: Partial<ConversationManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  create(projectId: string, title?: string): Conversation {
    const conv: Conversation = {
      id: generateId(),
      projectId,
      title: title || `Conversation ${new Date().toLocaleString()}`,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {},
    };
    this.conversations.set(conv.id, conv);
    return conv;
  }

  get(conversationId: string): Conversation | undefined {
    return this.conversations.get(conversationId);
  }

  listByProject(projectId: string): Conversation[] {
    return Array.from(this.conversations.values())
      .filter((c) => c.projectId === projectId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  delete(conversationId: string): boolean {
    return this.conversations.delete(conversationId);
  }

  addMessage(
    conversationId: string,
    role: MessageRole,
    content: string,
  ): ConversationMessage | null {
    const conv = this.conversations.get(conversationId);
    if (!conv) return null;

    const message: ConversationMessage = {
      id: messageId(),
      role,
      content,
      timestamp: Date.now(),
      tokenCount: this.config.estimateTokens(content),
    };

    conv.messages.push(message);
    conv.updatedAt = Date.now();

    this.maybeTruncate(conv);

    return message;
  }

  getContext(
    conversationId: string,
    systemPrompt?: string,
  ): ChatMessage[] {
    const conv = this.conversations.get(conversationId);
    if (!conv) return [];

    const result: ChatMessage[] = [];
    if (systemPrompt) {
      result.push({ role: "system", content: systemPrompt });
    }

    for (const msg of conv.messages) {
      result.push({ role: msg.role, content: msg.content });
    }

    return result;
  }

  getTokenCount(conversationId: string): number {
    const conv = this.conversations.get(conversationId);
    if (!conv) return 0;
    return conv.messages.reduce((sum, m) => sum + (m.tokenCount ?? 0), 0);
  }

  getMessageCount(conversationId: string): number {
    return this.conversations.get(conversationId)?.messages.length ?? 0;
  }

  clearMessages(conversationId: string): boolean {
    const conv = this.conversations.get(conversationId);
    if (!conv) return false;
    conv.messages = [];
    conv.updatedAt = Date.now();
    return true;
  }

  updateMetadata(conversationId: string, key: string, value: string): boolean {
    const conv = this.conversations.get(conversationId);
    if (!conv) return false;
    conv.metadata[key] = value;
    conv.updatedAt = Date.now();
    return true;
  }

  rename(conversationId: string, title: string): boolean {
    const conv = this.conversations.get(conversationId);
    if (!conv) return false;
    conv.title = title;
    conv.updatedAt = Date.now();
    return true;
  }

  getAllConversations(): Conversation[] {
    return Array.from(this.conversations.values());
  }

  toSerializable(): Array<{
    id: string;
    projectId: string;
    title: string;
    messages: ConversationMessage[];
    createdAt: number;
    updatedAt: number;
    metadata: Record<string, string>;
  }> {
    return Array.from(this.conversations.values()).map((c) => ({
      id: c.id,
      projectId: c.projectId,
      title: c.title,
      messages: c.messages,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      metadata: c.metadata,
    }));
  }

  fromSerializable(data: Array<{
    id: string;
    projectId: string;
    title: string;
    messages: ConversationMessage[];
    createdAt: number;
    updatedAt: number;
    metadata: Record<string, string>;
  }>): void {
    this.conversations.clear();
    for (const item of data) {
      this.conversations.set(item.id, { ...item });
    }
  }

  private maybeTruncate(conv: Conversation): void {
    const strategy = this.config.defaultTruncationStrategy;
    if (strategy === "none") return;

    const tokenCount = this.getTokenCount(conv.id);
    if (tokenCount <= this.config.maxContextTokens && conv.messages.length <= this.config.maxMessagesBeforeTruncate) {
      return;
    }

    switch (strategy) {
      case "sliding_window":
        this.truncateSlidingWindow(conv);
        break;
      case "summary":
        this.truncateWithSummary(conv);
        break;
    }
  }

  private truncateSlidingWindow(conv: Conversation): void {
    const maxMsgs = Math.max(10, Math.floor(this.config.maxMessagesBeforeTruncate / 2));
    while (conv.messages.length > maxMsgs) {
      conv.messages.shift();
    }
  }

  private truncateWithSummary(conv: Conversation): void {
    if (!this.config.generateSummary) {
      this.truncateSlidingWindow(conv);
      return;
    }

    const keepCount = 4;
    if (conv.messages.length <= keepCount) return;

    const toSummarize = conv.messages.slice(0, -keepCount);
    this.config.generateSummary(toSummarize).then((summary) => {
      const summaryMsg: ConversationMessage = {
        id: messageId(),
        role: "assistant",
        content: `[Previous conversation summary]: ${summary}`,
        timestamp: Date.now(),
        tokenCount: this.config.estimateTokens(summary),
      };

      conv.messages = [...conv.messages.slice(-keepCount)];
      conv.messages.unshift(summaryMsg);
      conv.updatedAt = Date.now();
    }).catch(() => {
      this.truncateSlidingWindow(conv);
    });
  }
}

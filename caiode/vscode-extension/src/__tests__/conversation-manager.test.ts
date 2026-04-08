import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConversationManager } from "../core/ai/conversation-manager";

const simpleTokenEstimator = (text: string) => Math.ceil(text.length / 4);

function createManager(overrides?: Partial<ConstructorParameters<typeof ConversationManager>[0]>) {
  return new ConversationManager({
    estimateTokens: simpleTokenEstimator,
    ...overrides,
  });
}

describe("ConversationManager", () => {
  let manager: ConversationManager;

  beforeEach(() => {
    manager = createManager();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("create", () => {
    it("should create a new conversation with unique ID", () => {
      const conv1 = manager.create("proj-1");
      const conv2 = manager.create("proj-1");
      expect(conv1.id).not.toBe(conv2.id);
      expect(conv1.projectId).toBe("proj-1");
    });

    it("should set default title when not provided", () => {
      const conv = manager.create("proj-1");
      expect(conv.title).toContain("Conversation");
    });

    it("should use provided title", () => {
      const conv = manager.create("proj-1", "My Chat");
      expect(conv.title).toBe("My Chat");
    });

    it("should start with empty messages array", () => {
      const conv = manager.create("proj-1");
      expect(conv.messages).toEqual([]);
    });

    it("should set createdAt and updatedAt to current time", () => {
      const before = Date.now();
      const conv = manager.create("proj-1");
      expect(conv.createdAt).toBeGreaterThanOrEqual(before);
      expect(conv.updatedAt).toBeGreaterThanOrEqual(before);
    });
  });

  describe("get / delete", () => {
    it("should return conversation by ID", () => {
      const conv = manager.create("proj-1");
      expect(manager.get(conv.id)).toBe(conv);
    });

    it("should return undefined for non-existent ID", () => {
      expect(manager.get("non-existent")).toBeUndefined();
    });

    it("should delete conversation and return true", () => {
      const conv = manager.create("proj-1");
      expect(manager.delete(conv.id)).toBe(true);
      expect(manager.get(conv.id)).toBeUndefined();
    });

    it("should return false when deleting non-existent conversation", () => {
      expect(manager.delete("non-existent")).toBe(false);
    });
  });

  describe("listByProject", () => {
    it("should return conversations filtered by projectId sorted by updatedAt desc", () => {
      const c1 = manager.create("proj-a");
      const c2 = manager.create("proj-b");
      const c3 = manager.create("proj-a");

      const listA = manager.listByProject("proj-a");
      expect(listA).toHaveLength(2);
      expect(listA[0].id).toBe(c3.id); // most recent first
      expect(listA[1].id).toBe(c1.id);

      const listB = manager.listByProject("proj-b");
      expect(listB).toHaveLength(1);
      expect(listB[0].id).toBe(c2.id);
    });

    it("should return empty array for project with no conversations", () => {
      expect(manager.listByProject("no-such-proj")).toEqual([]);
    });
  });

  describe("addMessage", () => {
    it("should add message and return it", () => {
      const conv = manager.create("proj-1");
      const msg = manager.addMessage(conv.id, "user", "Hello!");
      expect(msg).not.toBeNull();
      expect(msg!.role).toBe("user");
      expect(msg!.content).toBe("Hello!");
      expect(msg!.id).toBeTruthy();
    });

    it("should increment message count in conversation", () => {
      const conv = manager.create("proj-1");
      manager.addMessage(conv.id, "user", "Hi");
      manager.addMessage(conv.id, "assistant", "Hello there!");
      expect(conv.messages).toHaveLength(2);
    });

    it("should update updatedAt timestamp on each add", () => {
      const conv = manager.create("proj-1");
      const initialUpdated = conv.updatedAt;
      vi.advanceTimersByTime(1000);
      manager.addMessage(conv.id, "user", "new msg");
      expect(conv.updatedAt).toBeGreaterThan(initialUpdated);
    });

    it("should estimate token count for each message", () => {
      const conv = manager.create("proj-1");
      const msg = manager.addMessage(conv.id, "user", "Hello World");
      expect(msg!.tokenCount).toBe(Math.ceil("Hello World".length / 4));
    });

    it("should return null for non-existent conversation", () => {
      expect(manager.addMessage("bad-id", "user", "hi")).toBeNull();
    });

    it("should accept all valid roles (system/user/assistant/tool)", () => {
      const conv = manager.create("proj-1");
      expect(manager.addMessage(conv.id, "system", "sys")).not.toBeNull();
      expect(manager.addMessage(conv.id, "user", "usr")).not.toBeNull();
      expect(manager.addMessage(conv.id, "assistant", "asst")).not.toBeNull();
      expect(manager.addMessage(conv.id, "tool", "tool")).not.toBeNull();
    });
  });

  describe("getContext", () => {
    it("should return messages as ChatMessage[] format", () => {
      const conv = manager.create("proj-1");
      manager.addMessage(conv.id, "user", "Hello");
      manager.addMessage(conv.id, "assistant", "Hi there");

      const ctx = manager.getContext(conv.id);
      expect(ctx).toHaveLength(2);
      expect(ctx[0]).toEqual({ role: "user", content: "Hello" });
      expect(ctx[1]).toEqual({ role: "assistant", content: "Hi there" });
    });

    it("should prepend system prompt when provided", () => {
      const conv = manager.create("proj-1");
      manager.addMessage(conv.id, "user", "Hello");

      const ctx = manager.getContext(conv.id, "You are helpful.");
      expect(ctx).toHaveLength(2);
      expect(ctx[0]).toEqual({ role: "system", content: "You are helpful." });
      expect(ctx[1]).toEqual({ role: "user", content: "Hello" });
    });

    it("should return empty array for non-existent conversation", () => {
      expect(manager.getContext("bad")).toEqual([]);
    });
  });

  describe("getTokenCount / getMessageCount", () => {
    it("should calculate total token count across all messages", () => {
      const conv = manager.create("proj-1");
      manager.addMessage(conv.id, "user", "Hello World"); // ~3 tokens
      manager.addMessage(conv.id, "assistant", "Hi!"); // ~1 token
      expect(manager.getTokenCount(conv.id)).toBeGreaterThan(0);
    });

    it("should return 0 for non-existent conversation", () => {
      expect(manager.getTokenCount("bad")).toBe(0);
      expect(manager.getMessageCount("bad")).toBe(0);
    });

    it("should return correct message count", () => {
      const conv = manager.create("proj-1");
      expect(manager.getMessageCount(conv.id)).toBe(0);
      manager.addMessage(conv.id, "user", "a");
      expect(manager.getMessageCount(conv.id)).toBe(1);
      manager.addMessage(conv.id, "assistant", "b");
      expect(manager.getMessageCount(conv.id)).toBe(2);
    });
  });

  describe("clearMessages", () => {
    it("should clear all messages from conversation", () => {
      const conv = manager.create("proj-1");
      manager.addMessage(conv.id, "user", "a");
      manager.addMessage(conv.id, "user", "b");
      manager.addMessage(conv.id, "user", "c");
      expect(manager.getMessageCount(conv.id)).toBe(3);

      expect(manager.clearMessages(conv.id)).toBe(true);
      expect(manager.getMessageCount(conv.id)).toBe(0);
    });

    it("should return false for non-existent conversation", () => {
      expect(manager.clearMessages("bad")).toBe(false);
    });
  });

  describe("rename / updateMetadata", () => {
    it("should rename conversation title", () => {
      const conv = manager.create("proj-1", "Old Title");
      expect(manager.rename(conv.id, "New Title")).toBe(true);
      expect(conv.title).toBe("New Title");
    });

    it("should return false when renaming non-existent conversation", () => {
      expect(manager.rename("bad", "x")).toBe(false);
    });

    it("should update metadata key-value pair", () => {
      const conv = manager.create("proj-1");
      expect(manager.updateMetadata(conv.id, "model", "gpt-4o")).toBe(true);
      expect(conv.metadata.model).toBe("gpt-4o");
    });

    it("should return false when updating metadata of non-existent conversation", () => {
      expect(manager.updateMetadata("bad", "k", "v")).toBe(false);
    });
  });

  describe("getAllConversations", () => {
    it("should return all conversations", () => {
      manager.create("p1");
      manager.create("p2");
      manager.create("p1");
      expect(manager.getAllConversations()).toHaveLength(3);
    });
  });

  describe("Serialization", () => {
    it("should serialize all conversations to plain objects", () => {
      const conv = manager.create("proj-1", "Test Conv");
      manager.addMessage(conv.id, "user", "hello");
      manager.updateMetadata(conv.id, "key", "val");

      const serialized = manager.toSerializable();
      expect(serialized).toHaveLength(1);
      expect(serialized[0].id).toBe(conv.id);
      expect(serialized[0].messages).toHaveLength(1);
      expect(serialized[0].metadata.key).toBe("val");
    });

    it("should restore conversations from serialized data", () => {
      const conv = manager.create("proj-1", "Original");
      manager.addMessage(conv.id, "user", "msg1");

      const serialized = manager.toSerializable();
      const manager2 = new ConversationManager({ estimateTokens: simpleTokenEstimator });
      manager2.fromSerializable(serialized);

      expect(manager2.getAllConversations()).toHaveLength(1);
      const restored = manager2.get(conv.id)!;
      expect(restored.title).toBe("Original");
      expect(restored.messages).toHaveLength(1);
      expect(restored.messages[0].content).toBe("msg1");
    });

    it("fromSerializable should clear existing data first", () => {
      manager.create("p1", "old");
      const freshData = [{ id: "c-new", projectId: "p2", title: "New", messages: [], createdAt: Date.now(), updatedAt: Date.now(), metadata: {} }];
      manager.fromSerializable(freshData as Parameters<ConversationManager["fromSerializable"]>[0]);
      expect(manager.getAllConversations()).toHaveLength(1);
      expect(manager.get("c-new")?.title).toBe("New");
    });
  });

  describe("Truncation - Sliding Window", () => {
    it("should truncate messages when exceeding maxMessagesBeforeTruncate", () => {
      const mgr = createManager({
        maxMessagesBeforeTruncate: 10,
        defaultTruncationStrategy: "sliding_window",
        maxContextTokens: 100_000,
      });
      const conv = mgr.create("proj-1");

      for (let i = 0; i < 15; i++) {
        mgr.addMessage(conv.id, "user", `message ${i}`);
      }

      expect(mgr.getMessageCount(conv.id)).toBeLessThanOrEqual(10);
    });

    it("should keep recent messages when truncating", () => {
      const mgr = createManager({
        maxMessagesBeforeTruncate: 6,
        defaultTruncationStrategy: "sliding_window",
        maxContextTokens: 100_000,
      });
      const conv = mgr.create("proj-1");

      for (let i = 0; i < 12; i++) {
        mgr.addMessage(conv.id, "user", `msg-${i}`);
      }

      const messages = mgr.get(conv.id)!.messages;
      const lastMsg = messages[messages.length - 1];
      expect(lastMsg.content).toBe("msg-11");
    });

    it("should not truncate when strategy is 'none'", () => {
      const mgr = createManager({
        maxMessagesBeforeTruncate: 5,
        defaultTruncationStrategy: "none",
        maxContextTokens: 100,
      });
      const conv = mgr.create("proj-1");

      for (let i = 0; i < 20; i++) {
        mgr.addMessage(conv.id, "user", `m${i}`);
      }
      expect(mgr.getMessageCount(conv.id)).toBe(20);
    });
  });

  describe("Truncation - Summary Strategy", () => {
    it("should call generateSummary callback when strategy is summary", async () => {
      const summarizeFn = vi.fn().mockResolvedValue("Summary of earlier chat.");
      const mgr = createManager({
        maxMessagesBeforeTruncate: 6,
        defaultTruncationStrategy: "summary",
        generateSummary: summarizeFn,
        maxContextTokens: 100_000,
      });
      const conv = mgr.create("proj-1");

      for (let i = 0; i < 10; i++) {
        mgr.addMessage(conv.id, "user", `message ${i} with some extra text`);
      }

      await vi.runAllTimersAsync();

      expect(summarizeFn).toHaveBeenCalled();
    });

    it("should fall back to sliding window when generateSummary is not set", () => {
      const mgr = createManager({
        maxMessagesBeforeTruncate: 5,
        defaultTruncationStrategy: "summary",
        maxContextTokens: 100_000,
      });
      const conv = mgr.create("proj-1");

      for (let i = 0; i < 15; i++) {
        mgr.addMessage(conv.id, "user", `m${i}`);
      }
      expect(mgr.getMessageCount(conv.id)).toBeLessThanOrEqual(10);
    });

    it("should fall back to sliding window when generateSummary throws", async () => {
      const badSummarize = vi.fn().mockRejectedValue(new Error("LLM error"));
      const mgr = createManager({
        maxMessagesBeforeTruncate: 5,
        defaultTruncationStrategy: "summary",
        generateSummary: badSummarize,
        maxContextTokens: 100_000,
      });
      const conv = mgr.create("proj-1");

      for (let i = 0; i < 15; i++) {
        mgr.addMessage(conv.id, "user", `m${i}`);
      }
      await vi.runAllTimersAsync();
      expect(mgr.getMessageCount(conv.id)).toBeLessThanOrEqual(10);
    });
  });
});

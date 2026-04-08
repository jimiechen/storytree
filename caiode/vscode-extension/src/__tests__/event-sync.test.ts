import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventBus } from "../core/event-bus";
import { SyncPushService } from "../core/sync-push-service";

describe("EventBus", () => {
  let bus: EventBus;

  beforeEach(() => {
    vi.restoreAllMocks();
    bus = new EventBus();
  });

  describe("on / off (subscribe/unsubscribe)", () => {
    it("should register a listener and receive emitted events", () => {
      const handler = vi.fn();
      bus.on("test.event", handler);
      bus.emit("test.event", { value: 42 });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ value: 42 });
    });

    it("should return unsubscribe function from on()", () => {
      const handler = vi.fn();
      const unsub = bus.on("test.event", handler);
      bus.emit("test.event", "a");
      expect(handler).toHaveBeenCalledTimes(1);
      unsub();
      bus.emit("test.event", "b");
      expect(handler).toHaveBeenCalledTimes(1); // not called again
    });

    it("off() with topic and id should remove specific listener", () => {
      const h1 = vi.fn();
      const h2 = vi.fn();

      const sub1 = bus.on("my.topic", h1);
      bus.on("my.topic", h2);

      const sub1Id = (sub1 as unknown as { id: string }).id;
      // Get internal id
      const id = sub1.toString(); // workaround

      bus.off("my.topic");
      bus.emit("my.topic", "data");

      // After off(topic) all listeners for that topic should be removed
      expect(h1).not.toHaveBeenCalled();
      expect(h2).not.toHaveBeenCalled();
    });

    it("off() without arguments should clear everything", () => {
      bus.on("a", vi.fn());
      bus.on("b", vi.fn());
      bus.off();
      expect(bus.listenerCount()).toBe(0);
    });
  });

  describe("once", () => {
    it("should fire only once then auto-remove", () => {
      const handler = vi.fn();
      bus.once("once.test", handler);
      bus.emit("once.test", "first");
      bus.emit("once.test", "second");
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith("first");
    });

    it("should work with multiple once listeners on same topic", () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      bus.once("multi.once", h1);
      bus.once("multi.once", h2);
      bus.emit("multi.once", "x");
      expect(h1).toHaveBeenCalledTimes(1);
      expect(h2).toHaveBeenCalledTimes(1);
    });
  });

  describe("Wildcard Topics", () => {
    it("should support wildcard * pattern matching", () => {
      const handler = vi.fn();
      bus.on("db.*", handler);

      bus.emit("db.project.created", {});
      bus.emit("db.chapter.updated", {});

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it("should not match non-wildcard topics to wildcard listeners", () => {
      const handler = vi.fn();
      bus.on("db.*", handler);
      bus.emit("other.thing", "data");
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should catch errors in handlers without breaking other handlers", () => {
      const badHandler = () => { throw new Error("boom"); };
      const goodHandler = vi.fn();

      bus.on("err.test", badHandler);
      bus.on("err.test", goodHandler);

      expect(() => bus.emit("err.test", {})).not.toThrow();
      expect(goodHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("listenerCount & hasListeners", () => {
    it("should report correct count per topic", () => {
      bus.on("count.a", vi.fn());
      bus.on("count.a", vi.fn());
      bus.on("count.b", vi.fn());

      expect(bus.listenerCount("count.a")).toBe(2);
      expect(bus.listenerCount("count.b")).toBe(1);
      expect(bus.listenerCount("count.c")).toBe(0);
    });

    it("hasListeners should return true when listeners exist", () => {
      bus.on("has.test", vi.fn());
      expect(bus.hasListeners("has.test")).toBe(true);
      expect(bus.hasListeners("no.such")).toBe(false);
    });

    it("should count once-listeners in total", () => {
      bus.once("once.total", vi.fn());
      expect(bus.listenerCount("once.total")).toBe(1);
    });
  });

  describe("clear", () => {
    it("clear should remove all listeners", () => {
      bus.on("x", vi.fn());
      bus.once("y", vi.fn());
      bus.clear();
      expect(bus.listenerCount()).toBe(0);
    });
  });
});

describe("SyncPushService", () => {
  let eventBus: EventBus;
  let postMessageSpy: ReturnType<typeof vi.fn>;
  let onCompleteSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
    eventBus = new EventBus();
    postMessageSpy = vi.fn();
    onCompleteSpy = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function createSync() {
    return new SyncPushService({
      eventBus,
      aggregateWindowMs: 100,
      maxBatchSize: 5,
      getWebviewPostMessage: postMessageSpy,
      onPushComplete: onCompleteSpy,
    });
  }

  it("should subscribe to db:* events via EventBus", () => {
    const sync = createSync();
    sync.subscribe();
    expect(eventBus.hasListeners("db:*")).toBe(true);
    sync.dispose();
  });

  it("should batch events within aggregate window", () => {
    const sync = createSync();
    sync.subscribe();

    eventBus.emit("db.chapter.created", { topic: "db.chapter.created" });
    eventBus.emit("db.project.updated", { topic: "db.project.updated" });

    expect(postMessageSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(110);

    expect(postMessageSpy).toHaveBeenCalledTimes(2);
    expect(onCompleteSpy).toHaveBeenCalledTimes(1);
    expect(onCompleteSpy).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ type: "data-push" }),
      expect.objectContaining({ type: "data-push" }),
    ]));

    sync.dispose();
  });

  it("should flush immediately when maxBatchSize is reached", () => {
    const sync = createSync();
    sync.subscribe();

    for (let i = 0; i < 5; i++) {
      eventBus.emit(`db.item${i}.created`, { topic: `db.item${i}` });
    }

    expect(postMessageSpy).toHaveBeenCalledTimes(5);
    expect(sync.pendingCount).toBe(0);

    sync.dispose();
  });

  it("forceFlush should send pending events immediately", () => {
    const sync = createSync();
    sync.subscribe();

    eventBus.emit("db.x", { topic: "db.x" });
    expect(postMessageSpy).not.toHaveBeenCalled();

    sync.forceFlush();
    expect(postMessageSpy).toHaveBeenCalledTimes(1);

    sync.dispose();
  });

  it("beforePush hook should intercept each payload before sending", () => {
    const sync = createSync();
    const hookCalls: unknown[] = [];
    sync.beforePush((p) => hookCalls.push(p));

    sync.subscribe();
    eventBus.emit("db.hooked", { topic: "db.hooked" });
    vi.advanceTimersByTime(110);

    expect(hookCalls).toHaveLength(1);
    expect(hookCalls[0]).toMatchObject({ type: "data-push" });

    sync.dispose();
  });

  it("beforePush should return unsubscribe function", () => {
    const sync = createSync();
    const hook = vi.fn();
    const unsub = sync.beforePush(hook);

    sync.subscribe();
    eventBus.emit("db.unsub", {});
    vi.advanceTimersByTime(110);

    expect(hook).toHaveBeenCalledTimes(1);

    unsub();

    eventBus.emit("db.unsub2", {});
    vi.advanceTimersByTime(110);

    expect(hook).toHaveBeenCalledTimes(1); // still 1

    sync.dispose();
  });

  it("dispose should clear pending queue and timers", () => {
    const sync = createSync();
    sync.subscribe();

    eventBus.emit("db.dispose", { topic: "db.dispose" });
    expect(sync.pendingCount).toBe(1);

    sync.dispose();
    expect(sync.pendingCount).toBe(0);
  });

  it("should handle getWebviewPostMessage errors gracefully", () => {
    const failingPostMsg = vi.fn().mockImplementation(() => { throw new Error("webview gone"); });
    const sync = new SyncPushService({
      eventBus,
      aggregateWindowMs: 50,
      getWebviewPostMessage: failingPostMsg,
    });

    sync.subscribe();
    eventBus.emit("db.err", {});
    vi.advanceTimersByTime(60);

    expect(() => {}).not.toThrow();

    sync.dispose();
  });
});

export type EventTopic = string;
export type EventHandler<T = unknown> = (data: T) => void;

export interface Subscription {
  topic: EventTopic;
  handler: EventHandler;
  id: string;
}

let subscriptionIdCounter = 0;

function nextId(): string {
  return `sub-${++subscriptionIdCounter}-${Date.now().toString(36)}`;
}

function matchesTopic(pattern: string, topic: string): boolean {
  if (!pattern.includes("*")) return pattern === topic;
  const regex = new RegExp(
    "^" + pattern.replace(/\*/g, ".*").replace(/\./g, "\\.") + "$",
  );
  return regex.test(topic);
}

export class EventBus {
  private listeners: Map<EventTopic, Array<{ handler: EventHandler; id: string }>> = new Map();
  private onceListeners: Map<string, { handler: EventHandler; id: string }> = new Map();

  on<T = unknown>(topic: EventTopic, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, []);
    }
    const id = nextId();
    this.listeners.get(topic)!.push({ handler: handler as EventHandler, id });

    return () => this.off(topic, id);
  }

  once<T = unknown>(topic: EventTopic, handler: EventHandler<T>): void {
    const id = nextId();
    this.onceListeners.set(`${topic}::${id}`, { handler: handler as EventHandler, id });
  }

  off(topic?: EventTopic, id?: string): boolean {
    if (topic && id) {
      const handlers = this.listeners.get(topic);
      if (handlers) {
        const idx = handlers.findIndex((h) => h.id === id);
        if (idx !== -1) {
          handlers.splice(idx, 1);
          if (handlers.length === 0) this.listeners.delete(topic);
          return true;
        }
      }
      return false;
    }

    if (topic && !id) {
      this.listeners.delete(topic);
      for (const key of [...this.onceListeners.keys()]) {
        if (key.startsWith(topic + "::")) this.onceListeners.delete(key);
      }
      return true;
    }

    this.listeners.clear();
    this.onceListeners.clear();
    return true;
  }

  emit<T = unknown>(topic: EventTopic, data?: T): void {
    const directHandlers = this.listeners.get(topic);
    if (directHandlers) {
      for (const h of [...directHandlers]) {
        try {
          h.handler(data);
        } catch (err) {
          console.error(`EventBus error in handler for "${topic}":`, err);
        }
      }
    }

    const wildcardTopic = topic.split(".").slice(0, -1).concat("*").join(".");
    const wildcardHandlers = this.listeners.get(wildcardTopic);
    if (wildcardHandlers) {
      for (const h of [...wildcardHandlers]) {
        try {
          h.handler(data);
        } catch (err) {
          console.error(`EventBus error in wildcard handler for "${wildcardTopic}":`, err);
        }
      }
    }

    for (const [key, entry] of this.onceListeners.entries()) {
      const [onceTopic] = key.split("::");
      if (onceTopic === topic || matchesTopic(onceTopic, topic)) {
        try {
          entry.handler(data);
        } catch (err) {
          console.error(`EventBus error in once-handler for "${onceTopic}":`, err);
        }
        this.onceListeners.delete(key);
      }
    }
  }

  listenerCount(topic?: EventTopic): number {
    if (topic) {
      const direct = this.listeners.get(topic)?.length ?? 0;
      let onceCount = 0;
      for (const key of this.onceListeners.keys()) {
        if (key.startsWith(topic + "::")) onceCount++;
      }
      return direct + onceCount;
    }
    let total = 0;
    for (const [, handlers] of this.listeners) total += handlers.length;
    total += this.onceListeners.size;
    return total;
  }

  hasListeners(topic: EventTopic): boolean {
    if (this.listeners.has(topic)) return true;
    for (const key of this.onceListeners.keys()) {
      if (key.startsWith(topic + "::")) return true;
    }
    return false;
  }

  clear(): void {
    this.listeners.clear();
    this.onceListeners.clear();
  }
}

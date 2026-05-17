import type { EventBus } from "./event-bus";

export interface DataPushPayload {
  type: string;
  data?: unknown;
  timestamp: number;
  source?: string;
}

export type PushTarget = "webview" | "sidebar" | "all";

export interface SyncPushConfig {
  eventBus: EventBus;
  aggregateWindowMs?: number;
  maxBatchSize?: number;
  getWebviewPostMessage?: (message: Record<string, unknown>) => void;
  onPushComplete?: (payloads: DataPushPayload[]) => void;
}

export class SyncPushService {
  private config: SyncPushConfig;
  private pendingQueue: DataPushPayload[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private _onBeforePush = new Array<(payload: DataPushPayload) => void>();

  constructor(config: SyncPushConfig) {
    this.config = {
      ...config,
      aggregateWindowMs: config.aggregateWindowMs ?? 100,
      maxBatchSize: config.maxBatchSize ?? 50,
    };
  }

  subscribe(): void {
    this.config.eventBus.on("db:*", (data) => {
      const topic = (data as { topic?: string })?.topic || "db.unknown";
      this.enqueue({
        type: `data-push`,
        data,
        timestamp: Date.now(),
        source: "database",
      });
    });
  }

  private enqueue(payload: DataPushPayload): void {
    for (const hook of this._onBeforePush) {
      hook(payload);
    }

    this.pendingQueue.push(payload);

    if (this.pendingQueue.length >= (this.config.maxBatchSize ?? 50)) {
      this.flush();
      return;
    }

    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.config.aggregateWindowMs);
    }
  }

  private flush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.pendingQueue.length === 0) return;

    const batch = [...this.pendingQueue];
    this.pendingQueue = [];

    if (this.config.getWebviewPostMessage) {
      for (const payload of batch) {
        try {
          this.config.getWebviewPostMessage({
            id: `push-${Date.now()}`,
            type: payload.type,
            payload: payload.data ? { ...payload, timestamp: payload.timestamp } : undefined,
          });
        } catch (err) {
          console.error("SyncPush failed to send message:", err);
        }
      }
    }

    if (this.config.onPushComplete) {
      try {
        this.config.onPushComplete(batch);
      } catch (err) {
        console.error("SyncPush onComplete callback error:", err);
      }
    }
  }

  beforePush(hook: (payload: DataPushPayload) => void): () => void {
    this._onBeforePush.push(hook);
    return () => {
      const idx = this._onBeforePush.indexOf(hook);
      if (idx !== -1) this._onBeforePush.splice(idx, 1);
    };
  }

  forceFlush(): void {
    this.flush();
  }

  get pendingCount(): number {
    return this.pendingQueue.length;
  }

  dispose(): void {
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = null;
    this.pendingQueue = [];
    this._onBeforePush = [];
  }
}

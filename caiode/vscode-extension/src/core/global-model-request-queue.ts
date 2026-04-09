import { EventEmitter } from "events";
import { FileMutex, createFileMutex } from "./file-mutex";

export interface LLMRequest {
  id: string;
  model: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  priority?: number;
  timeout?: number;
  metadata?: Record<string, any>;
}

export interface LLMResponse {
  requestId: string;
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  durationMs: number;
  timestamp: string;
}

export interface QueueStatus {
  pending: number;
  running: number;
  completed: number;
  failed: number;
  totalProcessed: number;
  averageWaitTime: number;
  averageProcessingTime: number;
}

export interface QueueRequestEntry {
  request: LLMRequest;
  priority: number;
  enqueuedAt: number;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  retries: number;
}

export interface GlobalModelRequestQueueEvents {
  "queue:enqueue": (request: LLMRequest) => void;
  "queue:start": (request: LLMRequest) => void;
  "queue:complete": (request: LLMRequest, response: LLMResponse) => void;
  "queue:fail": (request: LLMRequest, error: Error) => void;
  "queue:cancel": (request: LLMRequest) => void;
  "queue:status": (status: QueueStatus) => void;
}

export type LLMProvider = (request: LLMRequest) => Promise<LLMResponse>;

export class GlobalModelRequestQueue extends EventEmitter {
  private queue: QueueRequestEntry[] = [];
  private running: Set<string> = new Set();
  private completed: Map<string, LLMResponse> = new Map();
  private failed: Map<string, Error> = new Map();
  private provider: LLMProvider;
  private mutex: FileMutex;
  private maxConcurrent: number;
  private defaultTimeout: number;
  private maxRetries: number;
  private lockIdPrefix = "llm-queue-";

  constructor(
    provider: LLMProvider,
    options: {
      maxConcurrent?: number;
      defaultTimeout?: number;
      maxRetries?: number;
      mutex?: FileMutex;
    } = {}
  ) {
    super();
    this.provider = provider;
    this.mutex = options.mutex || createFileMutex();
    this.maxConcurrent = options.maxConcurrent || 1;
    this.defaultTimeout = options.defaultTimeout || 60000;
    this.maxRetries = options.maxRetries || 3;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => {
      if (a.status === "running" && b.status !== "running") return -1;
      if (b.status === "running" && a.status !== "running") return 1;
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.enqueuedAt - b.enqueuedAt;
    });
  }

  async enqueue(request: LLMRequest): Promise<LLMResponse> {
    const entry: QueueRequestEntry = {
      request: {
        ...request,
        id: request.id || this.generateRequestId(),
      },
      priority: request.priority || 0,
      enqueuedAt: Date.now(),
      status: "pending",
      retries: 0,
    };

    this.queue.push(entry);
    this.sortQueue();
    this.emit("queue:enqueue", entry.request);
    this.emit("queue:status", this.getQueueStatus());

    return this.processQueue();
  }

  async enqueuePriority(request: LLMRequest, priority: number): Promise<LLMResponse> {
    return this.enqueue({ ...request, priority });
  }

  private async processQueue(): Promise<LLMResponse> {
    if (this.running.size >= this.maxConcurrent) {
      return this.waitForSlot();
    }

    const entry = this.queue.find((e) => e.status === "pending");
    if (!entry) {
      return this.waitForCompletion();
    }

    return this.executeEntry(entry);
  }

  private async executeEntry(entry: QueueRequestEntry): Promise<LLMResponse> {
    const lockId = `${this.lockIdPrefix}${entry.request.id}`;
    const handle = await this.mutex.acquire(lockId);

    try {
      entry.status = "running";
      this.running.add(entry.request.id);
      this.emit("queue:start", entry.request);
      this.emit("queue:status", this.getQueueStatus());

      const timeout = entry.request.timeout || this.defaultTimeout;
      const response = await this.executeWithTimeout(entry.request, timeout);

      entry.status = "completed";
      this.completed.set(entry.request.id, response);
      this.running.delete(entry.request.id);
      this.emit("queue:complete", entry.request, response);
      this.emit("queue:status", this.getQueueStatus());

      return response;
    } catch (error) {
      return this.handleExecutionError(entry, error as Error);
    } finally {
      await this.mutex.release(handle);
      this.processNext();
    }
  }

  private async executeWithTimeout(request: LLMRequest, timeout: number): Promise<LLMResponse> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Request ${request.id} timed out after ${timeout}ms`));
      }, timeout);

      this.provider(request)
        .then((response) => {
          clearTimeout(timer);
          resolve(response);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private async handleExecutionError(entry: QueueRequestEntry, error: Error): Promise<LLMResponse> {
    entry.retries++;

    if (entry.retries < this.maxRetries) {
      entry.status = "pending";
      this.running.delete(entry.request.id);
      return this.processQueue();
    }

    entry.status = "failed";
    this.failed.set(entry.request.id, error);
    this.running.delete(entry.request.id);
    this.emit("queue:fail", entry.request, error);
    this.emit("queue:status", this.getQueueStatus());

    throw error;
  }

  private async processNext(): Promise<void> {
    if (this.running.size < this.maxConcurrent) {
      this.processQueue();
    }
  }

  private async waitForSlot(): Promise<LLMResponse> {
    return new Promise((resolve) => {
      const check = () => {
        if (this.running.size < this.maxConcurrent) {
          resolve(this.processQueue());
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  private async waitForCompletion(): Promise<LLMResponse> {
    return new Promise((resolve, reject) => {
      const check = () => {
        if (this.queue.length === 0 && this.running.size === 0) {
          reject(new Error("Queue is empty"));
        } else if (this.running.size === 0) {
          const pending = this.queue.filter((e) => e.status === "pending");
          if (pending.length === 0) {
            reject(new Error("No pending requests"));
          } else {
            resolve(this.processQueue());
          }
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  cancel(requestId: string): boolean {
    const index = this.queue.findIndex((e) => e.request.id === requestId);
    if (index === -1) {
      return false;
    }

    const entry = this.queue[index];
    if (entry.status === "running") {
      return false;
    }

    entry.status = "cancelled";
    this.queue.splice(index, 1);
    this.emit("queue:cancel", entry.request);
    this.emit("queue:status", this.getQueueStatus());
    return true;
  }

  getQueueStatus(): QueueStatus {
    const pending = this.queue.filter((e) => e.status === "pending").length;
    const running = this.running.size;
    const completed = this.completed.size;
    const failed = this.failed.size;

    const completedEntries = this.queue.filter((e) => e.status === "completed" || e.status === "failed");
    const totalProcessed = completed + failed;

    let averageWaitTime = 0;
    let averageProcessingTime = 0;

    if (completedEntries.length > 0) {
      const totalWaitTime = completedEntries.reduce((sum, e) => sum + (e.request.timeout || this.defaultTimeout), 0);
      averageWaitTime = totalWaitTime / completedEntries.length;
      averageProcessingTime = totalWaitTime / totalProcessed;
    }

    return {
      pending,
      running,
      completed,
      failed,
      totalProcessed,
      averageWaitTime,
      averageProcessingTime,
    };
  }

  getPendingRequests(): LLMRequest[] {
    return this.queue.filter((e) => e.status === "pending").map((e) => e.request);
  }

  getResponse(requestId: string): LLMResponse | undefined {
    return this.completed.get(requestId);
  }

  clear(): void {
    this.queue = [];
    this.running.clear();
    this.completed.clear();
    this.failed.clear();
    this.emit("queue:status", this.getQueueStatus());
  }
}

export function createGlobalModelRequestQueue(provider: LLMProvider, options?: {
  maxConcurrent?: number;
  defaultTimeout?: number;
  maxRetries?: number;
  mutex?: FileMutex;
}): GlobalModelRequestQueue {
  return new GlobalModelRequestQueue(provider, options);
}
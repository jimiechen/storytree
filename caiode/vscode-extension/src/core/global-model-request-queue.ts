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
    this.maxConcurrent = options.maxConcurrent ?? 1;
    this.defaultTimeout = options.defaultTimeout ?? 60000;
    this.maxRetries = options.maxRetries ?? 3;
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

    // 统一使用executeEntry处理，它会自动处理串行逻辑
    return this.executeEntry(entry);
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
      if (this.queue.length === 0 && this.running.size === 0) {
        return Promise.reject(new Error("Queue is empty"));
      }
      return this.waitForCompletion();
    }

    return this.executeEntry(entry);
  }

  private globalLockQueue: (() => void)[] = [];
  private isLocked = false;

  private async acquireGlobalLock(): Promise<void> {
    if (!this.isLocked) {
      this.isLocked = true;
      return;
    }
    
    return new Promise((resolve) => {
      this.globalLockQueue.push(resolve);
    });
  }

  private releaseGlobalLock(): void {
    if (this.globalLockQueue.length > 0) {
      const next = this.globalLockQueue.shift();
      next?.();
    } else {
      this.isLocked = false;
    }
  }

  private async executeEntry(entry: QueueRequestEntry): Promise<LLMResponse> {
    // 获取全局锁确保串行执行
    await this.acquireGlobalLock();

    // 从队列中选择优先级最高的pending请求
    const pendingEntries = this.queue.filter(e => e.status === "pending");
    if (pendingEntries.length === 0) {
      this.releaseGlobalLock();
      return Promise.reject(new Error("No pending requests"));
    }
    
    // 按优先级排序（高优先级在前）
    pendingEntries.sort((a, b) => b.priority - a.priority);
    const selectedEntry = pendingEntries[0];

    const lockId = `${this.lockIdPrefix}${selectedEntry.request.id}`;
    const handle = await this.mutex.acquire(lockId);

    try {
      selectedEntry.status = "running";
      this.running.add(selectedEntry.request.id);
      this.emit("queue:start", selectedEntry.request);
      this.emit("queue:status", this.getQueueStatus());

      const timeout = selectedEntry.request.timeout || this.defaultTimeout;
      const response = await this.executeWithTimeout(selectedEntry.request, timeout);

      selectedEntry.status = "completed";
      this.completed.set(selectedEntry.request.id, response);
      this.running.delete(selectedEntry.request.id);
      this.emit("queue:complete", selectedEntry.request, response);
      this.emit("queue:status", this.getQueueStatus());

      return response;
    } catch (error) {
      return this.handleExecutionError(selectedEntry, error as Error, handle);
    } finally {
      // 只有在成功时才释放锁（错误情况在handleExecutionError中处理）
      if (selectedEntry.status === "completed") {
        await this.mutex.release(handle);
      }
      this.releaseGlobalLock();
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

  private async handleExecutionError(entry: QueueRequestEntry, error: Error, lockHandle?: LockHandle): Promise<LLMResponse> {
    entry.retries++;

    if (entry.retries <= this.maxRetries) {
      entry.status = "pending";
      this.running.delete(entry.request.id);
      // 释放锁后再重试
      if (lockHandle) {
        await this.mutex.release(lockHandle);
      }
      // 释放全局锁，让其他请求可以执行
      this.releaseGlobalLock();
      // 重新排队这个entry
      return this.executeEntry(entry);
    }

    entry.status = "failed";
    this.failed.set(entry.request.id, error);
    this.running.delete(entry.request.id);
    this.emit("queue:fail", entry.request, error);
    this.emit("queue:status", this.getQueueStatus());

    // 释放锁
    if (lockHandle) {
      await this.mutex.release(lockHandle);
    }

    throw error;
  }

  private isProcessing = false;

  private async processNext(): Promise<void> {
    // 防止重复处理
    if (this.isProcessing) {
      return;
    }
    
    // 只有当队列不为空且并发数未达到上限时才继续处理
    if (this.running.size < this.maxConcurrent && this.queue.length > 0) {
      this.isProcessing = true;
      try {
        await this.processQueue();
      } finally {
        this.isProcessing = false;
      }
    }
  }

  private async waitForSlot(): Promise<LLMResponse> {
    return new Promise((resolve, reject) => {
      const check = () => {
        if (this.running.size < this.maxConcurrent && !this.isProcessing) {
          this.isProcessing = true;
          this.processQueue()
            .then((result) => {
              this.isProcessing = false;
              resolve(result);
            })
            .catch((error) => {
              this.isProcessing = false;
              reject(error);
            });
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
          // 队列为空且没有运行中的请求，返回一个特殊的响应表示完成
          resolve({
            requestId: "queue-complete",
            content: "",
            model: "",
            durationMs: 0,
            timestamp: new Date().toISOString(),
          });
        } else if (this.running.size === 0) {
          const pending = this.queue.filter((e) => e.status === "pending");
          if (pending.length === 0) {
            // 没有pending请求但有队列项，等待它们完成
            setTimeout(check, 100);
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
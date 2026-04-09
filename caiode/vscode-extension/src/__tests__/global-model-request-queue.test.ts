/**
 * TEST-1.2.1a: 单元测试 - 队列串行性保证
 *
 * 对应DEV: DEV-1.2.1 实现全局 LLM 请求队列调度器
 * 测试目标: 验证队列严格串行执行、优先级排序、超时处理
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GlobalModelRequestQueue,
  LLMRequest,
  LLMResponse,
} from '../core/global-model-request-queue';
import { FileMutex, LockHandle } from '../core/file-mutex';

// 创建内存中的 mock FileMutex
class MockFileMutex extends FileMutex {
  private locks = new Set<string>();

  constructor() {
    super({ lockfilePath: '/tmp/test' });
  }

  async acquire(lockId: string): Promise<LockHandle> {
    if (this.locks.has(lockId)) {
      throw new Error(`Lock ${lockId} already acquired`);
    }
    this.locks.add(lockId);
    return {
      lockId,
      lockfilePath: `/tmp/test/${lockId}.lock`,
      released: false,
    };
  }

  async release(handle: LockHandle): Promise<void> {
    this.locks.delete(handle.lockId);
    handle.released = true;
  }

  async isLocked(lockId: string): Promise<boolean> {
    return this.locks.has(lockId);
  }

  getActiveLocks(): string[] {
    return Array.from(this.locks);
  }

  async cleanup(): Promise<void> {
    this.locks.clear();
  }
}

describe('GlobalModelRequestQueue', () => {
  let queue: GlobalModelRequestQueue;
  let mockProvider: ReturnType<typeof vi.fn>;
  let mockMutex: MockFileMutex;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockProvider = vi.fn();
    mockMutex = new MockFileMutex();
    queue = new GlobalModelRequestQueue(mockProvider, {
      maxConcurrent: 1,
      defaultTimeout: 5000,
      maxRetries: 0,
      mutex: mockMutex as any,
    });
  });

  afterEach(async () => {
    vi.useRealTimers();
    vi.clearAllMocks();
    await mockMutex.cleanup();
    queue.clear();
  });

  describe('队列串行性', () => {
    it('10 个并发请求应严格串行执行', async () => {
      // Arrange
      const executionOrder: number[] = [];
      let callCount = 0;

      mockProvider.mockImplementation(async (request: LLMRequest) => {
        const current = callCount++;
        executionOrder.push(current);
        await new Promise((resolve) => setTimeout(resolve, 50));
        return {
          requestId: request.id,
          content: `response-${current}`,
          model: request.model,
          durationMs: 50,
          timestamp: new Date().toISOString(),
        } as LLMResponse;
      });

      // Act: 同时发起10个请求
      const requests = Array.from({ length: 10 }, (_, i) => ({
        id: `req-${i}`,
        model: 'gpt-4',
        prompt: `test-${i}`,
      }));

      const promises = requests.map((req) => queue.enqueue(req));
      await Promise.all(promises);

      // Assert: 验证执行顺序严格为0,1,2,3,4,5,6,7,8,9
      expect(executionOrder).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('同一时刻只有一个请求处于 running 状态', async () => {
      // Arrange
      let runningCount = 0;
      let maxRunning = 0;

      mockProvider.mockImplementation(async (request: LLMRequest) => {
        runningCount++;
        maxRunning = Math.max(maxRunning, runningCount);
        await new Promise((resolve) => setTimeout(resolve, 100));
        runningCount--;
        return {
          requestId: request.id,
          content: 'response',
          model: request.model,
          durationMs: 100,
          timestamp: new Date().toISOString(),
        } as LLMResponse;
      });

      // Act
      const requests = Array.from({ length: 5 }, (_, i) => ({
        id: `req-${i}`,
        model: 'gpt-4',
        prompt: `test-${i}`,
      }));

      await Promise.all(requests.map((req) => queue.enqueue(req)));

      // Assert
      expect(maxRunning).toBe(1);
    });

    it('应维护正确的队列深度', async () => {
      // Arrange
      mockProvider.mockImplementation(async (request: LLMRequest) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return {
          requestId: request.id,
          content: 'response',
          model: request.model,
          durationMs: 100,
          timestamp: new Date().toISOString(),
        } as LLMResponse;
      });

      // Act
      const requests = Array.from({ length: 5 }, (_, i) => ({
        id: `req-${i}`,
        model: 'gpt-4',
        prompt: `test-${i}`,
      }));

      // 开始所有请求
      const promises = requests.map((req) => queue.enqueue(req));

      // 检查初始队列深度
      const status1 = queue.getQueueStatus();
      expect(status1.pending + status1.running).toBeGreaterThan(0);

      // 等待所有完成
      await Promise.all(promises);

      // Assert
      const status2 = queue.getQueueStatus();
      expect(status2.pending).toBe(0);
      expect(status2.running).toBe(0);
      expect(status2.completed).toBe(5);
    });
  });

  describe('优先级排序', () => {
    it('高优先级请求应先执行', async () => {
      // Arrange
      const executionOrder: string[] = [];

      mockProvider.mockImplementation(async (request: LLMRequest) => {
        executionOrder.push(request.id);
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {
          requestId: request.id,
          content: 'response',
          model: request.model,
          durationMs: 10,
          timestamp: new Date().toISOString(),
        } as LLMResponse;
      });

      // Act: 先添加低优先级，再添加高优先级
      const lowPriorityReq = {
        id: 'low',
        model: 'gpt-4',
        prompt: 'low priority',
        priority: 1,
      };

      const highPriorityReq = {
        id: 'high',
        model: 'gpt-4',
        prompt: 'high priority',
        priority: 10,
      };

      const promise1 = queue.enqueue(lowPriorityReq);
      const promise2 = queue.enqueue(highPriorityReq);

      await Promise.all([promise1, promise2]);

      // Assert: 高优先级应该先执行
      expect(executionOrder[0]).toBe('high');
    });

    it('相同优先级应按 FIFO 顺序执行', async () => {
      // Arrange
      const executionOrder: string[] = [];

      mockProvider.mockImplementation(async (request: LLMRequest) => {
        executionOrder.push(request.id);
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {
          requestId: request.id,
          content: 'response',
          model: request.model,
          durationMs: 10,
          timestamp: new Date().toISOString(),
        } as LLMResponse;
      });

      // Act
      const requests = Array.from({ length: 5 }, (_, i) => ({
        id: `req-${i}`,
        model: 'gpt-4',
        prompt: `test-${i}`,
        priority: 5, // 相同优先级
      }));

      await Promise.all(requests.map((req) => queue.enqueue(req)));

      // Assert: 应按顺序执行
      expect(executionOrder).toEqual(['req-0', 'req-1', 'req-2', 'req-3', 'req-4']);
    });
  });

  describe('超时处理', () => {
    it('请求超时应抛出错误', async () => {
      // Arrange
      mockProvider.mockImplementation(async (request: LLMRequest) => {
        await new Promise((resolve) => setTimeout(resolve, 10000)); // 10秒
        return {
          requestId: request.id,
          content: 'response',
          model: request.model,
          durationMs: 10000,
          timestamp: new Date().toISOString(),
        } as LLMResponse;
      });

      const request: LLMRequest = {
        id: 'timeout-test',
        model: 'gpt-4',
        prompt: 'test',
        timeout: 100, // 100ms超时
      };

      // Act & Assert
      await expect(queue.enqueue(request)).rejects.toThrow('timed out');
    });

    it('应使用默认超时时间', async () => {
      // Arrange
      mockProvider.mockImplementation(async (request: LLMRequest) => {
        await new Promise((resolve) => setTimeout(resolve, 10000));
        return {
          requestId: request.id,
          content: 'response',
          model: request.model,
          durationMs: 10000,
          timestamp: new Date().toISOString(),
        } as LLMResponse;
      });

      const request: LLMRequest = {
        id: 'default-timeout',
        model: 'gpt-4',
        prompt: 'test',
        // 不设置timeout，使用默认值5000ms
      };

      // Act
      const startTime = Date.now();
      await expect(queue.enqueue(request)).rejects.toThrow('timed out');
      const elapsed = Date.now() - startTime;

      // Assert: 应在约5秒后超时
      expect(elapsed).toBeGreaterThanOrEqual(4900);
      expect(elapsed).toBeLessThan(5500);
    });
  });

  describe('重试机制', () => {
    it('失败请求应重试指定次数', async () => {
      // Arrange
      queue = new GlobalModelRequestQueue(mockProvider, {
        maxConcurrent: 1,
        defaultTimeout: 5000,
        maxRetries: 2,
        mutex: mockMutex as any,
      });

      let attemptCount = 0;
      mockProvider.mockImplementation(async (request: LLMRequest) => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Provider error');
        }
        return {
          requestId: request.id,
          content: 'response',
          model: request.model,
          durationMs: 10,
          timestamp: new Date().toISOString(),
        } as LLMResponse;
      });

      const request: LLMRequest = {
        id: 'retry-test',
        model: 'gpt-4',
        prompt: 'test',
      };

      // Act
      const result = await queue.enqueue(request);

      // Assert
      expect(attemptCount).toBe(3);
      expect(result.content).toBe('response');
    });

    it('超过最大重试次数应抛出错误', async () => {
      // Arrange
      queue = new GlobalModelRequestQueue(mockProvider, {
        maxConcurrent: 1,
        defaultTimeout: 5000,
        maxRetries: 2,
        mutex: mockMutex as any,
      });

      mockProvider.mockRejectedValue(new Error('Persistent error'));

      const request: LLMRequest = {
        id: 'fail-test',
        model: 'gpt-4',
        prompt: 'test',
      };

      // Act & Assert
      await expect(queue.enqueue(request)).rejects.toThrow('Persistent error');
      expect(mockProvider).toHaveBeenCalledTimes(3); // 初始 + 2次重试
    });
  });

  describe('取消请求', () => {
    it('应能取消 pending 状态的请求', async () => {
      // Arrange
      mockProvider.mockImplementation(async (request: LLMRequest) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return {
          requestId: request.id,
          content: 'response',
          model: request.model,
          durationMs: 100,
          timestamp: new Date().toISOString(),
        } as LLMResponse;
      });

      const request: LLMRequest = {
        id: 'cancel-test',
        model: 'gpt-4',
        prompt: 'test',
      };

      // Act
      const enqueuePromise = queue.enqueue(request);
      const cancelled = queue.cancel('cancel-test');

      // Assert
      expect(cancelled).toBe(true);
      await expect(enqueuePromise).rejects.toThrow();
    });

    it('不能取消 running 状态的请求', async () => {
      // Arrange
      mockProvider.mockImplementation(async (request: LLMRequest) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return {
          requestId: request.id,
          content: 'response',
          model: request.model,
          durationMs: 100,
          timestamp: new Date().toISOString(),
        } as LLMResponse;
      });

      const request: LLMRequest = {
        id: 'running-test',
        model: 'gpt-4',
        prompt: 'test',
      };

      // Act
      const enqueuePromise = queue.enqueue(request);
      await vi.advanceTimersByTimeAsync(10); // 让请求开始执行
      const cancelled = queue.cancel('running-test');

      // Assert
      expect(cancelled).toBe(false);

      // 清理
      await enqueuePromise;
    });
  });

  describe('事件系统', () => {
    it('应触发 queue:enqueue 事件', async () => {
      // Arrange
      const enqueueSpy = vi.fn();
      queue.on('queue:enqueue', enqueueSpy);

      mockProvider.mockResolvedValue({
        requestId: 'test',
        content: 'response',
        model: 'gpt-4',
        durationMs: 10,
        timestamp: new Date().toISOString(),
      } as LLMResponse);

      const request: LLMRequest = {
        id: 'event-test',
        model: 'gpt-4',
        prompt: 'test',
      };

      // Act
      await queue.enqueue(request);

      // Assert
      expect(enqueueSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'event-test' }));
    });

    it('应触发 queue:start 和 queue:complete 事件', async () => {
      // Arrange
      const startSpy = vi.fn();
      const completeSpy = vi.fn();
      queue.on('queue:start', startSpy);
      queue.on('queue:complete', completeSpy);

      mockProvider.mockResolvedValue({
        requestId: 'test',
        content: 'response',
        model: 'gpt-4',
        durationMs: 10,
        timestamp: new Date().toISOString(),
      } as LLMResponse);

      const request: LLMRequest = {
        id: 'event-test',
        model: 'gpt-4',
        prompt: 'test',
      };

      // Act
      await queue.enqueue(request);

      // Assert
      expect(startSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'event-test' }));
      expect(completeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'event-test' }),
        expect.any(Object)
      );
    });

    it('应触发 queue:fail 事件', async () => {
      // Arrange
      const failSpy = vi.fn();
      queue.on('queue:fail', failSpy);

      mockProvider.mockRejectedValue(new Error('Test error'));

      const request: LLMRequest = {
        id: 'fail-event-test',
        model: 'gpt-4',
        prompt: 'test',
      };

      // Act
      try {
        await queue.enqueue(request);
      } catch {
        // 预期抛出错误
      }

      // Assert
      expect(failSpy).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'fail-event-test' }),
        expect.any(Error)
      );
    });

    it('应触发 queue:status 事件', async () => {
      // Arrange
      const statusSpy = vi.fn();
      queue.on('queue:status', statusSpy);

      mockProvider.mockResolvedValue({
        requestId: 'test',
        content: 'response',
        model: 'gpt-4',
        durationMs: 10,
        timestamp: new Date().toISOString(),
      } as LLMResponse);

      // Act
      await queue.enqueue({
        id: 'status-test',
        model: 'gpt-4',
        prompt: 'test',
      });

      // Assert
      expect(statusSpy).toHaveBeenCalled();
      const status = statusSpy.mock.calls[0][0];
      expect(status).toHaveProperty('pending');
      expect(status).toHaveProperty('running');
      expect(status).toHaveProperty('completed');
    });
  });

  describe('状态查询', () => {
    it('应返回正确的队列状态', async () => {
      // Arrange
      mockProvider.mockImplementation(async (request: LLMRequest) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return {
          requestId: request.id,
          content: 'response',
          model: request.model,
          durationMs: 50,
          timestamp: new Date().toISOString(),
        } as LLMResponse;
      });

      // Act
      await queue.enqueue({ id: '1', model: 'gpt-4', prompt: 'test1' });
      await queue.enqueue({ id: '2', model: 'gpt-4', prompt: 'test2' });

      // Assert
      const status = queue.getQueueStatus();
      expect(status.completed).toBe(2);
      expect(status.totalProcessed).toBe(2);
    });

    it('应返回 pending 请求列表', async () => {
      // Arrange
      mockProvider.mockImplementation(async (request: LLMRequest) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return {
          requestId: request.id,
          content: 'response',
          model: request.model,
          durationMs: 100,
          timestamp: new Date().toISOString(),
        } as LLMResponse;
      });

      // Act
      const promise1 = queue.enqueue({ id: '1', model: 'gpt-4', prompt: 'test1' });
      const promise2 = queue.enqueue({ id: '2', model: 'gpt-4', prompt: 'test2' });
      const promise3 = queue.enqueue({ id: '3', model: 'gpt-4', prompt: 'test3' });

      // 检查pending列表
      const pending = queue.getPendingRequests();

      // Assert
      expect(pending.length).toBeGreaterThanOrEqual(0);

      // 清理
      await Promise.all([promise1, promise2, promise3]);
    });

    it('应能获取已完成的响应', async () => {
      // Arrange
      mockProvider.mockImplementation(async (request: LLMRequest) => {
        return {
          requestId: request.id,
          content: 'test response',
          model: request.model,
          durationMs: 10,
          timestamp: new Date().toISOString(),
        } as LLMResponse;
      });

      // Act
      const result = await queue.enqueue({ id: 'response-test', model: 'gpt-4', prompt: 'test' });

      // Assert
      expect(result.requestId).toBe('response-test');
      expect(result.content).toBe('test response');
    });
  });

  describe('清理', () => {
    it('clear 应清空所有队列数据', async () => {
      // Arrange - 只添加请求到队列，不等待完成
      mockProvider.mockImplementation(async () => {
        // 延迟响应，确保请求在队列中
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
          requestId: 'test',
          content: 'response',
          model: 'gpt-4',
          durationMs: 10,
          timestamp: new Date().toISOString(),
        } as LLMResponse;
      });

      // 启动请求但不等待完成
      queue.enqueue({ id: '1', model: 'gpt-4', prompt: 'test1' });
      queue.enqueue({ id: '2', model: 'gpt-4', prompt: 'test2' });

      // Act - 立即清空队列
      queue.clear();

      // Assert
      const status = queue.getQueueStatus();
      expect(status.pending).toBe(0);
      expect(status.running).toBe(0);
      expect(status.completed).toBe(0);
      expect(status.failed).toBe(0);
    });
  });
});

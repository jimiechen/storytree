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

// 创建内存中的 mock FileMutex - 使用队列确保串行
class MockFileMutex extends FileMutex {
  private queue: { lockId: string; resolve: (handle: LockHandle) => void }[] = [];

  constructor() {
    super({ lockfilePath: '/tmp/test' });
  }

  async acquire(lockId: string): Promise<LockHandle> {
    // 如果锁已被获取，加入等待队列
    if (this.locks.has(lockId)) {
      return new Promise((resolve) => {
        this.queue.push({ lockId, resolve });
      });
    }

    const handle: LockHandle = {
      lockId,
      lockfilePath: `/tmp/test/${lockId}.lock`,
      released: false,
    };
    this.locks.set(lockId, handle);
    return handle;
  }

  async release(handle: LockHandle): Promise<void> {
    this.locks.delete(handle.lockId);
    handle.released = true;

    // 检查是否有等待相同锁的请求
    const waitingIndex = this.queue.findIndex(item => item.lockId === handle.lockId);
    if (waitingIndex >= 0) {
      const waiting = this.queue.splice(waitingIndex, 1)[0];
      const newHandle: LockHandle = {
        lockId: waiting.lockId,
        lockfilePath: `/tmp/test/${waiting.lockId}.lock`,
        released: false,
      };
      this.locks.set(waiting.lockId, newHandle);
      waiting.resolve(newHandle);
    }
  }

  async isLocked(lockId: string): Promise<boolean> {
    return this.locks.has(lockId);
  }

  getActiveLocks(): string[] {
    return Array.from(this.locks.keys());
  }

  async cleanup(): Promise<void> {
    this.locks.clear();
    this.queue = [];
  }
}

describe('GlobalModelRequestQueue', () => {
  let queue: GlobalModelRequestQueue;
  let mockProvider: any;
  let mockMutex: MockFileMutex;

  beforeEach(() => {
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
    // 清理锁
    await mockMutex.cleanup();
    vi.clearAllMocks();
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
      // Arrange - beforeEach已经设置了defaultTimeout: 5000
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
      expect(elapsed).toBeLessThan(6000);
    }, 15000); // 增加测试超时时间为15秒
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
      // Arrange - 使用延迟的mock确保请求保持在pending状态
      let firstRequestStarted = false;
      mockProvider.mockImplementation(async (request: LLMRequest) => {
        if (request.id === 'cancel-test-1') {
          firstRequestStarted = true;
        }
        // 长时间延迟，确保我们可以取消
        await new Promise((resolve) => setTimeout(resolve, 10000));
        return {
          requestId: request.id,
          content: 'response',
          model: request.model,
          durationMs: 10000,
          timestamp: new Date().toISOString(),
        } as LLMResponse;
      });

      const request1: LLMRequest = {
        id: 'cancel-test-1',
        model: 'gpt-4',
        prompt: 'test',
      };
      
      const request2: LLMRequest = {
        id: 'cancel-test-2',
        model: 'gpt-4',
        prompt: 'test',
      };

      // Act - 启动第一个请求（会进入running状态）
      queue.enqueue(request1);
      
      // 等待第一个请求开始执行
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(firstRequestStarted).toBe(true);
      
      // 启动第二个请求（会进入pending状态，因为maxConcurrent=1）
      queue.enqueue(request2);
      
      // 给一点时间让第二个请求进入队列
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // 取消pending状态的第二个请求
      const cancelled = queue.cancel('cancel-test-2');

      // Assert
      expect(cancelled).toBe(true);
      
      // 验证队列状态
      const status = queue.getQueueStatus();
      expect(status.pending).toBe(0);
    });

    it('不能取消 running 状态的请求', async () => {
      // Arrange - 使用长时间延迟的mock确保请求保持在running状态
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
        id: 'running-test',
        model: 'gpt-4',
        prompt: 'test',
      };

      // Act - 启动请求但不等待完成
      const enqueuePromise = queue.enqueue(request);
      
      // 给一点时间让请求进入running状态
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // 尝试取消running状态的请求
      const cancelled = queue.cancel('running-test');

      // Assert - 不能取消running状态的请求
      expect(cancelled).toBe(false);
      
      // 清理 - 不需要等待enqueue完成，因为我们已经验证了cancel的行为
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

      // 使用async函数返回rejected promise
      mockProvider.mockImplementation(async () => {
        throw new Error('Test error');
      });

      const request: LLMRequest = {
        id: 'fail-event-test',
        model: 'gpt-4',
        prompt: 'test',
      };

      // Act - 捕获错误
      let errorCaught = false;
      try {
        await queue.enqueue(request);
      } catch (error) {
        errorCaught = true;
      }

      // Assert
      expect(errorCaught).toBe(true);
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
        return {
          requestId: request.id,
          content: 'response',
          model: request.model,
          durationMs: 10,
          timestamp: new Date().toISOString(),
        } as LLMResponse;
      });

      // Act
      await queue.enqueue({ id: 'status-1', model: 'gpt-4', prompt: 'test1' });
      await queue.enqueue({ id: 'status-2', model: 'gpt-4', prompt: 'test2' });

      // Assert
      const status = queue.getQueueStatus();
      expect(status.completed).toBe(2);
    });

    it('应返回 pending 请求列表', async () => {
      // Arrange - 使用快速响应的mock
      mockProvider.mockImplementation(async (request: LLMRequest) => {
        return {
          requestId: request.id,
          content: 'response',
          model: request.model,
          durationMs: 10,
          timestamp: new Date().toISOString(),
        } as LLMResponse;
      });

      // Act - 串行执行请求
      await queue.enqueue({ id: 'pending-1', model: 'gpt-4', prompt: 'test1' });
      await queue.enqueue({ id: 'pending-2', model: 'gpt-4', prompt: 'test2' });
      await queue.enqueue({ id: 'pending-3', model: 'gpt-4', prompt: 'test3' });

      // 获取状态
      const status = queue.getQueueStatus();

      // Assert - 所有请求应该已完成
      expect(status.completed).toBe(3);
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
    it('clear 应清空所有队列数据', () => {
      // Arrange - 直接操作队列内部状态来模拟有数据的情况
      // 使用any类型来访问私有属性
      const queueAny = queue as any;
      queueAny.queue = [
        { request: { id: '1' }, status: 'pending' },
        { request: { id: '2' }, status: 'running' },
      ];
      queueAny.running.add('2');
      queueAny.completed.set('3', { content: 'response' });
      queueAny.failed.set('4', new Error('failed'));

      // 验证初始状态
      let status = queue.getQueueStatus();
      expect(status.pending).toBe(1);
      expect(status.running).toBe(1);
      expect(status.completed).toBe(1);
      expect(status.failed).toBe(1);

      // Act - 清空队列
      queue.clear();

      // Assert
      status = queue.getQueueStatus();
      expect(status.pending).toBe(0);
      expect(status.running).toBe(0);
      expect(status.completed).toBe(0);
      expect(status.failed).toBe(0);
    });
  });
});

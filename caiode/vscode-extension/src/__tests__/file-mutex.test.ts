/**
 * TEST-1.3.2a: 单元测试 - FileMutex 核心逻辑
 *
 * 对应DEV: DEV-1.3.2 实现基于文件路径的跨进程 Mutex
 * 测试目标: 验证文件锁获取/释放、超时处理、重入检测、异常处理
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileMutex, LockHandle, LockOptions } from '../core/file-mutex';

// Mock proper-lockfile
const mockLock = vi.fn();
const mockUnlock = vi.fn();
const mockCheck = vi.fn();

vi.mock('proper-lockfile', () => ({
  lock: (...args: any[]) => mockLock(...args),
  unlock: (...args: any[]) => mockUnlock(...args),
  check: (...args: any[]) => mockCheck(...args),
}));

// Mock fs
vi.mock('fs', () => ({
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
}));

describe('FileMutex', () => {
  let mutex: FileMutex;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLock.mockResolvedValue(undefined);
    mockUnlock.mockResolvedValue(undefined);
    mutex = new FileMutex({
      lockfilePath: '/tmp/test-locks',
      timeout: 5000,
      stale: 10000,
    });
  });

  afterEach(async () => {
    await mutex.cleanup();
  });

  describe('锁获取', () => {
    it('应成功获取锁并返回 handle', async () => {
      // Arrange
      const lockId = 'test-lock';

      // Act
      const handle = await mutex.acquire(lockId);

      // Assert
      expect(handle).toBeDefined();
      expect(handle.lockId).toBe(lockId);
      expect(handle.released).toBe(false);
      expect(mockLock).toHaveBeenCalled();
    });

    it('同一 lockId 不应重复获取锁', async () => {
      // Arrange
      const lockId = 'duplicate-lock';
      await mutex.acquire(lockId);

      // Act & Assert
      await expect(mutex.acquire(lockId)).rejects.toThrow('already acquired');
    });

    it('不同 lockId 可以并发获取锁', async () => {
      // Arrange
      const lockId1 = 'lock-1';
      const lockId2 = 'lock-2';

      // Act
      const handle1 = await mutex.acquire(lockId1);
      const handle2 = await mutex.acquire(lockId2);

      // Assert
      expect(handle1.lockId).toBe(lockId1);
      expect(handle2.lockId).toBe(lockId2);
      expect(mockLock).toHaveBeenCalledTimes(2);
    });

    it('锁获取失败应抛出错误', async () => {
      // Arrange
      mockLock.mockRejectedValue(new Error('Lock failed'));
      const lockId = 'fail-lock';

      // Act & Assert
      await expect(mutex.acquire(lockId)).rejects.toThrow('Failed to acquire lock');
    });
  });

  describe('锁释放', () => {
    it('应成功释放锁', async () => {
      // Arrange
      const lockId = 'release-test';
      const handle = await mutex.acquire(lockId);

      // Act
      await mutex.release(handle);

      // Assert
      expect(handle.released).toBe(true);
      expect(mockUnlock).toHaveBeenCalledWith(handle.lockfilePath);
    });

    it('重复释放不应报错', async () => {
      // Arrange
      const lockId = 'double-release';
      const handle = await mutex.acquire(lockId);
      await mutex.release(handle);

      // Act & Assert
      await expect(mutex.release(handle)).resolves.not.toThrow();
    });

    it('释放已释放的锁不应调用 unlock', async () => {
      // Arrange
      const lockId = 'already-released';
      const handle = await mutex.acquire(lockId);
      await mutex.release(handle);
      mockUnlock.mockClear();

      // Act
      await mutex.release(handle);

      // Assert
      expect(mockUnlock).not.toHaveBeenCalled();
    });
  });

  describe('withLock 模式', () => {
    it('应在函数执行前后自动获取和释放锁', async () => {
      // Arrange
      const lockId = 'withlock-test';
      const mockFn = vi.fn().mockResolvedValue('result');

      // Act
      const result = await mutex.withLock(lockId, mockFn);

      // Assert
      expect(mockLock).toHaveBeenCalledBefore(mockFn);
      expect(mockFn).toHaveBeenCalledBefore(mockUnlock);
      expect(result).toBe('result');
    });

    it('函数抛出异常时应自动释放锁', async () => {
      // Arrange
      const lockId = 'withlock-error';
      const mockFn = vi.fn().mockRejectedValue(new Error('Test error'));

      // Act & Assert
      await expect(mutex.withLock(lockId, mockFn)).rejects.toThrow('Test error');

      // 验证锁被释放
      expect(mockUnlock).toHaveBeenCalled();
    });

    it('withLock 后应能重新获取锁', async () => {
      // Arrange
      const lockId = 'withlock-reacquire';
      const mockFn = vi.fn().mockResolvedValue('done');

      // Act
      await mutex.withLock(lockId, mockFn);
      const handle = await mutex.acquire(lockId);

      // Assert
      expect(handle.lockId).toBe(lockId);
    });
  });

  describe('锁状态检查', () => {
    it('应正确检查锁状态', async () => {
      // Arrange
      const lockId = 'check-test';
      mockCheck.mockResolvedValue(true);

      // Act
      await mutex.acquire(lockId);
      const isLocked = await mutex.isLocked(lockId);

      // Assert
      expect(isLocked).toBe(true);
      expect(mockCheck).toHaveBeenCalled();
    });

    it('未获取的锁应返回 false', async () => {
      // Arrange
      const lockId = 'not-locked';
      mockCheck.mockResolvedValue(false);

      // Act
      const isLocked = await mutex.isLocked(lockId);

      // Assert
      expect(isLocked).toBe(false);
    });

    it('应返回活跃锁列表', async () => {
      // Arrange
      await mutex.acquire('lock-a');
      await mutex.acquire('lock-b');
      await mutex.acquire('lock-c');

      // Act
      const activeLocks = mutex.getActiveLocks();

      // Assert
      expect(activeLocks).toContain('lock-a');
      expect(activeLocks).toContain('lock-b');
      expect(activeLocks).toContain('lock-c');
      expect(activeLocks).toHaveLength(3);
    });

    it('释放后应从活跃锁列表中移除', async () => {
      // Arrange
      const lockId = 'remove-test';
      const handle = await mutex.acquire(lockId);

      // Act
      await mutex.release(handle);
      const activeLocks = mutex.getActiveLocks();

      // Assert
      expect(activeLocks).not.toContain(lockId);
    });
  });

  describe('强制释放', () => {
    it('应能强制释放锁', async () => {
      // Arrange
      const lockId = 'force-release';
      await mutex.acquire(lockId);

      // Act
      await mutex.forceRelease(lockId);

      // Assert
      expect(mockUnlock).toHaveBeenCalled();
      const activeLocks = mutex.getActiveLocks();
      expect(activeLocks).not.toContain(lockId);
    });

    it('强制释放不存在的锁不应报错', async () => {
      // Act & Assert
      await expect(mutex.forceRelease('non-existent')).resolves.not.toThrow();
    });
  });

  describe('清理', () => {
    it('cleanup 应释放所有活跃锁', async () => {
      // Arrange
      await mutex.acquire('lock-1');
      await mutex.acquire('lock-2');
      await mutex.acquire('lock-3');

      // Act
      await mutex.cleanup();

      // Assert
      expect(mockUnlock).toHaveBeenCalledTimes(3);
      expect(mutex.getActiveLocks()).toHaveLength(0);
    });
  });

  describe('事件系统', () => {
    it('应触发 lock:acquired 事件', async () => {
      // Arrange
      const acquiredSpy = vi.fn();
      mutex.on('lock:acquired', acquiredSpy);

      // Act
      await mutex.acquire('event-test');

      // Assert
      expect(acquiredSpy).toHaveBeenCalledWith('event-test');
    });

    it('应触发 lock:released 事件', async () => {
      // Arrange
      const releasedSpy = vi.fn();
      mutex.on('lock:released', releasedSpy);
      const handle = await mutex.acquire('release-event');

      // Act
      await mutex.release(handle);

      // Assert
      expect(releasedSpy).toHaveBeenCalledWith('release-event');
    });

    it('应触发 lock:error 事件', async () => {
      // Arrange
      const errorSpy = vi.fn();
      mutex.on('lock:error', errorSpy);
      mockLock.mockRejectedValue(new Error('Lock error'));

      // Act
      try {
        await mutex.acquire('error-test');
      } catch {
        // 预期错误
      }

      // Assert
      expect(errorSpy).toHaveBeenCalledWith('error-test', expect.any(Error));
    });
  });

  describe('配置选项', () => {
    it('应使用自定义超时', async () => {
      // Arrange
      const customMutex = new FileMutex({
        timeout: 1000,
        stale: 2000,
      });

      // Act
      await customMutex.acquire('timeout-test');

      // Assert
      expect(mockLock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          stale: 2000,
        })
      );
    });

    it('应使用自定义锁文件路径', async () => {
      // Arrange
      const customPath = '/custom/lock/path';
      const customMutex = new FileMutex({
        lockfilePath: customPath,
      });

      // Act
      await customMutex.acquire('path-test');

      // Assert
      expect(mockLock).toHaveBeenCalledWith(
        expect.stringContaining(customPath),
        expect.any(Object)
      );
    });
  });

  describe('边界情况', () => {
    it('应处理特殊字符的 lockId', async () => {
      // Arrange
      const specialId = 'lock/with\\special:chars';

      // Act
      const handle = await mutex.acquire(specialId);

      // Assert
      expect(handle.lockId).toBe(specialId);
      expect(handle.lockfilePath).not.toContain('/');
      expect(handle.lockfilePath).not.toContain('\\');
    });

    it('应处理空 lockId', async () => {
      // Act
      const handle = await mutex.acquire('');

      // Assert
      expect(handle.lockId).toBe('');
    });

    it('并发请求同一锁应排队等待', async () => {
      // Arrange
      const lockId = 'concurrent-test';
      let lockHeld = false;

      mockLock.mockImplementation(async () => {
        if (lockHeld) {
          throw new Error('Lock busy');
        }
        lockHeld = true;
      });

      // Act
      const handle1 = await mutex.acquire(lockId);

      // 第二个获取应该失败（因为重入检测）
      await expect(mutex.acquire(lockId)).rejects.toThrow();

      // 释放后应该能重新获取
      await mutex.release(handle1);
      lockHeld = false;

      // 清理 mock 以便重新获取
      vi.clearAllMocks();
      mockLock.mockResolvedValue(undefined);

      const handle2 = await mutex.acquire(lockId);
      expect(handle2.lockId).toBe(lockId);
    });
  });
});

describe('createFileMutex', () => {
  it('应创建 FileMutex 实例', () => {
    // Act
    const { createFileMutex } = require('../core/file-mutex');
    const mutex = createFileMutex();

    // Assert
    expect(mutex).toBeInstanceOf(FileMutex);
  });

  it('应接受配置选项', () => {
    // Act
    const { createFileMutex } = require('../core/file-mutex');
    const mutex = createFileMutex({
      timeout: 3000,
      stale: 6000,
    });

    // Assert
    expect(mutex).toBeInstanceOf(FileMutex);
  });
});

import * as properLockfile from "proper-lockfile";
import { OperationOptions } from "retry";
import * as fs from "fs";
import * as path from "path";
import { EventEmitter } from "events";

export interface LockOptions {
  lockfilePath?: string;
  timeout?: number;
  stale?: number;
  retries?: number | OperationOptions;
  retryWait?: number;
}

export interface LockHandle {
  lockId: string;
  lockfilePath: string;
  released: boolean;
}

export interface FileMutexEvents {
  "lock:acquired": (lockId: string) => void;
  "lock:released": (lockId: string) => void;
  "lock:error": (lockId: string, error: Error) => void;
}

export class FileMutex extends EventEmitter {
  private locks: Map<string, LockHandle> = new Map();
  private defaultOptions: Required<LockOptions>;

  constructor(options: LockOptions = {}) {
    super();
    this.defaultOptions = {
      lockfilePath: path.join(process.cwd(), ".locks"),
      timeout: 5000,
      stale: 30000,
      retries: 3,
      retryWait: 100,
      ...options,
    };
    this.ensureLockDir();
  }

  private ensureLockDir(): void {
    if (!fs.existsSync(this.defaultOptions.lockfilePath)) {
      fs.mkdirSync(this.defaultOptions.lockfilePath, { recursive: true });
    }
  }

  private getLockfilePath(lockId: string): string {
    const sanitized = lockId.replace(/[^a-zA-Z0-9_-]/g, "_");
    return path.join(this.defaultOptions.lockfilePath, `${sanitized}.lock`);
  }

  async acquire(lockId: string, options?: LockOptions): Promise<LockHandle> {
    if (this.locks.has(lockId)) {
      const existing = this.locks.get(lockId)!;
      if (!existing.released) {
        throw new Error(`Lock ${lockId} is already acquired`);
      }
    }

    const lockfilePath = this.getLockfilePath(lockId);
    const lockOptions: properLockfile.LockOptions = {
      stale: options?.stale ?? this.defaultOptions.stale,
      retries: options?.retries ?? this.defaultOptions.retries,
      onCompromised: (err: Error) => {
        this.emit("lock:error", lockId, err);
      },
    };

    try {
      await properLockfile.lock(lockfilePath, lockOptions);
      const handle: LockHandle = {
        lockId,
        lockfilePath,
        released: false,
      };
      this.locks.set(lockId, handle);
      this.emit("lock:acquired", lockId);
      return handle;
    } catch (error) {
      const err = error as Error;
      this.emit("lock:error", lockId, err);
      throw new Error(`Failed to acquire lock ${lockId}: ${err.message}`);
    }
  }

  async release(handle: LockHandle): Promise<void> {
    if (handle.released) {
      return;
    }

    try {
      await properLockfile.unlock(handle.lockfilePath);
      handle.released = true;
      this.locks.delete(handle.lockId);
      this.emit("lock:released", handle.lockId);
    } catch (error) {
      const err = error as Error;
      throw new Error(`Failed to release lock ${handle.lockId}: ${err.message}`);
    }
  }

  async isLocked(lockId: string): Promise<boolean> {
    const lockfilePath = this.getLockfilePath(lockId);
    try {
      const result = await properLockfile.check(lockfilePath, {
        stale: this.defaultOptions.stale,
      });
      return result === true;
    } catch {
      return false;
    }
  }

  async withLock<T>(lockId: string, fn: () => Promise<T>, options?: LockOptions): Promise<T> {
    const handle = await this.acquire(lockId, options);
    try {
      return await fn();
    } finally {
      await this.release(handle);
    }
  }

  getActiveLocks(): string[] {
    return Array.from(this.locks.keys()).filter((id) => {
      const handle = this.locks.get(id)!;
      return !handle.released;
    });
  }

  async forceRelease(lockId: string): Promise<void> {
    const handle = this.locks.get(lockId);
    if (handle) {
      try {
        await properLockfile.unlock(handle.lockfilePath);
      } catch {
        // Ignore cleanup errors
      }
      handle.released = true;
      this.locks.delete(lockId);
      this.emit("lock:released", lockId);
    }
  }

  async cleanup(): Promise<void> {
    const activeLocks = this.getActiveLocks();
    await Promise.all(activeLocks.map((lockId) => this.forceRelease(lockId)));
  }
}

export function createFileMutex(options?: LockOptions): FileMutex {
  return new FileMutex(options);
}

export const defaultMutex = createFileMutex();
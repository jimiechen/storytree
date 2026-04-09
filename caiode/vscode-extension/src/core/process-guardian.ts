import { ChildProcess, spawn } from "child_process";
import { EventEmitter } from "events";
import { FileMutex, createFileMutex } from "./file-mutex";

export interface ProcessConfig {
  name: string;
  command: string;
  args?: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
  maxRetries?: number;
  retryBackoff?: number;
}

export interface ProcessStatus {
  pid: number | null;
  name: string;
  state: "starting" | "running" | "heartbeat_missing" | "stopping" | "stopped" | "crashed";
  startTime: number;
  lastHeartbeat: number;
  restartCount: number;
  exitCode: number | null;
}

export interface CrashInfo {
  name: string;
  pid: number;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timestamp: number;
  restartCount: number;
  error?: string;
}

export interface ProcessGuardianEvents {
  "process:start": (name: string, pid: number) => void;
  "process:heartbeat": (name: string, pid: number) => void;
  "process:heartbeat-timeout": (name: string, pid: number) => void;
  "process:crash": (info: CrashInfo) => void;
  "process:restart": (info: CrashInfo) => void;
  "process:stop": (name: string, pid: number) => void;
  "process:max-retries": (name: string) => void;
}

export class ProcessGuardian extends EventEmitter {
  private processes: Map<string, ChildProcess> = new Map();
  private statuses: Map<string, ProcessStatus> = new Map();
  private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map();
  private heartbeatWatchers: Map<string, NodeJS.Timeout> = new Map();
  private configs: Map<string, ProcessConfig> = new Map();
  private mutex: FileMutex;
  private lockIdPrefix = "process-guardian-";

  constructor(mutex?: FileMutex) {
    super();
    this.mutex = mutex || createFileMutex();
  }

  async spawn(config: ProcessConfig): Promise<ChildProcess> {
    if (this.processes.has(config.name)) {
      throw new Error(`Process ${config.name} already exists`);
    }

    const status: ProcessStatus = {
      pid: null,
      name: config.name,
      state: "starting",
      startTime: Date.now(),
      lastHeartbeat: Date.now(),
      restartCount: 0,
      exitCode: null,
    };
    this.statuses.set(config.name, status);
    this.configs.set(config.name, config);

    return this.doSpawn(config.name);
  }

  private async doSpawn(name: string): Promise<ChildProcess> {
    const config = this.configs.get(name)!;
    const status = this.statuses.get(name)!;

    return new Promise((resolve, reject) => {
      const child = spawn(config.command, config.args || [], {
        cwd: config.cwd || process.cwd(),
        env: { ...process.env, ...config.env },
        stdio: "pipe",
      });

      child.on("spawn", () => {
        status.pid = child.pid ?? null;
        status.state = "running";
        status.startTime = Date.now();
        status.lastHeartbeat = Date.now();
        this.processes.set(name, child);
        this.startHeartbeatMonitor(name);
        this.emit("process:start", name, child.pid!);
        resolve(child);
      });

      child.on("error", (err) => {
        status.state = "crashed";
        this.emit("process:crash", {
          name,
          pid: -1,
          exitCode: null,
          signal: null,
          timestamp: Date.now(),
          restartCount: status.restartCount,
          error: err.message,
        });
        reject(err);
      });

      child.on("exit", (code, signal) => {
        this.handleProcessExit(name, code, signal);
      });
    });
  }

  private startHeartbeatMonitor(name: string): void {
    const config = this.configs.get(name)!;
    const interval = config.heartbeatInterval || 5000;
    const timeout = config.heartbeatTimeout || 15000;

    const heartbeatTimer = setInterval(() => {
      this.sendHeartbeat(name);
    }, interval);
    this.heartbeatTimers.set(name, heartbeatTimer);

    const watcherTimer = setTimeout(() => {
      const status = this.statuses.get(name);
      if (status && status.state === "running") {
        const timeSinceLastHeartbeat = Date.now() - status.lastHeartbeat;
        if (timeSinceLastHeartbeat > timeout) {
          status.state = "heartbeat_missing";
          this.emit("process:heartbeat-timeout", name, status.pid!);
          this.handleHeartbeatTimeout(name);
        }
      }
    }, timeout);
    this.heartbeatWatchers.set(name, watcherTimer);
  }

  private sendHeartbeat(name: string): void {
    const child = this.processes.get(name);
    const status = this.statuses.get(name);

    if (child && status && status.state === "running") {
      try {
        if (!child.killed && child.pid) {
          process.kill(child.pid, "SIGUSR1");
          status.lastHeartbeat = Date.now();
          this.emit("process:heartbeat", name, child.pid);
        }
      } catch {
        // Process might have exited
      }
    }
  }

  private handleHeartbeatTimeout(name: string): void {
    const child = this.processes.get(name);
    const status = this.statuses.get(name);
    const config = this.configs.get(name)!;

    if (child && status) {
      const maxRetries = config.maxRetries || 3;
      if (status.restartCount < maxRetries) {
        this.restart(name);
      } else {
        status.state = "stopped";
        this.emit("process:max-retries", name);
      }
    }
  }

  private handleProcessExit(name: string, exitCode: number | null, signal: NodeJS.Signals | null): void {
    const status = this.statuses.get(name);
    const config = this.configs.get(name);

    if (!status || !config) {
      return;
    }

    this.stopHeartbeatMonitor(name);
    status.exitCode = exitCode;
    status.state = "crashed";

    const crashInfo: CrashInfo = {
      name,
      pid: status.pid ?? -1,
      exitCode,
      signal,
      timestamp: Date.now(),
      restartCount: status.restartCount,
    };

    this.emit("process:crash", crashInfo);

    const maxRetries = config.maxRetries || 3;
    if (status.restartCount < maxRetries) {
      this.scheduleRestart(name, crashInfo);
    } else {
      this.emit("process:max-retries", name);
    }
  }

  private scheduleRestart(name: string, crashInfo: CrashInfo): void {
    const config = this.configs.get(name)!;
    const status = this.statuses.get(name)!;
    const backoff = config.retryBackoff || 1000;
    const delay = backoff * Math.pow(2, status.restartCount);

    setTimeout(() => {
      status.restartCount++;
      crashInfo.restartCount = status.restartCount;
      this.doSpawn(name).then(() => {
        this.emit("process:restart", crashInfo);
      });
    }, delay);
  }

  private stopHeartbeatMonitor(name: string): void {
    const heartbeatTimer = this.heartbeatTimers.get(name);
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      this.heartbeatTimers.delete(name);
    }

    const watcherTimer = this.heartbeatWatchers.get(name);
    if (watcherTimer) {
      clearTimeout(watcherTimer);
      this.heartbeatWatchers.delete(name);
    }
  }

  async monitor(pid: number): Promise<void> {
    const lockId = `${this.lockIdPrefix}${pid}`;
    await this.mutex.acquire(lockId);
  }

  async unmonitor(pid: number): Promise<void> {
    const lockId = `${this.lockIdPrefix}${pid}`;
    const handle = { lockId, lockfilePath: "", released: false };
    await this.mutex.release(handle);
  }

  getProcessStatus(name: string): ProcessStatus | null {
    return this.statuses.get(name) || null;
  }

  getAllStatuses(): Map<string, ProcessStatus> {
    return new Map(this.statuses);
  }

  async restart(name: string): Promise<boolean> {
    const status = this.statuses.get(name);
    const config = this.configs.get(name);

    if (!status || !config) {
      return false;
    }

    if (status.state === "running" || status.state === "starting") {
      await this.stop(name);
    }

    try {
      await this.doSpawn(name);
      return true;
    } catch {
      return false;
    }
  }

  async stop(name: string): Promise<void> {
    const child = this.processes.get(name);
    const status = this.statuses.get(name);

    if (!child || !status) {
      return;
    }

    status.state = "stopping";
    this.stopHeartbeatMonitor(name);

    return new Promise((resolve) => {
      child.on("exit", () => {
        status.state = "stopped";
        this.emit("process:stop", name, status.pid!);
        this.cleanup(name);
        resolve();
      });

      if (!child.killed) {
        child.kill("SIGTERM");
      }

      setTimeout(() => {
        if (!child.killed) {
          child.kill("SIGKILL");
        }
      }, 5000);
    });
  }

  private cleanup(name: string): void {
    this.processes.delete(name);
    this.statuses.delete(name);
    this.configs.delete(name);
    this.stopHeartbeatMonitor(name);
  }

  async stopAll(): Promise<void> {
    const names = Array.from(this.processes.keys());
    await Promise.all(names.map((name) => this.stop(name)));
  }

  isRunning(name: string): boolean {
    const status = this.statuses.get(name);
    return status?.state === "running" || status?.state === "heartbeat_missing";
  }
}

export function createProcessGuardian(mutex?: FileMutex): ProcessGuardian {
  return new ProcessGuardian(mutex);
}

export const defaultGuardian = createProcessGuardian();
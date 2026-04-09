import * as vscode from "vscode";
import { EventEmitter } from "events";
import type { GlobalModelRequestQueue, QueueStatus, LLMRequest } from "./global-model-request-queue";

export interface QueueMonitorConfig {
  channelName: string;
  updateIntervalMs: number;
  showTimestamps: boolean;
  maxDisplayedRequests: number;
}

export class QueueMonitor extends EventEmitter {
  private channel: vscode.OutputChannel;
  private queue: GlobalModelRequestQueue;
  private config: QueueMonitorConfig;
  private updateTimer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private lastStatus: QueueStatus | null = null;

  constructor(queue: GlobalModelRequestQueue, config?: Partial<QueueMonitorConfig>) {
    super();
    this.queue = queue;
    this.config = {
      channelName: "Caiode Queue Monitor",
      updateIntervalMs: 2000,
      showTimestamps: true,
      maxDisplayedRequests: 10,
      ...config,
    };

    this.channel = vscode.window.createOutputChannel(this.config.channelName);

    this.setupEventListeners();
  }

  public get running(): boolean {
    return this.isRunning;
  }

  private setupEventListeners(): void {
    this.queue.on("queue:enqueue", (request: LLMRequest) => {
      this.appendLog(`[ENQUEUE] Request ${request.id} added to queue (priority: ${request.priority || 0})`);
    });

    this.queue.on("queue:start", (request: LLMRequest) => {
      this.appendLog(`[START] Processing request ${request.id}`);
    });

    this.queue.on("queue:complete", (request: LLMRequest) => {
      this.appendLog(`[COMPLETE] Request ${request.id} completed successfully`);
    });

    this.queue.on("queue:fail", (request: LLMRequest, error: Error) => {
      this.appendLog(`[FAIL] Request ${request.id} failed: ${error.message}`);
    });

    this.queue.on("queue:cancel", (request: LLMRequest) => {
      this.appendLog(`[CANCEL] Request ${request.id} cancelled`);
    });

    this.queue.on("queue:status", (status: QueueStatus) => {
      this.lastStatus = status;
    });
  }

  show(): void {
    this.channel.show();
    this.appendHeader();
    if (!this.isRunning) {
      this.start();
    }
  }

  hide(): void {
    this.channel.hide();
  }

  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.appendLog("[MONITOR] Queue monitoring started");
    this.scheduleUpdate();
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
    this.appendLog("[MONITOR] Queue monitoring stopped");
  }

  private scheduleUpdate(): void {
    if (!this.isRunning) {
      return;
    }

    this.updateTimer = setTimeout(() => {
      this.updateStatus();
      this.scheduleUpdate();
    }, this.config.updateIntervalMs);
  }

  private updateStatus(): void {
    const status = this.queue.getQueueStatus();
    const pendingRequests = this.queue.getPendingRequests();

    const lines: string[] = [];
    lines.push("");
    lines.push(this.formatTimestamp() + " ════ Queue Status ════");
    lines.push(`  Pending:     ${status.pending}`);
    lines.push(`  Running:     ${status.running}`);
    lines.push(`  Completed:   ${status.completed}`);
    lines.push(`  Failed:      ${status.failed}`);
    lines.push(`  Total:       ${status.totalProcessed}`);
    lines.push("");

    if (status.averageWaitTime > 0) {
      lines.push(`  Avg Wait:    ${status.averageWaitTime.toFixed(0)}ms`);
    }
    if (status.averageProcessingTime > 0) {
      lines.push(`  Avg Process: ${status.averageProcessingTime.toFixed(0)}ms`);
    }

    if (pendingRequests.length > 0) {
      lines.push("");
      lines.push("  Pending Requests:");
      const displayCount = Math.min(pendingRequests.length, this.config.maxDisplayedRequests);
      for (let i = 0; i < displayCount; i++) {
        const req = pendingRequests[i];
        lines.push(`    ${i + 1}. [${req.priority || 0}] ${req.model} - ${req.id.substring(0, 16)}...`);
      }
      if (pendingRequests.length > displayCount) {
        lines.push(`    ... and ${pendingRequests.length - displayCount} more`);
      }
    }

    if (status.running > 0) {
      lines.push("");
      lines.push("  Currently Running:");
      const runningRequests = pendingRequests.filter(r => {
        return true;
      });
      lines.push(`    ${status.running} request(s) in execution`);
    }

    lines.push("");

    this.channel.append(lines.join("\n"));
  }

  private appendHeader(): void {
    const header = [
      "",
      "╔══════════════════════════════════════════════════════════╗",
      "║           Caiode Queue Monitor v1.0                    ║",
      "║           LLM Request Queue Monitoring                 ║",
      "╚══════════════════════════════════════════════════════════╝",
      "",
      `Monitor started at: ${this.formatTimestamp()}`,
      `Update interval: ${this.config.updateIntervalMs}ms`,
      "",
    ];
    this.channel.append(header.join("\n"));
  }

  private appendLog(message: string): void {
    const logLine = `${this.formatTimestamp()} ${message}`;
    this.channel.appendLine(logLine);
  }

  private formatTimestamp(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    const ms = now.getMilliseconds().toString().padStart(3, "0");
    return `${hours}:${minutes}:${seconds}.${ms}`;
  }

  getChannel(): vscode.OutputChannel {
    return this.channel;
  }

  dispose(): void {
    this.stop();
    this.channel.dispose();
    this.removeAllListeners();
  }
}

let globalQueueMonitor: QueueMonitor | undefined;

export function createQueueMonitor(
  queue: GlobalModelRequestQueue,
  config?: Partial<QueueMonitorConfig>
): QueueMonitor {
  if (globalQueueMonitor) {
    globalQueueMonitor.dispose();
  }
  globalQueueMonitor = new QueueMonitor(queue, config);
  return globalQueueMonitor;
}

export function getQueueMonitor(): QueueMonitor | undefined {
  return globalQueueMonitor;
}

export function showQueueMonitor(): void {
  if (globalQueueMonitor) {
    globalQueueMonitor.show();
  }
}

export function hideQueueMonitor(): void {
  if (globalQueueMonitor) {
    globalQueueMonitor.hide();
  }
}

export function toggleQueueMonitor(): void {
  if (globalQueueMonitor) {
    if (globalQueueMonitor.running) {
      globalQueueMonitor.stop();
      globalQueueMonitor.show();
    } else {
      globalQueueMonitor.start();
      globalQueueMonitor.show();
    }
  }
}
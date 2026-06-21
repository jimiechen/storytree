/**
 * @file chat-debug/novel-debug-log-types.ts
 * @description Chat Debug Console 类型定义 — P2-A0 / P3-A
 */

import type { NovelCommand } from '../workflows/novel-command';
import type { LLMStreamEvent } from '../llm/llm-stream-events';

export type NovelDebugCommandKind = 'run' | 'help';

export interface NovelDebugParseResult {
  success: boolean;
  command?: NovelCommand;
  kind?: NovelDebugCommandKind;
  errorCode?: string;
  message?: string;
  /** P3-A：是否使用流式事件回显 */
  stream?: boolean;
  /** P3-A：是否为 dryRun 模式（真实 LLM 不调用，只构造请求） */
  dryRun?: boolean;
}

export type NovelDebugRunStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface NovelDebugLogEntry {
  id: string;
  commandText: string;
  command?: NovelCommand;
  status: NovelDebugRunStatus;
  startedAt: Date;
  completedAt?: Date;
  events: unknown[];
  /** P3-A：流式 LLM 事件 */
  llmEvents?: LLMStreamEvent[];
  result?: unknown;
  error?: string;
}

export interface NovelDebugRunResult {
  success: boolean;
  logId: string;
  command?: NovelCommand;
  events: unknown[];
  /** P3-A：流式 LLM 事件 */
  llmEvents?: LLMStreamEvent[];
  result?: unknown;
  errorCode?: string;
  message?: string;
}

export interface NovelDebugLogStore {
  add(entry: NovelDebugLogEntry): NovelDebugLogEntry;
  update(id: string, patch: Partial<NovelDebugLogEntry>): NovelDebugLogEntry | undefined;
  get(id: string): NovelDebugLogEntry | undefined;
  list(): NovelDebugLogEntry[];
  clear(): void;
}

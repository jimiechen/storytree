/**
 * @file chat-debug/novel-debug-log-types.ts
 * @description Chat Debug Console 类型定义 — P2-A0
 */

import type { NovelCommand } from '../workflows/novel-command';

export type NovelDebugCommandKind = 'run' | 'help';

export interface NovelDebugParseResult {
  success: boolean;
  command?: NovelCommand;
  kind?: NovelDebugCommandKind;
  errorCode?: string;
  message?: string;
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
  result?: unknown;
  error?: string;
}

export interface NovelDebugRunResult {
  success: boolean;
  logId: string;
  command?: NovelCommand;
  events: unknown[];
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

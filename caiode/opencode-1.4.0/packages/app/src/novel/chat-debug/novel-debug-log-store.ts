/**
 * @file chat-debug/novel-debug-log-store.ts
 * @description Chat Debug Log Store — P2-A0
 */

import type { NovelDebugLogEntry, NovelDebugLogStore } from './novel-debug-log-types';

function createId(): string {
  return `ndl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 创建内存型 Debug Log Store。
 */
export function createNovelDebugLogStore(): NovelDebugLogStore {
  const logs = new Map<string, NovelDebugLogEntry>();

  function add(entry: NovelDebugLogEntry): NovelDebugLogEntry {
    const id = entry.id || createId();
    const stored = { ...entry, id };
    logs.set(id, stored);
    return stored;
  }

  function update(id: string, patch: Partial<NovelDebugLogEntry>): NovelDebugLogEntry | undefined {
    const existing = logs.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch, id };
    logs.set(id, updated);
    return updated;
  }

  function get(id: string): NovelDebugLogEntry | undefined {
    return logs.get(id);
  }

  function list(): NovelDebugLogEntry[] {
    return Array.from(logs.values()).sort(
      (a, b) => a.startedAt.getTime() - b.startedAt.getTime(),
    );
  }

  function clear(): void {
    logs.clear();
  }

  return { add, update, get, list, clear };
}

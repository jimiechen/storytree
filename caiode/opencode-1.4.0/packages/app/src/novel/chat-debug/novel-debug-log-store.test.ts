/**
 * @file chat-debug/novel-debug-log-store.test.ts
 * @description Chat Debug Log Store 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createNovelDebugLogStore } from './novel-debug-log-store';
import type { NovelDebugLogEntry } from './novel-debug-log-types';

function makeEntry(overrides?: Partial<NovelDebugLogEntry>): NovelDebugLogEntry {
  return {
    id: 'log-1',
    commandText: '/novel run chapter.generate projectId=proj-1 chapterId=chapter-1',
    status: 'queued',
    startedAt: new Date('2026-06-20T00:00:00Z'),
    events: [],
    ...overrides,
  };
}

describe('NovelDebugLogStore', () => {
  let store = createNovelDebugLogStore();

  beforeEach(() => {
    store = createNovelDebugLogStore();
  });

  it('adds and retrieves a log', () => {
    const entry = makeEntry();
    const stored = store.add(entry);
    expect(stored.id).toBe('log-1');
    expect(store.get('log-1')).toEqual(stored);
  });

  it('generates an id when not provided', () => {
    const entry = makeEntry({ id: undefined as unknown as string });
    const stored = store.add(entry);
    expect(stored.id).toBeTruthy();
    expect(stored.id).not.toBe('log-1');
  });

  it('updates a log entry', () => {
    store.add(makeEntry());
    const updated = store.update('log-1', { status: 'running' });
    expect(updated).toBeDefined();
    expect(updated!.status).toBe('running');
    expect(store.get('log-1')!.status).toBe('running');
  });

  it('returns undefined when updating unknown id', () => {
    const updated = store.update('missing', { status: 'running' });
    expect(updated).toBeUndefined();
  });

  it('lists logs in chronological order', () => {
    store.add(makeEntry({ id: 'a', startedAt: new Date('2026-06-20T00:00:02Z') }));
    store.add(makeEntry({ id: 'b', startedAt: new Date('2026-06-20T00:00:01Z') }));
    store.add(makeEntry({ id: 'c', startedAt: new Date('2026-06-20T00:00:03Z') }));
    const ids = store.list().map((e) => e.id);
    expect(ids).toEqual(['b', 'a', 'c']);
  });

  it('clears all logs', () => {
    store.add(makeEntry());
    expect(store.list().length).toBe(1);
    store.clear();
    expect(store.list().length).toBe(0);
    expect(store.get('log-1')).toBeUndefined();
  });
});

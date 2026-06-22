/**
 * @file llm/usage-tracker.test.ts
 * @description UsageTracker 单元测试 — P3-D
 */

import { describe, it, expect } from 'vitest';
import { createUsageTracker, buildUsageRecord } from './usage-tracker';

describe('createUsageTracker', () => {
  it('should initialize empty by default', () => {
    const tracker = createUsageTracker();
    expect(tracker.list()).toEqual([]);
    expect(tracker.getTotalTokens()).toBe(0);
  });

  it('should initialize with records', () => {
    const tracker = createUsageTracker([
      { requestId: 'r1', profileId: 'p1', modelId: 'm1', promptTokens: 10, completionTokens: 20, totalTokens: 30, createdAt: '2026-01-01T00:00:00Z' },
    ]);
    expect(tracker.list()).toHaveLength(1);
    expect(tracker.getTotalTokens()).toBe(30);
    expect(tracker.getPromptTokens()).toBe(10);
    expect(tracker.getCompletionTokens()).toBe(20);
  });

  it('should accumulate token counts', () => {
    const tracker = createUsageTracker();
    tracker.record({ requestId: 'r1', profileId: 'p1', modelId: 'm1', promptTokens: 100, completionTokens: 50, totalTokens: 150, createdAt: '2026-01-01T00:00:00Z' });
    tracker.record({ requestId: 'r2', profileId: 'p2', modelId: 'm2', promptTokens: 30, completionTokens: 70, totalTokens: 100, createdAt: '2026-01-01T00:00:01Z' });
    expect(tracker.getTotalTokens()).toBe(250);
    expect(tracker.getPromptTokens()).toBe(130);
    expect(tracker.getCompletionTokens()).toBe(120);
  });

  it('should handle undefined token fields as 0', () => {
    const tracker = createUsageTracker();
    tracker.record({ requestId: 'r1', profileId: 'p1', modelId: 'm1', createdAt: '2026-01-01T00:00:00Z' });
    expect(tracker.getTotalTokens()).toBe(0);
  });

  it('should return a copy of records list', () => {
    const tracker = createUsageTracker();
    tracker.record({ requestId: 'r1', profileId: 'p1', modelId: 'm1', totalTokens: 10, createdAt: '2026-01-01T00:00:00Z' });
    const list = tracker.list();
    list.push({ requestId: 'r2', profileId: 'p2', modelId: 'm2', totalTokens: 20, createdAt: '2026-01-01T00:00:01Z' });
    expect(tracker.list()).toHaveLength(1);
  });
});

describe('buildUsageRecord', () => {
  it('should merge usage with profile info', () => {
    const record = buildUsageRecord('req-1', 'profile-1', 'model-1', {
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
    });
    expect(record.requestId).toBe('req-1');
    expect(record.profileId).toBe('profile-1');
    expect(record.modelId).toBe('model-1');
    expect(record.promptTokens).toBe(10);
    expect(record.totalTokens).toBe(30);
    expect(record.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should allow undefined usage', () => {
    const record = buildUsageRecord('req-1', 'profile-1', 'model-1', undefined);
    expect(record.promptTokens).toBeUndefined();
    expect(record.totalTokens).toBeUndefined();
  });
});

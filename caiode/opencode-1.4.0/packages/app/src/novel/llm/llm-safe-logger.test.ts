/**
 * @file llm-safe-logger.test.ts
 * @description 真实 LLM 安全日志脱敏单元测试 — P3-0
 */

import { describe, it, expect } from 'vitest';
import { createSafeLLMLogEntry, maskSecret } from './llm-safe-logger';

describe('LLM Safe Logger', () => {
  it('默认只保留 prompt 前 80 字符', () => {
    const longPrompt = 'a'.repeat(200);
    const entry = createSafeLLMLogEntry({
      requestId: 'req-001',
      adapter: 'mock',
      prompt: longPrompt,
    });
    expect(entry.promptPreview).toBe('a'.repeat(80) + '…');
  });

  it('默认只保留 response 前 120 字符', () => {
    const longResponse = 'b'.repeat(300);
    const entry = createSafeLLMLogEntry({
      requestId: 'req-001',
      adapter: 'mock',
      responseText: longResponse,
    });
    expect(entry.responsePreview).toBe('b'.repeat(120) + '…');
  });

  it('遮蔽 API Key', () => {
    const text = 'key is sk-abcdefghijklmnopqrstuvwxyz1234567890abcdef';
    expect(maskSecret(text)).toBe('key is ***');
  });

  it('遮蔽 Bearer token', () => {
    const text = 'Authorization: Bearer abcdef1234567890abcdef';
    expect(maskSecret(text)).toBe('Authorization: ***');
  });

  it('保留 usage 与 metadata', () => {
    const entry = createSafeLLMLogEntry({
      requestId: 'req-001',
      adapter: 'mock',
      metadata: { projectId: 'proj-001' },
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      error: 'timeout',
    });
    expect(entry.metadata).toEqual({ projectId: 'proj-001' });
    expect(entry.usage).toEqual({ promptTokens: 10, completionTokens: 20, totalTokens: 30 });
    expect(entry.error).toBe('timeout');
  });

  it('空输入稳定返回', () => {
    const entry = createSafeLLMLogEntry({ requestId: 'req-001', adapter: 'mock' });
    expect(entry.requestId).toBe('req-001');
    expect(entry.adapter).toBe('mock');
    expect(entry.promptPreview).toBeUndefined();
    expect(entry.responsePreview).toBeUndefined();
  });
});

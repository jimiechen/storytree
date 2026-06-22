/**
 * @file llm/fallback-handler.test.ts
 * @description FallbackHandler 单元测试 — P3-D
 */

import { describe, it, expect } from 'vitest';
import { executeWithFallback, DEFAULT_FALLBACK_RETRYABLE_CODES } from './fallback-handler';
import type { AdapterExecutionResult } from '../adapters/adapter-types';

describe('executeWithFallback', () => {
  it('should return successful operation result directly', async () => {
    const result = await executeWithFallback(
      async () => ({ success: true, result: { taskId: 't1', attemptId: 1, status: 'completed', text: 'ok', wordCount: 2, summary: '', durationMs: 0 } }),
      async () => ({ success: true, result: { taskId: 't2', attemptId: 1, status: 'completed', text: 'fallback', wordCount: 8, summary: '', durationMs: 0 } }),
      { enabled: true },
    );
    expect(result.success).toBe(true);
    expect(result.result?.text).toBe('ok');
    expect(result.fallback).toBeUndefined();
  });

  it('should not fallback when disabled', async () => {
    const result = await executeWithFallback(
      async () => ({ success: false, errorCode: 'LLM_REQUEST_TIMEOUT', error: 'timeout' }),
      async () => ({ success: true, result: { taskId: 't2', attemptId: 1, status: 'completed', text: 'fallback', wordCount: 8, summary: '', durationMs: 0 } }),
      { enabled: false },
    );
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('LLM_REQUEST_TIMEOUT');
    expect(result.fallback).toBeUndefined();
  });

  it('should fallback on retryable error when enabled', async () => {
    const result = await executeWithFallback(
      async () => ({ success: false, errorCode: 'LLM_NETWORK_ERROR', error: 'network' }),
      async (code) => ({ success: true, result: { taskId: 't2', attemptId: 1, status: 'completed', text: `fallback-${code}`, wordCount: 16, summary: '', durationMs: 0 } }),
      { enabled: true },
    );
    expect(result.success).toBe(true);
    expect(result.fallback).toBe(true);
    expect(result.originalErrorCode).toBe('LLM_NETWORK_ERROR');
    expect(result.result?.text).toBe('fallback-LLM_NETWORK_ERROR');
  });

  it('should not fallback on non-retryable error', async () => {
    const result = await executeWithFallback(
      async () => ({ success: false, errorCode: 'REAL_LLM_NOT_ENABLED', error: 'disabled' }),
      async () => ({ success: true, result: { taskId: 't2', attemptId: 1, status: 'completed', text: 'fallback', wordCount: 8, summary: '', durationMs: 0 } }),
      { enabled: true },
    );
    expect(result.success).toBe(false);
    expect(result.fallback).toBeUndefined();
  });

  it('should propagate fallback failure', async () => {
    const result = await executeWithFallback(
      async () => ({ success: false, errorCode: 'LLM_REQUEST_TIMEOUT', error: 'timeout' }),
      async () => ({ success: false, errorCode: 'FALLBACK_FAILED', error: 'fallback failed' }),
      { enabled: true },
    );
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('FALLBACK_FAILED');
  });

  it('should allow custom retryable codes', async () => {
    const result = await executeWithFallback<AdapterExecutionResult>(
      async () => ({ success: false, errorCode: 'CUSTOM_ERROR', error: 'custom' }),
      async () => ({ success: true, result: { taskId: 't2', attemptId: 1, status: 'completed', text: 'fallback', wordCount: 8, summary: '', durationMs: 0 } }),
      { enabled: true, retryableCodes: ['CUSTOM_ERROR'] },
    );
    expect(result.success).toBe(true);
    expect(result.fallback).toBe(true);
  });
});

describe('DEFAULT_FALLBACK_RETRYABLE_CODES', () => {
  it('should include expected retryable codes', () => {
    expect(DEFAULT_FALLBACK_RETRYABLE_CODES).toContain('LLM_REQUEST_TIMEOUT');
    expect(DEFAULT_FALLBACK_RETRYABLE_CODES).toContain('LLM_NETWORK_ERROR');
    expect(DEFAULT_FALLBACK_RETRYABLE_CODES).toContain('LLM_PROVIDER_ERROR');
    expect(DEFAULT_FALLBACK_RETRYABLE_CODES).toContain('LLM_EMPTY_RESPONSE');
    expect(DEFAULT_FALLBACK_RETRYABLE_CODES).toContain('LLM_REQUEST_FAILED');
  });
});

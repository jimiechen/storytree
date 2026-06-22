/**
 * @file llm/retry-policy.test.ts
 * @description RetryPolicy 单元测试 — P3-C
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_GENERATION_RETRY_POLICY,
  isRetryableError,
  withRetry,
  sleep,
} from './retry-policy';

describe('retry-policy', () => {
  it('should provide default retry policy', () => {
    expect(DEFAULT_GENERATION_RETRY_POLICY.maxAttempts).toBe(2);
    expect(DEFAULT_GENERATION_RETRY_POLICY.backoffMs).toBe(1000);
    expect(DEFAULT_GENERATION_RETRY_POLICY.retryableErrorCodes.length).toBeGreaterThan(0);
  });

  it('should identify retryable errors', () => {
    expect(isRetryableError('LLM_REQUEST_TIMEOUT', DEFAULT_GENERATION_RETRY_POLICY)).toBe(true);
    expect(isRetryableError('REAL_LLM_DISABLED', DEFAULT_GENERATION_RETRY_POLICY)).toBe(false);
  });

  it('should retry and eventually succeed', async () => {
    let attempts = 0;
    const result = await withRetry(
      async () => {
        attempts++;
        if (attempts < 2) {
          const error = new Error('timeout');
          (error as { errorCode: string }).errorCode = 'LLM_REQUEST_TIMEOUT';
          throw error;
        }
        return 'ok';
      },
      { ...DEFAULT_GENERATION_RETRY_POLICY, backoffMs: 0 },
    );
    expect(result).toBe('ok');
    expect(attempts).toBe(2);
  });

  it('should stop retrying on non-retryable error', async () => {
    let attempts = 0;
    await expect(
      withRetry(async () => {
        attempts++;
        const error = new Error('disabled');
        (error as { errorCode: string }).errorCode = 'REAL_LLM_DISABLED';
        throw error;
      }),
    ).rejects.toThrow('disabled');
    expect(attempts).toBe(1);
  });

  it('should sleep for given duration', async () => {
    const start = Date.now();
    await sleep(10);
    expect(Date.now() - start).toBeGreaterThanOrEqual(5);
  });
});

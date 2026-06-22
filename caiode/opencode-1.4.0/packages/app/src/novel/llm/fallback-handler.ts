/**
 * @file llm/fallback-handler.ts
 * @description 真实 LLM 失败回退 — P3-D
 *
 * 仅在 llmFallbackToMockEnabled=true 时对真实网络/超时/空响应错误回退到 mock，
 * 不对 gate 错误回退，不覆盖用户已确认的结果。
 */

import type { AdapterExecutionResult } from '../adapters/adapter-types';

/** 默认可回退的错误码。 */
export const DEFAULT_FALLBACK_RETRYABLE_CODES = [
  'LLM_REQUEST_TIMEOUT',
  'LLM_NETWORK_ERROR',
  'LLM_PROVIDER_ERROR',
  'LLM_EMPTY_RESPONSE',
  'LLM_REQUEST_FAILED',
];

/**
 * 执行 operation，失败时按策略回退到 fallback。
 */
export async function executeWithFallback(
  operation: () => Promise<AdapterExecutionResult>,
  fallback: (errorCode: string) => Promise<AdapterExecutionResult>,
  options?: { enabled?: boolean; retryableCodes?: string[] },
): Promise<AdapterExecutionResult & { fallback?: boolean; originalErrorCode?: string }> {
  const enabled = options?.enabled ?? false;
  const retryableCodes = options?.retryableCodes ?? DEFAULT_FALLBACK_RETRYABLE_CODES;

  const result = await operation();
  if (result.success) return result;

  if (!enabled || !result.errorCode || !retryableCodes.includes(result.errorCode)) {
    return result;
  }

  const fallbackResult = await fallback(result.errorCode);
  if (!fallbackResult.success) return fallbackResult;

  return {
    ...fallbackResult,
    fallback: true,
    originalErrorCode: result.errorCode,
  };
}

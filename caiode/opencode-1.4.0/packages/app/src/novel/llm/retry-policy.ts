/**
 * @file llm/retry-policy.ts
 * @description LLM 调用重试策略 — P3-C
 *
 * P3-C 把真实 LLM 用于章节生成后，网络波动、模型超时或空响应可能导致失败。
 * 本模块提供有限重试机制，避免单次失败就中断用户流程，同时限制重试次数防止费用失控。
 */

/**
 * 重试策略配置。
 */
export interface RetryPolicy {
  /** 最大尝试次数（含第一次） */
  maxAttempts: number;
  /** 每次重试前等待毫秒数 */
  backoffMs: number;
  /** 允许重试的错误码列表 */
  retryableErrorCodes: string[];
}

/**
 * 章节生成默认重试策略。
 *
 * 默认只重试 1 次，避免费用失控。
 */
export const DEFAULT_GENERATION_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 2,
  backoffMs: 1000,
  retryableErrorCodes: [
    'LLM_REQUEST_TIMEOUT',
    'LLM_NETWORK_ERROR',
    'LLM_PROVIDER_ERROR',
    'LLM_EMPTY_RESPONSE',
    'CLIENT_STUB_ONLY',
  ],
};

/**
 * 判断给定错误码是否可重试。
 */
export function isRetryableError(errorCode: string, policy: RetryPolicy): boolean {
  return policy.retryableErrorCodes.includes(errorCode);
}

/**
 * 等待指定毫秒。
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 使用重试策略执行异步操作。
 *
 * @param operation 需要重试的操作；接收当前 attempt 序号（从 1 开始）
 * @param policy 重试策略
 * @param shouldRetry 自定义是否重试判断（可选）
 */
export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  policy: RetryPolicy = DEFAULT_GENERATION_RETRY_POLICY,
  shouldRetry?: (error: unknown, attempt: number) => boolean,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;

      const canRetry = shouldRetry
        ? shouldRetry(error, attempt)
        : isRetryableError(extractErrorCode(error), policy);

      if (!canRetry || attempt === policy.maxAttempts) {
        break;
      }

      if (policy.backoffMs > 0) {
        await sleep(policy.backoffMs);
      }
    }
  }

  throw lastError;
}

/**
 * 从错误对象中提取错误码。
 */
function extractErrorCode(error: unknown): string {
  if (error && typeof error === 'object') {
    if ('errorCode' in error && typeof error.errorCode === 'string') {
      return error.errorCode;
    }
    if ('code' in error && typeof error.code === 'string') {
      return error.code;
    }
  }
  return 'UNKNOWN_ERROR';
}

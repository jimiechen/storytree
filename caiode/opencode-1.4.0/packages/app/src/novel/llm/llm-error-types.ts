/**
 * @file llm-error-types.ts
 * @description 真实 LLM 错误类型 — P3-0 / P3-A
 *
 * 所有 LLM 错误必须结构化，禁止把密钥、完整 prompt 或供应商原始响应暴露给 UI。
 */

/**
 * LLM 错误码。
 *
 * - REAL_LLM_NOT_ENABLED：真实 LLM 总开关未开启。
 * - TARGET_LLM_ADAPTER_DISABLED：目标真实 LLM adapter 开关未开启。
 * - LLM_STREAMING_DISABLED：流式事件总开关未开启。
 * - CLIENT_STUB_ONLY：P3-0 client stub 不会发起真实请求。
 * - ADAPTER_DISABLED：对应 FeatureGate 关闭。
 * - LLM_SECRET_MISSING：缺少真实调用所需密钥（P3-A 使用）。
 * - LLM_REQUEST_TIMEOUT：请求超时（P3-A 使用）。
 * - LLM_REQUEST_CANCELLED：请求被取消（P3-A 使用）。
 * - LLM_REQUEST_FAILED：通用请求失败（P3-A 使用）。
 * - LLM_NETWORK_ERROR：网络层错误（P3-A 使用）。
 * - LLM_PROVIDER_ERROR：供应商返回错误（P3-A 使用）。
 * - LLM_STREAM_PARSE_ERROR：流式响应解析失败（P3-A 使用）。
 * - LLM_EMPTY_RESPONSE：供应商返回空响应（P3-A 使用）。
 * - LLM_SECRET_LEAK：检测到可能泄露密钥的日志 / 错误内容。
 */
export type LLMErrorCode =
  | 'REAL_LLM_NOT_ENABLED'
  | 'TARGET_LLM_ADAPTER_DISABLED'
  | 'LLM_STREAMING_DISABLED'
  | 'CLIENT_STUB_ONLY'
  | 'ADAPTER_DISABLED'
  | 'LLM_SECRET_MISSING'
  | 'LLM_REQUEST_TIMEOUT'
  | 'LLM_REQUEST_CANCELLED'
  | 'LLM_REQUEST_FAILED'
  | 'LLM_NETWORK_ERROR'
  | 'LLM_PROVIDER_ERROR'
  | 'LLM_STREAM_PARSE_ERROR'
  | 'LLM_EMPTY_RESPONSE'
  | 'LLM_SECRET_LEAK';

/**
 * 结构化 LLM 错误。
 */
export class LLMError extends Error {
  readonly code: LLMErrorCode;
  readonly requestId?: string;
  readonly cause?: unknown;

  constructor(code: LLMErrorCode, requestId?: string, options?: { cause?: unknown; message?: string }) {
    super(options?.message ?? code);
    this.code = code;
    this.requestId = requestId;
    this.cause = options?.cause;
    this.name = 'LLMError';
  }
}

/**
 * 判断任意值是否为 LLMError。
 */
export function isLLMError(error: unknown): error is LLMError {
  return error instanceof LLMError;
}

/**
 * 将未知错误转换为安全的字符串消息，避免泄露对象内部结构。
 */
export function toSafeLLMErrorMessage(error: unknown): string {
  if (isLLMError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return 'LLM 请求发生未知错误';
}

/**
 * @file llm-request-types.ts
 * @description 真实 LLM 请求 / 响应 / Usage 类型定义 — P3-0
 *
 * P3-0 只定义类型，不发起真实请求。
 * 所有字段设计以"可审计、可脱敏、可取消"为目标。
 */

/** Token 用量统计。所有字段可选，P3-0 只保留接口，P3-A 再由真实响应填充。 */
export interface LLMUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

/**
 * LLM 请求元数据。
 * 只包含定位信息，不得包含密钥、完整 prompt 或用户隐私文本。
 */
export interface LLMRequestMetadata {
  projectId: string;
  chapterId?: string;
  branchId?: string;
  modelProfileId?: string;
  modelRole?: string;
  skillId?: string;
  workflowId?: string;
  /** P3-C：prompt 上下文是否被裁剪 */
  wasTrimmed?: boolean;
  /** P3-C：chapter.generate 的目标字数，供结果校验使用 */
  targetWordCount?: number;
}

/**
 * 统一 LLM 请求。
 * prompt / systemPrompt 属于敏感数据，禁止直接写入日志。
 */
export interface LLMRequest {
  requestId: string;
  adapter: string;
  commandId?: string;
  workflowId?: string;
  prompt: string;
  systemPrompt?: string;
  stream: boolean;
  timeoutMs: number;
  metadata: LLMRequestMetadata;
}

/**
 * 统一 LLM 响应。
 * rawMetadata 只保留非敏感的结构化元数据，不允许包含完整供应商响应原文。
 */
export interface LLMResponse {
  requestId: string;
  text: string;
  usage?: LLMUsage;
  rawMetadata?: Record<string, unknown>;
}

/**
 * LLM 请求可选参数。
 * AbortSignal 在 P3-0 只做接口预留，P3-A 再验证取消行为。
 */
export interface LLMRequestOptions {
  stream?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
}

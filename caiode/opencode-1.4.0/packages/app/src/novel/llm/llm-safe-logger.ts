/**
 * @file llm-safe-logger.ts
 * @description 真实 LLM 安全日志脱敏工具 — P3-0
 *
 * 默认不记录完整 prompt / response，只保留脱敏后的 preview 与元数据。
 */

import type { LLMUsage } from './llm-request-types';

/**
 * 安全日志输入。
 * prompt / responseText 为敏感字段，禁止直接落盘。
 */
export interface SafeLLMLogInput {
  requestId: string;
  adapter: string;
  prompt?: string;
  responseText?: string;
  metadata?: Record<string, unknown>;
  usage?: LLMUsage;
  error?: string;
}

/**
 * 安全日志条目。
 * 只保留 preview、非敏感元数据、usage、错误信息。
 */
export interface SafeLLMLogEntry {
  requestId: string;
  adapter: string;
  promptPreview?: string;
  responsePreview?: string;
  metadata?: Record<string, unknown>;
  usage?: LLMUsage;
  error?: string;
}

/** prompt preview 最大长度。 */
const PROMPT_PREVIEW_LIMIT = 80;

/** response preview 最大长度。 */
const RESPONSE_PREVIEW_LIMIT = 120;

/** 疑似密钥 / token 的正则。 */
const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/g,
  /Bearer\s+[a-zA-Z0-9\-_]{10,}/gi,
  /api[_-]?key\s*[:=]\s*["']?[a-zA-Z0-9]{10,}/gi,
];

/**
 * 对文本进行密钥遮蔽。
 */
export function maskSecret(text: string): string {
  let masked = text;
  for (const pattern of SECRET_PATTERNS) {
    masked = masked.replace(pattern, '***');
  }
  return masked;
}

/**
 * 截取 preview。
 * 超过限制时保留前缀并追加省略号。
 */
function makePreview(text: string, limit: number): string {
  const normalized = text.trim();
  if (normalized.length <= limit) return normalized;
  return normalized.slice(0, limit) + '…';
}

/**
 * 从安全日志输入生成可落盘的安全日志条目。
 *
 * - prompt 只保留前 80 字符。
 * - response 只保留前 120 字符。
 * - 自动遮蔽疑似密钥。
 * - 保留 metadata / usage / error 中的非敏感字段（调用前仍需确保这些字段不含密钥）。
 */
export function createSafeLLMLogEntry(input: SafeLLMLogInput): SafeLLMLogEntry {
  const promptPreview = input.prompt ? makePreview(maskSecret(input.prompt), PROMPT_PREVIEW_LIMIT) : undefined;
  const responsePreview = input.responseText
    ? makePreview(maskSecret(input.responseText), RESPONSE_PREVIEW_LIMIT)
    : undefined;

  const entry: SafeLLMLogEntry = {
    requestId: input.requestId,
    adapter: input.adapter,
    promptPreview,
    responsePreview,
  };

  if (input.metadata) entry.metadata = input.metadata;
  if (input.usage) entry.usage = input.usage;
  if (input.error) entry.error = maskSecret(input.error);

  return entry;
}

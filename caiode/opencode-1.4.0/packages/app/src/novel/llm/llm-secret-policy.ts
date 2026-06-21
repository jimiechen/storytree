/**
 * @file llm-secret-policy.ts
 * @description 真实 LLM 密钥策略 — P3-0
 *
 * 核心原则：前端源码不持有真实 API Key，浏览器运行时不接触真实密钥。
 */

import { maskSecret } from './llm-safe-logger';

/**
 * 前端代码中禁止出现的密钥风险模式。
 */
export const CLIENT_SIDE_SECRET_RISK_PATTERNS = [
  { pattern: /process\.env\.[A-Z_]*(?:API_?KEY|TOKEN|SECRET)/i, reason: '前端运行时代码直接读取 process.env 密钥' },
  { pattern: /['"`]sk-[a-zA-Z0-9]{20,}['"`]/i, reason: '源码中硬编码 API Key' },
  { pattern: /['"`]Bearer\s+[a-zA-Z0-9\-_]{10,}['"`]/i, reason: '源码中硬编码 Bearer token' },
  { pattern: /api[_-]?key\s*[:=]\s*['"`][a-zA-Z0-9]{10,}['"`]/i, reason: '源码中硬编码 api_key' },
];

/**
 * 检查源代码是否存在客户端密钥风险。
 *
 * 返回 ok=false 与具体违规项；正常代码不会误报。
 */
export function detectClientSideSecretRisk(source: string): { ok: boolean; violations: string[] } {
  const violations: string[] = [];
  for (const { pattern, reason } of CLIENT_SIDE_SECRET_RISK_PATTERNS) {
    if (pattern.test(source)) {
      violations.push(reason);
    }
  }
  return { ok: violations.length === 0, violations };
}

/**
 * 断言源代码不通过客户端接触真实密钥。
 *
 * 不满足时返回 ok=false 与 violations。
 */
export function assertNoClientSideSecretAccess(source: string): { ok: boolean; violations: string[] } {
  return detectClientSideSecretRisk(source);
}

/**
 * 对可能包含密钥的文本做安全遮蔽。
 */
export function sanitizeSecretInText(text: string): string {
  return maskSecret(text);
}

/**
 * 判断给定的 headers / body 字符串是否包含明文密钥。
 */
export function containsPlainSecret(text: string): boolean {
  return /sk-[a-zA-Z0-9]{20,}/i.test(text);
}

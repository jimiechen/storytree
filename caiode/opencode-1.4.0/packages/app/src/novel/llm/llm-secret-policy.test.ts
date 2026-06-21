/**
 * @file llm-secret-policy.test.ts
 * @description 真实 LLM 密钥策略单元测试 — P3-0
 */

import { describe, it, expect } from 'vitest';
import { detectClientSideSecretRisk, assertNoClientSideSecretAccess, containsPlainSecret } from './llm-secret-policy';

describe('LLM Secret Policy', () => {
  it('检测前端代码直接读取 process.env API Key', () => {
    const code = `const key = process.env.OPENAI_API_KEY;`;
    const result = detectClientSideSecretRisk(code);
    expect(result.ok).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('检测硬编码 API Key', () => {
    const code = `const key = "sk-abcdefghijklmnopqrstuvwxyz1234567890abcdef";`;
    const result = detectClientSideSecretRisk(code);
    expect(result.ok).toBe(false);
  });

  it('检测硬编码 Bearer token', () => {
    const code = `const auth = "Bearer abcdef1234567890abcdef";`;
    const result = detectClientSideSecretRisk(code);
    expect(result.ok).toBe(false);
  });

  it('正常代码不违规', () => {
    const code = `const adapter = 'mock';\nexport function execute() { return { text: 'hello' }; }`;
    const result = detectClientSideSecretRisk(code);
    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('assertNoClientSideSecretAccess 与 detect 结果一致', () => {
    const code = `const key = process.env.OPENAI_API_KEY;`;
    expect(assertNoClientSideSecretAccess(code).ok).toBe(false);
  });

  it('containsPlainSecret 识别明文密钥', () => {
    expect(containsPlainSecret('sk-abcdefghijklmnopqrstuvwxyz1234567890abcdef')).toBe(true);
    expect(containsPlainSecret('hello world')).toBe(false);
  });
});

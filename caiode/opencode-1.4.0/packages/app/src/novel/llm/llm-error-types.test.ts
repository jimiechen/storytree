/**
 * @file llm-error-types.test.ts
 * @description 真实 LLM 错误类型单元测试 — P3-0
 */

import { describe, it, expect } from 'vitest';
import { LLMError, isLLMError, toSafeLLMErrorMessage } from './llm-error-types';

describe('LLM Error Types', () => {
  it('LLMError 携带结构化错误码与 requestId', () => {
    const error = new LLMError('CLIENT_STUB_ONLY', 'req-001');
    expect(error.code).toBe('CLIENT_STUB_ONLY');
    expect(error.requestId).toBe('req-001');
    expect(error.message).toBe('CLIENT_STUB_ONLY');
    expect(error.name).toBe('LLMError');
  });

  it('支持自定义 message', () => {
    const error = new LLMError('LLM_REQUEST_FAILED', 'req-001', { message: '自定义失败信息' });
    expect(error.message).toBe('自定义失败信息');
  });

  it('isLLMError 正确识别', () => {
    expect(isLLMError(new LLMError('CLIENT_STUB_ONLY'))).toBe(true);
    expect(isLLMError(new Error('普通错误'))).toBe(false);
    expect(isLLMError('字符串错误')).toBe(false);
  });

  it('toSafeLLMErrorMessage 不泄露对象结构', () => {
    expect(toSafeLLMErrorMessage(new LLMError('CLIENT_STUB_ONLY', 'req-001'))).toBe(
      'CLIENT_STUB_ONLY',
    );
    expect(toSafeLLMErrorMessage(new Error('普通错误'))).toBe('普通错误');
    expect(toSafeLLMErrorMessage({ secret: 'sk-xxx' })).toBe('LLM 请求发生未知错误');
  });
});

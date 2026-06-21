/**
 * @file llm-feature-gates.test.ts
 * @description 真实 LLM FeatureGate 单元测试 — P3-0
 */

import { describe, it, expect } from 'vitest';
import {
  createDefaultRealLLMFeatureGates,
  isRealLLMExecutionAllowed,
  isLLMStreamingAllowed,
} from './llm-feature-gates';

describe('Real LLM FeatureGates', () => {
  it('默认全部真实 LLM gate 关闭', () => {
    const gates = createDefaultRealLLMFeatureGates();
    expect(gates.realLLMEnabled).toBe(false);
    expect(gates.targetLLMAdapterEnabled).toBe(false);
    expect(gates.llmStreamingEnabled).toBe(false);
    expect(gates.llmRequestLogEnabled).toBe(true);
    expect(gates.llmCostTrackingEnabled).toBe(false);
    expect(gates.llmSafePromptLoggingEnabled).toBe(false);
  });

  it('总开关关闭时禁止真实执行', () => {
    const gates = createDefaultRealLLMFeatureGates();
    expect(isRealLLMExecutionAllowed(gates)).toBe(false);
  });

  it('必须同时开启总开关与目标 adapter 开关才允许执行', () => {
    expect(
      isRealLLMExecutionAllowed({ realLLMEnabled: true, targetLLMAdapterEnabled: false }),
    ).toBe(false);
    expect(
      isRealLLMExecutionAllowed({ realLLMEnabled: false, targetLLMAdapterEnabled: true }),
    ).toBe(false);
    expect(
      isRealLLMExecutionAllowed({ realLLMEnabled: true, targetLLMAdapterEnabled: true }),
    ).toBe(true);
  });

  it('流式开关需要执行开关与流式开关同时开启', () => {
    expect(
      isLLMStreamingAllowed({
        realLLMEnabled: true,
        targetLLMAdapterEnabled: true,
        llmStreamingEnabled: false,
      }),
    ).toBe(false);
    expect(
      isLLMStreamingAllowed({
        realLLMEnabled: true,
        targetLLMAdapterEnabled: true,
        llmStreamingEnabled: true,
      }),
    ).toBe(true);
  });
});

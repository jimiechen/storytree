/**
 * @file llm/cost-estimator.test.ts
 * @description CostEstimator 单元测试 — P3-D
 */

import { describe, it, expect } from 'vitest';
import { estimateCost, estimateCostByChars } from './cost-estimator';
import type { ModelProfile } from './model-profile';

const mockProfile: ModelProfile = {
  id: 'deepseek-flash',
  name: 'DeepSeek Flash',
  adapter: 'real-llm',
  provider: 'deepseek',
  modelId: 'deepseek-v4-flash',
  maxTokens: 2048,
  temperature: 0.7,
  costPer1KPromptTokens: 0.05,
  costPer1KCompletionTokens: 0.1,
};

describe('estimateCost', () => {
  it('should calculate cost based on token usage', () => {
    const cost = estimateCost(mockProfile, {
      promptTokens: 2000,
      completionTokens: 1000,
      totalTokens: 3000,
    });
    expect(cost.currency).toBe('CNY-CENT');
    expect(cost.promptCost).toBe(0.1);
    expect(cost.completionCost).toBe(0.1);
    expect(cost.totalCost).toBe(0.2);
  });

  it('should handle zero tokens', () => {
    const cost = estimateCost(mockProfile, {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    });
    expect(cost.promptCost).toBe(0);
    expect(cost.completionCost).toBe(0);
    expect(cost.totalCost).toBe(0);
  });

  it('should round to 2 decimal places', () => {
    const cost = estimateCost(mockProfile, {
      promptTokens: 1234,
      completionTokens: 5678,
      totalTokens: 6912,
    });
    expect(cost.promptCost).toBe(0.06);
    expect(cost.completionCost).toBe(0.57);
    expect(cost.totalCost).toBe(0.63);
  });
});

describe('estimateCostByChars', () => {
  it('should convert chars to tokens and estimate cost', () => {
    const cost = estimateCostByChars(mockProfile, 2000, 1000);
    expect(cost.promptCost).toBe(0.1);
    expect(cost.completionCost).toBe(0.1);
    expect(cost.totalCost).toBe(0.2);
  });
});

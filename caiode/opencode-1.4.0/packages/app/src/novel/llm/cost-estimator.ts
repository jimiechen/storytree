/**
 * @file llm/cost-estimator.ts
 * @description LLM 成本估算 — P3-D
 *
 * 仅返回估算值，不触发真实支付，不作为账单展示。
 */

import type { ModelProfile } from './model-profile';
import type { LLMUsage } from './llm-request-types';

/** 成本估算结果。 */
export interface CostEstimate {
  promptCost: number;
  completionCost: number;
  totalCost: number;
  currency: 'CNY-CENT';
}

/**
 * 按 token 用量估算成本。
 */
export function estimateCost(profile: ModelProfile, usage: LLMUsage): CostEstimate {
  const promptCost = Math.round(((usage.promptTokens ?? 0) / 1000) * profile.costPer1KPromptTokens * 100) / 100;
  const completionCost = Math.round(((usage.completionTokens ?? 0) / 1000) * profile.costPer1KCompletionTokens * 100) / 100;
  return {
    promptCost,
    completionCost,
    totalCost: Math.round((promptCost + completionCost) * 100) / 100,
    currency: 'CNY-CENT',
  };
}

/**
 * 按字符数粗略估算成本（中文 ≈ 1 token / 字，留余量）。
 */
export function estimateCostByChars(
  profile: ModelProfile,
  promptChars: number,
  completionChars: number,
): CostEstimate {
  const promptTokens = Math.ceil(promptChars);
  const completionTokens = Math.ceil(completionChars);
  return estimateCost(profile, {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
  });
}

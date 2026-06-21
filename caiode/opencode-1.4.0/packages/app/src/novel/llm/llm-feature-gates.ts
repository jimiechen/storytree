/**
 * @file llm-feature-gates.ts
 * @description 真实 LLM 相关 FeatureGate 定义 — P3-0 / P3-A
 *
 * P3-0 只做 readiness：所有真实 LLM 相关 gate 默认关闭，
 * 保证 P3-0 阶段不会发起真实模型调用，同时为 P3-A 的受控试点保留开关。
 */

import type { LLMErrorCode } from './llm-error-types';

/**
 * 真实 LLM 相关 FeatureGate。
 *
 * - realLLMEnabled：真实 LLM 能力的总开关，默认 false。
 * - targetLLMAdapterEnabled：是否允许显式路由到真实 LLM adapter，默认 false。
 * - llmStreamingEnabled：是否允许流式事件回显，默认 false。
 * - llmRequestLogEnabled：是否允许记录请求元数据，默认 true（只记录脱敏信息）。
 * - llmCostTrackingEnabled：是否启用费用追踪，默认 false。
 * - llmSafePromptLoggingEnabled：是否允许记录完整 prompt，默认 false（不允许）。
 */
export interface RealLLMFeatureGates {
  realLLMEnabled: boolean;
  targetLLMAdapterEnabled: boolean;
  llmStreamingEnabled: boolean;
  llmRequestLogEnabled: boolean;
  llmCostTrackingEnabled: boolean;
  llmSafePromptLoggingEnabled: boolean;
}

/**
 * 创建默认关闭的真实 LLM FeatureGate。
 */
export function createDefaultRealLLMFeatureGates(): RealLLMFeatureGates {
  return {
    realLLMEnabled: false,
    targetLLMAdapterEnabled: false,
    llmStreamingEnabled: false,
    llmRequestLogEnabled: true,
    llmCostTrackingEnabled: false,
    llmSafePromptLoggingEnabled: false,
  };
}

/**
 * 判断当前 gate 是否允许真实 LLM 执行。
 *
 * 必须同时满足总开关与目标 adapter 开关，避免单个开关误开导致真实调用。
 */
export function isRealLLMExecutionAllowed(gates: Partial<RealLLMFeatureGates>): boolean {
  return Boolean(gates.realLLMEnabled && gates.targetLLMAdapterEnabled);
}

/**
 * 判断当前 gate 是否允许流式事件。
 */
export function isLLMStreamingAllowed(gates: Partial<RealLLMFeatureGates>): boolean {
  return Boolean(gates.realLLMEnabled && gates.targetLLMAdapterEnabled && gates.llmStreamingEnabled);
}

/**
 * Gate 校验结果。
 */
export type RealLLMGateCheckResult =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly code: LLMErrorCode; readonly message: string };

/**
 * 断言当前 gate 允许真实 LLM 执行。
 *
 * P3-A 在发起真实调用前必须调用此函数，确保双 gate 同时开启。
 */
export function assertRealLLMExecutionAllowed(
  gates: Partial<RealLLMFeatureGates>,
): RealLLMGateCheckResult {
  if (!gates.realLLMEnabled) {
    return {
      allowed: false,
      code: 'REAL_LLM_NOT_ENABLED',
      message: 'realLLMEnabled 未开启，禁止真实 LLM 调用',
    };
  }
  if (!gates.targetLLMAdapterEnabled) {
    return {
      allowed: false,
      code: 'TARGET_LLM_ADAPTER_DISABLED',
      message: 'targetLLMAdapterEnabled 未开启，禁止路由到真实 LLM adapter',
    };
  }
  return { allowed: true };
}

/**
 * 断言当前 gate 允许流式事件。
 *
 * 流式需要执行开关与流式开关同时开启。
 */
export function assertLLMStreamingAllowed(
  gates: Partial<RealLLMFeatureGates>,
): RealLLMGateCheckResult {
  const base = assertRealLLMExecutionAllowed(gates);
  if (!base.allowed) return base;
  if (!gates.llmStreamingEnabled) {
    return {
      allowed: false,
      code: 'LLM_STREAMING_DISABLED',
      message: 'llmStreamingEnabled 未开启，禁止流式回显',
    };
  }
  return { allowed: true };
}

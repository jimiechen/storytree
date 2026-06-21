/**
 * @file llm-feature-gates.ts
 * @description 真实 LLM 相关 FeatureGate 定义 — P3-0
 *
 * P3-0 只做 readiness：所有真实 LLM 相关 gate 默认关闭，
 * 保证 P3-0 阶段不会发起真实模型调用，同时为 P3-A 的受控试点保留开关。
 */

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

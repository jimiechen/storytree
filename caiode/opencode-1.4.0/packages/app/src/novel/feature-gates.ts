/**
 * @file feature-gates.ts
 * @description NovelForge FeatureGate 默认值 — P2-E / P3-A
 *
 * P2 阶段所有依赖真实外部服务的功能默认关闭，避免未实现功能伪装成功。
 * AdapterRouter 接收 AdapterFeatureGates；UI 组件通过 useFeatureGates 读取完整 Gate。
 */

import type { AdapterFeatureGates } from './adapters/adapter-types';

/**
 * Novel 模块完整 FeatureGate。
 * 默认值全部为 false，仅 dev-only 的 chatDebugEnabled / branchExperimentEnabled 可为 true。
 */
export interface NovelFeatureGates {
  realLLMEnabled: boolean;
  openCodeAdapterEnabled: boolean;
  claudeCodeAdapterEnabled: boolean;
  gitWorktreeEnabled: boolean;
  customSkillEnabled: boolean;
  projectCommandEnabled: boolean;
  paymentEnabled: boolean;
  cloudSyncEnabled: boolean;
  exportEnabled: boolean;
  importEnabled: boolean;
  bookAnalysisEnabled: boolean;
  nameGeneratorEnabled: boolean;
  guide25Enabled: boolean;
  batchGenerationEnabled: boolean;
  chatDebugEnabled: boolean;
  branchExperimentEnabled: boolean;

  // P3-0 Real LLM Readiness gates
  targetLLMAdapterEnabled: boolean;
  llmStreamingEnabled: boolean;
  llmRequestLogEnabled: boolean;
  llmCostTrackingEnabled: boolean;
  llmSafePromptLoggingEnabled: boolean;

  // P3-D Model Routing + Cost Governance gates
  modelRoutingEnabled: boolean;
  llmFallbackToMockEnabled: boolean;
  modelSelectionUIEnabled: boolean;

  // PAGE-03 Backend Storage — 后端真实数据存储
  realNovelBackendEnabled: boolean;
}

/**
 * P2 默认全部关闭的 Adapter 相关 Gate。
 * 显式请求被关闭的 adapter 时，Router 返回 ADAPTER_DISABLED 而不是伪成功执行。
 */
export function createDefaultAdapterFeatureGates(): AdapterFeatureGates {
  return {
    // P3-D 测试验收：AdapterRouter 默认 gates 必须与 NovelFeatureGates 保持一致
    // 否则 agent-run.tool.ts 会拿到关闭的 gates，导致真实 LLM 路由被拦截
    realLLMEnabled: true,
    targetLLMAdapterEnabled: true,
    openCodeAdapterEnabled: false,
    claudeCodeAdapterEnabled: false,
    modelRoutingEnabled: true,
  };
}

/**
 * P2 默认完整 Gate。
 * chatDebugEnabled / branchExperimentEnabled 在开发态可局部开启，不影响生产默认。
 */
export function createDefaultNovelFeatureGates(): NovelFeatureGates {
  return {
    realLLMEnabled: true,             // false → true (2026-06-23 测试真实 DeepSeek)
    openCodeAdapterEnabled: false,
    claudeCodeAdapterEnabled: false,
    gitWorktreeEnabled: false,
    customSkillEnabled: false,
    projectCommandEnabled: false,
    paymentEnabled: false,
    cloudSyncEnabled: false,
    exportEnabled: false,
    importEnabled: false,
    bookAnalysisEnabled: false,
    nameGeneratorEnabled: false,
    guide25Enabled: false,
    batchGenerationEnabled: false,
    chatDebugEnabled: false,
    branchExperimentEnabled: false,

    // P3-0 Real LLM Readiness — 2026-06-23 测试验收临时开启
    targetLLMAdapterEnabled: true,   // false → true (测试真实 DeepSeek 调用)
    llmStreamingEnabled: true,        // false → true (continue 命令使用 stream 路径)
    llmRequestLogEnabled: true,
    llmCostTrackingEnabled: false,
    llmSafePromptLoggingEnabled: false,

    // P3-D — 2026-06-23 测试验收临时开启
    modelRoutingEnabled: true,        // false → true (P3-D：未指定 adapter 时由 gates 决定 real-llm)
    llmFallbackToMockEnabled: true,   // false → true（失败时 fallback 到 mock）
    modelSelectionUIEnabled: false,

    // PAGE-03 Backend Storage — 默认关闭，开启后使用 HTTP Provider
    realNovelBackendEnabled: false,
  };
}

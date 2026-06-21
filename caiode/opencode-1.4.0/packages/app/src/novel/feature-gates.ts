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
}

/**
 * P2 默认全部关闭的 Adapter 相关 Gate。
 * 显式请求被关闭的 adapter 时，Router 返回 ADAPTER_DISABLED 而不是伪成功执行。
 */
export function createDefaultAdapterFeatureGates(): AdapterFeatureGates {
  return {
    realLLMEnabled: false,
    targetLLMAdapterEnabled: false,
    openCodeAdapterEnabled: false,
    claudeCodeAdapterEnabled: false,
  };
}

/**
 * P2 默认完整 Gate。
 * chatDebugEnabled / branchExperimentEnabled 在开发态可局部开启，不影响生产默认。
 */
export function createDefaultNovelFeatureGates(): NovelFeatureGates {
  return {
    realLLMEnabled: false,
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

    // P3-0 Real LLM Readiness 默认全部关闭
    targetLLMAdapterEnabled: false,
    llmStreamingEnabled: false,
    llmRequestLogEnabled: true,
    llmCostTrackingEnabled: false,
    llmSafePromptLoggingEnabled: false,
  };
}

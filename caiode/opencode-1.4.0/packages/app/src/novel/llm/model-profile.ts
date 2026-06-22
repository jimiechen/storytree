/**
 * @file llm/model-profile.ts
 * @description 模型配置实体 — P3-D
 *
 * ModelProfile 描述一个可路由的模型配置，包括供应商、模型ID、生成参数与估算单价。
 * 所有成本字段仅为估算，不触发真实支付，也不作为账单展示。
 */

/** 创作任务角色，用于默认模型路由策略。 */
export type ModelRole = 'draft' | 'rewrite' | 'audit' | 'outline' | 'summary' | 'critic';

/** 模型配置。 */
export interface ModelProfile {
  id: string;
  name: string;
  adapter: 'real-llm' | 'mock';
  provider: 'deepseek' | 'openai' | 'disabled';
  modelId: string;
  maxTokens: number;
  temperature: number;
  /** 估算单价：prompt token / 千 token，单位人民币分 */
  costPer1KPromptTokens: number;
  /** 估算单价：completion token / 千 token，单位人民币分 */
  costPer1KCompletionTokens: number;
}

/** 默认模型配置列表。默认启用低价/轻量模型。 */
export const DEFAULT_MODEL_PROFILES: ModelProfile[] = [
  {
    id: 'deepseek-flash',
    name: 'DeepSeek Flash',
    adapter: 'real-llm',
    provider: 'deepseek',
    modelId: 'deepseek-v4-flash',
    maxTokens: 2048,
    temperature: 0.7,
    costPer1KPromptTokens: 0.05,
    costPer1KCompletionTokens: 0.1,
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    adapter: 'real-llm',
    provider: 'deepseek',
    modelId: 'deepseek-chat',
    maxTokens: 4096,
    temperature: 0.7,
    costPer1KPromptTokens: 0.1,
    costPer1KCompletionTokens: 0.2,
  },
  {
    id: 'mock-default',
    name: 'Mock',
    adapter: 'mock',
    provider: 'disabled',
    modelId: 'mock',
    maxTokens: 0,
    temperature: 0,
    costPer1KPromptTokens: 0,
    costPer1KCompletionTokens: 0,
  },
];

/** 所有支持的 model role。 */
export const MODEL_ROLES: ModelRole[] = ['draft', 'rewrite', 'audit', 'outline', 'summary', 'critic'];
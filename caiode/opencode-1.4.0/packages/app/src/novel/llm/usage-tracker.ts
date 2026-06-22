/**
 * @file llm/usage-tracker.ts
 * @description LLM 用量记录 — P3-D
 *
 * 默认内存存储，不持久化到用户目录。
 * 从 LLMRequestCompletedEvent.usage 读取用量并记录。
 */

import type { LLMUsage } from './llm-request-types';

/** 单次用量记录。 */
export interface LLMUsageRecord {
  requestId: string;
  profileId: string;
  modelId: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  createdAt: string;
}

/** 用量记录器接口。 */
export interface UsageTracker {
  record(record: LLMUsageRecord): void;
  list(): LLMUsageRecord[];
  getTotalTokens(): number;
  getPromptTokens(): number;
  getCompletionTokens(): number;
}

/**
 * 创建内存用量记录器。
 */
export function createUsageTracker(initial: LLMUsageRecord[] = []): UsageTracker {
  const records: LLMUsageRecord[] = [...initial];

  return {
    record(record) {
      records.push(record);
    },

    list() {
      return [...records];
    },

    getTotalTokens() {
      return records.reduce((sum, r) => sum + (r.totalTokens ?? 0), 0);
    },

    getPromptTokens() {
      return records.reduce((sum, r) => sum + (r.promptTokens ?? 0), 0);
    },

    getCompletionTokens() {
      return records.reduce((sum, r) => sum + (r.completionTokens ?? 0), 0);
    },
  };
}

/** 默认全局用量记录器（可用，但建议按 context 注入）。 */
export function createDefaultUsageTracker(): UsageTracker {
  return createUsageTracker();
}

/**
 * 将 LLMUsage 与 profile 信息合并为记录。
 */
export function buildUsageRecord(
  requestId: string,
  profileId: string,
  modelId: string,
  usage?: LLMUsage,
): LLMUsageRecord {
  return {
    requestId,
    profileId,
    modelId,
    promptTokens: usage?.promptTokens,
    completionTokens: usage?.completionTokens,
    totalTokens: usage?.totalTokens,
    createdAt: new Date().toISOString(),
  };
}

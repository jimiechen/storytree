/**
 * @file adapters/novel-agent-adapter.ts
 * @description AI Agent 适配器接口 — P1-A 基础层
 *
 * 定义 NovelAgentAdapter 接口，所有 AI 操作通过此抽象执行。
 * P1 阶段仅实现 MockAgentAdapter，不接真实 LLM。
 */

import type { NovelCommand } from '../workflows/novel-command';
import type { NovelAgentResult } from '../types/ai-task';

// ─── Agent Adapter 接口 ─────────────────────────────────────────────────

/**
 * 小说 AI Agent 适配器接口。
 * 实现"策略模式"：P1 用 MockAgentAdapter，后续可替换为真实 LLM 适配器。
 */
export interface NovelAgentAdapter {
  /** 适配器名称（用于日志/调试） */
  readonly name: string;

  /**
   * 执行命令并返回结果。
   *
   * @param command  构建好的小说编辑器命令
   * @returns        Agent 终态结果（含 Info-Lite 信息审计数据）
   */
  run(command: NovelCommand): Promise<NovelAgentResult>;
}

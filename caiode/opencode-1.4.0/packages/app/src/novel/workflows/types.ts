/**
 * @file workflows/types.ts
 * @description 工作流核心类型 — P1-A 基础层
 *
 * 修正项: #6(status 终态/运行态分离)
 */

import type { ChapterInformationState } from '../types/information-flow';
import type { NovelAgentResult } from '../types/ai-task';

// ─── 工作流状态（含执行中状态）──────────────────────────────────────────

/**
 * 工作流执行状态 — 包含中间态（running/pending）。
 * 与 AgentResultStatus 不同：AgentResult 只表达终态。
 */
export type WorkflowStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

// ─── 工作流上下文 ───────────────────────────────────────────────────────

/** 单次工作流执行的完整上下文 */
export interface WorkflowContext {
  /** 工作流 ID */
  workflowId: string;
  /** 当前状态 */
  status: WorkflowStatus;
  /** 关联的章节 ID */
  chapterId: string;
  /** 关联的项目 ID */
  projectId: string;
  /** Agent 执行结果（终态时填充） */
  result?: NovelAgentResult;
  /** 信息审计快照（终态时填充） */
  informationState?: ChapterInformationState;
  /** 错误信息 */
  error?: string;
  /** 创建时间 */
  createdAt: Date;
  /** 完成时间 */
  completedAt?: Date;
}

// ─── 工作流结果（内部传递用）───────────────────────────────────────────

/** 工作流执行返回值 */
export interface WorkflowResult {
  result: NovelAgentResult;
  informationState?: ChapterInformationState;
  durationMs: number;
}

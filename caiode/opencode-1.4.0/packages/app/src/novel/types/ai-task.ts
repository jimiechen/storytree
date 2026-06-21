import type { ChapterInformationState } from './information-flow';

export type AITaskStatus =
  | 'pending'
  | 'running'
  | 'completed'    // ← 修正#6: 原 'success' 统一为 'completed'
  | 'failed'
  | 'cancelled'
  | 'denied'
  | 'quota';

export type AITaskType =
  | 'continue-writing'
  | 'rewrite-selection'
  | 'summarize-chapter'
  | 'character-voice';

export interface AITaskInput {
  type: AITaskType;
  chapterId: string;
  text: string;
  selectedText?: string;
  characterId?: string;
}

export interface AITaskOutput {
  text: string;
  wordCount: number;
}

export interface AITask {
  id: string;
  type: AITaskType;
  chapterId: string;
  status: AITaskStatus;
  input: {
    text: string;
    selectedText?: string;
    characterId?: string;
  };
  /** P3-B：流式生成过程中的实时预览文本，不超过 200 字符 */
  preview?: string;
  output?: AITaskOutput;
  error?: string;
  duration?: number;
  createdAt: Date;
  completedAt?: Date;
}

// ─── NovelAgentResult（Agent 终态结果）───────────────────────────────────

/** Agent 结果状态 — 仅终态值（修正#6: pending/running 归 WorkflowStatus） */
export type AgentResultStatus = 'completed' | 'failed' | 'cancelled' | 'denied' | 'quota';

/**
 * AI Agent 执行结果。
 * 由 NovelAgentAdapter.run() 返回，包含生成的文本和 Info-Lite 信息审计数据。
 */
export interface NovelAgentResult {
  /** 任务 ID（由 command 派生，同一 command 相同） */
  taskId: string;
  /** 执行尝试 ID（全局递增，每次 run() 自增 1，retry 必不同） */
  attemptId: number;
  /** 终态状态（completed / failed / cancelled / denied / quota） */
  status: AgentResultStatus;
  /** 生成的正文文本 */
  text: string;
  /** 字数 */
  wordCount: number;
  /** 章节摘要 */
  summary: string;
  /** 错误信息（status=failed 时填充） */
  error?: string;
  /** 耗时 ms */
  durationMs: number;
  /** Info-Lite 信息审计状态 */
  informationState?: ChapterInformationState;
}

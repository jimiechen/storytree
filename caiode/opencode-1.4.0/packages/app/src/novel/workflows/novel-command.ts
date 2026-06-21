/**
 * @file workflows/novel-command.ts
 * @description 小说编辑器命令类型 — P1-A 基础层
 *
 * 修正项: #5(contextRefs 使用 string[])
 */

import type { AIWritingCommand } from '../types/editor';
import type { AdapterKind } from '../adapters/adapter-types';

// ─── 命令类型枚举 ───────────────────────────────────────────────────────

export type NovelCommandType =
  | 'chapter.generate'
  | 'chapter.rewrite'
  | 'chapter.expand'
  | 'chapter.polish'
  | 'chapter.summarize'
  | 'chapter.extract-info';

// ─── NovelCommand ────────────────────────────────────────────────────────

/**
 * 小说编辑器命令。
 * 由 UI 操作（按钮点击）构建，传入 AgentAdapter 执行。
 */
export interface NovelCommand {
  /** 命令类型 */
  type: NovelCommandType;
  /** 关联章节 ID */
  chapterId: string;
  /** 关联项目 ID */
  projectId: string;
  /** 章节序号（用于确定性 ID 生成） */
  chapterIndex: number;
  /** 小说类型（用于确定性评分/ID 生成） */
  genre: string;
  /** AI 写作命令子类型 */
  command?: AIWritingCommand;
  /** 待处理文本（续写时的已有正文 / 改写时的选中文本） */
  text: string;
  /** 选中的文本片段（改写/扩写场景） */
  selectedText?: string;
  /** 目标字数 */
  targetWordCount?: number;
  /** 上下文引用 ID 列表（修正#5: string[] 而非 Set<string>） */
  contextRefs?: string[];
  /** 命令创建时间 */
  createdAt: Date;

  /**
   * P2-0B 扩展字段：workspace / branch / worktree / model / skill / workflow。
   * P2-D 由 NovelActionDispatcher 从 UI 透传，不执行真实 Git Worktree 或多模型路由。
   */
  workspaceId?: string;
  branchId?: string;
  worktreeId?: string;
  modelProfileId?: string;
  skillId?: string;
  workflowId?: string;

  /**
   * P2-E 扩展：Chat Debug 可显式指定 adapter。
   * 仅用于调试路由边界；P2 阶段 opencode-stub / claudecode-stub 默认被 FeatureGate 关闭。
   */
  adapterKind?: AdapterKind;
}

// ─── 工厂函数 ───────────────────────────────────────────────────────────

/**
 * 构建章节生成命令。
 */
export function createChapterGenerateCommand(params: {
  chapterId: string;
  projectId: string;
  chapterIndex: number;
  genre: string;
  text: string;
  targetWordCount?: number;
  contextRefs?: string[];
}): NovelCommand {
  return {
    type: 'chapter.generate',
    ...params,
    createdAt: new Date(),
  };
}

/**
 * 构建 AI 写作命令（continue/rewrite/expand/polish/summarize）。
 */
export function createAIWritingCommand(params: {
  chapterId: string;
  projectId: string;
  chapterIndex: number;
  genre: string;
  command: AIWritingCommand;
  text: string;
  selectedText?: string;
  targetWordCount?: number;
  contextRefs?: string[];
}): NovelCommand {
  return {
    type: 'chapter.rewrite',
    ...params,
    createdAt: new Date(),
  };
}

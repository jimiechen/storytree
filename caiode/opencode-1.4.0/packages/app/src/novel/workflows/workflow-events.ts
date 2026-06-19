/**
 * @file workflows/workflow-events.ts
 * @description 工作流事件类型定义 — P1-B 核心层
 *
 * 定义 7 种工作流事件，作为 Command → Mutation 的中间契约。
 * 修正项: #8(仅生成不写回), #9(mutations 显式注入)
 */

import type { ChapterInformationState } from '../types/information-flow';

// ─── 事件类型联合 ─────────────────────────────────────────────────────

export type NovelWorkflowEventType =
  | 'chapter.generated'
  | 'chapter.extracted'
  | 'character.updated'
  | 'world.referenced'
  | 'achievement.progressed'
  | 'profile.stats.updated'
  | 'information.assessed';

// ─── 基础事件接口 ─────────────────────────────────────────────────────

export interface BaseWorkflowEvent {
  /** 事件类型 */
  type: NovelWorkflowEventType;
  /** 关联的工作流 ID */
  workflowId: string;
  /** 触发时间戳（ISO 8601） */
  timestamp: string;
}

// ─── 1. chapter.generated — AI 续写 / 章节生成完成 ──────────────────

export interface ChapterGeneratedEvent extends BaseWorkflowEvent {
  type: 'chapter.generated';
  /** 目标章节 ID */
  chapterId: string;
  /** 项目 ID */
  projectId: string;
  /** 生成的正文内容 */
  content: string;
  /** 字数 */
  wordCount: number;
  /** 摘要 */
  summary: string;
  /** Info-Lite 信息审计状态 */
  informationState?: ChapterInformationState;
}

// ─── 2. chapter.extracted — AI 信息提取完成 ─────────────────────────

export interface ChapterExtractedEvent extends BaseWorkflowEvent {
  type: 'chapter.extracted';
  chapterId: string;
  projectId: string;
  summary: string;
  characters: string[];
  worldItems: string[];
  keyEvents: string;
  protagonistState: string;
  informationState?: ChapterInformationState;
}

// ─── 3. character.updated — 角色外观/状态变更 ────────────────────────

export interface CharacterUpdatedEvent extends BaseWorkflowEvent {
  type: 'character.updated';
  characterIds: string[];
  chapterId: string;
}

// ─── 4. world.referenced — 世界物品引用 ──────────────────────────────

export interface WorldReferencedEvent extends BaseWorkflowEvent {
  type: 'world.referenced';
  worldItemIds: string[];
  chapterId: string;
}

// ─── 5. achievement.progressed — 成就进度累加 ────────────────────────

export interface AchievementProgressedEvent extends BaseWorkflowEvent {
  type: 'achievement.progressed';
  achievementId: string;
  delta: number;
}

// ─── 6. profile.stats.updated — 个人中心统计更新 ────────────────────

export interface ProfileStatsUpdatedEvent extends BaseWorkflowEvent {
  type: 'profile.stats.updated';
  projectId: string;
  wordCountDelta: number;
  generationCountDelta: number;
  creditDelta: number;
}

// ─── 7. information.assessed — 信息审计记录（仅日志）─────────────────

export interface InformationAssessedEvent extends BaseWorkflowEvent {
  type: 'information.assessed';
  chapterId: string;
  projectId: string;
  auditScore?: number;
  entropyDelta?: number;
  atomCount: number;
  linkCount: number;
}

// ─── 联合类型 ─────────────────────────────────────────────────────────

export type NovelWorkflowEvent =
  | ChapterGeneratedEvent
  | ChapterExtractedEvent
  | CharacterUpdatedEvent
  | WorldReferencedEvent
  | AchievementProgressedEvent
  | ProfileStatsUpdatedEvent
  | InformationAssessedEvent;

// ─── WorkflowMutations 接口（修正#9：显式注入，无全局变量）───────────

/**
 * Store 写回方法集合。
 * 由 useNovelWorkflow 或测试代码注入 applyWorkflowEvents。
 * 不使用 initWorkflowMutations() 全局初始化模式。
 */
export interface WorkflowMutations {
  updateChapterContent: (chapterId: string, content: string) => void;
  updateChapterSummary: (chapterId: string, summary: string) => void;
  updateChapterWordCount: (chapterId: string, wordCount: number) => void;
  updateChapterInfoState: (chapterId: string, state: ChapterInformationState) => void;
  updateChapterExtractedInfo: (
    chapterId: string,
    info: { summary: string; characters: string[]; worldItems: string[]; keyEvents: string; protagonistState: string; informationState?: ChapterInformationState },
  ) => void;
  updateCharacterAppearance: (charIds: string[], chapterId: string) => void;
  incrementWorldReference: (itemIds: string[], chapterId: string) => void;
  addAchievementProgress: (achievementId: string, delta: number) => void;
  updateProfileStats: (projectId: string, delta: { words: number; generations: number; credits: number }) => void;
  logDiscardedTask: (taskId: string) => void;
}

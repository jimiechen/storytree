/**
 * @file workflows/index.ts
 * @description 工作流模块统一导出 — P1-B
 */

// 类型
export type {
  WorkflowStatus,
  WorkflowContext,
  WorkflowResult,
} from './types';

// 命令
export type { NovelCommandType, NovelCommand } from './novel-command';
export { createChapterGenerateCommand, createAIWritingCommand } from './novel-command';

// 事件
export type {
  NovelWorkflowEventType,
  BaseWorkflowEvent,
  ChapterGeneratedEvent,
  ChapterExtractedEvent,
  CharacterUpdatedEvent,
  WorldReferencedEvent,
  AchievementProgressedEvent,
  ProfileStatsUpdatedEvent,
  InformationAssessedEvent,
  NovelWorkflowEvent,
  WorkflowMutations,
} from './workflow-events';
export { getWorkflowEventLog, clearWorkflowEventLog } from './apply-workflow-events';

// 编排
export { runMockGeneration } from './mock-generation-workflow';

// 写回
export { applyWorkflowEvents } from './apply-workflow-events';

/**
 * @file workflows/engine/workflow-command-normalizer.ts
 * @description 命令归一化：把 P1/P2-A0 NovelCommand 转为 Workspace-aware NormalizedNovelCommand — P2-A
 */

import type { NovelCommand } from '../novel-command';
import type { NormalizedNovelCommand } from './workflow-definition-types';

interface NovelCommandExtension {
  workspaceId?: string;
  branchId?: string;
  worktreeId?: string;
  modelProfileId?: string;
  skillId?: string;
  workflowId?: string;
}

type ExtendableNovelCommand = NovelCommand & Partial<NovelCommandExtension>;

function createCommandId(): string {
  return `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function inferSkillId(commandType: NovelCommand['type']): string {
  switch (commandType) {
    case 'chapter.generate':
    case 'chapter.rewrite':
    case 'chapter.expand':
    case 'chapter.polish':
    case 'chapter.summarize':
      return 'writing';
    case 'chapter.extract-info':
      return 'info-theory';
    default:
      return 'unknown';
  }
}

function inferWorkflowId(commandType: NovelCommand['type']): string {
  switch (commandType) {
    case 'chapter.generate':
      return 'chapter.generate';
    case 'chapter.rewrite':
    case 'chapter.expand':
    case 'chapter.polish':
    case 'chapter.summarize':
      return 'chapter.continue';
    case 'chapter.extract-info':
      return 'info.extract';
    default:
      return commandType;
  }
}

/**
 * 归一化 NovelCommand，补齐 P2-0B 扩展字段的默认值。
 */
export function normalizeNovelCommand(command: ExtendableNovelCommand): NormalizedNovelCommand {
  const payload: Record<string, unknown> = {};

  if (command.chapterIndex !== undefined) payload.chapterIndex = command.chapterIndex;
  if (command.genre !== undefined) payload.genre = command.genre;
  if (command.text !== undefined) payload.text = command.text;
  if (command.selectedText !== undefined) payload.selectedText = command.selectedText;
  if (command.targetWordCount !== undefined) payload.targetWordCount = command.targetWordCount;
  if (command.command !== undefined) payload.command = command.command;
  if (command.contextRefs !== undefined) payload.contextRefs = command.contextRefs;

  return {
    id: createCommandId(),
    type: command.type,

    workspaceId: command.workspaceId,
    projectId: command.projectId,
    chapterId: command.chapterId,

    branchId: command.branchId ?? 'main',
    worktreeId: command.worktreeId,
    modelProfileId: command.modelProfileId,
    skillId: command.skillId ?? inferSkillId(command.type),
    workflowId: command.workflowId ?? inferWorkflowId(command.type),

    payload,
  };
}

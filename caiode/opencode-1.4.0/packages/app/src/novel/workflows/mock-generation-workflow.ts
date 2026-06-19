/**
 * @file workflows/mock-generation-workflow.ts
 * @description Mock 生成工作流编排 — P1-B 核心层
 *
 * 职责：构建命令 → 调用 Adapter → 构建事件列表。
 * 修正项 #8: 只生成 result/events，不直接执行写回。
 * 写回由调用方显式调用 applyWorkflowEvents(events, mutations)。
 */

import type { NovelAgentAdapter } from '../adapters/novel-agent-adapter';
import type { NovelCommand } from './novel-command';
import type { NovelAgentResult } from '../types/ai-task';
import type { ChapterInformationState } from '../types/information-flow';
import type {
  NovelWorkflowEvent,
  ChapterGeneratedEvent,
  ChapterExtractedEvent,
  CharacterUpdatedEvent,
  WorldReferencedEvent,
  AchievementProgressedEvent,
  ProfileStatsUpdatedEvent,
  InformationAssessedEvent,
} from './workflow-events';
import { mockAgentAdapter } from '../adapters/mock-agent-adapter';

// ─── 主编排函数 ───────────────────────────────────────────────────────

/**
 * 执行 Mock 章节生成工作流。
 *
 * 仅负责"生成阶段"，返回 result 和 events。
 * 不调用 applyWorkflowEvents（修正#8）。
 *
 * @param command  小说编辑器命令
 * @returns       { result, events, durationMs }
 */
export async function runMockGeneration(
  command: NovelCommand,
  adapter: NovelAgentAdapter = mockAgentAdapter,
): Promise<{ result: NovelAgentResult; events: NovelWorkflowEvent[]; durationMs: number }> {
  const startTime = Date.now();
  const workflowId = `wf-${command.chapterIndex}-${command.type.replace('.', '-')}`;

  // 1. 调用 Adapter 获取结果
  const result = await adapter.run(command);

  // 2. 根据结果构建事件列表
  const events = buildEventsForCommand(command, result, workflowId);

  return {
    result,
    events,
    durationMs: Date.now() - startTime,
  };
}

// ─── 事件构建器 ───────────────────────────────────────────────────────

function buildEventsForCommand(
  command: NovelCommand,
  result: NovelAgentResult,
  workflowId: string,
): NovelWorkflowEvent[] {
  const now = new Date().toISOString();
  const events: NovelWorkflowEvent[] = [];

  // 基础事件：章节生成完成
  if (result.status === 'completed' && result.text) {
    const generatedEvent: ChapterGeneratedEvent = {
      type: 'chapter.generated',
      workflowId,
      timestamp: now,
      chapterId: command.chapterId,
      projectId: command.projectId,
      content: result.text,
      wordCount: result.wordCount,
      summary: result.summary,
      informationState: result.informationState,
    };
    events.push(generatedEvent);

    // 信息审计事件（仅记录）
    if (result.informationState) {
      const infoEvent: InformationAssessedEvent = {
        type: 'information.assessed',
        workflowId,
        timestamp: now,
        chapterId: command.chapterId,
        projectId: command.projectId,
        auditScore: result.informationState.auditScore,
        entropyDelta: result.informationState.entropyDelta,
        atomCount: result.informationState.newAtoms.length,
        linkCount: result.informationState.newLinks.length,
      };
      events.push(infoEvent);
    }

    // 信息提取事件
    const extractedEvent: ChapterExtractedEvent = {
      type: 'chapter.extracted',
      workflowId,
      timestamp: now,
      chapterId: command.chapterId,
      projectId: command.projectId,
      summary: result.summary,
      characters: extractCharacterNames(result.informationState),
      worldItems: extractWorldItemNames(result.informationState),
      keyEvents: extractKeyEvents(result.informationState),
      protagonistState: extractProtagonistState(result.informationState),
      informationState: result.informationState,
    };
    events.push(extractedEvent);

    // 角色更新事件（从信息原子中提取角色）
    const charIds = extractCharacterAtomIds(result.informationState);
    if (charIds.length > 0) {
      events.push({
        type: 'character.updated',
        workflowId,
        timestamp: now,
        characterIds: charIds,
        chapterId: command.chapterId,
      } satisfies CharacterUpdatedEvent);
    }

    // 世界物品引用事件
    const worldItemIds = extractWorldItemIds(result.informationState);
    if (worldItemIds.length > 0) {
      events.push({
        type: 'world.referenced',
        workflowId,
        timestamp: now,
        worldItemIds,
        chapterId: command.chapterId,
      } satisfies WorldReferencedEvent);
    }

    // 成就进度事件
    events.push({
      type: 'achievement.progressed',
      workflowId,
      timestamp: now,
      achievementId: 'ai-generation-count',
      delta: 1,
    } satisfies AchievementProgressedEvent);

    // 个人中心统计更新事件
    events.push({
      type: 'profile.stats.updated',
      workflowId,
      timestamp: now,
      projectId: command.projectId,
      wordCountDelta: result.wordCount,
      generationCountDelta: 1,
      creditDelta: -1,
    } satisfies ProfileStatsUpdatedEvent);
  }

  return events;
}

// ─── 辅助提取函数 ────────────────────────────────────────────────────

function extractCharacterNames(state?: ChapterInformationState): string[] {
  if (!state?.newAtoms) return [];
  return state.newAtoms
    .filter((a) => a.type === 'character-state')
    .map((a) => a.title);
}

function extractWorldItemNames(state?: ChapterInformationState): string[] {
  if (!state?.newAtoms) return [];
  return state.newAtoms
    .filter((a) => a.type === 'item' || a.type === 'world-rule')
    .map((a) => a.title);
}

function extractKeyEvents(state?: ChapterInformationState): string {
  if (!state?.newAtoms) return '';
  return state.newAtoms
    .filter((a) => a.type === 'event')
    .map((a) => a.title)
    .join('、');
}

function extractProtagonistState(state?: ChapterInformationState): string {
  if (!state?.newAtoms) return '';
  const protagonist = state.newAtoms.find((a) => a.type === 'character-state' && a.title.includes('主角'));
  return protagonist ? protagonist.description : '';
}

function extractCharacterAtomIds(state?: ChapterInformationState): string[] {
  if (!state?.newAtoms) return [];
  return state.newAtoms
    .filter((a) => a.type === 'character-state')
    .map((a) => a.id);
}

function extractWorldItemIds(state?: ChapterInformationState): string[] {
  if (!state?.newAtoms) return [];
  return state.newAtoms
    .filter((a) => a.type === 'item')
    .map((a) => a.id);
}

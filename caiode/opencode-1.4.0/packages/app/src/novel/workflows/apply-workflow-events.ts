/**
 * @file workflows/apply-workflow-events.ts
 * @description 工作流事件分发与写回 — P1-B 核心层
 *
 * 将 NovelWorkflowEvent[] 分发到对应的 Store mutation。
 * 修正项 #9: mutations 作为显式参数传入，不使用全局变量。
 */

import type {
  NovelWorkflowEvent,
  WorkflowMutations,
} from './workflow-events';

/** 内部事件日志（用于调试和测试断言） */
const eventLog: NovelWorkflowEvent[] = [];

/**
 * 获取事件日志（测试用）。
 */
export function getWorkflowEventLog(): readonly NovelWorkflowEvent[] {
  return eventLog;
}

/**
 * 清空事件日志（测试用）。
 */
export function clearWorkflowEventLog(): void {
  eventLog.length = 0;
}

/**
 * 分发工作流事件到各 Store — 真实写回。
 *
 * @param events   待分发的事件列表
 * @param mutations Store 写回方法集合（由 useNovelWorkflow 或测试代码注入）
 *
 * @example
 * // 在 Hook 中调用：
 * const { result, events } = await runMockGeneration(command);
 * applyWorkflowEvents(events, chapterMutations);
 *
 * // 在测试中注入 mock mutations：
 * applyWorkflowEvents(events, mockMutations);
 */
export async function applyWorkflowEvents(
  events: NovelWorkflowEvent[],
  mutations: WorkflowMutations,
): Promise<void> {
  for (const event of events) {
    eventLog.push(event);

    switch (event.type) {
      case 'chapter.generated':
        await mutations.updateChapterContent(event.chapterId, event.content);
        await mutations.updateChapterSummary(event.chapterId, event.summary);
        await mutations.updateChapterWordCount(event.chapterId, event.wordCount);
        if (event.informationState) {
          await mutations.updateChapterInfoState(event.chapterId, event.informationState);
        }
        break;

      case 'chapter.extracted':
        await mutations.updateChapterExtractedInfo(event.chapterId, {
          summary: event.summary,
          characters: event.characters,
          worldItems: event.worldItems,
          keyEvents: event.keyEvents,
          protagonistState: event.protagonistState,
          informationState: event.informationState,
        });
        break;

      case 'character.updated':
        await mutations.updateCharacterAppearance(event.characterIds, event.chapterId);
        break;

      case 'world.referenced':
        await mutations.incrementWorldReference(event.worldItemIds, event.chapterId);
        break;

      case 'achievement.progressed':
        await mutations.addAchievementProgress(event.achievementId, event.delta);
        break;

      case 'profile.stats.updated':
        await mutations.updateProfileStats(event.projectId, {
          words: event.wordCountDelta,
          generations: event.generationCountDelta,
          credits: event.creditDelta,
        });
        break;

      case 'information.assessed':
        // 信息审计事件仅记录，数据已通过 chapter.generated / chapter.extracted 写入
        break;

      default:
        // 未知事件类型静默忽略（扩展安全）
        break;
    }
  }
}

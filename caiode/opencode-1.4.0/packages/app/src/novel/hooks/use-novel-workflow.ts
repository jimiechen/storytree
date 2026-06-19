/**
 * @file hooks/use-novel-workflow.ts
 * @description 工作流页面入口 Hook — P1-B 集成层
 *
 * 统一入口：所有 AI 操作（生成/续写/改写/扩写/润色/总结）通过此 Hook 调用。
 * 修正项 #1: [getter, setter] createSignal 模式
 * 修正项 #5: contextRefs 使用 string[]
 */

import { createSignal } from 'solid-js';
import type { NovelCommand } from '../workflows/novel-command';
import { createChapterGenerateCommand, createAIWritingCommand } from '../workflows/novel-command';
import type { NovelAgentResult } from '../types/ai-task';
import type { ChapterInformationState } from '../types/information-flow';
import type {
  WorkflowMutations,
  NovelWorkflowEvent,
} from '../workflows/workflow-events';
import { runMockGeneration } from '../workflows/mock-generation-workflow';
import { applyWorkflowEvents, clearWorkflowEventLog } from '../workflows/apply-workflow-events';

// ─── Hook 返回类型 ───────────────────────────────────────────────────

export interface UseNovelWorkflowReturn {
  // 状态信号（修正#1: getter/setter 解构）
  currentTask: () => WorkflowTaskResult | null;
  setCurrentTask: (v: WorkflowTaskResult | null) => void;
  isRunning: () => boolean;
  setIsRunning: (v: boolean) => void;
  error: () => string | null;
  setError: (v: string | null) => void;

  // 信息审计状态
  currentInfoState: () => ChapterInformationState | undefined;
  setCurrentInfoState: (v: ChapterInformationState | undefined) => void;

  // 操作方法
  runChapterGeneration: (params: RunGenerationParams) => Promise<NovelAgentResult>;
  runAIWritingCommand: (params: RunAICommandParams) => Promise<NovelAgentResult>;

  /**
   * 取消当前任务。
   * 返修#4: 必须产出 status=cancelled 的结果，不能仅清空状态。
   */
  cancelCurrentTask: () => NovelAgentResult | null;

  /**
   * 基于原 command 重试任务。
   * 返修#5: 使用上次执行的 command 重新执行，产生新 taskId 和 completed 结果。
   */
  retryLastCommand: () => Promise<NovelAgentResult | null>;
}

export interface WorkflowTaskResult {
  result: NovelAgentResult;
  events: NovelWorkflowEvent[];
  durationMs: number;
}

export interface RunGenerationParams {
  chapterId: string;
  projectId: string;
  chapterIndex: number;
  genre: string;
  text: string;
  targetWordCount?: number;
  contextRefs?: string[];
}

export interface RunAICommandParams {
  chapterId: string;
  projectId: string;
  chapterIndex: number;
  genre: string;
  command: 'continue' | 'rewrite' | 'expand' | 'polish' | 'summarize';
  text: string;
  selectedText?: string;
  targetWordCount?: number;
  contextRefs?: string[];
}

// ─── Hook 实现 ─────────────────────────────────────────────────────────

/**
 * 工作流管理 Hook。
 *
 * 所有页面层 AI 操作的统一入口。
 * 职责：
 *   1. 构建 NovelCommand
 *   2. 调用 runMockGeneration（仅生成，不写回）
 *   3. 调用 applyWorkflowEvents（显式传入 mutations，写回 Store）
 *   4. 更新内部状态信号
 */
export function useNovelWorkflow(mutations: WorkflowMutations): UseNovelWorkflowReturn {
  const [getCurrentTask, setCurrentTask] = createSignal<WorkflowTaskResult | null>(null);
  const [getIsRunning, setIsRunning] = createSignal(false);
  const [getError, setError] = createSignal<string | null>(null);
  const [getCurrentInfoState, setCurrentInfoState] = createSignal<ChapterInformationState | undefined>(undefined);

  // 返修#5: 保存上次执行的 command，用于重试
  let lastCommand: NovelCommand | null = null;

  /**
   * 执行章节生成工作流。
   */
  const runChapterGeneration = async (
    params: RunGenerationParams,
  ): Promise<NovelAgentResult> => {
    setIsRunning(true);
    setError(null);
    clearWorkflowEventLog();

    try {
      const command = createChapterGenerateCommand({
        chapterId: params.chapterId,
        projectId: params.projectId,
        chapterIndex: params.chapterIndex,
        genre: params.genre,
        text: params.text,
        targetWordCount: params.targetWordCount,
        contextRefs: params.contextRefs,
      });
      lastCommand = command;

      // 仅生成（修正#8：不直接写回）
      const { result, events, durationMs } = await runMockGeneration(command);

      // 显式写回（修正#9：mutations 作为参数注入）
      applyWorkflowEvents(events, mutations);

      // 更新内部状态
      setCurrentTask({ result, events, durationMs });
      setCurrentInfoState(result.informationState);

      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    } finally {
      setIsRunning(false);
    }
  };

  /**
   * 执行 AI 写作命令工作流（续写/改写/扩写/润色/总结）。
   */
  const runAIWritingCommand = async (
    params: RunAICommandParams,
  ): Promise<NovelAgentResult> => {
    setIsRunning(true);
    setError(null);
    clearWorkflowEventLog();

    try {
      const commandMap = {
        continue: 'continue' as const,
        rewrite: 'rewrite' as const,
        expand: 'expand' as const,
        polish: 'polish' as const,
        summarize: 'summarize' as const,
      };

      const command = createAIWritingCommand({
        chapterId: params.chapterId,
        projectId: params.projectId,
        chapterIndex: params.chapterIndex,
        genre: params.genre,
        command: commandMap[params.command],
        text: params.text,
        selectedText: params.selectedText,
        targetWordCount: params.targetWordCount,
        contextRefs: params.contextRefs,
      });
      lastCommand = command;

      const { result, events, durationMs } = await runMockGeneration(command);
      applyWorkflowEvents(events, mutations);

      setCurrentTask({ result, events, durationMs });
      setCurrentInfoState(result.informationState);

      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    } finally {
      setIsRunning(false);
    }
  };

  /**
   * 取消当前任务。
   * 返修#4: 必须产出 status=cancelled 的 NovelAgentResult，不能仅清空状态或 clearEventLog。
   */
  const cancelCurrentTask = (): NovelAgentResult | null => {
    const task = getCurrentTask();
    if (!task) return null;

    // 构造 cancelled 结果（基于当前 task 的 result 结构）
    const cancelledResult: NovelAgentResult = {
      taskId: task.result.taskId + '-cancelled',
      attemptId: task.result.attemptId,  // 保留原 attemptId（同一次执行）
      status: 'cancelled',
      text: '',
      wordCount: 0,
      summary: '',
      error: '用户取消操作',
      durationMs: task.durationMs,
    };

    // 更新状态
    setCurrentTask({ ...task, result: cancelledResult });
    setIsRunning(false);

    return cancelledResult;
  };

  /**
   * 基于原 command 重试任务。
   * 返修#5: 使用上次执行的 command 重新调用 runMockGeneration，
   * 产生全新的 taskId 和 completed 结果（确定性但独立于前次）。
   */
  const retryLastCommand = async (): Promise<NovelAgentResult | null> => {
    if (!lastCommand) return null;
    setIsRunning(true);
    setError(null);
    clearWorkflowEventLog();

    try {
      const { result, events, durationMs } = await runMockGeneration(lastCommand);
      applyWorkflowEvents(events, mutations);

      setCurrentTask({ result, events, durationMs });
      setCurrentInfoState(result.informationState);

      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    } finally {
      setIsRunning(false);
    }
  };

  return {
    currentTask: getCurrentTask,
    setCurrentTask,
    isRunning: getIsRunning,
    setIsRunning,
    error: getError,
    setError,
    currentInfoState: getCurrentInfoState,
    setCurrentInfoState,
    runChapterGeneration,
    runAIWritingCommand,
    cancelCurrentTask,
    retryLastCommand,
  };
}

/**
 * @file hooks/use-novel-workflow.ts
 * @description 工作流页面入口 Hook — P1-B / P2-D 集成层
 *
 * 统一入口：所有 AI 操作（生成/续写/改写/扩写/润色/总结/信息提取）通过此 Hook 调用。
 * P2-D 改造：内部使用 NovelActionDispatcher 把动作转发到 YAML Workflow Engine，
 * 使 UI、Chat Debug、Workflow Engine、Tool Registry 走向统一执行路径。
 *
 * 修正项 #1: [getter, setter] createSignal 模式
 * 修正项 #5: contextRefs 使用 string[]
 */

import { createSignal } from 'solid-js';
import { useNovelActionDispatcher } from './use-novel-action-dispatcher';
import { useNovelLLMTask } from './use-novel-llm-task';
import { mapInfoTheoryToInfoFlow } from './use-novel-info-theory-mapper';
import type { NovelActionInput, NovelActionResult } from '../actions/novel-action-types';
import type { AITask, NovelAgentResult } from '../types/ai-task';
import type { LLMStreamEvent } from '../llm/llm-stream-events';
import type {
  ChapterInformationState as InfoTheoryChapterState,
  InformationScore,
} from '../info-theory/information-types';
import type { ChapterInformationState as InfoFlowChapterState } from '../types/information-flow';
import type { WorkflowMutations, NovelWorkflowEvent } from '../workflows/workflow-events';
import type { NovelWorkflowEngine } from '../workflows/engine/workflow-engine';
import { clearWorkflowEventLog } from '../workflows/apply-workflow-events';

// ─── Hook 返回类型 ───────────────────────────────────────────────────

export interface UseNovelWorkflowReturn {
  // 状态信号（修正#1: getter/setter 解构）
  currentTask: () => WorkflowTaskResult | null;
  setCurrentTask: (v: WorkflowTaskResult | null) => void;
  isRunning: () => boolean;
  setIsRunning: (v: boolean) => void;
  error: () => string | null;
  setError: (v: string | null) => void;

  // 信息审计状态（P2-D：对外统一为 Info-Lite 类型，便于 ChapterInfoPanel 直接消费）
  currentInfoState: () => InfoFlowChapterState | undefined;
  setCurrentInfoState: (v: InfoFlowChapterState | undefined) => void;

  // P3-B：流式 LLM 任务状态（AI Task Panel / Progress Dock / Result Card 消费）
  streamingTask: () => AITask | null;

  // 操作方法
  runChapterGeneration: (params: RunGenerationParams) => Promise<NovelAgentResult>;
  runAIWritingCommand: (params: RunAICommandParams) => Promise<NovelAgentResult>;

  /**
   * 重新提取章节信息（P2-D 新增）。
   * 通过 YAML Workflow Engine 执行 info.extract，返回 Info-Lite 信息审计状态。
   */
  runInfoExtract: (params: RunInfoExtractParams) => Promise<InfoFlowChapterState | null>;

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

export interface RunInfoExtractParams {
  chapterId: string;
  projectId: string;
  chapterIndex: number;
  genre?: string;
  text: string;
}

/** LLMStreamEvent 类型守卫。Workflow 返回的事件数组可能同时包含 NovelWorkflowEvent 与 LLMStreamEvent。 */
function isLLMStreamEvent(event: unknown): event is LLMStreamEvent {
  if (typeof event !== 'object' || event === null) return false;
  const type = (event as { type?: unknown }).type;
  if (typeof type !== 'string') return false;
  return [
    'llm.request.started',
    'llm.token.delta',
    'llm.reasoning.delta',
    'llm.request.completed',
    'llm.request.failed',
    'llm.request.cancelled',
  ].includes(type);
}

// ─── Hook 实现 ─────────────────────────────────────────────────────────

/**
 * 工作流管理 Hook。
 *
 * 职责：
 *   1. 构建 NovelActionInput
 *   2. 调用 NovelActionDispatcher 进入 YAML Workflow Engine
 *   3. 对生成类动作调用 applyWorkflowEvents（通过 mutations 注入）
 *   4. 更新内部状态信号
 */
export function useNovelWorkflow(
  mutations: WorkflowMutations,
  engine?: NovelWorkflowEngine,
): UseNovelWorkflowReturn {
  const [getCurrentTask, setCurrentTask] = createSignal<WorkflowTaskResult | null>(null);
  const [getIsRunning, setIsRunning] = createSignal(false);
  const [getError, setError] = createSignal<string | null>(null);
  const [getCurrentInfoState, setCurrentInfoState] = createSignal<InfoFlowChapterState | undefined>(undefined);

  // P2-D: 使用 Dispatcher 统一接入 YAML Engine；测试可注入 fake engine
  const { dispatch } = useNovelActionDispatcher({ mutations, engine });

  // P3-B: 聚合 LLMStreamEvent 为 AITask，供 UI 实时展示
  const llmTask = useNovelLLMTask();

  // 返修#5: 保存上次执行的 NovelActionInput，用于重试
  let lastActionInput: NovelActionInput | null = null;
  // P3-B: 保存上次流式任务输入，用于取消/重试
  let lastLLMTaskInput: AITask['input'] | null = null;

  /**
   * 执行章节生成工作流。
   */
  const runChapterGeneration = async (
    params: RunGenerationParams,
  ): Promise<NovelAgentResult> => {
    setIsRunning(true);
    setError(null);
    clearWorkflowEventLog();

    const input: NovelActionInput = {
      type: 'chapter.generate',
      projectId: params.projectId,
      chapterId: params.chapterId,
      payload: {
        chapterIndex: params.chapterIndex,
        genre: params.genre,
        text: params.text,
        targetWordCount: params.targetWordCount,
        contextRefs: params.contextRefs,
      },
    };
    lastActionInput = input;

    try {
      const actionResult = await dispatch(input);

      if (!actionResult.success || !actionResult.result) {
        const msg = actionResult.error || '生成失败';
        setError(msg);
        throw new Error(msg);
      }

      const result = actionResult.result as NovelAgentResult;
      const events = (actionResult.events ?? []) as NovelWorkflowEvent[];
      const durationMs = result.durationMs ?? 0;

      setCurrentTask({ result, events, durationMs });
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
   *
   * P3-B 改造：
   * - continue 命令默认请求流式执行（stream=true），Workflow Engine 通过 agent-run Tool
   *   可能返回 LLMStreamEvent 数组；本 Hook 将这些事件交给 useNovelLLMTask 聚合成 AITask。
   * - 非 continue 命令保持原有非流式路径，不引入额外状态。
   * - 无论流式与否，最终 NovelAgentResult 仍进入 currentTask，保证调用方不回归。
   */
  const runAIWritingCommand = async (
    params: RunAICommandParams,
  ): Promise<NovelAgentResult> => {
    setIsRunning(true);
    setError(null);
    clearWorkflowEventLog();

    const isContinue = params.command === 'continue';
    const input: NovelActionInput = {
      type: isContinue ? 'chapter.continue' : 'chapter.generate',
      projectId: params.projectId,
      chapterId: params.chapterId,
      payload: {
        chapterIndex: params.chapterIndex,
        genre: params.genre,
        text: params.text,
        selectedText: params.selectedText,
        targetWordCount: params.targetWordCount,
        contextRefs: params.contextRefs,
        // P3-B：continue 默认请求流式事件；agent-run Tool 会根据 gate 决定是否真实流式
        stream: isContinue ? true : undefined,
      },
    };
    lastActionInput = input;
    lastLLMTaskInput = {
      text: params.text,
      selectedText: params.selectedText,
    };

    try {
      const actionResult = await dispatch(input);

      if (!actionResult.success || !actionResult.result) {
        const msg = actionResult.error || 'AI 写作命令失败';
        setError(msg);
        throw new Error(msg);
      }

      const result = actionResult.result as NovelAgentResult;
      const rawEvents = actionResult.events ?? [];
      const durationMs = result.durationMs ?? 0;

      // P3-B：对 continue 命令，若工作流返回了 LLMStreamEvent，则聚合成 AITask。
      // 这样 UI 能在生成过程中看到实时 preview，而非只等待终态结果。
      if (isContinue) {
        const llmEvents = (rawEvents as unknown[]).filter(isLLMStreamEvent);
        if (llmEvents.length > 0 && lastLLMTaskInput) {
          await llmTask.startTask(
            {
              type: 'continue-writing',
              chapterId: params.chapterId,
              text: lastLLMTaskInput.text,
              selectedText: lastLLMTaskInput.selectedText,
            },
            async function* (signal) {
              for (const event of llmEvents) {
                if (signal.aborted) break;
                yield event;
              }
            },
          );
        }
      }

      setCurrentTask({ result, events: rawEvents as NovelWorkflowEvent[], durationMs });
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
   * 重新提取章节信息（P2-D 新增）。
   */
  const runInfoExtract = async (
    params: RunInfoExtractParams,
  ): Promise<InfoFlowChapterState | null> => {
    setIsRunning(true);
    setError(null);
    clearWorkflowEventLog();

    const input: NovelActionInput = {
      type: 'info.extract',
      projectId: params.projectId,
      chapterId: params.chapterId,
      payload: {
        chapterIndex: params.chapterIndex,
        genre: params.genre ?? 'general',
        text: params.text,
      },
    };
    lastActionInput = input;

    try {
      const actionResult = await dispatch(input);

      if (!actionResult.success || !actionResult.result) {
        const msg = actionResult.error || '信息提取失败';
        setError(msg);
        throw new Error(msg);
      }

      const { state, score } = actionResult.result as { state: InfoTheoryChapterState; score: InformationScore };
      const infoFlowState = mapInfoTheoryToInfoFlow(state, score, params.chapterIndex);
      setCurrentInfoState(infoFlowState);
      return infoFlowState;
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
   *
   * P3-B 补充：若当前存在流式 LLM 任务，先调用 AbortController.abort 取消底层事件流。
   */
  const cancelCurrentTask = (): NovelAgentResult | null => {
    llmTask.cancel();

    const task = getCurrentTask();
    if (!task) return null;

    const cancelledResult: NovelAgentResult = {
      taskId: task.result.taskId + '-cancelled',
      attemptId: task.result.attemptId,
      status: 'cancelled',
      text: '',
      wordCount: 0,
      summary: '',
      error: '用户取消操作',
      durationMs: task.durationMs,
    };

    setCurrentTask({ ...task, result: cancelledResult });
    setIsRunning(false);

    return cancelledResult;
  };

  /**
   * 基于原 action 重试任务。
   * 返修#5: 使用上次执行的 input 重新 dispatch，产生全新结果。
   */
  const retryLastCommand = async (): Promise<NovelAgentResult | null> => {
    if (!lastActionInput) return null;
    setIsRunning(true);
    setError(null);
    clearWorkflowEventLog();

    try {
      const actionResult = await dispatch(lastActionInput);

      if (!actionResult.success || !actionResult.result) {
        const msg = actionResult.error || '重试失败';
        setError(msg);
        throw new Error(msg);
      }

      const result = actionResult.result as NovelAgentResult;
      const events = (actionResult.events ?? []) as NovelWorkflowEvent[];
      const durationMs = result.durationMs ?? 0;

      setCurrentTask({ result, events, durationMs });
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
    streamingTask: llmTask.task,
    runChapterGeneration,
    runAIWritingCommand,
    runInfoExtract,
    cancelCurrentTask,
    retryLastCommand,
  };
}

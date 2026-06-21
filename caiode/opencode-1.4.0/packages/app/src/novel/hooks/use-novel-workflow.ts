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
import type { NovelActionInput, NovelActionResult } from '../actions/novel-action-types';
import type { NovelAgentResult } from '../types/ai-task';
import type {
  ChapterInformationState as InfoTheoryChapterState,
  InformationScore,
  InformationAtom as InfoTheoryAtom,
  InformationLink as InfoTheoryLink,
  InformationAtomType as InfoTheoryAtomType,
  InformationLinkRelationType as InfoTheoryLinkType,
} from '../info-theory/information-types';
import type {
  ChapterInformationState as InfoFlowChapterState,
  InformationAtomType as InfoFlowAtomType,
  InformationLinkRelationType as InfoFlowLinkType,
} from '../types/information-flow';
import type {
  WorkflowMutations,
  NovelWorkflowEvent,
} from '../workflows/workflow-events';
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

// ─── Info-Theory → Info-Lite 映射 ──────────────────────────────────────

/**
 * 把 P2-C info-theory 审计结果映射为 P1-A Info-Lite 类型。
 *
 * 原因：
 * - info-theory 模块内部使用扩展字段（atoms/links/selfInformationTotal），
 *   而 UI 的 ChapterInfoPanel 与 WorkflowEvents 仍消费 Info-Lite 结构（newAtoms/newLinks）。
 * - P2-D 不在 UI 层同时维护两套类型，而是在 Hook 边界做一次性转换。
 *
 * 映射规则：
 * - 信息原子：title/content 直接复用；relevanceScore 映射为 importance；
 *   selfInformation 映射为 selfInformationScore；visibility 默认 public。
 * - 信息链接：info-theory 只保存 atomId，需要查表得到 sourceTitle / targetTitle；
 *   relationType 按语义做保守映射，避免引入 Info-Lite 不支持的关系。
 * - auditScore 由 0-1 的 score.auditScore 缩放到 0-100，与 ChapterInfoPanel 显示一致。
 */
function mapInfoTheoryToInfoFlow(
  state: InfoTheoryChapterState,
  score: InformationScore,
  chapterIndex: number,
): InfoFlowChapterState {
  const atomTitleMap = new Map<string, string>();
  for (const atom of state.atoms) {
    atomTitleMap.set(atom.id, atom.title);
  }

  const newAtoms: InfoFlowChapterState['newAtoms'] = state.atoms.map((atom) => ({
    id: atom.id,
    projectId: atom.projectId,
    chapterId: atom.chapterId ?? state.chapterId,
    type: mapInfoTheoryAtomType(atom.type),
    title: atom.title,
    description: atom.content,
    importance: Math.max(1, Math.min(10, Math.round(atom.relevanceScore * 10))),
    visibility: atom.type === 'clue' ? 'author-only' : 'public',
    selfInformationScore: atom.selfInformation,
    plantedIn: chapterIndex,
  }));

  const newLinks: InfoFlowChapterState['newLinks'] = state.links.map((link) => ({
    id: link.id,
    projectId: state.projectId,
    sourceTitle: atomTitleMap.get(link.sourceAtomId) || link.sourceAtomId,
    targetTitle: atomTitleMap.get(link.targetAtomId) || link.targetAtomId,
    relationType: mapInfoTheoryLinkType(link.relationType),
    strength: link.strength,
    plantedIn: chapterIndex,
  }));

  return {
    chapterId: state.chapterId,
    projectId: state.projectId,
    entropyBefore: state.entropyBefore,
    entropyAfter: state.entropyAfter,
    entropyDelta: state.entropyDelta,
    selfInformationScore: state.selfInformationTotal,
    newAtoms,
    newLinks,
    auditScore: Math.round(score.auditScore * 100),
  };
}

const INFO_THEORY_ATOM_TYPE_MAP: Record<InfoTheoryAtomType, InfoFlowAtomType> = {
  character: 'character-state',
  event: 'event',
  location: 'world-rule',
  item: 'item',
  relationship: 'relationship',
  conflict: 'event',
  clue: 'foreshadow',
  emotion: 'emotion',
  'world-rule': 'world-rule',
  theme: 'theme',
};

function mapInfoTheoryAtomType(type: InfoTheoryAtomType): InfoFlowAtomType {
  return INFO_THEORY_ATOM_TYPE_MAP[type] ?? 'fact';
}

const INFO_THEORY_LINK_TYPE_MAP: Record<InfoTheoryLinkType, InfoFlowLinkType> = {
  supports: 'plot-cause',
  contradicts: 'mystery',
  foreshadows: 'foreshadow',
  resolves: 'plot-cause',
  'depends-on': 'character',
  echoes: 'emotional-echo',
};

function mapInfoTheoryLinkType(type: InfoTheoryLinkType): InfoFlowLinkType {
  return INFO_THEORY_LINK_TYPE_MAP[type] ?? 'theme';
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
export function useNovelWorkflow(mutations: WorkflowMutations): UseNovelWorkflowReturn {
  const [getCurrentTask, setCurrentTask] = createSignal<WorkflowTaskResult | null>(null);
  const [getIsRunning, setIsRunning] = createSignal(false);
  const [getError, setError] = createSignal<string | null>(null);
  const [getCurrentInfoState, setCurrentInfoState] = createSignal<InfoFlowChapterState | undefined>(undefined);

  // P2-D: 使用 Dispatcher 统一接入 YAML Engine
  const { dispatch } = useNovelActionDispatcher({ mutations });

  // 返修#5: 保存上次执行的 NovelActionInput，用于重试
  let lastActionInput: NovelActionInput | null = null;

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
   */
  const runAIWritingCommand = async (
    params: RunAICommandParams,
  ): Promise<NovelAgentResult> => {
    setIsRunning(true);
    setError(null);
    clearWorkflowEventLog();

    // P2-D 只把 continue 接入 YAML Engine；其余命令继续按 generate 路径跑通
    // 因为 chapter.continue.yaml 内部使用 mock-generation-wrapper，能处理 continue
    const input: NovelActionInput = {
      type: params.command === 'continue' ? 'chapter.continue' : 'chapter.generate',
      projectId: params.projectId,
      chapterId: params.chapterId,
      payload: {
        chapterIndex: params.chapterIndex,
        genre: params.genre,
        text: params.text,
        selectedText: params.selectedText,
        targetWordCount: params.targetWordCount,
        contextRefs: params.contextRefs,
      },
    };
    lastActionInput = input;

    try {
      const actionResult = await dispatch(input);

      if (!actionResult.success || !actionResult.result) {
        const msg = actionResult.error || 'AI 写作命令失败';
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
   */
  const cancelCurrentTask = (): NovelAgentResult | null => {
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
    runChapterGeneration,
    runAIWritingCommand,
    runInfoExtract,
    cancelCurrentTask,
    retryLastCommand,
  };
}

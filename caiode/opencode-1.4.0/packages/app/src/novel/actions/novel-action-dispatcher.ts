/**
 * @file actions/novel-action-dispatcher.ts
 * @description UI → NovelCommand → YAML Workflow Engine 的分发层 — P2-D
 *
 * 为什么需要 Dispatcher？
 * - 隔离 UI 与 Workflow Engine：按钮只描述"想做什么"（NovelActionInput），
 *   Dispatcher 负责把动作翻译成 NovelCommand 并选择执行路径。
 * - P2-D 只把 AI_WORKFLOW 动作接入 YAML Engine；CRUD 动作保留 provider，
 *   避免一次性重构所有 UI 状态。
 * - 统一错误处理：所有失败都变成结构化 NovelActionResult，不抛未捕获异常。
 */

import type { NovelAgentAdapter } from '../adapters/novel-agent-adapter';
import { createNovelWorkflowEngine, type NovelWorkflowEngine } from '../workflows/engine/workflow-engine';
import type { NovelCommand } from '../workflows/novel-command';
import { normalizeNovelCommand } from '../workflows/engine/workflow-command-normalizer';
import { createBuiltinNovelToolRegistry } from '../plugins/builtin-novel-tools';
import type { WorkflowMutations, NovelWorkflowEvent } from '../workflows/workflow-events';
import { applyWorkflowEvents } from '../workflows/apply-workflow-events';
import type { ChapterInformationState as InfoTheoryChapterState } from '../info-theory/information-types';
import type {
  NovelActionInput,
  NovelActionResult,
  NovelActionType,
  NovelActionDispatcher,
} from './novel-action-types';
import { createSuccessResult, createErrorResult } from './novel-action-result';

export interface NovelActionDispatcherOptions {
  /** 可选：外部传入的 YAML Engine，便于测试注入 */
  engine?: NovelWorkflowEngine;
  /** 可选：外部 Agent Adapter，默认使用 mockAgentAdapter */
  adapter?: NovelAgentAdapter;
  /**
   * Workflow 事件写回方法。
   * - chapter.generate / chapter.continue 执行完成后会调用 applyWorkflowEvents。
   * - info.extract 目前只返回 state/score，不通过 mutations 写回旧事件格式。
   */
  mutations?: WorkflowMutations;
}

/**
 * 哪些动作在 P2-D 直接进入 YAML Workflow Engine。
 */
const YAML_ACTIONS = new Set<NovelActionType>([
  'chapter.generate',
  'chapter.continue',
  'info.extract',
]);

/**
 * 创建 NovelActionDispatcher。
 */
export function createNovelActionDispatcher(
  options?: NovelActionDispatcherOptions,
): NovelActionDispatcher {
  const engine = options?.engine ?? createNovelWorkflowEngine({ adapter: options?.adapter });

  return {
    async dispatch(input: NovelActionInput): Promise<NovelActionResult> {
      // 未支持的 action 直接返回结构化错误，不在 UI 层伪成功
      if (!YAML_ACTIONS.has(input.type)) {
        return createErrorResult(
          input.type,
          'NOT_SUPPORTED_ACTION',
          `动作 "${input.type}" 在 P2-D 未接入 YAML Workflow Engine，保留现有 provider 或 FeatureGate`,
        );
      }

      try {
        const command = buildNovelCommand(input);
        const normalized = normalizeNovelCommand(command);
        const commandId = normalized.id;
        const workflowId = normalized.workflowId;

        // 执行 YAML Workflow Engine
        let finalResult: unknown;
        let hasFailed = false;
        let failedError: string | undefined;

        for await (const step of engine.execute(command)) {
          if (step.status === 'failed') {
            hasFailed = true;
            failedError = step.error;
            break;
          }
          if (step.status === 'completed' && step.output !== undefined) {
            finalResult = step.output;
          }
        }

        if (hasFailed) {
          return createErrorResult(
            input.type,
            'WORKFLOW_EXECUTION_FAILED',
            failedError || '工作流执行失败',
            { commandId, workflowId },
          );
        }

        // 根据动作类型处理结果
        if (input.type === 'chapter.generate' || input.type === 'chapter.continue') {
          return handleGenerationResult(input.type, commandId, workflowId, finalResult, options?.mutations);
        }

        if (input.type === 'info.extract') {
          return handleInfoExtractResult(input.type, commandId, workflowId, finalResult);
        }

        // 防御分支：理论上不会到达
        return createErrorResult(
          input.type,
          'UNEXPECTED_ACTION_PATH',
          `动作 "${input.type}" 的结果处理路径缺失`,
          { commandId, workflowId },
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return createErrorResult(input.type, 'DISPATCHER_ERROR', message);
      }
    },
  };
}

/**
 * 把 NovelActionInput 转成 NovelCommand。
 *
 * P2-D 只处理三种 AI 动作：
 * - chapter.generate -> NovelCommand.type = 'chapter.generate'
 * - chapter.continue -> NovelCommand.type = 'chapter.rewrite'，payload.command = 'continue'
 * - info.extract     -> NovelCommand.type = 'chapter.extract-info'，payload.text = 待审计正文
 */
function buildNovelCommand(input: NovelActionInput): NovelCommand {
  const base = {
    projectId: input.projectId,
    chapterId: input.chapterId ?? '',
    chapterIndex: (input.payload?.chapterIndex as number | undefined) ?? 0,
    genre: (input.payload?.genre as string | undefined) ?? 'general',
    text: (input.payload?.text as string | undefined) ?? '',
    createdAt: new Date(),
  };

  const payload = input.payload ? { ...input.payload } : {};

  // P2-D：workspace / branch / worktree / model / skill / workflow 只做透传。
  // 这些字段在 P2 阶段不触发真实 Git Worktree、多模型路由或自定义 Skill。
  const extension = {
    workspaceId: input.workspaceId,
    branchId: input.branchId,
    worktreeId: input.worktreeId,
    modelProfileId: input.modelProfileId,
    skillId: input.skillId,
    workflowId: input.workflowId,
  };

  switch (input.type) {
    case 'chapter.generate':
      return {
        ...base,
        ...extension,
        type: 'chapter.generate',
        targetWordCount: payload.targetWordCount as number | undefined,
        contextRefs: payload.contextRefs as string[] | undefined,
      };

    case 'chapter.continue': {
      // Engine 的 normalizer 会把 'chapter.rewrite' 映射到 'chapter.continue' workflow
      // 并把 payload.command 传给 mock-generation-wrapper
      return {
        ...base,
        ...extension,
        type: 'chapter.rewrite',
        command: 'continue',
        selectedText: payload.selectedText as string | undefined,
        targetWordCount: payload.targetWordCount as number | undefined,
        contextRefs: payload.contextRefs as string[] | undefined,
      };
    }

    case 'info.extract': {
      // 复用 chapter.extract-info 类型，normalizer 会映射到 info.extract workflow
      return {
        ...base,
        ...extension,
        type: 'chapter.extract-info',
      };
    }

    default:
      // 防御：前面已经过滤过 YAML_ACTIONS，这里不会触发
      throw new Error(`Unsupported action type: ${input.type}`);
  }
}

/**
 * 处理生成类动作结果。
 *
 * chapter.generate / chapter.continue 的 YAML 输出结构为 { result, events, durationMs }，
 * 其中 result 是 NovelAgentResult。拿到后调用 applyWorkflowEvents 写回 Store。
 */
async function handleGenerationResult(
  actionType: 'chapter.generate' | 'chapter.continue',
  commandId: string,
  workflowId: string,
  finalResult: unknown,
  mutations: WorkflowMutations | undefined,
): Promise<NovelActionResult> {
  const wrapper = finalResult as { result?: unknown; events?: unknown[]; durationMs?: number } | undefined;

  if (!wrapper || !wrapper.result) {
    return createErrorResult(
      actionType,
      'INVALID_GENERATION_RESULT',
      '生成工作流未返回有效结果',
      { commandId, workflowId },
    );
  }

  const events = (wrapper.events ?? []) as NovelWorkflowEvent[];

  // 只有提供了 mutations 才真实写回；测试或不需写回的场景可省略
  if (mutations) {
    await applyWorkflowEvents(events, mutations);
  }

  return createSuccessResult(actionType, {
    commandId,
    workflowId,
    result: wrapper.result,
    events,
  });
}

/**
 * 处理 info.extract 动作结果。
 *
 * info.extract 的 YAML 输出结构为 { state, score, events }，
 * 其中 state 是 P2-C 信息论审计状态。P2-D 不通过旧 WorkflowMutations 写回，
 * 而是把 state 直接交给调用方（如 ChapterInfoPanel）局部展示或后续写回。
 */
function handleInfoExtractResult(
  actionType: 'info.extract',
  commandId: string,
  workflowId: string,
  finalResult: unknown,
): NovelActionResult {
  const wrapper = finalResult as
    | { state?: InfoTheoryChapterState; score?: unknown; events?: unknown[] }
    | undefined;

  if (!wrapper || !wrapper.state) {
    return createErrorResult(
      actionType,
      'INVALID_INFO_EXTRACT_RESULT',
      '信息提取工作流未返回有效 state',
      { commandId, workflowId },
    );
  }

  return createSuccessResult(actionType, {
    commandId,
    workflowId,
    result: { state: wrapper.state, score: wrapper.score },
    events: wrapper.events,
  });
}

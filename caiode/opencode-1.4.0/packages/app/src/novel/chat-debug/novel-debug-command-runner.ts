/**
 * @file chat-debug/novel-debug-command-runner.ts
 * @description Chat Debug Command Runner — P2-A0 / P2-D / P3-A
 *
 * P2-D 改造：chapter.generate / chapter.continue / info.extract 等核心命令
 * 不再走旧的 runMockGeneration 直接调用，而是通过 createNovelWorkflowEngine
 * 进入 YAML Workflow Engine，确保 Chat Debug 与 UI 使用统一执行路径。
 * rewrite / expand / polish / summarize 保持兼容行为。
 *
 * P3-A 扩展：
 * - 显式 adapter=real-llm 时绕过 Workflow Engine，直接调用 RealLLMExecutionAdapter。
 * - 支持 stream=true 流式事件回显。
 * - 支持 dryRun=true 参数预览模式。
 */

import type { NovelAgentAdapter } from '../adapters/novel-agent-adapter';
import { MockAgentAdapter } from '../adapters/mock-agent-adapter';
import { createNovelWorkflowEngine } from '../workflows/engine/workflow-engine';
import { parseNovelDebugCommand, getNovelDebugHelpText } from './novel-debug-command-parser';
import { createNovelDebugLogStore } from './novel-debug-log-store';
import { runRealLLMInDebug } from './novel-debug-llm-runner';
import type {
  NovelDebugLogStore,
  NovelDebugRunResult,
  NovelDebugRunStatus,
} from './novel-debug-log-types';
import type { RealLLMExecutionAdapter } from '../adapters/real-llm-adapter';
import type { NovelCommand } from '../workflows/novel-command';

export interface NovelDebugRunnerOptions {
  logStore?: NovelDebugLogStore;
  adapter?: NovelAgentAdapter;
  /** P3-A：真实 LLM adapter，未提供时 real-llm 命令返回配置错误 */
  realLLMAdapter?: RealLLMExecutionAdapter;
}

const defaultAdapter = new MockAgentAdapter({ delayMultiplier: 0, silent: true });

function createLogId(): string {
  return `ndl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 执行 Chat Debug 命令。
 */
export async function runNovelDebugCommand(
  commandText: string,
  options?: NovelDebugRunnerOptions,
): Promise<NovelDebugRunResult> {
  const logStore = options?.logStore ?? createNovelDebugLogStore();
  const adapter = options?.adapter ?? defaultAdapter;

  const parseResult = parseNovelDebugCommand(commandText);

  if (!parseResult.success) {
    const logId = createLogId();
    logStore.add({
      id: logId,
      commandText,
      status: 'failed' as NovelDebugRunStatus,
      startedAt: new Date(),
      completedAt: new Date(),
      events: [],
      error: parseResult.message,
    });
    return {
      success: false,
      logId,
      events: [],
      errorCode: parseResult.errorCode,
      message: parseResult.message,
    };
  }

  if (parseResult.kind === 'help') {
    const logId = createLogId();
    logStore.add({
      id: logId,
      commandText,
      status: 'completed' as NovelDebugRunStatus,
      startedAt: new Date(),
      completedAt: new Date(),
      events: [],
      result: { help: getNovelDebugHelpText() },
    });
    return {
      success: true,
      logId,
      events: [],
      message: getNovelDebugHelpText(),
    };
  }

  const command = parseResult.command!;

  // P2-E：Chat Debug 可显式指定 adapter 做路由边界验证，
  // opencode-stub / claudecode-stub 默认被 FeatureGate 关闭，直接返回结构化错误，不进入 Engine。
  if (command.adapterKind === 'opencode-stub' || command.adapterKind === 'claudecode-stub') {
    const message = `Adapter "${command.adapterKind}" 已被 FeatureGate 关闭（ADAPTER_DISABLED）`;
    const log = logStore.add({
      id: createLogId(),
      commandText,
      command,
      status: 'failed' as NovelDebugRunStatus,
      startedAt: new Date(),
      completedAt: new Date(),
      events: [],
      error: message,
    });
    return {
      success: false,
      logId: log.id,
      command,
      events: [],
      errorCode: 'ADAPTER_DISABLED',
      message,
    };
  }

  // P3-A：real-llm 绕过 Workflow Engine，直接走真实 LLM adapter
  if (command.adapterKind === 'real-llm') {
    const realLLMAdapter = options?.realLLMAdapter;
    if (!realLLMAdapter) {
      const message = 'real-llm adapter 未在 Chat Debug Runner 中配置';
      const log = logStore.add({
        id: createLogId(),
        commandText,
        command,
        status: 'failed' as NovelDebugRunStatus,
        startedAt: new Date(),
        completedAt: new Date(),
        events: [],
        error: message,
      });
      return {
        success: false,
        logId: log.id,
        command,
        events: [],
        errorCode: 'REAL_LLM_NOT_CONFIGURED',
        message,
      };
    }

    const context = buildAdapterContext(command);
    const result = await runRealLLMInDebug(command, context, realLLMAdapter, {
      stream: parseResult.stream,
      dryRun: parseResult.dryRun,
    });

    const log = logStore.add({
      id: result.logId,
      commandText,
      command,
      status: result.success ? ('completed' as NovelDebugRunStatus) : ('failed' as NovelDebugRunStatus),
      startedAt: new Date(),
      completedAt: new Date(),
      events: result.events,
      llmEvents: result.llmEvents,
      result: result.result,
      error: result.success ? undefined : result.message,
    });

    return {
      ...result,
      logId: log.id,
    };
  }

  const log = logStore.add({
    id: createLogId(),
    commandText,
    command,
    status: 'queued' as NovelDebugRunStatus,
    startedAt: new Date(),
    events: [],
  });

  logStore.update(log.id, { status: 'running' as NovelDebugRunStatus });

  // P2-D：核心 AI 命令统一走 YAML Workflow Engine
  const YAML_COMMAND_TYPES = new Set([
    'chapter.generate',
    'chapter.rewrite',
    'chapter.expand',
    'chapter.polish',
    'chapter.summarize',
    'chapter.extract-info',
  ]);

  if (!YAML_COMMAND_TYPES.has(command.type)) {
    const message = `命令 "${command.type}" 在 P2-D 未接入 YAML Workflow Engine`;
    logStore.update(log.id, {
      status: 'failed' as NovelDebugRunStatus,
      completedAt: new Date(),
      error: message,
    });
    return {
      success: false,
      logId: log.id,
      command,
      events: [],
      errorCode: 'NOT_SUPPORTED',
      message,
    };
  }

  try {
    const engine = createNovelWorkflowEngine({ adapter });

    let finalOutput: unknown;
    let hasFailed = false;
    let failedError: string | undefined;

    for await (const step of engine.execute(command)) {
      if (step.status === 'failed') {
        hasFailed = true;
        failedError = step.error;
        break;
      }
      if (step.status === 'completed' && step.output !== undefined) {
        finalOutput = step.output;
      }
    }

    if (hasFailed) {
      const message = failedError || '工作流执行失败';
      logStore.update(log.id, {
        status: 'failed' as NovelDebugRunStatus,
        completedAt: new Date(),
        error: message,
      });
      return {
        success: false,
        logId: log.id,
        command,
        events: [],
        errorCode: 'WORKFLOW_EXECUTION_FAILED',
        message,
      };
    }

    const wrapper = finalOutput as { events?: unknown[] } | undefined;
    const events = wrapper?.events ?? [];

    logStore.update(log.id, {
      status: 'completed' as NovelDebugRunStatus,
      completedAt: new Date(),
      events,
      result: finalOutput,
    });
    return {
      success: true,
      logId: log.id,
      command,
      events,
      result: finalOutput,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStore.update(log.id, {
      status: 'failed' as NovelDebugRunStatus,
      completedAt: new Date(),
      error: message,
    });
    return {
      success: false,
      logId: log.id,
      command,
      events: [],
      errorCode: 'RUNNER_ERROR',
      message,
    };
  }
}

/**
 * 从 NovelCommand 构造 AdapterContext。
 */
function buildAdapterContext(command: NovelCommand): import('../adapters/adapter-types').AdapterContext {
  return {
    projectId: command.projectId,
    chapterId: command.chapterId,
    genre: command.genre,
    targetWordCount: command.targetWordCount,
  };
}

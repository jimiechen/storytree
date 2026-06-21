/**
 * @file chat-debug/novel-debug-command-runner.ts
 * @description Chat Debug Command Runner — P2-A0 / P2-D
 *
 * P2-D 改造：chapter.generate / chapter.continue / info.extract 等核心命令
 * 不再走旧的 runMockGeneration 直接调用，而是通过 createNovelWorkflowEngine
 * 进入 YAML Workflow Engine，确保 Chat Debug 与 UI 使用统一执行路径。
 * rewrite / expand / polish / summarize 保持兼容行为。
 */

import type { NovelAgentAdapter } from '../adapters/novel-agent-adapter';
import { MockAgentAdapter } from '../adapters/mock-agent-adapter';
import { createNovelWorkflowEngine } from '../workflows/engine/workflow-engine';
import { parseNovelDebugCommand, getNovelDebugHelpText } from './novel-debug-command-parser';
import { createNovelDebugLogStore } from './novel-debug-log-store';
import type {
  NovelDebugLogStore,
  NovelDebugRunResult,
  NovelDebugRunStatus,
} from './novel-debug-log-types';

export interface NovelDebugRunnerOptions {
  logStore?: NovelDebugLogStore;
  adapter?: NovelAgentAdapter;
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

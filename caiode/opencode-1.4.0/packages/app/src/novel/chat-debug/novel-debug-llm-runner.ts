/**
 * @file chat-debug/novel-debug-llm-runner.ts
 * @description Chat Debug 真实 LLM 调用封装 — P3-A
 *
 * 把 RealLLMExecutionAdapter 的 execute / executeStream 包装成 Chat Debug 可消费的运行结果。
 * 只用于调试入口，不直接修改章节状态。
 */

import type { NovelCommand } from '../workflows/novel-command';
import type { AdapterContext } from '../adapters/adapter-types';
import type { RealLLMExecutionAdapter } from '../adapters/real-llm-adapter';
import type { LLMStreamEvent } from '../llm/llm-stream-events';
import type { NovelDebugRunResult } from './novel-debug-log-types';
import { collectLLMText } from '../llm/llm-stream-events';

function createLogId(): string {
  return `ndl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 在 Chat Debug 中运行真实 LLM。
 *
 * - stream=true：调用 executeStream，收集 LLMStreamEvent；dryRun=true 时仍然返回预览事件。
 * - stream=false / dryRun=true：调用 execute，返回终态 NovelAgentResult。
 * - dryRun=true 时不调用真实 API，只验证请求构造与参数预览。
 */
export async function runRealLLMInDebug(
  command: NovelCommand,
  context: AdapterContext,
  adapter: RealLLMExecutionAdapter,
  options?: { stream?: boolean; dryRun?: boolean },
): Promise<NovelDebugRunResult> {
  const stream = options?.stream ?? false;
  const dryRun = options?.dryRun ?? false;

  if (stream) {
    const events: LLMStreamEvent[] = [];
    for await (const event of adapter.executeStream(command, context)) {
      events.push(event);
    }

    const text = collectLLMText(events);
    const failedEvent = events.find((e) => e.type === 'llm.request.failed');

    if (failedEvent) {
      return {
        success: false,
        logId: createLogId(),
        command,
        events: [],
        llmEvents: events,
        errorCode: failedEvent.errorCode,
        message: failedEvent.error,
      };
    }

    return {
      success: true,
      logId: createLogId(),
      command,
      events: [],
      llmEvents: events,
      result: { text, streamEvents: events },
      message: dryRun
        ? `dryRun 流式预览，共 ${events.length} 个事件，正文 ${text.length} 字`
        : `流式完成，共 ${events.length} 个事件，正文 ${text.length} 字`,
    };
  }

  // 非流式或 dryRun 模式
  const result = await adapter.execute(command, context);

  if (!result.success) {
    return {
      success: false,
      logId: createLogId(),
      command,
      events: [],
      errorCode: result.errorCode,
      message: result.error,
    };
  }

  if (dryRun) {
    return {
      success: true,
      logId: createLogId(),
      command,
      events: [],
      result: result.result,
      message: `dryRun 完成，transport=${adapter.name}，不调用真实 API`,
    };
  }

  return {
    success: true,
    logId: createLogId(),
    command,
    events: [],
    result: result.result,
    message: `非流式完成，正文 ${result.result?.text.length ?? 0} 字`,
  };
}

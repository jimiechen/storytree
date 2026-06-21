/**
 * @file real-llm-adapter-contract.ts
 * @description 真实 LLM Adapter 接口契约 — P3-0
 *
 * 定义支持流式事件的真实 LLM Adapter 接口，
 * P3-0 只保留契约，真实实现放在 P3-A。
 */

import type { NovelCommand } from '../workflows/novel-command';
import type { NovelAgentResult } from '../types/ai-task';
import type { AdapterContext } from '../adapters/adapter-types';
import type { LLMStreamEvent } from './llm-stream-events';

/**
 * 支持流式事件的真实 LLM Adapter 接口。
 *
 * 与 P2-E AgentExecutionAdapter 不同点：
 * - executeStream 返回 AsyncGenerator<LLMStreamEvent>，UI 消费统一事件而非供应商原始流。
 * - execute 返回终态 NovelAgentResult，用于非流式场景。
 * - canHandle 仍需显式声明，确保 Router 不会误路由。
 */
export interface StreamingAgentExecutionAdapter {
  readonly name: string;

  /** 当前 adapter 是否能处理该命令 */
  canHandle(command: NovelCommand, context: AdapterContext): boolean;

  /** 非流式执行，返回终态结果 */
  execute(command: NovelCommand, context: AdapterContext): Promise<NovelAgentResult>;

  /** 流式执行，返回 NovelForge 统一事件 */
  executeStream(command: NovelCommand, context: AdapterContext): AsyncGenerator<LLMStreamEvent>;
}

/**
 * 判断任意对象是否满足 StreamingAgentExecutionAdapter 接口。
 */
export function isStreamingAgentExecutionAdapter(
  adapter: unknown,
): adapter is StreamingAgentExecutionAdapter {
  if (adapter === null || typeof adapter !== 'object') return false;
  const a = adapter as Partial<StreamingAgentExecutionAdapter>;
  return (
    typeof a.name === 'string' &&
    typeof a.canHandle === 'function' &&
    typeof a.execute === 'function' &&
    typeof a.executeStream === 'function'
  );
}

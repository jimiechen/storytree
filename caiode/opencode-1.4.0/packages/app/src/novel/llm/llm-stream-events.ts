/**
 * @file llm-stream-events.ts
 * @description 真实 LLM 流式事件协议 — P3-0
 *
 * UI 不直接解析供应商原始流，只消费 NovelForge 统一事件。
 * 这样可以在 P3-A 替换真实供应商时保持 UI 不变。
 */

import type { LLMUsage } from './llm-request-types';

/** 统一流式事件类型枚举。 */
export type LLMStreamEventType =
  | 'llm.request.started'
  | 'llm.token.delta'
  | 'llm.reasoning.delta'
  | 'llm.request.completed'
  | 'llm.request.failed'
  | 'llm.request.cancelled';

/** 所有流式事件的公共字段。 */
export interface LLMStreamEventBase {
  type: LLMStreamEventType;
  requestId: string;
}

/** 请求开始事件。 */
export interface LLMRequestStartedEvent extends LLMStreamEventBase {
  type: 'llm.request.started';
  adapter: string;
  commandId?: string;
  workflowId?: string;
  createdAt: string;
}

/** 正文 token 增量。 */
export interface LLMTokenDeltaEvent extends LLMStreamEventBase {
  type: 'llm.token.delta';
  text: string;
}

/** 推理过程 token 增量，必须与正文 token 区分。 */
export interface LLMReasoningDeltaEvent extends LLMStreamEventBase {
  type: 'llm.reasoning.delta';
  text: string;
}

/** 请求完成事件。 */
export interface LLMRequestCompletedEvent extends LLMStreamEventBase {
  type: 'llm.request.completed';
  usage?: LLMUsage;
  completedAt: string;
}

/** 请求失败事件。 */
export interface LLMRequestFailedEvent extends LLMStreamEventBase {
  type: 'llm.request.failed';
  errorCode: string;
  error: string;
}

/** 请求取消事件。 */
export interface LLMRequestCancelledEvent extends LLMStreamEventBase {
  type: 'llm.request.cancelled';
  reason?: string;
}

/** NovelForge 统一 LLM 流式事件。 */
export type LLMStreamEvent =
  | LLMRequestStartedEvent
  | LLMTokenDeltaEvent
  | LLMReasoningDeltaEvent
  | LLMRequestCompletedEvent
  | LLMRequestFailedEvent
  | LLMRequestCancelledEvent;

/**
 * 创建请求开始事件。
 */
export function createLLMRequestStartedEvent(
  requestId: string,
  adapter: string,
  options?: { commandId?: string; workflowId?: string; createdAt?: string },
): LLMRequestStartedEvent {
  return {
    type: 'llm.request.started',
    requestId,
    adapter,
    commandId: options?.commandId,
    workflowId: options?.workflowId,
    createdAt: options?.createdAt ?? new Date().toISOString(),
  };
}

/**
 * 创建正文 token 增量事件。
 */
export function createLLMTokenDeltaEvent(requestId: string, text: string): LLMTokenDeltaEvent {
  return { type: 'llm.token.delta', requestId, text };
}

/**
 * 创建推理 token 增量事件。
 */
export function createLLMReasoningDeltaEvent(requestId: string, text: string): LLMReasoningDeltaEvent {
  return { type: 'llm.reasoning.delta', requestId, text };
}

/**
 * 创建请求完成事件。
 */
export function createLLMRequestCompletedEvent(
  requestId: string,
  options?: { usage?: LLMUsage; completedAt?: string },
): LLMRequestCompletedEvent {
  return {
    type: 'llm.request.completed',
    requestId,
    usage: options?.usage,
    completedAt: options?.completedAt ?? new Date().toISOString(),
  };
}

/**
 * 创建请求失败事件。
 */
export function createLLMRequestFailedEvent(
  requestId: string,
  errorCode: string,
  error: string,
): LLMRequestFailedEvent {
  return { type: 'llm.request.failed', requestId, errorCode, error };
}

/**
 * 创建请求取消事件。
 */
export function createLLMRequestCancelledEvent(
  requestId: string,
  reason?: string,
): LLMRequestCancelledEvent {
  return { type: 'llm.request.cancelled', requestId, reason };
}

/**
 * 从流式事件中收集正文 token。
 * 只累加 `llm.token.delta`，不包含 reasoning delta。
 */
export function collectLLMText(events: LLMStreamEvent[]): string {
  return events
    .filter((e): e is LLMTokenDeltaEvent => e.type === 'llm.token.delta')
    .map((e) => e.text)
    .join('');
}

/**
 * 从流式事件中收集推理 token。
 */
export function collectLLMReasoning(events: LLMStreamEvent[]): string {
  return events
    .filter((e): e is LLMReasoningDeltaEvent => e.type === 'llm.reasoning.delta')
    .map((e) => e.text)
    .join('');
}

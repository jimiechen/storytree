/**
 * @file target-llm-stream-parser.ts
 * @description 真实 LLM 流式事件辅助工具 — P3-A
 *
 * 提供 mock 流式生成器与 SSE 行解析工具，用于：
 * - 单元测试：不需要真实网络请求即可验证事件链路。
 * - 默认/禁用场景：返回稳定事件序列，帮助 UI 消费统一协议。
 * - 供应商 transport 内部复用 SSE 解析逻辑。
 */

import type { LLMStreamEvent } from './llm-stream-events';
import type { LLMUsage } from './llm-request-types';
import {
  createLLMRequestStartedEvent,
  createLLMTokenDeltaEvent,
  createLLMReasoningDeltaEvent,
  createLLMRequestCompletedEvent,
  createLLMRequestFailedEvent,
} from './llm-stream-events';

/**
 * 创建 Mock 流式生成器。
 *
 * 用于测试与非真实调用场景，按固定长度切分文本并产生 token delta 事件。
 */
export async function* createMockTokenStream(
  requestId: string,
  text: string,
  options?: { chunkSize?: number; adapter?: string; usage?: LLMUsage },
): AsyncGenerator<LLMStreamEvent> {
  const chunkSize = options?.chunkSize ?? 2;
  const adapter = options?.adapter ?? 'mock';

  yield createLLMRequestStartedEvent(requestId, adapter);

  for (let i = 0; i < text.length; i += chunkSize) {
    yield createLLMTokenDeltaEvent(requestId, text.slice(i, i + chunkSize));
  }

  yield createLLMRequestCompletedEvent(requestId, { usage: options?.usage });
}

/**
 * 创建带推理内容的 Mock 流式生成器。
 */
export async function* createMockReasoningStream(
  requestId: string,
  reasoningText: string,
  answerText: string,
  options?: { chunkSize?: number; adapter?: string; usage?: LLMUsage },
): AsyncGenerator<LLMStreamEvent> {
  const chunkSize = options?.chunkSize ?? 2;
  const adapter = options?.adapter ?? 'mock';

  yield createLLMRequestStartedEvent(requestId, adapter);

  for (let i = 0; i < reasoningText.length; i += chunkSize) {
    yield createLLMReasoningDeltaEvent(requestId, reasoningText.slice(i, i + chunkSize));
  }

  for (let i = 0; i < answerText.length; i += chunkSize) {
    yield createLLMTokenDeltaEvent(requestId, answerText.slice(i, i + chunkSize));
  }

  yield createLLMRequestCompletedEvent(requestId, { usage: options?.usage });
}

/**
 * 创建 Mock 失败流。
 */
export async function* createMockFailedStream(
  requestId: string,
  errorCode: string,
  error: string,
): AsyncGenerator<LLMStreamEvent> {
  yield createLLMRequestStartedEvent(requestId, 'mock');
  yield createLLMRequestFailedEvent(requestId, errorCode, error);
}

/**
 * 解析 SSE 文本中的一条 `data: ...` 行。
 *
 * 返回 data 字段内容；如果不是 data 行或空行返回 null。
 */
export function parseSSEDataLine(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith(':')) return null;
  if (!trimmed.startsWith('data: ')) return null;
  return trimmed.slice(6).trim();
}

/**
 * 将 SSE 原始文本块切分为独立的 data 行内容。
 */
export function splitSSEDataLines(chunk: string, bufferRef?: { value: string }): string[] {
  let buffer = bufferRef?.value ?? '';
  buffer += chunk;
  const lines = buffer.split('\n');
  const remaining = lines.pop() ?? '';
  if (bufferRef) bufferRef.value = remaining;
  return lines.map((line) => parseSSEDataLine(line)).filter((line): line is string => line !== null);
}

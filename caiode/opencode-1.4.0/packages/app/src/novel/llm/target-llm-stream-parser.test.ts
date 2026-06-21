/**
 * @file target-llm-stream-parser.test.ts
 * @description Target LLM Stream Parser 单元测试 — P3-A
 */

import { describe, it, expect } from 'vitest';
import {
  createMockTokenStream,
  createMockReasoningStream,
  createMockFailedStream,
  parseSSEDataLine,
  splitSSEDataLines,
} from './target-llm-stream-parser';
import { collectLLMText, collectLLMReasoning } from './llm-stream-events';
import type { LLMUsage } from './llm-request-types';

describe('TargetLLMStreamParser', () => {
  it('createMockTokenStream 生成完整事件序列', async () => {
    const events: unknown[] = [];
    for await (const event of createMockTokenStream('req-001', '你好世界')) {
      events.push(event);
    }

    expect(events[0]).toMatchObject({ type: 'llm.request.started', requestId: 'req-001', adapter: 'mock' });
    expect(events.at(-1)).toMatchObject({ type: 'llm.request.completed', requestId: 'req-001' });
    expect(collectLLMText(events as import('./llm-stream-events').LLMStreamEvent[])).toBe('你好世界');
  });

  it('createMockTokenStream 支持自定义 chunkSize 与 adapter', async () => {
    const events: unknown[] = [];
    const usage: LLMUsage = { promptTokens: 1, completionTokens: 2, totalTokens: 3 };
    for await (const event of createMockTokenStream('req-002', 'ABCDE', { chunkSize: 1, adapter: 'deepseek', usage })) {
      events.push(event);
    }

    expect(events[0]).toMatchObject({ type: 'llm.request.started', adapter: 'deepseek' });
    expect(events.filter((e) => (e as { type: string }).type === 'llm.token.delta').length).toBe(5);
    expect((events.at(-1) as { usage?: LLMUsage }).usage).toEqual(usage);
  });

  it('createMockReasoningStream 分别生成 reasoning 与 token 事件', async () => {
    const events: import('./llm-stream-events').LLMStreamEvent[] = [];
    for await (const event of createMockReasoningStream('req-003', '推理过程', '最终答案')) {
      events.push(event);
    }

    expect(collectLLMReasoning(events)).toBe('推理过程');
    expect(collectLLMText(events)).toBe('最终答案');
    expect(events.at(-1)?.type).toBe('llm.request.completed');
  });

  it('createMockFailedStream 生成 started 与 failed 事件', async () => {
    const events: unknown[] = [];
    for await (const event of createMockFailedStream('req-004', 'TEST_ERROR', '测试失败')) {
      events.push(event);
    }

    expect(events[0]).toMatchObject({ type: 'llm.request.started', requestId: 'req-004' });
    expect(events[1]).toMatchObject({ type: 'llm.request.failed', errorCode: 'TEST_ERROR', error: '测试失败' });
  });

  it('parseSSEDataLine 正确解析 data 行', () => {
    expect(parseSSEDataLine('data: hello')).toBe('hello');
    expect(parseSSEDataLine('data: hello ')).toBe('hello');
    expect(parseSSEDataLine('data:  {"id":1}')).toBe('{"id":1}');
  });

  it('parseSSEDataLine 忽略非 data 行与空行', () => {
    expect(parseSSEDataLine('')).toBeNull();
    expect(parseSSEDataLine('   ')).toBeNull();
    expect(parseSSEDataLine(': comment')).toBeNull();
    expect(parseSSEDataLine('event: message')).toBeNull();
    expect(parseSSEDataLine('foo: bar')).toBeNull();
  });

  it('splitSSEDataLines 跨块拼接不完整的行', () => {
    const bufferRef = { value: '' };
    const lines1 = splitSSEDataLines('data: first\ndata: se', bufferRef);
    expect(lines1).toEqual(['first']);
    expect(bufferRef.value).toBe('data: se');

    const lines2 = splitSSEDataLines('cond\ndata: third\n', bufferRef);
    expect(lines2).toEqual(['second', 'third']);
    expect(bufferRef.value).toBe('');
  });

  it('splitSSEDataLines 过滤空行与注释', () => {
    const bufferRef = { value: '' };
    const lines = splitSSEDataLines('data: a\n\n: comment\ndata: b\n', bufferRef);
    expect(lines).toEqual(['a', 'b']);
  });
});

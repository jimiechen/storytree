/**
 * @file llm-stream-events.test.ts
 * @description 真实 LLM 流式事件协议单元测试 — P3-0
 */

import { describe, it, expect } from 'vitest';
import {
  createLLMRequestStartedEvent,
  createLLMTokenDeltaEvent,
  createLLMReasoningDeltaEvent,
  createLLMRequestCompletedEvent,
  createLLMRequestFailedEvent,
  createLLMRequestCancelledEvent,
  collectLLMText,
  collectLLMReasoning,
} from './llm-stream-events';

describe('LLM Stream Events', () => {
  it('创建请求开始事件', () => {
    const event = createLLMRequestStartedEvent('req-001', 'mock-adapter', {
      commandId: 'cmd-001',
      workflowId: 'wf-001',
      createdAt: '2026-06-21T00:00:00.000Z',
    });
    expect(event.type).toBe('llm.request.started');
    expect(event.requestId).toBe('req-001');
    expect(event.adapter).toBe('mock-adapter');
    expect(event.commandId).toBe('cmd-001');
    expect(event.workflowId).toBe('wf-001');
    expect(event.createdAt).toBe('2026-06-21T00:00:00.000Z');
  });

  it('创建 token / reasoning delta 事件', () => {
    expect(createLLMTokenDeltaEvent('req-001', 'hello')).toEqual({
      type: 'llm.token.delta',
      requestId: 'req-001',
      text: 'hello',
    });
    expect(createLLMReasoningDeltaEvent('req-001', 'think')).toEqual({
      type: 'llm.reasoning.delta',
      requestId: 'req-001',
      text: 'think',
    });
  });

  it('从事件中只收集正文 token', () => {
    const events = [
      createLLMRequestStartedEvent('req-001', 'mock'),
      createLLMTokenDeltaEvent('req-001', 'Hello '),
      createLLMReasoningDeltaEvent('req-001', '[reasoning]'),
      createLLMTokenDeltaEvent('req-001', 'world'),
      createLLMRequestCompletedEvent('req-001'),
    ];
    expect(collectLLMText(events)).toBe('Hello world');
  });

  it('从事件中只收集 reasoning token', () => {
    const events = [
      createLLMTokenDeltaEvent('req-001', 'Hello '),
      createLLMReasoningDeltaEvent('req-001', 'step1 '),
      createLLMReasoningDeltaEvent('req-001', 'step2'),
    ];
    expect(collectLLMReasoning(events)).toBe('step1 step2');
  });

  it('创建失败与取消事件', () => {
    const failed = createLLMRequestFailedEvent('req-001', 'CLIENT_STUB_ONLY', 'stub only');
    expect(failed.type).toBe('llm.request.failed');
    expect(failed.errorCode).toBe('CLIENT_STUB_ONLY');

    const cancelled = createLLMRequestCancelledEvent('req-001', 'user cancel');
    expect(cancelled.type).toBe('llm.request.cancelled');
    expect(cancelled.reason).toBe('user cancel');
  });
});

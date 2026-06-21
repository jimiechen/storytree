/**
 * @file real-llm-client.stub.test.ts
 * @description 真实 LLM Client Stub 单元测试 — P3-0
 */

import { describe, it, expect } from 'vitest';
import { RealLLMClientStub } from './real-llm-client.stub';
import { LLMError, isLLMError } from './llm-error-types';
import { collectLLMText } from './llm-stream-events';
import type { LLMRequest } from './llm-request-types';

function makeRequest(overrides?: Partial<LLMRequest>): LLMRequest {
  return {
    requestId: 'req-001',
    adapter: 'mock-real-llm',
    prompt: '写一段小说开头',
    stream: true,
    timeoutMs: 30_000,
    metadata: { projectId: 'proj-001' },
    ...overrides,
  };
}

describe('RealLLMClientStub', () => {
  it('非流式 execute 抛 CLIENT_STUB_ONLY 错误', async () => {
    const client = new RealLLMClientStub();
    await expect(client.execute(makeRequest())).rejects.toThrow(LLMError);
    try {
      await client.execute(makeRequest());
    } catch (error) {
      expect(isLLMError(error)).toBe(true);
      if (isLLMError(error)) {
        expect(error.code).toBe('CLIENT_STUB_ONLY');
        expect(error.requestId).toBe('req-001');
      }
    }
  });

  it('流式 executeStream 不发起真实请求，返回 stub 事件序列', async () => {
    const client = new RealLLMClientStub();
    const events: unknown[] = [];
    for await (const event of client.executeStream(makeRequest())) {
      events.push(event);
    }

    expect(events.length).toBe(4);
    expect((events[0] as { type: string }).type).toBe('llm.request.started');
    expect((events[1] as { type: string }).type).toBe('llm.token.delta');
    expect((events[2] as { type: string }).type).toBe('llm.token.delta');
    expect((events[3] as { type: string }).type).toBe('llm.request.completed');

    const text = collectLLMText(events as Parameters<typeof collectLLMText>[0]);
    expect(text).toContain('[Stub]');
    expect(text).toContain('P3-0');
  });

  it('stub 不读取环境变量', () => {
    const client = new RealLLMClientStub();
    expect((client as unknown as Record<string, unknown>).apiKey).toBeUndefined();
    expect((client as unknown as Record<string, unknown>).baseURL).toBeUndefined();
  });
});

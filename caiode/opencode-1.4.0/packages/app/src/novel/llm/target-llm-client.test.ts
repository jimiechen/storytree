/**
 * @file target-llm-client.test.ts
 * @description Target LLM Client 单元测试 — P3-A
 */

import { describe, it, expect } from 'vitest';
import { createTargetLLMClient, disabledLLMTransport, type LLMTransport } from './target-llm-client';
import { LLMError, isLLMError } from './llm-error-types';
import { createMockTokenStream } from './target-llm-stream-parser';
import type { LLMRequest, LLMResponse } from './llm-request-types';
import type { LLMStreamEvent } from './llm-stream-events';

function makeRequest(overrides?: Partial<LLMRequest>): LLMRequest {
  return {
    requestId: 'req-001',
    adapter: 'real-llm',
    prompt: '写一段小说开头',
    stream: false,
    timeoutMs: 100,
    metadata: { projectId: 'proj-001' },
    ...overrides,
  };
}

function createMockTransport(responseText: string): LLMTransport {
  return {
    name: 'mock',

    async complete(request: LLMRequest): Promise<LLMResponse> {
      return { requestId: request.requestId, text: responseText };
    },

    async *stream(request: LLMRequest): AsyncGenerator<LLMStreamEvent> {
      yield* createMockTokenStream(request.requestId, responseText);
    },
  };
}

describe('TargetLLMClient', () => {
  it('默认使用 disabled transport，complete 抛 CLIENT_STUB_ONLY', async () => {
    const client = createTargetLLMClient();
    expect(client.transportName).toBe('disabled');
    await expect(client.complete(makeRequest())).rejects.toThrow(LLMError);
    try {
      await client.complete(makeRequest());
    } catch (error) {
      expect(isLLMError(error)).toBe(true);
      if (isLLMError(error)) {
        expect(error.code).toBe('CLIENT_STUB_ONLY');
      }
    }
  });

  it('默认使用 disabled transport，stream 抛 CLIENT_STUB_ONLY', async () => {
    const client = createTargetLLMClient();
    const events: LLMStreamEvent[] = [];
    try {
      for await (const event of client.stream(makeRequest())) {
        events.push(event);
      }
    } catch (error) {
      expect(isLLMError(error)).toBe(true);
      if (isLLMError(error)) {
        expect(error.code).toBe('CLIENT_STUB_ONLY');
      }
    }
    expect(events.length).toBe(0);
  });

  it('注入 mock transport 后 complete 返回响应', async () => {
    const client = createTargetLLMClient({ transport: createMockTransport('_mock_') });
    const response = await client.complete(makeRequest());
    expect(response.text).toBe('_mock_');
    expect(response.requestId).toBe('req-001');
  });

  it('注入 mock transport 后 stream 返回事件序列', async () => {
    const client = createTargetLLMClient({ transport: createMockTransport('hi') });
    const events: LLMStreamEvent[] = [];
    for await (const event of client.stream(makeRequest())) {
      events.push(event);
    }
    expect(events.length).toBeGreaterThan(0);
    expect(events[0]?.type).toBe('llm.request.started');
    expect(events.at(-1)?.type).toBe('llm.request.completed');
  });

  it('complete 支持超时', async () => {
    const slowTransport: LLMTransport = {
      name: 'slow',
      async complete(request: LLMRequest): Promise<LLMResponse> {
        await new Promise((resolve) => setTimeout(resolve, request.timeoutMs + 50));
        return { requestId: request.requestId, text: 'too late' };
      },
      async *stream(): AsyncGenerator<LLMStreamEvent> {
        yield { type: 'llm.request.completed', requestId: 'x', completedAt: new Date().toISOString() };
      },
    };

    const client = createTargetLLMClient({ transport: slowTransport });
    await expect(client.complete(makeRequest({ timeoutMs: 50 }))).rejects.toThrow(LLMError);
    try {
      await client.complete(makeRequest({ timeoutMs: 50 }));
    } catch (error) {
      expect(isLLMError(error)).toBe(true);
      if (isLLMError(error)) {
        expect(error.code).toBe('LLM_REQUEST_TIMEOUT');
      }
    }
  });

  it('transport 异常被转换为 LLM_NETWORK_ERROR', async () => {
    const failingTransport: LLMTransport = {
      name: 'failing',
      async complete(): Promise<LLMResponse> {
        throw new Error('network down');
      },
      async *stream(): AsyncGenerator<LLMStreamEvent> {
        throw new Error('stream broken');
      },
    };

    const client = createTargetLLMClient({ transport: failingTransport });
    await expect(client.complete(makeRequest())).rejects.toThrow(LLMError);
    try {
      await client.complete(makeRequest());
    } catch (error) {
      expect(isLLMError(error)).toBe(true);
      if (isLLMError(error)) {
        expect(error.code).toBe('LLM_NETWORK_ERROR');
      }
    }
  });

  it('disabledLLMTransport 名称正确', () => {
    expect(disabledLLMTransport.name).toBe('disabled');
  });
});

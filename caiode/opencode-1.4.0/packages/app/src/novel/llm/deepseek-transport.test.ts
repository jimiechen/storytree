/**
 * @file deepseek-transport.test.ts
 * @description DeepSeek Transport 单元测试 — P3-A
 */

import { describe, it, expect } from 'vitest';
import { createDeepSeekTransport, DEEPSEEK_API_BASE_URL, DEEPSEEK_DEFAULT_MODEL } from './deepseek-transport';
import { LLMError, isLLMError } from './llm-error-types';
import type { LLMRequest } from './llm-request-types';
import type { LLMStreamEvent } from './llm-stream-events';

function makeRequest(overrides?: Partial<LLMRequest>): LLMRequest {
  return {
    requestId: 'req-ds-001',
    adapter: 'real-llm',
    prompt: '写一段小说开头',
    stream: false,
    timeoutMs: 30_000,
    metadata: { projectId: 'proj-001' },
    ...overrides,
  };
}

function createMockFetch(response: Response): typeof fetch {
  return () => Promise.resolve(response);
}

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function createStreamResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
  return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

describe('DeepSeekTransport', () => {
  it('缺少 API Key 时抛出 LLM_SECRET_MISSING', () => {
    expect(() => createDeepSeekTransport({ apiKey: '' })).toThrow(LLMError);
    try {
      createDeepSeekTransport({ apiKey: 'short' });
    } catch (error) {
      expect(isLLMError(error)).toBe(true);
      if (isLLMError(error)) {
        expect(error.code).toBe('LLM_SECRET_MISSING');
      }
    }
  });

  it('complete 返回解析后的正文', async () => {
    const transport = createDeepSeekTransport({
      apiKey: 'sk-test-deepseek',
      fetchImpl: createMockFetch(
        createJsonResponse({
          id: 'resp-001',
          choices: [{ message: { content: '夜色如墨' }, finish_reason: 'stop' }],
          usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        }),
      ),
    });

    const response = await transport.complete(makeRequest());
    expect(response.text).toBe('夜色如墨');
    expect(response.requestId).toBe('req-ds-001');
    expect(response.usage?.totalTokens).toBe(15);
  });

  it('complete 遇到 HTTP 错误时抛 LLM_PROVIDER_ERROR', async () => {
    const transport = createDeepSeekTransport({
      apiKey: 'sk-test-deepseek',
      fetchImpl: createMockFetch(createJsonResponse({ error: 'invalid key' }, 401)),
    });

    await expect(transport.complete(makeRequest())).rejects.toThrow(LLMError);
    try {
      await transport.complete(makeRequest());
    } catch (error) {
      expect(isLLMError(error)).toBe(true);
      if (isLLMError(error)) {
        expect(error.code).toBe('LLM_PROVIDER_ERROR');
      }
    }
  });

  it('complete 空 choices 时抛 LLM_EMPTY_RESPONSE', async () => {
    const transport = createDeepSeekTransport({
      apiKey: 'sk-test-deepseek',
      fetchImpl: createMockFetch(createJsonResponse({ id: 'resp-empty', choices: [] })),
    });

    await expect(transport.complete(makeRequest())).rejects.toThrow(LLMError);
  });

  it('complete 响应体 error 字段转 LLM_PROVIDER_ERROR', async () => {
    const transport = createDeepSeekTransport({
      apiKey: 'sk-test-deepseek',
      fetchImpl: createMockFetch(
        createJsonResponse({ id: 'resp-err', choices: [], error: { message: 'quota exceeded' } }),
      ),
    });

    await expect(transport.complete(makeRequest())).rejects.toThrow('quota exceeded');
  });

  it('complete 使用默认 baseURL 与 model', async () => {
    let capturedUrl: string | undefined;
    let capturedBody: unknown;
    const fetchImpl: typeof fetch = async (input, init) => {
      capturedUrl = input.toString();
      capturedBody = JSON.parse(init?.body as string);
      return createJsonResponse({
        id: 'resp-001',
        choices: [{ message: { content: '默认模型返回' }, finish_reason: 'stop' }],
      });
    };

    const transport = createDeepSeekTransport({ apiKey: 'sk-test-deepseek', fetchImpl });
    await transport.complete(makeRequest());

    expect(capturedUrl).toBe(`${DEEPSEEK_API_BASE_URL}/chat/completions`);
    expect((capturedBody as { model: string }).model).toBe(DEEPSEEK_DEFAULT_MODEL);
  });

  it('stream 解析 SSE 数据并产出统一事件', async () => {
    const chunks = [
      'data: {"id":"stream-1","choices":[{"delta":{"content":"夜"},"finish_reason":null}]}\n\n',
      'data: {"id":"stream-1","choices":[{"delta":{"content":"色"},"finish_reason":null}]}\n\n',
      'data: [DONE]\n\n',
    ];
    const transport = createDeepSeekTransport({
      apiKey: 'sk-test-deepseek',
      fetchImpl: createMockFetch(createStreamResponse(chunks)),
    });

    const events: LLMStreamEvent[] = [];
    for await (const event of transport.stream(makeRequest({ stream: true }))) {
      events.push(event);
    }

    expect(events[0]?.type).toBe('llm.request.started');
    expect(events.at(-1)?.type).toBe('llm.request.completed');
    expect(events.filter((e) => e.type === 'llm.token.delta').length).toBe(2);
  });

  it('stream 遇到 HTTP 错误时产出 failed 事件', async () => {
    const transport = createDeepSeekTransport({
      apiKey: 'sk-test-deepseek',
      fetchImpl: createMockFetch(createJsonResponse({ error: 'unauthorized' }, 401)),
    });

    const events: LLMStreamEvent[] = [];
    for await (const event of transport.stream(makeRequest({ stream: true }))) {
      events.push(event);
    }

    expect(events[0]?.type).toBe('llm.request.failed');
  });

  it('stream 解析异常时产出 failed 事件', async () => {
    const transport = createDeepSeekTransport({
      apiKey: 'sk-test-deepseek',
      fetchImpl: createMockFetch(
        createStreamResponse(['data: not-json\n\n']),
      ),
    });

    const events: LLMStreamEvent[] = [];
    for await (const event of transport.stream(makeRequest({ stream: true }))) {
      events.push(event);
    }

    expect(events.some((e) => e.type === 'llm.request.failed')).toBe(true);
  });

  it('stream 输出 reasoning_content 当 includeReasoning=true', async () => {
    const chunks = [
      'data: {"id":"stream-r","choices":[{"delta":{"reasoning_content":"推理","content":""},"finish_reason":null}]}\n\n',
      'data: {"id":"stream-r","choices":[{"delta":{"content":"正文"},"finish_reason":null}]}\n\n',
      'data: [DONE]\n\n',
    ];
    const transport = createDeepSeekTransport({
      apiKey: 'sk-test-deepseek',
      includeReasoning: true,
      fetchImpl: createMockFetch(createStreamResponse(chunks)),
    });

    const events: LLMStreamEvent[] = [];
    for await (const event of transport.stream(makeRequest({ stream: true }))) {
      events.push(event);
    }

    expect(events.some((e) => e.type === 'llm.reasoning.delta')).toBe(true);
    expect(events.filter((e) => e.type === 'llm.token.delta').length).toBe(1);
  });
});

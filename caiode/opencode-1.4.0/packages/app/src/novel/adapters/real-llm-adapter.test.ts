/**
 * @file real-llm-adapter.test.ts
 * @description Real LLM Execution Adapter 单元测试 — P3-A
 */

import { describe, it, expect } from 'vitest';
import { RealLLMExecutionAdapter } from './real-llm-adapter';
import { createTargetLLMClient, type LLMTransport } from '../llm/target-llm-client';
import { createDefaultRealLLMFeatureGates, type RealLLMFeatureGates } from '../llm/llm-feature-gates';
import { createChapterGenerateCommand, createAIWritingCommand } from '../workflows/novel-command';
import type { AdapterContext } from './adapter-types';
import type { LLMRequest, LLMResponse } from '../llm/llm-request-types';
import type { LLMStreamEvent } from '../llm/llm-stream-events';
import { createMockTokenStream } from '../llm/target-llm-stream-parser';

function makeGates(overrides?: Partial<RealLLMFeatureGates>): RealLLMFeatureGates {
  return { ...createDefaultRealLLMFeatureGates(), ...overrides };
}

function makeContext(overrides?: Partial<AdapterContext>): AdapterContext {
  return {
    projectId: 'proj-001',
    chapterId: 'ch-001',
    genre: '玄幻',
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

describe('RealLLMExecutionAdapter', () => {
  it('canHandle 只接受 chapter.generate 与 chapter.continue', () => {
    const adapter = new RealLLMExecutionAdapter({
      client: createTargetLLMClient(),
      gates: makeGates(),
    });

    const generate = createChapterGenerateCommand({
      projectId: 'p',
      chapterId: 'c',
      chapterIndex: 1,
      genre: '玄幻',
      text: '测试',
    });
    expect(adapter.canHandle(generate, makeContext())).toBe(true);

    const continueCmd = createAIWritingCommand({
      projectId: 'p',
      chapterId: 'c',
      chapterIndex: 1,
      genre: '玄幻',
      command: 'continue',
      text: '测试',
    });
    expect(adapter.canHandle(continueCmd, makeContext())).toBe(true);

    const polish = createAIWritingCommand({
      projectId: 'p',
      chapterId: 'c',
      chapterIndex: 1,
      genre: '玄幻',
      command: 'polish',
      text: '测试',
    });
    expect(adapter.canHandle(polish, makeContext())).toBe(false);
  });

  it('gate 未开启时 execute 返回结构化错误', async () => {
    const adapter = new RealLLMExecutionAdapter({
      client: createTargetLLMClient(),
      gates: makeGates(),
    });

    const result = await adapter.execute(
      createChapterGenerateCommand({
        projectId: 'p',
        chapterId: 'c',
        chapterIndex: 1,
        genre: '玄幻',
        text: '测试',
      }),
      makeContext(),
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('REAL_LLM_NOT_ENABLED');
  });

  it('dryRun 模式不调用 client 并返回预览', async () => {
    const adapter = new RealLLMExecutionAdapter({
      client: createTargetLLMClient({ transport: createMockTransport('不应返回') }),
      gates: makeGates({ realLLMEnabled: true, targetLLMAdapterEnabled: true }),
    });

    const result = await adapter.execute(
      createChapterGenerateCommand({
        projectId: 'p',
        chapterId: 'c',
        chapterIndex: 1,
        genre: '玄幻',
        text: '测试',
      }),
      makeContext({ dryRun: true }),
    );

    expect(result.success).toBe(true);
    expect(result.result?.text).toContain('[dryRun]');
    expect(result.result?.text).toContain('transport: mock');
  });

  it('execute 正常返回 LLM 正文', async () => {
    const adapter = new RealLLMExecutionAdapter({
      client: createTargetLLMClient({ transport: createMockTransport('生成的正文') }),
      gates: makeGates({ realLLMEnabled: true, targetLLMAdapterEnabled: true }),
    });

    const result = await adapter.execute(
      createChapterGenerateCommand({
        projectId: 'p',
        chapterId: 'c',
        chapterIndex: 1,
        genre: '玄幻',
        text: '测试',
      }),
      makeContext(),
    );

    expect(result.success).toBe(true);
    expect(result.result?.text).toBe('生成的正文');
    expect(result.result?.status).toBe('completed');
  });

  it('execute 将 LLMError 转为结构化错误', async () => {
    const failingTransport: LLMTransport = {
      name: 'failing',
      async complete(): Promise<LLMResponse> {
        throw new Error('boom');
      },
      async *stream(): AsyncGenerator<LLMStreamEvent> {
        yield { type: 'llm.request.completed', requestId: 'x', completedAt: new Date().toISOString() };
      },
    };

    const adapter = new RealLLMExecutionAdapter({
      client: createTargetLLMClient({ transport: failingTransport }),
      gates: makeGates({ realLLMEnabled: true, targetLLMAdapterEnabled: true }),
    });

    const result = await adapter.execute(
      createChapterGenerateCommand({
        projectId: 'p',
        chapterId: 'c',
        chapterIndex: 1,
        genre: '玄幻',
        text: '测试',
      }),
      makeContext(),
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('LLM_NETWORK_ERROR');
  });

  it('executeStream gate 未开启时第一个事件为 failed', async () => {
    const adapter = new RealLLMExecutionAdapter({
      client: createTargetLLMClient(),
      gates: makeGates(),
    });

    const events: LLMStreamEvent[] = [];
    for await (const event of adapter.executeStream(
      createChapterGenerateCommand({
        projectId: 'p',
        chapterId: 'c',
        chapterIndex: 1,
        genre: '玄幻',
        text: '测试',
      }),
      makeContext(),
    )) {
      events.push(event);
    }

    expect(events[0]?.type).toBe('llm.request.failed');
  });

  it('executeStream dryRun 返回预览事件序列', async () => {
    const adapter = new RealLLMExecutionAdapter({
      client: createTargetLLMClient({ transport: createMockTransport('不应返回') }),
      gates: makeGates({ realLLMEnabled: true, targetLLMAdapterEnabled: true, llmStreamingEnabled: true }),
    });

    const events: LLMStreamEvent[] = [];
    for await (const event of adapter.executeStream(
      createChapterGenerateCommand({
        projectId: 'p',
        chapterId: 'c',
        chapterIndex: 1,
        genre: '玄幻',
        text: '测试',
      }),
      makeContext({ dryRun: true }),
    )) {
      events.push(event);
    }

    expect(events[0]?.type).toBe('llm.request.started');
    expect(events.at(-1)?.type).toBe('llm.request.completed');
    expect(events.some((e) => e.type === 'llm.token.delta')).toBe(true);
  });

  it('executeStream 正常返回流式事件', async () => {
    const adapter = new RealLLMExecutionAdapter({
      client: createTargetLLMClient({ transport: createMockTransport('流式正文') }),
      gates: makeGates({ realLLMEnabled: true, targetLLMAdapterEnabled: true, llmStreamingEnabled: true }),
    });

    const events: LLMStreamEvent[] = [];
    for await (const event of adapter.executeStream(
      createAIWritingCommand({
        projectId: 'p',
        chapterId: 'c',
        chapterIndex: 1,
        genre: '玄幻',
        command: 'continue',
        text: '他推开门',
      }),
      makeContext(),
    )) {
      events.push(event);
    }

    expect(events[0]?.type).toBe('llm.request.started');
    expect(events.at(-1)?.type).toBe('llm.request.completed');
  });
});

/**
 * @file real-llm-adapter.test.ts
 * @description Real LLM Execution Adapter 单元测试 — P3-A
 */

import { describe, it, expect } from 'vitest';
import { RealLLMExecutionAdapter } from './real-llm-adapter';
import { createTargetLLMClient, type LLMTransport } from '../llm/target-llm-client';
import { createDefaultRealLLMFeatureGates, type RealLLMFeatureGates } from '../llm/llm-feature-gates';
import { createUsageTracker } from '../llm/usage-tracker';
import { MockExecutionAdapter } from './mock-execution-adapter';
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

  it('execute 正常返回 LLM 正文并附带校验信息', async () => {
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
        targetWordCount: 800,
      }),
      makeContext(),
    );

    expect(result.success).toBe(true);
    expect(result.result?.text).toBe('生成的正文');
    expect(result.result?.status).toBe('completed');
    // P3-C：短文本会触发 RESULT_TOO_SHORT
    expect(result.result?.validationIssues).toBeDefined();
    expect(result.result?.validationIssues?.some((i) => i.code === 'RESULT_TOO_SHORT')).toBe(true);
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
      retryPolicy: { maxAttempts: 1, backoffMs: 0, retryableErrorCodes: [] },
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

  it('execute 对可重试错误执行重试并最终成功', async () => {
    let attempts = 0;
    const flakyTransport: LLMTransport = {
      name: 'flaky',
      async complete(request: LLMRequest): Promise<LLMResponse> {
        attempts += 1;
        if (attempts === 1) {
          throw new Error('timeout');
        }
        return { requestId: request.requestId, text: '重试后成功' };
      },
      async *stream(): AsyncGenerator<LLMStreamEvent> {
        yield { type: 'llm.request.completed', requestId: 'x', completedAt: new Date().toISOString() };
      },
    };

    const adapter = new RealLLMExecutionAdapter({
      client: createTargetLLMClient({ transport: flakyTransport }),
      gates: makeGates({ realLLMEnabled: true, targetLLMAdapterEnabled: true }),
      retryPolicy: { maxAttempts: 2, backoffMs: 10, retryableErrorCodes: ['LLM_NETWORK_ERROR'] },
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
    expect(result.result?.text).toBe('重试后成功');
    expect(attempts).toBe(2);
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

  it('P3-D：按 modelProfileId 选择模型配置并写入 metadata', async () => {
    const adapter = new RealLLMExecutionAdapter({
      client: createTargetLLMClient({ transport: createMockTransport('选中 deepseek-chat') }),
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
      makeContext({ modelProfileId: 'deepseek-chat' }),
    );

    expect(result.success).toBe(true);
    expect(result.result?.metadata?.modelProfileId).toBe('deepseek-chat');
    expect(result.result?.metadata?.modelId).toBe('deepseek-chat');
    expect(result.result?.metadata?.estimatedCost).toBeUndefined();
  });

  it('P3-D：按 modelRole 推断模型配置', async () => {
    const adapter = new RealLLMExecutionAdapter({
      client: createTargetLLMClient({ transport: createMockTransport('按角色路由') }),
      gates: makeGates({ realLLMEnabled: true, targetLLMAdapterEnabled: true }),
    });

    const result = await adapter.execute(
      createAIWritingCommand({
        projectId: 'p',
        chapterId: 'c',
        chapterIndex: 1,
        genre: '玄幻',
        command: 'polish',
        text: '测试',
      }),
      makeContext({ modelRole: 'rewrite' }),
    );

    expect(result.success).toBe(true);
    expect(result.result?.metadata?.modelProfileId).toBe('deepseek-chat');
  });

  it('P3-D：返回 usage 时估算成本', async () => {
    const transport: LLMTransport = {
      name: 'usage-mock',
      async complete(request: LLMRequest): Promise<LLMResponse> {
        return {
          requestId: request.requestId,
          text: '带用量正文',
          usage: { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 },
        };
      },
      async *stream(): AsyncGenerator<LLMStreamEvent> {
        yield { type: 'llm.request.completed', requestId: 'x', completedAt: new Date().toISOString() };
      },
    };

    const adapter = new RealLLMExecutionAdapter({
      client: createTargetLLMClient({ transport }),
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
    expect(result.result?.metadata?.estimatedCost).toBeDefined();
    expect(result.result?.metadata?.estimatedCost?.currency).toBe('CNY-CENT');
  });

  it('P3-D：记录用量到 UsageTracker', async () => {
    const transport: LLMTransport = {
      name: 'tracker-mock',
      async complete(request: LLMRequest): Promise<LLMResponse> {
        return {
          requestId: request.requestId,
          text: 'tracker 正文',
          usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        };
      },
      async *stream(): AsyncGenerator<LLMStreamEvent> {
        yield { type: 'llm.request.completed', requestId: 'x', completedAt: new Date().toISOString() };
      },
    };

    const tracker = createUsageTracker();
    const adapter = new RealLLMExecutionAdapter({
      client: createTargetLLMClient({ transport }),
      gates: makeGates({ realLLMEnabled: true, targetLLMAdapterEnabled: true }),
      tracker,
    });

    await adapter.execute(
      createChapterGenerateCommand({
        projectId: 'p',
        chapterId: 'c',
        chapterIndex: 1,
        genre: '玄幻',
        text: '测试',
      }),
      makeContext(),
    );

    expect(tracker.getTotalTokens()).toBe(150);
    expect(tracker.getPromptTokens()).toBe(100);
    expect(tracker.getCompletionTokens()).toBe(50);
  });

  it('P3-D：真实调用失败时回退到 mock adapter', async () => {
    const failingTransport: LLMTransport = {
      name: 'failing',
      async complete(): Promise<LLMResponse> {
        throw new Error('timeout');
      },
      async *stream(): AsyncGenerator<LLMStreamEvent> {
        yield { type: 'llm.request.completed', requestId: 'x', completedAt: new Date().toISOString() };
      },
    };

    const adapter = new RealLLMExecutionAdapter({
      client: createTargetLLMClient({ transport: failingTransport }),
      gates: makeGates({
        realLLMEnabled: true,
        targetLLMAdapterEnabled: true,
        llmFallbackToMockEnabled: true,
      }),
      retryPolicy: { maxAttempts: 1, backoffMs: 0, retryableErrorCodes: [] },
      fallbackAdapter: new MockExecutionAdapter({ delayMultiplier: 0, silent: true }),
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
    expect(result.result?.fallback).toBe(true);
    expect(result.result?.originalErrorCode).toBe('LLM_NETWORK_ERROR');
    expect(result.result?.metadata?.fallback).toBe(true);
  });
});

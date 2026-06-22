/**
 * @file chat-debug/novel-debug-command-runner.test.ts
 * @description Chat Debug Command Runner 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { runNovelDebugCommand } from './novel-debug-command-runner';
import { createNovelDebugLogStore } from './novel-debug-log-store';
import { MockAgentAdapter } from '../adapters/mock-agent-adapter';
import { RealLLMExecutionAdapter } from '../adapters/real-llm-adapter';
import { createTargetLLMClient, type LLMTransport } from '../llm/target-llm-client';
import { createDefaultRealLLMFeatureGates, type RealLLMFeatureGates } from '../llm/llm-feature-gates';
import type { NovelDebugLogStore } from './novel-debug-log-types';
import type { LLMRequest, LLMResponse } from '../llm/llm-request-types';
import type { LLMStreamEvent } from '../llm/llm-stream-events';
import { createMockTokenStream } from '../llm/target-llm-stream-parser';

const testAdapter = new MockAgentAdapter({ delayMultiplier: 0, silent: true });

function makeRealLLMAdapter(overrides?: { text?: string; gates?: Partial<RealLLMFeatureGates> }): RealLLMExecutionAdapter {
  const transport: LLMTransport = {
    name: 'mock',
    async complete(request: LLMRequest): Promise<LLMResponse> {
      return { requestId: request.requestId, text: overrides?.text ?? '真实 LLM 返回' };
    },
    async *stream(request: LLMRequest): AsyncGenerator<LLMStreamEvent> {
      yield* createMockTokenStream(request.requestId, overrides?.text ?? '真实 LLM 流式返回');
    },
  };

  return new RealLLMExecutionAdapter({
    client: createTargetLLMClient({ transport }),
    gates: {
      ...createDefaultRealLLMFeatureGates(),
      realLLMEnabled: true,
      targetLLMAdapterEnabled: true,
      llmStreamingEnabled: true,
      ...overrides?.gates,
    },
  });
}

describe('NovelDebugCommandRunner', () => {
  let store: NovelDebugLogStore;

  beforeEach(() => {
    store = createNovelDebugLogStore();
  });

  it('returns help text for /novel help', async () => {
    const result = await runNovelDebugCommand('/novel help', { logStore: store, adapter: testAdapter });
    expect(result.success).toBe(true);
    expect(result.message).toContain('NovelForge Chat Debug Console');
    const log = store.list()[0];
    expect(log.status).toBe('completed');
  });

  it('returns structured error for illegal command without throwing', async () => {
    const result = await runNovelDebugCommand('/novel run unknown.command projectId=proj-1 chapterId=chapter-1', {
      logStore: store,
      adapter: testAdapter,
    });
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('UNKNOWN_COMMAND');
    const log = store.list()[0];
    expect(log.status).toBe('failed');
  });

  it('runs chapter.generate dry run and records completed log', async () => {
    const result = await runNovelDebugCommand(
      '/novel run chapter.generate projectId=proj-1 chapterId=chapter-1 genre=玄幻 targetWordCount=3000 dryRun=true',
      { logStore: store, adapter: testAdapter },
    );

    expect(result.success).toBe(true);
    expect(result.command).toBeDefined();
    expect(result.command!.type).toBe('chapter.generate');
    expect(result.result).toBeDefined();

    const log = store.get(result.logId);
    expect(log).toBeDefined();
    expect(log!.status).toBe('completed');
    expect(log!.result).toEqual(result.result);
  });

  it('runs chapter.continue dry run', async () => {
    const result = await runNovelDebugCommand(
      '/novel run chapter.continue projectId=proj-1 chapterId=chapter-2 selectedText=他推开门 dryRun=true',
      { logStore: store, adapter: testAdapter },
    );

    expect(result.success).toBe(true);
    expect(result.command!.type).toBe('chapter.rewrite');
    expect(result.command!.command).toBe('continue');
    expect(result.result).toBeDefined();
  });

  it('runs info.extract through YAML Workflow Engine', async () => {
    const result = await runNovelDebugCommand(
      '/novel run info.extract projectId=proj-1 chapterId=chapter-1 dryRun=true',
      { logStore: store, adapter: testAdapter },
    );

    expect(result.success).toBe(true);
    expect(result.command).toBeDefined();
    expect(result.command!.type).toBe('chapter.extract-info');
    expect(result.events.length).toBeGreaterThan(0);
    expect(result.result).toBeDefined();
    const log = store.get(result.logId);
    expect(log).toBeDefined();
    expect(log!.status).toBe('completed');
  });

  it('records log status lifecycle queued -> running -> completed', async () => {
    let observedRunning = false;
    const originalUpdate = store.update.bind(store);
    store.update = (id, patch) => {
      if (patch.status === 'running') observedRunning = true;
      return originalUpdate(id, patch);
    };

    const result = await runNovelDebugCommand(
      '/novel run chapter.generate projectId=proj-1 chapterId=chapter-1 dryRun=true',
      { logStore: store, adapter: testAdapter },
    );

    expect(observedRunning).toBe(true);
    const log = store.get(result.logId);
    expect(log!.status).toBe('completed');
    expect(log!.completedAt).toBeInstanceOf(Date);
  });

  it('returns ADAPTER_DISABLED for opencode-stub without running engine', async () => {
    const result = await runNovelDebugCommand(
      '/novel run chapter.generate projectId=proj-1 chapterId=chapter-1 adapter=opencode-stub',
      { logStore: store, adapter: testAdapter },
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('ADAPTER_DISABLED');
    expect(result.command?.adapterKind).toBe('opencode-stub');
  });

  it('returns ADAPTER_DISABLED for claudecode-stub without running engine', async () => {
    const result = await runNovelDebugCommand(
      '/novel run chapter.generate projectId=proj-1 chapterId=chapter-1 adapter=claudecode-stub',
      { logStore: store, adapter: testAdapter },
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('ADAPTER_DISABLED');
  });

  it('runs chapter.generate with adapter=mock', async () => {
    const result = await runNovelDebugCommand(
      '/novel run chapter.generate projectId=proj-1 chapterId=chapter-1 adapter=mock dryRun=true',
      { logStore: store, adapter: testAdapter },
    );

    expect(result.success).toBe(true);
    expect(result.command?.adapterKind).toBe('mock');
  });

  it('returns REAL_LLM_NOT_CONFIGURED when real-llm adapter is not provided', async () => {
    const result = await runNovelDebugCommand(
      '/novel run chapter.generate projectId=proj-1 chapterId=chapter-1 adapter=real-llm dryRun=true',
      { logStore: store, adapter: testAdapter },
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('REAL_LLM_NOT_CONFIGURED');
  });

  it('runs real-llm dryRun and returns preview', async () => {
    const result = await runNovelDebugCommand(
      '/novel run chapter.generate projectId=proj-1 chapterId=chapter-1 adapter=real-llm dryRun=true',
      { logStore: store, adapter: testAdapter, realLLMAdapter: makeRealLLMAdapter() },
    );

    expect(result.success).toBe(true);
    expect(result.command?.adapterKind).toBe('real-llm');
    expect(result.result).toBeDefined();
    const log = store.get(result.logId);
    expect(log).toBeDefined();
    expect(log!.status).toBe('completed');
  });

  it('runs real-llm stream dryRun and records llmEvents', async () => {
    const result = await runNovelDebugCommand(
      '/novel run chapter.continue projectId=proj-1 chapterId=chapter-2 selectedText=他推开门 adapter=real-llm stream=true dryRun=true',
      { logStore: store, adapter: testAdapter, realLLMAdapter: makeRealLLMAdapter({ text: '流式预览' }) },
    );

    expect(result.success).toBe(true);
    expect(result.llmEvents).toBeDefined();
    expect(result.llmEvents!.length).toBeGreaterThan(0);
    const log = store.get(result.logId);
    expect(log!.llmEvents).toBeDefined();
    expect(log!.llmEvents!.length).toBeGreaterThan(0);
  });

  it('returns structured error when real-llm gate is closed', async () => {
    const result = await runNovelDebugCommand(
      '/novel run chapter.generate projectId=proj-1 chapterId=chapter-1 adapter=real-llm dryRun=true',
      {
        logStore: store,
        adapter: testAdapter,
        realLLMAdapter: makeRealLLMAdapter({ gates: { realLLMEnabled: false } }),
      },
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('REAL_LLM_NOT_ENABLED');
    const log = store.get(result.logId);
    expect(log!.status).toBe('failed');
  });
});

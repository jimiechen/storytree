/**
 * @file adapters/adapter-router.test.ts
 * @description AdapterRouter 单元测试 — P2-E
 */

import { describe, it, expect } from 'vitest';
import { createAdapterRouter } from './adapter-router';
import { MockExecutionAdapter } from './mock-execution-adapter';
import { OpenCodeExecutionAdapter } from './opencode-execution-adapter';
import { ClaudeCodeExecutionAdapter } from './claudecode-execution-adapter';
import { createChapterGenerateCommand } from '../workflows/novel-command';
import type { AdapterContext, AdapterFeatureGates } from './adapter-types';

function makeCommand() {
  return createChapterGenerateCommand({
    chapterId: 'ch-001',
    projectId: 'proj-001',
    chapterIndex: 1,
    genre: '玄幻',
    text: '测试正文',
    targetWordCount: 800,
  });
}

function makeContext(): AdapterContext {
  return {
    projectId: 'proj-001',
    chapterId: 'ch-001',
    branchId: 'main',
    modelProfileId: 'mock-default',
  };
}

function makeGates(overrides?: Partial<AdapterFeatureGates>): AdapterFeatureGates {
  return {
    realLLMEnabled: false,
    openCodeAdapterEnabled: false,
    claudeCodeAdapterEnabled: false,
    ...overrides,
  };
}

describe('AdapterRouter', () => {
  it('默认未指定 adapter 路由到 mock', () => {
    const router = createAdapterRouter();
    router.register(new MockExecutionAdapter({ delayMultiplier: 0, silent: true }));

    const routed = router.route(undefined, makeCommand(), makeContext(), makeGates());
    expect('name' in routed && routed.name).toBe('mock');
  });

  it('显式请求 mock 返回 mock adapter', () => {
    const router = createAdapterRouter();
    router.register(new MockExecutionAdapter({ delayMultiplier: 0, silent: true }));

    const routed = router.route('mock', makeCommand(), makeContext(), makeGates());
    expect('name' in routed && routed.name).toBe('mock');
  });

  it('显式请求 opencode-stub 且 gate 关闭返回 ADAPTER_DISABLED', () => {
    const router = createAdapterRouter();
    router.register(new MockExecutionAdapter({ delayMultiplier: 0, silent: true }));
    router.register(new OpenCodeExecutionAdapter());

    const routed = router.route('opencode-stub', makeCommand(), makeContext(), makeGates());
    expect('success' in routed && routed.success).toBe(false);
    expect('errorCode' in routed && routed.errorCode).toBe('ADAPTER_DISABLED');
  });

  it('显式请求 claudecode-stub 且 gate 关闭返回 ADAPTER_DISABLED', () => {
    const router = createAdapterRouter();
    router.register(new MockExecutionAdapter({ delayMultiplier: 0, silent: true }));
    router.register(new ClaudeCodeExecutionAdapter());

    const routed = router.route('claudecode-stub', makeCommand(), makeContext(), makeGates());
    expect('success' in routed && routed.success).toBe(false);
    expect('errorCode' in routed && routed.errorCode).toBe('ADAPTER_DISABLED');
  });

  it('显式请求 real-llm 且 gate 关闭返回 ADAPTER_DISABLED', () => {
    const router = createAdapterRouter();
    router.register(new MockExecutionAdapter({ delayMultiplier: 0, silent: true }));

    const routed = router.route('real-llm', makeCommand(), makeContext(), makeGates());
    expect('success' in routed && routed.success).toBe(false);
    expect('errorCode' in routed && routed.errorCode).toBe('ADAPTER_DISABLED');
  });

  it('gate 开启时可返回已注册的 real-llm adapter', () => {
    const router = createAdapterRouter();
    router.register(new MockExecutionAdapter({ delayMultiplier: 0, silent: true }));
    router.register({
      name: 'real-llm',
      canHandle: () => true,
      execute: async () => ({
        success: true,
        result: {} as unknown as import('../types/ai-task').NovelAgentResult,
      }),
    });

    const routed = router.route('real-llm', makeCommand(), makeContext(), makeGates({ realLLMEnabled: true }));
    expect('name' in routed && routed.name).toBe('real-llm');
  });

  it('未注册 adapter 返回 ADAPTER_NOT_FOUND', () => {
    const router = createAdapterRouter();
    const routed = router.route('mock', makeCommand(), makeContext(), makeGates());
    expect('success' in routed && routed.success).toBe(false);
    expect('errorCode' in routed && routed.errorCode).toBe('ADAPTER_NOT_FOUND');
  });

  it('gate 开启时可返回 opencode-stub', () => {
    const router = createAdapterRouter();
    router.register(new MockExecutionAdapter({ delayMultiplier: 0, silent: true }));
    router.register(new OpenCodeExecutionAdapter());

    const routed = router.route(
      'opencode-stub',
      makeCommand(),
      makeContext(),
      makeGates({ openCodeAdapterEnabled: true }),
    );
    expect('name' in routed && routed.name).toBe('opencode-stub');
  });

  it('branchId / worktreeId / modelProfileId / modelRole 可透传到 context', async () => {
    const router = createAdapterRouter();
    router.register(new MockExecutionAdapter({ delayMultiplier: 0, silent: true }));

    const context: AdapterContext = {
      projectId: 'proj-001',
      chapterId: 'ch-001',
      branchId: 'feature-branch',
      worktreeId: 'wt-001',
      modelProfileId: 'model-001',
      modelRole: 'draft',
    };

    const routed = router.route('mock', makeCommand(), context, makeGates());
    expect('name' in routed && routed.name).toBe('mock');
  });

  it('adapter 执行异常返回结构化错误', async () => {
    const router = createAdapterRouter();
    const throwingAdapter = {
      name: 'mock' as const,
      canHandle: () => true,
      execute: async () => {
        throw new Error('模拟执行异常');
      },
    };
    router.register(throwingAdapter);

    const routed = router.route('mock', makeCommand(), makeContext(), makeGates());
    expect('name' in routed && routed.name).toBe('mock');
    await expect(routed.execute(makeCommand(), makeContext())).rejects.toThrow('模拟执行异常');
  });
});

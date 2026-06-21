/**
 * @file chat-debug/novel-debug-llm-runner.test.ts
 * @description Chat Debug 真实 LLM Runner 单元测试 — P3-A
 */

import { describe, it, expect } from 'vitest';
import { runRealLLMInDebug } from './novel-debug-llm-runner';
import { RealLLMExecutionAdapter } from '../adapters/real-llm-adapter';
import { createTargetLLMClient, type LLMTransport } from '../llm/target-llm-client';
import {
  createDefaultRealLLMFeatureGates,
  type RealLLMFeatureGates,
} from '../llm/llm-feature-gates';
import type { NovelCommand } from '../workflows/novel-command';
import type { AdapterContext } from '../adapters/adapter-types';
import type { LLMRequest, LLMResponse } from '../llm/llm-request-types';
import type { LLMStreamEvent } from '../llm/llm-stream-events';
import { createMockTokenStream } from '../llm/target-llm-stream-parser';

function makeCommand(type: NovelCommand['type'] = 'chapter.continue'): NovelCommand {
  return {
    type,
    projectId: 'proj-1',
    chapterId: 'chapter-2',
    selectedText: '他推开门',
    command: 'continue',
  } as NovelCommand;
}

const context: AdapterContext = {
  projectId: 'proj-1',
  chapterId: 'chapter-2',
  branchId: 'main',
  modelProfileId: 'mock-default',
};

function makeAdapter(
  overrides?: { text?: string; gates?: Partial<RealLLMFeatureGates> },
): RealLLMExecutionAdapter {
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

describe('runRealLLMInDebug', () => {
  it('非流式 dryRun 返回成功与参数预览', async () => {
    const result = await runRealLLMInDebug(makeCommand(), context, makeAdapter(), {
      dryRun: true,
    });
    expect(result.success).toBe(true);
    expect(result.message).toContain('dryRun 完成');
    expect(result.result).toBeDefined();
  });

  it('流式 dryRun 返回 llmEvents 与文本', async () => {
    const result = await runRealLLMInDebug(makeCommand(), context, makeAdapter({ text: '流式预览' }), {
      stream: true,
      dryRun: true,
    });
    expect(result.success).toBe(true);
    expect(result.llmEvents).toBeDefined();
    expect(result.llmEvents!.length).toBeGreaterThan(0);
    expect(result.message).toContain('流式预览');
  });

  it('gate 关闭时返回结构化错误', async () => {
    const result = await runRealLLMInDebug(
      makeCommand(),
      context,
      makeAdapter({ gates: { realLLMEnabled: false } }),
      { dryRun: true },
    );
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('REAL_LLM_NOT_ENABLED');
  });

  it('流式 gate 关闭时返回 failed 事件', async () => {
    const result = await runRealLLMInDebug(
      makeCommand(),
      context,
      makeAdapter({ gates: { llmStreamingEnabled: false } }),
      { stream: true, dryRun: true },
    );
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('LLM_STREAMING_DISABLED');
    expect(result.llmEvents).toBeDefined();
  });
});

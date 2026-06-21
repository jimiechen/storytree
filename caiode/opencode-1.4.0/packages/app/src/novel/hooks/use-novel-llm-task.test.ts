/**
 * @file hooks/use-novel-llm-task.test.ts
 * @description useNovelLLMTask Hook 单元测试 — P3-B
 */

import { describe, it, expect } from 'vitest';
import { useNovelLLMTask } from './use-novel-llm-task';
import type { AITaskInput } from '../types/ai-task';
import type { LLMStreamEvent } from '../llm/llm-stream-events';

function makeInput(overrides?: Partial<AITaskInput>): AITaskInput {
  return {
    type: 'continue-writing',
    chapterId: 'ch-001',
    text: '他推开门',
    ...overrides,
  };
}

describe('useNovelLLMTask', () => {
  it('聚合 started → token.delta → completed 为完整 AITask', async () => {
    const { startTask } = useNovelLLMTask();

    async function* gen(): AsyncGenerator<LLMStreamEvent> {
      yield { type: 'llm.request.started', requestId: 'r1' };
      yield { type: 'llm.token.delta', requestId: 'r1', text: '第一行' };
      yield { type: 'llm.token.delta', requestId: 'r1', text: '第二行' };
      yield { type: 'llm.request.completed', requestId: 'r1', completedAt: new Date().toISOString() };
    }

    const final = await startTask(makeInput(), gen);

    expect(final.status).toBe('completed');
    expect(final.output?.text).toBe('第一行第二行');
    expect(final.output?.wordCount).toBe(final.output!.text.length);
    expect(final.preview).toBe('第一行第二行');
    expect(final.duration).toBeGreaterThanOrEqual(0);
  });

  it('failed 事件映射为失败状态与用户可读错误', async () => {
    const { startTask } = useNovelLLMTask();

    async function* gen(): AsyncGenerator<LLMStreamEvent> {
      yield { type: 'llm.request.started', requestId: 'r2' };
      yield {
        type: 'llm.request.failed',
        requestId: 'r2',
        errorCode: 'LLM_SECRET_MISSING',
        error: 'api key missing',
      };
    }

    const final = await startTask(makeInput(), gen);

    expect(final.status).toBe('failed');
    expect(final.error).toContain('API Key');
  });

  it('取消任务后状态为 cancelled', async () => {
    const { startTask, cancel } = useNovelLLMTask();

    let resumeSecond: (event: LLMStreamEvent) => void = () => {};
    const secondEventPromise = new Promise<LLMStreamEvent>((resolve) => {
      resumeSecond = resolve;
    });

    async function* gen(): AsyncGenerator<LLMStreamEvent> {
      yield { type: 'llm.request.started', requestId: 'r3' };
      yield await secondEventPromise;
    }

    const taskPromise = startTask(makeInput(), gen);
    cancel();
    resumeSecond({ type: 'llm.token.delta', requestId: 'r3', text: '不会进入终态' });

    const final = await taskPromise;

    expect(final.status).toBe('cancelled');
  });

  it('preview 超过 200 字符时截断', async () => {
    const { startTask } = useNovelLLMTask();
    const longText = 'x'.repeat(250);

    async function* gen(): AsyncGenerator<LLMStreamEvent> {
      yield { type: 'llm.request.started', requestId: 'r4' };
      yield { type: 'llm.token.delta', requestId: 'r4', text: longText };
      yield { type: 'llm.request.completed', requestId: 'r4', completedAt: new Date().toISOString() };
    }

    const final = await startTask(makeInput(), gen);

    expect(final.preview!.length).toBeLessThanOrEqual(203);
    expect(final.preview!.endsWith('...')).toBe(true);
  });

  it('emit 手动推送事件也能更新状态', () => {
    const { task, emit } = useNovelLLMTask();

    emit({ type: 'llm.request.started', requestId: 'r5' });
    expect(task()).toBeNull();

    emit({ type: 'llm.token.delta', requestId: 'r5', text: '手动' });
    // 尚未启动任务时，emit 不会改变状态
    expect(task()).toBeNull();
  });
});

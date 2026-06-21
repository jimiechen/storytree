/**
 * @file hooks/use-novel-workflow.test.ts
 * @description useNovelWorkflow Hook 单元测试 — P3-B
 *
 * 通过注入 fake NovelWorkflowEngine，验证：
 * - 流式任务状态聚合（streamingTask）
 * - 取消任务产生 cancelled 结果
 * - 重试使用上次 input 重新 dispatch
 */

import { describe, it, expect } from 'vitest';
import { useNovelWorkflow } from './use-novel-workflow';
import type { NovelWorkflowEngine } from '../workflows/engine/workflow-engine';
import type { WorkflowDefinition, WorkflowStepResult } from '../workflows/engine/workflow-definition-types';
import type { NovelCommand } from '../workflows/novel-command';
import type { NovelAgentResult } from '../types/ai-task';
import type { LLMStreamEvent } from '../llm/llm-stream-events';
import type { WorkflowMutations } from '../workflows/workflow-events';

function makeFakeEngine(stepResults: WorkflowStepResult[]): NovelWorkflowEngine {
  return {
    async load(): Promise<WorkflowDefinition> {
      return {
        id: 'chapter.continue',
        version: 2,
        commandType: 'chapter.continue',
        description: 'fake',
        steps: [],
      };
    },
    async* execute(): AsyncGenerator<WorkflowStepResult> {
      for (const step of stepResults) {
        yield step;
      }
    },
  };
}

function makeGenerationResult(text: string, events?: LLMStreamEvent[]): WorkflowStepResult {
  const result: NovelAgentResult = {
    taskId: 'task-1',
    attemptId: 1,
    status: 'completed',
    text,
    wordCount: text.length,
    summary: '',
    durationMs: 100,
  };
  return {
    stepId: 'agent-run-continue',
    status: 'completed',
    output: { result, events: events ?? [], durationMs: 100 },
  };
}

function makeMutations(): WorkflowMutations {
  return {
    updateChapterContent: () => {},
    updateChapterSummary: () => {},
    updateChapterWordCount: () => {},
    updateChapterExtractedInfo: () => {},
    updateChapterInfoState: () => {},
    addAchievementProgress: () => {},
    updateProfileStats: () => {},
    emitCharacterUpdated: () => {},
    emitWorldReferenced: () => {},
  };
}

describe('useNovelWorkflow', () => {
  it('streamingTask 初始为 null', () => {
    const workflow = useNovelWorkflow(makeMutations());
    expect(workflow.streamingTask()).toBeNull();
  });

  it('runAIWritingCommand continue 把 LLMStreamEvent 聚合成 AITask', async () => {
    const events: LLMStreamEvent[] = [
      { type: 'llm.request.started', requestId: 'r1' },
      { type: 'llm.token.delta', requestId: 'r1', text: '续写第一行' },
      { type: 'llm.token.delta', requestId: 'r1', text: '续写第二行' },
      { type: 'llm.request.completed', requestId: 'r1', completedAt: new Date().toISOString() },
    ];
    const engine = makeFakeEngine([makeGenerationResult('续写第一行续写第二行', events)]);
    const workflow = useNovelWorkflow(makeMutations(), engine);

    const result = await workflow.runAIWritingCommand({
      chapterId: 'ch-1',
      projectId: 'proj-1',
      chapterIndex: 1,
      genre: '玄幻',
      command: 'continue',
      text: '他推开门',
      selectedText: '他推开门',
      targetWordCount: 800,
    });

    expect(result.status).toBe('completed');
    const streaming = workflow.streamingTask();
    expect(streaming).not.toBeNull();
    expect(streaming!.status).toBe('completed');
    expect(streaming!.output?.text).toBe('续写第一行续写第二行');
    expect(streaming!.preview).toBe('续写第一行续写第二行');
  });

  it('cancelCurrentTask 产出 cancelled 结果', async () => {
    const engine = makeFakeEngine([makeGenerationResult('续写结果')]);
    const workflow = useNovelWorkflow(makeMutations(), engine);

    await workflow.runAIWritingCommand({
      chapterId: 'ch-1',
      projectId: 'proj-1',
      chapterIndex: 1,
      genre: '玄幻',
      command: 'continue',
      text: '他推开门',
    });

    const cancelled = workflow.cancelCurrentTask();
    expect(cancelled).not.toBeNull();
    expect(cancelled!.status).toBe('cancelled');
    expect(cancelled!.error).toBe('用户取消操作');
    expect(workflow.isRunning()).toBe(false);
  });

  it('retryLastCommand 使用上次 input 重新执行', async () => {
    let callCount = 0;
    const engine: NovelWorkflowEngine = {
      async load(): Promise<WorkflowDefinition> {
        return {
          id: 'chapter.continue',
          version: 2,
          commandType: 'chapter.continue',
          description: 'fake',
          steps: [],
        };
      },
      async* execute(command: NovelCommand): AsyncGenerator<WorkflowStepResult> {
        callCount++;
        const result: NovelAgentResult = {
          taskId: `${command.type}:${command.chapterId}`,
          attemptId: callCount,
          status: 'completed',
          text: `result-${callCount}`,
          wordCount: 8,
          summary: '',
          durationMs: 10,
        };
        yield {
          stepId: 'agent-run-continue',
          status: 'completed',
          output: { result, events: [], durationMs: 10 },
        };
      },
    };

    const workflow = useNovelWorkflow(makeMutations(), engine);

    await workflow.runAIWritingCommand({
      chapterId: 'ch-1',
      projectId: 'proj-1',
      chapterIndex: 1,
      genre: '玄幻',
      command: 'continue',
      text: '他推开门',
    });
    expect(callCount).toBe(1);

    const retried = await workflow.retryLastCommand();
    expect(callCount).toBe(2);
    expect(retried).not.toBeNull();
    expect(retried!.text).toBe('result-2');
    expect(retried!.attemptId).toBe(2);
  });

  it('无上次任务时 retryLastCommand 返回 null', async () => {
    const workflow = useNovelWorkflow(makeMutations());
    const retried = await workflow.retryLastCommand();
    expect(retried).toBeNull();
  });
});

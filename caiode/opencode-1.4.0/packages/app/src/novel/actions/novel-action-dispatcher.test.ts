/**
 * @file actions/novel-action-dispatcher.test.ts
 * @description NovelActionDispatcher 单元测试 — P2-D
 *
 * 测试目标：
 * 1. chapter.generate / chapter.continue 能正确生成 NovelCommand 并调用 YAML Engine。
 * 2. info.extract 能调用 YAML Engine 并返回 state / score / events。
 * 3. 透传字段（branchId / modelProfileId）能进入 Engine。
 * 4. Engine 失败时返回结构化错误，不抛异常。
 * 5. 未支持 action 返回 NOT_SUPPORTED_ACTION。
 */

import { describe, it, expect } from 'bun:test';
import { createNovelActionDispatcher } from './novel-action-dispatcher';
import type { NovelActionInput, NovelActionResult } from './novel-action-types';
import type { NovelWorkflowEngine } from '../workflows/engine/workflow-engine';
import type { WorkflowStepResult } from '../workflows/engine/workflow-definition-types';
import { normalizeNovelCommand } from '../workflows/engine/workflow-command-normalizer';
import { resolveWorkflowId } from '../workflows/engine/workflow-resolver';

// 构造一个可按指令响应的 Fake Engine
function createFakeEngine(
  responses: Record<string, { output: unknown; fail?: boolean; error?: string }>,
): NovelWorkflowEngine {
  return {
    async load() {
      throw new Error('not used');
    },
    async* execute(command) {
      // 与真实 WorkflowEngine 保持一致：用归一化后的 workflowId 定位响应
      const workflowId = resolveWorkflowId(normalizeNovelCommand(command));
      yield { stepId: 'mock-wrapper', status: 'started' };

      const response = responses[workflowId];
      if (!response) {
        yield { stepId: 'mock-wrapper', status: 'failed', error: 'WORKFLOW_NOT_FOUND' };
        return;
      }

      if (response.fail) {
        yield { stepId: 'mock-wrapper', status: 'failed', error: response.error ?? 'FAILED' };
        return;
      }

      yield { stepId: 'mock-wrapper', status: 'completed', output: response.output };
      yield { stepId: 'workflow-completed', status: 'completed', output: response.output };
    },
  };
}

describe('NovelActionDispatcher', () => {
  it('should dispatch chapter.generate and return NovelAgentResult', async () => {
    const fakeResult = { taskId: 'task-1', attemptId: 1, status: 'completed', text: 'generated', wordCount: 100, summary: 'summary', durationMs: 10 };
    const fakeEvents = [{ type: 'chapter.generated', chapterId: 'ch-1', projectId: 'proj-1', content: 'generated', wordCount: 100, summary: 'summary' }];
    const engine = createFakeEngine({
      'chapter.generate': { output: { result: fakeResult, events: fakeEvents, durationMs: 10 } },
    });

    const mutations = { applied: [] as string[] };
    const mockMutations = {
      updateChapterContent: async (chapterId: string, content: string) => { mutations.applied.push(`content:${chapterId}:${content.length}`); },
      updateChapterSummary: async () => {},
      updateChapterWordCount: async () => {},
      updateChapterInfoState: async () => {},
      updateChapterExtractedInfo: async () => {},
      updateCharacterAppearance: async () => {},
      incrementWorldReference: async () => {},
      addAchievementProgress: async () => {},
      updateProfileStats: async () => {},
      logDiscardedTask: async () => {},
    };

    const dispatcher = createNovelActionDispatcher({ engine, mutations: mockMutations });
    const result = await dispatcher.dispatch({
      type: 'chapter.generate',
      projectId: 'proj-1',
      chapterId: 'ch-1',
      payload: { chapterIndex: 0, genre: '玄幻', text: '开头', targetWordCount: 100 },
    });

    expect(result.success).toBe(true);
    expect(result.actionType).toBe('chapter.generate');
    expect(result.workflowId).toBe('chapter.generate');
    expect(result.result).toEqual(fakeResult);
    expect(mutations.applied.length).toBeGreaterThan(0);
  });

  it('should dispatch chapter.continue with rewrite command mapped to continue workflow', async () => {
    const fakeResult = { taskId: 'task-2', attemptId: 1, status: 'completed', text: 'continued', wordCount: 50, summary: 'summary', durationMs: 10 };
    const engine = createFakeEngine({
      'chapter.continue': { output: { result: fakeResult, events: [], durationMs: 10 } },
    });

    const dispatcher = createNovelActionDispatcher({ engine });
    const result = await dispatcher.dispatch({
      type: 'chapter.continue',
      projectId: 'proj-1',
      chapterId: 'ch-1',
      payload: { chapterIndex: 0, genre: '玄幻', text: '已有正文', selectedText: '选中', targetWordCount: 50 },
    });

    expect(result.success).toBe(true);
    expect(result.workflowId).toBe('chapter.continue');
    expect(result.result).toEqual(fakeResult);
  });

  it('should dispatch info.extract and return state/score/events', async () => {
    const fakeState = {
      projectId: 'proj-1',
      chapterId: 'ch-1',
      atoms: [],
      links: [],
      entropyBefore: 1,
      entropyAfter: 2,
      entropyDelta: 1,
      selfInformationTotal: 0,
      mutualInformationWithContext: 0,
      conditionalEntropyAfter: 0,
      densityScore: 0.5,
      redundancyScore: 0.1,
      suspenseScore: 0.5,
      progressionScore: 0.5,
      warnings: [],
    };
    const fakeScore = { auditScore: 80 };
    const fakeEvents = [{ type: 'info.theory.calculated', chapterId: 'ch-1', projectId: 'proj-1', score: fakeScore, state: fakeState }];
    const engine = createFakeEngine({
      'info.extract': { output: { state: fakeState, score: fakeScore, events: fakeEvents } },
    });

    const dispatcher = createNovelActionDispatcher({ engine });
    const result = await dispatcher.dispatch({
      type: 'info.extract',
      projectId: 'proj-1',
      chapterId: 'ch-1',
      payload: { text: '测试正文' },
    });

    expect(result.success).toBe(true);
    expect(result.actionType).toBe('info.extract');
    expect(result.workflowId).toBe('info.extract');
    expect((result.result as { state: unknown }).state).toEqual(fakeState);
    expect((result.result as { score: unknown }).score).toEqual(fakeScore);
    expect(result.events).toEqual(fakeEvents);
  });

  it('should pass through branchId and modelProfileId', async () => {
    let capturedCommand: unknown;
    const engine: NovelWorkflowEngine = {
      async load() { throw new Error('not used'); },
      async* execute(command) {
        capturedCommand = command;
        yield { stepId: 'mock-wrapper', status: 'started' };
        yield { stepId: 'mock-wrapper', status: 'completed', output: { result: {}, events: [] } };
      },
    };

    const dispatcher = createNovelActionDispatcher({ engine });
    await dispatcher.dispatch({
      type: 'chapter.generate',
      workspaceId: 'ws-1',
      projectId: 'proj-1',
      chapterId: 'ch-1',
      branchId: 'branch-a',
      worktreeId: 'wt-1',
      modelProfileId: 'model-x',
      skillId: 'skill-y',
      payload: { chapterIndex: 0, genre: '玄幻', text: '开头' },
    });

    const cmd = capturedCommand as { branchId?: string; worktreeId?: string; modelProfileId?: string; skillId?: string; workspaceId?: string };
    expect(cmd.branchId).toBe('branch-a');
    expect(cmd.worktreeId).toBe('wt-1');
    expect(cmd.modelProfileId).toBe('model-x');
    expect(cmd.skillId).toBe('skill-y');
    expect(cmd.workspaceId).toBe('ws-1');
  });

  it('should return structured error when workflow fails', async () => {
    const engine = createFakeEngine({
      'chapter.generate': { output: {}, fail: true, error: 'MOCK_FAIL' },
    });

    const dispatcher = createNovelActionDispatcher({ engine });
    const result = await dispatcher.dispatch({
      type: 'chapter.generate',
      projectId: 'proj-1',
      chapterId: 'ch-1',
      payload: { text: '开头' },
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('WORKFLOW_EXECUTION_FAILED');
    expect(result.error).toBe('MOCK_FAIL');
  });

  it('should return NOT_SUPPORTED_ACTION for unbound CRUD actions', async () => {
    const dispatcher = createNovelActionDispatcher();
    const result = await dispatcher.dispatch({
      type: 'draft.save',
      projectId: 'proj-1',
      chapterId: 'ch-1',
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('NOT_SUPPORTED_ACTION');
  });

  it('should not throw when engine throws', async () => {
    const engine: NovelWorkflowEngine = {
      async load() { throw new Error('not used'); },
      async* execute() {
        throw new Error('ENGINE_EXPLODED');
      },
    };

    const dispatcher = createNovelActionDispatcher({ engine });
    const result = await dispatcher.dispatch({
      type: 'chapter.generate',
      projectId: 'proj-1',
      chapterId: 'ch-1',
      payload: { text: '开头' },
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('DISPATCHER_ERROR');
    expect(result.error).toContain('ENGINE_EXPLODED');
  });
});

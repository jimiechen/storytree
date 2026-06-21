/**
 * @file hooks/use-novel-action-dispatcher.test.ts
 * @description useNovelActionDispatcher 单元测试 — P2-D
 *
 * 测试目标：
 * 1. Hook 默认能创建 NovelActionDispatcher。
 * 2. 可注入 Fake Engine 控制执行结果。
 * 3. dispatch 返回结构化 NovelActionResult，错误不会抛到组件层。
 */

import { describe, it, expect } from 'bun:test';
import { useNovelActionDispatcher } from './use-novel-action-dispatcher';
import type { NovelWorkflowEngine } from '../workflows/engine/workflow-engine';
import type { WorkflowStepResult } from '../workflows/engine/workflow-definition-types';
import type { WorkflowMutations } from '../workflows/workflow-events';

function createFakeEngine(output: unknown): NovelWorkflowEngine {
  return {
    async load() {
      throw new Error('not used');
    },
    async* execute() {
      yield { stepId: 'mock', status: 'started' } as WorkflowStepResult;
      yield { stepId: 'mock', status: 'completed', output } as WorkflowStepResult;
      yield { stepId: 'workflow-completed', status: 'completed', output } as WorkflowStepResult;
    },
  };
}

function createMockMutations(): WorkflowMutations {
  return {
    updateChapterContent: async () => {},
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
}

describe('useNovelActionDispatcher', () => {
  it('应默认创建 dispatcher 并提供 dispatch 方法', () => {
    const { dispatcher, dispatch } = useNovelActionDispatcher({ mutations: createMockMutations() });

    expect(dispatcher).toBeDefined();
    expect(typeof dispatch).toBe('function');
  });

  it('注入 Fake Engine 后应返回结构化结果', async () => {
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
    const fakeScore = { auditScore: 0.8 };
    const engine = createFakeEngine({ state: fakeState, score: fakeScore, events: [] });

    const { dispatch } = useNovelActionDispatcher({ mutations: createMockMutations(), engine });
    const result = await dispatch({
      type: 'info.extract',
      projectId: 'proj-1',
      chapterId: 'ch-1',
      payload: { text: '测试正文' },
    });

    expect(result.success).toBe(true);
    expect(result.actionType).toBe('info.extract');
    expect(result.workflowId).toBe('info.extract');
  });

  it('Engine 失败时应返回结构化错误而不是抛异常', async () => {
    const engine: NovelWorkflowEngine = {
      async load() {
        throw new Error('not used');
      },
      async* execute() {
        yield { stepId: 'mock', status: 'started' } as WorkflowStepResult;
        yield { stepId: 'mock', status: 'failed', error: 'MOCK_FAIL' } as WorkflowStepResult;
      },
    };

    const { dispatch } = useNovelActionDispatcher({ mutations: createMockMutations(), engine });
    const result = await dispatch({
      type: 'chapter.generate',
      projectId: 'proj-1',
      chapterId: 'ch-1',
      payload: { text: '开头' },
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('WORKFLOW_EXECUTION_FAILED');
  });
});

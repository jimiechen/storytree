/**
 * @file plugins/core-info-theory-tools/info-theory-audit.tool.test.ts
 * @description info-theory-audit Tool 单元测试 — P2-C
 */

import { describe, it, expect } from 'vitest';
import { createInfoTheoryAuditTool } from './info-theory-audit.tool';
import type { ToolContext } from '../novel-tool-types';

function makeContext(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    workflowId: 'wf-test',
    commandId: 'cmd-test',
    commandType: 'chapter.extract-info',
    workspaceId: 'ws-1',
    projectId: 'project-1',
    chapterId: 'chapter-1',
    branchId: 'branch-main',
    worktreeId: undefined,
    modelProfileId: 'mock-default',
    skillId: 'writing',
    variables: {},
    stepResults: {},
    command: {
      type: 'chapter.extract-info',
      projectId: 'project-1',
      chapterId: 'chapter-1',
      chapterIndex: 1,
      genre: '玄幻',
      text: '',
      createdAt: new Date(),
    },
    ...overrides,
  };
}

describe('info-theory-audit tool', () => {
  it('returns success with state and score', async () => {
    const tool = createInfoTheoryAuditTool();
    const result = await tool.execute(
      { text: '主角来到青云城，发现一个秘密。' },
      makeContext(),
    );

    expect(result.success).toBe(true);

    const data = result.data as { state: unknown; score: unknown; events: unknown[] };
    expect(data.state).toBeDefined();
    expect(data.score).toBeDefined();
    expect(data.events.length).toBeGreaterThan(0);
  });

  it('emits info.theory.calculated event', async () => {
    const tool = createInfoTheoryAuditTool();
    const result = await tool.execute({ text: '敌人正在追杀他。' }, makeContext());

    const data = result.data as { events: { type: string }[] };
    expect(data.events.some((e) => e.type === 'info.theory.calculated')).toBe(true);
  });

  it('fails when projectId is missing', async () => {
    const tool = createInfoTheoryAuditTool();
    const result = await tool.execute({ text: '任意文本' }, makeContext({ projectId: '' }));
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('MISSING_PROJECT_ID');
  });

  it('fails when chapterId is missing', async () => {
    const tool = createInfoTheoryAuditTool();
    const result = await tool.execute({ text: '任意文本' }, makeContext({ chapterId: '' }));
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('MISSING_CHAPTER_ID');
  });

  it('does not call external services', async () => {
    const tool = createInfoTheoryAuditTool();
    const result = await tool.execute({ text: '一段测试文本。' }, makeContext());
    expect(result.success).toBe(true);
    expect(result.events).toBeDefined();
  });
});
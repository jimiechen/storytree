/**
 * @file workflows/engine/workflow-command-normalizer.test.ts
 * @description Command Normalizer 单元测试 — P2-A
 */

import { describe, it, expect } from 'vitest';
import { normalizeNovelCommand } from './workflow-command-normalizer';
import type { NovelCommand } from '../novel-command';

function makeCommand(overrides: Partial<NovelCommand> = {}): NovelCommand {
  return {
    type: 'chapter.generate',
    projectId: 'project-1',
    chapterId: 'chapter-1',
    chapterIndex: 1,
    genre: '玄幻',
    text: '',
    targetWordCount: 3000,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('normalizeNovelCommand', () => {
  it('preserves projectId and chapterId', () => {
    const normalized = normalizeNovelCommand(makeCommand());
    expect(normalized.projectId).toBe('project-1');
    expect(normalized.chapterId).toBe('chapter-1');
  });

  it('defaults branchId to main', () => {
    const normalized = normalizeNovelCommand(makeCommand());
    expect(normalized.branchId).toBe('main');
  });

  it('defaults modelProfileId to mock-default', () => {
    const normalized = normalizeNovelCommand(makeCommand());
    expect(normalized.modelProfileId).toBe('mock-default');
  });

  it('infers workflowId for chapter.generate', () => {
    const normalized = normalizeNovelCommand(makeCommand({ type: 'chapter.generate' }));
    expect(normalized.workflowId).toBe('chapter.generate');
    expect(normalized.skillId).toBe('writing');
  });

  it('infers workflowId for chapter.rewrite as chapter.continue', () => {
    const normalized = normalizeNovelCommand(
      makeCommand({ type: 'chapter.rewrite', command: 'continue' }),
    );
    expect(normalized.workflowId).toBe('chapter.continue');
    expect(normalized.skillId).toBe('writing');
  });

  it('infers workflowId for chapter.extract-info', () => {
    const normalized = normalizeNovelCommand(
      makeCommand({ type: 'chapter.extract-info' }),
    );
    expect(normalized.workflowId).toBe('info.extract');
    expect(normalized.skillId).toBe('info-theory');
  });

  it('preserves explicit workspace, branch, model, skill and workflow ids', () => {
    const normalized = normalizeNovelCommand({
      ...makeCommand(),
      workspaceId: 'ws-1',
      branchId: 'branch-romance',
      worktreeId: 'wt-1',
      modelProfileId: 'model-gpt',
      skillId: 'custom-skill',
      workflowId: 'custom.workflow',
    } as NovelCommand);

    expect(normalized.workspaceId).toBe('ws-1');
    expect(normalized.branchId).toBe('branch-romance');
    expect(normalized.worktreeId).toBe('wt-1');
    expect(normalized.modelProfileId).toBe('model-gpt');
    expect(normalized.skillId).toBe('custom-skill');
    expect(normalized.workflowId).toBe('custom.workflow');
  });

  it('puts original fields into payload', () => {
    const normalized = normalizeNovelCommand(
      makeCommand({ selectedText: '他推开门', command: 'continue' }),
    );
    expect(normalized.payload.chapterIndex).toBe(1);
    expect(normalized.payload.genre).toBe('玄幻');
    expect(normalized.payload.targetWordCount).toBe(3000);
    expect(normalized.payload.selectedText).toBe('他推开门');
    expect(normalized.payload.command).toBe('continue');
  });
});

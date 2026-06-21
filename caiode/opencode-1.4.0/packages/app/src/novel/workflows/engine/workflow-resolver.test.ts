/**
 * @file workflows/engine/workflow-resolver.test.ts
 * @description Workflow Resolver 单元测试 — P2-A
 */

import { describe, it, expect } from 'vitest';
import { resolveWorkflowId, getBuiltinWorkflowPath } from './workflow-resolver';
import { normalizeNovelCommand } from './workflow-command-normalizer';
import { WorkflowResolveError } from './workflow-engine-errors';
import type { NovelCommand } from '../novel-command';

function makeCommand(type: NovelCommand['type']): NovelCommand {
  return {
    type,
    projectId: 'project-1',
    chapterId: 'chapter-1',
    chapterIndex: 1,
    genre: '玄幻',
    text: '',
    createdAt: new Date(),
  };
}

describe('WorkflowResolver', () => {
  it('prefers explicit workflowId', () => {
    const command = normalizeNovelCommand({
      ...makeCommand('chapter.generate'),
      workflowId: 'custom.workflow',
    } as NovelCommand);
    expect(resolveWorkflowId(command)).toBe('custom.workflow');
  });

  it('maps chapter.generate', () => {
    const command = normalizeNovelCommand(makeCommand('chapter.generate'));
    expect(resolveWorkflowId(command)).toBe('chapter.generate');
  });

  it('maps chapter.rewrite to chapter.continue', () => {
    const command = normalizeNovelCommand(makeCommand('chapter.rewrite'));
    expect(resolveWorkflowId(command)).toBe('chapter.continue');
  });

  it('maps chapter.expand to chapter.continue', () => {
    const command = normalizeNovelCommand(makeCommand('chapter.expand'));
    expect(resolveWorkflowId(command)).toBe('chapter.continue');
  });

  it('maps info.extract', () => {
    const command = normalizeNovelCommand(makeCommand('chapter.extract-info'));
    expect(resolveWorkflowId(command)).toBe('info.extract');
  });

  it('throws WorkflowResolveError for unknown command type', () => {
    const command = normalizeNovelCommand(makeCommand('chapter.generate'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hacked = { ...command, type: 'unknown.command' as any, workflowId: undefined };
    expect(() => resolveWorkflowId(hacked)).toThrow(WorkflowResolveError);
  });

  it('returns a path ending with workflowId.yaml', () => {
    const path = getBuiltinWorkflowPath('chapter.generate');
    expect(path.endsWith('chapter.generate.yaml')).toBe(true);
  });
});

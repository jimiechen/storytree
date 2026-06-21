/**
 * @file plugins/builtin-novel-tools.test.ts
 * @description 内置 Novel Tools 单元测试 — P2-B
 */

import { describe, it, expect } from 'vitest';
import { createBuiltinNovelToolRegistry } from './builtin-novel-tools';
import { MockAgentAdapter } from '../adapters/mock-agent-adapter';
import type { ToolContext } from './novel-tool-types';

const testAdapter = new MockAgentAdapter({ delayMultiplier: 0, silent: true });

function makeContext(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    workflowId: 'wf-test',
    commandId: 'cmd-test',
    commandType: 'chapter.generate',
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
      type: 'chapter.generate',
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

describe('createBuiltinNovelToolRegistry', () => {
  it('contains mock-generation-wrapper', () => {
    const registry = createBuiltinNovelToolRegistry(testAdapter);
    expect(registry.has('mock-generation-wrapper')).toBe(true);
  });

  it('contains not-implemented', () => {
    const registry = createBuiltinNovelToolRegistry(testAdapter);
    expect(registry.has('not-implemented')).toBe(true);
  });

  it('contains context-assemble', () => {
    const registry = createBuiltinNovelToolRegistry(testAdapter);
    expect(registry.has('context-assemble')).toBe(true);
  });

  it('contains build-workflow-events', () => {
    const registry = createBuiltinNovelToolRegistry(testAdapter);
    expect(registry.has('build-workflow-events')).toBe(true);
  });

  it('contains info-theory-audit', () => {
    const registry = createBuiltinNovelToolRegistry(testAdapter);
    expect(registry.has('info-theory-audit')).toBe(true);
  });

  it('not-implemented returns NOT_IMPLEMENTED and success=false', async () => {
    const registry = createBuiltinNovelToolRegistry(testAdapter);
    const result = await registry.execute('not-implemented', {}, makeContext());
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('NOT_IMPLEMENTED');
  });

  it('context-assemble returns project / chapter / branch / model fields', async () => {
    const registry = createBuiltinNovelToolRegistry(testAdapter);
    const result = await registry.execute('context-assemble', { extra: true }, makeContext());
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      projectId: 'project-1',
      chapterId: 'chapter-1',
      branchId: 'branch-main',
      modelProfileId: 'mock-default',
      commandType: 'chapter.generate',
      input: { extra: true },
    });
  });

  it('mock-generation-wrapper returns result / events / durationMs', async () => {
    const registry = createBuiltinNovelToolRegistry(testAdapter);
    const result = await registry.execute('mock-generation-wrapper', {}, makeContext());
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('result');
    expect(result.data).toHaveProperty('events');
    expect(result.data).toHaveProperty('durationMs');
  });

  it('build-workflow-events passes through events or returns empty array', async () => {
    const registry = createBuiltinNovelToolRegistry(testAdapter);
    const withEvents = await registry.execute(
      'build-workflow-events',
      { events: [{ type: 'test' }] },
      makeContext(),
    );
    expect(withEvents.success).toBe(true);
    expect((withEvents.data as { events: unknown[] }).events).toHaveLength(1);

    const empty = await registry.execute('build-workflow-events', {}, makeContext());
    expect(empty.success).toBe(true);
    expect((empty.data as { events: unknown[] }).events).toHaveLength(0);
  });

  it('info-theory-audit returns structured error when projectId is missing', async () => {
    const registry = createBuiltinNovelToolRegistry(testAdapter);
    const context = makeContext({ projectId: '', chapterId: 'chapter-1' });
    const result = await registry.execute('info-theory-audit', { text: '任意文本' }, context);
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('MISSING_PROJECT_ID');
  });

  it('info-theory-audit returns structured error when chapterId is missing', async () => {
    const registry = createBuiltinNovelToolRegistry(testAdapter);
    const context = makeContext({ projectId: 'project-1', chapterId: '' });
    const result = await registry.execute('info-theory-audit', { text: '任意文本' }, context);
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('MISSING_CHAPTER_ID');
  });

  it('info-theory-audit returns state, score and info.theory.calculated event', async () => {
    const registry = createBuiltinNovelToolRegistry(testAdapter);
    const result = await registry.execute(
      'info-theory-audit',
      { text: '主角来到青云城，发现一个秘密。敌人正在追杀他。' },
      makeContext(),
    );
    expect(result.success).toBe(true);

    const data = result.data as { state: unknown; score: unknown; events: unknown[] };
    expect(data.state).toBeDefined();
    expect(data.score).toBeDefined();
    expect(data.events).toBeDefined();
    expect(data.events.some((e) => (e as { type: string }).type === 'info.theory.calculated')).toBe(
      true,
    );
  });

  it('info-theory-audit returns warnings for empty text', async () => {
    const registry = createBuiltinNovelToolRegistry(testAdapter);
    const result = await registry.execute('info-theory-audit', { text: '' }, makeContext());
    expect(result.success).toBe(true);

    const data = result.data as { state: { warnings: unknown[] } };
    expect(data.state.warnings.length).toBeGreaterThan(0);
  });
});

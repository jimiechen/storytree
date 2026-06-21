/**
 * @file plugins/novel-tool-registry.test.ts
 * @description Novel Tool Registry 单元测试 — P2-B
 */

import { describe, it, expect } from 'vitest';
import { createNovelToolRegistry, NovelToolRegistryError } from './novel-tool-registry';
import type { NovelTool, ToolContext } from './novel-tool-types';

const dummyContext: ToolContext = {
  workflowId: 'wf-test',
  commandId: 'cmd-test',
  commandType: 'chapter.generate',
  projectId: 'project-1',
  chapterId: 'chapter-1',
  variables: {},
  stepResults: {},
  command: {
    type: 'chapter.generate',
    projectId: 'project-1',
    chapterId: 'chapter-1',
    chapterIndex: 0,
    genre: '玄幻',
    text: '',
    createdAt: new Date(),
  },
};

const successTool: NovelTool = {
  name: 'success-tool',
  description: 'Always succeeds',
  async execute(input: unknown) {
    return { success: true, data: { received: input } };
  },
};

const failTool: NovelTool = {
  name: 'fail-tool',
  description: 'Always fails',
  async execute() {
    return { success: false, errorCode: 'EXPECTED_FAILURE', error: 'failed on purpose' };
  },
};

const throwTool: NovelTool = {
  name: 'throw-tool',
  description: 'Throws synchronously',
  async execute() {
    throw new Error('boom');
  },
};

describe('NovelToolRegistry', () => {
  it('registers and retrieves a tool', () => {
    const registry = createNovelToolRegistry();
    registry.register(successTool);
    expect(registry.has('success-tool')).toBe(true);
    expect(registry.get('success-tool')).toBe(successTool);
  });

  it('lists registered tools', () => {
    const registry = createNovelToolRegistry();
    registry.register(successTool);
    registry.register(failTool);
    expect(registry.list().map((t) => t.name)).toEqual(['success-tool', 'fail-tool']);
  });

  it('executes a registered tool', async () => {
    const registry = createNovelToolRegistry();
    registry.register(successTool);
    const result = await registry.execute('success-tool', { x: 1 }, dummyContext);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ received: { x: 1 } });
  });

  it('returns TOOL_NOT_FOUND for unknown tool', async () => {
    const registry = createNovelToolRegistry();
    const result = await registry.execute('missing', {}, dummyContext);
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('TOOL_NOT_FOUND');
  });

  it('returns TOOL_EXECUTION_FAILED when tool throws', async () => {
    const registry = createNovelToolRegistry();
    registry.register(throwTool);
    const result = await registry.execute('throw-tool', {}, dummyContext);
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('TOOL_EXECUTION_FAILED');
    expect(result.error).toBe('boom');
  });

  it('throws on duplicate registration', () => {
    const registry = createNovelToolRegistry();
    registry.register(successTool);
    expect(() => registry.register(successTool)).toThrow(NovelToolRegistryError);
  });
});

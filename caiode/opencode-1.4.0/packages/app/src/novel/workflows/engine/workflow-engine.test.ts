/**
 * @file workflows/engine/workflow-engine.test.ts
 * @description Workspace-aware YAML Workflow Engine 单元测试 — P2-B
 */

import { describe, it, expect } from 'vitest';
import { createNovelWorkflowEngine } from './workflow-engine';
import { MockAgentAdapter } from '../../adapters/mock-agent-adapter';
import { WorkflowExecutionError } from './workflow-engine-errors';
import { createNovelToolRegistry } from '../../plugins/novel-tool-registry';
import type { NovelTool, NovelToolRegistry, ToolContext, ToolResult } from '../../plugins/novel-tool-types';
import type { NovelCommand } from '../novel-command';

const testAdapter = new MockAgentAdapter({ delayMultiplier: 0, silent: true });

function makeCommand(type: NovelCommand['type'], overrides: Partial<NovelCommand> = {}): NovelCommand {
  return {
    type,
    projectId: 'project-1',
    chapterId: 'chapter-1',
    chapterIndex: 1,
    genre: '玄幻',
    text: '',
    createdAt: new Date(),
    ...overrides,
  };
}

describe('NovelWorkflowEngine', () => {
  it('loads a workflow by id', async () => {
    const engine = createNovelWorkflowEngine({ adapter: testAdapter });
    const def = await engine.load('chapter.generate');
    expect(def.id).toBe('chapter.generate');
  });

  it('executes chapter.generate through YAML and yields started/completed', async () => {
    const engine = createNovelWorkflowEngine({ adapter: testAdapter });
    const results = [];

    for await (const result of engine.execute(makeCommand('chapter.generate'))) {
      results.push(result);
    }

    const started = results.find((r) => r.status === 'started');
    const completed = results.find((r) => r.status === 'completed' && r.stepId === 'mock-wrapper');
    expect(started).toBeDefined();
    expect(completed).toBeDefined();
    expect(completed!.output).toBeDefined();
  });

  it('executes chapter.continue through YAML', async () => {
    const engine = createNovelWorkflowEngine({ adapter: testAdapter });
    const results = [];

    for await (const result of engine.execute(
      makeCommand('chapter.rewrite', { command: 'continue', text: '他推开门' }),
    )) {
      results.push(result);
    }

    const completed = results.find((r) => r.status === 'completed' && r.stepId === 'agent-run-continue');
    expect(completed).toBeDefined();
  });

  it('executes info.extract through YAML and returns state/score/events', async () => {
    const engine = createNovelWorkflowEngine({ adapter: testAdapter });
    const results = [];

    for await (const result of engine.execute(
      makeCommand('chapter.extract-info', {
        text: '主角来到青云城，发现一个秘密。敌人正在追杀他。',
      }),
    )) {
      results.push(result);
    }

    const completed = results.find(
      (r) => r.status === 'completed' && r.stepId === 'info-theory-audit',
    );
    expect(completed).toBeDefined();
    expect(completed!.output).toBeDefined();

    const output = completed!.output as { state: unknown; score: unknown; events: unknown[] };
    expect(output.state).toBeDefined();
    expect(output.score).toBeDefined();
    expect(output.events).toBeDefined();
    expect(output.events.some((e) => (e as { type: string }).type === 'info.theory.calculated')).toBe(
      true,
    );
  });

  it('returns NOT_IMPLEMENTED for custom workflow using not-implemented tool', async () => {
    const engine = createNovelWorkflowEngine({ adapter: testAdapter });
    const def = await engine.load('info.extract');
    def.steps[0].tool = 'not-implemented';

    await expect(
      (async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _ of engine.execute(
          makeCommand('chapter.extract-info', { text: '任意文本' }),
          def,
        )) {
          // consume
        }
      })(),
    ).rejects.toThrow(WorkflowExecutionError);
  });

  it('preserves branch and model fields during execution', async () => {
    const engine = createNovelWorkflowEngine({ adapter: testAdapter });
    const command = {
      ...makeCommand('chapter.generate'),
      branchId: 'branch-romance',
      modelProfileId: 'model-heroic',
    } as NovelCommand;

    const results = [];
    for await (const result of engine.execute(command)) {
      results.push(result);
    }

    const completed = results.find((r) => r.status === 'completed' && r.stepId === 'mock-wrapper');
    expect(completed).toBeDefined();
  });

  it('does not throw unhandled errors for unsupported commands', async () => {
    const engine = createNovelWorkflowEngine({ adapter: testAdapter });
    const command = makeCommand('chapter.generate');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (command as any).type = 'totally.unknown';
    (command as any).workflowId = undefined;

    await expect(
      (async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _ of engine.execute(command)) {
          // consume
        }
      })(),
    ).rejects.toThrow();
  });

  it('uses a custom registry when injected', async () => {
    const customTool: NovelTool = {
      name: 'custom-tool',
      description: 'Custom tool for testing',
      async execute(input: unknown) {
        return { success: true, data: { echoed: input } };
      },
    };
    const registry = createNovelToolRegistry();
    registry.register(customTool);

    const engine = createNovelWorkflowEngine({ registry });
    const def = await engine.load('chapter.generate');
    // Replace the tool name so the custom registry can handle it.
    def.steps[0].tool = 'custom-tool';

    const results = [];
    for await (const result of engine.execute(makeCommand('chapter.generate'), def)) {
      results.push(result);
    }

    const completed = results.find((r) => r.status === 'completed' && r.stepId === 'mock-wrapper');
    expect(completed).toBeDefined();
    expect((completed!.output as { echoed: unknown }).echoed).toBeDefined();
  });

  it('returns controlled error for unknown tool', async () => {
    const registry = createNovelToolRegistry();
    const engine = createNovelWorkflowEngine({ registry });
    const def = await engine.load('chapter.generate');
    def.steps[0].tool = 'missing-tool';

    await expect(
      (async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _ of engine.execute(makeCommand('chapter.generate'))) {
          // consume
        }
      })(),
    ).rejects.toThrow(WorkflowExecutionError);
  });

  it('respects continueOnError', async () => {
    const failingTool: NovelTool = {
      name: 'failing-tool',
      description: 'Always fails',
      async execute() {
        return { success: false, errorCode: 'EXPECTED', error: 'expected failure' };
      },
    };
    const successTool: NovelTool = {
      name: 'success-tool',
      description: 'Always succeeds',
      async execute() {
        return { success: true, data: { ok: true } };
      },
    };
    const registry = createNovelToolRegistry();
    registry.register(failingTool);
    registry.register(successTool);

    const engine = createNovelWorkflowEngine({ registry });
    const def = await engine.load('chapter.generate');
    def.steps = [
      { id: 'step-fail', tool: 'failing-tool', inputs: {}, continueOnError: true },
      { id: 'step-success', tool: 'success-tool', inputs: {} },
    ];

    const results = [];
    for await (const result of engine.execute(makeCommand('chapter.generate'), def)) {
      results.push(result);
    }

    expect(results.some((r) => r.stepId === 'step-fail' && r.status === 'failed')).toBe(true);
    expect(results.some((r) => r.stepId === 'step-success' && r.status === 'completed')).toBe(true);
  });
});

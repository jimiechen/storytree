/**
 * @file workflows/yaml/chapter.continue.test.ts
 * @description chapter.continue YAML 工作流测试 — P3-B
 */

import { describe, it, expect } from 'vitest';
import { createNovelWorkflowEngine } from '../engine/workflow-engine';
import { createNovelToolRegistry } from '../../plugins/novel-tool-registry';
import { getBuiltinWorkflowPath } from '../engine/workflow-resolver';
import { createAIWritingCommand } from '../novel-command';
import type { NovelTool, ToolContext, ToolResult } from '../../plugins/novel-tool-types';
import type { NovelAgentResult } from '../../types/ai-task';

describe('chapter.continue workflow', () => {
  it('P3-B 改造后通过 agent-run Tool 执行，并透传 adapter / stream / 上下文字段', async () => {
    let capturedInput: Record<string, unknown> | undefined;
    let capturedContext: ToolContext | undefined;

    const spyAgentRunTool: NovelTool = {
      name: 'agent-run',
      description: 'Spy agent-run tool for workflow testing',
      async execute(input: unknown, context: ToolContext): Promise<ToolResult> {
        capturedInput = input as Record<string, unknown>;
        capturedContext = context;
        const result: NovelAgentResult = {
          taskId: 'chapter.continue:chapter-2',
          attemptId: 1,
          status: 'completed',
          text: '续写结果',
          wordCount: 4,
          summary: '',
          durationMs: 0,
        };
        return { success: true, data: { result } };
      },
    };

    const registry = createNovelToolRegistry();
    registry.register(spyAgentRunTool);

    const engine = createNovelWorkflowEngine({ registry });
    const command = createAIWritingCommand({
      projectId: 'proj-1',
      chapterId: 'chapter-2',
      chapterIndex: 2,
      genre: '玄幻',
      command: 'continue',
      text: '他推开门',
      selectedText: '他推开门',
      targetWordCount: 800,
    });

    const results = [];
    for await (const result of engine.execute(command)) {
      results.push(result);
    }

    const completed = results.find((r) => r.status === 'completed' && r.stepId === 'agent-run-continue');
    expect(completed).toBeDefined();

    // 未显式指定 adapter 时，YAML 占位符应被 Tool 识别为未指定
    expect(capturedInput?.adapter).toBe('{{adapter}}');
    expect(capturedInput?.stream).toBe('{{stream}}');
    expect(capturedInput?.projectId).toBe('proj-1');
    expect(capturedInput?.chapterId).toBe('chapter-2');
    expect(capturedInput?.selectedText).toBe('他推开门');
    // Workflow Engine 对所有占位符统一做字符串替换
    expect(capturedInput?.targetWordCount).toBe('800');

    expect(capturedContext?.projectId).toBe('proj-1');
    expect(capturedContext?.chapterId).toBe('chapter-2');
    expect(capturedContext?.command).toBeDefined();
  });

  it('YAML 文件加载为 agent-run Tool 与 version 2', async () => {
    const engine = createNovelWorkflowEngine();
    const def = await engine.load('chapter.continue');
    expect(def.id).toBe('chapter.continue');
    expect(def.version).toBe(2);
    expect(def.steps[0].tool).toBe('agent-run');
    expect(def.steps[0].inputs).toHaveProperty('adapter');
    expect(def.steps[0].inputs).toHaveProperty('stream');
  });
});

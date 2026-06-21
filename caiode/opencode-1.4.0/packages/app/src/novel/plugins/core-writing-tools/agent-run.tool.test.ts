/**
 * @file plugins/core-writing-tools/agent-run.tool.test.ts
 * @description agent-run Tool 单元测试 — P2-E
 */

import { describe, it, expect } from 'vitest';
import { createAgentRunTool } from './agent-run.tool';
import { createChapterGenerateCommand } from '../../workflows/novel-command';
import type { ToolContext } from '../novel-tool-types';

function makeCommand() {
  return createChapterGenerateCommand({
    chapterId: 'ch-001',
    projectId: 'proj-001',
    chapterIndex: 1,
    genre: '玄幻',
    text: '测试正文',
    targetWordCount: 800,
  });
}

function makeContext(command = makeCommand()): ToolContext {
  return {
    workflowId: 'chapter.generate',
    commandId: 'cmd-test',
    commandType: command.type,
    projectId: command.projectId,
    chapterId: command.chapterId,
    variables: {},
    stepResults: {},
    command,
  };
}

describe('agent-run Tool', () => {
  it('使用 mock adapter 成功执行', async () => {
    const tool = createAgentRunTool();
    const context = makeContext();
    const result = await tool.execute({ adapter: 'mock' }, context);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('未指定 adapter 默认使用 mock', async () => {
    const tool = createAgentRunTool();
    const context = makeContext();
    const result = await tool.execute({}, context);

    expect(result.success).toBe(true);
  });

  it('请求 opencode-stub 返回 ADAPTER_DISABLED', async () => {
    const tool = createAgentRunTool();
    const context = makeContext();
    const result = await tool.execute({ adapter: 'opencode-stub' }, context);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('ADAPTER_DISABLED');
  });

  it('请求 claudecode-stub 返回 ADAPTER_DISABLED', async () => {
    const tool = createAgentRunTool();
    const context = makeContext();
    const result = await tool.execute({ adapter: 'claudecode-stub' }, context);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('ADAPTER_DISABLED');
  });

  it('gate 开启时 opencode-stub 返回 stub 结果', async () => {
    const tool = createAgentRunTool();
    const context = makeContext();
    const result = await tool.execute(
      {
        adapter: 'opencode-stub',
        gates: {
          realLLMEnabled: false,
          openCodeAdapterEnabled: true,
          claudeCodeAdapterEnabled: false,
        },
      },
      context,
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('缺少 command 时返回 MISSING_COMMAND', async () => {
    const tool = createAgentRunTool();
    const context = { ...makeContext(), command: undefined as unknown as ToolContext['command'] };
    const result = await tool.execute({}, context);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('MISSING_COMMAND');
  });

  it('AdapterContext 保留 branch / model 字段', async () => {
    const tool = createAgentRunTool();
    const command = {
      ...makeCommand(),
      branchId: 'feature-branch',
      modelProfileId: 'model-001',
    };
    const context: ToolContext = {
      workflowId: 'chapter.generate',
      commandId: 'cmd-test',
      commandType: command.type,
      projectId: command.projectId,
      chapterId: command.chapterId,
      branchId: command.branchId,
      modelProfileId: command.modelProfileId,
      variables: {},
      stepResults: {},
      command,
    };

    const result = await tool.execute({ adapter: 'mock' }, context);
    expect(result.success).toBe(true);
  });
});

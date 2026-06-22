/**
 * @file plugins/core-writing-tools/agent-run.tool.test.ts
 * @description agent-run Tool 单元测试 — P2-E
 */

import { describe, it, expect } from 'vitest';
import { createAgentRunTool } from './agent-run.tool';
import { createChapterGenerateCommand } from '../../workflows/novel-command';
import type { ToolContext } from '../novel-tool-types';
import { createAdapterRouter } from '../../adapters/adapter-router';
import { RealLLMExecutionAdapter } from '../../adapters/real-llm-adapter';
import { createTargetLLMClient, type LLMTransport } from '../../llm/target-llm-client';
import { createDefaultRealLLMFeatureGates } from '../../llm/llm-feature-gates';
import { createMockTokenStream } from '../../llm/target-llm-stream-parser';
import type { LLMRequest, LLMResponse } from '../../llm/llm-request-types';
import type { LLMStreamEvent } from '../../llm/llm-stream-events';

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
          modelRoutingEnabled: false,
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

  it('gate 关闭时默认选择 mock adapter', async () => {
    const tool = createAgentRunTool();
    const context = makeContext();
    const result = await tool.execute(
      {
        gates: {
          realLLMEnabled: false,
          targetLLMAdapterEnabled: false,
          openCodeAdapterEnabled: false,
          claudeCodeAdapterEnabled: false,
          modelRoutingEnabled: false,
        },
      },
      context,
    );

    expect(result.success).toBe(true);
  });

  it('gate 开启时默认选择 real-llm（stub transport 返回执行错误，但不是 ADAPTER_DISABLED）', async () => {
    const tool = createAgentRunTool();
    const context = makeContext();
    const result = await tool.execute(
      {
        gates: {
          realLLMEnabled: true,
          targetLLMAdapterEnabled: true,
          openCodeAdapterEnabled: false,
          claudeCodeAdapterEnabled: false,
          modelRoutingEnabled: false,
        },
      },
      context,
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).not.toBe('ADAPTER_DISABLED');
  });

  it('显式 real-llm 且 gate 关闭返回 ADAPTER_DISABLED', async () => {
    const tool = createAgentRunTool();
    const context = makeContext();
    const result = await tool.execute(
      {
        adapter: 'real-llm',
        gates: {
          realLLMEnabled: false,
          targetLLMAdapterEnabled: false,
          openCodeAdapterEnabled: false,
          claudeCodeAdapterEnabled: false,
          modelRoutingEnabled: false,
        },
      },
      context,
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('ADAPTER_DISABLED');
  });

  it('stream 字符串 "true" 被解析为 true 且不破坏 mock 执行', async () => {
    const tool = createAgentRunTool();
    const context = makeContext();
    const result = await tool.execute({ adapter: 'mock', stream: 'true' as unknown as boolean }, context);

    expect(result.success).toBe(true);
  });

  it('adapter 占位符 "{{adapter}}" 视为未指定并按 gate 选择', async () => {
    const tool = createAgentRunTool();
    const context = makeContext();
    const result = await tool.execute(
      {
        adapter: '{{adapter}}' as unknown as 'mock',
        gates: {
          realLLMEnabled: false,
          targetLLMAdapterEnabled: false,
          openCodeAdapterEnabled: false,
          claudeCodeAdapterEnabled: false,
          modelRoutingEnabled: false,
        },
      },
      context,
    );

    expect(result.success).toBe(true);
  });

  it('P3-D：modelProfileId 与 modelRole 透传到 AdapterContext 并影响路由结果', async () => {
    const mockTransport: LLMTransport = {
      name: 'mock-routing',
      async complete(request: LLMRequest): Promise<LLMResponse> {
        return { requestId: request.requestId, text: '路由正文' };
      },
      async *stream(request: LLMRequest): AsyncGenerator<LLMStreamEvent> {
        yield* createMockTokenStream(request.requestId, '路由正文');
      },
    };

    const router = createAdapterRouter();
    router.register(
      new RealLLMExecutionAdapter({
        client: createTargetLLMClient({ transport: mockTransport }),
        gates: {
          ...createDefaultRealLLMFeatureGates(),
          realLLMEnabled: true,
          targetLLMAdapterEnabled: true,
        },
      }),
    );
    const tool = createAgentRunTool({
      router,
      gates: {
        realLLMEnabled: true,
        targetLLMAdapterEnabled: true,
        openCodeAdapterEnabled: false,
        claudeCodeAdapterEnabled: false,
      },
    });
    const context = makeContext();
    const result = await tool.execute(
      {
        adapter: 'real-llm',
        modelProfileId: 'deepseek-chat',
        modelRole: 'rewrite',
      },
      context,
    );

    expect(result.success).toBe(true);
    expect(result.data?.result.metadata?.modelProfileId).toBe('deepseek-chat');
    expect(result.data?.result.metadata?.modelId).toBe('deepseek-chat');
  });

  it('P3-C：流式执行返回 events 且 result 包含 validationIssues', async () => {
    const mockTransport: LLMTransport = {
      name: 'mock-stream',
      async complete(request: LLMRequest): Promise<LLMResponse> {
        return { requestId: request.requestId, text: '流式正文' };
      },
      async *stream(request: LLMRequest): AsyncGenerator<LLMStreamEvent> {
        yield* createMockTokenStream(request.requestId, '流式正文');
      },
    };

    const router = createAdapterRouter();
    router.register(
      new RealLLMExecutionAdapter({
        client: createTargetLLMClient({ transport: mockTransport }),
        gates: {
          ...createDefaultRealLLMFeatureGates(),
          realLLMEnabled: true,
          targetLLMAdapterEnabled: true,
          llmStreamingEnabled: true,
        },
      }),
    );
    const tool = createAgentRunTool({
      router,
      gates: {
        realLLMEnabled: true,
        targetLLMAdapterEnabled: true,
        openCodeAdapterEnabled: false,
        claudeCodeAdapterEnabled: false,
      },
    });
    const context = makeContext();
    const result = await tool.execute({ adapter: 'real-llm', stream: true }, context);

    expect(result.success).toBe(true);
    expect(result.events).toBeDefined();
    expect((result.events ?? []).length).toBeGreaterThan(0);
    expect(result.data?.result.validationIssues).toBeDefined();
  });
});

/**
 * @file plugins/core-writing-tools/agent-run.tool.ts
 * @description agent-run Tool — P2-E
 *
 * Tool 与 AdapterRouter 的关系：
 * - Tool 不直接知道具体模型，只通过 adapter 抽象执行。
 * - 根据输入中的 adapter 字段（或默认），AdapterRouter 选择 Mock / OpenCode Stub / ClaudeCode Stub。
 * - P2 阶段真实 adapter 被 FeatureGate 关闭，显式请求会返回结构化 ADAPTER_DISABLED。
 * - 保留 mock-generation-wrapper 以保证 P1 / P2-D 不回归；本 Tool 用于验证 Router 可被 Registry 消费。
 */

import type { NovelCommand } from '../../workflows/novel-command';
import type {
  AdapterContext,
  AdapterExecutionResult,
  AdapterFeatureGates,
  AdapterKind,
  AdapterRouterError,
} from '../../adapters/adapter-types';
import {
  createAdapterRouter,
  MockExecutionAdapter,
  OpenCodeExecutionAdapter,
  ClaudeCodeExecutionAdapter,
} from '../../adapters';
import { createDefaultAdapterFeatureGates } from '../../feature-gates';
import type { NovelTool, ToolContext, ToolResult } from '../novel-tool-types';

function isAdapterRouterError(
  value: unknown,
): value is AdapterRouterError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as { success: boolean }).success === false &&
    'errorCode' in value
  );
}

function buildAdapterContext(command: NovelCommand, context: ToolContext): AdapterContext {
  return {
    workspaceId: context.workspaceId,
    projectId: context.projectId,
    chapterId: context.chapterId,
    branchId: context.branchId,
    worktreeId: context.worktreeId,
    modelProfileId: context.modelProfileId,
    // command.command 是 AIWritingCommand；P2 阶段只做透传，不做真实多模型路由。
    genre: command.genre,
    dryRun: false,
  };
}

function createDefaultRouter(gates?: AdapterFeatureGates) {
  const router = createAdapterRouter();
  router.register(new MockExecutionAdapter({ delayMultiplier: 0, silent: true }));
  router.register(new OpenCodeExecutionAdapter());
  router.register(new ClaudeCodeExecutionAdapter());
  return { router, gates: gates ?? createDefaultAdapterFeatureGates() };
}

/**
 * 创建 agent-run Tool。
 *
 * 输入可包含：
 * - adapter?: 'mock' | 'opencode-stub' | 'claudecode-stub'（未指定则默认 mock）
 * - gates?: AdapterFeatureGates（测试注入用）
 */
export function createAgentRunTool(): NovelTool {
  return {
    name: 'agent-run',
    description: 'Route a NovelCommand through AdapterRouter and execute the selected adapter',
    async execute(input: unknown, context: ToolContext): Promise<ToolResult> {
      const command = context.command;
      if (!command) {
        return {
          success: false,
          errorCode: 'MISSING_COMMAND',
          error: 'Tool context is missing the original NovelCommand',
        };
      }

      const typedInput = (input ?? {}) as {
        adapter?: AdapterKind;
        gates?: AdapterFeatureGates;
      };

      const { router, gates } = createDefaultRouter(typedInput.gates);
      const adapterContext = buildAdapterContext(command, context);
      const routed = router.route(typedInput.adapter, command, adapterContext, gates);

      if (isAdapterRouterError(routed)) {
        return {
          success: false,
          errorCode: routed.errorCode,
          error: routed.error,
        };
      }

      try {
        const execution: AdapterExecutionResult = await routed.execute(command, adapterContext);
        if (!execution.success) {
          return {
            success: false,
            errorCode: execution.errorCode ?? 'ADAPTER_EXECUTION_FAILED',
            error: execution.error ?? 'Adapter 执行失败',
          };
        }
        return {
          success: true,
          data: { result: execution.result },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          errorCode: 'ADAPTER_EXECUTION_FAILED',
          error: message,
        };
      }
    },
  };
}

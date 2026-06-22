/**
 * @file plugins/core-writing-tools/agent-run.tool.ts
 * @description agent-run Tool — P2-E / P3-B
 *
 * Tool 与 AdapterRouter 的关系：
 * - Tool 不直接知道具体模型，只通过 adapter 抽象执行。
 * - 根据输入中的 adapter 字段（或默认），AdapterRouter 选择 Mock / OpenCode Stub / ClaudeCode Stub / Real LLM。
 * - P2 阶段真实 adapter 被 FeatureGate 关闭，显式请求会返回结构化 ADAPTER_DISABLED。
 * - P3-B 阶段：
 *   - 默认 adapter 由 FeatureGate 决定：gate 全开时默认 real-llm，否则默认 mock。
 *   - 支持 stream 参数；stream=true 且 adapter 为 real-llm 时，调用 executeStream 并返回事件流。
 *   - 返回的 events 供 UI 聚合为 AITask，实现流式预览。
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
  RealLLMExecutionAdapter,
} from '../../adapters';
import { createDefaultAdapterFeatureGates } from '../../feature-gates';
import {
  createDefaultRealLLMFeatureGates,
  type RealLLMFeatureGates,
} from '../../llm/llm-feature-gates';
import { createTargetLLMClient } from '../../llm/target-llm-client';
import type { LLMStreamEvent } from '../../llm/llm-stream-events';
import { collectLLMText } from '../../llm/llm-stream-events';
import { validateGenerationResult } from '../../llm/generation-result-validator';
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

/**
 * 根据 ToolContext 与 NovelCommand 构建 AdapterContext。
 *
 * P3-B 新增透传：
 * - stream：是否请求流式事件；RealLLMExecutionAdapter 据此决定调用 executeStream 还是 execute。
 * - targetWordCount / selectedText：供 prompt builder 构建更精确的续写请求。
 */
function buildAdapterContext(
  command: NovelCommand,
  context: ToolContext,
  stream?: boolean,
): AdapterContext {
  return {
    workspaceId: context.workspaceId,
    projectId: context.projectId,
    chapterId: context.chapterId,
    branchId: context.branchId,
    worktreeId: context.worktreeId,
    modelProfileId: context.modelProfileId,
    genre: command.genre,
    targetWordCount: command.targetWordCount,
    selectedText: command.selectedText,
    dryRun: false,
    stream: stream ?? false,
  };
}

/**
 * 根据 AdapterFeatureGates 选择默认 adapter。
 *
 * 当 UI / YAML 未显式指定 adapter 时：
 * - realLLMEnabled && targetLLMAdapterEnabled → real-llm
 * - 否则 → mock（保证 gate 关闭时不误发真实请求）
 */
function defaultAdapterForGates(gates: AdapterFeatureGates): AdapterKind {
  return gates.realLLMEnabled && gates.targetLLMAdapterEnabled ? 'real-llm' : 'mock';
}

const VALID_ADAPTER_KINDS: AdapterKind[] = ['mock', 'opencode-stub', 'claudecode-stub', 'real-llm'];

/**
 * 解析 Tool 输入中的 adapter 字段。
 *
 * 当 YAML 未提供该变量时，Workflow Engine 会保留占位符（如 "{{adapter}}"）或空字符串，
 * 此时应视为未指定，由 Tool 内部根据 FeatureGate 选择默认 adapter。
 */
function parseAdapterInput(value: unknown): AdapterKind | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '' || /^\{\{.*\}\}$/.test(trimmed)) return undefined;
    if (VALID_ADAPTER_KINDS.includes(trimmed as AdapterKind)) return trimmed as AdapterKind;
    return undefined;
  }
  return undefined;
}

/**
 * 解析 Tool 输入中的 stream 字段。
 *
 * YAML 占位符或未提供时默认 false，避免非预期地请求流式执行。
 */
function parseStreamInput(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '' || /^\{\{.*\}\}$/.test(trimmed)) return false;
    return trimmed === 'true';
  }
  return false;
}

/**
 * 创建默认 Router，并注册所有可用 adapter。
 *
 * P3-B 新增注册 RealLLMExecutionAdapter，默认使用 disabledLLMTransport，
 * 确保未显式注入真实 transport 时不会发出真实网络请求。
 */
function createDefaultRouter(gates?: AdapterFeatureGates) {
  const router = createAdapterRouter();
  router.register(new MockExecutionAdapter({ delayMultiplier: 0, silent: true }));
  router.register(new OpenCodeExecutionAdapter());
  router.register(new ClaudeCodeExecutionAdapter());
  router.register(
    new RealLLMExecutionAdapter({
      client: createTargetLLMClient(),
      gates: createDefaultRealLLMFeatureGates(),
    }),
  );
  return { router, gates: gates ?? createDefaultAdapterFeatureGates() };
}

/**
 * 消费 RealLLMExecutionAdapter 的流式事件，返回聚合结果与事件列表。
 *
 * P3-C：对最终文本做基础质量校验，issues 写入 result.validationIssues，
 * 让 UI 在展示结果时提示用户检查。
 */
async function runRealLLMStream(
  adapter: RealLLMExecutionAdapter,
  command: NovelCommand,
  context: AdapterContext,
): Promise<{ success: true; result: AdapterExecutionResult['result']; events: LLMStreamEvent[] } | { success: false; errorCode: string; error: string }> {
  const events: LLMStreamEvent[] = [];
  try {
    for await (const event of adapter.executeStream(command, context)) {
      events.push(event);
      if (event.type === 'llm.request.failed') {
        return {
          success: false,
          errorCode: event.errorCode,
          error: event.error,
        };
      }
    }
    const text = collectLLMText(events);
    const targetWordCount = command.targetWordCount ?? context.targetWordCount ?? 0;
    const validation = targetWordCount > 0
      ? validateGenerationResult(text, targetWordCount)
      : validateGenerationResult(text, 0, { minWordCount: 0, minRatioOfTarget: 0 });

    return {
      success: true,
      result: {
        taskId: `${command.type}:${command.chapterId ?? context.chapterId ?? 'unknown'}`,
        attemptId: 1,
        status: 'completed',
        text: validation.text,
        wordCount: validation.wordCount,
        summary: validation.valid ? '' : validation.issues.map((i) => i.message).join('；'),
        durationMs: 0,
        validationIssues: validation.issues,
      },
      events,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      errorCode: 'ADAPTER_EXECUTION_FAILED',
      error: message,
    };
  }
}

/**
 * agent-run Tool 选项。
 */
export interface CreateAgentRunToolOptions {
  /** 测试注入用：自定义已配置好 adapter 的 router */
  router?: ReturnType<typeof createAdapterRouter>;
  /** 测试注入用：与 router 配套的 gates */
  gates?: AdapterFeatureGates;
}

/**
 * 创建 agent-run Tool。
 *
 * 输入可包含：
 * - adapter?: 'mock' | 'opencode-stub' | 'claudecode-stub' | 'real-llm'（未指定则按 gate 选择）
 * - stream?: boolean（true 时若 adapter 为 real-llm 则走 executeStream）
 * - gates?: AdapterFeatureGates（测试注入用）
 */
export function createAgentRunTool(options?: CreateAgentRunToolOptions): NovelTool {
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

      const rawInput = (input ?? {}) as Record<string, unknown>;
      const typedInput = {
        adapter: parseAdapterInput(rawInput.adapter),
        stream: parseStreamInput(rawInput.stream),
        gates: rawInput.gates as AdapterFeatureGates | undefined,
      };

      const gates = typedInput.gates ?? options?.gates ?? createDefaultAdapterFeatureGates();
      const router = options?.router ?? createDefaultRouter(gates).router;
      const selectedAdapter = typedInput.adapter ?? defaultAdapterForGates(gates);
      const streamRequested = typedInput.stream;
      const adapterContext = buildAdapterContext(command, context, streamRequested);
      const routed = router.route(selectedAdapter, command, adapterContext, gates);

      if (isAdapterRouterError(routed)) {
        return {
          success: false,
          errorCode: routed.errorCode,
          error: routed.error,
        };
      }

      // P3-B：stream=true 且路由到 real-llm 时，使用流式执行并返回事件列表。
      if (streamRequested && routed.name === 'real-llm') {
        const streamResult = await runRealLLMStream(
          routed as RealLLMExecutionAdapter,
          command,
          adapterContext,
        );
        if (!streamResult.success) {
          return {
            success: false,
            errorCode: streamResult.errorCode,
            error: streamResult.error,
          };
        }
        return {
          success: true,
          data: { result: streamResult.result },
          events: streamResult.events,
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

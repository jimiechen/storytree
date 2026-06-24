/**
 * @file plugins/builtin-novel-tools.ts
 * @description 内置 Novel Tool Plugin / Registry — P2-B
 */

import type { NovelAgentAdapter } from '../adapters/novel-agent-adapter';
import type { AdapterFeatureGates } from '../adapters/adapter-types';
import type { NovelToolPlugin, NovelToolRegistry } from './novel-tool-types';
import { createNovelToolRegistry } from './novel-tool-registry';
import { createMockGenerationWrapperTool } from './core-writing-tools/mock-generation-wrapper.tool';
import { createContextAssembleTool } from './core-writing-tools/context-assemble.tool';
import { createBuildWorkflowEventsTool } from './core-writing-tools/build-workflow-events.tool';
import { createInfoExtractPlaceholderTool } from './core-info-theory-tools/info-extract-placeholder.tool';
import { createInfoTheoryAuditTool } from './core-info-theory-tools/info-theory-audit.tool';
import { createAgentRunTool } from './core-writing-tools/agent-run.tool';

export const builtinNovelToolPlugin: NovelToolPlugin = {
  id: 'novelforge-core-tools',
  name: 'NovelForge Core Tools',
  version: '0.1.0',
  tools: [
    createMockGenerationWrapperTool(),
    createContextAssembleTool(),
    createBuildWorkflowEventsTool(),
    createInfoExtractPlaceholderTool(),
    createInfoTheoryAuditTool(),
    createAgentRunTool(),
  ],
};

export interface CreateBuiltinNovelToolRegistryOptions {
  adapter?: NovelAgentAdapter;
  /** 测试注入用：控制 agent-run 默认路由，避免真实 LLM gate 开启时测试超时 */
  gates?: AdapterFeatureGates;
}

/** 测试/ mock 场景默认关闭真实 LLM，避免真实网络请求导致超时。 */
const MOCK_ADAPTER_GATES: AdapterFeatureGates = {
  realLLMEnabled: false,
  targetLLMAdapterEnabled: false,
  openCodeAdapterEnabled: false,
  claudeCodeAdapterEnabled: false,
  modelRoutingEnabled: false,
};

export function createBuiltinNovelToolRegistry(
  options?: CreateBuiltinNovelToolRegistryOptions | NovelAgentAdapter,
): NovelToolRegistry {
  const opts: CreateBuiltinNovelToolRegistryOptions =
    options && typeof options === 'object' && typeof (options as NovelAgentAdapter).run === 'function'
      ? { adapter: options as NovelAgentAdapter }
      : ((options ?? {}) as CreateBuiltinNovelToolRegistryOptions);

  // 传入 adapter 的测试/ mock 场景默认关闭真实 LLM；
  // 生产/ E2E 不传入 adapter 时保留默认 NovelFeatureGates（真实 LLM 可开启）。
  const agentRunGates = opts.gates ?? (opts.adapter ? MOCK_ADAPTER_GATES : undefined);

  const registry = createNovelToolRegistry();
  registry.register(createMockGenerationWrapperTool(opts.adapter));
  registry.register(createContextAssembleTool());
  registry.register(createBuildWorkflowEventsTool());
  registry.register(createInfoExtractPlaceholderTool());
  registry.register(createInfoTheoryAuditTool());
  registry.register(createAgentRunTool({ gates: agentRunGates }));
  return registry;
}

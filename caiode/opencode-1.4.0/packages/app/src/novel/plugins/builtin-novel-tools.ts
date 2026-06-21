/**
 * @file plugins/builtin-novel-tools.ts
 * @description 内置 Novel Tool Plugin / Registry — P2-B
 */

import type { NovelAgentAdapter } from '../adapters/novel-agent-adapter';
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

export function createBuiltinNovelToolRegistry(
  adapter?: NovelAgentAdapter,
): NovelToolRegistry {
  const registry = createNovelToolRegistry();
  registry.register(createMockGenerationWrapperTool(adapter));
  registry.register(createContextAssembleTool());
  registry.register(createBuildWorkflowEventsTool());
  registry.register(createInfoExtractPlaceholderTool());
  registry.register(createInfoTheoryAuditTool());
  registry.register(createAgentRunTool());
  return registry;
}

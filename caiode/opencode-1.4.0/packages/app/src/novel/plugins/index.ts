/**
 * @file plugins/index.ts
 * @description Novel Tool Registry 统一导出 — P2-B
 */

export type {
  JSONSchema,
  ToolContext,
  ToolResult,
  NovelTool,
  NovelToolRegistry,
  NovelToolPlugin,
} from './novel-tool-types';

export { NovelToolRegistryError, createNovelToolRegistry } from './novel-tool-registry';
export { registerNovelToolPlugin } from './novel-tool-plugin';
export {
  builtinNovelToolPlugin,
  createBuiltinNovelToolRegistry,
} from './builtin-novel-tools';

export { createMockGenerationWrapperTool } from './core-writing-tools/mock-generation-wrapper.tool';
export { createContextAssembleTool } from './core-writing-tools/context-assemble.tool';
export { createBuildWorkflowEventsTool } from './core-writing-tools/build-workflow-events.tool';
export { createInfoExtractPlaceholderTool } from './core-info-theory-tools/info-extract-placeholder.tool';

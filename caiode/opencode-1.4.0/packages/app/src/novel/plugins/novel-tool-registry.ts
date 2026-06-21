/**
 * @file plugins/novel-tool-registry.ts
 * @description Novel Tool Registry 实现 — P2-B
 */

import type { NovelTool, NovelToolRegistry, ToolContext, ToolResult } from './novel-tool-types';

export class NovelToolRegistryError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = 'NovelToolRegistryError';
  }
}

export function createNovelToolRegistry(): NovelToolRegistry {
  const tools = new Map<string, NovelTool>();

  return {
    register(tool) {
      if (tools.has(tool.name)) {
        throw new NovelToolRegistryError(
          `Tool "${tool.name}" is already registered`,
          'TOOL_ALREADY_REGISTERED',
        );
      }
      tools.set(tool.name, tool);
    },

    has(name) {
      return tools.has(name);
    },

    get(name) {
      return tools.get(name);
    },

    list() {
      return Array.from(tools.values());
    },

    async execute(name, input, context): Promise<ToolResult> {
      const tool = tools.get(name);
      if (!tool) {
        return {
          success: false,
          errorCode: 'TOOL_NOT_FOUND',
          error: `Tool "${name}" is not registered`,
        };
      }

      try {
        return await tool.execute(input, context);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          errorCode: 'TOOL_EXECUTION_FAILED',
          error: message,
        };
      }
    },
  };
}

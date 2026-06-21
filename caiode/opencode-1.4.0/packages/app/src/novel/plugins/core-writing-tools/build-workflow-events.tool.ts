/**
 * @file plugins/core-writing-tools/build-workflow-events.tool.ts
 * @description 工作流事件构建占位 Tool — P2-B
 */

import type { NovelTool, ToolContext, ToolResult } from '../novel-tool-types';

interface BuildWorkflowEventsInput {
  events?: unknown[];
  result?: unknown;
}

export function createBuildWorkflowEventsTool(): NovelTool {
  return {
    name: 'build-workflow-events',
    description: 'Pass through or build workflow events (placeholder for P2-C/P2-D)',
    async execute(input: unknown, _context: ToolContext): Promise<ToolResult> {
      const typedInput = input as BuildWorkflowEventsInput;
      const events = Array.isArray(typedInput?.events) ? typedInput.events : [];
      return {
        success: true,
        data: { events },
        events,
      };
    },
  };
}

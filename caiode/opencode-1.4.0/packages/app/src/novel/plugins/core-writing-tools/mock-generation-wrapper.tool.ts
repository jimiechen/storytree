/**
 * @file plugins/core-writing-tools/mock-generation-wrapper.tool.ts
 * @description 包装现有 runMockGeneration 的 Tool — P2-B
 */

import type { NovelAgentAdapter } from '../../adapters/novel-agent-adapter';
import { mockAgentAdapter } from '../../adapters/mock-agent-adapter';
import { runMockGeneration } from '../../workflows/mock-generation-workflow';
import type { NovelTool, ToolContext, ToolResult } from '../novel-tool-types';

export function createMockGenerationWrapperTool(
  adapter: NovelAgentAdapter = mockAgentAdapter,
): NovelTool {
  return {
    name: 'mock-generation-wrapper',
    description: 'Wrap the existing P1 Mock Generation workflow as a Tool',
    async execute(_input: unknown, context: ToolContext): Promise<ToolResult> {
      const command = context.command;
      if (!command) {
        return {
          success: false,
          errorCode: 'MISSING_COMMAND',
          error: 'Tool context is missing the original NovelCommand',
        };
      }

      try {
        const { result, events, durationMs } = await runMockGeneration(command, adapter);
        return {
          success: true,
          data: { result, events, durationMs },
          events,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          errorCode: 'MOCK_GENERATION_FAILED',
          error: message,
        };
      }
    },
  };
}

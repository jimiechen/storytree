/**
 * @file plugins/core-info-theory-tools/info-extract-placeholder.tool.ts
 * @description info.extract 占位 Tool — P2-B
 */

import type { NovelTool, ToolContext, ToolResult } from '../novel-tool-types';

export function createInfoExtractPlaceholderTool(): NovelTool {
  return {
    name: 'not-implemented',
    description: 'Placeholder tool that returns NOT_IMPLEMENTED',
    async execute(_input: unknown, _context: ToolContext): Promise<ToolResult> {
      return {
        success: false,
        errorCode: 'NOT_IMPLEMENTED',
        error: 'Tool is not implemented in Phase P2-B',
      };
    },
  };
}

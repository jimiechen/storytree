/**
 * @file plugins/core-writing-tools/context-assemble.tool.ts
 * @description 组装工作流上下文的最小上下文对象 — P2-B
 */

import type { NovelTool, ToolContext, ToolResult } from '../novel-tool-types';

export function createContextAssembleTool(): NovelTool {
  return {
    name: 'context-assemble',
    description: 'Assemble a minimal context object from ToolContext and input',
    async execute(input: unknown, context: ToolContext): Promise<ToolResult> {
      return {
        success: true,
        data: {
          projectId: context.projectId,
          chapterId: context.chapterId,
          branchId: context.branchId,
          worktreeId: context.worktreeId,
          modelProfileId: context.modelProfileId,
          skillId: context.skillId,
          commandType: context.commandType,
          input,
        },
      };
    },
  };
}

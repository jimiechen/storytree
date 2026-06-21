/**
 * @file plugins/core-info-theory-tools/info-theory-audit.tool.ts
 * @description info-theory-audit Tool — P2-C
 */

import type { NovelTool, ToolContext, ToolResult } from '../novel-tool-types';
import { auditChapterInformation, scoreChapterInformation } from '../../info-theory';

function resolveText(input: unknown, context: ToolContext): string {
  if (input && typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    if (typeof obj.text === 'string' && obj.text.length > 0) return obj.text;
    if (typeof obj.content === 'string' && obj.content.length > 0) return obj.content;
  }

  const vars = context.variables;
  if (typeof vars.text === 'string' && vars.text.length > 0) return vars.text;
  if (typeof vars.content === 'string' && vars.content.length > 0) return vars.content;

  const result = vars.result;
  if (result && typeof result === 'object') {
    const resultObj = result as Record<string, unknown>;
    if (typeof resultObj.text === 'string' && resultObj.text.length > 0) return resultObj.text;
    if (typeof resultObj.content === 'string' && resultObj.content.length > 0) return resultObj.content;
  }

  return '';
}

export function createInfoTheoryAuditTool(): NovelTool {
  return {
    name: 'info-theory-audit',
    description:
      'Audit chapter information using deterministic information-theory heuristics (no LLM)',
    async execute(input: unknown, context: ToolContext): Promise<ToolResult> {
      const inputObj =
        input && typeof input === 'object' ? (input as Record<string, unknown>) : undefined;
      const projectId = (inputObj?.projectId as string | undefined) || context.projectId;
      const chapterId = (inputObj?.chapterId as string | undefined) || context.chapterId;

      if (!projectId) {
        return {
          success: false,
          errorCode: 'MISSING_PROJECT_ID',
          error: 'projectId is required for info-theory-audit',
        };
      }

      if (!chapterId) {
        return {
          success: false,
          errorCode: 'MISSING_CHAPTER_ID',
          error: 'chapterId is required for info-theory-audit',
        };
      }

      const text = resolveText(input, context);

      const state = auditChapterInformation({ projectId, chapterId, text });
      const score = scoreChapterInformation(state);

      const event = {
        type: 'info.theory.calculated',
        chapterId,
        projectId,
        score,
        state,
      };

      return {
        success: true,
        data: {
          state,
          score,
          events: [event],
        },
        events: [event],
      };
    },
  };
}

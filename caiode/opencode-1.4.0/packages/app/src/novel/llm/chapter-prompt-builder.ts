/**
 * @file llm/chapter-prompt-builder.ts
 * @description 章节生成专用 Prompt Builder — P3-C
 *
 * P3-C 在 P3-A 的 target-llm-request-builder 之上，为 chapter.generate 提供：
 * 1. 上下文裁剪后的 prompt；
 * 2. 明确的字数、风格、类型约束；
 * 3. 对空草稿 / 扩写两种场景的区分处理。
 */

import type { NovelCommand } from '../workflows/novel-command';
import type { AdapterContext } from '../adapters/adapter-types';
import { assembleChapterContext, type ChapterContextPayload } from './chapter-context-assembler';
import { DEFAULT_CHAPTER_GENERATION_BUDGET, type TokenBudget } from './token-budget';

/**
 * 章节生成 prompt 输出。
 */
export interface ChapterPrompt {
  /** 系统提示 */
  systemPrompt: string;
  /** 用户提示 */
  prompt: string;
  /** 是否基于上下文裁剪 */
  wasTrimmed: boolean;
  /** 目标字数 */
  targetWordCount: number;
}

/**
 * 统一的系统提示。
 *
 * 强调只输出正文、不解释、不 Markdown、不泄露上下文。
 */
function createSystemPrompt(): string {
  return [
    '你是一位中文小说写作助手。',
    '请严格根据用户提供的上下文、类型和字数要求生成正文。',
    '只输出小说正文，不要输出解释、总结、Markdown 格式或任何非正文内容。',
    '保持与已有段落的风格、语气一致。',
  ].join('');
}

/**
 * 根据上下文负载构造用户 prompt。
 */
function buildUserPrompt(ctx: ChapterContextPayload): string {
  const parts: string[] = [];

  parts.push(`类型：${ctx.genre}`);
  parts.push(`目标字数：约 ${ctx.targetWordCount} 字`);

  if (ctx.style) {
    parts.push(`风格要求：${ctx.style}`);
  }

  if (ctx.contextRefs && ctx.contextRefs.length > 0) {
    // P3-C 只透传引用 ID，不展开内容，避免 prompt 失控
    parts.push(`上下文引用：${ctx.contextRefs.join(', ')}`);
  }

  if (ctx.body.wasTrimmed) {
    parts.push('注意：由于上下文较长，系统已自动裁剪，请基于保留的最近内容继续生成。');
  }

  if (ctx.isExpansion) {
    parts.push('任务：在以下已有内容基础上继续扩写，保持情节连贯。');
  } else {
    parts.push('任务：根据以下信息生成新章节正文。');
  }

  parts.push('\n【参考内容】\n');
  parts.push(ctx.body.text);

  return parts.join('\n');
}

/**
 * 为 chapter.generate 构造 prompt。
 *
 * @param command NovelCommand
 * @param context AdapterContext
 * @param budget TokenBudget（可选，默认 DEFAULT_CHAPTER_GENERATION_BUDGET）
 */
export function buildChapterGenerationPrompt(
  command: NovelCommand,
  context: AdapterContext,
  budget: TokenBudget = DEFAULT_CHAPTER_GENERATION_BUDGET,
): ChapterPrompt {
  const ctx = assembleChapterContext(command, context, budget);

  return {
    systemPrompt: createSystemPrompt(),
    prompt: buildUserPrompt(ctx),
    wasTrimmed: ctx.body.wasTrimmed,
    targetWordCount: ctx.targetWordCount,
  };
}

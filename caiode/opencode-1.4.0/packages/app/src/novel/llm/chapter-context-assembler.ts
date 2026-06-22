/**
 * @file llm/chapter-context-assembler.ts
 * @description 章节生成上下文组装器 — P3-C
 *
 * P3-C 章节生成需要更多上下文（已有正文、风格、目标字数）。
 * 本模块负责按优先级收集并裁剪上下文，保证不超出 TokenBudget。
 */

import type { NovelCommand } from '../workflows/novel-command';
import type { AdapterContext } from '../adapters/adapter-types';
import {
  DEFAULT_CHAPTER_GENERATION_BUDGET,
  trimContextToBudget,
  type TokenBudget,
  type TrimContextResult,
} from './token-budget';

/**
 * 组装后的章节生成上下文。
 */
export interface ChapterContextPayload {
  /** 裁剪后的正文 / 参考文本 */
  body: TrimContextResult;
  /** 小说类型 */
  genre: string;
  /** 目标字数 */
  targetWordCount: number;
  /** 写作风格提示（可选） */
  style?: string;
  /** 语气提示（可选） */
  tone?: string;
  /** 上下文引用 ID 列表（P3-C 只透传，不解析内容） */
  contextRefs?: string[];
  /** 是否基于已有草稿扩写 */
  isExpansion: boolean;
}

/**
 * 从命令与适配器上下文中组装章节生成所需上下文。
 *
 * 组装优先级：
 * 1. 当前章节已有正文（`command.text`）。
 * 2. 选中文本 / 光标位置提示（`command.selectedText` 或 `context.selectedText`）。
 * 3. 类型、风格、目标字数等元信息。
 * 4. contextRefs 只透传 ID，P3-C 不读取真实项目文件。
 *
 * 所有文本内容都会经过 TokenBudget 裁剪，避免 prompt 过长。
 */
export function assembleChapterContext(
  command: NovelCommand,
  context: AdapterContext,
  budget: TokenBudget = DEFAULT_CHAPTER_GENERATION_BUDGET,
): ChapterContextPayload {
  const genre = context.genre ?? command.genre ?? '小说';
  const targetWordCount = context.targetWordCount ?? command.targetWordCount ?? 2000;
  const style = command.command ?? context.modelRole ?? undefined;
  const tone = undefined; // P3-C 未引入 tone 字段，预留

  // 合并正文与选中文本：选中文本优先级更高，作为直接写作依据
  const rawBody = command.selectedText || context.selectedText
    ? `${command.text}\n\n【重点参考段落】\n${command.selectedText ?? context.selectedText}`
    : command.text;

  const trimmedBody = trimContextToBudget(rawBody, budget);

  return {
    body: trimmedBody,
    genre,
    targetWordCount,
    style,
    tone,
    contextRefs: command.contextRefs,
    isExpansion: rawBody.length > 0 && !command.selectedText,
  };
}

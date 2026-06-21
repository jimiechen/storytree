/**
 * @file chat-debug/novel-debug-command-parser.ts
 * @description Chat Debug Command 解析器 — P2-A0
 */

import type { NovelCommand } from '../workflows/novel-command';
import type { AIWritingCommand } from '../types/editor';
import type { NovelDebugParseResult } from './novel-debug-log-types';

type DebugCommandType =
  | 'chapter.generate'
  | 'chapter.continue'
  | 'chapter.rewrite'
  | 'chapter.expand'
  | 'chapter.polish'
  | 'chapter.summarize'
  | 'info.extract';

const SUPPORTED_DEBUG_TYPES: DebugCommandType[] = [
  'chapter.generate',
  'chapter.continue',
  'chapter.rewrite',
  'chapter.expand',
  'chapter.polish',
  'chapter.summarize',
  'info.extract',
];

/**
 * 解析 Chat Debug 命令字符串。
 */
export function parseNovelDebugCommand(input: string): NovelDebugParseResult {
  const trimmed = input.trim();

  if (trimmed === '/novel help') {
    return { success: true, kind: 'help' };
  }

  if (!trimmed.startsWith('/novel ')) {
    return {
      success: false,
      errorCode: 'INVALID_PREFIX',
      message: 'Command must start with "/novel"',
    };
  }

  const tokens = trimmed.split(/\s+/);
  const prefix = tokens[0];
  const kind = tokens[1];

  if (prefix !== '/novel' || kind !== 'run') {
    return {
      success: false,
      errorCode: 'INVALID_KIND',
      message: 'Expected "/novel run <commandType> ..." or "/novel help"',
    };
  }

  const commandType = tokens[2] as DebugCommandType;
  if (!commandType || !SUPPORTED_DEBUG_TYPES.includes(commandType)) {
    return {
      success: false,
      errorCode: 'UNKNOWN_COMMAND',
      message: `Unsupported novel debug command type: ${commandType || '(empty)'}`,
    };
  }

  const params = parseParams(tokens.slice(3));

  if (!params.projectId) {
    return {
      success: false,
      errorCode: 'MISSING_PROJECT_ID',
      message: 'Missing required parameter: projectId',
    };
  }

  if (!params.chapterId) {
    return {
      success: false,
      errorCode: 'MISSING_CHAPTER_ID',
      message: 'Missing required parameter: chapterId',
    };
  }

  const command = buildNovelCommand(commandType, params);

  return { success: true, kind: 'run', command };
}

function parseParams(tokens: string[]): Record<string, string> {
  const params: Record<string, string> = {};
  for (const token of tokens) {
    const idx = token.indexOf('=');
    if (idx <= 0 || idx === token.length - 1) continue;
    const key = token.slice(0, idx);
    const value = token.slice(idx + 1);
    params[key] = decodeValue(value);
  }
  return params;
}

function decodeValue(value: string): string {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function buildNovelCommand(
  debugType: DebugCommandType,
  params: Record<string, string>,
): NovelCommand {
  const projectId = params.projectId;
  const chapterId = params.chapterId;
  const chapterIndex = parseChapterIndex(chapterId);
  const genre = params.genre || '玄幻';
  const targetWordCount = parseNumber(params.targetWordCount);
  const selectedText = params.selectedText;
  const text = selectedText || params.text || '';

  const base = {
    projectId,
    chapterId,
    chapterIndex,
    genre,
    text,
    selectedText,
    targetWordCount,
    createdAt: new Date(),
  };

  switch (debugType) {
    case 'chapter.generate':
      return { type: 'chapter.generate', ...base };
    case 'chapter.continue':
      return {
        ...base,
        type: 'chapter.rewrite',
        command: 'continue' as AIWritingCommand,
      };
    case 'chapter.rewrite':
      return { ...base, type: 'chapter.rewrite', command: 'rewrite' as AIWritingCommand };
    case 'chapter.expand':
      return { ...base, type: 'chapter.expand', command: 'expand' as AIWritingCommand };
    case 'chapter.polish':
      return { ...base, type: 'chapter.polish', command: 'polish' as AIWritingCommand };
    case 'chapter.summarize':
      return { ...base, type: 'chapter.summarize', command: 'summarize' as AIWritingCommand };
    case 'info.extract':
      return { ...base, type: 'chapter.extract-info' };
    default:
      throw new Error(`Unexpected debug command type: ${debugType}`);
  }
}

function parseChapterIndex(chapterId: string): number {
  const match = chapterId.match(/-(\d+)$/);
  if (match) return parseInt(match[1], 10);
  const digits = chapterId.match(/\d+/);
  if (digits) return parseInt(digits[0], 10);
  return 0;
}

function parseNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return undefined;
  return parsed;
}

/**
 * 返回帮助文本。
 */
export function getNovelDebugHelpText(): string {
  return [
    'NovelForge Chat Debug Console',
    '',
    'Usage:',
    '  /novel help',
    '  /novel run chapter.generate projectId=<id> chapterId=<id> [genre=<genre>] [targetWordCount=<n>] [dryRun=true]',
    '  /novel run chapter.continue projectId=<id> chapterId=<id> [selectedText=<text>] [dryRun=true]',
    '  /novel run chapter.rewrite projectId=<id> chapterId=<id> [selectedText=<text>] [dryRun=true]',
    '  /novel run chapter.expand projectId=<id> chapterId=<id> [selectedText=<text>] [dryRun=true]',
    '  /novel run chapter.polish projectId=<id> chapterId=<id> [selectedText=<text>] [dryRun=true]',
    '  /novel run chapter.summarize projectId=<id> chapterId=<id> [dryRun=true]',
    '  /novel run info.extract projectId=<id> chapterId=<id> [dryRun=true]',
    '',
    'Note: dryRun is always true in P2-A0; real LLM adapters are disabled.',
  ].join('\n');
}

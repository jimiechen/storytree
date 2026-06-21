/**
 * @file chat-debug/novel-debug-command-parser.test.ts
 * @description Chat Debug Command Parser 单元测试
 */

import { describe, it, expect } from 'vitest';
import { parseNovelDebugCommand } from './novel-debug-command-parser';

describe('NovelDebugCommandParser', () => {
  it('parses /novel help', () => {
    const result = parseNovelDebugCommand('/novel help');
    expect(result.success).toBe(true);
    expect(result.kind).toBe('help');
  });

  it('parses chapter.generate command', () => {
    const result = parseNovelDebugCommand(
      '/novel run chapter.generate projectId=proj-1 chapterId=chapter-2 genre=玄幻 targetWordCount=3000 dryRun=true',
    );
    expect(result.success).toBe(true);
    expect(result.kind).toBe('run');
    expect(result.command).toBeDefined();
    expect(result.command!.type).toBe('chapter.generate');
    expect(result.command!.projectId).toBe('proj-1');
    expect(result.command!.chapterId).toBe('chapter-2');
    expect(result.command!.chapterIndex).toBe(2);
    expect(result.command!.genre).toBe('玄幻');
    expect(result.command!.targetWordCount).toBe(3000);
  });

  it('parses chapter.continue command', () => {
    const result = parseNovelDebugCommand(
      '/novel run chapter.continue projectId=proj-1 chapterId=chapter-3 selectedText=他推开门 dryRun=true',
    );
    expect(result.success).toBe(true);
    expect(result.command!.type).toBe('chapter.rewrite');
    expect(result.command!.command).toBe('continue');
    expect(result.command!.selectedText).toBe('他推开门');
    expect(result.command!.text).toBe('他推开门');
  });

  it('parses info.extract command', () => {
    const result = parseNovelDebugCommand(
      '/novel run info.extract projectId=proj-1 chapterId=chapter-1 dryRun=true',
    );
    expect(result.success).toBe(true);
    expect(result.command!.type).toBe('chapter.extract-info');
  });

  it('returns error when projectId is missing', () => {
    const result = parseNovelDebugCommand('/novel run chapter.generate chapterId=chapter-1');
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('MISSING_PROJECT_ID');
  });

  it('returns error when chapterId is missing', () => {
    const result = parseNovelDebugCommand('/novel run chapter.generate projectId=proj-1');
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('MISSING_CHAPTER_ID');
  });

  it('returns error for unknown command type', () => {
    const result = parseNovelDebugCommand(
      '/novel run unknown.command projectId=proj-1 chapterId=chapter-1',
    );
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('UNKNOWN_COMMAND');
  });

  it('returns error for invalid prefix', () => {
    const result = parseNovelDebugCommand('/foo run chapter.generate projectId=proj-1 chapterId=chapter-1');
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INVALID_PREFIX');
  });

  it('strips quotes from parameter values', () => {
    const result = parseNovelDebugCommand(
      '/novel run chapter.continue projectId=proj-1 chapterId=chapter-1 selectedText="他推开门"',
    );
    expect(result.success).toBe(true);
    expect(result.command!.selectedText).toBe('他推开门');
  });

  it('parses adapter parameter for opencode-stub', () => {
    const result = parseNovelDebugCommand(
      '/novel run chapter.generate projectId=proj-1 chapterId=chapter-1 adapter=opencode-stub',
    );
    expect(result.success).toBe(true);
    expect(result.command!.adapterKind).toBe('opencode-stub');
  });

  it('parses adapter parameter for claudecode-stub', () => {
    const result = parseNovelDebugCommand(
      '/novel run chapter.generate projectId=proj-1 chapterId=chapter-1 adapter=claudecode-stub',
    );
    expect(result.success).toBe(true);
    expect(result.command!.adapterKind).toBe('claudecode-stub');
  });

  it('parses adapter parameter for real-llm', () => {
    const result = parseNovelDebugCommand(
      '/novel run chapter.generate projectId=proj-1 chapterId=chapter-1 adapter=real-llm',
    );
    expect(result.success).toBe(true);
    expect(result.command!.adapterKind).toBe('real-llm');
  });

  it('parses stream and dryRun parameters', () => {
    const result = parseNovelDebugCommand(
      '/novel run chapter.continue projectId=proj-1 chapterId=chapter-1 adapter=real-llm stream=true dryRun=true',
    );
    expect(result.success).toBe(true);
    expect(result.command!.adapterKind).toBe('real-llm');
    expect(result.stream).toBe(true);
    expect(result.dryRun).toBe(true);
  });

  it('defaults stream and dryRun to false', () => {
    const result = parseNovelDebugCommand(
      '/novel run chapter.generate projectId=proj-1 chapterId=chapter-1',
    );
    expect(result.success).toBe(true);
    expect(result.stream).toBe(false);
    expect(result.dryRun).toBe(false);
  });

  it('ignores invalid adapter parameter', () => {
    const result = parseNovelDebugCommand(
      '/novel run chapter.generate projectId=proj-1 chapterId=chapter-1 adapter=unknown',
    );
    expect(result.success).toBe(true);
    expect(result.command!.adapterKind).toBeUndefined();
  });
});

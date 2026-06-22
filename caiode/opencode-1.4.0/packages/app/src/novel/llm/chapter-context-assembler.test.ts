/**
 * @file llm/chapter-context-assembler.test.ts
 * @description ChapterContextAssembler 单元测试 — P3-C
 */

import { describe, it, expect } from 'vitest';
import { assembleChapterContext } from './chapter-context-assembler';
import { createChapterGenerateCommand } from '../workflows/novel-command';
import type { AdapterContext } from '../adapters/adapter-types';

describe('assembleChapterContext', () => {
  const budget = {
    maxPromptChars: 200,
    maxResponseChars: 100,
    reserveChars: 20,
  };

  it('should assemble empty draft as new chapter generation', () => {
    const command = createChapterGenerateCommand({
      chapterId: 'c1',
      projectId: 'p1',
      chapterIndex: 1,
      genre: '玄幻',
      text: '',
      targetWordCount: 3000,
    });
    const context: AdapterContext = { projectId: 'p1' };

    const result = assembleChapterContext(command, context, budget);

    expect(result.genre).toBe('玄幻');
    expect(result.targetWordCount).toBe(3000);
    expect(result.isExpansion).toBe(false);
    expect(result.body.wasTrimmed).toBe(false);
  });

  it('should mark expansion when text exists without selected text', () => {
    const command = createChapterGenerateCommand({
      chapterId: 'c1',
      projectId: 'p1',
      chapterIndex: 1,
      genre: '科幻',
      text: '已有正文开头。',
      targetWordCount: 2000,
    });
    const context: AdapterContext = { projectId: 'p1' };

    const result = assembleChapterContext(command, context, budget);

    expect(result.isExpansion).toBe(true);
    expect(result.body.text).toContain('已有正文开头。');
  });

  it('should trim long context and keep tail', () => {
    const longText = '起'.repeat(500);
    const command = createChapterGenerateCommand({
      chapterId: 'c1',
      projectId: 'p1',
      chapterIndex: 1,
      genre: '都市',
      text: longText,
    });
    const context: AdapterContext = { projectId: 'p1' };

    const result = assembleChapterContext(command, context, budget);

    expect(result.body.wasTrimmed).toBe(true);
    expect(result.body.text.length).toBeLessThanOrEqual(budget.maxPromptChars);
  });

  it('should use selected text when provided', () => {
    const command = createChapterGenerateCommand({
      chapterId: 'c1',
      projectId: 'p1',
      chapterIndex: 1,
      genre: '武侠',
      text: '前文内容。',
      selectedText: '重点段落。',
    });
    const context: AdapterContext = { projectId: 'p1' };

    const result = assembleChapterContext(command, context, budget);

    expect(result.body.text).toContain('重点段落。');
    expect(result.isExpansion).toBe(false);
  });
});

/**
 * @file llm/chapter-prompt-builder.test.ts
 * @description ChapterPromptBuilder 单元测试 — P3-C
 */

import { describe, it, expect } from 'vitest';
import { buildChapterGenerationPrompt } from './chapter-prompt-builder';
import { createChapterGenerateCommand } from '../workflows/novel-command';
import type { AdapterContext } from '../adapters/adapter-types';

describe('buildChapterGenerationPrompt', () => {
  const budget = {
    maxPromptChars: 300,
    maxResponseChars: 100,
    reserveChars: 30,
  };

  it('should include genre and target word count', () => {
    const command = createChapterGenerateCommand({
      chapterId: 'c1',
      projectId: 'p1',
      chapterIndex: 1,
      genre: '悬疑',
      text: '',
      targetWordCount: 2500,
    });
    const context: AdapterContext = { projectId: 'p1' };

    const result = buildChapterGenerationPrompt(command, context, budget);

    expect(result.prompt).toContain('类型：悬疑');
    expect(result.prompt).toContain('目标字数：约 2500 字');
    expect(result.systemPrompt.length).toBeGreaterThan(0);
    expect(result.targetWordCount).toBe(2500);
  });

  it('should include style hint when available', () => {
    const command = createChapterGenerateCommand({
      chapterId: 'c1',
      projectId: 'p1',
      chapterIndex: 1,
      genre: '言情',
      text: '已有内容。',
    });
    const context: AdapterContext = { projectId: 'p1', modelRole: 'rewrite' };

    const result = buildChapterGenerationPrompt(command, context, budget);

    expect(result.prompt).toContain('风格要求：rewrite');
  });

  it('should mark trimmed when context exceeds budget', () => {
    const command = createChapterGenerateCommand({
      chapterId: 'c1',
      projectId: 'p1',
      chapterIndex: 1,
      genre: '历史',
      text: '字'.repeat(500),
    });
    const context: AdapterContext = { projectId: 'p1' };

    const result = buildChapterGenerationPrompt(command, context, budget);

    expect(result.wasTrimmed).toBe(true);
    expect(result.prompt).toContain('系统已自动裁剪');
  });

  it('should indicate expansion when text exists', () => {
    const command = createChapterGenerateCommand({
      chapterId: 'c1',
      projectId: 'p1',
      chapterIndex: 1,
      genre: '奇幻',
      text: '故事开始。',
    });
    const context: AdapterContext = { projectId: 'p1' };

    const result = buildChapterGenerationPrompt(command, context, budget);

    expect(result.prompt).toContain('继续扩写');
  });
});

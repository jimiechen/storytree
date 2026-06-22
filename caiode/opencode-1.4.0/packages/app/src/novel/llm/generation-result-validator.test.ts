/**
 * @file llm/generation-result-validator.test.ts
 * @description GenerationResultValidator 单元测试 — P3-C
 */

import { describe, it, expect } from 'vitest';
import { validateGenerationResult } from './generation-result-validator';

describe('validateGenerationResult', () => {
  it('should pass for valid chapter text', () => {
    const text =
      '这是一段符合要求的小说正文，字数足够，没有格式问题。阳光洒在古老的青石街道上，行人来来往往，热闹非凡。' +
      '主角站在街角，望着远处的城墙，心中充满了复杂的情绪。他知道，今天将会是改变一切的日子。' +
      '风吹过他的衣襟，带来一丝凉意，也带走了最后一丝犹豫。他深吸一口气，迈出了坚定的步伐，向着未知的未来走去。' +
      '街道两旁的店铺已经开始忙碌，吆喝声此起彼伏，仿佛整个世界都在为他让路。';
    const result = validateGenerationResult(text, 200);
    expect(result.issues).toEqual([]);
    expect(result.valid).toBe(true);
    expect(result.wordCount).toBeGreaterThan(0);
    expect(result.issues).toHaveLength(0);
  });

  it('should detect empty response', () => {
    const result = validateGenerationResult('', 2000);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.code === 'EMPTY_RESPONSE')).toBe(true);
  });

  it('should detect too short result', () => {
    const text = '太短。';
    const result = validateGenerationResult(text, 2000);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.code === 'RESULT_TOO_SHORT')).toBe(true);
  });

  it('should detect markdown format issue', () => {
    const text = '# 标题\n\n正文内容。';
    const result = validateGenerationResult(text, 2000);
    expect(result.issues.some((i) => i.code === 'FORMAT_ISSUE')).toBe(true);
  });

  it('should detect preamble', () => {
    const text = '以下是续写：这是正文内容，足够长以避免过短检测。';
    const result = validateGenerationResult(text, 2000);
    expect(result.issues.some((i) => i.code === 'PREAMBLE_POSTAMBLE')).toBe(true);
  });

  it('should clean preamble from text', () => {
    const text = '以下是正文：这是一段小说正文。';
    const result = validateGenerationResult(text, 2000);
    expect(result.text).not.toMatch(/^以下是/);
  });
});

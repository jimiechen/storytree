/**
 * @file llm/token-budget.test.ts
 * @description TokenBudget 单元测试 — P3-C
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CHAPTER_GENERATION_BUDGET,
  trimContextToBudget,
  availablePromptChars,
  type TokenBudget,
} from './token-budget';

describe('token-budget', () => {
  const budget: TokenBudget = {
    maxPromptChars: 100,
    maxResponseChars: 200,
    reserveChars: 20,
  };

  it('should return original text when within budget', () => {
    const text = '这是一段很短的上下文。';
    const result = trimContextToBudget(text, budget);
    expect(result.wasTrimmed).toBe(false);
    expect(result.text).toBe(text);
    expect(result.originalLength).toBe(text.length);
    expect(result.trimmedLength).toBe(text.length);
  });

  it('should trim from head and keep tail when over budget', () => {
    const text = 'A'.repeat(200);
    const result = trimContextToBudget(text, budget);
    expect(result.wasTrimmed).toBe(true);
    expect(result.text.length).toBeLessThanOrEqual(budget.maxPromptChars);
    expect(result.text.endsWith('A')).toBe(true);
    expect(result.text.startsWith('…')).toBe(true);
  });

  it('should respect paragraph boundary when trimming', () => {
    const part1 = '第一段内容。\n\n';
    const part2 = '第二段内容。';
    const text = part1 + 'A'.repeat(200) + '\n\n' + part2;
    const result = trimContextToBudget(text, budget);
    expect(result.wasTrimmed).toBe(true);
    expect(result.text).toContain(part2);
    // 不应在第二段中间截断
    expect(result.text.endsWith(part2)).toBe(true);
  });

  it('should provide default budget constants', () => {
    expect(DEFAULT_CHAPTER_GENERATION_BUDGET.maxPromptChars).toBe(6000);
    expect(DEFAULT_CHAPTER_GENERATION_BUDGET.maxResponseChars).toBe(8000);
    expect(DEFAULT_CHAPTER_GENERATION_BUDGET.reserveChars).toBe(500);
  });

  it('should calculate available prompt chars', () => {
    expect(availablePromptChars(budget, 10)).toBe(70);
    expect(availablePromptChars(budget, 100)).toBe(0);
  });
});

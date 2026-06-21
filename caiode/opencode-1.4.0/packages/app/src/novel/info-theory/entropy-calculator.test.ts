/**
 * @file info-theory/entropy-calculator.test.ts
 * @description 自信息与熵计算单元测试 — P2-C
 */

import { describe, it, expect } from 'vitest';
import { calculateSelfInformation, calculateEntropy, normalizeScores } from './entropy-calculator';

describe('entropy-calculator', () => {
  it('calculates self information for common and rare probabilities', () => {
    expect(calculateSelfInformation(1)).toBe(0);
    expect(calculateSelfInformation(0.5)).toBe(1);
    expect(calculateSelfInformation(0.25)).toBe(2);
  });

  it('handles zero and negative probability safely', () => {
    const result = calculateSelfInformation(0);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBeGreaterThan(0);
  });

  it('clamps probability above 1', () => {
    expect(calculateSelfInformation(2)).toBe(0);
  });

  it('returns 0 for empty entropy input', () => {
    expect(calculateEntropy([])).toBe(0);
  });

  it('calculates entropy for uniform distribution', () => {
    expect(calculateEntropy([1, 1, 1, 1])).toBe(2);
  });

  it('calculates entropy for skewed distribution', () => {
    const entropy = calculateEntropy([3, 1]);
    expect(entropy).toBeGreaterThan(0);
    expect(entropy).toBeLessThan(1);
  });

  it('normalizes scores to 0..1 range', () => {
    expect(normalizeScores([1, 2, 3])).toEqual([0, 0.5, 1]);
  });

  it('returns zeros for equal values in normalizeScores', () => {
    expect(normalizeScores([5, 5, 5])).toEqual([0, 0, 0]);
  });
});

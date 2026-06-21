/**
 * @file info-theory/entropy-calculator.ts
 * @description 自信息与熵的 deterministic 计算 — P2-C
 */

const EPSILON = 1e-10;

function clampProbability(p: number): number {
  if (Number.isNaN(p) || !Number.isFinite(p)) return EPSILON;
  if (p <= 0) return EPSILON;
  if (p > 1) return 1;
  return p;
}

function safeNumber(n: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return n;
}

export function calculateSelfInformation(probability: number): number {
  const p = clampProbability(probability);
  if (p >= 1) return 0;
  return safeNumber(-Math.log2(p));
}

export function calculateEntropy(probabilities: number[]): number {
  if (probabilities.length === 0) return 0;

  const positive = probabilities.filter((p) => p > 0);
  if (positive.length === 0) return 0;

  const total = positive.reduce((sum, p) => sum + p, 0);
  if (total <= 0) return 0;

  let entropy = 0;
  for (const p of positive) {
    const normalized = p / total;
    entropy += normalized * Math.log2(normalized);
  }

  return safeNumber(-entropy);
}

export function normalizeScores(values: number[]): number[] {
  if (values.length === 0) return [];

  const safe = values.map(safeNumber);
  const min = Math.min(...safe);
  const max = Math.max(...safe);

  if (max <= min) return safe.map(() => 0);

  return safe.map((v) => (v - min) / (max - min));
}

/**
 * @file info-theory/information-auditor.ts
 * @description 章节信息审计与评分 — P2-C
 */

import { extractInformationAtoms } from './information-extractor';
import { buildInformationLinks } from './mutual-information-calculator';
import { calculateEntropy, calculateSelfInformation, normalizeScores } from './entropy-calculator';
import { splitTextIntoSegments } from './text-segmenter';
import type {
  ChapterInformationState,
  InformationAtom,
  InformationAuditWarning,
  InformationScore,
} from './information-types';

export interface AuditChapterInformationInput {
  projectId: string;
  chapterId: string;
  text: string;
  previousState?: ChapterInformationState;
  previousAtoms?: InformationAtom[];
}

function typeDistribution(atoms: InformationAtom[]): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const atom of atoms) {
    dist[atom.type] = (dist[atom.type] ?? 0) + 1;
  }
  return dist;
}

function entropyOfAtoms(atoms: InformationAtom[]): number {
  const dist = typeDistribution(atoms);
  const values = Object.values(dist);
  if (values.length === 0) return 0;
  return calculateEntropy(values);
}

function averageMutualInformationWithContext(
  atoms: InformationAtom[],
  previousAtoms: InformationAtom[],
): number {
  if (previousAtoms.length === 0 || atoms.length === 0) return 0;

  let total = 0;
  let count = 0;
  for (const atom of atoms) {
    for (const prev of previousAtoms) {
      if (atom.id === prev.id) continue;
      // 动态计算避免循环依赖
      const overlap = sharedCharRatio(atom.content, prev.content);
      total += overlap;
      count += 1;
    }
  }
  return count === 0 ? 0 : total / count;
}

function sharedCharRatio(a: string, b: string): number {
  const setA = new Set(a.split(''));
  const setB = new Set(b.split(''));
  let overlap = 0;
  for (const ch of setA) {
    if (setB.has(ch)) overlap += 1;
  }
  return overlap / Math.max(setA.size, setB.size, 1);
}

function averageNovelty(atoms: InformationAtom[]): number {
  if (atoms.length === 0) return 0;
  return atoms.reduce((sum, a) => sum + a.noveltyScore, 0) / atoms.length;
}

function averageSurprise(atoms: InformationAtom[]): number {
  if (atoms.length === 0) return 0;
  return atoms.reduce((sum, a) => sum + a.surpriseScore, 0) / atoms.length;
}

function clamp01(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function auditChapterInformation(input: AuditChapterInformationInput): ChapterInformationState {
  const { projectId, chapterId, text, previousAtoms = [] } = input;
  const atoms = extractInformationAtoms({ projectId, chapterId, text, previousAtoms });
  const links = buildInformationLinks(atoms, previousAtoms);

  const entropyBefore = entropyOfAtoms(previousAtoms);
  const entropyAfter = entropyOfAtoms(atoms);
  const entropyDelta = entropyAfter - entropyBefore;

  const typeCounts = typeDistribution(atoms);
  for (const atom of atoms) {
    const probability = (typeCounts[atom.type] ?? 1) / Math.max(atoms.length, 1);
    atom.selfInformation = calculateSelfInformation(probability);
  }

  const selfInformationTotal = atoms.reduce((sum, a) => sum + a.selfInformation, 0);
  const mutualInformationWithContext = averageMutualInformationWithContext(atoms, previousAtoms);
  const conditionalEntropyAfter = clamp01(entropyAfter - mutualInformationWithContext);

  const segments = splitTextIntoSegments(text);
  const densityScore = segments.length > 0 ? clamp01(atoms.length / segments.length) : 0;
  const redundancyScore = clamp01(1 - averageNovelty(atoms));
  const suspenseScore = averageSurprise(atoms);
  const progressionScore = clamp01(entropyDelta + 0.5);

  const warnings: InformationAuditWarning[] = [];
  if (densityScore < 0.2) {
    warnings.push({
      code: 'LOW_INFORMATION_DENSITY',
      message: '信息密度过低，文本可抽取的有效信息原子较少',
      severity: 'medium',
    });
  }
  if (redundancyScore > 0.6) {
    warnings.push({
      code: 'HIGH_REDUNDANCY',
      message: '冗余度过高，大量信息与上下文重复',
      severity: 'medium',
    });
  }
  if (previousAtoms.length > 0 && mutualInformationWithContext < 0.2) {
    warnings.push({
      code: 'LOW_CONTEXT_RELEVANCE',
      message: '与上下文关联较弱',
      severity: 'low',
    });
  }
  if (suspenseScore < 0.3) {
    warnings.push({
      code: 'WEAK_SUSPENSE',
      message: '悬念感不足',
      severity: 'low',
    });
  }
  if (progressionScore < 0.2) {
    warnings.push({
      code: 'NO_PROGRESS',
      message: '章节信息推进感不足',
      severity: 'high',
    });
  }

  return {
    projectId,
    chapterId,
    atoms,
    links,
    entropyBefore,
    entropyAfter,
    entropyDelta,
    selfInformationTotal,
    mutualInformationWithContext,
    conditionalEntropyAfter,
    densityScore,
    redundancyScore,
    suspenseScore,
    progressionScore,
    warnings,
  };
}

export function scoreChapterInformation(state: ChapterInformationState): InformationScore {
  const {
    entropyDelta,
    selfInformationTotal,
    atoms,
    links,
    densityScore,
    redundancyScore,
    suspenseScore,
    progressionScore,
  } = state;

  const base = Math.min(1, selfInformationTotal / 10);
  const auditScore = clamp01(
    densityScore * 0.2 +
      (1 - redundancyScore) * 0.2 +
      suspenseScore * 0.2 +
      progressionScore * 0.2 +
      base * 0.2,
  );

  return {
    auditScore,
    entropyDelta,
    selfInformationScore: clamp01(base),
    atomCount: atoms.length,
    linkCount: links.length,
    densityScore,
    redundancyScore,
    suspenseScore,
    progressionScore,
  };
}

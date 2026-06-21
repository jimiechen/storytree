/**
 * @file info-theory/information-extractor.ts
 * @description 基于规则的信息原子抽取 — P2-C
 *
 * 使用 deterministic heuristic，不调用 LLM，不读取文件。
 */

import { uid } from '../types/information-flow';
import type { InformationAtom, InformationAtomType } from './information-types';
import { splitTextIntoSegments } from './text-segmenter';

export interface ExtractInformationInput {
  projectId: string;
  chapterId: string;
  text: string;
  genre?: string;
  previousAtoms?: InformationAtom[];
}

const TYPE_RULES: { type: InformationAtomType; keywords: string[] }[] = [
  { type: 'location', keywords: ['来到', '城', '山', '门', '房间', '地点', '村', '镇', '谷', '殿', '府', '秘境'] },
  { type: 'conflict', keywords: ['战斗', '冲突', '追杀', '对抗', '敌', '战', '杀', '斗', '争', '决裂'] },
  { type: 'clue', keywords: ['秘密', '线索', '真相', '发现', '记忆', '谜团', '疑', '线索', '端倪'] },
  { type: 'world-rule', keywords: ['规则', '法则', '禁忌', '世界', '灵气', '天道', '境界', '法术', '阵法'] },
  { type: 'item', keywords: ['剑', '刀', '法宝', '丹药', '秘籍', '玉佩', '戒指', '宝物', '灵石', '武器'] },
  { type: 'relationship', keywords: ['朋友', '敌人', '师徒', '兄弟', '姐妹', '父子', '母子', '恋人', '仇'] },
  { type: 'emotion', keywords: ['怒', '喜', '悲', '惧', '恨', '爱', '绝望', '兴奋', '焦虑', '孤独'] },
  { type: 'theme', keywords: ['命运', '自由', '复仇', '救赎', '成长', '牺牲', '背叛', '信念'] },
  { type: 'character', keywords: ['他', '她', '主角', '少年', '女子', '老者', '敌人', '剑客', '修士'] },
];

const SUSPENSE_KEYWORDS = ['？', '?', '吗', '为什么', '怎么回事', '秘密', '真相', '突然', '然而', '却', '莫非', '难道', '竟然'];

function parseChapterIndex(chapterId: string): number {
  const match = /(\d+)/.exec(chapterId);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function detectType(segment: string): InformationAtomType {
  for (const rule of TYPE_RULES) {
    for (const keyword of rule.keywords) {
      if (segment.includes(keyword)) return rule.type;
    }
  }
  return 'event';
}

function calculateNovelty(
  segment: string,
  previousAtoms: InformationAtom[] | undefined,
  seenContents: Set<string>,
): number {
  if (seenContents.has(segment)) return 0.2;

  if (previousAtoms && previousAtoms.length > 0) {
    const lowered = segment.toLowerCase();
    for (const atom of previousAtoms) {
      const atomLower = atom.content.toLowerCase();
      if (lowered === atomLower || lowered.includes(atomLower) || atomLower.includes(lowered)) {
        return 0.2;
      }
    }
  }
  return 0.8;
}

function calculateRelevance(segment: string, previousAtoms: InformationAtom[] | undefined): number {
  if (!previousAtoms || previousAtoms.length === 0) return 0.5;

  const words = new Set(segment.split(''));
  let best = 0;
  for (const atom of previousAtoms) {
    const atomWords = new Set(atom.content.split(''));
    let overlap = 0;
    for (const w of words) {
      if (atomWords.has(w)) overlap += 1;
    }
    const score = overlap / Math.max(words.size, atomWords.size, 1);
    if (score > best) best = score;
  }
  return 0.4 + best * 0.6;
}

function calculateSurprise(segment: string): number {
  for (const keyword of SUSPENSE_KEYWORDS) {
    if (segment.includes(keyword)) return 0.7;
  }
  return 0.3;
}

export function extractInformationAtoms(input: ExtractInformationInput): InformationAtom[] {
  const { projectId, chapterId, text, genre = 'general', previousAtoms = [] } = input;
  const segments = splitTextIntoSegments(text);

  if (segments.length === 0) return [];

  const atoms: InformationAtom[] = [];
  const chapterIndex = parseChapterIndex(chapterId);
  const seenContents = new Set<string>();

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    const type = detectType(segment);
    const title = segment.slice(0, 20).trim() || segment.slice(0, 20);

    atoms.push({
      id: uid('info-atom', chapterIndex, genre, i),
      projectId,
      chapterId,
      type,
      title,
      content: segment,
      noveltyScore: calculateNovelty(segment, previousAtoms, seenContents),
      relevanceScore: calculateRelevance(segment, previousAtoms),
      surpriseScore: calculateSurprise(segment),
      selfInformation: 0, // 由 auditor 填充
    });

    seenContents.add(segment);
  }

  const typeCounts = new Map<InformationAtomType, number>();
  for (const atom of atoms) {
    typeCounts.set(atom.type, (typeCounts.get(atom.type) ?? 0) + 1);
  }
  const total = atoms.length;

  for (const atom of atoms) {
    const count = typeCounts.get(atom.type) ?? 1;
    const probability = count / total;
    atom.selfInformation = -Math.log2(Math.max(probability, 1e-10));
  }

  return atoms;
}

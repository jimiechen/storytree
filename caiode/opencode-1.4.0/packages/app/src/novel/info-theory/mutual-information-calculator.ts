/**
 * @file info-theory/mutual-information-calculator.ts
 * @description 面向小说结构的近似互信息与链接构建 — P2-C
 */

import type { InformationAtom, InformationLink, InformationLinkRelationType } from './information-types';

function tokenize(text: string): Set<string> {
  const tokens = new Set<string>();
  for (const char of text) {
    if (char.trim() && !['，', '。', '！', '？', '；', '、', '：', '“', '”', '（', '）', '\n', '\r'].includes(char)) {
      tokens.add(char);
    }
  }
  return tokens;
}

function jaccardOverlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection += 1;
  }
  return intersection / Math.max(a.size, b.size);
}

const RELATION_HINTS: { relation: InformationLinkRelationType; source: string[]; target: string[] }[] = [
  { relation: 'contradicts', source: ['不', '错', '假', '谎言'], target: ['真相', '事实', '原来', '其实'] },
  { relation: 'resolves', source: ['谜团', '秘密', '疑问'], target: ['真相', '答案', '解开', '揭晓'] },
  { relation: 'foreshadows', source: ['似乎', '预感', '也许', '将来'], target: ['后来', '终于', '果然', '竟然'] },
  { relation: 'depends-on', source: ['需要', '必须', '依靠', '只有'], target: ['才能', '才行', '否则'] },
];

function inferRelation(source: InformationAtom, target: InformationAtom): InformationLinkRelationType {
  for (const hint of RELATION_HINTS) {
    const srcHit = hint.source.some((k) => source.content.includes(k));
    const tgtHit = hint.target.some((k) => target.content.includes(k));
    if (srcHit && tgtHit) return hint.relation;
  }

  if (source.type === target.type) return 'echoes';
  if (source.type === 'clue' && target.type === 'event') return 'supports';
  if (source.type === 'world-rule' && target.type === 'event') return 'supports';
  if (source.type === 'character' && target.type === 'conflict') return 'supports';
  return 'supports';
}

export function calculateMutualInformation(source: InformationAtom, target: InformationAtom): number {
  if (source.id === target.id) return 0;

  const sourceTokens = tokenize(source.title + source.content);
  const targetTokens = tokenize(target.title + target.content);
  const overlap = jaccardOverlap(sourceTokens, targetTokens);

  const typeBonus = source.type === target.type ? 0.15 : 0;
  const typeSetBonus = source.type === target.type && source.type === 'clue' ? 0.1 : 0;

  return Math.min(1, overlap + typeBonus + typeSetBonus);
}

export function buildInformationLinks(
  atoms: InformationAtom[],
  previousAtoms?: InformationAtom[],
): InformationLink[] {
  const pool = previousAtoms ? [...previousAtoms, ...atoms] : atoms;
  if (pool.length < 2) return [];

  const links: InformationLink[] = [];
  let linkSeq = 0;

  for (let i = 0; i < pool.length; i += 1) {
    for (let j = i + 1; j < pool.length; j += 1) {
      const source = pool[i];
      const target = pool[j];
      if (source.id === target.id) continue;

      const mi = calculateMutualInformation(source, target);
      if (mi < 0.15) continue;

      links.push({
        id: `info-link-${linkSeq.toString(36).padStart(6, '0')}`,
        sourceAtomId: source.id,
        targetAtomId: target.id,
        relationType: inferRelation(source, target),
        strength: mi,
        mutualInformation: mi,
      });
      linkSeq += 1;
    }
  }

  return links;
}

/**
 * @file info-theory/mutual-information-calculator.test.ts
 * @description 互信息与链接构建单元测试 — P2-C
 */

import { describe, it, expect } from 'vitest';
import { calculateMutualInformation, buildInformationLinks } from './mutual-information-calculator';
import type { InformationAtom } from './information-types';

function makeAtom(id: string, content: string, type: InformationAtom['type']): InformationAtom {
  return {
    id,
    projectId: 'p1',
    chapterId: 'c1',
    type,
    title: content.slice(0, 20),
    content,
    noveltyScore: 0.8,
    relevanceScore: 0.5,
    surpriseScore: 0.3,
    selfInformation: 1,
  };
}

describe('mutual-information-calculator', () => {
  it('returns 0 for identical atoms', () => {
    const atom = makeAtom('a1', '主角来到青云城。', 'character');
    expect(calculateMutualInformation(atom, atom)).toBe(0);
  });

  it('returns value between 0 and 1 for related atoms', () => {
    const a = makeAtom('a1', '主角来到青云城。', 'character');
    const b = makeAtom('a2', '青云城位于大陆中心。', 'location');
    const mi = calculateMutualInformation(a, b);
    expect(mi).toBeGreaterThanOrEqual(0);
    expect(mi).toBeLessThanOrEqual(1);
  });

  it('returns empty links for single atom', () => {
    const links = buildInformationLinks([makeAtom('a1', '主角来到青云城。', 'character')]);
    expect(links).toEqual([]);
  });

  it('does not create self-loop links', () => {
    const atom = makeAtom('a1', '主角来到青云城。', 'character');
    const links = buildInformationLinks([atom, atom]);
    expect(links.every((l) => l.sourceAtomId !== l.targetAtomId)).toBe(true);
  });

  it('creates links when atoms share keywords', () => {
    const a = makeAtom('a1', '主角来到青云城。', 'character');
    const b = makeAtom('a2', '青云城城门紧闭。', 'location');
    const links = buildInformationLinks([a, b]);
    expect(links.length).toBeGreaterThan(0);
  });

  it('uses previousAtoms as context', () => {
    const previous = [makeAtom('p1', '主角来自小山村。', 'character')];
    const current = [makeAtom('c1', '主角来到青云城。', 'character')];
    const links = buildInformationLinks(current, previous);
    expect(links.length).toBeGreaterThan(0);
  });
});
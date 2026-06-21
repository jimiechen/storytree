/**
 * @file info-theory/information-extractor.test.ts
 * @description 信息原子抽取单元测试 — P2-C
 */

import { describe, it, expect } from 'vitest';
import { extractInformationAtoms } from './information-extractor';
import type { InformationAtom } from './information-types';

describe('information-extractor', () => {
  it('returns empty atoms for empty text', () => {
    const atoms = extractInformationAtoms({
      projectId: 'p1',
      chapterId: 'c1',
      text: '',
    });
    expect(atoms).toEqual([]);
  });

  it('extracts atoms from plain text', () => {
    const atoms = extractInformationAtoms({
      projectId: 'p1',
      chapterId: 'c1',
      text: '主角来到青云城。他发现了一个秘密。敌人正在追杀他。',
    });
    expect(atoms.length).toBeGreaterThan(0);
  });

  it('detects character atoms', () => {
    const atoms = extractInformationAtoms({
      projectId: 'p1',
      chapterId: 'c1',
      text: '主角开始思考。',
    });
    expect(atoms.some((a) => a.type === 'character')).toBe(true);
  });

  it('detects location atoms', () => {
    const atoms = extractInformationAtoms({
      projectId: 'p1',
      chapterId: 'c1',
      text: '他来到一座古城。',
    });
    expect(atoms.some((a) => a.type === 'location')).toBe(true);
  });

  it('detects conflict atoms', () => {
    const atoms = extractInformationAtoms({
      projectId: 'p1',
      chapterId: 'c1',
      text: '双方爆发了激烈的战斗。',
    });
    expect(atoms.some((a) => a.type === 'conflict')).toBe(true);
  });

  it('detects clue atoms', () => {
    const atoms = extractInformationAtoms({
      projectId: 'p1',
      chapterId: 'c1',
      text: '他找到了一条重要线索。',
    });
    expect(atoms.some((a) => a.type === 'clue')).toBe(true);
  });

  it('gives lower novelty for repeated content', () => {
    const previous: InformationAtom[] = [
      {
        id: 'prev-1',
        projectId: 'p1',
        chapterId: 'c0',
        type: 'event',
        title: '重复',
        content: '他来到青云城。',
        noveltyScore: 0.8,
        relevanceScore: 0.5,
        surpriseScore: 0.3,
        selfInformation: 1,
      },
    ];
    const atoms = extractInformationAtoms({
      projectId: 'p1',
      chapterId: 'c1',
      text: '他来到青云城。',
      previousAtoms: previous,
    });
    expect(atoms[0].noveltyScore).toBeLessThan(0.5);
  });

  it('raises surprise score for suspense text', () => {
    const atoms = extractInformationAtoms({
      projectId: 'p1',
      chapterId: 'c1',
      text: '为什么他会在这里？',
    });
    expect(atoms[0].surpriseScore).toBeGreaterThan(0.5);
  });
});

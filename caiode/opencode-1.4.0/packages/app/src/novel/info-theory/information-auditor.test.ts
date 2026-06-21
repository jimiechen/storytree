/**
 * @file info-theory/information-auditor.test.ts
 * @description 章节信息审计单元测试 — P2-C
 */

import { describe, it, expect } from 'vitest';
import { auditChapterInformation, scoreChapterInformation } from './information-auditor';
import type { InformationAtom } from './information-types';

describe('information-auditor', () => {
  it('returns low score and warnings for empty text', () => {
    const state = auditChapterInformation({
      projectId: 'p1',
      chapterId: 'c1',
      text: '',
    });
    expect(state.atoms).toEqual([]);
    expect(state.densityScore).toBe(0);
    expect(state.warnings.length).toBeGreaterThan(0);
  });

  it('returns atoms and score for normal text', () => {
    const state = auditChapterInformation({
      projectId: 'p1',
      chapterId: 'c1',
      text: '主角来到青云城，发现一个秘密。敌人正在追杀他。',
    });
    expect(state.atoms.length).toBeGreaterThan(0);
    expect(state.selfInformationTotal).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(state.entropyAfter)).toBe(true);
  });

  it('produces higher redundancy for repeated text', () => {
    const state = auditChapterInformation({
      projectId: 'p1',
      chapterId: 'c1',
      text: '他来到青云城。他来到青云城。他来到青云城。',
    });
    expect(state.redundancyScore).toBeGreaterThan(0.5);
  });

  it('produces higher suspense for suspenseful text', () => {
    const state = auditChapterInformation({
      projectId: 'p1',
      chapterId: 'c1',
      text: '为什么他会在这里？真相究竟是什么？',
    });
    expect(state.suspenseScore).toBeGreaterThan(0.5);
  });

  it('increases mutual information with context when previous atoms exist', () => {
    const previous: InformationAtom[] = [
      {
        id: 'prev-1',
        projectId: 'p1',
        chapterId: 'c0',
        type: 'location',
        title: '青云城',
        content: '青云城位于大陆中心。',
        noveltyScore: 0.8,
        relevanceScore: 0.5,
        surpriseScore: 0.3,
        selfInformation: 1,
      },
    ];
    const state = auditChapterInformation({
      projectId: 'p1',
      chapterId: 'c1',
      text: '主角来到青云城。',
      previousAtoms: previous,
    });
    expect(state.mutualInformationWithContext).toBeGreaterThan(0);
  });

  it('returns a structured score object', () => {
    const state = auditChapterInformation({
      projectId: 'p1',
      chapterId: 'c1',
      text: '主角来到青云城，发现一个秘密。',
    });
    const score = scoreChapterInformation(state);
    expect(score.auditScore).toBeGreaterThanOrEqual(0);
    expect(score.auditScore).toBeLessThanOrEqual(1);
    expect(score.atomCount).toBe(state.atoms.length);
    expect(score.linkCount).toBe(state.links.length);
  });
});
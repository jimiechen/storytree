/**
 * @file hooks/use-novel-info-theory-mapper.test.ts
 * @description Info-Theory → Info-Lite 映射单元测试 — P2-D / P3-B
 */

import { describe, it, expect } from 'vitest';
import { mapInfoTheoryToInfoFlow } from './use-novel-info-theory-mapper';
import type { ChapterInformationState, InformationScore } from '../info-theory/information-types';

function makeInfoTheoryState(overrides?: Partial<ChapterInformationState>): ChapterInformationState {
  return {
    chapterId: 'ch-1',
    projectId: 'proj-1',
    entropyBefore: 1.0,
    entropyAfter: 0.8,
    entropyDelta: -0.2,
    selfInformationTotal: 2.5,
    atoms: [],
    links: [],
    ...overrides,
  };
}

function makeScore(overrides?: Partial<InformationScore>): InformationScore {
  return {
    auditScore: 0.75,
    coherenceScore: 0.8,
    redundancyScore: 0.1,
    ...overrides,
  };
}

describe('mapInfoTheoryToInfoFlow', () => {
  it('空状态映射后保持章节与项目信息', () => {
    const state = makeInfoTheoryState();
    const score = makeScore();
    const result = mapInfoTheoryToInfoFlow(state, score, 3);

    expect(result.chapterId).toBe('ch-1');
    expect(result.projectId).toBe('proj-1');
    expect(result.entropyBefore).toBe(1.0);
    expect(result.entropyAfter).toBe(0.8);
    expect(result.entropyDelta).toBe(-0.2);
    expect(result.selfInformationScore).toBe(2.5);
    expect(result.auditScore).toBe(75);
    expect(result.newAtoms).toHaveLength(0);
    expect(result.newLinks).toHaveLength(0);
  });

  it('信息原子映射为 Info-Lite 原子并缩放重要性', () => {
    const state = makeInfoTheoryState({
      atoms: [
        {
          id: 'atom-1',
          projectId: 'proj-1',
          chapterId: 'ch-1',
          type: 'character',
          title: '主角',
          content: '主角出场',
          relevanceScore: 0.85,
          selfInformation: 1.2,
          entropyContribution: 0.1,
        },
        {
          id: 'atom-2',
          projectId: 'proj-1',
          type: 'clue',
          title: '线索',
          content: '隐藏线索',
          relevanceScore: 0.45,
          selfInformation: 0.8,
          entropyContribution: 0.2,
        },
      ],
    });
    const score = makeScore();
    const result = mapInfoTheoryToInfoFlow(state, score, 1);

    expect(result.newAtoms).toHaveLength(2);
    expect(result.newAtoms[0]).toMatchObject({
      id: 'atom-1',
      type: 'character-state',
      title: '主角',
      description: '主角出场',
      importance: 9,
      visibility: 'public',
      selfInformationScore: 1.2,
      plantedIn: 1,
    });
    expect(result.newAtoms[1]).toMatchObject({
      type: 'foreshadow',
      visibility: 'author-only',
      importance: 5,
    });
  });

  it('信息链接通过 atom title 映射 source/target title', () => {
    const state = makeInfoTheoryState({
      atoms: [
        {
          id: 'a1',
          projectId: 'proj-1',
          chapterId: 'ch-1',
          type: 'event',
          title: '事件A',
          content: '...',
          relevanceScore: 0.5,
          selfInformation: 0.5,
          entropyContribution: 0,
        },
        {
          id: 'a2',
          projectId: 'proj-1',
          chapterId: 'ch-1',
          type: 'event',
          title: '事件B',
          content: '...',
          relevanceScore: 0.5,
          selfInformation: 0.5,
          entropyContribution: 0,
        },
      ],
      links: [
        {
          id: 'link-1',
          projectId: 'proj-1',
          sourceAtomId: 'a1',
          targetAtomId: 'a2',
          relationType: 'foreshadows',
          strength: 0.9,
        },
      ],
    });
    const score = makeScore();
    const result = mapInfoTheoryToInfoFlow(state, score, 2);

    expect(result.newLinks).toHaveLength(1);
    expect(result.newLinks[0]).toMatchObject({
      id: 'link-1',
      sourceTitle: '事件A',
      targetTitle: '事件B',
      relationType: 'foreshadow',
      strength: 0.9,
      plantedIn: 2,
    });
  });

  it('缺失 atom title 时回退到 atom id', () => {
    const state = makeInfoTheoryState({
      atoms: [],
      links: [
        {
          id: 'link-1',
          projectId: 'proj-1',
          sourceAtomId: 'missing-a',
          targetAtomId: 'missing-b',
          relationType: 'supports',
          strength: 0.5,
        },
      ],
    });
    const score = makeScore();
    const result = mapInfoTheoryToInfoFlow(state, score, 0);

    expect(result.newLinks[0].sourceTitle).toBe('missing-a');
    expect(result.newLinks[0].targetTitle).toBe('missing-b');
  });

  it('未知 atom/link 类型回退到默认值', () => {
    const state = makeInfoTheoryState({
      atoms: [
        {
          id: 'atom-1',
          projectId: 'proj-1',
          chapterId: 'ch-1',
          // @ts-expect-error 测试未知类型回退
          type: 'unknown-atom-type',
          title: '未知',
          content: '...',
          relevanceScore: 0.5,
          selfInformation: 0.5,
          entropyContribution: 0,
        },
      ],
      links: [
        {
          id: 'link-1',
          projectId: 'proj-1',
          sourceAtomId: 'atom-1',
          targetAtomId: 'atom-1',
          // @ts-expect-error 测试未知关系回退
          relationType: 'unknown-link-type',
          strength: 0.5,
        },
      ],
    });
    const score = makeScore();
    const result = mapInfoTheoryToInfoFlow(state, score, 0);

    expect(result.newAtoms[0].type).toBe('fact');
    expect(result.newLinks[0].relationType).toBe('theme');
  });
});

/**
 * @file hooks/use-novel-info-theory-mapper.ts
 * @description Info-Theory 审计结果 → Info-Lite 视图状态映射 — P2-D / P3-B
 *
 * 为什么需要映射？
 * - info-theory 模块内部使用扩展字段（atoms/links/selfInformationTotal）。
 * - UI 的 ChapterInfoPanel 与 WorkflowEvents 仍消费 Info-Lite 结构（newAtoms/newLinks）。
 * - 在 Hook 边界做一次性转换，避免 UI 层同时维护两套类型。
 *
 * 映射规则：
 * - 信息原子：title/content 直接复用；relevanceScore 映射为 importance；
 *   selfInformation 映射为 selfInformationScore；visibility 默认 public。
 * - 信息链接：info-theory 只保存 atomId，需要查表得到 sourceTitle / targetTitle；
 *   relationType 按语义做保守映射，避免引入 Info-Lite 不支持的关系。
 * - auditScore 由 0-1 的 score.auditScore 缩放到 0-100，与 ChapterInfoPanel 显示一致。
 */

import type {
  ChapterInformationState as InfoTheoryChapterState,
  InformationScore,
  InformationAtom as InfoTheoryAtom,
  InformationLink as InfoTheoryLink,
  InformationAtomType as InfoTheoryAtomType,
  InformationLinkRelationType as InfoTheoryLinkType,
} from '../info-theory/information-types';
import type {
  ChapterInformationState as InfoFlowChapterState,
  InformationAtomType as InfoFlowAtomType,
  InformationLinkRelationType as InfoFlowLinkType,
} from '../types/information-flow';

const INFO_THEORY_ATOM_TYPE_MAP: Record<InfoTheoryAtomType, InfoFlowAtomType> = {
  character: 'character-state',
  event: 'event',
  location: 'world-rule',
  item: 'item',
  relationship: 'relationship',
  conflict: 'event',
  clue: 'foreshadow',
  emotion: 'emotion',
  'world-rule': 'world-rule',
  theme: 'theme',
};

function mapInfoTheoryAtomType(type: InfoTheoryAtomType): InfoFlowAtomType {
  return INFO_THEORY_ATOM_TYPE_MAP[type] ?? 'fact';
}

const INFO_THEORY_LINK_TYPE_MAP: Record<InfoTheoryLinkType, InfoFlowLinkType> = {
  supports: 'plot-cause',
  contradicts: 'mystery',
  foreshadows: 'foreshadow',
  resolves: 'plot-cause',
  'depends-on': 'character',
  echoes: 'emotional-echo',
};

function mapInfoTheoryLinkType(type: InfoTheoryLinkType): InfoFlowLinkType {
  return INFO_THEORY_LINK_TYPE_MAP[type] ?? 'theme';
}

export function mapInfoTheoryToInfoFlow(
  state: InfoTheoryChapterState,
  score: InformationScore,
  chapterIndex: number,
): InfoFlowChapterState {
  const atomTitleMap = new Map<string, string>();
  for (const atom of state.atoms) {
    atomTitleMap.set(atom.id, atom.title);
  }

  const newAtoms: InfoFlowChapterState['newAtoms'] = state.atoms.map((atom) => ({
    id: atom.id,
    projectId: atom.projectId,
    chapterId: atom.chapterId ?? state.chapterId,
    type: mapInfoTheoryAtomType(atom.type),
    title: atom.title,
    description: atom.content,
    importance: Math.max(1, Math.min(10, Math.round(atom.relevanceScore * 10))),
    visibility: atom.type === 'clue' ? 'author-only' : 'public',
    selfInformationScore: atom.selfInformation,
    plantedIn: chapterIndex,
  }));

  const newLinks: InfoFlowChapterState['newLinks'] = state.links.map((link) => ({
    id: link.id,
    projectId: state.projectId,
    sourceTitle: atomTitleMap.get(link.sourceAtomId) || link.sourceAtomId,
    targetTitle: atomTitleMap.get(link.targetAtomId) || link.targetAtomId,
    relationType: mapInfoTheoryLinkType(link.relationType),
    strength: link.strength,
    plantedIn: chapterIndex,
  }));

  return {
    chapterId: state.chapterId,
    projectId: state.projectId,
    entropyBefore: state.entropyBefore,
    entropyAfter: state.entropyAfter,
    entropyDelta: state.entropyDelta,
    selfInformationScore: state.selfInformationTotal,
    newAtoms,
    newLinks,
    auditScore: Math.round(score.auditScore * 100),
  };
}

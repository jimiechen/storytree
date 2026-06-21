/**
 * @file info-theory/information-types.ts
 * @description P2-C 信息论审计专用类型
 *
 * 与 `types/information-flow.ts` 中的 Info-Lite 类型并存；P2-C 使用本文件中的扩展结构进行
 * deterministic heuristic 审计，不替代现有类型。
 */

export type InformationAtomType =
  | 'character'
  | 'event'
  | 'location'
  | 'item'
  | 'relationship'
  | 'conflict'
  | 'clue'
  | 'emotion'
  | 'world-rule'
  | 'theme';

export interface InformationAtom {
  id: string;
  projectId: string;
  chapterId?: string;
  type: InformationAtomType;
  title: string;
  content: string;
  noveltyScore: number;
  relevanceScore: number;
  surpriseScore: number;
  selfInformation: number;
}

export type InformationLinkRelationType =
  | 'supports'
  | 'contradicts'
  | 'foreshadows'
  | 'resolves'
  | 'depends-on'
  | 'echoes';

export interface InformationLink {
  id: string;
  sourceAtomId: string;
  targetAtomId: string;
  relationType: InformationLinkRelationType;
  strength: number;
  mutualInformation: number;
}

export interface InformationAuditWarning {
  code:
    | 'LOW_INFORMATION_DENSITY'
    | 'HIGH_REDUNDANCY'
    | 'LOW_CONTEXT_RELEVANCE'
    | 'WEAK_SUSPENSE'
    | 'NO_PROGRESS';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ChapterInformationState {
  projectId: string;
  chapterId: string;

  atoms: InformationAtom[];
  links: InformationLink[];

  entropyBefore: number;
  entropyAfter: number;
  entropyDelta: number;

  selfInformationTotal: number;
  mutualInformationWithContext: number;
  conditionalEntropyAfter: number;

  densityScore: number;
  redundancyScore: number;
  suspenseScore: number;
  progressionScore: number;

  warnings: InformationAuditWarning[];
}

export interface InformationScore {
  auditScore: number;
  entropyDelta: number;
  selfInformationScore: number;
  atomCount: number;
  linkCount: number;
  densityScore: number;
  redundancyScore: number;
  suspenseScore: number;
  progressionScore: number;
}

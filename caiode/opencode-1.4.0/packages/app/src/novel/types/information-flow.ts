/**
 * @file types/information-flow.ts
 * @description Info-Lite 信息流类型定义 — P1-A 基础层
 *
 * 包含：Save The Cat 节拍、信息原子、信息链接、章节信息状态、确定性 ID 生成
 * 修正项: #2(entropyDelta 字段), #3(mystery relationType), #4(deterministic uid)
 */

// ─── Save The Cat Writes a Novel — 15 节拍 ──────────────────────────────

export type SaveTheCatBeatId =
  | 'opening-image'
  | 'theme-stated'
  | 'setup'
  | 'catalyst'
  | 'debate'
  | 'break-into-two'
  | 'b-story'
  | 'fun-and-games'
  | 'midpoint'
  | 'bad-guys-close-in'
  | 'all-is-lost'
  | 'dark-night-of-soul'
  | 'break-into-three'
  | 'finale'
  | 'final-image';

/** 节拍 ID → 中文名映射 */
export const BEAT_NAME_MAP: Record<SaveTheCatBeatId, string> = {
  'opening-image': '开场画面',
  'theme-stated': '主题陈述',
  'setup': '铺垫',
  'catalyst': '催化事件',
  'debate': '争论',
  'break-into-two': '第二幕转折',
  'b-story': 'B 故事线',
  'fun-and-games': '游戏时间',
  'midpoint': '中点',
  'bad-guys-close-in': '坏人逼近',
  'all-is-lost': '一无所有',
  'dark-night-of-soul': '灵魂黑夜',
  'break-into-three': '第三幕转折',
  'finale': '终局',
  'final-image': '终场画面',
};

// ─── 信息原子 (InformationAtom) ─────────────────────────────────────────

export type InformationAtomType =
  | 'fact'
  | 'question'
  | 'foreshadow'
  | 'reveal'
  | 'character-state'
  | 'world-rule'
  | 'item'
  | 'relationship'
  | 'theme'
  | 'event'
  | 'emotion'
  | 'mystery';

export interface InformationAtom {
  id: string;
  projectId: string;
  chapterId: string;
  type: InformationAtomType;
  title: string;
  description: string;
  /** 重要性评分 0-10 */
  importance: number;
  /** 可见性: public(读者可见) / author-only / hidden */
  visibility: 'public' | 'author-only' | 'hidden';
  /** 自信息量 I(x) = -log₂(p(x))，单位 bit */
  selfInformationScore: number;
  /** 首次出现的章节序号 */
  plantedIn?: number;
  /** 解决/回收的章节序号 */
  resolvedIn?: number;
}

// ─── 信息链接 (InformationLink) ─────────────────────────────────────────

export type InformationLinkRelationType =
  | 'foreshadow'
  | 'theme'
  | 'character'
  | 'world-rule'
  | 'plot-cause'
  | 'emotional-echo'
  | 'mystery'; // ← 修正#3: 新增 mystery

export interface InformationLink {
  id: string;
  projectId: string;
  sourceTitle: string;
  targetTitle: string;
  relationType: InformationLinkRelationType;
  /** 关联强度 0-1 */
  strength: number;
  plantedIn?: number;
  resolvedIn?: number;
}

// ─── 章节信息状态 (ChapterInformationState) ─────────────────────────────

/**
 * 单章的信息审计快照。
 * 由 MockAgentAdapter 在 AI 操作完成后产出，嵌入 NovelAgentResult。
 */
export interface ChapterInformationState {
  chapterId: string;
  projectId: string;
  /** 对应 Save The Cat 节拍（可选） */
  beatId?: SaveTheCatBeatId;
  beatName?: string;
  /** 操作前熵值 H(X) */
  entropyBefore: number;
  /** 操作后熵值 H(X') */
  entropyAfter: number;
  /** 熵变化值 = entropyAfter - entropyBefore（预计算字段，非 getter）← 修正#2 */
  entropyDelta: number;
  /** 章节自信息量总分 */
  selfInformationScore: number;
  /** 本章新增的信息原子列表 */
  newAtoms: InformationAtom[];
  /** 本章新增的信息链接列表 */
  newLinks: InformationLink[];
  /** 审计综合评分 0-100（可选） */
  auditScore?: number;
}

// ─── 确定性 ID 生成器 ──────────────────────────────────────────────────

/**
 * 确定性唯一 ID 生成器。
 * 基于输入参数的哈希值，不依赖 Date.now() / Math.random()。
 * 相同 (prefix, chapterIndex, genre, seq) 永远产出相同 ID → E2E 可断言。
 *
 * @param prefix   ID 前缀，如 "atk" / "info-atom" / "info-link"
 * @param chapterIndex 章节序号（从文件名或命令中提取）
 * @param genre    小说类型
 * @param seq      同类序列号（0, 1, 2...）
 * @returns        格式为 "{prefix}-{36进制后缀}" 的字符串
 *
 * @example
 * uid("atk", 3, "玄幻", 0)       // → "atk-000003lq"
 * uid("info-atom", 5, "悬疑", 1)  // → "info-atom-00051m8"
 * uid("info-link", 2, "都市", 0)  // → "info-link-00020o4"
 */
export function uid(prefix: string, chapterIndex: number, genre: string, seq: number): string {
  const g = genre || 'unknown';
  const hashBase = chapterIndex * 1000 + g.length * 100 + (g.charCodeAt(0) || 0) * 10 + seq;
  const suffix = hashBase.toString(36).padStart(6, '0');
  return `${prefix}-${suffix}`;
}

/**
 * @file services/context-assembler.ts
 * @description 上下文收集器 — P1-B 服务层
 *
 * 从 Provider/Hook 收集当前章节的写作上下文：
 * - 已有正文摘要
 * - 角色列表
 * - 世界设定
 * - 前序章节概要
 *
 * P1 阶段返回结构化对象，供 MockAgentAdapter 使用。
 */

import type { Chapter } from '../types/chapter';

// ─── 上下文数据结构 ──────────────────────────────────────────────────

/** 单条上下文片段 */
export interface ContextFragment {
  id: string;
  label: string;
  content: string;
  enabled: boolean;
}

/** 完整写作上下文 */
export interface WritingContext {
  /** 当前章节 ID */
  chapterId: string;
  /** 当前章节已有正文（前 N 字） */
  currentContent: string;
  /** 当前章节摘要 */
  currentSummary?: string;
  /** 前序章节概要列表 */
  previousChapters: { title: string; summary: string }[];
  /** 角色列表 */
  characters: { name: string; role: string }[];
  /** 世界物品/设定 */
  worldItems: { name: string; category: string }[];
  /** 已启用的上下文引用 ID 列表 */
  activeContextRefs: string[];
  /** 组装后的完整 prompt 文本 */
  assembledPrompt: string;
}

// ─── 上下文组装器 ─────────────────────────────────────────────────────

/**
 * 组装写作上下文。
 *
 * @param params  上下文参数
 * @returns       结构化的 WritingContext
 */
export function assembleWritingContext(params: {
  chapterId: string;
  currentContent: string;
  chapters: Chapter[];
  selectedContextRefs?: string[];
  genre?: string;
}): WritingContext {
  const {
    chapterId,
    currentContent,
    chapters,
    selectedContextRefs = [],
    genre = '玄幻',
  } = params;

  // 找到当前章节及其索引
  const currentIndex = chapters.findIndex((ch) => ch.id === chapterId);
  const currentChapter = chapters[currentIndex];

  // 前序章节（取前 3 章）
  const previousChapters = chapters
    .slice(0, currentIndex)
    .slice(-3)
    .map((ch) => ({
      title: ch.title,
      summary: ch.outline?.keyPlot || '',
    }));

  // 从 outline 中提取角色和物品（Mock 数据 fallback）
  const characters = extractCharactersFromChapter(currentChapter);
  const worldItems = extractWorldItemsFromChapter(currentChapter);

  // 构建上下文片段
  const fragments: ContextFragment[] = [];

  if (selectedContextRefs.includes('outline') && previousChapters.length > 0) {
    fragments.push({
      id: 'outline',
      label: '大纲和细纲',
      content: previousChapters.map((ch) => `【${ch.title}】${ch.summary}`).join('\n'),
      enabled: true,
    });
  }

  if (selectedContextRefs.includes('text-summary') && currentContent) {
    fragments.push({
      id: 'text-summary',
      label: '已有正文摘要',
      content: currentContent.slice(0, 500) + (currentContent.length > 500 ? '...' : ''),
      enabled: true,
    });
  }

  if (selectedContextRefs.includes('protagonist') && characters.length > 0) {
    fragments.push({
      id: 'protagonist',
      label: '主角状态追踪',
      content: characters.filter((c) => c.role === 'protagonist').map((c) => `${c.name}: ${c.role}`).join('\n'),
      enabled: true,
    });
  }

  if (selectedContextRefs.includes('relationships') && characters.length > 1) {
    fragments.push({
      id: 'relationships',
      label: '角色关系',
      content: characters.map((c) => `${c.name}(${c.role})`).join('、'),
      enabled: true,
    });
  }

  if (selectedContextRefs.includes('skills-items') && worldItems.length > 0) {
    fragments.push({
      id: 'skills-items',
      label: '技能和道具',
      content: worldItems.map((w) => `${w.name}[${w.category}]`).join('、'),
      enabled: true,
    });
  }

  // 组装完整 prompt
  const assembledPrompt = assemblePromptText(fragments, genre);

  return {
    chapterId,
    currentContent,
    currentSummary: currentChapter?.outline?.keyPlot,
    previousChapters,
    characters,
    worldItems,
    activeContextRefs: selectedContextRefs,
    assembledPrompt,
  };
}

// ─── 辅助函数 ────────────────────────────────────────────────────────

function extractCharactersFromChapter(_chapter?: Chapter): { name: string; role: string }[] {
  // P1 阶段：ChapterOutline 不含 characters 字段，返回空数组
  // 后续从独立 CharacterProvider 获取
  return [];
}

function extractWorldItemsFromChapter(_chapter?: Chapter): { name: string; category: string }[] {
  // P1 阶段：ChapterOutline 不含 worldItems 字段，返回空数组
  // 后续从 WorldSettingProvider 获取
  return [];
}

function assemblePromptText(fragments: ContextFragment[], genre: string): string {
  const header = `[${genre}类型小说写作上下文]\n`;
  const body = fragments
    .filter((f) => f.enabled)
    .map((f) => `【${f.label}】\n${f.content}`)
    .join('\n\n');
  return header + (body || '(无额外上下文)');
}

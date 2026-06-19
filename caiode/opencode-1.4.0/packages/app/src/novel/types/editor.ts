/**
 * @file types/editor.ts
 * @description 章节编辑器相关类型定义
 */

export type { ChapterStatus } from './chapter'

import type { ChapterInformationState } from './information-flow';

export interface AIExtractedInfo {
  chapterId: string
  summary: string
  newCharacters: string[]
  protagonistStatus: string
  acquiredItems: string[]
  keyEvents: string
  extractedAt: string
  /** Info-Lite 信息审计状态 */
  informationState?: ChapterInformationState
}

export type AIWritingCommand = 'continue' | 'rewrite' | 'expand' | 'polish' | 'summarize'

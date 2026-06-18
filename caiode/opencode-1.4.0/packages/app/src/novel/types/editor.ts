/**
 * @file types/editor.ts
 * @description 章节编辑器相关类型定义
 */

export type { ChapterStatus } from './chapter'

export interface AIExtractedInfo {
  chapterId: string
  summary: string
  newCharacters: string[]
  protagonistStatus: string
  acquiredItems: string[]
  keyEvents: string
  extractedAt: string
}

export type AIWritingCommand = 'continue' | 'rewrite' | 'expand' | 'polish' | 'summarize'

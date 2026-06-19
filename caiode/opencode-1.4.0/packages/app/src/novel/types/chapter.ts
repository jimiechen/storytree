export type ChapterStatus = 'draft' | 'revising' | 'completed' | 'published';

export interface ChapterOutline {
  goal: string;
  conflict: string;
  keyPlot: string;
}

export interface AISuggestion {
  id: string;
  taskId: string;
  text: string;
  status: 'pending' | 'accepted' | 'saved' | 'discarded';
  createdAt: Date;
}

import type { ChapterInformationState } from './information-flow';

export interface Chapter {
  id: string;
  projectId: string;
  title: string;
  orderIndex: number;
  status: ChapterStatus;
  wordCount: number;
  content: string;
  outline: ChapterOutline;
  aiSuggestions?: AISuggestion[];
  /** Info-Lite 信息审计状态（AI 操作后填充） */
  informationState?: ChapterInformationState;
  createdAt: string;
  updatedAt: string;
  lastEditedAt?: Date;
}

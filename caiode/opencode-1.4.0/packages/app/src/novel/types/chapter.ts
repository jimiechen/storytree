export type ChapterStatus = 'draft' | 'revising' | 'completed';

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
  lastEditedAt?: Date;
}

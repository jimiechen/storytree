export interface Project {
  id: string;
  name: string;
  genre: string;
  description: string;
  totalWordCount: number;
  chapterCount: number;
  characterCount: number;
  lastUpdated: Date;
  status: 'active' | 'archived' | 'draft';
}

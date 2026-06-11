import type { Chapter, ChapterStatus, AISuggestion } from '../types';
import type { INovelChapterProvider } from './index';
import type { ProviderError } from '../types/provider-error';
import { mockChapters } from '../mock-data';
import { mockDelay } from '../utils/mock-delay';

export class NovelChapterProvider implements INovelChapterProvider {
  private chapters = new Map<string, Chapter>(
    mockChapters.map(c => [c.id, { ...c, aiSuggestions: c.aiSuggestions ? [...c.aiSuggestions] : [] }])
  );

  async listChapters(projectId: string): Promise<Chapter[]> {
    await mockDelay(100);
    return Array.from(this.chapters.values())
      .filter(c => c.projectId === projectId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(c => ({ ...c }));
  }

  async getChapter(id: string): Promise<Chapter | null> {
    await mockDelay(100);
    const chapter = this.chapters.get(id);
    return chapter ? { ...chapter } : null;
  }

  async saveChapter(id: string, content: string): Promise<void> {
    const chapter = this.chapters.get(id);
    if (!chapter) {
      throw { code: 'NOT_FOUND', message: `Chapter ${id} not found` } as ProviderError;
    }

    chapter.content = content;
    chapter.wordCount = content.length;
    if (chapter.status === 'draft') {
      chapter.status = 'revising';
    }
    await mockDelay(200);
  }

  async updateChapterStatus(id: string, status: ChapterStatus): Promise<void> {
    const chapter = this.chapters.get(id);
    if (!chapter) {
      throw { code: 'NOT_FOUND', message: `Chapter ${id} not found` } as ProviderError;
    }
    chapter.status = status;
    await mockDelay(100);
  }

  async addAISuggestion(chapterId: string, suggestion: AISuggestion): Promise<void> {
    const chapter = this.chapters.get(chapterId);
    if (!chapter) {
      throw { code: 'NOT_FOUND', message: `Chapter ${chapterId} not found` } as ProviderError;
    }
    if (!chapter.aiSuggestions) {
      chapter.aiSuggestions = [];
    }
    chapter.aiSuggestions.push(suggestion);
    await mockDelay(100);
  }

  async acceptSuggestion(chapterId: string, suggestionId: string): Promise<void> {
    const chapter = this.chapters.get(chapterId);
    if (!chapter) {
      throw { code: 'NOT_FOUND', message: `Chapter ${chapterId} not found` } as ProviderError;
    }

    const suggestion = chapter.aiSuggestions?.find(s => s.id === suggestionId);
    if (!suggestion) {
      throw { code: 'NOT_FOUND', message: `Suggestion ${suggestionId} not found` } as ProviderError;
    }

    chapter.content += '\n\n' + suggestion.text;
    suggestion.status = 'accepted';
    chapter.wordCount = chapter.content.length;
    await mockDelay(100);
  }
}

import type { Chapter, ChapterStatus, AISuggestion, ChapterExtractedInfo } from '../types';
import type { INovelChapterProvider } from './index';
import type { ProviderError } from '../types/provider-error';
import type { ChapterInformationState } from '../types/information-flow';
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

  async saveChapterSummary(id: string, summary: string): Promise<void> {
    const chapter = this.chapters.get(id);
    if (!chapter) {
      throw { code: 'NOT_FOUND', message: `Chapter ${id} not found` } as ProviderError;
    }
    chapter.summary = summary;
    await mockDelay(100);
  }

  async saveChapterWordCount(id: string, wordCount: number): Promise<void> {
    const chapter = this.chapters.get(id);
    if (!chapter) {
      throw { code: 'NOT_FOUND', message: `Chapter ${id} not found` } as ProviderError;
    }
    chapter.wordCount = wordCount;
    await mockDelay(100);
  }

  async saveChapterInformationState(id: string, state: ChapterInformationState): Promise<void> {
    const chapter = this.chapters.get(id);
    if (!chapter) {
      throw { code: 'NOT_FOUND', message: `Chapter ${id} not found` } as ProviderError;
    }
    chapter.informationState = state;
    await mockDelay(100);
  }

  async saveChapterExtractedInfo(id: string, info: ChapterExtractedInfo): Promise<void> {
    const chapter = this.chapters.get(id);
    if (!chapter) {
      throw { code: 'NOT_FOUND', message: `Chapter ${id} not found` } as ProviderError;
    }
    chapter.extractedInfo = info;
    await mockDelay(100);
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

  // ─── PAGE-10 扩展：CRUD 完整接口（Mock 实现） ─────────────────

  async createChapter(projectId: string, input: { title: string; orderIndex?: number; content?: string }): Promise<Chapter> {
    const id = `ch-mock-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const chapter: Chapter = {
      id,
      projectId,
      title: input.title,
      orderIndex: input.orderIndex ?? this.chapters.size + 1,
      status: 'draft',
      wordCount: input.content?.length ?? 0,
      content: input.content ?? '',
      outline: { goal: '', conflict: '', keyPlot: '' },
      createdAt: now,
      updatedAt: now,
    };
    this.chapters.set(id, { ...chapter, aiSuggestions: [] });
    await mockDelay(100);
    return { ...chapter };
  }

  async deleteChapter(id: string): Promise<void> {
    const chapter = this.chapters.get(id);
    if (!chapter) {
      throw { code: 'NOT_FOUND', message: `Chapter ${id} not found` } as ProviderError;
    }
    // Mock: 标记为已删除（从 Map 中移除，模拟软删除）
    this.chapters.delete(id);
    await mockDelay(100);
  }

  async listDeletedChapters(_projectId: string): Promise<Chapter[]> {
    // Mock 不维护回收站，返回空列表
    await mockDelay(100);
    return [];
  }

  async restoreChapter(_id: string): Promise<void> {
    // Mock 不维护回收站，无操作
    await mockDelay(100);
  }
}

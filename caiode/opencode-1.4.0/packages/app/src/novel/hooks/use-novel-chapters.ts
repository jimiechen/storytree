import { createSignal, createMemo, createEffect } from 'solid-js';
import type { Chapter, AISuggestion, ChapterExtractedInfo } from '../types';
import type { ChapterInformationState } from '../types/information-flow';
import { NovelChapterProvider } from '../providers/providers-index';

const chapterProvider = new NovelChapterProvider();

export function useNovelChapters(projectId: () => string) {
  const [selectedChapterId, setSelectedChapterId] = createSignal<string>('');

  // 章节列表用普通 signal 管理，避免 createResource refetch 不触发下游 memo 的问题
  const [chapters, setChapters] = createSignal<Chapter[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<Error | null>(null);

  const loadChapters = async () => {
    const id = projectId();
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const list = await chapterProvider.listChapters(id);
      setChapters(list);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  // 项目 ID 变化时自动加载
  createEffect(() => {
    void loadChapters();
  });

  // 当前选中的章节（从列表中查找，始终是副本）
  const selectedChapter = createMemo(() => {
    const id = selectedChapterId();
    return chapters().find(c => c.id === id) ?? null;
  });

  // 保存章节内容
  const saveChapter = async (id: string, content: string): Promise<void> => {
    await chapterProvider.saveChapter(id, content);
    // 直接更新本地 signal，确保 UI 立即响应
    setChapters(prev => prev.map(c => (c.id === id ? { ...c, content, wordCount: content.length } : c)));
  };

  // 保存章节摘要
  const saveChapterSummary = async (id: string, summary: string): Promise<void> => {
    await chapterProvider.saveChapterSummary(id, summary);
    setChapters(prev => prev.map(c => (c.id === id ? { ...c, summary } : c)));
  };

  // 保存章节字数
  const saveChapterWordCount = async (id: string, wordCount: number): Promise<void> => {
    await chapterProvider.saveChapterWordCount(id, wordCount);
    setChapters(prev => prev.map(c => (c.id === id ? { ...c, wordCount } : c)));
  };

  // 保存章节信息审计状态
  const saveChapterInformationState = async (id: string, state: ChapterInformationState): Promise<void> => {
    await chapterProvider.saveChapterInformationState(id, state);
    setChapters(prev => prev.map(c => (c.id === id ? { ...c, informationState: state } : c)));
  };

  // 保存 AI 提取的结构化信息
  const saveChapterExtractedInfo = async (id: string, info: ChapterExtractedInfo): Promise<void> => {
    await chapterProvider.saveChapterExtractedInfo(id, info);
    setChapters(prev => prev.map(c => (c.id === id ? { ...c, extractedInfo: info } : c)));
  };

  // 接受 AI 建议
  const acceptSuggestion = async (chapterId: string, suggestionId: string): Promise<void> => {
    await chapterProvider.acceptSuggestion(chapterId, suggestionId);
    await loadChapters();
  };

  // 添加 AI 建议（保存为建议，不直接追加到正文）
  const addAISuggestion = async (chapterId: string, suggestion: AISuggestion): Promise<void> => {
    await chapterProvider.addAISuggestion(chapterId, suggestion);
    await loadChapters();
  };

  // 切换选中章节
  const selectChapter = (id: string) => {
    setSelectedChapterId(id);
  };

  return {
    chapters,
    selectedChapter,
    selectedChapterId,
    loading,
    error,
    selectChapter,
    saveChapter,
    saveChapterSummary,
    saveChapterWordCount,
    saveChapterInformationState,
    saveChapterExtractedInfo,
    acceptSuggestion,
    addAISuggestion,
    refetch: loadChapters,
  };
}

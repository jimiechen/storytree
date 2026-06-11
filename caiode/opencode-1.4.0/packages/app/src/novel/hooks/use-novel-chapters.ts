import { createSignal, createResource } from 'solid-js';
import type { Chapter, AISuggestion } from '../types';
import { NovelChapterProvider } from '../providers/providers-index';

const chapterProvider = new NovelChapterProvider();

export function useNovelChapters(projectId: () => string) {
  const [selectedChapterId, setSelectedChapterId] = createSignal<string>('');

  // 章节列表资源（自动响应 projectId 变化）
  const [chaptersResource, { refetch }] = createResource(projectId, async (id) => {
    return chapterProvider.listChapters(id);
  });

  // 当前选中的章节（从列表中查找，始终是副本）
  const selectedChapter = () => {
    const id = selectedChapterId();
    if (!id) return null;
    return chaptersResource()?.find(c => c.id === id) ?? null;
  };

  // 保存章节内容
  const saveChapter = async (id: string, content: string): Promise<void> => {
    await chapterProvider.saveChapter(id, content);
    await refetch();
  };

  // 接受 AI 建议
  const acceptSuggestion = async (chapterId: string, suggestionId: string): Promise<void> => {
    await chapterProvider.acceptSuggestion(chapterId, suggestionId);
    await refetch();
  };

  // 添加 AI 建议（保存为建议，不直接追加到正文）
  const addAISuggestion = async (chapterId: string, suggestion: AISuggestion): Promise<void> => {
    await chapterProvider.addAISuggestion(chapterId, suggestion);
    await refetch();
  };

  // 切换选中章节
  const selectChapter = (id: string) => {
    setSelectedChapterId(id);
  };

  // 状态派生
  const loading = chaptersResource.loading;
  const error = chaptersResource.error;
  const chapters = chaptersResource;

  return {
    chapters,
    selectedChapter,
    selectedChapterId,
    loading,
    error,
    selectChapter,
    saveChapter,
    acceptSuggestion,
    addAISuggestion,
    refetch
  };
}

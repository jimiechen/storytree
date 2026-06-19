import { createSignal } from 'solid-js';
import type { WorkspacePanelId } from '../types/workspace';
import { useNovelProject } from './use-novel-project';
import { useNovelChapters } from './use-novel-chapters';

/**
 * Workspace 状态管理 Hook
 * 统一管理面板显隐状态和项目上下文
 */
export function useWorkspace(projectId: () => string) {
  const { project } = useNovelProject();
  const {
    chapters,
    selectedChapter,
    selectedChapterId,
    loading,
    selectChapter,
    saveChapter,
    saveChapterSummary,
    saveChapterWordCount,
    saveChapterInformationState,
    saveChapterExtractedInfo,
    acceptSuggestion,
    addAISuggestion
  } = useNovelChapters(projectId);

  const [visiblePanels, setVisiblePanels] = createSignal<Set<WorkspacePanelId>>(
    new Set(['character', 'ai-task', 'generation'])
  );

  const [isLogDrawerOpen, setIsLogDrawerOpen] = createSignal(false);

  const togglePanel = (id: WorkspacePanelId) => {
    setVisiblePanels(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isPanelVisible = (id: WorkspacePanelId): boolean => visiblePanels().has(id);

  return {
    // 项目与章节数据
    project,
    projectId,
    chapters,
    selectedChapter,
    selectedChapterId,
    loading,

    // 章节操作
    selectChapter,
    saveChapter,
    saveChapterSummary,
    saveChapterWordCount,
    saveChapterInformationState,
    saveChapterExtractedInfo,
    acceptSuggestion,
    addAISuggestion,

    // 面板状态
    visiblePanels,
    togglePanel,
    isPanelVisible,

    // 日志抽屉
    isLogDrawerOpen,
    setIsLogDrawerOpen,
  };
}

import { createSignal, createResource } from 'solid-js';
import type { OutlineViewMode, OutlineNode, ChapterOutline } from '../types';
import { NovelOutlineProvider } from '../providers/novel-outline';

const outlineProvider = new NovelOutlineProvider();

/**
 * 大纲数据流 Hook
 *
 * 职责：
 * - 管理三种视图模式切换（outline / detail / chapter）
 * - 加载大纲树数据（响应 projectId 变化）
 * - 提供细纲查询和 AI 生成入口
 */
export function useNovelOutline(projectId: () => string) {
  const [viewMode, setViewMode] = createSignal<OutlineViewMode>('chapter');

  // 大纲树资源（自动响应 projectId 变化重新加载）
  const [outlines, { refetch }] = createResource(projectId, async (id) => {
    return outlineProvider.listOutlines(id);
  });

  /** 切换视图模式 */
  const switchView = (mode: OutlineViewMode) => {
    setViewMode(mode);
  };

  /** 获取某章节的细纲 */
  const getDetailOutline = async (chapterId: string): Promise<ChapterOutline | null> => {
    return outlineProvider.getDetailOutline(chapterId);
  };

  /** 触发 AI 生成/刷新大纲 */
  const generateOutline = async (): Promise<void> => {
    await outlineProvider.generateOutline(projectId());
    await refetch();
  };

  return {
    viewMode,
    setViewMode: switchView,
    outlines,
    loading: outlines.loading,
    error: outlines.error,
    refetchOutlines: refetch,
    getDetailOutline,
    generateOutline,
  };
}

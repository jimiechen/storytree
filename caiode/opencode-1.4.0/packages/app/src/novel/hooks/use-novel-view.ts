import { createSignal } from 'solid-js';
import type { NovelView } from '../types/novel-view';

const DEFAULT_VIEW: NovelView = 'bookshelf';

/**
 * 视图状态管理 Hook
 * 管理 NovelView 状态机的当前视图和切换
 */
export function useNovelView() {
  const [currentView, setCurrentView] = createSignal<NovelView>(DEFAULT_VIEW);
  const setView = (view: NovelView) => setCurrentView(view);
  return { currentView, setView };
}

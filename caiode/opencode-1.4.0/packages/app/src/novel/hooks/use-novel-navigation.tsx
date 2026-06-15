import { createContext, useContext, createSignal, onMount, type JSX } from 'solid-js';
import { useNovelView } from './use-novel-view';
import { useSearchParams } from '@solidjs/router';
import type { NovelView } from '../types/novel-view';
import type { NovelModal } from '../types/novel-modal';

/** 扩展视图：NovelView + 批次 4 占位页面 */
type ExtendedView = NovelView | 'character-panel' | 'world-setting' | 'profile' | 'tutorial';

interface NovelNavigationState {
  currentView: () => ExtendedView;
  currentModal: () => NovelModal | null;
  isModalOpen: () => boolean;
  openView: (view: ExtendedView) => void;
  openModal: (modal: NovelModal) => void;
  closeModal: () => void;
  projectId: () => string;
}

const NovelNavigationContext = createContext<NovelNavigationState>();

/**
 * NovelNavigationProvider — 全局导航状态管理
 *
 * 职责：
 * - 管理当前视图（支持 NovelView + 扩展占位视图）
 * - 管理当前弹框（NovelModal）
 * - 底层代理 useNovelView 的 URL 同步和 projectId
 *
 * 必须包裹在 NovelViewProvider 内部使用。
 */
export function NovelNavigationProvider(props: { children: JSX.Element }) {
  const novelView = useNovelView();
  const [, setSearchParams] = useSearchParams();
  const [currentModal, setCurrentModal] = createSignal<NovelModal | null>(null);
  const [extendedView, setExtendedView] = createSignal<ExtendedView | null>(null);

  const openView = (view: ExtendedView) => {
    setCurrentModal(null);
    if (['bookshelf', 'create-project', 'workspace', 'editor', 'guide'].includes(view)) {
      novelView.setView(view as NovelView);
      setExtendedView(null);
    } else {
      setExtendedView(view);
      setSearchParams({ view }, { replace: true });
    }
  };

  const currentView = () => extendedView() ?? novelView.currentView();

  // /novel 默认进入 workspace（不修改 useNovelView 的默认值）
  // 只有在 URL 没有明确 view 参数时才重定向
  onMount(() => {
    const hasExplicitView = new URLSearchParams(window.location.search).has('view');
    if (!hasExplicitView && novelView.currentView() === 'bookshelf') {
      openView('workspace');
    }
  });

  const state: NovelNavigationState = {
    currentView,
    currentModal,
    isModalOpen: () => currentModal() !== null,
    openView,
    openModal: setCurrentModal,
    closeModal: () => setCurrentModal(null),
    projectId: novelView.projectId,
  };

  return (
    <NovelNavigationContext.Provider value={state}>
      {props.children}
    </NovelNavigationContext.Provider>
  );
}

export function useNovelNavigation() {
  const ctx = useContext(NovelNavigationContext);
  if (!ctx) {
    throw new Error('useNovelNavigation must be used within NovelNavigationProvider');
  }
  return ctx;
}

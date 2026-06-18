import { createContext, useContext, createSignal, createEffect, onMount, type JSX } from 'solid-js';
import { useNovelView } from './use-novel-view';
import { useSearchParams } from '@solidjs/router';
import type { NovelView } from '../types/novel-view';
import type { NovelModal } from '../types/novel-modal';

/** 扩展视图：NovelView + 占位页面 */
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

/** 所有扩展视图值（用于 URL 参数检测） */
const EXTENDED_VIEW_VALUES: ExtendedView[] = [
  'character-panel', 'world-setting', 'profile', 'tutorial',
];

function isExtendedViewValue(v: string): v is ExtendedView {
  return EXTENDED_VIEW_VALUES.includes(v as ExtendedView);
}

export function NovelNavigationProvider(props: { children: JSX.Element }) {
  const novelView = useNovelView();
  const [, setSearchParams] = useSearchParams();
  const [currentModal, setCurrentModal] = createSignal<NovelModal | null>(null);
  const [extendedView, setExtendedView] = createSignal<ExtendedView | null>(null);

  /** 核心视图列表（NovelView 类型中的所有值） */
  const coreViews: NovelView[] = ['bookshelf', 'create-project', 'workspace', 'editor', 'guide', 'achievements', 'novel-guide'];

  /** 从 URL 解析目标视图（同步执行，确保首次渲染前完成） */
  function resolveInitialView(): ExtendedView | null {
    const raw = novelView.rawViewParam();

    // 无参数：默认行为
    if (!raw) {
      if (novelView.currentView() === 'bookshelf') {
        // /novel 无参数 → 默认进入工作台
        return 'workspace';
      }
      return null; // 已有有效核心视图，不覆盖
    }

    // 扩展视图
    if (isExtendedViewValue(raw)) {
      return raw;
    }

    // 核心视图已在 useNovelView 中处理
    return null;
  }

  // 同步初始化：在首次渲染前解析 URL 参数
  const initialExtended = resolveInitialView();
  if (initialExtended) {
    setExtendedView(initialExtended);
  }

  const openView = (view: ExtendedView) => {
    setCurrentModal(null);
    if (coreViews.includes(view as NovelView)) {
      novelView.setView(view as NovelView);
      setExtendedView(null);
    } else {
      setExtendedView(view);
      setSearchParams({ view }, { replace: true });
    }
  };

  const currentView = () => extendedView() ?? novelView.currentView();

  // createEffect: 响应 URL 变化（用户点击浏览器前进/后退按钮时）
  createEffect(() => {
    const raw = novelView.rawViewParam();
    if (!raw) return;

    if (isExtendedViewValue(raw) && extendedView() !== raw) {
      setExtendedView(raw);
    } else if (!isExtendedViewValue(raw) && coreViews.includes(raw as NovelView)) {
      // 核心视图变化（如 bookshelf ↔ workspace），清除 extendedView
      if (extendedView()) {
        setExtendedView(null);
      }
    }
  });

  // onMount: 双重保障，处理边缘情况
  onMount(() => {
    const raw = novelView.rawViewParam();
    if (raw && isExtendedViewValue(raw) && !extendedView()) {
      setExtendedView(raw);
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

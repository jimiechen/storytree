import { createContext, useContext, createSignal, type JSX } from 'solid-js';
import type { NovelView } from '../types/novel-view';

/**
 * 小说视图状态 Context
 *
 * 在 NovelApp 顶层提供，所有子组件通过 useNovelView() 消费
 * 确保书架→创建项目→工作台的视图切换共享同一个信号
 */
interface NovelViewContextValue {
  currentView: () => NovelView;
  setView: (view: NovelView) => void;
}

const NovelViewContext = createContext<NovelViewContextValue>();

export function NovelViewProvider(props: { children: JSX.Element }) {
  const [currentView, setCurrentView] = createSignal<NovelView>('bookshelf');

  const value: NovelViewContextValue = {
    get currentView() { return currentView; },
    setView: (view: NovelView) => setCurrentView(view),
  };

  return (
    <NovelViewContext.Provider value={value}>
      {props.children}
    </NovelViewContext.Provider>
  );
}

/**
 * 消费视图状态的 Hook
 *
 * 所有需要切换视图的子组件（BookshelfPage、Workspace 等）都通过此 Hook 获取 setView
 */
export function useNovelView(): NovelViewContextValue {
  const ctx = useContext(NovelViewContext);
  if (!ctx) {
    throw new Error('useNovelView must be used within NovelViewProvider');
  }
  return ctx;
}

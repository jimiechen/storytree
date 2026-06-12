import { createContext, useContext, createSignal, onMount, type JSX } from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import type { NovelView } from '../types/novel-view';

/** 合法的 NovelView 值列表 */
const VALID_VIEWS: NovelView[] = ['bookshelf', 'create-project', 'workspace', 'editor', 'guide'];

function isValidView(v: string): v is NovelView {
  return VALID_VIEWS.includes(v as NovelView);
}

/**
 * 小说视图状态 Context — 与 URL query param 同步
 *
 * URL 模式: /novel?view=workspace
 * 默认: /novel → view=bookshelf
 */
interface NovelViewContextValue {
  currentView: () => NovelView;
  setView: (view: NovelView) => void;
  /** 当前选中的项目 ID（书架→工作台传递用） */
  projectId: () => string;
  selectProject: (id: string) => void;
}

const NovelViewContext = createContext<NovelViewContextValue>();

export function NovelViewProvider(props: { children: JSX.Element }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projectId, setProjectId] = createSignal<string>('proj-001');

  /** 从 URL 读取初始视图，默认 bookshelf */
  const initialView = () => {
    const v = searchParams.view;
    return isValidView(v) ? v : 'bookshelf';
  };

  const [currentView, setCurrentView] = createSignal<NovelView>(initialView());

  /** setView 时同步更新 URL */
  const setView = (view: NovelView) => {
    setCurrentView(view);
    setSearchParams({ view }, { replace: true });
  };

  const value: NovelViewContextValue = {
    get currentView() { return currentView; },
    setView,
    get projectId() { return projectId; },
    selectProject: (id: string) => {
      setProjectId(id);
      setView('workspace');
    },
  };

  return (
    <NovelViewContext.Provider value={value}>
      {props.children}
    </NovelViewContext.Provider>
  );
}

/**
 * 消费视图状态的 Hook
 */
export function useNovelView(): NovelViewContextValue {
  const ctx = useContext(NovelViewContext);
  if (!ctx) {
    throw new Error('useNovelView must be used within NovelViewProvider');
  }
  return ctx;
}

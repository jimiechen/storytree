import { createContext, useContext, createSignal, onMount, type JSX } from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import type { NovelView } from '../types/novel-view';

/** 合法的 NovelView 值列表（必须与 types/novel-view.ts 联合类型完全一致） */
const VALID_VIEWS: NovelView[] = [
  'bookshelf', 'create-project', 'workspace', 'editor', 'guide',
  'achievements', 'novel-guide',
];

/** 扩展视图：不在 NovelView 类型中但需要路由支持的页面 */
const EXTENDED_VIEWS = ['character-panel', 'world-setting', 'profile', 'tutorial', 'name-generator'];

/** 所有合法视图值（用于 URL 参数校验） */
const ALL_VALID_VIEWS = [...VALID_VIEWS, ...EXTENDED_VIEWS];

function isValidView(v: string): v is NovelView {
  return VALID_VIEWS.includes(v as NovelView);
}

function isExtendedView(v: string): v is typeof EXTENDED_VIEWS[number] {
  return EXTENDED_VIEWS.includes(v as typeof EXTENDED_VIEWS[number]);
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
  /** 原始 URL 视图参数（可能包含扩展视图值，供 NavigationProvider 读取） */
  rawViewParam: () => string | null;
}

const NovelViewContext = createContext<NovelViewContextValue>();

export function NovelViewProvider(props: { children: JSX.Element }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projectId, setProjectId] = createSignal<string>('proj-001');

  /** 从 URL 读取原始视图参数（保留扩展视图原始值） */
  const rawViewParam = () => {
    const v = searchParams.view;
    const viewStr = Array.isArray(v) ? v[0] : v;
    return viewStr || null;
  };

  /** 从 URL 读取初始视图，默认 bookshelf（仅处理核心视图） */
  const initialView = (): NovelView => {
    const v = rawViewParam();
    if (v && isValidView(v)) return v;
    if (v && isExtendedView(v)) {
      // 扩展视图：返回 workspace 作为占位，NavigationProvider 会通过 extendedView 覆盖
      return 'workspace';
    }
    return 'bookshelf';
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
    rawViewParam,
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

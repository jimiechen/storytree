import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { NovelViewProvider, useNovelView } from './hooks/use-novel-view';
import { BookshelfPage } from './components/bookshelf';

/**
 * 小说模块入口 — /novel 路由渲染此组件
 *
 * 默认视图: bookshelf（书架页面）
 * 通过 NovelViewContext 共享视图状态
 */
const NovelApp: Component = () => {
  return (
    <NovelViewProvider>
      <NovelAppInner />
    </NovelViewProvider>
  );
};

const NovelAppInner: Component = () => {
  const { currentView, setView } = useNovelView();

  return (
    <div
      class="flex flex-col h-screen overflow-hidden"
      style={{ background: '#f8f9ff', 'font-family': "'Work Sans', sans-serif", color: '#0d1c2f' }}
    >
      <Show when={currentView() === 'bookshelf'} fallback={
        <div class="flex items-center justify-center h-full text-[#7b7486]">
          <p>视图: {currentView()} （开发中）</p>
        </div>
      }>
        <BookshelfPage />
      </Show>
    </div>
  );
};

export default NovelApp;
export * from './types';
export * from './mock-data';

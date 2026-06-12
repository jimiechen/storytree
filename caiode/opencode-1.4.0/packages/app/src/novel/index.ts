import type { Component } from 'solid-js';
import { NovelViewProvider, useNovelView } from './hooks/use-novel-view';
import { NovelShell } from './components/novel-shell';
import { BookshelfPage } from './components/bookshelf';
import { CreateProjectModal } from './components/create-project-modal';
import { Workspace } from './components/novel-workspace';
import type { NovelView } from './types/novel-view';

/**
 * 小说模块入口 — /novel 路由渲染此组件
 *
 * 视图状态机驱动（通过 NovelViewContext 共享）:
 *   bookshelf      → BookshelfPage（书架页面，默认）
 *   create-project  → CreateProjectModal（创建项目弹窗）
 *   workspace       → Workspace（三栏工作台）
 *   editor          → （Phase 2.1 章节编辑器详情页）
 *   guide           → （Phase 5.2 25道题引导）
 */
const NovelApp: Component = () => {
  return (
    <NovelViewProvider>
      <NovelAppInner />
    </NovelViewProvider>
  );
};

/** 内部组件 — 消费 Context 获取当前视图 */
const NovelAppInner: Component = () => {
  const { currentView, setView } = useNovelView();

  const views: Record<NovelView, Component> = {
    bookshelf: () => <BookshelfPage />,
    'create-project': () => (
      <CreateProjectModal
        open={true}
        onClose={() => setView('bookshelf')}
        onSubmit={async () => {
          setView('workspace');
        }}
      />
    ),
    workspace: () => <Workspace projectId={() => 'proj-001'} />,
    editor: () => (
      <div class="flex items-center justify-center h-full text-[#7b7486]" style={{ 'font-family': "'Work Sans', sans-serif" }}>
        <div class="text-center">
          <p class="text-lg font-medium text-[#0d1c2f] mb-2">章节编辑器</p>
          <p class="text-sm">Phase 2.1 按 Stitch 05 原型实现</p>
        </div>
      </div>
    ),
    guide: () => (
      <div class="flex items-center justify-center h-full text-[#7b7486]" style={{ 'font-family': "'Work Sans', sans-serif" }}>
        <div class="text-center">
          <p class="text-lg font-medium text-[#0d1c2f] mb-2">25 道引导</p>
          <p class="text-sm">Phase 5.2 实现</p>
        </div>
      </div>
    ),
  };

  return <NovelShell view={currentView()} children={views} />;
};

// 导出供路由使用
export default NovelApp;
export * from './types';
export * from './mock-data';

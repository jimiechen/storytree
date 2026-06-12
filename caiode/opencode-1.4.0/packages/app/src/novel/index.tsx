import type { Component } from 'solid-js';
import { Show, Switch, Match } from 'solid-js';
import { NovelViewProvider, useNovelView } from './hooks/use-novel-view';
import { BookshelfPage } from './components/bookshelf';
import { CreateProjectModal } from './components/create-project-modal';
import { Workspace } from './components/novel-workspace';
import type { NovelView } from './types/novel-view';

/**
 * 小说模块入口 — /novel 路由
 *
 * URL 路由模式:
 *   /novel                    → 书架 (默认)
 *   /novel?view=workspace     → 工作台
 *   /novel?view=create-project → 创建项目弹窗
 *   /novel?view=editor        → 章节编辑器 (Phase 2.1)
 *   /novel?view=guide         -> 25道引导 (Phase 5.2)
 *
 * 交互流:
 *   书架 → 点击项目卡片 → /novel?view=workspace&projectId=xxx
 *   书架 → 点击"新建"    → /novel?view=create-project
 *   创建项目 → 成功提交  → /novel?view=workspace
 *   工作台 → 返回按钮    → /novel (书架)
 */
const NovelApp: Component = () => {
  return (
    <NovelViewProvider>
      <NovelRouter />
    </NovelViewProvider>
  );
};

/** 视图路由器 — 根据 currentView 渲染对应页面 */
const NovelRouter: Component = () => {
  const { currentView, projectId, setView, selectProject } = useNovelView();

  return (
    <div
      class="flex flex-col h-screen overflow-hidden"
      style={{ background: '#f8f9ff', 'font-family': "'Work Sans', sans-serif", color: '#0d1c2f' }}
    >
      <Switch fallback={
        <div class="flex items-center justify-center h-full text-[#7b7486]">
          <p>未知视图: {currentView()}</p>
        </div>
      }>
        {/* 书架页面 */}
        <Match when={currentView() === 'bookshelf'}>
          <BookshelfPage />
        </Match>

        {/* 创建项目弹窗（覆盖层） */}
        <Match when={currentView() === 'create-project'}>
          <CreateProjectModal
            open={true}
            onClose={() => setView('bookshelf')}
            onSubmit={async () => setView('workspace')}
          />
          {/* 弹窗背景层保留书架视觉 */}
          <div class="flex-1 opacity-30 pointer-events-none">
            <BookshelfPage />
          </div>
        </Match>

        {/* 三栏工作台 */}
        <Match when={currentView() === 'workspace'}>
          <Workspace projectId={projectId} />
        </Match>

        {/* 章节编辑器详情页 (Phase 2.1) */}
        <Match when={currentView() === 'editor'}>
          <div class="flex flex-col items-center justify-center h-full gap-3">
            <span class="text-4xl">📝</span>
            <h2 class="text-lg font-semibold text-[#0d1c2f]" style={{ 'font-family': "'Plus Jakarta Sans', sans-serif" }}>
              章节编辑器
            </h2>
            <p class="text-sm text-[#7b7486]">Phase 2.1 按 Stitch 05 原型实现</p>
            <button
              onClick={() => setView('workspace')}
              class="mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-[#eff4ff] text-[#6b38d4] hover:bg-[#e9ddff] transition-colors"
            >
              ← 返回工作台
            </button>
          </div>
        </Match>

        {/* 25道题引导 (Phase 5.2) */}
        <Match when={currentView() === 'guide'}>
          <div class="flex flex-col items-center justify-center h-full gap-3">
            <span class="text-4xl">🧭</span>
            <h2 class="text-lg font-semibold text-[#0d1c2f]" style={{ 'font-family': "'Plus Jakarta Sans', sans-serif" }}>
              AI 创作引导
            </h2>
            <p class="text-sm text-[#7b7486]">25 道题引导 — Phase 5.2 实现</p>
            <button
              onClick={() => setView('bookshelf')}
              class="mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-[#eff4ff] text-[#6b38d4] hover:bg-[#e9ddff] transition-colors"
            >
              ← 返回书架
            </button>
          </div>
        </Match>
      </Switch>
    </div>
  );
};

export default NovelApp;
export * from './types';
export * from './mock-data';

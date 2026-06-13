import type { Component } from 'solid-js';
import { Switch, Match } from 'solid-js';
import { useNovelNavigation } from '../../hooks/use-novel-navigation';
import { BookshelfPage } from '../bookshelf';
import { CreateProjectModal } from '../create-project-modal';
import { Workspace } from '../novel-workspace';
import { NovelEditor } from '../novel-editor';
import { NovelModalHost } from './novel-modal-host';
import { PlaceholderPage } from './placeholder-page';

/**
 * NovelAppShell — 小说模块应用壳层
 *
 * 批次 4 引入，替代原 NovelRouter。
 * 职责：
 * - 根据 currentView 路由到对应页面
 * - 挂载全局 NovelModalHost
 * - /novel 默认进入 workspace（由 NovelNavigationProvider onMount 处理）
 */
export const NovelAppShell: Component = () => {
  const nav = useNovelNavigation();

  return (
    <div
      class="flex flex-col h-screen overflow-hidden"
      style={{ background: '#f8f9ff', 'font-family': "'Work Sans', sans-serif", color: '#0d1c2f' }}
    >
      <Switch
        fallback={
          <div class="flex items-center justify-center h-full text-[#7b7486]">
            <p>未知视图: {nav.currentView()}</p>
          </div>
        }
      >
        {/* 书架页面 */}
        <Match when={nav.currentView() === 'bookshelf'}>
          <BookshelfPage />
        </Match>

        {/* 创建项目弹窗（覆盖层） */}
        <Match when={nav.currentView() === 'create-project'}>
          <CreateProjectModal
            onSubmit={async () => nav.openView('workspace')}
            onCancel={() => nav.openView('bookshelf')}
          />
          <div class="flex-1 opacity-30 pointer-events-none">
            <BookshelfPage />
          </div>
        </Match>

        {/* 三栏工作台 */}
        <Match when={nav.currentView() === 'workspace'}>
          <Workspace projectId={nav.projectId} />
        </Match>

        {/* 章节编辑器 */}
        <Match when={nav.currentView() === 'editor'}>
          <NovelEditor />
        </Match>

        {/* 引导页 */}
        <Match when={nav.currentView() === 'guide'}>
          <PlaceholderPage
            title="AI 创作引导"
            icon="school"
            description="25 道题引导 — Phase 5.2 实现"
          />
        </Match>

        {/* 批次 4 占位页面 */}
        <Match when={nav.currentView() === 'character-panel'}>
          <PlaceholderPage title="人物面板" icon="groups" />
        </Match>
        <Match when={nav.currentView() === 'world-setting'}>
          <PlaceholderPage title="世界设定" icon="psychology" />
        </Match>
        <Match when={nav.currentView() === 'profile'}>
          <PlaceholderPage title="个人中心" icon="person" />
        </Match>
        <Match when={nav.currentView() === 'tutorial'}>
          <PlaceholderPage title="帮助中心" icon="help" />
        </Match>
      </Switch>

      <NovelModalHost />
    </div>
  );
};

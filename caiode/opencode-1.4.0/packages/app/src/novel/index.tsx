import type { Component } from 'solid-js';
import { NovelViewProvider } from './hooks/use-novel-view';
import { NovelNavigationProvider } from './hooks/use-novel-navigation';
import { NovelAppShell } from './components/layout/novel-app-shell';

/**
 * 小说模块入口 — /novel 路由
 *
 * 批次 4 改造：
 * - NovelViewProvider 保留（管理 URL 同步 + projectId）
 * - NovelNavigationProvider 新增（管理视图路由 + 弹框）
 * - NovelAppShell 替代原 NovelRouter（支持占位页面 + ModalHost）
 * - /novel 默认进入 workspace（由 NovelNavigationProvider onMount 处理）
 */
const NovelApp: Component = () => {
  return (
    <NovelViewProvider>
      <NovelNavigationProvider>
        <NovelAppShell />
      </NovelNavigationProvider>
    </NovelViewProvider>
  );
};

export default NovelApp;
export * from './types';
export * from './mock-data';

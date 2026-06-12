import type { Component, JSX } from 'solid-js';
import { NovelSideNav, type NavItem } from './novel-side-nav';
import { NovelTopAppBar } from './novel-top-app-bar';

interface NovelAppLayoutProps {
  children: JSX.Element;
  navItems: NavItem[];
  topBar: {
    title: string;
    icon: string;
    badge?: string;
    onRefresh?: () => void;
  };
  onWriteNow?: () => void;
  onLogout?: () => void;
}

/**
 * 小说模块统一布局 — SideNav + TopAppBar + 内容区
 *
 * 结构:
 *   body
 *   ├── SideNavBar (260px 固定左侧)
 *   └── Main Content (flex-1, md:ml-[260px])
 *       ├── TopAppBar (64px)
 *       └── Scrollable Content
 *
 * 参考: stitch/02_我的书架/code.html
 */
export const NovelAppLayout: Component<NovelAppLayoutProps> = (props) => {
  return (
    <div class="flex h-screen overflow-hidden bg-[#f8f9ff]">
      {/* 左侧 SideNav */}
      <NovelSideNav
        items={props.navItems}
        onWriteNow={props.onWriteNow}
        onLogout={props.onLogout}
      />

      {/* 主内容区 */}
      <main class="flex-1 flex flex-col h-full md:ml-[260px] relative">
        {/* TopAppBar */}
        <NovelTopAppBar
          title={props.topBar.title}
          icon={props.topBar.icon}
          badge={props.topBar.badge}
          onRefresh={props.topBar.onRefresh}
        />

        {/* 可滚动内容画布 */}
        <div class="flex-1 overflow-y-auto px-4 md:px-[40px] py-6">
          {props.children}
        </div>
      </main>
    </div>
  );
};

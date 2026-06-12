import type { Component, JSX } from 'solid-js';

interface WorkspaceLayoutProps {
  topAppBar: JSX.Element;
  sideNav: JSX.Element;
  editor: JSX.Element;
  generationPanel: JSX.Element;
}

/**
 * 工作台三栏布局骨架 — 纯布局，不处理业务数据
 *
 * 结构:
 *   body (h-screen flex flex-col)
 *   ├── header (top app bar, 64px)
 *   └── main (flex-1 overflow-hidden)
 *       ├── aside (left side nav, 260px)
 *       ├── section (center editor, flex-1)
 *       └── aside (right generation settings, 300px)
 */
export const WorkspaceLayout: Component<WorkspaceLayoutProps> = (props) => {
  return (
    <div class="flex flex-col h-screen overflow-hidden bg-[#f8f9ff]">
      {props.topAppBar}

      <main class="flex flex-1 overflow-hidden relative">
        {/* 左侧 SideNav */}
        <aside class="w-[260px] shrink-0 h-full flex flex-col bg-white border-r border-[#cbc3d7] shadow-sm z-10">
          {props.sideNav}
        </aside>

        {/* 中间编辑器 */}
        <section class="flex-1 flex flex-col bg-[#f8f9ff] relative min-w-0">
          {props.editor}
        </section>

        {/* 右侧生成设置 */}
        <aside class="w-[300px] shrink-0 h-full flex flex-col bg-white border-l border-[#cbc3d7] shadow-[-2px_0_12px_rgba(0,0,0,0.02)] z-10">
          {props.generationPanel}
        </aside>
      </main>
    </div>
  );
};

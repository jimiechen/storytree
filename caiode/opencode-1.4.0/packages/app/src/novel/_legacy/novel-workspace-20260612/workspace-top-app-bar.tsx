import type { Component } from 'solid-js';
import { NovelIcon } from '../layout/novel-icon';

interface WorkspaceTopAppBarProps {
  onPublish?: () => void;
  onNotifications?: () => void;
  onSettings?: () => void;
}

/** 工作台顶部导航栏 — Stitch 04 code.html */
export const WorkspaceTopAppBar: Component<WorkspaceTopAppBarProps> = (props) => {
  return (
    <header class="bg-white border-b border-[#cbc3d7] flex justify-between items-center w-full px-6 h-16 shrink-0 z-20">
      {/* Brand Logo */}
      <div
        class="text-xl font-bold text-[#6b38d4]"
        style={{ 'font-family': "'Plus Jakarta Sans', 'PingFang SC', sans-serif" }}
      >
        墨语 AI (InkVerse)
      </div>

      {/* Navigation */}
      <nav class="flex h-full">
        <a
          class="h-full flex items-center px-6 text-[#6b38d4] border-b-2 border-[#6b38d4] font-bold text-sm hover:bg-[#eff4ff] transition-colors"
          href="#"
        >
          工作台
        </a>
        <a
          class="h-full flex items-center px-6 text-[#494454] text-sm hover:bg-[#eff4ff] transition-colors"
          href="#"
        >
          素材库
        </a>
        <a
          class="h-full flex items-center px-6 text-[#494454] text-sm hover:bg-[#eff4ff] transition-colors"
          href="#"
        >
          灵感区
        </a>
      </nav>

      {/* Actions */}
      <div class="flex items-center gap-3">
        <button
          onClick={props.onPublish}
          class="bg-[#6b38d4] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#6d3bd7] transition-colors"
        >
          发布章节
        </button>
        <button
          onClick={props.onNotifications}
          class="text-[#494454] hover:text-[#6b38d4] transition-colors p-2 rounded-full hover:bg-[#eff4ff]"
        >
          <NovelIcon name="notifications" size={20} />
        </button>
        <button
          onClick={props.onSettings}
          class="text-[#494454] hover:text-[#6b38d4] transition-colors p-2 rounded-full hover:bg-[#eff4ff]"
        >
          <NovelIcon name="settings" size={20} />
        </button>
        <div class="w-10 h-10 rounded-full bg-[#e9ddff] flex items-center justify-center text-[#6b38d4]">
          <NovelIcon name="person" size={20} />
        </div>
      </div>
    </header>
  );
};

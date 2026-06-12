import type { Component } from 'solid-js';
import { NovelIcon } from '../../layout/novel-icon';

export interface WorkspaceTopAppBarActions {
  onOpenWorkspace?: () => void;
  onOpenMaterials?: () => void;
  onOpenInspiration?: () => void;
  onPublishChapter?: () => void;
  onOpenNotifications?: () => void;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
}

interface WorkspaceTopAppBarProps extends WorkspaceTopAppBarActions {}

/** 工作台顶部导航栏 — Stitch 04 code.html */
export const WorkspaceTopAppBar: Component<WorkspaceTopAppBarProps> = (props) => {
  return (
    <header class="bg-white border-b border-[#cbc3d7] flex justify-between items-center w-full px-6 h-16 shrink-0 z-20">
      {/* Brand Logo */}
      <button
        onClick={props.onOpenWorkspace}
        class="text-xl font-bold text-[#6b38d4] hover:opacity-80 transition-opacity"
        style={{ 'font-family': "'Plus Jakarta Sans', 'PingFang SC', sans-serif" }}
      >
        墨语 AI (InkVerse)
      </button>

      {/* Navigation Links */}
      <nav class="flex h-full">
        <button
          onClick={props.onOpenWorkspace}
          class="h-full flex items-center px-6 text-[#6b38d4] border-b-2 border-[#6b38d4] font-bold text-sm hover:bg-[#eff4ff] transition-colors"
        >
          工作台
        </button>
        <button
          onClick={props.onOpenMaterials}
          class="h-full flex items-center px-6 text-[#494454] text-sm hover:bg-[#eff4ff] transition-colors"
        >
          素材库
        </button>
        <button
          onClick={props.onOpenInspiration}
          class="h-full flex items-center px-6 text-[#494454] text-sm hover:bg-[#eff4ff] transition-colors"
        >
          灵感区
        </button>
      </nav>

      {/* Actions */}
      <div class="flex items-center gap-3">
        <button
          onClick={props.onPublishChapter}
          class="bg-[#6b38d4] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#6d3bd7] transition-colors"
        >
          发布章节
        </button>
        <button
          onClick={props.onOpenNotifications}
          class="text-[#494454] hover:text-[#6b38d4] transition-colors p-2 rounded-full hover:bg-[#eff4ff]"
        >
          <NovelIcon name="notifications" size={20} />
        </button>
        <button
          onClick={props.onOpenSettings}
          class="text-[#494454] hover:text-[#6b38d4] transition-colors p-2 rounded-full hover:bg-[#eff4ff]"
        >
          <NovelIcon name="settings" size={20} />
        </button>
        <button
          onClick={props.onOpenProfile}
          class="w-10 h-10 rounded-full bg-[#e9ddff] flex items-center justify-center text-[#6b38d4] hover:bg-[#d0bcff] transition-colors"
        >
          <NovelIcon name="person" size={20} />
        </button>
      </div>
    </header>
  );
};

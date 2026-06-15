import type { Component } from 'solid-js';
import { NovelIcon } from '../../layout/novel-icon';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236b38d4'%3E%3Ccircle cx='12' cy='12' r='12'/%3E%3Ccircle cx='12' cy='9' r='4' fill='%23fff'/%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' fill='%23fff'/%3E%3C/svg%3E";

export interface WorkspaceTopAppBarActions {
  onLogoClick?: () => void;
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
        data-testid="workspace-logo"
        onClick={props.onLogoClick}
        class="text-xl font-bold text-[#6b38d4] hover:opacity-80 transition-opacity"
        style={{ 'font-family': "'Plus Jakarta Sans', 'PingFang SC', sans-serif" }}
      >
        墨语 AI (InkVerse)
      </button>

      {/* Navigation Links */}
      <nav class="flex h-full">
        <button
          onClick={props.onOpenWorkspace}
          class="h-full flex items-center px-6 text-[#6b38d4] border-b-2 border-[#6b38d4] font-bold text-sm hover:bg-[#eff4ff] transition-colors active:scale-95 transition-transform duration-150"
        >
          工作台
        </button>
        <button
          onClick={props.onOpenMaterials}
          class="h-full flex items-center px-6 text-[#494454] text-sm hover:bg-[#eff4ff] transition-colors active:scale-95 transition-transform duration-150"
        >
          素材库
        </button>
        <button
          onClick={props.onOpenInspiration}
          class="h-full flex items-center px-6 text-[#494454] text-sm hover:bg-[#eff4ff] transition-colors active:scale-95 transition-transform duration-150"
        >
          灵感区
        </button>
      </nav>

      {/* Actions */}
      <div class="flex items-center gap-3">
        <button
          onClick={props.onPublishChapter}
          class="bg-[#6b38d4] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#6d3bd7] transition-colors active:scale-95 transition-transform duration-150"
        >
          发布章节
        </button>
        <button
          onClick={props.onOpenNotifications}
          class="text-[#494454] hover:text-[#6b38d4] transition-colors p-2 rounded-full hover:bg-[#eff4ff] active:scale-95 transition-transform duration-150"
        >
          <NovelIcon name="notifications" size={20} />
        </button>
        <button
          onClick={props.onOpenSettings}
          class="text-[#494454] hover:text-[#6b38d4] transition-colors p-2 rounded-full hover:bg-[#eff4ff] active:scale-95 transition-transform duration-150"
        >
          <NovelIcon name="settings" size={20} />
        </button>
        <img
          src={DEFAULT_AVATAR}
          alt="用户头像"
          onClick={props.onOpenProfile}
          class="w-10 h-10 rounded-full object-cover border border-[#cbc3d7] cursor-pointer hover:opacity-90 transition-opacity"
        />
      </div>
    </header>
  );
};

import type { Component } from 'solid-js';
import { NovelIcon } from '../../layout/novel-icon';

export interface WorkspaceEditorHeaderActions {
  onOpenHistory?: () => void;
  onToggleFullscreen?: () => void;
}

interface WorkspaceEditorHeaderProps extends WorkspaceEditorHeaderActions {
  chapterTitle: string;
}

/** 编辑器头部 — Stitch 04 code.html */
export const WorkspaceEditorHeader: Component<WorkspaceEditorHeaderProps> = (props) => {
  return (
    <header class="px-10 py-6 border-b border-[#cbc3d7] bg-white shrink-0 flex items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
      <h1
        class="text-3xl font-bold text-[#0d1c2f] tracking-tight"
        style={{ 'font-family': "'Plus Jakarta Sans', 'PingFang SC', sans-serif" }}
      >
        {props.chapterTitle}
      </h1>
      <div class="flex gap-2">
        <button
          onClick={props.onOpenHistory}
          class="text-[#494454] hover:text-[#6b38d4] p-2 rounded-md hover:bg-[#eff4ff] transition-colors"
          title="历史版本"
        >
          <NovelIcon name="history" size={20} />
        </button>
        <button
          onClick={props.onToggleFullscreen}
          class="text-[#494454] hover:text-[#6b38d4] p-2 rounded-md hover:bg-[#eff4ff] transition-colors"
          title="全屏"
        >
          <NovelIcon name="fullscreen" size={20} />
        </button>
      </div>
    </header>
  );
};

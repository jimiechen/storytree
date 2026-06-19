import type { Component } from 'solid-js';
import { NovelIcon } from '../../layout/novel-icon';

export interface WorkspaceActionsProps {
  onStartGeneration?: () => void;
  onBatchGeneration?: () => void;
}

/** 底部操作按钮 — Stitch 04 code.html */
export const WorkspaceActions: Component<WorkspaceActionsProps> = (props) => {
  return (
    <div class="p-6 border-t border-[#cbc3d7] bg-[#f8f9ff] space-y-3 shrink-0">
      <button
        type="button"
        data-testid="start-generation-btn"
        onClick={props.onStartGeneration}
        class="w-full bg-gradient-to-r from-[#6b38d4] to-[#6d3bd7] text-white py-3 rounded-lg text-sm font-bold shadow-[0_2px_8px_rgba(107,56,212,0.3)] hover:shadow-[0_4px_12px_rgba(107,56,212,0.4)] transition-all flex items-center justify-center gap-2"
      >
        <NovelIcon name="play_arrow" size={18} />
        <span>开始生成</span>
      </button>
      <button
        onClick={props.onBatchGeneration}
        class="w-full bg-white border-2 border-[#cbc3d7] text-[#0d1c2f] py-2.5 rounded-lg text-sm font-medium hover:border-[#6b38d4] hover:text-[#6b38d4] transition-colors"
      >
        批量生成
      </button>
    </div>
  );
};

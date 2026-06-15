import type { Component } from 'solid-js';
import { NovelIcon } from '../../layout/novel-icon';

export interface AiTaskViewModel {
  running: boolean;
  title: string;
  progress: number;
  preview: string;
}

export interface WorkspaceAiProgressDockActions {
  onPause?: () => void;
}

interface WorkspaceAiProgressDockProps extends WorkspaceAiProgressDockActions {
  task?: AiTaskViewModel;
}

/** AI 生成进度浮窗 — Stitch 04 code.html */
export const WorkspaceAiProgressDock: Component<WorkspaceAiProgressDockProps> = (props) => {
  if (!props.task || !props.task.running) return null;

  const task = props.task;

  return (
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 w-[85%] max-w-3xl bg-[#f8f9ff]/90 backdrop-blur-md rounded-xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-[#cbc3d7] flex flex-col gap-4 z-30 transition-all">
      {/* Status Header */}
      <div class="flex justify-between items-center text-sm">
        <div class="flex items-center gap-3 text-[#6b38d4]">
          <NovelIcon name="sync" size={20} class="animate-spin" />
          <span class="font-bold">{task.title}</span>
        </div>
        <span class="text-[#0d1c2f] font-medium bg-[#eff4ff] px-3 py-1 rounded-full">
          {task.progress}%
        </span>
      </div>

      {/* Progress Bar */}
      <div class="w-full bg-[#d5e3fd] rounded-full h-1.5 overflow-hidden">
        <div
          class="bg-gradient-to-r from-[#6b38d4] to-[#6d3bd7] h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${task.progress}%` }}
        />
      </div>

      {/* Preview Area */}
      {task.preview && (
        <div class="bg-[#f8f9ff] p-4 rounded-lg border border-[#cbc3d7] text-sm text-[#494454] max-h-32 overflow-y-auto relative">
          <p class="italic">{task.preview}</p>
          <div class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#f8f9ff] to-transparent" />
        </div>
      )}

      {/* Actions */}
      <div class="flex justify-end pt-2">
        <button
          onClick={props.onPause}
          class="bg-white border border-[#cbc3d7] text-[#0d1c2f] px-6 py-2 rounded-md text-sm hover:bg-[#eff4ff] hover:text-[#6b38d4] transition-colors flex items-center gap-2"
        >
          <NovelIcon name="pause" size={18} />
          <span>暂停</span>
        </button>
      </div>
    </div>
  );
};

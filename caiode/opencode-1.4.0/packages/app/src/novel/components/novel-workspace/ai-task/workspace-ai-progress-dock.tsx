import type { Component } from 'solid-js';
import { NovelIcon } from '../../layout/novel-icon';

export interface AiTaskViewModel {
  running: boolean;
  title: string;
  progress: number;
  preview: string;
  /** P3-B：流式任务状态，用于区分运行中/失败/取消 */
  status?: 'running' | 'failed' | 'cancelled';
  /** P3-B：失败时的结构化错误信息 */
  error?: string;
}

export interface WorkspaceAiProgressDockActions {
  /** P3-B：onPause 语义改为取消当前流式任务 */
  onPause?: () => void;
  onCancel?: () => void;
}

interface WorkspaceAiProgressDockProps extends WorkspaceAiProgressDockActions {
  task?: AiTaskViewModel;
}

/** AI 生成进度浮窗 — Stitch 04 code.html
 *
 * P3-B 改造：
 * - 流式生成时进度条使用 indeterminate 动画，因为真实 LLM 无法预知总 token 数。
 * - 预览区展示实时 token delta（preview），但仅作为临时草稿，不自动写入正文。
 * - 增加取消按钮，调用 onCancel / onPause 终止流式任务。
 */
export const WorkspaceAiProgressDock: Component<WorkspaceAiProgressDockProps> = (props) => {
  if (!props.task || !props.task.running) return null;

  const task = props.task;
  const isFailed = () => task.status === 'failed';
  const isStreaming = () => task.status === 'running' || task.status === undefined;

  return (
    <div data-testid="ai-progress-dock" class="absolute bottom-8 left-1/2 -translate-x-1/2 w-[85%] max-w-3xl bg-[#f8f9ff]/90 backdrop-blur-md rounded-xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-[#cbc3d7] flex flex-col gap-4 z-30 transition-all">
      {/* Status Header */}
      <div class="flex justify-between items-center text-sm">
        <div class="flex items-center gap-3 text-[#6b38d4]">
          <NovelIcon name="sync" size={20} class={isStreaming() ? 'animate-spin' : ''} />
          <span data-testid="ai-progress-title" class="font-bold">{task.title}</span>
        </div>
        <span data-testid="ai-progress-percent" class="text-[#0d1c2f] font-medium bg-[#eff4ff] px-3 py-1 rounded-full">
          {isStreaming() ? '流式生成中' : `${task.progress}%`}
        </span>
      </div>

      {/* Progress Bar */}
      <div class="w-full bg-[#d5e3fd] rounded-full h-1.5 overflow-hidden">
        {isStreaming() ? (
          <div class="bg-gradient-to-r from-[#6b38d4] to-[#6d3bd7] h-full rounded-full animate-[loading_1.5s_ease-in-out_infinite] w-1/3" />
        ) : (
          <div
            class="bg-gradient-to-r from-[#6b38d4] to-[#6d3bd7] h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${task.progress}%` }}
          />
        )}
      </div>

      {/* Preview Area */}
      {task.preview && (
        <div class="bg-[#f8f9ff] p-4 rounded-lg border border-[#cbc3d7] text-sm text-[#494454] max-h-32 overflow-y-auto relative">
          <p class="italic">{task.preview}</p>
          <div class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#f8f9ff] to-transparent" />
        </div>
      )}

      {/* Error Area */}
      {isFailed() && task.error && (
        <div class="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          {task.error}
        </div>
      )}

      {/* Actions */}
      <div class="flex justify-end pt-2">
        <button
          onClick={props.onCancel ?? props.onPause}
          class="bg-white border border-[#cbc3d7] text-[#0d1c2f] px-6 py-2 rounded-md text-sm hover:bg-[#eff4ff] hover:text-[#6b38d4] transition-colors flex items-center gap-2"
        >
          <NovelIcon name="pause" size={18} />
          <span>取消</span>
        </button>
      </div>
    </div>
  );
};

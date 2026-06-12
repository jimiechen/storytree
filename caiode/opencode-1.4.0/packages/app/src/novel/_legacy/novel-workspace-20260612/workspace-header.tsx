import type { Component } from 'solid-js';
import type { WorkspacePanelId } from '../../types/workspace';
import { useNovelView } from '../../hooks/use-novel-view';

interface WorkspaceHeaderProps {
  projectName: string;
  projectGenre: string;
  totalWordCount: number;
  visiblePanels: Set<WorkspacePanelId>;
  onTogglePanel: (id: WorkspacePanelId) => void;
  onOpenLog: () => void;
}

/**
 * Workspace 顶部工具栏 — Stitch 原型 04 风格
 *
 * 左侧: 返回按钮 + 项目名 + 类型/字数
 * 右侧: 面板切换按钮
 */
export const WorkspaceHeader: Component<WorkspaceHeaderProps> = (props) => {
  const { setView } = useNovelView();

  const panelBtn = (id: WorkspacePanelId, label: string) => (
    <button
      class={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
        props.visiblePanels.has(id)
          ? 'bg-[#e9ddff] text-[#6b38d4]'
          : 'bg-[#eff4ff] text-[#494454] hover:bg-[#e6eeff]'
      }`}
      onClick={() => props.onTogglePanel(id)}
    >
      {label}
    </button>
  );

  return (
    <div class="h-14 bg-white border-b border-[#cbc3d7] flex items-center justify-between px-[40px] shrink-0">
      {/* 左侧：返回 + 项目信息 */}
      <div class="flex items-center gap-3">
        {/* 返回书架按钮 */}
        <button
          onClick={() => setView('bookshelf')}
          class="p-1.5 rounded-lg text-[#7b7486] hover:text-[#6b38d4] hover:bg-[#eff4ff] transition-colors duration-150"
          title="返回书架"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1
          class="text-base font-semibold text-[#0d1c2f]"
          style={{ 'font-family': "'Plus Jakarta Sans', sans-serif" }}
        >
          {props.projectName}
        </h1>
        <span class="text-xs text-[#7b7486]" style={{ 'font-family': "'Work Sans', sans-serif" }}>
          {props.projectGenre} · {props.totalWordCount.toLocaleString()} 字
        </span>
      </div>

      {/* 右侧：面板开关 */}
      <div class="flex items-center gap-2">
        {panelBtn('character', '角色面板')}
        {panelBtn('ai-task', 'AI 任务')}
        {panelBtn('generation', '生成设置')}
        <button
          class="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#eff4ff] text-[#494454] hover:bg-[#e6eeff] transition-colors duration-150"
          onClick={props.onOpenLog}
        >
          日志
        </button>
      </div>
    </div>
  );
};

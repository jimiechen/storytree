import type { Component } from 'solid-js';
import type { WorkspacePanelId } from '../../types/workspace';

interface WorkspaceHeaderProps {
  projectName: string;
  projectGenre: string;
  totalWordCount: number;
  visiblePanels: Set<WorkspacePanelId>;
  onTogglePanel: (id: WorkspacePanelId) => void;
  onOpenLog: () => void;
}

/** Workspace 顶部工具栏：项目信息 + 面板开关按钮 */
export const WorkspaceHeader: Component<WorkspaceHeaderProps> = (props) => {
  const panelBtn = (id: WorkspacePanelId, label: string) => (
    <button
      class={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
        props.visiblePanels.has(id)
          ? 'bg-indigo-100 text-indigo-700'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
      onClick={() => props.onTogglePanel(id)}
    >
      {label}
    </button>
  );

  return (
    <div class="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
      {/* 左侧：项目信息 */}
      <div class="flex items-center gap-4">
        <h1 class="text-lg font-semibold text-gray-900">{props.projectName}</h1>
        <span class="text-xs text-gray-500">
          {props.projectGenre} · {props.totalWordCount.toLocaleString()} 字
        </span>
      </div>

      {/* 右侧：面板开关 */}
      <div class="flex items-center gap-2">
        {panelBtn('character', '角色面板')}
        {panelBtn('ai-task', 'AI 任务')}
        <button
          class="px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          onClick={props.onOpenLog}
        >
          日志
        </button>
      </div>
    </div>
  );
};

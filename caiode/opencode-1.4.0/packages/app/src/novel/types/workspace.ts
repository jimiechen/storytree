/**
 * Workspace 壳层类型定义
 */

/** 可切换的右侧面板 ID */
export type WorkspacePanelId = 'character' | 'ai-task' | 'generation';

/** Workspace 面板状态 */
export interface WorkspaceState {
  projectId: string;
  visiblePanels: Set<WorkspacePanelId>;
}

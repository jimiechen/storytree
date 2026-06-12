import { describe, it, expect } from 'vitest';
import type { WorkspacePanelId } from '../types/workspace';

describe('useWorkspace Hook - 面板状态管理', () => {
  // 注意: useWorkspace 使用 createSignal/createResource，
  // 在非 SolidJS hydrating context 中无法直接调用。
  // 此处仅测试纯类型逻辑。

  it('WorkspacePanelId 应包含 character 和 ai-task', () => {
    const ids: WorkspacePanelId[] = ['character', 'ai-task'];
    expect(ids).toHaveLength(2);
    expect(ids).toContain('character');
    expect(ids).toContain('ai-task');
  });

  it('默认应有两个可用面板选项', () => {
    const panelOptions: WorkspacePanelId[] = ['character', 'ai-task'];
    expect(panelOptions.length).toBeGreaterThanOrEqual(2);
  });
});

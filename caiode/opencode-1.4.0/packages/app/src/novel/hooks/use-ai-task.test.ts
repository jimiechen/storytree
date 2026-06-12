import { describe, it, expect } from 'vitest';
import { useAITask } from './use-ai-task';
import { FakeAgentProvider } from '../providers/fake-agent';
import type { AITaskInput } from '../types';

/**
 * useAITask Hook 契约验证
 *
 * ⚠️ SolidJS createEffect 需要 hydration context，
 *    但 submitTask / cancelTask 底层调用 FakeAgentProvider（无 UI 依赖），
 *    因此可直接测试 Provider 层交互逻辑。
 *
 * 完整 Hook 测试（tasks signal 同步、isRunning 状态切换）
 * 待 Phase 1.2 引入 @solidjs/testing 后补充。
 */
describe('useAITask - 底层 Agent Provider 验证', () => {
  const createProvider = () => new FakeAgentProvider();

  it('应导出 useAITask 函数', () => {
    expect(typeof useAITask).toBe('function');
  });

  it('submitTask 应返回有效 Task 对象', async () => {
    const provider = createProvider();
    const task = await provider.submitTask({
      type: 'continue-writing',
      chapterId: 'ch-001',
      text: '测试文本',
    } as AITaskInput);
    expect(task.id).toBeTruthy();
    expect(task.type).toBe('continue-writing');
    expect(['pending', 'running']).toContain(task.status);
  });

  it('cancelTask 应将任务状态设为 cancelled', async () => {
    const provider = createProvider();
    const task = await provider.submitTask({
      type: 'continue-writing',
      chapterId: 'ch-002',
      text: '取消测试',
    } as AITaskInput);

    provider.cancelTask(task.id);
    const updated = provider.getTask(task.id);
    expect(updated?.status).toBe('cancelled');
  });

  it('getTask 返回 undefined 表示不存在', () => {
    const provider = createProvider();
    expect(provider.getTask('nonexistent')).toBeUndefined();
  });
});

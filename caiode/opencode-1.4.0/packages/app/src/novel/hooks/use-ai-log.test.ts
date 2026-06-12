import { describe, it, expect } from 'vitest';
import { useAILog } from './use-ai-log';
import { AILogProvider } from '../providers/ai-log';

/**
 * useAILog Hook 契约验证
 *
 * ⚠️ SolidJS createResource 需要 hydration context，
 *    happy-dom 环境无法直接调用此 Hook。
 *    完整 Hook 测试待 Phase 1.2 引入 @solidjs/testing 后补充。
 *
 * 当前阶段：通过 Provider 层测试覆盖数据逻辑（ai-log.test.ts）。
 * 本文件仅验证模块导出和类型签名。
 */
describe('useAILog - 模块导出与签名', () => {
  it('应导出 useAILog 函数', () => {
    expect(typeof useAILog).toBe('function');
  });

  it('函数参数数量为 0（无参 Hook）', () => {
    expect(useAILog.length).toBe(0);
  });

  it('底层 Provider (AILogProvider) 可独立测试', async () => {
    const provider = new AILogProvider();
    const logs = await provider.listLogs();
    expect(Array.isArray(logs)).toBe(true);
  });
});

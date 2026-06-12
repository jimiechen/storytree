import { describe, it, expect } from 'vitest';
import { useNovelProject } from './use-novel-project';
import { NovelProjectProvider } from '../providers/novel-project';

/**
 * useNovelProject Hook 契约验证
 *
 * ⚠️ SolidJS createResource 需要 hydration context，
 *    happy-dom 环境无法直接调用此 Hook。
 *    完整 Hook 测试待 Phase 1.2 引入 @solidjs/testing 后补充。
 *
 * 当前阶段：通过 Provider 层测试覆盖数据逻辑（novel-project.test.ts）。
 * 本文件仅验证模块导出和类型签名。
 */
describe('useNovelProject - 模块导出与签名', () => {
  it('应导出 useNovelProject 函数', () => {
    expect(typeof useNovelProject).toBe('function');
  });

  it('函数参数数量为 0（无参 Hook）', () => {
    expect(useNovelProject.length).toBe(0);
  });

  it('底层 Provider (NovelProjectProvider) 可独立测试', async () => {
    const provider = new NovelProjectProvider();
    const projects = await provider.listProjects();
    expect(projects.length).toBeGreaterThan(0);
  });
});

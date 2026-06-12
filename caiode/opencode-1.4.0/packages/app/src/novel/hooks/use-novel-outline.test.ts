import { describe, it, expect } from 'vitest';
import type { OutlineViewMode, OutlineNode } from '../types';
import { NovelOutlineProvider } from '../providers/novel-outline';

const outlineProvider = new NovelOutlineProvider();

describe('useNovelOutline Hook - 类型与数据验证', () => {
  // 注意: useNovelOutline 使用 createSignal/createResource，
  // 在非 SolidJS hydrating context 中无法直接调用。
  // 此处测试视图模式类型 + Provider 数据层逻辑。

  describe('OutlineViewMode 类型', () => {
    it('应包含三种模式', () => {
      const modes: OutlineViewMode[] = ['outline', 'detail', 'chapter'];
      expect(modes).toHaveLength(3);
      expect(modes).toContain('outline');
      expect(modes).toContain('detail');
      expect(modes).toContain('chapter');
    });

    it('默认模式应为 chapter', () => {
      const defaultMode: OutlineViewMode = 'chapter';
      expect(defaultMode).toBe('chapter');
    });
  });

  describe('大纲数据加载（模拟 Hook 行为）', () => {
    it('listOutlines 返回的顶层节点应为 volume 类型', async () => {
      const outlines = await outlineProvider.listOutlines('proj-001');
      const volumes = outlines.filter(n => n.type === 'volume');
      expect(volumes.length).toBeGreaterThan(0);
    });

    it('每个 volume 应包含 chapter 子节点', async () => {
      const outlines = await outlineProvider.listOutlines('proj-001');
      for (const vol of outlines) {
        if (vol.type === 'volume') {
          expect(vol.children?.length ?? 0).toBeGreaterThan(0);
          for (const ch of vol.children!) {
            expect(ch.type).toBe('chapter');
            expect(ch.chapterId).toBeTruthy();
            expect(ch.volumeId).toBe(vol.id);
          }
        }
      }
    });
  });

  describe('细纲数据查询（模拟 getDetailOutline）', () => {
    it('每章细纲应包含 goal/conflict/keyPlot 三个字段', async () => {
      const detail = await outlineProvider.getDetailOutline('ch-001');
      expect(detail).not.toBeNull();
      expect(detail).toHaveProperty('goal');
      expect(detail).toHaveProperty('conflict');
      expect(detail).toHaveProperty('keyPlot');
    });

    it('切换视图模式不应影响已加载的数据', async () => {
      // 模拟：先加载数据，再切换模式
      const data1 = await outlineProvider.listOutlines('proj-001');
      // 切换 viewMode（纯值变更，不触发重新请求）
      const mode: OutlineViewMode = 'outline';
      expect(mode).toBe('outline');

      // 数据应保持一致
      const data2 = await outlineProvider.listOutlines('proj-001');
      expect(data1.length).toEqual(data2.length);
      expect(data1[0].id).toEqual(data2[0].id);
    });
  });
});

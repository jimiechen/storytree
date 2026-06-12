import { describe, it, expect } from 'vitest';
import { NovelOutlineProvider } from './novel-outline';

const provider = new NovelOutlineProvider();

describe('NovelOutlineProvider', () => {
  describe('listOutlines', () => {
    it('应返回按 orderIndex 排序的大纲树', async () => {
      const outlines = await provider.listOutlines('proj-001');
      expect(outlines).toHaveLength(1);
      expect(outlines[0].type).toBe('volume');
      expect(outlines[0].title).toBe('第一卷：雪岭觉醒');
      expect(outlines[0].children).toHaveLength(3);
    });

    it('返回的应是深拷贝（外部修改不污染内部）', async () => {
      const outlines = await provider.listOutlines('proj-001');
      const originalTitle = outlines[0].title;
      outlines[0].title = '被篡改的标题';

      const again = await provider.listOutlines('proj-001');
      expect(again[0].title).toBe(originalTitle);
    });

    it('不存在的项目返回空数组', async () => {
      const outlines = await provider.listOutlines('nonexistent');
      expect(outlines).toEqual([]);
    });

    it('章节点包含正确的 chapterId 和 volumeId', async () => {
      const outlines = await provider.listOutlines('proj-001');
      const firstChapter = outlines[0].children![0];
      expect(firstChapter.chapterId).toBe('ch-001');
      expect(firstChapter.volumeId).toBe('vol-001');
      expect(firstChapter.starred).toBeUndefined();
    });

    it('星标章节点 starred 为 true', async () => {
      const outlines = await provider.listOutlines('proj-001');
      const thirdChapter = outlines[0].children![2];
      expect(thirdChapter.starred).toBe(true);
    });
  });

  describe('getDetailOutline', () => {
    it('应返回章节的细纲（goal + conflict + keyPlot）', async () => {
      const detail = await provider.getDetailOutline('ch-001');
      expect(detail).not.toBeNull();
      expect(detail!.goal).toContain('苏瑶');
      expect(detail!.conflict).toContain('异兽');
      expect(detail!.keyPlot).toContain('卡牌');
    });

    it('不存在的章节ID返回 null', async () => {
      const detail = await provider.getDetailOutline('ch-nonexistent');
      expect(detail).toBeNull();
    });

    it('返回的应是副本（修改不影响原数据）', async () => {
      const detail = await provider.getDetailOutline('ch-001');
      const originalGoal = detail!.goal;
      detail!.goal = '被篡改的目标';

      const again = await provider.getDetailOutline('ch-001');
      expect(again!.goal).toBe(originalGoal);
    });
  });

  describe('generateOutline', () => {
    it('应返回大纲数组（Mock 预设数据）', async () => {
      const result = await provider.generateOutline('proj-001');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('volume');
      expect(result[0].children).toBeDefined();
    });

    it('对无数据项目也应返回默认大纲', async () => {
      const result = await provider.generateOutline('new-proj');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});

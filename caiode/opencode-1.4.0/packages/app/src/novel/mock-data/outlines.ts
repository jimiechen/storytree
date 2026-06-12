import type { OutlineNode } from '../types';

/**
 * 大纲种子数据
 *
 * 基于 proj-001（山海关外·异兽录）的 3 个章节构造
 * 结构：卷 > 章 两级层级
 */
export const mockOutlines: OutlineNode[] = [
  {
    id: 'vol-001',
    type: 'volume',
    title: '第一卷：雪岭觉醒',
    orderIndex: 0,
    children: [
      {
        id: 'ol-ch-001',
        type: 'chapter',
        title: '第一章：雪岭异兽',
        orderIndex: 0,
        chapterId: 'ch-001',
        volumeId: 'vol-001',
      },
      {
        id: 'ol-ch-002',
        type: 'chapter',
        title: '第二章：流萤夜火',
        orderIndex: 1,
        chapterId: 'ch-002',
        volumeId: 'vol-001',
      },
      {
        id: 'ol-ch-003',
        type: 'chapter',
        title: '第三章：失落符牌',
        orderIndex: 2,
        chapterId: 'ch-003',
        volumeId: 'vol-001',
        starred: true,
      },
    ],
  },
];

/** 获取所有章节点（扁平化，便于列表渲染） */
export const mockOutlineChapters = (): OutlineNode[] => {
  const result: OutlineNode[] = [];
  for (const vol of mockOutlines) {
    if (vol.children) {
      for (const ch of vol.children) {
        result.push({ ...ch });
      }
    }
  }
  return result;
};

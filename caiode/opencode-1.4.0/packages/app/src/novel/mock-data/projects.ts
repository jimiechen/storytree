import type { Project } from '../types';

export const mockProjects: Project[] = [
  {
    id: 'proj-001',
    name: '山海关外·异兽录',
    genre: '奇幻',
    description: '在一个由巨大机械发条驱动的王国里，一位年轻的铸卡师发现了能改写现实的神秘卡牌...',
    totalWordCount: 12400,
    chapterCount: 3,
    characterCount: 3,
    lastUpdated: new Date('2026-05-08T14:32:00'),
    status: 'active'
  },
  {
    id: 'proj-002',
    name: '星辰变',
    genre: '玄幻',
    description: '一个少年从废柴到强者的逆袭之路...',
    totalWordCount: 89600,
    chapterCount: 42,
    characterCount: 8,
    lastUpdated: new Date('2026-06-10T09:15:00'),
    status: 'active'
  },
  {
    id: 'proj-003',
    name: '江南烟雨',
    genre: '古言',
    description: '江南烟雨中，一段跨越时空的爱恋...',
    totalWordCount: 45200,
    chapterCount: 18,
    characterCount: 5,
    lastUpdated: new Date('2026-06-01T16:45:00'),
    status: 'active'
  },
  {
    id: 'proj-004',
    name: '赛博侦探社',
    genre: '科幻',
    description: '2077 年的霓虹灯下，一个私家侦探卷入了惊天阴谋...',
    totalWordCount: 3200,
    chapterCount: 5,
    characterCount: 4,
    lastUpdated: new Date('2026-05-20T11:20:00'),
    status: 'draft'
  }
];

/** 向后兼容：默认导出第一个项目 */
export const mockProject: Project = mockProjects[0];

import type { Project } from '../types';

export const mockProject: Project = {
  id: 'proj-001',
  name: '山海关外·异兽录',
  genre: '奇幻',
  description: '在一个由巨大机械发条驱动的王国里，一位年轻的铸卡师发现了能改写现实的神秘卡牌...',
  totalWordCount: 12400,
  chapterCount: 3,
  characterCount: 3,
  lastUpdated: new Date('2026-05-08T14:32:00'),
  status: 'active'
};

// 书架多项目数据
export const mockProjects: Project[] = [
  mockProject,
  {
    id: 'proj-002',
    name: '星辰之海',
    genre: '科幻',
    description: '在遥远的未来，人类已经殖民了银河系，年轻的星际导航员苏瑶踏上了寻找失踪父亲的旅程...',
    totalWordCount: 45000,
    chapterCount: 5,
    characterCount: 4,
    lastUpdated: new Date('2026-06-01T10:15:00'),
    status: 'active'
  },
  {
    id: 'proj-003',
    name: '斗破苍穹·续',
    genre: '玄幻',
    description: '萧炎成就斗帝之后，新的位面通道开启，更强大的敌人正在暗处窥视...',
    totalWordCount: 0,
    chapterCount: 0,
    characterCount: 0,
    lastUpdated: new Date('2026-06-05T09:00:00'),
    status: 'draft'
  },
  {
    id: 'proj-004',
    name: '都市修仙传',
    genre: '都市',
    description: '一个普通大学生意外获得上古修仙传承，在现代社会中低调修炼，逐渐揭开隐藏在都市背后的修真世界...',
    totalWordCount: 32000,
    chapterCount: 12,
    characterCount: 6,
    lastUpdated: new Date('2026-05-28T18:45:00'),
    status: 'active'
  },
  {
    id: 'proj-005',
    name: '穿越之我是皇帝',
    genre: '穿越',
    description: '现代历史系研究生穿越到架空王朝，成为即将被废黜的太子，凭借历史知识在朝堂上步步为营...',
    totalWordCount: 18000,
    chapterCount: 8,
    characterCount: 5,
    lastUpdated: new Date('2026-05-20T14:20:00'),
    status: 'archived'
  }
];

// 书架统计数据
export const mockBookshelfData = {
  totalProjects: mockProjects.length,
  totalWordCount: mockProjects.reduce((sum, p) => sum + p.totalWordCount, 0),
  totalChapters: mockProjects.reduce((sum, p) => sum + p.chapterCount, 0),
  activeProjects: mockProjects.filter(p => p.status === 'active').length,
  draftProjects: mockProjects.filter(p => p.status === 'draft').length,
  archivedProjects: mockProjects.filter(p => p.status === 'archived').length,
};

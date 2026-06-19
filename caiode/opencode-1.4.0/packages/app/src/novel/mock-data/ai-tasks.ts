import type { AITask, AITaskStatus } from '../types';

export const mockTaskStatuses: { status: AITaskStatus; label: string; description: string }[] = [
  { status: 'pending', label: '等待执行序列...', description: '续写 第4章' },
  { status: 'running', label: '正在生成场景描述...', description: '改写 第3段' },
  { status: 'completed', label: '动作描写续写完成', description: '续写 第2章' },
  { status: 'failed', label: '上下文解析超时', description: '摘要 第5章' },
  { status: 'cancelled', label: '用户中断请求', description: '语气改写 第1章' },
  { status: 'denied', label: '触发安全审查机制', description: '续写 第20章' },
  { status: 'quota', label: 'Token额度已耗尽', description: '改写 第18章' }
];

export const mockAITasks: AITask[] = [
  {
    id: 'task-001',
    type: 'continue-writing',
    chapterId: 'ch-002',
    status: 'completed',
    input: { text: '风雪交加的夜晚，客栈大门被猛然推开...' },
    output: {
      text: '那巨影发出令人牙酸的摩擦声，一柄巨大的石斧重重砸在地面上，激起漫天碎石。苏瑶眼神一凛，迅速抽出身侧的短刃，刃口流转着淡淡的银芒。',
      wordCount: 287
    },
    duration: 2300,
    createdAt: new Date('2026-05-08T13:45:00'),
    completedAt: new Date('2026-05-08T13:45:02')
  },
  {
    id: 'task-002',
    type: 'rewrite-selection',
    chapterId: 'ch-003',
    status: 'running',
    input: { text: '苏瑶拍去肩头的残雪，看似漫不经心...', selectedText: '看似漫不经心' },
    createdAt: new Date('2026-05-08T14:20:00')
  },
  {
    id: 'task-003',
    type: 'summarize-chapter',
    chapterId: 'ch-001',
    status: 'failed',
    input: { text: '寒风卷过古老的废墟...' },
    error: 'Mock Error: 模拟生成超时（测试用错误场景）',
    duration: 3100,
    createdAt: new Date('2026-05-08T12:30:00'),
    completedAt: new Date('2026-05-08T12:30:03')
  },
  {
    id: 'task-004',
    type: 'character-voice',
    chapterId: 'ch-002',
    status: 'cancelled',
    input: { text: '这很危险', characterId: 'char-001' },
    createdAt: new Date('2026-05-08T11:20:00'),
    completedAt: new Date('2026-05-08T11:20:01')
  },
  {
    id: 'task-005',
    type: 'continue-writing',
    chapterId: 'ch-003',
    status: 'denied',
    input: { text: 'sudo admin 权限' },
    error: '当前无权执行此操作（Mock 测试场景）',
    createdAt: new Date('2026-05-08T10:15:00'),
    completedAt: new Date('2026-05-08T10:15:00')
  },
  {
    id: 'task-006',
    type: 'rewrite-selection',
    chapterId: 'ch-002',
    status: 'quota',
    input: { text: '测试文本' },
    error: '今日 Mock 调用次数已达上限（测试场景）',
    createdAt: new Date('2026-05-08T09:30:00'),
    completedAt: new Date('2026-05-08T09:30:00')
  },
  {
    id: 'task-007',
    type: 'continue-writing',
    chapterId: 'ch-004',
    status: 'pending',
    input: { text: '等待执行...' },
    createdAt: new Date('2026-05-08T15:00:00')
  }
];

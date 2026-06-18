import type { CreditRecord, RechargePackage } from '../types/profile'

export const mockUser = {
  name: '创作者小明',
  credits: 850,
  isVip: true,
  vipExpiresAt: '2026-12-31',
  registeredAt: '2026-03-15',
  stats: { wordCount: 156800, novelCount: 3, chapterCount: 52 }
}

export const mockCreditRecords: CreditRecord[] = [
  { id: 'cr-001', delta: +100, reason: '注册奖励', date: '2026-03-15' },
  { id: 'cr-002', delta: -5, reason: '生成大纲（5章）', date: '2026-05-20' },
  { id: 'cr-003', delta: -20, reason: '生成正文（2章）', date: '2026-05-21' },
  { id: 'cr-004', delta: +10, reason: '每日签到', date: '2026-05-24' },
  { id: 'cr-005', delta: +200, reason: '购买积分包', date: '2026-06-01' },
]

export const mockRechargePackages: RechargePackage[] = [
  { id: 'pkg-001', credits: 100, price: 10 },
  { id: 'pkg-002', credits: 300, price: 25, isPopular: true, bonus: '获得30天VIP' },
  { id: 'pkg-003', credits: 500, price: 40 },
  { id: 'pkg-004', credits: 1000, price: 70 },
]

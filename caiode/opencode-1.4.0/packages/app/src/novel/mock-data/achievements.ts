import type { Achievement } from '../types/achievement'

export const mockAchievements: Achievement[] = [
  // 已解锁
  { id: 'ach-001', title: '初出茅庐', emoji: '🎯', category: 'creation', isUnlocked: true, unlockedAt: '2026-05-20', description: '完成首次创作' },
  { id: 'ach-002', title: '笔耕不辍', emoji: '📝', category: 'creation', isUnlocked: true, unlockedAt: '2026-05-22', description: '连续3天每日创作' },
  { id: 'ach-003', title: '第一章', emoji: '📄', category: 'creation', isUnlocked: true, unlockedAt: '2026-05-21', description: '完成小说第一章' },
  { id: 'ach-004', title: '角色诞生', emoji: '👤', category: 'creation', isUnlocked: true, unlockedAt: '2026-05-25', description: '创建第一个角色' },
  { id: 'ach-005', title: '世界观构建', emoji: '🌍', category: 'creation', isUnlocked: true, unlockedAt: '2026-05-28', description: '完善世界设定' },
  { id: 'ach-006', title: 'AI 助手', emoji: '🤖', category: 'creation', isUnlocked: true, unlockedAt: '2026-06-01', description: '首次使用AI续写' },
  { id: 'ach-007', title: '连续签到7天', emoji: '🔥', category: 'growth', isUnlocked: true, unlockedAt: '2026-05-27', description: '连续签到一周' },
  { id: 'ach-008', title: '首次分享', emoji: '📢', category: 'social', isUnlocked: true, unlockedAt: '2026-06-02', description: '分享作品到社区' },
  { id: 'ach-009', title: '获得点赞', emoji: '❤️', category: 'social', isUnlocked: true, unlockedAt: '2026-06-03', description: '作品获得首个点赞' },
  { id: 'ach-010', title: '评论达人', emoji: '💬', category: 'social', isUnlocked: true, unlockedAt: '2026-06-05', description: '收到10条评论' },
  { id: 'ach-011', title: '加入书架', emoji: '📚', category: 'growth', isUnlocked: true, unlockedAt: '2026-05-20', description: '收藏第一本小说' },
  { id: 'ach-012', title: '首次导出', emoji: '📥', category: 'creation', isUnlocked: true, unlockedAt: '2026-06-08', description: '导出作品文件' },
  // 进行中
  { id: 'ach-013', title: '万字长篇', emoji: '📖', category: 'growth', isUnlocked: false, description: '创作总字数达到10万字', progress: { current: 15680, target: 100000 } },
  { id: 'ach-014', title: '百章达成', emoji: '🏆', category: 'growth', isUnlocked: false, description: '完成100个章节', progress: { current: 52, target: 100 } },
  { id: 'ach-015', title: '十本小说', emoji: '📕', category: 'growth', isUnlocked: false, description: '创建10本小说', progress: { current: 3, target: 10 } },
  { id: 'ach-016', title: '百万字作家', emoji: '✍️', category: 'growth', isUnlocked: false, description: '创作总字数达到100万字', progress: { current: 156800, target: 1000000 } },
  { id: 'ach-017', title: '创作365天', emoji: '📅', category: 'growth', isUnlocked: false, description: '坚持创作一整年', progress: { current: 89, target: 365 } },
  { id: 'ach-018', title: '粉丝破百', emoji: '🌟', category: 'social', isUnlocked: false, description: '拥有100个粉丝', progress: { current: 23, target: 100 } },
  { id: 'ach-019', title: '评论过千', emoji: '🔥', category: 'social', isUnlocked: false, description: '收到1000条评论', progress: { current: 156, target: 1000 } },
  // 未解锁（无进度）
  { id: 'ach-020', title: '完本大神', emoji: '👑', category: 'creation', isUnlocked: false, description: '完成一本小说' },
  { id: 'ach-021', title: '签约作者', emoji: '📋', category: 'special', isUnlocked: false, description: '成为平台签约作者' },
  { id: 'ach-022', title: '畅销榜第一', emoji: '🥇', category: 'special', isUnlocked: false, description: '登上畅销榜首' },
  { id: 'ach-023', title: 'IP 改编', emoji: '🎬', category: 'special', isUnlocked: false, description: '作品获得IP改编' },
  { id: 'ach-024', title: '全勤奖', emoji: '🏅', category: 'special', isUnlocked: false, description: '连续30天每日更新' },
  { id: 'ach-025', title: '收藏过万', emoji: '💎', category: 'social', isUnlocked: false, description: '作品收藏数破万' },
]

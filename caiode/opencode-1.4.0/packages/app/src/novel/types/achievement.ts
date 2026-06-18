export type AchievementCategory = 'all' | 'creation' | 'social' | 'growth' | 'special'

export interface Achievement {
  id: string
  title: string
  description: string
  emoji: string
  category: Exclude<AchievementCategory, 'all'>
  isUnlocked: boolean
  unlockedAt?: string
  progress?: { current: number; target: number }
}

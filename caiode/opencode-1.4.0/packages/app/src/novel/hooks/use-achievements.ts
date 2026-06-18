import { createSignal, createMemo } from 'solid-js'
import type { AchievementCategory } from '../types/achievement'
import { mockAchievements } from '../mock-data/achievements'

export function useAchievements() {
  const [activeCategory, setActiveCategory] = createSignal<AchievementCategory>('all')

  const stats = createMemo(() => {
    const total = mockAchievements.length
    const unlocked = mockAchievements.filter(a => a.isUnlocked).length
    return {
      total,
      unlocked,
      locked: total - unlocked,
      completionRate: total > 0 ? Math.round((unlocked / total) * 100) : 0,
    }
  })

  const filtered = createMemo(() =>
    activeCategory() === 'all'
      ? mockAchievements
      : mockAchievements.filter(a => a.category === activeCategory())
  )

  return { activeCategory, setActiveCategory, stats, filtered }
}

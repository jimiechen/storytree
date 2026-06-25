import { createSignal, createMemo } from 'solid-js'
import type { AchievementCategory } from '../types/achievement'
import { mockAchievements } from '../mock-data/achievements'

/** 签到状态 */
export interface SigninState {
  /** 今日是否已签到 */
  signedToday: boolean
  /** 连续签到天数 */
  streak: number
  /** 累计签到天数 */
  totalDays: number
  /** 上次签到日期（ISO yyyy-MM-dd） */
  lastSigninDate: string | null
}

/** 获取今日日期（本地时区，yyyy-MM-dd） */
function today(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 计算两个日期相差天数（仅精确到日） */
function diffDays(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00')
  const db = new Date(b + 'T00:00:00')
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24))
}

const STORAGE_KEY = 'novel.signin.state'

function loadSigninState(): SigninState {
  if (typeof localStorage === 'undefined') {
    return { signedToday: false, streak: 0, totalDays: 0, lastSigninDate: null }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { signedToday: false, streak: 0, totalDays: 0, lastSigninDate: null }
    const parsed = JSON.parse(raw) as SigninState
    // 跨天重置 signedToday
    if (parsed.lastSigninDate && parsed.lastSigninDate !== today()) {
      return { ...parsed, signedToday: false }
    }
    return parsed
  } catch {
    return { signedToday: false, streak: 0, totalDays: 0, lastSigninDate: null }
  }
}

function saveSigninState(state: SigninState): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // 忽略写入失败
  }
}

export function useAchievements() {
  const [activeCategory, setActiveCategory] = createSignal<AchievementCategory>('all')
  const [signinState, setSigninState] = createSignal<SigninState>(loadSigninState())
  const [signinReward, setSigninReward] = createSignal<number | null>(null)

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

  /** 执行签到：返回获得的积分（mock：固定 +10） */
  const signin = (): number => {
    const current = signinState()
    if (current.signedToday) {
      return 0
    }
    const t = today()
    const newStreak = current.lastSigninDate && diffDays(current.lastSigninDate, t) === 1
      ? current.streak + 1
      : 1
    const reward = 10
    const next: SigninState = {
      signedToday: true,
      streak: newStreak,
      totalDays: current.totalDays + 1,
      lastSigninDate: t,
    }
    setSigninState(next)
    saveSigninState(next)
    setSigninReward(reward)
    return reward
  }

  return {
    activeCategory,
    setActiveCategory,
    stats,
    filtered,
    signinState,
    signinReward,
    signin,
  }
}

export type NovelGenre = '玄幻' | '都市' | '穿越' | '科幻' | '仙侠' | '悬疑' | '言情' | '其他'
export type NovelTargetLength = '10万字' | '30万字' | '50万字' | '100万字' | '200万字以上'

export interface GuideOption {
  value: string
  label: string
  emoji?: string
  description?: string
}

export interface GuideQuestion {
  id: number
  question: string
  subtitle?: string
  type: 'single-choice' | 'multi-choice' | 'text-input'
  options?: GuideOption[]
}

export interface GuideProject {
  id: string
  title: string
  genre: NovelGenre
  targetLength: NovelTargetLength
  answers: Record<number, string | string[]>
  currentStep: number
  createdAt: string
  updatedAt: string
}

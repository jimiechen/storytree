export interface CreditRecord {
  id: string
  delta: number
  reason: string
  date: string
}

export interface RechargePackage {
  id: string
  credits: number
  price: number
  isPopular?: boolean
  bonus?: string
}

export type ProfileTab = 'credits' | 'recharge' | 'export' | 'import' | 'ai-model'

// PAGE-11: AI 模型设置（localStorage 持久化）
export interface AIModelSettings {
  /** 选中的模型 profile ID */
  modelProfileId: string
  /** API Key（明文存储，浏览器端） */
  apiKey: string
  /** API 端点 */
  baseURL: string
  /** 生成温度 */
  temperature: number
  /** 最大 tokens */
  maxTokens: number
  /** 最后更新时间（ISO 字符串） */
  updatedAt: string
}

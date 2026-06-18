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

export type ProfileTab = 'credits' | 'recharge' | 'export' | 'import'

import { createSignal } from 'solid-js'
import type { ProfileTab } from '../types/profile'
import { mockUser, mockCreditRecords, mockRechargePackages } from '../mock-data/profile'

export function useProfile() {
  const [activeTab, setActiveTab] = createSignal<ProfileTab>('credits')
  return {
    activeTab,
    setActiveTab,
    user: mockUser,
    creditRecords: mockCreditRecords,
    rechargePackages: mockRechargePackages,
  }
}

import { createSignal } from 'solid-js'
import type { WorldTab } from '../types/world'
import { mockWorldSetting } from '../mock-data/world-settings'

export function useWorldSetting(_projectId: string) {
  const [activeTab, setActiveTab] = createSignal<WorldTab>('location')
  const data = mockWorldSetting
  return {
    activeTab,
    setActiveTab,
    overview: data.overview,
    locations: data.locations,
    items: data.items,
    skills: data.skills,
    factions: data.factions,
  }
}

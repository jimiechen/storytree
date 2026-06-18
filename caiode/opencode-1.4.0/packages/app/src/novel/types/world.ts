export interface WorldOverview {
  background: string
  powerSystem: string
  socialStructure: string
  specialRules: string
}

export interface WorldLocation {
  id: string
  name: string
  tags: string[]
  description: string
}

export interface WorldItem {
  id: string
  name: string
  type: string
  tags: string[]
  description: string
}

export interface WorldSkill {
  id: string
  name: string
  type: string
  level?: string
  description: string
}

export interface WorldFaction {
  id: string
  name: string
  type: string
  description: string
  influence: 'high' | 'medium' | 'low'
}

export interface WorldSetting {
  projectId: string
  overview: WorldOverview
  locations: WorldLocation[]
  items: WorldItem[]
  skills: WorldSkill[]
  factions: WorldFaction[]
}

export type WorldTab = 'location' | 'item' | 'skill' | 'faction'

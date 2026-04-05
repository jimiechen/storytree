/**
 * 知识资产类型定义
 * Knowledge Assets Type Definitions
 */

/**
 * 角色状态
 */
export type CharacterStatus = 'active' | 'archived' | 'draft';

/**
 * 角色关系类型
 */
export type RelationshipType = 'friend' | 'enemy' | 'family' | 'lover' | 'mentor' | 'rival' | 'neutral' | 'custom';

/**
 * 角色关系
 */
export interface CharacterRelationship {
  targetCharacterId: string;
  type: RelationshipType;
  description?: string;
  customTypeName?: string; // 当 type 为 'custom' 时使用
}

/**
 * 角色卡片
 */
export interface Character {
  id: string;
  projectId: string;
  name: string;
  aliases?: string[];
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  occupation?: string;
  appearance?: string;
  personality?: string;
  backstory?: string;
  goals?: string;
  relationships: CharacterRelationship[];
  notes?: string;
  status: CharacterStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 世界观设定分类
 */
export type WorldSettingCategory = 'geography' | 'magic' | 'history' | 'culture' | 'politics' | 'technology' | 'religion' | 'custom';

/**
 * 世界观设定
 */
export interface WorldSetting {
  id: string;
  projectId: string;
  title: string;
  category: WorldSettingCategory;
  customCategoryName?: string; // 当 category 为 'custom' 时使用
  content: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  relatedCharacterIds: string[];
  relatedChapterIds: string[];
  tags: string[];
  status: 'active' | 'archived' | 'draft';
  createdAt: string;
  updatedAt: string;
}

/**
 * 知识库状态
 */
export interface KnowledgeState {
  // 角色数据
  characters: Character[];
  currentCharacter: Character | null;
  
  // 世界观数据
  worldSettings: WorldSetting[];
  currentWorldSetting: WorldSetting | null;
  
  // 加载状态
  isLoading: boolean;
  error: string | null;
  
  // 角色操作方法
  setCharacters: (characters: Character[]) => void;
  addCharacter: (character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => Character;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  setCurrentCharacter: (character: Character | null) => void;
  
  // 世界观操作方法
  setWorldSettings: (worldSettings: WorldSetting[]) => void;
  addWorldSetting: (setting: Omit<WorldSetting, 'id' | 'createdAt' | 'updatedAt'>) => WorldSetting;
  updateWorldSetting: (id: string, updates: Partial<WorldSetting>) => void;
  deleteWorldSetting: (id: string) => void;
  setCurrentWorldSetting: (setting: WorldSetting | null) => void;
  
  // 通用方法
  clearError: () => void;
}

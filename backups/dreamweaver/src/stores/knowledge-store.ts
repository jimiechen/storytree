import { create } from 'zustand';
import type { KnowledgeState, Character, WorldSetting } from '@/types/knowledge';

/**
 * 生成唯一 ID
 */
const generateId = () => {
  return `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 获取当前时间 ISO 字符串
 */
const getCurrentTimestamp = () => new Date().toISOString();

/**
 * 知识库状态管理 Store
 * Knowledge Assets State Management
 */
export const useKnowledgeStore = create<KnowledgeState>()((set, get) => ({
  // 初始状态
  characters: [],
  currentCharacter: null,
  worldSettings: [],
  currentWorldSetting: null,
  isLoading: false,
  error: null,

  /**
   * 设置角色列表
   */
  setCharacters: (characters) => {
    set({ characters, error: null });
  },

  /**
   * 设置世界观设定列表
   */
  setWorldSettings: (worldSettings) => {
    set({ worldSettings, error: null });
  },

  /**
   * 添加角色
   */
  addCharacter: (characterData) => {
    const newCharacter: Character = {
      id: generateId(),
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      ...characterData,
    };

    set((state) => ({
      characters: [...state.characters, newCharacter],
      currentCharacter: newCharacter,
      error: null,
    }));

    return newCharacter;
  },

  /**
   * 更新角色
   */
  updateCharacter: (id, updates) => {
    set((state) => {
      const characterIndex = state.characters.findIndex((c) => c.id === id);
      
      if (characterIndex === -1) {
        return { error: `Character with id ${id} not found` };
      }

      const updatedCharacters = [...state.characters];
      updatedCharacters[characterIndex] = {
        ...updatedCharacters[characterIndex],
        ...updates,
        updatedAt: getCurrentTimestamp(),
      };

      const updatedCharacter = updatedCharacters[characterIndex];

      return {
        characters: updatedCharacters,
        currentCharacter: state.currentCharacter?.id === id 
          ? updatedCharacter 
          : state.currentCharacter,
        error: null,
      };
    });
  },

  /**
   * 删除角色
   */
  deleteCharacter: (id) => {
    set((state) => {
      const characterExists = state.characters.some((c) => c.id === id);
      
      if (!characterExists) {
        return { error: `Character with id ${id} not found` };
      }

      return {
        characters: state.characters.filter((c) => c.id !== id),
        currentCharacter: state.currentCharacter?.id === id 
          ? null 
          : state.currentCharacter,
        error: null,
      };
    });
  },

  /**
   * 设置当前角色
   */
  setCurrentCharacter: (character) => {
    set({ currentCharacter: character, error: null });
  },

  /**
   * 添加世界观设定
   */
  addWorldSetting: (settingData) => {
    const newSetting: WorldSetting = {
      id: generateId(),
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      ...settingData,
    };

    set((state) => ({
      worldSettings: [...state.worldSettings, newSetting],
      currentWorldSetting: newSetting,
      error: null,
    }));

    return newSetting;
  },

  /**
   * 更新世界观设定
   */
  updateWorldSetting: (id, updates) => {
    set((state) => {
      const settingIndex = state.worldSettings.findIndex((s) => s.id === id);
      
      if (settingIndex === -1) {
        return { error: `WorldSetting with id ${id} not found` };
      }

      const updatedSettings = [...state.worldSettings];
      updatedSettings[settingIndex] = {
        ...updatedSettings[settingIndex],
        ...updates,
        updatedAt: getCurrentTimestamp(),
      };

      const updatedSetting = updatedSettings[settingIndex];

      return {
        worldSettings: updatedSettings,
        currentWorldSetting: state.currentWorldSetting?.id === id 
          ? updatedSetting 
          : state.currentWorldSetting,
        error: null,
      };
    });
  },

  /**
   * 删除世界观设定
   */
  deleteWorldSetting: (id) => {
    set((state) => {
      const settingExists = state.worldSettings.some((s) => s.id === id);
      
      if (!settingExists) {
        return { error: `WorldSetting with id ${id} not found` };
      }

      return {
        worldSettings: state.worldSettings.filter((s) => s.id !== id),
        currentWorldSetting: state.currentWorldSetting?.id === id 
          ? null 
          : state.currentWorldSetting,
        error: null,
      };
    });
  },

  /**
   * 设置当前世界观设定
   */
  setCurrentWorldSetting: (setting) => {
    set({ currentWorldSetting: setting, error: null });
  },

  /**
   * 清除错误
   */
  clearError: () => {
    set({ error: null });
  },
}));

export default useKnowledgeStore;

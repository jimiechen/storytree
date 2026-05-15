import { describe, it, expect, beforeEach } from 'vitest';
import { useKnowledgeStore } from '@/stores/knowledge-store';
import type { Character, WorldSetting } from '@/types/knowledge';

describe('Knowledge Store', () => {
  beforeEach(() => {
    // 重置 store 状态
    useKnowledgeStore.setState({
      characters: [],
      currentCharacter: null,
      worldSettings: [],
      currentWorldSetting: null,
      isLoading: false,
      error: null,
    });
  });

  describe('Character Management', () => {
    const mockCharacterData = {
      projectId: 'project-1',
      name: 'Test Character',
      age: 25,
      gender: 'male' as const,
      occupation: 'Writer',
      appearance: 'Tall and handsome',
      personality: 'Introverted',
      backstory: 'Born in a small town...',
      goals: 'Become a famous author',
      relationships: [],
      status: 'active' as const,
      tags: ['protagonist', 'main'],
    };

    it('should add a character', () => {
      const store = useKnowledgeStore.getState();
      
      const newCharacter = store.addCharacter(mockCharacterData);
      
      expect(newCharacter).toBeDefined();
      expect(newCharacter.name).toBe('Test Character');
      expect(newCharacter.id).toBeDefined();
      expect(newCharacter.createdAt).toBeDefined();
      expect(newCharacter.updatedAt).toBeDefined();
      
      const state = useKnowledgeStore.getState();
      expect(state.characters).toHaveLength(1);
      expect(state.characters[0].name).toBe('Test Character');
      expect(state.currentCharacter).toEqual(newCharacter);
    });

    it('should update a character', () => {
      const store = useKnowledgeStore.getState();
      
      // 先添加一个角色
      const newCharacter = store.addCharacter(mockCharacterData);
      const characterId = newCharacter.id;
      
      // 更新角色
      store.updateCharacter(characterId, { name: 'Updated Name', age: 30 });
      
      const state = useKnowledgeStore.getState();
      expect(state.characters[0].name).toBe('Updated Name');
      expect(state.characters[0].age).toBe(30);
      expect(state.characters[0].occupation).toBe('Writer'); // 未修改的字段保持不变
    });

    it('should set error when updating non-existent character', () => {
      const store = useKnowledgeStore.getState();
      
      store.updateCharacter('non-existent-id', { name: 'New Name' });
      
      const state = useKnowledgeStore.getState();
      expect(state.error).toContain('not found');
    });

    it('should delete a character', () => {
      const store = useKnowledgeStore.getState();
      
      // 先添加两个角色
      const char1 = store.addCharacter(mockCharacterData);
      const char2 = store.addCharacter({
        ...mockCharacterData,
        name: 'Second Character',
      });
      
      expect(useKnowledgeStore.getState().characters).toHaveLength(2);
      
      // 删除第一个角色
      store.deleteCharacter(char1.id);
      
      const state = useKnowledgeStore.getState();
      expect(state.characters).toHaveLength(1);
      expect(state.characters[0].name).toBe('Second Character');
    });

    it('should set error when deleting non-existent character', () => {
      const store = useKnowledgeStore.getState();
      
      store.deleteCharacter('non-existent-id');
      
      const state = useKnowledgeStore.getState();
      expect(state.error).toContain('not found');
    });

    it('should set current character', () => {
      const store = useKnowledgeStore.getState();
      
      const newCharacter = store.addCharacter(mockCharacterData);
      
      // 清除当前角色
      store.setCurrentCharacter(null);
      expect(useKnowledgeStore.getState().currentCharacter).toBeNull();
      
      // 设置当前角色
      store.setCurrentCharacter(newCharacter);
      expect(useKnowledgeStore.getState().currentCharacter).toEqual(newCharacter);
    });

    it('should update currentCharacter when updating the current character', () => {
      const store = useKnowledgeStore.getState();
      
      const newCharacter = store.addCharacter(mockCharacterData);
      const characterId = newCharacter.id;
      
      // 更新当前角色
      store.updateCharacter(characterId, { name: 'Updated Current' });
      
      const state = useKnowledgeStore.getState();
      expect(state.currentCharacter?.name).toBe('Updated Current');
    });

    it('should clear currentCharacter when deleting the current character', () => {
      const store = useKnowledgeStore.getState();
      
      const newCharacter = store.addCharacter(mockCharacterData);
      const characterId = newCharacter.id;
      
      expect(useKnowledgeStore.getState().currentCharacter).toEqual(newCharacter);
      
      // 删除当前角色
      store.deleteCharacter(characterId);
      
      expect(useKnowledgeStore.getState().currentCharacter).toBeNull();
    });
  });

  describe('WorldSetting Management', () => {
    const mockSettingData = {
      projectId: 'project-1',
      title: 'Magic System',
      category: 'magic' as const,
      content: 'Magic is powered by ancient crystals...',
      importance: 'high' as const,
      relatedCharacterIds: [],
      relatedChapterIds: [],
      tags: ['magic', 'system'],
      status: 'active' as const,
    };

    it('should add a world setting', () => {
      const store = useKnowledgeStore.getState();
      
      const newSetting = store.addWorldSetting(mockSettingData);
      
      expect(newSetting).toBeDefined();
      expect(newSetting.title).toBe('Magic System');
      expect(newSetting.id).toBeDefined();
      
      const state = useKnowledgeStore.getState();
      expect(state.worldSettings).toHaveLength(1);
      expect(state.currentWorldSetting).toEqual(newSetting);
    });

    it('should update a world setting', () => {
      const store = useKnowledgeStore.getState();
      
      const newSetting = store.addWorldSetting(mockSettingData);
      const settingId = newSetting.id;
      
      store.updateWorldSetting(settingId, { title: 'Updated Title', importance: 'critical' });
      
      const state = useKnowledgeStore.getState();
      expect(state.worldSettings[0].title).toBe('Updated Title');
      expect(state.worldSettings[0].importance).toBe('critical');
    });

    it('should delete a world setting', () => {
      const store = useKnowledgeStore.getState();
      
      const setting = store.addWorldSetting(mockSettingData);
      
      expect(useKnowledgeStore.getState().worldSettings).toHaveLength(1);
      
      store.deleteWorldSetting(setting.id);
      
      expect(useKnowledgeStore.getState().worldSettings).toHaveLength(0);
    });

    it('should set current world setting', () => {
      const store = useKnowledgeStore.getState();
      
      const newSetting = store.addWorldSetting(mockSettingData);
      
      store.setCurrentWorldSetting(null);
      expect(useKnowledgeStore.getState().currentWorldSetting).toBeNull();
      
      store.setCurrentWorldSetting(newSetting);
      expect(useKnowledgeStore.getState().currentWorldSetting).toEqual(newSetting);
    });
  });

  describe('Error Handling', () => {
    it('should clear error', () => {
      const store = useKnowledgeStore.getState();
      
      // 触发一个错误
      store.updateCharacter('non-existent', { name: 'Test' });
      expect(useKnowledgeStore.getState().error).not.toBeNull();
      
      // 清除错误
      store.clearError();
      expect(useKnowledgeStore.getState().error).toBeNull();
    });
  });
});

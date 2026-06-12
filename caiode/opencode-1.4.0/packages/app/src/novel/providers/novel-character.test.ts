import { describe, it, expect } from 'vitest';
import { NovelCharacterProvider } from './novel-character';
import type { Character } from '../types';

describe('NovelCharacterProvider - 角色数据访问', () => {
  const getProvider = (): NovelCharacterProvider => new NovelCharacterProvider();

  describe('listCharacters', () => {
    it('应返回指定项目的角色列表', async () => {
      const provider = getProvider();
      const characters = await provider.listCharacters('proj-001');
      expect(characters.length).toBeGreaterThan(0);
    });

    it('返回的每个角色应包含必要字段', async () => {
      const provider = getProvider();
      const characters = await provider.listCharacters('proj-001');
      for (const c of characters) {
        expect(c).toHaveProperty('id');
        expect(c).toHaveProperty('name');
        expect(c).toHaveProperty('role');
        expect(c).toHaveProperty('projectId');
        expect(c).toHaveProperty('personalityTags');
        expect(c).toHaveProperty('goal');
        expect(c).toHaveProperty('secret');
      }
    });

    it('应返回副本，修改不应污染内部状态', async () => {
      const provider = getProvider();
      const characters = await provider.listCharacters('proj-001');
      if (characters.length > 0) {
        characters[0].name = '被篡改的名字';
        const fresh = await provider.listCharacters('proj-001');
        expect(fresh[0].name).not.toBe('被篡改的名字');
      }
    });
  });

  describe('getCharacter', () => {
    it('存在的角色应返回数据', async () => {
      const provider = getProvider();
      const character = await provider.getCharacter('char-001');
      expect(character).not.toBeNull();
      expect(character!.name).toBeTruthy();
    });

    it('不存在的角色应返回 null', async () => {
      const provider = getProvider();
      const character = await provider.getCharacter('char-nonexist');
      expect(character).toBeNull();
    });

    it('返回应为深副本（relationships 独立）', async () => {
      const provider = getProvider();
      const character = await provider.getCharacter('char-001');
      expect(character).not.toBeNull();
      if (character && character.relationships.length > 0) {
        const origLen = character.relationships.length;
        character.relationships.push({ characterId: 'x', characterName: 'Test', type: 'neutral', description: 'y' });
        const fresh = await provider.getCharacter('char-001');
        expect(fresh!.relationships.length).toBe(origLen);
      }
    });
  });

  describe('getCharacterRelationships', () => {
    it('存在角色的关系应返回数组', async () => {
      const provider = getProvider();
      const relationships = await provider.getCharacterRelationships('char-001');
      expect(Array.isArray(relationships)).toBe(true);
    });

    it('不存在角色应抛 NOT_FOUND', async () => {
      const provider = getProvider();
      try {
        await provider.getCharacterRelationships('char-nonexist');
        expect.unreachable('应该抛出错误');
      } catch (e) {
        expect((e as { code: string }).code).toBe('NOT_FOUND');
      }
    });
  });
});

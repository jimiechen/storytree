import type { Character, CharacterRelationship } from '../types';
import type { INovelCharacterProvider, ProviderError } from './index';
import { mockCharacters } from '../mock-data';
import { mockDelay } from '../utils/mock-delay';

export class NovelCharacterProvider implements INovelCharacterProvider {
  private characters = new Map<string, Character>(
    mockCharacters.map(c => [c.id, { ...c, relationships: [...c.relationships] }])
  );

  async listCharacters(projectId: string): Promise<Character[]> {
    await mockDelay(100);
    return Array.from(this.characters.values())
      .filter(c => c.projectId === projectId)
      .map(c => ({ ...c, relationships: [...c.relationships] }));
  }

  async getCharacter(id: string): Promise<Character | null> {
    await mockDelay(100);
    const character = this.characters.get(id);
    return character ? { ...character, relationships: [...character.relationships] } : null;
  }

  async getCharacterRelationships(characterId: string): Promise<CharacterRelationship[]> {
    await mockDelay(100);
    const character = this.characters.get(characterId);
    if (!character) {
      throw { code: 'NOT_FOUND', message: `Character ${characterId} not found` } as ProviderError;
    }
    return [...character.relationships];
  }
}

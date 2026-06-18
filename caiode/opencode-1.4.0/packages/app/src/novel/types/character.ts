export interface CharacterRelationship {
  characterId: string;
  characterName: string;
  type: 'mentor' | 'ally' | 'antagonist' | 'family' | 'neutral';
  description: string;
}

export type CharacterRole = 'protagonist' | 'supporting' | 'antagonist' | 'other';

export interface Character {
  id: string;
  projectId: string;
  name: string;
  role: string;
  roleType?: CharacterRole;
  personalityTags: string[];
  speakingStyle: string;
  goal: string;
  secret: string;
  relationships: CharacterRelationship[];
}

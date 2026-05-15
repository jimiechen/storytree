export interface CharacterRelationship {
  characterId: string;
  characterName: string;
  type: 'mentor' | 'ally' | 'antagonist' | 'family' | 'neutral';
  description: string;
}

export interface Character {
  id: string;
  projectId: string;
  name: string;
  role: string;
  personalityTags: string[];
  speakingStyle: string;
  goal: string;
  secret: string;
  relationships: CharacterRelationship[];
}

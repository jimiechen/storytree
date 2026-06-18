import type { Component } from 'solid-js';
import { CharacterCard } from './character-card';
import type { Character } from '../../types/character';

interface Props {
  characters: Character[];
}

export const CharacterSupporting: Component<Props> = (props) => {
  return (
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {props.characters.map((char) => (
        <CharacterCard
          name={char.name}
          role={char.role}
          tags={char.personalityTags}
          description={`${char.goal}。说话风格：${char.speakingStyle}`}
          relation={char.relationships.map(r => `${r.characterName} (${r.description})`).join(' / ')}
        />
      ))}
    </div>
  );
};

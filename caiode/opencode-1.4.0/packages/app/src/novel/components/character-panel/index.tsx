import type { Component } from 'solid-js';
import { mockCharacters } from '../../mock-data/characters';
import { useNovelNavigation } from '../../hooks/use-novel-navigation';
import { CharacterPageHeader } from './character-page-header';
import { CharacterProtagonist } from './character-protagonist';
import { CharacterSupporting } from './character-supporting';
import { CharacterAntagonist } from './character-antagonist';

export const CharacterPanelPage: Component = () => {
  const nav = useNovelNavigation();
  const protagonists = () => mockCharacters.filter(c => c.roleType === 'protagonist');
  const supporting = () => mockCharacters.filter(c => c.roleType === 'supporting');
  const antagonists = () => mockCharacters.filter(c => c.roleType === 'antagonist');

  return (
    <div data-testid="character-panel-page" class="flex flex-col h-screen bg-[#f8f9ff] overflow-hidden">
      <CharacterPageHeader onBack={() => nav.openView('workspace')} />
      <div class="flex-1 overflow-y-auto px-10 py-8 space-y-8">
        {protagonists().length > 0 && (
          <section>
            <h2 class="text-xl font-bold text-[#0d1c2f] mb-4">主角</h2>
            {protagonists().map((char) => (
              <CharacterProtagonist character={char} />
            ))}
          </section>
        )}
        {supporting().length > 0 && (
          <section>
            <h2 class="text-xl font-bold text-[#0d1c2f] mb-4">配角</h2>
            <CharacterSupporting characters={supporting()} />
          </section>
        )}
        {antagonists().length > 0 && (
          <section>
            <h2 class="text-xl font-bold text-[#0d1c2f] mb-4">反派</h2>
            <CharacterAntagonist characters={antagonists()} />
          </section>
        )}
      </div>
    </div>
  );
};

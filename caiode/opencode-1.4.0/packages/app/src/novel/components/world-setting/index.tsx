import type { Component } from 'solid-js';
import { Switch, Match } from 'solid-js';
import { useWorldSetting } from '../../hooks/use-world-setting';
import { useNovelNavigation } from '../../hooks/use-novel-navigation';
import { WorldPageHeader } from './world-page-header';
import { WorldOverviewBento } from './world-overview-bento';
import { WorldTabNav } from './world-tab-nav';
import { WorldLocationList } from './world-location-list';
import { WorldItemList } from './world-item-list';
import { WorldSkillList } from './world-skill-list';
import { WorldFactionList } from './world-faction-list';

export const WorldSettingPage: Component = () => {
  const nav = useNovelNavigation();
  const world = useWorldSetting('proj-001');

  return (
    <div class="flex flex-col h-screen bg-[#f8f9ff] overflow-hidden">
      <WorldPageHeader onBack={() => nav.openView('workspace')} />
      <div class="flex-1 overflow-y-auto px-10 py-8 space-y-8">
        <section>
          <h2 class="text-xl font-bold text-[#0d1c2f] mb-4">世界概览</h2>
          <WorldOverviewBento overview={world.overview} />
        </section>
        <section>
          <WorldTabNav activeTab={world.activeTab()} onChange={world.setActiveTab} />
          <div class="mt-6">
            <Switch>
              <Match when={world.activeTab() === 'location'}>
                <WorldLocationList locations={world.locations} />
              </Match>
              <Match when={world.activeTab() === 'item'}>
                <WorldItemList items={world.items} />
              </Match>
              <Match when={world.activeTab() === 'skill'}>
                <WorldSkillList skills={world.skills} />
              </Match>
              <Match when={world.activeTab() === 'faction'}>
                <WorldFactionList factions={world.factions} />
              </Match>
            </Switch>
          </div>
        </section>
      </div>
    </div>
  );
};

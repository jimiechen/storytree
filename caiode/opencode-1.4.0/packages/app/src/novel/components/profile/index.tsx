import type { Component } from 'solid-js';
import { Switch, Match } from 'solid-js';
import { useProfile } from '../../hooks/use-profile';
import { useNovelNavigation } from '../../hooks/use-novel-navigation';
import { useAiModelSettings } from '../../hooks/use-ai-model-settings';
import { ProfilePageHeader } from './profile-page-header';
import { ProfileUserCard } from './profile-user-card';
import { ProfileStatsRow } from './profile-stats-row';
import { ProfileTabNav } from './profile-tab-nav';
import { ProfileCreditsTab } from './profile-credits-tab';
import { ProfileRechargeTab } from './profile-recharge-tab';
import { ProfileAiModelTab } from './profile-ai-model-tab';
import { PlaceholderPage } from '../layout/placeholder-page';

export const ProfilePage: Component = () => {
  const nav = useNovelNavigation();
  const profile = useProfile();
  const user = profile.user;
  const aiModel = useAiModelSettings();

  return (
    <div class="flex flex-col h-screen bg-[#f8f9ff] overflow-hidden">
      <ProfilePageHeader onSettings={() => nav.openModal('settings')} />
      <div class="flex-1 overflow-y-auto px-10 py-8 space-y-6">
        <ProfileUserCard
          name={user.name}
          isVip={user.isVip}
          vipExpiresAt={user.vipExpiresAt}
          registeredAt={user.registeredAt}
        />
        <ProfileStatsRow
          wordCount={user.stats.wordCount}
          novelCount={user.stats.novelCount}
          chapterCount={user.stats.chapterCount}
        />
        <div class="bg-white rounded-xl border border-[#cbc3d7] overflow-hidden">
          <ProfileTabNav activeTab={profile.activeTab()} onChange={profile.setActiveTab} />
          <div class="p-6">
            <Switch>
              <Match when={profile.activeTab() === 'credits'}>
                <ProfileCreditsTab credits={user.credits} records={profile.creditRecords} />
              </Match>
              <Match when={profile.activeTab() === 'recharge'}>
                <ProfileRechargeTab packages={profile.rechargePackages} />
              </Match>
              <Match when={profile.activeTab() === 'ai-model'}>
                <ProfileAiModelTab
                  settings={aiModel.settings()}
                  onChange={aiModel.updateSettings}
                  onSave={() => aiModel.saveSettings()}
                  onReset={aiModel.resetSettings}
                  saving={aiModel.saving()}
                  saved={aiModel.saved()}
                />
              </Match>
              <Match when={profile.activeTab() === 'export'}>
                <PlaceholderPage title="导出作品" icon="download" />
              </Match>
              <Match when={profile.activeTab() === 'import'}>
                <PlaceholderPage title="导入作品" icon="upload" />
              </Match>
            </Switch>
          </div>
        </div>
      </div>
    </div>
  );
};

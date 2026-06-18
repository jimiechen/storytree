import type { Component } from 'solid-js';
import { Switch, Match } from 'solid-js';
import { useNovelNavigation } from '../../hooks/use-novel-navigation';
import { BookshelfPage } from '../bookshelf';
import { CreateProjectModal } from '../create-project-modal';
import { Workspace } from '../novel-workspace';
import { NovelEditor } from '../novel-editor';
import { NovelModalHost } from './novel-modal-host';
import { PlaceholderPage } from './placeholder-page';
import { CharacterPanelPage } from '../character-panel';
import { WorldSettingPage } from '../world-setting';
import { ProfilePage } from '../profile';
import { AchievementsPage } from '../achievements';
import { NovelGuidePage } from '../novel-guide';

export const NovelAppShell: Component = () => {
  const nav = useNovelNavigation();

  return (
    <div
      class="flex flex-col h-screen overflow-hidden"
      style={{ background: '#f8f9ff', 'font-family': "'Work Sans', sans-serif", color: '#0d1c2f' }}
    >
      <Switch
        fallback={
          <div class="flex items-center justify-center h-full text-[#7b7486]">
            <p>未知视图: {nav.currentView()}</p>
          </div>
        }
      >
        <Match when={nav.currentView() === 'bookshelf'}>
          <BookshelfPage />
        </Match>

        <Match when={nav.currentView() === 'create-project'}>
          <CreateProjectModal
            onSubmit={async () => nav.openView('workspace')}
            onCancel={() => nav.openView('bookshelf')}
          />
          <div class="flex-1 opacity-30 pointer-events-none">
            <BookshelfPage />
          </div>
        </Match>

        <Match when={nav.currentView() === 'workspace'}>
          <Workspace projectId={nav.projectId} />
        </Match>

        <Match when={nav.currentView() === 'editor'}>
          <NovelEditor />
        </Match>

        <Match when={nav.currentView() === 'guide'}>
          <PlaceholderPage
            title="AI 创作引导"
            icon="school"
            description="25 道题引导 — Phase 5.2 实现"
          />
        </Match>

        <Match when={nav.currentView() === 'character-panel'}>
          <CharacterPanelPage />
        </Match>

        <Match when={nav.currentView() === 'world-setting'}>
          <WorldSettingPage />
        </Match>

        <Match when={nav.currentView() === 'profile'}>
          <ProfilePage />
        </Match>

        <Match when={nav.currentView() === 'tutorial'}>
          <NovelGuidePage />
        </Match>

        <Match when={nav.currentView() === 'achievements'}>
          <AchievementsPage />
        </Match>

        <Match when={nav.currentView() === 'novel-guide'}>
          <NovelGuidePage />
        </Match>
      </Switch>

      <NovelModalHost />
    </div>
  );
};

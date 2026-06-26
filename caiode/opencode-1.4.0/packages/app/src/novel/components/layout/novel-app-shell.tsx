import type { Component } from 'solid-js';
import { Switch, Match } from 'solid-js';
import { useNovelNavigation } from '../../hooks/use-novel-navigation';
import { useNovelView } from '../../hooks/use-novel-view';
import { useNovelProject } from '../../hooks/use-novel-project';
import type { CreateProjectInput } from '../../types';
import { BookshelfPage } from '../bookshelf';
import { CreateProjectModal } from '../create-project-modal';
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
  const { selectProject } = useNovelView();
  const { createProject } = useNovelProject();

  /** 创建项目：调用 Provider 持久化 → 选中项目 → 跳转工作台 */
  const handleCreateProject = async (input: CreateProjectInput) => {
    const project = await createProject(input);
    selectProject(project.id);
    nav.openView('workspace');
  };

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
            onSubmit={handleCreateProject}
            onCancel={() => nav.openView('bookshelf')}
          />
          <div class="flex-1 opacity-30 pointer-events-none">
            <BookshelfPage />
          </div>
        </Match>

        <Match when={nav.currentView() === 'workspace'}>
          <NovelEditor />
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

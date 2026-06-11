import { Show, For } from 'solid-js';
import type { Component } from 'solid-js';
import { useNovelProject } from '../../hooks/use-novel-project';
import { useNovelView } from '../../hooks/use-novel-view';
import type { ToolbarItem, FloatingWidgetData } from '../../types';
import { BookshelfHeader } from './header';
import { SearchBar } from './search-bar';
import { Toolbar } from './toolbar';
import { ProjectGrid } from './project-grid';
import { EmptyState } from './empty-state';
import { FloatingWidgets } from './floating-widgets';

/** 书架页面主组件 — 组合所有子组件 */
export const BookshelfPage: Component = () => {
  const { filteredProjects, searchKeyword, setSearchKeyword, isLoadingList, refetchProjects } = useNovelProject();
  const { setView } = useNovelView();

  const projects = filteredProjects;
  const isEmpty = () => projects().length === 0;

  const toolbarItems: ToolbarItem[] = [
    { id: 'update', label: '更新', icon: '⚡', color: 'text-purple-600 bg-purple-50', action: () => {} },
    { id: 'template', label: '模板', icon: '⊞', color: 'text-orange-600 bg-orange-50', action: () => {} },
    { id: 'doc', label: '文档', icon: '📄', color: 'text-blue-600 bg-blue-50', action: () => {} },
    { id: 'check', label: '审核', icon: '✓', color: 'text-green-600 bg-green-50', action: () => {} },
    { id: 'new', label: '新建', icon: '+', color: 'text-white bg-purple-500', action: () => setView('create-project') },
    { id: 'ai', label: 'AI工具箱', icon: '✨', color: 'text-purple-600 bg-purple-50', action: () => {} },
  ];

  const floatingData: FloatingWidgetData = {
    signinDays: 1,
    signinStreak: 7,
    achievementCount: 12,
    achievementTotal: 98,
    activityTitle: '活动 点击查看',
    totalWords: '150,320',
    onlineUsers: '1,234',
  };

  const handleSelectProject = (id: string) => {
    setView('workspace');
  };

  const handleCreateQuick = () => {
    console.log('[Phase 1.1] 简易创作入口 → Phase 1.2 完整实现');
  };

  const handleCreateProject = () => {
    setView('create-project');
  };

  const handleGuide = () => {
    console.log('[Phase 1.1] 25道题引导入口 → Phase 5.2 完整实现');
  };

  return (
    <div class="flex flex-col h-full bg-gray-50">
      <BookshelfHeader
        projectCount={projects().length}
        onRefresh={() => refetchProjects()}
      />

      <SearchBar
        value={searchKeyword()}
        onInput={setSearchKeyword}
      />

      <Toolbar items={toolbarItems} />

      <Show
        when={!isEmpty()}
        fallback={
          <EmptyState
            onCreateQuick={handleCreateQuick}
            onCreateProject={handleCreateProject}
            onGuide={handleGuide}
          />
        }
      >
        <ProjectGrid
          projects={projects()}
          onSelect={handleSelectProject}
        />
      </Show>

      <FloatingWidgets data={floatingData} />
    </div>
  );
};

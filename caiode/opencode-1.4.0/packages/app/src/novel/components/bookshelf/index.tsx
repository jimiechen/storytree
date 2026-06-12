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

/**
 * 书架页面主组件 — Stitch 原型 02 风格
 *
 * 设计令牌应用:
 * - 背景: #f8f9ff (淡蓝白，非 gray-50)
 * - 字体: Plus Jakarta Sans(标题) / Work Sans(正文)
 * - 主色: #6b38d4 (深紫)
 * - 边框: #cbc3d7 (outline-variant)
 * - 间距: gutter=20px, margin-desktop=40px
 */
export const BookshelfPage: Component = () => {
  const { filteredProjects, searchKeyword, setSearchKeyword, isLoadingList, refetchProjects } = useNovelProject();
  const { setView } = useNovelView();

  const projects = filteredProjects;
  const isEmpty = () => projects().length === 0;

  /** 工具栏按钮 — 匹配原型圆形彩色图标按钮 */
  const toolbarItems: ToolbarItem[] = [
    { id: 'update', label: '更新', icon: '⚡', color: 'text-[#9d4300] bg-[#fff0e1]', action: () => {} },
    { id: 'template', label: '模板', icon: '⊞', color: 'text-[#0058be] bg-[#e0ecff]', action: () => {} },
    { id: 'doc', label: '文档', icon: '📄', color: 'text-[#0058be] bg-[#e0ecff]', action: () => {} },
    { id: 'check', label: '审核', icon: '✓', color: 'text-green-700 bg-green-50', action: () => {} },
    {
      id: 'new',
      label: '新建',
      icon: '+',
      color: 'text-white bg-gradient-to-r from-[#6b38d4] to-[#8455ef]',
      action: () => setView('create-project'),
    },
    { id: 'ai', label: 'AI工具箱', icon: '✨', color: 'text-[#6b38d4] bg-[#e9ddff]', action: () => {} },
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

  return (
    <div
      class="flex flex-col h-full"
      style={{
        background: '#f8f9ff',
        'font-family': "'Work Sans', sans-serif",
        color: '#0d1c2f',
      }}
      data-testid="novel-bookshelf"
    >
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
            onCreateQuick={() => setView('create-project')}
            onCreateProject={() => setView('create-project')}
            onGuide={() => console.log('[Phase 1.1] 25道题引导 → Phase 5.2')}
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

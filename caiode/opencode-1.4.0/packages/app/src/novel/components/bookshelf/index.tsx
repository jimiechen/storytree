import { Show, For } from 'solid-js';
import type { Component } from 'solid-js';
import { useNovelProject } from '../../hooks/use-novel-project';
import { useNovelView } from '../../hooks/use-novel-view';
import { useNovelNavigation } from '../../hooks/use-novel-navigation';
import type { Project } from '../../types';
import { NovelAppLayout } from '../layout/novel-app-layout';
import { NovelIcon } from '../layout/novel-icon';
import { EmptyState } from './empty-state';
import { FloatingWidgets } from './floating-widgets';

/**
 * 书架页面 — Stitch 原型 02 返工版
 *
 * 按 code.html 结构还原:
 * - SideNavBar + TopAppBar (via NovelAppLayout)
 * - 居中搜索框 + help 图标
 * - 工具栏圆形按钮 + 新建 + article/draft 徽标
 * - 大屏 2 列卡片网格 (grid-cols-1 lg:grid-cols-2)
 * - 右下角浮动组件
 */
export const BookshelfPage: Component = () => {
  const { filteredProjects, searchKeyword, setSearchKeyword, isLoadingList, refetchProjects } = useNovelProject();
  const { selectProject } = useNovelView();
  const nav = useNovelNavigation();

  const projects = filteredProjects;
  const isEmpty = () => projects().length === 0;

  const handleSelectProject = (projectId: string) => {
    selectProject(projectId);
    nav.openView('workspace');
  };

  const navItems = [
    { id: 'home', label: '首页', icon: 'home', onClick: () => {} },
    { id: 'bookshelf', label: '书架', icon: 'library_books', active: true, onClick: () => {} },
    { id: 'create', label: '创作', icon: 'edit_note', onClick: () => nav.openView('workspace') },
    { id: 'community', label: '社区', icon: 'groups', onClick: () => {} },
    { id: 'settings', label: '设置', icon: 'settings', onClick: () => nav.openModal('settings') },
  ];

  return (
    <NovelAppLayout
      navItems={navItems}
      topBar={{
        title: '我的书架',
        icon: 'book',
        badge: `${projects().length}本`,
        onRefresh: () => refetchProjects(),
      }}
      onWriteNow={() => nav.openView('create-project')}
    >
      {/* 搜索栏 */}
      <div class="mb-6 space-y-4">
        <div class="relative w-full max-w-2xl mx-auto">
          <NovelIcon
            name="search"
            size={20}
            class="absolute left-4 top-1/2 -translate-y-1/2 text-[#7b7486]"
          />
          <input
            type="text"
            placeholder="搜索小说..."
            value={searchKeyword()}
            onInput={(e) => setSearchKeyword((e.target as HTMLInputElement).value)}
            class="w-full bg-white border border-[#cbc3d7] rounded-full py-3 pl-12 pr-12 text-base focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] outline-none transition-all shadow-sm"
            style={{ 'font-family': "'Work Sans', 'PingFang SC', sans-serif" }}
          />
          <button class="absolute right-4 top-1/2 -translate-y-1/2 text-[#7b7486] hover:text-[#6b38d4] transition-colors">
            <NovelIcon name="help" size={20} />
          </button>
        </div>

        {/* 工具栏 */}
        <div class="flex flex-wrap items-center justify-center gap-3">
          {/* 彩色圆形按钮 */}
          <ToolbarCircle icon="bolt" bg="bg-[#e9ddff]" text="text-[#6b38d4]" />
          <ToolbarCircle icon="grid_view" bg="bg-[#fff0e1]" text="text-[#9d4300]" />
          <ToolbarCircle icon="description" bg="bg-[#e0ecff]" text="text-[#0058be]" />
          <ToolbarCircle icon="check_circle" bg="bg-white" text="text-green-600" border />

          {/* 新建按钮 */}
          <button
            onClick={() => nav.openView('create-project')}
            class="bg-white border border-[#cbc3d7] text-[#6b38d4] rounded-full px-5 py-2 flex items-center gap-2 shadow-sm hover:shadow-md hover:border-[#6b38d4] transition-all text-sm font-medium ml-2 mr-2"
          >
            <NovelIcon name="add" size={16} />
            新建
          </button>

          {/* AI 工具箱 */}
          <ToolbarCircle icon="auto_awesome" bg="bg-white" text="text-[#6b38d4]" border />

          {/* article / draft 双按钮带徽标 */}
          <div class="flex items-center bg-white border border-[#cbc3d7] rounded-full p-1 shadow-sm">
            <ToolbarMini icon="article" badge="2" badgeColor="bg-[#ba1a1a]" />
            <div class="w-px h-4 bg-[#cbc3d7] mx-1" />
            <ToolbarMini icon="draft" badge="5" badgeColor="bg-[#d5e3fd]" badgeText="text-[#494454]" />
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <Show
        when={!isEmpty()}
        fallback={
          <EmptyState
            onCreateQuick={() => nav.openView('create-project')}
            onCreateProject={() => nav.openView('create-project')}
            onGuide={() => nav.openView('guide')}
          />
        }
      >
        {/* 2 列卡片网格 */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl mx-auto pb-24">
          <For each={projects()}>
            {(project) => <ProjectCard project={project} onSelect={() => handleSelectProject(project.id)} />}
          </For>
        </div>
      </Show>

      {/* 浮动组件 */}
      <FloatingWidgets
        data={{
          signinDays: 1,
          signinStreak: 7,
          achievementCount: 12,
          achievementTotal: 98,
          activityTitle: '活动 点击查看',
          totalWords: '134,053,060',
          onlineUsers: '256',
        }}
      />
    </NovelAppLayout>
  );
};

/* ---------- 子组件 ---------- */

/** 工具栏圆形按钮 */
function ToolbarCircle(props: { icon: string; bg: string; text: string; border?: boolean }) {
  return (
    <button
      class={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 ${props.bg} ${props.text} ${
        props.border ? 'border border-[#cbc3d7]' : ''
      }`}
    >
      <NovelIcon name={props.icon} size={18} />
    </button>
  );
}

/** 工具栏小型按钮（带徽标） */
function ToolbarMini(props: {
  icon: string;
  badge: string;
  badgeColor: string;
  badgeText?: string;
}) {
  return (
    <button class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#eff4ff] text-[#494454] transition-colors relative">
      <NovelIcon name={props.icon} size={14} />
      <span
        class={`absolute -top-1 -right-1 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold ${props.badgeColor} ${
          props.badgeText ?? 'text-white'
        }`}
      >
        {props.badge}
      </span>
    </button>
  );
}

/** 项目卡片 — Stitch 02 风格 */
function ProjectCard(props: { project: Project; onSelect: () => void }) {
  const p = props.project;
  const genreColor = () => {
    const map: Record<string, { from: string; to: string; text: string; border: string; bg: string }> = {
      玄幻: { from: '#6b38d4', to: '#8455ef', text: '#6b38d4', border: '#6b38d4', bg: 'rgba(107,56,212,0.1)' },
      奇幻: { from: '#0058be', to: '#2170e4', text: '#0058be', border: '#0058be', bg: 'rgba(0,88,190,0.1)' },
      仙侠: { from: '#059669', to: '#34d399', text: '#059669', border: '#059669', bg: 'rgba(5,150,105,0.1)' },
      科幻: { from: '#7c3aed', to: '#a78bfa', text: '#7c3aed', border: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
      古言: { from: '#be185d', to: '#f472b6', text: '#be185d', border: '#be185d', bg: 'rgba(190,24,93,0.1)' },
      都市: { from: '#0369a1', to: '#38bdf8', text: '#0369a1', border: '#0369a1', bg: 'rgba(3,105,161,0.1)' },
      悬疑: { from: '#4338ca', to: '#818cf8', text: '#4338ca', border: '#4338ca', bg: 'rgba(67,56,202,0.1)' },
      穿越: { from: '#c2410c', to: '#fb923c', text: '#c2410c', border: '#c2410c', bg: 'rgba(194,65,12,0.1)' },
    };
    return map[p.genre] ?? map['玄幻'];
  };

  const c = genreColor();
  const firstChar = p.name.charAt(0);

  return (
    <button
      data-testid="bookshelf-project-card"
      onClick={props.onSelect}
      class="bg-white rounded-xl border border-[#cbc3d7] shadow-sm hover:shadow-lg transition-all duration-300 p-4 flex gap-4 group text-left w-full"
    >
      {/* 封面 */}
      <div
        class="w-24 h-32 rounded-lg shadow-inner shrink-0 flex items-center justify-center overflow-hidden relative"
        style={{ background: `linear-gradient(to bottom right, ${c.from}, ${c.to})` }}
      >
        <div class="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span
          class="text-white font-bold text-2xl opacity-50"
          style={{ 'font-family': "'Plus Jakarta Sans', sans-serif" }}
        >
          {firstChar}
        </span>
      </div>

      {/* 信息区 */}
      <div class="flex flex-col flex-1 py-1">
        <div class="flex justify-between items-start mb-1">
          <h3
            class="text-lg font-bold text-[#0d1c2f] group-hover:text-[#6b38d4] transition-colors"
            style={{ 'font-family': "'Plus Jakarta Sans', sans-serif" }}
          >
            {p.name}
          </h3>
          <span
            class="text-[10px] font-bold px-2 py-1 rounded-md border"
            style={{ color: c.text, 'border-color': c.border, background: c.bg }}
          >
            {p.genre}
          </span>
        </div>

        <p class="text-xs text-[#494454] mb-auto flex items-center gap-1">
          <NovelIcon name="menu_book" size={14} />
          共 {p.chapterCount} 章
        </p>

        <div class="flex items-center justify-between mt-4 pt-3 border-t border-[#d5e3fd]">
          <div class="text-xs text-[#494454] flex items-center gap-1">
            <NovelIcon name="text_snippet" size={16} />
            {p.totalWordCount.toLocaleString()} 字
          </div>
          <div class="text-xs text-[#7b7486] flex items-center gap-1">
            <NovelIcon name="history" size={14} />
            {formatTime(p.lastUpdated)}
          </div>
        </div>
      </div>
    </button>
  );
}

/** 格式化时间 */
function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return '刚刚';
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return '很久以前';
}

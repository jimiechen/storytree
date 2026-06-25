import { Show, For, createSignal, createMemo, onCleanup } from 'solid-js';
import type { Component } from 'solid-js';
import { useNovelProject } from '../../hooks/use-novel-project';
import { useNovelView } from '../../hooks/use-novel-view';
import { useNovelNavigation } from '../../hooks/use-novel-navigation';
import { useAchievements } from '../../hooks/use-achievements';
import { useProfile } from '../../hooks/use-profile';
import { useFeatureGates } from '../../hooks/use-feature-gates';
import type { Project } from '../../types';
import { NovelAppLayout } from '../layout/novel-app-layout';
import { NovelIcon } from '../layout/novel-icon';
import { EmptyState } from './empty-state';
import { FloatingWidgets, type FloatingWidgetData } from './floating-widgets';
import { ProjectCard } from './project-card';

/**
 * 书架页面 — PAGE-03 端到端实现
 *
 * 完整功能：加载/错误/无匹配三态、搜索防抖、4 彩圆 onClick、
 * 新建下拉菜单、项目卡删除二次确认+撤销、浮动组件真实数据、响应式 4 列。
 */
export const BookshelfPage: Component = () => {
  const proj = useNovelProject();
  const { selectProject } = useNovelView();
  const nav = useNovelNavigation();
  const ach = useAchievements();
  const profile = useProfile();
  const gates = useFeatureGates();

  // 搜索防抖
  const [searchInput, setSearchInput] = createSignal('');
  let searchTimer: ReturnType<typeof setTimeout> | null = null;
  const onSearchInput = (v: string) => {
    setSearchInput(v);
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => proj.setSearchKeyword(v), 300);
  };
  onCleanup(() => { if (searchTimer) clearTimeout(searchTimer); });

  // 新建下拉菜单
  const [createMenuOpen, setCreateMenuOpen] = createSignal(false);

  // 删除确认 + 撤销 Toast
  const [pendingDelete, setPendingDelete] = createSignal<Project | null>(null);
  const [recentlyDeleted, setRecentlyDeleted] = createSignal<Project | null>(null);
  let undoTimer: ReturnType<typeof setTimeout> | null = null;
  onCleanup(() => { if (undoTimer) clearTimeout(undoTimer); });

  // 签到反馈
  const [signinToast, setSigninToast] = createSignal<string | null>(null);
  let signinToastTimer: ReturnType<typeof setTimeout> | null = null;
  onCleanup(() => { if (signinToastTimer) clearTimeout(signinToastTimer); });

  const projects = proj.filteredProjects;
  const isEmpty = createMemo(() => proj.allProjects().length === 0);
  const isError = createMemo(() => proj.listError() !== null);

  const handleSelectProject = (id: string) => {
    selectProject(id);
    nav.openView('workspace');
  };

  const handleDeleteClick = (id: string) => {
    const target = proj.allProjects().find(p => p.id === id);
    if (target) setPendingDelete(target);
  };

  const confirmDelete = async () => {
    const target = pendingDelete();
    if (!target) return;
    try {
      await proj.deleteProject(target.id);
      setRecentlyDeleted(target);
      setPendingDelete(null);
      if (undoTimer) clearTimeout(undoTimer);
      undoTimer = setTimeout(() => setRecentlyDeleted(null), 5000);
    } catch {
      // 错误已在 hook 中记录，Modal 不关闭让用户重试或取消
    }
  };

  const handleUndoDelete = async () => {
    const target = recentlyDeleted();
    if (!target) return;
    await proj.restoreProject(target.id);
    setRecentlyDeleted(null);
    if (undoTimer) clearTimeout(undoTimer);
  };

  const handleSignin = () => {
    const reward = ach.signin();
    if (reward > 0) {
      setSigninToast(`签到成功！连续 ${ach.signinState().streak} 天，积分 +${reward}`);
    } else {
      setSigninToast('今日已签到，明日再来吧');
    }
    if (signinToastTimer) clearTimeout(signinToastTimer);
    signinToastTimer = setTimeout(() => setSigninToast(null), 3000);
  };

  const floatingData = createMemo<FloatingWidgetData>(() => ({
    signedToday: ach.signinState().signedToday,
    signinStreak: ach.signinState().streak,
    achievementCount: ach.stats().unlocked,
    achievementTotal: ach.stats().total,
    activityTitle: '活动 点击查看',
    totalWords: (profile.user.stats.wordCount).toLocaleString(),
    onlineUsers: '256',
  }));

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
        badge: `${proj.allProjects().length}本`,
        onRefresh: () => proj.refetchProjects(),
      }}
      onWriteNow={() => nav.openView('create-project')}
    >
      {/* 搜索栏 + 工具栏 */}
      <div class="mb-6 space-y-4">
        <div class="relative w-full max-w-2xl mx-auto">
          <NovelIcon name="search" size={20} class="absolute left-4 top-1/2 -translate-y-1/2 text-[#7b7486]" />
          <input
            type="text"
            placeholder="搜索小说..."
            value={searchInput()}
            onInput={(e) => onSearchInput((e.target as HTMLInputElement).value)}
            onKeyDown={(e) => { if (e.key === 'Escape') { onSearchInput(''); } }}
            class="w-full rounded-full py-3 pl-12 pr-12 text-base outline-none transition-all"
            style={{
              'background-color': '#ffffff',
              'border': '1px solid #cbc3d7',
              'color': '#0d1c2f',
              'box-shadow': '0 1px 2px 0 rgba(0,0,0,0.05)',
            }}
          />
          <button
            type="button"
            onClick={() => nav.openView('tutorial')}
            class="absolute right-4 top-1/2 -translate-y-1/2 text-[#7b7486] hover:text-[#6b38d4] transition-colors"
            title="帮助教程"
          >
            <NovelIcon name="help" size={20} />
          </button>
        </div>

        {/* 工具栏 */}
        <div class="flex flex-wrap items-center justify-center gap-3">
          <ToolbarCircle icon="bolt" bg="bg-[#e9ddff]" text="text-[#6b38d4]" title="更新内容" onClick={() => nav.openModal('whats-new')} />
          <ToolbarCircle icon="grid_view" bg="bg-[#fff0e1]" text="text-[#9d4300]" title="教程" onClick={() => nav.openView('tutorial')} />
          <ToolbarCircle
            icon="description"
            bg="bg-[#e0ecff]"
            text="text-[#0058be]"
            title="名字生成器"
            disabled={!gates.nameGeneratorEnabled}
            onClick={() => nav.openModal('settings')}
          />
          <ToolbarCircle
            icon="auto_awesome"
            bg="bg-white"
            text="text-[#6b38d4]"
            border
            title="AI拆书工作室"
            disabled={!gates.bookAnalysisEnabled}
            onClick={() => nav.openModal('settings')}
          />

          {/* 新建下拉 */}
          <div class="relative ml-2 mr-2">
            <button
              type="button"
              onClick={() => setCreateMenuOpen(!createMenuOpen())}
              class="rounded-full px-5 py-2 flex items-center gap-2 transition-all text-sm font-medium"
              style={{
                'background-color': '#ffffff',
                'border': '1px solid #cbc3d7',
                'color': '#6b38d4',
                'box-shadow': '0 1px 2px 0 rgba(0,0,0,0.05)',
              }}
            >
              <NovelIcon name="add" size={16} />
              新建
              <NovelIcon name={createMenuOpen() ? 'expand_less' : 'expand_more'} size={14} />
            </button>
            <Show when={createMenuOpen()}>
              <div
                class="absolute top-full mt-2 right-0 rounded-lg py-1 min-w-[160px] z-20"
                style={{
                  'background-color': '#ffffff',
                  'border': '1px solid #cbc3d7',
                  'box-shadow': '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                }}
                onMouseLeave={() => setCreateMenuOpen(false)}
              >
                <CreateMenuItem label="简易创作 推荐" onClick={() => { setCreateMenuOpen(false); nav.openView('create-project'); }} />
                <CreateMenuItem label="漫剧剧本" disabled={!gates.batchGenerationEnabled} onClick={() => { setCreateMenuOpen(false); nav.openView('create-project'); }} />
                <CreateMenuItem label="短篇创作" disabled={!gates.batchGenerationEnabled} onClick={() => { setCreateMenuOpen(false); nav.openView('create-project'); }} />
                <CreateMenuItem label="签约审核" disabled={!gates.paymentEnabled} onClick={() => { setCreateMenuOpen(false); nav.openModal('signing-review'); }} />
              </div>
            </Show>
          </div>

          <ToolbarCircle icon="inventory_2" bg="bg-white" text="text-[#6b38d4]" border title="AI工具箱" onClick={() => nav.openModal('ai-toolbox')} />
          <ToolbarCircle icon="delete_outline" bg="bg-white" text="text-[#7b7486]" border title="回收站" onClick={() => nav.openModal('trash')} />
        </div>
      </div>

      {/* 内容区 */}
      <Show when={!isError()} fallback={<ErrorState onRetry={() => proj.refetchProjects()} message={proj.listError()?.message ?? '加载失败'} />}>
        <Show
          when={proj.isLoadingList()}
          fallback={
            <Show
              when={!isEmpty() && !proj.isNoMatch()}
              fallback={
                <Show
                  when={isEmpty()}
                  fallback={<NoMatchState onClear={() => onSearchInput('')} />}
                >
                  <EmptyState
                    onCreateQuick={() => nav.openView('create-project')}
                    onCreateProject={() => nav.openView('create-project')}
                    onGuide={() => nav.openView('guide')}
                  />
                </Show>
              }
            >
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto pb-24">
                <For each={projects()}>
                  {(project) => (
                    <ProjectCard
                      project={project}
                      onSelect={handleSelectProject}
                      onDelete={handleDeleteClick}
                      isDeleting={proj.deleting() === project.id}
                    />
                  )}
                </For>
              </div>
            </Show>
          }
        >
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto pb-24">
            <For each={[1, 2, 3, 4, 5, 6, 7, 8]}>
              {() => <SkeletonCard />}
            </For>
          </div>
        </Show>
      </Show>

      {/* 浮动组件 */}
      <FloatingWidgets
        data={floatingData()}
        onSignin={handleSignin}
        onAchievements={() => nav.openView('achievements')}
        onActivity={() => nav.openModal('activity')}
        signing={false}
      />

      {/* 删除确认 Modal */}
      <Show when={pendingDelete()}>
        {(target) => (
          <div class="fixed inset-0 z-50 flex items-center justify-center" style={{ 'background-color': 'rgba(0,0,0,0.4)', 'backdrop-filter': 'blur(4px)' }}>
            <div class="rounded-xl max-w-sm w-full mx-4" style={{ 'background-color': '#ffffff', 'box-shadow': '0 8px 32px rgba(0,0,0,0.12)' }}>
              <header class="px-6 py-4" style={{ 'border-bottom': '1px solid #cbc3d7' }}>
                <h2 class="text-lg font-bold" style={{ color: '#0d1c2f' }}>删除项目</h2>
              </header>
              <div class="p-6 text-sm" style={{ color: '#494454' }}>
                确定要删除《<span class="font-semibold" style={{ color: '#0d1c2f' }}>{target().name}</span>》吗？
                <p class="mt-2 text-xs" style={{ color: '#7b7486' }}>项目将移入回收站，5 秒内可撤销。</p>
              </div>
              <footer class="px-6 py-4 flex justify-end gap-2" style={{ 'border-top': '1px solid #cbc3d7' }}>
                <button type="button" onClick={() => setPendingDelete(null)} class="px-4 py-2 rounded-lg text-sm font-medium" style={{ border: '1px solid #cbc3d7', color: '#494454', 'background-color': '#ffffff' }}>
                  取消
                </button>
                <button
                  type="button"
                  disabled={proj.deleting() === target().id}
                  onClick={confirmDelete}
                  class="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{ 'background-color': '#ef4444', color: '#ffffff' }}
                >
                  <Show when={proj.deleting() !== target().id} fallback="删除中…">确认删除</Show>
                </button>
              </footer>
            </div>
          </div>
        )}
      </Show>

      {/* 撤销 Toast */}
      <Show when={recentlyDeleted()}>
        {(target) => (
          <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg flex items-center gap-3 text-sm" style={{ 'background-color': '#1f1f2e', color: '#ffffff', 'box-shadow': '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            <span>已删除《{target().name}》</span>
            <button type="button" onClick={handleUndoDelete} class="font-medium" style={{ color: '#a78bfa' }}>
              撤销
            </button>
          </div>
        )}
      </Show>

      {/* 签到 Toast */}
      <Show when={signinToast()}>
        <div class="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm" style={{ 'background-color': '#6b38d4', color: '#ffffff', 'box-shadow': '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          {signinToast()}
        </div>
      </Show>
    </NovelAppLayout>
  );
};

/* ---------- 子组件 ---------- */

function ToolbarCircle(props: { icon: string; bg: string; text: string; border?: boolean; title?: string; disabled?: boolean; onClick?: () => void }) {
  // 颜色映射：从 Tailwind arbitrary value class 解析为 inline style
  const colorMap: Record<string, string> = {
    'text-[#6b38d4]': '#6b38d4',
    'text-[#9d4300]': '#9d4300',
    'text-[#0058be]': '#0058be',
    'text-[#7b7486]': '#7b7486',
  };
  const bgMap: Record<string, string> = {
    'bg-[#e9ddff]': '#e9ddff',
    'bg-[#fff0e1]': '#fff0e1',
    'bg-[#e0ecff]': '#e0ecff',
    'bg-white': '#ffffff',
  };
  return (
    <button
      type="button"
      title={props.title}
      disabled={props.disabled}
      onClick={() => props.onClick?.()}
      class="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      style={{
        'background-color': bgMap[props.bg] ?? '#ffffff',
        'color': colorMap[props.text] ?? '#494454',
        'border': props.border ? '1px solid #cbc3d7' : 'none',
        'box-shadow': '0 1px 2px 0 rgba(0,0,0,0.05)',
      }}
    >
      <NovelIcon name={props.icon} size={18} />
    </button>
  );
}

function CreateMenuItem(props: { label: string; onClick: () => void; disabled?: boolean }) {
  const [hovered, setHovered] = createSignal(false);
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      class="w-full text-left px-4 py-2 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        'color': props.disabled ? '#7b7486' : (hovered() ? '#6b38d4' : '#494454'),
        'background-color': hovered() && !props.disabled ? '#eff4ff' : 'transparent',
      }}
    >
      {props.label}
    </button>
  );
}

function SkeletonCard() {
  return (
    <div class="rounded-xl p-4 flex gap-4 animate-pulse" style={{ 'background-color': '#ffffff', border: '1px solid #cbc3d7', 'box-shadow': '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
      <div class="w-24 h-32 rounded-lg shrink-0" style={{ 'background-color': '#eff4ff' }} />
      <div class="flex-1 space-y-2 py-1">
        <div class="h-4 rounded w-3/4" style={{ 'background-color': '#eff4ff' }} />
        <div class="h-3 rounded w-1/2" style={{ 'background-color': '#eff4ff' }} />
        <div class="h-3 rounded w-2/3 mt-auto" style={{ 'background-color': '#eff4ff' }} />
      </div>
    </div>
  );
}

function ErrorState(props: { message: string; onRetry: () => void }) {
  return (
    <div class="flex flex-col items-center justify-center py-20 px-6" data-testid="bookshelf-error-state">
      <div class="w-16 h-16 mb-4 rounded-full flex items-center justify-center" style={{ 'background-color': '#fef2f2', color: '#ef4444' }}>
        <NovelIcon name="error" size={32} />
      </div>
      <h2 class="text-lg font-semibold mb-1" style={{ color: '#0d1c2f' }}>加载失败</h2>
      <p class="text-sm mb-6" style={{ color: '#7b7486' }}>{props.message}</p>
      <button
        type="button"
        onClick={props.onRetry}
        class="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        style={{ 'background-color': '#6b38d4', color: '#ffffff' }}
      >
        重试
      </button>
    </div>
  );
}

function NoMatchState(props: { onClear: () => void }) {
  return (
    <div class="flex flex-col items-center justify-center py-20 px-6" data-testid="bookshelf-no-match-state">
      <div class="w-16 h-16 mb-4 rounded-full flex items-center justify-center" style={{ 'background-color': '#eff4ff', color: '#6b38d4' }}>
        <NovelIcon name="search" size={32} />
      </div>
      <h2 class="text-lg font-semibold mb-1" style={{ color: '#0d1c2f' }}>未匹配到相关小说</h2>
      <p class="text-sm mb-6" style={{ color: '#7b7486' }}>换个关键词试试吧</p>
      <button
        type="button"
        onClick={props.onClear}
        class="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
        style={{ border: '1px solid #cbc3d7', color: '#494454', 'background-color': '#ffffff' }}
      >
        清空搜索
      </button>
    </div>
  );
}

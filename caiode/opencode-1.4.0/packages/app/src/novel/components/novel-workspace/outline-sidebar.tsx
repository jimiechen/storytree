import { Show, For } from 'solid-js';
import type { Component } from 'solid-js';
import type { OutlineViewMode, OutlineNode } from '../../types';
import type { Chapter } from '../../types';
import { ChapterList } from '../novel-editor/chapter-list';
import { NovelIcon } from '../layout/novel-icon';

interface OutlineSidebarProps {
  projectName: string;
  lastEdited: string;
  chapters: Chapter[];
  selectedId: string;
  onSelect: (id: string) => void;
  viewMode: () => OutlineViewMode;
  onSwitchView: (mode: OutlineViewMode) => void;
  outlines: OutlineNode[] | undefined;
  loading: boolean;
  onGenerateOutline?: () => void;
  onGenerateDetail?: () => void;
}

const NAV_ITEMS: { mode: OutlineViewMode; label: string; icon: string }[] = [
  { mode: 'outline', label: '大纲', icon: 'auto_stories' },
  { mode: 'chapter', label: '章节', icon: 'format_list_bulleted' },
  { mode: 'detail', label: '细纲', icon: 'description' },
];

/** SideNav — 左侧导航面板，按 Stitch 04 code.html 还原 */
export const OutlineSidebar: Component<OutlineSidebarProps> = (props) => {
  const isActive = (mode: OutlineViewMode) => props.viewMode() === mode;

  return (
    <aside class="bg-white border-r border-[#cbc3d7] shadow-sm h-full w-[260px] flex flex-col py-6 shrink-0 z-10">
      {/* 项目信息 */}
      <div class="px-4 flex items-center gap-3 mb-4">
        <div class="w-10 h-10 bg-[#8455ef] text-white rounded-lg flex items-center justify-center shrink-0">
          <NovelIcon name="menu_book" size={20} />
        </div>
        <div class="overflow-hidden">
          <h2
            class="text-base font-bold text-[#6b38d4] truncate"
            style={{ 'font-family': "'Plus Jakarta Sans', 'PingFang SC', sans-serif" }}
          >
            {props.projectName}
          </h2>
          <p class="text-xs text-[#494454] truncate">{props.lastEdited}</p>
        </div>
      </div>

      {/* 导航项 */}
      <nav class="px-2 space-y-1">
        <For each={NAV_ITEMS}>
          {(item) => (
            <button
              class={`w-full flex items-center px-3 py-2.5 rounded-md text-left transition-all ${
                isActive(item.mode)
                  ? 'text-[#6b38d4] border-l-4 border-[#6b38d4] bg-[#eff4ff] font-bold'
                  : 'text-[#494454] hover:bg-[#e6eeff] border-l-4 border-transparent'
              }`}
              onClick={() => props.onSwitchView(item.mode)}
            >
              <NovelIcon name={item.icon} size={20} class="mr-3" fill={isActive(item.mode)} />
              <span class="text-sm">{item.label}</span>
            </button>
          )}
        </For>
      </nav>

      <hr class="border-[#cbc3d7] mx-4 my-4" />

      {/* 内容区 */}
      <div class="flex-1 overflow-y-auto px-2">
        <Show when={!props.loading} fallback={<SidebarEmpty text="加载中..." />}>
          <Show when={isActive('outline')}>
            <OutlineTreeView
              outlines={props.outlines}
              selectedId={props.selectedId}
              onSelect={props.onSelect}
            />
          </Show>
          <Show when={isActive('chapter')}>
            <ChapterList
              chapters={props.chapters}
              selectedId={props.selectedId}
              onSelect={props.onSelect}
            />
          </Show>
          <Show when={isActive('detail')}>
            <DetailView chapters={props.chapters} selectedId={props.selectedId} onSelect={props.onSelect} />
          </Show>
        </Show>
      </div>

      {/* AI 操作按钮 */}
      <div class="px-4 space-y-2 mt-2">
        <button
          class="w-full bg-gradient-to-r from-[#6b38d4] to-[#6d3bd7] text-white py-2.5 rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
          onClick={props.onGenerateOutline}
        >
          <NovelIcon name="magic_button" size={18} />
          <span>AI生成大纲</span>
        </button>
        <button
          class="w-full bg-white border border-[#cbc3d7] text-[#6b38d4] py-2.5 rounded-lg text-sm font-medium hover:bg-[#eff4ff] transition-colors"
          onClick={props.onGenerateDetail}
        >
          生成细纲
        </button>
      </div>

      {/* 底部帮助/反馈 */}
      <div class="mt-auto pt-4 px-2 border-t border-[#cbc3d7] space-y-1">
        <button class="w-full flex items-center px-3 py-2 rounded-md text-[#494454] hover:bg-[#e6eeff] transition-all text-left">
          <NovelIcon name="help" size={20} class="mr-3" />
          <span class="text-sm">帮助中心</span>
        </button>
        <button class="w-full flex items-center px-3 py-2 rounded-md text-[#494454] hover:bg-[#e6eeff] transition-all text-left">
          <NovelIcon name="feedback" size={20} class="mr-3" />
          <span class="text-sm">反馈</span>
        </button>
      </div>
    </aside>
  );
};

/* ---------- 子组件 ---------- */

interface SidebarEmptyProps {
  text: string;
}

function SidebarEmpty(props: SidebarEmptyProps) {
  return (
    <div class="flex items-center justify-center h-full text-[#7b7486] text-sm">
      {props.text}
    </div>
  );
}

interface OutlineTreeViewProps {
  outlines: OutlineNode[] | undefined;
  selectedId: string;
  onSelect: (id: string) => void;
}

function OutlineTreeView(props: OutlineTreeViewProps) {
  return (
    <div class="py-1">
      <Show
        when={props.outlines && props.outlines.length > 0}
        fallback={<SidebarEmpty text="暂无大纲" />}
      >
        <For each={props.outlines}>
          {(volume) => (
            <div class="mb-1">
              <div class="px-3 py-2 text-xs font-semibold text-[#7b7486] uppercase tracking-wider flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-[#6b38d4]"></span>
                {volume.title}
              </div>
              <For each={volume.children}>
                {(chapter) => {
                  const isSel = chapter.chapterId === props.selectedId;
                  return (
                    <button
                      class={`w-full text-left px-5 py-2 transition-colors flex items-center gap-2 ${
                        isSel
                          ? 'bg-[#eff4ff] border-r-2 border-r-[#6b38d4] text-[#6b38d4]'
                          : 'hover:bg-[#f8f9ff] text-[#0d1c2f]'
                      }`}
                      onClick={() => chapter.chapterId && props.onSelect(chapter.chapterId)}
                    >
                      <Show when={chapter.starred} fallback={<span class="w-4"></span>}>
                        <NovelIcon name="star" size={14} class="text-[#fd761a]" fill />
                      </Show>
                      <span class="text-sm truncate">{chapter.title}</span>
                    </button>
                  );
                }}
              </For>
            </div>
          )}
        </For>
      </Show>
    </div>
  );
}

interface DetailViewProps {
  chapters: Chapter[];
  selectedId: string;
  onSelect: (id: string) => void;
}

function DetailView(props: DetailViewProps) {
  return (
    <div class="py-1">
      <Show when={props.chapters.length > 0} fallback={<SidebarEmpty text="暂无章节" />}>
        <For each={props.chapters}>
          {(chapter) => {
            const isSel = chapter.id === props.selectedId;
            return (
              <button
                class={`w-full text-left px-4 py-3 border-b border-[#e6eeff] transition-colors ${
                  isSel ? 'bg-[#eff4ff]' : 'hover:bg-[#f8f9ff]'
                }`}
                onClick={() => props.onSelect(chapter.id)}
              >
                <div class="text-sm font-medium text-[#0d1c2f] mb-1">{chapter.title}</div>
                <DetailField label="目标" value={chapter.outline.goal} />
                <DetailField label="冲突" value={chapter.outline.conflict} />
                <DetailField label="关键情节" value={chapter.outline.keyPlot} />
              </button>
            );
          }}
        </For>
      </Show>
    </div>
  );
}

function DetailField(props: { label: string; value: string }) {
  return (
    <div class="mb-0.5 ml-2">
      <span class="text-[10px] text-[#7b7486]">{props.label}</span>
      <p class="text-xs text-[#494454] line-clamp-2">{props.value}</p>
    </div>
  );
}

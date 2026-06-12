import { Show, For } from 'solid-js';
import type { Component } from 'solid-js';
import type { OutlineViewMode, OutlineNode } from '../../types';
import type { Chapter, ChapterOutline } from '../../types';
import { ChapterList } from '../novel-editor/chapter-list';

interface OutlineSidebarProps {
  /** 章节列表（用于章节视图和细纲视图） */
  chapters: Chapter[];
  /** 当前选中的章节ID */
  selectedId: string;
  /** 选择章节回调 */
  onSelect: (id: string) => void;
  /** 当前视图模式 */
  viewMode: () => OutlineViewMode;
  /** 切换视图模式 */
  onSwitchView: (mode: OutlineViewMode) => void;
  /** 大纲树数据 */
  outlines: OutlineNode[] | undefined;
  /** 是否加载中 */
  loading: boolean;
  /** AI生成大纲 */
  onGenerateOutline?: () => void;
  /** 生成细纲 */
  onGenerateDetail?: () => void;
}

/** Tab 配置 */
const VIEW_TABS: { mode: OutlineViewMode; label: string }[] = [
  { mode: 'outline', label: '大纲' },
  { mode: 'detail', label: '细纲' },
  { mode: 'chapter', label: '章节' },
];

/**
 * OutlineSidebar — 左侧三视图面板
 *
 * 替代 Workspace 中纯 ChapterList 的左侧区域，
 * 提供大纲/细纲/章节三种视图切换。
 *
 * 数据来源：useNovelOutline Hook（不直接 import mock-data）
 */
export const OutlineSidebar: Component<OutlineSidebarProps> = (props) => {
  return (
    <div class="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      {/* Tab 切换器 */}
      <div class="flex border-b border-gray-200">
        <For each={VIEW_TABS}>
          {(tab) => {
            const isActive = props.viewMode() === tab.mode;
            return (
              <button
                class={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-indigo-700 border-b-2 border-indigo-500 bg-indigo-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => props.onSwitchView(tab.mode)}
              >
                {tab.label}
              </button>
            );
          }}
        </For>
      </div>

      {/* 内容区 */}
      <div class="flex-1 overflow-y-auto">
        <Show when={!props.loading} fallback={<SidebarEmpty text="加载中..." />}>
          {/* 大纲视图 */}
          <Show when={props.viewMode() === 'outline'}>
            <OutlineTreeView
              outlines={props.outlines}
              selectedId={props.selectedId}
              onSelect={props.onSelect}
            />
          </Show>

          {/* 细纲视图 */}
          <Show when={props.viewMode() === 'detail'}>
            <DetailView chapters={props.chapters} selectedId={props.selectedId} onSelect={props.onSelect} />
          </Show>

          {/* 章节视图 */}
          <Show when={props.viewMode() === 'chapter'}>
            <ChapterList
              chapters={props.chapters}
              selectedId={props.selectedId}
              onSelect={props.onSelect}
            />
          </Show>
        </Show>
      </div>

      {/* 底部操作栏 */}
      <div class="p-3 border-t border-gray-200 space-y-2">
        <button
          class="w-full py-2 px-3 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-md hover:from-purple-600 hover:to-pink-600 transition-all"
          onClick={props.onGenerateOutline}
        >
          AI 生成大纲
        </button>
        <button
          class="w-full py-2 px-3 text-xs font-medium text-indigo-600 bg-white border border-indigo-200 rounded-md hover:bg-indigo-50 transition-colors"
          onClick={props.onGenerateDetail}
        >
          生成细纲
        </button>
      </div>
    </div>
  );
};

/* ---------- 子组件 ---------- */

interface SidebarEmptyProps {
  text: string;
}

function SidebarEmpty(props: SidebarEmptyProps) {
  return (
    <div class="flex items-center justify-center h-full text-gray-400 text-sm">
      {props.text}
    </div>
  );
}

/** 大纲树视图（卷 > 章） */
interface OutlineTreeViewProps {
  outlines: OutlineNode[] | undefined;
  selectedId: string;
  onSelect: (id: string) => void;
}

function OutlineTreeView(props: OutlineTreeViewProps) {
  return (
    <div class="py-2">
      <Show
        when={props.outlines && props.outlines.length > 0}
        fallback={<SidebarEmpty text="暂无大纲" />}
      >
        <For each={props.outlines}>
          {(volume) => (
            <div class="mb-1">
              {/* 卷标题 */}
              <div class="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                {volume.title}
              </div>
              {/* 章节列表 */}
              <For each={volume.children}>
                {(chapter) => {
                  const isSelected = chapter.chapterId === props.selectedId;
                  return (
                    <button
                      class={`w-full text-left px-6 py-2.5 transition-colors ${
                        isSelected
                          ? 'bg-blue-50 border-r-2 border-r-blue-500 text-blue-900'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                      onClick={() => chapter.chapterId && props.onSelect(chapter.chapterId)}
                    >
                      <div class="flex items-center gap-2">
                        {chapter.starred && (
                          <span class="text-yellow-400 text-xs" title="星标">&#9733;</span>
                        )}
                        {!chapter.starred && <span class="w-3"></span>}
                        <span class="text-sm">{chapter.title}</span>
                      </div>
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

/** 细纲视图（每章的 goal / conflict / keyPlot） */
interface DetailViewProps {
  chapters: Chapter[];
  selectedId: string;
  onSelect: (id: string) => void;
}

function DetailView(props: DetailViewProps) {
  return (
    <div class="py-2">
      <Show
        when={props.chapters.length > 0}
        fallback={<SidebarEmpty text="暂无章节" />}
      >
        <For each={props.chapters}>
          {(chapter) => {
            const isSelected = chapter.id === props.selectedId;
            return (
              <button
                class={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
                  isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => props.onSelect(chapter.id)}
              >
                <div class="text-sm font-medium text-gray-800 mb-1.5">{chapter.title}</div>
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

/** 细纲字段行 */
interface DetailFieldProps {
  label: string;
  value: string;
}

function DetailField(props: DetailFieldProps) {
  return (
    <div class="mb-1 ml-2">
      <span class="text-[10px] text-gray-400">{props.label}</span>
      <p class="text-xs text-gray-600 line-clamp-2">{props.value}</p>
    </div>
  );
}

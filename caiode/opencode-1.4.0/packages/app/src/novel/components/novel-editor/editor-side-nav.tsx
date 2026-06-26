/**
 * @file editor-side-nav.tsx
 * @description PAGE-10 统一工作台左侧导航 — 合并 Workspace SideNav + 章节列表
 *
 * 包含：项目名、导航按钮（大纲/章节/角色/世界/导出）、章节列表、创建章节按钮
 */

import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';
import { NovelIcon } from '../layout/novel-icon';
import type { Chapter } from '../../types';

export interface EditorSideNavProps {
  projectName: string;
  chapters: Chapter[];
  selectedChapterId: string;
  lastEdited?: string;
  onSelectChapter: (id: string) => void;
  onCreateChapter: () => void;
  onDeleteChapter: (id: string) => void;
  onOpenCharacters?: () => void;
  onOpenWorldSetting?: () => void;
  onOpenExport?: () => void;
  onOpenHelp?: () => void;
  onOpenFeedback?: () => void;
  onGenerateOutline?: () => void;
  onGenerateDetail?: () => void;
}

/** 章节状态 → 颜色点 */
function statusColor(status: Chapter['status']): string {
  switch (status) {
    case 'draft': return '#cbc3d7';
    case 'revising': return '#f59e0b';
    case 'completed': return '#10b981';
    case 'published': return '#6b38d4';
    default: return '#cbc3d7';
  }
}

export const EditorSideNav: Component<EditorSideNavProps> = (props) => {
  return (
    <div class="flex flex-col h-full py-4 gap-3">
      {/* 项目名 */}
      <div class="px-4 flex items-center gap-3">
        <div class="w-9 h-9 bg-[#8455ef] text-white rounded-lg flex items-center justify-center shrink-0">
          <NovelIcon name="menu_book" size={18} />
        </div>
        <div class="overflow-hidden">
          <h2
            class="text-sm font-bold text-[#6b38d4] truncate"
            style={{ 'font-family': "'Plus Jakarta Sans', 'PingFang SC', sans-serif" }}
          >
            {props.projectName}
          </h2>
          <p class="text-xs text-[#7b7486] truncate">
            {props.lastEdited ?? '最后编辑于刚刚'}
          </p>
        </div>
      </div>

      {/* 导航按钮 */}
      <nav class="px-2 space-y-0.5">
        <button
          class="w-full flex items-center px-3 py-1.5 rounded-md text-left text-[#494454] hover:bg-[#e6eeff] border-l-4 border-transparent transition-colors"
          onClick={props.onGenerateOutline}
        >
          <NovelIcon name="auto_stories" size={18} class="mr-2.5" />
          <span class="text-sm">大纲</span>
        </button>
        <button
          data-testid="sidenav-chapters"
          class="w-full flex items-center px-3 py-1.5 rounded-md text-left text-[#6b38d4] bg-[#8455ef]/10 border-l-4 border-[#6b38d4] font-medium transition-colors"
        >
          <NovelIcon name="format_list_bulleted" size={18} class="mr-2.5" />
          <span class="text-sm">章节</span>
        </button>
        <button
          class="w-full flex items-center px-3 py-1.5 rounded-md text-left text-[#494454] hover:bg-[#e6eeff] border-l-4 border-transparent transition-colors"
          onClick={props.onOpenCharacters}
        >
          <NovelIcon name="groups" size={18} class="mr-2.5" />
          <span class="text-sm">人物</span>
        </button>
        <button
          class="w-full flex items-center px-3 py-1.5 rounded-md text-left text-[#494454] hover:bg-[#e6eeff] border-l-4 border-transparent transition-colors"
          onClick={props.onOpenWorldSetting}
        >
          <NovelIcon name="psychology" size={18} class="mr-2.5" />
          <span class="text-sm">设定</span>
        </button>
        <button
          class="w-full flex items-center px-3 py-1.5 rounded-md text-left text-[#494454] hover:bg-[#e6eeff] border-l-4 border-transparent transition-colors"
          onClick={props.onOpenExport}
        >
          <NovelIcon name="import_export" size={18} class="mr-2.5" />
          <span class="text-sm">导出</span>
        </button>
      </nav>

      <hr class="border-[#cbc3d7] mx-4" />

      {/* 章节列表 */}
      <div class="flex-1 overflow-y-auto px-2 space-y-0.5" data-testid="editor-chapter-list">
        <For each={props.chapters}>
          {(chapter) => (
            <div
              data-testid="editor-chapter-item"
              class={`group flex items-center px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                chapter.id === props.selectedChapterId
                  ? 'bg-[#eff4ff]'
                  : 'hover:bg-[#e6eeff]'
              }`}
              onClick={() => props.onSelectChapter(chapter.id)}
            >
              <span
                class="w-2 h-2 rounded-full shrink-0 mr-2"
                style={{ background: statusColor(chapter.status) }}
              />
              <span class="text-sm text-[#0d1c2f] truncate flex-1">{chapter.title}</span>
              <Show when={chapter.id === props.selectedChapterId}>
                <button
                  data-testid={`delete-chapter-${chapter.id}`}
                  class="text-[#7b7486] hover:text-red-500 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onDeleteChapter(chapter.id);
                  }}
                >
                  <NovelIcon name="delete" size={16} />
                </button>
              </Show>
            </div>
          )}
        </For>
      </div>

      {/* 创建章节按钮 */}
      <div class="px-4 pb-2">
        <button
          data-testid="create-chapter-btn"
          onClick={props.onCreateChapter}
          class="w-full bg-gradient-to-r from-[#6b38d4] to-[#6d3bd7] text-white py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
        >
          <NovelIcon name="add" size={16} />
          <span>新建章节</span>
        </button>
      </div>

      {/* 底部 */}
      <div class="pt-2 px-2 border-t border-[#cbc3d7] space-y-0.5">
        <button
          class="w-full flex items-center px-3 py-1.5 rounded-md text-left text-[#494454] hover:bg-[#e6eeff] border-l-4 border-transparent transition-colors"
          onClick={props.onOpenHelp}
        >
          <NovelIcon name="help" size={18} class="mr-2.5" />
          <span class="text-sm">帮助</span>
        </button>
        <button
          class="w-full flex items-center px-3 py-1.5 rounded-md text-left text-[#494454] hover:bg-[#e6eeff] border-l-4 border-transparent transition-colors"
          onClick={props.onOpenFeedback}
        >
          <NovelIcon name="feedback" size={18} class="mr-2.5" />
          <span class="text-sm">反馈</span>
        </button>
      </div>
    </div>
  );
};

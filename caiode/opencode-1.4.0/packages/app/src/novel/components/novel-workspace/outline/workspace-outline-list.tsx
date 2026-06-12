import { For } from 'solid-js';
import type { Component } from 'solid-js';
import { NovelIcon } from '../../layout/novel-icon';

export interface OutlineChapter {
  id: string;
  title: string;
  expanded?: boolean;
  completed?: boolean;
  starred?: boolean;
}

export interface WorkspaceOutlineListActions {
  onSelectChapter?: (id: string) => void;
  onToggleStar?: (id: string) => void;
  onToggleExpand?: (id: string) => void;
  onToggleComplete?: (id: string) => void;
}

interface WorkspaceOutlineListProps extends WorkspaceOutlineListActions {
  chapters: OutlineChapter[];
  selectedId?: string;
}

/** 左侧章节/大纲列表 — Stitch 04 code.html */
export const WorkspaceOutlineList: Component<WorkspaceOutlineListProps> = (props) => {
  return (
    <div class="flex-1 overflow-y-auto px-2 space-y-1">
      <For each={props.chapters}>
        {(chapter) => (
          <div
            class={`group flex items-center justify-between px-2 py-2 rounded-md cursor-pointer transition-colors ${
              chapter.id === props.selectedId ? 'bg-[#eff4ff]' : 'hover:bg-[#e6eeff]'
            }`}
            onClick={() => props.onSelectChapter?.(chapter.id)}
          >
            <div class="flex items-center gap-2 overflow-hidden">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  props.onToggleExpand?.(chapter.id);
                }}
                class="text-[#7b7486] hover:text-[#6b38d4] transition-colors shrink-0"
              >
                <NovelIcon
                  name="arrow_drop_down"
                  size={18}
                  class={chapter.expanded ? '' : '-rotate-90'}
                />
              </button>
              <input
                type="checkbox"
                checked={chapter.completed}
                onClick={(e) => e.stopPropagation()}
                onChange={() => props.onToggleComplete?.(chapter.id)}
                class="h-4 w-4 text-[#6b38d4] rounded border-[#cbc3d7] focus:ring-[#6b38d4] shrink-0"
              />
              <span class="text-sm text-[#0d1c2f] truncate">{chapter.title}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                props.onToggleStar?.(chapter.id);
              }}
              class="text-[#7b7486] hover:text-[#6b38d4] transition-colors shrink-0"
            >
              <NovelIcon name="star" size={18} fill={chapter.starred} />
            </button>
          </div>
        )}
      </For>
    </div>
  );
};

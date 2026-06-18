import { For } from 'solid-js';
import type { Chapter } from '../../types';

interface ChapterListProps {
  chapters: Chapter[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const statusConfig = {
  completed: { dot: 'bg-green-500', label: '已完成', textClass: 'text-green-700' },
  revising: { dot: 'bg-blue-500', label: '修订中', textClass: 'text-blue-700' },
  draft: { dot: 'bg-gray-400', label: '草稿', textClass: 'text-gray-600' },
  published: { dot: 'bg-green-600', label: '已发布', textClass: 'text-green-800' }
};

export function ChapterList(props: ChapterListProps) {
  return (
    <div class="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      <div class="p-4 border-b border-gray-200">
        <h2 class="text-sm font-semibold text-gray-700">章节目录</h2>
      </div>
      <div class="flex-1 overflow-y-auto">
        <For each={props.chapters}>
          {(chapter) => {
            const config = statusConfig[chapter.status];
            const isSelected = chapter.id === props.selectedId;
            
            return (
              <button
                class={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
                  isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
                }`}
                onClick={() => props.onSelect(chapter.id)}
              >
                <div class="flex items-center gap-2">
                  <span class={`w-2 h-2 rounded-full ${config.dot}`}></span>
                  <span class={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>
                    {chapter.title}
                  </span>
                </div>
                <div class="flex items-center gap-2 mt-1 ml-4">
                  <span class={`text-xs ${config.textClass}`}>{config.label}</span>
                  <span class="text-xs text-gray-400">{chapter.wordCount.toLocaleString()}字</span>
                </div>
              </button>
            );
          }}
        </For>
      </div>
    </div>
  );
}

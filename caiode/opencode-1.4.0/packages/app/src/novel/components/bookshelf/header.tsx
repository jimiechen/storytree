import type { Component } from 'solid-js';

interface HeaderProps {
  projectCount: number;
  onRefresh: () => void;
}

/** 顶部导航栏：标题 + 数量徽章 + 刷新图标 */
export const BookshelfHeader: Component<HeaderProps> = (props) => {
  return (
    <header class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
      <div class="flex items-center gap-3">
        <span class="text-2xl">📚</span>
        <h1 class="text-xl font-bold text-gray-800">我的书架</h1>
        <span class="px-2 py-0.5 text-sm font-medium rounded-full bg-purple-100 text-purple-700">
          {props.projectCount}本
        </span>
      </div>
      <button
        class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        onClick={props.onRefresh}
        title="刷新"
      >
        <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </header>
  );
};

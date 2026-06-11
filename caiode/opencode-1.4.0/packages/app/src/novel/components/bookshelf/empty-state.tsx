import type { Component } from 'solid-js';

interface EmptyStateProps {
  onCreateQuick: () => void;
  onCreateProject: () => void;
  onGuide: () => void;
}

/** 空状态：书架空空如也 + 创建入口 */
export const EmptyState: Component<EmptyStateProps> = (props) => {
  return (
    <div class="flex flex-col items-center justify-center py-20 px-6">
      <div class="text-6xl mb-4">📚</div>
      <h2 class="text-lg font-semibold text-gray-700 mb-2">书架空空如也</h2>
      <p class="text-sm text-gray-400 mb-8">创建你的第一部小说...</p>

      <div class="flex items-center gap-3">
        <button
          onClick={props.onCreateQuick}
          class="px-5 py-2.5 rounded-lg text-white text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-400 hover:opacity-90 transition-opacity shadow-sm"
        >
          简易创作 推荐
        </button>
        <button
          onClick={props.onCreateProject}
          class="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          创建新项目
        </button>
        <button
          onClick={props.onGuide}
          class="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          25 道题引导
        </button>
      </div>
    </div>
  );
};

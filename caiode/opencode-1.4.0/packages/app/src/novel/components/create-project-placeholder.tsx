import type { Component } from 'solid-js';

/**
 * 创建项目占位组件（Phase 1.2 完整实现）
 * 当前仅展示占位提示，点击返回书架
 */
export const CreateProjectPlaceholder: Component = () => {
  return (
    <div class="flex flex-col items-center justify-center h-full bg-gray-50 gap-4">
      <div class="text-5xl">📝</div>
      <h2 class="text-xl font-semibold text-gray-700">创建新项目</h2>
      <p class="text-sm text-gray-400 max-w-sm text-center">
        项目创建功能将在 Phase 1.2 完整实现。
        <br />
        届时支持：项目名称、类型选择、简介填写、模板导入。
      </p>
      <button
        class="px-4 py-2 rounded-lg text-sm font-medium bg-purple-500 text-white hover:bg-purple-600 transition-colors"
        onClick={() => window.history.back()}
      >
        返回书架
      </button>
    </div>
  );
};

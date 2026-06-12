import type { Component } from 'solid-js';

interface EmptyStateProps {
  onCreateQuick: () => void;
  onCreateProject: () => void;
  onGuide: () => void;
}

/**
 * 空状态 — Stitch 原型 02 风格
 *
 * 设计令牌: 淡蓝白背景上的居中空状态 + 紫色主按钮
 */
export const EmptyState: Component<EmptyStateProps> = (props) => {
  return (
    <div class="flex flex-col items-center justify-center py-20 px-6" data-testid="bookshelf-empty-state">
      {/* 插图区域 */}
      <div class="w-20 h-20 mb-5 rounded-2xl bg-gradient-to-br from-[#eff4ff] to-[#e6eeff] flex items-center justify-center">
        <svg class="w-10 h-10 text-[#6b38d4] opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>

      <h2
        class="text-lg font-semibold text-[#0d1c2f] mb-1.5"
        style={{ 'font-family': "'Plus Jakarta Sans', sans-serif" }}
      >
        书架空空如也
      </h2>
      <p
        class="text-sm text-[#7b7486] mb-8 max-w-xs text-center leading-relaxed"
        style={{ 'font-family': "'Work Sans', sans-serif" }}
      >
        创建你的第一部小说，开启 AI 辅助创作之旅
      </p>

      <div class="flex items-center gap-3">
        <button
          onClick={props.onCreateQuick}
          class="px-5 py-2.5 rounded-lg text-white text-sm font-medium bg-gradient-to-r from-[#6b38d4] to-[#8455ef] hover:shadow-[0_4px_12px_rgba(107,56,212,0.35)] hover:-translate-y-px transition-all duration-200"
        >
          简易创作 推荐
        </button>
        <button
          onClick={props.onCreateProject}
          class="px-5 py-2.5 rounded-lg text-sm font-medium border border-[#cbc3d7] text-[#494454] bg-white hover:bg-[#f8f9ff] hover:border-[#6b38d4] transition-all duration-200"
        >
          创建新项目
        </button>
        <button
          onClick={props.onGuide}
          class="px-5 py-2.5 rounded-lg text-sm font-medium border border-[#cbc3d7] text-[#494454] bg-white hover:bg-[#f8f9ff] transition-all duration-200"
        >
          25 道题引导
        </button>
      </div>
    </div>
  );
};

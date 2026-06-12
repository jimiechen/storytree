import type { Component } from 'solid-js';

interface HeaderProps {
  projectCount: number;
  onRefresh: () => void;
}

/**
 * 书架页面顶部导航栏
 *
 * Stitch 原型 02: "我的书架" + 紫色数字徽章 + 刷新图标
 * 设计令牌: background=#f8f9ff, primary=#6b38d4, on-surface=#0d1c2f
 */
export const BookshelfHeader: Component<HeaderProps> = (props) => {
  return (
    <header class="flex items-center justify-between px-[40px] py-4 border-b border-[#cbc3d7] bg-white">
      <div class="flex items-center gap-3">
        <h1
          class="text-[20px] font-semibold leading-[1.4] text-[#0d1c2f]"
          style={{ 'font-family': "'Plus Jakarta Sans', sans-serif" }}
        >
          我的书架
        </h1>
        <span class="px-2.5 py-0.5 text-xs font-medium rounded-full bg-[#e9ddff] text-[#6b38d4]">
          {props.projectCount}本
        </span>
      </div>
      <button
        class="p-2 rounded-lg text-[#7b7486] hover:text-[#6b38d4] hover:bg-[#eff4ff] transition-all duration-200"
        onClick={props.onRefresh}
        title="刷新"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </header>
  );
};

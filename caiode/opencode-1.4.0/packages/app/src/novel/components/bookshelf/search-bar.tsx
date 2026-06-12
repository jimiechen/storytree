import type { Component } from 'solid-js';

interface SearchBarProps {
  value: string;
  onInput: (value: string) => void;
}

/**
 * 搜索栏 — Stitch 原型 02 风格
 *
 * 设计令牌: 白色背景 + 圆角 + 紫色聚焦边框
 */
export const SearchBar: Component<SearchBarProps> = (props) => {
  return (
    <div class="px-[40px] py-3">
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7b7486]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="搜索小说..."
          data-testid="bookshelf-search-input"
          value={props.value}
          onInput={(e) => props.onInput((e.target as HTMLInputElement).value)}
          class="w-full pl-10 pr-10 py-2.5 rounded-lg border border-[#cbc3d7] bg-white text-sm text-[#0d1c2f] placeholder:text-[#999] focus:outline-none focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4]/20 transition-all duration-200"
        />
        <button
          class="absolute right-3 top-1/2 -translate-y-1/2 text-[#7b7486] hover:text-[#6b38d4] transition-colors"
          title="帮助"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

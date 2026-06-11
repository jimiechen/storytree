import type { Component } from 'solid-js';

interface SearchBarProps {
  value: string;
  onInput: (value: string) => void;
}

/** 搜索栏：全宽输入框 + 帮助图标 */
export const SearchBar: Component<SearchBarProps> = (props) => {
  return (
    <div class="px-6 py-3">
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="搜索小说..."
          value={props.value}
          onInput={(e) => props.onInput((e.target as HTMLInputElement).value)}
          class="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-purple-400 focus:bg-white transition-colors"
        />
        <button
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500"
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

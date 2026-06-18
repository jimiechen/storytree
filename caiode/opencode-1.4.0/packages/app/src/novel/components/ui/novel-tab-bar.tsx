import { Component, For } from 'solid-js';

interface Tab {
  value: string;
  label: string;
  count?: number;
}

interface NovelTabBarProps {
  tabs: Tab[];
  active: string;
  onChange: (value: string) => void;
  variant?: 'underline' | 'pill';
}

export const NovelTabBar: Component<NovelTabBarProps> = (props) => {
  const variant = () => props.variant ?? 'underline';

  return (
    <div
      class={
        variant() === 'underline'
          ? 'flex border-b border-[#cbc3d7]'
          : 'flex flex-wrap gap-2'
      }
    >
      <For each={props.tabs}>
        {(tab) => {
          const isActive = () => props.active === tab.value;
          return (
            <button
              type="button"
              onClick={() => props.onChange(tab.value)}
              class={
                variant() === 'underline'
                  ? `px-6 py-2 cursor-pointer transition-colors text-sm font-medium border-b-2 ${
                      isActive()
                        ? 'border-[#6b38d4] text-[#6b38d4] font-bold'
                        : 'border-transparent text-[#494454] hover:text-[#6b38d4] hover:bg-[#f8f9ff]'
                    }`
                  : `px-4 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                      isActive()
                        ? 'bg-[#6b38d4] text-white'
                        : 'bg-[#eff4ff] text-[#494454] hover:bg-[#e6eeff]'
                    }`
              }
            >
              {tab.label}
              {tab.count !== undefined && (
                <span class="ml-1 text-xs opacity-70">({tab.count})</span>
              )}
            </button>
          );
        }}
      </For>
    </div>
  );
};

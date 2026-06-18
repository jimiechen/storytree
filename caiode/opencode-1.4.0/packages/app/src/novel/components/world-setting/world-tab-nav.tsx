import type { Component } from 'solid-js';
import type { WorldTab } from '../../types/world';

interface Props {
  activeTab: WorldTab;
  onChange: (tab: WorldTab) => void;
}

const TABS: { value: WorldTab; label: string }[] = [
  { value: 'location', label: '地点' },
  { value: 'item', label: '物品' },
  { value: 'skill', label: '技能' },
  { value: 'faction', label: '势力' },
];

export const WorldTabNav: Component<Props> = (props) => {
  return (
    <div class="flex border-b border-[#cbc3d7]">
      {TABS.map((tab) => (
        <button
          type="button"
          onClick={() => props.onChange(tab.value)}
          class={`px-6 py-3 text-sm font-medium transition-colors cursor-pointer ${
            props.activeTab === tab.value
              ? 'text-[#6b38d4] border-b-2 border-[#6b38d4]'
              : 'text-[#494454] hover:text-[#6b38d4] hover:bg-[#eff4ff]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

import type { Component } from 'solid-js';
import type { ProfileTab } from '../../types/profile';

interface Props {
  activeTab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
}

const TABS: { value: ProfileTab; label: string }[] = [
  { value: 'credits', label: '积分' },
  { value: 'recharge', label: '充值' },
  { value: 'export', label: '导出' },
  { value: 'import', label: '导入' },
];

export const ProfileTabNav: Component<Props> = (props) => {
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

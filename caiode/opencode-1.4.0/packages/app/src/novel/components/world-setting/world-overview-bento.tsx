import type { Component } from 'solid-js';
import { NovelIcon } from '../layout/novel-icon';
import type { WorldOverview } from '../../types/world';

interface Props {
  overview: WorldOverview;
}

const BENTO_ITEMS = [
  { key: 'background' as const, icon: 'public', title: '世界背景' },
  { key: 'powerSystem' as const, icon: 'bolt', title: '力量体系' },
  { key: 'socialStructure' as const, icon: 'account_balance', title: '社会结构' },
  { key: 'specialRules' as const, icon: 'auto_awesome', title: '特殊规则' },
];

export const WorldOverviewBento: Component<Props> = (props) => {
  return (
    <div class="grid grid-cols-2 gap-4">
      {BENTO_ITEMS.map((item) => (
        <div class="bg-white rounded-xl border border-[#cbc3d7] p-5">
          <div class="flex items-center gap-2 mb-3">
            <NovelIcon name={item.icon} size={18} class="text-[#6b38d4]" />
            <span class="text-sm font-bold text-[#0d1c2f]">{item.title}</span>
          </div>
          <p class="text-sm text-[#494454] leading-relaxed">{props.overview[item.key]}</p>
        </div>
      ))}
    </div>
  );
};

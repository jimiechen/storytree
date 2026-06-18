import type { Component } from 'solid-js';
import type { AchievementCategory } from '../../types/achievement';

interface Props {
  activeCategory: AchievementCategory;
  onChange: (category: AchievementCategory) => void;
}

const CATEGORIES: { value: AchievementCategory; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'creation', label: '创作' },
  { value: 'social', label: '社交' },
  { value: 'growth', label: '成长' },
  { value: 'special', label: '特殊' },
];

export const AchievementCategoryTabs: Component<Props> = (props) => {
  return (
    <div class="flex flex-wrap gap-2 px-10">
      {CATEGORIES.map((cat) => (
        <button
          type="button"
          onClick={() => props.onChange(cat.value)}
          class={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
            props.activeCategory === cat.value
              ? 'bg-[#6b38d4] text-white'
              : 'bg-[#eff4ff] text-[#494454] hover:bg-[#e6eeff]'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
};

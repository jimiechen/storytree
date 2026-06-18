import type { Component } from 'solid-js';
import { NovelProgress } from '../ui/novel-progress';

interface Props {
  unlocked: number;
  total: number;
  completionRate: number;
}

export const AchievementPageHeader: Component<Props> = (props) => {
  return (
    <header class="px-10 py-6">
      <div class="flex items-center justify-between mb-3">
        <h1 class="text-xl font-bold text-[#0d1c2f]">成就系统</h1>
        <span class="text-sm text-[#494454]">{props.unlocked}/{props.total} 已解锁</span>
      </div>
      <NovelProgress value={props.unlocked} max={props.total} showLabel />
    </header>
  );
};

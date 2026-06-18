import type { Component } from 'solid-js';
import { NovelStatCard } from '../ui/novel-stat-card';

interface Props {
  total: number;
  unlocked: number;
  locked: number;
  completionRate: number;
}

export const AchievementStatsRow: Component<Props> = (props) => {
  return (
    <div class="grid grid-cols-4 gap-4 px-10">
      <NovelStatCard value={props.total} label="总成就" />
      <NovelStatCard value={props.unlocked} label="已解锁" />
      <NovelStatCard value={props.locked} label="未解锁" />
      <NovelStatCard value={`${props.completionRate}%`} label="完成率" />
    </div>
  );
};

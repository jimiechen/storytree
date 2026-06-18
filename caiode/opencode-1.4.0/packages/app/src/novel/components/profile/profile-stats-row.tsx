import type { Component } from 'solid-js';
import { NovelStatCard } from '../ui/novel-stat-card';

interface Props {
  wordCount: number;
  novelCount: number;
  chapterCount: number;
}

export const ProfileStatsRow: Component<Props> = (props) => {
  return (
    <div class="grid grid-cols-3 gap-4">
      <NovelStatCard value={props.wordCount} unit="字" label="创作字数" />
      <NovelStatCard value={props.novelCount} unit="本" label="小说数量" />
      <NovelStatCard value={props.chapterCount} unit="章" label="章节数量" />
    </div>
  );
};

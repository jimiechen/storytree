import type { Component } from 'solid-js';
import { NovelProgress } from '../ui/novel-progress';
import type { Achievement } from '../../types/achievement';

interface Props {
  achievements: Achievement[];
}

export const AchievementGrid: Component<Props> = (props) => {
  return (
    <div class="grid grid-cols-3 gap-4 px-10 pb-8">
      {props.achievements.map((ach) => (
        <div
          class={`rounded-xl p-4 text-center space-y-2 ${
            ach.isUnlocked
              ? 'bg-gradient-to-br from-[#e9ddff]/30 to-transparent border border-[#e9ddff]'
              : 'bg-[#eff4ff] border border-[#cbc3d7] opacity-60'
          }`}
        >
          <div class="text-4xl">{ach.isUnlocked ? ach.emoji : '🔒'}</div>
          <h3 class={`text-sm font-bold ${ach.isUnlocked ? 'text-[#0d1c2f]' : 'text-[#494454]'}`}>
            {ach.title}
          </h3>
          <p class="text-xs text-[#494454] line-clamp-2">{ach.description}</p>
          {ach.isUnlocked && ach.unlockedAt && (
            <p class="text-xs text-[#6b38d4]">🗓 {ach.unlockedAt}</p>
          )}
          {ach.progress && (
            <NovelProgress value={ach.progress.current} max={ach.progress.target} />
          )}
        </div>
      ))}
    </div>
  );
};

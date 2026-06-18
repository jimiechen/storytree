import type { Component } from 'solid-js';
import { useAchievements } from '../../hooks/use-achievements';
import { useNovelNavigation } from '../../hooks/use-novel-navigation';
import { AchievementPageHeader } from './achievement-page-header';
import { AchievementStatsRow } from './achievement-stats-row';
import { AchievementCategoryTabs } from './achievement-category-tabs';
import { AchievementGrid } from './achievement-grid';

export const AchievementsPage: Component = () => {
  const nav = useNovelNavigation();
  const ach = useAchievements();
  const stats = ach.stats();

  return (
    <div class="flex flex-col h-screen bg-[#f8f9ff] overflow-hidden">
      <div class="shrink-0">
        <div class="h-16 flex items-center px-6">
          <button
            type="button"
            onClick={() => nav.openView('workspace')}
            class="text-[#494454] hover:text-[#6b38d4] hover:bg-[#e6eeff] rounded-full p-2 transition-all duration-150 active:scale-95 mr-3"
          >
            <span class="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <h1 class="text-lg font-bold text-[#0d1c2f]">成就系统</h1>
        </div>
        <AchievementPageHeader
          unlocked={stats.unlocked}
          total={stats.total}
          completionRate={stats.completionRate}
        />
        <AchievementStatsRow
          total={stats.total}
          unlocked={stats.unlocked}
          locked={stats.locked}
          completionRate={stats.completionRate}
        />
        <div class="mt-4">
          <AchievementCategoryTabs
            activeCategory={ach.activeCategory()}
            onChange={ach.setActiveCategory}
          />
        </div>
      </div>
      <div class="flex-1 overflow-y-auto mt-4">
        <AchievementGrid achievements={ach.filtered()} />
      </div>
    </div>
  );
};

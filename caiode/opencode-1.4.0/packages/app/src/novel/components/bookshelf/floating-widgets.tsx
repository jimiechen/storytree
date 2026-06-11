import type { Component } from 'solid-js';
import type { FloatingWidgetData } from '../../types';

interface FloatingWidgetsProps {
  data: FloatingWidgetData;
}

/** 右下角浮动组件：签到 / 成就 / 活动 */
export const FloatingWidgets: Component<FloatingWidgetsProps> = (props) => {
  const d = props.data;
  return (
    <div class="fixed bottom-6 right-6 flex flex-col gap-2 z-10">
      {/* 签到 */}
      <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-md border border-gray-100 text-xs">
        <span class="text-orange-500">🔥</span>
        <span class="text-gray-600">今日已签到</span>
        <span class="font-medium text-orange-600">{d.signinStreak}天</span>
      </div>

      {/* 成就 */}
      <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-md border border-gray-100 text-xs">
        <span>⭐</span>
        <span class="text-gray-600">成就</span>
        <span class="font-medium text-yellow-600">{d.achievementCount}/{d.achievementTotal}</span>
      </div>

      {/* 活动 */}
      <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-md border border-gray-100 text-xs cursor-pointer hover:bg-purple-50 transition-colors">
        <span>🎁</span>
        <span class="text-gray-600">{d.activityTitle}</span>
      </div>

      {/* 统计 */}
      <div class="text-right text-xs text-gray-400 space-y-0.5">
        <div>{d.totalWords} 字</div>
        <div>{d.onlineUsers} 在线</div>
      </div>
    </div>
  );
};

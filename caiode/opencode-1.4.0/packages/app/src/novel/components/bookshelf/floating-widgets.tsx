import type { Component } from 'solid-js';
import type { FloatingWidgetData } from '../../types';

interface FloatingWidgetsProps {
  data: FloatingWidgetData;
}

/**
 * 右下角浮动组件 — Stitch 原型 02 风格
 *
 * 设计令牌: 白色卡片 + 圆角 + 紫色阴影 + 原型配色
 */
export const FloatingWidgets: Component<FloatingWidgetsProps> = (props) => {
  const d = props.data;
  return (
    <div class="fixed bottom-6 right-6 flex flex-col gap-2.5 z-10">
      {/* 签到 */}
      <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#eff4ff] text-xs">
        <span class="text-[#fd761a]">🔥</span>
        <span class="text-[#494454]">今日已签到</span>
        <span class="font-semibold text-[#9d4300]">{d.signinStreak}天</span>
      </div>

      {/* 成就 */}
      <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#eff4ff] text-xs">
        <span>⭐</span>
        <span class="text-[#494454]">成就</span>
        <span class="font-semibold text-[#9d4300]">{d.achievementCount}/{d.achievementTotal}</span>
      </div>

      {/* 活动 */}
      <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#eff4ff] text-xs cursor-pointer hover:bg-[#f8f9ff] hover:border-[#e9ddff] transition-all duration-200">
        <span>🎁</span>
        <span class="text-[#494454]">{d.activityTitle}</span>
      </div>

      {/* 统计信息 */}
      <div
        class="text-right text-xs space-y-0.5"
        style={{ 'font-family': "'Work Sans', sans-serif" }}
      >
        <div class="text-[#7b7486]">{d.totalWords} 字</div>
        <div class="text-[#999]">{d.onlineUsers} 在线</div>
      </div>
    </div>
  );
};

import type { Component } from 'solid-js';
import { Show } from 'solid-js';

export interface FloatingWidgetData {
  /** 今日是否已签到 */
  signedToday: boolean;
  /** 连续签到天数 */
  signinStreak: number;
  /** 已解锁成就数 */
  achievementCount: number;
  /** 成就总数 */
  achievementTotal: number;
  /** 活动标题 */
  activityTitle: string;
  /** 平台累计字数 */
  totalWords: string;
  /** 当前在线人数 */
  onlineUsers: string;
}

interface FloatingWidgetsProps {
  data: FloatingWidgetData;
  onSignin: () => void;
  onAchievements: () => void;
  onActivity: () => void;
  /** 签到中（按钮 loading） */
  signing: boolean;
}

/**
 * 右下角浮动组件
 *
 * 4 个胶囊：签到 / 成就 / 活动 / 统计
 * 签到与成就可点击，活动可点击，统计仅展示
 */
export const FloatingWidgets: Component<FloatingWidgetsProps> = (props) => {
  const d = () => props.data;

  return (
    <div class="fixed bottom-6 right-6 flex flex-col gap-2.5 z-10 max-w-[200px]">
      {/* 签到 */}
      <button
        type="button"
        disabled={props.signing || d().signedToday}
        onClick={() => props.onSignin()}
        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#eff4ff] text-xs text-left hover:bg-[#f8f9ff] hover:border-[#e9ddff] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        title={d().signedToday ? '今日已签到' : '点击签到领积分'}
      >
        <span class="text-[#fd761a]">🔥</span>
        <span class="text-[#494454] flex-1">
          {d().signedToday ? '今日已签到' : '今日签到'}
        </span>
        <span class="font-semibold text-[#9d4300]">{d().signinStreak}天</span>
      </button>

      {/* 成就 */}
      <button
        type="button"
        onClick={() => props.onAchievements()}
        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#eff4ff] text-xs text-left hover:bg-[#f8f9ff] hover:border-[#e9ddff] transition-all"
        title="查看成就"
      >
        <span>⭐</span>
        <span class="text-[#494454] flex-1">成就</span>
        <span class="font-semibold text-[#9d4300]">
          {d().achievementCount}/{d().achievementTotal}
        </span>
      </button>

      {/* 活动 */}
      <button
        type="button"
        onClick={() => props.onActivity()}
        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#eff4ff] text-xs text-left hover:bg-[#f8f9ff] hover:border-[#e9ddff] transition-all"
        title="查看活动"
      >
        <span>🎁</span>
        <span class="text-[#494454] flex-1 truncate">{d().activityTitle}</span>
      </button>

      {/* 统计 */}
      <Show when={d().totalWords || d().onlineUsers}>
        <div class="text-right text-xs space-y-0.5 pr-1" style={{ 'font-family': "'Work Sans', sans-serif" }}>
          <Show when={d().totalWords}>
            <div class="text-[#7b7486]">{d().totalWords} 字</div>
          </Show>
          <Show when={d().onlineUsers}>
            <div class="text-[#999]">{d().onlineUsers} 在线</div>
          </Show>
        </div>
      </Show>
    </div>
  );
}

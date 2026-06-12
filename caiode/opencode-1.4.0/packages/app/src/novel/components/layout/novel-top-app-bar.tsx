import type { Component } from 'solid-js';
import { NovelIcon } from './novel-icon';

interface NovelTopAppBarProps {
  title: string;
  icon: string;
  badge?: string;
  onRefresh?: () => void;
  onMenu?: () => void;
}

/**
 * 顶部 TopAppBar — Stitch 02/04 原型标准头部
 *
 * - 高度 64px
 * - 白色背景 + 底部边框
 * - 移动端 menu 按钮
 * - 中间: 图标 + 标题 + 可选徽章
 * - 右侧: refresh 按钮
 */
export const NovelTopAppBar: Component<NovelTopAppBarProps> = (props) => {
  return (
    <header
      class="flex justify-between items-center w-full px-4 md:px-[40px] h-16 z-50 bg-white border-b border-[#cbc3d7] shrink-0"
      style={{ 'font-family': "'Work Sans', 'PingFang SC', sans-serif" }}
    >
      {/* 左侧: 移动端菜单 */}
      <div class="flex items-center gap-3 md:hidden">
        <button
          onClick={props.onMenu}
          class="text-[#7b7486] hover:bg-[#eff4ff] transition-colors p-2 rounded-full"
        >
          <NovelIcon name="menu" size={20} />
        </button>
      </div>

      {/* 中间: 图标 + 标题 + 徽章 */}
      <div class="flex-1 flex justify-center items-center gap-2">
        <NovelIcon name={props.icon} size={20} class="text-[#6b38d4]" fill />
        <h1
          class="text-xl font-bold text-[#6b38d4]"
          style={{ 'font-family': "'Plus Jakarta Sans', 'PingFang SC', sans-serif" }}
        >
          {props.title}
        </h1>
        {props.badge && (
          <span class="bg-[#e9ddff] text-[#6b38d4] text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">
            {props.badge}
          </span>
        )}
      </div>

      {/* 右侧: 刷新 */}
      <div class="flex items-center gap-2">
        <button
          onClick={props.onRefresh}
          class="text-[#7b7486] hover:bg-[#eff4ff] transition-colors p-2 rounded-full"
        >
          <NovelIcon name="refresh" size={20} />
        </button>
      </div>
    </header>
  );
};

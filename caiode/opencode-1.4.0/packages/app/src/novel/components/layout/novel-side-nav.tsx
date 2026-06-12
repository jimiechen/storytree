import type { Component } from 'solid-js';
import { NovelIcon } from './novel-icon';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  active?: boolean;
  onClick?: () => void;
}

interface NovelSideNavProps {
  userName?: string;
  userSubtitle?: string;
  items: NavItem[];
  onWriteNow?: () => void;
  onLogout?: () => void;
}

/**
 * 左侧 SideNavBar — Stitch 02/04 原型标准导航
 *
 * - 260px 固定宽度
 * - 白色背景 + 右侧边框
 * - 作家助手用户区
 * - 立即写作按钮
 * - 导航项列表（含激活态左侧 4px 紫色竖线）
 * - 底部退出登录
 */
export const NovelSideNav: Component<NovelSideNavProps> = (props) => {
  return (
    <nav
      class="hidden md:flex flex-col h-full py-6 bg-white border-r border-[#cbc3d7] shadow-sm fixed left-0 top-0 w-[260px] z-40"
      style={{ 'font-family': "'Work Sans', 'PingFang SC', sans-serif" }}
    >
      {/* 用户区 */}
      <div class="px-4 mb-6 flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-[#e9ddff] flex items-center justify-center text-[#6b38d4]">
          <NovelIcon name="person" size={20} />
        </div>
        <div>
          <h2
            class="text-sm font-bold text-[#6b38d4]"
            style={{ 'font-family': "'Plus Jakarta Sans', 'PingFang SC', sans-serif" }}
          >
            {props.userName ?? '作家助手'}
          </h2>
          <p class="text-xs text-[#494454]">{props.userSubtitle ?? '高级会员'}</p>
        </div>
      </div>

      {/* 立即写作按钮 */}
      <div class="px-4 mb-4">
        <button
          onClick={props.onWriteNow}
          class="w-full bg-[#6b38d4] text-white rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm"
        >
          <NovelIcon name="add_circle" size={18} fill />
          <span class="text-sm font-bold">立即写作</span>
        </button>
      </div>

      {/* 导航项 */}
      <ul class="flex-1 px-2 space-y-1">
        {props.items.map((item) => (
          <li>
            <button
              onClick={item.onClick}
              class={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                item.active
                  ? 'text-[#6b38d4] border-l-4 border-[#6b38d4] bg-[#eff4ff] font-bold'
                  : 'text-[#494454] hover:bg-[#e6eeff]'
              }`}
            >
              <NovelIcon name={item.icon} size={20} fill={item.active} />
              <span class="text-sm">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* 退出登录 */}
      <div class="mt-auto px-2">
        <button
          onClick={props.onLogout}
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#494454] hover:bg-[#e6eeff] transition-all text-left"
        >
          <NovelIcon name="logout" size={20} />
          <span class="text-sm">退出登录</span>
        </button>
      </div>
    </nav>
  );
};

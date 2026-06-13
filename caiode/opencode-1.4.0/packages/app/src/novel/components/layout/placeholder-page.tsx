import type { Component } from 'solid-js';
import { NovelIcon } from './novel-icon';
import { useNovelNavigation } from '../../hooks/use-novel-navigation';

interface PlaceholderPageProps {
  title: string;
  icon: string;
  description?: string;
}

/**
 * 占位页面 — 批次 4 用于 character-panel / world-setting / profile / tutorial
 *
 * 提供返回工作台的统一入口，后续批次替换为真实页面。
 */
export const PlaceholderPage: Component<PlaceholderPageProps> = (props) => {
  const nav = useNovelNavigation();

  return (
    <div class="flex flex-col items-center justify-center h-full gap-3">
      <NovelIcon name={props.icon} size={48} class="text-[#cbc3d7]" />
      <h2
        class="text-lg font-semibold text-[#0d1c2f]"
        style={{ 'font-family': "'Plus Jakarta Sans', sans-serif" }}
      >
        {props.title}
      </h2>
      <p class="text-sm text-[#7b7486]">{props.description ?? '该功能正在开发中'}</p>
      <button
        type="button"
        onClick={() => nav.openView('workspace')}
        class="mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-[#eff4ff] text-[#6b38d4] hover:bg-[#e9ddff] transition-colors"
      >
        ← 返回工作台
      </button>
    </div>
  );
};

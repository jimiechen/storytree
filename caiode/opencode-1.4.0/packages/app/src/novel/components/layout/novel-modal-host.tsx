import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { useNovelNavigation } from '../../hooks/use-novel-navigation';
import { NovelIcon } from './novel-icon';

const MODAL_TITLES: Record<string, string> = {
  export: '导出设置',
  feedback: '意见反馈',
  'generation-settings': '生成设置',
  'chapter-history': '历史版本',
  notifications: '通知中心',
  'batch-generation': '批量生成',
  settings: '系统设置',
  'guide-create': '新建引导项目',
  'achievement-detail': '成就详情',
};

export const NovelModalHost: Component = () => {
  const nav = useNovelNavigation();

  const title = () => {
    const modal = nav.currentModal();
    return modal ? (MODAL_TITLES[modal] ?? '弹框') : '';
  };

  return (
    <Show when={nav.isModalOpen()}>
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="bg-white rounded-xl max-w-lg w-full mx-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-col max-h-[80vh]">
          <header class="flex justify-between items-center px-6 py-4 border-b border-[#cbc3d7]">
            <h2 class="text-lg font-bold text-[#0d1c2f]">{title()}</h2>
            <button
              type="button"
              onClick={nav.closeModal}
              class="text-[#7b7486] hover:text-[#0d1c2f] transition-colors p-1 rounded-full hover:bg-[#eff4ff]"
            >
              <NovelIcon name="close" size={20} />
            </button>
          </header>

          <div class="p-6 text-sm text-[#7b7486] flex items-center justify-center min-h-[120px]">
            <p>「{title()}」功能正在开发中，敬请期待。</p>
          </div>

          <footer class="px-6 py-4 border-t border-[#cbc3d7] flex justify-end">
            <button
              type="button"
              onClick={nav.closeModal}
              class="px-4 py-2 rounded-lg text-sm font-medium bg-[#eff4ff] text-[#6b38d4] hover:bg-[#e9ddff] transition-colors"
            >
              关闭
            </button>
          </footer>
        </div>
      </div>
    </Show>
  );
};

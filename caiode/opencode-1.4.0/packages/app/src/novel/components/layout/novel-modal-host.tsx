import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { useNovelNavigation } from '../../hooks/use-novel-navigation';
import { NovelIcon } from './novel-icon';
import { GenerationSettingsModal } from './generation-settings-modal';

const MODAL_TITLES: Record<string, string> = {
  export: '导出设置',
  feedback: '意见反馈',
  'chapter-history': '历史版本',
  notifications: '通知中心',
  'batch-generation': '批量生成',
  settings: '系统设置',
  'guide-create': '新建引导项目',
  'achievement-detail': '成就详情',
};

/** 使用完整实现组件的 Modal 列表 */
const FULLY_IMPLEMENTED_MODALS = ['generation-settings'] as const;

export const NovelModalHost: Component = () => {
  const nav = useNovelNavigation();

  const title = () => {
    const modal = nav.currentModal();
    return modal ? (MODAL_TITLES[modal] ?? '弹框') : '';
  };

  /** 是否使用完整实现（而非通用占位） */
  const isFullyImplemented = () =>
    nav.currentModal() && FULLY_IMPLEMENTED_MODALS.includes(nav.currentModal() as typeof FULLY_IMPLEMENTED_MODALS[number]);

  return (
    <Show when={nav.isModalOpen()}>
      {/* generation-settings 完整实现 */}
      <Show when={nav.currentModal() === 'generation-settings'}>
        <GenerationSettingsModal
          onClose={nav.closeModal}
          onGenerate={(cfg) => {
            // Mock: 记录配置到控制台，实际会触发 AI 生成
            console.log('[GenerationSettings] 配置已确认:', cfg);
          }}
        />
      </Show>

      {/* 其他 Modal 通用占位 */}
      <Show when={!isFullyImplemented()}>
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
    </Show>
  );
};

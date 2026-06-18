import type { Component } from 'solid-js';
import { NovelIcon } from '../layout/novel-icon';

interface Props {
  onSettings: () => void;
}

export const ProfilePageHeader: Component<Props> = (props) => {
  return (
    <header class="h-16 shrink-0 bg-[#f8f9ff] border-b border-[#cbc3d7] px-6 flex items-center justify-between">
      <h1 class="text-lg font-bold text-[#0d1c2f]">个人中心</h1>
      <button
        type="button"
        onClick={props.onSettings}
        class="text-[#494454] hover:text-[#6b38d4] hover:bg-[#e6eeff] rounded-full p-2 transition-all duration-150 active:scale-95"
      >
        <NovelIcon name="settings" size={20} />
      </button>
    </header>
  );
};

import type { Component } from 'solid-js';
import { NovelButton } from '../ui/novel-button';
import { NovelIcon } from '../layout/novel-icon';

interface Props {
  onBack: () => void;
}

export const CharacterPageHeader: Component<Props> = (props) => {
  return (
    <header class="h-16 shrink-0 bg-[#f8f9ff] border-b border-[#cbc3d7] px-6 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button
          type="button"
          onClick={props.onBack}
          class="text-[#494454] hover:text-[#6b38d4] hover:bg-[#e6eeff] rounded-full p-2 transition-all duration-150 active:scale-95"
        >
          <NovelIcon name="arrow_back" size={20} />
        </button>
        <h1 class="text-lg font-bold text-[#0d1c2f]">角色追踪</h1>
      </div>
      <NovelButton variant="filled" icon="add" size="sm">
        AI 生成角色
      </NovelButton>
    </header>
  );
};

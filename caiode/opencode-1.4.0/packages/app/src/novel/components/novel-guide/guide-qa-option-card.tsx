import type { Component } from 'solid-js';
import type { GuideOption } from '../../types/novel-guide';

interface Props {
  option: GuideOption;
  isSelected: boolean;
  onClick: () => void;
}

export const GuideQAOptionCard: Component<Props> = (props) => {
  return (
    <button
      type="button"
      onClick={props.onClick}
      class={`border-2 rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer select-none text-center transition-all duration-150 active:scale-95 ${
        props.isSelected
          ? 'border-[#6b38d4] bg-[#e9ddff] text-[#6b38d4]'
          : 'border-[#cbc3d7] bg-white hover:border-[#6b38d4] hover:bg-[#e9ddff]/30'
      }`}
    >
      {props.option.emoji && <span class="text-3xl">{props.option.emoji}</span>}
      <span class="text-sm font-medium">{props.option.label}</span>
      {props.option.description && (
        <span class="text-xs text-[#494454]">{props.option.description}</span>
      )}
    </button>
  );
};

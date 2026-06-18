import type { Component } from 'solid-js';

interface NovelStatCardProps {
  value: string | number;
  label: string;
  unit?: string;
  class?: string;
}

export const NovelStatCard: Component<NovelStatCardProps> = (props) => {
  return (
    <div
      class={`bg-white rounded-xl border border-[#cbc3d7] p-4 text-center ${props.class ?? ''}`.trim()}
    >
      <div class="text-[32px] font-bold text-[#6b38d4] leading-none">
        {props.value}
        {props.unit && <span class="text-lg ml-0.5">{props.unit}</span>}
      </div>
      <div class="text-sm text-[#494454] mt-1">{props.label}</div>
    </div>
  );
};

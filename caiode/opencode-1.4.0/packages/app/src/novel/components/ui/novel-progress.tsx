import type { Component } from 'solid-js';

interface NovelProgressProps {
  value: number;
  max: number;
  showLabel?: boolean;
  class?: string;
}

export const NovelProgress: Component<NovelProgressProps> = (props) => {
  const percent = () => {
    const p = (props.value / props.max) * 100;
    return Math.min(100, Math.max(0, p));
  };

  return (
    <div class={`w-full ${props.class ?? ''}`.trim()}>
      <div class="w-full bg-[#d5e3fd] rounded-full h-1.5 overflow-hidden">
        <div
          class="bg-gradient-to-r from-[#6b38d4] to-[#6d3bd7] h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent()}%` }}
        />
      </div>
      {props.showLabel && (
        <div class="flex justify-between text-xs text-[#494454] mt-1">
          <span>{props.value}</span>
          <span>{props.max}</span>
        </div>
      )}
    </div>
  );
};

import type { Component } from 'solid-js';
import { NovelIcon } from '../layout/novel-icon';

interface NovelStepperProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
}

export const NovelStepper: Component<NovelStepperProps> = (props) => {
  const min = () => props.min ?? 0;
  const max = () => props.max ?? Number.MAX_SAFE_INTEGER;
  const step = () => props.step ?? 1;

  const canDecrease = () => props.value > min();
  const canIncrease = () => props.value < max();

  const decrease = () => {
    if (canDecrease()) props.onChange(Math.max(min(), props.value - step()));
  };

  const increase = () => {
    if (canIncrease()) props.onChange(Math.min(max(), props.value + step()));
  };

  return (
    <div class="flex items-center gap-2">
      {props.label && (
        <span class="text-sm text-[#494454] mr-1">{props.label}</span>
      )}
      <button
        type="button"
        onClick={decrease}
        disabled={!canDecrease()}
        class="w-8 h-8 rounded border border-[#cbc3d7] flex items-center justify-center hover:bg-[#eff4ff] transition-colors disabled:opacity-30"
      >
        <NovelIcon name="remove" size={16} />
      </button>
      <input
        type="text"
        readOnly
        value={props.value}
        class="text-center text-base border border-[#cbc3d7] rounded-md h-8 flex-1 min-w-[48px] bg-white outline-none focus:ring-1 focus:ring-[#6b38d4]"
      />
      <button
        type="button"
        onClick={increase}
        disabled={!canIncrease()}
        class="w-8 h-8 rounded border border-[#cbc3d7] flex items-center justify-center hover:bg-[#eff4ff] transition-colors disabled:opacity-30"
      >
        <NovelIcon name="add" size={16} />
      </button>
    </div>
  );
};

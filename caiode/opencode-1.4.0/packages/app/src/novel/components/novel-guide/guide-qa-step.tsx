import type { Component } from 'solid-js';
import { For } from 'solid-js';
import { NovelButton } from '../ui/novel-button';
import { NovelProgress } from '../ui/novel-progress';
import { GuideQAOptionCard } from './guide-qa-option-card';
import type { GuideQuestion, GuideProject } from '../../types/novel-guide';

interface Props {
  step: number;
  total: number;
  question: GuideQuestion | null;
  current: GuideProject | null;
  onAnswer: (qId: number, answer: string) => void;
  onPrev: () => void;
  onSkip: () => void;
  onClose: () => void;
}

export const GuideQAStep: Component<Props> = (props) => {
  const isSelected = (value: string) => props.current?.answers[props.step] === value;

  return (
    <div class="flex flex-col h-screen bg-[#f8f9ff]">
      <button
        type="button"
        onClick={props.onClose}
        class="fixed top-4 right-4 z-10 p-2 text-[#494454] hover:text-[#0d1c2f] hover:bg-[#e6eeff] rounded-full transition-colors"
      >
        <span class="material-symbols-outlined">close</span>
      </button>

      <div class="flex-1 overflow-y-auto">
        <div class="max-w-2xl mx-auto px-4 pt-12 pb-28">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-bold text-[#0d1c2f]">创建你的专属小说</span>
            <span class="text-sm text-[#494454]">Q{props.step}/{props.total}</span>
          </div>
          <NovelProgress value={props.step} max={props.total} />

          <div class="mt-8">
            <div class="flex items-center gap-3">
              <span class="w-8 h-8 rounded-full bg-[#6b38d4] text-white flex items-center justify-center font-bold text-sm">
                Q{props.step}
              </span>
              <h2 class="text-xl font-bold text-[#0d1c2f]">{props.question?.question}</h2>
            </div>
            {props.question?.subtitle && (
              <p class="text-sm text-[#494454] mt-2 ml-11">{props.question.subtitle}</p>
            )}
          </div>

          <div class="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
            <For each={props.question?.options}>
              {(opt) => (
                <GuideQAOptionCard
                  option={opt}
                  isSelected={isSelected(opt.value)}
                  onClick={() => props.onAnswer(props.step, opt.value)}
                />
              )}
            </For>
          </div>
        </div>
      </div>

      <div class="sticky bottom-0 bg-white border-t border-[#cbc3d7] px-4 py-4">
        <div class="max-w-2xl mx-auto flex items-center justify-between">
          <NovelButton
            variant="outlined"
            onClick={props.onPrev}
            disabled={props.step === 1}
          >
            ← 上一步
          </NovelButton>
          <button
            type="button"
            onClick={props.onSkip}
            class="text-sm text-[#494454] hover:text-[#6b38d4] transition-colors"
          >
            跳过引导
          </button>
          <NovelButton
            variant="filled"
            onClick={() => {
              const ans = props.current?.answers[props.step];
              if (ans) props.onAnswer(props.step, ans as string);
            }}
          >
            下一步 →
          </NovelButton>
        </div>
      </div>
    </div>
  );
};

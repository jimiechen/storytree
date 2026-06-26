/**
 * @file llm-generation-tab.tsx
 * @description 可复用 LLM 生成 Tab — 用于世界观/剧情总纲
 *
 * 用户填入少量提示词 → 调用真实 LLM 生成内容 → 可编辑结果
 */

import { Show, createSignal } from 'solid-js';
import type { Component } from 'solid-js';
import { NovelIcon } from '../layout/novel-icon';
import { useLLMGeneration } from '../../hooks/use-llm-generation';

interface LLMGenerationTabProps {
  label: string;
  icon: string;
  placeholder: string;
  promptPlaceholder: string;
  value: string;
  onInput: (v: string) => void;
  context: string;
}

export const LLMGenerationTab: Component<LLMGenerationTabProps> = (props) => {
  const llm = useLLMGeneration();
  const [prompt, setPrompt] = createSignal('');

  const handleGenerate = async () => {
    const p = prompt().trim();
    if (!p) return;
    const text = await llm.generate({
      prompt: p,
      context: props.context,
      systemPrompt: `你是一个专业的小说创作助手。请根据用户提供的提示词，生成${props.label}内容。内容应当详细、有创意，适合小说创作参考。`,
    });
    if (text) props.onInput(text);
  };

  const inputBase =
    'w-full bg-[#f8f9ff] border border-[#cbc3d7] rounded-lg px-4 py-3 text-base focus:outline-none focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] transition-colors';

  return (
    <div class="space-y-4">
      <h3 class="text-sm font-medium text-[#0d1c2f] font-bold flex items-center gap-2">
        <NovelIcon name={props.icon} size={20} class="text-[#6b38d4]" />
        {props.label}
      </h3>

      {/* 提示词输入 */}
      <div>
        <label class="block text-xs font-medium text-[#494454] mb-1">提示词</label>
        <div class="flex gap-2">
          <input
            type="text"
            placeholder={props.promptPlaceholder}
            value={prompt()}
            onInput={(e) => setPrompt((e.target as HTMLInputElement).value)}
            class={`${inputBase} flex-1`}
            style={{ 'font-family': "'Work Sans', 'PingFang SC', sans-serif" }}
          />
          <button
            onClick={handleGenerate}
            disabled={llm.isLoading() || !prompt().trim()}
            class="px-4 py-3 rounded-lg bg-gradient-to-r from-[#6b38d4] to-[#8455ef] text-white text-sm font-medium whitespace-nowrap disabled:opacity-50 flex items-center gap-1"
          >
            <NovelIcon name="auto_awesome" size={16} />
            {llm.isLoading() ? '生成中...' : 'AI 生成'}
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      <Show when={llm.error()}>
        <div class="p-3 rounded-lg bg-[#ffdad6]/30 border border-[#ba1a1a]/30 text-xs text-[#93000a]">
          {llm.error()}
        </div>
      </Show>

      {/* 生成结果（可编辑） */}
      <Show when={llm.isLoading() || props.value}>
        <div>
          <label class="block text-xs font-medium text-[#494454] mb-1">
            {props.label}内容（可编辑）
          </label>
          <Show
            when={!llm.isLoading()}
            fallback={
              <div class={`${inputBase} resize-none flex items-center gap-2 text-[#6b38d4]`}>
                <NovelIcon name="hourglass_empty" size={16} class="animate-spin" />
                正在生成...
              </div>
            }
          >
            <textarea
              placeholder={props.placeholder}
              value={props.value}
              onInput={(e) => props.onInput((e.target as HTMLTextAreaElement).value)}
              rows={10}
              class={`${inputBase} resize-none`}
            />
          </Show>
        </div>
      </Show>
    </div>
  );
};

/**
 * @file worldview-tab.tsx
 * @description 世界观设定 Tab（PRD §3.6）
 *
 * 3 个下拉框（世界类型/时代背景/社会制度）+ 提示词 + AI 生成 + 可编辑描述
 */

import { Show, For, createSignal } from 'solid-js';
import type { Component, Accessor } from 'solid-js';
import { NovelIcon } from '../layout/novel-icon';
import { useLLMGeneration } from '../../hooks/use-llm-generation';
import {
  WORLD_TYPE_LABELS,
  ERA_LABELS,
  SOCIAL_SYSTEM_LABELS,
} from '../../types';
import type { WorldType, Era, SocialSystem } from '../../types';

interface WorldviewTabProps {
  worldType: Accessor<WorldType | ''>;
  setWorldType: (v: WorldType | '') => void;
  era: Accessor<Era | ''>;
  setEra: (v: Era | '') => void;
  socialSystem: Accessor<SocialSystem | ''>;
  setSocialSystem: (v: SocialSystem | '') => void;
  value: Accessor<string>;
  setValue: (v: string) => void;
  context: string;
}

export const WorldviewTab: Component<WorldviewTabProps> = (props) => {
  const llm = useLLMGeneration();
  const [prompt, setPrompt] = createSignal('');

  const handleGenerate = async () => {
    const p = prompt().trim();
    if (!p) return;
    const selections: string[] = [];
    if (props.worldType()) selections.push(`世界类型：${WORLD_TYPE_LABELS[props.worldType() as WorldType]}`);
    if (props.era()) selections.push(`时代背景：${ERA_LABELS[props.era() as Era]}`);
    if (props.socialSystem()) selections.push(`社会制度：${SOCIAL_SYSTEM_LABELS[props.socialSystem() as SocialSystem]}`);
    const fullContext = `${props.context}\n${selections.join('\n')}`;
    const text = await llm.generate({
      prompt: p,
      context: fullContext,
      systemPrompt: '你是一个专业的小说创作助手。请根据用户提供的提示词和世界观选项，生成详细的世界观设定内容。内容应当包含世界背景、社会结构、文化特色等，适合小说创作参考。',
    });
    if (text) props.setValue(text);
  };

  const selectBase =
    'w-full bg-[#f8f9ff] border border-[#cbc3d7] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] transition-colors cursor-pointer';
  const inputBase =
    'w-full bg-[#f8f9ff] border border-[#cbc3d7] rounded-lg px-4 py-3 text-base focus:outline-none focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] transition-colors';
  const labelBase = 'block text-xs font-medium text-[#494454] mb-1';

  return (
    <div class="space-y-4">
      <h3 class="text-sm font-medium text-[#0d1c2f] font-bold flex items-center gap-2">
        <NovelIcon name="public" size={20} class="text-[#6b38d4]" />
        世界观
      </h3>

      {/* 3 个下拉框 */}
      <div class="grid grid-cols-3 gap-3">
        <div>
          <label class={labelBase}>世界类型</label>
          <select
            value={props.worldType()}
            onChange={(e) => props.setWorldType((e.target as HTMLSelectElement).value as WorldType | '')}
            class={selectBase}
          >
            <option value="">请选择</option>
            <For each={Object.entries(WORLD_TYPE_LABELS)}>
              {([val, label]) => <option value={val}>{label}</option>}
            </For>
          </select>
        </div>
        <div>
          <label class={labelBase}>时代背景</label>
          <select
            value={props.era()}
            onChange={(e) => props.setEra((e.target as HTMLSelectElement).value as Era | '')}
            class={selectBase}
          >
            <option value="">请选择</option>
            <For each={Object.entries(ERA_LABELS)}>
              {([val, label]) => <option value={val}>{label}</option>}
            </For>
          </select>
        </div>
        <div>
          <label class={labelBase}>社会制度</label>
          <select
            value={props.socialSystem()}
            onChange={(e) => props.setSocialSystem((e.target as HTMLSelectElement).value as SocialSystem | '')}
            class={selectBase}
          >
            <option value="">请选择</option>
            <For each={Object.entries(SOCIAL_SYSTEM_LABELS)}>
              {([val, label]) => <option value={val}>{label}</option>}
            </For>
          </select>
        </div>
      </div>

      {/* 提示词输入 + AI 生成 */}
      <div>
        <label class={labelBase}>提示词</label>
        <div class="flex gap-2">
          <input
            type="text"
            placeholder="输入关键词，如：修仙世界、九重天、灵气复苏..."
            value={prompt()}
            onInput={(e) => setPrompt((e.target as HTMLInputElement).value)}
            class={`${inputBase} flex-1`}
            style={{ 'font-family': "'Work Sans', 'PingFang SC', sans-serif" }}
          />
          <button
            onClick={handleGenerate}
            disabled={llm.isLoading() || !prompt().trim()}
            class="px-4 py-3 rounded-lg bg-gradient-to-r from-[#6b38d4] to-[#8455ef] text-white text-sm font-medium shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 whitespace-nowrap"
          >
            <Show when={llm.isLoading()} fallback={<NovelIcon name="auto_awesome" size={16} />}>
              <NovelIcon name="refresh" size={16} class="animate-spin" />
            </Show>
            {llm.isLoading() ? '生成中...' : 'AI 生成'}
          </button>
        </div>
      </div>

      {/* 世界观描述 textarea（始终可见） */}
      <div>
        <label class={labelBase}>世界观描述</label>
        <textarea
          placeholder="描述小说的世界观设定，如修炼体系、科技水平、社会结构等..."
          value={props.value()}
          onInput={(e) => props.setValue((e.target as HTMLTextAreaElement).value)}
          rows={8}
          class={`${inputBase} resize-none`}
          style={{ 'font-family': "'Work Sans', 'PingFang SC', sans-serif" }}
        />
      </div>

      {/* 错误提示 */}
      <Show when={llm.error()}>
        <p class="text-xs text-red-500">{llm.error()}</p>
      </Show>
    </div>
  );
};

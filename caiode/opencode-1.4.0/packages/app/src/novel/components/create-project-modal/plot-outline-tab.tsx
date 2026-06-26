import { For, Show, createSignal, type Component } from 'solid-js';
import { NovelIcon } from '../layout/novel-icon';
import { useLLMGeneration } from '../../hooks/use-llm-generation';

/**
 * PAGE-07 剧情总纲 Tab（PRD §3.7）
 * 8 个大文本框：核心剧情线/开端/发展/高潮/决战/结局/最终走向/核心矛盾
 * + LLM 生成（填充核心剧情线）
 */

export interface PlotOutlineFields {
  plotCore: string;
  plotBeginning: string;
  plotDevelopment: string;
  plotClimax: string;
  plotBattle: string;
  plotEnding: string;
  plotFinale: string;
  plotConflict: string;
}

interface PlotOutlineTabProps {
  fields: PlotOutlineFields;
  setField: (key: keyof PlotOutlineFields, value: string) => void;
  context: string;
}

const PLOT_FIELDS: { key: keyof PlotOutlineFields; label: string; placeholder: string; rows: number }[] = [
  { key: 'plotCore', label: '核心剧情线', placeholder: '200-500字的核心剧情描述...', rows: 5 },
  { key: 'plotBeginning', label: '开端', placeholder: '世界观建立、主角出场、核心冲突引入...', rows: 3 },
  { key: 'plotDevelopment', label: '发展', placeholder: '冲突升级、势力对抗、小高潮迭起...', rows: 3 },
  { key: 'plotClimax', label: '高潮', placeholder: '核心冲突推进、角色成长、真相揭示...', rows: 3 },
  { key: 'plotBattle', label: '决战', placeholder: '最高潮对决、决战时刻...', rows: 3 },
  { key: 'plotEnding', label: '结局', placeholder: '收束线索、解决结局...', rows: 3 },
  { key: 'plotFinale', label: '最终走向', placeholder: '故事的最终结局描述...', rows: 3 },
  { key: 'plotConflict', label: '核心矛盾', placeholder: '故事的核心矛盾冲突...', rows: 3 },
];

const inputBase =
  'w-full bg-[#f8f9ff] border border-[#cbc3d7] rounded-lg px-4 py-3 text-base text-[#0d1c2f] focus:outline-none focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] transition-colors';
const labelBase = 'block text-xs font-medium text-[#494454] mb-1';

export const PlotOutlineTab: Component<PlotOutlineTabProps> = (props) => {
  const llm = useLLMGeneration();
  const [prompt, setPrompt] = createSignal('');

  const handleGenerate = async () => {
    const p = prompt().trim();
    if (!p) return;
    const text = await llm.generate({
      prompt: p,
      context: props.context,
      systemPrompt: '你是一个专业的小说创作助手。请根据用户提供的提示词和上下文，生成详细的剧情大纲。内容应包含核心剧情线、开端、发展、高潮、决战、结局、最终走向和核心矛盾。',
    });
    if (text) props.setField('plotCore', text);
  };

  return (
    <div class="space-y-4">
      <h3 class="text-sm font-medium text-[#0d1c2f] font-bold flex items-center gap-2">
        <NovelIcon name="auto_stories" size={20} class="text-[#6b38d4]" />
        剧情总纲
      </h3>

      {/* LLM 生成区 */}
      <div class="flex gap-2">
        <input
          type="text"
          placeholder="输入关键词，如：少年逆袭、拜师学艺、大战魔族..."
          value={prompt()}
          onInput={(e) => setPrompt((e.target as HTMLInputElement).value)}
          class={`${inputBase} flex-1`}
          style={{ 'font-family': "'Work Sans', 'PingFang SC', sans-serif" }}
        />
        <button
          onClick={handleGenerate}
          disabled={llm.isLoading() || !prompt().trim()}
          class="px-4 py-2 rounded-lg bg-[#6b38d4] text-white text-sm font-medium hover:bg-[#5a2db8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {llm.isLoading() ? '生成中...' : 'AI 生成'}
        </button>
      </div>
      <Show when={llm.error()}>
        <p class="text-xs text-[#ba1a1a]">{llm.error()}</p>
      </Show>

      {/* 8 个结构化文本框 */}
      <For each={PLOT_FIELDS}>
        {(field) => (
          <div>
            <label class={labelBase}>{field.label}</label>
            <textarea
              placeholder={field.placeholder}
              value={props.fields[field.key]}
              onInput={(e) => props.setField(field.key, (e.target as HTMLTextAreaElement).value)}
              rows={field.rows}
              class={`${inputBase} resize-none`}
              style={{ 'font-family': "'Work Sans', 'PingFang SC', sans-serif" }}
            />
          </div>
        )}
      </For>
    </div>
  );
};

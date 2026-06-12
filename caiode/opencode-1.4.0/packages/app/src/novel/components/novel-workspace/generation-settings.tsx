import { createSignal, For, Show } from 'solid-js';
import type { Component } from 'solid-js';
import type { GenerationConfig, ContextReference } from '../../types';
import {
  DEFAULT_GENERATION_CONFIG,
  DEFAULT_CONTEXT_REFS,
  AI_MODEL_OPTIONS,
} from '../../types';

interface GenerationSettingsProps {
  hasSelectedChapter: boolean;
  isRunning: boolean;
  onGenerate: (config: GenerationConfig) => void;
  onBatchGenerate?: (config: GenerationConfig) => void;
}

/**
 * AI 生成设置面板 — Workspace 右侧第三种面板
 *
 * 数据来源：组件内 local state（createSignal）
 * 提交时通过 onGenerate 回调将 GenerationConfig 传给父组件
 */
export const GenerationSettings: Component<GenerationSettingsProps> = (props) => {
  const [targetWordCount, setTargetWordCount] = createSignal(
    DEFAULT_GENERATION_CONFIG.targetWordCount
  );
  const [wordCountTolerance, setWordCountTolerance] = createSignal(
    DEFAULT_GENERATION_CONFIG.wordCountTolerance
  );
  const [referenceChapterCount, setReferenceChapterCount] = createSignal(
    DEFAULT_GENERATION_CONFIG.referenceChapterCount
  );
  const [aiModel, setAiModel] = createSignal(
    DEFAULT_GENERATION_CONFIG.aiModel
  );
  const [contextRefs, setContextRefs] = createSignal<Set<string>>(
    new Set(DEFAULT_GENERATION_CONFIG.contextRefs)
  );

  /** 章节数选项 1-10 */
  const CHAPTER_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const toggleContextRef = (id: string) => {
    setContextRefs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isDisabled = () => !props.hasSelectedChapter || props.isRunning;

  /** 构建当前配置并提交 */
  const handleGenerate = () => {
    if (isDisabled()) return;
    props.onGenerate({
      targetWordCount: targetWordCount(),
      wordCountTolerance: wordCountTolerance(),
      referenceChapterCount: referenceChapterCount(),
      aiModel: aiModel(),
      contextRefs: new Set(contextRefs()),
    });
  };

  const handleBatchGenerate = () => {
    if (!props.hasSelectedChapter || !props.onBatchGenerate) return;
    props.onBatchGenerate({
      targetWordCount: targetWordCount(),
      wordCountTolerance: wordCountTolerance(),
      referenceChapterCount: referenceChapterCount(),
      aiModel: aiModel(),
      contextRefs: new Set(contextRefs()),
    });
  };

  return (
    <div class="w-[300px] shrink-0 border-l border-gray-200 bg-white overflow-y-auto flex flex-col">
      {/* 标题 */}
      <div class="px-4 py-3 border-b border-gray-200">
        <h3 class="text-sm font-semibold text-gray-800">AI 生成设置</h3>
      </div>

      <div class="flex-1 p-4 space-y-5">
        {/* 目标字数 */}
        <SettingSection label="目标字数">
          <input
            type="range"
            min={300}
            max={10000}
            step={100}
            value={targetWordCount()}
            onInput={e => setTargetWordCount(Number((e.target as HTMLInputElement).value))}
            class="w-full accent-purple-500"
          />
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>300</span>
            <span class="text-indigo-600 font-medium">{targetWordCount().toLocaleString()} 字</span>
            <span>10000</span>
          </div>
        </SettingSection>

        {/* 字数容差 */}
        <SettingSection label="字数容差">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">±</span>
            <input
              type="number"
              min={0}
              max={2000}
              value={wordCountTolerance()}
              onChange={e => setWordCountTolerance(Number((e.target as HTMLInputElement).value) || 0)}
              class="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-indigo-400"
            />
            <span class="text-xs text-gray-400">字</span>
          </div>
        </SettingSection>

        {/* 参考章节数 */}
        <SettingSection label="参考章节数">
          <select
            value={referenceChapterCount()}
            onChange={e => setReferenceChapterCount(Number((e.target as HTMLSelectElement).value))}
            class="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-indigo-400 bg-white"
          >
            <For each={CHAPTER_COUNT_OPTIONS}>
              {n => <option value={n}>{n} 章</option>}
            </For>
          </select>
        </SettingSection>

        {/* AI 模型 */}
        <SettingSection label="AI 模型">
          <select
            value={aiModel()}
            onChange={e => setAiModel((e.target as HTMLSelectElement).value)}
            class="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-indigo-400 bg-white"
          >
            <For each={[...AI_MODEL_OPTIONS]}>
              {model => <option value={model}>{model}</option>}
            </For>
          </select>
        </SettingSection>

        {/* 上下文参考 */}
        <SettingSection label="上下文参考">
          <div class="space-y-2">
            <For each={DEFAULT_CONTEXT_REFS}>
              {(ref) => {
                const checked = contextRefs().has(ref.id);
                return (
                  <label
                    class={`flex items-center gap-2 py-1.5 px-2 rounded-md text-xs cursor-pointer transition-colors ${
                      ref.disabled
                        ? 'bg-gray-50 opacity-70 cursor-not-allowed'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={ref.disabled ?? false}
                      onClick={() => !ref.disabled && toggleContextRef(ref.id)}
                      class={`rounded border ${
                        ref.disabled
                          ? 'border-gray-300 text-indigo-500'
                          : 'border-gray-300 text-indigo-500 focus:ring-indigo-400'
                      }`}
                    />
                    <span class={ref.disabled ? 'text-gray-500' : 'text-gray-700'}>
                      {ref.label}
                    </span>
                    {ref.disabled && (
                      <span class="ml-auto text-[10px] text-gray-400">必选</span>
                    )}
                  </label>
                );
              }}
            </For>
          </div>
        </SettingSection>
      </div>

      {/* 底部操作按钮 */}
      <div class="p-4 border-t border-gray-200 space-y-2">
        <button
          class={`w-full py-2.5 px-4 text-sm font-medium rounded-lg transition-all ${
            isDisabled()
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-sm'
          }`}
          disabled={isDisabled()}
          onClick={handleGenerate}
        >
          <Show when={props.isRunning} fallback={'开始生成'}>
            <span class="inline-flex items-center gap-1.5">
              <span class="animate-spin">⏳</span> 生成中...
            </span>
          </Show>
        </button>
        <button
          class={`w-full py-2 px-4 text-sm font-medium rounded-lg transition-all ${
            !props.hasSelectedChapter
              ? 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-200'
              : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'
          }`}
          disabled={!props.hasSelectedChapter}
          onClick={handleBatchGenerate}
        >
          批量生成
        </button>
      </div>
    </div>
  );
};

/* ---------- 子组件 ---------- */

interface SettingSectionProps {
  label: string;
  children: any;
}

function SettingSection(props: SettingSectionProps) {
  return (
    <div>
      <label class="block text-xs font-medium text-gray-500 mb-1.5">{props.label}</label>
      {props.children}
    </div>
  );
}

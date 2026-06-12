import { createSignal, For, Show } from 'solid-js';
import type { Component } from 'solid-js';
import type { GenerationConfig, ContextReference } from '../../types';
import {
  DEFAULT_GENERATION_CONFIG,
  DEFAULT_CONTEXT_REFS,
  AI_MODEL_OPTIONS,
} from '../../types';
import { NovelIcon } from '../layout/novel-icon';

interface GenerationSettingsProps {
  open: boolean;
  onClose: () => void;
  hasSelectedChapter: boolean;
  isRunning: boolean;
  onGenerate: (config: GenerationConfig) => void;
  onBatchGenerate?: (config: GenerationConfig) => void;
}

/** AI 生成设置弹窗 — Stitch 10 code.html Modal 形态 */
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
  const [aiModel, setAiModel] = createSignal(DEFAULT_GENERATION_CONFIG.aiModel);
  const [contextRefs, setContextRefs] = createSignal<Set<string>>(
    new Set(DEFAULT_GENERATION_CONFIG.contextRefs)
  );
  const [includedSettings, setIncludedSettings] = createSignal<Set<string>>(
    new Set(['character', 'skill', 'item', 'location', 'plot'])
  );
  const [showIncluded, setShowIncluded] = createSignal(false);

  const CHAPTER_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const INCLUDED_OPTIONS = [
    { id: 'character', label: '角色设定' },
    { id: 'skill', label: '技能/法宝' },
    { id: 'item', label: '物品/道具' },
    { id: 'location', label: '地点场景' },
    { id: 'plot', label: '已有剧情线' },
  ];

  const toggleContextRef = (id: string) => {
    setContextRefs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleIncluded = (id: string) => {
    setIncludedSettings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isDisabled = () => !props.hasSelectedChapter || props.isRunning;

  const handleGenerate = () => {
    if (isDisabled()) return;
    props.onGenerate({
      targetWordCount: targetWordCount(),
      wordCountTolerance: wordCountTolerance(),
      referenceChapterCount: referenceChapterCount(),
      aiModel: aiModel(),
      contextRefs: new Set(contextRefs()),
    });
    props.onClose();
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
    props.onClose();
  };

  const resetDefaults = () => {
    setTargetWordCount(DEFAULT_GENERATION_CONFIG.targetWordCount);
    setWordCountTolerance(DEFAULT_GENERATION_CONFIG.wordCountTolerance);
    setReferenceChapterCount(DEFAULT_GENERATION_CONFIG.referenceChapterCount);
    setAiModel(DEFAULT_GENERATION_CONFIG.aiModel);
    setContextRefs(new Set(DEFAULT_GENERATION_CONFIG.contextRefs));
    setIncludedSettings(new Set(['character', 'skill', 'item', 'location', 'plot']));
  };

  const step = (val: number, delta: number, min: number, max: number, stepSize: number = 1) => {
    const next = val + delta * stepSize;
    return Math.max(min, Math.min(max, next));
  };

  if (!props.open) return null;

  const inputBase =
    'w-full text-center border-none bg-transparent text-base text-[#0d1c2f] focus:ring-0 p-0';
  const stepperBtn =
    'px-2 text-[#7b7486] hover:bg-[#eff4ff] hover:text-[#6b38d4] transition-colors h-full flex items-center justify-center';
  const sectionBox =
    'bg-white p-4 rounded-lg border border-[#cbc3d7]/50 shadow-sm space-y-4';
  const sectionTitle =
    'text-sm font-medium text-[#6b38d4] flex items-center gap-2';

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-[#233144]/40 backdrop-blur-sm p-4"
      onClick={props.onClose}
    >
      <div
        class="bg-white w-full max-w-2xl rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div class="flex items-center justify-between px-6 py-4 border-b border-[#cbc3d7] bg-[#f8f9ff] shrink-0">
          <div>
            <h2
              class="text-xl font-semibold text-[#0d1c2f]"
              style={{ 'font-family': "'Plus Jakarta Sans', 'PingFang SC', sans-serif" }}
            >
              生成设置
            </h2>
            <p class="text-xs text-[#7b7486] mt-1">自定义AI生成参数</p>
          </div>
          <button
            onClick={props.onClose}
            class="text-[#494454] hover:text-[#0d1c2f] hover:bg-[#eff4ff] p-2 rounded-full transition-colors"
          >
            <NovelIcon name="close" size={20} />
          </button>
        </div>

        {/* Body */}
        <div class="p-6 overflow-y-auto flex-1 space-y-6 bg-[#f8f9ff]">
          {/* Section 1: 基础设置 */}
          <div class={sectionBox}>
            <h3 class={sectionTitle}>
              <NovelIcon name="tune" size={16} />
              基础设置
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 目标字数 */}
              <div class="flex flex-col gap-1">
                <label class="text-xs text-[#494454]">目标字数 (字)</label>
                <div class="flex items-center border border-[#cbc3d7] rounded-lg bg-[#f8f9ff] focus-within:border-[#6b38d4] focus-within:ring-1 focus-within:ring-[#6b38d4] overflow-hidden h-10">
                  <button
                    class={stepperBtn}
                    onClick={() => setTargetWordCount((v) => step(v, -1, 1000, 10000, 500))}
                  >
                    <NovelIcon name="remove" size={16} />
                  </button>
                  <input
                    type="number"
                    class={inputBase}
                    value={targetWordCount()}
                    onChange={(e) =>
                      setTargetWordCount(
                        Math.max(1000, Math.min(10000, Number((e.target as HTMLInputElement).value) || 0))
                      )
                    }
                  />
                  <button
                    class={stepperBtn}
                    onClick={() => setTargetWordCount((v) => step(v, 1, 1000, 10000, 500))}
                  >
                    <NovelIcon name="add" size={16} />
                  </button>
                </div>
                <span class="text-[10px] text-[#7b7486]">范围: 1000-10000</span>
              </div>

              {/* 字数容差 */}
              <div class="flex flex-col gap-1">
                <label class="text-xs text-[#494454]">字数容差 (字)</label>
                <div class="flex items-center border border-[#cbc3d7] rounded-lg bg-[#f8f9ff] focus-within:border-[#6b38d4] focus-within:ring-1 focus-within:ring-[#6b38d4] overflow-hidden h-10">
                  <button
                    class={stepperBtn}
                    onClick={() => setWordCountTolerance((v) => step(v, -1, 50, 1000, 50))}
                  >
                    <NovelIcon name="remove" size={16} />
                  </button>
                  <span class="text-[#7b7486] text-sm pr-2">±</span>
                  <input
                    type="number"
                    class={inputBase}
                    value={wordCountTolerance()}
                    onChange={(e) =>
                      setWordCountTolerance(
                        Math.max(50, Math.min(1000, Number((e.target as HTMLInputElement).value) || 0))
                      )
                    }
                  />
                  <button
                    class={`${stepperBtn} border-l border-[#cbc3d7]`}
                    onClick={() => setWordCountTolerance((v) => step(v, 1, 50, 1000, 50))}
                  >
                    <NovelIcon name="add" size={16} />
                  </button>
                </div>
              </div>

              {/* 参考章节数 */}
              <div class="flex flex-col gap-1">
                <label class="text-xs text-[#494454]">参考章节数</label>
                <div class="relative h-10">
                  <select
                    class="w-full h-full appearance-none border border-[#cbc3d7] rounded-lg bg-[#f8f9ff] text-base text-[#0d1c2f] pl-3 pr-10 focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] cursor-pointer"
                    value={referenceChapterCount()}
                    onChange={(e) =>
                      setReferenceChapterCount(Number((e.target as HTMLSelectElement).value))
                    }
                  >
                    <For each={CHAPTER_COUNT_OPTIONS}>
                      {(n) => <option value={n}>{n} 章</option>}
                    </For>
                  </select>
                  <NovelIcon
                    name="expand_more"
                    size={16}
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-[#494454] pointer-events-none"
                  />
                </div>
              </div>

              {/* AI模型 */}
              <div class="flex flex-col gap-1">
                <label class="text-xs text-[#494454]">AI模型</label>
                <div class="relative h-10">
                  <select
                    class="w-full h-full appearance-none border border-[#cbc3d7] rounded-lg bg-[#f8f9ff] text-base text-[#0d1c2f] pl-3 pr-10 focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] cursor-pointer"
                    value={aiModel()}
                    onChange={(e) => setAiModel((e.target as HTMLSelectElement).value)}
                  >
                    <For each={[...AI_MODEL_OPTIONS]}>
                      {(model) => <option value={model}>{model}</option>}
                    </For>
                  </select>
                  <NovelIcon
                    name="expand_more"
                    size={16}
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-[#494454] pointer-events-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: 上下文参考 */}
          <div class={sectionBox}>
            <div class="flex justify-between items-center mb-3">
              <h3 class={sectionTitle}>
                <NovelIcon name="history_edu" size={16} />
                上下文参考
              </h3>
              <div class="flex items-center gap-2">
                <label class="text-xs text-[#494454]">参考章节数:</label>
                <div class="relative w-20">
                  <select
                    class="w-full appearance-none border border-[#cbc3d7] rounded-md bg-[#f8f9ff] text-sm text-[#0d1c2f] py-1 pl-2 pr-6 focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] cursor-pointer"
                    value={referenceChapterCount()}
                    onChange={(e) =>
                      setReferenceChapterCount(Number((e.target as HTMLSelectElement).value))
                    }
                  >
                    <For each={CHAPTER_COUNT_OPTIONS}>
                      {(n) => <option value={n}>{n} 章</option>}
                    </For>
                  </select>
                  <NovelIcon
                    name="expand_more"
                    size={14}
                    class="absolute right-1 top-1/2 -translate-y-1/2 text-[#494454] pointer-events-none"
                  />
                </div>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
              <For each={DEFAULT_CONTEXT_REFS}>
                {(ref) => {
                  const checked = contextRefs().has(ref.id);
                  return (
                    <label
                      class={`flex items-center gap-2 p-2 rounded-md transition-colors ${
                        ref.disabled
                          ? 'opacity-70 cursor-not-allowed'
                          : 'hover:bg-[#eff4ff] cursor-pointer group'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={ref.disabled ?? false}
                        onClick={() => !ref.disabled && toggleContextRef(ref.id)}
                        class={`w-4 h-4 text-[#6b38d4] border-[#cbc3d7] rounded focus:ring-[#6b38d4]/50 ${
                          ref.disabled ? 'cursor-not-allowed bg-[#d5e3fd]' : 'cursor-pointer'
                        }`}
                      />
                      <span class={`text-sm ${ref.disabled ? 'text-[#494454]' : 'text-[#0d1c2f] group-hover:text-[#6b38d4]'}`}>
                        {ref.label}
                      </span>
                      {ref.disabled && (
                        <span class="ml-auto text-[10px] bg-[#d5e3fd] text-[#494454] px-1 rounded">
                          必选
                        </span>
                      )}
                    </label>
                  );
                }}
              </For>
            </div>
          </div>

          {/* Section 3: 包含设定 (Collapsible) */}
          <div class="bg-white rounded-lg border border-[#cbc3d7]/50 shadow-sm overflow-hidden">
            <button
              class="w-full flex items-center justify-between p-4 hover:bg-[#f8f9ff] transition-colors"
              onClick={() => setShowIncluded((v) => !v)}
            >
              <h3 class={sectionTitle}>
                <NovelIcon name="category" size={16} />
                包含设定
              </h3>
              <NovelIcon
                name="expand_more"
                size={20}
                class={`text-[#7b7486] transition-transform duration-200 ${showIncluded() ? 'rotate-180' : ''}`}
              />
            </button>
            <Show when={showIncluded()}>
              <div class="p-4 pt-0 border-t border-[#cbc3d7]/30">
                <div class="flex flex-wrap gap-2 pt-3">
                  <For each={INCLUDED_OPTIONS}>
                    {(opt) => {
                      const checked = includedSettings().has(opt.id);
                      return (
                        <label class="relative inline-flex items-center cursor-pointer group">
                          <input
                            type="checkbox"
                            class="sr-only peer"
                            checked={checked}
                            onChange={() => toggleIncluded(opt.id)}
                          />
                          <div
                            class={`px-3 py-1 rounded-full border text-xs transition-all ${
                              checked
                                ? 'bg-[#e9ddff]/30 text-[#6b38d4] border-[#6b38d4]/50'
                                : 'text-[#494454] border-[#cbc3d7] hover:bg-[#eff4ff] group-hover:border-[#6b38d4]/30'
                            }`}
                          >
                            {opt.label}
                          </div>
                        </label>
                      );
                    }}
                  </For>
                </div>
              </div>
            </Show>
          </div>
        </div>

        {/* Footer */}
        <div class="px-6 py-4 border-t border-[#cbc3d7] bg-[#f8f9ff] flex items-center justify-between shrink-0">
          <button
            onClick={resetDefaults}
            class="text-sm text-[#7b7486] hover:text-[#6b38d4] transition-colors flex items-center gap-1"
          >
            <NovelIcon name="refresh" size={16} />
            恢复默认
          </button>
          <div class="flex items-center gap-3">
            <button
              onClick={props.onClose}
              class="px-5 py-2 rounded-lg border border-[#cbc3d7] text-[#0d1c2f] text-sm font-medium bg-white hover:bg-[#eff4ff] transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleGenerate}
              disabled={isDisabled()}
              class={`px-5 py-2 rounded-lg text-white text-sm font-medium flex items-center gap-2 transition-all ${
                isDisabled()
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#6b38d4] to-[#a855f7] hover:opacity-90 shadow-[0_2px_8px_rgba(107,56,212,0.3)]'
              }`}
            >
              <NovelIcon name="magic_button" size={16} />
              <Show when={props.isRunning} fallback="开始生成">
                生成中...
              </Show>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

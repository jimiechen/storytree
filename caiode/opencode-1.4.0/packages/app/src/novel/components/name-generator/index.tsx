/**
 * @file name-generator/index.tsx
 * @description PAGE-14 名字生成器页面组件
 */

import type { Component } from 'solid-js';
import { Show, For, createSignal } from 'solid-js';
import { useNameGenerator } from '../../hooks/use-name-generator';
import { useNovelNavigation } from '../../hooks/use-novel-navigation';
import type { GeneratorMode, NameGender, NameStyle } from '../../types/name-generator';
import { NovelIcon } from '../layout/novel-icon';

const MODES: { value: GeneratorMode; label: string }[] = [
  { value: 'random', label: '随机生成' },
  { value: 'ai', label: 'AI智能生成' },
];

const GENDERS: { value: NameGender; label: string; icon: string }[] = [
  { value: 'male', label: '男', icon: '♂' },
  { value: 'female', label: '女', icon: '♀' },
  { value: 'neutral', label: '通用', icon: '⚥' },
];

const STYLES: { value: NameStyle; label: string }[] = [
  { value: 'minimal', label: '简约' },
  { value: 'ancient', label: '古风' },
  { value: 'fantasy', label: '玄幻' },
  { value: 'modern', label: '现代' },
  { value: 'cool', label: '酷炫' },
  { value: 'cute', label: '可爱' },
];

export const NameGeneratorPage: Component = () => {
  const ng = useNameGenerator();
  const nav = useNovelNavigation();
  const [copied, setCopied] = createSignal(false);

  const handleCopy = async () => {
    const ok = await ng.copyResult();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerate = () => {
    void ng.generate();
  };

  const formatConfig = (entry: { config: { gender: NameGender; style: NameStyle; length: number; mode: GeneratorMode } }) => {
    const g = GENDERS.find((x) => x.value === entry.config.gender)?.label ?? '';
    const s = STYLES.find((x) => x.value === entry.config.style)?.label ?? '';
    return `${g} · ${s} · ${entry.config.length}字`;
  };

  return (
    <div class="flex flex-col h-screen bg-[#f8f9ff] overflow-hidden">
      {/* 顶部栏 */}
      <header class="flex items-center justify-between px-8 py-4 border-b border-[#cbc3d7] bg-white">
        <div class="flex items-center gap-3">
          <button
            type="button"
            data-testid="ng-back-btn"
            onClick={() => nav.openView('bookshelf')}
            class="flex items-center gap-1 text-sm text-[#494454] hover:text-[#6b38d4] cursor-pointer"
          >
            <NovelIcon name="arrow_back" size={18} weight={400} />
            返回管理中心
          </button>
        </div>
        <h1
          data-testid="ng-page-title"
          class="text-xl font-semibold text-[#0d1c2f]"
        >
          名字生成器
        </h1>
        <div class="w-40" />
      </header>

      <div class="flex-1 overflow-y-auto px-8 py-6">
        <div class="max-w-4xl mx-auto space-y-6">
          {/* 模式 Tab */}
          <div class="bg-white rounded-xl border border-[#cbc3d7] p-4">
            <div class="flex gap-2">
              <For each={MODES}>
                {(m) => (
                  <button
                    type="button"
                    data-testid={`ng-tab-${m.value === 'random' ? 'random' : 'ai'}`}
                    onClick={() => ng.setMode(m.value)}
                    class={`px-6 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      ng.mode() === m.value
                        ? 'bg-[#6b38d4] text-white'
                        : 'bg-[#f8f9ff] text-[#494454] hover:bg-[#eff4ff]'
                    }`}
                  >
                    {m.label}
                  </button>
                )}
              </For>
            </div>
            <Show when={ng.mode() === 'ai' && !ng.aiAvailable()}>
              <p class="mt-2 text-xs text-[#9d4300]">
                AI 模式未启用（FeatureGate 关闭），生成时将降级为随机模式
              </p>
            </Show>
          </div>

          {/* 配置区 */}
          <div class="bg-white rounded-xl border border-[#cbc3d7] p-6 space-y-5">
            {/* 性别 */}
            <div>
              <p class="text-sm font-medium text-[#0d1c2f] mb-2">性别</p>
              <div class="flex gap-2">
                <For each={GENDERS}>
                  {(g) => (
                    <button
                      type="button"
                      data-testid={`ng-gender-${g.value === 'male' ? 'male' : g.value === 'female' ? 'female' : 'neutral'}`}
                      onClick={() => ng.setGender(g.value)}
                      class={`px-5 py-2 rounded-lg text-sm border transition-colors cursor-pointer ${
                        ng.gender() === g.value
                          ? 'border-[#6b38d4] bg-[#e9ddff] text-[#6b38d4]'
                          : 'border-[#cbc3d7] bg-white text-[#494454] hover:bg-[#f8f9ff]'
                      }`}
                    >
                      <span class="mr-1">{g.icon}</span>
                      {g.label}
                    </button>
                  )}
                </For>
              </div>
            </div>

            {/* 风格 */}
            <div>
              <p class="text-sm font-medium text-[#0d1c2f] mb-2">风格</p>
              <div class="flex flex-wrap gap-2">
                <For each={STYLES}>
                  {(s) => (
                    <button
                      type="button"
                      data-testid={`ng-style-${s.value}`}
                      onClick={() => ng.setStyle(s.value)}
                      class={`px-5 py-2 rounded-lg text-sm border transition-colors cursor-pointer ${
                        ng.style() === s.value
                          ? 'border-[#6b38d4] bg-[#e9ddff] text-[#6b38d4]'
                          : 'border-[#cbc3d7] bg-white text-[#494454] hover:bg-[#f8f9ff]'
                      }`}
                    >
                      {s.label}
                    </button>
                  )}
                </For>
              </div>
            </div>

            {/* 长度 */}
            <div>
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-medium text-[#0d1c2f]">名字长度</p>
                <span
                  data-testid="ng-length-value"
                  class="text-sm text-[#6b38d4] font-semibold"
                >
                  {ng.length()} 字
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="6"
                step="1"
                value={ng.length()}
                data-testid="ng-length-slider"
                onInput={(e) => ng.setLength(Number(e.currentTarget.value))}
                class="w-full accent-[#6b38d4]"
              />
              <div class="flex justify-between text-xs text-[#7b7486] mt-1">
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6</span>
              </div>
            </div>

            {/* 生成按钮 */}
            <button
              type="button"
              data-testid="ng-generate-btn"
              onClick={handleGenerate}
              disabled={ng.generating()}
              class="w-full py-3 rounded-lg bg-[#6b38d4] text-white font-medium hover:bg-[#5a2db3] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <Show when={!ng.generating()} fallback="生成中...">
                生成名字
              </Show>
            </button>
          </div>

          {/* 结果区 */}
          <Show when={ng.result()}>
            <div class="bg-white rounded-xl border border-[#cbc3d7] p-6">
              <p class="text-sm font-medium text-[#0d1c2f] mb-3">生成结果</p>
              <div class="flex items-center justify-between gap-4">
                <p
                  data-testid="ng-result"
                  class="text-3xl font-bold text-[#6b38d4]"
                >
                  {ng.result()}
                </p>
                <button
                  type="button"
                  data-testid="ng-copy-btn"
                  onClick={handleCopy}
                  class="px-4 py-2 rounded-lg border border-[#cbc3d7] text-sm text-[#494454] hover:bg-[#f8f9ff] cursor-pointer"
                >
                  <Show when={!copied()} fallback="已复制">
                    复制
                  </Show>
                </button>
              </div>
              <Show when={ng.notice()}>
                <p class="mt-2 text-xs text-[#9d4300]">{ng.notice()}</p>
              </Show>
            </div>
          </Show>

          {/* 历史记录 */}
          <Show when={ng.history().length > 0}>
            <div class="bg-white rounded-xl border border-[#cbc3d7] p-6">
              <div class="flex items-center justify-between mb-3">
                <p class="text-sm font-medium text-[#0d1c2f]">历史记录</p>
                <button
                  type="button"
                  onClick={() => ng.clearHistory()}
                  class="text-xs text-[#7b7486] hover:text-[#6b38d4] cursor-pointer"
                >
                  清空
                </button>
              </div>
              <ul data-testid="ng-history" class="space-y-2">
                <For each={ng.history()}>
                  {(entry) => (
                    <li class="flex items-center justify-between py-2 border-b border-[#f0eef5] last:border-b-0">
                      <span class="text-lg font-medium text-[#0d1c2f]">{entry.text}</span>
                      <span class="text-xs text-[#7b7486]">{formatConfig(entry)}</span>
                    </li>
                  )}
                </For>
              </ul>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};

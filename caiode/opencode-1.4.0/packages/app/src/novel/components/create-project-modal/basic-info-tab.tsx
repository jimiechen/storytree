/**
 * @file basic-info-tab.tsx
 * @description 创建项目弹窗 — 基本信息 Tab
 *
 * 包含：封面上传（localStorage 持久化）+ 小说名称/类型/目标读者/写作风格/故事主题/预估章数/简介
 */

import { Show, For, onMount } from 'solid-js';
import type { Component } from 'solid-js';
import type { GenreOption, TargetAudience, WritingStyle, StoryTheme } from '../../types';
import { GENRE_OPTIONS } from '../../types';
import { NovelIcon } from '../layout/novel-icon';

const COVER_STORAGE_KEY = 'novel:cover:draft';
const MAX_COVER_SIZE = 2 * 1024 * 1024; // 2MB

const TARGET_AUDIENCE_OPTIONS: { value: TargetAudience; label: string }[] = [
  { value: 'general', label: '大众（通用）' },
  { value: 'male', label: '男频（热血、升级、爽文）' },
  { value: 'female', label: '女频（言情、情感、细腻）' },
];

const WRITING_STYLE_OPTIONS: { value: WritingStyle; label: string }[] = [
  { value: 'default', label: '默认' },
  { value: 'humorous', label: '诙谐幽默' },
  { value: 'dark', label: '人性黑暗' },
  { value: 'decisive', label: '杀伐果断' },
  { value: 'literary', label: '文学性强' },
  { value: 'fast-paced', label: '快节奏' },
  { value: 'slow-paced', label: '慢节奏' },
  { value: 'mystery', label: '悬疑' },
  { value: 'passionate', label: '热血' },
  { value: 'light', label: '轻松' },
  { value: 'heartbreaking', label: '虐心' },
  { value: 'custom', label: '自定义' },
];

const STORY_THEME_OPTIONS: { value: StoryTheme; label: string }[] = [
  { value: 'default', label: '默认' },
  { value: 'revenge', label: '复仇' },
  { value: 'growth', label: '成长' },
  { value: 'love', label: '爱情' },
  { value: 'adventure', label: '冒险' },
  { value: 'redemption', label: '救赎' },
  { value: 'power', label: '权力' },
  { value: 'friendship', label: '友情' },
  { value: 'survival', label: '生存' },
  { value: 'exploration', label: '探索' },
  { value: 'competition', label: '竞争' },
  { value: 'family', label: '家庭' },
  { value: 'custom', label: '自定义' },
];

export interface BasicInfoTabProps {
  name: () => string;
  setName: (v: string) => void;
  genre: () => GenreOption;
  setGenre: (v: GenreOption) => void;
  description: () => string;
  setDescription: (v: string) => void;
  targetAudience: () => TargetAudience;
  setTargetAudience: (v: TargetAudience) => void;
  writingStyle: () => WritingStyle;
  setWritingStyle: (v: WritingStyle) => void;
  storyTheme: () => StoryTheme;
  setStoryTheme: (v: StoryTheme) => void;
  estimatedChapters: () => string;
  setEstimatedChapters: (v: string) => void;
  coverUrl: () => string;
  setCoverUrl: (v: string) => void;
  errors: () => Record<string, string>;
}

export const BasicInfoTab: Component<BasicInfoTabProps> = (props) => {
  let fileInput: HTMLInputElement | undefined;

  // 从 localStorage 恢复封面
  onMount(() => {
    if (!props.coverUrl()) {
      const saved = localStorage.getItem(COVER_STORAGE_KEY);
      if (saved) props.setCoverUrl(saved);
    }
  });

  const handleFileSelect = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > MAX_COVER_SIZE) {
      alert('封面图片不能超过 2MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      props.setCoverUrl(base64);
      localStorage.setItem(COVER_STORAGE_KEY, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteCover = () => {
    props.setCoverUrl('');
    localStorage.removeItem(COVER_STORAGE_KEY);
    if (fileInput) fileInput.value = '';
  };

  const inputBase =
    'w-full bg-[#f8f9ff] border border-[#cbc3d7] rounded-lg px-4 py-3 text-base text-[#0d1c2f] focus:outline-none focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] transition-colors';
  const inputError = 'border-[#ba1a1a] bg-[#ffdad6]/30';
  const labelBase = 'block text-sm font-medium text-[#0d1c2f] mb-1';

  return (
    <div class="flex gap-6">
      {/* 左侧：封面上传 */}
      <div class="flex-shrink-0">
        <label class={labelBase}>上传封面</label>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          class="hidden"
          onChange={handleFileSelect}
        />
        <Show
          when={props.coverUrl()}
          fallback={
            <button
              onClick={() => fileInput?.click()}
              class="w-[120px] h-[160px] border-2 border-dashed border-[#cbc3d7] rounded-lg bg-[#f8f9ff] flex flex-col items-center justify-center gap-2 hover:border-[#6b38d4] transition-colors"
            >
              <NovelIcon name="add_photo_alternate" size={32} class="text-[#cbc3d7]" />
              <span class="text-xs text-[#494454]">点击上传</span>
            </button>
          }
        >
          <div class="relative w-[120px] h-[160px] rounded-lg overflow-hidden border border-[#cbc3d7]">
            <img src={props.coverUrl()} alt="封面" class="w-full h-full object-cover" />
            <button
              onClick={handleDeleteCover}
              class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <NovelIcon name="close" size={14} />
            </button>
          </div>
        </Show>
      </div>

      {/* 右侧：表单字段 */}
      <div class="flex-1 space-y-4">
        <div>
          <label class={labelBase}>
            小说名称 <span class="text-[#ba1a1a]">*</span>
          </label>
          <input
            type="text"
            placeholder="给你的小说起个名字"
            value={props.name()}
            onInput={(e) => props.setName((e.target as HTMLInputElement).value)}
            class={`${inputBase} ${props.errors().name ? inputError : ''}`}
            style={{ 'font-family': "'Work Sans', 'PingFang SC', sans-serif" }}
          />
          <Show when={props.errors().name}>
            <p class="mt-1 text-xs text-[#ba1a1a]">{props.errors().name}</p>
          </Show>
        </div>

        <div>
          <label class={labelBase}>
            类型 <span class="text-[#ba1a1a]">*</span>
          </label>
          <div class="relative">
            <select
              value={props.genre()}
              onChange={(e) => props.setGenre((e.target as HTMLSelectElement).value as GenreOption)}
              class={`${inputBase} appearance-none ${props.errors().genre ? inputError : ''}`}
            >
              <For each={GENRE_OPTIONS}>
                {(g) => <option value={g}>{g}</option>}
              </For>
            </select>
            <NovelIcon
              name="expand_more"
              size={20}
              class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#494454]"
            />
          </div>
        </div>

        <div>
          <label class={labelBase}>目标读者</label>
          <div class="flex gap-4 flex-wrap">
            <For each={TARGET_AUDIENCE_OPTIONS}>
              {(opt) => (
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="targetAudience"
                    checked={props.targetAudience() === opt.value}
                    onChange={() => props.setTargetAudience(opt.value)}
                    class="text-[#6b38d4] focus:ring-[#6b38d4] w-4 h-4"
                  />
                  <span class="text-sm text-[#0d1c2f]">{opt.label}</span>
                </label>
              )}
            </For>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class={labelBase}>写作风格</label>
            <div class="relative">
              <select
                value={props.writingStyle()}
                onChange={(e) => props.setWritingStyle((e.target as HTMLSelectElement).value as WritingStyle)}
                class={`${inputBase} appearance-none`}
              >
                <For each={WRITING_STYLE_OPTIONS}>
                  {(opt) => <option value={opt.value}>{opt.label}</option>}
                </For>
              </select>
              <NovelIcon
                name="expand_more"
                size={20}
                class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#494454]"
              />
            </div>
          </div>
          <div>
            <label class={labelBase}>故事主题</label>
            <div class="relative">
              <select
                value={props.storyTheme()}
                onChange={(e) => props.setStoryTheme((e.target as HTMLSelectElement).value as StoryTheme)}
                class={`${inputBase} appearance-none`}
              >
                <For each={STORY_THEME_OPTIONS}>
                  {(opt) => <option value={opt.value}>{opt.label}</option>}
                </For>
              </select>
              <NovelIcon
                name="expand_more"
                size={20}
                class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#494454]"
              />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class={labelBase}>预估章数</label>
            <input
              type="number"
              placeholder="如：100"
              value={props.estimatedChapters()}
              onInput={(e) => props.setEstimatedChapters((e.target as HTMLInputElement).value)}
              class={inputBase}
              min="1"
            />
          </div>
        </div>

        <div>
          <label class={labelBase}>小说简介</label>
          <textarea
            placeholder="简单描述小说要讲什么故事..."
            value={props.description()}
            onInput={(e) => props.setDescription((e.target as HTMLTextAreaElement).value)}
            rows={3}
            class={`${inputBase} resize-none`}
          />
        </div>
      </div>
    </div>
  );
};

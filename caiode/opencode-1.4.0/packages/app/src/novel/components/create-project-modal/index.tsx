/**
 * @file create-project-modal/index.tsx
 * @description 创建项目弹窗 — 6-Tab 严格顺序导航
 *
 * Tab 顺序：基本信息 → 主角设定 → 世界观 → 剧情总纲 → 自定义设定 → 选择文件
 * 导航规则：严格顺序，不能跳过未完成的 Tab
 */

import { createSignal, Show, For } from 'solid-js';
import type { Component } from 'solid-js';
import type {
  CreateProjectInput,
  Gender,
  GenreOption,
  ProtagonistInput,
  TargetAudience,
  WritingStyle,
  StoryTheme,
} from '../../types';
import { NovelIcon } from '../layout/novel-icon';
import { BasicInfoTab } from './basic-info-tab';
import { LLMGenerationTab } from './llm-generation-tab';
import { ProtagonistTab } from './protagonist-tab';

interface CreateProjectModalProps {
  onSubmit: (input: CreateProjectInput) => Promise<void>;
  onCancel: () => void;
}

type TabId = 'basic' | 'protagonist' | 'worldview' | 'plot' | 'custom' | 'file';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'basic', label: '基本信息', icon: 'info' },
  { id: 'protagonist', label: '主角设定', icon: 'person' },
  { id: 'worldview', label: '世界观', icon: 'public' },
  { id: 'plot', label: '剧情总纲', icon: 'auto_stories' },
  { id: 'custom', label: '自定义设定', icon: 'tune' },
  { id: 'file', label: '选择文件', icon: 'upload_file' },
];

export const CreateProjectModal: Component<CreateProjectModalProps> = (props) => {
  // 基本信息
  const [name, setName] = createSignal('');
  const [genre, setGenre] = createSignal<GenreOption>('玄幻');
  const [description, setDescription] = createSignal('');
  const [targetAudience, setTargetAudience] = createSignal<TargetAudience>('general');
  const [writingStyle, setWritingStyle] = createSignal<WritingStyle>('default');
  const [storyTheme, setStoryTheme] = createSignal<StoryTheme>('default');
  const [estimatedChapters, setEstimatedChapters] = createSignal('');
  const [coverUrl, setCoverUrl] = createSignal('');
  // 主角设定 (PRD §3.5 — 9 个元素)
  const [protagonistName, setProtagonistName] = createSignal('');
  const [protagonistGender, setProtagonistGender] = createSignal<Gender>('male');
  const [protagonistAge, setProtagonistAge] = createSignal('');
  const [protagonistPersonality, setProtagonistPersonality] = createSignal('');
  const [protagonistAppearance, setProtagonistAppearance] = createSignal('');
  const [protagonistBackground, setProtagonistBackground] = createSignal('');
  const [protagonistMotivation, setProtagonistMotivation] = createSignal('');
  const [protagonistWeakness, setProtagonistWeakness] = createSignal('');
  // 世界观 / 剧情
  const [worldview, setWorldview] = createSignal('');
  const [plotOutline, setPlotOutline] = createSignal('');
  // 自定义设定
  const [customSettings, setCustomSettings] = createSignal('');
  // 导航状态
  const [activeTab, setActiveTab] = createSignal<TabId>('basic');
  const [maxReachedTab, setMaxReachedTab] = createSignal(0);
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [errors, setErrors] = createSignal<Record<string, string>>({});

  const currentTabIndex = () => TABS.findIndex((t) => t.id === activeTab());

  const validateTab = (tab: TabId): boolean => {
    const e: Record<string, string> = {};
    if (tab === 'basic') {
      if (!name().trim()) e.name = '请输入书名';
      if (!genre()) e.genre = '请选择类型';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validateTab(activeTab())) return;
    const idx = currentTabIndex();
    if (idx < TABS.length - 1) {
      const nextTab = TABS[idx + 1];
      setActiveTab(nextTab.id);
      setMaxReachedTab(Math.max(maxReachedTab(), idx + 1));
    }
  };

  const handlePrev = () => {
    const idx = currentTabIndex();
    if (idx > 0) setActiveTab(TABS[idx - 1].id);
  };

  const handleSubmit = async () => {
    if (!validateTab('basic')) {
      setActiveTab('basic');
      return;
    }
    setIsSubmitting(true);
    const protagonist: ProtagonistInput | undefined = protagonistName().trim()
      ? {
          name: protagonistName().trim(),
          gender: protagonistGender(),
          age: protagonistAge() ? Number(protagonistAge()) : undefined,
          personality: protagonistPersonality().trim() || undefined,
          appearance: protagonistAppearance().trim() || undefined,
          background: protagonistBackground().trim() || undefined,
          motivation: protagonistMotivation().trim() || undefined,
          weakness: protagonistWeakness().trim() || undefined,
        }
      : undefined;
    try {
      await props.onSubmit({
        name: name().trim(),
        genre: genre(),
        description: description().trim() || undefined,
        protagonist,
        targetAudience: targetAudience(),
        writingStyle: writingStyle(),
        storyTheme: storyTheme(),
        customSettings: customSettings().trim() || undefined,
        estimatedChapters: estimatedChapters() ? Number(estimatedChapters()) : undefined,
        coverUrl: coverUrl() || undefined,
        worldview: worldview().trim() || undefined,
        plotOutline: plotOutline().trim() || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canClickTab = (idx: number): boolean => idx <= maxReachedTab();
  const isLastTab = () => currentTabIndex() === TABS.length - 1;

  const llmContext = () =>
    `小说名称：${name() || '未设定'}\n类型：${genre()}\n简介：${description() || '无'}\n写作风格：${writingStyle()}\n故事主题：${storyTheme()}`;

  const inputBase =
    'w-full bg-[#f8f9ff] border border-[#cbc3d7] rounded-lg px-4 py-3 text-base focus:outline-none focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] transition-colors';
  const labelBase = 'block text-sm font-medium text-[#0d1c2f] mb-1';
  const sectionTitle = 'text-sm font-medium text-[#0d1c2f] font-bold flex items-center gap-2';

  return (
    <div
      class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={props.onCancel}
    >
      <div
        class="w-full max-w-2xl rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-[#cbc3d7]/30 flex flex-col max-h-[90vh] overflow-hidden"
        style={{ 'background-color': '#ffffff' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div class="flex items-center justify-between px-6 py-4 border-b border-[#cbc3d7]">
          <h2
            class="text-xl font-semibold text-[#0d1c2f]"
            style={{ 'font-family': "'Plus Jakarta Sans', 'PingFang SC', sans-serif" }}
          >
            创建新项目
          </h2>
          <button
            class="p-2 text-[#494454] hover:text-[#0d1c2f] hover:bg-[#eff4ff] rounded-full transition-colors"
            onClick={props.onCancel}
          >
            <NovelIcon name="close" size={20} />
          </button>
        </div>

        {/* 提示文案 */}
        <div class="px-6 py-2 text-xs text-[#494454] bg-[#f8f9ff] border-b border-[#cbc3d7]/30">
          完善的小说设定可以让AI创作出更符合预期的内容
        </div>

        {/* TabBar（严格顺序：未到达的 Tab 禁用） */}
        <div class="flex gap-1 px-6 py-3 border-b border-[#cbc3d7] overflow-x-auto">
          <For each={TABS}>
            {(tab, idx) => (
              <button
                disabled={!canClickTab(idx())}
                class={`pb-2 border-b-2 text-sm font-medium flex items-center gap-1 whitespace-nowrap transition-colors px-2 ${
                  activeTab() === tab.id
                    ? 'border-[#6b38d4] text-[#6b38d4] font-bold'
                    : canClickTab(idx())
                    ? 'border-transparent text-[#494454] hover:text-[#0d1c2f]'
                    : 'border-transparent text-[#cbc3d7] cursor-not-allowed'
                }`}
                onClick={() => canClickTab(idx()) && setActiveTab(tab.id)}
              >
                <NovelIcon name={tab.icon} size={16} />
                {tab.label}
              </button>
            )}
          </For>
        </div>

        {/* Content */}
        <div class="flex-1 overflow-y-auto px-6 py-6">
          <Show when={activeTab() === 'basic'}>
            <BasicInfoTab
              name={name} setName={setName}
              genre={genre} setGenre={setGenre}
              description={description} setDescription={setDescription}
              targetAudience={targetAudience} setTargetAudience={setTargetAudience}
              writingStyle={writingStyle} setWritingStyle={setWritingStyle}
              storyTheme={storyTheme} setStoryTheme={setStoryTheme}
              estimatedChapters={estimatedChapters} setEstimatedChapters={setEstimatedChapters}
              coverUrl={coverUrl} setCoverUrl={setCoverUrl}
              errors={errors}
            />
          </Show>

          <Show when={activeTab() === 'protagonist'}>
            <ProtagonistTab
              name={protagonistName} setName={setProtagonistName}
              gender={protagonistGender} setGender={setProtagonistGender}
              age={protagonistAge} setAge={setProtagonistAge}
              personality={protagonistPersonality} setPersonality={setProtagonistPersonality}
              appearance={protagonistAppearance} setAppearance={setProtagonistAppearance}
              background={protagonistBackground} setBackground={setProtagonistBackground}
              motivation={protagonistMotivation} setMotivation={setProtagonistMotivation}
              weakness={protagonistWeakness} setWeakness={setProtagonistWeakness}
            />
          </Show>

          <Show when={activeTab() === 'worldview'}>
            <LLMGenerationTab
              label="世界观" icon="public"
              placeholder="描述小说的世界观设定，如修炼体系、科技水平、社会结构等..."
              promptPlaceholder="输入关键词，如：修仙世界、九重天、灵气复苏..."
              value={worldview()} onInput={setWorldview} context={llmContext()}
            />
          </Show>

          <Show when={activeTab() === 'plot'}>
            <LLMGenerationTab
              label="剧情总纲" icon="auto_stories"
              placeholder="描述小说的剧情大纲，包括开端、发展、高潮、结局..."
              promptPlaceholder="输入关键词，如：少年逆袭、拜师学艺、大战魔族..."
              value={plotOutline()} onInput={setPlotOutline} context={llmContext()}
            />
          </Show>

          <Show when={activeTab() === 'custom'}>
            <div class="space-y-4">
              <h3 class={sectionTitle}>
                <NovelIcon name="tune" size={20} class="text-[#6b38d4]" />
                自定义设定
              </h3>
              <textarea placeholder="添加修仙体系、科技设定等自定义内容..."
                value={customSettings()}
                onInput={(e) => setCustomSettings((e.target as HTMLTextAreaElement).value)}
                rows={8} class={`${inputBase} resize-none`} />
            </div>
          </Show>

          <Show when={activeTab() === 'file'}>
            <div class="space-y-4">
              <h3 class={sectionTitle}>
                <NovelIcon name="upload_file" size={20} class="text-[#6b38d4]" />
                选择文件
              </h3>
              <div class="border-2 border-dashed border-[#cbc3d7] rounded-lg bg-[#f8f9ff] p-8 text-center">
                <NovelIcon name="cloud_upload" size={48} class="text-[#cbc3d7] mx-auto mb-2" />
                <p class="text-sm text-[#494454]">支持导入 .txt / .md / .json 格式的小说文件</p>
                <p class="text-xs text-[#cbc3d7] mt-1">导入时创建新项目，不覆盖现有项目</p>
              </div>
            </div>
          </Show>
        </div>

        {/* Footer */}
        <div class="px-6 py-4 border-t border-[#cbc3d7] flex justify-between items-center bg-[#f8f9ff]">
          <button onClick={handlePrev} disabled={currentTabIndex() === 0}
            class="px-4 py-2 text-sm font-medium text-[#494454] hover:text-[#0d1c2f] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1">
            <NovelIcon name="arrow_back" size={16} />
            上一步
          </button>
          <div class="flex gap-4">
            <button onClick={props.onCancel} disabled={isSubmitting()}
              class="px-6 py-2 rounded-lg border border-[#cbc3d7] text-[#494454] text-sm font-medium hover:bg-[#eff4ff] transition-colors disabled:opacity-50">
              取消
            </button>
            <Show when={!isLastTab()}
              fallback={
                <button onClick={handleSubmit} disabled={isSubmitting()}
                  class="px-8 py-2 rounded-lg bg-gradient-to-r from-[#6b38d4] to-[#8455ef] text-white text-sm font-medium shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                  <NovelIcon name="auto_awesome" size={16} />
                  {isSubmitting() ? '创建中...' : '创建'}
                </button>
              }
            >
              <button onClick={handleNext} disabled={isSubmitting()}
                class="px-8 py-2 rounded-lg bg-gradient-to-r from-[#6b38d4] to-[#8455ef] text-white text-sm font-medium shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                下一步
                <NovelIcon name="arrow_forward" size={16} />
              </button>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
};

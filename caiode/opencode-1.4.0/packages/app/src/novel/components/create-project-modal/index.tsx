import { createSignal, Show, For } from 'solid-js';
import type { Component } from 'solid-js';
import type {
  CreateProjectInput,
  GenreOption,
  ProtagonistInput,
  TargetAudience,
  WritingStyle,
  StoryTheme,
} from '../../types';
import { GENRE_OPTIONS } from '../../types';
import { NovelIcon } from '../layout/novel-icon';

interface CreateProjectModalProps {
  onSubmit: (input: CreateProjectInput) => Promise<void>;
  onCancel: () => void;
}

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

/** 创建项目弹窗 — 按 Stitch 03 code.html 还原 */
export const CreateProjectModal: Component<CreateProjectModalProps> = (props) => {
  const [name, setName] = createSignal('');
  const [genre, setGenre] = createSignal<GenreOption>('玄幻');
  const [description, setDescription] = createSignal('');
  const [protagonistName, setProtagonistName] = createSignal('');
  const [protagonistGender, setProtagonistGender] = createSignal<'male' | 'female'>('male');
  const [protagonistAge, setProtagonistAge] = createSignal<string>('');
  const [protagonistPersonality, setProtagonistPersonality] = createSignal('');
  const [targetAudience, setTargetAudience] = createSignal<TargetAudience>('general');
  const [writingStyle, setWritingStyle] = createSignal<WritingStyle>('default');
  const [storyTheme, setStoryTheme] = createSignal<StoryTheme>('default');
  const [customSettings, setCustomSettings] = createSignal('');
  const [activeTab, setActiveTab] = createSignal<'simple' | 'full'>('simple');
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [errors, setErrors] = createSignal<Record<string, string>>({});

  const isValid = () => {
    const e: Record<string, string> = {};
    if (!name().trim()) e.name = '请输入书名';
    if (!genre()) e.genre = '请选择类型';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!isValid()) return;
    setIsSubmitting(true);

    const protagonist: ProtagonistInput | undefined = protagonistName().trim()
      ? {
          name: protagonistName().trim(),
          gender: protagonistGender(),
          age: protagonistAge() ? Number(protagonistAge()) : undefined,
          personality: protagonistPersonality().trim() || undefined,
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
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBase =
    'w-full bg-[#f8f9ff] border border-[#cbc3d7] rounded-lg px-4 py-3 text-base focus:outline-none focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] transition-colors';
  const inputError = 'border-[#ba1a1a] bg-[#ffdad6]/30';
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

        {/* Content */}
        <div class="flex-1 overflow-y-auto px-6 py-6">
          {/* Tabs */}
          <div class="flex gap-4 border-b border-[#cbc3d7] mb-6">
            <button
              class={`pb-2 border-b-2 text-sm font-medium flex items-center gap-2 transition-colors ${
                activeTab() === 'simple'
                  ? 'border-[#6b38d4] text-[#6b38d4] font-bold'
                  : 'border-transparent text-[#494454] hover:text-[#0d1c2f]'
              }`}
              onClick={() => setActiveTab('simple')}
            >
              简易创作
              <span class="bg-[#ffdad6] text-[#93000a] text-[10px] px-2 py-0.5 rounded-full font-bold">
                推荐
              </span>
            </button>
            <button
              class={`pb-2 border-b-2 text-sm font-medium transition-colors ${
                activeTab() === 'full'
                  ? 'border-[#6b38d4] text-[#6b38d4] font-bold'
                  : 'border-transparent text-[#494454] hover:text-[#0d1c2f]'
              }`}
              onClick={() => setActiveTab('full')}
            >
              创建新项目
            </button>
          </div>

          <div class="space-y-6">
            {/* 基本信息 */}
            <div class="space-y-4">
              <div>
                <label class={labelBase}>
                  书名 <span class="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="给你的小说起个名字"
                  value={name()}
                  onInput={(e) => setName((e.target as HTMLInputElement).value)}
                  class={`${inputBase} ${errors().name ? inputError : ''}`}
                  style={{ 'font-family': "'Work Sans', 'PingFang SC', sans-serif" }}
                />
                {errors().name && <p class="mt-1 text-xs text-[#ba1a1a]">{errors().name}</p>}
              </div>

              <div>
                <label class={labelBase}>
                  类型 <span class="text-[#ba1a1a]">*</span>
                </label>
                <div class="relative">
                  <select
                    value={genre()}
                    onChange={(e) => setGenre((e.target as HTMLSelectElement).value as GenreOption)}
                    class={`${inputBase} appearance-none ${errors().genre ? inputError : ''}`}
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
                {errors().genre && <p class="mt-1 text-xs text-[#ba1a1a]">{errors().genre}</p>}
              </div>

              <div>
                <label class={labelBase}>简介</label>
                <textarea
                  placeholder="简单描述小说要讲什么故事..."
                  value={description()}
                  onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
                  rows={3}
                  class={`${inputBase} resize-none`}
                />
              </div>
            </div>

            <Show when={activeTab() === 'full'}>
              <hr class="border-[#cbc3d7] border-dashed" />

              {/* 主角设定 */}
              <div class="space-y-4">
                <h3 class={sectionTitle}>
                  <NovelIcon name="person" size={20} class="text-[#6b38d4]" />
                  主角设定
                </h3>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-[#494454] mb-1">姓名</label>
                    <input
                      type="text"
                      placeholder="主角名字"
                      value={protagonistName()}
                      onInput={(e) => setProtagonistName((e.target as HTMLInputElement).value)}
                      class={inputBase}
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-[#494454] mb-1">年龄</label>
                    <input
                      type="number"
                      placeholder="如：18"
                      value={protagonistAge()}
                      onInput={(e) => setProtagonistAge((e.target as HTMLInputElement).value)}
                      class={inputBase}
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-medium text-[#494454] mb-2">性别</label>
                  <div class="flex gap-4">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        checked={protagonistGender() === 'male'}
                        onChange={() => setProtagonistGender('male')}
                        class="text-[#6b38d4] focus:ring-[#6b38d4] w-4 h-4"
                      />
                      <span class="text-base text-[#0d1c2f]">男</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        checked={protagonistGender() === 'female'}
                        onChange={() => setProtagonistGender('female')}
                        class="text-[#6b38d4] focus:ring-[#6b38d4] w-4 h-4"
                      />
                      <span class="text-base text-[#0d1c2f]">女</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-medium text-[#494454] mb-1">性格</label>
                  <textarea
                    placeholder="描述主角的性格特点..."
                    value={protagonistPersonality()}
                    onInput={(e) => setProtagonistPersonality((e.target as HTMLTextAreaElement).value)}
                    rows={2}
                    class={`${inputBase} resize-none`}
                  />
                </div>
              </div>

              <hr class="border-[#cbc3d7] border-dashed" />

              {/* 目标读者 */}
              <div class="space-y-4">
                <h3 class={sectionTitle}>
                  <NovelIcon name="groups" size={20} class="text-[#6b38d4]" />
                  目标读者
                </h3>
                <div class="flex gap-4 flex-wrap">
                  <For each={TARGET_AUDIENCE_OPTIONS}>
                    {(opt) => (
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="targetAudience"
                          checked={targetAudience() === opt.value}
                          onChange={() => setTargetAudience(opt.value)}
                          class="text-[#6b38d4] focus:ring-[#6b38d4] w-4 h-4"
                        />
                        <span class="text-sm text-[#0d1c2f]">{opt.label}</span>
                      </label>
                    )}
                  </For>
                </div>
              </div>

              {/* 写作风格 */}
              <div class="space-y-4">
                <h3 class={sectionTitle}>
                  <NovelIcon name="edit_note" size={20} class="text-[#6b38d4]" />
                  写作风格
                </h3>
                <div class="relative">
                  <select
                    value={writingStyle()}
                    onChange={(e) => setWritingStyle((e.target as HTMLSelectElement).value as WritingStyle)}
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

              {/* 故事主题 */}
              <div class="space-y-4">
                <h3 class={sectionTitle}>
                  <NovelIcon name="auto_stories" size={20} class="text-[#6b38d4]" />
                  故事主题
                </h3>
                <div class="relative">
                  <select
                    value={storyTheme()}
                    onChange={(e) => setStoryTheme((e.target as HTMLSelectElement).value as StoryTheme)}
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

              {/* 自定义设定 */}
              <div>
                <h3 class={sectionTitle}>
                  <NovelIcon name="tune" size={20} class="text-[#6b38d4]" />
                  自定义设定
                </h3>
                <textarea
                  placeholder="添加修仙体系、科技设定等自定义内容..."
                  value={customSettings()}
                  onInput={(e) => setCustomSettings((e.target as HTMLTextAreaElement).value)}
                  rows={3}
                  class={`${inputBase} resize-none mt-3`}
                />
              </div>
            </Show>
          </div>
        </div>

        {/* Footer */}
        <div class="px-6 py-4 border-t border-[#cbc3d7] flex justify-end gap-4 bg-[#f8f9ff]">
          <button
            onClick={props.onCancel}
            disabled={isSubmitting()}
            class="px-6 py-2 rounded-lg border border-[#cbc3d7] text-[#494454] text-sm font-medium hover:bg-[#eff4ff] transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting()}
            class="px-8 py-2 rounded-lg bg-gradient-to-r from-[#6b38d4] to-[#8455ef] text-white text-sm font-medium shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            <NovelIcon name="auto_awesome" size={16} />
            {isSubmitting() ? '创建中...' : '创建'}
          </button>
        </div>
      </div>
    </div>
  );
};

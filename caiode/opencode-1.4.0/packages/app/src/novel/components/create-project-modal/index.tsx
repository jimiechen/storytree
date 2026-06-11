import { createSignal } from 'solid-js';
import type { Component } from 'solid-js';
import type { CreateProjectInput, GenreOption, ProtagonistInput } from '../../types';
import { GENRE_OPTIONS } from '../../types';

interface CreateProjectModalProps {
  onSubmit: (input: CreateProjectInput) => Promise<void>;
  onCancel: () => void;
}

/** 创建项目弹窗主容器 — 管理表单状态 + 校验 + 提交 */
export const CreateProjectModal: Component<CreateProjectModalProps> = (props) => {
  const [name, setName] = createSignal('');
  const [genre, setGenre] = createSignal<GenreOption>('玄幻');
  const [description, setDescription] = createSignal('');
  const [protagonistName, setProtagonistName] = createSignal('');
  const [protagonistGender, setProtagonistGender] = createSignal<'male' | 'female'>('male');
  const [protagonistAge, setProtagonistAge] = createSignal<string>('');
  const [protagonistPersonality, setProtagonistPersonality] = createSignal('');
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
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={props.onCancel}>
      {/* 遮罩 */}
      <div
        class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 class="text-lg font-semibold text-gray-800">创建新项目</h2>
          <button
            class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={props.onCancel}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab 栏 */}
        <div class="flex gap-1 px-6 pt-3">
          <button
            class={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab() === 'simple'
                ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('simple')}
          >
            简易创作
            <span class="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600">推荐</span>
          </button>
          <button
            class={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab() === 'full'
                ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('full')}
          >
            创建新项目
          </button>
        </div>

        {/* 表单内容区（可滚动） */}
        <div class="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* 基本信息 — 两个 Tab 都显示 */}
          <section>
            <h3 class="text-sm font-medium text-gray-700 mb-3">基本信息</h3>
            <div class="space-y-3">
              {/* 书名 */}
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">
                  书名 <span class="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="给你的小说起个名字"
                  value={name()}
                  onInput={(e) => setName((e.target as HTMLInputElement).value)}
                  class={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-purple-400 transition-colors ${
                    errors().name ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-white'
                  }`}
                />
                {errors().name && <p class="mt-1 text-xs text-red-500">{errors().name}</p>}
              </div>

              {/* 类型 */}
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">
                  类型 <span class="text-red-400">*</span>
                </label>
                <select
                  value={genre()}
                  onChange={(e) => setGenre((e.target as HTMLSelectElement).value as GenreOption)}
                  class={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-purple-400 transition-colors bg-white ${
                    errors().genre ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
                  }`}
                >
                  {GENRE_OPTIONS.map(g => (
                    <option value={g}>{g}</option>
                  ))}
                </select>
                {errors().genre && <p class="mt-1 text-xs text-red-500">{errors().genre}</p>}
              </div>

              {/* 简介 */}
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">简介</label>
                <textarea
                  placeholder="简单描述小说要讲什么故事..."
                  value={description()}
                  onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
                  rows={3}
                  class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:border-purple-400 transition-colors"
                />
              </div>
            </div>
          </section>

          {/* 主角设定 — 仅完整 Tab 显示 */}
          <Show when={activeTab() === 'full'}>
            <section>
              <h3 class="text-sm font-medium text-gray-700 mb-3">主角设定</h3>
              <div class="space-y-3">
                {/* 姓名 + 性别 同行 */}
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">姓名</label>
                    <input
                      type="text"
                      placeholder="主角名字"
                      value={protagonistName()}
                      onInput={(e) => setProtagonistName((e.target as HTMLInputElement).value)}
                      class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">性别</label>
                    <div class="flex gap-4 mt-2">
                      <label class="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          checked={protagonistGender() === 'male'}
                          onChange={() => setProtagonistGender('male')}
                          class="accent-purple-500"
                        />
                        <span class="text-sm text-gray-700">男</span>
                      </label>
                      <label class="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          checked={protagonistGender() === 'female'}
                          onChange={() => setProtagonistGender('female')}
                          class="accent-purple-500"
                        />
                        <span class="text-sm text-gray-700">女</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 年龄 + 性格 */}
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">年龄</label>
                  <input
                    type="number"
                    placeholder="如：18"
                    value={protagonistAge()}
                    onInput={(e) => setProtagonistAge((e.target as HTMLInputElement).value)}
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">性格</label>
                  <textarea
                    placeholder="描述主角的性格特点..."
                    value={protagonistPersonality()}
                    onInput={(e) => setProtagonistPersonality((e.target as HTMLTextAreaElement).value)}
                    rows={2}
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>
            </section>
          </Show>
        </div>

        {/* 底部按钮 */}
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={props.onCancel}
            disabled={isSubmitting()}
            class="px-5 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting()}
            class="px-6 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-400 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
          >
            {isSubmitting() ? '创建中...' : '创建'}
          </button>
        </div>
      </div>
    </div>
  );
};

import { createSignal, Show, type Component } from 'solid-js';
import { NovelIcon } from '../layout/novel-icon';
import { NovelStepper } from '../ui/novel-stepper';
import { NovelButton } from '../ui/novel-button';

interface GenerationSettingsModalProps {
  onClose: () => void;
  onGenerate?: (config: GenerationConfig) => void;
}

export interface GenerationConfig {
  targetWordCount: number;
  wordTolerance: string;
  referenceChapters: string;
  aiModel: string;
  contextOptions: Record<string, boolean>;
  includeSettings: Record<string, boolean>;
}

const WORD_TOLERANCE_OPTIONS = [
  { value: 'strict', label: '严格（±5%）' },
  { value: 'normal', label: '正常（±10%）' },
  { value: 'loose', label: '宽松（±20%）' },
];

const REFERENCE_CHAPTER_OPTIONS = [
  { value: '1', label: '前1章' },
  { value: '3', label: '前3章' },
  { value: '5', label: '前5章' },
  { value: '10', label: '前10章' },
  { value: 'all', label: '全部章节' },
];

const AI_MODEL_OPTIONS = [
  { value: 'gpt-4o', label: 'GPT-4o（推荐）' },
  { value: 'claude-3.5', label: 'Claude 3.5 Sonnet' },
  { value: 'gemini-pro', label: 'Gemini Pro' },
];

const CONTEXT_CHECKBOXES = [
  { key: 'prevContent', label: '上文续写内容' },
  { key: 'characterProfile', label: '角色性格档案' },
  { key: 'worldSetting', label: '世界设定背景' },
  { key: 'outlineGoal', label: '大纲目标与冲突' },
  { key: 'styleSample', label: '文风参考样本' },
  { key: 'previousVersion', label: '前一版本正文' },
];

const INCLUDE_CHECKBOXES = [
  { key: 'dialogueStyle', label: '对话风格设定' },
  { key: 'narrativeVoice', label: '叙事视角/口吻' },
  { key: 'pacingRule', label: '节奏控制规则' },
  { key: 'vocabularyLevel', label: '用词等级偏好' },
  { key: 'emotionTone', label: '情感基调要求' },
];

/** 默认配置 */
function defaultConfig(): GenerationConfig {
  return {
    targetWordCount: 3000,
    wordTolerance: 'normal',
    referenceChapters: '3',
    aiModel: 'gpt-4o',
    contextOptions: Object.fromEntries(CONTEXT_CHECKBOXES.map((c) => [c.key, c.key === 'prevContent' || c.key === 'characterProfile'])),
    includeSettings: Object.fromEntries(INCLUDE_CHECKBOXES.map((c) => [c.key, c.key === 'dialogueStyle' || c.key === 'narrativeVoice'])),
  };
}

export const GenerationSettingsModal: Component<GenerationSettingsModalProps> = (props) => {
  const [config, setConfig] = createSignal<GenerationConfig>(defaultConfig());
  const [includeExpanded, setIncludeExpanded] = createSignal(false);

  function updateTargetWordCount(v: number) {
    setConfig((prev) => ({ ...prev, targetWordCount: v }));
  }

  function updateSelect<K extends keyof GenerationConfig>(key: K, value: string) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function toggleContext(key: string) {
    setConfig((prev) => ({
      ...prev,
      contextOptions: { ...prev.contextOptions, [key]: !prev.contextOptions[key] },
    }));
  }

  function toggleInclude(key: string) {
    setConfig((prev) => ({
      ...prev,
      includeSettings: { ...prev.includeSettings, [key]: !prev.includeSettings[key] },
    }));
  }

  function handleReset() {
    setConfig(defaultConfig());
  }

  function handleGenerate() {
    props.onGenerate?.(config());
    props.onClose();
  }

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div role="dialog" data-testid="generation-settings-modal" class="bg-white rounded-xl max-w-xl w-full mx-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <header class="flex justify-between items-center px-6 py-4 border-b border-[#cbc3d7] shrink-0">
          <h2 class="text-lg font-bold text-[#0d1c2f]">AI 生成参数设置</h2>
          <button
            type="button"
            onClick={props.onClose}
            class="text-[#7b7486] hover:text-[#0d1c2f] transition-colors p-1 rounded-full hover:bg-[#eff4ff]"
          >
            <NovelIcon name="close" size={20} />
          </button>
        </header>

        {/* Body */}
        <div class="p-6 space-y-6 overflow-y-auto">
          {/* Section 1: 基础参数 */}
          <section>
            <h3 class="text-sm font-bold text-[#0d1c2f] mb-3 flex items-center gap-2">
              <NovelIcon name="tune" size={16} class="text-[#6b38d4]" />
              基础参数
            </h3>
            <div class="space-y-4 bg-[#f8f9ff] rounded-lg p-4">
              {/* 目标字数 */}
              <div class="flex items-center justify-between">
                <label class="text-sm text-[#494454] font-medium">目标字数</label>
                <NovelStepper
                  value={config().targetWordCount}
                  min={500}
                  max={10000}
                  step={500}
                  onChange={updateTargetWordCount}
                />
              </div>

              {/* 字数容差 + 参考章节 + AI 模型 */}
              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="text-xs text-[#7b7486] mb-1 block">容差</label>
                  <select
                    value={config().wordTolerance}
                    onChange={(e) => updateSelect('wordTolerance', (e.target as HTMLSelectElement).value)}
                    class="w-full text-sm border border-[#cbc3d7] rounded-md px-2 py-1.5 bg-white outline-none focus:ring-1 focus:ring-[#6b38d4]"
                  >
                    {WORD_TOLERANCE_OPTIONS.map((opt) => (
                      <option value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label class="text-xs text-[#7b7486] mb-1 block">参考章节</label>
                  <select
                    value={config().referenceChapters}
                    onChange={(e) => updateSelect('referenceChapters', (e.target as HTMLSelectElement).value)}
                    class="w-full text-sm border border-[#cbc3d7] rounded-md px-2 py-1.5 bg-white outline-none focus:ring-1 focus:ring-[#6b38d4]"
                  >
                    {REFERENCE_CHAPTER_OPTIONS.map((opt) => (
                      <option value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label class="text-xs text-[#7b7486] mb-1 block">AI 模型</label>
                  <select
                    value={config().aiModel}
                    onChange={(e) => updateSelect('aiModel', (e.target as HTMLSelectElement).value)}
                    class="w-full text-sm border border-[#cbc3d7] rounded-md px-2 py-1.5 bg-white outline-none focus:ring-1 focus:ring-[#6b38d4]"
                  >
                    {AI_MODEL_OPTIONS.map((opt) => (
                      <option value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: 上下文参考 */}
          <section>
            <h3 class="text-sm font-bold text-[#0d1c2f] mb-3 flex items-center gap-2">
              <NovelIcon name="history" size={16} class="text-[#6b38d4]" />
              上下文参考
            </h3>
            <div class="grid grid-cols-2 gap-2">
              {CONTEXT_CHECKBOXES.map((item) => (
                <label class="flex items-center gap-2 cursor-pointer rounded-md px-3 py-2 hover:bg-[#eff4ff] transition-colors">
                  <input
                    type="checkbox"
                    checked={config().contextOptions[item.key]}
                    onChange={() => toggleContext(item.key)}
                    class="w-4 h-4 rounded border-[#cbc3d7] accent-[#6b38d4]"
                  />
                  <span class="text-sm text-[#494454]">{item.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Section 3: 包含设定（可折叠） */}
          <section>
            <button
              type="button"
              onClick={() => setIncludeExpanded(!includeExpanded())}
              class="w-full flex items-center justify-between text-sm font-bold text-[#0d1c2f] mb-3 hover:text-[#6b38d4] transition-colors"
            >
              <span class="flex items-center gap-2">
                <NovelIcon name="settings" size={16} class="text-[#6b38d4]" />
                包含设定（高级）
              </span>
              <NovelIcon name={includeExpanded() ? 'expand_less' : 'expand_more'} size={18} class="text-[#7b7486]" />
            </button>

            <Show when={includeExpanded()}>
              <div class="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {INCLUDE_CHECKBOXES.map((item) => (
                  <label class="flex items-center gap-2 cursor-pointer rounded-md px-3 py-2 hover:bg-[#eff4ff] transition-colors">
                    <input
                      type="checkbox"
                      checked={config().includeSettings[item.key]}
                      onChange={() => toggleInclude(item.key)}
                      class="w-4 h-4 rounded border-[#cbc3d7] accent-[#6b38d4]"
                    />
                    <span class="text-sm text-[#494454]">{item.label}</span>
                  </label>
                ))}
              </div>
            </Show>
          </section>
        </div>

        {/* Footer */}
        <footer class="px-6 py-4 border-t border-[#cbc3d7] flex justify-between shrink-0">
          <NovelButton variant="tonal" size="sm" onClick={handleReset}>
            <NovelIcon name="restart_alt" size={14} />
            恢复默认
          </NovelButton>
          <div class="flex gap-2">
            <NovelButton variant="outlined" size="sm" onClick={props.onClose}>
              取消
            </NovelButton>
            <NovelButton variant="filled" size="sm" onClick={handleGenerate}>
              <NovelIcon name="auto_awesome" size={14} />
              开始生成
            </NovelButton>
          </div>
        </footer>
      </div>
    </div>
  );
};

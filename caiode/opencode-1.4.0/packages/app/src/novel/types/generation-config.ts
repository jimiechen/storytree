/**
 * AI 生成配置类型定义
 *
 * 用于 Workspace 右侧"AI 生成设置"面板。
 * 所有配置为组件内 local state，提交时通过 onGenerate 回调传给 useAITask。
 */

/** 可选 AI 模型列表 */
export const AI_MODEL_OPTIONS = ['豆包', '通义千问', 'DeepSeek', 'GLM-4'] as const;

export type AIModelOption = (typeof AI_MODEL_OPTIONS)[number];

/** 上下文参考选项 */
export interface ContextReference {
  id: string;
  label: string;
  /** 是否默认勾选 */
  defaultChecked: boolean;
  /** 是否禁用（不可取消） */
  disabled?: boolean;
}

/** 默认上下文参考配置 */
export const DEFAULT_CONTEXT_REFS: ContextReference[] = [
  { id: 'outline', label: '大纲和细纲', defaultChecked: true, disabled: true },
  { id: 'text-summary', label: '已有正文摘要', defaultChecked: false },
  { id: 'protagonist', label: '主角状态追踪', defaultChecked: false },
  { id: 'relationships', label: '角色关系', defaultChecked: false },
  { id: 'skills-items', label: '技能和道具', defaultChecked: false },
  { id: 'events', label: '重要事件', defaultChecked: false },
];

/** 生成配置 */
export interface GenerationConfig {
  /** 目标字数 (300-10000) */
  targetWordCount: number;
  /** 字数容差 (±N) */
  wordCountTolerance: number;
  /** 参考章节数 (1-10) */
  referenceChapterCount: number;
  /** AI 模型 */
  aiModel: string;
  /** 已选中的上下文参考 ID 集合 */
  contextRefs: Set<string>;
}

/** 默认生成配置 */
export const DEFAULT_GENERATION_CONFIG: GenerationConfig = {
  targetWordCount: 3000,
  wordCountTolerance: 300,
  referenceChapterCount: 3,
  aiModel: '豆包',
  contextRefs: new Set(
    DEFAULT_CONTEXT_REFS.filter(r => r.defaultChecked).map(r => r.id)
  ),
};

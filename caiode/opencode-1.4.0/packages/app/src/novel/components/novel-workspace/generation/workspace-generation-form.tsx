import type { Component } from 'solid-js';
import { NovelIcon } from '../../layout/novel-icon';

export interface GenerationFormData {
  targetWords: number;
  tolerance: string;
  referenceChapters: number;
  model: string;
}

export interface WorkspaceGenerationFormActions {
  onChangeTargetWords?: (value: number) => void;
  onChangeTolerance?: (value: string) => void;
  onChangeReferenceChapters?: (value: number) => void;
  onChangeModel?: (value: string) => void;
}

interface WorkspaceGenerationFormProps extends WorkspaceGenerationFormActions {
  data: GenerationFormData;
}

const TOLERANCE_OPTIONS = ['±300', '±500', '精准匹配'];
const REFERENCE_OPTIONS = [1, 3, 5];
const MODEL_OPTIONS = ['豆包', 'GPT-4', 'Claude 3'];

/** 生成参数表单 — Stitch 04 code.html */
export const WorkspaceGenerationForm: Component<WorkspaceGenerationFormProps> = (props) => {
  return (
    <div class="space-y-4">
      {/* 目标字数 */}
      <div class="flex flex-col gap-2">
        <label class="text-sm text-[#7b7486] flex justify-between">
          <span>目标字数</span>
          <span class="text-[#6b38d4] font-bold">{props.data.targetWords}</span>
        </label>
        <div class="flex items-center gap-2">
          <button
            onClick={() => props.onChangeTargetWords?.(Math.max(500, props.data.targetWords - 500))}
            class="w-8 h-8 rounded border border-[#cbc3d7] flex items-center justify-center text-[#0d1c2f] hover:bg-[#eff4ff] transition-colors"
          >
            <NovelIcon name="remove" size={18} />
          </button>
          <input
            type="text"
            value={props.data.targetWords}
            readOnly
            class="flex-1 bg-[#f8f9ff] border border-[#cbc3d7] rounded-md text-center text-sm text-[#0d1c2f] h-8"
          />
          <button
            onClick={() => props.onChangeTargetWords?.(props.data.targetWords + 500)}
            class="w-8 h-8 rounded border border-[#cbc3d7] flex items-center justify-center text-[#0d1c2f] hover:bg-[#eff4ff] transition-colors"
          >
            <NovelIcon name="add" size={18} />
          </button>
        </div>
      </div>

      {/* 字数容差 */}
      <div class="flex flex-col gap-2">
        <label class="text-sm text-[#7b7486]">字数容差</label>
        <div class="relative">
          <select
            value={props.data.tolerance}
            onChange={(e) => props.onChangeTolerance?.(e.currentTarget.value)}
            class="w-full bg-[#f8f9ff] border border-[#cbc3d7] rounded-md text-sm text-[#0d1c2f] pl-3 pr-10 py-2 appearance-none focus:ring-1 focus:ring-[#6b38d4] focus:border-[#6b38d4]"
          >
            {TOLERANCE_OPTIONS.map((opt) => (
              <option value={opt}>{opt}</option>
            ))}
          </select>
          <NovelIcon
            name="expand_more"
            size={18}
            class="absolute right-3 top-1/2 -translate-y-1/2 text-[#7b7486] pointer-events-none"
          />
        </div>
      </div>

      {/* 参考章节数 */}
      <div class="flex flex-col gap-2">
        <label class="text-sm text-[#7b7486]">参考章节数</label>
        <div class="relative">
          <select
            value={props.data.referenceChapters}
            onChange={(e) => props.onChangeReferenceChapters?.(Number(e.currentTarget.value))}
            class="w-full bg-[#f8f9ff] border border-[#cbc3d7] rounded-md text-sm text-[#0d1c2f] pl-3 pr-10 py-2 appearance-none focus:ring-1 focus:ring-[#6b38d4] focus:border-[#6b38d4]"
          >
            {REFERENCE_OPTIONS.map((opt) => (
              <option value={opt}>{opt}</option>
            ))}
          </select>
          <NovelIcon
            name="expand_more"
            size={18}
            class="absolute right-3 top-1/2 -translate-y-1/2 text-[#7b7486] pointer-events-none"
          />
        </div>
      </div>

      {/* AI模型 */}
      <div class="flex flex-col gap-2">
        <label class="text-sm text-[#7b7486]">AI模型</label>
        <div class="relative">
          <select
            value={props.data.model}
            onChange={(e) => props.onChangeModel?.(e.currentTarget.value)}
            class="w-full bg-[#f8f9ff] border border-[#cbc3d7] rounded-md text-sm text-[#0d1c2f] pl-3 pr-10 py-2 appearance-none focus:ring-1 focus:ring-[#6b38d4] focus:border-[#6b38d4]"
          >
            {MODEL_OPTIONS.map((opt) => (
              <option value={opt}>{opt}</option>
            ))}
          </select>
          <NovelIcon
            name="expand_more"
            size={18}
            class="absolute right-3 top-1/2 -translate-y-1/2 text-[#7b7486] pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
};

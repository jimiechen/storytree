import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { NovelIcon } from '../layout/novel-icon';
import { NovelTag } from '../ui/novel-tag';
import { NovelEmptyState } from '../ui/novel-empty-state';
import type { AIExtractedInfo } from '../../types/editor';

interface EditorAIExtractProps {
  data: AIExtractedInfo | null;
  onRefresh?: () => void;
}

export const EditorAIExtract: Component<EditorAIExtractProps> = (props) => {
  return (
    <div>
      <div class="px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <NovelIcon name="auto_awesome" size={18} class="text-[#6b38d4]" />
          <span class="text-sm font-bold text-[#0d1c2f]">AI 提取</span>
        </div>
        <button
          type="button"
          onClick={props.onRefresh}
          class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#eff4ff] transition-colors text-[#494454]"
        >
          <NovelIcon name="refresh" size={18} />
        </button>
      </div>

      <Show
        when={props.data}
        fallback={
          <NovelEmptyState
            icon="auto_awesome"
            title="暂无AI提取信息"
            description="点击刷新提取本章关键信息"
          />
        }
      >
        <div class="px-6 py-4 space-y-4">
          <div>
            <h4 class="text-xs font-bold text-[#6b38d4] mb-1">本章摘要</h4>
            <p class="text-sm text-[#494454]">{props.data!.summary}</p>
          </div>
          <div>
            <h4 class="text-xs font-bold text-[#6b38d4] mb-1">新登场角色</h4>
            <div class="flex flex-wrap gap-1">
              {props.data!.newCharacters.map((c) => (
                <NovelTag>{c}</NovelTag>
              ))}
            </div>
          </div>
          <div>
            <h4 class="text-xs font-bold text-[#6b38d4] mb-1">主角状态</h4>
            <p class="text-sm text-[#494454]">
              {props.data!.protagonistStatus}
            </p>
          </div>
          <div>
            <h4 class="text-xs font-bold text-[#6b38d4] mb-1">获得物品</h4>
            <div class="flex flex-wrap gap-1">
              {props.data!.acquiredItems.map((i) => (
                <NovelTag>{i}</NovelTag>
              ))}
            </div>
          </div>
          <div>
            <h4 class="text-xs font-bold text-[#6b38d4] mb-1">关键事件</h4>
            <p class="text-sm text-[#494454]">{props.data!.keyEvents}</p>
          </div>
        </div>
      </Show>
    </div>
  );
};

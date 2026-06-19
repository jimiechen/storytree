import type { Component } from 'solid-js';
import { NovelBadge } from '../ui/novel-badge';
import type { ChapterStatus } from '../../types/editor';

interface EditorChapterMetaProps {
  chapterNumber: string;
  status: ChapterStatus;
  wordCount: number;
  createdAt: string;
  lastModified: string;
  onStatusChange?: (status: ChapterStatus) => void;
}

export const EditorChapterMeta: Component<EditorChapterMetaProps> = (props) => {
  const statusLabel = () =>
    props.status === 'draft'
      ? '草稿'
      : props.status === 'completed'
        ? '已完成'
        : '已发布';

  return (
    <div class="px-6 py-4 space-y-3">
      <div class="flex justify-between items-center">
        <span class="text-xs text-[#494454]">章节编号</span>
        <span data-testid="editor-right-panel-chapter-number" class="text-sm text-[#0d1c2f]">{props.chapterNumber}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-xs text-[#494454]">状态</span>
        <button
          onClick={() =>
            props.onStatusChange?.(
              props.status === 'draft' ? 'completed' : 'draft'
            )
          }
        >
          <NovelBadge status={props.status}>{statusLabel()}</NovelBadge>
        </button>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-xs text-[#494454]">字数</span>
        <span class="text-sm text-[#0d1c2f]">{props.wordCount} 字</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-xs text-[#494454]">创建时间</span>
        <span class="text-sm text-[#0d1c2f]">{props.createdAt}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-xs text-[#494454]">最后修改</span>
        <span class="text-sm text-[#0d1c2f]">{props.lastModified}</span>
      </div>
    </div>
  );
};

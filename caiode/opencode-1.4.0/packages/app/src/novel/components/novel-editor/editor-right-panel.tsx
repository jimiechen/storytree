import type { Component } from 'solid-js';
import { NovelIcon } from '../layout/novel-icon';
import { EditorChapterMeta } from './editor-chapter-meta';
import { EditorAIExtract } from './editor-ai-extract';
import type { AIExtractedInfo, ChapterStatus } from '../../types/editor';

interface EditorRightPanelProps {
  chapterNumber: string;
  status: ChapterStatus;
  wordCount: number;
  createdAt: string;
  lastModified: string;
  aiExtract: AIExtractedInfo | null;
  onStatusChange?: (status: ChapterStatus) => void;
  onRefreshAI?: () => void;
  onSaveDraft?: () => void;
  onMarkComplete?: () => void;
}

export const EditorRightPanel: Component<EditorRightPanelProps> = (props) => {
  return (
    <aside class="w-[300px] shrink-0 bg-white border-l border-[#cbc3d7] flex flex-col h-full">
      <div class="px-6 py-4 border-b border-[#cbc3d7] flex items-center gap-2">
        <NovelIcon name="info" size={18} class="text-[#6b38d4]" />
        <span class="text-sm font-bold text-[#0d1c2f]">章节信息</span>
      </div>
      <div class="flex-1 overflow-y-auto">
        <EditorChapterMeta
          chapterNumber={props.chapterNumber}
          status={props.status}
          wordCount={props.wordCount}
          createdAt={props.createdAt}
          lastModified={props.lastModified}
          onStatusChange={props.onStatusChange}
        />
        <div class="h-px bg-[#cbc3d7] mx-6" />
        <EditorAIExtract
          data={props.aiExtract}
          onRefresh={props.onRefreshAI}
        />
      </div>
      <div class="p-4 border-t border-[#cbc3d7] flex gap-3">
        <button
          type="button"
          onClick={props.onSaveDraft}
          class="flex-1 px-4 py-2 rounded-lg border border-[#7b7486] text-[#6b38d4] text-sm font-medium hover:bg-[#e9ddff] transition-colors"
        >
          保存草稿
        </button>
        <button
          type="button"
          onClick={props.onMarkComplete}
          class="flex-1 px-4 py-2 rounded-lg bg-[#6b38d4] text-white text-sm font-medium hover:bg-[#6d3bd7] transition-colors"
        >
          标记完成
        </button>
      </div>
    </aside>
  );
};

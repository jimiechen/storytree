import type { Component } from 'solid-js';
import { NovelIcon } from '../layout/novel-icon';
import { NovelButton } from '../ui/novel-button';

interface EditorToolbarProps {
  chapterTitle: string;
  orderIndex: number;
  wordCount: number;
  targetWordCount?: number;
  onBack: () => void;
  onHistory: () => void;
  onFullscreen: () => void;
  onPublish: () => void;
  onAIContinue: () => void;
  onSave: () => void;
  saving?: boolean;
}

export const EditorToolbar: Component<EditorToolbarProps> = (props) => {
  return (
    <header class="flex items-center justify-between h-16 px-6 bg-white border-b border-[#cbc3d7] shadow-[0_2px_12px_rgba(0,0,0,0.02)] shrink-0">
      {/* Left */}
      <div data-testid="editor-back-btn" class="flex items-center gap-3">
        <NovelButton variant="icon" onClick={props.onBack}>
          <NovelIcon name="arrow_back" size={20} />
        </NovelButton>
        <span class="text-sm font-medium text-[#0d1c2f] truncate max-w-[200px]">
          {props.chapterTitle}
        </span>
      </div>

      {/* Center */}
      <div data-testid="editor-word-count" class="hidden md:flex items-center gap-1 text-sm">
        <span class="font-bold text-[#6b38d4]">
          {props.wordCount.toLocaleString()}
        </span>
        <span class="text-[#494454]">
          / {props.targetWordCount ?? 3000} 字
        </span>
      </div>

      {/* Right */}
      <div class="flex items-center gap-2">
        <NovelButton variant="icon" onClick={props.onHistory}>
          <NovelIcon name="history" size={20} />
        </NovelButton>
        <NovelButton variant="icon" onClick={props.onFullscreen}>
          <NovelIcon name="fullscreen" size={20} />
        </NovelButton>
        <NovelButton variant="filled" size="sm" onClick={props.onAIContinue}>
          <NovelIcon name="auto_awesome" size={16} />
          AI续写
        </NovelButton>
        <NovelButton variant="filled" size="sm" onClick={props.onPublish}>
          发布章节
        </NovelButton>
        <NovelButton
          variant="icon"
          onClick={props.onSave}
          disabled={props.saving}
        >
          <NovelIcon name="save" size={20} />
        </NovelButton>
      </div>
    </header>
  );
};

import { createSignal, createMemo } from 'solid-js';
import type {
  ChapterStatus,
  AIWritingCommand,
  AIExtractedInfo,
} from '../types/editor';
import { mockAIExtractedInfo } from '../mock-data/chapters';

export function useChapterEditor(chapterId: string) {
  const [content, setContent] = createSignal('');
  const [chapterStatus, setChapterStatus] =
    createSignal<ChapterStatus>('draft');
  const [isFullscreen, setIsFullscreen] = createSignal(false);
  const [isAiToolbarVisible, setAiToolbarVisible] = createSignal(false);
  const [aiToolbarPos, setAiToolbarPos] = createSignal({ top: 0, left: 0 });
  const targetWordCount = 3000;

  const wordCount = createMemo(() => content().replace(/\s/g, '').length);
  const aiExtract = createMemo(
    () => mockAIExtractedInfo.find((e) => e.chapterId === chapterId) ?? null
  );

  function onTextSelect() {
    const sel = window.getSelection();
    if (!sel || !sel.toString().trim()) {
      setAiToolbarVisible(false);
      return;
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    setAiToolbarPos({
      top: rect.top - 48,
      left: rect.left + rect.width / 2,
    });
    setAiToolbarVisible(true);
  }

  function handleAICommand(_cmd: AIWritingCommand) {
    setAiToolbarVisible(false);
  }

  function saveDraft() {
    /* Mock: no-op */
  }

  function markComplete() {
    setChapterStatus('completed');
  }

  return {
    content,
    setContent,
    wordCount,
    targetWordCount,
    chapterStatus,
    setChapterStatus,
    isFullscreen,
    setIsFullscreen,
    isAiToolbarVisible,
    aiToolbarPos,
    aiExtract,
    onTextSelect,
    handleAICommand,
    saveDraft,
    markComplete,
  };
}

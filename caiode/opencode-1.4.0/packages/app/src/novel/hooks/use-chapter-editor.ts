import { createSignal, createMemo } from 'solid-js';
import type {
  ChapterStatus,
  AIWritingCommand,
  AIExtractedInfo,
} from '../types/editor';
import type { WorkflowMutations } from '../workflows/workflow-events';
import { mockAIExtractedInfo } from '../mock-data/chapters';

export function useChapterEditor(chapterId: string, mutations?: WorkflowMutations) {
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

  /**
   * 处理 AI 写作命令。
   * P1-B: 通过 mutations 回调写回（如有注入），否则仅隐藏工具栏。
   */
  function handleAICommand(cmd: AIWritingCommand) {
    setAiToolbarVisible(false);
    // P1-B 阶段：命令由外部 useNovelWorkflow 驱动
    // 此处保留接口，后续接入 runAIWritingCommand
  }

  function saveDraft() {
    /* Mock: no-op — P1-B 由 applyWorkflowEvents 统一写回 */
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
    setAiToolbarVisible,
    aiToolbarPos,
    aiExtract,
    onTextSelect,
    handleAICommand,
    saveDraft,
    markComplete,
  };
}

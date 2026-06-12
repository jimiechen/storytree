import { createSignal, Show, onMount, onCleanup, createEffect } from 'solid-js';
import type { Chapter } from '../../types';
import { NovelIcon } from '../layout/novel-icon';

interface ChapterPaperEditorProps {
  chapter: Chapter;
  onSave: (content: string) => void;
  onAITask?: (type: 'continue-writing' | 'rewrite-selection' | 'summarize-chapter', text: string, selectedText?: string) => void;
  onTitleChange?: (title: string) => void;
  onWordCountChange?: (count: number) => void;
}

export function ChapterPaperEditor(props: ChapterPaperEditorProps) {
  const [title, setTitle] = createSignal(props.chapter.title);
  const [selectedText, setSelectedText] = createSignal('');
  const [showFloatingBar, setShowFloatingBar] = createSignal(false);
  const [floatPos, setFloatPos] = createSignal({ top: 180, left: 0 });
  let contentRef: HTMLDivElement | undefined;
  let paperRef: HTMLDivElement | undefined;

  /** 将纯文本转为 <p> 段落 HTML */
  const textToParagraphs = (text: string) => {
    if (!text.trim()) return '<p class="mb-lg"><br></p>';
    return text
      .split(/\n\s*\n/)
      .map((p) => `<p class="mb-lg">${p.trim()}</p>`)
      .join('');
  };

  /** 从 contenteditable 提取纯文本 */
  const extractText = () => {
    if (!contentRef) return '';
    return contentRef.innerText ?? '';
  };

  /** 更新字数 */
  const updateWordCount = () => {
    const text = extractText();
    const count = text.replace(/\s/g, '').length;
    props.onWordCountChange?.(count);
  };

  /** 监听文本选择，控制浮动工具栏 */
  const handleSelection = () => {
    const sel = window.getSelection();
    const text = sel?.toString() ?? '';
    setSelectedText(text);

    if (text && sel && sel.rangeCount > 0 && paperRef) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const paperRect = paperRef.getBoundingClientRect();
      const relTop = rect.top - paperRect.top - 56;
      const relLeft = rect.left - paperRect.left + rect.width / 2;
      setFloatPos({ top: Math.max(0, relTop), left: relLeft });
      setShowFloatingBar(true);
    } else {
      setShowFloatingBar(false);
    }
  };

  /** 初始化/切换章节时重置内容 */
  createEffect(() => {
    const ch = props.chapter;
    setTitle(ch.title);
    if (contentRef) {
      contentRef.innerHTML = textToParagraphs(ch.content);
      updateWordCount();
    }
  });

  onMount(() => {
    document.addEventListener('selectionchange', handleSelection);
    onCleanup(() => document.removeEventListener('selectionchange', handleSelection));
  });

  const handleInput = () => {
    updateWordCount();
  };

  const handleTitleInput = (e: InputEvent & { currentTarget: HTMLInputElement }) => {
    const v = e.currentTarget.value;
    setTitle(v);
    props.onTitleChange?.(v);
  };

  const handleContinueWriting = () => {
    props.onAITask?.('continue-writing', extractText());
  };

  const handlePolish = () => {
    const sel = selectedText();
    if (sel) props.onAITask?.('rewrite-selection', extractText(), sel);
  };

  const handleSummarize = () => {
    props.onAITask?.('summarize-chapter', extractText());
  };

  return (
    <div class="flex-1 overflow-y-auto bg-[#f8f9ff] flex justify-center py-10 relative" ref={paperRef}>
      {/* Floating AI Toolbar */}
      <Show when={showFloatingBar()}>
        <div
          class="absolute z-20 flex items-center gap-xs bg-white/90 backdrop-blur-md px-sm py-xs rounded-full border border-[#cbc3d7] shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
          style={{
            top: `${floatPos().top}px`,
            left: `${floatPos().left}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <button
            class="w-8 h-8 flex items-center justify-center rounded-full text-[#0d1c2f] hover:bg-[#eff4ff] transition-colors"
            title="AI润色"
            onClick={handlePolish}
          >
            <NovelIcon name="auto_fix" size={18} class="text-[#6b38d4]" />
          </button>
          <div class="w-[1px] h-4 bg-[#cbc3d7] mx-xs" />
          <button
            class="w-8 h-8 flex items-center justify-center rounded-full text-[#0d1c2f] hover:bg-[#eff4ff] transition-colors"
            title="扩写"
            onClick={handleContinueWriting}
          >
            <NovelIcon name="format_size" size={18} />
          </button>
          <button
            class="w-8 h-8 flex items-center justify-center rounded-full text-[#0d1c2f] hover:bg-[#eff4ff] transition-colors"
            title="缩写"
            onClick={handleSummarize}
          >
            <NovelIcon name="compress" size={18} />
          </button>
          <div class="w-[1px] h-4 bg-[#cbc3d7] mx-xs" />
          <button
            class="w-8 h-8 flex items-center justify-center rounded-full text-[#0d1c2f] hover:bg-[#eff4ff] transition-colors"
            title="查找替换"
            onClick={() => alert('查找替换功能即将推出')}
          >
            <NovelIcon name="find_replace" size={18} />
          </button>
        </div>
      </Show>

      {/* The Paper */}
      <div class="w-full max-w-[800px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] rounded-xl border border-[#cbc3d7] p-[60px] min-h-full">
        {/* Editor Title */}
        <input
          class="w-full text-center font-bold text-[#0d1c2f] border-none focus:ring-0 bg-transparent mb-8 outline-none placeholder:text-[#7b7486]"
          style={{
            'font-family': "'Plus Jakarta Sans', 'PingFang SC', sans-serif",
            'font-size': '32px',
            'line-height': '1.2',
          }}
          placeholder="输入章节标题..."
          type="text"
          value={title()}
          onInput={handleTitleInput}
        />

        {/* Editor Content */}
        <div
          ref={contentRef}
          class="outline-none text-[#494454]"
          contenteditable
          spellcheck={false}
          style={{
            'font-family': "'Noto Serif SC', serif",
            'font-size': '18px',
            'line-height': '2',
            'text-indent': '2em',
            'text-align': 'justify',
          }}
          onInput={handleInput}
        />
      </div>
    </div>
  );
}

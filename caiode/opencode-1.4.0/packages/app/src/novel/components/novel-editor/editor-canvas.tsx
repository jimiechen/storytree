import type { Component } from 'solid-js';
import { createEffect, on, onMount, onCleanup } from 'solid-js';

interface EditorCanvasProps {
  chapterId: string;
  title: string;
  initialContent: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onTextSelect: () => void;
  onWordCountChange?: (count: number) => void;
}

export const EditorCanvas: Component<EditorCanvasProps> = (props) => {
  let contentRef: HTMLDivElement | undefined;

  const textToParagraphs = (text: string) => {
    if (!text.trim()) return '<p class="mb-6"><br></p>';
    return text
      .split(/\n\s*\n/)
      .map((p) => `<p class="mb-6">${p.trim()}</p>`)
      .join('');
  };

  const extractText = () => {
    if (!contentRef) return '';
    return contentRef.innerText ?? '';
  };

  const updateWordCount = () => {
    const text = extractText();
    const count = text.replace(/\s/g, '').length;
    props.onWordCountChange?.(count);
  };

  // Only reset content when chapterId changes
  createEffect(
    on(
      () => props.chapterId,
      () => {
        if (contentRef) {
          contentRef.innerHTML = textToParagraphs(props.initialContent);
          updateWordCount();
        }
      }
    )
  );

  onMount(() => {
    const handler = () => props.onTextSelect();
    document.addEventListener('selectionchange', handler);
    onCleanup(() => document.removeEventListener('selectionchange', handler));
  });

  const handleInput = () => {
    updateWordCount();
    props.onContentChange(extractText());
  };

  return (
    <div class="flex-1 overflow-y-auto bg-[#f8f9ff] flex justify-center py-10">
      <div class="w-full max-w-3xl mx-auto px-10">
        <input
          type="text"
          class="w-full bg-transparent outline-none text-[#0d1c2f] placeholder:text-[#7b7486] mb-8 text-center"
          style={{
            'font-family': "'Plus Jakarta Sans', 'PingFang SC', sans-serif",
            'font-size': '32px',
            'line-height': '1.2',
            'letter-spacing': '-0.02em',
          }}
          placeholder="输入章节标题..."
          value={props.title}
          onInput={(e) => props.onTitleChange(e.currentTarget.value)}
        />
        <div
          ref={contentRef}
          class="outline-none text-[#0d1c2f] min-h-[60vh]"
          contenteditable
          spellcheck={false}
          style={{
            'font-family': "'Noto Serif SC', serif",
            'font-size': '18px',
            'line-height': '1.8',
            'text-indent': '2em',
          }}
          onInput={handleInput}
          onMouseUp={props.onTextSelect}
          onKeyUp={props.onTextSelect}
        />
      </div>
    </div>
  );
};

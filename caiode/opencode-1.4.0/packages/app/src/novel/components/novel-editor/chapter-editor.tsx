import { createSignal, Show } from 'solid-js';
import type { Chapter } from '../../types';

interface ChapterEditorProps {
  chapter: Chapter;
  onSave: (content: string) => void;
  onAITask?: (type: 'continue-writing' | 'rewrite-selection' | 'summarize-chapter', text: string, selectedText?: string) => void;
}

export function ChapterEditor(props: ChapterEditorProps) {
  const [content, setContent] = createSignal(props.chapter.content);
  const [selectedText, setSelectedText] = createSignal('');

  const handleTextSelect = () => {
    const selection = window.getSelection()?.toString() ?? '';
    setSelectedText(selection);
  };

  const handleContinueWriting = () => {
    props.onAITask?.('continue-writing', content());
  };

  const handleRewriteSelection = () => {
    if (selectedText()) {
      props.onAITask?.('rewrite-selection', content(), selectedText());
    }
  };

  const handleSummarizeChapter = () => {
    props.onAITask?.('summarize-chapter', content());
  };

  return (
    <div class="flex-1 flex flex-col bg-[#F5F1E8] min-h-0">
      {/* 章节标题 */}
      <div class="px-6 py-4 bg-white border-b border-gray-200">
        <h1 class="text-2xl font-bold text-gray-900">{props.chapter.title}</h1>
        <div class="flex items-center gap-4 mt-2 text-sm text-gray-500">
          <span>{props.chapter.wordCount.toLocaleString()} 字</span>
          <span>·</span>
          <span class="capitalize">{props.chapter.status}</span>
        </div>
      </div>

      {/* 章节大纲 */}
      <div class="px-6 py-3 bg-amber-50 border-b border-amber-100">
        <h3 class="text-sm font-semibold text-amber-900 mb-2">≡ 章节大纲</h3>
        <ul class="space-y-1">
          <li class="text-sm text-amber-800">
            <span class="font-medium">目标：</span>{props.chapter.outline.goal}
          </li>
          <li class="text-sm text-amber-800">
            <span class="font-medium">冲突：</span>{props.chapter.outline.conflict}
          </li>
          <li class="text-sm text-amber-800">
            <span class="font-medium">关键剧情：</span>{props.chapter.outline.keyPlot}
          </li>
        </ul>
      </div>

      {/* 编辑区 */}
      <div class="flex-1 px-6 py-4 overflow-y-auto">
        <textarea
          class="w-full h-full bg-transparent resize-none outline-none text-lg leading-relaxed text-gray-800"
          style={{ 'line-height': '1.8' }}
          value={content()}
          onInput={(e) => setContent(e.currentTarget.value)}
          onSelect={handleTextSelect}
          placeholder="开始写作..."
        />
      </div>

      {/* 底部工具栏 */}
      <div class="px-6 py-3 bg-white border-t border-gray-200 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Show when={props.onAITask}>
            <button
              class="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-1"
              onClick={handleContinueWriting}
              title="AI 续写"
            >
              <span>✨</span>
              <span>续写</span>
            </button>
            <button
              class="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleRewriteSelection}
              disabled={!selectedText()}
              title="改写选中内容"
            >
              <span>🔄</span>
              <span>改写</span>
            </button>
            <button
              class="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1"
              onClick={handleSummarizeChapter}
              title="AI 总结章节"
            >
              <span>📝</span>
              <span>总结</span>
            </button>
          </Show>
          <Show when={selectedText()}>
            <span class="text-xs text-gray-400">
              已选 {selectedText().length} 字
            </span>
          </Show>
        </div>

        <button
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          onClick={() => props.onSave(content())}
        >
          保存
        </button>
      </div>
    </div>
  );
}

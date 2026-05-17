import { createSignal, Show, For } from 'solid-js';
import { useNovelProject } from '../../hooks/use-novel-project';
import { useAITask } from '../../hooks/use-ai-task';
import { useAILog } from '../../hooks/use-ai-log';
import { MockModeBanner } from '../mock-mode-banner';
import { ChapterList } from './chapter-list';
import { ChapterEditor } from './chapter-editor';
import { CharacterPanel } from './character-panel';
import { AITaskPanel } from './ai-task-panel';
import { AILogDrawer } from './ai-log-drawer';
import { AIResultCard } from './ai-result-card';
import { mockChapters, mockCharacters } from '../../mock-data';

export function NovelEditor() {
  const { project } = useNovelProject();
  const { tasks, submitTask, cancelTask } = useAITask();
  const { logs, refetch } = useAILog();

  const [selectedChapterId, setSelectedChapterId] = createSignal(mockChapters[0]?.id ?? '');
  const [isLogDrawerOpen, setIsLogDrawerOpen] = createSignal(false);
  const [showTaskPanel, setShowTaskPanel] = createSignal(true);
  const [showCharacterPanel, setShowCharacterPanel] = createSignal(true);

  const selectedChapter = () => mockChapters.find(c => c.id === selectedChapterId());

  const handleSaveChapter = (content: string) => {
    const chapter = selectedChapter();
    if (chapter) {
      chapter.content = content;
      chapter.wordCount = content.length;
      chapter.lastEditedAt = new Date();
    }
  };

  const handleAITask = async (type: 'continue-writing' | 'rewrite-selection' | 'summarize-chapter', text: string, selectedText?: string) => {
    const chapter = selectedChapter();
    if (!chapter) return;

    await submitTask({
      type,
      chapterId: chapter.id,
      text,
      selectedText
    });
  };

  const handleRetryTask = async (taskId: string) => {
    const task = tasks().find(t => t.id === taskId);
    if (!task) return;

    await submitTask({
      type: task.type,
      chapterId: task.chapterId,
      text: task.input.text,
      selectedText: task.input.selectedText,
      characterId: task.input.characterId
    });
  };

  const handleAcceptAIResult = (text: string) => {
    const chapter = selectedChapter();
    if (chapter) {
      chapter.content += '\n\n' + text;
      chapter.wordCount = chapter.content.length;
      chapter.lastEditedAt = new Date();
    }
  };

  const handleSaveAIResult = (text: string) => {
    const chapter = selectedChapter();
    if (chapter) {
      if (!chapter.aiSuggestions) chapter.aiSuggestions = [];
      chapter.aiSuggestions.push({
        id: `suggestion-${Date.now()}`,
        taskId: `task-${Date.now()}`,
        text,
        status: 'saved',
        createdAt: new Date()
      });
    }
  };

  const handleDiscardAIResult = () => {
    // 忽略操作，仅关闭卡片
  };

  return (
    <div class="flex flex-col h-screen bg-gray-100">
      {/* Mock Mode Banner */}
      <MockModeBanner />

      {/* Top Bar */}
      <div class="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
        <div class="flex items-center gap-4">
          <h1 class="text-lg font-semibold text-gray-900">
            <Show when={project()} fallback="加载中...">
              {project()!.name}
            </Show>
          </h1>
          <span class="text-xs text-gray-500">
            <Show when={project()}>
              {project()!.genre} · {project()!.totalWordCount.toLocaleString()} 字
            </Show>
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button
            class={`px-3 py-1.5 text-xs rounded-lg transition-colors ${showCharacterPanel() ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setShowCharacterPanel(!showCharacterPanel())}
          >
            角色面板
          </button>
          <button
            class={`px-3 py-1.5 text-xs rounded-lg transition-colors ${showTaskPanel() ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setShowTaskPanel(!showTaskPanel())}
          >
            AI 任务
          </button>
          <button
            class="px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            onClick={() => setIsLogDrawerOpen(true)}
          >
            日志
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div class="flex-1 flex overflow-hidden">
        {/* Chapter List Sidebar */}
        <div class="w-64 shrink-0">
          <ChapterList
            chapters={mockChapters}
            selectedId={selectedChapterId()}
            onSelect={setSelectedChapterId}
          />
        </div>

        {/* Chapter Editor + AI Results */}
        <div class="flex-1 min-w-0 flex flex-col overflow-hidden">
          <Show when={selectedChapter()} fallback={
            <div class="flex items-center justify-center h-full text-gray-400">
              <span>请选择一个章节</span>
            </div>
          }>
            <div class="flex-1 overflow-y-auto">
              <ChapterEditor
                chapter={selectedChapter()!}
                onSave={handleSaveChapter}
                onAITask={handleAITask}
              />
              {/* AI 结果卡片列表 */}
              <For each={tasks().filter(t => t.chapterId === selectedChapterId())}>
                {(task) => (
                  <AIResultCard
                    task={task}
                    onAccept={handleAcceptAIResult}
                    onSave={handleSaveAIResult}
                    onDiscard={handleDiscardAIResult}
                  />
                )}
              </For>
            </div>
          </Show>
        </div>

        {/* Right Panels */}
        <Show when={showCharacterPanel()}>
          <CharacterPanel characters={mockCharacters} />
        </Show>

        <Show when={showTaskPanel()}>
          <AITaskPanel
            tasks={tasks()}
            onCancelTask={cancelTask}
            onRetryTask={handleRetryTask}
          />
        </Show>
      </div>

      {/* AI Log Drawer */}
      <AILogDrawer
        logs={logs() ?? []}
        isOpen={isLogDrawerOpen()}
        onClose={() => setIsLogDrawerOpen(false)}
        onClearLogs={() => {
          refetch();
        }}
      />
    </div>
  );
}

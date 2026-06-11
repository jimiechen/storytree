import { createSignal, Show, For, onMount } from 'solid-js';
import { useNovelProject } from '../../hooks/use-novel-project';
import { useNovelChapters } from '../../hooks/use-novel-chapters';
import { useAITask } from '../../hooks/use-ai-task';
import { useAILog } from '../../hooks/use-ai-log';
import { MockModeBanner } from '../mock-mode-banner';
import { ChapterList } from './chapter-list';
import { ChapterEditor } from './chapter-editor';
import { CharacterPanel } from './character-panel';
import { AITaskPanel } from './ai-task-panel';
import { AILogDrawer } from './ai-log-drawer';
import { AIResultCard } from './ai-result-card';

export function NovelEditor() {
  const { project } = useNovelProject();
  const {
    chapters,
    selectedChapter,
    selectedChapterId,
    loading,
    error,
    selectChapter,
    saveChapter,
    acceptSuggestion,
    addAISuggestion
  } = useNovelChapters(() => 'proj-001');
  const { tasks, submitTask, cancelTask } = useAITask();
  const { logs, refetch: refetchLogs } = useAILog();

  const [isLogDrawerOpen, setIsLogDrawerOpen] = createSignal(false);
  const [showTaskPanel, setShowTaskPanel] = createSignal(true);
  const [showCharacterPanel, setShowCharacterPanel] = createSignal(true);

  // 数据加载完成后自动选中第一章
  onMount(() => {
    // chapters() 在 resource 加载完成后可用
    const loaded = chapters();
    if (loaded && loaded.length > 0 && !selectedChapterId()) {
      selectChapter(loaded[0].id);
    }
  });

  const handleSaveChapter = async (content: string) => {
    const chapter = selectedChapter();
    if (chapter) {
      await saveChapter(chapter.id, content);
    }
  };

  const handleAITask = async (
    type: 'continue-writing' | 'rewrite-selection' | 'summarize-chapter',
    text: string,
    selectedText?: string
  ) => {
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

  // AI 结果接受流程：先 addAISuggestion → 用户确认后 acceptSuggestion
  const handleAcceptAIResult = async (text: string) => {
    const chapter = selectedChapter();
    if (!chapter) return;

    const suggestion = {
      id: `suggestion-${Date.now()}`,
      taskId: `task-${Date.now()}`,
      text,
      status: 'accepted' as const,
      createdAt: new Date()
    };

    // 先保存建议，再接受（追加到正文）
    await addAISuggestion(chapter.id, suggestion);
    await acceptSuggestion(chapter.id, suggestion.id);
  };

  const handleSaveAIResult = async (text: string) => {
    const chapter = selectedChapter();
    if (!chapter) return;

    const suggestion = {
      id: `suggestion-${Date.now()}`,
      taskId: `task-${Date.now()}`,
      text,
      status: 'saved' as const,
      createdAt: new Date()
    };

    await addAISuggestion(chapter.id, suggestion);
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
        {/* Chapter List Sidebar — 通过 Hook 获取数据 */}
        <div class="w-64 shrink-0">
          <Show
            when={chapters()}
            fallback={
              <div class="flex items-center justify-center h-full text-gray-400">
                <span>{loading ? '加载中...' : '暂无章节'}</span>
              </div>
            }
          >
            <ChapterList
              chapters={chapters() ?? []}
              selectedId={selectedChapterId()}
              onSelect={selectChapter}
            />
          </Show>
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
              <For each={tasks().filter(t => t.chapterId === selectedChapter()?.id)}>
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

        {/* Right Panels — CharacterPanel 暂保留 mockCharacters（Phase 2.2 修复） */}
        <Show when={showCharacterPanel()}>
          {/* TODO Phase 2.2: 替换为 useNovelCharacters Hook 数据源 */}
          <CharacterPanel characters={[]} />
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
          refetchLogs();
        }}
      />
    </div>
  );
}

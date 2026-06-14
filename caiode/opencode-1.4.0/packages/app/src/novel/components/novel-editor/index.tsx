import { createSignal, Show, For, onMount } from 'solid-js';
import { useNovelView } from '../../hooks/use-novel-view';
import { useNovelProject } from '../../hooks/use-novel-project';
import { useNovelChapters } from '../../hooks/use-novel-chapters';
import { useAITask } from '../../hooks/use-ai-task';
import { useAILog } from '../../hooks/use-ai-log';
import { MockModeBanner } from '../mock-mode-banner';
import { NovelIcon } from '../layout/novel-icon';
import { ChapterPaperEditor } from './chapter-paper-editor';
import { ChapterInfoPanel } from './chapter-info-panel';
import { AIResultCard } from './ai-result-card';
import { AILogDrawer } from './ai-log-drawer';

export function NovelEditor() {
  const { setView } = useNovelView();
  const { project } = useNovelProject();
  const {
    chapters,
    selectedChapter,
    selectedChapterId,
    loading,
    selectChapter,
    saveChapter,
    acceptSuggestion,
    addAISuggestion,
  } = useNovelChapters(() => 'proj-001');
  const { tasks, submitTask, cancelTask } = useAITask();
  const { logs, refetch: refetchLogs } = useAILog();

  const [wordCount, setWordCount] = createSignal(selectedChapter()?.wordCount ?? 0);
  const [isLogDrawerOpen, setIsLogDrawerOpen] = createSignal(false);
  const [saving, setSaving] = createSignal(false);

  onMount(() => {
    const loaded = chapters();
    if (loaded && loaded.length > 0 && !selectedChapterId()) {
      selectChapter(loaded[0].id);
    }
  });

  const handleSave = async (content: string) => {
    const ch = selectedChapter();
    if (!ch) return;
    setSaving(true);
    await saveChapter(ch.id, content);
    setSaving(false);
  };

  const handleAITask = async (
    type: 'continue-writing' | 'rewrite-selection' | 'summarize-chapter',
    text: string,
    selectedText?: string
  ) => {
    const ch = selectedChapter();
    if (!ch) return;
    await submitTask({ type, chapterId: ch.id, text, selectedText });
  };

  const handleAcceptAIResult = async (text: string) => {
    const ch = selectedChapter();
    if (!ch) return;
    const suggestion = {
      id: `suggestion-${Date.now()}`,
      taskId: `task-${Date.now()}`,
      text,
      status: 'accepted' as const,
      createdAt: new Date(),
    };
    await addAISuggestion(ch.id, suggestion);
    await acceptSuggestion(ch.id, suggestion.id);
  };

  const handleSaveAIResult = async (text: string) => {
    const ch = selectedChapter();
    if (!ch) return;
    await addAISuggestion(ch.id, {
      id: `suggestion-${Date.now()}`,
      taskId: `task-${Date.now()}`,
      text,
      status: 'saved' as const,
      createdAt: new Date(),
    });
  };

  const runningTask = () => tasks().find((t) => t.status === 'running');
  const chapterTasks = () => tasks().filter((t) => t.chapterId === selectedChapter()?.id);

  return (
    <div class="flex flex-col h-full text-[#0d1c2f] overflow-hidden antialiased" style={{ background: '#f8f9ff' }}>
      <MockModeBanner />

      {/* Top Toolbar */}
      <header class="flex justify-between items-center w-full px-6 py-2 bg-white border-b border-[#cbc3d7] shadow-sm z-10 shrink-0">
        {/* Left: Back & Title */}
        <div class="flex items-center gap-2">
          <button
            onClick={() => setView('workspace')}
            aria-label="返回工作台"
            class="w-10 h-10 flex items-center justify-center rounded-full text-[#0d1c2f] hover:bg-[#eff4ff] transition-colors"
          >
            <NovelIcon name="arrow_back" size={20} />
          </button>
          <div class="w-[1px] h-6 bg-[#cbc3d7] mx-2" />
          <Show when={selectedChapter()} fallback={<span class="text-xl font-semibold">加载中...</span>}>
            <h1
              class="text-xl font-semibold text-[#0d1c2f]"
              style={{ 'font-family': "'Plus Jakarta Sans', 'PingFang SC', sans-serif" }}
            >
              第{selectedChapter()!.orderIndex + 1}章 {selectedChapter()!.title}
            </h1>
          </Show>
        </div>

        {/* Center: Word Count */}
        <div class="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center text-[#494454] text-sm font-medium">
          <NovelIcon name="bar_chart" size={18} class="mr-1" />
          共 {wordCount().toLocaleString()} 字
        </div>

        {/* Right: Actions */}
        <div class="flex items-center gap-2">
          <button
            onClick={() => setIsLogDrawerOpen(true)}
            class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[#494454] hover:bg-[#eff4ff] transition-colors text-sm font-medium border border-transparent"
          >
            <NovelIcon name="history" size={18} />
            历史版本
          </button>
          <button
            class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[#494454] hover:bg-[#eff4ff] transition-colors text-sm font-medium border border-transparent"
            onClick={() => { /* 备注功能 Phase 5.2 实现 */ }}
          >
            <NovelIcon name="notes" size={18} />
            备注
          </button>
          <div class="w-[1px] h-6 bg-[#cbc3d7] mx-1" />
          <button
            class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[#6b38d4] bg-[#e9ddff] hover:bg-[#d0bcff] transition-colors text-sm font-semibold border border-[#d0bcff]"
            onClick={() => {
              const ch = selectedChapter();
              if (ch) handleAITask('continue-writing', ch.content);
            }}
          >
            <NovelIcon name="auto_awesome" size={18} />
            AI续写
          </button>
          <button
            onClick={() => {
              const ch = selectedChapter();
              if (ch) handleSave(ch.content);
            }}
            disabled={saving()}
            class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white bg-[#6b38d4] hover:bg-[#8455ef] transition-colors text-sm font-semibold shadow-sm ml-1 disabled:opacity-70"
          >
            <NovelIcon name="save" size={18} />
            保存 <span class="opacity-70 font-normal ml-1">(Ctrl+S)</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main class="flex flex-1 overflow-hidden relative">
        {/* Editor Canvas */}
        <div class="flex-1 flex flex-col min-w-0">
          <Show
            when={selectedChapter()}
            fallback={
              <div class="flex-1 flex items-center justify-center text-[#7b7486]">
                <Show when={loading} fallback="请选择一个章节">
                  <NovelIcon name="sync" size={24} class="animate-spin mr-2" />
                  加载中...
                </Show>
              </div>
            }
          >
            <ChapterPaperEditor
              chapter={selectedChapter()!}
              onSave={handleSave}
              onAITask={handleAITask}
              onWordCountChange={setWordCount}
            />

            {/* AI 结果卡片 */}
            <Show when={chapterTasks().length > 0}>
              <div class="bg-[#f8f9ff] px-10 pb-10">
                <div class="max-w-[800px] mx-auto space-y-4">
                  <For each={chapterTasks()}>
                    {(task) => (
                      <AIResultCard
                        task={task}
                        onAccept={handleAcceptAIResult}
                        onSave={handleSaveAIResult}
                        onDiscard={() => {}}
                      />
                    )}
                  </For>
                </div>
              </div>
            </Show>
          </Show>
        </div>

        {/* Right Info Panel */}
        <Show when={selectedChapter()}>
          <ChapterInfoPanel chapter={selectedChapter()!} onReExtract={() => handleAITask('summarize-chapter', selectedChapter()!.content)} />
        </Show>
      </main>

      {/* AI Log Drawer */}
      <AILogDrawer
        logs={logs() ?? []}
        isOpen={isLogDrawerOpen()}
        onClose={() => setIsLogDrawerOpen(false)}
        onClearLogs={() => refetchLogs()}
      />
    </div>
  );
}

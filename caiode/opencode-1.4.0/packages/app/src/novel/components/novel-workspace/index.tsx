import { createSignal, Show, For, onMount } from 'solid-js';
import type { Component } from 'solid-js';
import { useWorkspace } from '../../hooks/use-workspace';
import { useNovelOutline } from '../../hooks/use-novel-outline';
import type { GenerationConfig } from '../../types';
import { MockModeBanner } from '../mock-mode-banner';
import { WorkspaceTopAppBar } from './workspace-top-app-bar';
import { OutlineSidebar } from './outline-sidebar';
import { GenerationSettings } from './generation-settings';
import { ChapterEditor } from '../novel-editor/chapter-editor';
import { CharacterPanel } from '../novel-editor/character-panel';
import { AITaskPanel } from '../novel-editor/ai-task-panel';
import { AILogDrawer } from '../novel-editor/ai-log-drawer';
import { AIResultCard } from '../novel-editor/ai-result-card';
import { NovelIcon } from '../layout/novel-icon';
import { useAITask } from '../../hooks/use-ai-task';
import { useAILog } from '../../hooks/use-ai-log';

interface WorkspaceProps {
  projectId: () => string;
}

/** Workspace 主壳层 — Stitch 04 code.html 三栏布局 */
export const Workspace: Component<WorkspaceProps> = (props) => {
  const ws = useWorkspace(props.projectId);
  const outline = useNovelOutline(props.projectId);
  const { tasks, submitTask, cancelTask } = useAITask();
  const { logs, refetch: refetchLogs } = useAILog();

  onMount(() => {
    const loaded = ws.chapters();
    if (loaded && loaded.length > 0 && !ws.selectedChapterId()) {
      ws.selectChapter(loaded[0].id);
    }
  });

  const handleSaveChapter = async (content: string) => {
    const ch = ws.selectedChapter();
    if (ch) await ws.saveChapter(ch.id, content);
  };

  const handleAITask = async (
    type: 'continue-writing' | 'rewrite-selection' | 'summarize-chapter',
    text: string,
    selectedText?: string
  ) => {
    const ch = ws.selectedChapter();
    if (!ch) return;
    await submitTask({ type, chapterId: ch.id, text, selectedText });
  };

  const handleRetryTask = async (taskId: string) => {
    const task = tasks().find((t) => t.id === taskId);
    if (!task) return;
    await submitTask({
      type: task.type,
      chapterId: task.chapterId,
      text: task.input.text,
      selectedText: task.input.selectedText,
      characterId: task.input.characterId,
    });
  };

  const handleAcceptAIResult = async (text: string) => {
    const ch = ws.selectedChapter();
    if (!ch) return;
    const suggestion = {
      id: `suggestion-${Date.now()}`,
      taskId: `task-${Date.now()}`,
      text,
      status: 'accepted' as const,
      createdAt: new Date(),
    };
    await ws.addAISuggestion(ch.id, suggestion);
    await ws.acceptSuggestion(ch.id, suggestion.id);
  };

  const handleSaveAIResult = async (text: string) => {
    const ch = ws.selectedChapter();
    if (!ch) return;
    await ws.addAISuggestion(ch.id, {
      id: `suggestion-${Date.now()}`,
      taskId: `task-${Date.now()}`,
      text,
      status: 'saved' as const,
      createdAt: new Date(),
    });
  };

  const handleGenerate = async (config: GenerationConfig) => {
    const ch = ws.selectedChapter();
    if (!ch) return;
    await submitTask({
      type: 'continue-writing',
      chapterId: ch.id,
      text: ch.content.substring(0, Math.min(ch.content.length, 500)),
    });
  };

  const runningTask = () => tasks().find((t) => t.status === 'running');
  const [showGenModal, setShowGenModal] = createSignal(false);

  return (
    <div class="flex flex-col h-screen bg-[#f8f9ff]">
      <MockModeBanner />
      <WorkspaceTopAppBar />

      <main class="flex flex-1 overflow-hidden relative">
        {/* 左侧 SideNav */}
        <OutlineSidebar
          projectName={ws.project()?.name ?? '加载中...'}
          lastEdited="最后编辑于 2小时前"
          chapters={ws.chapters() ?? []}
          selectedId={ws.selectedChapterId()}
          onSelect={ws.selectChapter}
          viewMode={outline.viewMode}
          onSwitchView={outline.setViewMode}
          outlines={outline.outlines()}
          loading={outline.loading}
          onGenerateOutline={outline.generateOutline}
          onGenerateDetail={() => {}}
        />

        {/* 中间编辑器 */}
        <section class="flex-1 flex flex-col bg-[#f8f9ff] relative min-w-0">
          {/* Editor Header */}
          <header class="px-10 py-6 border-b border-[#cbc3d7] bg-white shrink-0 flex items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <h1
              class="text-3xl font-bold text-[#0d1c2f] tracking-tight"
              style={{ 'font-family': "'Plus Jakarta Sans', 'PingFang SC', sans-serif" }}
            >
              {ws.selectedChapter()?.title ?? '请选择一个章节'}
            </h1>
            <div class="flex gap-2">
              <button
                class="text-[#494454] hover:text-[#6b38d4] p-2 rounded-md hover:bg-[#eff4ff] transition-colors"
                title="历史版本"
              >
                <NovelIcon name="history" size={20} />
              </button>
              <button
                class="text-[#494454] hover:text-[#6b38d4] p-2 rounded-md hover:bg-[#eff4ff] transition-colors"
                title="全屏"
              >
                <NovelIcon name="fullscreen" size={20} />
              </button>
            </div>
          </header>

          {/* Text Area */}
          <div class="flex-1 overflow-y-auto px-10 py-6 bg-white">
            <div class="max-w-3xl mx-auto">
              <Show
                when={ws.selectedChapter()}
                fallback={
                  <div class="flex items-center justify-center h-full text-[#7b7486] text-sm">
                    请选择一个章节
                  </div>
                }
              >
                <ChapterEditor
                  chapter={ws.selectedChapter()!}
                  onSave={handleSaveChapter}
                  onAITask={handleAITask}
                />
                <For each={tasks().filter((t) => t.chapterId === ws.selectedChapter()?.id)}>
                  {(task) => (
                    <AIResultCard
                      task={task}
                      onAccept={handleAcceptAIResult}
                      onSave={handleSaveAIResult}
                      onDiscard={() => {}}
                    />
                  )}
                </For>
              </Show>
            </div>
          </div>

          {/* AI 进度浮窗 */}
          <Show when={runningTask()}>
            {(task) => (
              <div class="absolute bottom-8 left-1/2 -translate-x-1/2 w-[85%] max-w-3xl bg-white/90 backdrop-blur-md rounded-xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-[#cbc3d7] flex flex-col gap-4 z-30">
                <div class="flex justify-between items-center text-sm">
                  <div class="flex items-center gap-3 text-[#6b38d4]">
                    <NovelIcon name="sync" size={20} class="animate-spin" />
                    <span class="font-bold">正在生成...</span>
                  </div>
                  <span class="text-[#0d1c2f] font-medium bg-[#eff4ff] px-3 py-1 rounded-full">
                    {task().status === 'running' ? '进行中' : task().status}
                  </span>
                </div>
                <div class="w-full bg-[#d5e3fd] rounded-full h-1.5 overflow-hidden">
                  <div class="bg-gradient-to-r from-[#6b38d4] to-[#6d3bd7] h-full rounded-full transition-all duration-500 w-2/3" />
                </div>
                <Show when={task().output?.text}>
                  <div class="bg-[#f8f9ff] p-4 rounded-lg border border-[#cbc3d7] text-sm text-[#494454] max-h-32 overflow-y-auto relative">
                    <p class="italic">{task().output!.text}</p>
                  </div>
                </Show>
                <div class="flex justify-end pt-2">
                  <button
                    onClick={() => cancelTask(task().id)}
                    class="bg-white border border-[#cbc3d7] text-[#0d1c2f] px-6 py-2 rounded-md text-sm hover:bg-[#eff4ff] hover:text-[#6b38d4] transition-colors flex items-center gap-2"
                  >
                    <NovelIcon name="pause" size={18} />
                    暂停
                  </button>
                </div>
              </div>
            )}
          </Show>
        </section>

        {/* 右侧面板 */}
        <Show when={ws.isPanelVisible('character')}>
          <aside class="w-[300px] border-l border-[#cbc3d7] bg-white overflow-y-auto shrink-0 shadow-[-2px_0_12px_rgba(0,0,0,0.02)]">
            <CharacterPanel characters={[]} />
          </aside>
        </Show>

        <Show when={ws.isPanelVisible('ai-task')}>
          <aside class="w-[300px] border-l border-[#cbc3d7] bg-white overflow-y-auto shrink-0 shadow-[-2px_0_12px_rgba(0,0,0,0.02)]">
            <AITaskPanel tasks={tasks()} onCancelTask={cancelTask} onRetryTask={handleRetryTask} />
          </aside>
        </Show>

        {/* 生成设置快速入口面板 */}
        <Show when={ws.isPanelVisible('generation')}>
          <aside class="w-[300px] border-l border-[#cbc3d7] bg-white overflow-y-auto shrink-0 shadow-[-2px_0_12px_rgba(0,0,0,0.02)] flex flex-col">
            <div class="p-4 border-b border-[#cbc3d7]">
              <h3 class="text-sm font-semibold text-[#0d1c2f] flex items-center gap-2">
                <NovelIcon name="tune" size={18} class="text-[#6b38d4]" />
                快速设置
              </h3>
            </div>
            <div class="flex-1 p-4 space-y-4">
              <p class="text-xs text-[#494454]">点击以下按钮打开完整的AI生成参数设置。</p>
              <button
                onClick={() => setShowGenModal(true)}
                class="w-full bg-gradient-to-r from-[#6b38d4] to-[#8455ef] text-white py-2.5 rounded-lg text-sm font-medium shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <NovelIcon name="magic_button" size={16} />
                打开完整设置
              </button>
            </div>
          </aside>
        </Show>

        {/* 生成设置 Modal */}
        <GenerationSettings
          open={showGenModal()}
          onClose={() => setShowGenModal(false)}
          hasSelectedChapter={!!ws.selectedChapterId()}
          isRunning={tasks().some((t) => t.status === 'running')}
          onGenerate={handleGenerate}
        />
      </main>

      <AILogDrawer
        logs={logs() ?? []}
        isOpen={ws.isLogDrawerOpen()}
        onClose={() => ws.setIsLogDrawerOpen(false)}
        onClearLogs={() => refetchLogs()}
      />
    </div>
  );
};

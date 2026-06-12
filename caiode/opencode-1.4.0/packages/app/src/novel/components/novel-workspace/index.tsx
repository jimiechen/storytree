import { Show, For, onMount } from 'solid-js';
import type { Component } from 'solid-js';
import { useWorkspace } from '../../hooks/use-workspace';
import { useNovelOutline } from '../../hooks/use-novel-outline';
import type { WorkspacePanelId } from '../../types/workspace';
import { MockModeBanner } from '../mock-mode-banner';
import { WorkspaceHeader } from './workspace-header';
import { OutlineSidebar } from './outline-sidebar';
import { ChapterEditor } from '../novel-editor/chapter-editor';
import { CharacterPanel } from '../novel-editor/character-panel';
import { AITaskPanel } from '../novel-editor/ai-task-panel';
import { AILogDrawer } from '../novel-editor/ai-log-drawer';
import { AIResultCard } from '../novel-editor/ai-result-card';
import { useAITask } from '../../hooks/use-ai-task';
import { useAILog } from '../../hooks/use-ai-log';

interface WorkspaceProps {
  projectId: () => string;
}

/**
 * Workspace 主壳层 — 三栏布局容器
 * 左侧: 章节列表 (~256px)
 * 中间: 章节编辑器 (flex-1)
 * 右侧: 可切换面板 (~300px)
 */
export const Workspace: Component<WorkspaceProps> = (props) => {
  const ws = useWorkspace(props.projectId);
  const outline = useNovelOutline(props.projectId);
  const { tasks, submitTask, cancelTask } = useAITask();
  const { logs, refetch: refetchLogs } = useAILog();

  // 数据加载完成后自动选中第一章
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
    const task = tasks().find(t => t.id === taskId);
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

  return (
    <div class="flex flex-col h-screen bg-gray-100">
      <MockModeBanner />

      <WorkspaceHeader
        projectName={ws.project()?.name ?? '加载中...'}
        projectGenre={ws.project()?.genre ?? ''}
        totalWordCount={ws.project()?.totalWordCount ?? 0}
        visiblePanels={ws.visiblePanels()}
        onTogglePanel={ws.togglePanel}
        onOpenLog={() => ws.setIsLogDrawerOpen(true)}
      />

      {/* 三栏主内容区 */}
      <div class="flex-1 flex overflow-hidden">
        {/* 左侧面板：大纲/细纲/章节三视图 ~256px */}
        <OutlineSidebar
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

        {/* 中间面板：编辑器 flex-1 */}
        <div class="flex-1 min-w-0 flex flex-col overflow-hidden bg-white">
          <Show
            when={ws.selectedChapter()}
            fallback={
              <div class="flex items-center justify-center h-full text-gray-400 text-sm">
                请选择一个章节
              </div>
            }
          >
            <div class="flex-1 overflow-y-auto p-6">
              <ChapterEditor
                chapter={ws.selectedChapter()!}
                onSave={handleSaveChapter}
                onAITask={handleAITask}
              />
              <For each={tasks().filter(t => t.chapterId === ws.selectedChapter()?.id)}>
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
          </Show>
        </div>

        {/* 右侧面板：可切换 ~300px */}
        <Show when={ws.isPanelVisible('character')}>
          <div class="w-[300px] shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
            {/* TODO Phase 2.2: 替换为 useNovelCharacters Hook 数据源 */}
            <CharacterPanel characters={[]} />
          </div>
        </Show>

        <Show when={ws.isPanelVisible('ai-task')}>
          <div class="w-[300px] shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
            <AITaskPanel
              tasks={tasks()}
              onCancelTask={cancelTask}
              onRetryTask={handleRetryTask}
            />
          </div>
        </Show>
      </div>

      {/* AI 日志抽屉 */}
      <AILogDrawer
        logs={logs() ?? []}
        isOpen={ws.isLogDrawerOpen()}
        onClose={() => ws.setIsLogDrawerOpen(false)}
        onClearLogs={() => refetchLogs()}
      />
    </div>
  );
};

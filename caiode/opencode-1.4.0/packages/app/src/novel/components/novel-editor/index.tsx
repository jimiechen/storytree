import { createSignal, Show, For, createEffect } from 'solid-js';
import { useNovelNavigation } from '../../hooks/use-novel-navigation';
import { useNovelProject } from '../../hooks/use-novel-project';
import { useNovelChapters } from '../../hooks/use-novel-chapters';
import { useAITask } from '../../hooks/use-ai-task';
import { useAILog } from '../../hooks/use-ai-log';
import { useChapterEditor } from '../../hooks/use-chapter-editor';
import { MockModeBanner } from '../mock-mode-banner';
import { EditorToolbar } from './editor-toolbar';
import { EditorCanvas } from './editor-canvas';
import { EditorRightPanel } from './editor-right-panel';
import { EditorAIFloatingToolbar } from './editor-ai-floating-toolbar';
import { AIResultCard } from './ai-result-card';
import { AILogDrawer } from './ai-log-drawer';
import { ChapterInfoPanel } from './chapter-info-panel';
import { mockAgentAdapter } from '../../adapters/mock-agent-adapter';
import { createChapterGenerateCommand } from '../../workflows/novel-command';
import type { ChapterInformationState } from '../../types/information-flow';

export function NovelEditor() {
  const nav = useNovelNavigation();
  const { project } = useNovelProject();
  const chaptersHook = useNovelChapters(() => nav.projectId() ?? 'proj-001');
  const { tasks, submitTask } = useAITask();
  const { logs, refetch: refetchLogs } = useAILog();
  const editor = useChapterEditor(
    chaptersHook.selectedChapter()?.id ?? ''
  );

  const [isLogDrawerOpen, setIsLogDrawerOpen] = createSignal(false);
  const [saving, setSaving] = createSignal(false);
  const [localTitle, setLocalTitle] = createSignal('');
  const [localContent, setLocalContent] = createSignal('');
  const [wordCount, setWordCount] = createSignal(0);
  const [mockInfoState, setMockInfoState] = createSignal<ChapterInformationState | undefined>(undefined);

  createEffect(() => {
    const loaded = chaptersHook.chapters();
    if (loaded && loaded.length > 0 && !chaptersHook.selectedChapterId()) {
      chaptersHook.selectChapter(loaded[0].id);
    }
  });

  /** P1-A 视觉验收：注入 mock informationState */
  const injectMockInfoState = async (chapterIndex: number, genre: string) => {
    const cmd = createChapterGenerateCommand({
      chapterId: chaptersHook.selectedChapter()?.id ?? 'ch-001',
      projectId: nav.projectId() ?? 'proj-001',
      chapterIndex,
      genre,
      text: localContent() || '测试正文',
    });
    const result = await mockAgentAdapter.run(cmd);
    setMockInfoState(result.informationState);
  };

  // 自动注入 mock 数据（P1-A 验收用）
  createEffect(() => {
    const ch = chaptersHook.selectedChapter();
    if (ch) {
      injectMockInfoState(ch.orderIndex, '玄幻').catch(() => {});
    }
  });

  const handleSave = async () => {
    const ch = chaptersHook.selectedChapter();
    if (!ch) return;
    setSaving(true);
    await chaptersHook.saveChapter(ch.id, localContent());
    setSaving(false);
  };

  const handleAITask = async (
    type: 'continue-writing' | 'rewrite-selection' | 'summarize-chapter',
    text: string,
    selectedText?: string
  ) => {
    const ch = chaptersHook.selectedChapter();
    if (!ch) return;
    await submitTask({ type, chapterId: ch.id, text, selectedText });
  };

  const handleAcceptAIResult = async (text: string) => {
    const ch = chaptersHook.selectedChapter();
    if (!ch) return;
    const suggestion = {
      id: `suggestion-`,
      taskId: `task-`,
      text,
      status: 'accepted' as const,
      createdAt: new Date(),
    };
    await chaptersHook.addAISuggestion(ch.id, suggestion);
    await chaptersHook.acceptSuggestion(ch.id, suggestion.id);
  };

  const handleSaveAIResult = async (text: string) => {
    const ch = chaptersHook.selectedChapter();
    if (!ch) return;
    await chaptersHook.addAISuggestion(ch.id, {
      id: `suggestion-`,
      taskId: `task-`,
      text,
      status: 'saved' as const,
      createdAt: new Date(),
    });
  };

  const chapterTasks = () =>
    tasks().filter((t) => t.chapterId === chaptersHook.selectedChapter()?.id);

  /** 格式化相对时间 */
  function formatRelativeTime(dateStr: string): string {
    const now = Date.now();
    const diff = now - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return '刚刚';
    if (hours < 24) return `小时前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `天前`;
    return new Date(dateStr).toLocaleDateString('zh-CN');
  }

  return (
    <div class="flex flex-col h-screen bg-[#f8f9ff] overflow-hidden text-[#0d1c2f]">
      <MockModeBanner />

      <Show
        when={chaptersHook.selectedChapter()}
        fallback={
          <div class="flex-1 flex items-center justify-center text-[#7b7486]">
            <Show
              when={chaptersHook.loading}
              fallback="请选择一个章节"
            >
              加载中...
            </Show>
          </div>
        }
      >
        {(ch) => (
          <>
            <EditorToolbar
              chapterTitle={localTitle() || ch().title}
              orderIndex={ch().orderIndex}
              wordCount={wordCount()}
              targetWordCount={editor.targetWordCount}
              onBack={() => nav.openView('workspace')}
              onHistory={() => setIsLogDrawerOpen(true)}
              onFullscreen={() =>
                editor.setIsFullscreen(!editor.isFullscreen())
              }
              onPublish={() => editor.markComplete()}
              onAIContinue={() =>
                handleAITask('continue-writing', localContent())
              }
              onSave={handleSave}
              saving={saving()}
            />

            <div class="flex flex-1 overflow-hidden">
              <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
                <EditorCanvas
                  chapterId={ch().id}
                  title={localTitle() || ch().title}
                  initialContent={ch().content}
                  onTitleChange={setLocalTitle}
                  onContentChange={(v) => {
                    setLocalContent(v);
                    editor.setContent(v);
                  }}
                  onTextSelect={editor.onTextSelect}
                  onWordCountChange={setWordCount}
                />

                <Show when={chapterTasks().length > 0}>
                  <div class="bg-[#f8f9ff] px-10 pb-6 overflow-y-auto max-h-[300px] shrink-0">
                    <div class="max-w-[800px] mx-auto space-y-3">
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
              </div>

              <EditorRightPanel
                chapterNumber={`#${ch().orderIndex + 1}`}
                status={editor.chapterStatus()}
                wordCount={wordCount()}
                createdAt={ch().createdAt ? new Date(ch().createdAt).toLocaleDateString('zh-CN') : '—'}
                lastModified={ch().updatedAt ? formatRelativeTime(ch().updatedAt) : '—'}
                aiExtract={editor.aiExtract()}
                onStatusChange={editor.setChapterStatus}
                onRefreshAI={() =>
                  handleAITask('summarize-chapter', localContent())
                }
                onSaveDraft={editor.saveDraft}
                onMarkComplete={editor.markComplete}
              />

              {/* P1-A 视觉验收：信息审计块 */}
              <ChapterInfoPanel
                chapter={ch()}
                informationState={mockInfoState()}
                onReExtract={() => injectMockInfoState(ch().orderIndex, '玄幻')}
              />
            </div>
          </>
        )}
      </Show>

      <AILogDrawer
        logs={logs() ?? []}
        isOpen={isLogDrawerOpen()}
        onClose={() => setIsLogDrawerOpen(false)}
        onClearLogs={() => refetchLogs()}
      />

      <EditorAIFloatingToolbar
        visible={editor.isAiToolbarVisible()}
        top={editor.aiToolbarPos().top}
        left={editor.aiToolbarPos().left}
        onCommand={editor.handleAICommand}
      />
    </div>
  );
}

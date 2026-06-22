import { createSignal, Show, For, createEffect } from 'solid-js';
import { useNovelNavigation } from '../../hooks/use-novel-navigation';
import { useNovelProject } from '../../hooks/use-novel-project';
import { useNovelChapters } from '../../hooks/use-novel-chapters';
import { useAITask } from '../../hooks/use-ai-task';
import { useAILog } from '../../hooks/use-ai-log';
import { useChapterEditor } from '../../hooks/use-chapter-editor';
import { useNovelWorkflow } from '../../hooks/use-novel-workflow';
import { MockModeBanner } from '../mock-mode-banner';
import { EditorToolbar } from './editor-toolbar';
import { EditorCanvas } from './editor-canvas';
import { EditorRightPanel } from './editor-right-panel';
import { EditorAIFloatingToolbar } from './editor-ai-floating-toolbar';
import { AIResultCard } from './ai-result-card';
import { AILogDrawer } from './ai-log-drawer';
import { ChapterInfoPanel } from './chapter-info-panel';
import type { AIWritingCommand } from '../../types/editor';
import type { WorkflowMutations } from '../../workflows/workflow-events';
import type { ChapterInformationState } from '../../types/information-flow';
import type { GenerationIssue } from '../../llm/generation-result-validator';

/**
 * 创建 NovelEditor 内的 WorkflowMutations。
 *
 * P2-D：把 workflow 事件写回映射到 useNovelChapters 的 provider 方法。
 * 角色/世界/成就/统计等后端未接入，先用空函数占位，不伪成功。
 */
function createEditorMutations(chapters: ReturnType<typeof useNovelChapters>): WorkflowMutations {
  return {
    updateChapterContent: async (chapterId, content) => {
      await chapters.saveChapter(chapterId, content);
    },
    updateChapterSummary: async (chapterId, summary) => {
      await chapters.saveChapterSummary(chapterId, summary);
    },
    updateChapterWordCount: async (chapterId, wordCount) => {
      await chapters.saveChapterWordCount(chapterId, wordCount);
    },
    updateChapterInfoState: async (chapterId, state) => {
      await chapters.saveChapterInformationState(chapterId, state);
    },
    updateChapterExtractedInfo: async (chapterId, info) => {
      await chapters.saveChapterExtractedInfo(chapterId, info);
    },
    updateCharacterAppearance: () => {},
    incrementWorldReference: () => {},
    addAchievementProgress: () => {},
    updateProfileStats: () => {},
    logDiscardedTask: () => {},
  };
}

export function NovelEditor() {
  const nav = useNovelNavigation();
  const { project } = useNovelProject();
  const chaptersHook = useNovelChapters(() => nav.projectId() ?? 'proj-001');
  const mutations = createEditorMutations(chaptersHook);
  const workflow = useNovelWorkflow(mutations);
  const { tasks } = useAITask();
  const { logs, refetch: refetchLogs } = useAILog();
  const editor = useChapterEditor(
    chaptersHook.selectedChapter()?.id ?? ''
  );

  const [isLogDrawerOpen, setIsLogDrawerOpen] = createSignal(false);
  const [saving, setSaving] = createSignal(false);
  const [localTitle, setLocalTitle] = createSignal('');
  const [localContent, setLocalContent] = createSignal('');
  const [wordCount, setWordCount] = createSignal(0);
  const [infoState, setInfoState] = createSignal<ChapterInformationState | undefined>(undefined);
  // P3-C：保存当前 workflow 结果的校验信息，用于 AIResultCard 展示
  const [validationIssues, setValidationIssues] = createSignal<GenerationIssue[] | undefined>(undefined);
  const [wasTrimmed, setWasTrimmed] = createSignal<boolean | undefined>(undefined);

  const currentProjectId = () => nav.projectId() ?? 'proj-001';

  createEffect(() => {
    const loaded = chaptersHook.chapters();
    if (loaded && loaded.length > 0 && !chaptersHook.selectedChapterId()) {
      chaptersHook.selectChapter(loaded[0].id);
    }
  });

  /**
   * P2-D：通过 YAML Workflow Engine 重新提取章节信息。
   *
   * 链路：重新提取按钮 → NovelActionDispatcher → info.extract workflow → info-theory-audit tool
   * → useNovelWorkflow 将 info-theory 结果映射为 Info-Lite 类型 → 局部状态 + mutations 写回。
   * 不直接调用 Tool，不直接修改 mock-data。
   */
  const runInfoExtractForChapter = async (chapterIndex: number) => {
    const ch = chaptersHook.selectedChapter();
    if (!ch) return;
    const state = await workflow.runInfoExtract({
      chapterId: ch.id,
      projectId: currentProjectId(),
      chapterIndex,
      genre: '玄幻',
      text: localContent() || ch.content || '测试正文',
    });
    if (state) {
      setInfoState(state);
      // 同时通过 mutations 持久化到章节 Store，保证切换章节后仍能读取
      await mutations.updateChapterInfoState(ch.id, state);
    }
  };

  // 自动触发信息提取（P1-A 视觉验收用，P2-D 改为走 YAML Engine）
  createEffect(() => {
    const ch = chaptersHook.selectedChapter();
    if (ch) {
      runInfoExtractForChapter(ch.orderIndex).catch(() => {});
    }
  });

  const handleSave = async () => {
    const ch = chaptersHook.selectedChapter();
    if (!ch) return;
    setSaving(true);
    await chaptersHook.saveChapter(ch.id, localContent());
    setSaving(false);
  };

  // P2-D：顶部工具栏「AI 续写」走 YAML Workflow Engine（chapter.continue）。
  // 该按钮从旧的 useAITask 直接调用迁移到 Dispatcher 统一路径。
  const handleAIContinue = async () => {
    const ch = chaptersHook.selectedChapter();
    if (!ch) return;
    try {
      const result = await workflow.runAIWritingCommand({
        chapterId: ch.id,
        projectId: currentProjectId(),
        chapterIndex: ch.orderIndex,
        genre: '玄幻',
        command: 'continue',
        text: localContent(),
      });
      // P3-C：保存校验信息供 AIResultCard 展示
      setValidationIssues(result.validationIssues);
      setWasTrimmed(result.wasTrimmed);
      // 将生成结果同步到本地编辑器，避免 EditorCanvas 因只按 chapterId 重置而错过更新
      if (result.text) {
        setLocalContent(result.text);
        editor.setContent(result.text);
      }
    } catch {
      // 错误已在 useNovelWorkflow 内部记录，UI 不需要额外处理
    }
  };

  /**
   * P2-D：浮动工具栏 AI 命令。
   * - continue 使用 chapter.continue.yaml
   * - rewrite / expand / polish / summarize 在 P2-D 先复用 chapter.generate.yaml 跑通，
   *   不强制每个命令单独实现，避免扩大范围。
   * 所有命令均通过 useNovelWorkflow → Dispatcher → YAML Engine 执行。
   */
  const handleFloatingAICommand = async (cmd: AIWritingCommand) => {
    editor.setAiToolbarVisible(false);
    const ch = chaptersHook.selectedChapter();
    if (!ch) return;

    const selectedText = window.getSelection()?.toString() || undefined;
    try {
      const result = await workflow.runAIWritingCommand({
        chapterId: ch.id,
        projectId: currentProjectId(),
        chapterIndex: ch.orderIndex,
        genre: '玄幻',
        command: cmd,
        text: localContent(),
        selectedText,
      });
      // P3-C：保存校验信息供 AIResultCard 展示
      setValidationIssues(result.validationIssues);
      setWasTrimmed(result.wasTrimmed);
      if (result.text) {
        setLocalContent(result.text);
        editor.setContent(result.text);
      }
    } catch {
      // 错误已在 useNovelWorkflow 内部处理
    }
  };

  const handleAcceptAIResult = async (text: string) => {
    const ch = chaptersHook.selectedChapter();
    if (!ch) return;
    const suggestion = {
      id: `suggestion-${Date.now()}`,
      taskId: tasks().at(-1)?.id ?? `task-${Date.now()}`,
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
      id: `suggestion-save-${Date.now()}`,
      taskId: tasks().at(-1)?.id ?? `task-${Date.now()}`,
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
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}天前`;
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
              onAIContinue={handleAIContinue}
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
                        {(task, index) => {
                          const isLast = () => index() === chapterTasks().length - 1;
                          return (
                            <AIResultCard
                              task={task}
                              onAccept={handleAcceptAIResult}
                              onSave={handleSaveAIResult}
                              onDiscard={() => {}}
                              validationIssues={isLast() ? validationIssues() : undefined}
                              wasTrimmed={isLast() ? wasTrimmed() : undefined}
                            />
                          );
                        }}
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
                onRefreshAI={() => runInfoExtractForChapter(ch().orderIndex)}
                onSaveDraft={editor.saveDraft}
                onMarkComplete={editor.markComplete}
              />

              {/* P2-D：信息审计块绑定真实 info.extract 结果 */}
              <ChapterInfoPanel
                chapter={ch()}
                informationState={infoState()}
                onReExtract={() => runInfoExtractForChapter(ch().orderIndex)}
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
        onCommand={handleFloatingAICommand}
      />
    </div>
  );
}

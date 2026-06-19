import type { Component } from 'solid-js';
import { WorkspaceLayout } from './layout/workspace-layout';
import { WorkspaceTopAppBar } from './layout/workspace-top-app-bar';
import { WorkspaceSideNav } from './layout/workspace-side-nav';
import { WorkspaceOutlineList } from './outline/workspace-outline-list';
import { WorkspaceEditorHeader } from './editor/workspace-editor-header';
import { WorkspaceChapterContent } from './editor/workspace-chapter-content';
import { WorkspaceAiProgressDock } from './ai-task/workspace-ai-progress-dock';
import { WorkspaceGenerationForm } from './generation/workspace-generation-form';
import { WorkspaceContextOptions } from './generation/workspace-context-options';
import { WorkspaceActions } from './generation/workspace-actions';
import { NovelIcon } from '../layout/novel-icon';
import { createWorkspaceViewModel } from './workspace-view-model';
import { useWorkspace } from '../../hooks/use-workspace';
import { useNovelWorkflow } from '../../hooks/use-novel-workflow';
import type { WorkflowMutations } from '../../workflows/workflow-events';

interface WorkspaceProps {
  projectId: () => string;
}

/** dev-only 占位，集中处理未实现操作 */
function noop(action: string) {
  if (import.meta.env.DEV) {
    console.info(`[novel-workspace] ${action} is not implemented yet`);
  }
}

/**
 * 创建连接到真实数据层的 WorkflowMutations
 *
 * 将 workflow 事件写回映射到 useWorkspace / useNovelChapters 的 Provider 方法。
 * 未实现的后端（character/world/achievement/profile）使用 console.log 占位，
 * 待 P2 接入真实 Provider 时替换为实际调用。
 */
function createWorkspaceMutations(ws: ReturnType<typeof useWorkspace>): WorkflowMutations {
  return {
    updateChapterContent: async (chapterId, content) => {
      console.info('[workflow-mutations] updateChapterContent:', chapterId, 'length=', content.length);
      try {
        await ws.saveChapter(chapterId, content);
        console.info('[workflow-mutations] updateChapterContent SAVED:', chapterId);
      } catch (err) {
        console.error('[workflow-mutations] updateChapterContent FAILED:', chapterId, err);
        throw err;
      }
    },
    updateChapterSummary: async (chapterId, summary) => {
      console.info('[workflow-mutations] updateChapterSummary:', chapterId, 'length=', summary.length);
      try {
        await ws.saveChapterSummary(chapterId, summary);
        console.info('[workflow-mutations] updateChapterSummary SAVED:', chapterId);
      } catch (err) {
        console.error('[workflow-mutations] updateChapterSummary FAILED:', chapterId, err);
        throw err;
      }
    },
    updateChapterWordCount: async (chapterId, wordCount) => {
      console.info('[workflow-mutations] updateChapterWordCount:', chapterId, 'wordCount=', wordCount);
      try {
        await ws.saveChapterWordCount(chapterId, wordCount);
        console.info('[workflow-mutations] updateChapterWordCount SAVED:', chapterId);
      } catch (err) {
        console.error('[workflow-mutations] updateChapterWordCount FAILED:', chapterId, err);
        throw err;
      }
    },
    updateChapterInfoState: async (chapterId, state) => {
      console.info('[workflow-mutations] updateChapterInfoState:', chapterId);
      try {
        await ws.saveChapterInformationState(chapterId, state);
        console.info('[workflow-mutations] updateChapterInfoState SAVED:', chapterId);
      } catch (err) {
        console.error('[workflow-mutations] updateChapterInfoState FAILED:', chapterId, err);
        throw err;
      }
    },
    updateChapterExtractedInfo: async (chapterId, info) => {
      console.info('[workflow-mutations] updateChapterExtractedInfo:', chapterId);
      try {
        await ws.saveChapterExtractedInfo(chapterId, info);
        console.info('[workflow-mutations] updateChapterExtractedInfo SAVED:', chapterId);
      } catch (err) {
        console.error('[workflow-mutations] updateChapterExtractedInfo FAILED:', chapterId, err);
        throw err;
      }
    },
    updateCharacterAppearance: (_charIds, _chapterId) => {
      console.info('[workflow-mutations] updateCharacterAppearance:', _charIds);
    },
    incrementWorldReference: (_itemIds, _chapterId) => {
      console.info('[workflow-mutations] incrementWorldReference:', _itemIds);
    },
    addAchievementProgress: (_achievementId, _delta) => {
      console.info('[workflow-mutations] addAchievementProgress:', _achievementId, '+', _delta);
    },
    updateProfileStats: (_projectId, _delta) => {
      console.info('[workflow-mutations] updateProfileStats:', _delta);
    },
    logDiscardedTask: (taskId) => {
      console.info('[workflow-mutations] logDiscardedTask:', taskId);
    },
  };
}

/**
 * 小说项目工作台 — Stitch 04 三栏布局组装件
 *
 * 批次 4 改造：
 * - 使用 NovelNavigation 的 openView / openModal 替代临时 setView / noop
 * - TopAppBar「工作台」按钮进入 workspace，Logo 回到书架
 */
export const Workspace: Component<WorkspaceProps> = (props) => {
  const ws = useWorkspace(props.projectId);
  const mutations = createWorkspaceMutations(ws);
  const workflow = useNovelWorkflow(mutations);
  const vm = createWorkspaceViewModel(ws, workflow);

  const actions = {
    openWorkspace: () => vm.openView('workspace'),
    openBookshelf: () => vm.openView('bookshelf'),
    openEditor: () => vm.openView('editor'),
    openGuide: () => vm.openView('guide'),
    openCharacterPanel: () => vm.openView('character-panel'),
    openWorldSetting: () => vm.openView('world-setting'),
    openProfile: () => vm.openView('profile'),
    openTutorial: () => vm.openView('tutorial'),
    openExport: () => vm.openModal('export'),
    openHistory: () => vm.openModal('chapter-history'),
    openBatchGeneration: () => vm.openModal('batch-generation'),
    openNotifications: () => vm.openModal('notifications'),
    openSettings: () => vm.openModal('generation-settings'),
    openAchievements: () => vm.openView('achievements'),
    openFeedback: () => vm.openModal('feedback'),
    toggleFullscreen: () => noop('fullscreen'),
  };

  return (
    <WorkspaceLayout
      topAppBar={
        <WorkspaceTopAppBar
          onLogoClick={actions.openBookshelf}
          onOpenWorkspace={actions.openWorkspace}
          onOpenMaterials={actions.openWorldSetting}
          onOpenInspiration={actions.openTutorial}
          onPublishChapter={actions.openEditor}
          onOpenNotifications={actions.openNotifications}
          onOpenSettings={actions.openSettings}
          onOpenProfile={actions.openProfile}
          onOpenAchievements={actions.openAchievements}
        />
      }
      sideNav={
        <div class="flex flex-col h-full">
          <WorkspaceSideNav
            projectName={vm.projectTitle()}
            lastEdited={vm.lastEditedLabel()}
            onOpenOutline={() => {}}
            onOpenChapters={actions.openEditor}
            onOpenCharacters={actions.openCharacterPanel}
            onOpenWorldSetting={actions.openWorldSetting}
            onOpenExport={actions.openExport}
            onOpenHelp={actions.openTutorial}
            onOpenFeedback={actions.openFeedback}
            onGenerateOutline={vm.submitOutlineTask}
            onGenerateDetail={vm.submitDetailOutlineTask}
          />
          <WorkspaceOutlineList
            chapters={vm.outlineChapters()}
            selectedId={vm.selectedChapterId()}
            onSelectChapter={vm.selectChapter}
            onToggleExpand={vm.toggleExpand}
            onToggleComplete={() => noop('toggle-complete')}
            onToggleStar={vm.toggleStar}
          />
        </div>
      }
      editor={
        <div class="flex flex-col h-full relative">
          <WorkspaceEditorHeader
            chapterTitle={vm.currentChapterTitle()}
            wordCount={vm.currentChapterWordCount()}
            onOpenHistory={actions.openHistory}
            onToggleFullscreen={actions.toggleFullscreen}
          />
          <WorkspaceChapterContent paragraphs={vm.currentParagraphs} />
          <WorkspaceAiProgressDock
            task={vm.aiTaskView()}
            onPause={vm.cancelRunningTask}
          />
        </div>
      }
      generationPanel={
        <div class="flex flex-col h-full">
          <header class="p-6 border-b border-[#cbc3d7] bg-[#f8f9ff] shrink-0">
            <h3 class="text-lg font-bold text-[#0d1c2f] flex items-center gap-2">
              <NovelIcon name="tune" size={20} class="text-[#6b38d4]" />
              <span>生成设置</span>
            </h3>
          </header>
          <div class="flex-1 p-6 overflow-y-auto space-y-6">
            <WorkspaceGenerationForm
              data={vm.generationConfig()}
              onChangeTargetWords={(v) => vm.updateGenerationConfig({ targetWords: v })}
              onChangeTolerance={(v) => vm.updateGenerationConfig({ tolerance: v })}
              onChangeReferenceChapters={(v) => vm.updateGenerationConfig({ referenceChapters: v })}
              onChangeModel={(v) => vm.updateGenerationConfig({ model: v })}
            />
            <hr class="border-[#cbc3d7]" />
            <WorkspaceContextOptions
              options={vm.contextOptions()}
              onToggleOption={vm.toggleContextOption}
            />
          </div>
          <WorkspaceActions
            onStartGeneration={vm.submitChapterGenerationTask}
            onBatchGeneration={actions.openBatchGeneration}
          />
        </div>
      }
    />
  );
};

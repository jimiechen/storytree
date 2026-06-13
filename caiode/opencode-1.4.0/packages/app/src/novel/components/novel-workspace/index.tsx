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
 * 小说项目工作台 — Stitch 04 三栏布局组装件
 *
 * 结构:
 *   WorkspaceLayout
 *   ├── topAppBar    → WorkspaceTopAppBar
 *   ├── sideNav      → WorkspaceSideNav + WorkspaceOutlineList
 *   ├── editor       → WorkspaceEditorHeader + WorkspaceChapterContent + WorkspaceAiProgressDock
 *   └── generationPanel → 生成设置 Header + WorkspaceGenerationForm + WorkspaceContextOptions + WorkspaceActions
 *
 * 数据流：
 *   Provider → Hook → workspace-view-model.ts → UI props
 */
export const Workspace: Component<WorkspaceProps> = (props) => {
  const vm = createWorkspaceViewModel(props.projectId);

  const actions = {
    openBookshelf: () => vm.setView('bookshelf'),
    openEditor: () => vm.setView('editor'),
    openGuide: () => vm.setView('guide'),
    openMaterials: () => noop('materials'),
    openInspiration: () => noop('inspiration'),
    openCharacterPanel: () => noop('character-panel'),
    openWorldSetting: () => noop('world-setting'),
    openExport: () => noop('export'),
    openHistory: () => noop('chapter-history'),
    toggleFullscreen: () => noop('fullscreen'),
    openBatchGeneration: () => noop('batch-generation'),
    openNotifications: () => noop('notifications'),
    openSettings: () => noop('settings'),
    openProfile: () => noop('profile'),
    openHelp: () => noop('help'),
    openFeedback: () => noop('feedback'),
  };

  return (
    <WorkspaceLayout
      topAppBar={
        <WorkspaceTopAppBar
          onOpenWorkspace={actions.openBookshelf}
          onOpenMaterials={actions.openMaterials}
          onOpenInspiration={actions.openInspiration}
          onPublishChapter={actions.openEditor}
          onOpenNotifications={actions.openNotifications}
          onOpenSettings={actions.openSettings}
          onOpenProfile={actions.openProfile}
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
            onOpenHelp={actions.openHelp}
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
            onOpenHistory={actions.openHistory}
            onToggleFullscreen={actions.toggleFullscreen}
          />
          <WorkspaceChapterContent paragraphs={vm.currentParagraphs()} />
          <WorkspaceAiProgressDock
            task={vm.aiTaskView()}
            onPause={vm.cancelRunningTask}
          />
        </div>
      }
      generationPanel={
        <div class="flex flex-col h-full">
          <header class="p-6 border-b border-[#cbc3d7] bg-white shrink-0">
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

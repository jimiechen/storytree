import { createSignal, createMemo } from 'solid-js';
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
import type { OutlineChapter } from './outline/workspace-outline-list';
import type { GenerationFormData } from './generation/workspace-generation-form';
import type { ContextOption } from './generation/workspace-context-options';
import type { AiTaskViewModel } from './ai-task/workspace-ai-progress-dock';

/** 静态章节列表（Stitch 04 code.html） */
const INITIAL_CHAPTERS: OutlineChapter[] = [
  { id: 'ch-1', title: '第1章 初入江湖', expanded: true, completed: false, starred: true },
  { id: 'ch-2', title: '第2章 命悬一线', expanded: false, completed: false, starred: false },
  { id: 'ch-3', title: '第3章 绝处逢生', expanded: false, completed: false, starred: false },
];

/** 静态生成参数 */
const INITIAL_GENERATION_DATA: GenerationFormData = {
  targetWords: 3000,
  tolerance: '±300',
  referenceChapters: 3,
  model: '豆包',
};

/** 静态上下文选项 */
const INITIAL_CONTEXT_OPTIONS: ContextOption[] = [
  { id: 'outline', label: '大纲和细纲', enabled: true },
  { id: 'summary', label: '已有正文摘要', enabled: true },
  { id: 'protagonist', label: '主角状态追踪', enabled: true },
  { id: 'relationships', label: '角色关系', enabled: true },
  { id: 'skills', label: '技能和道具状态', enabled: true },
  { id: 'events', label: '重要事件', enabled: false },
];

/** 静态 AI 任务 */
const INITIAL_AI_TASK: AiTaskViewModel = {
  running: true,
  title: '正在生成第3章...',
  progress: 67,
  preview: '林青衫剑走偏锋，堪堪避过那致命一击。他眼前一黑，只觉一股巨力从剑身传来，震得他虎口崩裂。',
};

/** 静态正文段落 */
const INITIAL_PARAGRAPHS = [
  '夜色如墨，厚重的云层遮挡了最后一丝月光。破旧的古刹在狂风中摇摇欲坠，发黑的木门发出令人牙酸的吱呀声。',
  '林青衫紧了紧手中的长剑，剑柄上的纹路因为常年握持已经有些平滑。他深吸一口气，空气中弥漫着淡淡的血腥味和陈年沉香的混合气息。这是他第一次独自执行师门任务，目标就在这扇门后。',
  '“既然来了，何必在门外吹冷风？” 一个沙哑低沉的声音突然从古刹内传出，仿佛就在耳边响起，震得林青衫耳膜微痛。',
  '... (后续内容待生成) ...',
];

interface WorkspaceProps {
  projectId: () => string;
}

/**
 * 小说项目工作台 — Stitch 04 三栏布局组装件
 *
 * 结构:
 *   WorkspaceLayout
 *   ├── topAppBar    → WorkspaceTopAppBar
 *   ├── sideNav      → WorkspaceSideNav + WorkspaceOutlineList
 *   ├── editor       → WorkspaceEditorHeader + WorkspaceChapterContent + WorkspaceAiProgressDock
 *   └── generationPanel → GenerationSettingsHeader + WorkspaceGenerationForm + WorkspaceContextOptions + WorkspaceActions
 */
export const Workspace: Component<WorkspaceProps> = () => {
  // === 左侧大纲状态 ===
  const [selectedChapterId, setSelectedChapterId] = createSignal('ch-1');
  const [chapters, setChapters] = createSignal<OutlineChapter[]>(INITIAL_CHAPTERS);

  // === 编辑器状态 ===
  const [paragraphs] = createSignal(INITIAL_PARAGRAPHS);

  // === 右侧生成设置状态 ===
  const [genData, setGenData] = createSignal<GenerationFormData>(INITIAL_GENERATION_DATA);
  const [contextOptions, setContextOptions] = createSignal<ContextOption[]>(INITIAL_CONTEXT_OPTIONS);

  // === AI 任务状态 ===
  const [aiTask, setAiTask] = createSignal<AiTaskViewModel | undefined>(INITIAL_AI_TASK);

  // === 派生值 ===
  const selectedChapterTitle = createMemo(() => {
    const ch = chapters().find((c) => c.id === selectedChapterId());
    return ch?.title ?? '未命名章节';
  });

  // === 大纲操作 ===
  const handleSelectChapter = (id: string) => setSelectedChapterId(id);

  const handleToggleExpand = (id: string) => {
    setChapters((prev) => prev.map((c) => (c.id === id ? { ...c, expanded: !c.expanded } : c)));
  };

  const handleToggleComplete = (id: string) => {
    setChapters((prev) => prev.map((c) => (c.id === id ? { ...c, completed: !c.completed } : c)));
  };

  const handleToggleStar = (id: string) => {
    setChapters((prev) => prev.map((c) => (c.id === id ? { ...c, starred: !c.starred } : c)));
  };

  // === 生成参数操作 ===
  const handleChangeTargetWords = (value: number) => {
    setGenData((prev) => ({ ...prev, targetWords: value }));
  };

  const handleChangeTolerance = (value: string) => {
    setGenData((prev) => ({ ...prev, tolerance: value }));
  };

  const handleChangeReferenceChapters = (value: number) => {
    setGenData((prev) => ({ ...prev, referenceChapters: value }));
  };

  const handleChangeModel = (value: string) => {
    setGenData((prev) => ({ ...prev, model: value }));
  };

  // === 上下文选项操作 ===
  const handleToggleOption = (id: string) => {
    setContextOptions((prev) => prev.map((o) => (o.id === id ? { ...o, enabled: !o.enabled } : o)));
  };

  // === AI 任务操作 ===
  const handlePause = () => {
    setAiTask((prev) => (prev ? { ...prev, running: false } : undefined));
  };

  // === 顶部导航占位回调 ===
  const noop = () => {};

  return (
    <WorkspaceLayout
      topAppBar={
        <WorkspaceTopAppBar
          onOpenWorkspace={noop}
          onOpenMaterials={noop}
          onOpenInspiration={noop}
          onPublishChapter={noop}
          onOpenNotifications={noop}
          onOpenSettings={noop}
          onOpenProfile={noop}
        />
      }
      sideNav={
        <div class="flex flex-col h-full">
          <WorkspaceSideNav
            projectName="长篇小说项目"
            lastEdited="最后编辑于 2小时前"
            onOpenOutline={noop}
            onOpenChapters={noop}
            onOpenCharacters={noop}
            onOpenWorldSetting={noop}
            onOpenExport={noop}
            onOpenHelp={noop}
            onOpenFeedback={noop}
            onGenerateOutline={noop}
            onGenerateDetail={noop}
          />
          <WorkspaceOutlineList
            chapters={chapters()}
            selectedId={selectedChapterId()}
            onSelectChapter={handleSelectChapter}
            onToggleExpand={handleToggleExpand}
            onToggleComplete={handleToggleComplete}
            onToggleStar={handleToggleStar}
          />
        </div>
      }
      editor={
        <div class="flex flex-col h-full relative">
          <WorkspaceEditorHeader
            chapterTitle={selectedChapterTitle()}
            onOpenHistory={noop}
            onToggleFullscreen={noop}
          />
          <WorkspaceChapterContent paragraphs={paragraphs()} />
          <WorkspaceAiProgressDock task={aiTask()} onPause={handlePause} />
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
              data={genData()}
              onChangeTargetWords={handleChangeTargetWords}
              onChangeTolerance={handleChangeTolerance}
              onChangeReferenceChapters={handleChangeReferenceChapters}
              onChangeModel={handleChangeModel}
            />
            <hr class="border-[#cbc3d7]" />
            <WorkspaceContextOptions
              options={contextOptions()}
              onToggleOption={handleToggleOption}
            />
          </div>
          <WorkspaceActions onStartGeneration={noop} onBatchGeneration={noop} />
        </div>
      }
    />
  );
};

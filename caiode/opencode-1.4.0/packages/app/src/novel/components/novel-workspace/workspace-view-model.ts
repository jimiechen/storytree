import { createSignal, createEffect } from 'solid-js';
import { useWorkspace } from '../../hooks/use-workspace';
import { useAITask } from '../../hooks/use-ai-task';
import { useNovelNavigation } from '../../hooks/use-novel-navigation';
import { DEFAULT_GENERATION_CONFIG } from '../../types/generation-config';

// ---------------------------------------------------------------------------
// 集中 UI 类型定义 — 所有子组件的 Props 类型从这里导入，避免重复定义
// ---------------------------------------------------------------------------

export type WorkspaceOutlineChapter = {
  id: string;
  title: string;
  expanded: boolean;
  completed: boolean;
  starred: boolean;
};

export type WorkspaceAiTaskView = {
  running: boolean;
  title: string;
  progress: number;
  preview: string;
};

export type WorkspaceGenerationConfigView = {
  targetWords: number;
  tolerance: string;
  referenceChapters: number;
  model: string;
};

export type WorkspaceContextOption = {
  id: string;
  label: string;
  enabled: boolean;
};

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

const FALLBACK_PARAGRAPHS = [
  '夜色如墨，厚重的云层遮挡了最后一丝月光。破旧的古刹在狂风中摇摇欲坠，发黑的木门发出令人牙酸的吱呀声。',
  '林青衫紧了紧手中的长剑，剑柄上的纹路因为常年握持已经有些平滑。他深吸一口气，空气中弥漫着淡淡的血腥味和陈年沉香的混合气息。这是他第一次独自执行师门任务，目标就在这扇门后。',
  '"既然来了，何必在门外吹冷风？" 一个沙哑低沉的声音突然从古刹内传出，仿佛就在耳边响起，震得林青衫耳膜微痛。',
];

const DEFAULT_CONTEXT_OPTIONS: WorkspaceContextOption[] = [
  { id: 'outline', label: '大纲和细纲', enabled: true },
  { id: 'summary', label: '已有正文摘要', enabled: true },
  { id: 'protagonist', label: '主角状态追踪', enabled: true },
  { id: 'relationships', label: '角色关系', enabled: true },
  { id: 'skills', label: '技能和道具状态', enabled: true },
  { id: 'events', label: '重要事件', enabled: false },
];

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

function splitContentToParagraphs(content: string): string[] {
  return content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// ViewModel
// ---------------------------------------------------------------------------

export function createWorkspaceViewModel(projectId: () => string) {
  const ws = useWorkspace(projectId);
  const ai = useAITask();
  const nav = useNovelNavigation();

  // === 本地 UI 状态：章节展开/收藏（Hook 数据无这些字段，由 ViewModel fallback） ===
  const [chapterUiState, setChapterUiState] = createSignal<
    Record<string, { expanded?: boolean; starred?: boolean }>
  >({});

  // === 本地 UI 状态：生成参数（后续替换为 Hook）===
  const [generationConfig, setGenerationConfig] = createSignal<WorkspaceGenerationConfigView>({
    targetWords: DEFAULT_GENERATION_CONFIG.targetWordCount,
    tolerance: `±${DEFAULT_GENERATION_CONFIG.wordCountTolerance}`,
    referenceChapters: DEFAULT_GENERATION_CONFIG.referenceChapterCount,
    model: DEFAULT_GENERATION_CONFIG.aiModel,
  });

  // === 本地 UI 状态：参考上下文选项 ===
  const [contextOptions, setContextOptions] = createSignal<WorkspaceContextOption[]>(
    DEFAULT_CONTEXT_OPTIONS,
  );

  // === 自动选中第一个章节（当列表加载完成且未选中时） ===
  createEffect(() => {
    const list = ws.chapters();
    if (list && list.length > 0 && !ws.selectedChapterId()) {
      ws.selectChapter(list[0].id);
    }
  });

  // === 派生数据：项目信息 ===
  const projectTitle = () => ws.project()?.name ?? '长篇小说项目';
  const lastEditedLabel = () => '最后编辑于 2小时前';

  // === 派生数据：章节列表（合并 Hook 数据 + 本地 UI 状态） ===
  const outlineChapters = (): WorkspaceOutlineChapter[] => {
    const list = ws.chapters() ?? [];
    const uiMap = chapterUiState();
    return list.map((ch) => {
      const ui = uiMap[ch.id] ?? {};
      return {
        id: ch.id,
        title: ch.title,
        expanded: ui.expanded ?? false,
        completed: ch.status === 'completed',
        starred: ui.starred ?? false,
      };
    });
  };

  // === 派生数据：当前章节 ===
  const currentChapterTitle = () => ws.selectedChapter()?.title ?? '未命名章节';

  const currentParagraphs = (): string[] => {
    const content = ws.selectedChapter()?.content ?? '';
    const paragraphs = splitContentToParagraphs(content);
    return paragraphs.length > 0 ? paragraphs : FALLBACK_PARAGRAPHS;
  };

  // === 派生数据：AI 任务视图 ===
  const aiTaskView = (): WorkspaceAiTaskView | undefined => {
    if (!ai.isRunning()) return undefined;
    const task = ai.currentTask();
    if (!task) return undefined;
    const previewText = task.output?.text?.slice(0, 120) ?? '';
    return {
      running: true,
      title: 'AI 正在生成...',
      progress: previewText.length > 0 ? 67 : 33,
      preview: previewText || '正在构思中...',
    };
  };

  // === 交互方法：章节 ===
  const selectChapter = (id: string) => ws.selectChapter(id);

  const toggleExpand = (id: string) => {
    setChapterUiState((prev) => ({
      ...prev,
      [id]: { ...prev[id], expanded: !(prev[id]?.expanded ?? false) },
    }));
  };

  const toggleStar = (id: string) => {
    setChapterUiState((prev) => ({
      ...prev,
      [id]: { ...prev[id], starred: !(prev[id]?.starred ?? false) },
    }));
  };

  // === 交互方法：生成参数 ===
  const updateGenerationConfig = (patch: Partial<WorkspaceGenerationConfigView>) => {
    setGenerationConfig((prev) => ({ ...prev, ...patch }));
  };

  // === 交互方法：上下文选项 ===
  const toggleContextOption = (id: string) => {
    setContextOptions((prev) => prev.map((o) => (o.id === id ? { ...o, enabled: !o.enabled } : o)));
  };

  // === 语义方法：AI 任务（封装底层 Hook 参数差异） ===
  const submitOutlineTask = async () => {
    const chapter = ws.selectedChapter();
    if (!chapter) return;
    await ai.submitTask({
      type: 'continue-writing',
      chapterId: chapter.id,
      text: `请为章节「${chapter.title}」生成大纲`,
    });
  };

  const submitDetailOutlineTask = async () => {
    const chapter = ws.selectedChapter();
    if (!chapter) return;
    await ai.submitTask({
      type: 'summarize-chapter',
      chapterId: chapter.id,
      text: `请为章节「${chapter.title}」生成细纲`,
    });
  };

  const submitChapterGenerationTask = async () => {
    const chapter = ws.selectedChapter();
    if (!chapter) return;
    await ai.submitTask({
      type: 'continue-writing',
      chapterId: chapter.id,
      text: chapter.content || `请生成章节「${chapter.title}」的正文内容`,
    });
  };

  const cancelRunningTask = async () => {
    const task = ai.currentTask();
    if (task) await ai.cancelTask(task.id);
  };

  return {
    // 数据
    projectTitle,
    lastEditedLabel,
    outlineChapters,
    selectedChapterId: ws.selectedChapterId,
    currentChapterTitle,
    currentParagraphs,
    generationConfig,
    contextOptions,
    aiTaskView,

    // 章节交互
    selectChapter,
    toggleExpand,
    toggleStar,

    // 生成设置交互
    updateGenerationConfig,
    toggleContextOption,

    // AI 任务语义方法
    submitOutlineTask,
    submitDetailOutlineTask,
    submitChapterGenerationTask,
    cancelRunningTask,

    // 导航（批次 4 使用 NovelNavigation）
    openView: nav.openView,
    openModal: nav.openModal,
  };
}

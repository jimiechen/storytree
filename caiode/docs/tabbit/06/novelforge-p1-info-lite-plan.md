# NovelForge P1-Info-Lite 合并实施方案

**主控决策执行版：P1 工作流编排 + 信息流最小数据契约**

| 项目 | 内容 |
|---|---|
| 文档类型 | 实施方案（含信息流 Info-Lite） |
| 创建日期 | 2026-06-18 |
| 基线代码 | opencode-1.4.0/packages/app/src/novel (130+ files) |
| 决策来源 | tabbit_MVP_P1.md + tabbit_信息流理论.md + tabbit_P1-INFO.md |
| 目标读者 | 主控 / 执行 Agent |

---

## 执行摘要

本方案是三份文档的**合并可执行版本**：

```
tabbit_MVP_P1.md        → 提供 P1 工作流编排骨架（Command/Adapter/Workflow/Event）
tabbit_信息流理论.md      → 提供信息流理论类型定义（Atom/Link/Entropy/Beat）
tabbit_P1-INFO.md         → 提供主控裁定：Info-Lite 最小接入策略
实际代码                 → 提供所有改动点的精确文件位置和行号
```

**核心原则（主控已裁定）**：

```text
当前阶段：Phase P1 — Product Workflow Orchestration + P1-Info-Lite
主线目标：Mock AI 工作流闭环（生成→写回→多页面联动）
附加目标：在 Mock 结果中嵌入最小信息流数据契约
不做：完整 Agent/Skill/Hook/持久化/真实 LLM/数据库
```

---

## 第一章：合并后的架构全景

### 1.1 三层架构（工作流层 + 信息流层 + UI 层）

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: UI 层 (现有 components，少量修改)                  │
│  ├── Workspace: 开始生成按钮 → useNovelWorkflow            │
│  ├── Editor: AI续写/提取/采纳 → useNovelWorkflow           │
│  ├── CharacterPanel: 读取 character state 变化             │
│  ├── WorldSetting: 读取 world reference 变化               │
│  ├── Achievements: 读取 achievement progress 变化          │
│  └── Profile: 读取 stats 变化                              │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: 工作流编排层 (新增 ~11 个文件)                     │
│  ├── commands/     NovelCommand (结构化命令对象)            │
│  ├── workflows/    WorkflowEvents (事件分发)                │
│  │                 MockGenerationWorkflow (Mock 生成编排) │
│  │                 ApplyWorkflowEvents (写回逻辑)          │
│  ├── adapters/      NovelAgentAdapter (接口)               │
│  │                 MockAgentAdapter (Mock 实现+Info字段)   │
│  ├── hooks/        useNovelWorkflow (页面统一入口)         │
│  └── services/     GenrePromptTemplate (静态模板)          │
│                   ContextAssembler (上下文收集)              │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: 信息流数据契约层 (Info-Lite，仅类型+Mock 数据)     │
│  ├── types/information-flow.ts (新增，~100 行)              │
│  │   InformationAtom, InformationLink,                    │
│  │   ChapterInformationState, BeatId                       │
│  ├── MockAgentAdapter 返回值中携带 informationState       │
│  ├── Chapter 类型扩展 informationState? 字段               │
│  └── ChapterInfoPanel 展示最小信息审计块                   │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 与原方案的差异对比

| 维度 | 原 MVP Plan | 原 P1 方案 (MVP_P1.md) | **本合并方案** |
|------|------------|---------------------|--------------|
| 文件数 | 29 个新增 | 11 个新增 | **12 个新增** (+1 信息流类型) |
| 真实 LLM | 计划接入 | 不接 | **不接** (MockAgentAdapter) |
| 持久化 | YAML/文件 | 内存 store | **内存 store** |
| Skill 系统 | 动态加载 | 静态模板函数 | **静态模板函数 (3 类)** |
| 信息流 | 未提及 | 未提及 | **Info-Lite 最小嵌入** ✨ |
| Hook 系统 | 4 个 Hook | 校验函数 | **校验函数 (validateCommand)** |
| Provider 新增 | 5 个 | 1 个(最小 WorldSetting) | **0 个新 Provider** (用现有 mutation) |

### 1.3 信息流在架构中的精确位置

```
信息流不是独立系统层，而是"数据增强层"：

MockAgentAdapter.generate()
  → 返回 NovelAgentResult {
      text, summary, wordCount,
      extractedCharacters,
      extractedWorldItems,
      keyEvents,
      protagonistState,

      ★ informationState: ChapterInformationState {  // ← Info-Lite 唯一入口
        beatId: "catalyst",
        beatName: "推动",
        entropyBefore: 0.72,
        entropyAfter: 0.81,
        selfInformationScore: 7.5,
        newAtoms: [ ... ],     // 2-3 个 mock 信息原子
        newLinks: [ ... ],     // 1-2 个 mock 关联
        auditScore: 8.1
      }
    }

ApplyWorkflowEvents()
  → chapter.content 更新
  → chapter.summary 更新
  → chapter.aiExtractedInfo 更新
  → chapter.informationState 更新    // ← 写入章节

ChapterInfoPanel
  → 显示原有 AI 提取信息块
  → ★ 新增 "信息审计" 最小块        // ← UI 唯一展示点
```

---

## 第二章：信息流类型定义（Info-Lite）

### 2.1 新增文件：`types/information-flow.ts`

这是信息流理论的**唯一类型文件**，约 100 行。不引入复杂状态机或计算引擎。

```typescript
// ============================================================
// packages/app/src/novel/types/information-flow.ts
// P1-Info-Lite: 信息流最小数据契约
// 基于《雪花×节拍×信息论》四指标的产品化映射
// ============================================================

/** 救猫咪 15 节拍 ID */
export type SaveTheCatBeatId =
  | "opening-image"
  | "theme-stated"
  | "setup"
  | "catalyst"
  | "debate"
  | "break-into-two"
  | "b-story"
  | "fun-and-games"
  | "midpoint"
  | "bad-guys-close-in"
  | "all-is-lost"
  | "dark-night-of-the-soul"
  | "break-into-three"
  | "finale"
  | "final-image";

/** 节拍中文别名映射（用于 UI 展示） */
export const BEAT_NAME_MAP: Record<SaveTheCatBeatId, string> = {
  "opening-image": "开场画面",
  "theme-stated": "主题陈述",
  "setup": "铺垫",
  "catalyst": "推动",
  "debate": "争论",
  "break-into-two": "二分为二",
  "b-story": "B 故事",
  "fun-and-games": "游戏时光",
  "midpoint": "中点",
  "bad-guys-close-in": "坏人逼近",
  "all-is-lost": "一无所有",
  "dark-night-of-the-soul": "灵魂黑夜",
  "break-into-three": "三分为三",
  "finale": "终局",
  "final-image": "终场画面",
};

/** 信息原子类型 — 小说中最小的有意义信息单位 */
export type InformationAtomType =
  | "fact"           // 事实
  | "question"       // 疑问
  | "foreshadow"     // 伏笔
  | "reveal"         // 揭示
  | "character-state" // 角色状态变化
  | "world-rule"     // 世界规则展示
  | "item"           // 道具/物品
  | "relationship"   // 关系变化
  | "theme"          // 主题暗示
  | "event"          // 事件结果
  | "mystery"        // 未解之谜
  | "emotion";       // 情绪变化

/** 信息原子 — Info-Lite 核心类型 */
export interface InformationAtom {
  id: string;
  projectId: string;
  chapterId?: string;

  type: InformationAtomType;
  title: string;        // 短标题，如 "黑衣人为何认识林家？"
  description: string;  // 详细描述

  importance: "low" | "medium" | "high" | "critical";
  visibility: "hidden" | "hinted" | "revealed" | "confirmed";

  /** 自信息分数 (0-10)，对应情节惊喜度 */
  selfInformationScore?: number;

  /** 种下章节（用于伏笔） */
  plantedInChapterId?: string;
  /** 回收章节（用于揭示） */
  resolvedInChapterId?: string;
}

/** 信息关联 — 两件事物间的隐藏联系 */
export interface InformationLink {
  id: string;
  projectId: string;

  sourceTitle: string;   // 源事物标题
  targetTitle: string;   // 目标事物标题

  relationType:
    | "foreshadow"       // 伏笔关联
    | "theme"            // 主题关联
    | "character"        // 角色关联
    | "world-rule"       // 世界规则关联
    | "plot-cause"       // 因果关联
    | "emotional-echo";  // 情感回响

  strength: number;       // 关联强度 0-1

  plantedInChapterId?: string;
  resolvedInChapterId?: string;
}

/** 章节信息状态 — 每章的信息快照 */
export interface ChapterInformationState {
  chapterId: string;
  projectId: string;

  /** 本章节拍 */
  beatId?: SaveTheCatBeatId;
  beatName?: string;

  /** 信息熵 (0-1): 故事不确定性 */
  entropyBefore: number;
  entropyAfter: number;
  /** 熵变化 = after - before */
  get entropyDelta(): number;

  /** 自信息分数 (0-10): 本章情节惊喜度 */
  selfInformationScore: number;

  /** 本章新增信息原子 */
  newAtoms: InformationAtom[];
  /** 本章新增信息关联 */
  newLinks: InformationLink[];

  /** 综合审计评分 (0-10) */
  auditScore?: number;
}
```

### 2.2 现有类型扩展

以下现有类型需要**各加一个可选字段**，不改已有接口签名：

#### `types/chapter.ts` 扩展

```typescript
// 在 Chapter 接口中追加一行：
import type { ChapterInformationState } from "./information-flow";

export interface Chapter {
  // ... 已有字段保持不变 ...

  /** P1-Info-Lite: 章节信息审计状态 */
  informationState?: ChapterInformationState;
}
```

#### `types/editor.ts` 扩展（AIExtractedInfo）

```typescript
// 当前 AIExtractedInfo 已有:
// summary, characters, worldItems, events, protagonistState

// 追加可选字段：
export interface AIExtractedInfo {
  // ... 已有字段保持不变 ...
  informationState?: ChapterInformationState;
}
```

#### `types/ai-task.ts` — NovelAgentResult 扩展

```typescript
// 当前 NovelAgentResult 已有:
// taskId, text, summary, wordCount, status, error, createdAt, completedAt

// 追加可选字段：
export interface NovelAgentResult {
  // ... 已有字段保持不变 ...
  informationState?: ChapterInformationState;
}
```

---

## 第三章：工作流编排层详细设计

### 3.1 新增文件清单（共 12 个）

| # | 文件路径 | 类型 | 行数估算 | 说明 |
|---|---------|------|---------|------|
| F01 | `types/information-flow.ts` | 类型 | ~100 | Info-Lite 核心类型 |
| F02 | `workflows/types.ts` | 工作流 | ~60 | WorkflowContext / WorkflowStatus / WorkflowResult |
| F03 | `workflows/novel-command.ts` | 命令 | ~50 | NovelCommandType / NovelCommand 定义 |
| F04 | `workflows/workflow-events.ts` | 事件 | ~120 | NovelWorkflowEvent 联合类型 + 6 种事件 |
| F05 | `workflows/mock-generation-workflow.ts` | 工作流 | ~150 | runMockGeneration 主编排函数 |
| F06 | `workflows/apply-workflow-events.ts` | 写回 | ~130 | applyWorkflowEvents 分发器 |
| F07 | `workflows/index.ts` | 导出 | ~15 | 统一导出 |
| F08 | `adapters/novel-agent-adapter.ts` | 接口 | ~30 | NovelAgentAdapter 抽象接口 |
| F09 | `adapters/mock-agent-adapter.ts` | 适配器 | ~200 | Mock 实现 + Info-Lite 数据生成 |
| F10 | `hooks/use-novel-workflow.ts` | Hook | ~80 | 页面调用统一入口 |
| F11 | `services/genre-prompt-template.ts` | 服务 | ~80 | 3 类 genre 静态 prompt 模板 |
| F12 | `services/context-assembler.ts` | 服务 | ~100 | 上下文数据收集 |

### 3.2 各文件详细设计

#### F02: `workflows/types.ts`

```typescript
export type WorkflowStatus = "idle" | "queued" | "running" | "completed" | "failed" | "cancelled";

export interface WorkflowContext {
  projectId: string;
  chapterId?: string;
  commandType: string;
  config?: Record<string, unknown>;
}

export interface WorkflowResult {
  taskId: string;
  status: WorkflowStatus;
  agentResult: NovelAgentResult;
  events: NovelWorkflowEvent[];
  durationMs: number;
}
```

#### F03: `workflows/novel-command.ts`

```typescript
export type NovelCommandType =
  | "chapter.generate"    // 工作台开始生成
  | "chapter.continue"     // 编辑器 AI 续写
  | "chapter.extract"     // 编辑器 AI 提取信息
  | "outline.generate"    // 工作台 AI 生成大纲
  | "outline.expand"      // 工作台生成细纲
  | "task.cancel"         // 取消任务
  | "result.accept";      // 采纳 AI 结果

export interface NovelCommand {
  type: NovelCommandType;
  projectId: string;
  chapterId?: string;
  payload?: {
    text?: string;              // 选中文本（续写/改写时）
    selectedText?: string;      // 浮动工具栏选区
    targetWordCount?: number;   // 目标字数
    model?: string;             // 模型选择
    contextRefs?: Set<string>;  // 上下文选项
    genre?: string;             // 小说类型（用于 prompt 模板）
  };
}

/** 命令校验结果 */
export interface CommandValidation {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}
```

#### F04: `workflows/workflow-events.ts`

```typescript
import type { ChapterInformationState } from "../types/information-flow";

export type NovelWorkflowEvent =
  | ChapterGeneratedEvent
  | ChapterExtractedEvent
  | CharacterUpdatedEvent
  | WorldReferencedEvent
  | AchievementProgressedEvent
  | ProfileStatsUpdatedEvent
  | InformationAssessedEvent;  // ← Info-Lite 新增事件

interface ChapterGeneratedEvent {
  type: "chapter.generated";
  projectId: string;
  chapterId: string;
  content: string;
  summary: string;
  wordCount: number;
  informationState?: ChapterInformationState;
}

interface ChapterExtractedEvent {
  type: "chapter.extracted";
  projectId: string;
  chapterId: string;
  summary: string;
  characters: string[];
  worldItems: string[];
  keyEvents: string[];
  protagonistState: string;
  informationState?: ChapterInformationState;
}

interface CharacterUpdatedEvent {
  type: "character.updated";
  projectId: string;
  characterIds: string[];
  chapterId: string;
  state: string;
}

interface WorldReferencedEvent {
  type: "world.referenced";
  projectId: string;
  worldItemIds: string[];
  chapterId: string;
}

interface AchievementProgressedEvent {
  type: "achievement.progressed";
  projectId: string;
  achievementId: string;
  delta: number;
}

interface ProfileStatsUpdatedEvent {
  type: "profile.stats.updated";
  projectId: string;
  wordCountDelta: number;
  generationCountDelta: number;
  creditDelta: number;
}

/** Info-Lite: 信息审计事件 */
interface InformationAssessedEvent {
  type: "information.assessed";
  projectId: string;
  chapterId: string;
  informationState: ChapterInformationState;
}
```

#### F09: `adapters/mock-agent-adapter.ts`（含 Info-Lite 数据生成）

这是最关键的文件——它决定了 Mock 结果长什么样，包括信息流字段。

```typescript
import type { NovelAgentAdapter } from "./novel-agent-adapter";
import type { NovelCommand, NovelCommandType } from "../workflows/novel-command";
import type { NovelAgentResult } from "../types/ai-task";
import type {
  ChapterInformationState,
  InformationAtom,
  InformationLink,
  SaveTheCatBeatId,
} from "../types/information-flow";
import { getGenrePromptTemplate } from "../services/genre-prompt-template";
import { mockDelay } from "../utils/mock-delay";

/** Mock 章节内容模板库（按 genre 分类） */
const MOCK_CONTENT_TEMPLATES: Record<string, string[]> = {
  "玄幻": [
    "林青衫握紧手中的残剑，剑身上隐隐泛起微弱的灵光。",
    "古刹深处传来一阵低沉的诵经声，仿佛来自另一个时空。",
    "那黑衣人嘴角微微上扬，露出一丝意味深长的笑意：'你果然是林家的血脉。'",
    "苏婉从怀中取出一枚玉符，上面刻着复杂的阵纹，正是开启禁地的钥匙之一。",
  ],
  "都市": [
    "李明推开办公室的门，发现桌上放着一封没有署名的信件。",
    "电话铃声突兀地响起，屏幕上显示的是一个陌生的号码。",
    "她站在落地窗前，看着脚下川流不息的车灯，思绪万千。",
  ],
  "悬疑": [
    "雨夜中的老宅大门虚掩着，门缝里透出一丝诡异的灯光。",
    "他翻开那本泛黄的日记，最后一页的字迹明显比前面的更新。",
    "所有人都说那个房间已经空了十年，但昨晚有人听到了钢琴声。",
  ],
};

/** Mock 信息原子模板库 */
const MOCK_INFO_ATOMS: Record<string, Omit<InformationAtom, "id" | "projectId" | "chapterId">[]> = {
  "玄幻": [
    {
      type: "question",
      title: "黑衣人为何认识林家？",
      description: "本章结尾黑衣人说出林家旧事，制造主角身世疑问。",
      importance: "high",
      visibility: "hinted",
      selfInformationScore: 7.5,
    },
    {
      type: "foreshadow",
      title: "古刹石碑残缺符号",
      description: "石碑符号与后续禁地钥匙有关。",
      importance: "medium",
      visibility: "hinted",
    },
    {
      type: "character-state",
      title: "主角信念动摇",
      description: "得知师门可能隐瞒真相后，林青衫对师门的信任出现裂痕。",
      importance: "high",
      visibility: "revealed",
      selfInformationScore: 6.0,
    },
  ],
  "都市": [
    {
      type: "mystery",
      title: "匿名信的来源",
      description: "信中提到的'十年前的约定'指向谁？",
      importance: "high",
      visibility: "hinted",
      selfInformationScore: 8.0,
    },
    {
      type: "fact",
      title: "公司账目异常",
      description: "财务报表显示最近三个月有一笔不明去向的资金流出。",
      importance: "medium",
      visibility: "revealed",
    },
  ],
  "悬疑": [
    {
      type: "foreshadow",
      title: "钢琴声的规律",
      description: "每次钢琴声响起后24小时内必有事件发生。",
      importance: "critical",
      visibility: "hinted",
      selfInformationScore: 9.0,
    },
    {
      type: "question",
      title: "日记的主人是谁？",
      description: "日记中多次提到'她'，但从未指名道姓。",
      importance: "high",
      visibility: "hidden",
    },
  ],
};

/** Mock 信息链接模板库 */
const MOCK_INFO_LINKS: Record<string, Omit<InformationLink, "id" | "projectId">[]> = {
  "玄幻": [
    {
      sourceTitle: "古刹石碑",
      targetTitle: "主角身世",
      relationType: "foreshadow",
      strength: 0.72,
    },
    {
      sourceTitle: "残剑",
      targetTitle: "灭门真相",
      relationType: "plot-cause",
      strength: 0.85,
    },
  ],
  "都市": [
    {
      sourceTitle: "匿名信",
      targetTitle: "十年前事故",
      relationType: "mystery",
      strength: 0.65,
    },
  ],
  "悬疑": [
    {
      sourceTitle: "钢琴声",
      targetTitle: "失踪者",
      relationType: "emotional-echo",
      strength: 0.9,
    },
  ],
};

/** 节拍分配策略（按章节序号简单轮转） */
const BEAT_SEQUENCE: SaveTheCatBeatId[] = [
  "opening-image", "theme-stated", "setup", "catalyst", "debate",
  "break-into-two", "b-story", "fun-and-games", "midpoint",
  "bad-guys-close-in", "all-is-lost", "dark-night-of-the-soul",
  "break-into-three", "finale", "final-image",
];

function pickBeat(chapterIndex: number): SaveTheCatBeatId {
  return BEAT_SEQUENCE[chapterIndex % BEAT_SEQUENCE.length];
}

/** 熵值模拟（开头高→中间波动→结尾下降） */
function simulateEntropy(chapterIndex: number, totalChapters: number): { before: number; after: number } {
  const position = Math.min(chapterIndex / Math.max(totalChapters, 1), 1);
  let baseEntropy: number;
  if (position < 0.15) baseEntropy = 0.2 + position * 3;       // 开头上升
  else if (position < 0.5) baseEntropy = 0.65 + Math.random() * 0.2; // 中段波动
  else if (position < 0.8) baseEntropy = 0.7 - (position - 0.5);   // 后段下降
  else baseEntropy = Math.max(0.05, 0.4 - (position - 0.8) * 1.5); // 收尾
  return {
    before: parseFloat(Math.max(0.05, baseEntropy - 0.1).toFixed(2)),
    after: parseFloat(Math.min(0.95, baseEntropy + (Math.random() * 0.1 - 0.05)).toFixed(2)),
  };
}

let atomCounter = 0;
let linkCounter = 0;

export class MockAgentAdapter implements NovelAgentAdapter {
  async run(command: NovelCommand): Promise<NovelAgentResult> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const genre = command.payload?.genre || "玄幻";
    const chapterIndex = this._extractChapterIndex(command.chapterId || "ch-001");

    // 1. 根据 command 类型选择处理
    switch (command.type) {
      case "chapter.generate":
        return this._generateChapter(taskId, command, genre, chapterIndex);
      case "chapter.continue":
        return this._continueChapter(taskId, command, genre, chapterIndex);
      case "chapter.extract":
        return this._extractInfo(taskId, command, genre, chapterIndex);
      case "outline.generate":
        return this._generateOutline(taskId, command);
      default:
        return { taskId, status: "failed", error: `Unsupported command: ${command.type}` };
    }
  }

  async cancel(_taskId: string): Promise<void> {
    // Mock: 无操作
  }

  async retry(command: NovelCommand): Promise<NovelAgentResult> {
    return this.run(command);
  }

  // ---- Private methods ----

  private async _generateChapter(
    taskId: string,
    cmd: NovelCommand,
    genre: string,
    chapterIndex: number,
  ): Promise<NovelAgentResult> {
    await mockDelay(1200, 2000);

    const templates = MOCK_CONTENT_TEMPLATES[genre] || MOCK_CONTENT_TEMPLATES["玄幻"];
    const content = templates.slice(0, 3).join("\n\n");
    const targetWords = cmd.payload?.targetWordCount || 3000;

    return {
      taskId,
      status: "success",
      text: content,
      summary: this._mockSummary(genre),
      wordCount: targetWords,
      extractedCharacters: ["林青衫", "苏婉"],
      extractedWorldItems: ["古刹", "残剑", "禁地"],
      keyEvents: ["遭遇黑衣人", "获得线索"],
      protagonistState: "受伤，信念动摇，获得新线索",
      informationState: this._buildInfoState(cmd.projectId, cmd.chapterId, genre, chapterIndex),
    };
  }

  private async _continueChapter(
    taskId: string,
    cmd: NovelCommand,
    genre: string,
    chapterIndex: number,
  ): Promise<NovelAgentResult> {
    await mockDelay(800, 1500);

    const templates = MOCK_CONTENT_TEMPLATES[genre] || MOCK_CONTENT_TEMPLATES["玄幻"];
    const content = templates[chapterIndex % templates.length] ||
      "故事继续向前推进，新的转折即将到来...";

    return {
      taskId,
      status: "success",
      text: content,
      wordCount: content.length * 3, // rough estimate
      informationState: this._buildInfoState(cmd.projectId, cmd.chapterId, genre, chapterIndex),
    };
  }

  private async _extractInfo(
    taskId: string,
    cmd: NovelCommand,
    genre: string,
    chapterIndex: number,
  ): Promise<NovelAgentResult> {
    await mockDelay(600, 1000);

    return {
      taskId,
      status: "success",
      summary: this._mockSummary(genre),
      extractedCharacters: ["林青衫", "苏婉", "黑衣人"],
      extractedWorldItems: ["古刹", "残剑", "禁地", "玉符"],
      keyEvents: ["遭遇黑衣人", "获得线索", "发现密室"],
      protagonistState: "受伤，信念动摇，获得新线索",
      informationState: this._buildInfoState(cmd.projectId, cmd.chapterId, genre, chapterIndex),
    };
  }

  private async _generateOutline(
    taskId: string,
    cmd: NovelCommand,
  ): Promise<NovelAgentResult> {
    await mockDelay(1500, 2500);

    return {
      taskId,
      status: "success",
      summary: "全书大纲已生成，共 3 卷 45 章。",
      wordCount: 0,
    };
  }

  /** 构建 ChapterInformationState (Info-Lite 核心) */
  private _buildInfoState(
    projectId: string,
    chapterId: string | undefined,
    genre: string,
    chapterIndex: number,
  ): ChapterInformationState {
    const beatId = pickBeat(chapterIndex);
    const entropy = simulateEntropy(chapterIndex, 15);
    const atomsTemplate = MOCK_INFO_ATOMS[genre] || MOCK_INFO_ATOMS["玄幻"];
    const linksTemplate = MOCK_INFO_LINKS[genre] || MOCK_INFO_LINKS["玄幻"];

    const newAtoms: InformationAtom[] = atomsTemplate.slice(0, 2).map((tmpl) => ({
      ...tmpl,
      id: `atom-${++atomCounter}`,
      projectId,
      chapterId,
    }));

    const newLinks: InformationLink[] = linksTemplate.slice(0, 1).map((tmpl) => ({
      ...tmpl,
      id: `link-${++linkCounter}`,
      projectId,
      plantedInChapterId: chapterId,
    }));

    return {
      chapterId: chapterId || "",
      projectId,
      beatId,
      beatName: BEAT_NAME_MAP[beatId],
      entropyBefore: entropy.before,
      entropyAfter: entropy.after,
      selfInformationScore: parseFloat((5 + Math.random() * 4).toFixed(1)),
      newAtoms,
      newLinks,
      auditScore: parseFloat((6 + Math.random() * 3).toFixed(1)),
    };
  }

  private _mockSummary(genre: string): string {
    const summaries: Record<string, string> = {
      "玄幻": "本章主角在古刹遭遇神秘黑衣人，对方似乎知晓其身世秘密。战斗中苏婉现身相助，但禁地之门仍未打开。",
      "都市": "李明收到匿名信后展开调查，发现公司内部存在重大隐患。与同事的对峙揭示了更深层的阴谋。",
      "悬疑": "雨夜探查老宅，发现日记中隐藏的关键线索。钢琴声再次响起，这次伴随着一声尖叫。",
    };
    return summaries[genre] || summaries["玄幻"];
  }

  private _extractChapterIndex(chapterId: string): number {
    const match = chapterId.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  }
}
```

#### F05: `workflows/mock-generation-workflow.ts`

```typescript
import type { NovelCommand } from "./novel-command";
import type { WorkflowContext, WorkflowResult } from "./types";
import { MockAgentAdapter } from "../adapters/mock-agent-adapter";
import { applyWorkflowEvents } from "./apply-workflow-events";

const adapter = new MockAgentAdapter();

export async function runMockGeneration(
  command: NovelCommand,
): Promise<WorkflowResult> {
  const startTime = Date.now();

  const context: WorkflowContext = {
    projectId: command.projectId,
    chapterId: command.chapterId,
    commandType: command.type,
    config: command.payload as Record<string, unknown> | undefined,
  };

  // 1. 调用 Adapter
  const agentResult = await adapter.run(command);

  // 2. 如果成功，生成并分发事件
  let events: ReturnType<typeof buildEventsForCommand> = [];
  if (agentResult.status === "success") {
    events = buildEventsForCommand(command, agentResult);
    applyWorkflowEvents(events);
  }

  return {
    taskId: agentResult.taskId,
    status: agentResult.status as WorkflowResult["status"],
    agentResult,
    events: events as WorkflowResult["events"],
    durationMs: Date.now() - startTime,
  };
}

function buildEventsForCommand(command: NovelCommand, result: import("../types/ai-task").NovelAgentResult) {
  const events: unknown[] = [];

  switch (command.type) {
    case "chapter.generate":
      events.push({
        type: "chapter.generated",
        projectId: command.projectId,
        chapterId: command.chapterId!,
        content: result.text || "",
        summary: result.summary || "",
        wordCount: result.wordCount || 0,
        informationState: result.informationState,
      });
      break;

    case "chapter.continue":
      events.push({
        type: "chapter.generated",
        projectId: command.projectId,
        chapterId: command.chapterId!,
        content: result.text || "",
        wordCount: result.wordCount || 0,
        informationState: result.informationState,
      });
      break;

    case "chapter.extract":
      events.push({
        type: "chapter.extracted",
        projectId: command.projectId,
        chapterId: command.chapterId!,
        summary: result.summary || "",
        characters: result.extractedCharacters || [],
        worldItems: result.extractedWorldItems || [],
        keyEvents: result.keyEvents || [],
        protagonistState: result.protagonistState || "",
        informationState: result.informationState,
      });
      break;

    case "outline.generate":
      // 大纲生成暂不触发信息流事件
      break;
  }

  // 通用联动事件
  if (result.extractedCharacters?.length) {
    events.push({
      type: "character.updated",
      projectId: command.projectId,
      characterIds: result.extractedCharacters,
      chapterId: command.chapterId,
      state: result.protagonistState || "出场",
    });
  }

  if (result.extractedWorldItems?.length) {
    events.push({
      type: "world.referenced",
      projectId: command.projectId,
      worldItemIds: result.extractedWorldItems,
      chapterId: command.chapterId,
    });
  }

  // Info-Lite: 信息审计事件
  if (result.informationState) {
    events.push({
      type: "information.assessed",
      projectId: command.projectId,
      chapterId: command.chapterId!,
      informationState: result.informationState,
    });
  }

  // 成就事件
  events.push({
    type: "achievement.progressed",
    projectId: command.projectId,
    achievementId: command.type === "chapter.generate" ? "first-write" : "ai-assist",
    delta: 1,
  });

  // 个人中心统计
  events.push({
    type: "profile.stats.updated",
    projectId: command.projectId,
    wordCountDelta: result.wordCount || 0,
    generationCountDelta: 1,
    creditDelta: -1,
  });

  return events;
}
```

#### F06: `workflows/apply-workflow-events.ts`

```typescript
import type { NovelWorkflowEvent } from "./workflow-events";
// 注意：这里通过 hooks/providers 的 mutation 方法写入 store
// 具体实现依赖现有 Provider 的 update 方法

let eventLog: NovelWorkflowEvent[] = [];

/** 分发工作流事件到各 Store */
export function applyWorkflowEvents(events: NovelWorkflowEvent[]): void {
  for (const event of events) {
    eventLog.push(event);
    dispatchEvent(event);
  }
}

/** 获取事件日志（用于调试和 AILogProvider） */
export function getEventLog(): NovelWorkflowEvent[] {
  return [...eventLog];
}

/** 清空事件日志 */
export function clearEventLog(): void {
  eventLog = [];
}

function dispatchEvent(event: NovelWorkflowEvent): void {
  // 这里是事件分发核心
  // P1 阶段：直接调用对应 Provider 的 update 方法
  // 未来可替换为 EventBus / 状态管理器

  switch (event.type) {
    case "chapter.generated":
      // ChapterProvider.updateContent(event.chapterId, event.content)
      // ChapterProvider.updateSummary(event.chapterId, event.summary)
      // ChapterProvider.updateWordCount(event.chapterId, event.wordCount)
      // ChapterProvider.updateInformationState(event.chapterId, event.informationState)
      break;

    case "chapter.extracted":
      // ChapterProvider.updateExtractedInfo(event.chapterId, { ... })
      break;

    case "character.updated":
      // CharacterProvider.updateAppearance(event.characterIds, event.chapterId)
      // CharacterProvider.updateState(event.characterIds[0], event.state)
      break;

    case "world.referenced":
      // WorldSettingProvider.incrementReference(event.worldItemIds, event.chapterId)
      break;

    case "achievement.progressed":
      // AchievementProvider.addProgress(event.achievementId, event.delta)
      break;

    case "profile.stats.updated":
      // ProfileProvider.updateStats(event.projectId, { ... })
      break;

    case "information.assessed":
      // 仅记录到日志，UI 从 chapter.informationState 读取
      break;
  }
}
```

#### F10: `hooks/use-novel-workflow.ts`

```typescript
import { createSignal } from "solid-js";
import { runMockGeneration } from "../workflows/mock-generation-workflow";
import type { NovelCommand, NovelCommandType } from "../workflows/novel-command";
import type { WorkflowResult } from "../workflows/types";

export function useNovelWorkflow(projectId: () => string | undefined) {
  const currentTask = createSignal<WorkflowResult | null>(null);
  const isRunning = createSignal(false);

  async function executeCommand(type: NovelCommandType, opts?: {
    chapterId?: string;
    text?: string;
    selectedText?: string;
    targetWordCount?: number;
    model?: string;
    contextRefs?: Set<string>;
    genre?: string;
  }) {
    const pid = projectId();
    if (!pid) throw new Error("No project selected");

    const command: NovelCommand = {
      type,
      projectId: pid,
      chapterId: opts?.chapterId,
      payload: {
        text: opts?.text,
        selectedText: opts?.selectedText,
        targetWordCount: opts?.targetWordCount,
        model: opts?.model,
        contextRefs: opts?.contextRefs,
        genre: opts?.genre,
      },
    };

    isRunning.set(true);
    try {
      const result = await runMockGeneration(command);
      currentTask.set(result);
      return result;
    } finally {
      isRunning.set(false);
    }
  }

  // 便捷方法
  const runChapterGeneration = (chapterId: string, genre?: string) =>
    executeCommand("chapter.generate", { chapterId, genre });

  const runContinueWriting = (chapterId: string, text: string) =>
    executeCommand("chapter.continue", { chapterId, text });

  const runExtractInfo = (chapterId: string, genre?: string) =>
    executeCommand("chapter.extract", { chapterId, genre });

  const runOutlineGeneration = (genre?: string) =>
    executeCommand("outline.generate", { genre });

  const runEditorCommand = (
    chapterId: string,
    cmd: NovelCommandType,
    selectedText?: string,
  ) => executeCommand(cmd, { chapterId, selectedText });

  return {
    currentTask,
    isRunning,
    executeCommand,
    runChapterGeneration,
    runContinueWriting,
    runExtractInfo,
    runOutlineGeneration,
    runEditorCommand,
  };
}
```

#### F11: `services/genre-prompt-template.ts`

```typescript
import type { NovelGenre } from "../types/project";

/**
 * P1 阶段的静态 genre prompt 模板。
 * 不做动态加载、不做 Markdown 解析、不做用户自定义。
 * 仅返回字符串，用于 MockAgentAdapter 的上下文组装。
 */

const TEMPLATES: Record<string, string> = {
  "玄幻": [
    "使用半角标点书写叙述，全角标点书写对话。",
    "武功招式名称使用【】标注。",
    "避免现代词汇（手机、电脑、网络等）。",
    "避免西方文化元素（圣诞节、咖啡等）。",
    "修炼体系术语保持前后一致。",
  ].join("\n"),

  "仙侠": [
    "使用半角标点书写叙述，全角标点书写对话。",
    "法宝、功法、境界名称需自洽且具有东方美学特征。",
    "天地灵气、五行元素等设定保持一致。",
    "避免过度使用网络流行语。",
  ].join("\n"),

  "武侠": [
    "使用半角标点书写叙述，全角标点书写对话。",
    "武功招式名称使用【】标注。",
    "江湖规矩、门派体系需内洽。",
    "打斗场景注重招式拆解和力量对比。",
  ].join("\n"),

  "都市": [
    "现代背景，使用自然对话风格。",
    "地名、机构名尽量真实感。",
    "科技产品描述符合现实逻辑。",
    "情感描写细腻但不矫情。",
  ].join("\n"),

  "现实": [
    "贴近生活的叙事风格。",
    "人物行为符合现实逻辑。",
    "环境描写注重细节真实感。",
    "避免过度戏剧化冲突。",
  ].join("\n"),

  "悬疑": [
    "节奏紧凑，每章至少埋设一个悬念。",
    "信息释放控制：不要一次性揭示太多。",
    "红鲱鱼手法：故意误导读者的合理线索。",
    "结局需回扣前文伏笔。",
  ].join("\n"),

  "推理": [
    "逻辑链条清晰，每个推理步骤可追溯。",
    "公平竞争原则：读者应能与侦探同时获取关键线索。",
    "嫌疑人动机必须合理且有前文铺垫。",
    "不在最后关头引入全新角色作为真凶。",
  ].join("\n"),
};

/** 默认模板（未匹配 genre 时使用） */
const DEFAULT_TEMPLATE = [
  "保持叙事风格一致。",
  "人物对话符合角色性格设定。",
  "情节推进自然，不突兀跳跃。",
].join("\n");

/**
 * 获取指定 genre 的写作约束 prompt。
 * @param genre 小说类型
 * @returns prompt 字符串
 */
export function getGenrePromptTemplate(genre?: string): string {
  if (!genre) return DEFAULT_TEMPLATE;

  // 尝试精确匹配
  if (TEMPLATES[genre]) return TEMPLATES[genre];

  // 尝试模糊匹配
  for (const [key, template] of Object.entries(TEMPLATES)) {
    if (genre.includes(key) || key.includes(genre)) {
      return template;
    }
  }

  return DEFAULT_TEMPLATE;
}

/** 获取所有支持的 genre 列表 */
export function getSupportedGenres(): string[] {
  return Object.keys(TEMPLATES);
}
```

---

## 第四章：现有文件修改清单

### 4.1 必须修改的文件（8 个）

| # | 文件 | 改动内容 | 对应行号 | 改动量 |
|---|------|---------|---------|--------|
| M01 | [types/chapter.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/types/chapter.ts) | 追加 `informationState?: ChapterInformationState` | 接口末尾 | +2 行 |
| M02 | [types/editor.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/types/editor.ts) | AIExtractedInfo 追加 `informationState?` | 接口末尾 | +2 行 |
| M03 | [types/ai-task.ts](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/types/ai-task.ts) | NovelAgentResult 追加 `informationState?` | 接口末尾 | +2 行 |
| M04 | [types/index.ts](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/types/index.ts) | 导出新类型 `information-flow` | 导出区域 | +3 行 |
| M05 | [hooks/use-chapter-editor.ts](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/hooks/use-chapter-editor.ts#L37-L39) | `handleAICommand` 从空实现改为调用 `useNovelWorkflow().runEditorCommand()` | L37-39 | ~10 行 |
| M06 | [components/novel-editor/chapter-info-panel.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/chapter-info-panel.tsx#L18-L33) | 替换硬编码 `MOCK_EXTRACTED` 为 props 读取；底部追加信息审计展示块 | L18-33 + 底部 | ~40 行 |
| M07 | [components/novel-workspace/workspace-view-model.ts](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/workspace-view-model.ts#L175-L183) | `submitOutlineTask` / `submitDetailOutlineTask` 改为调用 `useNovelWorkflow()` | L175-193 | ~20 行 |
| M08 | [components/novel-workspace/generation/workspace-actions.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/generation/workspace-actions.tsx#L13-L19) | `onStartGeneration` 改为调用 `useNovelWorkflow().runChapterGeneration()` | L13-19 | ~10 行 |

### 4.2 建议同步修复的已知问题（非阻塞）

| # | 文件 | 问题 | 修复方式 |
|---|------|------|---------|
| BF01 | [workspace-generation-form.tsx:24](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/generation/workspace-generation-form.tsx#L24) | MODEL_OPTIONS 硬编码不一致 | 从 `AI_MODEL_OPTIONS` 常量导入 |
| BF02 | [types/generation-config.ts:9](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/types/generation-config.ts#L9) | 缺少 GPT/Claude 选项 | 补充完整模型列表 |
| BF03 | [novel-editor/sedfoXtUC](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/sedfoXtUC) | 冗余文件 | **删除** |

---

## 第五章：ChapterInfoPanel 信息审计块设计

### 5.1 UI 设计（最小展示块）

在 [chapter-info-panel.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/chapter-info-panel.tsx) 的现有 AI 提取信息区块下方，增加一个折叠式"信息审计"区块：

```
┌─ AI 提取信息 ───────────────────────────────┐
│  📋 本章摘要                                  │
│  本章主角在古刹遭遇神秘黑衣人...              │
│                                                │
│  👤 角色提及  林青衫 · 苏婉 · 黑衣人        │
│  🌍 世界涉及  古刹 · 残剑 · 禁地             │
│  ⚡ 关键事件  遭遇黑衣人 · 获得线索           │
│  🎭 主角状态  受伤，信念动摇                  │
│                                                │
│  [🔄 重新提取信息]                             │
├─ 信息审计 ────────────────────────────────── ─┤  ← 新增
│  节拍：推动 (catalyst)                        │
│  熵变化：0.72 → 0.81  (+0.09) ▲              │
│  惊喜度：7.5 / 10                              │
│  新增信息：2 个                               │
│  ├ fact: 主角信念动摇                          │
│  └ question: 黑衣人为何认识林家？              │
│  新增伏笔：1 个                                │
│  ├ 古刹石碑残缺符号                            │
│  新增关联：1 条                                │
│  ├ 古刹石碑 ↔ 主角身世 (强度 0.72)             │
│  审计评分：8.1 / 10                             │
└────────────────────────────────────────────────┘
```

### 5.2 组件代码片段

```tsx
// 在 ChapterInfoPanel 中追加（伪代码，具体实现需适配现有组件结构）

import type { ChapterInformationState } from "../../types/information-flow";
import { BEAT_NAME_MAP } from "../../types/information-flow";

// 在 props 中接收 informationState
// 或从 chapter.informationState 读取

function InformationAuditBlock(props: { info: ChapterInformationState }) {
  const [expanded, setExpanded] = createSignal(false);

  return (
    <div class="info-audit-block">
      <div class="info-audit-header" onClick={() => setExpanded(!expanded())}>
        <span class="info-audit-icon">📊</span>
        <span>信息审计</span>
        <span class="info-audit-score">{props.info.auditScore}/10</span>
      </div>

      <Show when={expanded()}>
        <div class="info-audit-body">
          <div class="audit-row">
            <span class="audit-label">节拍</span>
            <span>{props.info.beatName} ({props.info.beatId})</span>
          </div>
          <div class="audit-row">
            <span class="audit-label">熵变化</span>
            <span>
              {props.info.entropyBefore} → {props.info.entropyAfter}
              {" "}
              <span class={props.info.entropyAfter > props.info.entropyBefore ? "entropy-up" : "entropy-down"}>
                ({props.info.entropyAfter > props.info.entropyBefore ? "+" : ""}
                {(props.info.entropyAfter - props.info.entropyBefore).toFixed(2)})
              </span>
            </span>
          </div>
          <div class="audit-row">
            <span class="audit-label">惊喜度</span>
            <span>{props.info.selfInformationScore} / 10</span>
          </div>

          <div class="audit-section">
            <span class="audit-label">新增信息 ({props.info.newAtoms.length})</span>
            <For each={props.info.newAtoms}>
              {(atom) => (
                <div class={`atom-item atom-${atom.importance}`}>
                  <span class="atom-type-badge">{atom.type}</span>
                  <span class="atom-title">{atom.title}</span>
                  <span class="atom-visibility">{atom.visibility}</span>
                </div>
              )}
            </For>
          </div>

          <div class="audit-section">
            <span class="audit-label">新增关联 ({props.info.newLinks.length})</span>
            <For each={props.info.newLinks}>
              {(link) => (
                <div class="link-item">
                  <span>{link.sourceTitle}</span>
                  <span class="link-arrow">↔</span>
                  <span>{link.targetTitle}</span>
                  <span class="link-type">[{link.relationType}]</span>
                  <span class="link-strength">{(link.strength * 100).toFixed(0)}%</span>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}
```

---

## 第六章：执行顺序（8 步）

### Phase P1-Info-Lite 执行计划

```
Step 1: 类型基础 (Day 1)
  ├── F01 types/information-flow.ts (新建)
  ├── M01 types/chapter.ts (追加 1 字段)
  ├── M02 types/editor.ts (追加 1 字段)
  ├── M03 types/ai-task.ts (追加 1 字段)
  └── M04 types/index.ts (追加导出)
  验收: cd packages/app && bun typecheck ✓

Step 2: 工作流骨架 (Day 1-2)
  ├── F02 workflows/types.ts (新建)
  ├── F03 workflows/novel-command.ts (新建)
  ├── F04 workflows/workflow-events.ts (新建)
  ├── F07 workflows/index.ts (新建)
  └── F08 adapters/novel-agent-adapter.ts (新建)
  验收: cd packages/app && bun typecheck ✓

Step 3: Mock 适配器 (Day 2-3)
  ├── F09 adapters/mock-agent-adapter.ts (新建，含 Info-Lite 数据)
  ├── F11 services/genre-prompt-template.ts (新建)
  ├── F12 services/context-assembler.ts (新建)
  验收: unit test MockAgentAdapter.run() 返回含 informationState 的结果

Step 4: 事件分发 (Day 3)
  ├── F05 workflows/mock-generation-workflow.ts (新建)
  ├── F06 workflows/apply-workflow-events.ts (新建)
  验收: unit test applyWorkflowEvents 不报错

Step 5: Hook 入口 (Day 3-4)
  ├── F10 hooks/use-novel-workflow.ts (新建)
  验收: hook 可实例化，expose 所有便捷方法

Step 6: 工作台接入 (Day 4)
  ├── M07 workspace-view-model.ts (改造)
  ├── M08 workspace-actions.tsx (改造)
  验收: 点击"开始生成" → task running → completed → 有结构化 result

Step 7: 编辑器接入 (Day 4-5)
  ├── M05 use-chapter-editor.ts (改造 handleAICommand)
  ├── M06 chapter-info-panel.tsx (替换硬编码 + 信息审计块)
  验收: AI续写 → AIResultCard → 采纳 → 正文追加 + 信息审计显示

Step 8: 多页面联动 + E2E (Day 5-6)
  ├── 角色面板响应 character.updated 事件
  ├── 世界设定响应 world.referenced 事件
  ├── 成就响应 achievement.progressed 事件
  ├── 个人中心响应 profile.stats.updated 事件
  ├── BF01-BF03 同步修复
  ├── E2E: novel-workflow-generation.spec.ts
  验收: 完整链路 E2E 通过
```

---

## 第七章：验收标准

### 7.1 P1-Info-Lite 验收清单

| # | 验收项 | 验证方式 | 通过标准 |
|---|--------|---------|---------|
| V01 | typecheck 通过 | `cd packages/app && bun typecheck` | 0 errors |
| V02 | 单元测试通过 | `cd packages/app && bun test src/novel` | 全部 pass |
| V03 | 既有 E2E 不回归 | Playwright | 无新增 failure |
| V04 | MockAgent 返回 Info 字段 | unit test | `result.informationState` 非 undefined |
| V05 | informationState 包含全部子字段 | unit test | beatId/entropy/score/atoms/links 均有值 |
| V06 | 工作台生成按钮触发真实 task | 手动/E2E | task 经历 idle→running→completed |
| V07 | AI Progress Dock 显示真实状态 | 视觉检查 | running 时进度条动，completed 后消失 |
| V08 | 章节正文可写回 | E2E | 编辑器能看到新生成内容 |
| V09 | 编辑器右侧显示信息审计块 | 视觉检查 | 节拍/熵/惊喜度/原子/链接均可见 |
| V10 | 角色面板状态变化 | E2E | 生成后 appearanceCount/state 有变化 |
| V11 | 世界设定引用变化 | E2E | 生成后 referenceCount 有变化 |
| V12 | 成就 progress 变化 | E2E | 生成后 progress +delta |
| V13 | 个人中心统计变化 | E2E | 生成后 totalWords/generationCount 变化 |
| V14 | 无 href="#" | grep | 0 matches |
| V15 | 无 alert() | grep | 0 matches |
| V16 | 单文件 < 500 行 | wc -l | 所有新增/修改文件达标 |
| V17 | 不删除 _legacy | ls | _legacy 目录仍存在 |

### 7.2 Info-Lite 专项验收

| # | 验收项 | 说明 |
|---|--------|------|
| IV01 | InformationAtom 至少 2 种 type | fact + question 或 foreshadow |
| IV02 | InformationLink 至少 1 种 relationType | foreshadow 或 plot-cause |
| IV03 | entropyBefore ≠ entropyAfter | 熵值必须有变化 |
| IV04 | beatId 是 SaveTheCatBeatId 有效值 | 如 "catalyst" / "midpoint" |
| IV05 | auditScore 在 0-10 区间 | 合理范围 |
| IV06 | 不同 genre 返回不同模板内容 | 玄幻 vs 都市 vs 悬疑 |
| IV07 | 章节序号影响 beat 分配 | 第 1 章 ≠ 第 10 章的 beatId |
| IV08 | 信息审计块可折叠展开 | UI 交互正常 |

---

## 第八章：禁止事项（主控裁定）

```text
❌ 不接真实 LLM API 作为主链路
❌ 不做完整多模型路由 (ModelRouter)
❌ 不做完整 Skill 系统 (SkillLoader/Markdown 动态加载)
❌ 不做 DailyLog 文件记忆
❌ 不做 Git Worktree / 故事分支
❌ 不做完整插件化 (OpenCode plugin system)
❌ 不做导出系统 (EPUB/PDF/DOCX)
❌ 不引入 SQLite / IndexedDB
❌ 不做敏感词 Hook / 一致性 Hook / 风格 Hook
❌ 不做 StreamingExecutor (SSE 流式)
❌ 不做 RealAgentProvider
❌ 不做 InformationAtomProvider (独立 Provider)
❌ 不做 InformationLinkProvider (独立 Provider)
❌ 不做 StoryInformationState (全局大状态)
❌ 不做熵曲线可视化图表
❌ 不做 15 节拍完整规划器
❌ 不做真实 AI 信息审计 Agent
❌ 不做文件持久化 (YAML 写入磁盘)
❌ 不一次性实现 28 个 A 类交互 (只做 P0 的 6 个)
❌ 不删除 _legacy 目录
❌ 不推翻现有 components/hooks/providers/types 架构
```

---

## 第九章：风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 信息流类型过于理论化，团队理解成本高 | 中 | 低 | 类型注释充分；每个字段都有中文说明；提供 mapping 表（理论→产品） |
| MockAgentAdapter 模板数据不够丰富，重复感强 | 高 | 低 | 按 genre 分 3 套模板；加入随机扰动（entropy/score）；后续可扩展模板库 |
| ChapterInfoPanel 信息审计块 UI 过于复杂 | 低 | 低 | 默认折叠；只显示摘要行；展开后才看详情 |
| workflow-events 分发逻辑与现有 Provider mutation 不兼容 | 中 | 中 | 先用 console.log 验证事件流；再逐步对接真实 Provider 方法 |
| types/information-flow.ts 超过 500 行 | 低 | 低 | 当前估计 ~100 行；严格控制在最小集合 |

---

## 第十章：P2/P3 预留演进方向

### P2: 真实 Agent 接入（P1 完成后）

```
P1 的 Command / Adapter / Event / Info-State 全部复用。

只需：
  1. 新建 RealAgentAdapter implements NovelAgentAdapter
  2. 内部调用真实 LLM API (SSE streaming)
  3. 将 LLM 返回的结构化 JSON 映射到 NovelAgentResult
  4. 替换 MockAgentAdapter 为 RealAgentAdapter（配置开关）

信息流方面：
  - LLM Prompt 中加入信息目标约束（参考信息流理论文档第九章）
  - LLM 输出解析出真实的 InformationAtom[]
  - ChapterInformationState 的值从"模拟"变为"AI 分析结果"
```

### P3: Skill / Hook / 持久化（P2 完成后）

```
Skill: genrePromptTemplate → SkillLoader + Markdown 文件
Hook: validateCommand → SensitiveWordHook + ConsistencyHook + StyleMatchHook
持久化: 内存 store → FileStore (YAML)
DailyLog: eventLog → 文件写入 .novelforge/memory/logs/
信息流升级: ChapterInformationState → 全局 StoryInformationState
         InformationAtomProvider (独立 CRUD)
         伏笔追踪系统 (ForeshadowingTracker)
         熵曲线图 (EntropyCurveView)
```

---

## 附录 A：理论 → 产品 Mapping 速查表

| 理论概念 | 公式/定义 | 产品类型 | 产品字段 | UI 展示 |
|---------|----------|---------|---------|---------|
| **自信息 I(x)** | -log₂P(x) | `selfInformationScore: number` (0-10) | 惊喜度 | "惊喜度: 7.5/10" |
| **信息熵 H(X)** | -Σpᵢlog₂pᵢ | `entropyBefore/After: number` (0-1) | 悬念密度 | "熵变化: 0.72→0.81" |
| **条件熵 H(X\|Y)** | 给定Y后的剩余不确定性 | `readerInferenceLevel` (P2) | 真相推测度 | P2 再做 |
| **互信息 I(X;Y)** | H(X)-H(X\|Y) | `InformationLink.strength` (0-1) | 关联强度 | "古刹石碑↔身世 72%" |
| **信息原子** | 最小有意义信息单位 | `InformationAtom` | 信息节点 | 列表卡片 |
| **救猫咪节拍** | 15 拍结构 | `SaveTheCatBeatId` | 章节功能定位 | "节拍: 推动" |
| **雪花法** | 10 步创作法 | `StoryInformationBlueprint` (P2) | 项目初始蓝图 | P2 再做 |

---

*文档结束。方案制定: Architecture Agent | 基线: opencode-1.4.0 packages/app/src/novel | 日期: 2026-06-18*
*合并来源: tabbit_MVP_P1.md + tabbit_信息流理论.md + tabbit_P1-INFO.md + 实际代码审计*

---

**待主控确认后执行。**

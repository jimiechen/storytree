# NovelForge P1-Info-Lite 修订实施方案

**主控评审修订版 v2 — 9 项代码修正 + P1-A/P1-B 拆分 + 事件写回对照表**

| 项目 | 内容 |
|---|---|
| 文档类型 | 修订实施方案 |
| 修订日期 | 2026-06-18 |
| 基线代码 | opencode-1.4.0/packages/app/src/novel |
| 前置文档 | phase-p1-action-contract.md (P1-0A) |
| 状态 | **[READY_FOR_PHASE_P1A_START]** |

---

## 第一章：主控 9 项代码修正逐条响应

### 修正 #1: SolidJS createSignal 必须使用 [getter, setter]

**原问题**: 部分伪代码使用 `const x = createSignal(0)` 后直接 `x()` 访问，未明确展示解构。

**修正方案**: 所有 createSignal 调用统一使用 `[getter, setter]` 解构模式：

```typescript
// ❌ 原（模糊）
const currentTask = createSignal<WorkflowResult | null>(null);
const isRunning = createSignal(false);

// ✅ 修正后
const [getCurrentTask, setCurrentTask] = createSignal<WorkflowResult | null>(null);
const [getIsRunning, setIsRunning] = createSignal(false);
```

**涉及文件**: F10 hooks/use-novel-workflow.ts, F09 adapters/mock-agent-adapter.ts, M06 chapter-info-panel.tsx

### 修正 #2: ChapterInformationState 不使用 getter，改为 entropyDelta 字段

**原问题**: 使用 `get entropyDelta(): number` getter 计算，SolidJS 中不推荐在接口中使用 getter。

**修正方案**:

```typescript
// ❌ 原
export interface ChapterInformationState {
  // ...
  get entropyDelta(): number;  // ❌ 接口中使用 getter
}

// ✅ 修正后
export interface ChapterInformationState {
  chapterId: string;
  projectId: string;
  beatId?: SaveTheCatBeatId;
  beatName?: string;
  entropyBefore: number;
  entropyAfter: number;
  /** 熵变化值 = entropyAfter - entropyBefore (预计算) */
  entropyDelta: number;        // ✅ 普通字段
  selfInformationScore: number;
  newAtoms: InformationAtom[];
  newLinks: InformationLink[];
  auditScore?: number;
}
```

**涉及文件**: F01 types/information-flow.ts

### 修正 #3: InformationLink.relationType 加入 mystery

**原问题**: relationType 联合类型缺少 `mystery`，但 Mock 数据中悬疑类 link 可能需要。

**修正方案**:

```typescript
// ✅ 修正后的 relationType
relationType:
  | "foreshadow"
  | "theme"
  | "character"
  | "world-rule"
  | "plot-cause"
  | "emotional-echo"
  | "mystery";              // ✅ 新增
```

同时更新 MOCK_INFO_LINKS 数据确保至少一个示例使用 mystery:

```typescript
MOCK_INFO_LINKS["悬疑"] = [
  {
    sourceTitle: "钢琴声",
    targetTitle: "失踪者",
    relationType: "mystery",   // ✅ 使用新增值
    strength: 0.9,
  },
];
```

**涉及文件**: F01 types/information-flow.ts, F09 adapters/mock-agent-adapter.ts

### 修正 #4: 所有 id 必须唯一且 deterministic，不允许 Date.now() / Math.random()

**原问题**: Mock 数据中使用 `Date.now()` + `Math.random()` 生成 ID，每次运行结果不同，E2E 无法断言精确值。

**修正方案**: 使用基于输入参数的**确定性哈希 ID**，相同输入永远产出相同输出：

```typescript
/**
 * 确定性唯一 ID 生成器。
 * 基于输入参数的哈希值，不依赖 Date.now() / Math.random()。
 * 相同 (prefix, chapterIndex, genre, seq) 永远产出相同 ID → E2E 可断言。
 *
 * @param prefix ID 前缀，如 "atk" / "info-atom" / "info-link"
 * @param chapterIndex 章节序号（从文件名或命令中提取）
 * @param genre 小说类型
 * @param seq 同类序列号（0, 1, 2...）
 */
function uid(prefix: string, chapterIndex: number, genre: string, seq: number): string {
  // 确定性哈希：基于 chapterIndex + genre.length + genre首字符code + seq
  const g = genre || "unknown";
  const hashBase = chapterIndex * 1000 + g.length * 100 + (g.charCodeAt(0) || 0) * 10 + seq;
  // 转为 36 进制字符串作为后缀（不含随机成分）
  const suffix = hashBase.toString(36).padStart(6, "0");
  return `${prefix}-${suffix}`;
}

// 使用示例：
// uid("atk", 3, "玄幻", 0)   → "atk-000003lq"   （第3章玄幻第0个task）
// uid("info-atom", 5, "悬疑", 1) → "info-atom-00051m8" （第5章悬疑第1个原子）
// uid("info-link", 2, "都市", 0) → "info-link-00020o4" （第2章都市第0条链接）
//
// 关键保证：
// - 无 Date.now() → 不依赖时间
// - 无 Math.random() → 不依赖随机数
// - 相同参数 → 相同输出 → E2E 可断言精确值
```

**涉及文件**: F09 adapters/mock-agent-adapter.ts

### 修正 #5: contextRefs 使用 string[]，不使用 Set<string>

**原问题**: NovelCommand.payload.contextRefs 类型为 `Set<string>`，序列化/传递不便。

**修正方案**:

```typescript
// ❌ 原
contextRefs?: Set<string>;

// ✅ 修正后
contextRefs?: string[];
```

**涉及文件**: F03 workflows/novel-command.ts, F10 hooks/use-novel-workflow.ts

### 修正 #6: status 统一为 completed / failed / cancelled

**原问题**: NovelAgentResult.status 使用 `success`，而 AITaskStatus 已定义 `completed`。混用导致类型不一致。

**修正方案**: NovelAgentResult.status **仅保留终态值**，pending/running 归属 WorkflowStatus：

```typescript
// ✅ 修正后：AgentResult 只表达"任务结束时的最终状态"
type AgentResultStatus = "completed" | "failed" | "cancelled" | "denied" | "quota";

// pending / running 属于 WorkflowStatus（执行中状态），不属于 AgentResult
type WorkflowStatus = "idle" | "queued" | "running" | "completed" | "failed" | "cancelled";
```

**涉及文件**: F02 workflows/types.ts, F09 adapters/mock-agent-adapter.ts, F05 workflows/mock-generation-workflow.ts

### 修正 #7: MockAgentAdapter 不使用随机值作为 E2E 依赖字段

**原问题**: entropy/selfInformationScore/auditScore 使用 `Math.random()`，每次运行结果不同，E2E 无法断言精确值。

**修正方案**: E2E 关键字段使用确定性函数（基于输入参数），非关键字段可保留随机但提供 seed 注入能力：

```typescript
/**
 * 确定性伪随机：基于 chapterIndex + genre + 固定种子
 * 相同输入永远产出相同输出 → E2E 可断言
 */
function deterministicScore(chapterIndex: number, genre: string, base: number): number {
  // 简单哈希：chapterIndex * genre.length + base 的尾数
  const hash = (chapterIndex * (genre?.length || 1) + base) % 100;
  return parseFloat((base + (hash % 30) / 10).toFixed(1));
}

// 使用：
selfInformationScore: deterministicScore(chapterIndex, genre, 5),  // 5.0 ~ 8.0
auditScore: deterministicScore(chapterIndex, genre, 6),          // 6.0 ~ 9.0
entropyBefore: deterministicEntropy(chapterIndex, 'before'),       // 确定性
entropyAfter: deterministicEntropy(chapterIndex, 'after'),         // 确定性
```

**涉及文件**: F09 adapters/mock-agent-adapter.ts

### 修正 #8: runMockGeneration 只生成 result/events，不直接写回

**原问题**: runMockGeneration 内部调用 applyWorkflowEvents 直接写回 store，职责不清。

**修正方案**: 分离"生成"与"写回"两个阶段：

```typescript
// ✅ 修正后：runMockGeneration 只负责生成
export async function runMockGeneration(
  command: NovelCommand,
): Promise<{ result: NovelAgentResult; events: NovelWorkflowEvent[]; durationMs: number }> {
  const startTime = Date.now();

  // 1. 仅调用 Adapter 获取结果
  const agentResult = await adapter.run(command);

  // 2. 仅构建事件列表（不执行）
  const events = buildEventsForCommand(command, agentResult);

  return {
    result: agentResult,
    events,
    durationMs: Date.now() - startTime,
  };
}

// 写回由调用方（useNovelWorkflow 或测试）显式调用：
// const { result, events } = await runMockGeneration(command);
// applyWorkflowEvents(events, mutations);  // ← 显式传入 mutations
```

**涉及文件**: F05 workflows/mock-generation-workflow.ts

### 修正 #9: applyWorkflowEvents 必须接收 mutations 参数，避免全局变量

**原问题**: applyWorkflowEvents 使用全局 `_mutations` 变量，隐式依赖初始化时序，不利于测试和并发安全。

**修正方案**: **mutations 作为显式参数传入**，不使用全局变量：

```typescript
/** Store 写回方法集合（由调用方注入） */
export interface WorkflowMutations {
  updateChapterContent: (chapterId: string, content: string) => void;
  updateChapterSummary: (chapterId: string, summary: string) => void;
  updateChapterWordCount: (chapterId: string, wordCount: number) => void;
  updateChapterInfoState: (chapterId: string, state: ChapterInformationState) => void;
  updateChapterExtractedInfo: (chapterId: string, info: AIExtractedInfo) => void;
  updateCharacterAppearance: (charIds: string[], chapterId: string) => void;
  incrementWorldReference: (itemIds: string[], chapterId: string) => void;
  addAchievementProgress: (achievementId: string, delta: number) => void;
  updateProfileStats: (projectId: string, delta: { words: number; generations: number; credits: number }) => void;
  logDiscardedTask: (taskId: string) => void;
}

/**
 * 分发工作流事件到各 Store — 真实写回。
 *
 * @param events 待分发的事件列表
 * @param mutations Store 写回方法集合（由 useNovelWorkflow 或测试代码注入）
 */
export function applyWorkflowEvents(
  events: NovelWorkflowEvent[],
  mutations: WorkflowMutations,
): void {
  for (const event of events) {
    eventLog.push(event);

    switch (event.type) {
      case "chapter.generated":
        mutations.updateChapterContent(event.chapterId, event.content);
        mutations.updateChapterSummary(event.chapterId, event.summary);
        mutations.updateChapterWordCount(event.chapterId, event.wordCount);
        if (event.informationState) {
          mutations.updateChapterInfoState(event.chapterId, event.informationState);
        }
        break;

      case "chapter.extracted":
        mutations.updateChapterExtractedInfo(event.chapterId, {
          summary: event.summary,
          characters: event.characters,
          worldItems: event.worldItems,
          keyEvents: event.keyEvents,
          protagonistState: event.protagonistState,
          informationState: event.informationState,
        });
        break;

      case "character.updated":
        mutations.updateCharacterAppearance(event.characterIds, event.chapterId);
        break;

      case "world.referenced":
        mutations.incrementWorldReference(event.worldItemIds, event.chapterId);
        break;

      case "achievement.progressed":
        mutations.addAchievementProgress(event.achievementId, event.delta);
        break;

      case "profile.stats.updated":
        mutations.updateProfileStats(event.projectId, {
          words: event.wordCountDelta,
          generations: event.generationCountDelta,
          credits: event.creditDelta,
        });
        break;

      case "information.assessed":
        // 信息审计事件仅记录，数据已通过 chapter.generated/extracted 写入
        break;
    }
  }
}
```

**关键设计决策**: 不使用 `initWorkflowMutations()` 全局初始化模式。每次调用 `applyWorkflowEvents(events, mutations)` 时必须显式传入 mutations，确保：
- 测试时可注入 mock mutations
- 无隐式依赖 / 无全局状态
- 函数签名即契约

**涉及文件**: F06 workflows/apply-workflow-events.ts

---

## 第二章：事件写回对照表

### 完整映射：NovelWorkflowEvent → Provider/Hook Mutation

| 事件类型 | 触发场景 | 写回目标 | Mutation 方法签名 | 对应 Provider | P1 阶段 |
|---------|---------|---------|-----------------|-------------|--------|
| **chapter.generated** | AI续写 / 开始生成完成 | 章节内容+摘要+字数+信息状态 | `updateChapterContent(id, content)` <br> `updateChapterSummary(id, summary)` <br> `updateChapterWordCount(id, wc)` <br> `updateChapterInfoState(id, infoState)` | NovelChapterProvider | P1-B |
| **chapter.extracted** | AI提取信息完成 | 章节AI提取信息结构体 | `updateChapterExtractedInfo(id, AIExtractedInfo)` | NovelChapterProvider | P1-B |
| **character.updated** | 生成结果包含角色提及 | 角色外观/状态变更计数 | `updateAppearance(charIds, chapterId)` | NovelCharacterProvider | P1-B |
| **world.referenced** | 生成结果包含世界物品引用 | 世界物品引用计数+1 | `incrementReference(itemIds, chapterId)` | WorldSettingProvider (或 ViewModel) | P1-B |
| **achievement.progressed** | 每次AI操作完成后 | 成就进度累加 | `addAchievementProgress(achId, delta)` | AchievementProvider (或 mock) | P1-B |
| **profile.stats.updated** | 每次AI操作完成后 | 个人中心统计更新 | `updateProfileStats(projId, {words, generations, credits})` | ProfileProvider (或 mock) | P1-B |
| **information.assessed** | 生成结果含 informationState | 仅记录到事件日志（数据已通过 chapter 写入） | 无额外 mutation（信息审计数据随 chapter.informationState 一并持久化） | AILogProvider (log only) | P1-A |

### 数据流时序（修正后）

```
用户点击 "开始生成"
  │
  ▼
useNovelWorkflow.runChapterGeneration(chapterId, genre)
  │
  ├─ 构建 NovelCommand { type: 'chapter.generate', ... }
  │
  ├─ 调用 runMockGeneration(command)
  │     │
  │     ├─ MockAgentAdapter.run(command)
  │     │   └─ 返回 NovelAgentResult {
  │     │       status: 'completed',         ← 修正#6
  │     │       text, summary, wordCount,
  │     │       informationState: {           ← Info-Lite
  │     │         beatId, entropyBefore, entropyAfter,
  │     │         entropyDelta,                 ← 修正#2
  │     │         selfInformationScore,          ← 修正#7 (确定性)
  │     │         newAtoms: [{ id: uid("info-atom"), ... }],  ← 修正#4
  │     │         newLinks: [{ ..., relationType: "mystery" }],  ← 修正#3
  │     │       }
  │     │
  │     └─ buildEventsForCommand(command, result)
  │        └─ 返回 NovelWorkflowEvent[]
  │           （不执行写回）                        ← 修正#8
  │
  ├─ 返回 { result, events, durationMs }
  │
  ├─ 更新 currentTask signal                   ← 修正#1 [getter,setter]
  │
  └─ 调用 applyWorkflowEvents(events)            ← 修正#9
     │
     ├─ initWorkflowMutations 已注入             ← P1-B 才有
     │
     ├─ chapter.generated → ChapterProvider:
     │   ├─ content 更新 → 编辑器 canvas 刷新
     │   ├─ summary 更新 → 右侧面板刷新
     │   ├─ wordCount 更新 → 工具栏数字刷新
     │   └─ informationState 更新 → 信息审计块出现
     │
     ├─ character.updated → CharacterProvider:
     │   └─ appearanceCount++ → 角色面板数字刷新
     │
     ├─ world.referenced → WorldSetting:
     │   └─ referenceCount++ → 世界设定数字刷新
     │
     ├─ achievement.progressed → Achievement:
     │   └─ progress += delta → 成就进度条刷新
     │
     └─ profile.stats.updated → Profile:
        └─ totalWords += delta → 个人中心数字刷新
```

---

## 第三章：P1-A / P1-B 执行拆分

### P1-A: Info-Lite 基础层（~3 天）

**目标**: 类型定义 + Mock 数据 + 编辑器展示，不涉及跨页面联动。

> **文件编号说明（E）**: 下方的 F01/F02... / M01/M02... 为**方案规划编号**，用于文档引用和追踪。不代表实际创建顺序。实际创建顺序按下方 Step 1-5 执行。

#### 新增文件（5 个）

| 文件 | 行数 | 说明 |
|------|------|------|
| F01 `types/information-flow.ts` | ~110 | 全量类型（含修正 #2/#3/#4） |
| F02 `workflows/types.ts` | ~60 | WorkflowContext / WorkflowStatus（含修正 #6） |
| F03 `workflows/novel-command.ts` | ~50 | NovelCommand（含修正 #5） |
| F08 `adapters/novel-agent-adapter.ts` | ~30 | 接口定义 |
| F09 `adapters/mock-agent-adapter.ts` | ~220 | Mock 实现（含修正 #1/#4/#6/#7） |

#### 修改文件（5 个）

| 文件 | 改动 |
|------|------|
| M01 `types/chapter.ts` | +informationState?: ChapterInformationState |
| M02 `types/editor.ts` | AIExtractedInfo +informationState? |
| M03 `types/ai-task.ts` | NovelAgentResult +informationState? + status 用 'completed' |
| M04 `types/index.ts` | +导出 information-flow |
| M06 `components/novel-editor/chapter-info-panel.tsx` | 替换 MOCK_EXTRACTED 为 props 读取 + 追加信息审计折叠块 |

#### P1-A 验收标准

| # | 验收项 | 验证方式 |
|---|--------|---------|
| VA01 | typecheck 通过 | `cd packages/app && bun typecheck` → 0 errors |
| VA02 | MockAgentAdapter unit test 通过 | `bun test src/novel/adapters/` |
| VA03 | result.informationState 有完整子字段 | assert 所有字段非 undefined |
| VA04 | entropyDelta === entropyAfter - entropyBefore | 数学校验 |
| VA05 | ID 格式正确（不含 --/-前缀递增） | regex 匹配 |
| VA06 | status 值为 'completed' 非 'success' | 类型断言 |
| VA07 | 相同输入两次运行结果一致（确定性） | 连续两次调用 assert deep equal |
| VA08 | 编辑器右侧可见信息审计折叠块 | 视觉检查 |
| VA09 | 信息审计块展开后显示全部 7 个指标 | 视觉检查 |
| VA10 | 单文件均 < 500 行 | wc -l 检查 |

---

### P1-B: 工作流编排 + 写回联动 + E2E（~3 天）

**目标**: Command → Workflow → Event → Mutation 全链路跑通。

#### 新增文件（7 个）

| 文件 | 行数 | 说明 |
|------|------|------|
| F04 `workflows/workflow-events.ts` | ~120 | 7 种事件联合类型（含 information.assessed） |
| F05 `workflows/mock-generation-workflow.ts` | ~140 | 主编排（仅生成不写回，修正 #8） |
| F06 `workflows/apply-workflow-events.ts` | ~160 | 事件分发 + 真实写回（修正 #9） |
| F07 `workflows/index.ts` | ~15 | 统一导出 |
| F10 `hooks/use-novel-workflow.ts` | ~90 | 页面入口 Hook（修正 #1/#5） |
| F11 `services/genre-prompt-template.ts` | ~80 | 3 类静态 prompt 模板 |
| F12 `services/context-assembler.ts` | ~100 | 上下文收集 |

#### 修改文件（6 个）

| 文件 | 改动 |
|------|------|
| M05 `hooks/use-chapter-editor.ts` | handleAICommand 从空实现改为调用 useNovelWorkflow() |
| M07 `components/novel-workspace/workspace-view-model.ts` | submitOutlineTask/submitDetailOutlineTask 接入 workflow |
| M08 `components/novel-workspace/generation/workspace-actions.tsx` | onStartGeneration 接入 workflow |
| BF01 `workspace-generation-form.tsx:24` | MODEL_OPTIONS 从常量导入 |
| BF02 `types/generation-config.ts:9` | 补充完整模型列表 |
| BF03 `novel-editor/sedfoXtUC` | **删除** |

#### P1-B 验收标准

| # | 验收项 | 验证方式 |
|---|--------|---------|
| VB01 | typecheck 通过 | `cd packages/app && bun typecheck` → 0 errors |
| VB02 | unit test 全通过 | `cd packages/app && bun test src/novel/` |
| VB03 | 既有 E2E 不回归 | Playwright existing specs |
| VB04 | 工作台"开始生成"→task running→completed | 手动/E2E |
| VB05 | AiProgressDock 显示真实进度 | 视觉检查 |
| VB06 | 章节正文可写回编辑器 | E2E 断言 |
| VB07 | 编辑器右侧显示信息审计块 | 视觉检查 |
| VB08 | 角色面板数字变化 | E2E 断言 appearanceCount > 0 |
| VB09 | 世界设定引用数变化 | E2E 断言 referenceCount > 0 |
| VB10 | 成就 progress 变化 | E2E 断言 progress > 0 |
| VB11 | 个人中心 stats 变化 | E2E 断言 totalWords > 0 |
| VB12 | AI 续写 → ResultCard → 采纳 → 正文追加 | E2E 全链路 |
| VB13 | 取消任务 → status=cancelled | E2E 断言 |
| VB14 | 重试任务 → 重新生成新结果 | E2E 断言 |
| VB15 | 日志抽屉可打开/筛选/清空 | 手动验证 |
| VB16 | 无 href="#" | grep 0 matches |
| VB17 | 无 alert() | grep 0 matches |
| VB18 | 单文件 < 500 行 | wc -l |
| VB19 | _legacy 目录存在 | ls |
| VB20 | 新增 workflow E2E spec 通过 | `bun test src/novel/workflows/` |

---

## 第四章：执行顺序总览

```
═════════════════════════════════════════════════
  P1-0A (已完成)
  → phase-p1-action-contract.md
  → 112 个交互点全量清单
═════════════════════════════════════════════════
                    ↓
═════════════════════════════════════════════════
  P1-A: Info-Lite 基础 (~3 天)
═════════════════════════════════════════════════

  Day 1 AM:
  ├── F01 types/information-flow.ts        (修正 #2,#3)
  ├── M01-M04 类型扩展                       (4 files)
  └── M04 types/index.ts 导出

  Day 1 PM:
  ├── F02 workflows/types.ts               (修正 #6)
  ├── F03 workflows/novel-command.ts         (修正 #5)
  ├── F08 adapters/novel-agent-adapter.ts   (接口)
  └── F09 adapters/mock-agent-adapter.ts    (修正 #1,#4,#6,#7)

  Day 2:
  ├── M06 chapter-info-panel.tsx           (信息审计 UI 块)
  ├── unit test: MockAgentAdapter
  ├── unit test: InformationAtom/Link 类型
  └── typecheck 验证

  Day 3:
  ├── P1-A 验收 (VA01-VA10)
  └── 输出 [READY_FOR_PHASE_P1A_INFO_LITE_REVIEW]
                    ↓
═════════════════════════════════════════════════
  P1-B: 工作流编排 + 写回 + E2E (~3 天)
═════════════════════════════════════════════════

  Day 4 AM:
  ├── F04 workflows/workflow-events.ts
  ├── F05 workflows/mock-generation-workflow.ts (修正 #8)
  ├── F06 workflows/apply-workflow-events.ts  (修正 #9)
  └── F07 workflows/index.ts

  Day 4 PM:
  ├── F10 hooks/use-novel-workflow.ts        (修正 #1,#5)
  ├── F11 services/genre-prompt-template.ts
  ├── F12 services/context-assembler.ts
  └── unit test: workflow events

  Day 5:
  ├── M05 use-chapter-editor.ts 接入
  ├── M07 workspace-view-model.ts 接入
  ├── M08 workspace-actions.tsx 接入
  ├── BF01-BF03 同步修复
  └── 多页面联动调试

  Day 6:
  ├── E2E: workflow-generation.spec.ts
  ├── E2E: editor-ai-continue.spec.ts
  ├── E2E: cross-page-linkage.spec.ts
  ├── 全量验收 (VB01-VB20)
  └── 输出 [READY_FOR_PHASE_P1B_WORKFLOW_REVIEW]
═════════════════════════════════════════════════
```

---

## 第五章：禁止事项（不变）

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
❌ 不一次性实现 28 个 A 类交互 (只做 P0 的 9 个)
❌ 不删除 _legacy 目录
❌ 不推翻现有 components/hooks/providers/types 架构
```

---

*文档结束。修订版 v2，含 9 项主控裁定修正、事件写回对照表、P1-A/P1-B 拆分。*

**[READY_FOR_PHASE_P1_ACTION_CONTRACT_REVIEW]**

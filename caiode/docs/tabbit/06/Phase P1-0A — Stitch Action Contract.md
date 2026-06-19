@novelforge-p1-info-lite-plan.md trae输出的详细实施方案，请评审

### **评审结论：方案方向正确，有条件通过；但必须先补齐 Action Contract，并修正若干 TypeScript / SolidJS / 事件写回问题后才能执行。**

`@novelforge-p1-info-lite-plan.md` 已经比前一版方案收敛很多：它把 P1 工作流编排和 Info-Lite 信息流契约合并到同一个执行方案里，明确不做真实模型、不做完整 Skill、不做持久化、不做复杂 Provider，这个方向是对的。主控可以接受它作为 **Phase P1 + P1-Info-Lite 的实施蓝图**。

但当前文档还不能直接交给 Trae 按代码示例照抄执行。主要问题有三类：第一，前置的 **Stitch 全按钮 Action Contract** 没有纳入实施顺序；第二，示例代码存在若干会导致 typecheck 失败的明显问题；第三，`applyWorkflowEvents` 目前还是注释级伪实现，如果不落到现有 providers/hooks/store，P1 的“生成 → 写回 → 联动”闭环仍然跑不起来。

主控裁定：

```text
文档状态：有条件通过
执行状态：暂不允许直接开工全部实现
必须先修订：P1-0A Action Contract + TS/SolidJS 编译风险 + 事件写回落点
批准方向：P1 Workflow + P1-Info-Lite 合并执行
禁止事项：继续保持不接真实模型、不做完整 Skill、不做持久化、不做完整插件化
```

---

## **一、文档做得好的部分**

### **1. 范围控制比之前正确**

这版方案明确把新增文件收敛到 12 个，并且坚持：

```text
MockAgentAdapter first
内存 store first
Info-Lite first
不接真实模型
不做完整 Skill
不做 DailyLog
不做 SQLite
不新增完整 InformationAtomProvider
```

这是正确的。当前阶段最重要的是跑通产品闭环，不是搭建终态 Agent 平台。

### **2. Info-Lite 的接入位置正确**

文档没有把信息流做成独立大系统，而是放在：

```text
MockAgentAdapter 返回值
→ NovelAgentResult.informationState
→ chapter.informationState
→ ChapterInfoPanel 信息审计块
```

这个设计是对的。信息流理论在 P1 阶段就应该成为“生成结果的数据契约”，而不是现在就扩展成完整信息图谱系统。

### **3. 三层架构方向正确**

文档中的三层架构基本合理：

```text
UI 层
→ 工作流编排层
→ 信息流数据契约层
```

这符合我们之前确定的原则：工作流要融入 Stitch 底座，而不是另起一套割裂的 AI Demo。

### **4. 禁止事项列得清楚**

文档明确列出不做真实模型、不做完整多模型路由、不做 SkillLoader、不做持久化、不做真实信息审计 Agent，这一点很好，可以有效防止 Trae 执行时扩范围。

---

## **二、必须修正的问题**

## **问题 1：缺少 P1-0A Action Contract 前置阶段**

上一轮主控已经明确要求：**工作流必须长在 Stitch 底座按钮上**。但这份方案直接进入类型、Adapter、Workflow、Info-Lite，没有把所有页面所有按钮的 Action Contract 纳入正式执行顺序。

这会带来一个风险：

```text
Workflow 文件写好了，但哪些按钮接 workflow、哪些按钮只走 provider、哪些按钮暂缓，仍然不清楚。
```

所以必须在当前方案前面插入：

```text
Phase P1-0A — Stitch Action Contract
```

输出文档：

```text
docs/reports/phase-p1-action-contract.md
```

必须覆盖：

```text
TopAppBar / SideNav
02 我的书架
03 创建项目弹窗
04 小说项目工作台
05 章节编辑器
06 角色追踪面板
07 世界设定页面
09 个人中心
10 AI 生成参数设置弹窗
11 成就系统
12 25 道题引导页
ModalHost 全部弹框
```

每个按钮必须标注：

```text
页面
按钮/入口
功能概要
动作类型：NAV / MODAL / CRUD / AI_WORKFLOW / INFO_WORKFLOW / FUTURE
P1 是否必须
handler / workflow / provider
是否暂缓到 P2/P3
```

没有这个文档，P1 Workflow 很容易变成“额外加的技术层”，而不是 Stitch 底座的一部分。

主控要求：

```text
P1-0A 必须先做。
P1-Info-Lite 不能绕过 Action Contract。
```

---

## **问题 2：示例代码存在 SolidJS Signal 用法错误**

文档中 `use-novel-workflow.ts` 示例写法类似：

```ts
const currentTask = createSignal<WorkflowResult | null>(null);
const isRunning = createSignal(false);

isRunning.set(true);
currentTask.set(result);
```

这在 SolidJS 中是不正确的。`createSignal` 返回的是元组：

```ts
const [currentTask, setCurrentTask] = createSignal<WorkflowResult | null>(null);
const [isRunning, setIsRunning] = createSignal(false);
```

正确写法应为：

```ts
export function useNovelWorkflow(projectId: Accessor<string | undefined>) {
  const [currentTask, setCurrentTask] = createSignal<WorkflowResult | null>(null);
  const [isRunning, setIsRunning] = createSignal(false);

  async function executeCommand(type: NovelCommandType, opts?: ExecuteCommandOptions) {
    const pid = projectId();

    if (!pid) {
      throw new Error("No project selected");
    }

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

    setIsRunning(true);

    try {
      const result = await runMockGeneration(command);
      setCurrentTask(result);
      return result;
    } finally {
      setIsRunning(false);
    }
  }

  return {
    currentTask,
    isRunning,
    executeCommand,
    runChapterGeneration: (chapterId: string, genre?: string) =>
      executeCommand("chapter.generate", { chapterId, genre }),
    runContinueWriting: (chapterId: string, text: string, genre?: string) =>
      executeCommand("chapter.continue", { chapterId, text, genre }),
    runExtractInfo: (chapterId: string, genre?: string) =>
      executeCommand("chapter.extract", { chapterId, genre }),
    runOutlineGeneration: (genre?: string) =>
      executeCommand("outline.generate", { genre }),
  };
}
```

Trae 执行时必须按 SolidJS 正确写法实现，不能照抄文档里的错误形式。

---

## **问题 3：`ChapterInformationState` 不应在接口里使用 getter**

文档中写了：

```ts
export interface ChapterInformationState {
  entropyBefore: number;
  entropyAfter: number;
  get entropyDelta(): number;
}
```

不建议这样设计。`ChapterInformationState` 是要从 MockAgentResult 返回、写入 chapter、在 UI 展示的普通数据对象，不应该依赖 getter。否则序列化、clone、mock-data 写入和 E2E 断言都会变复杂。

建议改为显式字段：

```ts
export interface ChapterInformationState {
  chapterId: string;
  projectId: string;

  beatId?: SaveTheCatBeatId;
  beatName?: string;

  entropyBefore: number;
  entropyAfter: number;
  entropyDelta: number;

  selfInformationScore: number;

  newAtoms: InformationAtom[];
  newLinks: InformationLink[];

  auditScore?: number;
}
```

在 `MockAgentAdapter` 里生成时直接计算：

```ts
const entropyDelta = Number((entropy.after - entropy.before).toFixed(2));
```

UI 直接读取：

```tsx
{info.entropyDelta > 0 ? "+" : ""}
{info.entropyDelta}
```

---

## **问题 4：`InformationLink.relationType` 与 Mock 数据不一致**

文档中 `InformationLink.relationType` union 包含：

```ts
"foreshadow"
"theme"
"character"
"world-rule"
"plot-cause"
"emotional-echo"
```

但 Mock 数据示例里用了：

```ts
relationType: "mystery"
```

这会直接 typecheck 失败。

修正方式二选一。

方案 A：把 `"mystery"` 加入 union：

```ts
relationType:
  | "foreshadow"
  | "theme"
  | "character"
  | "world-rule"
  | "plot-cause"
  | "emotional-echo"
  | "mystery";
```

方案 B：把 Mock 数据里的 `"mystery"` 改成已有类型，例如：

```ts
relationType: "foreshadow"
```

主控建议：

```text
P1 使用方案 A，保留 mystery。
```

因为悬疑类项目确实需要“谜团关联”。

---

## **问题 5：示例代码中部分模板字符串明显缺失变量**

文档中多处示例看起来像：

```ts
const taskId = `task--`;
id: `atom-`;
id: `link-`;
```

这些明显不是最终可用代码。如果照抄，会造成 ID 冲突。

必须改成稳定唯一 ID。P1 可以用简单工具函数，不需要引入复杂库：

```ts
function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
```

然后：

```ts
const taskId = createId("task");
const atomId = createId("atom");
const linkId = createId("link");
```

如果 E2E 对 ID 有稳定性要求，也可以使用递增计数器：

```ts
let taskCounter = 0;

function createStableId(prefix: string): string {
  taskCounter += 1;
  return `${prefix}-${taskCounter}`;
}
```

P1 建议用递增计数器，方便测试。

---

## **问题 6：`applyWorkflowEvents` 不能停留在注释级伪实现**

当前文档中的 `applyWorkflowEvents.ts` 是这样：

```ts
case "chapter.generated":
  // ChapterProvider.updateContent(...)
  break;
```

这只是事件日志，不是真正写回。如果最终实现仍然这样，P1 主链路不会成立。

P1 的核心验收是：

```text
task completed 后，chapter / character / world / achievement / profile 的状态真的变化。
```

因此 `applyWorkflowEvents` 必须明确落到现有数据层。

如果现有 provider 已有 mutation，就直接调用现有 mutation。

如果没有，需要在现有 provider/hook 中补最小 mutation，而不是新增完整新 Provider。

允许新增或扩展的最小方法包括：

```ts
updateChapterContent(projectId, chapterId, content)
updateChapterSummary(projectId, chapterId, summary)
updateChapterInformationState(projectId, chapterId, informationState)
updateCharacterState(projectId, characterIds, state, chapterId)
updateWorldReference(projectId, worldItemIds, chapterId)
updateAchievementProgress(projectId, achievementId, delta)
updateProfileStats(projectId, delta)
```

如果当前架构不方便直接在 `applyWorkflowEvents` 调 provider，也可以设计为：

```text
applyWorkflowEvents(events, mutations)
```

例如：

```ts
export interface WorkflowMutations {
  updateChapter(event: ChapterGeneratedEvent): void;
  updateExtractedInfo(event: ChapterExtractedEvent): void;
  updateCharacters(event: CharacterUpdatedEvent): void;
  updateWorldReferences(event: WorldReferencedEvent): void;
  updateAchievement(event: AchievementProgressedEvent): void;
  updateProfile(event: ProfileStatsUpdatedEvent): void;
}
```

然后在 `useNovelWorkflow` 中注入 mutation：

```ts
const result = await runMockGeneration(command);
applyWorkflowEvents(result.events, mutations);
```

这个方式比在 workflow 文件里直接 import 多个 provider 更干净，也更符合 SolidJS hook 层职责。

主控建议采用：

```text
useNovelWorkflow 组装 mutations
applyWorkflowEvents(events, mutations) 执行写回
```

这样工作流层不强依赖具体 provider 实现。

---

## **问题 7：`runMockGeneration` 当前会自动 apply events，可能不利于 UI 注入 mutation**

文档里的流程是：

```ts
const agentResult = await adapter.run(command);
events = buildEventsForCommand(command, agentResult);
applyWorkflowEvents(events);
return result;
```

如果 `applyWorkflowEvents` 自己不知道如何写回现有 store，就会卡住。

更好的结构是：

```ts
runMockGeneration(command)
→ 只负责生成 result + events
useNovelWorkflow()
→ 调用 applyWorkflowEvents(events, mutations)
```

也就是说：

```text
workflow 负责“生成事件”
hook 负责“把事件应用到当前应用状态”
```

建议改成：

```ts
export async function runMockGeneration(command: NovelCommand): Promise<WorkflowResult> {
  const startTime = Date.now();
  const agentResult = await adapter.run(command);
  const events = agentResult.status === "success"
    ? buildEventsForCommand(command, agentResult)
    : [];

  return {
    taskId: agentResult.taskId,
    status: mapAgentStatus(agentResult.status),
    agentResult,
    events,
    durationMs: Date.now() - startTime,
  };
}
```

然后：

```ts
const result = await runMockGeneration(command);
applyWorkflowEvents(result.events, mutations);
setCurrentTask(result);
```

这样更可测，也更容易接未来真实 Adapter。

---

## **问题 8：状态枚举需要统一，避免 `success` / `completed` 混用**

文档中同时出现：

```ts
WorkflowStatus = "completed"
NovelAgentResult.status = "success"
```

还有：

```ts
status: "failed"
```

这容易造成映射混乱。

建议统一策略：

### **Adapter 层使用 Agent 状态**

```ts
export type NovelAgentStatus = "success" | "failed" | "cancelled";
```

### **Workflow 层使用任务状态**

```ts
export type WorkflowStatus =
  | "idle"
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";
```

明确映射：

```ts
function mapAgentStatus(status: NovelAgentStatus): WorkflowStatus {
  if (status === "success") return "completed";
  if (status === "cancelled") return "cancelled";
  return "failed";
}
```

或者更简单：P1 直接让 `NovelAgentResult.status` 也使用：

```ts
"completed" | "failed" | "cancelled"
```

主控建议：

```text
P1 统一使用 WorkflowStatus，不再引入 success。
```

即：

```ts
export interface NovelAgentResult {
  taskId: string;
  status: "completed" | "failed" | "cancelled";
  error?: string;
  ...
}
```

---

## **问题 9：`contextRefs?: Set<string>` 不适合直接放在 payload 里**

`Set<string>` 在响应式状态、序列化、测试快照中都不如数组稳定。

建议改为：

```ts
contextRefs?: string[];
```

如果 UI 内部用 Set，可以在构建 command 时转换：

```ts
contextRefs: Array.from(enabledContextRefs())
```

类型改为：

```ts
export interface NovelCommandPayload {
  text?: string;
  selectedText?: string;
  targetWordCount?: number;
  model?: string;
  contextRefs?: string[];
  genre?: string;
}
```

---

## **问题 10：MockAgentAdapter 不应该依赖随机数作为核心验收数据**

当前示例里使用了较多 `Math.random()`：

```ts
entropyAfter
selfInformationScore
auditScore
```

随机值会导致 E2E 不稳定。P1 可以有“伪随机”，但应基于 chapterIndex / commandType 生成稳定结果。

建议改成 deterministic：

```ts
function deterministicScore(seed: number, min: number, max: number): number {
  const value = min + (seed % 10) / 10 * (max - min);
  return Number(value.toFixed(1));
}
```

或者更简单：

```ts
const selfInformationScore = command.type === "chapter.generate" ? 7.5 : 6.8;
const auditScore = 8.1;
```

主控建议：

```text
P1 E2E 相关字段必须稳定。
```

也就是说：

```text
entropyBefore / entropyAfter / selfInformationScore / auditScore
```

不要每次运行都变。

---

## **问题 11：世界设定、成就、个人中心联动的落点仍不清楚**

文档说：

```text
角色面板响应 character.updated
世界设定响应 world.referenced
成就响应 achievement.progressed
个人中心响应 profile.stats.updated
```

但没有明确现有代码中这些状态如何更新。

这会成为 P1 最大风险。

必须在执行前补一个小节：

```text
现有数据层 mutation 对照表
```

格式建议：

| 事件 | 目标数据 | 当前是否有 mutation | P1 处理 |
|---|---|---:|---|
| `chapter.generated` | chapter.content / summary / wordCount / informationState | 有/无 | 使用/新增最小方法 |
| `chapter.extracted` | chapter.aiExtractedInfo | 有/无 | 使用/新增 |
| `character.updated` | character.appearanceCount / state / lastAppearedChapter | 有/无 | 使用/新增 |
| `world.referenced` | worldItem.referenceCount / lastReferencedChapter | 有/无 | 使用/新增 |
| `achievement.progressed` | achievement.progress | 有/无 | 使用/新增 |
| `profile.stats.updated` | profile.totalWords / generationCount / credits | 有/无 | 使用/新增 |

没有这张表，执行时容易写出“事件有了，但页面没变”。

---

## **问题 12：P1 范围仍略大，建议拆成两个可验收 PR/批次**

文档把 P1 Workflow + Info-Lite + 多页面联动 + E2E 都放进 6 天执行。方向可行，但容易一次提交过大。

建议拆为两个执行批次。

### **P1-A：Workflow + Info-Lite 基础**

目标：

```text
类型、Adapter、Command、WorkflowResult、informationState、ChapterInfoPanel 信息审计展示
```

验收：

```text
MockAgentAdapter 能返回 informationState
编辑器右侧能显示信息审计块
typecheck / unit 通过
```

### **P1-B：写回 + 多页面联动 + E2E**

目标：

```text
工作台开始生成
→ 事件写回
→ 章节/角色/世界/成就/个人中心变化
→ E2E 验证
```

验收：

```text
完整工作流 E2E 通过
```

这样更稳，也更方便 review。

---

## **三、主控裁定：按修订版执行**

主控对该文档的裁定如下。

```text
@novelforge-p1-info-lite-plan.md：有条件通过
允许作为 P1 + Info-Lite 实施基础
但必须先修订以下内容：

1. 增加 P1-0A Stitch Action Contract 阶段。
2. 修正 SolidJS createSignal 用法。
3. 移除 ChapterInformationState getter，改为 entropyDelta 字段。
4. 修正 InformationLink.relationType 与 Mock 数据不一致问题。
5. 修正所有空 ID / 模板字符串缺失问题。
6. applyWorkflowEvents 必须落到实际 mutations，不允许只写注释。
7. runMockGeneration 不应自动写回，写回应由 useNovelWorkflow 注入 mutations 执行。
8. 统一 status 枚举，避免 success/completed 混用。
9. contextRefs 改为 string[]。
10. 信息流评分字段改为稳定值，避免 E2E 随机。
11. 补充 WorkflowEvent → Provider mutation 对照表。
12. 将执行拆为 P1-A / P1-B 两个批次。
```

---

## **四、修订后的执行顺序**

建议把原方案执行顺序改为：

```text
P1-0A：Stitch 全按钮 Action Contract
↓
P1-A1：Info-Lite 类型定义
↓
P1-A2：NovelCommand / NovelAgentResult / WorkflowEvent 类型
↓
P1-A3：MockAgentAdapter 返回稳定 NovelAgentResult + informationState
↓
P1-A4：ChapterInfoPanel 信息审计块
↓
P1-A Review
↓
P1-B1：useNovelWorkflow 接入 mutations
↓
P1-B2：applyWorkflowEvents 真正写回 chapter
↓
P1-B3：接入工作台开始生成 / 编辑器 AI 续写 / 采纳结果 / 重新提取
↓
P1-B4：角色 / 世界设定 / 成就 / 个人中心联动
↓
P1-B5：workflow E2E
↓
P1-B Review
```

---

## **五、给 Trae 的修订指令**

```text
主控评审 @novelforge-p1-info-lite-plan.md：有条件通过。

该方案方向正确，但不能直接照抄执行。请先修订方案并按以下要求执行。

一、必须新增前置阶段：
Phase P1-0A — Stitch Action Contract。

输出：
docs/reports/phase-p1-action-contract.md

内容必须覆盖所有 Stitch 页面按钮：
- TopAppBar / SideNav
- 02 我的书架
- 03 创建项目弹窗
- 04 工作台
- 05 编辑器
- 06 角色追踪
- 07 世界设定
- 09 个人中心
- 10 生成参数弹窗
- 11 成就系统
- 12 引导页
- ModalHost 全部弹框

每个按钮必须标注：
页面、按钮名、功能概要、动作类型 NAV/MODAL/CRUD/AI_WORKFLOW/INFO_WORKFLOW/FUTURE、P1 是否必须、handler / workflow / provider、是否暂缓。

二、修正文档中的代码风险：
1. SolidJS createSignal 必须使用 [getter, setter]。
2. ChapterInformationState 不使用 getter，改为 entropyDelta 字段。
3. InformationLink.relationType 加入 mystery 或修改 Mock 数据。
4. 所有 task/atom/link id 必须唯一，不允许 task-- / atom- / link-。
5. contextRefs 使用 string[]，不要使用 Set<string>。
6. status 统一为 completed / failed / cancelled，避免 success 与 completed 混用。
7. MockAgentAdapter 不使用随机值作为 E2E 依赖字段。
8. runMockGeneration 只生成 result/events，不直接写回。
9. applyWorkflowEvents 必须接收 mutations 并真实写回 store，不能只写注释。

三、必须补充事件写回对照表：
每个 NovelWorkflowEvent 对应哪个 provider/hook mutation：
- chapter.generated
- chapter.extracted
- character.updated
- world.referenced
- achievement.progressed
- profile.stats.updated
- information.assessed

四、执行拆分为两个批次：

P1-A：Workflow + Info-Lite 基础
目标：
- 新增 information-flow 类型
- 扩展 NovelAgentResult / Chapter
- MockAgentAdapter 返回 informationState
- ChapterInfoPanel 展示信息审计块
验收：
- typecheck 通过
- MockAgentAdapter unit test 通过
- 编辑器右侧可见信息审计块

P1-B：写回 + 联动 + E2E
目标：
- useNovelWorkflow 注入 mutations
- applyWorkflowEvents 真正写回 chapter / character / world / achievement / profile
- 工作台开始生成接入
- 编辑器 AI 续写 / 采纳 / 重新提取接入
- 多页面联动
- 新增 workflow E2E
验收：
- typecheck 通过
- unit test 通过
- 既有 E2E 不回归
- 新 workflow E2E 通过

五、禁止事项保持不变：
不接真实模型。
不做完整 Skill 系统。
不做 DailyLog。
不做 SQLite。
不做真实信息审计 Agent。
不新增 InformationAtomProvider / InformationLinkProvider。
不删除 _legacy。
不推翻现有 components/hooks/providers/types 架构。

完成 P1-0A + 方案修订后，先输出：
[READY_FOR_PHASE_P1_ACTION_CONTRACT_REVIEW]

完成 P1-A 后输出：
[READY_FOR_PHASE_P1A_INFO_LITE_REVIEW]

完成 P1-B 后输出：
[READY_FOR_PHASE_P1B_WORKFLOW_REVIEW]
```

---

## **六、当前最终裁定**

```text
方案方向：通过
执行范围：收敛后通过
立即执行：先做 P1-0A Action Contract
暂缓：不要直接开写 12 个文件
必须修正：类型、signal、事件写回、状态枚举、ID、随机值
P1 拆分：P1-A Info-Lite 基础 + P1-B Workflow 联动
```

这份方案最重要的价值是把信息流理论落到了 `NovelAgentResult → ChapterInformationState → ChapterInfoPanel` 这条最短路径上。只要修正上述执行风险，它就可以成为第一版 MVP 的核心实施方案。

*内容由 AI 生成仅供参考*
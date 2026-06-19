要和我们实际的stitch页面结合啊，这3个是技术方向，是没有阅读我们当前的代码和架构情况下制作的，需要重新考虑我们的产品，数据流和工作流的编排，重新输出一份可执行的计划方案文档，请重新设计

### **重新设计后的 P1 目标：不是做“通用 Agent 技术验证”，而是把当前 Stitch 小说编辑器产品改造成可编排的 MVP 工作流系统。**

你说得对。前一版 P1 方案偏“技术机制罗列”，没有充分落到你们当前已经实现的 Stitch 页面、SolidJS 组件架构、Mock 数据流和实际产品链路上。重新设计后，P1 不应该从外部技术概念出发，而应该从你们当前的产品状态出发：**书架、工作台、章节编辑器、角色面板、世界设定、个人中心、成就、生成设置这些页面已经存在，下一步要把它们组织成一套真实可运行的小说创作工作流。**

下面是一份可以直接下发给 Trae 的 **P1 可执行计划方案文档**。

---

# **Novel MVP P1 可执行计划方案**

## **一、当前产品真实状态**

当前项目不是从零开始，也不是单纯研究外部 Agent 技术。项目已经有一套基于 Stitch 原型还原出来的小说编辑器前端 MVP。

当前已具备：

```text
1. /novel 应用入口已存在。
2. 书架页面已存在。
3. 工作台三栏布局已存在。
4. 章节编辑器页面已存在。
5. 角色追踪面板已存在。
6. 世界设定页面已存在。
7. 个人中心页面已存在。
8. 成就系统页面已存在。
9. 25 道题引导页已存在。
10. 生成参数弹窗已存在或已有壳层。
11. mock-data / hooks / providers / types / components 四层结构已形成。
12. M1 已补充 MVP 主链路 E2E 的 data-testid 与测试草案。
```

当前真正的问题不是“有没有页面”，而是：

```text
页面之间只是能跳转，还没有形成清晰的创作工作流。
Mock 数据只是展示数据，还没有形成业务状态流。
AI 任务只是视觉模块，还没有形成可编排任务模型。
章节、角色、世界观、生成设置之间还没有建立可追踪的依赖关系。
Stitch 页面是静态产品形态，但现在需要变成可交互 MVP。
```

因此 P1 的核心目标必须重新定义。

---

## **二、P1 阶段目标**

P1 阶段名称建议定为：

```text
Phase P1 — Product Workflow Orchestration
产品工作流编排阶段
```

P1 的目标不是接真实后端，也不是接真实 AI，而是基于当前 Stitch 页面和现有 SolidJS 架构，建立一套 **Mock 可运行的小说创作工作流引擎**。

P1 完成后，用户应该可以在前端完整体验以下流程：

```text
创建/选择项目
→ 进入工作台
→ 查看大纲和章节
→ 配置生成参数
→ 触发一次 AI Mock 生成任务
→ 生成内容进入编辑器或任务结果区
→ 编辑器展示章节正文和 AI 提取信息
→ AI 提取信息反向更新角色面板和世界设定
→ 成就系统根据操作进度变化
→ 个人中心统计同步变化
```

也就是说，P1 的核心不是“更像某个技术工具”，而是：

```text
让当前 Stitch 小说产品从静态页面变成可编排、可演示、可验收的 MVP 工作流。
```

---

## **三、P1 成功标准**

P1 完成后，必须达到以下结果：

```text
1. 用户能从书架进入某个项目。
2. 工作台能展示该项目下真实 mock 章节、大纲、任务和生成配置。
3. 用户能点击“AI 生成大纲 / 生成细纲 / 生成章节 / 批量生成”等入口之一，触发 Mock AI Task。
4. AI Task 有明确生命周期：idle → queued → running → completed / failed。
5. completed 后能产生结构化结果，而不是只改 UI 状态。
6. 结构化结果能写回当前 mock store：
   - 章节正文更新
   - 章节摘要更新
   - AI 提取信息更新
   - 角色状态更新
   - 世界设定引用更新
   - 成就进度更新
7. 编辑器页面能看到生成后的章节内容和右侧 AI 提取信息。
8. 角色面板能看到从章节中提取出来的角色状态变化。
9. 世界设定页能看到相关设定引用或更新记录。
10. 个人中心统计字数、章节数、生成次数有变化。
11. E2E 能覆盖至少一条完整 Mock 生成链路。
```

---

## **四、P1 不做什么**

P1 必须严格控制边界。

本阶段不做：

```text
1. 不接真实后端。
2. 不接真实 AI。
3. 不做真实登录。
4. 不做真实导出。
5. 不做真实支付。
6. 不做多人协作。
7. 不做 Git 分支真实管理。
8. 不做复杂数据库。
9. 不做大规模响应式重构。
10. 不删除 _legacy。
```

P1 做的是：

```text
在现有前端和 mock 数据层内，完成产品级工作流编排。
```

---

## **五、当前架构应如何演进**

当前你们的架构大致是：

```text
types/
  定义 Project / Chapter / Outline / Character / AI Task 等类型

mock-data/
  提供项目、章节、大纲、角色、世界设定、成就、个人中心等种子数据

providers/
  提供基础数据源与状态管理

hooks/
  页面消费数据的适配层

components/
  SolidJS 页面与组件
```

这个架构方向是对的。P1 不应该推翻它，而应该在中间补一个明确的 **workflow orchestration 层**。

建议新增：

```text
packages/app/src/novel/workflows/
```

目标是把“点击按钮后发生什么”从 UI 组件里抽出来，变成可测试、可复用、可追踪的工作流函数。

推荐结构：

```text
packages/app/src/novel/
├── workflows/
│   ├── index.ts
│   ├── types.ts
│   ├── ai-generation-workflow.ts
│   ├── chapter-update-workflow.ts
│   ├── extraction-workflow.ts
│   ├── achievement-workflow.ts
│   └── workflow-events.ts
```

这层不是真实后端，不是真实 AI，只是 MVP 的前端编排层。

它的职责是：

```text
1. 接收用户动作。
2. 创建 AI Task。
3. 模拟任务执行。
4. 生成结构化结果。
5. 分发结果到 chapter / character / world / achievement / profile 等状态。
6. 返回 UI 可展示的状态。
```

---

## **六、P1 核心数据流设计**

### **1. 当前应统一的数据流**

P1 后的标准数据流应该是：

```text
用户点击 UI
→ component 调用 action
→ action 调用 workflow
→ workflow 调用 hook/provider 暴露的 mutation
→ mock store 更新
→ SolidJS 响应式刷新页面
→ E2E 验证 UI 变化
```

禁止继续出现：

```text
component 内部直接 hardcode 结果
component 内部临时 setTimeout 模拟状态
不同页面各自维护一份重复 mock 状态
AI task 只显示进度但不产生业务结果
章节正文更新了，但角色/世界观/成就不联动
```

### **2. P1 推荐的业务事件模型**

新增统一事件类型：

```ts
export type NovelWorkflowEvent =
  | {
      type: "chapter.generated";
      projectId: string;
      chapterId: string;
      content: string;
      summary: string;
      wordCount: number;
    }
  | {
      type: "character.extracted";
      projectId: string;
      chapterId: string;
      characterIds: string[];
      changes: CharacterStateChange[];
    }
  | {
      type: "world.reference.extracted";
      projectId: string;
      chapterId: string;
      worldItemIds: string[];
    }
  | {
      type: "achievement.progressed";
      projectId: string;
      achievementId: string;
      delta: number;
    }
  | {
      type: "profile.stats.updated";
      projectId: string;
      wordCountDelta: number;
      generationCountDelta: number;
    };
```

这不是为了炫技，而是为了让工作流可追踪。

例如一次“生成章节”完成后，应该产生：

```text
chapter.generated
character.extracted
world.reference.extracted
achievement.progressed
profile.stats.updated
```

这些事件再驱动各页面同步变化。

---

## **七、P1 应结合 Stitch 页面重新定义功能链路**

下面按当前 Stitch 产品页面来设计。

---

## **1. 书架页面 Bookshelf**

### **当前作用**

书架是项目入口。

### **P1 目标**

书架不只是展示卡片，而要成为项目上下文入口。

### **数据要求**

每个项目卡片至少需要：

```ts
Project {
  id: string;
  title: string;
  description: string;
  genre: string;
  coverUrl?: string;
  wordCount: number;
  chapterCount: number;
  updatedAt: string;
  progress: number;
}
```

### **P1 工作流**

```text
点击项目卡片
→ selectProject(projectId)
→ openView("workspace")
→ workspace 所有 hook 使用当前 projectId
```

### **验收**

```text
从书架选择不同项目后，工作台项目名、章节列表、字数统计必须变化。
```

---

## **2. 工作台 Workspace**

### **当前作用**

工作台是核心创作控制台。

### **P1 目标**

工作台必须成为“任务编排中心”，不是静态三栏展示页。

### **Stitch 对应模块**

```text
左栏：
- 项目信息
- 大纲/章节/人物/设定/导出导航
- 章节树
- AI生成大纲按钮
- 生成细纲按钮

中栏：
- 当前章节预览
- AI 任务进度 Dock
- 章节内容

右栏：
- 生成设置
- 字数、模型、上下文选择
- 开始生成按钮
```

### **P1 必须实现的工作流**

```text
点击“AI生成大纲”
→ 创建 ai-task: outline-generation
→ running
→ completed
→ outline mock 数据新增/更新
→ 左栏大纲刷新

点击“生成细纲”
→ 创建 ai-task: detailed-outline-generation
→ completed
→ 当前章节 outline detail 更新

点击“开始生成 / 生成章节”
→ 创建 ai-task: chapter-generation
→ completed
→ 当前章节 content / summary / extractedInfo 更新
→ 编辑器可读取更新结果
```

### **P1 不要求真实 AI**

Mock 生成即可，但必须结构化：

```ts
export interface MockGenerationResult {
  chapterContent: string;
  summary: string;
  extractedCharacters: string[];
  extractedWorldItems: string[];
  keyEvents: string[];
  protagonistState: string;
  wordCount: number;
}
```

---

## **3. 章节编辑器 Novel Editor**

### **当前作用**

编辑器是 MVP 的核心页面。

### **P1 目标**

编辑器要成为“章节状态的可视化结果页 + 轻编辑入口”。

### **Stitch 对应模块**

```text
顶部工具栏：
- 返回
- 章节标题
- 字数统计
- 发布章节
- 历史版本

中间：
- 章节正文

浮动 AI 工具栏：
- 续写
- 改写
- 扩写
- 润色
- 摘要

右侧：
- 章节信息
- AI 提取信息
- 保存草稿
- 标记完成
```

### **P1 工作流**

```text
点击“续写”
→ 创建 ai-task: continue-writing
→ completed
→ 追加正文
→ 更新 wordCount
→ 更新 AI 提取信息
→ 成就进度 +1

点击“摘要”
→ 创建 ai-task: summarize-chapter
→ completed
→ 更新 chapter.summary
→ 右侧 AI 提取信息刷新

点击“保存草稿”
→ 更新 chapter.updatedAt
→ profile stats 不变

点击“标记完成”
→ chapter.status = completed
→ achievement.progressed
```

### **关键要求**

编辑器不能只显示静态 mock 文本。它必须读取当前选中项目和章节：

```text
nav.projectId
nav.chapterId
useNovelChapters(projectId)
currentChapter()
```

---

## **4. 角色面板 Character Panel**

### **当前作用**

展示人物卡和角色追踪。

### **P1 目标**

角色面板要接收章节生成后的“角色状态变化”。

### **Stitch 对应模块**

```text
主角大卡
出场章节数
对话字数
状态追踪
配角卡片
反派卡片
其他角色
```

### **P1 工作流**

```text
章节生成完成
→ extractedCharacters 包含 林青衫 / 苏婉 等
→ 更新角色 lastAppearedChapter
→ 更新角色 appearanceCount
→ 更新主角状态，例如 “受伤 / 获得线索 / 情绪紧张”
→ 角色面板刷新
```

### **验收**

```text
触发一次章节生成后，角色面板中至少一个角色的“最近出场 / 状态 / 出场次数”发生变化。
```

---

## **5. 世界设定 World Setting**

### **当前作用**

展示世界背景、力量体系、地点、物品、技能、势力。

### **P1 目标**

世界设定要接收章节中的设定引用。

### **P1 工作流**

```text
章节生成完成
→ extractedWorldItems 包含 地点 / 功法 / 势力 / 物品
→ world item referenceCount +1
→ lastReferencedChapter 更新
→ 世界设定页显示最近引用
```

### **验收**

```text
生成章节后，世界设定页某个地点或设定卡片显示“最近引用章节”。
```

---

## **6. 生成设置 Generation Settings**

### **当前作用**

配置目标字数、模型、上下文、参考章节等。

### **P1 目标**

生成设置必须真正影响 Mock 生成结果，而不是只展示表单。

### **必须接入的字段**

```ts
GenerationConfig {
  targetWordCount: number;
  tolerance: number;
  referenceChapterCount: number;
  model: string;
  includeOutline: boolean;
  includeSummary: boolean;
  includeCharacters: boolean;
  includeWorldSetting: boolean;
  includeProtagonistState: boolean;
}
```

### **P1 工作流**

```text
用户调整目标字数 3000 → 5000
→ 保存到 generation config
→ 点击生成章节
→ mock 生成结果 wordCount 接近 5000
```

不要求生成真实 5000 字，但 mock 结果的 metadata 必须体现配置生效：

```ts
wordCount: config.targetWordCount
```

---

## **7. 成就系统 Achievements**

### **当前作用**

展示成就卡片。

### **P1 目标**

成就系统要接收工作流事件。

### **P1 成就事件**

```text
第一次生成章节 → 解锁 “初次执笔”
完成 3 章 → 更新 “连载起步”
创建角色 → 更新 “群像初成”
引用世界设定 → 更新 “世界构筑者”
```

### **验收**

```text
触发章节生成后，成就卡片中至少一项 progress 增加。
```

---

## **8. 个人中心 Profile**

### **当前作用**

展示用户统计、积分、充值等。

### **P1 目标**

个人中心统计要与创作行为联动。

### **P1 工作流**

```text
章节生成完成
→ totalWords += generatedWordCount
→ generationCount += 1
→ credits -= mockCost
→ creditRecords 新增一条 “AI 生成章节”
```

### **验收**

```text
生成章节前后，个人中心字数或积分记录发生变化。
```

---

# **八、P1 推荐新增模块**

## **1. workflows/types.ts**

定义工作流通用类型：

```ts
export type WorkflowStatus = "idle" | "queued" | "running" | "completed" | "failed";

export interface WorkflowContext {
  projectId: string;
  chapterId?: string;
  config?: GenerationConfig;
}

export interface WorkflowResult {
  events: NovelWorkflowEvent[];
  taskId: string;
  status: WorkflowStatus;
}
```

---

## **2. workflows/ai-generation-workflow.ts**

负责 Mock AI 生成。

```ts
export async function runMockChapterGeneration(
  context: WorkflowContext,
): Promise<WorkflowResult> {
  // 1. 创建 task
  // 2. 模拟 running
  // 3. 生成结构化 mock result
  // 4. 返回 events
}
```

---

## **3. workflows/workflow-events.ts**

负责事件分发。

```ts
export function applyWorkflowEvents(events: NovelWorkflowEvent[]) {
  for (const event of events) {
    switch (event.type) {
      case "chapter.generated":
        // update chapter store
        break;
      case "character.extracted":
        // update character store
        break;
      case "world.reference.extracted":
        // update world store
        break;
      case "achievement.progressed":
        // update achievement store
        break;
      case "profile.stats.updated":
        // update profile store
        break;
    }
  }
}
```

---

## **4. hooks/use-novel-workflow.ts**

这是页面唯一应该调用的工作流 Hook。

```ts
export function useNovelWorkflow(projectId: Accessor<string | undefined>) {
  const runChapterGeneration = async (chapterId: string) => {
    // 调用 workflow
  };

  const runOutlineGeneration = async () => {
    // 调用 workflow
  };

  const runEditorCommand = async (
    chapterId: string,
    command: AIWritingCommand,
  ) => {
    // 续写/改写/润色/摘要
  };

  return {
    runChapterGeneration,
    runOutlineGeneration,
    runEditorCommand,
  };
}
```

---

# **九、P1 分阶段执行计划**

## **P1-0：代码审计与数据流清单**

### **目标**

确认当前页面到底用了哪些 hook、哪些 mock-data、哪些 hardcode。

### **任务**

```text
1. 扫描 components/novel-workspace
2. 扫描 components/novel-editor
3. 扫描 components/character-panel
4. 扫描 components/world-setting
5. 扫描 components/profile
6. 扫描 components/achievements
7. 扫描 hooks/
8. 扫描 mock-data/
```

### **输出**

```text
docs/reports/phase-p1-0-dataflow-audit.md
```

内容包括：

```text
- 每个页面的数据来源
- 每个按钮当前动作
- hardcode 列表
- 可复用 hooks 列表
- 缺失 mutation 列表
```

---

## **P1-1：统一工作流类型与事件模型**

### **目标**

建立 P1 的最小工作流底座。

### **新增文件**

```text
packages/app/src/novel/workflows/types.ts
packages/app/src/novel/workflows/workflow-events.ts
packages/app/src/novel/workflows/index.ts
```

### **验收**

```text
typecheck 通过
无 UI 行为改变
事件类型覆盖 chapter / character / world / achievement / profile
```

---

## **P1-2：Mock AI Task 生命周期**

### **目标**

让 AI 任务从视觉假进度变成真实 mock 状态机。

### **任务**

```text
1. 扩展 AI task 类型
2. 新增 task status: idle / queued / running / completed / failed
3. 新增 task result 字段
4. 工作台 AI Progress Dock 读取真实 task 状态
5. 生成按钮触发 task lifecycle
```

### **验收**

```text
点击生成按钮后：
- 任务进入 running
- 进度 Dock 显示 running
- 完成后显示 completed
- task result 中有 chapterContent / summary / extractedInfo
```

---

## **P1-3：章节生成写回 Chapter**

### **目标**

章节生成结果真正更新章节数据。

### **任务**

```text
1. runMockChapterGeneration 生成章节内容
2. applyWorkflowEvents 写回 chapter.content
3. 更新 chapter.summary
4. 更新 wordCount
5. 编辑器读取更新后的章节
```

### **验收**

```text
工作台点击生成章节
→ 进入编辑器
→ 能看到新生成内容
→ 字数统计变化
```

---

## **P1-4：AI 提取信息联动角色与世界设定**

### **目标**

章节不是孤立文本，而是能更新角色和世界观状态。

### **任务**

```text
1. Mock 提取角色状态
2. Mock 提取世界设定引用
3. 更新 character appearanceCount / lastAppearedChapter / state
4. 更新 world referenceCount / lastReferencedChapter
```

### **验收**

```text
生成章节后：
- 角色面板至少一项状态变化
- 世界设定至少一项引用变化
```

---

## **P1-5：成就与个人中心统计联动**

### **目标**

让创作行为驱动成长系统。

### **任务**

```text
1. 章节生成后更新 achievement progress
2. 标记章节完成后更新 achievement progress
3. 生成后更新 profile.totalWords
4. 生成后新增 creditRecord
5. mock 扣除 credits
```

### **验收**

```text
生成章节前后：
- 成就 progress 变化
- 个人中心总字数变化
- 积分记录新增
```

---

## **P1-6：E2E 覆盖完整产品工作流**

### **目标**

不是只测页面能打开，而是测完整业务链路。

### **新增 E2E**

```text
novel-workflow-generation.spec.ts
```

### **测试链路**

```text
1. 打开 /novel
2. 点击生成章节
3. 等待 AI task completed
4. 进入编辑器
5. 验证章节正文变化
6. 返回工作台
7. 进入角色面板，验证角色状态变化
8. 进入世界设定，验证引用变化
9. 进入个人中心，验证统计变化
10. 进入成就页，验证 progress 变化
```

---

# **十、P1 与外部工具编排思想的结合方式**

这里要明确：外部工具的价值不是照搬名词，而是抽象为适合当前产品的机制。

## **1. Hook 思想在 P1 的落地**

不做真实插件 Hook，而是在前端 workflow 中先实现“质量关卡”。

```text
Before Generation:
- 检查是否选择 project
- 检查是否选择 chapter
- 检查 generation config 是否完整
- 检查 chapter 是否 locked / completed
- 检查目标字数是否合法

After Generation:
- 提取 summary
- 提取 characters
- 提取 world references
- 更新 achievements
- 更新 profile stats
```

这就是当前产品中的“Hook”。

---

## **2. Subagent 思想在 P1 的落地**

不急着做真实多 Agent，而是先做“领域子流程”。

```text
Character Extraction Workflow
World Reference Workflow
Chapter Summary Workflow
Achievement Workflow
```

这些就是当前阶段的“子 Agent 雏形”。

后续真实 AI 接入时，可以把这些 workflow 替换成真实 Agent 调用。

---

## **3. Daily Log 思想在 P1 的落地**

不做真实磁盘记忆系统，先做前端事件日志。

新增：

```text
workflow-events log
```

用于记录：

```text
什么时候生成了章节
哪些角色被更新
哪些世界设定被引用
哪些成就变化
个人中心统计如何变化
```

后续接真实本地文件或后端时，这个事件日志可以演进成真正的持久化记忆。

---

# **十一、Trae 可直接执行的 P1 指令**

```text
主控下发 Phase P1 — Product Workflow Orchestration。

背景：
当前 novel 应用已经完成 Stitch 页面还原和 MVP 主链路 E2E 基础。下一阶段不继续做静态页面，也不直接接真实 AI，而是基于当前 SolidJS 架构、mock-data、hooks、providers，建立一套可运行的小说创作工作流编排。

P1 总目标：
让当前 Stitch 小说编辑器从静态页面变成可演示的 Mock 工作流 MVP。用户可以从书架进入项目，在工作台触发 Mock AI 生成任务，生成结果写回章节，并联动角色、世界设定、成就和个人中心统计。

执行阶段：

P1-0 数据流审计：
1. 扫描 components/novel-workspace、novel-editor、character-panel、world-setting、profile、achievements。
2. 扫描 hooks、providers、mock-data、types。
3. 输出页面数据来源、按钮动作、hardcode、缺失 mutation、可复用 hooks。
4. 生成 docs/reports/phase-p1-0-dataflow-audit.md。

P1-1 工作流类型与事件模型：
1. 新增 packages/app/src/novel/workflows/。
2. 新增 types.ts、workflow-events.ts、index.ts。
3. 定义 NovelWorkflowEvent，覆盖 chapter.generated、character.extracted、world.reference.extracted、achievement.progressed、profile.stats.updated。
4. 不改变 UI，只保证 typecheck 通过。

P1-2 Mock AI Task 生命周期：
1. 扩展 AI task 状态机：idle / queued / running / completed / failed。
2. 生成按钮触发真实 mock task。
3. AI Progress Dock 读取真实 task 状态。
4. completed 后 task.result 必须包含 chapterContent、summary、extractedCharacters、extractedWorldItems、keyEvents、wordCount。

P1-3 章节生成写回：
1. 实现 runMockChapterGeneration。
2. 生成结果写回 chapter.content、chapter.summary、chapter.wordCount、chapter.updatedAt。
3. 编辑器读取更新后的章节数据。
4. 工作台生成章节后进入编辑器能看到新内容。

P1-4 角色与世界设定联动：
1. 根据 generated result 更新角色状态。
2. 更新 character.lastAppearedChapter、appearanceCount、state。
3. 更新 world item referenceCount、lastReferencedChapter。
4. 角色面板和世界设定页必须响应式刷新。

P1-5 成就与个人中心统计联动：
1. 章节生成后更新 achievement progress。
2. 更新 profile.totalWords、generationCount。
3. 新增 creditRecord。
4. mock 扣除 credits。

P1-6 E2E 工作流覆盖：
1. 新增 e2e/novel/novel-workflow-generation.spec.ts。
2. 覆盖完整链路：
   /novel → 生成章节 → task completed → 编辑器查看内容 → 角色面板变化 → 世界设定变化 → 成就变化 → 个人中心统计变化。
3. E2E 必须验证业务状态变化，而不仅是页面可见。

禁止事项：
1. 不接真实后端。
2. 不接真实 AI。
3. 不做真实插件系统。
4. 不做真实多 Agent。
5. 不做 Git Worktree。
6. 不做响应式大重构。
7. 不删除 _legacy。
8. 不推翻现有 components/hooks/providers/types 架构。
9. 单文件保持 < 500 行。

验证命令：
cd packages/app && bun typecheck
cd packages/app && bun test src/novel
cd packages/app && bunx playwright test e2e/novel --reporter=list

P1 完成汇报格式：
- 修改文件列表
- P1-0 至 P1-6 完成情况
- 新增 workflow 事件类型
- Mock AI Task 生命周期截图或日志
- 章节写回验证
- 角色/世界设定联动验证
- 成就/个人中心联动验证
- typecheck / unit / E2E 结果
- 遗留问题
- [READY_FOR_PHASE_P1_REVIEW]
```

---

# **十二、P1 最终验收标准**

P1 不以“写了多少技术模块”为验收标准，而以产品链路为标准。

必须满足：

```text
1. 书架项目选择影响工作台数据。
2. 工作台生成按钮能触发真实 mock task。
3. AI Progress Dock 显示真实 task 生命周期。
4. task completed 后有结构化 result。
5. result 写回章节。
6. 编辑器展示更新后的章节。
7. result 联动角色面板。
8. result 联动世界设定。
9. result 联动成就进度。
10. result 联动个人中心统计。
11. E2E 覆盖完整生成链路。
12. typecheck / unit / E2E 全部通过。
```

---

# **十三、P1 后续演进方向**

P1 完成后，再进入 P2。

P2 才适合做：

```text
1. 真实 AI 接入。
2. 真实命令系统。
3. 真实本地持久化。
4. 真实 Agent 分工。
5. 真实长上下文压缩。
6. 多模型路由。
7. Git 分支/故事分支。
```

因为 P1 会先把产品内部的数据流和工作流打通。只有在这个基础上，后续接任何真实 AI 或外部工具编排才不会变成“技术演示”，而是真正服务当前小说编辑器产品。

---

当前重新定义后的阶段状态：

```text
当前阶段：Phase P1 — Product Workflow Orchestration
目标：把当前 Stitch 页面还原成果升级为可运行的 Mock 工作流 MVP
核心：章节生成 → 章节写回 → 角色/世界/成就/个人中心联动
技术边界：前端 mock workflow，不接真实 AI，不接真实后端
最终验收：完整小说创作工作流 E2E 通过
```

本地trae已经阅读完当前的代码和文档，输出 @novelforge-ui-to-agent-feasibility.md ，请评审，决策相关疑问，输出评审意见文档，当前文档核心内容：
### 59 个交互点全量扫描
对 10 个页面区域 的每一个按钮、表单、工具栏进行了完整盘点：

分类 数量 说明 A 类：AI 驱动 28 个 需要 Agent/Skill/Command/Hook 四层协作 B 类：纯数据操作 31 个 Provider CRUD 即可，无需 AI

### 四层架构映射
每个 A 类交互都设计了完整的执行链路：

### 关键交付物
- 29 个新增文件清单 （按 4 Phase 排序，含行数估算）
- 8 个现有文件修改清单 （含具体改动点）
- 5 个新 Provider 接口定义 （WorldSetting / Foreshadowing / Inspiration / Export / Skill）
- A01 AI 续写的端到端数据流时序图 （T+0ms 到 T+???ms 完整链路）
### 需要主控决策的 4 个输入
编号 决策项 选项 D1 LLM API 选型与预算 DeepSeek / Claude / GPT / Qwen / 本地模型 D2 数据持久化方案 YAML 文件 / SQLite / IndexedBrowser D3 OpenCode 插件集成深度 纯前端 / OpenCode 插件 / 混合模式 D4 首批 Skill 覆盖范围 哪些 genre 优先,ben

### **评审结论：这份可行性文档方向正确，但不能直接作为 P1 执行计划；需要收敛为“当前 Stitch 产品工作流优先”的 P1 方案。**

`@novelforge-ui-to-agent-feasibility.md` 的价值在于完成了当前代码与 Stitch 页面交互点的全量盘点，尤其是 59 个交互点、A/B 分类、A01 AI 续写端到端链路，对后续架构演进很有帮助。但它的问题也很明显：文档仍然偏“终态架构蓝图”，一次性引入 Agent、Skill、Command、Hook、Real Provider、Streaming、FileStore、DailyLog 等能力，实施面过大。主控建议：**接受该文档作为架构参考，不批准按 29 个新增文件全量开工；P1 必须缩小为“产品工作流编排最小闭环”。**

# **NovelForge UI→工作流→Agent 可行性评审意见**

## **一、审阅对象**

本次审阅对象为：

```text
novelforge-ui-to-agent-feasibility.md
```

该文档基于当前实际代码 `packages/app/src/novel` 进行了较完整的架构扫描，识别了 10 个页面区域、59 个交互点，并将其划分为：

```text
A 类：AI 驱动交互 28 个
B 类：纯数据操作 31 个
```

文档进一步提出了四层架构映射：

```text
UI 按钮
→ Command Interpreter
→ Hook Pipeline
→ Skill Context
→ Agent Router
→ AITask 结果返回 UI
```

同时列出了 29 个新增文件、8 个修改文件、5 个新增 Provider 接口，并要求主控决策 D1-D4。

---

## **二、总体评审结论**

主控结论如下：

```text
文档状态：通过评审，但需降级执行范围
可作为：P1/P2/P3 架构蓝图
不可作为：P1 直接开发清单
当前批准：P1-MVP 工作流最小闭环
暂不批准：29 个新增文件一次性实施
暂不批准：完整真实 Agent / Skill / 多模型 / DailyLog / 文件持久化全量落地
```

这份文档最大贡献是把当前产品中“哪些按钮需要 AI、哪些按钮只是 CRUD”说清楚了，这是非常重要的。但它的执行计划仍然过于靠近终态 Agent 系统，和当前已经完成的 Stitch 页面 MVP 之间还缺一个过渡层。

当前 P1 的正确目标不是“立刻实现完整 Agent 平台”，而是：

```text
先让当前 Stitch 页面里的核心按钮形成可运行的产品工作流。
```

也就是：

```text
工作台点击生成
→ 创建任务
→ 任务运行
→ 生成结构化结果
→ 写回章节
→ 编辑器显示结果
→ 角色/世界设定/成就/个人中心联动变化
```

只有这个闭环跑通后，再接真实模型、真实 Skill、真实 Hook、真实持久化才有意义。

---

## **三、文档优点**

### **1. 59 个交互点扫描有价值**

文档对 10 个页面区域做了完整扫描，这一点非常关键。它把当前产品从“页面集合”转成了“交互地图”。

尤其是 A/B 分类合理：

```text
A 类：需要 AI 编排，例如 AI 续写、AI 提取、大纲生成、开始生成、采纳结果等。
B 类：只需要 Provider CRUD，例如搜索项目、选择项目、表单输入、章节星标、返回工作台等。
```

这能避免后续把所有按钮都过度设计成 Agent 任务。

主控接受这个分类方法，并建议后续所有新增交互都必须标注：

```text
A 类：AI / Agent / Workflow
B 类：Provider CRUD / UI State
C 类：Navigation / Modal
```

### **2. A01 AI 续写链路分析充分**

文档对 A01 “AI 续写”从按钮点击到任务返回的链路拆得比较细：

```text
EditorToolbar 点击
→ Command 构建
→ Hook 检查
→ Context 组装
→ Agent 路由
→ 流式任务
→ AIResultCard
→ 用户采纳
→ 写回章节
```

这是后续所有 AI 操作的标准模板。

主控接受 A01 作为 **P1 核心样板链路**。

### **3. A 类优先级排序基本正确**

文档把下面几个交互列为 P0，是合理的：

```text
A01 AI 续写
A06 AI 提取信息
A07 AI 生成大纲
A09 开始生成
A12 取消任务
A14 采纳结果
```

这几个正好覆盖小说编辑器 MVP 的核心链路：

```text
生成 → 分析 → 展示 → 采纳 → 写回
```

主控建议 P1 只做这些，不要扩展到所有 28 个 A 类交互。

### **4. Provider 缺口识别准确**

文档指出当前缺少：

```text
WorldSettingProvider
ForeshadowingProvider
InspirationProvider
ExportProvider
SkillProvider
```

这个判断是对的。但主控不建议 P1 全部新增。P1 只批准其中和当前工作流闭环直接相关的最小接口。

---

## **四、主要问题与修正意见**

## **问题 1：终态架构过重，不适合 P1 直接执行**

文档建议新增 29 个文件，分为：

```text
Hook
Command
Agent
Model Router
Skill
File Store
Daily Log
Real Agent Provider
```

这对于当前阶段太重。

当前项目还处于：

```text
Stitch 页面 MVP
Mock 数据串联
产品工作流闭环
```

如果现在直接引入完整 Agent 架构，会导致：

```text
1. 文件数量暴涨。
2. 真实 AI 与 Mock 工作流混杂。
3. 还没验证产品链路，就开始做底层平台。
4. E2E 难以稳定。
5. Trae 执行范围失控。
```

主控修正：

```text
P1 不做完整 Agent 平台。
P1 做 Workflow Adapter。
```

也就是先用最小架构承载未来 Agent：

```text
UI
→ useNovelWorkflow
→ Command Object
→ MockAgentAdapter
→ WorkflowEvents
→ Providers
→ UI 响应式刷新
```

不要一上来就做完整：

```text
Command Interpreter + Hook Pipeline + Skill Context + Real Agent Router + DailyLog
```

这些进入 P2/P3。

---

## **问题 2：Hook / Skill / Agent 概念需要产品化落地**

文档大量使用 Hook、Skill、Agent、Command 等技术概念，但 P1 必须把这些概念翻译成当前产品动作。

P1 中的映射应该是：

| 技术概念 | P1 产品化落地 |
|---|---|
| Command | 用户点击按钮后生成的结构化动作对象 |
| Hook | 生成前/生成后的校验函数 |
| Agent | Mock 生成器或任务执行器 |
| Skill | 基于小说类型的 prompt 模板，不做动态加载系统 |
| DailyLog | 工作流事件日志，不做跨会话文件记忆 |
| ModelRouter | 暂时只是模型字段和 adapter 接口，不做多模型路由 |

例如：

```text
点击“开始生成”
```

P1 不应该变成：

```text
完整 AgentRouter + 多模型选择 + SkillLoader + HookPipeline
```

而应该变成：

```text
createCommand("chapter.generate")
→ validateCommand()
→ runMockGeneration()
→ emitWorkflowEvents()
→ applyEvents()
```

这才是当前阶段最小可执行版本。

---

## **问题 3：B 类交互不能完全视为低优先级**

文档将 B 类定义为 Provider CRUD，这个分类没问题，但不能因此把 B 类都放到后面。

有些 B 类是 AI 工作流的前置条件，例如：

```text
B03 选择项目
B27 选择章节
B29 章节完成状态
A21-A28 生成配置虽然归 AI 参数，但本质依赖表单状态
```

如果这些 B 类不稳，A 类工作流也跑不起来。

所以 P1 必须包含部分关键 B 类：

```text
项目选择
章节选择
当前 projectId / chapterId 同步
生成配置读写
章节状态更新
```

---

## **问题 4：Provider 新增范围需要收敛**

文档建议新增 5 个 Provider：

```text
WorldSettingProvider
ForeshadowingProvider
InspirationProvider
ExportProvider
SkillProvider
```

主控裁定：

| Provider | P1 是否批准 | 说明 |
|---|---:|---|
| WorldSettingProvider | 批准最小版 | 用于章节生成后更新世界设定引用 |
| ForeshadowingProvider | 暂缓 | 可先作为 chapter.extractedInfo.keyEvents / hints 字段存在 |
| InspirationProvider | 暂缓 | “存为灵感”P1 可先写入 chapter.aiSuggestions |
| ExportProvider | 不批准 | 导出不是 P1 工作流核心 |
| SkillProvider | 不批准 | P1 只做静态 genre prompt template |

P1 的原则是：

```text
只新增能支撑“生成章节 → 写回 → 页面联动”的 Provider。
```

---

## **问题 5：真实模型接入不应成为 P1 阻塞项**

文档提出 D1 需要选择 LLM API 和预算，但当前 P1 的首要目标是产品工作流闭环，不是真实模型效果。

所以 D1 的决策不应阻塞 P1。

主控建议：

```text
P1 默认使用 MockAgentAdapter。
只预留 RealAgentAdapter 接口。
真实模型接入作为 P1 后半段可选项或 P2。
```

这样可以避免 P1 因 API Key、模型输出不稳定、网络问题、成本问题而失控。

---

# **五、D1-D4 主控决策**

## **D1：LLM API 选型与预算**

### **主控决策**

```text
P1 不以真实 LLM API 作为验收依赖。
P1 默认使用 MockAgentAdapter。
仅预留 RealAgentAdapter 接口。
如需演示真实生成，只允许接入一个低成本文本生成适配器作为实验开关，不进入主链路验收。
```

### **原因**

当前产品最重要的是跑通：

```text
按钮 → 任务 → 结果 → 写回 → 页面联动
```

而不是真实生成质量。

真实模型接入会带来：

```text
网络不稳定
API Key 管理
成本预算
输出不可控
E2E 不稳定
```

这些都会干扰当前 P1 的主要目标。

### **P1 允许的接口设计**

可以新增抽象接口：

```ts
export interface NovelAgentAdapter {
  run(command: NovelCommand): Promise<NovelAgentResult>;
  cancel(taskId: string): Promise<void>;
  retry(taskId: string): Promise<NovelAgentResult>;
}
```

实现两个 adapter：

```text
MockAgentAdapter：P1 主用，稳定可测
RealAgentAdapter：只保留接口或实验开关，不作为验收标准
```

### **预算裁定**

```text
P1 预算：0，默认不消耗真实 API。
P2 再单独申请真实模型预算。
```

---

## **D2：数据持久化方案**

### **主控决策**

```text
P1 不引入 SQLite。
P1 不把 IndexedDB 作为主路径。
P1 使用内存 store + mock-data 响应式更新。
如果必须持久化，优先设计 FileStore/YAML Adapter 接口，但不强制落地真实文件写入。
```

### **原因**

当前代码主要是：

```text
mock-data
providers
hooks
SolidJS 响应式页面
```

如果 P1 直接上 SQLite，会引入迁移、事务、查询层、测试初始化等额外复杂度。当前阶段不需要。

YAML / Markdown 更适合后续本地小说项目结构，但这应在 P2 或 P3 做。

### **P1 数据策略**

P1 只需要做到：

```text
本次浏览器会话内状态可变
页面间响应式同步
E2E 能验证变化
```

也就是：

```text
生成章节前 → 字数 A
生成章节后 → 字数 B
角色状态变化
世界设定引用变化
成就进度变化
个人中心统计变化
```

不要求刷新浏览器后还在。

### **后续演进**

```text
P1：内存 store + mock-data
P2：FileStore Adapter，YAML / Markdown
P3：如有复杂查询，再评估 SQLite
```

---

## **D3：OpenCode 插件集成深度**

### **主控决策**

```text
选择 C-lite：轻量混合模式。
当前 UI 和 workflow 继续放在 packages/app/src/novel。
不在 P1 深度接入插件系统。
但所有 workflow / agent adapter / command 类型要设计成未来可迁移到插件层。
```

### **不是纯前端，也不是完整插件**

不选择“纯前端”的原因：

```text
未来一定需要真实工具、文件系统、模型调用、命令系统。
如果 P1 完全写死在前端组件里，后面迁移成本高。
```

不选择“完整插件”的原因：

```text
当前 Stitch UI 还在快速变化。
P1 目标是产品工作流闭环。
过早插件化会拖慢交付。
```

所以采用：

```text
C-lite 轻量混合模式
```

结构如下：

```text
components/
  只负责展示和用户操作

hooks/
  useNovelWorkflow
  页面调用入口

workflows/
  产品工作流编排

commands/
  结构化命令对象，可选

adapters/
  MockAgentAdapter / FutureRealAgentAdapter

providers/
  当前数据源和 mutation
```

未来如果要接底座工具系统，可以把：

```text
commands/
workflows/
adapters/
```

迁移到插件或后端，而 UI 不需要大改。

---

## **D4：首批 Skill 覆盖范围**

### **主控决策**

```text
P1 不实现完整 SkillProvider。
P1 只做 genrePromptTemplates。
首批覆盖 3 类：
1. 玄幻 / 仙侠 / 武侠，合并为“东方幻想模板”
2. 都市 / 现实，合并为“现代现实模板”
3. 悬疑 / 推理，合并为“悬疑推理模板”
```

### **原因**

当前 Stitch 示例内容明显偏：

```text
江湖
古刹
长剑
师门任务
主角状态追踪
力量体系
```

所以首要模板必须覆盖东方幻想类。

但产品不能只服务古风，所以 P1 再加两个常见类型：

```text
现代现实
悬疑推理
```

P1 不做动态 Skill Markdown 加载，不做 Skill 市场，不做自动匹配引擎。只做一个简单函数即可：

```ts
export function getGenrePromptTemplate(genre: NovelGenre): string {
  // 返回对应 genre 的写作约束
}
```

### **后续演进**

```text
P1：静态 genre prompt template
P2：Skill 文件格式
P3：SkillLoader + 动态匹配 + 用户自定义 Skill
```

---

# **六、P1 批准执行范围**

主控批准 P1 只做以下范围。

## **P1 名称**

```text
Phase P1 — Product Workflow Orchestration
产品工作流编排阶段
```

## **P1 总目标**

```text
基于当前 Stitch 页面和现有 SolidJS 架构，跑通“AI Mock 生成 → 章节写回 → 多页面联动”的产品工作流闭环。
```

## **P1 核心链路**

```text
工作台点击开始生成
→ 创建 AI Task
→ MockAgentAdapter 生成结构化结果
→ result 写回章节
→ 编辑器展示新正文和 AI 提取信息
→ 角色面板状态变化
→ 世界设定引用变化
→ 成就进度变化
→ 个人中心统计变化
→ E2E 验证完整链路
```

---

# **七、P1 不批准范围**

以下内容暂不进入 P1：

```text
1. 不接真实 LLM 主链路。
2. 不做完整多模型路由。
3. 不做完整 Skill 系统。
4. 不做 DailyLog 文件记忆。
5. 不做 Git Worktree。
6. 不做完整插件化。
7. 不做导出系统。
8. 不做真实数据库。
9. 不做所有 28 个 A 类交互。
10. 不新增 29 个文件全量落地。
```

这些可以进入：

```text
P2：真实 Agent 接入
P3：持久化与 Skill 系统
P4：长篇上下文、分支、导出等增强
```

---

# **八、P1 文件执行方案**

## **1. 批准新增文件**

P1 只批准新增以下最小文件集：

```text
packages/app/src/novel/workflows/
├── index.ts
├── types.ts
├── novel-command.ts
├── workflow-events.ts
├── mock-generation-workflow.ts
└── apply-workflow-events.ts

packages/app/src/novel/hooks/
└── use-novel-workflow.ts

packages/app/src/novel/adapters/
├── novel-agent-adapter.ts
└── mock-agent-adapter.ts

packages/app/src/novel/services/
├── genre-prompt-template.ts
└── context-assembler.ts
```

共计：

```text
11 个新增文件
```

不是文档中的 29 个。

## **2. 暂缓新增文件**

以下暂缓：

```text
sensitive-word-hook.ts
consistency-hook.ts
style-match-hook.ts
skill-loader.ts
real-agent-provider.ts
streaming-executor.ts
file-store.ts
daily-log.ts
agents/*.md
skills/*.md
```

这些属于 P2/P3。

---

# **九、P1 修改现有文件范围**

## **允许修改**

```text
components/novel-workspace/
components/novel-editor/
components/character-panel/
components/world-setting/
components/profile/
components/achievements/
hooks/use-ai-task.ts
hooks/use-chapter-editor.ts
providers/ 与 mock-data 的最小 mutation 支持
types/ 的必要字段扩展
```

## **重点改造点**

### **1. 工作台生成按钮**

目标：

```text
onStartGeneration
→ useNovelWorkflow().runChapterGeneration()
```

不再只是视觉假进度。

### **2. AI Progress Dock**

目标：

```text
读取真实 task.status / task.progress / task.preview
```

### **3. 编辑器 AI 续写**

目标：

```text
onAIContinue
→ runEditorCommand("continue")
→ 生成 AIResultCard
→ 用户采纳后写回 chapter.content
```

### **4. AI 提取信息**

目标：

```text
ChapterInfoPanel 不再使用硬编码 MOCK_EXTRACTED。
改为读取 chapter.aiExtractedInfo。
```

### **5. 采纳结果**

目标：

```text
AIResultCard.onAccept
→ applyWorkflowEvents
→ chapter.content 更新
→ profile/achievement 变化
```

---

# **十、P1 数据结构裁定**

## **1. NovelCommand**

```ts
export type NovelCommandType =
  | "chapter.generate"
  | "chapter.continue"
  | "chapter.extract"
  | "outline.generate"
  | "outline.expand"
  | "task.cancel"
  | "result.accept";

export interface NovelCommand {
  type: NovelCommandType;
  projectId: string;
  chapterId?: string;
  payload?: Record<string, unknown>;
}
```

## **2. NovelAgentResult**

```ts
export interface NovelAgentResult {
  taskId: string;
  text?: string;
  summary?: string;
  wordCount?: number;
  extractedCharacters?: string[];
  extractedWorldItems?: string[];
  keyEvents?: string[];
  protagonistState?: string;
}
```

## **3. NovelWorkflowEvent**

```ts
export type NovelWorkflowEvent =
  | {
      type: "chapter.generated";
      projectId: string;
      chapterId: string;
      content: string;
      summary: string;
      wordCount: number;
    }
  | {
      type: "chapter.extracted";
      projectId: string;
      chapterId: string;
      summary: string;
      characters: string[];
      worldItems: string[];
      keyEvents: string[];
      protagonistState: string;
    }
  | {
      type: "character.updated";
      projectId: string;
      characterIds: string[];
      chapterId: string;
      state: string;
    }
  | {
      type: "world.referenced";
      projectId: string;
      worldItemIds: string[];
      chapterId: string;
    }
  | {
      type: "achievement.progressed";
      projectId: string;
      achievementId: string;
      delta: number;
    }
  | {
      type: "profile.stats.updated";
      projectId: string;
      wordCountDelta: number;
      generationCountDelta: number;
      creditDelta: number;
    };
```

---

# **十一、P1 执行顺序**

## **P1-0：确认基线**

目标：

```text
确认当前 M1 E2E 和已有测试能跑通。
```

执行：

```bash
cd packages/app && bun typecheck
cd packages/app && bun test src/novel
cd packages/app && bunx playwright test e2e/novel --reporter=list
```

输出：

```text
docs/reports/phase-p1-0-baseline.md
```

---

## **P1-1：建立命令与工作流类型**

新增：

```text
workflows/types.ts
workflows/novel-command.ts
workflows/workflow-events.ts
adapters/novel-agent-adapter.ts
```

验收：

```text
typecheck 通过
无 UI 行为变化
```

---

## **P1-2：MockAgentAdapter**

新增：

```text
adapters/mock-agent-adapter.ts
services/genre-prompt-template.ts
services/context-assembler.ts
```

能力：

```text
输入 NovelCommand
输出 NovelAgentResult
```

必须支持：

```text
chapter.generate
chapter.continue
chapter.extract
outline.generate
```

验收：

```text
unit test 验证不同 command 返回结构化 result。
```

---

## **P1-3：WorkflowEvents 写回**

新增：

```text
workflows/apply-workflow-events.ts
workflows/mock-generation-workflow.ts
```

实现：

```text
chapter.generated → 更新章节正文
chapter.extracted → 更新章节 AI 提取信息
character.updated → 更新角色状态
world.referenced → 更新世界设定引用
achievement.progressed → 更新成就
profile.stats.updated → 更新个人中心统计
```

验收：

```text
运行 workflow 后，相关 store 数据变化。
```

---

## **P1-4：接入工作台**

修改：

```text
workspace-actions.tsx
workspace-view-model.ts
workspace-ai-progress-dock.tsx
use-ai-task.ts
use-novel-workflow.ts
```

验收：

```text
工作台点击“开始生成”
→ 出现 running task
→ completed
→ task.result 存在结构化结果
```

---

## **P1-5：接入编辑器**

修改：

```text
novel-editor/index.tsx
use-chapter-editor.ts
editor-toolbar.tsx
chapter-info-panel.tsx
ai-result-card.tsx
```

验收：

```text
AI 续写
→ AIResultCard 出现
→ 点击采纳
→ 正文追加
→ 字数变化
→ 右侧 AI 提取信息变化
```

---

## **P1-6：联动角色 / 世界设定 / 成就 / 个人中心**

修改：

```text
character-panel
world-setting
achievements
profile
相关 hooks/providers/mock-data
```

验收：

```text
生成章节后：
- 角色状态变化
- 世界设定引用变化
- 成就 progress 变化
- 个人中心总字数 / 积分记录变化
```

---

## **P1-7：E2E 产品工作流覆盖**

新增：

```text
packages/app/e2e/novel/novel-workflow-generation.spec.ts
```

测试链路：

```text
1. 打开 /novel
2. 点击工作台“开始生成”
3. 等待 task completed
4. 进入编辑器
5. 验证章节正文变化
6. 采纳 AI 结果
7. 返回工作台
8. 进入角色面板，验证状态变化
9. 进入世界设定，验证引用变化
10. 进入成就页，验证 progress 变化
11. 进入个人中心，验证统计变化
```

---

# **十二、P1 验收标准**

P1 结束时必须满足：

```text
1. typecheck 0 错误。
2. unit test 全部通过。
3. 既有 E2E 不回归。
4. 新增 workflow E2E 通过。
5. 工作台生成按钮可触发真实 mock task。
6. AI Progress Dock 显示真实状态。
7. task completed 后有结构化 result。
8. 章节正文可写回。
9. 编辑器可显示更新后的正文和 AI 提取信息。
10. 角色面板可看到状态变化。
11. 世界设定页可看到引用变化。
12. 成就页可看到进度变化。
13. 个人中心可看到字数或积分记录变化。
14. 无 `href="#"`。
15. 无 `alert()`。
16. 无散落 `console.log`。
17. 单文件 < 500 行。
18. 不删除 `_legacy`。
```

---

# **十三、P2/P3 预留方向**

P1 完成后，再进入真实 Agent 化。

## **P2：真实 Agent Adapter**

P2 做：

```text
RealAgentAdapter
基础流式生成
真实模型配置
取消 / 重试
错误恢复
生成结果稳定解析
```

不再改 UI 主链路，只替换 Adapter。

## **P3：Skill / Hook / 持久化**

P3 做：

```text
SkillLoader
Genre Skill Markdown
敏感词 Hook
一致性 Hook
风格 Hook
FileStore
DailyLog
```

P1 设计的 command / adapter / workflow event 可以复用。

---

# **十四、给 Trae 的直接指令**

```text
主控评审通过 @novelforge-ui-to-agent-feasibility.md，但不批准按 29 个新增文件全量执行。

当前批准进入：
Phase P1 — Product Workflow Orchestration。

P1 目标：
基于当前 Stitch 页面和 packages/app/src/novel 现有架构，跑通 Mock AI 工作流闭环：
工作台生成 → AI Task 生命周期 → 结构化结果 → 章节写回 → 编辑器展示 → 角色/世界设定/成就/个人中心联动。

主控决策：
D1：P1 不接真实 LLM 主链路。默认使用 MockAgentAdapter，只预留 RealAgentAdapter 接口。
D2：P1 不引入 SQLite，不使用 IndexedDB 作为主路径。使用内存 store + mock-data 响应式更新。
D3：采用 C-lite 轻量混合模式：UI 和 workflow 继续在 packages/app/src/novel，workflow/adapters/commands 设计成未来可迁移。
D4：P1 不做完整 SkillProvider，只做 genrePromptTemplates。首批覆盖东方幻想、现代现实、悬疑推理三类模板。

P1 批准新增文件：
- packages/app/src/novel/workflows/index.ts
- packages/app/src/novel/workflows/types.ts
- packages/app/src/novel/workflows/novel-command.ts
- packages/app/src/novel/workflows/workflow-events.ts
- packages/app/src/novel/workflows/mock-generation-workflow.ts
- packages/app/src/novel/workflows/apply-workflow-events.ts
- packages/app/src/novel/hooks/use-novel-workflow.ts
- packages/app/src/novel/adapters/novel-agent-adapter.ts
- packages/app/src/novel/adapters/mock-agent-adapter.ts
- packages/app/src/novel/services/genre-prompt-template.ts
- packages/app/src/novel/services/context-assembler.ts

P1 暂缓：
- real-agent-provider
- streaming-executor
- skill-loader
- sensitive-word-hook
- consistency-hook
- style-match-hook
- file-store
- daily-log
- agents/*.md
- skills/*.md
- export-provider
- inspiration-provider
- full foreshadowing-provider

执行顺序：
P1-0：跑当前 baseline，输出 phase-p1-0-baseline.md。
P1-1：建立 NovelCommand / WorkflowEvent / Adapter 类型。
P1-2：实现 MockAgentAdapter，支持 chapter.generate、chapter.continue、chapter.extract、outline.generate。
P1-3：实现 applyWorkflowEvents，写回 chapter / character / world / achievement / profile。
P1-4：接入工作台“开始生成”和 AI Progress Dock。
P1-5：接入编辑器“AI续写 / AI提取 / 采纳结果”。
P1-6：联动角色面板、世界设定、成就、个人中心。
P1-7：新增 novel-workflow-generation.spec.ts，验证完整产品链路。

禁止事项：
1. 不接真实 LLM 主链路。
2. 不做完整多模型路由。
3. 不做完整 Skill 系统。
4. 不做 DailyLog 文件记忆。
5. 不做 Git Worktree。
6. 不做完整插件化。
7. 不做导出系统。
8. 不引入 SQLite。
9. 不一次性实现 28 个 A 类交互。
10. 不删除 _legacy。
11. 不推翻现有 components/hooks/providers/types 架构。

验证命令：
cd packages/app && bun typecheck
cd packages/app && bun test src/novel
cd packages/app && bunx playwright test e2e/novel --reporter=list

完成后输出：
- 修改文件列表
- P1-0 至 P1-7 完成情况
- 新增 workflow / adapter / event 类型说明
- Mock AI Task 生命周期说明
- 章节写回验证
- 角色/世界/成就/个人中心联动验证
- typecheck / unit / E2E 结果
- 遗留问题
- [READY_FOR_PHASE_P1_REVIEW]
```

---

# **十五、最终裁定**

```text
@novelforge-ui-to-agent-feasibility.md：评审通过
执行方式：收敛执行
当前阶段：Phase P1 — Product Workflow Orchestration
P1 主线：Mock AI 工作流闭环
P1 不做：完整真实 Agent 平台
D1：MockAgentAdapter first
D2：内存 store + mock-data first
D3：C-lite 轻量混合模式
D4：genrePromptTemplates first
```

这份评审的核心原则是：

```text
先把当前 Stitch 产品跑成一个真正可交互的小说编辑器 MVP，
再把底层逐步替换成真实 Agent / Skill / Hook / 持久化系统。
```

*内容由 AI 生成仅供参考*
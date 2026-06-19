先在当前的mock数据库和stitch原型底座上，先增加信息流的定义还是现在完成MVP任务之后，再来引入信息流理论

### **建议现在就引入“信息流最小定义”，但不要现在做完整信息流系统；MVP 主链路仍然优先。**

最合理的顺序是：**P1 当前阶段先把信息流作为数据契约埋进去，跟随 Mock 工作流一起跑通；等 MVP 生成闭环完成后，再扩展成完整的信息流理论系统。**也就是说，现在做 `Info-Lite`，不要做 `Info-Full`。

## **主控建议：现在引入最小信息流定义**

原因很简单：信息流不是一个普通后加功能，它会影响后续的数据结构、AI 生成结果、章节提取、角色联动、世界设定联动和成就统计。如果现在完全不定义，等 MVP 做完后再加，会出现这些问题：

```text
1. MockAgentResult 已经设计好了，后面再加 information 字段会反复改类型。
2. WorkflowEvent 已经跑通了，后面再加信息事件会改事件分发。
3. ChapterInfoPanel 已经接入 AI 提取信息，后面再改成信息审计面板会二次重构。
4. 角色 / 世界 / 成就 / 个人中心联动会只围绕“字数”和“状态”设计，缺少故事信息维度。
5. 后续真实 AI 接入时，Prompt 只能生成正文，不能生成结构化信息变化。
```

但反过来，如果现在直接做完整信息流系统，也会拖慢 MVP：

```text
1. InformationAtomProvider 暂时不需要。
2. InformationLinkProvider 暂时不需要。
3. 熵曲线图暂时不需要。
4. 15 节拍完整规划器暂时不需要。
5. 信息论审计 Agent 暂时不需要。
6. 文件持久化和 DailyLog 暂时不需要。
```

所以最佳方案是：

```text
现在：引入信息流最小类型 + Mock 生成结果字段 + 编辑器最小展示。
之后：MVP 闭环完成后，再扩展完整信息流系统。
```

---

## **当前阶段应采用：P1-Info-Lite**

我建议把当前阶段定义为：

```text
Phase P1 — Product Workflow Orchestration
  └── P1-Info-Lite：信息流最小数据契约
```

P1-Info-Lite 的定位不是新增大功能，而是给当前 Mock 工作流加一层“小说信息变化”的结构化字段。

也就是说，当前 P1 的主线仍然是：

```text
工作台生成
→ AI Task 生命周期
→ MockAgentAdapter 生成结果
→ 写回章节
→ 编辑器展示
→ 角色 / 世界 / 成就 / 个人中心联动
→ E2E 验证
```

只是在 `MockAgentAdapter` 的结果里，顺手加入：

```text
本章节拍
熵变化
惊喜度
新增信息原子
新增伏笔
新增关联
```

这样既不破坏 MVP 进度，又把 NovelForge 的核心理论种子种进系统里。

---

## **现在必须做的最小范围**

### **1. 新增或扩展基础类型**

当前可以只新增一个轻量类型文件，例如：

```text
packages/app/src/novel/types/information-flow.ts
```

里面只放最小类型，不要做 Provider。

建议包含：

```ts
export type InformationAtomType =
  | "fact"
  | "question"
  | "foreshadow"
  | "reveal"
  | "character-state"
  | "world-rule"
  | "relationship"
  | "theme"
  | "event"
  | "emotion";

export interface InformationAtom {
  id: string;
  projectId: string;
  chapterId?: string;
  type: InformationAtomType;
  title: string;
  description: string;
  importance: "low" | "medium" | "high" | "critical";
  visibility: "hidden" | "hinted" | "revealed" | "confirmed";
}

export interface InformationLink {
  id: string;
  projectId: string;
  sourceTitle: string;
  targetTitle: string;
  relationType:
    | "foreshadow"
    | "theme"
    | "character"
    | "world-rule"
    | "plot-cause"
    | "emotional-echo";
  strength: number;
}

export interface ChapterInformationState {
  chapterId: string;
  projectId: string;
  beatId?: string;
  beatName?: string;
  entropyBefore: number;
  entropyAfter: number;
  selfInformationScore: number;
  newAtoms: InformationAtom[];
  newLinks: InformationLink[];
  auditScore?: number;
}
```

这个文件只是类型定义，不引入复杂状态。

---

### **2. 扩展 NovelAgentResult**

当前 P1 规划里的 `NovelAgentResult` 应该现在就加信息字段。

建议：

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

  informationState?: ChapterInformationState;
}
```

不要拆得太细，不要现在引入过多字段。用一个 `informationState` 聚合即可。

这样以后真实 AI 返回结果时，也可以直接映射到同一结构。

---

### **3. 扩展 Chapter 数据模型**

章节可以先挂一个可选字段：

```ts
informationState?: ChapterInformationState;
```

这样 P1 的写回链路就可以变成：

```text
chapter.generated
→ chapter.content 更新
→ chapter.summary 更新
→ chapter.aiExtractedInfo 更新
→ chapter.informationState 更新
```

目前不要单独做 `InformationAtomProvider`。

---

### **4. MockAgentAdapter 返回固定信息流字段**

比如生成章节时返回：

```ts
informationState: {
  projectId,
  chapterId,
  beatId: "catalyst",
  beatName: "推动",
  entropyBefore: 0.72,
  entropyAfter: 0.81,
  selfInformationScore: 7.5,
  newAtoms: [
    {
      id: "atom-001",
      projectId,
      chapterId,
      type: "question",
      title: "黑衣人为何认识林家？",
      description: "本章结尾黑衣人说出林家旧事，制造主角身世疑问。",
      importance: "high",
      visibility: "hinted",
    },
    {
      id: "atom-002",
      projectId,
      chapterId,
      type: "foreshadow",
      title: "古刹石碑残缺符号",
      description: "石碑符号与后续禁地钥匙有关。",
      importance: "medium",
      visibility: "hinted",
    },
  ],
  newLinks: [
    {
      id: "link-001",
      projectId,
      sourceTitle: "古刹石碑",
      targetTitle: "主角身世",
      relationType: "foreshadow",
      strength: 0.72,
    },
  ],
  auditScore: 8.1,
}
```

这不需要真实 AI，也不需要复杂计算，只要让产品链路有信息流结构。

---

### **5. ChapterInfoPanel 增加一个最小“信息审计”区块**

当前编辑器右侧已经有 AI 提取信息，可以在下面加一个小块：

```text
信息审计

节拍：推动
熵变化：0.72 → 0.81
惊喜度：7.5 / 10
新增信息：2
新增伏笔：1
新增关联：1
```

这一步非常重要，因为它能让信息流理论在 Stitch 原型里“看得见”。

但不要现在做：

```text
熵曲线图
完整 15 节拍表
伏笔详情页
信息关系图谱
全书审计面板
```

---

## **现在不要做的内容**

当前不要做这些：

```text
1. 不做 InformationAtomProvider。
2. 不做 InformationLinkProvider。
3. 不做 StoryInformationState 全局大状态。
4. 不做完整 BeatPlanner。
5. 不做熵曲线可视化。
6. 不做信息论公式计算器。
7. 不做真实 AI 信息审计。
8. 不做文件持久化。
9. 不做 SkillLoader。
10. 不为了信息流改动所有页面。
```

这些会让 P1 失焦。

---

## **推荐阶段安排**

### **当前立刻做：P1-Info-Lite**

目标：

```text
把信息流作为 Mock AI 生成结果的一部分接入当前 P1 工作流。
```

范围：

```text
1. types/information-flow.ts
2. NovelAgentResult.informationState
3. Chapter.informationState
4. MockAgentAdapter 返回 informationState
5. applyWorkflowEvents 写回 chapter.informationState
6. ChapterInfoPanel 展示最小信息审计块
```

验收：

```text
生成章节后，编辑器右侧能看到：
- 节拍
- 熵变化
- 惊喜度
- 新增信息数量
- 新伏笔数量
- 新关联数量
```

---

### **MVP 工作流完成后：P2-Info-System**

目标：

```text
把信息流从章节字段升级为系统能力。
```

可以做：

```text
1. InformationAtomProvider。
2. InformationLinkProvider。
3. 章节级信息审计详情。
4. 工作台信息状态概览。
5. 世界设定 revealStatus。
6. 角色信息不对称视图。
7. 成就系统接入信息质量指标。
```

---

### **真实 AI 接入后：P3-Info-Agent**

目标：

```text
让真实 AI 按信息目标生成和审计。
```

可以做：

```text
1. InformationAuditAgent。
2. BeatPlanningAgent。
3. ForeshadowingAgent。
4. EntropyCurveAnalyzer。
5. 长篇小说信息压缩。
6. 信息流驱动 Prompt。
```

---

## **为什么不能等 MVP 完成后再引入**

如果完全等 MVP 后再引入，短期看会更快，但会带来结构性返工。

尤其是 P1 当前正在定义：

```text
NovelAgentResult
WorkflowEvent
applyWorkflowEvents
ChapterInfoPanel
MockAgentAdapter
E2E 生成链路
```

这些正是信息流最应该挂载的位置。

现在不需要做完整理论，但需要把接口留好。否则之后会出现：

```text
MVP 的生成结果只有 text / summary / wordCount。
后续要加信息流时，所有事件、写回、UI、测试都要重新设计。
```

所以现在加最小字段是低成本、高收益。

---

## **为什么不能现在做完整信息流**

因为当前更重要的是 MVP 主链路：

```text
生成任务真的能跑
章节真的能写回
编辑器真的能显示
角色 / 世界 / 成就 / 个人中心真的能联动
E2E 真的能通过
```

如果现在直接做完整信息系统，容易变成：

```text
理论很完整，但生成链路还没跑通。
```

这会偏离当前目标。

所以正确做法是：

```text
最小定义现在做。
完整系统后面做。
```

---

## **给 Trae 的直接指令**

```text
主控补充决策：当前 P1 阶段引入 P1-Info-Lite，不等待 MVP 完成后再完全引入，但也不做完整信息流系统。

目标：
在当前 Mock 数据库和 Stitch 原型底座上，给 P1 的 Mock AI 工作流增加最小信息流数据契约。信息流只作为生成结果和章节审计字段存在，不新增完整 Provider，不做复杂 UI。

执行范围：

1. 新增或扩展类型：
   - types/information-flow.ts
   - 定义 InformationAtom、InformationLink、ChapterInformationState。

2. 扩展 NovelAgentResult：
   - 增加 informationState?: ChapterInformationState。

3. 扩展 Chapter 类型：
   - 增加 informationState?: ChapterInformationState。

4. MockAgentAdapter：
   - chapter.generate / chapter.continue 返回 informationState。
   - 固定返回示例数据即可，不需要真实计算。
   - 包含 beatName、entropyBefore、entropyAfter、selfInformationScore、newAtoms、newLinks。

5. applyWorkflowEvents：
   - 在 chapter.generated 或 chapter.extracted 写回 chapter.informationState。

6. ChapterInfoPanel：
   - 增加最小“信息审计”展示块。
   - 展示：
     - 节拍
     - 熵变化
     - 惊喜度
     - 新增信息数
     - 新伏笔数
     - 新关联数

禁止事项：
1. 不做 InformationAtomProvider。
2. 不做 InformationLinkProvider。
3. 不做完整 StoryInformationState。
4. 不做熵曲线图。
5. 不做 15 节拍规划器。
6. 不做真实 AI 审计。
7. 不做文件持久化。
8. 不影响当前 P1 主线：生成 → 写回 → 多页面联动。

验收：
1. typecheck 通过。
2. P1 工作流不回归。
3. Mock 生成章节后，chapter.informationState 有值。
4. 编辑器右侧显示信息审计块。
5. 既有 E2E 不失败。

完成后输出：
[READY_FOR_PHASE_P1_INFO_LITE_REVIEW]
```

---

## **最终裁定**

```text
现在引入：信息流最小定义。
现在不做：完整信息流系统。
MVP 主线：继续优先。
信息流定位：作为 P1 Mock AI 生成结果的数据契约。
后续扩展：MVP 闭环完成后，再升级为完整 Information System。
```

一句话就是：

```text
现在先把“信息流骨架”放进数据结构里，不要现在长出完整肌肉。
```

*内容由 AI 生成仅供参考*
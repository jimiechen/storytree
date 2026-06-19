@雪花×节拍×信息论_终极SOP工作流.md 补充一份信息基础理论，构建小说信息流，请阅读文档，融入我们的小说编辑器，作为核心理论

# **NovelForge 核心理论补充文档：小说信息流基础理论与产品集成方案**

基于你提供的《雪花写作法 × 救猫咪节拍表 × 信息论：终极小说创作 SOP》，我建议把它正式提升为 NovelForge 小说编辑器的核心理论层。它不应该只是一份写作参考文档，而应该成为产品的数据模型、工作流编排、AI 生成、AI 审计、角色追踪、世界设定、成就系统的统一底层逻辑。

当前 NovelForge 已经有 Stitch 页面、Mock 数据、工作台、编辑器、角色面板、世界设定、成就系统、个人中心等产品模块。下一步应把这些页面背后的业务逻辑统一成一个概念：

```text
小说不是章节文本的集合，而是信息状态持续变化的系统。
写作不是单纯生成文字，而是在控制读者的信息获得、疑问积累、悬念释放、角色认知变化和世界规则揭示。
```

因此，NovelForge 的核心理论应从“AI 小说编辑器”升级为：

```text
基于信息流控制的 AI 小说创作工作台。
```

---

## **一、核心理论：小说是信息流，不只是文本流**

传统编辑器把小说看成：

```text
项目 → 卷 → 章节 → 正文
```

但 NovelForge 应该把小说看成：

```text
故事信息系统 → 信息节点 → 信息流动 → 信息揭示 → 信息审计 → 读者体验
```

每一章、每一场景、每一次 AI 生成，都不只是“写了一段文字”，而是对读者的信息状态做了一次操作。

一章正文至少会产生以下信息变化：

```text
1. 读者知道了什么新事实。
2. 读者产生了什么新疑问。
3. 哪些旧疑问被部分回答。
4. 哪些伏笔被埋下。
5. 哪些伏笔被回收。
6. 哪个角色状态发生变化。
7. 哪条世界规则被展示。
8. 哪个冲突被升级。
9. 哪个节拍被推进。
10. 故事整体不确定性是上升还是下降。
```

所以，NovelForge 后续所有 AI 工作流都不应该只输出：

```text
chapterContent: string
```

而应该输出：

```text
chapterContent + informationDelta
```

也就是正文和信息变化一起生成。

---

## **二、信息基础理论：四个核心指标**

《终极 SOP》里已经把信息论与小说结构结合起来。NovelForge 应把其中四个指标产品化。

### **1. 自信息：情节惊喜度**

自信息衡量一个事件有多“出乎意料”。

公式是：

$$
I(x) = -\log_2 P(x)
$$

在小说中，它对应：

```text
一个情节事件的惊喜度、反转度、爽点强度。
```

如果读者很容易猜到某件事，这个事件自信息低。如果读者没想到但回头看又合理，这个事件自信息高。

在产品中可以转化为：

```text
低自信息：日常过渡、解释说明、普通对话
中自信息：小冲突、小发现、小胜利
高自信息：反转、死亡、背叛、突破、真相揭示
极高自信息：中点大反转、最终真相、命运转折
```

NovelForge 应在章节生成和审计时记录：

```ts
surpriseLevel: "low" | "medium" | "high" | "critical";
selfInformationScore: number; // 0-10
```

这可以用于判断一章是否太平、太满、太乱。

---

### **2. 信息熵：故事不确定性**

信息熵衡量读者当前面对多少不确定性。

公式是：

$$
H(X) = -\sum_i p_i \log_2 p_i
$$

在小说中，它对应：

```text
悬念密度、疑问数量、世界不确定性、剧情开放度。
```

开头需要适度高熵，因为要吸引读者好奇；中段需要熵值波动，因为要制造推进；结尾需要熵值下降，因为要带来确定感和满足感。

在产品中可以转化为：

```text
熵值过低：读者什么都知道，没有悬念。
熵值适中：读者知道一部分，但仍想追问。
熵值过高：读者完全混乱，不知道故事在讲什么。
```

NovelForge 应记录每章的：

```ts
entropyBefore: number; // 0-1
entropyAfter: number;  // 0-1
entropyDelta: number;  // after - before
```

例如：

```text
开场章：entropyBefore 0.2 → entropyAfter 0.75
中点章：entropyBefore 0.6 → entropyAfter 0.9
真相章：entropyBefore 0.7 → entropyAfter 0.25
终章：entropyBefore 0.3 → entropyAfter 0.05
```

---

### **3. 条件熵：读者已知信息下的剩余悬念**

条件熵衡量在读者已经知道一部分信息后，故事还剩多少不确定性。

公式是：

$$
H(X|Y)
$$

在小说中，它对应：

```text
读者知道现有线索后，还能不能推断出真相。
```

这对悬疑、玄幻、长篇网文尤其重要。

如果条件熵下降得太快，读者太早猜到真相；如果一直不下降，读者会觉得作者在故弄玄虚。

NovelForge 应用它来控制：

```text
伏笔回收节奏
真相揭示节奏
反派逼近节奏
主线目标明确度
```

在产品中可以记录：

```ts
conditionalEntropyTarget: number; // 当前节拍期望值
truthRevealRatio: number;         // 真相揭示比例
readerInferenceLevel: "hidden" | "guessable" | "likely" | "confirmed";
```

---

### **4. 互信息：角色、伏笔、主题之间的关联强度**

互信息衡量两个信息变量之间的关联程度。

公式是：

$$
I(X;Y) = H(X) - H(X|Y)
$$

在小说中，它对应：

```text
角色关系、伏笔与真相、主题与情节、A 故事与 B 故事之间的隐藏关联。
```

例如：

```text
主角手腕疤痕 ↔ 多年前灭门事件
配角一句话 ↔ 最终主题
某个道具 ↔ 最终破局方式
B 故事爱情线 ↔ A 故事主线选择
世界规则 ↔ 主角命运
```

互信息过低，故事线松散；互信息过高，故事太直白；好的长篇需要“前期弱关联、后期强回响”。

NovelForge 应记录：

```ts
mutualLinks: InformationLink[];
```

每个 link 代表一个隐藏关联：

```ts
export interface InformationLink {
  id: string;
  sourceId: string;
  targetId: string;
  relationType:
    | "foreshadow"
    | "theme"
    | "character"
    | "world-rule"
    | "plot-cause"
    | "emotional-echo";
  strength: number; // 0-1
  revealed: boolean;
  plantedInChapterId?: string;
  resolvedInChapterId?: string;
}
```

---

## **三、NovelForge 的核心对象：Information Atom 信息原子**

为了把理论落到产品中，建议新增一个核心概念：

```text
Information Atom，信息原子。
```

信息原子是小说中最小的有意义信息单位。

它可以是：

```text
一个事实
一个疑问
一个伏笔
一个角色状态
一个世界规则
一个道具能力
一个情绪变化
一个主题暗示
一个事件结果
一个未揭示秘密
```

建议类型定义如下：

```ts
export type InformationAtomType =
  | "fact"
  | "question"
  | "foreshadow"
  | "reveal"
  | "character-state"
  | "world-rule"
  | "item"
  | "relationship"
  | "theme"
  | "event"
  | "mystery"
  | "emotion";

export interface InformationAtom {
  id: string;
  projectId: string;
  chapterId?: string;
  sceneId?: string;

  type: InformationAtomType;
  title: string;
  description: string;

  visibility: "hidden" | "hinted" | "revealed" | "confirmed";
  importance: "low" | "medium" | "high" | "critical";

  selfInformationScore?: number;
  entropyImpact?: number;
  mutualLinkIds?: string[];

  plantedInChapterId?: string;
  resolvedInChapterId?: string;

  relatedCharacterIds?: string[];
  relatedWorldItemIds?: string[];
  relatedBeatId?: string;

  createdAt: string;
  updatedAt: string;
}
```

这个对象可以成为后续很多模块的底层连接点。

例如：

```text
章节编辑器右侧 AI 提取信息 → 展示 InformationAtom
角色面板 → 聚合 character-state 类 Atom
世界设定 → 聚合 world-rule 类 Atom
成就系统 → 统计 Atom 数量和完成度
工作台大纲 → 根据 Atom 分布判断节奏
AI 生成 → 输入当前未解决 Atom，输出新 Atom
```

---

## **四、小说信息流：从创作输入到读者体验**

NovelForge 应建立一条标准“小说信息流”。

```text
创作输入
→ 故事概念
→ 信息蓝图
→ 节拍规划
→ 章节信息目标
→ AI 生成正文
→ AI 提取信息变化
→ 信息写回
→ 页面联动
→ 信息审计
→ 下一章生成
```

用产品语言描述就是：

```text
25 道题引导 / 创建项目
→ 生成故事信息蓝图
→ 工作台显示节拍与大纲
→ 用户配置本章信息目标
→ AI 生成章节
→ 系统提取本章新增事实、疑问、伏笔、角色变化
→ 写回章节、角色、世界设定、成就、个人中心
→ 编辑器右侧展示信息审计结果
→ 下一次生成继续引用这些信息
```

这条信息流应成为 NovelForge 后续所有 Workflow 的基础。

---

## **五、与现有 Stitch 页面结合**

### **1. 创建项目页：从表单变成“初始信息熵设定器”**

当前创建项目页收集：

```text
书名
类型
简介
主角信息
目标读者
写作风格
故事主题
自定义设定
```

这些字段不应只保存为 Project metadata，而应生成初始信息状态。

创建项目完成后，应生成：

```ts
export interface StoryInformationBlueprint {
  projectId: string;

  logline: string;
  genre: string;
  theme: string;
  initialEntropy: number;

  protagonistCoreQuestion: string;
  centralMystery?: string;
  mainConflict: string;

  expectedBeatStructure: BeatInformationPlan[];
  initialInformationAtoms: InformationAtom[];
  initialMutualLinks: InformationLink[];
}
```

例如用户创建一个玄幻项目后，系统应形成：

```text
初始熵：0.75
核心疑问：主角为何被师门隐藏真实身世？
主线冲突：主角寻找身世真相，同时卷入门派斗争。
主题暗示：真正的力量来自选择，而不是血脉。
初始伏笔：手中残剑、失踪师父、禁地石碑。
```

这会让后续 AI 生成不是“凭空续写”，而是沿着信息蓝图推进。

---

### **2. 25 道题引导页：从问卷变成“信息蓝图生成器”**

25 道题引导页非常适合承载雪花写作法的前几步：

```text
一句话摘要
一段摘要
主角目标
主角缺陷
故事主题
世界规则
核心冲突
反派压力
关键秘密
最终代价
```

建议把 25 道题分为五类：

| 类别 | 目标 | 对应信息结构 |
|---|---|---|
| 概念问题 | 明确故事核心 | logline / theme |
| 角色问题 | 建立人物信息 | character-state / relationship |
| 世界问题 | 建立规则信息 | world-rule |
| 冲突问题 | 建立悬念信息 | question / mystery |
| 结局问题 | 建立熵下降方向 | reveal / final-state |

回答完成后，不只是创建项目，而是创建：

```text
StoryInformationBlueprint
BeatInformationPlan
InitialInformationAtoms
```

这会让引导页成为 NovelForge 的真正入口，而不是普通问卷。

---

### **3. 工作台：从三栏布局变成“信息流控制台”**

当前工作台已经有三栏：

```text
左侧：大纲 / 章节 / 人物 / 设定
中间：章节预览与 AI 任务
右侧：生成设置
```

建议把工作台定位为：

```text
信息流控制台。
```

在当前 UI 基础上逐步增加以下信息维度。

#### **左栏：大纲与章节信息状态**

每个章节节点不只是标题，还应显示：

```text
节拍位置
信息熵目标
伏笔数量
揭示数量
角色状态变化
完成状态
```

例如：

```text
第3章 绝处逢生
Beat 4：推动
熵变化：0.72 → 0.81
新增疑问：2
新伏笔：1
角色状态：受伤 / 获得线索
```

#### **中间：当前章节信息摘要**

章节预览区可以展示：

```text
本章信息目标
本章新增事实
本章未解疑问
本章伏笔
本章节拍功能
```

#### **右栏：生成设置升级为“信息生成设置”**

当前生成设置有：

```text
目标字数
字数容差
参考章节数
AI 模型
上下文选项
```

建议新增信息控制项：

```ts
export interface InformationGenerationConfig {
  targetBeatId?: string;
  targetEntropyDelta?: number;
  surpriseLevel?: "low" | "medium" | "high";
  revealRatio?: number;
  foreshadowDensity?: number;
  characterStateChangeLevel?: "none" | "minor" | "major";
  worldRuleExposure?: "none" | "hint" | "explicit";
}
```

产品上可以简单显示为：

```text
本章节拍：推动 / 游戏 / 中点 / 坏蛋逼近
悬念变化：增加 / 保持 / 降低
惊喜强度：低 / 中 / 高
伏笔密度：少 / 适中 / 多
揭示比例：隐藏 / 暗示 / 明示
角色变化：无 / 小变化 / 重大变化
```

---

### **4. 编辑器：从文本编辑器变成“正文 + 信息审计面板”**

当前章节编辑器是 MVP 核心页面。它应该承担两个职责：

```text
写正文
看信息变化
```

右侧 AI 提取信息面板应升级为：

```text
Information Audit Panel，信息审计面板。
```

建议分为五块：

```text
1. 本章摘要
2. 新增信息
3. 未解疑问
4. 伏笔与回收
5. 信息论评分
```

例如：

```text
本章信息审计

新增事实：
- 林青衫确认古刹中藏有师门遗物。
- 黑衣人知道林青衫父亲的名字。

新增疑问：
- 黑衣人为何认识林家？
- 师父是否隐瞒了当年真相？

新伏笔：
- 古刹石碑上的残缺符号。
- 黑衣人临走前提到“第七把钥匙”。

角色状态：
- 林青衫：受伤，信念动摇，但获得新线索。

世界设定：
- 首次展示“禁术封印”的规则。

信息评分：
- 自信息：7.5 / 10
- 信息熵变化：+0.12
- 互信息新增：2 条
```

这比普通 AI 摘要更有产品壁垒。

---

### **5. 角色面板：从人物卡变成“角色信息状态机”**

角色不是静态资料，而是信息状态持续变化的对象。

角色面板应记录：

```text
角色当前状态
读者已知信息
读者未知信息
角色本人知道的信息
其他角色知道的信息
角色秘密
关系互信息
```

这非常关键，因为小说中的戏剧张力常常来自“信息不对称”。

建议角色状态模型升级：

```ts
export interface CharacterInformationState {
  characterId: string;
  projectId: string;

  publicKnownFacts: string[];
  hiddenSecrets: string[];
  selfKnowledge: string[];
  readerKnowledge: string[];

  currentGoal: string;
  currentConflict: string;
  emotionalState: string;
  physicalState?: string;

  lastAppearedChapterId?: string;
  appearanceCount: number;

  relationLinks: InformationLink[];
}
```

例如：

```text
主角知道：自己被师门收养。
读者知道：主角身世有问题。
反派知道：主角是失踪王族后裔。
主角不知道：自己血脉能打开禁地。
```

这种信息不对称是后续 AI 审校和剧情生成的核心。

---

### **6. 世界设定页：从设定展示变成“规则揭示系统”**

世界观不是百科全书，而是“逐步揭示的规则系统”。

每条世界规则都应该有：

```text
是否已向读者展示
在哪章首次暗示
在哪章明确说明
是否被角色误解过
是否影响过剧情结果
```

建议模型：

```ts
export interface WorldRuleInformation {
  id: string;
  projectId: string;
  title: string;
  description: string;

  revealStatus: "hidden" | "hinted" | "partially-revealed" | "revealed";
  firstHintChapterId?: string;
  firstRevealChapterId?: string;

  relatedCharacters: string[];
  relatedEvents: string[];
  contradictionRisk?: string;

  referenceCount: number;
  lastReferencedChapterId?: string;
}
```

这样世界设定页就能支撑玄幻、科幻、悬疑中最关键的“规则一致性”。

---

### **7. 成就系统：从装饰变成“创作信息质量反馈”**

当前成就系统可以和信息论结合，变成对作者的质量反馈。

例如：

```text
第一次埋下伏笔 → “伏笔初现”
首次回收伏笔 → “草蛇灰线”
完成 15 节拍规划 → “结构大师”
连续 3 章保持合理熵曲线 → “节奏掌控者”
角色互信息网络超过 10 条 → “群像织网者”
世界规则完整揭示 5 条 → “世界构筑者”
```

成就不只是游戏化，而是引导作者形成好习惯。

---

### **8. 个人中心：从统计页变成“创作能力仪表盘”**

个人中心不应只显示字数、积分、章节数，还可以逐步加入：

```text
平均章节自信息
平均章节熵变化
伏笔回收率
角色关系复杂度
节拍完整度
世界规则一致性
AI 采纳率
```

这些指标会让 NovelForge 从“写作工具”变成“创作训练系统”。

---

## **六、P1 阶段如何接入，不扩大范围**

你们当前 P1 已经定为：

```text
Product Workflow Orchestration
产品工作流编排阶段
```

所以信息流理论不能在 P1 里变成一个巨大的新系统。它应该以最小方式融入现有 P1 工作流。

P1 只需要做三件事。

### **P1-Info-1：扩展 MockAgentResult**

当前 P1 计划里已有：

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

建议补充信息论字段：

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

  informationAtoms?: InformationAtom[];
  entropyBefore?: number;
  entropyAfter?: number;
  selfInformationScore?: number;
  mutualLinks?: InformationLink[];

  beatId?: string;
  beatName?: string;
  informationFunction?: "setup" | "turning-point" | "reveal" | "foreshadow" | "pressure" | "resolution";
}
```

这样 P1 仍然是 Mock，但结果已经具备未来真实 AI 的结构。

---

### **P1-Info-2：扩展 WorkflowEvent**

在现有 P1 事件基础上增加信息事件：

```ts
export type NovelWorkflowEvent =
  | {
      type: "information.atom.created";
      projectId: string;
      atoms: InformationAtom[];
    }
  | {
      type: "information.entropy.assessed";
      projectId: string;
      chapterId: string;
      entropyBefore: number;
      entropyAfter: number;
      selfInformationScore: number;
    }
  | {
      type: "information.link.created";
      projectId: string;
      links: InformationLink[];
    };
```

这些事件在 P1 可以只写入内存 mock store，不做复杂 UI。

---

### **P1-Info-3：编辑器右侧显示最小信息审计**

不需要做完整新页面。只要在 ChapterInfoPanel 里增加一个小块：

```text
信息审计
- 节拍：推动
- 熵变化：0.72 → 0.81
- 惊喜度：7.5 / 10
- 新增信息：3
- 新伏笔：1
- 新关联：2
```

这就足够把理论嵌入产品。

---

## **七、P2 阶段再做完整信息系统**

P1 不要过度建设。P2 可以再做：

```text
InformationAtomProvider
InformationLinkProvider
BeatPlanner
EntropyCurveView
ForeshadowingTracker
InformationAuditAgent
```

P2 的页面增强可以包括：

```text
工作台增加熵曲线
编辑器增加信息审计详情
角色面板增加信息不对称视图
世界设定增加揭示状态
成就系统增加信息质量成就
```

---

## **八、数据结构建议**

### **1. BeatInformationPlan**

把 15 节拍变成可保存的数据。

```ts
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

export interface BeatInformationPlan {
  id: SaveTheCatBeatId;
  name: string;
  act: "act-1" | "act-2a" | "act-2b" | "act-3";

  targetChapterRange?: [number, number];
  emotionalFunction: string;

  informationConcept:
    | "entropy"
    | "self-information"
    | "conditional-entropy"
    | "mutual-information";

  targetEntropy?: number;
  targetSelfInformation?: number;
  targetRevealRatio?: number;

  description: string;
  checklist: string[];
}
```

---

### **2. ChapterInformationState**

每章的信息状态。

```ts
export interface ChapterInformationState {
  chapterId: string;
  projectId: string;

  beatId?: SaveTheCatBeatId;
  beatName?: string;

  entropyBefore: number;
  entropyAfter: number;
  selfInformationScore: number;

  newAtomIds: string[];
  resolvedAtomIds: string[];
  foreshadowAtomIds: string[];
  revealAtomIds: string[];

  characterStateChanges: string[];
  worldRuleReferences: string[];

  auditScore: number;
  auditWarnings: string[];
}
```

---

### **3. StoryInformationState**

全书级信息状态。

```ts
export interface StoryInformationState {
  projectId: string;

  currentEntropy: number;
  targetEntropyCurve: Array<{
    chapterIndex: number;
    targetEntropy: number;
  }>;

  atoms: InformationAtom[];
  links: InformationLink[];
  beatPlans: BeatInformationPlan[];

  unresolvedQuestions: string[];
  activeForeshadows: string[];
  resolvedReveals: string[];

  overallAuditScore: number;
}
```

---

## **九、AI 生成 Prompt 应如何使用信息流理论**

P1 是 Mock，可以先不接真实 AI。但未来 P2 接入真实 AI 时，prompt 不应只写：

```text
请续写下一章。
```

而应写成：

```text
请根据以下信息目标生成本章内容：

本章节拍：推动
情绪功能：催化主角命运变化
信息功能：制造高自信息事件，打破常态
目标熵变化：0.65 → 0.8
目标惊喜度：高
必须新增：
- 一个改变主角处境的事件
- 一个与主角身世有关的新疑问
- 一个可在后续回收的伏笔

不能做：
- 不要提前揭示主角真实身世
- 不要解决“师父失踪”的核心谜团
- 不要让反派动机完全明朗

输出要求：
- 正文
- 本章摘要
- 新增信息原子
- 伏笔
- 角色状态变化
- 世界规则引用
- 信息审计评分
```

这就是 NovelForge 和普通 AI 续写工具的差异。

---

## **十、Trae 可执行补充指令**

下面这段可以直接下发给 Trae，作为 P1 理论补充任务。

```text
主控补充：将《雪花×节拍×信息论_终极SOP工作流.md》纳入 NovelForge 核心理论层。

目标：
不是新增大功能，而是在当前 P1 Product Workflow Orchestration 中补充“小说信息流”基础模型，使 Mock AI 生成结果不仅包含正文，还包含信息变化。

执行范围：

1. 新增或扩展类型文件：
   - InformationAtom
   - InformationLink
   - BeatInformationPlan
   - ChapterInformationState
   - StoryInformationState

2. 扩展 NovelAgentResult：
   增加：
   - informationAtoms
   - entropyBefore
   - entropyAfter
   - selfInformationScore
   - mutualLinks
   - beatId
   - beatName
   - informationFunction

3. 扩展 NovelWorkflowEvent：
   增加：
   - information.atom.created
   - information.entropy.assessed
   - information.link.created

4. MockAgentAdapter 在生成章节时返回信息论字段：
   - 本章节拍，例如 catalyst / fun-and-games / midpoint
   - 熵变化，例如 0.72 → 0.81
   - 惊喜度，例如 7.5 / 10
   - 新增信息原子，例如新增疑问、伏笔、角色状态、世界规则
   - 新互信息链接，例如“古刹石碑 ↔ 主角身世”

5. ChapterInfoPanel 增加最小“信息审计”展示块：
   - 节拍
   - 熵变化
   - 惊喜度
   - 新增信息数量
   - 新伏笔数量
   - 新关联数量

6. 不新增复杂 Provider。
   P1 阶段可先把信息字段挂在 chapter.aiExtractedInfo 或 chapter.informationState 上。
   不做完整 InformationAtomProvider。
   不做完整熵曲线图。
   不做真实 AI 审计。
   不做文件持久化。

7. 更新 docs：
   新增 docs/reports/phase-p1-information-flow-theory.md
   内容包括：
   - 小说信息流基础理论
   - 信息原子定义
   - 15 节拍与信息指标映射
   - 当前 P1 如何最小接入
   - 后续 P2/P3 演进方向

验收：
1. typecheck 通过。
2. Mock 章节生成结果包含信息论字段。
3. 编辑器右侧可看到信息审计块。
4. 不影响现有 MVP E2E。
5. 不扩大到完整真实 AI / Skill / DailyLog / 持久化系统。

完成后输出：
[READY_FOR_PHASE_P1_INFO_REVIEW]
```

---

## **十一、设计取舍说明**

这次补充不是把《终极 SOP》原样塞进产品，而是做了三个转化。

第一，把写作方法论转成了数据模型。雪花、节拍、信息论本来是创作流程，现在被转成了 `InformationAtom`、`InformationLink`、`ChapterInformationState`、`BeatInformationPlan`，这样它才能进入产品架构。

第二，把抽象信息论转成了编辑器可用指标。自信息对应惊喜度，信息熵对应悬念状态，条件熵对应真相揭示进度，互信息对应伏笔、角色、主题、世界规则之间的关联。这样用户不需要懂公式，也能看到“本章悬念增加了”“本章新伏笔过多”“本章回收不足”。

第三，把理论接入点控制在 P1 最小范围内。当前阶段不做完整信息系统，只让 Mock AI 生成结果带上信息字段，并在编辑器右侧展示信息审计。这既能体现 NovelForge 的核心理论差异，又不会破坏当前 P1 的产品工作流目标。

当前建议的核心产品定义可以更新为：

```text
NovelForge 是一个基于小说信息流控制的 AI 创作编辑器。
它不只是帮助作者生成文字，而是帮助作者设计、推进、审计和回收故事信息。
```

*内容由 AI 生成仅供参考*
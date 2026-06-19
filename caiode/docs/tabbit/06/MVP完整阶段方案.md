当前还有几个阶段，还能完成第一版MVP，请输出各个阶段的目标和技术愿景

### **当前距离第一版 MVP 还剩 5 个核心阶段：P1 主工作流、P1-Info-Lite、P1 QA、P2 真实 Agent 试接、MVP Freeze。第一版 MVP 的目标不是完整商业化，而是交付一个“可演示、可生成、可写回、可联动、可解释信息流”的小说编辑器。**

当前时间点可以把项目状态定义为：**Stitch UI 底座已完成，Mock 数据与主链路已初步打通，下一步进入产品工作流编排阶段。** 第一版 MVP 不应继续无限扩页面，也不应立刻做完整真实 Agent 平台，而是要围绕“小说创作闭环”完成最小可用产品。

---

## **一、当前阶段定位**

当前阶段是：

```text
Phase P1 — Product Workflow Orchestration
产品工作流编排阶段
```

当前已经完成或基本完成：

```text
1. Stitch 原型阅读与 UI 架构拆解。
2. SolidJS 组件底座。
3. /novel 应用路由。
4. 书架、工作台、编辑器、角色、世界设定、个人中心、成就、引导页等页面初版。
5. Mock 数据基础。
6. MVP 主链路 E2E 草案。
7. UI→工作流→Agent 的 59 个交互点扫描。
8. 信息流理论已经确认作为 NovelForge 核心理论方向。
```

当前还没完全完成的是：

```text
1. 工作台生成任务还没有成为真正的业务工作流。
2. Mock AI 生成结果还没有完整写回章节。
3. 章节生成后角色、世界设定、成就、个人中心联动还没形成稳定闭环。
4. 信息流字段还没有正式进入 MockAgentResult / Chapter / ChapterInfoPanel。
5. E2E 还主要验证页面可见，不足以验证“生成 → 写回 → 联动”。
6. 真实 AI / Agent / Skill / Hook / 持久化还没有进入可运行主链路。
```

所以现在不是“继续做页面”，而是进入：

```text
从 UI MVP → Workflow MVP → Agent-ready MVP
```

---

# **二、第一版 MVP 的最终定义**

第一版 MVP 的目标应该定义为：

```text
NovelForge 第一版 MVP：
一个基于 Stitch 原型的 AI 小说编辑器，可以完成从项目选择、章节生成、编辑器写回、信息审计、角色/世界/成就/个人中心联动的完整 Mock 创作闭环，并为真实 Agent / Skill / Hook / 持久化预留架构接口。
```

第一版 MVP 不追求：

```text
真实 AI 质量
真实后端
真实导出
真实多模型路由
真实 Skill 市场
完整 15 节拍规划器
完整信息流系统
完整插件化
```

第一版 MVP 必须追求：

```text
产品闭环是真的
数据流是真的
任务状态是真的
章节写回是真的
页面联动是真的
信息审计可见
E2E 可验证
架构可继续演进
```

---

# **三、剩余阶段总览**

建议从现在到第一版 MVP 分为 5 个阶段。

| 阶段 | 名称 | 目标 | 是否必须 |
|---|---|---|---:|
| P1 | Product Workflow Orchestration | 跑通 Mock AI 生成 → 章节写回 → 多页面联动 | 必须 |
| P1-Info-Lite | 信息流最小数据契约 | 把信息流理论以最小字段接入章节生成与编辑器审计 | 必须 |
| P1-QA | Workflow QA & E2E | 用测试锁住完整产品链路 | 必须 |
| P2-lite | Real Agent Adapter Spike | 试接一个真实 Agent / LLM 适配器，但不作为主验收依赖 | 可选但建议 |
| MVP-Freeze | 第一版 MVP 冻结 | 清理范围、修复阻断、输出演示版和报告 | 必须 |

如果要最短路径，P2-lite 可以延后，直接做：

```text
P1 → P1-Info-Lite → P1-QA → MVP-Freeze
```

如果希望第一版 MVP 有一个“真实 AI 演示按钮”，则增加：

```text
P2-lite
```

---

# **四、Phase P1：产品工作流编排**

## **阶段目标**

P1 的目标是让当前 Stitch 页面从“能看、能跳转”变成“能跑业务”。

核心链路是：

```text
工作台点击开始生成
→ 创建 Mock AI Task
→ AI Progress Dock 显示 running
→ MockAgentAdapter 返回结构化结果
→ result 写回章节
→ 编辑器显示新正文
→ 角色面板状态变化
→ 世界设定引用变化
→ 成就进度变化
→ 个人中心统计变化
```

## **技术愿景**

P1 的技术愿景是建立 NovelForge 的第一层“工作流内核”。

不是完整 Agent 系统，而是：

```text
UI Action
→ NovelCommand
→ MockAgentAdapter
→ WorkflowEvents
→ applyWorkflowEvents
→ Providers / Stores
→ SolidJS UI 响应式刷新
```

这会让系统从“页面工程”进入“产品工作流工程”。

## **核心新增模块**

建议最小新增：

```text
packages/app/src/novel/workflows/
packages/app/src/novel/adapters/
packages/app/src/novel/services/
packages/app/src/novel/hooks/use-novel-workflow.ts
```

关键对象：

```ts
NovelCommand
NovelAgentResult
NovelWorkflowEvent
NovelAgentAdapter
MockAgentAdapter
```

## **P1 验收标准**

```text
1. 工作台“开始生成”能触发真实 mock task。
2. task 有 queued / running / completed / failed 状态。
3. completed 后有结构化 result。
4. result 写回 chapter.content / summary / wordCount。
5. 编辑器读取更新后的章节。
6. 角色、世界设定、成就、个人中心至少各有一个字段联动变化。
7. 不接真实 AI。
8. 不引入 SQLite。
9. 不删除 _legacy。
10. typecheck / unit test 通过。
```

---

# **五、Phase P1-Info-Lite：信息流最小数据契约**

## **阶段目标**

P1-Info-Lite 的目标是把你刚确认的“小说信息流理论”以最小方式接入当前 Mock 工作流。

它不是完整信息流系统，只是把“生成正文”升级为：

```text
生成正文 + 生成信息变化
```

## **技术愿景**

NovelForge 不能只是普通 AI 续写工具。它的长期壁垒是：

```text
基于信息流控制的 AI 小说编辑器。
```

所以即使第一版 MVP 还是 Mock，也要让数据结构提前具备这个方向。

## **最小接入方式**

新增：

```text
types/information-flow.ts
```

定义：

```text
InformationAtom
InformationLink
ChapterInformationState
```

扩展：

```text
NovelAgentResult.informationState
Chapter.informationState
```

MockAgentAdapter 返回：

```text
节拍
熵变化
惊喜度
新增信息原子
新伏笔
新关联
```

ChapterInfoPanel 显示：

```text
信息审计
- 节拍：推动
- 熵变化：0.72 → 0.81
- 惊喜度：7.5 / 10
- 新增信息：2
- 新伏笔：1
- 新关联：1
```

## **P1-Info-Lite 验收标准**

```text
1. Mock 生成结果包含 informationState。
2. chapter.informationState 可写回。
3. 编辑器右侧可见最小信息审计块。
4. 不新增 InformationAtomProvider。
5. 不做熵曲线图。
6. 不做完整 15 节拍规划器。
7. 不影响 P1 主链路。
```

---

# **六、Phase P1-QA：工作流 QA 与 E2E 锁定**

## **阶段目标**

P1-QA 的目标是从“页面可见 E2E”升级为“业务状态变化 E2E”。

之前 M1 的 E2E 主要验证：

```text
页面打开
按钮跳转
Modal 打开关闭
章节编号显示
```

P1-QA 要验证：

```text
生成前状态 A
点击生成
任务完成
状态变成 B
多个页面都能看到 B
```

## **技术愿景**

测试不再只是 UI 存活测试，而是产品工作流契约。

E2E 要保护的是：

```text
小说创作闭环
```

而不是某个按钮能不能点击。

## **新增 E2E 建议**

新增：

```text
packages/app/e2e/novel/novel-workflow-generation.spec.ts
```

测试链路：

```text
1. 打开 /novel。
2. 记录当前章节字数。
3. 点击“开始生成”。
4. 等待 AI task completed。
5. 进入编辑器。
6. 验证正文或字数发生变化。
7. 验证右侧信息审计块出现。
8. 返回工作台。
9. 进入角色面板，验证角色状态变化。
10. 进入世界设定，验证引用变化。
11. 进入成就页，验证 progress 变化。
12. 进入个人中心，验证字数或积分变化。
```

## **P1-QA 验收标准**

```text
1. 原有 E2E 不回归。
2. 新增 workflow E2E 通过。
3. E2E 不依赖 waitForTimeout。
4. 使用 data-testid 稳定定位。
5. 生成链路失败时能明确定位是哪一层：task / writeback / UI / navigation。
```

---

# **七、Phase P2-lite：真实 Agent Adapter 试接**

## **阶段目标**

P2-lite 是可选阶段。它的目标不是全面接入真实 AI，而是验证 P1 的 Adapter 设计能不能替换 Mock。

建议只做一个最小真实入口：

```text
编辑器 AI 续写 或 工作台开始生成
```

二选一即可。

## **技术愿景**

P1 使用：

```text
MockAgentAdapter
```

P2-lite 试接：

```text
RealAgentAdapter
```

理论上 UI 和 workflow 不应该大改，只替换 Adapter。

这就是 P1 架构的价值：

```text
Mock 可测
Real 可替换
Workflow 不变
UI 不重写
```

## **P2-lite 范围**

允许：

```text
1. RealAgentAdapter 接口实现。
2. 一个低成本模型或本地 mock API。
3. 失败 fallback 到 MockAgentAdapter。
4. 手动开关：useRealAgent = true/false。
5. 只接一个命令，例如 chapter.continue。
```

不允许：

```text
1. 完整多模型路由。
2. SkillLoader。
3. DailyLog。
4. Git Worktree。
5. 大规模 prompt 系统。
6. 把真实 AI 作为 E2E 必须依赖。
```

## **P2-lite 验收标准**

```text
1. Mock 主链路仍然稳定。
2. RealAgentAdapter 可以手动开启。
3. 真实返回结果能映射到 NovelAgentResult。
4. 失败可 fallback 到 MockAgentAdapter。
5. 不影响 MVP 演示稳定性。
```

---

# **八、Phase MVP-Freeze：第一版 MVP 冻结**

## **阶段目标**

MVP-Freeze 的目标是停止扩功能，修阻断问题，输出可演示版本。

这个阶段不应该再引入新理论、新页面、新架构，只做：

```text
修复
清理
验证
文档
演示
```

## **技术愿景**

第一版 MVP 要成为后续开发的稳定基线。

它不是最终产品，但要具备：

```text
稳定入口
稳定主链路
稳定数据结构
稳定 E2E
清晰技术债
清晰后续路线
```

## **MVP-Freeze 任务**

```text
1. 跑完整 typecheck。
2. 跑全部 unit tests。
3. 跑全部 novel E2E。
4. 扫描 href="#"。
5. 扫描 alert()。
6. 扫描散落 console.log。
7. 检查单文件 < 500 行。
8. 检查 _legacy 状态。
9. 输出 MVP Final Report。
10. 输出 Demo Script。
```

## **MVP 验收标准**

```text
1. /novel 能正常启动。
2. 书架可进入项目。
3. 工作台可触发生成。
4. 任务有生命周期。
5. 章节可写回。
6. 编辑器可展示生成结果。
7. 信息审计可见。
8. 角色 / 世界 / 成就 / 个人中心有联动。
9. 原有主页面均可打开。
10. typecheck 0 错误。
11. unit test 全绿。
12. E2E 0 fail。
13. 无阻断级视觉崩坏。
14. 不依赖真实 AI 即可演示。
```

---

# **九、阶段路线图建议**

## **最稳路线**

```text
P1 Product Workflow Orchestration
↓
P1-Info-Lite Information Contract
↓
P1-QA Workflow E2E
↓
MVP-Freeze
```

这条路线最稳，适合先交第一版 MVP。

## **增强路线**

```text
P1 Product Workflow Orchestration
↓
P1-Info-Lite Information Contract
↓
P1-QA Workflow E2E
↓
P2-lite Real Agent Adapter Spike
↓
MVP-Freeze
```

这条路线可以在 MVP 中展示一个真实 AI 能力，但风险稍高。

## **不建议路线**

```text
P1 直接做完整 Agent / Skill / Hook / DailyLog / SQLite / 多模型
```

不建议这样做，因为会导致：

```text
范围失控
测试不稳定
MVP 延期
产品闭环被底层技术拖住
```

---

# **十、每个阶段的技术愿景总结**

| 阶段 | 技术愿景 |
|---|---|
| P1 | 从页面驱动升级为工作流驱动 |
| P1-Info-Lite | 从文本生成升级为信息变化生成 |
| P1-QA | 从页面测试升级为业务链路测试 |
| P2-lite | 从 Mock Adapter 升级为可替换真实 Agent Adapter |
| MVP-Freeze | 从开发态升级为稳定演示态 |

---

# **十一、第一版 MVP 后的第二阶段愿景**

第一版 MVP 完成后，后续可以进入真正的 P2 / P3。

## **P2：真实 Agent 化**

```text
RealAgentAdapter
StreamingExecutor
取消 / 重试 / fallback
基础 Prompt 模板
真实章节续写
真实 AI 提取信息
```

## **P3：信息流系统化**

```text
InformationAtomProvider
InformationLinkProvider
EntropyCurveView
ForeshadowingTracker
BeatPlanner
InformationAuditAgent
```

## **P4：创作方法论产品化**

```text
雪花写作法引导
15 节拍规划器
信息论审计面板
章节信息目标设置
全书结构评分
```

## **P5：高级差异化**

```text
多模型路由
Skill 系统
Commands
DailyLog
长篇上下文压缩
多分支故事探索
导出与发布
```

---

# **十二、当前可直接下发给 Trae 的阶段指令**

```text
当前主控阶段规划如下：

第一版 MVP 还剩 4-5 个阶段。

必须完成：
1. Phase P1 — Product Workflow Orchestration
   目标：跑通 Mock AI 生成 → 章节写回 → 角色/世界/成就/个人中心联动。

2. Phase P1-Info-Lite — Information Contract
   目标：引入信息流最小数据契约，让 Mock 生成结果包含节拍、熵变化、惊喜度、信息原子、信息关联，并在编辑器右侧显示信息审计块。

3. Phase P1-QA — Workflow E2E
   目标：新增 workflow E2E，不只验证页面可见，而是验证生成前后业务状态变化。

4. Phase MVP-Freeze
   目标：停止扩功能，修复阻断问题，跑完整验证，输出第一版 MVP 报告和演示脚本。

可选增强：
5. Phase P2-lite — Real Agent Adapter Spike
   目标：只试接一个真实 AI Adapter，不作为 MVP 主链路依赖；失败可 fallback 到 MockAgentAdapter。

当前优先执行：
先做 P1，再同时以最小范围接入 P1-Info-Lite。
不要等待 MVP 后再定义信息流，也不要现在做完整信息流系统。

禁止：
- 不做完整 Skill 系统
- 不做 DailyLog
- 不做 Git Worktree
- 不做 SQLite
- 不做真实多模型路由
- 不做完整插件化
- 不删除 _legacy
- 不推翻现有 Stitch / SolidJS / providers / hooks 架构

第一版 MVP 最终验收：
/novel 可启动；
工作台可生成；
AI task 有生命周期；
章节可写回；
编辑器可展示新正文和信息审计；
角色、世界设定、成就、个人中心有联动；
typecheck / unit / E2E 全部通过；
不依赖真实 AI 也可稳定演示。

[PHASE_PLAN_CONFIRMED]
```

---

# **最终判断**

当前距离第一版 MVP 并不远，但关键不是再做更多页面，而是完成：

```text
一个真实可跑的 Mock 创作工作流。
```

如果收敛范围，第一版 MVP 的完成路径是清晰的：

```text
P1：工作流闭环
P1-Info-Lite：信息流骨架
P1-QA：测试锁定
MVP-Freeze：稳定交付
```

技术愿景也很明确：

```text
短期：可演示的 AI 小说编辑器 MVP
中期：基于信息流控制的 AI 创作系统
长期：融合 Agent / Skill / Hook / 多模型 / 长篇上下文的小说自动化工作台
```

那stitch底座所有页面的所有按钮，如何规划，当前必须列清楚所有页面所有按钮的功能概要，工作流的引入是融入底座不是割裂啊

### **对，工作流必须融入 Stitch 底座，而不是另起一套系统。当前必须先把所有页面、所有按钮、所有动作归档成统一“交互契约”，再按阶段接入 Workflow。**

现在的关键不是再讨论“要不要工作流”，而是要把 Stitch 原型里的每一个按钮明确归类：它到底是导航、弹框、CRUD、Mock AI 工作流、信息流审计，还是后续真实 Agent 能力。否则 Trae 很容易一边改页面、一边新建 workflow，最后 UI 底座和工作流割裂。

下面这份就是当前应下发的 **Stitch 底座全按钮功能规划与工作流接入文档**。

---

# **NovelForge Stitch 底座全交互规划文档**

## **一、总原则：所有按钮必须进入统一 Action Contract**

当前 Stitch 底座已经有多个页面：

```text
01 工作台 / 首页入口
02 我的书架
03 创建项目弹窗
04 小说项目工作台
05 章节编辑器
06 角色追踪面板
07 世界设定页面
08 导出 / 设置 / 通知等弹框
09 个人中心
10 AI 生成参数设置弹窗
11 成就系统
12 25 道题引导页
```

这些页面不能各自随意写按钮逻辑。所有按钮必须进入统一动作模型。

建议把按钮动作分为 6 类：

| 类型 | 名称 | 含义 | 是否进入 Workflow |
|---|---|---|---:|
| `NAV` | 页面导航 | 打开工作台、书架、编辑器、角色面板等 | 否，走 navigation |
| `MODAL` | 弹框操作 | 打开/关闭设置、导出、历史版本、生成设置等 | 否，走 modal host |
| `CRUD` | 数据操作 | 新增、删除、选择、编辑、勾选、星标等 | 只走 Provider |
| `AI_WORKFLOW` | AI 工作流 | 生成大纲、生成章节、续写、改写、提取信息等 | 是 |
| `INFO_WORKFLOW` | 信息流工作流 | 信息审计、熵变化、伏笔、节拍、信息原子写回 | 是，但 P1 Lite |
| `FUTURE` | 后续能力 | 真实导出、真实支付、真实 Agent、真实多模型等 | 暂缓 |

所有按钮最终都应该符合这个路径：

```text
Button
→ action handler
→ action type 判断
→ NAV / MODAL / CRUD / AI_WORKFLOW / INFO_WORKFLOW
→ state update
→ UI 响应式刷新
```

禁止继续出现：

```text
按钮里直接写临时 setTimeout
按钮里直接写 hardcode 结果
按钮里直接 alert()
按钮用 href="#"
按钮点了没有任何状态变化
同一动作在多个组件里重复实现
```

---

# **二、工作流如何融入 Stitch 底座**

工作流不是新页面，也不是新系统。它应该嵌进当前页面的 action 层。

当前页面结构应该演进为：

```text
components/
  只负责展示和触发 props.onXxx

view-model / hooks/
  负责把 UI 操作转成 action

workflows/
  负责 AI / 信息流 / 跨模块联动

providers / mock-data/
  负责状态读写

components/
  因状态变化自动刷新
```

也就是：

```text
Stitch Button
→ Component props.onClick
→ ViewModel action
→ useNovelWorkflow()
→ MockAgentAdapter
→ WorkflowEvents
→ applyWorkflowEvents()
→ chapter / character / world / achievement / profile 更新
→ Stitch 页面刷新
```

这样工作流是“融入底座”的，而不是在页面外另建一个“AI 系统”。

---

# **三、全局导航层按钮规划**

## **1. TopAppBar 顶部栏**

| 按钮/入口 | 功能概要 | 动作类型 | P1 处理 |
|---|---|---|---|
| Logo「墨语 AI」 | 返回书架 / 首页 | `NAV` | 保留，进入 bookshelf |
| 工作台 | 返回当前项目工作台 | `NAV` | 保留 |
| 素材库 | 打开素材库占位或后续页面 | `NAV/FUTURE` | P1 暂缓，可占位 |
| 灵感区 | 打开灵感区占位或后续页面 | `NAV/FUTURE` | P1 暂缓，可占位 |
| 发布章节 | 将当前章节标记为发布/完成 | `CRUD` | P1 可映射为 mark completed |
| 通知 | 打开通知中心弹框 | `MODAL` | 保留占位 |
| 设置 | 打开系统设置 / 生成设置 | `MODAL` | 保留 |
| 头像 | 打开个人中心 | `NAV` | P1 必须稳定 |
| 成就按钮 | 打开成就系统 | `NAV` | P1 必须稳定 |

P1 中，TopAppBar 不直接调用 workflow，除非“发布章节”被定义为“章节完成工作流”。建议 P1 只做：

```text
发布章节 → chapter.status = completed → achievement.progressed
```

暂不接真实发布。

---

## **2. SideNav 全局/工作台侧栏**

| 按钮/入口 | 功能概要 | 动作类型 | P1 处理 |
|---|---|---|---|
| 大纲 | 切换到大纲面板 | `NAV/CRUD` | 保留 |
| 章节 | 进入章节编辑器或章节面板 | `NAV` | P1 必须稳定 |
| 人物 | 进入角色面板 | `NAV` | P1 必须稳定 |
| 设定 | 进入世界设定 | `NAV` | P1 必须稳定 |
| 导出 | 打开导出弹框 | `MODAL/FUTURE` | P1 弹框占位即可 |
| 帮助中心 | 打开教程页 | `NAV` | P1 保留 |
| 反馈 | 打开反馈弹框 | `MODAL` | P1 保留占位 |

---

# **四、02 我的书架页面按钮规划**

书架页面是项目上下文入口。P1 必须确保项目选择会影响后续工作台、编辑器、角色、世界设定数据。

| 按钮/入口 | 功能概要 | 动作类型 | P1 处理 |
|---|---|---|---|
| 搜索框 | 按标题/类型过滤项目 | `CRUD` | 保留 mock filter |
| 新建项目 | 打开创建项目弹窗 | `MODAL` | 保留 |
| 导入项目 | 导入本地项目 | `FUTURE` | P1 暂缓，占位 |
| 视图切换 | 卡片/列表切换 | `CRUD` | 可做 UI state |
| 排序 | 按更新时间/字数排序 | `CRUD` | 可做 mock sort |
| 项目卡片点击 | 选择项目并进入工作台 | `NAV + CRUD` | P1 必须稳定 |
| 项目卡片编辑 | 进入项目或打开编辑弹框 | `NAV/MODAL` | P1 可等同进入工作台 |
| 项目卡片删除 | 删除项目 | `CRUD` | P1 可暂缓或 mock delete |
| 项目卡片分享 | 分享项目 | `FUTURE` | 暂缓 |
| 右下 AI 助手 | 创作助手入口 | `FUTURE/AI_WORKFLOW` | P1 暂缓 |

P1 标准动作：

```text
ProjectCard.onClick
→ selectProject(projectId)
→ openView("workspace")
→ workspace 使用 nav.projectId
```

验收点：

```text
选择不同项目后，工作台项目名、章节、字数必须变化。
```

---

# **五、03 创建项目弹窗按钮规划**

创建项目弹窗是信息流的入口之一，但 P1 不做完整智能创建，只做项目创建 + 初始 mock 数据。

| 按钮/入口 | 功能概要 | 动作类型 | P1 处理 |
|---|---|---|---|
| 简易/完整 Tab | 切换表单模式 | `CRUD` | 保留 UI state |
| 书名输入 | 设置项目标题 | `CRUD` | 必须 |
| 类型选择 | 设置 genre | `CRUD` | 必须，影响 genrePromptTemplate |
| 简介输入 | 设置项目简介 | `CRUD` | 必须 |
| 主角姓名 | 创建主角基础信息 | `CRUD` | P1 可写入 character mock |
| 主角年龄 | 主角属性 | `CRUD` | P1 可保存 |
| 主角性别 | 主角属性 | `CRUD` | P1 可保存 |
| 主角性格 | 主角设定 | `CRUD` | P1 可保存 |
| 目标读者 | 项目 metadata | `CRUD` | P1 保存即可 |
| 写作风格 | 项目 metadata / prompt template | `CRUD` | P1 保存 |
| 故事主题 | 项目 metadata / 信息流 theme | `CRUD/INFO_WORKFLOW` | P1 保存 |
| 自定义设定 | 世界观初始设定 | `CRUD` | P1 可写入 world mock |
| 取消 | 关闭弹框 | `MODAL` | 必须 |
| 创建 | 创建项目并进入工作台 | `CRUD + NAV` | 必须 |
| AI 创建 | 根据表单生成初始大纲/角色/世界观 | `AI_WORKFLOW/FUTURE` | P1 暂不真实 AI，最多 mock 初始化 |

P1 标准动作：

```text
handleCreateProject(form)
→ createProject(project)
→ createInitialChapter(projectId)
→ createInitialCharacter(projectId)
→ createInitialWorldSetting(projectId)
→ selectProject(projectId)
→ openView("workspace")
```

不建议 P1 做真实“AI 创建项目”。但可以让按钮走同一个 mock 初始化 workflow。

---

# **六、12 题/25 题引导页按钮规划**

引导页未来应变成“信息蓝图生成器”，但 P1 只做最小可用。

| 按钮/入口 | 功能概要 | 动作类型 | P1 处理 |
|---|---|---|---|
| 新建引导项目 | 进入问答流程 | `NAV/CRUD` | 保留 |
| 选项点击 | 记录当前问题答案 | `CRUD` | 保留 |
| 文本输入 | 记录开放答案 | `CRUD` | 保留 |
| 上一步 | 回到上一题 | `CRUD` | 保留 |
| 下一步 | 保存答案并前进 | `CRUD` | 保留 |
| 跳过引导 | 使用默认值创建项目 | `CRUD + NAV` | P1 可做 |
| 关闭 | 退出引导 | `NAV/MODAL` | 保留 |
| 完成创建 | 根据答案创建项目 | `CRUD + INFO_WORKFLOW` | P1 可生成初始信息流 mock |

P1-Info-Lite 可以把引导答案转成：

```text
Story theme
Initial entropy
Core question
Initial InformationAtom[]
```

但不做完整 StoryInformationState。

---

# **七、04 小说项目工作台按钮规划**

工作台是 P1 最核心页面。所有 AI 工作流应优先从这里接入。

## **1. 左侧项目与导航区**

| 按钮/入口 | 功能概要 | 动作类型 | P1 处理 |
|---|---|---|---|
| 项目标题区域 | 显示当前项目 | `READ` | 必须读取 projectId |
| 大纲 | 切换大纲视图 | `CRUD/NAV` | 保留 |
| 章节 | 进入编辑器或章节列表 | `NAV` | 必须 |
| 人物 | 打开角色面板 | `NAV` | 必须 |
| 设定 | 打开世界设定 | `NAV` | 必须 |
| 导出 | 打开导出弹框 | `MODAL/FUTURE` | 弹框占位 |
| AI 生成大纲 | 生成/更新大纲 | `AI_WORKFLOW` | P1 可做 mock |
| 生成细纲 | 生成当前章细纲 | `AI_WORKFLOW` | P1 可做 mock |
| 帮助中心 | 打开教程页 | `NAV` | 保留 |
| 反馈 | 打开反馈弹框 | `MODAL` | 保留 |

P1 中至少要实现：

```text
AI生成大纲 → MockAgentAdapter.outline.generate → outline 更新
生成细纲 → MockAgentAdapter.outline.expand → currentChapter.outline 更新
```

如果时间不足，`AI生成大纲` 可 P1 做，`生成细纲` 放 P1+。

---

## **2. 章节树 / 大纲列表**

| 按钮/入口 | 功能概要 | 动作类型 | P1 处理 |
|---|---|---|---|
| 章节行点击 | 选择章节 / 进入编辑器 | `NAV + CRUD` | 必须 |
| 展开箭头 | 展开/折叠章节节点 | `CRUD` | 保留 UI state |
| 完成 checkbox | 标记章节完成 | `CRUD + INFO_WORKFLOW` | P1 做 status 更新 |
| 星标按钮 | 收藏/重点章节 | `CRUD` | 保留 |
| 章节拖拽排序 | 调整章节顺序 | `FUTURE` | 暂缓 |
| 新增章节 | 创建章节 | `CRUD` | P1 可选 |

P1 标准动作：

```text
selectChapter(chapterId)
→ openView("editor")
```

或：

```text
toggleChapterComplete
→ chapter.status = completed
→ achievement.progressed
```

---

## **3. 中央编辑预览与 AI Progress Dock**

| 按钮/入口 | 功能概要 | 动作类型 | P1 处理 |
|---|---|---|---|
| 历史版本 | 打开章节历史弹框 | `MODAL` | 占位 |
| 全屏 | 切换编辑区全屏 | `CRUD/FUTURE` | P1 可暂缓 |
| AI Progress Dock 暂停 | 暂停当前任务 | `AI_WORKFLOW` | P1 可设置 paused |
| AI Progress Dock 继续 | 恢复任务 | `AI_WORKFLOW/FUTURE` | P1 可暂缓 |
| 预览区域点击 | 进入编辑器 | `NAV` | 可保留 |

P1 中 AI Progress Dock 必须从真实 task state 读取：

```text
task.status
task.progress
task.preview
task.result
```

不能只是静态假进度。

---

## **4. 右侧生成设置面板**

| 按钮/入口 | 功能概要 | 动作类型 | P1 处理 |
|---|---|---|---|
| 目标字数 - | 减少目标字数 | `CRUD` | 必须 |
| 目标字数 + | 增加目标字数 | `CRUD` | 必须 |
| 字数容差 select | 设置容差 | `CRUD` | 保存 config |
| 参考章节数 select | 设置上下文范围 | `CRUD` | 保存 config |
| AI 模型 select | 设置模型字段 | `CRUD` | P1 只影响 mock metadata |
| 上下文：大纲细纲 | 是否加入大纲 | `CRUD` | 影响 contextAssembler |
| 上下文：正文摘要 | 是否加入摘要 | `CRUD` | 影响 contextAssembler |
| 上下文：主角状态 | 是否加入角色状态 | `CRUD` | 影响 contextAssembler |
| 上下文：角色关系 | 是否加入关系网 | `CRUD` | 影响 contextAssembler |
| 上下文：技能道具 | 是否加入世界物品 | `CRUD` | 影响 contextAssembler |
| 上下文：重要事件 | 是否加入事件线 | `CRUD` | 影响 contextAssembler |
| 开始生成 | 生成当前章节 | `AI_WORKFLOW` | P1 必须 |
| 批量生成 | 多章节生成 | `AI_WORKFLOW/FUTURE` | P1 暂缓或弹框占位 |
| 生成设置 | 打开高级设置弹框 | `MODAL` | 保留 |

P1 核心按钮：

```text
开始生成
→ runChapterGeneration(projectId, chapterId, config)
→ task running
→ task completed
→ chapter.generated / chapter.extracted / character.updated / world.referenced / achievement.progressed / profile.stats.updated
```

---

# **八、05 章节编辑器按钮规划**

编辑器是小说 MVP 的核心结果页面和轻编辑入口。

## **1. 顶部工具栏**

| 按钮/入口 | 功能概要 | 动作类型 | P1 处理 |
|---|---|---|---|
| 返回 | 返回工作台 | `NAV` | 必须 |
| 章节标题输入 | 编辑标题 | `CRUD` | P1 可保存 |
| 字数统计 | 展示当前字数 | `READ` | 必须随正文变化 |
| AI 续写 | 基于当前章节续写 | `AI_WORKFLOW` | P1 必须 |
| 保存草稿 | 保存当前正文 | `CRUD` | P1 mock save |
| 发布章节 | 标记完成/发布 | `CRUD + INFO_WORKFLOW` | P1 标记完成 |
| 历史版本 | 打开历史弹框 | `MODAL/FUTURE` | 占位 |
| 全屏 | 切换全屏 | `CRUD` | 可暂缓 |
| 设置 | 打开设置 | `MODAL` | 保留 |
| 头像 | 进入个人中心 | `NAV` | 保留 |

P1 中“AI 续写”应复用工作台 workflow：

```text
runEditorCommand("chapter.continue")
→ MockAgentAdapter
→ AIResultCard
→ 用户采纳
→ chapter.content append
→ informationState 更新
```

---

## **2. 正文编辑区**

| 按钮/入口 | 功能概要 | 动作类型 | P1 处理 |
|---|---|---|---|
| 正文输入 | 编辑章节正文 | `CRUD` | P1 保留本地状态或写回 chapter |
| 文本选择 | 触发浮动 AI 工具栏 | `CRUD` | 保留 |
| 光标定位 | 插入 AI 结果位置 | `CRUD` | P1 可简单追加 |
| 滚动 | 阅读编辑 | `UI` | 保留 |

P1 不要求做完整富文本。简单 content editable / textarea 即可。

---

## **3. 浮动 AI 工具栏**

| 按钮/入口 | 功能概要 | 动作类型 | P1 处理 |
|---|---|---|---|
| 续写 | 基于选区或当前位置续写 | `AI_WORKFLOW` | P1 可接同 AI 续写 |
| 改写 | 改写选中文本 | `AI_WORKFLOW` | P1 可 mock |
| 扩写 | 扩展选中文本 | `AI_WORKFLOW` | P1 可 mock |
| 润色 | 润色选中文本 | `AI_WORKFLOW` | P1 可 mock |
| 摘要 | 总结当前章节/选区 | `AI_WORKFLOW` | P1 可 mock extract |

如果 P1 时间有限，优先级：

```text
续写 > 摘要 > 润色 > 改写 > 扩写
```

至少要保证按钮不空：

```text
点击 → 创建 AI suggestion → 显示 AIResultCard
```

---

## **4. 右侧章节信息 / AI 提取面板**

| 按钮/入口 | 功能概要 | 动作类型 | P1 处理 |
|---|---|---|---|
| 重新提取信息 | 从正文提取摘要、角色、事件 | `AI_WORKFLOW + INFO_WORKFLOW` | P1 必须 mock |
| 保存草稿 | 保存章节状态 | `CRUD` | P1 保留 |
| 标记完成 | 章节完成 | `CRUD + INFO_WORKFLOW` | P1 必须 |
| 角色标签点击 | 跳转角色详情 | `NAV/FUTURE` | P1 可暂缓 |
| 世界设定标签点击 | 跳转世界设定 | `NAV/FUTURE` | P1 可暂缓 |
| 信息审计块 | 展示节拍/熵变化/惊喜度 | `INFO_WORKFLOW` | P1-Info-Lite 必须 |

P1-Info-Lite 最小展示：

```text
节拍
熵变化
惊喜度
新增信息数
新伏笔数
新关联数
```

---

## **5. AI 任务面板 / AI 结果卡**

| 按钮/入口 | 功能概要 | 动作类型 | P1 处理 |
|---|---|---|---|
| 展开/折叠任务 | 查看任务详情 | `CRUD` | 保留 |
| 取消任务 | 取消 running task | `AI_WORKFLOW` | P1 设置 canceled |
| 重试任务 | 重新执行失败任务 | `AI_WORKFLOW` | P1 mock retry |
| 采纳结果 | 写入正文 | `AI_WORKFLOW + CRUD + INFO_WORKFLOW` | P1 必须 |
| 存为灵感 | 保存 suggestion | `CRUD/FUTURE` | P1 可写入 chapter.aiSuggestions |
| 忽略结果 | 丢弃 suggestion | `CRUD` | P1 保留 |
| 复制结果 | 复制文本 | `CRUD` | 可选 |

采纳结果必须是 P1 关键闭环：

```text
AIResultCard.accept
→ result.accept command
→ chapter.content append/replace
→ chapter.wordCount update
→ chapter.informationState update
→ profile.stats update
→ achievement.progressed
```

---

# **九、06 角色追踪面板按钮规划**

角色面板不只是查看人物，它要接收章节生成后的角色状态变化。

| 按钮/入口 | 功能概要 | 动作类型 | P1 处理 |
|---|---|---|---|
| 返回工作台 | 回到 workspace | `NAV` | 必须 |
| AI 生成角色 | 生成角色设定 | `AI_WORKFLOW/FUTURE` | P1 暂缓或 mock |
| 主角卡点击 | 查看主角详情 | `CRUD/UI` | 保留 |
| 配角卡点击 | 查看配角详情 | `CRUD/UI` | 保留 |
| 反派卡点击 | 查看反派详情 | `CRUD/UI` | 保留 |
| 其他角色展开 | 展开列表 | `CRUD` | 保留 |
| 编辑角色 | 编辑角色信息 | `CRUD` | P1 可暂缓 |
| 新增角色 | 添加角色 | `CRUD` | P1 可选 |
| 关系标签点击 | 查看关系 | `INFO_WORKFLOW/FUTURE` | 暂缓 |
| 状态追踪区 | 展示出场/状态变化 | `READ` | P1 必须联动 |

P1 关键不是“AI 生成角色”，而是：

```text
章节生成后
→ character.updated event
→ 角色面板状态变化
```

验收：

```text
生成章节前后，至少一个角色的 appearanceCount / currentState / lastAppearedChapter 变化。
```

---

# **十、07 世界设定页面按钮规划**

世界设定页要接收章节生成后的世界规则引用。

| 按钮/入口 | 功能概要 | 动作类型 | P1 处理 |
|---|---|---|---|
| 返回工作台 | 回 workspace | `NAV` | 必须 |
| AI 生成设定 | 生成世界设定 | `AI_WORKFLOW/FUTURE` | P1 暂缓或 mock |
| 地点 Tab | 查看地点 | `CRUD/UI` | 保留 |
| 物品 Tab | 查看物品 | `CRUD/UI` | 保留 |
| 技能 Tab | 查看技能 | `CRUD/UI` | 保留 |
| 势力 Tab | 查看势力 | `CRUD/UI` | 保留 |
| 设定卡点击 | 查看详情 | `CRUD/UI` | 保留 |
| 新增设定 | 创建设定项 | `CRUD` | P1 可选 |
| 编辑设定 | 编辑设定项 | `CRUD` | P1 可暂缓 |
| 删除设定 | 删除设定项 | `CRUD` | P1 可暂缓 |
| 最近引用 | 展示引用章节 | `INFO_WORKFLOW` | P1 必须联动 |

P1 关键：

```text
章节生成后
→ world.referenced event
→ world item referenceCount + 1
→ lastReferencedChapter = currentChapter
```

验收：

```text
世界设定页某个卡片显示最近引用或引用次数变化。
```

---

# **十一、09 个人中心页面按钮规划**

个人中心当前不是核心创作页，但 P1 要让它展示创作行为带来的统计变化。

| 按钮/入口 | 功能概要 | 动作类型 | P1 处理 |
|---|---|---|---|
| 返回工作台 | 返回 workspace | `NAV` | 必须 |
| 设置按钮 | 打开个人设置 | `MODAL/FUTURE` | 占位 |
| 积分 Tab | 查看积分与记录 | `CRUD/UI` | 保留 |
| 充值 Tab | 查看充值套餐 | `FUTURE` | 占位 |
| 导出 Tab | 查看导出相关 | `FUTURE` | 占位 |
| 导入 Tab | 查看导入相关 | `FUTURE` | 占位 |
| 充值套餐按钮 | 发起支付 | `FUTURE` | 不做 |
| 导出按钮 | 导出作品 | `FUTURE` | 不做 |
| 导入按钮 | 导入作品 | `FUTURE` | 不做 |
| 统计卡 | 显示字数、章节、生成次数 | `READ` | P1 必须联动 |

P1 联动：

```text
profile.stats.updated
→ totalWords += wordCountDelta
→ generationCount += 1
→ creditDelta -= mockCost
→ creditRecords 新增 “AI 生成章节”
```

---

# **十二、10 AI 生成参数设置弹窗按钮规划**

这个弹框是生成设置的高级版。P1 可保留但要确保和 workspace config 同源。

| 按钮/入口 | 功能概要 | 动作类型 | P1 处理 |
|---|---|---|---|
| 关闭 X | 关闭弹框 | `MODAL` | 必须 |
| 目标字数 -/+ | 调整字数 | `CRUD` | 与 generationConfig 同步 |
| 字数容差 select | 设置容差 | `CRUD` | 同步 |
| 参考章节数 select | 设置上下文范围 | `CRUD` | 同步 |
| 模型 select | 设置模型字段 | `CRUD` | P1 metadata |
| 上下文 checkbox | 设置引用范围 | `CRUD` | 同步 |
| 包含设定折叠 | 展开高级上下文 | `CRUD/UI` | 保留 |
| 保存设置 | 保存配置 | `CRUD` | 必须 |
| 重置默认 | 恢复默认配置 | `CRUD` | 可选 |
| 取消 | 关闭不保存 | `MODAL` | 必须 |

P1 要求：

```text
弹框里的设置和右侧 Generation Panel 使用同一个 generationConfig。
```

不能两个地方各维护一份。

---

# **十三、11 成就系统按钮规划**

成就系统在 P1 的价值是验证工作流结果，而不是单纯装饰。

| 按钮/入口 | 功能概要 | 动作类型 | P1 处理 |
|---|---|---|---|
| 返回工作台 | 返回 workspace | `NAV` | 必须 |
| 分类 Tab | 切换全部/写作/角色/世界/信息流等 | `CRUD/UI` | 保留 |
| 成就卡点击 | 查看成就详情 | `CRUD/UI` | 可选 |
| 领取奖励 | 领取积分/徽章 | `CRUD/FUTURE` | P1 暂缓 |
| 分享成就 | 分享 | `FUTURE` | 不做 |
| 进度条 | 展示进度 | `READ` | P1 必须联动 |

P1 联动：

```text
chapter.generated → “初次执笔” +1
chapter.completed → “章节完成” +1
information.atom.created → “伏笔初现” +1
world.referenced → “世界构筑者” +1
character.updated → “群像初成” +1
```

---

# **十四、08 Modal Host 各弹框按钮规划**

| 弹框 | 按钮/入口 | 动作类型 | P1 处理 |
|---|---|---|---|
| 导出弹框 | 关闭 / 选择格式 / 导出 | `MODAL/FUTURE` | 占位，不真实导出 |
| 反馈弹框 | 输入反馈 / 提交 / 关闭 | `MODAL/CRUD` | 可 mock submit |
| 系统设置 | 保存 / 重置 / 关闭 | `MODAL/CRUD` | 可 mock |
| 通知中心 | 标记已读 / 关闭 | `MODAL/CRUD` | 可 mock |
| 历史版本 | 选择版本 / 恢复 / 关闭 | `MODAL/FUTURE` | 占位 |
| 批量生成 | 选择章节 / 开始 / 关闭 | `AI_WORKFLOW/FUTURE` | P1 暂缓 |
| 生成设置 | 保存 / 重置 / 关闭 | `MODAL/CRUD` | P1 保留 |

P1 规则：

```text
Modal 可以存在，但不要让 Modal 成为主链路阻塞。
```

---

# **十五、按钮到 Workflow 的最小接入优先级**

所有按钮不可能 P1 全做。必须分层。

## **P1 必须接入的按钮**

| 页面 | 按钮 | 原因 |
|---|---|---|
| 书架 | 项目卡片点击 | 项目上下文入口 |
| 工作台 | 章节点击 | 进入编辑器 |
| 工作台 | 开始生成 | MVP 核心 |
| 工作台 | AI Progress Dock | 任务生命周期展示 |
| 编辑器 | AI 续写 | MVP 核心 |
| 编辑器 | 采纳结果 | 写回闭环 |
| 编辑器 | 重新提取信息 | 信息审计入口 |
| 编辑器 | 标记完成 | 成就联动 |
| 角色面板 | 查看状态变化 | 联动验收 |
| 世界设定 | 查看引用变化 | 联动验收 |
| 成就系统 | 查看进度变化 | 联动验收 |
| 个人中心 | 查看统计变化 | 联动验收 |

---

## **P1 可做但非阻塞的按钮**

| 页面 | 按钮 | 说明 |
|---|---|---|
| 工作台 | AI 生成大纲 | 可 mock |
| 工作台 | 生成细纲 | 可 mock |
| 编辑器 | 润色 / 改写 / 扩写 / 摘要 | 可共用 MockAgentAdapter |
| 创建项目 | AI 创建 | 可 mock 初始化 |
| 书架 | 搜索 / 排序 / 视图切换 | 提升体验 |
| 成就 | 分类 Tab | UI 体验 |

---

## **P2 后再做的按钮**

| 页面 | 按钮 | 原因 |
|---|---|---|
| 工作台 | 批量生成 | 需要更完整任务队列 |
| 工作台 | 暂停/恢复真实生成 | 需要 streaming executor |
| 编辑器 | 历史版本恢复 | 需要版本存储 |
| 世界设定 | AI 生成设定 | 需要真实世界观 Agent |
| 角色面板 | AI 生成角色 | 需要角色 Agent |
| 导出弹框 | PDF/EPUB/Word 导出 | 不是 MVP 主链路 |
| 个人中心 | 充值 | 涉及支付 |
| 多模型选择 | 真实路由 | P2-lite/P3 |

---

# **十六、建议建立 Action Registry，不一定写复杂代码，但必须形成契约**

为了避免按钮失控，建议 Trae 在文档或类型中建立最小 action contract。

可以新增：

```text
packages/app/src/novel/types/novel-action.ts
```

或先放在文档里。

建议结构：

```ts
export type NovelActionKind =
  | "NAV"
  | "MODAL"
  | "CRUD"
  | "AI_WORKFLOW"
  | "INFO_WORKFLOW"
  | "FUTURE";

export interface NovelActionSpec {
  id: string;
  label: string;
  page: string;
  kind: NovelActionKind;
  p1Required: boolean;
  handler: string;
  target?: string;
}
```

例如：

```ts
{
  id: "workspace.generate.chapter",
  label: "开始生成",
  page: "workspace",
  kind: "AI_WORKFLOW",
  p1Required: true,
  handler: "useNovelWorkflow.runChapterGeneration",
}
```

这不是为了过度工程，而是为了让每个按钮都有归属。

---

# **十七、工作流融入底座的最终形态**

P1 完成后，Stitch 底座不应该是：

```text
页面 A 有自己的生成逻辑
页面 B 有自己的生成逻辑
AI 面板有自己的假状态
编辑器有自己的假结果
```

而应该是：

```text
统一 NovelWorkflow
统一 MockAgentAdapter
统一 WorkflowEvents
统一 applyWorkflowEvents
统一 Provider/Store 写回
所有页面读取同一份状态
```

也就是说：

```text
工作台点击生成
编辑器点击续写
浮动工具栏点击润色
右侧面板点击重新提取
```

都走同一套：

```text
NovelCommand
→ Adapter
→ Result
→ Events
→ Store
```

区别只是 `command.type` 不同。

---

# **十八、给 Trae 的直接下发指令**

```text
主控补充要求：工作流必须融入当前 Stitch 底座，不允许另起割裂系统。

请先完成 Stitch 底座全按钮 Action Contract 梳理，并按以下分类标注所有按钮：
NAV / MODAL / CRUD / AI_WORKFLOW / INFO_WORKFLOW / FUTURE。

必须覆盖页面：
1. TopAppBar / SideNav 全局导航
2. 02 我的书架
3. 03 创建项目弹窗
4. 12 25 道题引导页
5. 04 小说项目工作台
6. 05 章节编辑器
7. 06 角色追踪面板
8. 07 世界设定页面
9. 09 个人中心
10. 10 AI 生成参数设置弹窗
11. 11 成就系统
12. ModalHost 中所有弹框

输出文档：
docs/reports/phase-p1-action-contract.md

文档必须包含：
- 页面名称
- 按钮/入口名称
- 功能概要
- 动作类型
- P1 是否必须
- 对应 handler / workflow / provider
- 是否暂缓到 P2/P3

P1 执行优先级：
必须先接入这些核心按钮：
1. 书架项目卡片点击
2. 工作台章节点击
3. 工作台开始生成
4. AI Progress Dock 状态展示
5. 编辑器 AI 续写
6. AIResultCard 采纳结果
7. 编辑器重新提取信息
8. 编辑器标记完成
9. 角色面板状态展示
10. 世界设定引用展示
11. 成就进度展示
12. 个人中心统计展示

工作流接入方式：
UI Button
→ component props.onXxx
→ viewModel / hook action
→ useNovelWorkflow
→ MockAgentAdapter
→ WorkflowEvents
→ applyWorkflowEvents
→ providers/mock store
→ Stitch 页面响应式刷新

禁止：
1. 不允许按钮内部直接 hardcode 结果。
2. 不允许每个页面各写一套 AI 逻辑。
3. 不允许 workflow 绕过现有 providers/hooks。
4. 不允许为了 workflow 推翻 Stitch 组件底座。
5. 不允许 href="#"、alert()、散落 console.log。
6. 不允许 P1 做完整真实 Agent / Skill / DailyLog / SQLite / 导出系统。

验收：
1. phase-p1-action-contract.md 完整列出所有按钮。
2. 每个按钮都有动作归类。
3. 每个 P1 必须按钮都有 handler 归属。
4. 工作流入口明确融入现有页面。
5. 后续 P1 开发按该 Action Contract 执行。

完成后输出：
[READY_FOR_PHASE_P1_ACTION_CONTRACT_REVIEW]
```

---

# **十九、当前裁定**

当前不能只说“做 P1 工作流”，必须先建立：

```text
Stitch Button → Action Contract → Workflow / Provider / Navigation
```

否则工作流会变成割裂的技术层。

当前阶段应更新为：

```text
Phase P1-0A — Stitch Action Contract
```

它是 P1 的前置任务。

执行顺序应改成：

```text
P1-0A：全按钮 Action Contract
↓
P1-1：Workflow 类型与 Adapter
↓
P1-2：工作台生成接入
↓
P1-3：编辑器续写与采纳接入
↓
P1-Info-Lite：信息审计字段接入
↓
P1-QA：工作流 E2E
↓
MVP-Freeze
```

这样才能保证：

```text
工作流是长在 Stitch 底座上的，
而不是另做一套“AI Workflow Demo”。
```

*内容由 AI 生成仅供参考*
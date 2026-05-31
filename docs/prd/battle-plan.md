# 基于 OpenCode 1.4.0 定制开发 AI 小说编辑器 - 作战计划

> **作者**: 项目主控  
> **版本**: 1.0  
> **日期**: 2026-05-31  
> **状态**: 已批准，可执行

---

## 一、OpenCode 1.4.0 调研结论（定制可行性判断）

在开始拆任务之前，必须先把"地基"摸清楚。OpenCode 在 1.4.x 这一线上，已经从早期"纯 CLI Agent"演进为一个**插件化、多 Provider、可嵌入 IDE** 的 AI 编码运行时，对"做一款垂类编辑器"这种二开诉求非常友好。它的几个关键能力点决定了我们的技术路线：

- **多 Provider 抽象层**: 通过 `models.dev` 注册表统一调度 Anthropic、OpenAI、豆包、文心、通义、本地 Ollama 等，PRD 里的"AI 模型设置页（豆包/文心/通义切换）"几乎不用从零写，复用 Provider Registry 即可。
- **Plugin / Tool 机制**: 1.4.0 支持以 `@opencode-ai/plugin` 形式注册自定义 Tool（文件级、命令级、UI 级），我们要做的"大纲生成 / 细纲生成 / 正文生成 / 拆书 / 名字生成器"本质上就是 5 个 Tool。
- **Session & Context 持久化**: 内置 SQLite-based session store，刚好对应 PRD 中"章节编辑器上下文参考"与"云同步（VIP）"的本地侧实现。
- **TUI + Web UI 双前端**: 1.4.0 已稳定输出 Web UI（基于 SolidJS / Hono），我们的小说编辑器富文本工作台直接挂在 Web UI 这一侧最经济。
- **MCP（Model Context Protocol）兼容**: 可以把"角色追踪、世界设定"做成 MCP Server，让其它编辑器（含 Trae IDE 自身）也能复用，这是 PRD 没要求但能极大提升复用性的隐藏红利。

> **结论**: OpenCode 1.4.0 适合作为底座；我们要做的工作量主要在 **Web UI 层的小说编辑器壳、5 个 AI Tool 插件、积分/VIP 业务后端、富文本/章节数据模型** 这四块。其余（鉴权、Provider 调度、会话持久化、流式输出）复用即可。

---

## 二、现状评估（项目已有基础）

经过调研，我们发现项目**已经有大量基础代码！** 位于 `/workspace/caiode/opencode-1.4.0/packages/app/src/`:

### 2.1 已有的 Novel 相关模块

| 模块 | 路径 | 功能 | 状态 |
|------|------|------|------|
| Novel Editor Core | `novel/` | 项目、章节、角色管理 | ✅ 已实现 |
| Novel 3D 分镜 | `novel-3d/` | 3D 镜头规划、Three.js 渲染 | ✅ 已实现 |
| Novel Canvas | `novel-canvas/` | 故事画布、节点编辑 | ✅ 已实现 |

### 2.2 数据模型对比

| 作战计划概念 | 现有实现 | 匹配度 |
|------------|---------|-------|
| NovelProject | Project | 高 |
| Chapter | Chapter | 高 |
| Character | Character | 高 |
| CharacterRelationship | CharacterRelationship | 高 |
| StoryWorld | - | 需新增 |
| Location | - | 需新增 |
| Beat | - | 需新增 |

### 2.3 技术栈

- **框架**: SolidJS + Hono（与作战计划一致！）
- **包管理**: Bun workspace + Turbo（与作战计划一致！）
- **测试**: Vitest + Playwright（与作战计划一致！）
- **ORM**: Drizzle + SQLite（与作战计划一致！）

---

## 三、需求大纲（按"主控视角"重新归并）

PRD 原始的 21 个页面 + 17 项功能，从工程实现角度可以收敛为 **5 个领域模块 + 1 个基础设施层**。Trae IDE 后续所有任务都挂在这 6 个域下，避免散点开发。

| 领域模块 | 覆盖 PRD 功能 | OpenCode 复用点 | 新增工作量 |
|---|---|---|---|
| M1 创作工作台 | 大纲/细纲/正文生成、章节编辑、富文本 | Session、流式 Tool 调用 | 富文本编辑器、章节树、生成参数弹窗 |
| M2 内容资产管理 | 角色追踪、世界设定、剧情线 | 文件系统 Tool、MCP Server | 结构化 Schema、关系图谱、自动联动 |
| M3 创作引导 | 简易创作、25 道题引导、5 步向导 | Prompt 模板系统 | 引导状态机、问卷 → Schema 转换器 |
| M4 用户与商业化 | 账户、积分、VIP、充值、成就、签到 | Auth Provider | 积分账本、订单、支付回调、成就引擎 |
| M5 辅助工具 | 名字生成器、拆书分析、AI 封面 | Tool Plugin | 三个独立 Tool + 结果落库 |
| M0 基础设施 | AI 模型设置、云同步、导入导出、响应式 | Provider Registry、SQLite | 多端同步协议、JSON Schema 迁移器 |

这张表就是后续所有 Sprint 排期的"母表"，Trae IDE 每次接任务都必须声明"我现在做的是 M? 域下的哪个 Story"。

---

## 四、技术栈与目录约定（给 Trae IDE 的硬约束）

为了让 Vibecoding 不至于发散，主控先把"骨架"钉死，Trae IDE 只能在骨架内生长代码：

```
opencode-novel/
├── packages/
│   ├── core/                 # 复用 opencode 核心，禁止修改
│   ├── plugin-novel-ai/      # M1+M5 的 5 个 AI Tool
│   ├── plugin-novel-assets/  # M2 角色/世界/剧情 MCP Server
│   ├── web-novel/            # M1~M5 的 SolidJS Web UI 壳
│   ├── server-billing/       # M4 积分/VIP/订单（Hono + SQLite）
│   └── shared-schema/        # 所有 Zod Schema + 类型导出
├── tests/
│   ├── unit/                 # Vitest
│   ├── integration/          # Tool ↔ Provider 级
│   └── e2e/                  # Playwright，对齐 PRD 21 页面
└── docs/prd/                 # 原始 PRD + 本作战计划
```

**强约束三条**: 
1. 任何业务代码必须先有 `tests/` 下对应红测；
2. 所有跨包通信走 `shared-schema` 的 Zod 类型，禁止 `any`；
3. 与 OpenCode 核心的交互只能通过 Plugin / Tool API，不允许 patch `packages/core`。

### 4.1 与现有项目的整合

由于现有项目已经在 `caiode/opencode-1.4.0/packages/app/src/novel/` 中有实现，我们采用**渐进式整合**策略：

1. **保留现有代码**，继续完善现有架构
2. **对齐作战计划**，逐步将现有模块重构到计划中的架构
3. **新增模块**严格按照作战计划创建

---

## 五、分阶段实施计划（5 个 Sprint，每个 Sprint 2 周）

阶段切分遵循"先打通骨架、再填血肉、最后做商业化与运营"的顺序，每阶段都有可演示的 Demo 产物，避免 Trae IDE 陷入"写了一堆但跑不起来"的死局。

### Sprint 0｜地基（Week 1-2）：OpenCode 1.4.0 二开骨架 + CI/CD + TDD 脚手架

这一阶段不做任何业务功能，目标是让"红 → 绿 → 重构"的循环能在 5 秒内跑完。产出包括：fork 并锁定 opencode 1.4.0 commit、搭建 pnpm workspace、接入 Vitest + Playwright、配置 GitHub Actions（lint / type / test / build 四关卡）、跑通一个 "Hello Novel Tool"的端到端 Demo（Web UI 点按钮 → 触发自定义 Tool → 返回流式文本）。验收标准是：`bun test` 全绿，且 Web UI 能看到流式 token 涌出。

**Sprint 0 目标**:
- [ ] 项目能完整构建和运行
- [ ] TDD 循环能够正常工作（红→绿→重构）
- [ ] "Hello Novel Tool" 端到端 Demo
- [ ] 现有模块代码分析文档

### Sprint 1｜M1 创作工作台 MVP（Week 3-4）

聚焦"能写一本书"的最短路径：登录页（PRD-02）、我的书架（PRD-03）、创建项目 5 步向导（PRD-04~08）、小说工作台（含章节树 + 富文本编辑器）、大纲生成 Tool、正文生成 Tool。富文本选型建议 **TipTap 2.x**（与 SolidJS 适配良好且支持自定义 Mark，方便后续做"AI 续写高亮"）。本 Sprint 结束应能完成"注册 → 建项目 → AI 生成大纲 → AI 续写一章正文 → 保存"的完整闭环。

### Sprint 2｜M2 内容资产 + M3 引导（Week 5-6）

把"小说之所以是小说"的资产层补齐：角色追踪面板（PRD-06）、世界设定页（PRD-07）、剧情线管理、25 道题引导（PRD-09~10）。这里有一个**主控必须坚持的设计决策**：角色/世界/剧情统一建模为"知识卡片（KnowledgeCard）"，正文生成 Tool 在调用 LLM 前自动检索相关卡片注入 system prompt——这是 PRD 没写明但决定产品天花板的关键架构，Trae IDE 不能图省事拆成三套独立 CRUD。

### Sprint 3｜M4 用户系统与商业化（Week 7-8）

补齐积分账本（含 PRD 的获取/消耗规则表）、VIP 等级、充值下单、支付回调（先接入沙箱，正式渠道留 Hook）、成就系统、签到。这一阶段的 TDD 重点是**金额与积分的不变式测试**：任何一笔交易后，`SUM(账本流水) === 当前余额`，必须有 property-based test（推荐 fast-check）持续守护。

### Sprint 4｜M5 辅助工具 + M0 同步导入导出（Week 9-10）

名字生成器、拆书分析、AI 封面三个 Tool 各自独立成插件；数据导出（JSON）、导入（含 Schema 版本迁移）、VIP 云同步（基于 CRDT 或简单 last-write-wins，主控倾向先做 LWW，CRDT 留 v2）。响应式移动端适配在本阶段一次性收尾。

### Sprint 5｜灰度、压测、文档（Week 11-12）

Playwright 跑完 PRD 21 个页面的回归套件、k6 对生成接口做并发压测、产出运营手册与帮助文档（PRD-21 新手教程页）。上线灰度 5% → 25% → 100%。

---

## 六、TDD 操作规范（红 / 绿 / 重构的"三色合同"）

主控对 Trae IDE 的硬性要求：**任何一次 commit，必须能被归类为 R/G/F 三种之一**，且 commit message 前缀必须是 `red:` / `green:` / `refactor:`。三类提交的规则如下：

- **red**: 只允许新增/修改测试文件，且 CI 必须红。用于把需求"翻译"成可执行规约。例如 `red: 大纲生成 Tool 在缺少世界观卡片时应返回 NEED_CONTEXT`。
- **green**: 允许动业务代码，目标是让上一个 red 转绿，**不允许新增测试**。代码可以"丑"，但要最短路径让测试过。
- **refactor**: 不允许改变测试，也不允许新增功能，只做结构优化。覆盖率不得下降。

为了让流程具象，下面给出 M1 中"大纲生成 Tool"的一个完整三步循环示例，主控直接把这段贴给 Trae IDE 当模板：

```typescript
// red: tests/unit/plugin-novel-ai/outline.spec.ts
import { describe, it, expect } from 'vitest'
import { generateOutline } from '@/plugin-novel-ai/outline'

describe('大纲生成 Tool', () => {
  it('当项目无世界观卡片时，应返回 NEED_CONTEXT 错误码', async () => {
    const res = await generateOutline({ projectId: 'p1', chapters: 10 })
    expect(res.ok).toBe(false)
    expect(res.code).toBe('NEED_CONTEXT')
  })

  it('当上下文齐备时，应返回 chapters.length === 输入章节数', async () => {
    await seedProjectWithWorld('p1')
    const res = await generateOutline({ projectId: 'p1', chapters: 10 })
    expect(res.ok).toBe(true)
    expect(res.data.chapters).toHaveLength(10)
  })
})
```

随后 Trae IDE 进入 `green:` 阶段，写最朴素的实现（甚至可以 mock LLM 返回固定结构），让两条用例转绿；最后 `refactor:` 阶段抽出 `ContextResolver`、`PromptBuilder`、`StreamParser` 三个内部模块。**禁止跳过 red 直接写代码**，这是 Vibecoding 模式下最容易翻车的点，主控会在 PR Review 时检查 commit 历史。

---

## 七、Vibecoding 指令模板（主控 → Trae IDE 的"标准化喊话"）

Vibecoding 的精髓不是"随便聊聊让 AI 写代码"，而是**用结构化的氛围指令**把意图、约束、验收标准一次性灌给执行体。给 Trae IDE 的每条任务都按下面这个 7 段式模板下发，可以把返工率压到最低：

```
[VIBE] 任务编号：M1-S1-T03
[WHY] 我们要让用户在书架页能"一键续写最后编辑的章节"，这是留存关键路径。
[WHAT] 在 packages/web-novel/src/routes/center.tsx 增加 ContinueWritingButton 组件，
       点击后调用 plugin-novel-ai 的 generateContent Tool，流式渲染到对话气泡。
[HOW] 必须先写 tests/e2e/continue-writing.spec.ts 的 red 用例；
       UI 复用现有 <StreamBubble />；
       Tool 调用走 shared-schema 的 GenerateContentInput。
[DONT] 不要新建状态管理库；不要修改 packages/core；不要写 any。
[DONE] ① e2e 用例从红转绿；② Lighthouse 性能分 ≥ 90；
       ③ 在 docs/prd/ 追加该交互的截图与 GIF。
[VIBE_TONE] 紫罗兰渐变、克制留白、动效 200ms ease-out，对齐 PRD 设计规范。
```

这个模板里 `[VIBE_TONE]` 这一段是 Vibecoding 区别于普通工单的关键——它把"美学/手感/节奏"也编码进了指令，Trae IDE 在生成 CSS 与微交互时会显著更贴近设计意图。主控在每个 Sprint 启动前，会把当 Sprint 所有任务按这个模板批量生成，存到 `docs/tasks/sprint-N/`，Trae IDE 按编号顺序消费即可。

---

## 八、风险登记与主控保留决策点

最后，作为项目主控，有几件事我**不授权 Trae IDE 自行决策**，必须升级给我确认，以免 Vibecoding 在自由度过高时偏离 PRD：

1. **LLM Provider 的默认选型与降级策略**——直接影响成本与合规，必须主控敲定豆包为默认、文心为降级、本地 Ollama 为离线兜底。
2. **积分定价与 VIP 权益边界**——属于商业策略，Trae IDE 不得擅自调整 PRD 中的积分获取/消耗表。
3. **富文本数据格式**（TipTap JSON vs Markdown）——一旦选定将影响整个导入导出与云同步协议，主控选 TipTap JSON + Markdown 双向转换器。
4. **任何对 `packages/core` 的 patch 需求**——必须发起 RFC，禁止直接改。
5. **用户隐私与小说内容的训练数据使用边界**——默认全部本地存储、不回传训练，云同步走端到端加密（VIP 才开放）。

---

## 九、下一步行动

按照上面这套作战计划推进，第 12 周末你将拿到一个跑在 OpenCode 1.4.0 之上、覆盖 PRD 全部 21 页面、具备完整 TDD 测试网与 Vibecoding 任务历史的小说编辑器 MVP，并且整套二开成果可作为 OpenCode 生态的一个垂类样板对外展示。

接下来，我将：
1. 立即生成 Sprint 0 的全部 `[VIBE]` 任务卡
2. 准备 Trae IDE 可以直接消费的任务列表

---

**文档版本**: 1.0  
**最后更新**: 2026-05-31  
**审批状态**: ✅ 已批准

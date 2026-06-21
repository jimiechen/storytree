# Phase P2-0 缺口报告

> 角色：前端工程师 / Novel 模块开发 Agent (Kimi-K2.7-Code)
> 任务：Phase P2-0 基线
> 来源：`tabbit_Phase P2-0.md` / `p2-baseline-matrix.md`
> 日期：2026-06-20

---

## 1. PRD 缺口

基于 21 个 PRD 页面与当前代码对比：

| 覆盖状态 | 数量 | 页面 |
|---------|------|------|
| 已实现 | 6 | 我的书架、成就系统、作者中心-创作统计、AI 模型设置、我的书架更新态、创建新项目（合并弹窗） |
| 部分实现 | 7 | 创建新项目-基本信息/主角设定/世界观/剧情总纲/自定义设定、25 道题引导首页/新建、积分充值 |
| 未实现 | 8 | 首页、登录页、云同步、数据导出、数据导入、名字生成器、AI 拆书工作室、新手教程 |

### 1.1 已覆盖页面

- 书架主入口、项目卡片、搜索、创建项目弹窗已可用。
- 工作台、编辑器、角色面板、世界设定等 P0 主链路页面已实现。
- 个人中心统计展示已可用。

### 1.2 部分覆盖页面

| 页面 | 当前状态 | 缺口 |
|------|---------|------|
| 创建新项目-基本信息 | 弹窗实现 | PRD 为多步骤 wizard，当前合并为单弹窗多字段 |
| 创建新项目-主角设定 | 弹窗内字段 | 缺少独立的主角设定步骤页 |
| 创建新项目-世界观 | 弹窗内字段 | 缺少独立的世界观步骤页 |
| 创建新项目-剧情总纲 | 弹窗内字段 | 缺少独立的剧情总纲步骤页 |
| 创建新项目-自定义设定 | 弹窗内字段 | 缺少独立的自定义设定步骤页 |
| 25 道题引导首页 | 骨架可用 | 题目逻辑、结果生成未完整实现 |
| 25 道题引导新建 | 骨架可用 | 引导生成项目流程未完整实现 |
| 积分充值 | UI 存在 | 真实支付逻辑关闭，当前仅展示 |

### 1.3 未覆盖页面

| 页面 | P2 处理策略 | FeatureGate |
|------|------------|-------------|
| 首页 | 不进入 P2，入口改为书架 | 否 |
| 登录页 | 不进入 P2，沿用 OpenCode auth | 否 |
| 云同步 | FeatureGate | `cloudSyncEnabled` |
| 数据导出 | FeatureGate | `exportEnabled` |
| 数据导入 | FeatureGate | `importEnabled` |
| 名字生成器 | FeatureGate | `nameGeneratorEnabled` |
| AI 拆书工作室 | FeatureGate | `bookAnalysisEnabled` |
| 新手教程 | FeatureGate，复用 guide25 gate | `guide25Enabled` |

---

## 2. Action Contract 缺口

### 2.1 P0 核心动作（18 个）

18 个 P0 动作当前均已实现 handler，且能真实写回状态。主要缺口：

| Action ID | 缺口描述 | 风险 |
|-----------|---------|------|
| 03-13 创建项目提交 | 当前合并弹窗，缺少 wizard 分步校验 | 低 |
| 04-SN08 / 04-SN09 大纲生成 | 已接入 Mock Workflow，但未接入 YAML / Tool | 中 |
| 04-A01 开始生成 | 已接入 Mock Workflow，P2-D 需绑定 YAML | 中 |
| 05-T03 / 05-FT01 AI 续写 | 已接入 Mock Workflow，P2-D 需绑定 YAML | 中 |
| 05-IP01 重新提取 | 已接入 Mock Workflow，且需要 Info Theory | 中 |
| 05-TP02 取消任务 / 05-TP03 重试任务 | 任务生命周期依赖 Workflow Engine 支持 | 中 |

### 2.2 P1 完整体验动作

约 23 个 P1 动作中，大部分已实现。未实现或需要 FeatureGate：

| 区域 | 缺口 | 策略 |
|------|------|------|
| FloatingToolbar 改写/扩写/润色/摘要 | 仅续写实现，其余占位 | P2-B 后实现或 FeatureGate |
| Guide25 完整流程 | 骨架实现 | `guide25Enabled` |
| ModalHost 占位弹窗 | 导出/反馈/历史版本/通知/批量生成/设置/成就详情 | FeatureGate |
| 发布章节 | 未实现 | FeatureGate |
| 暂停生成 | 未实现 | FeatureGate |

### 2.3 P2 / FUTURE 动作

全部标记为 FeatureGate / Not Implemented，不在 P2 主链路处理。

### 2.4 假按钮 / 空 handler 风险

经扫描，当前代码未发现显式的空 handler 或 `() => {}` 占位。但存在以下风险：

| 位置 | 风险 | 状态 |
|------|------|------|
| 25 道题引导进入按钮 | 流程骨架可用，但生成项目结果未真实写回 | 需 FeatureGate |
| ModalHost 中多个占位弹窗 | 通过 `placeholder-page.tsx` 展示，不会伪成功 | 已控制 |
| 充值按钮 | UI 展示，真实支付未接入 | 已 FeatureGate |
| 导出/导入/云同步 | 页面未实现，入口未显示 | 已 FeatureGate |

---

## 3. 当前目录结构差异

当前 `packages/app/src/novel/` 实际目录：

```
packages/app/src/novel/
├── adapters/
├── components/
│   ├── achievements/
│   ├── bookshelf/
│   ├── character-panel/
│   ├── create-project-modal/
│   ├── layout/
│   ├── novel-editor/
│   ├── novel-guide/
│   ├── novel-workspace/
│   ├── profile/
│   ├── ui/
│   ├── world-setting/
│   ├── index.ts
│   ├── mock-mode-banner.tsx
│   └── novel-shell.tsx
├── docs/phase-p2/
├── hooks/
├── mock-data/
├── providers/
├── services/
├── styles/
├── types/
├── utils/
├── workflows/
└── index.tsx
```

### 3.1 与原方案假设的差异

| 原方案假设 | 当前实际 | 影响 |
|-----------|---------|------|
| 存在 `stores/` 目录 | 不存在 | 状态管理通过 providers + hooks 实现，P2 不需要新建 stores |
| 存在 `plugins/` 目录 | 不存在 | P2-B 需要新建 `plugins/` |
| 存在 `info-theory/` 目录 | 不存在 | P2-C 需要新建 `info-theory/` |
| 存在 `chat-debug/` 目录 | 不存在 | P2-A0 需要新建 `chat-debug/` |
| YAML Workflow 目录已建立 | `workflows/yaml/` 不存在 | P2-A 需要新建 `workflows/yaml/`、`workflows/engine/` |
| Adapter 目录已多文件 | `adapters/` 仅 3 个文件 | P2-E 需要扩展为 mock / opencode-stub / claudecode-stub / router |

### 3.2 建议的 P2 目录补全

```
packages/app/src/novel/
├── adapters/                    # 已存在，P2-E 扩展
├── chat-debug/                  # P2-A0 新建
├── components/                  # 已存在
├── docs/phase-p2/               # 已存在
├── hooks/                       # 已存在，P2 新增 use-feature-gates.ts
├── info-theory/                 # P2-C 新建
├── mock-data/                   # 已存在
├── plugins/                     # P2-B 新建
├── providers/                   # 已存在
├── services/                    # 已存在
├── styles/                      # 已存在
├── types/                       # 已存在
├── utils/                       # 已存在
├── workflows/                   # 已存在
│   ├── yaml/                    # P2-A 新建
│   ├── engine/                  # P2-A 新建
│   └── mock-generation-workflow.ts   # 保留，逐步迁移
└── index.tsx
```

---

## 4. Mock Workflow 与 YAML Workflow 差距

### 4.1 当前 Mock Workflow 入口

- 文件：`workflows/mock-generation-workflow.ts`
- 入口函数：`runMockGeneration(command, adapter)`
- 输出：`{ result, events, durationMs }`
- 写回：由调用方显式调用 `applyWorkflowEvents(events, mutations)`
- 特点：硬编码编排，直接调用 Adapter，事件构建与 Adapter 结果强耦合。

### 4.2 YAML Workflow 目标

- 文件：`workflows/yaml/*.yaml`
- 入口：`NovelWorkflowEngine.load(yamlPath) -> execute(command, context)`
- 输出：`AsyncGenerator<WorkflowStepResult>`
- 写回：由 Workflow Event 统一消费，支持逐步事件流。
- 特点：步骤可配置、Tool 可替换、Adapter 可路由、Info Theory 可插入。

### 4.3 差距清单

| 维度 | 当前 Mock Workflow | YAML Workflow | 差距 |
|------|-------------------|---------------|------|
| 配置化 | 硬编码 TS | YAML 文件 + schema | 需要新增 loader / schema |
| Tool 拆分 | Adapter 直接产出完整结果 | 每个步骤对应 Tool | 需要 Tool Registry |
| 步骤事件 | 完成后一次性发出所有事件 | 每步发出 started/completed 事件 | 需要扩展 NovelWorkflowEvent |
| Adapter 路由 | 单例 `mockAgentAdapter` | AdapterRouter 按配置路由 | 需要新增 router |
| Info Theory | 由 Adapter 预计算 | 作为独立 Tool / 步骤 | 需要新增 info-theory 服务 |
| 取消/重试 | 由 UI 直接控制 task 状态 | Workflow Engine 支持 | 需要引擎支持生命周期 |

### 4.4 渐进迁移路径

| 阶段 | 动作 |
|------|------|
| P2-A 早期 | YAML Engine 包装 `runMockGeneration`，YAML 只描述工作流名与输入 |
| P2-B | 将 YAML 步骤映射到 Tool，Tool 内部复用现有逻辑 |
| P2-C | 在 YAML 中插入 `info-theory-audit` 步骤 |
| P2-E | YAML `adapter` 字段支持 mock / opencode-stub / claudecode-stub，由 AdapterRouter 路由 |
| P2 结束 | `mock-generation-workflow.ts` 可被 YAML 完全替代，保留为回归测试参考 |

---

## 5. 后续阶段输入依赖

### 5.1 P2-A0 Chat Debug Console

需要消费：

- `p2-interface-contract.md` 中的 `NovelCommand`、`NovelWorkflowEngine` 草案。
- 当前 `mock-generation-workflow.ts` 入口。
- `WorkflowContext` 与 `WorkflowMutations` 接口。
- 当前 Novel 目录结构与 provider/hook 位置。

### 5.2 P2-A YAML Workflow Engine

需要消费：

- `NovelCommand` 接口。
- `WorkflowDefinition` / `WorkflowStep` 接口。
- YAML Workflow Schema 草案。
- 当前 `mock-generation-workflow.ts` 的执行语义。
- `NovelWorkflowEvent` 扩展定义。

### 5.3 P2-B Plugin Tool Registry

需要消费：

- `NovelTool` / `ToolContext` / `ToolResult` 接口。
- YAML `tool` 字段映射。
- 当前 `mock-agent-adapter.ts` 的文本生成、信息审计逻辑。

### 5.4 P2-C Information Theory Modeling

需要消费：

- `ChapterInformationState`、`InformationAtom`、`InformationLink` 类型。
- `info.theory.calculated` 事件扩展。
- YAML 中 `info-theory-audit` 步骤定义。

### 5.5 P2-D 核心按钮绑定

需要消费：

- `p2-baseline-matrix.md` 中 8 个 P2-D 重点按钮候选。
- YAML Workflow Engine 执行接口。
- `NovelWorkflowEvent` 写回链路（采纳/忽略/保存草稿）。
- FeatureGate 默认关闭策略。

### 5.6 P2-E Adapter Router + Stub

需要消费：

- `AgentExecutionAdapter` / `AdapterContext` / `AdapterRouter` 接口。
- `openCodeAdapterEnabled` / `claudeCodeAdapterEnabled` gate。
- YAML `adapter` 字段。

---

## 6. 风险分级

### 6.1 阻塞项

| 风险 | 说明 | 缓解措施 |
|------|------|---------|
| 目录结构假设错误 | 若 P2-A 仍按原方案假设 `stores/` 等目录开发，会导致文件创建位置混乱 | P2-0 已确认真实目录结构，后续阶段严格按本报告目录补全 |
| 接口契约未锁定 | P2-A/B/C/E 并行开发时接口理解不一致 | P2-0 已输出 `p2-interface-contract.md`，后续修改需经主控评审 |
| 真实 LLM / 支付 / 云同步误接入 | 违反 P2 边界 | FeatureGate 默认关闭，未开启时 UI 不伪成功 |

### 6.2 非阻塞项

| 风险 | 说明 | 缓解措施 |
|------|------|---------|
| P2-D 按钮范围膨胀 | 若扩展到 18 个 P0 按钮，P2 变成 UI 补洞 | 聚焦 8 个 YAML 直接相关按钮，其余保持现有 handler |
| YAML Engine 替换导致 E2E 回归 | 新引擎未充分测试 | 渐进迁移，每阶段保持 `bun test src/novel` 与 E2E 不回归 |
| 112 Action 核对遗漏 | 全量核对成本高 | 脚本辅助扫描 + P0/P1 重点核查，其余默认 FeatureGate |

### 6.3 后续跟踪项

- 创建项目 wizard 分步骤实现（非 P2 主链路，可延后）。
- 25 道题引导结果写回（依赖 guide25 gate）。
- Bento 数据源确认（角色面板、世界设定部分字段）。
- `AiProgressDock` 当前 phase 文字显示（P1 可选项）。

---

## 7. 结论

P2-0 阶段已确认：

- 21 个 PRD 页面中 P0 主链路已覆盖，8 个未实现页面进入 FeatureGate。
- 18 个 P0 动作已实现，8 个动作进入 P2-D 绑定范围。
- 目录结构与原方案存在差异，P2 阶段按真实结构补全 `chat-debug/`、`plugins/`、`info-theory/`、`workflows/yaml/`、`workflows/engine/`。
- Mock Workflow 与 YAML Workflow 差距清晰，已制定渐进迁移路径。

P2-0 完成后，项目具备进入 P2-A0 / P2-A 的边界与接口基础。

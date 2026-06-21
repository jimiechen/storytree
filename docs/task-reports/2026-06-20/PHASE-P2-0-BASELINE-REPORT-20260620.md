# Phase P2-0：PRD + Action + FeatureGate + Interface 基线报告

> 我是：前端工程师 / Novel 模块开发 Agent (Kimi-K2.7-Code)
> 本次任务：Phase P2-0 基线
> 职责范围：`packages/app/src/novel/`、`docs/planning/`、`docs/task-reports/`
> 日期：2026-06-20

---

## 1. 本阶段目标

P2-0 是 Phase P2 的入口基线阶段，不开发功能，只锁定范围边界：

1. 确认 21 个 PRD 页面在当前代码中的覆盖状态。
2. 梳理 112 个 Action Contract，聚焦 P0 / P1 关键动作，其余标记 FeatureGate / FUTURE。
3. 定义 11 个默认关闭的 FeatureGate，确保未实现功能不伪装成功。
4. 输出 P2 后续阶段必须遵守的接口契约（NovelCommand、WorkflowEngine、Tool、Adapter、Event、YAML Schema）。
5. 明确 Mock Workflow → YAML Workflow 的渐进迁移路径。

---

## 2. 阅读材料

已阅读和核查：

- `caiode/docs/tabbit/06/tabbit_Phase P2-0.md`（主控答复与执行提示词）
- `caiode/docs/tabbit/06/phase-p1-action-contract.md`
- `stitch/AI小说创作助手_PRD文档_完整版.md`
- `docs/task-reports/2026-06-19/STITCH-MOCK-PHASE-ASSESSMENT-20260619.md`
- `docs/planning/P2-IMPLEMENTATION-PLAN-20260619.md`
- `docs/reviews/2026-06-19/P2-CONTROL-PROMPT-REVIEW-20260619.md`
- 当前代码目录：`packages/app/src/novel/`、`packages/app/src/novel/workflows/`、`packages/app/src/novel/adapters/`

---

## 3. 当前目录结构确认

`packages/app/src/novel/` 实际结构：

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
├── docs/phase-p2/              # P2-0 文档目录
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

### 与原方案假设的差异

| 原方案假设 | 当前实际 | 后续处理 |
|-----------|---------|---------|
| 存在 `stores/` | 不存在 | 不新建，继续使用 providers + hooks |
| 存在 `plugins/` | 不存在 | P2-B 新建 |
| 存在 `info-theory/` | 不存在 | P2-C 新建 |
| 存在 `chat-debug/` | 不存在 | P2-A0 新建 |
| `workflows/yaml/` 已建立 | 不存在 | P2-A 新建 `workflows/yaml/`、`workflows/engine/` |
| Adapter 多文件 | 仅 3 个文件 | P2-E 扩展为 mock / opencode-stub / claudecode-stub / router |

---

## 4. 输出文档

| 文档 | 路径 |
|------|------|
| 基线矩阵 | `caiode/opencode-1.4.0/packages/app/src/novel/docs/phase-p2/p2-baseline-matrix.md` |
| FeatureGate 计划 | `caiode/opencode-1.4.0/packages/app/src/novel/docs/phase-p2/p2-feature-gate-plan.md` |
| 缺口报告 | `caiode/opencode-1.4.0/packages/app/src/novel/docs/phase-p2/p2-gap-report.md` |
| 接口契约 | `caiode/opencode-1.4.0/packages/app/src/novel/docs/phase-p2/p2-interface-contract.md` |

---

## 5. PRD 页面覆盖结论

21 个 PRD 页面整体覆盖情况：

| 状态 | 数量 | 说明 |
|------|------|------|
| 已实现 | 6 | 书架、成就、个人中心统计、AI 模型设置、书架更新态、创建项目（合并弹窗） |
| 部分实现 | 7 | 创建项目 5 个步骤合并为弹窗、25 道题引导骨架、积分充值 UI |
| 未实现 | 8 | 首页、登录页、云同步、导入导出、名字生成器、AI 拆书、新手教程 |

- P0 主链路覆盖：12 / 21（书架、创建项目、工作台、编辑器、AI 模型设置、25 题入口）。
- 必须 FeatureGate：8 / 21（云同步、导入导出、名字生成器、AI 拆书、新手教程、积分充值、25 题深度流程）。
- 首页 / 登录页不进入 P2，沿用 OpenCode 入口与 auth。

---

## 6. Action Contract 覆盖结论

- P0 核心动作 18 个：全部已实现 handler，可真实写回状态。
- P2-D 重点按钮候选 8 个：
  - `04-A01` 开始生成
  - `05-T03` AI 续写
  - `05-FT01` 浮动续写
  - `05-IP01` 重新提取
  - `05-TP02` 取消任务
  - `05-RC02` 采纳
  - `05-RC04` 忽略
  - `05-RP02` 保存草稿
- P2 / FUTURE 动作：统一 FeatureGate / Not Implemented，不在 P2 主链路处理。
- 假按钮 / 空 handler 风险：未发现显式空 handler；充值、引导、导入导出等已通过 FeatureGate 控制，不会伪成功。

---

## 7. FeatureGate 计划结论

11 个默认关闭项已登记：

`realLLMEnabled`、`openCodeAdapterEnabled`、`claudeCodeAdapterEnabled`、`paymentEnabled`、`cloudSyncEnabled`、`exportEnabled`、`importEnabled`、`bookAnalysisEnabled`、`nameGeneratorEnabled`、`guide25Enabled`、`batchGenerationEnabled`。

- P2 阶段只允许 `guide25Enabled` 在开发/测试环境局部开启，其余保持关闭。
- 关闭时 UI 统一：禁用按钮 + tooltip“暂未开放”，独立页面显示占位页，禁止发起真实请求或显示伪成功。
- 测试策略：单元/组件/E2E 均断言关闭时按钮不可点击或不可见，真实 API 不被调用。

---

## 8. Interface Contract 结论

`p2-interface-contract.md` 已定义：

- `NovelCommand`（含当前字段到 P2 目标契约的映射）
- `WorkflowContext`
- `NovelWorkflowEngine` / `WorkflowStepResult`
- `WorkflowDefinition`
- `WorkflowStep`
- `NovelTool` / `ToolContext` / `ToolResult`
- `AgentExecutionAdapter` / `AdapterContext`
- `AdapterRouter`
- `NovelWorkflowEvent` 扩展（含 step 生命周期、info theory、adapter routed、cancel/retry）
- YAML Workflow Schema 草案
- Mock → YAML 迁移接口边界

后续阶段（P2-A ~ P2-E）必须以此为接口基准。

---

## 9. Mock → YAML 迁移策略

1. **P2-A 早期**：YAML Engine 包装 `runMockGeneration(command)`，YAML 只描述工作流名与输入，不改变现有调用方。
2. **P2-B**：将 YAML 步骤映射到 Tool（context-assemble、agent-run、build-workflow-events），Tool 内部复用现有逻辑。
3. **P2-C**：在 YAML 中插入 `info-theory-audit` 步骤，输出 `info.theory.calculated` 事件。
4. **P2-E**：YAML `adapter` 字段支持 `mock` / `opencode-stub` / `claudecode-stub`，由 `AdapterRouter` 根据 gate 路由。
5. **P2 结束**：`mock-generation-workflow.ts` 可被 YAML 完全替代，保留为回归测试参考。

---

## 10. 测试结果

P2-0 未修改运行时代码，仅新增文档。已执行验证：

| 命令 | 结果 |
|------|------|
| `cd packages/app && bun typecheck` | ✅ 通过（0 errors） |
| `cd packages/app && bun test src/novel` | ✅ 124 pass / 0 fail |

E2E 不作为 P2-0 硬性门槛，未执行。

---

## 11. 风险与未完成项

### 阻塞项

- 后续阶段必须严格按 P2-0 确认的真实目录结构补全 `chat-debug/`、`plugins/`、`info-theory/`、`workflows/yaml/`、`workflows/engine/`，避免基于错误假设开发。
- 接口契约变更需经主控评审，防止 P2-A/B/C/E 并行开发时接口理解不一致。
- 真实 LLM / 支付 / 云同步必须保持 FeatureGate 关闭，禁止在 P2 阶段误接入。

### 非阻塞项

- 创建项目 wizard 分步骤实现可延后。
- 25 道题引导结果写回依赖 `guide25Enabled` 开启后的完整实现。
- Bento 数据源、AiProgressDock 当前 phase 文字等可在后续阶段并行补齐。

### 后续跟踪项

- P2-A0 完成后需更新本报告，补充 Chat Debug Console 入口与 dry run 验证结果。
- P2-D 完成后需验证 8 个重点按钮与 YAML Workflow 的绑定。

---

## 12. 下一阶段建议

P2-0 基线已压实，建议进入：

**Phase P2-A0：Chat Debug Console**

允许并行准备 P2-A 的接口 schema 与 YAML 草案，但不得越过 P2-0 的接口契约与 FeatureGate 基线。

---

## 13. Exit Criteria 自评

| 检查项 | 目标 | 实际 | 状态 |
|--------|------|------|------|
| 4 个基线文档输出 | 100% | 4 / 4 | [x] 通过 |
| PRD 21 页面覆盖矩阵 | 完整 | 已覆盖 | [x] 通过 |
| P0 / P1 关键动作核查 | 完整 | 已核查 | [x] 通过 |
| FeatureGate 清单 | 11 项默认关闭 | 已登记 | [x] 通过 |
| 接口契约 | 核心接口定义 | 已定义 | [x] 通过 |
| Mock→YAML 迁移策略 | 明确 | 已明确 | [x] 通过 |
| 类型检查 | 0 errors | 0 errors | [x] 通过 |
| Novel 单元测试 | 100% pass | 124 / 124 | [x] 通过 |

---

## 14. 阶段完成标记

```text
[READY_FOR_P2A0]
```

---

*本报告由 Kimi-K2.7-Code 生成，提交主控评审。*

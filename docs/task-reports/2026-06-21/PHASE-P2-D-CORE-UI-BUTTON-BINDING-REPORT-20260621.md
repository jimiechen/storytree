# Phase P2-D：Core UI Button Binding 开发报告

**Agent 角色**：前端工程师 / Novel 模块开发 Agent (Kimi-K2.7-Code)  
**任务来源**：`caiode/docs/tabbit/06/Phase P2-D.md`  
**执行时间**：2026-06-21  
**报告路径**：`docs/task-reports/2026-06-21/PHASE-P2-D-CORE-UI-BUTTON-BINDING-REPORT-20260621.md`

---

## 1. 本阶段目标

将 Novel 编辑器的核心 AI 操作按钮统一接入 P2-A YAML Workflow Engine，建立 `UI → NovelActionDispatcher → NovelCommand → YAML Engine → Tool Registry → Result → UI` 的确定性执行链路。具体目标：

- 建立轻量 `NovelActionDispatcher`，把 UI 动作转换为 `NovelCommand`。
- 将 `开始生成`、`AI 续写`、`浮动续写`、`重新提取信息` 接入 YAML Engine。
- `info.extract` 必须走 P2-C `info-theory-audit` Tool。
- 保留 CRUD 类按钮的 provider 写回逻辑，不强制 YAML 化。
- 将 Chat Debug Runner 切换到 YAML Engine（至少 `info.extract` 不再返回 `NOT_IMPLEMENTED`）。
- 补充中文注释说明设计决策与阶段边界。
- 新增/更新单元测试，保证 `bun typecheck`、`bun test src/novel` 全绿。
- 完成 Git 提交后输出 `[READY_FOR_P2E]`。

---

## 2. 阅读材料

- `caiode/docs/tabbit/06/Phase P2-D.md`
- `packages/app/src/novel/docs/phase-p2/p2-baseline-matrix.md`
- `packages/app/src/novel/docs/phase-p2/p2-feature-gate-plan.md`
- `packages/app/src/novel/docs/phase-p2/p2-gap-report.md`
- `packages/app/src/novel/docs/phase-p2/p2-interface-contract.md`
- `packages/app/src/novel/docs/phase-p2/p2-workspace-skill-command-contract.md`
- `docs/design/BLACKBOX-ACCEPTANCE-HOOK-DESIGN-20260621.md`
- `docs/task-reports/2026-06-20/PHASE-P2-A-WORKSPACE-AWARE-YAML-WORKFLOW-ENGINE-REPORT-20260620.md`
- `docs/task-reports/2026-06-21/PHASE-P2-B-PLUGIN-TOOL-REGISTRY-REPORT-20260621.md`
- `docs/task-reports/2026-06-21/PHASE-P2-C-INFO-THEORY-AUDIT-REPORT-20260621.md`
- 重点代码：
  - `packages/app/src/novel/actions/`
  - `packages/app/src/novel/hooks/use-novel-action-dispatcher.ts`
  - `packages/app/src/novel/hooks/use-novel-workflow.ts`
  - `packages/app/src/novel/components/novel-editor/index.tsx`
  - `packages/app/src/novel/components/novel-workspace/generation/workspace-actions.tsx`
  - `packages/app/src/novel/chat-debug/novel-debug-command-runner.ts`
  - `packages/app/src/novel/workflows/engine/workflow-engine.ts`
  - `packages/app/src/novel/plugins/builtin-novel-tools.ts`

---

## 3. 新增 / 修改文件

### 新增 Action Dispatcher 层

- `packages/app/src/novel/actions/index.ts` — 模块聚合导出。
- `packages/app/src/novel/actions/novel-action-types.ts` — `NovelActionType`、`NovelActionInput`、`NovelActionResult` 类型。
- `packages/app/src/novel/actions/novel-action-result.ts` — 结果构造与错误码封装。
- `packages/app/src/novel/actions/novel-action-dispatcher.ts` — 核心 Dispatcher，将 `NovelActionInput` 映射为 `NovelCommand` 并驱动 YAML Engine。
- `packages/app/src/novel/actions/novel-action-dispatcher.test.ts` — Dispatcher 单元测试。

### 新增 Hook

- `packages/app/src/novel/hooks/use-novel-action-dispatcher.ts` — 可注入 Engine 的 UI Hook。
- `packages/app/src/novel/hooks/use-novel-action-dispatcher.test.ts` — Hook 单元测试。

### 修改 UI / Workflow 集成

- `packages/app/src/novel/hooks/use-novel-workflow.ts` — 新增 `mapInfoTheoryToInfoFlow`，将 P2-C info-theory 结果映射为 P1-A Info-Lite 类型；`runInfoExtract` 返回映射后的状态。
- `packages/app/src/novel/components/novel-editor/index.tsx` — `handleAIContinue`、`handleFloatingAICommand`、`runInfoExtractForChapter` 接入 YAML Workflow；绑定“重新提取信息”按钮。
- `packages/app/src/novel/components/novel-workspace/generation/workspace-actions.tsx` — `submitChapterGenerationTask` 使用 `useNovelWorkflow` 触发 `chapter.generate`。
- `packages/app/src/novel/hooks/use-chapter-editor.ts` — 返回 `setAiToolbarVisible`，供 editor 在 AI 命令执行后收起浮动工具栏。
- `packages/app/src/novel/workflows/novel-command.ts` — 补充/修正 `NovelCommand` 类型字段。

### Chat Debug Runner 切换

- `packages/app/src/novel/chat-debug/novel-debug-command-runner.ts` — `chapter.generate`、`chapter.continue`、`info.extract` 改为通过 YAML Engine 执行，不再返回 `NOT_IMPLEMENTED`。

### 依赖

- `packages/app/package.json` — 新增 `yaml: 2.9.0`（P2-A 已使用，本次随 P2 代码一起提交）。

---

## 4. 中文注释补充说明

本次在以下核心文件补充了中文注释：

- `novel-action-types.ts`
  - 说明 `workspaceId` / `branchId` / `worktreeId` / `modelProfileId` / `skillId` / `workflowId` 在 P2 阶段只透传，不执行真实 Git Worktree / 真实模型路由 / 真实 Skill 加载。
  - 说明 P2-D 只把 AI 类动作接入 YAML，CRUD 动作仍保留 provider 写回。
- `novel-action-dispatcher.ts`
  - 说明 Dispatcher 隔离 UI 与 Workflow Engine 的原因。
  - 说明哪些 action 进入 YAML Engine，哪些保持 provider 或返回结构化 `NOT_SUPPORTED_ACTION`。
  - 对 `NOT_CONNECTED_TO_ENGINE_CANCEL`、`TOOL_NOT_FOUND`、`WORKFLOW_EXECUTION_FAILED` 等错误添加中文说明，避免 UI 层伪成功。
- `use-novel-workflow.ts`
  - 说明 `mapInfoTheoryToInfoFlow` 的存在原因：P2-C 信息论类型需转换为 P1-A Info-Lite 以兼容现有信息面板。
  - 说明 `chapter.generate` / `chapter.continue` 当前先返回事件与结果，写回由调用方决定。
- `novel-editor/index.tsx`
  - 说明“重新提取信息”按钮的新链路：按钮 → Dispatcher → `info.extract` workflow → `info-theory-audit` Tool → 映射为 Info-Lite → 局部状态 + mutation 写回。
  - 说明不直接调用 Tool、不直接修改 mock-data。
- `novel-debug-command-runner.ts`
  - 说明 Chat Debug Runner 切换到 YAML Engine 的原因：保证 Chat Debug 与 UI 使用同一执行路径，避免 `info.extract` 返回旧 `NOT_IMPLEMENTED`。

仍有少量简单工具函数未加注释，后续可继续补充。

---

## 5. Action Dispatcher 架构说明

```
UI Button
  ↓ 触发 handler，构造 NovelActionInput
NovelActionDispatcher.dispatch(input)
  ↓ 按 actionType 构造 NovelCommand
NovelCommand (type, projectId, chapterId, payload, workspace/branch/model/skill/workflow ids)
  ↓ normalizeNovelCommand 补全默认值
YAML Workflow Engine
  ↓ 根据 commandType / workflowId 加载 YAML
Tool Registry
  ↓ 调用 Tool（如 info-theory-audit、mock-generation-wrapper、context-assemble 等）
ToolResult
  ↓ 封装为 WorkflowStepResult / WorkflowResult
NovelActionResult
  ↓ UI 层消费（展示、写回、日志）
```

关键点：

- Dispatcher 不直接调用 Tool，不直接调用 LLM，不写文件，不执行 git worktree。
- Dispatcher 对 Engine 抛错做 try/catch，返回结构化错误，避免异常穿透到 UI 层。
- `workspaceId` / `branchId` / `worktreeId` / `modelProfileId` / `skillId` / `workflowId` 原样透传到 `NovelCommand` 的 payload，P2 阶段不解析执行。

---

## 6. 已绑定按钮清单

| Action ID | 按钮 | 原逻辑 | 新逻辑 | 是否真实写回 | 是否 YAML Engine | 风险 |
|---|---|---|---|---|---|---|
| `04-A01` | 开始生成 | Mock Workflow | `useNovelWorkflow.runGeneration` → `chapter.generate` YAML | 是（通过 `applyWorkflowEvents` / mutation） | 是 | 低；仍使用 mock-generation-wrapper |
| `05-T03` | AI 续写 | Mock Workflow | `useNovelWorkflow.runContinue` → `chapter.continue` YAML | 是（通过 `applyWorkflowEvents` / mutation） | 是 | 低 |
| `05-FT01` | 浮动续写 | Mock Workflow | 复用 `handleAIContinue` → `chapter.continue` YAML | 是 | 是 | 低 |
| `05-IP01` | 重新提取 | Mock / 信息提取 | `runInfoExtractForChapter` → `info.extract` YAML → `info-theory-audit` | 是（局部状态 + `updateChapterInfoState` mutation） | 是 | 中；需持续验证 Info-Lite 映射完整性 |
| `05-TP02` | 取消任务 | 任务生命周期 | Dispatcher 层返回 `NOT_CONNECTED_TO_ENGINE_CANCEL` | 否 | 否 | 低；Engine 暂不支持真正 cancellation |
| `05-RC02` | 采纳 | 结果应用 | 保持现有 provider 写回 | 是 | 否 | 低 |
| `05-RC04` | 忽略 | 结果丢弃 | 保持现有日志 / 丢弃逻辑 | 否 | 否 | 低 |
| `05-RP02` | 保存草稿 | provider 写回 | 保持现有 provider | 是 | 否 | 低 |

---

## 7. 未绑定按钮与 FeatureGate 说明

以下按钮/能力本阶段不处理，保持原逻辑或继续关闭：

- AI 生成大纲、生成细纲：保持现有 Mock Workflow，P2-D 不强制 YAML 化。
- 支付 / 充值：FeatureGate `paymentEnabled` 关闭。
- 云同步：FeatureGate `cloudSyncEnabled` 关闭。
- 导入 / 导出：FeatureGate `exportEnabled` / `importEnabled` 关闭。
- 发布章节、历史版本、批量生成：暂未开放或保持原逻辑。
- 真实 Git Worktree 操作：FeatureGate `gitWorktreeEnabled` 关闭；Dispatcher 仅透传字段不执行。
- 项目级 / 用户自定义 Skill：FeatureGate `customSkillEnabled` 关闭。
- 真实 OpenCode / ClaudeCode Adapter：FeatureGate `openCodeAdapterEnabled` / `claudeCodeAdapterEnabled` 关闭。
- 真实多模型路由：`modelProfileId` 仅透传。

---

## 8. Workflow / Event 写回说明

- `chapter.generate`：通过 `useNovelWorkflow` 执行后返回 `events` / `result`，调用方使用 `applyWorkflowEvents` 与 mutations 将内容、摘要、字数、信息状态写回章节 Store。真实写回。
- `chapter.continue`：同 `chapter.generate`，真实写回。
- `info.extract`：返回 `state` / `score` / `events`，经 `mapInfoTheoryToInfoFlow` 映射为 Info-Lite 后，先设置局部状态展示，再通过 `updateChapterInfoState` mutation 持久化到章节 Store。真实写回。
- `result.accept` / `result.discard`：保持现有 provider / UI 逻辑，不改为 Workflow Event。
- `draft.save` / `chapter.mark-complete`：继续走 provider，不强制 YAML 化。
- `task.cancel`：当前 Engine 不支持真正 cancellation，Dispatcher 返回结构化 `NOT_CONNECTED_TO_ENGINE_CANCEL`，不伪装成功。

---

## 9. Chat Debug 兼容说明

已采用方案 A：切换 Chat Debug Runner
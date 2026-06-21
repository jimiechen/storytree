> 我是：前端工程师 / Novel 模块开发 Agent（Kimi-K2.7-Code），本次任务：Phase P2-E（Adapter Router + Stub + Commit Governance），职责范围：`packages/app/src/novel/`、`packages/app/scripts/`、`scripts/trae-hooks/`、`.trae/hooks.json`、`docs/task-reports/`、`workspaces/kimik27code/`；禁止触碰：`packages/opencode/`、`packages/sdk/`、`packages/plugin/`、`packages/desktop/`、`packages/ui/`、根目录 package.json / turbo.json / tsconfig。
> 越界操作申请：无。

# Phase P2-E：Adapter Router + Stub + Commit Governance 开发报告

## 1. 本阶段目标

补齐 Phase P2 最后一个基础设施阶段：

1. 建立提交治理：TRAE Hook 配置 + `novel:precommit` 自动化审查脚本。
2. 建立 AdapterRouter，将“调用哪个执行器”从 Workflow Engine / Tool 中解耦。
3. 提供 Mock / OpenCode Stub / ClaudeCode Stub 三类执行器，全部不调用真实外部服务。
4. 将 `agent-run` Tool 接入 Tool Registry，验证 Router 可被 Workflow 消费。
5. 保持真实 LLM、真实 OpenCode、真实 ClaudeCode、真实 Git Worktree 全部关闭。
6. 输出 Phase P2 候选验收状态 `[READY_FOR_PHASE_P2_REVIEW]`。

## 2. 阅读材料

本次执行已阅读：

- `caiode/docs/tabbit/06/Phase P2-E.md`（本阶段任务来源与验收标准）
- `docs/task-reports/2026-06-21/PHASE-P2-D-CORE-UI-BUTTON-BINDING-REPORT-20260621.md`
- `packages/app/src/novel/docs/phase-p2/p2-feature-gate-plan.md`
- `packages/app/src/novel/docs/phase-p2/p2-interface-contract.md`
- `packages/app/src/novel/docs/phase-p2/p2-workspace-skill-command-contract.md`
- `docs/design/BLACKBOX-ACCEPTANCE-HOOK-DESIGN-20260621.md`
- TRAE Hook 官方文档（配置参考）

## 3. 新增 / 修改文件

### 3.1 提交治理与 Hook

| 文件 | 类型 | 说明 |
|---|---|---|
| `.trae/hooks.json` | 新增 | 项目级 TRAE Hook 配置，覆盖 SessionStart / PreToolUse / PostToolUse / Stop |
| `scripts/trae-hooks/session-start-context.ts` | 新增 | 会话启动时注入 P2 阶段边界与开发规范 |
| `scripts/trae-hooks/pretool-guard.ts` | 新增 | RunCommand 前拦截 git worktree / merge / rebase 等高风险命令 |
| `scripts/trae-hooks/posttool-novel-review.ts` | 新增 | Write / Edit 后增量检查变更文件 |
| `scripts/trae-hooks/stop-acceptance.ts` | 新增 | 任务结束时执行验收检查 |
| `scripts/trae-hooks/shared/novel-rules.ts` | 新增 | P2 禁用 Gate、阻断命令模式、伪成功模式、500 行限制等共享规则 |
| `scripts/trae-hooks/shared/read-hook-input.ts` | 新增 | Hook 输入读取工具 |
| `scripts/trae-hooks/shared/hook-output.ts` | 新增 | Hook 输出格式化工具 |
| `caiode/opencode-1.4.0/packages/app/scripts/novel-precommit-check.ts` | 新增 | `novel:precommit` 脚本：类型检查、单元测试、行数、空 handler、中文注释、OpenCode Core 保护等 |
| `caiode/opencode-1.4.0/packages/app/src/novel/docs/phase-p2/p2-comment-standard.md` | 新增 | 中文注释规范 |
| `caiode/opencode-1.4.0/packages/app/src/novel/docs/phase-p2/p2-commit-review-checklist.md` | 新增 | 提交前人工审查清单 |
| `caiode/opencode-1.4.0/packages/app/package.json` | 修改 | 新增 `novel:precommit` script |

### 3.2 Adapter 架构

| 文件 | 类型 | 说明 |
|---|---|---|
| `caiode/opencode-1.4.0/packages/app/src/novel/adapters/adapter-types.ts` | 新增 | `AgentExecutionAdapter`、`AdapterRouter`、`AdapterContext`、`AdapterFeatureGates` 等核心类型 |
| `caiode/opencode-1.4.0/packages/app/src/novel/adapters/adapter-router.ts` | 新增 | `createAdapterRouter`：默认 mock，显式 disabled adapter 返回 `ADAPTER_DISABLED` |
| `caiode/opencode-1.4.0/packages/app/src/novel/adapters/mock-execution-adapter.ts` | 新增 | 包装现有 `MockAgentAdapter`，保持 `chapter.generate` / `chapter.continue` 不回归 |
| `caiode/opencode-1.4.0/packages/app/src/novel/adapters/opencode-execution-adapter.ts` | 新增 | OpenCode Stub，不调用真实 Server |
| `caiode/opencode-1.4.0/packages/app/src/novel/adapters/claudecode-execution-adapter.ts` | 新增 | ClaudeCode Stub，不调用真实 CLI |
| `caiode/opencode-1.4.0/packages/app/src/novel/adapters/index.ts` | 新增 | Adapter 模块统一导出 |
| `caiode/opencode-1.4.0/packages/app/src/novel/adapters/adapter-router.test.ts` | 新增 | Router 路由策略测试 |

### 3.3 Tool / Workflow 集成

| 文件 | 类型 | 说明 |
|---|---|---|
| `caiode/opencode-1.4.0/packages/app/src/novel/plugins/core-writing-tools/agent-run.tool.ts` | 新增 | `agent-run` Tool，内部通过 AdapterRouter 选择 adapter |
| `caiode/opencode-1.4.0/packages/app/src/novel/plugins/core-writing-tools/agent-run.tool.test.ts` | 新增 | Tool 集成测试 |
| `caiode/opencode-1.4.0/packages/app/src/novel/plugins/builtin-novel-tools.ts` | 修改 | 注册 `agent-run` Tool |
| `caiode/opencode-1.4.0/packages/app/src/novel/workflows/novel-command.ts` | 修改 | 兼容 workspace / branch / model 字段透传 |

### 3.4 FeatureGate 与 Chat Debug

| 文件 | 类型 | 说明 |
|---|---|---|
| `caiode/opencode-1.4.0/packages/app/src/novel/feature-gates.ts` | 新增 | NovelFeatureGates 完整定义与默认值 |
| `caiode/opencode-1.4.0/packages/app/src/novel/hooks/use-feature-gates.ts` | 新增 | FeatureGate Hook |
| `caiode/opencode-1.4.0/packages/app/src/novel/chat-debug/novel-debug-command-parser.ts` | 修改 | 支持解析 `adapter=mock/opencode-stub/claudecode-stub` |
| `caiode/opencode-1.4.0/packages/app/src/novel/chat-debug/novel-debug-command-runner.ts` | 修改 | 对 disabled adapter 返回 `ADAPTER_DISABLED` |
| `caiode/opencode-1.4.0/packages/app/src/novel/chat-debug/novel-debug-command-parser.test.ts` | 修改 | 新增 adapter 参数解析测试 |
| `caiode/opencode-1.4.0/packages/app/src/novel/chat-debug/novel-debug-command-runner.test.ts` | 修改 | 新增 disabled adapter 行为测试 |

## 4. Hook / Precommit 治理说明

### 4.1 `.trae/hooks.json` 配置

- `SessionStart`：注入 P2 阶段边界、FeatureGate 状态、开发规范。
- `PreToolUse`（仅 `RunCommand`）：拦截 `git worktree add/remove`、`git merge/rebase`、`git push --force` 等高风险命令。
- `PostToolUse`（`Write|Edit`）：对变更文件做增量审查（空 handler、中文注释、OpenCode Core 保护、伪成功检测）。
- `Stop`（loop_limit=3）：任务结束时执行 `novel:precommit` 等验收检查。

### 4.2 `novel:precommit` 检查项

| 检查项 | 级别 | 说明 |
|---|---|---|
| `bun typecheck` | block | 类型错误禁止提交 |
| `bun test src/novel` | block | Novel 模块测试不通过禁止提交 |
| 单文件代码行数 > 500 | block | 全量扫描 `src/novel/` |
| 空 handler / `TODO: implement` | block | 仅检查本次变更文件 |
| 真实外部 endpoint / API KEY 硬编码 | block | 仅检查本次变更文件 |
| 修改 OpenCode Core | block | 仅检查本次变更文件 |
| 新增复杂逻辑缺少中文注释 | block | 文件名含 router/adapter/feature-gate 等关键词 |
| ViewModel 多相关 `createSignal` | warning | 新增 ViewModel 应 fail，既有 `workspace-view-model.ts` 可 warning |
| BLACKBOX createStore 规则 | warning | 本次未重构 `workspace-view-model.ts`，已在质量项记录 |

### 4.3 本次执行验证

```text
cd packages/app
bun run novel:precommit
# ✅ Precommit PASSED
# bun typecheck: 0 errors
# bun test src/novel: 260 pass / 0 fail
```

## 5. Adapter 架构说明

### 5.1 核心接口

- `AgentExecutionAdapter`：每个执行器声明 `name`、`canHandle`、`execute`。
- `AdapterContext`：携带 `workspaceId`、`projectId`、`chapterId`、`branchId`、`worktreeId`、`modelProfileId`、`modelRole` 等 P2-0B 字段，仅透传不执行真实操作。
- `AdapterExecutionResult`：成功返回 `NovelAgentResult`，失败返回结构化错误码。
- `AdapterRouterErrorCode`：`ADAPTER_DISABLED` / `ADAPTER_NOT_FOUND` / `ADAPTER_EXECUTION_FAILED`。

### 5.2 路由策略

- 未指定 `adapter` → 默认返回 `mock`。
- 显式请求 `mock` → 直接返回 `MockExecutionAdapter`。
- 显式请求 `opencode-stub` / `claudecode-stub`：
  - 对应 Gate 关闭 → 返回 `ADAPTER_DISABLED`。
  - 对应 Gate 开启 → 返回对应 Stub。
- 未注册 adapter → 返回 `ADAPTER_NOT_FOUND`。
- **disabled adapter 不 fallback 到 mock**，避免伪成功。

### 5.3 Stub 实现

- `MockExecutionAdapter`：包装现有 `MockAgentAdapter`，保持 P1 / P2-D 链路不回归。
- `OpenCodeExecutionAdapter`：返回占位 `NovelAgentResult`，明确标注未调用真实 OpenCode Server。
- `ClaudeCodeExecutionAdapter`：返回占位结果，明确标注未调用真实 ClaudeCode CLI。

## 6. FeatureGate 与 Adapter 路由策略

- `realLLMEnabled: false`
- `openCodeAdapterEnabled: false`
- `claudeCodeAdapterEnabled: false`
- `gitWorktreeEnabled: false`
- `customSkillEnabled: false`
- `projectCommandEnabled: false`

显式请求被关闭的 adapter 时，`AdapterRouter` 返回结构化 `ADAPTER_DISABLED`，Tool 层原样返回给调用方，UI / Chat Debug 不会误以为真实服务已可用。

## 7. Tool / Workflow 集成说明

- 新增 `agent-run` Tool，注册到 `createBuiltinNovelToolRegistry`。
- `agent-run.tool.ts` 内部创建 `AdapterRouter`，注册三类 adapter，根据输入 `adapter` 与 `gates` 路由执行。
- 保留 `mock-generation-wrapper.tool.ts`，`chapter.generate.yaml` / `chapter.continue.yaml` 继续走既有链路，P2-D 按钮链路不回归。
- YAML Workflow 尚未强制切换到 `agent-run`；P2-E 仅证明 Router 可被 Tool Registry 消费。

## 8. Chat Debug 兼容说明

- Chat Debug 命令解析器支持 `adapter=mock`、`adapter=opencode-stub`、`adapter=claudecode-stub`。
- 当对应 Gate 关闭时，Runner 调用 `agent-run` Tool 并返回 `ADAPTER_DISABLED`。
- 现有 `/novel run chapter.generate`、`chapter.continue`、`info.extract` 链路保持不变，不受影响。

## 9. 中文注释补充说明

以下新增复杂逻辑文件已补充中文注释，说明设计决策、阶段边界与禁用原因：

- `adapter-types.ts`
- `adapter-router.ts`
- `mock-execution-adapter.ts`
- `opencode-execution-adapter.ts`
- `claudecode-execution-adapter.ts`
- `agent-run.tool.ts`
- `feature-gates.ts`
- `novel-precommit-check.ts`
- `novel-rules.ts`

注释重点解释：为什么 P2 不接真实服务、为什么 disabled 不 fallback、为什么 Router 要解耦。

## 10. 测试结果

| 命令 | 结果 |
|---|---|
| `bun run novel:precommit` | ✅ PASSED |
| `bun typecheck` | ✅ 0 errors |
| `bun test src/novel/adapters` | ✅ 20 pass / 0 fail |
| `bun test src/novel/plugins` | ✅ 31 pass / 0 fail |
| `bun test src/novel/workflows/engine` | ✅ 32 pass / 0 fail |
| `bun test src/novel/actions` | ✅ 7 pass / 0 fail |
| `bun test src/novel` | ✅ 260 pass / 0 fail |
| Playwright E2E | ⚠️ 环境未配置，未执行（P2-E 不阻塞） |

## 11. Git 提交结果

- Git 提交哈希：`<待提交后回填>`
- Git 提交信息：`feat(novel): P2-E adapter router stubs and commit governance hooks`
- 提交包含范围：`.trae/hooks.json`、`scripts/trae-hooks/`、`packages/app/scripts/novel-precommit-check.ts`、`packages/app/src/novel/adapters/`、`packages/app/src/novel/plugins/core-writing-tools/agent-run.tool.ts`、相关测试与文档、`docs/task-reports/`、`workspaces/kimik27code/`。
- 未提交文件：
  - `caiode/opencode-1.4.0/docs/reports/stitch-comparison/screenshots/*.png`（二进制截图，非 P2 代码）
  - `caiode/docs/tabbit/06/*.md`（Tabbit 输入提示词文档，不进入代码库）

## 12. 风险与未完成项

| 类别 | 项 | 说明 |
|---|---|---|
| 非阻塞 | Playwright E2E | 环境未就绪，已在 UT / precommit 覆盖主要链路 |
| 非阻塞 | `workspace-view-model.ts` 多 createSignal | 属历史遗留，precommit 中设为 warning，未在本次重构 |
| 后续跟踪 | 真实 OpenCode / ClaudeCode 接入 | P3 阶段在独立 Gate 下实现，不在 P2 范围 |
| 后续跟踪 | YAML 切到 `agent-run` | P2-F 或 P3 根据产品决策再迁移 |

## 13. Phase P2 总体验收建议

Phase P2 全部子阶段（P2-0 / P2-A0 / P2-0B / P2-A / P2-B / P2-C / P2-D / P2-E）目标已达成：

- ✅ 基础契约与 FeatureGate
- ✅ Workspace-aware YAML Workflow Engine
- ✅ Plugin Tool Registry
- ✅ Info-Theory Audit Tool
- ✅ 核心 UI 按钮接入 Workflow
- ✅ Adapter Router + Stub + Commit Governance

所有 P2 阶段禁止项均未触发，全部 Novel 模块测试通过，提交治理已落地。

## 14. 阶段完成标记

[READY_FOR_PHASE_P2_REVIEW]

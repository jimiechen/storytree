# Phase P2-A：Workspace-aware YAML Workflow Engine 开发报告

> 我是：前端工程师 / Novel 模块开发 Agent (Kimi-K2.7-Code)
> 本次任务：Phase P2-A Workspace-aware YAML Workflow Engine
> 职责范围：`packages/app/src/novel/`
> 日期：2026-06-20

---

## 1. 本阶段目标

P2-A 在 P2-0 / P2-A0 / P2-0B 基线之上，建立最小可用的 Workspace-aware YAML Workflow Engine：

1. 定义 Workflow YAML schema 的 TypeScript 类型。
2. 实现 YAML Workflow loader。
3. 实现 Workflow resolver，根据 `NovelCommand.type` / `workflowId` 找到对应 YAML。
4. 实现 Command Normalizer，兼容 P2-0B 扩展字段。
5. 实现最小 Workflow Engine，第一版先包装现有 `runMockGeneration`，不得另起炉灶。
6. 至少提供 `chapter.generate`、`chapter.continue`、`info.extract` 三个 YAML workflow。
7. 不破坏现有 P1 Mock Workflow 和 P2-A0 Chat Debug。

---

## 2. 阅读材料

已阅读和复用：

- `caiode/docs/tabbit/06/P2-A.md`（主控指令）
- `packages/app/src/novel/docs/phase-p2/p2-baseline-matrix.md`
- `packages/app/src/novel/docs/phase-p2/p2-feature-gate-plan.md`
- `packages/app/src/novel/docs/phase-p2/p2-gap-report.md`
- `packages/app/src/novel/docs/phase-p2/p2-interface-contract.md`
- `packages/app/src/novel/docs/phase-p2/p2-workspace-skill-command-contract.md`
- `packages/app/src/novel/workflows/novel-command.ts`
- `packages/app/src/novel/workflows/mock-generation-workflow.ts`
- `packages/app/src/novel/workflows/workflow-events.ts`
- `packages/app/src/novel/workflows/types.ts`
- `packages/app/src/novel/adapters/mock-agent-adapter.ts`
- `packages/app/src/novel/chat-debug/`

---

## 3. 新增 / 修改文件

### 3.1 新增 YAML Workflow 文件

```
packages/app/src/novel/workflows/yaml/
├── chapter.generate.yaml
├── chapter.continue.yaml
└── info.extract.yaml
```

### 3.2 新增 Engine 模块

```
packages/app/src/novel/workflows/engine/
├── index.ts
├── workflow-definition-types.ts
├── workflow-engine-errors.ts
├── workflow-command-normalizer.ts
├── workflow-loader.ts
├── workflow-resolver.ts
└── workflow-engine.ts
```

### 3.3 新增测试

```
packages/app/src/novel/workflows/engine/
├── workflow-command-normalizer.test.ts
├── workflow-loader.test.ts
├── workflow-resolver.test.ts
└── workflow-engine.test.ts
```

### 3.4 依赖变更

- 新增 `yaml@2.9.0` 到 `packages/app` 依赖，用于 YAML 解析。

---

## 4. YAML Workflow 清单

| Workflow ID | Command Type | Tool | 状态 |
|-------------|--------------|------|------|
| `chapter.generate` | `chapter.generate` | `mock-generation-wrapper` | 可执行 |
| `chapter.continue` | `chapter.continue` | `mock-generation-wrapper` | 可执行 |
| `info.extract` | `info.extract` | `not-implemented` | 加载后返回 `NOT_IMPLEMENTED` |

---

## 5. Command Normalizer 说明

`normalizeNovelCommand(command)` 把现有 `NovelCommand` 归一化为 `NormalizedNovelCommand`：

- 保留 `projectId`、`chapterId`。
- 默认 `branchId = main`。
- 默认 `modelProfileId = mock-default`。
- 根据 `type` 推导 `skillId`（writing / info-theory）。
- 根据 `type` 推导 `workflowId`（chapter.generate / chapter.continue / info.extract）。
- 把 `chapterIndex`、`genre`、`text`、`selectedText`、`targetWordCount`、`command`、`contextRefs` 放入 `payload`。
- 保留显式传入的 `workspaceId`、`branchId`、`worktreeId`、`modelProfileId`、`skillId`、`workflowId`。

---

## 6. Workflow Loader / Resolver / Engine 架构说明

```
NovelCommand
→ normalizeNovelCommand
→ NormalizedNovelCommand
→ resolveWorkflowId / resolveBuiltinWorkflowPath
→ loadWorkflowDefinition
→ WorkflowDefinition
→ createNovelWorkflowEngine.execute
→ per-step execution
→ runMockGeneration (for mock-generation-wrapper)
→ WorkflowStepResult[]
```

- **Loader**：使用 `yaml` 解析 YAML；校验 `id`、`version`、`commandType`、`steps` 必填字段。
- **Resolver**：`workflowId` 显式优先，否则按 `command.type` 映射；内置路径基于 `import.meta.dir`。
- **Engine**：
  - 归一化命令。
  - 加载 workflow。
  - 创建 `WorkflowExecutionContext`，透传 workspace / branch / model 字段。
  - 逐步 `yield` `workflow.step.started` / `workflow.step.completed` / `workflow.step.failed`。
  - `tool: mock-generation-wrapper` 调用现有 `runMockGeneration`。
  - `tool: not-implemented` 返回受控失败，不伪成功。
  - 未知 tool 返回受控失败。

---

## 7. Mock Workflow 包装策略

P2-A 的 Engine 是包装层，不是完整 Tool 执行器：

- `chapter.generate.yaml` 和 `chapter.continue.yaml` 的 step 使用 `tool: mock-generation-wrapper`。
- Engine 识别该 tool 后直接调用 `runMockGeneration(command, adapter)`。
- 这样不修改 `mock-generation-workflow.ts`，也不破坏 P1 主链路。
- P2-B 再把 `mock-generation-wrapper` 拆成真实 Tool Registry。

---

## 8. Workspace / Branch / Model 字段透传说明

`WorkflowExecutionContext` 包含：

- `workspaceId`
- `projectId`
- `chapterId`
- `branchId`
- `worktreeId`
- `modelProfileId`
- `skillId`

当前这些字段仅进入 context，不触发真实 workspace / branch / worktree / model 行为。P2-E AdapterRouter 将消费 `modelProfileId` / `modelRole`。

---

## 9. Chat Debug 兼容说明

P2-A0 的 Chat Debug Runner 保持现状，未切换到 YAML Engine，避免扩大范围。

Engine 已具备后续替换入口：把 `runNovelDebugCommand` 中 `runMockGeneration(...)` 调用替换为 `engine.execute(parseResult.command)` 即可。该切换计划到 P2-D 按钮绑定时统一评估。

---

## 10. 测试结果

| 命令 | 结果 |
|------|------|
| `bun typecheck` | ✅ 通过（0 errors） |
| `bun test src/novel/workflows/engine` | ✅ 28 pass / 0 fail |
| `bun test src/novel` | ✅ 173 pass / 0 fail |

新增测试覆盖：

- Normalizer：默认值、workflowId/skillId 推导、显式字段保留、payload 构建。
- Loader：三个 YAML 文件加载、文本加载、缺失字段报错。
- Resolver：显式 workflowId 优先、command type 映射、未知命令报错。
- Engine：workflow 加载、generate / continue 执行、info.extract 返回 NOT_IMPLEMENTED、branch/model 字段透传、非法命令受控报错。

---

## 11. 风险与未完成项

### 阻塞项

- 无。所有测试通过，未破坏现有链路。

### 非阻塞项

- Engine 当前只支持 `mock-generation-wrapper` 和 `not-implemented` tool，真实 Tool Registry 待 P2-B。
- AdapterRouter 待 P2-E。
- Info Theory Tool 待 P2-C。
- YAML 文件当前通过 `Bun.file` 加载，浏览器环境需后续封装（可改为 import 或 HTTP fetch）。
- Chat Debug Runner 尚未切到 Engine。

### 后续跟踪项

- P2-B：将 `mock-generation-wrapper` 拆为真实 Tool。
- P2-C：插入 Info Theory Tool。
- P2-D：按钮绑定，可一并评估 Chat Debug Runner 切换。
- P2-E：接入 AdapterRouter。

---

## 12. 下一阶段建议

建议进入 **Phase P2-B：Plugin Tool Registry**。

P2-B 的目标是把 Engine 中的硬编码 `mock-generation-wrapper` 替换为可注册的 Tool，使 `tool` 字段真正可扩展。

---

## 13. Exit Criteria 自评

| 检查项 | 目标 | 实际 | 状态 |
|--------|------|------|------|
| 新增 YAML Engine 目录 | 必须 | 已新增 | [x] 通过 |
| Workflow Definition 类型 | 必须 | 已定义 | [x] 通过 |
| YAML Loader | 必须 | 已实现 | [x] 通过 |
| Workflow Resolver | 必须 | 已实现 | [x] 通过 |
| Command Normalizer | 必须 | 已实现 | [x] 通过 |
| 最小 Workflow Engine | 必须 | 已实现 | [x] 通过 |
| 3 个内置 YAML workflow | 必须 | 已新增 | [x] 通过 |
| chapter.generate 可执行 | 必须 | 已验证 | [x] 通过 |
| chapter.continue 可执行 | 必须 | 已验证 | [x] 通过 |
| info.extract 不伪成功 | 必须 | 已验证 | [x] 通过 |
| 单元测试覆盖 | 必须 | 28 个新测试 | [x] 通过 |
| `bun typecheck` | 必须 | 0 errors | [x] 通过 |
| `bun test src/novel` | 必须 | 173 pass / 0 fail | [x] 通过 |
| 不接真实 LLM / Adapter | 必须 | 仅 MockAgentAdapter | [x] 通过 |
| 不修改 OpenCode Core | 必须 | 未修改 | [x] 通过 |
| 不破坏 P1 Mock Workflow | 必须 | 未修改原 workflow | [x] 通过 |
| 输出阶段报告 | 必须 | 已输出 | [x] 通过 |

---

## 14. 阶段完成标记

```text
[READY_FOR_P2B]
```

---

*本报告由 Kimi-K2.7-Code 生成，提交主控评审。*

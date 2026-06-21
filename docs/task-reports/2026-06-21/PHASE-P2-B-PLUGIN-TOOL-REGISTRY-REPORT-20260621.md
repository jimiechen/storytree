# Phase P2-B：Plugin Tool Registry 开发报告

**Agent 角色**：前端工程师 / Novel 模块开发 Agent (Kimi-K2.7-Code)  
**任务来源**：`caiode/docs/tabbit/06/Phase P2-B.md`  
**执行时间**：2026-06-21  
**报告路径**：`docs/task-reports/2026-06-21/PHASE-P2-B-PLUGIN-TOOL-REGISTRY-REPORT-20260621.md`

---

## 1. 本阶段目标

将 P2-A Workspace-aware YAML Workflow Engine 中硬编码的 `mock-generation-wrapper` 执行逻辑替换为可注册、可查询、可执行的 Novel Tool Registry，使 YAML 中 `tool` 字段真正具备扩展能力，同时保持 P2-A 与 P1 主链路不回归。

---

## 2. 阅读材料

- `caiode/docs/tabbit/06/Phase P2-B.md`
- `packages/app/src/novel/workflows/engine/workflow-engine.ts`
- `packages/app/src/novel/workflows/engine/workflow-definition-types.ts`
- `packages/app/src/novel/workflows/engine/workflow-command-normalizer.ts`
- `packages/app/src/novel/workflows/engine/workflow-loader.ts`
- `packages/app/src/novel/workflows/engine/workflow-resolver.ts`
- `packages/app/src/novel/workflows/mock-generation-workflow.ts`
- `packages/app/src/novel/adapters/mock-agent-adapter.ts`

---

## 3. 新增 / 修改文件

### 新增 Tool Registry 核心
- `packages/app/src/novel/plugins/index.ts`
- `packages/app/src/novel/plugins/novel-tool-types.ts` — `NovelTool` / `ToolContext` / `ToolResult` / `NovelToolRegistry`
- `packages/app/src/novel/plugins/novel-tool-plugin.ts` — `NovelToolPlugin` 与 `registerNovelToolPlugin`
- `packages/app/src/novel/plugins/novel-tool-registry.ts` — `createNovelToolRegistry`
- `packages/app/src/novel/plugins/builtin-novel-tools.ts` — 内置 plugin 与 registry 工厂

### 新增内置 Tools
- `packages/app/src/novel/plugins/core-writing-tools/mock-generation-wrapper.tool.ts`
- `packages/app/src/novel/plugins/core-writing-tools/context-assemble.tool.ts`
- `packages/app/src/novel/plugins/core-writing-tools/build-workflow-events.tool.ts`
- `packages/app/src/novel/plugins/core-info-theory-tools/info-extract-placeholder.tool.ts`

### 新增 / 修改测试
- `packages/app/src/novel/plugins/novel-tool-registry.test.ts`（新增）
- `packages/app/src/novel/plugins/builtin-novel-tools.test.ts`（新增）
- `packages/app/src/novel/workflows/engine/workflow-engine.test.ts`（修改：修复自定义 registry 与 continueOnError 测试）

### 修改引擎
- `packages/app/src/novel/workflows/engine/workflow-engine.ts`：接入 Tool Registry，并新增可选 `definition` 参数以支持测试注入自定义 workflow 定义。

---

## 4. Tool Registry 架构说明

```
NovelTool
  ├─ name / description
  ├─ inputSchema? / outputSchema?
  └─ execute(input, context): Promise<ToolResult>

NovelToolRegistry
  ├─ register(tool)
  ├─ has(name) / get(name) / list()
  └─ execute(name, input, context): Promise<ToolResult>

NovelToolPlugin
  ├─ id / name / version
  └─ tools: NovelTool[]
```

- 重复注册抛出 `NovelToolRegistryError`，错误码 `TOOL_ALREADY_REGISTERED`。
- 未注册 tool 执行返回 `success: false, errorCode: 'TOOL_NOT_FOUND'`。
- Tool 内部异常被捕获并转换为 `success: false, errorCode: 'TOOL_EXECUTION_FAILED'`。

---

## 5. 内置 Tool 清单

| Tool | 用途 | 关键返回 |
|---|---|---|
| `mock-generation-wrapper` | 包装 P1 `runMockGeneration` | `{ result, events, durationMs }` |
| `not-implemented` | `info.extract` 占位 | `success: false, errorCode: 'NOT_IMPLEMENTED'` |
| `context-assemble` | 组装最小上下文对象 | `{ projectId, chapterId, branchId, modelProfileId, commandType, input }` |
| `build-workflow-events` | 透传或归一化 events | `{ events }` |

---

## 6. Workflow Engine 集成说明

- `createNovelWorkflowEngine()` 默认构造 `createBuiltinNovelToolRegistry()`。
- 可通过 `options.registry` 注入自定义 registry。
- `execute()` 内部从 registry 调用 tool，不再硬编码判断 tool 名称。
- `ToolResult` 映射为 `WorkflowStepResult`：
  - `success: true` → `status: 'completed'`
  - `success: false` → `status: 'failed'`；若 `continueOnError` 为 false 则抛出 `WorkflowExecutionError`。
- 新增 `execute(command, definition?)` 重载，允许测试传入内存中的 workflow 定义，避免修改 YAML 文件即可验证自定义 tool。

---

## 7. YAML 兼容说明

- 保留 P2-A 的 `chapter.generate.yaml`、`chapter.continue.yaml`、`info.extract.yaml`。
- `tool` 字段值由 registry 解析，YAML 本身无需改动。
- 未将 chapter.generate 拆分为多步骤，避免扩大范围。

---

## 8. Workspace / Branch / Model 字段透传说明

- `ToolContext` 从 `WorkflowExecutionContext` 派生，包含 `workspaceId`、`branchId`、`worktreeId`、`modelProfileId`、`skillId`。
- `context-assemble` 测试中验证了 projectId / chapterId / branchId / modelProfileId 的透传。

---

## 9. Chat Debug 兼容说明

- 未修改 Chat Debug Runner，避免 P2-A0 回归。
- 建议 P2-D 统一切换 Chat Debug Runner 到 YAML Engine。

---

## 10. 测试结果

| 命令 | 结果 |
|---|---|
| `cd packages/app && bun typecheck` | ✅ 0 errors |
| `bun test src/novel/plugins` | ✅ 14 pass / 0 fail |
| `bun test src/novel/workflows/engine` | ✅ 35 pass / 0 fail |
| `bun test src/novel/workflows` | ✅ 49 pass / 0 fail |
| `bun test src/novel` | ✅ 190 pass / 0 fail |

---

## 11. 风险与未完成项

| 风险 / 未完成项 | 说明 | 计划阶段 |
|---|---|---|
| YAML 通过 `Bun.file` 加载 | 浏览器环境加载策略待评估 | P2-D |
| `agent-run` tool | 未实现，避免提前接入 AdapterRouter | P2-E |
| `info.extract` 仍为占位 | 真实信息论 tool 待 P2-C 实现 | P2-C |
| Chat Debug Runner 未切 YAML Engine | 建议 P2-D 统一处理 | P2-D |
| Git 工作区未提交 | 按系统级安全指令未自动提交 | 等待用户指令 |

---

## 12. 下一阶段建议

进入 **Phase P2-C：Info-Theory Audit Tool**，在 Tool Registry 基础上新增信息论审计 tool，替换 `not-implemented` 占位。

---

## 13. 阶段完成标记

```text
[PHASE_P2_B_ACCEPTED]
[APPROVED_FOR_P2C]
[READY_FOR_P2C]
```

---

*本次无扣分，当前积分维持 30/100。*

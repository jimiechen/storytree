# Phase P2-A0：Chat Debug Console 开发报告

> 我是：前端工程师 / Novel 模块开发 Agent (Kimi-K2.7-Code)
> 本次任务：Phase P2-A0 Chat Debug Console
> 职责范围：`packages/app/src/novel/`
> 日期：2026-06-20

---

## 1. 本阶段目标

P2-A0 在开发态建立一个 Chat-first 调试入口，使开发者可以通过命令触发 Novel 工作流 dry run，先验证 `NovelCommand`、Mock Workflow、Workflow Event、日志记录与任务状态，再进入 P2-A YAML Workflow Engine。

本阶段不接真实 LLM、不接真实 OpenCode Server、不接 ClaudeCode、不接数据库、不接支付、不接云同步、不侵入 OpenCode Core、不替换现有 Mock Workflow。

---

## 2. 阅读材料

已阅读并遵守以下 P2-0 产物与现有代码：

- `packages/app/src/novel/docs/phase-p2/p2-baseline-matrix.md`
- `packages/app/src/novel/docs/phase-p2/p2-feature-gate-plan.md`
- `packages/app/src/novel/docs/phase-p2/p2-gap-report.md`
- `packages/app/src/novel/docs/phase-p2/p2-interface-contract.md`
- `packages/app/src/novel/workflows/novel-command.ts`
- `packages/app/src/novel/workflows/mock-generation-workflow.ts`
- `packages/app/src/novel/workflows/workflow-events.ts`
- `packages/app/src/novel/workflows/types.ts`
- `packages/app/src/novel/adapters/mock-agent-adapter.ts`
- `packages/app/src/novel/adapters/novel-agent-adapter.ts`
- `packages/app/src/novel/types/ai-task.ts`
- `packages/app/src/novel/types/editor.ts`

---

## 3. 新增 / 修改文件

新增目录：`packages/app/src/novel/chat-debug/`

```
packages/app/src/novel/chat-debug/
├── index.ts
├── novel-debug-command-parser.ts
├── novel-debug-command-parser.test.ts
├── novel-debug-command-runner.ts
├── novel-debug-command-runner.test.ts
├── novel-debug-log-store.ts
├── novel-debug-log-store.test.ts
└── novel-debug-log-types.ts
```

未修改任何现有运行时代码。

---

## 4. 命令语法

已支持的命令：

| 命令 | 状态 |
|------|------|
| `/novel help` | 可执行，返回帮助文本 |
| `/novel run chapter.generate ...` | 可执行，走 Mock Workflow dry run |
| `/novel run chapter.continue ...` | 可执行，映射为 `chapter.rewrite` + `command: 'continue'` |
| `/novel run chapter.rewrite ...` | 可执行 |
| `/novel run chapter.expand ...` | 可执行 |
| `/novel run chapter.polish ...` | 可执行 |
| `/novel run chapter.summarize ...` | 可执行 |
| `/novel run info.extract ...` | 可解析，执行返回 `NOT_IMPLEMENTED` |

非法命令返回结构化错误，不抛出未捕获异常。

---

## 5. 架构说明

```
Chat Debug Command
→ novel-debug-command-parser.ts
→ NovelCommand（兼容现有 P1 命令结构）
→ novel-debug-command-runner.ts
→ runMockGeneration(command, MockAgentAdapter)
→ NovelAgentResult + NovelWorkflowEvent[]
→ novel-debug-log-store.ts
→ NovelDebugRunResult
```

- **Parser**：负责把 `/novel ...` 字符串解析为结构化命令。兼容现有 `NovelCommand` 字段，自动从 `chapterId` 推导 `chapterIndex`。
- **Runner**：执行解析后的命令。`chapter.generate` / `chapter.continue` 复用现有 `mock-generation-workflow.ts`；`info.extract` 显式返回 `NOT_IMPLEMENTED`；非法命令返回结构化错误。
- **Log Store**：内存型日志存储，记录命令文本、命令对象、状态生命周期、事件、结果与错误。

P2-A YAML Engine 完成后，Runner 内部只需要替换 `runMockGeneration(...)` 调用为 `NovelWorkflowEngine.execute(...)`，Parser 与 Log Store 可保持不变。

---

## 6. 测试结果

| 命令 | 结果 |
|------|------|
| `bun typecheck` | ✅ 通过（0 errors） |
| `bun test src/novel` | ✅ 145 pass / 0 fail（新增 21 个 chat-debug 测试） |

新增 chat-debug 测试覆盖：

- Parser：help、generate、continue、info.extract、缺少参数、未知命令、非法前缀、引号剥离
- Log Store：add/get、id 生成、update、未知 id、list 时序、clear
- Runner：help、非法命令、generate dry run、continue dry run、info.extract 返回 NOT_IMPLEMENTED、日志状态生命周期

---

## 7. 风险与未完成项

### 阻塞项

- 无。本阶段未修改现有代码，所有测试通过。

### 非阻塞项

- `info.extract` 目前返回 `NOT_IMPLEMENTED`，待 P2-B / P2-C 接入信息论审计 Tool 后再真正执行。
- Chat Debug Console 目前没有 UI 面板，仅以 TypeScript 模块 + 单元测试形式存在。后续如需要，可在开发态面板中轻量挂载。
- `dryRun=true` 参数仅被解析，未改变执行路径；P2-A0 默认走 Mock Adapter，本质已是 dry run。

### 后续跟踪项

- P2-A YAML Workflow Engine 完成后，将 Runner 执行入口从 `runMockGeneration` 替换为 `NovelWorkflowEngine.execute`。
- P2-B Tool Registry 完成后，`info.extract` 应真正调用信息提取 Tool。
- P2-D 核心按钮绑定时，Chat Debug 命令可作为调试入口复用。

---

## 8. 下一阶段建议

P2-A0 已完成，建议进入：

**Phase P2-A：YAML Workflow Engine**

同时允许 Chat Debug Runner 在 P2-A 完成后替换执行入口，但 P2-A 早期不应依赖 Chat Debug 实现。

---

## 9. Exit Criteria 自评

| 检查项 | 目标 | 实际 | 状态 |
|--------|------|------|------|
| 新增 `chat-debug/` 目录 | 必须 | 已新增 | [x] 通过 |
| Debug Command Parser | 实现 | 已实现 | [x] 通过 |
| Debug Log Store | 实现 | 已实现 | [x] 通过 |
| Debug Command Runner | 实现 | 已实现 | [x] 通过 |
| 支持 `/novel help` | 必须 | 已支持 | [x] 通过 |
| 支持 `chapter.generate` dry run | 必须 | 已支持 | [x] 通过 |
| `chapter.continue` / `info.extract` 处理 | 至少解析 | 已解析，generate/continue 可执行，info.extract 返回 NOT_IMPLEMENTED | [x] 通过 |
| 非法命令结构化错误 | 必须 | 已实现 | [x] 通过 |
| 单元测试覆盖 | 必须 | Parser / Store / Runner 均已覆盖 | [x] 通过 |
| `bun typecheck` | 必须 | 0 errors | [x] 通过 |
| `bun test src/novel` | 必须 | 145 pass / 0 fail | [x] 通过 |
| 不接真实 LLM / Adapter | 必须 | 仅使用 MockAgentAdapter | [x] 通过 |
| 不修改 OpenCode Core | 必须 | 未修改 | [x] 通过 |
| 不破坏 P1 Mock Workflow | 必须 | 未修改原 workflow | [x] 通过 |
| 输出阶段报告 | 必须 | 已输出 | [x] 通过 |

---

## 10. 阶段完成标记

```text
[READY_FOR_P2A]
```

---

*本报告由 Kimi-K2.7-Code 生成，提交主控评审。*

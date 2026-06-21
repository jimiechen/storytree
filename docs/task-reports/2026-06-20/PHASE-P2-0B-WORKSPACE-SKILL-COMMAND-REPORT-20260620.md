# Phase P2-0B：Workspace + Skills + Commands + Branch Contract 报告

> 我是：前端工程师 / Novel 模块开发 Agent (Kimi-K2.7-Code)
> 本次任务：Phase P2-0B 补丁契约
> 职责范围：`packages/app/src/novel/docs/phase-p2/`
> 日期：2026-06-20

---

## 1. 本阶段目标

P2-0 / P2-A0 之前覆盖了 Workflow、Tool、Adapter 的执行链路，但缺少“小说项目工作空间、Skills / Commands 存放与发现、OpenCode Chat 识别、多分支、多模型、Git Worktree”的上层工程规划。

P2-0B 的任务是把这一层契约补齐，使后续 P2-A0、P2-A、P2-B、P2-D、P2-E 能天然支持：

- 项目工作空间
- Skills / Commands
- OpenCode Chat 识别
- 多分支
- 多模型
- Git Worktree 预留

本阶段只做契约，不做真实实现。

---

## 2. 阅读材料

已阅读和复用：

- `caiode/docs/tabbit/06/P2-0B.md`（主控补充指令）
- `packages/app/src/novel/docs/phase-p2/p2-baseline-matrix.md`
- `packages/app/src/novel/docs/phase-p2/p2-feature-gate-plan.md`
- `packages/app/src/novel/docs/phase-p2/p2-gap-report.md`
- `packages/app/src/novel/docs/phase-p2/p2-interface-contract.md`
- `packages/app/src/novel/chat-debug/*`

---

## 3. 新增 / 修改文档

| 文档 | 动作 | 路径 |
|------|------|------|
| Workspace / Skills / Commands / Branch 契约 | 新建 | `packages/app/src/novel/docs/phase-p2/p2-workspace-skill-command-contract.md` |
| FeatureGate 计划 | 更新 | `packages/app/src/novel/docs/phase-p2/p2-feature-gate-plan.md` |
| 接口契约（NovelCommand 扩展） | 更新 | `packages/app/src/novel/docs/phase-p2/p2-interface-contract.md` |

未修改任何运行时代码。

---

## 4. 工作空间规划结论

小说编辑器采用两层工作空间：

### 4.1 应用内工作空间：Novel App Workspace

继续保留现有 `packages/app/src/novel/` 结构，负责 UI、状态、Mock 数据、工作流调试。

### 4.2 小说项目工作空间：Novel Project Workspace

每本小说未来拥有的项目级空间，逻辑结构如下：

```
<novel-workspace-root>/<project-slug>/
├── .novelforge/
│   ├── project.yaml
│   ├── workspace.yaml
│   ├── branches.yaml
│   ├── models.yaml
│   ├── skills.yaml
│   ├── commands.yaml
│   └── workflows/
├── manuscript/
├── bible/
├── info-flow/
├── drafts/
└── exports/
```

P2 阶段只定义 `.novelforge/` manifest 与 workflow 路径契约，不创建真实项目文件。

---

## 5. Skills / Commands 存放方案

### 5.1 层级定义

```text
Skill = 能力包
  ├── exposes Commands
  ├── binds Workflows
  ├── uses Tools
  └── routes to Adapters

Command = 用户或 Chat 可调用的入口
Workflow = 编排过程
Tool = Workflow 中的原子执行步骤
Adapter = 模型或外部 Agent 执行器
```

### 5.2 内置 Skills

建议位置：

```
packages/app/src/novel/skills/core/
├── writing.skill.ts
├── outline.skill.ts
├── info-extraction.skill.ts
└── info-theory.skill.ts
```

### 5.3 项目级 / 用户自定义 Skills

- 项目级 Skills 未来放在 `<project>/.novelforge/skills.yaml`。
- 用户自定义 Skills P3/P4 以后开放，P2 仅做 FeatureGate 预留。

### 5.4 内置 Commands

建议新增：

```
packages/app/src/novel/commands/
├── novel-command-types.ts
├── novel-command-registry.ts
├── builtin-novel-commands.ts
├── novel-command-discovery.ts
└── opencode-chat-command-provider.ts
```

### 5.5 项目级 Commands

未来放在 `<project>/.novelforge/commands.yaml`，P2 阶段通过 `projectCommandEnabled` gate 关闭。

---

## 6. OpenCode Chat 识别方案

### 6.1 分阶段策略

| 阶段 | 能力 |
|------|------|
| P2-A0 | Novel 内部 Chat Debug Parser |
| P2-A1 / P2-B | 增加 `NovelChatCommandProvider` 契约 |
| P2-D / P2-E | 若 OpenCode Chat 已有 command registry，则对接；否则保留 Novel 内部 provider |

### 6.2 核心契约

OpenCode Chat 只识别 Command Descriptor / Parser / Executor，不直接识别 YAML、Tool、Adapter。

已定义接口：

- `NovelChatCommandProvider`
- `NovelCommandDescriptor`
- `NovelChatCommandContext`

详见 `p2-workspace-skill-command-contract.md`。

---

## 7. 多分支 / Git Worktree 裁定

### 7.1 当前阶段裁定

必须设计，但禁止真实实现。

P2 阶段允许：

- 定义 `BranchProfile`。
- 定义 `WorktreeProfile`。
- 在 `NovelCommand` 中透传 `branchId` / `worktreeId`。
- 在 Chat Debug 命令中解析 `branchId` / `worktreeId`。
- 在 `AdapterContext` 中透传 `branchId` / `worktreeId`。

P2 阶段禁止：

- 执行 `git worktree add/remove`。
- 执行 `git merge/rebase`。
- 写真实项目文件。
- 处理真实冲突。

真实 Git Worktree 放到 P3。

### 7.2 BranchProfile / WorktreeProfile

已定义接口，详见 `p2-workspace-skill-command-contract.md`。P2 阶段 `WorktreeProfile.status` 只允许 `planned`。

---

## 8. 多模型路由裁定

已定义 `NovelModelProfile` 与扩展后的 `AdapterContext`：

- `modelProfileId`：模型配置 ID。
- `modelRole`：`draft` | `rewrite` | `audit` | `outline` | `summary` | `critic`。
- `routes`：角色到 `mock` / `opencode-stub` / `claudecode-stub` 的映射。

P2 阶段保持 mock/stub，接口预留真实多模型路由。

---

## 9. 对 P2-A0 的影响

P2-A0 的 Chat Debug Console 需要从“孤立调试解析器”升级为“未来 OpenCode Chat 命令体系的雏形”。

具体调整：

1. Parser 支持解析可选的 `branchId`、`modelProfileId`、`skillId`、`workflowId`。
2. Parser 将调试命令映射为扩展后的 `NovelCommand`。
3. Runner 将这些字段透传给 `WorkflowContext` / `AdapterContext`（即使当前不消费）。
4. 可增加 `/novel commands projectId=...` 调试命令，返回当前项目可用命令列表（可选）。

P2-A0 仍然不接真实 LLM / OpenCode / ClaudeCode，不执行真实 git worktree。

---

## 10. 测试结果

本阶段只新增 / 更新文档，未修改运行时代码。

| 命令 | 结果 |
|------|------|
| `bun typecheck` | ✅ 通过（0 errors） |
| `bun test src/novel` | ✅ 145 pass / 0 fail |

E2E 未作为本阶段硬门槛。

---

## 11. 风险与未完成项

### 阻塞项

- 无。本阶段未修改现有代码，测试全部通过。

### 非阻塞项

- `NovelChatCommandProvider`、`NovelSkillRegistry`、`NovelCommandRegistry` 等尚未编码，仅定义接口。
- `workspace/`、`commands/`、`skills/`、`branches/`、`model-routing/` 目录尚未创建，仅在文档中规划。
- Git Worktree 只做契约，P3 再真实实现。

### 后续跟踪项

- P2-A0 需按 P2-0B 契约扩展 Chat Debug Parser。
- P2-A YAML Engine 需消费 `workspaceId`、`branchId`、`modelProfileId` 等字段。
- P2-B Tool Registry 需与 Skill / Command 注册表对齐。
- P2-E AdapterRouter 需消费 `modelProfileId` / `modelRole`。

---

## 12. 阶段完成标记

```text
[READY_FOR_P2A0_WORKSPACE_AWARE]
```

---

## 13. 阶段状态建议

当前状态调整为：

```text
[PHASE_P2_0_ACCEPTED]
[NEED_P2_0B_BEFORE_P2A0]
```

P2-0B 完成后可进入：

```text
[APPROVED_FOR_WORKSPACE_AWARE_P2A0]
```

---

*本报告由 Kimi-K2.7-Code 生成，提交主控评审。*

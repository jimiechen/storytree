# Phase P2-0B：Workspace + Skills + Commands + Branch Contract

> 角色：前端工程师 / Novel 模块开发 Agent (Kimi-K2.7-Code)
> 本次任务：Phase P2-0B 补丁契约
> 来源：`P2-0B.md` 主控补充指令
> 日期：2026-06-20

---

## 1. 本阶段目标

P2-0 / P2-A0 之前主要覆盖了 Workflow、Tool、Adapter 的执行链路，但没有覆盖“小说项目工作空间、Skills / Commands 存放与发现、OpenCode Chat 识别、多分支、多模型、Git Worktree”的上层工程规划。

P2-0B 的任务是补齐这些契约：

1. 定义小说编辑器工作空间的分层结构。
2. 定义每本小说的 `.novelforge` manifest。
3. 定义 Skills、Commands 的存放规则与分层。
4. 定义 OpenCode Chat 如何通过 `NovelChatCommandProvider` 识别 NovelForge 命令。
5. 定义多分支小说创作的 `BranchProfile` 与 Git Worktree 的 `WorktreeProfile`。
6. 定义多模型路由的 `ModelProfile`。
7. 扩展 `NovelCommand`，兼容增加 `workspaceId`、`branchId`、`worktreeId`、`modelProfileId`、`skillId`、`workflowId`。
8. 明确当前阶段只做契约、不做真实实现，并更新 FeatureGate。

---

## 2. 阅读材料

已阅读和复用：

- `packages/app/src/novel/docs/phase-p2/p2-baseline-matrix.md`
- `packages/app/src/novel/docs/phase-p2/p2-feature-gate-plan.md`
- `packages/app/src/novel/docs/phase-p2/p2-gap-report.md`
- `packages/app/src/novel/docs/phase-p2/p2-interface-contract.md`
- `packages/app/src/novel/chat-debug/*`（P2-A0 草案实现）
- `packages/app/src/novel/workflows/novel-command.ts`
- `packages/app/src/novel/types/ai-task.ts`
- `packages/app/src/novel/adapters/novel-agent-adapter.ts`

---

## 3. 新增 / 修改文档

| 文档 | 动作 | 路径 |
|------|------|------|
| 工作空间 / Skills / Commands / Branch 契约 | 新建 | `packages/app/src/novel/docs/phase-p2/p2-workspace-skill-command-contract.md` |
| FeatureGate 计划 | 更新 | `packages/app/src/novel/docs/phase-p2/p2-feature-gate-plan.md` |
| 接口契约（NovelCommand 扩展） | 更新 | `packages/app/src/novel/docs/phase-p2/p2-interface-contract.md` |

---

## 4. 工作空间规划结论

小说编辑器采用两层工作空间：

### 4.1 应用内工作空间：Novel App Workspace

当前 SolidJS 小说编辑器内部的工作空间，负责 UI、状态、Mock 数据、工作流调试。

```
packages/app/src/novel/
├── components/
├── providers/
├── workflows/
├── adapters/
├── mock-data/
├── types/
├── chat-debug/
└── docs/phase-p2/
```

这层在 P2 阶段继续保留，不做大规模重构。

### 4.2 小说项目工作空间：Novel Project Workspace

每一本小说未来拥有的项目级空间。P2 阶段不强制真实文件持久化，但接口契约围绕该结构设计。

```
<novel-workspace-root>/
└── <project-slug>/
    ├── .novelforge/
    │   ├── project.yaml
    │   ├── workspace.yaml
    │   ├── branches.yaml
    │   ├── models.yaml
    │   ├── skills.yaml
    │   ├── commands.yaml
    │   └── workflows/
    │       ├── chapter.generate.yaml
    │       ├── chapter.continue.yaml
    │       ├── outline.generate.yaml
    │       ├── outline.detail.yaml
    │       └── info.extract.yaml
    ├── manuscript/
    │   ├── chapters/
    │   ├── outline.md
    │   └── synopsis.md
    ├── bible/
    │   ├── characters.yaml
    │   ├── world.yaml
    │   └── locations.yaml
    ├── info-flow/
    │   ├── atoms.json
    │   ├── links.json
    │   └── chapter-states.json
    ├── drafts/
    │   ├── branch-main/
    │   ├── branch-romance/
    │   └── branch-action/
    └── exports/
```

P2 阶段只定义 `.novelforge/` manifest 与 workflow 路径契约，不创建真实项目文件。

---

## 5. Skills / Commands 存放方案

### 5.1 层级定义

```
Skill = 能力包 / 能力集合
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

随 NovelForge 代码发布，负责系统默认能力。

建议位置：

```
packages/app/src/novel/skills/core/
├── writing.skill.ts
├── outline.skill.ts
├── info-extraction.skill.ts
└── info-theory.skill.ts
```

示例：

```text
writing.skill
├── command: /novel generate-chapter
├── command: /novel continue
├── workflow: chapter.generate.yaml
├── workflow: chapter.continue.yaml
└── tools:
    ├── context-assemble
    ├── agent-run
    └── build-workflow-events
```

### 5.3 项目级 Skills

未来放在 `<project>/.novelforge/skills.yaml`。

P2 阶段在接口中保留 `skillId`，不实现真实项目文件读写。

### 5.4 用户自定义 Skills

P3/P4 以后开放，P2 阶段仅做 FeatureGate 预留。

### 5.5 内置 Commands

建议新增目录：

```
packages/app/src/novel/commands/
├── novel-command-types.ts
├── novel-command-registry.ts
├── builtin-novel-commands.ts
├── novel-command-discovery.ts
└── opencode-chat-command-provider.ts
```

职责：

- `novel-command-types.ts`：命令元数据类型。
- `builtin-novel-commands.ts`：注册内置命令。
- `novel-command-registry.ts`：提供查询能力。
- `novel-command-discovery.ts`：根据 workspace / skill / gate 过滤可用命令。
- `opencode-chat-command-provider.ts`：把 NovelForge 命令暴露给 OpenCode Chat。

### 5.6 项目级 Commands

未来放在 `<project>/.novelforge/commands.yaml`。

P2 阶段默认只加载内置命令，项目级命令通过 `projectCommandEnabled` gate 关闭。

---

## 6. OpenCode Chat 识别方案

### 6.1 分阶段策略

| 阶段 | 能力 |
|------|------|
| P2-A0 | Novel 内部 Chat Debug Parser，不要求 OpenCode Chat 真识别 |
| P2-A1 / P2-B | 增加 `NovelChatCommandProvider` 契约 |
| P2-D / P2-E | 如果 OpenCode Chat 已有 command registry，则对接；否则保留 Novel 内部 provider |

### 6.2 Chat 只识别 Command Descriptor

OpenCode Chat 不直接识别 YAML、Tool、Adapter。它只识别：

```text
Command Descriptor
Command Parser
Command Executor
```

### 6.3 NovelChatCommandProvider 契约

```typescript
export interface NovelChatCommandProvider {
  namespace: 'novel';

  listCommands(context: NovelChatCommandContext): NovelCommandDescriptor[];

  parse(
    input: string,
    context: NovelChatCommandContext,
  ): NovelCommandParseResult;

  execute(
    command: NovelCommand,
    context: NovelChatCommandContext,
  ): Promise<NovelCommandExecutionResult>;
}
```

命令描述：

```typescript
export interface NovelCommandDescriptor {
  id: string;
  slash: string;
  title: string;
  description: string;
  commandType: NovelCommand['type'];
  skillId: string;
  workflowId: string;
  gate?: string;
  enabled: boolean;
  examples: string[];
}
```

上下文：

```typescript
export interface NovelChatCommandContext {
  source: 'opencode-chat' | 'novel-debug' | 'ui-button';
  workspaceId?: string;
  projectId: string;
  chapterId?: string;
  branchId?: string;
  worktreeId?: string;
  modelProfileId?: string;
}
```

### 6.4 Chat Debug Console 与正式 Provider 的关系

P2-A0 的 `/novel run ...` 是开发态命令，未来可以迁移到 `NovelChatCommandProvider.parse()` 内部，保持 Parser/Runner 不变。也就是说：

```text
P2-A0: NovelDebugParser → NovelCommand → Runner
P2-A1+: NovelChatCommandProvider.parse() → NovelCommand → Runner
```

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
- 自动创建分支目录。

真实 Git Worktree 放到 P3。

### 7.2 BranchProfile

```typescript
export interface NovelBranchProfile {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  baseBranchId?: string;
  gitBranchName?: string;
  worktreeId?: string;
  worktreePath?: string;
  modelProfileId?: string;
  workflowProfileId?: string;
  status: 'active' | 'archived' | 'merged' | 'conflicted';
  createdAt: Date;
  updatedAt: Date;
}
```

### 7.3 WorktreeProfile

```typescript
export interface NovelWorktreeProfile {
  id: string;
  projectId: string;
  branchId: string;
  gitBranchName: string;
  worktreePath: string;
  status:
    | 'planned'
    | 'created'
    | 'dirty'
    | 'merged'
    | 'removed'
    | 'error';
  lastSyncAt?: Date;
  error?: string;
}
```

P2 阶段 `WorktreeProfile.status` 只允许 `planned`。

---

## 8. 多模型路由裁定

### 8.1 ModelProfile

```typescript
export interface NovelModelProfile {
  id: string;
  name: string;
  description?: string;
  routes: Partial<Record<
    'draft' | 'rewrite' | 'audit' | 'outline' | 'summary' | 'critic',
    'mock' | 'opencode-stub' | 'claudecode-stub'
  >>;
  defaultRole: 'draft' | 'rewrite' | 'audit' | 'outline' | 'summary' | 'critic';
}
```

### 8.2 AdapterContext 扩展

```typescript
export interface AdapterContext {
  workspaceId?: string;
  projectId: string;
  chapterId?: string;
  branchId?: string;
  worktreeId?: string;
  modelProfileId?: string;
  modelRole?: 'draft' | 'rewrite' | 'audit' | 'outline' | 'summary' | 'critic';
  targetWordCount?: number;
  genre?: string;
  dryRun?: boolean;
}
```

P2 阶段 `routes` 保持 `mock` / `opencode-stub` / `claudecode-stub`，接口预留真实多模型路由。

---

## 9. NovelCommand 扩展建议

在 P2-0 接口契约基础上，兼容扩展 `NovelCommand`：

```typescript
export interface NovelCommand {
  id: string;
  type:
    | 'chapter.generate'
    | 'chapter.continue'
    | 'chapter.rewrite'
    | 'chapter.expand'
    | 'chapter.polish'
    | 'chapter.summarize'
    | 'outline.generate'
    | 'outline.detail'
    | 'info.extract'
    | 'branch.create'
    | 'branch.compare'
    | 'branch.merge'
    | 'model.route';

  workspaceId?: string;
  projectId: string;
  chapterId?: string;

  branchId?: string;
  worktreeId?: string;
  modelProfileId?: string;
  skillId?: string;
  workflowId?: string;

  payload: Record<string, unknown>;
}
```

说明：

- 现有 P2-A0 代码只使用 `type`、`projectId`、`chapterId` 等字段，新增字段均为可选，不破坏已有实现。
- P2-A0 的 Parser 可以逐步支持 `branchId`、`modelProfileId`、`skillId`、`workflowId` 的解析。
- 后续 P2-A YAML Engine、P2-E AdapterRouter 将消费这些字段。

---

## 10. 建议规划的目录结构

P2-0B 先规划，不全部实现：

```
packages/app/src/novel/
├── workspace/
│   ├── novel-workspace-types.ts
│   ├── novel-workspace-manifest.ts
│   └── novel-workspace-resolver.ts
├── commands/
│   ├── novel-command-types.ts
│   ├── novel-command-registry.ts
│   ├── builtin-novel-commands.ts
│   ├── novel-command-discovery.ts
│   └── opencode-chat-command-provider.ts
├── skills/
│   ├── novel-skill-types.ts
│   ├── novel-skill-registry.ts
│   └── core/
│       ├── writing.skill.ts
│       ├── outline.skill.ts
│       └── info-theory.skill.ts
├── branches/
│   ├── novel-branch-types.ts
│   ├── novel-branch-registry.ts
│   └── git-worktree-adapter.stub.ts
├── model-routing/
│   ├── model-profile-types.ts
│   ├── model-router.ts
│   └── builtin-model-profiles.ts
├── chat-debug/
├── workflows/
├── adapters/
└── ...
```

P2-A0 只新增 `chat-debug/`；`workspace/`、`commands/`、`skills/`、`branches/`、`model-routing/` 在 P2-A / P2-B / P2-D / P2-E 逐步落地。

---

## 11. FeatureGate 补充

在 `p2-feature-gate-plan.md` 中追加以下 gates：

| Gate Key | 默认值 | 控制范围 |
|----------|--------|---------|
| `chatDebugEnabled` | `true`（dev-only） | Chat Debug Console 是否可用 |
| `branchExperimentEnabled` | `true`（dev/mock mode） | 是否允许内存或 mock 分支 |
| `gitWorktreeEnabled` | `false` | 是否允许真实 git worktree 操作 |
| `customSkillEnabled` | `false` | 是否加载用户自定义 Skill |
| `projectCommandEnabled` | `false` | 是否加载项目级 Command |

约束：

- `gitWorktreeEnabled=false` 时，禁止真实 git worktree 操作。
- `branchExperimentEnabled=true` 只允许内存或 mock 分支。
- `customSkillEnabled=false` 时，不加载用户自定义 Skill。
- `projectCommandEnabled=false` 时，只加载内置命令。
- `chatDebugEnabled` 只用于开发态。

---

## 12. 对 P2-A0 的影响

P2-A0 的 Chat Debug Console 需要从“孤立的调试解析器”升级为“未来 OpenCode Chat 命令体系的雏形”。

具体调整：

1. Parser 在解析 `/novel run ...` 时，支持解析可选的 `branchId`、`modelProfileId`、`skillId`、`workflowId`。
2. Parser 将调试命令映射为扩展后的 `NovelCommand`。
3. Runner 将这些字段透传给 `WorkflowContext` / `AdapterContext`（即使当前不消费）。
4. 可以增加 `/novel commands projectId=...` 调试命令，返回当前项目可用命令列表（可选）。

P2-A0 仍然不接真实 LLM / OpenCode / ClaudeCode，不执行真实 git worktree。

---

## 13. 测试要求

本阶段只新增 / 更新文档，未修改运行时代码。

必须执行：

```bash
cd packages/app
bun typecheck
bun test src/novel
```

E2E 不是本阶段硬门槛。

---

## 14. 阶段报告格式

完成后输出：

- Phase P2-0B 报告
- 新增 / 修改文档列表
- 工作空间规划结论
- Skills / Commands 存放方案
- OpenCode Chat 识别方案
- 多分支 / Git Worktree 裁定
- 多模型路由裁定
- 对 P2-A0 的影响
- 测试结果
- 风险与未完成项
- 阶段完成标记

最后输出：

```text
[READY_FOR_P2A0_WORKSPACE_AWARE]
```

---

## 15. 阶段状态建议

当前状态从：

```text
[APPROVED_FOR_P2A0]
```

调整为：

```text
[PHASE_P2_0_ACCEPTED]
[NEED_P2_0B_BEFORE_P2A0]
```

P2-0B 完成后再进入：

```text
[APPROVED_FOR_WORKSPACE_AWARE_P2A0]
```

这样 P2-A0、P2-A、P2-B、P2-D、P2-E 都能天然支持：

- 项目工作空间
- Skills / Commands
- OpenCode Chat 识别
- 多分支
- 多模型
- Git Worktree 预留

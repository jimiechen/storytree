# Phase P2-0 接口契约

> 角色：前端工程师 / Novel 模块开发 Agent (Kimi-K2.7-Code)
> 任务：Phase P2-0 基线
> 来源：`tabbit_Phase P2-0.md` / `P2-IMPLEMENTATION-PLAN-20260619.md`
> 日期：2026-06-20

---

## 1. 设计目标

本契约锁定 Phase P2 后续阶段（P2-A0 ~ P2-E）必须遵守的核心 TypeScript 接口与 YAML 结构。P2-0 不做实现，只定义边界，避免并行开发时出现接口理解不一致。

---

## 2. 类型别名

```typescript
/** JSON Schema 草案，P2 阶段先用 unknown 占位，后续可替换为 zod / valibot / jsonschema 类型 */
type JSONSchema = unknown;
```

---

## 3. NovelCommand

P2 目标命令接口。当前 `workflows/novel-command.ts` 中的命令字段更丰富，P2-A 后应逐步收敛到以下最小契约，旧字段可映射到 `payload` 中。

```typescript
export interface NovelCommand {
  /** 命令唯一 ID，由调用方生成 */
  id: string;

  /** 命令类型 */
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

  /** 工作空间 ID */
  workspaceId?: string;

  /** 关联项目 ID */
  projectId: string;

  /** 关联章节 ID（大纲/项目级命令可为空） */
  chapterId?: string;

  /** 当前叙事分支 / Git 分支 / 创作分支 */
  branchId?: string;

  /** 当前 Git Worktree 实例 */
  worktreeId?: string;

  /** 多模型路由配置 */
  modelProfileId?: string;

  /** 处理该命令的 Skill */
  skillId?: string;

  /** 使用的 YAML Workflow */
  workflowId?: string;

  /** 命令负载，承载当前命令的扩展字段 */
  payload: Record<string, unknown>;
}
```

### 3.1 当前命令映射

| 当前字段 | 映射位置 |
|---------|---------|
| `type: NovelCommandType` | 直接映射到 `type` |
| `chapterId` / `projectId` | 直接映射 |
| `chapterIndex` / `genre` / `text` / `selectedText` / `targetWordCount` / `contextRefs` | 放入 `payload` |
| `command?: AIWritingCommand` | 放入 `payload.command` |
| `workspaceId` / `branchId` / `worktreeId` / `modelProfileId` / `skillId` / `workflowId` | 由 P2-0B 引入的可选字段 |

### 3.2 P2-0B 扩展说明

P2-0B 为 `NovelCommand` 增加了工作空间、分支、Worktree、模型、Skill、Workflow 等可选字段。新增字段均为可选，不破坏 P2-A0 已实现代码。P2-A0 的 Chat Debug Parser 可逐步支持解析这些字段，并透传给 Workflow Engine / AdapterRouter。

---

## 4. WorkflowContext

单次工作流执行的上下文，由 Workflow Engine 维护并传给 Tool / Adapter。

```typescript
export type WorkflowStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface WorkflowContext {
  /** 工作流执行 ID */
  workflowId: string;

  /** 当前状态 */
  status: WorkflowStatus;

  /** 关联项目 ID */
  projectId: string;

  /** 关联章节 ID */
  chapterId: string;

  /** 命令类型 */
  commandType: NovelCommand['type'];

  /** 中间变量池，供步骤间传递数据 */
  variables: Record<string, unknown>;

  /** 已执行步骤结果 */
  stepResults: Record<string, unknown>;

  /** 错误信息 */
  error?: string;

  /** 创建时间 */
  createdAt: Date;

  /** 完成时间 */
  completedAt?: Date;
}
```

---

## 5. NovelWorkflowEngine

```typescript
export interface NovelWorkflowEngine {
  /** 从 YAML 文件加载工作流定义 */
  load(yamlPath: string): Promise<WorkflowDefinition>;

  /** 执行工作流，返回逐步结果 */
  execute(
    command: NovelCommand,
    context: WorkflowContext,
  ): AsyncGenerator<WorkflowStepResult>;
}

/** 单步执行结果 */
export interface WorkflowStepResult {
  stepId: string;
  status: 'started' | 'completed' | 'failed';
  output?: unknown;
  error?: string;
}
```

---

## 6. WorkflowDefinition

```typescript
export interface WorkflowDefinition {
  /** 工作流 ID */
  id: string;

  /** 版本号 */
  version: number;

  /** 匹配命令类型 */
  commandType: NovelCommand['type'];

  /** 步骤列表 */
  steps: WorkflowStep[];

  /** 输出结构校验 */
  outputSchema?: JSONSchema;
}
```

---

## 7. WorkflowStep

```typescript
export interface WorkflowStep {
  /** 步骤 ID */
  id: string;

  /** 步骤名称（用于日志/调试） */
  name?: string;

  /** 调用的 Tool 名称 */
  tool: string;

  /** 使用的执行器 */
  adapter?: 'mock' | 'opencode-stub' | 'claudecode-stub';

  /** 输入参数，支持模板引用上下文变量 */
  inputs: Record<string, string | number | boolean>;

  /** 输出变量映射 */
  outputs?: Record<string, string>;

  /** 是否允许失败继续 */
  continueOnError?: boolean;
}
```

---

## 8. NovelTool

```typescript
export interface NovelTool {
  /** Tool 名称 */
  name: string;

  /** 描述 */
  description: string;

  /** 输入 schema */
  inputSchema: JSONSchema;

  /** 输出 schema */
  outputSchema: JSONSchema;

  /** 执行 */
  execute(input: unknown, context: ToolContext): Promise<ToolResult>;
}
```

---

## 9. ToolContext

```typescript
export interface ToolContext {
  /** 项目 ID */
  projectId: string;

  /** 章节 ID */
  chapterId?: string;

  /** 当前工作流上下文 */
  workflowContext: WorkflowContext;
}
```

---

## 10. ToolResult

```typescript
export interface ToolResult {
  /** 是否成功 */
  success: boolean;

  /** 输出数据 */
  data?: unknown;

  /** 错误信息 */
  error?: string;
}
```

---

## 11. AgentExecutionAdapter

```typescript
import type { NovelAgentResult } from '../types/ai-task';

export interface AgentExecutionAdapter {
  /** 适配器名称 */
  readonly name: string;

  /** 是否可处理该命令 */
  canHandle(command: NovelCommand): boolean;

  /** 执行命令并返回 Agent 终态结果 */
  execute(
    command: NovelCommand,
    context: AdapterContext,
  ): Promise<NovelAgentResult>;
}
```

---

## 12. AdapterContext

```typescript
export interface AdapterContext {
  /** 项目 ID */
  projectId: string;

  /** 章节 ID */
  chapterId?: string;

  /** 目标字数 */
  targetWordCount?: number;

  /** 小说类型 */
  genre?: string;

  /** 是否 dry run（仅用于调试） */
  dryRun?: boolean;
}
```

---

## 13. AdapterRouter

```typescript
export interface AdapterRouter {
  /** 注册适配器 */
  register(adapter: AgentExecutionAdapter): void;

  /** 根据命令与 gate 选择适配器 */
  route(
    command: NovelCommand,
    gates: { openCodeEnabled: boolean; claudeCodeEnabled: boolean },
  ): AgentExecutionAdapter;
}
```

---

## 14. NovelWorkflowEvent 扩展

在 P1 事件基础上扩展工作流引擎事件与信息论事件。

```typescript
import type { NovelWorkflowEvent as P1NovelWorkflowEvent } from '../workflows/workflow-events';
import type { ChapterInformationState } from '../types/information-flow';

export interface InformationScore {
  auditScore: number;
  entropyDelta: number;
  selfInformationScore: number;
  atomCount: number;
  linkCount: number;
}

export type NovelWorkflowEvent =
  | P1NovelWorkflowEvent
  | { type: 'workflow.step.started'; stepId: string }
  | { type: 'workflow.step.completed'; stepId: string; result: unknown }
  | { type: 'workflow.step.failed'; stepId: string; error: string }
  | {
      type: 'info.theory.calculated';
      chapterId: string;
      score: InformationScore;
      state: ChapterInformationState;
    }
  | { type: 'adapter.routed'; adapter: string }
  | { type: 'workflow.cancelled'; workflowId: string }
  | { type: 'workflow.retry'; workflowId: string; attempt: number };
```

---

## 15. YAML Workflow Schema 草案

每个 YAML 文件描述一个工作流定义。

```yaml
id: chapter-generate
version: 1
commandType: chapter.generate
steps:
  - id: context-assemble
    tool: context-assemble
    inputs:
      projectId: '${command.projectId}'
      chapterId: '${command.chapterId}'
    outputs:
      context: context

  - id: agent-run
    tool: agent-run
    adapter: mock
    inputs:
      genre: '${payload.genre}'
      text: '${payload.text}'
      targetWordCount: '${payload.targetWordCount}'
    outputs:
      result: agentResult

  - id: info-audit
    tool: info-theory-audit
    inputs:
      informationState: '${agentResult.informationState}'
    outputs:
      score: infoScore

  - id: build-events
    tool: build-workflow-events
    inputs:
      result: '${agentResult}'
      score: '${infoScore}'
    outputs:
      events: events

outputSchema:
  type: object
  properties:
    events:
      type: array
```

### 15.1 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `id` | 是 | 工作流唯一 ID |
| `version` | 是 | 版本号 |
| `commandType` | 是 | 匹配的命令类型 |
| `steps` | 是 | 步骤列表 |
| `steps[].id` | 是 | 步骤 ID |
| `steps[].tool` | 是 | Tool 名称 |
| `steps[].adapter` | 否 | 执行器，默认 `mock` |
| `steps[].inputs` | 是 | 输入参数，支持 `${context.xxx}` 模板 |
| `steps[].outputs` | 否 | 输出变量名映射 |
| `steps[].continueOnError` | 否 | 失败后是否继续 |
| `outputSchema` | 否 | 输出结构校验 |

---

## 16. Mock → YAML 迁移接口边界

### 16.1 P2-A 早期：包装现有 Mock Workflow

- `NovelWorkflowEngine.execute` 内部直接调用 `runMockGeneration(command)`。
- YAML 文件只保留 `id`、`version`、`commandType` 与一个占位 `mock-wrapper` 步骤。
- 目标：不改变现有调用方，验证 YAML loader 与 engine 接口。

### 16.2 P2-B：拆分为 Tool

- 新增 Tool：`context-assemble`、`agent-run`、`build-workflow-events`。
- `agent-run` Tool 内部复用 `MockAgentAdapter`。
- `build-workflow-events` Tool 复用 `mock-generation-workflow.ts` 中的事件构建逻辑。

### 16.3 P2-C：插入 Info Theory Tool

- 新增 `info-theory-audit` Tool。
- YAML 中在 `agent-run` 之后、`build-events` 之前插入该步骤。
- 输出 `info.theory.calculated` 事件。

### 16.4 P2-E：接入 AdapterRouter

- YAML `adapter` 字段支持 `mock`、`opencode-stub`、`claudecode-stub`。
- `agent-run` Tool 通过 `AdapterRouter` 选择适配器。
- `openCodeAdapterEnabled` / `claudeCodeAdapterEnabled` 为 `false` 时，选择器回退到 `mock`。

---

## 17. 与现有代码的关系

| 现有文件 | 当前作用 | P2 关系 |
|---------|---------|---------|
| `workflows/novel-command.ts` | 当前命令类型与工厂函数 | 字段映射到 `NovelCommand`，工厂函数保留兼容 |
| `workflows/types.ts` | `WorkflowContext` / `WorkflowResult` | `WorkflowContext` 扩展后复用 |
| `workflows/workflow-events.ts` | P1 事件定义 | 作为 `P1NovelWorkflowEvent` 被扩展 |
| `workflows/mock-generation-workflow.ts` | Mock 编排与事件构建 | P2-A 包装，P2-B 拆分 |
| `adapters/novel-agent-adapter.ts` | `NovelAgentAdapter` 接口 | 演进为 `AgentExecutionAdapter` |
| `adapters/mock-agent-adapter.ts` | Mock 适配器实现 | 作为 `mock` adapter 注册到 router |
| `types/ai-task.ts` | `NovelAgentResult` | `AgentExecutionAdapter.execute` 返回值 |
| `types/information-flow.ts` | 信息状态类型 | `info.theory.calculated` 事件依赖 |

---

## 18. 版本与变更控制

- 本契约版本：P2-0。
- 后续阶段如需修改接口，必须在 `p2-interface-contract.md` 中追加修订记录，并经主控评审。
- P2-E 结束前，所有新增代码必须能通过本契约的 TypeScript 接口编译检查。

---

*本接口契约是 Phase P2 的技术基线，后续实现必须以此为约束。*

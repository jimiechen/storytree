我是：GLM-5.2 代码评审 Agent，本次任务：NOVEL-CODE-REVIEW-20260621，职责范围：`c:\projects\storytree\caiode\opencode-1.4.0\packages\app\src\novel`（只读评审，输出文档到 `docs/reviews/`）

# Novel 模块代码评审报告

> **评审范围**：`caiode/opencode-1.4.0/packages/app/src/novel`
> **评审日期**：2026-06-21
> **评审 Agent**：GLM-5.2
> **评审方法**：静态代码分析（200+ 文件读取 + 4 路并行子代理深度分析）
> **当前阶段**：Phase P3-A Real LLM Adapter Pilot 完成后

---

## 评审摘要

| 维度 | 评分 | 关键发现 |
|------|------|---------|
| 基础架构 | 良好 | 9 层分层清晰，YAML 驱动工作流 + Tool Registry 插件化 |
| 模块依赖 | 中等 | 存在 1 处类型级循环依赖、2 处装配职责越界 |
| 调用链 | 优秀 | 4 条核心调用链路径清晰，事件驱动写回设计良好 |
| 数据流 | 优秀 | 流式 AsyncIterator + 响应式 Signal 双轨制 |
| 通讯方式 | 优秀 | Promise / AsyncGenerator / Signal / 事件订阅分层合理 |
| 代码质量 | 中等 | 文件行数 100% 合规，但 `as any`/`throw 对象`/零 createStore 三类系统性问题 |
| 安全 | 良好 | 密钥管理优秀，但流式超时/取消机制缺失 |
| 边界 | 中等 | 输入验证不足，运行时类型校验缺失 |
| 测试覆盖 | 中等 | 逻辑模块良好（260 pass），UI 层与核心 Hook 有盲区 |

**综合结论**：架构设计意图清晰，阶段化推进（P1→P2→P3）使接口边界先于实现落地，FeatureGate + 结构化错误的组合有效防止了伪成功。主要待改进点集中在类型安全、SolidJS 状态管理、网络边界处理三方面。整体属于**良好但处于技术债积累期**的架构。

---

## 一、基础架构

### 1.1 架构分层图

Novel 模块采用 **9 层分层架构**，从上到下职责如下：

```
┌─────────────────────────────────────────────────────────────┐
│  1. UI 层 (components/)                                      │
│     职责：纯展示与交互（SolidJS 组件），不包含业务逻辑        │
│     代表：novel-app-shell.tsx, chapter-editor.tsx            │
├─────────────────────────────────────────────────────────────┤
│  2. Hooks 层 (hooks/)                                        │
│     职责：UI 与业务之间的状态桥接，注入 mutations            │
│     代表：use-novel-action-dispatcher.ts, use-novel-workflow │
├─────────────────────────────────────────────────────────────┤
│  3. Action 层 (actions/)                                     │
│     职责：UI 动作 → NovelCommand 翻译 + 执行路径选择         │
│     核心：NovelActionDispatcher（P2-D 仅接入 3 种 AI 动作）  │
├─────────────────────────────────────────────────────────────┤
│  4. Workflow 层 (workflows/engine/)                          │
│     职责：YAML 驱动的工作流编排，逐步执行 WorkflowStep        │
│     核心：createNovelWorkflowEngine（AsyncGenerator 输出）   │
├─────────────────────────────────────────────────────────────┤
│  5. Plugin 层 (plugins/)                                     │
│     职责：Tool Registry 注册与执行，可扩展的工具系统          │
│     核心：NovelToolRegistry, builtinNovelToolPlugin          │
├─────────────────────────────────────────────────────────────┤
│  6. Adapter 层 (adapters/)                                   │
│     职责：执行器抽象与路由（Mock/Stub/RealLLM）              │
│     核心：AdapterRouter + AgentExecutionAdapter 接口         │
├─────────────────────────────────────────────────────────────┤
│  7. LLM 层 (llm/)                                            │
│     职责：真实 LLM 客户端、Transport、FeatureGate、安全日志  │
│     核心：TargetLLMClient + LLMTransport + DeepSeekTransport │
├─────────────────────────────────────────────────────────────┤
│  8. Provider 层 (providers/)                                 │
│     职责：CRUD 数据访问（项目/章节/角色/大纲/AI日志）        │
│     核心：INovelProjectProvider 等接口 + Mock 实现           │
├─────────────────────────────────────────────────────────────┤
│  9. Service 层 (services/)                                   │
│     职责：领域服务（上下文组装、类型化 Prompt 模板）         │
│     核心：assembleWritingContext, GENRE_TEMPLATES            │
├─────────────────────────────────────────────────────────────┤
│  横切：feature-gates.ts（顶层特性门控，默认全 false）        │
│  横切：info-theory/（信息论审计，独立子系统）                │
│  横切：chat-debug/（调试命令系统）                           │
└─────────────────────────────────────────────────────────────┘
```

**调用流向**：UI → Hooks → Action → Workflow → Plugin(Tool) → Adapter → LLM；Provider 与 Service 为旁路数据源。

### 1.2 架构亮点

1. **FeatureGate 默认全关闭 + 双 gate 校验**：Real LLM 需 `realLLMEnabled && targetLLMAdapterEnabled` 同时开启，流式还需 `llmStreamingEnabled`，避免单开关误开
2. **AdapterRouter 结构化错误**：所有失败路径返回 `AdapterRouterError`，**disabled 不 fallback 到 mock**，杜绝伪成功
3. **YAML 驱动工作流 + Tool Registry**：工作流定义与代码解耦，新增工具无需修改 Engine
4. **安全日志脱敏**：默认只保留 prompt 前 80 字符、response 前 120 字符，正则遮蔽 `sk-*` / `Bearer *` / `api_key=*`
5. **确定性 Mock 数据**：基于 chapterIndex + genre 哈希，相同输入永远产出相同结果，E2E 可断言
6. **信息论审计独立子系统**：纯函数无副作用，`sharedCharRatio` 动态计算互信息避免循环依赖
7. **清晰的阶段化设计**：每个文件头部注释标注阶段（P1-A / P2-A...P2-E / P3-0 / P3-A）

### 1.3 架构问题

#### 问题 A1：类型级循环依赖（需修复）

**位置**：
- [adapters/adapter-types.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/adapters/adapter-types.ts) ↔ [workflows/novel-command.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/workflows/novel-command.ts)

**详情**：`adapter-types.ts:9` 引入 `NovelCommand`，`novel-command.ts:9` 引入 `AdapterKind`（用于 `adapterKind?: AdapterKind` 调试字段）。虽为 `import type`（编译期消除），但破坏了"adapter 层不应被 command 层反向引用"的分层原则。

**建议**：将 `AdapterKind` 提取到 `types/adapter-kind.ts`，两端共同引用。

#### 问题 A2：双 Adapter 接口并存（技术债）

**位置**：
- `NovelAgentAdapter`（[novel-agent-adapter.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/adapters/novel-agent-adapter.ts)，P1，`run(command): Promise<NovelAgentResult>`）
- `AgentExecutionAdapter`（[adapter-types.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/adapters/adapter-types.ts)，P2-E，`canHandle + execute`）

**详情**：`MockExecutionAdapter` 内部包装 `MockAgentAdapter`，`adapters/index.ts:26` 保留旧导出"保证现有代码不回归"。新代码用 `AgentExecutionAdapter`，旧代码（workflow-engine、action-dispatcher）仍依赖 `NovelAgentAdapter`。

**建议**：制定迁移计划，逐步切换到 `AgentExecutionAdapter`，废弃 `NovelAgentAdapter`。

#### 问题 A3：双信息论类型并存（技术债）

**位置**：
- [types/information-flow.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/types/information-flow.ts)（P1，Info-Lite，含 `SaveTheCatBeatId`、`InformationLinkRelationType` 含 `mystery`）
- [info-theory/information-types.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/info-theory/information-types.ts)（P2-C，扩展结构，`InformationLinkRelationType` 不含 `mystery`）

**详情**：`information-extractor.ts:8` 从 `types/information-flow` 引入 `uid`，但 `InformationAtom` 类型用本目录的。`mock-agent-adapter.ts` 用 P1 类型，`information-auditor.ts` 用 P2-C 类型。`mystery` 关系在两套类型中定义不同，可能导致运行时数据不兼容。

**建议**：统一为一套类型，或明确文档化两套类型的边界。

#### 问题 A4：Tool 层装配职责越界（设计气味）

**位置**：[plugins/core-writing-tools/agent-run.tool.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/plugins/core-writing-tools/agent-run.tool.ts)

**详情**：直接 import 所有 adapter 具体类并在 Tool 内创建 `AdapterRouter`（第 24-30 行），同时 import `createDefaultAdapterFeatureGates`、`createDefaultRealLLMFeatureGates`、`createTargetLLMClient`。Tool 文件注释声称"Tool 不直接知道具体模型"，但实际代码直接引用了所有 adapter 实现。

**建议**：Router、Gates、Client 应由 Engine 或 Hook 层注入到 `ToolContext`，Tool 通过 context 获取。

#### 问题 A5：Workflow Engine 硬编码 Plugin 依赖（设计气味）

**位置**：[workflows/engine/workflow-engine.ts:20](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/workflows/engine/workflow-engine.ts)

**详情**：直接 `import { createBuiltinNovelToolRegistry } from '../../plugins/builtin-novel-tools'`，默认路径硬编码创建 registry。Workflow 层向下耦合 Plugin 层具体实现，无法在不引入 plugins 的情况下单独使用 engine。

**建议**：强制要求外部注入 `registry`，或通过工厂函数延迟绑定。

#### 问题 A6：全局可变状态（潜在问题）

**位置**：[workflows/apply-workflow-events.ts:15](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/workflows/apply-workflow-events.ts)

**详情**：使用模块级 `const eventLog: NovelWorkflowEvent[] = []`，并提供 `getWorkflowEventLog` / `clearWorkflowEventLog`。全局可变状态在并发场景下不安全，且难以在多实例场景下隔离。

**建议**：将 eventLog 封装到类实例或 context 中。

#### 问题 A7：Bun 运行时硬依赖（兼容性问题）

**位置**：[workflows/engine/workflow-loader.ts:61](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/workflows/engine/workflow-loader.ts)

**详情**：检查 `typeof Bun === 'undefined'` 并抛错，浏览器环境无法加载 YAML 文件。Workflow Engine 无法在纯浏览器环境运行。

**建议**：抽象 `WorkflowLoader` 接口，提供 Bun / fetch / inline-text 多种实现。

#### 问题 A8：Action Dispatcher 与 Provider 路径未统一（架构不一致）

**位置**：[actions/novel-action-dispatcher.ts:45-49](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/actions/novel-action-dispatcher.ts)

**详情**：`YAML_ACTIONS` 只含 3 种 AI 动作，CRUD 动作"保留 provider"。但 Dispatcher 对未支持动作返回 `NOT_SUPPORTED_ACTION` 错误，而非路由到 provider。UI 层需自行判断哪些动作走 Dispatcher、哪些走 provider。

**建议**：Dispatcher 应作为统一入口，内部路由到 YAML Engine 或 Provider，对 UI 透明。

---

## 二、模块依赖

### 2.1 单向依赖（正常）

| 模块 | 依赖方向 |
|------|---------|
| `actions/novel-action-dispatcher.ts` | → `workflows/engine/workflow-engine`、`plugins/builtin-novel-tools`、`workflows/apply-workflow-events`、`info-theory/information-types`、`adapters/novel-agent-adapter` |
| `workflows/engine/workflow-engine.ts` | → `plugins/builtin-novel-tools`、`adapters/novel-agent-adapter`、`workflows/engine/*`（内部） |
| `plugins/builtin-novel-tools.ts` | → `adapters/novel-agent-adapter`、`plugins/core-writing-tools/*`、`plugins/core-info-theory-tools/*` |
| `adapters/real-llm-adapter.ts` | → `llm/target-llm-client`、`llm/llm-feature-gates`、`llm/llm-stream-events`、`llm/target-llm-request-builder`、`llm/llm-error-types`、`llm/llm-safe-logger` |
| `adapters/mock-execution-adapter.ts` | → `adapters/mock-agent-adapter`（包装旧接口） |
| `info-theory/information-auditor.ts` | → `info-theory/*`（内部全依赖） |
| `info-theory/information-extractor.ts` | → `types/information-flow`（uid 函数） |
| `providers/*` | → `types`、`mock-data`、`utils/mock-delay` |
| `services/context-assembler.ts` | → `types/chapter` |
| `services/genre-prompt-template.ts` | 无外部依赖（纯静态数据） |
| `feature-gates.ts` | → `adapters/adapter-types`（仅类型） |

### 2.2 双向依赖（设计气味）

**`plugins/core-writing-tools/agent-run.tool.ts` ↔ `adapters/*`**

`agent-run.tool.ts` 直接 import 了所有 adapter 具体实现（`createAdapterRouter`、`MockExecutionAdapter`、`OpenCodeExecutionAdapter`、`ClaudeCodeExecutionAdapter`、`RealLLMExecutionAdapter`），并在 Tool 内部自行创建 Router。这违反了"Tool 不应知道具体 adapter 实现"的设计意图。实际依赖是 Tool → Adapter，但 Tool 承担了本应由 Engine/Composition Root 完成的装配职责。

### 2.3 循环依赖（需修复）

**`adapters/adapter-types.ts` ↔ `workflows/novel-command.ts`（类型循环）**

- `adapters/adapter-types.ts:9` → `import type { NovelCommand } from '../workflows/novel-command'`
- `workflows/novel-command.ts:9` → `import type { AdapterKind } from '../adapters/adapter-types'`

两者形成 **类型级循环依赖**。由于都是 `import type`，TypeScript 编译期可消除，运行时不会报错，但这是设计气味：`NovelCommand` 的 `adapterKind` 字段（P2-E 调试扩展）让命令层反向引用了适配器层。建议将 `AdapterKind` 提取到独立的 `types/adapter-kind.ts` 中打破循环。

### 2.4 依赖层级违规

**`workflows/engine/workflow-engine.ts` 直接依赖 `plugins/builtin-novel-tools`**

`workflow-engine.ts:20` 直接 `import { createBuiltinNovelToolRegistry } from '../../plugins/builtin-novel-tools'`，并在 `createNovelWorkflowEngine` 内部默认创建 registry。这使得 Workflow 层向下耦合到 Plugin 层的具体实现，破坏了分层独立性。虽然提供了 `options.registry` 注入点，但默认路径仍是硬编码。

---

## 三、核心接口契约

### 3.1 Adapter 接口（`adapters/adapter-types.ts`）

```typescript
interface AgentExecutionAdapter {
  readonly name: AdapterKind;  // 'mock' | 'opencode-stub' | 'claudecode-stub' | 'real-llm'
  canHandle(command: NovelCommand, context: AdapterContext): boolean;
  execute(command: NovelCommand, context: AdapterContext): Promise<AdapterExecutionResult>;
}

interface AdapterRouter {
  register(adapter: AgentExecutionAdapter): void;
  route(requested, command, context, gates): AgentExecutionAdapter | AdapterRouterError;
}
```

**契约要点**：
- `AdapterExecutionResult` 强制结构化返回（`success` + `errorCode`），禁止伪成功
- `AdapterRouter.route` 在 Gate 关闭时返回 `ADAPTER_DISABLED`，**不 fallback 到 mock**
- Real LLM 需 **双 gate**（`realLLMEnabled` + `targetLLMAdapterEnabled`）

### 3.2 Tool 接口（`plugins/novel-tool-types.ts`）

```typescript
interface NovelTool {
  name: string;
  description: string;
  inputSchema?: JSONSchema;
  outputSchema?: JSONSchema;
  execute(input: unknown, context: ToolContext): Promise<ToolResult>;
}

interface NovelToolRegistry {
  register(tool: NovelTool): void;        // 重复注册抛 TOOL_ALREADY_REGISTERED
  has(name): boolean;
  get(name): NovelTool | undefined;
  list(): NovelTool[];
  execute(name, input, context): Promise<ToolResult>;  // 未找到返回 TOOL_NOT_FOUND
}
```

**契约要点**：
- `ToolContext` 派生自 `WorkflowExecutionContext` 并透传原始 `NovelCommand`
- `ToolResult` 含 `events` 字段，供上层聚合为 `NovelWorkflowEvent`
- Registry 重复注册 **直接抛错**（不覆盖），保证工具唯一性

### 3.3 Workflow 接口（`workflows/engine/workflow-engine.ts` + `workflow-definition-types.ts`）

```typescript
interface NovelWorkflowEngine {
  load(workflowId: string): Promise<WorkflowDefinition>;
  execute(command, definition?): AsyncGenerator<WorkflowStepResult>;
}

interface WorkflowStep {
  id: string; tool: string;
  adapter?: WorkflowAdapterKind;  // 'mock' | 'opencode-stub' | 'claudecode-stub'
  inputs: Record<string, unknown>;
  outputs?: Record<string, string>;  // 变量绑定
  continueOnError?: boolean;
}
```

**契约要点**：
- `execute` 是 **AsyncGenerator**，逐步 yield `started/completed/failed` 事件
- 支持 `{{varName}}` 模板插值（`interpolateInputs`）
- `step.outputs` 将 tool 返回字段绑定到 workflow 变量
- YAML 加载依赖 **Bun 运行时**（`workflow-loader.ts:61` 检查 `typeof Bun`）

### 3.4 LLM Client 接口（`llm/target-llm-client.ts`）

```typescript
interface LLMTransport {
  readonly name: string;
  complete(request: LLMRequest): Promise<LLMResponse>;
  stream(request: LLMRequest): AsyncGenerator<LLMStreamEvent>;
}

interface TargetLLMClient {
  readonly transportName: string;
  complete(request: LLMRequest): Promise<LLMResponse>;
  stream(request: LLMRequest): AsyncGenerator<LLMStreamEvent>;
}
```

**契约要点**：
- 默认 `disabledLLMTransport` 抛 `CLIENT_STUB_ONLY`，保证"未注入即不调用"
- Client 内置 **超时机制**（默认 30s，`Promise.race`）
- `DeepSeekTransport` 是唯一真实实现，兼容 OpenAI Chat Completions 协议
- API Key **必须外部注入**，源码不读 `process.env`（`deepseek-transport.ts:104-106` 校验）

### 3.5 Provider 接口（`providers/index.ts`）

```typescript
interface INovelProjectProvider { listProjects(); getProject(); getActiveProject(); searchProjects(); createProject(); }
interface INovelChapterProvider { listChapters(); getChapter(); saveChapter(); saveChapterInformationState(); ... }
interface INovelCharacterProvider { listCharacters(); getCharacter(); getCharacterRelationships(); }
interface INovelAgentProvider { submitTask(); cancelTask(); getTaskStatus(); onTaskUpdate(); }
interface IAILogProvider { logTask(); listLogs(); getLog(); }
interface INovelOutlineProvider { listOutlines(); getDetailOutline(); generateOutline(); }
```

---

## 四、代码调用链

### 4.1 调用链 1：UI → Action → Adapter（"开始生成"按钮完整路径）

```
[用户点击"开始生成"按钮]
    ↓ onClick={props.onStartGeneration}
workspace-actions.tsx → WorkspaceActions 组件 (data-testid="start-generation-btn")
    ↓ onStartGeneration 回调
components/novel-workspace/index.tsx → Workspace 组件
    ↓ vm.submitChapterGenerationTask (第216行绑定)
workspace-view-model.ts → createWorkspaceViewModel.submitChapterGenerationTask
    ↓ workflow.runChapterGeneration({...})
hooks/use-novel-workflow.ts → useNovelWorkflow.runChapterGeneration
    ↓ 构造 NovelActionInput, 调用 dispatch(input)
hooks/use-novel-action-dispatcher.ts → useNovelActionDispatcher.dispatch
    ↓ dispatcher.dispatch(input)
actions/novel-action-dispatcher.ts → createNovelActionDispatcher.dispatch
    ↓ 1. buildNovelCommand(input) → NovelCommand
    ↓ 2. normalizeNovelCommand(command) → NormalizedNovelCommand
    ↓ 3. for await (const step of engine.execute(command))
workflows/engine/workflow-engine.ts → createNovelWorkflowEngine.execute (AsyncGenerator)
    ↓ 1. resolveWorkflowId(normalized) → 'chapter.generate'
    ↓ 2. resolveBuiltinWorkflowPath → yaml/chapter.generate.yaml 路径
    ↓ 3. loadWorkflowDefinition(path) → Bun.file().text() → yaml.parse()
    ↓ 4. 对每个 step: interpolateInputs → registry.execute(step.tool, inputs, ctx)
plugins/novel-tool-registry.ts → NovelToolRegistry.execute
    ↓ tool.execute(input, context)
plugins/core-writing-tools/mock-generation-wrapper.tool.ts → createMockGenerationWrapperTool
    ↓ runMockGeneration(command, adapter)
workflows/mock-generation-workflow.ts → runMockGeneration
    ↓ adapter.run(command) → NovelAgentResult
    ↓ buildEventsForCommand(command, result) → NovelWorkflowEvent[]
    ↓ 返回 { result, events, durationMs }
    ↑ 回到 novel-action-dispatcher.ts
    ↓ handleGenerationResult → applyWorkflowEvents(events, mutations)
workflows/apply-workflow-events.ts → applyWorkflowEvents
    ↓ 遍历事件, switch(event.type) 调用 mutations.updateChapterContent 等
components/novel-workspace/index.tsx → createWorkspaceMutations
    ↓ ws.saveChapter / ws.saveChapterSummary / ws.saveChapterWordCount
hooks/use-novel-chapters.ts → saveChapter / saveChapterSummary
    ↓ chapterProvider.saveChapter(id, content)
providers/novel-chapter.ts → NovelChapterProvider.saveChapter
    ↓ 修改内存 Map, mockDelay
    ↑ 返回, useNovelChapters setChapters 更新本地 signal
    ↑ SolidJS 响应式触发 UI 重渲染
```

### 4.2 调用链 2：Workflow 执行（YAML 加载、解析、执行、事件产生）

```
[NovelActionDispatcher.dispatch]
    ↓ engine.execute(command) [AsyncGenerator]
workflows/engine/workflow-engine.ts → execute
    │
    ├─[1. 归一化命令]
    │   normalizeNovelCommand(command)
    │       ↓ 补齐 workspaceId/branchId/worktreeId/modelProfileId/skillId/workflowId
    │       ↓ inferSkillId: chapter.generate → 'writing', extract-info → 'info-theory'
    │       ↓ inferWorkflowId: chapter.generate → 'chapter.generate', rewrite → 'chapter.continue'
    │
    ├─[2. 解析 Workflow ID]
    │   resolveWorkflowId(normalized)
    │       ↓ COMMAND_TO_WORKFLOW 映射表 (workflow-resolver.ts 第10-19行)
    │       ↓ chapter.rewrite/expand/polish/summarize → 'chapter.continue'
    │       ↓ chapter.extract-info → 'info.extract'
    │
    ├─[3. 加载 YAML 定义]
    │   resolveBuiltinWorkflowPath → path.resolve(import.meta.dir, '..', 'yaml', '${id}.yaml')
    │   loadWorkflowDefinition(path)
    │       ↓ Bun.file(path).text()  [需 Bun 运行时]
    │       ↓ yaml.parse(text)
    │       ↓ assertDefinition: 校验 id/version/commandType/steps
    │
    ├─[4. 创建执行上下文]
    │   createExecutionContext: workflowId, commandId, workspaceId, projectId, chapterId...
    │   buildVariables: 把 command 字段 + payload 展开为 variables
    │
    ├─[5. 逐步执行 Steps] (for...of)
    │   对每个 step:
    │   ├─ yield { stepId, status: 'started' }
    │   ├─ interpolateInputs: {{projectId}} → variables.projectId (模板替换)
    │   ├─ registry.execute(step.tool, inputs, toolContext)
    │   │       ↓ 根据 step.tool 名称查找已注册 Tool
    │   │       ↓ tool.execute(inputs, ctx) → ToolResult
    │   ├─ if success:
    │   │   ├─ yield { stepId, status: 'completed', output: data }
    │   │   ├─ context.stepResults[step.id] = data
    │   │   └─ applyStepOutputs: 把 data 字段映射到 variables (step.outputs 配置)
    │   └─ if failed:
    │       ├─ yield { stepId, status: 'failed', error }
    │       └─ if !continueOnError: throw WorkflowExecutionError
    │
    └─[6. 工作流完成]
        yield { stepId: 'workflow-completed', status: 'completed', output: finalResult }
```

### 4.3 调用链 3：LLM 调用（Real LLM 请求构建、发送、流式解析、错误处理）

```
[显式请求 real-llm adapter]
    ↓ router.route('real-llm', command, context, gates)
adapters/adapter-router.ts → createAdapterRouter.route
    ↓ 双 gate 校验: realLLMEnabled && targetLLMAdapterEnabled
    ↓ 返回 RealLLMExecutionAdapter 或 ADAPTER_DISABLED 错误
    ↓
adapters/real-llm-adapter.ts → RealLLMExecutionAdapter
    │
    ├─[非流式 execute]
    │   ├─ assertRealLLMExecutionAllowed(gates) [双 gate 校验]
    │   ├─ requestId = crypto.randomUUID()
    │   ├─ buildLLMRequest(requestId, command, context, { stream: false })
    │   │       ↓ buildPrompt: chapter.generate → "请为{genre}生成一段开头..."
    │   │       ↓ buildMetadata: projectId/chapterId/branchId/modelProfileId
    │   │       ↓ 返回 LLMRequest { prompt, systemPrompt, stream:false, timeoutMs:30000 }
    │   ├─ if dryRun: 返回预览文本（不调用 API）
    │   ├─ client.complete(llmRequest)
    │   │       ↓
    │   │   llm/target-llm-client.ts → createTargetLLMClient.complete
    │   │       ├─ Promise.race([transport.complete(request), timeoutPromise])
    │   │       │   ↓ 超时 → LLMError('LLM_REQUEST_TIMEOUT')
    │   │       │   ↓ 网络错误 → LLMError('LLM_NETWORK_ERROR')
    │   │       └─ transport.complete(request)
    │   │           ↓
    │   │       llm/deepseek-transport.ts → createDeepSeekTransport.complete
    │   │           ├─ POST {baseURL}/chat/completions
    │   │           │   headers: Authorization: Bearer {apiKey}
    │   │           │   body: { model, messages:[system,user], stream:false, temperature, max_tokens }
    │   │           ├─ if !response.ok → LLMError('LLM_PROVIDER_ERROR')
    │   │           ├─ body.error → LLMError('LLM_PROVIDER_ERROR')
    │   │           └─ 返回 LLMResponse { text: choice.message.content, usage }
    │   ├─ logSafe(requestId, prompt, response.text, undefined) [脱敏日志]
    │   └─ 返回 AdapterExecutionResult { success:true, result: NovelAgentResult }
    │
    └─[流式 executeStream] (AsyncGenerator)
        ├─ assertLLMStreamingAllowed(gates) [三 gate 校验: realLLM + adapter + streaming]
        ├─ if !allowed: yield { type:'llm.request.failed', errorCode, error }; return
        ├─ buildLLMRequest(requestId, command, context, { stream: true })
        ├─ if dryRun: yield started → yield tokenDelta(预览) → yield completed; return
        ├─ for await (event of client.stream(llmRequest))
        │       ↓
        │   client.stream → transport.stream (deepseek-transport.ts 第187行)
        │       ├─ POST with stream:true
        │       ├─ yield createLLMRequestStartedEvent
        │       ├─ reader = response.body.getReader()
        │       ├─ while loop: decoder.decode → split('\n') → parseSSEDataLine
        │       │   ├─ data === '[DONE]' → yield completed; return
        │       │   ├─ JSON.parse(data) → DeepSeekStreamLine
        │       │   ├─ choice.delta.content → yield createLLMTokenDeltaEvent
        │       │   ├─ choice.delta.reasoning_content → yield createLLMReasoningDeltaEvent
        │       │   └─ choice.finish_reason → yield completed; return
        │       └─ finally: reader.releaseLock()
        ├─ events.push(event); yield event [透传给上层]
        ├─ text = collectLLMText(events) [累加 token.delta]
        └─ logSafe(requestId, prompt, text, undefined)
```

### 4.4 调用链 4：Plugin/Tool（注册、被 workflow 调用、返回结果）

```
[注册阶段 - 引擎初始化时]
workflows/engine/workflow-engine.ts → createNovelWorkflowEngine
    ↓ registry = createBuiltinNovelToolRegistry(adapter)
plugins/builtin-novel-tools.ts → createBuiltinNovelToolRegistry
    ├─ createNovelToolRegistry()  [创建空 Map]
    ├─ registry.register(createMockGenerationWrapperTool(adapter))
    ├─ registry.register(createContextAssembleTool())
    ├─ registry.register(createBuildWorkflowEventsTool())
    ├─ registry.register(createInfoExtractPlaceholderTool())
    ├─ registry.register(createInfoTheoryAuditTool())
    └─ registry.register(createAgentRunTool())

[执行阶段 - workflow step 调用]
workflow-engine.ts → registry.execute(step.tool, inputs, toolContext)
    ↓
plugins/novel-tool-registry.ts → NovelToolRegistry.execute
    ├─ tool = tools.get(name)
    ├─ if !tool: return { success:false, errorCode:'TOOL_NOT_FOUND' }
    ├─ try: return await tool.execute(input, context)
    └─ catch: return { success:false, errorCode:'TOOL_EXECUTION_FAILED' }
```

---

## 五、数据流

### 5.1 数据流 1：项目数据流（同步加载 + 响应式）

```
mock-data/projects.ts (mockProjects)
    ↓ [初始化]
providers/novel-project.ts → NovelProjectProvider (内存 Map)
    ↓ listProjects() / getProject(id) [Promise + mockDelay]
hooks/use-novel-project.ts → useNovelProject
    ├─ createResource(projectId, getProject)  [SolidJS 异步资源]
    ├─ createResource(projectId, listProjects)
    └─ filteredProjects() [createMemo 派生]
    ↓
hooks/use-workspace.ts → useWorkspace (组合 useNovelProject + useNovelChapters)
    ↓ project, projectId
components/novel-workspace/workspace-view-model.ts → createWorkspaceViewModel
    ↓ projectTitle() = ws.project()?.name
components/novel-workspace/index.tsx → Workspace 组件
    ↓ props 传递
UI 渲染
```

**方式**：异步 Promise + SolidJS createResource（自动响应 projectId 信号变化重新加载）

### 5.2 数据流 2：章节数据流（手动 signal + createEffect）

```
mock-data/chapters.ts (mockChapters)
    ↓
providers/novel-chapter.ts → NovelChapterProvider (内存 Map)
    ↓ listChapters(projectId) / saveChapter / saveChapterSummary 等 [Promise + mockDelay]
hooks/use-novel-chapters.ts → useNovelChapters
    ├─ [chapters, setChapters] = createSignal<Chapter[]>([])  [手动 signal]
    ├─ createEffect(() => void loadChapters())  [projectId 变化自动加载]
    ├─ selectedChapter = createMemo(...)  [派生选中章节]
    └─ saveChapter: provider.saveChapter → setChapters(更新本地) [乐观更新]
    ↓
hooks/use-workspace.ts → useWorkspace
    ↓ chapters, selectedChapter, saveChapter...
components/novel-workspace/workspace-view-model.ts
    ├─ outlineChapters() [合并 Hook 数据 + 本地 UI 状态]
    ├─ currentChapterTitle/WordCount/Summary [派生]
    └─ currentParagraphs = createMemo [拆分段落]
    ↓
UI 渲染
```

**方式**：异步 Promise + SolidJS createSignal（手动管理）+ createEffect（响应式触发）+ createMemo（派生计算）

### 5.3 数据流 3：工作流结果数据流（事件驱动写回）

```
[Workflow Engine 产出]
    NovelAgentResult { taskId, status, text, wordCount, summary, informationState }
    NovelWorkflowEvent[] { type:'chapter.generated', chapterId, content, wordCount, summary... }
    ↓
[mock-generation-workflow.ts] buildEventsForCommand
    ↓ 根据 result 构建多种事件:
    ├─ chapter.generated (正文+摘要+字数+信息状态)
    ├─ information.assessed (审计分数+熵变+原子/链接数)
    ├─ chapter.extracted (角色+世界物品+关键事件+主角状态)
    ├─ character.updated (角色 ID 列表)
    ├─ world.referenced (世界物品 ID 列表)
    ├─ achievement.progressed (成就 ID + delta)
    └─ profile.stats.updated (字数/生成数/积分 delta)
    ↓
[novel-action-dispatcher.ts] handleGenerationResult
    ↓ applyWorkflowEvents(events, mutations)
[apply-workflow-events.ts] applyWorkflowEvents
    ↓ switch(event.type) → mutations.updateChapterContent/Summary/WordCount/...
[components/novel-workspace/index.tsx] createWorkspaceMutations
    ↓ ws.saveChapter / ws.saveChapterSummary / ws.saveChapterInformationState
[hooks/use-novel-chapters.ts]
    ↓ provider.saveChapter → setChapters(更新本地 signal)
    ↓ SolidJS 响应式触发 UI 重渲染
```

**方式**：批量事件 + 同步遍历 + 显式 mutations 注入（无全局状态）

### 5.4 数据流 4：LLM 流式数据流（AsyncIterator）

```
[DeepSeek API SSE 响应]
    ↓ HTTP chunked transfer
[deepseek-transport.ts] stream()
    ↓ reader.read() → TextDecoder.decode → split('\n')
    ↓ parseSSEDataLine → JSON.parse
    ↓ yield LLMStreamEvent { type:'llm.token.delta', text }
    ↓
[target-llm-client.ts] stream()
    ↓ yield* transport.stream(request) [透传]
    ↓
[real-llm-adapter.ts] executeStream()
    ↓ events.push(event); yield event [透传 + 累积]
    ↓
[调用方] for await (const event of adapter.executeStream(...))
    ↓ collectLLMText(events) [累加 token.delta]
    ↓ UI 消费统一事件协议
```

**方式**：AsyncGenerator（流式）+ 事件累积（批量收集）

---

## 六、通讯方式

| 层级之间 | 通讯方式 | 说明 |
|---------|---------|------|
| UI → ViewModel | **直接调用（回调函数）** | `onClick={() => props.onStartGeneration}` → `vm.submitChapterGenerationTask()` |
| ViewModel → Hook | **直接调用（async 函数）** | `workflow.runChapterGeneration({...})` 返回 Promise |
| Hook → Action Dispatcher | **Promise** | `dispatch(input): Promise<NovelActionResult>` |
| Action Dispatcher → Workflow Engine | **AsyncIterator（for await...of）** | `engine.execute(command)` 是 AsyncGenerator，逐步 yield WorkflowStepResult |
| Workflow Engine → Tool Registry | **Promise** | `registry.execute(name, input, ctx): Promise<ToolResult>` |
| Tool Registry → Tool | **Promise** | `tool.execute(input, context): Promise<ToolResult>` |
| Tool → Adapter | **Promise / AsyncGenerator** | `adapter.execute()` 返回 Promise；`adapter.executeStream()` 返回 AsyncGenerator |
| Adapter → LLM Client | **Promise / AsyncGenerator** | `client.complete()` 返回 Promise；`client.stream()` 返回 AsyncGenerator |
| LLM Client → Transport | **Promise / AsyncGenerator** | 同上，透传 |
| Workflow Events → Store | **事件回调（显式注入 mutations）** | `applyWorkflowEvents(events, mutations)` 遍历事件调用 mutations 方法 |
| Provider → Hook | **Promise（异步）** | `provider.listChapters(): Promise<Chapter[]>` |
| Hook → UI | **SolidJS Signals（响应式）** | `createSignal` / `createResource` / `createMemo` 自动触发重渲染 |
| FakeAgent → useAITask | **事件订阅（回调）** | `agentProvider.onTaskUpdate(callback)` 返回 unsubscribe |

---

## 七、状态管理

### 7.1 Hooks 之间的状态共享方式

```
useWorkspace (组合 Hook)
    ├─ useNovelProject
    │   ├─ projectId signal
    │   ├─ project resource
    │   └─ projectsResource
    ├─ useNovelChapters(projectId)
    │   ├─ chapters signal
    │   ├─ selectedChapterId signal
    │   ├─ selectedChapter memo
    │   └─ loading/error signal
    ├─ visiblePanels signal
    └─ isLogDrawerOpen signal

useNovelWorkflow(mutations) [独立 Hook，通过 mutations 与 useWorkspace 连接]
    ├─ currentTask signal
    ├─ isRunning signal
    ├─ error signal
    ├─ currentInfoState signal
    └─ lastActionInput (普通变量，非 signal)
```

**关键设计**：
1. **组合模式**：`useWorkspace` 内部调用 `useNovelProject` 和 `useNovelChapters`，向上暴露统一接口
2. **依赖注入**：`useNovelWorkflow(mutations)` 接收 `WorkflowMutations`，由 `Workspace` 组件通过 `createWorkspaceMutations(ws)` 构造注入，实现工作流结果写回到 chapter store
3. **ViewModel 桥接**：`createWorkspaceViewModel(ws, workflow)` 同时接收两个 Hook 的返回值，在 ViewModel 层合并 UI 状态与业务状态
4. **本地 UI 状态隔离**：`chapterUiState`（展开/收藏）、`generationConfig`（生成参数）、`contextOptions`（上下文选项）等纯 UI 状态由 ViewModel 自行管理，不污染 Hook

---

## 八、安全评估

### 8.1 安全风险清单

#### 高风险

**[H-1] 流式请求缺少超时保护**
- **位置**：[llm/target-llm-client.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/llm/target-llm-client.ts) 第 113-125 行
- **说明**：`complete()` 方法通过 `Promise.race` 实现了 30s 超时，但 `stream()` 方法没有任何超时保护。一个慢速或挂起的 SSE 流会导致请求无限期挂起，可能造成资源耗尽。
- **影响**：DoS 风险，连接泄漏。

**[H-2] LLMRequest.signal（AbortSignal）未被传递使用**
- **位置**：[llm/llm-request-types.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/llm/llm-request-types.ts) 第 64 行、`target-llm-client.ts`、`deepseek-transport.ts`
- **说明**：`LLMRequestOptions` 定义了 `signal?: AbortSignal` 字段，但 `createTargetLLMClient` 和 `createDeepSeekTransport` 均未将该 signal 传递给底层 `fetch`。请求无法被取消，用户无法主动中止正在进行的 LLM 调用。
- **影响**：用户无法取消长耗时请求；超时后底层 fetch 仍悬挂（floating promise）。

#### 中风险

**[M-1] 工作流路径解析缺少路径遍历防护**
- **位置**：[workflows/engine/workflow-resolver.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/workflows/engine/workflow-resolver.ts) 第 37-44 行
- **说明**：`getBuiltinWorkflowPath()` 直接拼接 `workflowId` 到路径：`path.resolve(import.meta.dir, '..', 'yaml', '${workflowId}.yaml')`。若 `workflowId` 包含 `../` 或绝对路径，可逃逸 `yaml` 目录。当前 `workflowId` 来源受控（`COMMAND_TO_WORKFLOW` 固定映射或 `inferWorkflowId` 固定返回值），但缺少显式格式校验（如白名单 `/^[a-z.-]+$/`）。
- **影响**：当前风险低，但一旦未来允许外部传入 workflowId，存在路径遍历读取任意 YAML 文件的风险。

**[M-2] 供应商错误响应体可能泄露敏感信息**
- **位置**：[llm/deepseek-transport.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/llm/deepseek-transport.ts) 第 158-163 行、第 191-197 行
- **说明**：HTTP 错误时将 `bodyText.slice(0, 200)` 拼入错误消息。虽然截断到 200 字符，但供应商错误响应可能包含请求 echo、内部端点信息或部分密钥回显。该消息会经 `LLMError` 向上传递，最终可能到达 UI。
- **影响**：信息泄露（受限）。

**[M-3] 无请求/响应大小限制**
- **位置**：`deepseek-transport.ts`、`target-llm-request-builder.ts`
- **说明**：`buildPrompt()` 直接将 `command.text` 拼入 prompt，无长度上限校验。`maxTokens` 仅限制响应 token 数，不限制请求体大小。流式响应通过 `reader.read()` 持续读取，无累计字节上限。
- **影响**：超大 prompt 导致费用失控；超大响应导致内存压力。

**[M-4] 无 LLM 请求速率限制**
- **位置**：整个 llm/ 与 adapters/ 模块
- **说明**：没有任何速率限制（rate limiting）或并发控制机制。Bug 或恶意输入可短时间内发起大量真实 API 调用，导致配额耗尽或费用失控。
- **影响**：费用风险、配额耗尽。

**[M-5] Action Dispatcher 缺少运行时类型校验**
- **位置**：[actions/novel-action-dispatcher.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/actions/novel-action-dispatcher.ts) 第 133-193 行
- **说明**：`buildNovelCommand()` 使用 `as number`、`as string`、`as string[]` 等类型断言直接转换 `input.payload` 字段，无运行时校验。若 UI 传入错误类型（如 `targetWordCount: "abc"`），会静默传递到下游。
- **影响**：类型错误导致下游异常，难以定位。

#### 低风险

**[L-1] Prompt 注入风险（LLM 固有）**
- **位置**：[llm/target-llm-request-builder.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/llm/target-llm-request-builder.ts) 第 41-63 行
- **说明**：`buildPrompt()` 直接将 `command.text` 嵌入用户 prompt，无任何内容过滤或分隔符隔离。这是 LLM 应用的固有风险，但当前未做任何缓解（如系统提示加固、输入清洗）。

**[L-2] 错误消息包含用户输入**
- **位置**：`workflows/engine/workflow-engine.ts` 第 184-186 行、`chat-debug/novel-debug-command-parser.ts` 第 70 行
- **说明**：`WorkflowExecutionError` 消息包含 `step.tool` 名称；调试解析器错误消息包含 `commandType`。这些是受控字段，风险低，但原则上应避免直接回显输入。

**[L-3] types/sandbox.ts 并非安全沙箱**
- **位置**：[types/sandbox.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/types/sandbox.ts)
- **说明**：`Sandbox` 接口只是小说世界观的数据模型（worldRules、locations、timeline 等），不是执行隔离沙箱。Adapter 之间共享同一运行时，无进程级隔离。

**[L-4] Precommit 仅检查暂存文件**
- **位置**：`scripts/novel-precommit-check.ts` 第 248-258 行、第 128-147 行
- **说明**：`checkClientSideSecrets`、`checkLLMEndpoints` 等增量检查仅扫描 `git diff --cached` 的文件。已提交的历史文件不会被复查；测试文件（`.test.ts`/`.spec.ts`）被跳过。

### 8.2 密钥管理评估（优秀）

| 维度 | 评估 | 说明 |
|------|------|------|
| 前端不持有密钥 | 优秀 | `llm-secret-policy.ts` 明确声明"前端源码不持有真实 API Key"；`deepseek-transport.ts` 注释"本文件不读取 process.env" |
| 密钥注入方式 | 优秀 | API Key 通过 `DeepSeekTransportOptions.apiKey` 由外部受控环境注入，不读 `process.env` |
| 硬编码检测 | 优秀 | `CLIENT_SIDE_SECRET_RISK_PATTERNS` 检测 4 类模式；precommit 脚本强制拦截 |
| 密钥长度校验 | 良好 | `deepseek-transport.ts` 第 104 行校验 `apiKey.length < 8` 抛 `LLM_SECRET_MISSING` |
| HTTPS 使用 | 优秀 | `DEEPSEEK_API_BASE_URL = 'https://api.deepseek.com'` 强制 HTTPS |
| Authorization 头构造 | 良好 | `buildHeaders()` 使用 `Bearer ${apiKey}`，不在 URL 中传递密钥 |
| 密钥不落盘 | 优秀 | Transport 不记录完整请求/响应 |
| 日志脱敏 | 优秀 | `maskSecret()` 遮蔽 `sk-*`、`Bearer *`、`api_key=*` 三类模式 |
| Preview 截断 | 优秀 | prompt 仅保留前 80 字符，response 前 120 字符 |
| 完整 prompt 日志拦截 | 优秀 | precommit `FULL_PROMPT_LOGGING_PATTERNS` 拦截 `console.log(prompt/responseText)` |

### 8.3 特性门控评估（优秀）

| 维度 | 评估 | 说明 |
|------|------|------|
| 默认关闭 | 优秀 | `createDefaultNovelFeatureGates()` 和 `createDefaultRealLLMFeatureGates()` 所有真实 LLM gate 默认 `false` |
| 双 gate 机制 | 优秀 | `isRealLLMExecutionAllowed()` 要求 `realLLMEnabled && targetLLMAdapterEnabled` 同时为 true |
| 三 gate 流式 | 优秀 | `isLLMStreamingAllowed()` 在双 gate 基础上额外要求 `llmStreamingEnabled` |
| AdapterRouter 强制校验 | 优秀 | `adapter-router.ts` 第 74-86 行对 `real-llm` 强制双 gate 检查 |
| RealLLMAdapter 二次校验 | 优秀 | `real-llm-adapter.ts` 第 81 行 `execute()` 和第 160 行 `executeStream()` 调用前再次校验 |
| 禁用不 fallback | 优秀 | Router 明确不 fallback 到 mock，避免伪成功 |
| 默认 transport 禁用 | 优秀 | `disabledLLMTransport` 默认抛 `CLIENT_STUB_ONLY` |

---

## 九、边界处理评估

### 9.1 输入验证

| 维度 | 评估 | 说明 |
|------|------|------|
| 命令类型白名单 | 良好 | `novel-action-dispatcher.ts` 用 `YAML_ACTIONS` Set 严格过滤；`novel-debug-command-parser.ts` 用 `SUPPORTED_DEBUG_TYPES` 数组校验 |
| 必填字段校验 | 良好 | 调试解析器强制要求 `projectId`、`chapterId` |
| Adapter 类型校验 | 良好 | `parseAdapterKind()` 严格匹配 4 种已知类型 |
| 运行时类型校验 | 不足 | Dispatcher 大量使用 `as` 断言，无运行时校验（见 M-5） |
| Payload 内容校验 | 不足 | `command.text`、`targetWordCount` 等无长度/范围校验（见 M-3） |
| 模板变量插值 | 良好 | `interpolateInputs()` 用 `\{\{(\w+)\}\}` 正则，仅匹配单词字符，无代码注入风险 |

### 9.2 错误处理

| 维度 | 评估 | 说明 |
|------|------|------|
| 错误类型结构化 | 优秀 | `LLMError` 含 14 种错误码；`WorkflowEngineError` 含 3 种子类；`ProviderError` 含 6 种码 |
| 未捕获 Promise | 良好 | Dispatcher、Adapter、Client 均有 try/catch 包裹；流式有 try/finally 释放 reader |
| 错误信息脱敏 | 良好 | `toSafeLLMErrorMessage()` 避免泄露对象内部；`maskSecret()` 遮蔽密钥 |
| 错误信息泄露 | 中等 | 供应商错误体截断后入消息（见 M-2）；工作流错误含工具名（见 L-2） |
| 流式错误兜底 | 良好 | DeepSeek transport 流结束未收到 `[DONE]` 时兜底发送 completed 事件 |

### 9.3 超时控制

| 维度 | 评估 | 说明 |
|------|------|------|
| 非流式超时 | 良好 | `createTargetLLMClient.complete()` 用 `Promise.race` + `setTimeout` 实现 30s 默认超时 |
| 流式超时 | 缺失 | `stream()` 无超时保护（见 H-1） |
| 请求取消 | 缺失 | `AbortSignal` 定义但未使用（见 H-2） |
| Precommit 超时 | 良好 | `runCommand()` 设置 180s 超时 |

### 9.4 重试机制

| 维度 | 评估 | 说明 |
|------|------|------|
| LLM 请求重试 | 缺失 | Transport 和 Client 均无自动重试；失败直接抛错 |
| 建议 | - | 对幂等请求（如 5xx、网络超时）可引入指数退避重试，但对 4xx 不应重试 |

### 9.5 错误传播机制

```
[LLM Transport 层]
    ↓ 抛出 LLMError (结构化错误码: LLM_REQUEST_TIMEOUT / LLM_NETWORK_ERROR / LLM_PROVIDER_ERROR / ...)
    ↓ toSafeLLMErrorMessage(error) [脱敏处理]
    ↓
[LLM Client 层]
    ↓ 捕获 transport 异常，包装为 LLMError 或透传
    ↓ Promise.race 超时 → LLMError('LLM_REQUEST_TIMEOUT')
    ↓
[Real LLM Adapter 层]
    ↓ try/catch 捕获 LLMError
    ↓ 返回 AdapterExecutionResult { success:false, errorCode, error }
    ↓ 或流式: yield { type:'llm.request.failed', errorCode, error }
    ↓
[Adapter Router 层]
    ↓ Gate 校验失败 → AdapterRouterError { success:false, errorCode:'ADAPTER_DISABLED'/'ADAPTER_NOT_FOUND' }
    ↓ 不 fallback 到 mock（避免伪成功）
    ↓
[Tool 层]
    ↓ 捕获异常，返回 ToolResult { success:false, errorCode:'TOOL_EXECUTION_FAILED'/... }
    ↓
[Workflow Engine 层]
    ↓ Tool 失败 → yield { stepId, status:'failed', error }
    ↓ if !step.continueOnError → throw WorkflowExecutionError
    ↓
[Action Dispatcher 层]
    ↓ 捕获 WorkflowExecutionError
    ↓ 返回 NovelActionResult { success:false, errorCode:'WORKFLOW_EXECUTION_FAILED'/... }
    ↓ 统一结构化返回，不抛未捕获异常
    ↓
[Hook 层 (useNovelWorkflow)]
    ↓ if !actionResult.success → setError(msg); throw new Error(msg)
    ↓ error signal 更新
    ↓ finally: setIsRunning(false)
    ↓
[UI 层]
    ↓ 显示错误信息 / 进度面板状态更新
```

### 9.6 错误码层级对照表

| 层级 | 错误码示例 | 含义 |
|------|----------|------|
| LLM | `LLM_REQUEST_TIMEOUT` | 请求超时 |
| LLM | `LLM_NETWORK_ERROR` | 网络错误 |
| LLM | `LLM_PROVIDER_ERROR` | 供应商 API 错误 |
| LLM | `CLIENT_STUB_ONLY` | 未注入真实 transport |
| LLM | `REAL_LLM_NOT_ENABLED` | Gate 未开启 |
| Adapter | `ADAPTER_DISABLED` | Gate 关闭 |
| Adapter | `ADAPTER_NOT_FOUND` | adapter 未注册 |
| Tool | `TOOL_NOT_FOUND` | 工具未注册 |
| Tool | `TOOL_EXECUTION_FAILED` | 工具执行异常 |
| Tool | `MISSING_COMMAND` | 缺少 NovelCommand |
| Workflow | `WORKFLOW_EXECUTION_FAILED` | 工作流执行失败 |
| Action | `NOT_SUPPORTED_ACTION` | 未接入 YAML Engine 的动作 |
| Action | `DISPATCHER_ERROR` | Dispatcher 内部异常 |
| Action | `INVALID_GENERATION_RESULT` | 生成结果无效 |
| Provider | `NOT_FOUND` | 资源不存在 |
| Provider | `INVALID_INPUT` | 输入校验失败 |

---

## 十、代码质量

### 10.1 文件行数报告（100% 合规）

**结论：所有代码文件均未超过 500 行限制，合规。**

#### 接近限制的文件（需关注，建议预防性拆分）

| 文件路径 | 行数 | 占限制比 | 风险 |
|---------|------|---------|------|
| `workflows\mock-generation-workflow.test.ts` | 474 | 95% | 测试文件，继续增长将超限 |
| `hooks\use-novel-workflow.ts` | 443 | 89% | 核心 Hook，含 4 个异步方法 + 类型映射，最易超限 |
| `components\create-project-modal\index.tsx` | 406 | 81% | 单组件 14 个 createSignal，表单逻辑集中 |
| `adapters\mock-agent-adapter.ts` | 389 | 78% | Mock 适配器，含多命令分支 |
| `components\novel-workspace\workspace-view-model.ts` | 345 | 69% | ViewModel，含 fallback 逻辑 |
| `components\novel-editor\index.tsx` | 324 | 65% | 编辑器主组件 |
| `chat-debug\novel-debug-command-runner.ts` | 287 | 57% | 调试命令执行器 |
| `llm\deepseek-transport.ts` | 283 | 57% | LLM 传输层 |

### 10.2 TypeScript 类型质量

#### 问题 1：`as any` 滥用（生产代码）

**位置**：[hooks/use-ai-log.ts:22,26](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/hooks/use-ai-log.ts)
```typescript
type: task.type as any,        // line 22: string 强转为联合类型
} as any;                       // line 26: 整个对象逃逸类型检查
```
**问题**：`addLog` 函数接收松散类型的 task 对象，用 `as any` 绕过类型检查构造 mockTask。这使 AITask 的类型约束形同虚设。

#### 问题 2：`throw {...} as ProviderError` 反模式（13 处，严重）

**位置**：
- [providers/novel-chapter.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/providers/novel-chapter.ts)：10 处（lines 30, 44, 53, 62, 71, 80, 89, 101, 106）
- [providers/fake-agent.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/providers/fake-agent.ts)：2 处（lines 104, 118）
- [providers/novel-character.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/providers/novel-character.ts)：1 处（line 28）

**示例**：
```typescript
throw { code: 'NOT_FOUND', message: `Chapter ${id} not found` } as ProviderError;
```
**问题**：
1. 抛出的是普通对象而非 `Error` 实例，丢失 stack trace
2. `instanceof Error` 检查会失败，上游 catch 无法区分错误类型
3. `as ProviderError` 是类型断言而非类型守卫，运行时对象并不真正满足 ProviderError 接口

#### 问题 3：action result 类型过松导致重复 `as` 断言（6 处）

**位置**：[hooks/use-novel-workflow.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/hooks/use-novel-workflow.ts)（lines 259, 260, 310, 311, 413, 414）、`actions/novel-action-dispatcher.ts:219`
```typescript
const result = actionResult.result as NovelAgentResult;       // 重复 3 次
const events = (actionResult.events ?? []) as NovelWorkflowEvent[];  // 重复 3 次
```
**问题**：`actionResult.result` 类型为 `unknown`，每个消费点都需 `as` 断言。应在 `NovelActionResult` 类型定义层用泛型或判别联合收窄类型。

#### 问题 4：字符串到联合类型的无验证断言（18 处）

**位置**：
- `chat-debug/novel-debug-command-runner.ts`：12 处 `'status' as NovelDebugRunStatus`
- `chat-debug/novel-debug-command-parser.ts`：6 处 `as DebugCommandType` / `as AIWritingCommand`

**问题**：将用户输入的字符串 token 直接断言为联合类型，无运行时校验。

#### 问题 5：外部 JSON 解析无运行时校验

**位置**：[llm/deepseek-transport.ts:166,237](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/llm/deepseek-transport.ts)
```typescript
const body = (await response.json()) as DeepSeekCompletionResponse;  // 无校验
parsed = JSON.parse(data) as DeepSeekStreamLine;                      // 无校验
```
**问题**：对外部 API 响应直接断言类型，无 schema 验证。建议引入 zod 或手动守卫。

### 10.3 测试覆盖评估

**统计**：
- 测试文件数：46 个 `.test.ts`
- 源文件数：约 90 个 `.ts`/`.tsx`（不含 test/types/mock-data）
- 文件级覆盖比：约 51%
- 文档基线：`p2-final-acceptance.md` 记录 `bun test src/novel` 260 pass / 0 fail

#### 覆盖盲区

| 盲区 | 严重度 | 说明 |
|------|--------|------|
| `components\` 全目录 | 高 | 所有 `.tsx` 组件 0 测试（bookshelf/editor/workspace/profile 等） |
| `hooks\use-novel-workflow.ts` | 高 | 443 行核心 Hook，4 个异步方法，0 测试 |
| `services\` | 中 | context-assembler.ts（170 行）、genre-prompt-template.ts 无测试 |
| `workflows\apply-workflow-events.ts` | 中 | 事件写回逻辑无测试 |
| `hooks\use-chapter-editor.ts` | 中 | 编辑器状态 Hook 无测试 |
| E2E / 集成测试 | 中 | 全目录无 e2e/integration/playwright 文件 |
| `adapters\` 实现类 | 低 | claudecode/opencode/mock-execution-adapter 无测试（仅 router 有测试） |

### 10.4 代码风格问题

#### 问题 1：生产代码残留调试日志（8 处）

**位置**：
- `components\novel-workspace\workspace-view-model.ts`：6 处 console.info/warn（lines 265, 268, 271, 274, 276, 288）
- `adapters\real-llm-adapter.ts:224`：console.log
- `adapters\mock-agent-adapter.ts:197`：console.info

**问题**：`workspace-view-model.ts` 的 6 处日志明显是调试遗留（含 `[Workspace-VM]` 前缀和 `EXISTS`/`NULL` 等调试标记），应移除或改用正式 logger。

### 10.5 SolidJS 实践问题

#### 问题 1：零 createStore，多相关 createSignal 散落（系统性）

**全项目 `createStore` 使用次数：0**

| 文件 | createSignal 数 | 应聚合状态 |
|------|----------------|-----------|
| `create-project-modal\index.tsx` | 14 | 表单状态应为一个 store |
| `hooks\use-novel-workflow.ts` | 4 | currentTask/isRunning/error/currentInfoState 强相关 |
| `hooks\use-chapter-editor.ts` | 5 | content/status/fullscreen/toolbar 可见性/位置 |
| `components\novel-editor\index.tsx` | 6 | drawer/saving/title/content/wordCount/infoState |
| `components\novel-workspace\workspace-view-model.ts` | 3 | chapterUi/generationConfig/contextOptions |
| `hooks\use-novel-chapters.ts` | 4 | selectedChapterId/chapters/loading/error |

**影响**：相关状态分散在多个 signal 中，更新时无法原子化，易出现中间不一致状态；且违背 SolidJS 官方推荐的 store 模式。

#### 问题 2：未清理的 setTimeout（内存泄漏风险）

**位置**：[components/novel-editor/chapter-info-panel.tsx:49](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/chapter-info-panel.tsx)
```typescript
setTimeout(() => setReExtracting(false), 1200);
```
**问题**：组件卸载时若 1200ms 未到，回调仍会触发 `setReExtracting`，指向已卸载组件的 signal。应保存 timer ID 并在 `onCleanup` 中 `clearTimeout`。

### 10.6 错误处理问题

#### 问题 1：静默吞错误的 Promise（严重）

**位置**：[components/novel-editor/index.tsx:108](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/index.tsx)
```typescript
createEffect(() => {
  const ch = chaptersHook.selectedChapter();
  if (ch) {
    runInfoExtractForChapter(ch.orderIndex).catch(() => {});  // 完全吞掉错误
  }
});
```
**问题**：自动触发信息提取时，所有错误（网络/类型/业务）被 `.catch(() => {})` 静默吞掉。用户无法感知提取失败，调试时也无法看到错误。

#### 问题 2：catch 块仅含注释（2 处）

**位置**：`components\novel-editor\index.tsx:139, 171`
```typescript
} catch {
  // 错误已在 useNovelWorkflow 内部记录，UI 不需要额外处理
}
```
**问题**：虽然注释说明了理由，但 catch 块本身无任何动作。若 `useNovelWorkflow` 的错误处理逻辑变更，此处会变成静默失败。

### 10.7 文档与注释（优秀）

- `docs\phase-p2\`：8 个文档（验收基准/注释规范/commit 检查/feature gate/接口契约/差距报告等）
- `docs\phase-p3\`：6 个文档（LLM 密钥策略/流式协议/试点范围/就绪检查/手动测试等）
- `p2-final-acceptance.md` 透明记录了已知风险与技术债务
- JSDoc 覆盖率高，尤其 llm/、adapters/、chat-debug/ 模块几乎每个导出都有中文注释
- 代码中 0 处 TODO/FIXME

---

## 十一、改进建议（按优先级）

### P0（应立即修复）

1. **修复 `throw {...} as ProviderError` 反模式**
   - 创建 `ProviderError` 类继承 `Error`，在 providers 中 `throw new ProviderError('NOT_FOUND', message)`
   - 影响：novel-chapter.ts / fake-agent.ts / novel-character.ts 共 13 处

2. **修复静默吞错误 Promise**
   - `novel-editor\index.tsx:108`：将 `.catch(() => {})` 改为 `.catch((e) => console.warn('[InfoExtract] failed', e))` 或设置 error 状态

3. **修复流式请求超时保护（H-1）**
   - 在 `createTargetLLMClient` 的 `stream()` 方法中引入"空闲超时"（两个事件之间的最大间隔）

4. **实现 AbortSignal 传递（H-2）**
   - 将 `LLMRequestOptions.signal` 传递给 `fetch`，UI 层提供取消按钮

### P1（应尽快修复）

5. **移除 `use-ai-log.ts` 的 `as any`**
   - 为 `addLog` 定义准确的输入类型接口，或用类型守卫收窄

6. **收窄 `NovelActionResult` 类型**
   - 将 `result: unknown` 改为判别联合或泛型，消除 use-novel-workflow.ts 中 6 处 `as` 断言

7. **清理 `workspace-view-model.ts` 的 6 处调试 console 日志**

8. **修复 `chapter-info-panel.tsx:49` 未清理的 setTimeout**
   - 保存 timer ID，在 `onCleanup` 中 `clearTimeout`

9. **打破类型循环依赖（A1）**
   - 将 `AdapterKind` 提取到 `types/adapter-kind.ts`

10. **供应商错误体脱敏（M-2）**
    - 在 `deepseek-transport.ts` 错误处理中，对 `bodyText` 调用 `maskSecret()` 后再截断

### P2（中期改进）

11. **补充 `use-novel-workflow.ts` 单元测试**（443 行核心 Hook，0 测试）

12. **逐步将多 createSignal 迁移为 createStore**
    - 优先处理 create-project-modal（14 signals）和 use-novel-workflow（4 signals）

13. **为 `deepseek-transport.ts` 的 JSON 解析增加运行时校验**（zod 或手动守卫）

14. **为 `novel-debug-command-parser.ts` 的字符串到联合类型转换增加校验函数**

15. **请求/响应大小限制（M-3）**
    - 在 `buildLLMRequest()` 中校验 `prompt.length` 上限
    - 在流式读取中累计字节，超过阈值时中断

16. **速率限制（M-4）**
    - 在 `RealLLMExecutionAdapter` 或 `TargetLLMClient` 层引入简单的令牌桶或滑动窗口限流

17. **运行时类型校验（M-5）**
    - 在 `buildNovelCommand()` 中对 `payload.targetWordCount` 等字段做 `typeof` 校验

18. **工作流路径校验（M-1）**
    - 在 `getBuiltinWorkflowPath()` 前增加白名单校验 `/^[a-z][a-z0-9.-]*$/i`

### P3（长期改进）

19. **补充 components/ 层测试**（当前 0 覆盖）

20. **配置 Playwright E2E 测试**（文档已记录为 P3-0 待办）

21. **补充 services/ 模块测试**

22. **制定双 Adapter 接口迁移计划（A2）**
    - 逐步将 `workflow-engine` 和 `action-dispatcher` 切换到 `AgentExecutionAdapter`

23. **统一信息论类型（A3）**
    - 统一 `types/information-flow.ts` 与 `info-theory/information-types.ts`

24. **抽象 WorkflowLoader 接口（A7）**
    - 提供 Bun / fetch / inline-text 多种实现，解除 Bun 硬依赖

25. **Tool 层装配职责上移（A4）**
    - Router、Gates、Client 应由 Engine 或 Hook 层注入到 `ToolContext`

26. **Workflow Engine 强制注入 registry（A5）**
    - 移除默认硬编码创建，强制要求外部注入

27. **全局 eventLog 封装化（A6）**
    - 将 eventLog 封装到类实例或 context 中

28. **Action Dispatcher 统一入口（A8）**
    - 内部路由到 YAML Engine 或 Provider，对 UI 透明

---

## 十二、总体评价

| 维度 | 评分 | 说明 |
|------|------|------|
| 文件行数控制 | 优秀 | 100% 合规，无超限文件 |
| 类型质量 | 中等 | 导出规范，但 as any / throw 对象 / 松类型 3 类系统性问题 |
| 测试覆盖 | 中等 | 逻辑模块良好，UI 与核心 Hook 有盲区，无 E2E |
| 代码风格 | 良好 | TODO 干净，else 少，但有调试日志残留 |
| SolidJS 实践 | 中等 | 零 createStore 是系统性问题，事件清理基本到位 |
| 错误处理 | 中等 | 1 处吞错误 Promise，13 处抛非 Error 对象 |
| 文档注释 | 优秀 | 文档体系完整，JSDoc 覆盖高，技术债务透明 |
| 密钥管理 | 优秀 | 前端不持密、注入式传入、日志全脱敏 |
| 特性门控 | 优秀 | 双 gate + Router + Adapter 三层校验，默认全关闭 |
| 网络边界 | 中等 | 流式超时缺失、取消机制未实现、无大小/速率限制 |

**综合**：该模块工程治理基础扎实（行数控制、文档、注释、测试基线均到位），密钥管理与特性门控设计严谨。主要待改进点集中在类型安全（throw 对象、as 断言）、SolidJS 状态管理（零 createStore）和网络边界处理（流式超时、取消机制）三个方面。文档已诚实记录大部分技术债务，建议按 P0→P1→P2→P3 顺序逐步修复。

---

## 评审结论

**评审状态**：✅ 通过（附条件）

**通过条件**：
1. P0 级问题（4 项）必须在 Phase P3-B 启动前修复
2. P1 级问题（6 项）应在 Phase P3-B 期间修复
3. P2/P3 级问题纳入技术债务 backlog 跟踪

**阶段就绪度**：
- ✅ Phase P3-A（Real LLM Adapter Pilot）：已完成，密钥与门控安全可靠
- ⚠️ Phase P3-B（生产化）：需先修复 H-1（流式超时）、H-2（取消机制）、M-2（错误体脱敏）、M-3（大小限制）、M-4（速率限制）五项网络边界问题
- ⚠️ Phase P4+（规模化）：需补充 UI 层测试与 E2E 测试

**[READY_FOR_REVIEW]**

---

**评审 Agent**：GLM-5.2
**评审日期**：2026-06-21
**评审文件数**：200+
**子代理分析**：4 路并行（架构/调用链/安全/质量）
**评审耗时**：单次会话

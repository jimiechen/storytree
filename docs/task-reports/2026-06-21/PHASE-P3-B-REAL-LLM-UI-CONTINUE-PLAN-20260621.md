> 我是：前端工程师 / Novel 模块开发 Agent（Kimi-K2.7-Code），本次任务：Phase P3-B Real LLM UI Continue Integration 实施方案输出，职责范围：`packages/app/src/novel/`、`docs/task-reports/`、`workspaces/kimik27code/`；禁止触碰：`packages/opencode/`、`packages/sdk/`、`packages/plugin/`、`packages/desktop/`、`packages/ui/`、根目录 package.json / turbo.json / tsconfig。
> 越界操作申请：无。

# Phase P3-B：Real LLM UI Continue Integration 详细实施方案

## 1. 方案概述

### 1.1 阶段主题

将 Phase P3-A 已验证的真实 LLM Adapter Pilot（DeepSeek 官方 API、双 FeatureGate、流式回显）从 **Chat Debug 试点**接入到 **AI 续写主 UI**，使编辑器中的「AI 续写」按钮在 gate 开启时走真实 LLM，gate 关闭时仍走 mock，过程可观察、结果需确认、失败结构化。

### 1.2 阶段目标

1. AI 续写按钮触发 `chapter.continue` 工作流。
2. `chapter.continue` 工作流在 gate 开启时通过 `agent-run` Tool 路由到 `real-llm` Adapter。
3. gate 关闭时自动回退到 `mock` Adapter，保持 P1/P2 行为不回归。
4. 流式生成过程进入 **AI Task Panel** 与 **Workspace AI Progress Dock**。
5. 最终结果进入 **AI Result Card** 临时草稿区，用户点击「采纳」后才写入正文。
6. 失败时 UI 显示结构化错误，不伪成功、不自动覆盖。
7. 保持 API Key 不进入前端源码、完整 prompt 不进入日志。
8. 新增/更新单元测试，确保默认测试不发真实请求。

### 1.3 前置条件

- Phase P3-0 已完成：`llm/` 目录、FeatureGate、流式事件协议、安全日志、密钥策略、stub client 就绪。
- Phase P3-A 已完成：
  - `packages/app/src/novel/llm/target-llm-client.ts`
  - `packages/app/src/novel/llm/deepseek-transport.ts`
  - `packages/app/src/novel/llm/target-llm-stream-parser.ts`
  - `packages/app/src/novel/llm/target-llm-request-builder.ts`
  - `packages/app/src/novel/adapters/real-llm-adapter.ts`
  - `packages/app/src/novel/chat-debug/novel-debug-llm-runner.ts`
  - Chat Debug 已支持 `adapter=real-llm stream=true dryRun=true`
  - `bun typecheck` 0 errors，`bun test src/novel` 340 pass / 0 fail，`bun run novel:precommit` PASSED

---

## 2. 范围边界

### 2.1 本阶段必须做

- 修改 `chapter.continue.yaml`，使其通过 `agent-run` Tool 路由 Adapter。
- 扩展 `agent-run.tool.ts`，支持根据 FeatureGate 与输入选择 `mock` / `real-llm`。
- 在 `adapter-router.ts` / `builtin-novel-tools.ts` 注册 `RealLLMExecutionAdapter`。
- 扩展 `use-novel-workflow.ts`，支持订阅流式事件并更新 UI 状态。
- 扩展 `AITaskPanel`，展示 running / streaming / failed / cancelled 状态与 token 预览。
- 扩展 `WorkspaceAiProgressDock`，展示实时生成预览与进度。
- 扩展 `AIResultCard`，支持临时流式结果与结构化错误展示。
- 新增 Hook `use-novel-llm-task.ts`，把 LLMStreamEvent 映射为 AITask 状态。
- 新增/更新测试覆盖：Workflow、Tool、AdapterRouter、UI 组件、Hook。

### 2.2 本阶段禁止做

- 不修改「开始生成」主按钮（`chapter.generate` 留给 P3-C）。
- 不实现批量真实调用。
- 不实现大纲/细纲/信息提取的真实 LLM。
- 不实现成本计费。
- 不自动覆盖章节正文。
- 不默认开启真实 LLM。
- 不在前端源码硬编码 API Key。
- 不把完整 prompt / response 写入日志。

---

## 3. 关键设计决策

### 3.1 工作流接入点：优先使用 `agent-run` Tool

P3-A 中真实 LLM 入口是 Chat Debug 直接调用 AdapterRouter。P3-B 将真实 LLM 接入主 UI，应通过 `agent-run` Tool 统一路径：

```text
AI 续写按钮
→ useNovelWorkflow.runAIWritingCommand('continue')
→ NovelActionDispatcher.dispatch({ type: 'chapter.continue' })
→ Workflow Engine 执行 chapter.continue.yaml
→ agent-run Tool 调用 AdapterRouter
→ AdapterRouter 根据 gate 选择 mock / real-llm
→ RealLLMExecutionAdapter → TargetLLMClient → DeepSeek Transport
→ LLMStreamEvent
→ Hook / UI 消费
```

原因：
- 与 P2-E Tool Registry 架构对齐。
- UI 不直接依赖 Adapter，保持调用路径统一。
- 后续 P3-C 切换 `chapter.generate` 时，只需改 YAML 和 prompt builder。

### 3.2 Gate 关闭时自动回退 mock

`agent-run` Tool 的输入可指定 `adapter`。如果未指定，Tool 内部按以下策略选择：

```text
if realLLMEnabled && targetLLMAdapterEnabled:
  默认 adapter = 'real-llm'
else:
  默认 adapter = 'mock'
```

当显式指定 `adapter=real-llm` 但 gate 未开启时，仍由 `AdapterRouter` 返回 `ADAPTER_DISABLED`，不 fallback，避免伪成功。

### 3.3 流式事件映射为 AITask 状态

新增 `use-novel-llm-task.ts`，将 `LLMStreamEvent` 聚合为 AITask：

| LLMStreamEvent | AITask 状态变化 |
|---|---|
| `llm.request.started` | status = 'running'，duration 开始计时 |
| `llm.token.delta` | preview 追加 text，progress 按字数估算 |
| `llm.reasoning.delta` | 单独记录 reasoningBuffer，不混入 preview |
| `llm.request.completed` | status = 'completed'，output.text = 完整文本 |
| `llm.request.failed` | status = 'failed'，error = 结构化错误 |
| `llm.request.cancelled` | status = 'cancelled' |

### 3.4 结果写回仍由用户确认

流式结果只进入 `AIResultCard` 临时草稿区。用户必须点击「采纳」才调用 `onAccept` 写回正文；点击「忽略」则丢弃。P3-B 不引入新的写回路径，复用现有 `applyWorkflowEvents` / `mutations`。

---

## 4. 新增文件清单

### 4.1 Hook

```text
packages/app/src/novel/hooks/use-novel-llm-task.ts
```
职责：
- 把 `AsyncGenerator<LLMStreamEvent>` 转换为 Solid 信号（AITask）。
- 聚合 token delta 为 preview / output text。
- 提供 `cancelTask`（通过 AbortSignal）。
- 记录任务耗时与 usage。

### 4.2 测试文件

```text
packages/app/src/novel/hooks/use-novel-llm-task.test.ts
packages/app/src/novel/plugins/core-writing-tools/agent-run.tool.test.ts（扩展）
packages/app/src/novel/workflows/yaml/chapter.continue.test.ts（新增或扩展）
packages/app/src/novel/components/novel-editor/ai-task-panel.test.tsx（扩展）
packages/app/src/novel/components/novel-workspace/ai-task/workspace-ai-progress-dock.test.tsx（扩展）
packages/app/src/novel/components/novel-editor/ai-result-card.test.tsx（扩展）
```

### 4.3 文档文件

```text
packages/app/src/novel/docs/phase-p3/p3b-real-llm-ui-continue.md
```

---

## 5. 修改文件清单

### 5.1 Workflow YAML

```text
packages/app/src/novel/workflows/yaml/chapter.continue.yaml
```
修改内容：
- 将 `tool: mock-generation-wrapper` 替换为 `tool: agent-run`。
- 新增 `adapter` 输入字段，默认 `"{{adapter}}"`，未传时由 Tool 内部决定。
- 保留 `projectId` / `chapterId` / `branchId` / `modelProfileId` 透传。
- 输出仍保持 `{ result, events, durationMs }`。

### 5.2 Tool

```text
packages/app/src/novel/plugins/core-writing-tools/agent-run.tool.ts
```
修改内容：
- 注册 `RealLLMExecutionAdapter`。
- 默认 router 增加 `real-llm` adapter 实例。
- 输入增加 `adapter?: 'mock' | 'opencode-stub' | 'claudecode-stub' | 'real-llm'`。
- 当 `adapter` 未指定时，按 gate 状态选择默认 adapter。
- 透传 `stream?: boolean` 到 AdapterContext。

### 5.3 Adapter Router / Registry

```text
packages/app/src/novel/adapters/adapter-router.ts（可能无需修改，已支持 real-llm 双 gate）
packages/app/src/novel/plugins/builtin-novel-tools.ts（确认 agent-run 已注册）
packages/app/src/novel/adapters/index.ts（确认 RealLLMExecutionAdapter 已导出）
```

### 5.4 Hook

```text
packages/app/src/novel/hooks/use-novel-workflow.ts
```
修改内容：
- 在 `runAIWritingCommand` 中，对 `command='continue'` 支持流式事件订阅。
- 调用 `useNovelLLMTask` 将事件流转换为 `currentTask`。
- 保留现有 `NovelAgentResult` 返回路径，确保非流式 workflow 不回归。
- 取消任务时调用 AbortController.abort。

### 5.5 UI 组件

```text
packages/app/src/novel/components/novel-editor/ai-task-panel.tsx
```
修改内容：
- 增加 `streaming` 状态展示（动画、token 预览）。
- 在任务展开详情中显示 `preview` 字段（前 120 字符）。
- 失败时显示 `error` 与重试按钮。
- 取消时显示 cancelled 状态。

```text
packages/app/src/novel/components/novel-workspace/ai-task/workspace-ai-progress-dock.tsx
```
修改内容：
- `AiTaskViewModel` 增加 `preview` / `status` / `error` 字段。
- 进度条在流式生成时使用「跑马灯」动画代替固定百分比。
- 预览区实时追加 token delta。
- 增加取消按钮。

```text
packages/app/src/novel/components/novel-editor/ai-result-card.tsx
```
修改内容：
- 在生成过程中显示临时结果（`task.preview`）。
- 失败时显示结构化错误码与用户友好文案。
- 保持「采纳 / 存为灵感 / 忽略」按钮仅在 `completed` 时可用。

---

## 6. 详细实施步骤

### Step 1：改造 `chapter.continue.yaml`

目标：让 AI 续写工作流通过 `agent-run` Tool 路由 Adapter，而不是直接调用 `mock-generation-wrapper`。

当前内容：

```yaml
id: chapter.continue
version: 1
commandType: chapter.continue
description: Continue chapter writing using the current mock workflow wrapper.
steps:
  - id: mock-wrapper
    name: Mock Continue Writing Wrapper
    tool: mock-generation-wrapper
    adapter: mock
    inputs:
      projectId: "{{projectId}}"
      chapterId: "{{chapterId}}"
      branchId: "{{branchId}}"
      modelProfileId: "{{modelProfileId}}"
    outputs:
      result: result
      events: events
```

目标内容：

```yaml
id: chapter.continue
version: 2
commandType: chapter.continue
description: Continue chapter writing through agent-run tool, route to real-llm when gate enabled.
steps:
  - id: agent-run-continue
    name: Agent Run Continue Writing
    tool: agent-run
    inputs:
      adapter: "{{adapter}}"          # 未指定时 Tool 内部按 gate 选择
      stream: "{{stream}}"            # 默认 true，gate 关闭时忽略
      projectId: "{{projectId}}"
      chapterId: "{{chapterId}}"
      branchId: "{{branchId}}"
      modelProfileId: "{{modelProfileId}}"
      selectedText: "{{selectedText}}"
      targetWordCount: "{{targetWordCount}}"
    outputs:
      result: result
      events: events
```

说明：
- `adapter` 为空时，Tool 内部按 `realLLMEnabled && targetLLMAdapterEnabled` 决定默认 adapter。
- `stream` 为 true 时，还需 `llmStreamingEnabled` 开启，否则 `real-llm` Adapter 返回 `LLM_STREAMING_DISABLED`。

### Step 2：扩展 `agent-run.tool.ts`

1. 导入 `RealLLMExecutionAdapter`：

```typescript
import {
  createAdapterRouter,
  MockExecutionAdapter,
  OpenCodeExecutionAdapter,
  ClaudeCodeExecutionAdapter,
  RealLLMExecutionAdapter,
} from '../../adapters';
```

2. 修改 `createDefaultRouter`：

```typescript
function createDefaultRouter(gates?: AdapterFeatureGates, transport?: LLMTransport) {
  const router = createAdapterRouter();
  router.register(new MockExecutionAdapter({ delayMultiplier: 0, silent: true }));
  router.register(new OpenCodeExecutionAdapter());
  router.register(new ClaudeCodeExecutionAdapter());
  // P3-B：注册真实 LLM Adapter，默认 transport 为 disabledLLMTransport，不直接发请求
  router.register(new RealLLMExecutionAdapter({ transport }));
  return { router, gates: gates ?? createDefaultAdapterFeatureGates() };
}
```

3. 修改输入类型：

```typescript
const typedInput = (input ?? {}) as {
  adapter?: AdapterKind | 'real-llm';
  stream?: boolean;
  gates?: AdapterFeatureGates;
};
```

4. 增加默认 adapter 选择逻辑：

```typescript
const selectedAdapter = typedInput.adapter ?? defaultAdapterForGates(gates);
```

```typescript
function defaultAdapterForGates(gates: AdapterFeatureGates): AdapterKind {
  return gates.realLLMEnabled && gates.targetLLMAdapterEnabled ? 'real-llm' : 'mock';
}
```

5. 将 `stream` 透传到 `AdapterContext`：

```typescript
function buildAdapterContext(command: NovelCommand, context: ToolContext, stream?: boolean): AdapterContext {
  return {
    ...,
    dryRun: false,
    stream: stream ?? true,
  };
}
```

### Step 3：扩展 `use-novel-workflow.ts`

1. 引入 `useNovelLLMTask`。
2. 在 `runAIWritingCommand` 中，对 `command='continue'`：
   - 创建 `AbortController`。
   - 调用 dispatcher，同时订阅流式事件（若 workflow 产生 `LLMStreamEvent`）。
   - 使用 `useNovelLLMTask` 聚合事件到 `currentTask`。
3. 在 `cancelCurrentTask` 中调用 `abortController.abort()`。

伪代码：

```typescript
async function runAIWritingCommand(params: RunAICommandParams): Promise<NovelAgentResult> {
  setIsRunning(true);
  setError(null);
  const abortController = new AbortController();
  lastAbortController = abortController;

  try {
    const input = buildActionInput('chapter.continue', params);

    // P3-B：启动流式任务订阅
    if (params.command === 'continue') {
      const taskPromise = llmTask.startTask(async function* () {
        const result = await dispatcher.dispatch(input, {
          onStreamEvent: (event) => llmTask.emit(event),
          signal: abortController.signal,
        });
        return result;
      });

      const workflowResult = await taskPromise;
      return workflowResult.result as NovelAgentResult;
    }

    // 非 continue 保持原有非流式路径
    const result = await dispatcher.dispatch(input);
    return result.result as NovelAgentResult;
  } finally {
    setIsRunning(false);
  }
}
```

> 注：若 Workflow Engine 当前不直接产出流式事件，可改为在 `agent-run` Tool 中通过 `ToolContext` 的 `onStreamEvent` 回调注入事件。

### Step 4：新增 `use-novel-llm-task.ts`

接口设计：

```typescript
export interface UseNovelLLMTaskReturn {
  task: () => AITask | null;
  startTask: (streamFactory: () => AsyncGenerator<LLMStreamEvent>) => Promise<NovelAgentResult>;
  emit: (event: LLMStreamEvent) => void;
  cancel: () => void;
}

export function useNovelLLMTask(): UseNovelLLMTaskReturn {
  const [task, setTask] = createSignal<AITask | null>(null);
  let buffer = '';
  let reasoningBuffer = '';
  let startTime = 0;

  function resetTask(input: AITaskInput) {
    buffer = '';
    reasoningBuffer = '';
    startTime = Date.now();
    setTask({
      id: input.requestId,
      type: 'continue-writing',
      status: 'running',
      input,
      preview: '',
      createdAt: new Date(),
    });
  }

  function handleEvent(event: LLMStreamEvent) {
    setTask(prev => {
      if (!prev) return prev;
      switch (event.type) {
        case 'llm.token.delta':
          buffer += event.text;
          return { ...prev, preview: buffer.slice(0, 200) };
        case 'llm.reasoning.delta':
          reasoningBuffer += event.text;
          return prev; // reasoning 不进入 preview
        case 'llm.request.completed':
          return {
            ...prev,
            status: 'completed',
            output: {
              text: buffer,
              wordCount: countWords(buffer),
            },
            duration: Date.now() - startTime,
          };
        case 'llm.request.failed':
          return {
            ...prev,
            status: 'failed',
            error: formatLLMError(event.errorCode, event.error),
            duration: Date.now() - startTime,
          };
        case 'llm.request.cancelled':
          return {
            ...prev,
            status: 'cancelled',
            duration: Date.now() - startTime,
          };
        default:
          return prev;
      }
    });
  }

  // ...
}
```

### Step 5：扩展 `ai-task-panel.tsx`

- 在 `statusConfig` 中保留现有状态，对 running 任务增加 streaming 动画。
- 展开详情中显示 `task.preview`（如果存在）。
- 失败时显示 `task.error`，并提供重试按钮。

### Step 6：扩展 `workspace-ai-progress-dock.tsx`

- `AiTaskViewModel` 增加 `preview`、`status`、`error`。
- 当 `task.running` 时，进度条改为 indeterminate 动画。
- 预览区显示 `task.preview`。
- 增加取消按钮，调用 `onPause`（语义改为取消）。

### Step 7：扩展 `ai-result-card.tsx`

- running 状态也渲染临时结果（只读）。
- failed 状态渲染错误信息，不显示采纳按钮。
- 保持 completed 状态才显示「采纳 / 存为灵感 / 忽略」。

### Step 8：错误处理与 Mock Fallback

- `agent-run` Tool 中 gate 未开启时显式请求 `real-llm` → 返回 `ADAPTER_DISABLED`。
- `real-llm` Adapter 内部再次检查双 gate，关闭则返回 `REAL_LLM_DISABLED` / `TARGET_LLM_ADAPTER_DISABLED`。
- 流式关闭时返回 `LLM_STREAMING_DISABLED`。
- UI 层把这些错误码映射为用户可读文案：
  - `REAL_LLM_DISABLED` → 「真实 LLM 已关闭，请在设置中开启后重试。」
  - `TARGET_LLM_ADAPTER_DISABLED` → 「目标 Adapter 未启用。」
  - `LLM_STREAMING_DISABLED` → 「流式生成已关闭，可关闭 stream 后重试。」
  - `LLM_SECRET_MISSING` → 「缺少 API Key，请检查环境配置。」

### Step 9：中文注释补充

必须在以下位置补充中文注释：

1. `agent-run.tool.ts`：为什么默认 adapter 按 gate 选择。
2. `use-novel-llm-task.ts`：为什么 LLMStreamEvent 需要聚合为 AITask。
3. `ai-task-panel.tsx` / `workspace-ai-progress-dock.tsx`：为什么过程结果不直接写入正文。
4. `real-llm-adapter.ts`：为什么 UI 只消费统一事件。
5. `chapter.continue.yaml`：为什么 P3-B 只接入 AI 续写。

---

## 7. 测试计划

### 7.1 单元测试覆盖

| 测试文件 | 覆盖内容 |
|---|---|
| `agent-run.tool.test.ts` | gate 开启默认选 real-llm；gate 关闭默认选 mock；显式 real-llm + gate 关闭返回 ADAPTER_DISABLED；stream 参数透传 |
| `use-novel-llm-task.test.ts` | started → token.delta → completed 聚合；failed 状态；cancelled 状态；preview 截断 |
| `adapter-router.test.ts` | real-llm 双 gate 阻断；stream gate 阻断（扩展已有测试） |
| `ai-task-panel.test.tsx` | running 任务显示 preview；failed 任务显示 error；cancelled 状态 |
| `workspace-ai-progress-dock.test.tsx` | 流式任务渲染 preview；取消按钮触发 onPause |
| `ai-result-card.test.tsx` | 临时结果只读；失败状态不显示采纳按钮 |
| `chapter.continue.test.ts` | YAML 解析为 agent-run Tool；输入参数透传 |
| `real-llm-adapter.test.ts` | executeStream 返回 LLMStreamEvent；gate 关闭返回错误（扩展已有测试） |

### 7.2 手动验证

真实 LLM 手动验证命令（不纳入默认 CI）：

```bash
REAL_LLM_PILOT=1 bun test src/novel/hooks/use-novel-llm-task.manual.test.ts
```

或提供 UI 手动验证步骤：

1. 在设置中开启 `realLLMEnabled` + `targetLLMAdapterEnabled` + `llmStreamingEnabled`。
2. 在编辑器中选择一段文本，点击「AI 续写」。
3. 观察 AI Task Panel / Progress Dock 出现流式预览。
4. 观察 AI Result Card 显示完整结果。
5. 点击「采纳」，确认写入正文。
6. 关闭 gate，再次点击「AI 续写」，确认走 mock 且不报错。

---

## 8. 验证命令

实施完成后必须执行：

```bash
cd packages/app
bun run novel:precommit
bun typecheck
bun test src/novel/llm
bun test src/novel/adapters
bun test src/novel/plugins
bun test src/novel/workflows
bun test src/novel/actions
bun test src/novel/chat-debug
bun test src/novel/hooks
bun test src/novel/components
bun test src/novel
```

---

## 9. Git 提交计划

建议分两次提交：

### Commit 1：核心实现

```bash
git add \
  packages/app/src/novel/workflows/yaml/chapter.continue.yaml \
  packages/app/src/novel/plugins/core-writing-tools/agent-run.tool.ts \
  packages/app/src/novel/hooks/use-novel-llm-task.ts \
  packages/app/src/novel/hooks/use-novel-workflow.ts \
  packages/app/src/novel/components/novel-editor/ai-task-panel.tsx \
  packages/app/src/novel/components/novel-workspace/ai-task/workspace-ai-progress-dock.tsx \
  packages/app/src/novel/components/novel-editor/ai-result-card.tsx \
  packages/app/src/novel/adapters/adapter-router.ts \
  packages/app/src/novel/plugins/builtin-novel-tools.ts

git commit -m "feat(P3-B): wire real-llm into AI continue UI with streaming"
```

### Commit 2：测试与文档

```bash
git add \
  packages/app/src/novel/hooks/use-novel-llm-task.test.ts \
  packages/app/src/novel/plugins/core-writing-tools/agent-run.tool.test.ts \
  packages/app/src/novel/components/novel-editor/ai-task-panel.test.tsx \
  packages/app/src/novel/components/novel-workspace/ai-task/workspace-ai-progress-dock.test.tsx \
  packages/app/src/novel/components/novel-editor/ai-result-card.test.tsx \
  packages/app/src/novel/docs/phase-p3/p3b-real-llm-ui-continue.md \
  docs/task-reports/2026-06-21/PHASE-P3-B-REAL-LLM-UI-CONTINUE-PLAN-20260621.md \
  workspaces/kimik27code/hellokimik27code.md

git commit -m "test(P3-B): add UI streaming and agent-run routing tests"
```

---

## 10. 风险与回退策略

| 风险 | 等级 | 处理 |
|---|---|---|
| 真实 LLM 默认被误开启 | 高 | 默认值保持 false；所有真实调用路径经双 gate 校验；precommit 拦截硬编码 key |
| 流式事件导致 UI 性能问题 | 中 | token delta 聚合节流（如每 50ms 更新一次）；preview 限制 200 字符 |
| 工作流改造影响 mock 路径 | 中 | 保留 mock-generation-wrapper；gate 关闭时自动回退 mock；新增回归测试 |
| 结果卡确认流程被破坏 | 中 | 保持采纳/忽略按钮逻辑；流式结果只进入 preview，不自动写回 |
| 测试默认发真实请求 | 高 | RealLLMExecutionAdapter 默认注入 disabledLLMTransport；真实调用测试手动标记 |

---

## 11. 验收标准

P3-B 通过必须满足：

1. `bun run novel:precommit` 通过。
2. `bun typecheck` 0 errors。
3. `bun test src/novel` 全部通过（P3-A 基线 340，P3-B 新增测试全部通过）。
4. gate 关闭时，AI 续写走 mock，不报错。
5. gate 开启时，AI 续写走 real-llm，过程可流式回显。
6. 流式结果进入 AI Result Card 临时区，用户采纳后才写入正文。
7. 失败时 UI 显示结构化错误，不伪成功。
8. API Key 未进入前端源码；完整 prompt / response 未进入日志。
9. Git 提交完成，无无关文件混入。

---

## 12. 阶段完成标记

实施方案通过主控评审后，输出：

```text
[READY_FOR_P3B_IMPLEMENTATION]
```

实施完成并验收通过后，输出：

```text
[READY_FOR_P3C_REAL_LLM_CHAPTER_GENERATION]
```

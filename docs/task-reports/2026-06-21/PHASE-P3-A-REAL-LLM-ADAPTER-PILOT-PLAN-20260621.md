我是：前端工程师 / Novel 模块开发 Agent (Kimi-K2.7-Code)，本次任务：Phase P3-A Real LLM Adapter Pilot，职责范围：`packages/app/src/novel/`、`docs/task-reports/`

# Phase P3-A：Real LLM Adapter Pilot 实施方案

## 1. 本阶段目标

在 P3-0 Real LLM Readiness 已完成的基础上，完成第一次受控真实 LLM 调用与流式过程回显。

- 实现真实 LLM Client（可注入 transport，默认不发真实请求）。
- 实现 `real-llm` Adapter，满足 `StreamingAgentExecutionAdapter` 契约。
- 在 Chat Debug Console 扩展 `/novel run chapter.continue ... adapter=real-llm stream=true` 作为首个试点入口。
- 实现流式事件到 Chat Debug Log 的最小回显。
- 保证 FeatureGate 关闭时真实调用被阻断、API Key 不进入前端源码、日志脱敏。
- 完成 typecheck、precommit、单元测试与 Git 提交。

## 2. 前置依赖

P3-0 已完成文件：

- `packages/app/src/novel/llm/llm-feature-gates.ts`
- `packages/app/src/novel/llm/llm-request-types.ts`
- `packages/app/src/novel/llm/llm-stream-events.ts`
- `packages/app/src/novel/llm/llm-safe-logger.ts`
- `packages/app/src/novel/llm/llm-secret-policy.ts`
- `packages/app/src/novel/llm/llm-error-types.ts`
- `packages/app/src/novel/llm/real-llm-adapter-contract.ts`
- `packages/app/src/novel/llm/real-llm-client.stub.ts`
- `packages/app/src/novel/adapters/adapter-router.ts`
- `packages/app/scripts/novel-precommit-check.ts`
- `scripts/trae-hooks/shared/novel-rules.ts`

## 3. 必须阅读材料

1. `docs/task-reports/2026-06-21/PHASE-P3-0-REAL-LLM-READINESS-REPORT-20260621.md`
2. `caiode/docs/tabbit/06/Phase P30+P3A.md`（P3-A 章节）
3. `packages/app/src/novel/llm/*`
4. `packages/app/src/novel/adapters/adapter-types.ts`
5. `packages/app/src/novel/adapters/adapter-router.ts`
6. `packages/app/src/novel/plugins/core-writing-tools/agent-run.tool.ts`
7. `packages/app/src/novel/chat-debug/novel-debug-command-parser.ts`
8. `packages/app/src/novel/chat-debug/novel-debug-command-runner.ts`
9. `packages/app/src/novel/chat-debug/novel-debug-log-types.ts`
10. `packages/app/src/novel/workflows/novel-command.ts`
11. `packages/app/src/novel/types/ai-task.ts`

## 4. 新增 / 修改文件

### 4.1 新增文件

```text
packages/app/src/novel/llm/
├── target-llm-client.ts              # 真实 LLM Client 接口与默认实现
├── target-llm-client.test.ts         # Client 单元测试（默认 mock transport）
├── target-llm-stream-parser.ts       # 供应商流式响应解析为 LLMStreamEvent
├── target-llm-stream-parser.test.ts  # 流式解析测试
├── target-llm-request-builder.ts     # NovelCommand → LLMRequest
└── target-llm-request-builder.test.ts

packages/app/src/novel/adapters/
├── real-llm-adapter.ts               # 真实 LLM Adapter 实现
└── real-llm-adapter.test.ts          # Adapter 单元测试

packages/app/src/novel/chat-debug/
├── novel-debug-llm-runner.ts         # Chat Debug 真实 LLM 调用封装
└── novel-debug-llm-runner.test.ts    # Runner 单元测试

packages/app/src/novel/docs/phase-p3/
├── p3a-real-llm-adapter-pilot.md     # P3-A 设计说明
└── p3a-real-llm-manual-test.md       # 真实调用手动验证指南
```

### 4.2 修改文件

```text
packages/app/src/novel/adapters/adapter-router.ts
packages/app/src/novel/adapters/index.ts
packages/app/src/novel/adapters/adapter-types.ts
packages/app/src/novel/plugins/core-writing-tools/agent-run.tool.ts
packages/app/src/novel/chat-debug/novel-debug-command-parser.ts
packages/app/src/novel/chat-debug/novel-debug-command-runner.ts
packages/app/src/novel/chat-debug/novel-debug-log-types.ts
packages/app/src/novel/llm/index.ts
packages/app/src/novel/llm/llm-error-types.ts
packages/app/src/novel/feature-gates.ts
packages/app/src/novel/workflows/novel-command.ts      # 如需要透传 stream / dryRun 字段
```

## 5. 详细实施步骤

### 步骤 1：扩展错误码与 FeatureGate 校验

**文件**: `packages/app/src/novel/llm/llm-error-types.ts`

在现有 `LLMErrorCode` 中新增 P3-A 专用错误码：

```typescript
export type LLMErrorCode =
  | 'REAL_LLM_NOT_ENABLED'
  | 'TARGET_LLM_ADAPTER_DISABLED'
  | 'LLM_STREAMING_DISABLED'
  | 'CLIENT_STUB_ONLY'
  | 'ADAPTER_DISABLED'
  | 'LLM_SECRET_MISSING'
  | 'LLM_REQUEST_TIMEOUT'
  | 'LLM_REQUEST_ABORTED'
  | 'LLM_REQUEST_FAILED'
  | 'LLM_NETWORK_ERROR'
  | 'LLM_PROVIDER_ERROR'
  | 'LLM_STREAM_PARSE_ERROR'
  | 'LLM_EMPTY_RESPONSE'
  | 'LLM_SECRET_LEAK';
```

**文件**: `packages/app/src/novel/llm/llm-feature-gates.ts`

新增辅助函数：

```typescript
export function assertRealLLMExecutionAllowed(
  gates: Partial<RealLLMFeatureGates>,
): { allowed: true } | { allowed: false; code: LLMErrorCode; message: string } {
  if (!gates.realLLMEnabled) {
    return { allowed: false, code: 'REAL_LLM_NOT_ENABLED', message: 'realLLMEnabled 未开启' };
  }
  if (!gates.targetLLMAdapterEnabled) {
    return { allowed: false, code: 'TARGET_LLM_ADAPTER_DISABLED', message: 'targetLLMAdapterEnabled 未开启' };
  }
  return { allowed: true };
}

export function assertLLMStreamingAllowed(
  gates: Partial<RealLLMFeatureGates>,
): { allowed: true } | { allowed: false; code: LLMErrorCode; message: string } {
  const base = assertRealLLMExecutionAllowed(gates);
  if (!base.allowed) return base;
  if (!gates.llmStreamingEnabled) {
    return { allowed: false, code: 'LLM_STREAMING_DISABLED', message: 'llmStreamingEnabled 未开启' };
  }
  return { allowed: true };
}
```

### 步骤 2：更新 AdapterKind 与 AdapterFeatureGates

**文件**: `packages/app/src/novel/adapters/adapter-types.ts`

当前 `AdapterKind` 已包含 `'real-llm'`，但 `AdapterFeatureGates` 只包含三个字段。P3-A 需要 Router 能校验 `targetLLMAdapterEnabled`：

```typescript
export interface AdapterFeatureGates {
  realLLMEnabled: boolean;
  targetLLMAdapterEnabled: boolean;
  openCodeAdapterEnabled: boolean;
  claudeCodeAdapterEnabled: boolean;
}
```

> 注：也可以保持 `AdapterFeatureGates` 不变，Router 接收 `RealLLMFeatureGates` 进行判断。推荐在 `feature-gates.ts` 的 `createDefaultAdapterFeatureGates` 中补齐 `targetLLMAdapterEnabled: false`。

### 步骤 3：更新 AdapterRouter

**文件**: `packages/app/src/novel/adapters/adapter-router.ts`

当前 Router 仅检查 `realLLMEnabled`。P3-A 要求双 gate：

```typescript
if (requested === 'real-llm') {
  if (!gates.realLLMEnabled) {
    return createAdapterRouterError('ADAPTER_DISABLED', 'Real LLM adapter 已被 FeatureGate 关闭（realLLMEnabled=false）');
  }
  if (!gates.targetLLMAdapterEnabled) {
    return createAdapterRouterError('ADAPTER_DISABLED', 'Real LLM adapter 已被 FeatureGate 关闭（targetLLMAdapterEnabled=false）');
  }
}
```

### 步骤 4：实现 TargetLLMClient

**文件**: `packages/app/src/novel/llm/target-llm-client.ts`

设计原则：

- `TargetLLMClient` 只定义调用接口。
- 真实网络调用通过可注入 `LLMTransport` 完成。
- 默认 transport 是 `disabledTransport` / `stubTransport`，保证测试默认不发真实请求。
- 真实 transport 仅在开发环境显式注入。

```typescript
export interface LLMTransport {
  complete(request: LLMRequest): Promise<LLMResponse>;
  stream(request: LLMRequest): AsyncGenerator<LLMStreamEvent>;
}

export interface TargetLLMClient {
  complete(request: LLMRequest, options?: LLMRequestOptions): Promise<LLMResponse>;
  stream(request: LLMRequest, options?: LLMRequestOptions): AsyncGenerator<LLMStreamEvent>;
}

export function createTargetLLMClient(transport: LLMTransport): TargetLLMClient;
```

实现要求：

1. `complete` 调用 transport.complete，超时后抛出 `LLMError('LLM_REQUEST_TIMEOUT')`。
2. `stream` 调用 transport.stream，支持 AbortSignal，取消时抛出 `LLMError('LLM_REQUEST_ABORTED')`。
3. transport 异常转换为 `LLMError('LLM_NETWORK_ERROR' | 'LLM_PROVIDER_ERROR')`。
4. 不读取 API Key，不构造 Authorization header（由 transport 在受控环境完成）。

### 步骤 5：实现流式解析器

**文件**: `packages/app/src/novel/llm/target-llm-stream-parser.ts`

提供 mock transport 用的事件生成器：

```typescript
export async function* createMockTokenStream(
  requestId: string,
  text: string,
  options?: { chunkSize?: number; delayMs?: number },
): AsyncGenerator<LLMStreamEvent>;
```

用于测试和 stub。P3-A 先实现基于 mock transport 的完整事件链路，真实供应商解析器预留接口（P3-B 实现）。

### 步骤 6：实现 Prompt Builder

**文件**: `packages/app/src/novel/llm/target-llm-request-builder.ts`

输入：`NovelCommand`、`AdapterContext`
输出：`LLMRequest`

Pilot 版本只支持 `chapter.continue`：

```typescript
export function buildLLMRequest(
  command: NovelCommand,
  context: AdapterContext,
  options?: { stream?: boolean; timeoutMs?: number },
): LLMRequest;
```

要求：

1. `chapter.continue` 只传 `selectedText` + 最小上下文。
2. 不传超长上下文。
3. 不包含密钥。
4. `prompt` 不写入日志。
5. `requestId` 使用 `crypto.randomUUID()` 或相同语义。
6. 中文注释说明这是 Pilot 版本，P3-B 再做上下文裁剪。

### 步骤 7：实现 RealLLMAdapter

**文件**: `packages/app/src/novel/adapters/real-llm-adapter.ts`

实现 `StreamingAgentExecutionAdapter`：

```typescript
export class RealLLMExecutionAdapter implements StreamingAgentExecutionAdapter {
  readonly name = 'real-llm';

  constructor(
    private client: TargetLLMClient,
    private gates: RealLLMFeatureGates,
  ) {}

  canHandle(command: NovelCommand): boolean {
    return command.type === 'chapter.continue' || command.type === 'chapter.rewrite';
  }

  async execute(command: NovelCommand, context: AdapterContext): Promise<NovelAgentResult>;
  async *executeStream(command: NovelCommand, context: AdapterContext): AsyncGenerator<LLMStreamEvent>;
}
```

职责：

1. 调用前校验双 gate。
2. 使用 `buildLLMRequest` 构造请求。
3. 调用 `TargetLLMClient`。
4. 流式结果转换为 `LLMStreamEvent`。
5. 最终结果转换为 `NovelAgentResult`。
6. 使用 `createSafeLLMLogEntry` 记录脱敏日志。
7. 不直接写 UI、不写章节 Store、不调用 `applyWorkflowEvents`。

### 步骤 8：扩展 Chat Debug Console

**文件**: `packages/app/src/novel/chat-debug/novel-debug-command-parser.ts`

1. `parseAdapterKind` 增加 `'real-llm'`。
2. 增加 `stream` 参数解析（`stream=true|false`）。
3. 增加 `dryRun` 参数解析（`dryRun=true|false`）。
4. 帮助文本更新。

**文件**: `packages/app/src/novel/chat-debug/novel-debug-command-runner.ts`

新增真实 LLM 调用分支：

```typescript
if (command.adapterKind === 'real-llm') {
  const result = await runRealLLMInDebug(command, context, gates);
  // 将 LLMStreamEvent 写入 debug log
}
```

或使用新的 `novel-debug-llm-runner.ts` 封装。

**文件**: `packages/app/src/novel/chat-debug/novel-debug-log-types.ts`

扩展 log entry 类型以支持 `LLMStreamEvent`。

### 步骤 9：集成 agent-run Tool（可选）

**文件**: `packages/app/src/novel/plugins/core-writing-tools/agent-run.tool.ts`

1. 注册 `RealLLMExecutionAdapter`。
2. 如果 `agent-run` Tool 输入包含 `adapter: 'real-llm'`，走真实 LLM 链路。
3. Tool 输出需要支持流式事件（当前 ToolResult 为 Promise，流式需额外设计）。

> 主控建议：P3-A 优先完成 Chat Debug 入口，agent-run Tool 流式集成放到 P3-B。

### 步骤 10：补充中文注释

所有新增复杂逻辑必须添加中文注释，重点说明：

1. 为什么真实调用必须双 gate。
2. 为什么前端不能持有 API Key。
3. 为什么日志只保留 preview。
4. 为什么 UI 消费 `LLMStreamEvent` 而不是供应商原始事件。
5. 为什么第一次调用选择 `chapter.continue`。
6. 为什么过程回显不直接写入正文。
7. 为什么失败必须结构化。
8. 为什么测试默认不发真实请求。

## 6. 验证策略

### 6.1 单元测试

| 测试文件 | 覆盖点 |
|----------|--------|
| `target-llm-client.test.ts` | mock transport、complete、stream、timeout、abort、provider error |
| `target-llm-stream-parser.test.ts` | 事件序列、token delta、completed、failed |
| `target-llm-request-builder.test.ts` | `chapter.continue` 构造请求、参数透传、无密钥 |
| `real-llm-adapter.test.ts` | gate 关闭阻断、execute、executeStream、safe logger 调用 |
| `novel-debug-command-parser.test.ts` | `adapter=real-llm`、`stream=true`、`dryRun=false` 解析 |
| `novel-debug-llm-runner.test.ts` | 事件写入 log、gate 关闭返回 disabled |

### 6.2 手动真实调用验证

默认不执行。如需手动验证：

```bash
cd packages/app
REAL_LLM_PILOT=1 bun test src/novel/llm/real-llm.manual.test.ts
```

必须说明：

1. 是否执行了真实调用。
2. 使用哪个入口。
3. 是否流式回显。
4. 是否记录脱敏日志。
5. 是否没有泄露密钥。
6. 是否产生费用或 token usage。
7. 失败时如何处理。

## 7. 验证命令

提交前必须执行：

```bash
cd packages/app
bun run novel:precommit
bun typecheck
bun test src/novel/llm
bun test src/novel/adapters
bun test src/novel/chat-debug
bun test src/novel/actions
bun test src/novel
```

## 8. Git 提交计划

提交范围：

```text
git add \
  packages/app/src/novel/llm \
  packages/app/src/novel/adapters \
  packages/app/src/novel/chat-debug \
  packages/app/src/novel/plugins/core-writing-tools \
  packages/app/src/novel/docs/phase-p3 \
  packages/app/src/novel/feature-gates.ts \
  packages/app/package.json \
  docs/task-reports \
  workspaces/kimik27code
```

建议提交信息：

```text
feat(novel): add real llm adapter pilot with streaming echo
```

阶段报告：

```text
docs/task-reports/2026-06-21/PHASE-P3-A-REAL-LLM-ADAPTER-PILOT-REPORT-20260621.md
```

## 9. 风险与未完成项

| 风险 | 说明 | 缓解 |
|------|------|------|
| 真实 API Key 泄露 | P3-A 需要真实调用，但 Key 不能进前端 | 通过 transport 注入，transport 在受控 Node/Bun 环境读取；precommit 拦截硬编码 |
| 费用意外产生 | 真实调用可能产生 token 费用 | 默认 gate 关闭；手动测试需显式环境变量；使用最小 prompt |
| 流式集成复杂度 | UI 层需要消费流式事件 | P3-A 只做 Chat Debug 回显，不动主 UI |
| 测试稳定性 | 网络依赖测试不可控 | 默认测试使用 mock transport；真实调用单独标记 |
| 供应商原始格式差异 | OpenAI / Anthropic / OpenRouter 流式格式不同 | P3-A 用 mock transport 统一事件；P3-B 实现具体 parser |

## 10. 下一阶段建议

P3-B：Real LLM UI Continue

- 将真实 LLM 流式回显接入 AI 续写按钮。
- 实现 AI Result Card 临时草稿区。
- 支持用户采纳 / 丢弃真实模型结果。
- 接入具体供应商 transport（OpenAI / Anthropic / OpenRouter）。
- 优化 prompt builder 上下文裁剪。

## 11. 阶段完成标记

实施完成并通过验证后输出：

```text
[READY_FOR_P3B_REAL_LLM_UI_CONTINUE]
```

---

*方案输出: Kimi-K2.7-Code*
*日期: 2026-06-21*

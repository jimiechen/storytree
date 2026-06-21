> 我是：前端工程师 / Novel 模块开发 Agent（Kimi-K2.7-Code），本次任务：Phase P3-0 Real LLM Readiness 实施方案编制与提交主控评审，职责范围：`packages/app/src/novel/`、`packages/app/scripts/`、`scripts/trae-hooks/`、`.trae/hooks.json`、`docs/task-reports/`、`workspaces/kimik27code/`；禁止触碰：`packages/opencode/`、`packages/sdk/`、`packages/plugin/`、`packages/desktop/`、`packages/ui/`、根目录 package.json / turbo.json / tsconfig。
> 越界操作申请：无。

# Phase P3-0：Real LLM Readiness 实施方案

## 1. 阶段背景

Phase P2 已完成 NovelForge 的基础架构闭环：

- P2-0：PRD / Action / FeatureGate / Interface Contract 基线
- P2-A0：Chat Debug Console
- P2-0B：Workspace / Skills / Commands / Branch / Model 契约
- P2-A：Workspace-aware YAML Workflow Engine
- P2-B：Plugin Tool Registry
- P2-C：Info-Theory Audit Tool
- P2-D：核心 UI 按钮接入 YAML Workflow Engine
- P2-E：AdapterRouter / Stub / Commit Governance

P3-0 是在 P2 架构之上引入真实 LLM 前的**安全准备阶段**，目标是为 P3-A 的第一次受控真实 LLM 调用补齐 FeatureGate、密钥策略、日志脱敏、流式事件协议、错误模型、Adapter 接口扩展、Client Stub 与测试基线。

## 2. 阶段定位

P3-0 **只做准备，不发起真实 LLM 网络请求**。

| 事项                | P3-0   | P3-A            |
| ----------------- | ------ | --------------- |
| 真实 LLM 请求         | ❌ 禁止   | ✅ 在双 gate 开启时允许 |
| 密钥硬编码             | ❌ 禁止   | ❌ 禁止            |
| 前端持有 API Key      | ❌ 禁止   | ❌ 禁止            |
| FeatureGate 设计    | ✅ 完成   | ✅ 执行            |
| 流式事件协议            | ✅ 定义   | ✅ 消费            |
| 安全日志脱敏            | ✅ 实现   | ✅ 使用            |
| RealLLMAdapter 接口 | ✅ 扩展定义 | ✅ 实现            |
| Client Stub       | ✅ 实现   | ✅ 替换为真实 client  |

## 3. 阶段目标

1. 新增 Real LLM Readiness 文档。
2. 扩展 FeatureGate，新增真实 LLM 相关 gate。
3. 定义 LLM 流式事件协议。
4. 定义 LLM 请求 / 响应 / 错误 / usage 类型。
5. 定义安全日志脱敏工具。
6. 定义密钥策略，不允许前端直接持有密钥。
7. 定义 RealLLMAdapter 的接口扩展。
8. 定义首次真实调用的 Pilot 范围。
9. 新增 client stub，但不得真实请求。
10. 新增测试覆盖 FeatureGate、日志脱敏、事件协议、禁用状态。
11. 更新提交审查规则，禁止前端硬编码 API Key。
12. 补充中文注释。
13. 运行验证命令。
14. 提交代码。
15. 输出阶段完成标记 `[READY_FOR_P3A_REAL_LLM_PILOT]`。

## 4. 硬性边界

### 4.1 P3-0 禁止

1. 禁止发起真实 LLM 网络请求。
2. 禁止调用真实外部模型。
3. 禁止在前端源码中硬编码 API Key。
4. 禁止在浏览器端直接持有真实 API Key。
5. 禁止把完整 prompt、密钥、用户隐私文本写入日志。
6. 禁止绕过 FeatureGate。
7. 禁止修改 OpenCode Core。
8. 禁止执行真实 git worktree。
9. 禁止接数据库、支付、云同步。
10. 禁止把 stub 结果伪装成真实模型结果。
11. 禁止测试未通过时提交代码。
12. 禁止缺少中文注释。
13. 禁止把无关文件混入提交。

### 4.2 P3-0 允许

1. 新增 LLM 接入准备目录。
2. 新增真实 LLM Adapter 的接口契约。
3. 新增流式事件类型。
4. 新增安全日志工具。
5. 新增密钥策略文档与代码注释。
6. 新增 FeatureGate。
7. 新增受控 client stub。
8. 新增测试。
9. 更新文档。
10. 测试通过后提交代码。

## 5. 新增目录与文件规划

### 5.1 代码文件

```text
packages/app/src/novel/llm/
├── index.ts
├── llm-feature-gates.ts
├── llm-request-types.ts
├── llm-stream-events.ts
├── llm-safe-logger.ts
├── llm-secret-policy.ts
├── llm-error-types.ts
├── real-llm-adapter-contract.ts
└── real-llm-client.stub.ts
```

### 5.2 测试文件

```text
packages/app/src/novel/llm/
├── llm-feature-gates.test.ts
├── llm-stream-events.test.ts
├── llm-safe-logger.test.ts
├── llm-secret-policy.test.ts
├── llm-error-types.test.ts
└── real-llm-client.stub.test.ts
```

### 5.3 文档文件

```text
packages/app/src/novel/docs/phase-p3/
├── p3-real-llm-readiness.md
├── p3-llm-secret-policy.md
├── p3-llm-streaming-contract.md
└── p3-real-llm-pilot-scope.md
```

### 5.4 修改文件

- `packages/app/src/novel/feature-gates.ts`：扩展 `NovelFeatureGates`
- `packages/app/src/novel/adapters/adapter-router.ts`：支持 Real LLM gate 检查
- `packages/app/scripts/novel-precommit-check.ts`：增加 API Key / 硬编码 endpoint 检查
- `.trae/hooks.json`：如需要，扩展 Hook 规则
- `docs/task-reports/2026-06-21/PHASE-P3-0-REAL-LLM-READINESS-REPORT-20260621.md`：阶段报告

## 6. FeatureGate 设计

### 6.1 新增 Gate

```typescript
export interface RealLLMFeatureGates {
  realLLMEnabled: boolean;
  targetLLMAdapterEnabled: boolean;
  llmStreamingEnabled: boolean;
  llmRequestLogEnabled: boolean;
  llmCostTrackingEnabled: boolean;
  llmSafePromptLoggingEnabled: boolean;
}
```

### 6.2 默认值

```typescript
{
  realLLMEnabled: false,
  targetLLMAdapterEnabled: false,
  llmStreamingEnabled: false,
  llmRequestLogEnabled: true,
  llmCostTrackingEnabled: false,
  llmSafePromptLoggingEnabled: false
}
```

### 6.3 行为

- `realLLMEnabled=false` 时，任何真实 LLM 请求都必须被阻断。
- `targetLLMAdapterEnabled=false` 时，指定真实 Adapter 也必须返回 `ADAPTER_DISABLED`。
- `llmStreamingEnabled=false` 时，不能开启流式回显。
- `llmRequestLogEnabled=true` 只允许记录脱敏后的元数据。
- `llmSafePromptLoggingEnabled=false` 时，不得记录完整 prompt。
- `llmCostTrackingEnabled=false` 时，只允许保留 usage 字段接口，不做费用计算。

## 7. LLM 流式事件协议

统一事件类型定义在 `packages/app/src/novel/llm/llm-stream-events.ts`：

```typescript
export type LLMStreamEvent =
  | { type: 'llm.request.started'; requestId: string; adapter: string; commandId?: string; workflowId?: string; createdAt: string }
  | { type: 'llm.token.delta'; requestId: string; text: string }
  | { type: 'llm.reasoning.delta'; requestId: string; text: string }
  | { type: 'llm.request.completed'; requestId: string; usage?: LLMUsage; completedAt: string }
  | { type: 'llm.request.failed'; requestId: string; errorCode: string; error: string }
  | { type: 'llm.request.cancelled'; requestId: string; reason?: string };

export interface LLMUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}
```

核心约束：

1. UI 不直接解析供应商原始流。
2. Adapter 必须把供应商事件转换为 NovelForge 统一事件。
3. `llm.reasoning.delta` 不得混入正文。
4. `llm.token.delta` 只进入临时 buffer，最终仍需转成 `NovelAgentResult`。
5. 错误必须结构化，不允许未捕获异常穿透 UI。

## 8. LLM 请求类型

定义在 `packages/app/src/novel/llm/llm-request-types.ts`：

```typescript
export interface LLMRequest {
  requestId: string;
  adapter: string;
  commandId?: string;
  workflowId?: string;
  prompt: string;
  systemPrompt?: string;
  stream: boolean;
  timeoutMs: number;
  metadata: {
    projectId: string;
    chapterId?: string;
    branchId?: string;
    modelProfileId?: string;
    modelRole?: string;
  };
}

export interface LLMResponse {
  requestId: string;
  text: string;
  usage?: LLMUsage;
  rawMetadata?: Record<string, unknown>;
}

export interface LLMRequestOptions {
  stream?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
}
```

要求：

1. `prompt` 不得默认写入日志。
2. `metadata` 可用于调试，但不得包含密钥。
3. `timeoutMs` 必须有默认值。
4. `AbortSignal` 只做接口预留，P3-A 再验证取消行为。

## 9. 密钥策略

定义在 `packages/app/src/novel/llm/llm-secret-policy.ts` 与 `packages/app/src/novel/docs/phase-p3/p3-llm-secret-policy.md`。

核心原则：

1. 前端源码禁止硬编码 API Key。
2. 浏览器端禁止直接持有真实 API Key。
3. 真实密钥必须来自受控运行环境，例如开发代理、服务端 API route、后端网关或受控本地环境。
4. 日志中禁止输出密钥。
5. 错误中禁止包含密钥。
6. `process.env.*API_KEY` 不得直接出现在 Novel 前端运行时代码中。
7. 如果必须读取环境变量，只能在服务端 / 代理 / CLI 受控脚本中读取。
8. 提交审查脚本必须检查硬编码 key 风险。

辅助函数：

```typescript
export function assertNoClientSideSecretAccess(source: string): { ok: boolean; violations: string[] };
```

## 10. 安全日志脱敏

实现于 `packages/app/src/novel/llm/llm-safe-logger.ts`。

接口：

```typescript
export interface SafeLLMLogInput {
  requestId: string;
  adapter: string;
  prompt?: string;
  responseText?: string;
  metadata?: Record<string, unknown>;
  usage?: LLMUsage;
  error?: string;
}

export interface SafeLLMLogEntry {
  requestId: string;
  adapter: string;
  promptPreview?: string;
  responsePreview?: string;
  metadata?: Record<string, unknown>;
  usage?: LLMUsage;
  error?: string;
}

export function createSafeLLMLogEntry(input: SafeLLMLogInput): SafeLLMLogEntry;
```

要求：

1. 默认只保留 prompt 前 80 字符以内的 preview。
2. 默认只保留 response 前 120 字符以内的 preview。
3. 自动遮蔽疑似密钥、Bearer token、API Key。
4. 不记录完整 prompt。
5. 不记录完整 response。
6. 空输入也要稳定返回。
7. 测试覆盖脱敏规则。

## 11. RealLLMAdapter 接口契约

定义在 `packages/app/src/novel/llm/real-llm-adapter-contract.ts`。

```typescript
export interface StreamingAgentExecutionAdapter {
  readonly name: string;
  canHandle(command: NovelCommand, context: AdapterContext): boolean;
  execute(command: NovelCommand, context: AdapterContext): Promise<NovelAgentResult>;
  executeStream(command: NovelCommand, context: AdapterContext): AsyncGenerator<LLMStreamEvent>;
}
```

要求：

1. 不替换 P2-E 的 Adapter 接口，只做兼容扩展。
2. `executeStream` 是 P3-A 的试点入口。
3. P3-0 只定义接口，不真实调用。
4. 中文注释说明为什么 UI 只消费 `LLMStreamEvent`，不消费供应商原始事件。

## 12. Real LLM Client Stub

实现于 `packages/app/src/novel/llm/real-llm-client.stub.ts`。

要求：

1. 不发真实请求。
2. 如果调用真实请求方法，必须返回 `REAL_LLM_NOT_ENABLED` 或 `CLIENT_STUB_ONLY`。
3. 能模拟流式事件用于测试。
4. 不依赖网络。
5. 不读取 API Key。
6. 不读取真实环境变量。
7. 不伪装为真实调用。

示例行为：

```text
executeStreamStub() 返回：
llm.request.started
llm.token.delta
llm.token.delta
llm.request.completed
```

## 13. 提交审查 / Hook 更新

更新 `packages/app/scripts/novel-precommit-check.ts`，新增检查项：

1. 禁止前端代码中出现硬编码 API Key。
2. 禁止 Novel 前端运行时代码直接读取 `process.env.*API_KEY`。
3. 禁止未通过 FeatureGate 发起真实 LLM 请求。
4. 禁止日志输出完整 prompt。
5. 禁止日志输出完整 response。
6. 禁止真实 LLM endpoint 硬编码。
7. 禁止 P3-0 出现实际 fetch 到外部 LLM API 的代码。

## 14. 中文注释强制要求

本阶段新增复杂逻辑必须写中文注释，尤其是：

1. FeatureGate 为什么默认关闭。
2. 为什么 P3-0 不允许真实调用。
3. 为什么前端不能持有 API Key。
4. 为什么日志必须脱敏。
5. 为什么 UI 只消费统一流式事件。
6. 为什么真实 Adapter 放到 P3-A。
7. 为什么 stub 不等于真实模型结果。

## 15. 测试计划

### 15.1 FeatureGate 测试

- `realLLMEnabled` 默认 false。
- `targetLLMAdapterEnabled` 默认 false。
- `llmStreamingEnabled` 默认 false。
- 关闭时返回 disabled。
- 开启组合校验可通过。

### 15.2 流式事件测试

- `llm.request.started` 类型合法。
- `llm.token.delta` 可追加文本。
- `llm.reasoning.delta` 与正文 token 区分。
- `llm.request.failed` 包含 errorCode。
- usage 可选。

### 15.3 密钥策略测试

- 检测硬编码 API Key 风险。
- 检测 `process.env.*API_KEY` 前端使用风险。
- 正常代码不误报。
- 错误文本中密钥可脱敏。

### 15.4 Safe Logger 测试

- prompt preview 被截断。
- response preview 被截断。
- Bearer token 被遮蔽。
- API Key 被遮蔽。
- metadata 保留安全字段。
- 空输入稳定返回。

### 15.5 Stub Client 测试

- 不发真实请求。
- 返回 stub 流式事件。
- 调用真实 execute 返回 `CLIENT_STUB_ONLY`。
- 不读取环境变量。

## 16. 验证命令

提交前必须执行：

```bash
cd packages/app
bun run novel:precommit
bun typecheck
bun test src/novel/llm
bun test src/novel/adapters
bun test src/novel
```

建议额外执行：

```bash
bun test src/novel/plugins
bun test src/novel/workflows
bun test src/novel/actions
```

## 17. Git 提交计划

提交范围：

```text
git add \
  packages/app/src/novel/llm \
  packages/app/src/novel/docs/phase-p3 \
  packages/app/src/novel/feature-gates.ts \
  packages/app/src/novel/adapters/adapter-router.ts \
  packages/app/scripts/novel-precommit-check.ts \
  docs/task-reports \
  .trae/hooks.json \
  scripts/trae-hooks \
  .trae/rules/agent-score-record.md \
  workspaces/kimik27code
```

建议提交信息：

```text
chore(novel): prepare real llm adapter readiness
```

## 18. 时间计划

| 阶段                 | 预计时间 | 产出                                                         |
| ------------------ | ---- | ---------------------------------------------------------- |
| 文档与类型设计            | 2 小时 | FeatureGate、事件协议、请求类型、错误类型、安全日志                            |
| Adapter 接口扩展       | 1 小时 | `StreamingAgentExecutionAdapter`、`real-llm-client.stub.ts` |
| 密钥策略与 precommit 更新 | 1 小时 | `llm-secret-policy.ts`、precommit 检查                        |
| 测试覆盖               | 2 小时 | llm 目录测试、adapters 回归                                       |
| 验证与提交              | 1 小时 | typecheck / precommit / 测试 / Git                           |
| 阶段报告               | 1 小时 | `PHASE-P3-0-REAL-LLM-READINESS-REPORT-20260621.md`         |

## 19. 风险清单

| 风险                   | 等级 | 说明                     | 缓解措施                                               |
| -------------------- | -- | ---------------------- | -------------------------------------------------- |
| 真实 LLM 冲动提前接入        | 高  | 团队可能在 P3-0 就尝试真实调用     | FeatureGate 默认关闭 + precommit 拦截 fetch / 硬编码 key    |
| 密钥管理环境未就绪            | 中  | 项目尚无后端代理               | P3-0 只定义策略与 client boundary，真实 transport 在 P3-A 注入 |
| 日志脱敏规则遗漏             | 中  | 新字段可能绕过脱敏              | 测试覆盖 + precommit 静态扫描                              |
| 流式事件与现有 UI 冲突        | 低  | UI 尚未按统一事件消费           | P3-0 不修改 UI，仅定义协议                                  |
| AdapterRouter 变更引入回归 | 低  | 新增 gate 检查可能影响 mock 链路 | 回归测试 adapter-router.test.ts                        |

## 20. P3-A 准入清单

进入 P3-A 前必须确认：

- [ ] P3-0 完成并通过主控评审
- [ ] `realLLMEnabled`、`targetLLMAdapterEnabled` 默认 false
- [ ] 流式事件协议已定义
- [ ] 密钥策略文档就位
- [ ] 安全日志脱敏已实现
- [ ] Client Stub 已实现且测试通过
- [ ] precommit 已扩展 API Key / endpoint 检查
- [ ] `bun run novel:precommit` 通过
- [ ] `bun typecheck` 通过
- [ ] `bun test src/novel` 通过
- [ ] Git 提交完成

## 21. 预期完成标记

P3-0 实施方案经主控评审通过后，进入实施阶段。实施完成并满足所有验收条件后输出：

```text
[READY_FOR_P3A_REAL_LLM_PILOT]
```

## 22. 提交主控评审

本实施方案已输出，等待主控评审。

期望主控结论：

```text
[PHASE_P3_0_PLAN_ACCEPTED]
[APPROVED_FOR_P3_0_IMPLEMENTATION]
```

或：

```text
[PHASE_P3_0_PLAN_REJECTED]
[NEED_REVISION_BEFORE_P3_0_IMPLEMENTATION]
```


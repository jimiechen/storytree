> 我是：前端工程师 / Novel 模块开发 Agent (Kimi-K2.7-Code)，本次任务：Phase P3-D Model Routing + Cost Governance 实施方案输出，职责范围：`packages/app/src/novel/`、`docs/task-reports/`、`workspaces/kimik27code/`；禁止触碰：其他模块源码。
> 越界操作申请：无。

# Phase P3-D：Model Routing + Cost Governance 实施方案

## 1. 阶段背景与目标

### 1.1 背景

- P3-C 已完成 `chapter.generate` 的真实 LLM 章节生成，具备 Token Budget、上下文裁剪、结果校验与重试。
- 当前所有真实 LLM 调用默认使用单一 DeepSeek 配置，无法按任务角色选择不同模型，也未记录用量与成本。

### 1.2 本阶段目标

引入**多模型路由**、**用量统计**、**成本估算**与**失败降级**，使不同创作任务角色（draft / rewrite / audit / outline / summary / critic）可映射到不同模型配置，并在真实调用失败时安全回退到 mock/stub。

### 1.3 阶段完成标记

```text
[READY_FOR_P3_FINAL_REVIEW]
```

---

## 2. 硬性边界

### 2.1 禁止事项

1. 禁止接入真实支付或扣费逻辑。
2. 禁止把成本估算当作真实账单展示给用户。
3. 禁止默认启用高价模型。
4. 禁止泄露供应商原始响应全文。
5. 禁止未通过 FeatureGate 开启模型路由能力。
6. 禁止自动 fallback 时覆盖用户已确认的结果。
7. 禁止测试未通过提交。

### 2.2 允许事项

1. 按 `modelRole` / `commandType` / 用户偏好选择模型配置。
2. 记录 token usage（prompt / completion / total）。
3. 预留成本字段与单次/累计估算。
4. 在 gate 开启时允许真实失败回退到 mock。
5. 在 UI 展示当前模型策略与预估成本。
6. 测试通过后提交代码。

---

## 3. 当前状态

### 3.1 已有能力

| 文件 | 当前状态 | 说明 |
|------|---------|------|
| `adapters/adapter-router.ts` | 支持 mock / opencode-stub / claudecode-stub / real-llm 路由 | 已支持双 gate 校验 |
| `adapters/real-llm-adapter.ts` | 支持真实 LLM 执行与流式 | 默认 disabled transport |
| `llm/llm-feature-gates.ts` | 真实 LLM gate 定义 | 含 `llmCostTrackingEnabled` |
| `llm/llm-request-types.ts` | `LLMUsage` / `LLMRequestMetadata` | 已预留 `modelProfileId` / `modelRole` |
| `llm/llm-stream-events.ts` | 统一流式事件 | `completed` 事件可携带 `usage` |
| `plugins/core-writing-tools/agent-run.tool.ts` | 透传 adapter / stream / context | 默认按 gate 选择 adapter |
| `types/ai-task.ts` | `NovelAgentResult` | 已支持 `validationIssues` / `wasTrimmed` |

### 3.2 当前缺陷

1. 没有 `ModelProfile` / `ModelRole` 配置实体。
2. `AdapterContext.modelProfileId` / `modelRole` 只透传，不参与路由或模型选择。
3. `RealLLMExecutionAdapter` 使用单一固定 transport，无法按 profile 切换模型参数。
4. 没有 usage 记录与成本估算模块。
5. 真实调用失败时没有 fallback 机制。
6. UI 没有模型选择面板。

---

## 4. 方案设计

### 4.1 总体链路

```text
UI / YAML 调用 agent-run
→ AdapterRouter.route(requested, command, context, gates)
→ 若未指定 adapter 且 modelRoutingEnabled：ModelRouter.resolveProfile(command, context)
   → 返回 ModelProfile（modelId, adapterKind, maxTokens, temperature, costPer1KPrompt, costPer1KCompletion）
→ RealLLMExecutionAdapter 按 profile 创建/选择 TargetLLMClient（注入对应 DeepSeekTransport 参数）
→ 调用真实 LLM
→ 返回结果 + usage
→ UsageTracker.record(requestId, profile, usage)
→ CostEstimator.estimate(profile, usage) 写入 NovelAgentResult.metadata
→ 若真实失败且 fallback enabled → FallbackHandler 返回 mock 结果并标记 fallback=true
→ UI 展示结果、模型信息、预估成本与 fallback 提示
```

### 4.2 模块划分

```text
packages/app/src/novel/
├── llm/
│   ├── model-profile.ts              # 新增：ModelProfile / ModelRole 类型与默认配置
│   ├── model-profile-registry.ts     # 新增：模型配置注册表
│   ├── model-router.ts               # 新增：根据 role / command 解析 profile
│   ├── usage-tracker.ts              # 新增：记录 LLMUsage
│   ├── cost-estimator.ts             # 新增：单次/累计成本估算
│   └── fallback-handler.ts           # 新增：真实失败回退逻辑
├── adapters/
│   ├── adapter-types.ts              # 修改：扩展 AdapterContext / AdapterFeatureGates
│   ├── adapter-router.ts             # 修改：默认路由支持 modelRole
│   ├── real-llm-adapter.ts           # 修改：按 profile 选择 client，记录 usage，支持 fallback
│   └── real-llm-adapter.test.ts      # 修改：补充路由 / usage / fallback 测试
├── plugins/core-writing-tools/
│   └── agent-run.tool.ts             # 修改：透传 modelProfileId / modelRole，集成 usage
├── feature-gates.ts                  # 修改：新增 modelRoutingEnabled / llmFallbackToMockEnabled / modelSelectionUIEnabled
├── hooks/use-novel-workflow.ts       # 修改：展示模型策略与成本
├── components/novel-editor/
│   ├── ai-task-panel.tsx             # 修改：显示当前 modelProfile / 预估成本
│   ├── ai-result-card.tsx            # 修改：显示 fallback 提示与模型信息
│   └── model-selection-panel.tsx     # 新增：模型选择面板（dev-only gate 下可用）
└── docs/phase-p3/
    └── p3d-model-routing-scope.md    # 新增：P3-D 范围与安全边界说明
```

---

## 5. 详细任务清单

### 5.1 ModelProfile 与 ModelRole

**新增文件**: `packages/app/src/novel/llm/model-profile.ts`

```typescript
export type ModelRole = 'draft' | 'rewrite' | 'audit' | 'outline' | 'summary' | 'critic';

export interface ModelProfile {
  id: string;
  name: string;
  adapter: 'real-llm' | 'mock';
  provider: 'deepseek' | 'openai' | 'disabled';
  modelId: string;                 // e.g. 'deepseek-v4-flash'
  maxTokens: number;
  temperature: number;
  costPer1KPromptTokens: number;   // 预留，单位：人民币分/千 token
  costPer1KCompletionTokens: number;
}

export const DEFAULT_MODEL_PROFILES: ModelProfile[] = [
  { id: 'deepseek-flash', name: 'DeepSeek Flash', adapter: 'real-llm', provider: 'deepseek', modelId: 'deepseek-v4-flash', maxTokens: 2048, temperature: 0.7, costPer1KPromptTokens: 0.05, costPer1KCompletionTokens: 0.1 },
  { id: 'deepseek-chat', name: 'DeepSeek Chat', adapter: 'real-llm', provider: 'deepseek', modelId: 'deepseek-chat', maxTokens: 4096, temperature: 0.7, costPer1KPromptTokens: 0.1, costPer1KCompletionTokens: 0.2 },
  { id: 'mock-default', name: 'Mock', adapter: 'mock', provider: 'disabled', modelId: 'mock', maxTokens: 0, temperature: 0, costPer1KPromptTokens: 0, costPer1KCompletionTokens: 0 },
];
```

要求：

1. 不硬编码 API Key。
2. 默认启用低价/轻量模型（deepseek-flash）。
3. `costPer1K*` 为估算值，仅用于成本提示，不做账单。

### 5.2 ModelProfileRegistry

**新增文件**: `packages/app/src/novel/llm/model-profile-registry.ts`

职责：

1. 注册 / 查询 `ModelProfile`。
2. 提供默认 registry（含 `DEFAULT_MODEL_PROFILES`）。
3. 支持测试注入自定义 profile。

### 5.3 ModelRouter

**新增文件**: `packages/app/src/novel/llm/model-router.ts`

```typescript
export interface ModelRouter {
  resolveProfile(command: NovelCommand, context: AdapterContext): ModelProfile;
}
```

默认映射策略：

| command / role | 默认 profile |
|----------------|-------------|
| chapter.generate / draft | deepseek-flash |
| chapter.continue / draft | deepseek-flash |
| rewrite-selection / rewrite | deepseek-chat |
| info.extract / audit | deepseek-flash |
| summarize-chapter / summary | deepseek-flash |
| character-voice / critic | deepseek-chat |
| 用户显式指定 | 指定 profile |

### 5.4 UsageTracker

**新增文件**: `packages/app/src/novel/llm/usage-tracker.ts`

```typescript
export interface LLMUsageRecord {
  requestId: string;
  profileId: string;
  modelId: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  createdAt: string;
}

export interface UsageTracker {
  record(record: LLMUsageRecord): void;
  list(): LLMUsageRecord[];
  getTotalTokens(): number;
}
```

实现：

1. 默认内存存储（不持久化到用户目录）。
2. 从 `LLMRequestCompletedEvent.usage` 读取用量。
3. 测试可注入。

### 5.5 CostEstimator

**新增文件**: `packages/app/src/novel/llm/cost-estimator.ts`

```typescript
export interface CostEstimate {
  promptCost: number;      // 分
  completionCost: number;  // 分
  totalCost: number;       // 分
  currency: 'CNY-CENT';    // 仅作估算单位
}

export function estimateCost(profile: ModelProfile, usage: LLMUsage): CostEstimate;
export function estimateCostByChars(profile: ModelProfile, promptChars: number, completionChars: number): CostEstimate;
```

要求：

1. 仅返回估算值，不触发真实扣费。
2. 当 usage 缺失时，可按字符数做粗略估算（中文 ≈ 1 token / 字，留余量）。
3. 成本字段写入 `NovelAgentResult.metadata.estimatedCost`。

### 5.6 Fallback Handler

**新增文件**: `packages/app/src/novel/llm/fallback-handler.ts`

```typescript
export interface FallbackResult {
  success: true;
  result: NovelAgentResult;
  fallback: true;
  originalErrorCode: string;
}

export async function executeWithFallback(
  operation: () => Promise<AdapterExecutionResult>,
  fallback: () => Promise<AdapterExecutionResult>,
  options?: { enabled?: boolean; retryableCodes?: string[] },
): Promise<AdapterExecutionResult & { fallback?: boolean; originalErrorCode?: string }>;
```

要求：

1. 仅在 `llmFallbackToMockEnabled=true` 时启用。
2. 只对真实网络/超时/空响应错误回退，不对 gate 错误回退。
3. fallback 结果标记 `fallback=true`，并在 summary 中提示用户。
4. 不覆盖已有正文。

### 5.7 Real LLM Adapter 增强

**修改文件**: `packages/app/src/novel/adapters/real-llm-adapter.ts`

变更：

1. 接收 `ModelProfileRegistry` 与 `UsageTracker` 注入。
2. 在 `execute` / `executeStream` 中调用 `ModelRouter.resolveProfile`。
3. 根据 profile 构造或选择 `TargetLLMClient`（按 provider/modelId 创建 DeepSeekTransport）。
4. 完成后读取 `usage`，调用 `UsageTracker.record` 与 `CostEstimator.estimate`。
5. 失败时若 fallback 开启，调用 `MockExecutionAdapter` 生成结果并返回。

### 5.8 AdapterRouter 扩展

**修改文件**: `packages/app/src/novel/adapters/adapter-router.ts`

变更：

1. 未指定 adapter 时，若 `modelRoutingEnabled` 为 true 且命令可被 real-llm 处理，则默认尝试 real-llm（仍受双 gate 控制）。
2. 否则保持 mock 默认。

### 5.9 FeatureGate 扩展

**修改文件**: `packages/app/src/novel/feature-gates.ts` / `llm/llm-feature-gates.ts`

新增 gate：

- `modelRoutingEnabled`：是否启用多模型路由，默认 false。
- `llmFallbackToMockEnabled`：真实失败是否允许回退 mock，默认 false。
- `modelSelectionUIEnabled`：是否显示模型选择面板，默认 false。

### 5.10 agent-run Tool 扩展

**修改文件**: `packages/app/src/novel/plugins/core-writing-tools/agent-run.tool.ts`

变更：

1. 解析 `modelProfileId` / `modelRole` 输入。
2. 写入 `AdapterContext`。
3. 将 `UsageTracker` 注入 `RealLLMExecutionAdapter`。

### 5.11 UI 增强

**修改文件**: `packages/app/src/novel/components/novel-editor/ai-task-panel.tsx`、`ai-result-card.tsx`

变更：

1. 展示当前 `modelProfileId` 与 `estimatedCost`。
2. fallback 结果显示黄色提示「真实模型调用失败，已回退到 Mock」。
3. `model-selection-panel.tsx`：仅在 `modelSelectionUIEnabled` 时显示，允许选择 profile（dev-only）。

### 5.12 文档

**新增文件**: `packages/app/src/novel/docs/phase-p3/p3d-model-routing-scope.md`

内容：

1. P3-D 目标与边界。
2. ModelProfile / ModelRole 设计。
3. 成本估算规则与货币单位说明。
4. fallback 策略。
5. FeatureGate 列表。

---

## 6. 测试计划

### 6.1 单元测试

| 文件 | 测试内容 |
|------|---------|
| `model-profile.test.ts` | 默认 profile 结构、role 映射 |
| `model-router.test.ts` | role → profile 解析、用户指定覆盖 |
| `usage-tracker.test.ts` | 记录、查询、累计 token |
| `cost-estimator.test.ts` | 按 usage 估算、按字符数估算、零成本 profile |
| `fallback-handler.test.ts` | 可回退错误、不可回退错误、disabled 时直接失败 |
| `real-llm-adapter.test.ts` | profile 选择、usage 记录、fallback 标记 |
| `agent-run.tool.test.ts` | modelProfileId / modelRole 透传、fallback 开启 |

### 6.2 手动验证

1. gate 开启后 `chapter.generate` 按 draft role 选择默认 flash profile。
2. 手动指定 `deepseek-chat` 后使用 chat profile。
3. 真实调用失败（可临时使用错误 baseURL）后回退 mock。
4. UI 显示模型名称与预估成本。
5. 日志中无 API Key、无完整供应商响应。

---

## 7. 验收标准

| 编号 | 验收项 | 标准 |
|------|--------|------|
| 1 | ModelProfile / ModelRole | 有类型、默认配置、注册表 |
| 2 | 模型路由 | 按 role / command 解析 profile，用户可覆盖 |
| 3 | Usage 记录 | 真实调用后记录 prompt/completion/total tokens |
| 4 | 成本估算 | 单次调用可估算成本，不触发支付 |
| 5 | Fallback | 真实失败可回退 mock，且结果标记 fallback |
| 6 | FeatureGate | modelRoutingEnabled / llmFallbackToMockEnabled / modelSelectionUIEnabled 默认关闭 |
| 7 | UI | AI Task Panel / Result Card 显示模型策略与成本 |
| 8 | 安全 | API Key 不进入前端，日志脱敏 |
| 9 | 测试 | `bun typecheck` 0 errors，`bun test src/novel` 全通过，`bun run novel:precommit` PASSED |
| 10 | Git | 代码与报告已提交 |

---

## 8. 风险与未完成项

| 风险 | 说明 | 缓解 |
|------|------|------|
| 成本估算不准 | 使用字符 proxy 与固定单价，可能与真实账单有偏差 | 明确标注为「估算」，P4 可接入真实 usage 与动态定价 |
| 多供应商 transport | 当前仅 DeepSeek transport；OpenAI 等需新增 transport | P3-D 只扩展接口，新 transport 可延后 |
| fallback 掩盖问题 | 频繁 fallback 可能让用户忽略真实调用失败 | UI 明确提示 fallback 与原始错误码 |
| UI 模型选择仅限 dev | 生产环境默认关闭，避免用户误选高价模型 | `modelSelectionUIEnabled` 默认 false |

---

## 9. Git 提交计划

1. **代码提交**: `feat(novel): P3-D model routing, usage tracking and cost governance`
2. **报告提交**: `docs(novel): add Phase P3-D implementation plan`

---

## 10. 下一阶段

Phase P3 Final Review：真实 LLM MVP 冻结验收，确认安全、gate、流式、UI、日志、失败处理、用量记录全部满足后进入 P4。

---

## 11. 阶段进入标记

本方案待主控验收。验收方式：

- 通过：`[P3D_PLAN_ACCEPTED]` 或 `[APPROVED_FOR_P3D_IMPLEMENTATION]`
- 修改后通过：主控指出修改点，本 Agent 修订后
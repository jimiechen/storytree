# P3-D 模型路由与成本治理范围文档

> **阶段**: P3-D (Model Routing & Cost Governance)
> **目标**: 在真实 LLM 调用可控的基础上，引入多模型路由、用量记录、成本估算与失败回退机制，并为 UI 提供模型策略与成本提示。

## 1. 设计原则

- **默认关闭**: 所有 P3-D 功能默认通过 FeatureGate 关闭，避免误发真实请求或误展示高级选项。
- **用户可控**: `modelProfileId` / `modelRole` 可由上层（YAML / Tool / UI）显式指定，未指定时按 command 类型推断。
- **成本透明**: 仅估算成本（CNY-CENT），不触发真实支付，不作为账单展示。
- **安全回退**: 仅在真实网络/超时/空响应等可重试错误时回退到 mock，gate 错误不回退。
- **不泄露密钥**: API Key 仍通过环境注入，不进入前端源码。

## 2. 核心模块

### 2.1 ModelProfile

- 文件: `packages/app/src/novel/llm/model-profile.ts`
- 定义: `ModelProfile` / `ModelRole` / `DEFAULT_MODEL_PROFILES`
- 说明: 描述可路由的模型配置，包括 provider、modelId、生成参数与估算单价。

### 2.2 ModelProfileRegistry

- 文件: `packages/app/src/novel/llm/model-profile-registry.ts`
- 定义: `ModelProfileRegistry` / `createModelProfileRegistry` / `createDefaultModelProfileRegistry`
- 说明: 管理模型配置注册、查询与默认实例；测试可注入自定义配置。

### 2.3 ModelRouter

- 文件: `packages/app/src/novel/llm/model-router.ts`
- 定义: `ModelRouter` / `createModelRouter`
- 路由策略:
  1. 若 `context.modelProfileId` 存在且注册表中存在该 profile，直接使用。
  2. 否则根据 `context.modelRole` 或 command 类型推断默认 role。
  3. 按 role 选择默认 profile id；若缺失则回退到注册表第一个 profile。

### 2.4 UsageTracker

- 文件: `packages/app/src/novel/llm/usage-tracker.ts`
- 定义: `UsageTracker` / `createUsageTracker` / `buildUsageRecord`
- 说明: 内存记录每次 LLM 调用的 token 用量，不持久化。

### 2.5 CostEstimator

- 文件: `packages/app/src/novel/llm/cost-estimator.ts`
- 定义: `CostEstimate` / `estimateCost` / `estimateCostByChars`
- 说明: 基于 token 用量与 profile 单价估算成本，单位 CNY-CENT。

### 2.6 FallbackHandler

- 文件: `packages/app/src/novel/llm/fallback-handler.ts`
- 定义: `executeWithFallback` / `DEFAULT_FALLBACK_RETRYABLE_CODES`
- 说明: 真实 LLM 失败时按策略回退到 mock adapter，结果标记 `fallback=true` 与 `originalErrorCode`。

## 3. 集成点

### 3.1 FeatureGates

新增 gate:
- `modelRoutingEnabled`: 启用多模型路由（AdapterRouter 未指定 adapter 时优先尝试 real-llm）。
- `llmFallbackToMockEnabled`: 真实失败时允许回退 mock。
- `modelSelectionUIEnabled`: 显示模型选择面板（UI 预留）。

### 3.2 AdapterContext

新增字段:
- `modelProfileId?: string`
- `modelRole?: 'draft' | 'rewrite' | 'audit' | 'outline' | 'summary' | 'critic'`
- `fallback?: boolean`
- `originalErrorCode?: string`

### 3.3 RealLLMExecutionAdapter

- 接收 `registry` / `tracker` / `clientFactory` / `fallbackAdapter`。
- `execute` 中解析 profile、选择 client、记录用量、估算成本、失败时回退。
- 返回 `NovelAgentResult` 中 `metadata.modelProfileId` / `modelId` / `estimatedCost`。

### 3.4 AdapterRouter

- 未指定 adapter 时，若 `modelRoutingEnabled && realLLMEnabled && targetLLMAdapterEnabled`，优先尝试 `real-llm` adapter。
- 否则返回第一个能处理命令的 adapter。

### 3.5 agent-run Tool

- 输入新增 `modelProfileId` / `modelRole` 解析。
- 通过 `buildAdapterContext` 透传给 RealLLMExecutionAdapter。

### 3.6 UI

- `AITask` 类型新增 `modelProfileId` / `modelId` / `estimatedCost` / `fallback` / `originalErrorCode`。
- `AIResultCard` 在生成成功时展示模型策略、预估成本与 fallback 提示。
- `NovelEditor` 将 `NovelAgentResult.metadata` 与 `fallback` 同步到展示信号。

## 4. 测试覆盖

- `model-profile-registry.test.ts`
- `model-router.test.ts`
- `usage-tracker.test.ts`
- `cost-estimator.test.ts`
- `fallback-handler.test.ts`
- `real-llm-adapter.test.ts` (P3-D 补充用例)
- `agent-run.tool.test.ts` (P3-D 补充用例)

## 5. 默认模型策略

| Role | 默认 Profile | 场景 |
|------|-------------|------|
| draft / outline / summary / audit | deepseek-flash | 生成、扩写、总结、信息提取 |
| rewrite / critic | deepseek-chat | 改写、润色、批评 |

## 6. 注意事项

- `modelProfileId` 优先级高于 `modelRole`；两者都未指定时按 command 推断。
- fallback 产生的文本来自 mock adapter，UI 明确提示用户检查。
- 成本估算基于 token 数，供应商未返回 usage 时不显示成本。

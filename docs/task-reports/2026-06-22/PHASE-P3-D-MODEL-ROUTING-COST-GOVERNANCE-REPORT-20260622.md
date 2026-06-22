# Phase P3-D Model Routing + Cost Governance 实施报告

> 角色：前端工程师 / Novel 模块开发 Agent (Kimi-K2.7-Code)  
> 任务：Phase P3-D Model Routing + Cost Governance 实施  
> 任务来源：`caiode/docs/tabbit/06/P3P4P5阶段目标.md`  
> 完成时间：2026-06-22

---

## 一、任务目标

在 P3-C 真实 LLM 章节生成能力基础上，引入模型路由与成本治理机制：

- 支持多模型配置（ModelProfile）与按角色/命令路由。
- 记录 LLM token 用量（UsageTracker）。
- 估算单次与累计成本（CostEstimator）。
- 真实 LLM 失败时安全回退 mock（FallbackHandler）。
- UI 展示模型策略、预估成本与 fallback 提示。
- 扩展 agent-run Tool 与 FeatureGate，保证可观测、可治理。

## 二、完成内容

- [x] 新增 `model-profile.ts`：定义 `ModelProfile`、`ModelRole`、`DEFAULT_MODEL_PROFILES`。
- [x] 新增 `model-profile-registry.ts`：提供可注入的 `ModelProfileRegistry` 与默认注册表。
- [x] 新增 `model-router.ts`：按 `modelProfileId` → `modelRole` → 命令类型推断三层解析模型。
- [x] 新增 `usage-tracker.ts`：内存级 token 用量记录与累计。
- [x] 新增 `cost-estimator.ts`：按 token/字符估算成本，结果统一为 `CNY-CENT`。
- [x] 新增 `fallback-handler.ts`：仅对可重试 LLM 错误执行 mock 回退。
- [x] 扩展 `llm-feature-gates.ts`：新增 `modelRoutingEnabled`、`llmFallbackToMockEnabled`、`modelSelectionUIEnabled`。
- [x] 扩展 `adapter-types.ts`：`AdapterContext` 增加 `modelProfileId`、`modelRole`、`fallback`、`originalErrorCode`。
- [x] 扩展 `adapter-router.ts`：未指定 adapter 且 gate 开启时优先路由到 real-llm。
- [x] 增强 `real-llm-adapter.ts`：按 profile 选择模型、记录用量、估算成本、失败 fallback。
- [x] 扩展 `agent-run.tool.ts`：透传 `modelProfileId` / `modelRole`。
- [x] 扩展 `ai-task.ts`/`ai-result-card.tsx`/`novel-editor/index.tsx`：展示模型策略、成本与 fallback 提示。
- [x] 新增 P3-D 范围文档：`p3d-model-routing-cost-governance-scope.md`。
- [x] 新增/更新单元测试，覆盖 model-profile、registry、router、usage、cost、fallback、adapter、tool。

## 三、代码变更

| 文件路径 | 变更类型 | 说明 |
|---------|---------|------|
| `packages/app/src/novel/llm/model-profile.ts` | 新增 | ModelProfile / ModelRole / 默认配置 |
| `packages/app/src/novel/llm/model-profile-registry.ts` | 新增 | 注册表实现 |
| `packages/app/src/novel/llm/model-router.ts` | 新增 | 模型路由逻辑 |
| `packages/app/src/novel/llm/usage-tracker.ts` | 新增 | 用量记录 |
| `packages/app/src/novel/llm/cost-estimator.ts` | 新增 | 成本估算 |
| `packages/app/src/novel/llm/fallback-handler.ts` | 新增 | fallback 执行器 |
| `packages/app/src/novel/llm/*.test.ts` | 新增 | 对应单元测试 |
| `packages/app/src/novel/llm/llm-feature-gates.ts` | 修改 | 新增 P3-D gate |
| `packages/app/src/novel/llm/index.ts` | 修改 | 导出新增模块 |
| `packages/app/src/novel/adapters/adapter-types.ts` | 修改 | 扩展 AdapterContext |
| `packages/app/src/novel/adapters/adapter-router.ts` | 修改 | 支持模型路由 |
| `packages/app/src/novel/adapters/real-llm-adapter.ts` | 修改 | 支持 profile/fallback/用量/成本 |
| `packages/app/src/novel/adapters/real-llm-adapter.test.ts` | 修改 | 补充 P3-D 测试 |
| `packages/app/src/novel/plugins/core-writing-tools/agent-run.tool.ts` | 修改 | 透传 modelProfileId/modelRole |
| `packages/app/src/novel/plugins/core-writing-tools/agent-run.tool.test.ts` | 修改 | 补充 P3-D 测试 |
| `packages/app/src/novel/types/ai-task.ts` | 修改 | 扩展 AITask / NovelAgentResultMetadata |
| `packages/app/src/novel/components/novel-editor/ai-result-card.tsx` | 修改 | 展示模型策略/成本/fallback |
| `packages/app/src/novel/components/novel-editor/index.tsx` | 修改 | 同步模型元数据到 UI |
| `packages/app/src/novel/feature-gates.ts` | 修改 | 扩展 NovelFeatureGates |
| `packages/app/src/novel/providers/fake-agent.ts` | 修改 | 适配 NovelAgentResult 新字段 |
| `packages/app/src/novel/docs/phase-p3/p3d-model-routing-cost-governance-scope.md` | 新增 | P3-D 范围文档 |

## 四、测试验证

- **bun typecheck**：0 errors
- **bun test src/novel**：424 pass / 0 fail / 2 skip
- **bun run novel:precommit**：PASSED

> 2 个 skip 为 DeepSeek 真实 LLM 集成测试（默认跳过，避免无密钥时失败）。

## 五、Git 提交

- **Commit Hash**: `01d70995`
- **Commit Message**: `feat(P3-D): implement model routing and cost governance`
- **分支**: `main`

## 六、遇到的问题与修复

| 问题 | 原因 | 修复 |
|------|------|------|
| novel:precommit 失败 4 个测试 | 三个新增测试文件末尾被截断，缺少 `});` 闭合 | 补全测试文件语法 |
| `estimateCost` 舍入测试失败 | 浮点加法 `0.06 + 0.57 = 0.6299999999999999` | `totalCost` 也做 `Math.round(... * 100) / 100` |

## 七、经验总结

- 新增测试文件生成后必须立即检查文件完整性，截断会导致批量失败。
- 成本估算需统一处理浮点精度，避免直接相加导致断言失败。
- 模型路由保持“显式 profile > role > 命令推断”优先级，逻辑清晰且易测试。

## 八、下一步建议

- 进入 Phase P3 总体验收（`READY_FOR_PHASE_P3_REVIEW`）。
- 若后续接入多供应商（OpenAI / 国产模型），仅需在 `DEFAULT_MODEL_PROFILES` 与 `defaultProfileIdForRole` 中扩展。

## 九、Exit Criteria 自评

| 检查项 | 状态 |
|--------|------|
| 代码文件行数 < 500 行 | 通过 |
| 所有新增模块含单元测试 | 通过 |
| typecheck 0 errors | 通过 |
| novel 测试 0 fail | 通过 |
| novel:precommit PASSED | 通过 |
| 无硬编码 API Key | 通过 |
| 报告含 READY 标记 | 通过 |

---

**阶段结论**: `[READY_FOR_P3_FINAL_REVIEW]` / `[READY_FOR_PHASE_P3_REVIEW]`

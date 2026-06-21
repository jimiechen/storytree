> 我是：前端工程师 / Novel 模块开发 Agent（Kimi-K2.7-Code），本次任务：Phase P3-0 Real LLM Readiness 实现与汇报，职责范围：`packages/app/src/novel/`、`packages/app/scripts/`、`scripts/trae-hooks/shared/`、`docs/task-reports/`、`workspaces/kimik27code/`；禁止触碰：`packages/opencode/`、`packages/sdk/`、`packages/plugin/`、`packages/desktop/`、`packages/ui/`、根目录 package.json / turbo.json / tsconfig。
> 越界操作申请：无。

# Phase P3-0：Real LLM Readiness 实施报告

## 1. 阶段目标

在 P2 架构闭环基础上，为 P3-A 第一次受控真实 LLM 调用补齐：

1. 真实 LLM FeatureGate 与默认关闭策略。
2. 统一 LLM 请求 / 响应 / Usage / 错误类型。
3. NovelForge 统一流式事件协议。
4. 安全日志脱敏工具。
5. 密钥策略与前端不持有 API Key 的约束。
6. 支持流式事件的真实 LLM Adapter 接口契约。
7. 不发起真实请求的 Client Stub。
8. precommit 增量检查（API Key / endpoint / 完整 prompt 日志）。
9. phase-p3 文档（密钥策略 / 流式协议 / Pilot 范围 / Readiness）。
10. 完整单元测试覆盖。

## 2. 阶段边界

P3-0 **不发起真实 LLM 请求**，仅完成 readiness 与治理边界。

## 3. 新增文件

### 3.1 代码文件

| 文件 | 说明 |
|---|---|
| `packages/app/src/novel/llm/index.ts` | 模块导出聚合 |
| `packages/app/src/novel/llm/llm-feature-gates.ts` | 真实 LLM FeatureGate 与开关判断 |
| `packages/app/src/novel/llm/llm-request-types.ts` | LLM 请求 / 响应 / Usage 类型 |
| `packages/app/src/novel/llm/llm-stream-events.ts` | 统一流式事件协议与 helper |
| `packages/app/src/novel/llm/llm-error-types.ts` | 结构化 LLM 错误 |
| `packages/app/src/novel/llm/llm-safe-logger.ts` | 安全日志脱敏 |
| `packages/app/src/novel/llm/llm-secret-policy.ts` | 密钥策略与检测函数 |
| `packages/app/src/novel/llm/real-llm-adapter-contract.ts` | StreamingAgentExecutionAdapter 接口 |
| `packages/app/src/novel/llm/real-llm-client.stub.ts` | 不发起请求的 Client Stub |

### 3.2 测试文件

| 文件 | 说明 |
|---|---|
| `packages/app/src/novel/llm/llm-feature-gates.test.ts` | FeatureGate 测试 |
| `packages/app/src/novel/llm/llm-stream-events.test.ts` | 流式事件测试 |
| `packages/app/src/novel/llm/llm-safe-logger.test.ts` | 安全日志脱敏测试 |
| `packages/app/src/novel/llm/llm-secret-policy.test.ts` | 密钥策略测试 |
| `packages/app/src/novel/llm/llm-error-types.test.ts` | 错误类型测试 |
| `packages/app/src/novel/llm/real-llm-client.stub.test.ts` | Client Stub 测试 |

### 3.3 文档文件

| 文件 | 说明 |
|---|---|
| `packages/app/src/novel/docs/phase-p3/p3-real-llm-readiness.md` | Readiness 总览 |
| `packages/app/src/novel/docs/phase-p3/p3-llm-secret-policy.md` | 密钥策略 |
| `packages/app/src/novel/docs/phase-p3/p3-llm-streaming-contract.md` | 流式事件协议 |
| `packages/app/src/novel/docs/phase-p3/p3-real-llm-pilot-scope.md` | 首次真实调用 Pilot 范围 |

## 4. 修改文件

| 文件 | 修改内容 |
|---|---|
| `packages/app/src/novel/feature-gates.ts` | 新增 `targetLLMAdapterEnabled` / `llmStreamingEnabled` / `llmRequestLogEnabled` / `llmCostTrackingEnabled` / `llmSafePromptLoggingEnabled` |
| `packages/app/src/novel/adapters/adapter-types.ts` | AdapterKind 增加 `real-llm` |
| `packages/app/src/novel/adapters/adapter-router.ts` | 显式请求 `real-llm` 且 gate 关闭时返回 `ADAPTER_DISABLED`；gate 检查优先于 adapter 存在性检查 |
| `packages/app/src/novel/adapters/adapter-router.test.ts` | 新增 real-llm 路由边界测试 |
| `packages/app/scripts/novel-precommit-check.ts` | 新增 client-side secret / LLM endpoint / 完整 prompt 日志检查 |
| `scripts/trae-hooks/shared/novel-rules.ts` | 新增 `CLIENT_SIDE_SECRET_PATTERNS` / `LLM_ENDPOINT_PATTERNS` / `FULL_PROMPT_LOGGING_PATTERNS` |

## 5. 验证结果

| 检查项 | 目标 | 实际结果 |
|---|---|---|
| `bun typecheck` | 0 errors | ✅ 0 errors |
| `bun run novel:precommit` | 通过 | ✅ PASSED |
| `bun test src/novel/llm` | 通过 | ✅ 28 pass / 0 fail |
| `bun test src/novel/adapters` | 通过 | ✅ 22 pass / 0 fail |
| `bun test src/novel/plugins` | 通过 | ✅ 31 pass / 0 fail |
| `bun test src/novel/workflows/engine` | 通过 | ✅ 32 pass / 0 fail |
| `bun test src/novel/actions` | 通过 | ✅ 7 pass / 0 fail |
| `bun test src/novel` | 通过 | ✅ 290 pass / 0 fail |

## 6. 关键设计决策

1. **FeatureGate 双开关**：`realLLMEnabled` + `targetLLMAdapterEnabled` 必须同时开启，避免单个开关误触导致真实调用。
2. **Router gate 优先**：显式请求 `real-llm` 时，即使未注册真实 adapter，也会先返回 `ADAPTER_DISABLED`，避免泄露未注册信息。
3. **前端不持有密钥**：通过 precommit 正则拦截 `process.env.*API_KEY`、硬编码 `sk-...`、`Bearer ...`。
4. **日志脱敏**：默认只保留 prompt 前 80 字符、response 前 120 字符，自动遮蔽疑似密钥。
5. **Stub 不伪装**：`RealLLMClientStub.execute` 直接抛 `CLIENT_STUB_ONLY`，`executeStream` 返回带 `[Stub]` 前缀的事件，不模拟真实模型输出。

## 7. 风险与处理

| 风险 | 等级 | 处理 |
|---|---|---|
| 团队提前接入真实 LLM | 高 | FeatureGate 默认关闭 + precommit 拦截 fetch / 硬编码 key |
| 密钥管理环境未就绪 | 中 | P3-A 通过受控代理 / 服务端路由注入，前端不改动 |
| 日志脱敏规则遗漏 | 中 | 单元测试覆盖 + precommit 静态扫描 |
| 流式事件与现有 UI 冲突 | 低 | P3-0 不修改 UI，仅定义协议 |

## 8. Git 提交

- 提交哈希：`4e7ddf07`
- 提交信息：`chore(novel): prepare real llm adapter readiness`

## 9. 完成标记

```text
[READY_FOR_P3A_REAL_LLM_PILOT]
```

## 10. 相关文档

- [PHASE-P3-0-REAL-LLM-READINESS-PLAN-20260621.md](PHASE-P3-0-REAL-LLM-READINESS-PLAN-20260621.md)
- [PHASE-P2-FINAL-REVIEW-REPORT-20260621.md](PHASE-P2-FINAL-REVIEW-REPORT-20260621.md)
- [p3-real-llm-readiness.md](../../../caiode/opencode-1.4.0/packages/app/src/novel/docs/phase-p3/p3-real-llm-readiness.md)

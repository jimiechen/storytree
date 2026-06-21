> 我是：前端工程师 / Novel 模块开发 Agent（Kimi-K2.7-Code），本次任务：Phase P3-A Real LLM Adapter Pilot 实现与汇报，职责范围：`packages/app/src/novel/`、`docs/task-reports/`、`workspaces/kimik27code/`；禁止触碰：`packages/opencode/`、`packages/sdk/`、`packages/plugin/`、`packages/desktop/`、`packages/ui/`、根目录 package.json / turbo.json / tsconfig。
> 越界操作申请：无。

# Phase P3-A：Real LLM Adapter Pilot 实施报告

## 1. 阶段目标

在 P3-0 Real LLM Readiness 已完成的基础上，完成首次受控真实 LLM 调用 Pilot：

1. 实现可注入 transport 的真实 LLM Client，默认不发真实请求。
2. 实现 DeepSeek 官方 API Transport（OpenAI-compatible）。
3. 实现 `real-llm` Adapter，满足 `AgentExecutionAdapter` 与流式契约。
4. 扩展 Chat Debug Console 支持 `/novel run ... adapter=real-llm stream=true dryRun=true`。
5. 统一流式事件协议 `LLMStreamEvent`，UI 不直接解析供应商原始流。
6. 双 FeatureGate 安全机制：真实执行必须 `realLLMEnabled + targetLLMAdapterEnabled` 同时开启。
7. 前端源码不持有 API Key；precommit 拦截硬编码密钥与 `process.env.*API_KEY`。
8. 安全日志脱敏：默认只保留 prompt 前 80 字符、response 前 120 字符。

## 2. 阶段边界

- P3-A 不修改主 UI 生成按钮逻辑，真实 LLM 入口仅为 Chat Debug Console。
- P3-A 不将 `real-llm` 接入 `agent-run` Tool 的默认工作流（留到 P3-B）。
- 默认单元测试使用 mock transport，不发起真实网络请求。

## 3. 新增文件

### 3.1 代码文件

| 文件 | 说明 |
|---|---|
| `packages/app/src/novel/llm/target-llm-client.ts` | 真实 LLM Client，支持 complete / stream，默认 transport 禁用 |
| `packages/app/src/novel/llm/deepseek-transport.ts` | DeepSeek 官方 API Transport（OpenAI-compatible） |
| `packages/app/src/novel/llm/target-llm-stream-parser.ts` | SSE / mock 流式事件解析工具 |
| `packages/app/src/novel/llm/target-llm-request-builder.ts` | `NovelCommand` → `LLMRequest` |
| `packages/app/src/novel/adapters/real-llm-adapter.ts` | `real-llm` Adapter 实现 |
| `packages/app/src/novel/chat-debug/novel-debug-llm-runner.ts` | Chat Debug 真实 LLM 调用封装 |

### 3.2 测试文件

| 文件 | 说明 |
|---|---|
| `packages/app/src/novel/llm/target-llm-client.test.ts` | Client 单元测试（mock transport、timeout、异常转换） |
| `packages/app/src/novel/llm/deepseek-transport.test.ts` | DeepSeek Transport 单元测试（complete / stream / 错误） |
| `packages/app/src/novel/llm/target-llm-stream-parser.test.ts` | 流式解析测试 |
| `packages/app/src/novel/llm/target-llm-request-builder.test.ts` | Prompt Builder 测试 |
| `packages/app/src/novel/adapters/real-llm-adapter.test.ts` | Adapter gate / execute / executeStream 测试 |
| `packages/app/src/novel/chat-debug/novel-debug-llm-runner.test.ts` | Runner 单元测试 |

### 3.3 文档文件

| 文件 | 说明 |
|---|---|
| `packages/app/src/novel/docs/phase-p3/p3a-real-llm-adapter-pilot.md` | P3-A 设计说明 |
| `packages/app/src/novel/docs/phase-p3/p3a-real-llm-manual-test.md` | 真实调用手动验证指南 |

## 4. 修改文件

| 文件 | 修改内容 |
|---|---|
| `packages/app/src/novel/adapters/adapter-router.ts` | 增加 `real-llm` 双 gate 校验 |
| `packages/app/src/novel/adapters/adapter-types.ts` | `AdapterFeatureGates` 增加 `targetLLMAdapterEnabled` |
| `packages/app/src/novel/adapters/index.ts` | 导出 `RealLLMExecutionAdapter` |
| `packages/app/src/novel/adapters/adapter-router.test.ts` | 新增 real-llm 路由边界测试 |
| `packages/app/src/novel/feature-gates.ts` | 新增 `llmStreamingEnabled` 等真实 LLM 相关 gate |
| `packages/app/src/novel/llm/index.ts` | 导出新增模块 |
| `packages/app/src/novel/llm/llm-error-types.ts` | 扩展 P3-A 错误码 |
| `packages/app/src/novel/llm/llm-feature-gates.ts` | 新增 `assertRealLLMExecutionAllowed` / `assertLLMStreamingAllowed` |
| `packages/app/src/novel/chat-debug/novel-debug-command-parser.ts` | 支持 `adapter=real-llm`、`stream=true`、`dryRun=true` |
| `packages/app/src/novel/chat-debug/novel-debug-command-parser.test.ts` | 新增参数解析测试 |
| `packages/app/src/novel/chat-debug/novel-debug-command-runner.ts` | 新增 real-llm 分支 |
| `packages/app/src/novel/chat-debug/novel-debug-command-runner.test.ts` | 新增 real-llm 调试测试 |
| `packages/app/src/novel/chat-debug/novel-debug-log-types.ts` | 扩展 log entry 支持 `LLMStreamEvent` |

## 5. 验证结果

| 检查项 | 目标 | 实际结果 |
|---|---|---|
| `bun typecheck` | 0 errors | ✅ 0 errors |
| `bun run novel:precommit` | 通过 | ✅ PASSED |
| `bun test src/novel/llm` | 通过 | ✅ 39 pass / 0 fail |
| `bun test src/novel/adapters` | 通过 | ✅ 26 pass / 0 fail |
| `bun test src/novel/chat-debug` | 通过 | ✅ 22 pass / 0 fail |
| `bun test src/novel/plugins` | 通过 | ✅ 31 pass / 0 fail |
| `bun test src/novel/workflows/engine` | 通过 | ✅ 32 pass / 0 fail |
| `bun test src/novel/actions` | 通过 | ✅ 7 pass / 0 fail |
| `bun test src/novel` | 通过 | ✅ 340 pass / 0 fail |

## 6. 关键设计决策

1. **可注入 Transport**：`TargetLLMClient` 不直接读取 API Key，所有网络行为由 `LLMTransport` 实现，默认 `disabledLLMTransport` 阻止真实请求。
2. **双 Gate 安全**：`realLLMEnabled` + `targetLLMAdapterEnabled` 必须同时开启；流式还需 `llmStreamingEnabled`。
3. **DryRun 预览**：`dryRun=true` 时只构造请求并返回参数预览，不调用真实 API，便于安全验证 prompt 与参数。
4. **统一流式协议**：`LLMStreamEvent` 将 DeepSeek SSE 转换为 `started` / `token.delta` / `reasoning.delta` / `completed` / `failed`，UI 零感知供应商差异。
5. **DeepSeek 首期**：默认 `baseURL=https://api.deepseek.com/v1`、`model=deepseek-chat`，支持 `includeReasoning=true`。
6. **Chat Debug 入口**：主 UI 不动，真实 LLM 仅通过 `/novel run ... adapter=real-llm` 触发。

## 7. 风险与处理

| 风险 | 等级 | 处理 |
|---|---|---|
| 真实 API Key 泄露 | 高 | API Key 通过 `DeepSeekTransportOptions.apiKey` 注入；precommit 拦截硬编码 key / `process.env.*API_KEY` |
| 费用意外产生 | 中 | 默认 gate 关闭；dryRun 模式默认不调用真实 API；手动测试需显式注入 key 并开启双 gate |
| 流式集成复杂度 | 中 | P3-A 只做 Chat Debug 回显，主 UI 不动 |
| 测试稳定性 | 低 | 默认 mock transport；真实调用单独标记，不纳入 CI |

## 8. Git 提交

| 提交哈希 | 提交信息 |
|---|---|
| `92db2690` | `feat(P3-A): add real llm adapter pilot with streaming echo` |
| `988254c8` | `docs(P3-A): add Phase P3-A implementation report` |
| `e0a80e72` | `docs(rules): update task source and score records for Phase P3-A` |

## 9. 完成标记

```text
[READY_FOR_P3B]
```

## 10. 相关文档

- [PHASE-P3-A-REAL-LLM-ADAPTER-PILOT-PLAN-20260621.md](PHASE-P3-A-REAL-LLM-ADAPTER-PILOT-PLAN-20260621.md)
- [PHASE-P3-0-REAL-LLM-READINESS-REPORT-20260621.md](PHASE-P3-0-REAL-LLM-READINESS-REPORT-20260621.md)
- [p3a-real-llm-adapter-pilot.md](../../../caiode/opencode-1.4.0/packages/app/src/novel/docs/phase-p3/p3a-real-llm-adapter-pilot.md)
- [p3a-real-llm-manual-test.md](../../../caiode/opencode-1.4.0/packages/app/src/novel/docs/phase-p3/p3a-real-llm-manual-test.md)

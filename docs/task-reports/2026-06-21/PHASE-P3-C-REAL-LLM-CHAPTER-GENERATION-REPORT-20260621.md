> 我是：前端工程师 / Novel 模块开发 Agent (Kimi-K2.7-Code)，本次任务：Phase P3-C Real LLM Chapter Generation 实施，职责范围：`packages/app/src/novel/`、`docs/task-reports/`、`workspaces/kimik27code/`；禁止触碰：其他模块源码。
> 越界操作申请：无。

# Phase P3-C：Real LLM Chapter Generation 实施报告

## 1. 任务信息

| 项目 | 内容 |
|------|------|
| 任务ID | P3-C-REAL-LLM-CHAPTER-GENERATION-IMPLEMENTATION-20260621 |
| 任务来源 | `caiode/docs/tabbit/06/P3P4P5阶段目标.md#L356-385` |
| 实施人 | Kimi-K2.7-Code |
| 完成日期 | 2026-06-22 |
| 方案文档 | [PHASE-P3-C-REAL-LLM-CHAPTER-GENERATION-PLAN-20260621.md](PHASE-P3-C-REAL-LLM-CHAPTER-GENERATION-PLAN-20260621.md) |

## 2. 实施内容

### 2.1 新增模块

| 文件 | 职责 |
|------|------|
| `packages/app/src/novel/llm/token-budget.ts` | 基于字符数的 Token Budget 控制与上下文裁剪 |
| `packages/app/src/novel/llm/chapter-context-assembler.ts` | 按优先级组装章节上下文 |
| `packages/app/src/novel/llm/chapter-prompt-builder.ts` | 构造章节生成专用 prompt |
| `packages/app/src/novel/llm/generation-result-validator.ts` | 生成结果校验（空、过短、格式、前言后缀） |
| `packages/app/src/novel/llm/retry-policy.ts` | 有限重试与退避策略 |
| `packages/app/src/novel/llm/real-llm-integration.test.ts` | 真实 DeepSeek API 集成测试 |
| `packages/app/src/novel/docs/phase-p3/p3-chapter-generation-scope.md` | P3-C 范围与安全边界说明 |

### 2.2 修改模块

| 文件 | 变更 |
|------|------|
| `packages/app/src/novel/adapters/real-llm-adapter.ts` | 接入 retry、validation、dryRun 预览与安全日志 |
| `packages/app/src/novel/adapters/real-llm-adapter.test.ts` | 补充 retry / validation / stream 测试 |
| `packages/app/src/novel/plugins/core-writing-tools/agent-run.tool.ts` | 透传 generate 参数，支持流式执行与校验信息 |
| `packages/app/src/novel/plugins/core-writing-tools/agent-run.tool.test.ts` | 补充 generate 路由与流式测试 |
| `packages/app/src/novel/workflows/yaml/chapter.generate.yaml` | 从 v1 升级到 v2，使用 `agent-run` Tool |
| `packages/app/src/novel/hooks/use-novel-workflow.ts` | 支持 `chapter.generate` 流式事件聚合，不自动写回 |
| `packages/app/src/novel/components/novel-editor/ai-result-card.tsx` | 展示 `validationIssues` 与 `wasTrimmed` 提示 |
| `packages/app/src/novel/components/novel-editor/ai-task-panel.tsx` | 适配 generate 任务展示 |
| `packages/app/src/novel/components/novel-editor/ai-log-drawer.tsx` | 日志展示适配 |
| `packages/app/src/novel/components/novel-editor/index.tsx` | 主 UI 入口适配 |
| `packages/app/src/novel/llm/llm-request-types.ts` | 扩展 LLMRequest metadata 类型 |
| `packages/app/src/novel/llm/target-llm-request-builder.ts` | 复用并扩展 prompt 构建 |
| `packages/app/src/novel/types/ai-task.ts` | 扩展 AITask 类型以携带校验信息 |
| `packages/app/src/novel/providers/fake-agent.ts` | 适配新类型字段 |
| `packages/app/src/novel/workflows/engine/workflow-engine.test.ts` | 适配 chapter.generate v2 |
| `packages/app/src/novel/workflows/engine/workflow-loader.test.ts` | 适配 chapter.generate v2 版本号 |
| `packages/app/src/novel/chat-debug/novel-debug-command-runner.test.ts` | 精简重复断言 |

## 3. 验证结果

| 检查项 | 命令 | 结果 |
|--------|------|------|
| TypeScript 类型检查 | `bun typecheck` | 0 errors |
| 单元/集成测试 | `bun test --preload ./happydom.ts src/novel` | 390 pass / 0 fail |
| Precommit 检查 | `bun run novel:precommit` | PASSED |
| 真实 LLM 集成测试 | `real-llm-integration.test.ts` | 非流式与流式均通过 |

真实 LLM 调用使用外部环境文件 `docs/task-reports/2026-06-21/novel-deepseek-key.env` 注入参数，未在源码或测试文件中硬编码 API Key。

## 4. Exit Criteria 自评

| 编号 | 验收项 | 状态 |
|------|--------|------|
| 1 | `chapter.generate.yaml` v2 使用 `agent-run` Tool | ✅ |
| 2 | Token Budget 控制超长上下文裁剪 | ✅ |
| 3 | Prompt Builder 含字数/风格约束 | ✅ |
| 4 | 流式回显实时展示 preview | ✅ |
| 5 | 结果校验识别空/过短/格式问题 | ✅ |
| 6 | 重试策略处理网络/超时错误 | ✅ |
| 7 | API Key 不进入前端、日志脱敏、默认 gate 关闭 | ✅ |
| 8 | 不自动覆盖正文，需用户采纳 | ✅ |
| 9 | 测试与 precommit 全通过 | ✅ |
| 10 | 代码与报告已提交 | ✅ |

## 5. 关键提交

| 类型 | Commit | 说明 |
|------|--------|------|
| 代码 | `dfdd88c9` | feat(novel): P3-C real LLM chapter generation with context budget and retry |
| 文档 | `2b1ddf70` | docs(novel): add Phase P3-C implementation report and records |

## 6. 阶段完成标记

```text
[READY_FOR_P3D_MODEL_ROUTING_AND_COST_GOVERNANCE]
```

## 7. 下一阶段

Phase P3-D：Model Routing + Cost Governance，重点包括 ModelProfile/ModelRole 映射、多模型路由、Token usage 记录、成本统计预留与真实失败 fallback mock。

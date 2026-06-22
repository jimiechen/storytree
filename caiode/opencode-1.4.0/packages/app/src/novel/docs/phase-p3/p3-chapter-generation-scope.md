# Phase P3-C：Real LLM Chapter Generation 范围说明

## 目标

将真实 LLM 能力从 `chapter.continue` 扩展到 `chapter.generate`，在不覆盖正文、不泄露密钥、不批量调用的前提下，完成一次完整章节生成链路。

## 新增模块

| 文件 | 职责 |
|------|------|
| `llm/token-budget.ts` | 基于字符数的 prompt/response 预算控制与尾部保留裁剪 |
| `llm/chapter-context-assembler.ts` | 按优先级组装章节正文、选定文本、类型、目标字数等上下文 |
| `llm/chapter-prompt-builder.ts` | 构造章节生成专用 prompt（含字数、风格约束） |
| `llm/generation-result-validator.ts` | 校验生成结果：空、过短、格式异常、前言后缀 |
| `llm/retry-policy.ts` | 可配置重试策略，仅对超时/网络/空响应等可重试错误生效 |

## 修改模块

| 文件 | 变更 |
|------|------|
| `adapters/real-llm-adapter.ts` | 接入 retry、validation、dryRun 预览与安全日志 |
| `plugins/core-writing-tools/agent-run.tool.ts` | 透传 generate 参数，支持流式执行与校验信息 |
| `workflows/yaml/chapter.generate.yaml` | 从 v1 升级到 v2，通过 `agent-run` 路由到 real-llm/mock |
| `hooks/use-novel-workflow.ts` | 支持 `chapter.generate` 流式事件聚合，不自动写回 |
| `components/novel-editor/ai-result-card.tsx` | 展示 `validationIssues` 与 `wasTrimmed` 提示 |

## 安全边界

- API Key 仅通过外部 `.env` 注入，不进入前端源码或测试文件。
- 默认 transport 为 disabled；真实调用需同时开启 `realLLMEnabled` 与 `targetLLMAdapterEnabled`。
- 安全日志截断 prompt/response，不记录完整内容。
- 生成结果进入 AI Result Card，需用户手动采纳后才写入章节正文。

## Token Budget 策略

- 默认 `maxPromptChars = 6000`、`maxResponseChars = 8000`、`reserveChars = 500`。
- 超长上下文从头部裁剪，保留尾部最近内容，并尽量在段落边界截断。
- 返回 `wasTrimmed` 标记供 UI 提示。

## 结果校验规则

| issue code | 触发条件 |
|-----------|---------|
| `EMPTY_RESPONSE` | 返回为空 |
| `RESULT_TOO_SHORT` | 字数低于 `minWordCount`（默认 100 或 50% targetWordCount） |
| `FORMAT_ISSUE` | 包含 Markdown 代码块、列表等异常格式 |
| `PREAMBLE_POSTAMBLE` | 包含「以下是...」等非正文前缀/后缀 |

## 重试策略

- 默认 `maxAttempts = 2`（原始 1 次 + 1 次重试），`backoffMs = 1000`。
- 可重试错误：`LLM_REQUEST_TIMEOUT`、`LLM_NETWORK_ERROR`、`LLM_PROVIDER_ERROR`、`LLM_EMPTY_RESPONSE`。
- 重试仍失败返回最后一次错误，不伪成功。

## 真实调用条件

1. 存在有效 `DEEPSEEK_API_KEY`（或 `apikey`）环境变量。
2. `realLLMEnabled = true`。
3. `targetLLMAdapterEnabled = true`。
4. 注入真实 transport（如 `createDeepSeekTransport`）。

## 下一阶段

Phase P3-D：Model Routing + Cost Governance。

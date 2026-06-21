# P3-A：第一次真实 LLM 调用 Pilot 范围

## 试点目标

在 P3-0 readiness 基础上，完成第一次受控的真实 LLM 调用，验证：

1. FeatureGate 双开关可正确启用 / 禁用真实 LLM。
2. AdapterRouter 能路由到真实 LLM Adapter。
3. 真实 LLM Client 能把供应商响应转换为统一 `LLMStreamEvent`。
4. UI 能消费流式事件并展示增量文本。
5. 密钥通过受控环境注入，前端不接触。
6. 日志脱敏生效。

## 试点范围

| 项 | 范围 |
|---|---|
| 命令 | 仅限 `chapter.generate` |
| 模型 | 单一供应商（OpenAI / Anthropic / OpenRouter 选一） |
| 模式 | 流式返回 |
| 字数 | 短篇（300 ~ 800 字） |
| 环境 | 本地开发代理或受控服务端路由 |
| 用户 | 开发者白名单 |

## 非目标

- 不接入多模型切换。
- 不接入费用扣减 / 额度系统。
- 不接入生产环境。
- 不接入云同步或多人协作。

## 退出标准

- `bun test src/novel/llm` 全部通过。
- 本地 dev 环境可看到真实 LLM 流式输出。
- 关闭 `realLLMEnabled` 后立刻 fallback 到 mock adapter。
- 日志中无 API Key、无完整 prompt。

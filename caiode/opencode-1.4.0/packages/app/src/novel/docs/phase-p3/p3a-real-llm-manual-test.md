# Phase P3-A：真实 LLM 手动验证指南

## 目的

在受控环境下验证 DeepSeek 官方 API 的真实调用与流式回显。

## 前置条件

1. 获取 DeepSeek API Key（`sk-...`）。
2. 确保本地环境为 Node/Bun，**不要把 Key 写入前端源码或提交到 Git**。
3. 确认 `bun typecheck` 与 `bun test src/novel` 全部通过。

## 推荐验证入口

通过 Chat Debug Console 手动执行：

```text
/novel run chapter.continue projectId=proj-1 chapterId=chapter-2 selectedText=他推开门 adapter=real-llm stream=true dryRun=true
```

先使用 `dryRun=true` 确认请求构造：

- prompt 包含 `selectedText`。
- systemPrompt 为中文小说写作助手角色。
- 不暴露 API Key。

## 真实调用步骤

1. 在受控脚本或后端路由中构造 `DeepSeekTransport`：

```typescript
import { createDeepSeekTransport } from '../llm/deepseek-transport';
import { createTargetLLMClient } from '../llm/target-llm-client';

const transport = createDeepSeekTransport({
  apiKey: process.env.DEEPSEEK_API_KEY!, // 仅服务端读取
  model: 'deepseek-chat',
});
const client = createTargetLLMClient({ transport });
```

2. 构造 `RealLLMExecutionAdapter` 并开启双 Gate：

```typescript
const adapter = new RealLLMExecutionAdapter({
  client,
  gates: {
    realLLMEnabled: true,
    targetLLMAdapterEnabled: true,
    llmStreamingEnabled: true,
    llmRequestLogEnabled: true,
    llmCostTrackingEnabled: true,
    llmSafePromptLoggingEnabled: true,
  },
});
```

3. 执行流式调用并观察事件：

```typescript
for await (const event of adapter.executeStream(command, context)) {
  console.log(event);
}
```

## 检查清单

- [ ] 请求成功返回，没有 `LLM_SECRET_MISSING` / `LLM_NETWORK_ERROR`。
- [ ] 流式事件包含 `llm.request.started`、`llm.token.delta`、`llm.request.completed`。
- [ ] 日志中 prompt / response 已被截断，API Key 被遮蔽。
- [ ] 没有产生未预期的费用（使用最小 prompt）。
- [ ] 失败时返回结构化错误码，不抛未处理异常。

## 禁止事项

- 禁止把 `sk-...` 写入 `packages/app/src` 任何文件。
- 禁止在浏览器端直接构造 `DeepSeekTransport`。
- 禁止把完整 prompt/response 输出到 console.log 或持久化日志。

## 故障排查

| 现象 | 可能原因 | 处理 |
|---|---|---|
| `LLM_SECRET_MISSING` | API Key 未注入或长度不足 | 检查服务端环境变量 |
| `LLM_PROVIDER_ERROR` | DeepSeek 返回 4xx/5xx | 检查 model 名称与余额 |
| `LLM_REQUEST_TIMEOUT` | 网络慢或模型响应慢 | 增大 `timeoutMs` |
| `LLM_STREAM_PARSE_ERROR` | SSE 格式异常 | 检查 `stream=true` 与响应头 |

# Phase P3-A：Real LLM Adapter Pilot

## 目标

完成 NovelForge 首次受控真实 LLM 调用 Pilot，以 DeepSeek 官方 API 为首个目标模型：

1. 在 Chat Debug Console 中支持 `/novel run chapter.continue ... adapter=real-llm stream=true`。
2. 提供 `dryRun` 预览模式，不调用真实 API 即可验证请求构造与参数。
3. 默认关闭真实 LLM，必须通过双 FeatureGate 显式开启。
4. 前端源码不持有 API Key，真实网络调用通过可注入 `LLMTransport` 完成。
5. UI 只消费 NovelForge 统一 `LLMStreamEvent`，不直接解析供应商原始流。

## 关键产出

| 文件 | 说明 |
|---|---|
| `packages/app/src/novel/llm/target-llm-client.ts` | 真实 LLM Client，支持 complete / stream，默认 transport 禁用 |
| `packages/app/src/novel/llm/deepseek-transport.ts` | DeepSeek 官方 API Transport（OpenAI-compatible） |
| `packages/app/src/novel/llm/target-llm-stream-parser.ts` | SSE / mock 流式事件解析工具 |
| `packages/app/src/novel/llm/target-llm-request-builder.ts` | `NovelCommand` → `LLMRequest` |
| `packages/app/src/novel/adapters/real-llm-adapter.ts` | `real-llm` Adapter 实现 |
| `packages/app/src/novel/chat-debug/novel-debug-llm-runner.ts` | Chat Debug 真实 LLM 调用封装 |
| `packages/app/src/novel/chat-debug/novel-debug-command-parser.ts` | 扩展 `adapter=real-llm` / `stream=true` / `dryRun=true` 解析 |
| `packages/app/src/novel/chat-debug/novel-debug-command-runner.ts` | 新增 real-llm 分支 |

## 双 Gate 安全机制

真实执行必须同时满足：

- `realLLMEnabled: true`（总开关）
- `targetLLMAdapterEnabled: true`（目标 adapter 开关）

流式输出还需：

- `llmStreamingEnabled: true`

任一条件不满足即返回结构化错误，不发起网络请求。

## DeepSeek Transport

- 默认 `baseURL: https://api.deepseek.com/v1`
- 默认 `model: deepseek-chat`
- 支持 `stream=true` SSE 解析
- 支持 `includeReasoning=true` 输出 `reasoning_content`
- API Key 通过 `DeepSeekTransportOptions.apiKey` 注入，Client 不读取环境变量

## 预览参数

Chat Debug 命令支持：

```text
/novel run chapter.continue projectId=proj-1 chapterId=chapter-2 selectedText=他推开门 adapter=real-llm dryRun=true
/novel run chapter.continue projectId=proj-1 chapterId=chapter-2 selectedText=他推开门 adapter=real-llm stream=true dryRun=true
```

- `dryRun=true`：不调用真实 API，返回请求构造预览。
- `stream=true`：以流式事件形式返回，事件写入 debug log 的 `llmEvents`。

## 约束

- P3-A 不修改主 UI 生成按钮逻辑，真实 LLM 入口仅为 Chat Debug Console。
- P3-A 不将 `real-llm` 接入 `agent-run` Tool 的默认工作流（留到 P3-B）。
- 真实网络调用手动测试需单独标记，默认单元测试使用 mock transport。

## 验收标记

```text
[READY_FOR_P3B]
```

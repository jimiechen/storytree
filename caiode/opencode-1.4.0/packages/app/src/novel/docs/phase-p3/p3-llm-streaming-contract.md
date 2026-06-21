# P3-0：LLM 流式事件协议

## 目标

让 UI 不依赖具体供应商的 SSE / WebSocket / 字节流格式，只消费 NovelForge 统一事件。

## 事件类型

```typescript
export type LLMStreamEvent =
  | { type: 'llm.request.started'; requestId: string; adapter: string; commandId?: string; workflowId?: string; createdAt: string }
  | { type: 'llm.token.delta'; requestId: string; text: string }
  | { type: 'llm.reasoning.delta'; requestId: string; text: string }
  | { type: 'llm.request.completed'; requestId: string; usage?: LLMUsage; completedAt: string }
  | { type: 'llm.request.failed'; requestId: string; errorCode: string; error: string }
  | { type: 'llm.request.cancelled'; requestId: string; reason?: string };
```

## 语义约定

1. `llm.token.delta` 只追加正文，不混入推理内容。
2. `llm.reasoning.delta` 用于可解释性 UI，不影响正文保存。
3. `llm.request.failed` 必须携带 `errorCode`，错误中不得包含密钥。
4. 所有事件必须携带 `requestId`，用于串联请求生命周期。

## 数据流

```text
真实供应商原始流
→ RealLLMClient
→ RealLLMAdapter
→ NovelForge LLMStreamEvent
→ Workflow Engine
→ UI Stream Consumer
```

## 实现位置

- `packages/app/src/novel/llm/llm-stream-events.ts`
- `packages/app/src/novel/llm/real-llm-adapter-contract.ts`

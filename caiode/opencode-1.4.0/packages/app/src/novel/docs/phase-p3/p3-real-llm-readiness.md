# Phase P3-0：Real LLM Readiness

## 目标

为 P3-A 第一次真实 LLM 调用补齐安全、治理、协议与接口边界，确保：

1. 真实 LLM 能力默认关闭，必须通过 FeatureGate 显式开启。
2. 前端源码不持有 API Key，浏览器运行时不接触真实密钥。
3. 日志只记录脱敏后的 preview 与元数据，不记录完整 prompt / response。
4. UI 只消费 NovelForge 统一流式事件，不直接解析供应商原始流。
5. Adapter 接口已扩展，真实实现可在 P3-A 无缝接入。

## 关键产出

| 文件 | 说明 |
|---|---|
| `packages/app/src/novel/llm/` | FeatureGate、请求类型、流式事件、错误、安全日志、密钥策略、Client Stub |
| `packages/app/src/novel/docs/phase-p3/p3-llm-secret-policy.md` | 密钥策略 |
| `packages/app/src/novel/docs/phase-p3/p3-llm-streaming-contract.md` | 流式事件协议 |
| `packages/app/src/novel/docs/phase-p3/p3-real-llm-pilot-scope.md` | 首次真实调用范围 |

## 约束

- P3-0 不发起真实 LLM 网络请求。
- P3-0 不修改 OpenCode Core。
- P3-0 不在前端硬编码 API Key。

## 验收标记

```text
[READY_FOR_P3A_REAL_LLM_PILOT]
```

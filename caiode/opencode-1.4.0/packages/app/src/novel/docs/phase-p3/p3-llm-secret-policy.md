# P3-0：LLM 密钥策略

## 核心原则

1. **前端源码禁止硬编码 API Key**。
2. **浏览器运行时不直接持有真实 API Key**。
3. **真实密钥必须来自受控运行环境**（开发代理、服务端 API route、后端网关或受控本地 CLI 环境）。
4. **日志、错误、预览中不得泄露密钥**。
5. **不得把完整 prompt、用户隐私文本与密钥一起传输或落盘**。

## 禁止模式

| 模式 | 示例 | 处理 |
|---|---|---|
| 前端读取 process.env 密钥 | `process.env.OPENAI_API_KEY` | precommit fail |
| 源码硬编码 API Key | `"sk-..."` | precommit fail |
| 硬编码 Bearer token | `"Bearer abc..."` | precommit fail |
| 日志输出完整 prompt | `console.log(prompt)` | precommit fail |

## 安全获取路径

```text
浏览器 / Novel UI
→ Novel Action / Workflow Engine
→ 后端网关 / 代理 / CLI
→ 真实 LLM Provider
```

P3-A 第一次真实调用将使用本地开发代理或受控服务端路由注入密钥，不改动前端源码。

## 检查工具

- `packages/app/src/novel/llm/llm-secret-policy.ts`
- `packages/app/scripts/novel-precommit-check.ts`

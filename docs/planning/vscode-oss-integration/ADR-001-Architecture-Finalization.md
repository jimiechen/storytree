# 架构决策记录 (ADR) 001: 纯静态 Webview UI、SQLite 持久化与 OpenAPI 直连架构

## 1. 背景与上下文 (Context)
随着 StoryTree 项目演进至 V3，我们需要决定产品最终形态的架构底座。在经过了对多智能体并发、VS Code Extension 宿主限制及 Next.js 静态导出的多轮技术可行性评估后，为确保产品能交付稳定、安全、真正的“本地化 IDE 级”体验，我们必须对现有的前后端分离架构进行重构与降维打击。

## 2. 核心决策 (Decision)
我们确认并锁定以下三项核心架构方向：

### 2.1 Dreamweaver 客户端：纯静态 Webview UI
*   **决策**：剥离 Dreamweaver (Next.js) 中的所有 API Routes 和服务端渲染逻辑 (SSR)，使用 `output: 'export'` 将其彻底固化为纯静态产物 (HTML/CSS/JS)。
*   **形态**：这些静态产物将被完全嵌入并托管在 VS Code Extension 的 Webview 容器中运行。
*   **通信**：前端所有的网络请求（曾经的 Fetch/Axios）必须通过拦截器 (Adapter) 转换为 `vscode.postMessage`，向 VS Code Extension 宿主进程发起 IPC (进程间通信) 调用。

### 2.2 数据持久化：基于 Mock 的过渡与 SQLite 的最终形态
*   **过渡期**：在 IPC 通信桥梁和 VS Code 宿主数据库搭建完成前，前端 (Webview) 继续使用现有的 Mock 数据层 (MSW) 保证 UI 交互和迭代不受阻。
*   **最终态**：数据持久化逻辑将下沉到 VS Code Extension 进程（Node.js），由插件端连接并操作本地的 `SQLite` 数据库 (`dev.db`)。前端发出的 IPC 增删改查请求由插件端执行 SQL 后返回结果。

### 2.3 AI 引擎：VS Code 本地直连第三方 OpenAPI
*   **决策**：抛弃搭建中心化 AI 转发网关的思路。所有的 AI 请求将由本地的 VS Code Extension 宿主进程（或由其管理的 Python Agent 子进程）**直接连向第三方大模型的 OpenAPI** (如 OpenAI API, Anthropic API, 或本地兼容的 Ollama 接口)。
*   **形态**：API Keys 将存储在用户的 VS Code 全局安全存储 (SecretStorage) 或工作区设置 (settings.json) 中。
*   **优势**：真正实现去中心化和隐私保护，彻底摆脱由于自建服务端转发可能带来的合规风险、带宽成本及稳定性瓶颈。

## 3. 架构影响 (Consequences)

### 3.1 积极影响 (Positive)
*   **极致本地化**：零服务器依赖（除非调用云端 AI），实现真正的开箱即用单机软件体验。
*   **响应极速**：去除了 HTTP 网络通信开销，UI 到数据库的交互完全在本地 IPC 与文件系统中完成。
*   **隐私安全**：用户的小说数据（SQLite）和 API Key 均保存在本地计算机上，满足敏感创作需求。

### 3.2 消极影响/挑战 (Negative/Challenges)
*   **重构成本**：需要将现有的 Next.js App Router 强行适配为纯静态的 SPA 架构，必须处理掉所有无法静态化的包（如 `next-intl` 的动态路由）。
*   **原生依赖编译**：在 Electron (VS Code 宿主) 环境中编译包含原生 C++ 绑定的 SQLite / Prisma 存在较高的技术门槛。
*   **IPC 性能瓶颈**：在传输几十万字的小说或庞大的大纲 JSON 时，如果一次性通过 `postMessage` 发送可能会阻塞 VS Code 的 UI 线程，需引入增量同步。

## 4. 下一步行动 (Next Steps)
1.  **Dreamweaver 静态编译 PoC**：立即在 Dreamweaver 中配置静态导出并验证。
2.  **Caiode 插件骨架与 SQLite 集成 PoC**：创建一个极简 VS Code Extension Demo，验证在其中连接和操作 SQLite 的可行性。
3.  **Mock 到 IPC 的切换方案设计**：编写前端 RPC 适配器，允许前端无缝在 Mock 模式和 VS Code Webview 模式间切换。
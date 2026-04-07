# 架构决策记录 (ADR) 002: 补充网关服务、安全策略与 Mock 层下沉开发工作流

## 1. 背景与上下文 (Context)
在确认了基础的纯本地化架构（纯静态 Webview UI + SQLite + OpenAPI 直连）后，为保证软件的商业化运营、知识产权保护以及团队当前的开发节奏不被阻断，我们必须对 ADR-001 进行关键补充。商业软件不能是彻底断网的信息孤岛，且在向本地数据库过渡期间，我们需要一种平滑、无痛的研发迭代模式。

## 2. 核心决策 (Decision)

### 2.1 商业化网关保留 (Centralized Server Gateway)
*   **决策**：虽然业务数据（小说、大纲、角色）完全本地化，但必须保留一个轻量级的云端服务器网关。
*   **网关职责**：
    1.  **用户中心**：账号注册、登录验证、设备绑定。
    2.  **商业化**：续费、支付、订单管理、订阅状态下发。
    3.  **云控与运维**：全局配置下发、检查更新 (OTA Updates)、错误日志收集与用户反馈。
*   **机制**：启动时，VS Code 插件向云端网关验证 Token/License，获取可用功能权限；日常写作期间断网可用，但核心商业行为需连网。

### 2.2 开发工作流：Mock 层下沉与渐进式替换
*   **决策**：优先确立前后端通信协议 (IPC Protocol)，将当前 Dreamweaver 前端的 Mock 数据层彻底下沉到 VS Code 插件层。
*   **执行顺序**：
    1.  制定标准的 JSON-RPC 格式的 IPC 通信协议。
    2.  Dreamweaver 前端发起 IPC 请求，不再走本地的 MSW/Mock。
    3.  VS Code 插件层接收请求，返回静态 Mock 数据。
    4.  **持续开发**：前端团队在 Webview + 插件 Mock 的环境下，继续推进 Dreamweaver 原有页面和 Stitch 自动化测试。
    5.  **最终替换**：待前端页面开发完毕后，再将插件层的 Mock 逻辑替换为真实的 SQLite 数据库调用。

### 2.3 全方位安全策略 (Comprehensive Security Strategy)
*   **决策**：在离线化部署的前提下，必须将安全性提升到企业级标准，防止知识产权泄露与用户数据受损。
*   **反编译 (Anti-Decompilation)**：
    *   **前端**：Next.js 打包开启代码混淆 (Obfuscation) 与严格的压缩 (Minification)。
    *   **后端插件**：VS Code 插件代码使用 `esbuild` 打包混淆；针对核心的 Python 智能体和关键商业逻辑，考虑使用 `PyArmor` 编译为二进制文件 (Executable)，或将 Node.js 核心模块编译为 V8 Bytecode (`bytenode`)。
*   **文件隔离 (File Isolation)**：
    *   沙箱机制：Python Agent 只能读写指定的工作区 (Workspace) 目录，绝对禁止访问用户的系统全局路径或跨项目越权读取。
    *   基于 `fs` 的代理封装，所有 Agent 的 I/O 必须经过校验。
*   **数据安全 (Data Security)**：
    *   **本地数据库加密**：使用 `sqlcipher` 或类似技术对 SQLite `.db` 文件进行加密，防止本地文件被随意拖拽读取。
    *   **密钥管理**：用户的 OpenAI API Keys 必须强制存储在 VS Code 的 `SecretStorage` 中（调用操作系统底层的钥匙串/凭据管理器），严禁明文保存在磁盘配置中。

## 3. 架构影响 (Consequences)
*   **商业闭环**：保留了网关，为产品未来的商业变现、防盗版和用户运营打下坚实基础。
*   **研发提效**：通过“Mock 层下沉”，前端开发不仅不会停滞，还能提前适应 IPC 通信模式；前后端真正做到了解耦并行开发。
*   **安全壁垒**：反编译与数据加密增加了工程复杂度（特别是构建和 CI/CD 流程），但这是 2C 端商业化工具不可或缺的防线。

## 4. 下一步行动 (Next Steps)
1.  **定义 IPC 通信协议**：规范前端与 Webview 的消息结构 (如 `action`, `payload`, `requestId`)。
2.  **构建 Mock 插件宿主**：在 `caiode` 端提供 Mock 数据支持，打通前端至插件的通信链路。
3.  **恢复前端开发流**：在插件 Mock 环境下，继续完成剩余的 Stitch 页面。
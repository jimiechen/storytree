# Caiode 项目系统拆解任务清单 (Task Plan)
> **日期**: 2026-04-07
> **目标**: 基于 `04-ralph-tasks.md`、多智能体设计文档及可行性报告，将宏观需求拆解为可分配的原子级开发任务。
> **原则**: 强制包含单元测试(Unit Test)与集成测试(Integration Test)保障，严格防范退化。

## 1. 任务拆解与执行看板

| 任务 ID | 任务名称 | 详细描述 | 输入 / 依赖 (Input) | 产出定义 (Output) | 预估工时 | 优先级 | 测试要求 (TDD) |
|---|---|---|---|---|---|---|---|
| **C-IPC-01** | **IPC 协议层核心实现** | 定义 JSON-RPC 格式，实现基于 Webview 的消息路由与分发机制 (Message Router)。 | 协议规范定义 | `IpcRouter.ts`, `IpcHandler.ts` | 4h | P0 | **Unit**: 验证路由解析、错误消息构造、非法格式拒绝。 |
| **C-IPC-02** | **Mock 数据层下沉** | 在 Node.js 层实现基础的 Mock CRUD 接口，并注册到 IPC Router，响应前端 Webview 请求。 | `C-IPC-01` | `MockService.ts`, Mock JSON 数据文件 | 4h | P0 | **Unit**: 验证获取项目、获取章节 Mock 数据的准确性。 |
| **C-EXT-01** | **极简 VS Code Extension 骨架** | 初始化 `caiode` 的 Extension 宿主生命周期 (`activate`/`deactivate`)，创建 Webview Panel。 | - | `extension.ts`, `WebviewProvider.ts` | 6h | P0 | **Integration**: 验证 Webview Panel 能成功创建并销毁，无内存泄露。 |
| **C-EXT-02** | **加载静态导出产物** | 读取 `dreamweaver/out` 静态产物，配置本地路径权限 (LocalResourceRoots)，使其在 Webview 渲染。 | `C-EXT-01`, `dreamweaver` 静态包 | Webview 成功渲染 UI | 4h | P0 | **Integration**: 验证静态资源 (CSS/JS) 的 URI 转换正确，页面无跨域报错。 |
| **C-SEC-01** | **SecretStorage 集成** | 调用 VS Code `ExtensionContext.secrets` API，实现 OpenAI 等大模型 API Key 的安全读写。 | `C-EXT-01` | `KeyManager.ts` | 3h | P1 | **Unit**: 验证存储、读取、删除 Key 的逻辑；**Integration**: 验证写入操作系统凭据链。 |
| **C-SEC-02** | **沙箱文件隔离拦截器** | 基于 Node.js `fs` 封装一套只能读写指定工作区 `.storytree` 目录的虚拟文件系统。 | - | `SandboxFS.ts` | 6h | P1 | **Unit**: 尝试越界访问（如 `../../etc/passwd`）必须抛出 `SandboxError`。 |
| **C-AI-01** | **串行化大模型请求队列** | **[核心架构]** 实现 Global Model Request Queue，引入 `async-mutex` 确保所有模型请求严格串行。 | `C-SEC-01` | `ModelQueue.ts`, `MutexLock.ts` | 8h | P0 | **Unit**: 并发推入 10 个请求，验证它们是串行执行并正确回传各自的 Promise 结果。 |
| **C-AI-02** | **OpenAPI 直连封装** | 封装对 `api.openai.com` (或 Ollama) 的直接请求，支持 Stream 流式输出，通过 IPC 推送回前端。 | `C-AI-01` | `OpenAIClient.ts` | 6h | P0 | **Unit**: 验证 HTTP 请求格式；**Integration**: 验证 Stream 数据块能否正确转为 IPC 事件。 |
| **C-DB-01** | **SQLite 原生编译 PoC** | 引入 `better-sqlite3` 或类似驱动，编写创建表、插入、查询的基础链路，确保 Electron 环境下编译通过。 | `C-EXT-01` | `Database.ts` | 8h | P0 | **Integration**: 验证插件启动时，能否在 globalStorage 路径下创建并读取 `.db` 文件。 |
| **C-DB-02** | **全量 Prisma/SQL 替换 Mock** | 将 `C-IPC-02` 中的 Mock 服务全面替换为对 SQLite 的真实数据库读写操作。 | `C-DB-01`, `C-IPC-02` | `PrismaService.ts` | 12h | P1 | **Unit**: 覆盖所有核心表 (项目、章节、角色) 的 CRUD；**Integration**: 验证外键约束。 |
| **C-AGT-01** | **工作流与 loop.ts 移植** | 从 `claude-code-src` 移植智能体循环逻辑，使其能在 VS Code 后台独立运行并与队列通信。 | `claude-code-src/ink/loop.ts` | `AgentLoop.ts` | 8h | P2 | **Unit**: 验证智能体收到任务后的思考 (Thought) 与行动 (Action) 的循环流转。 |
| **C-AGT-02** | **Tool 注册与权限控制** | 移植 FileEdit/Bash 等工具，接入 `C-SEC-02` 沙箱拦截器，注册到智能体上下文中。 | `C-SEC-02`, `C-AGT-01` | `ToolsRegistry.ts` | 6h | P2 | **Unit**: 验证智能体调用工具时，受限操作会被正确拦截并反馈给智能体。 |
| **C-GW-01** | **云端网关认证拦截** | 在插件 `activate` 早期，拦截请求向云端网关校验 License，未通过则降级功能。 | - | `AuthInterceptor.ts` | 4h | P2 | **Unit**: 模拟网关返回成功/失败，验证插件权限状态的正确降级。 |

## 2. 依赖关系与关键路径 (Critical Path)

为了保证团队不相互阻塞，推荐按以下并行路径执行：

*   **路径 A (底层宿主与渲染)**: `C-EXT-01` -> `C-EXT-02` -> `C-IPC-01` -> `C-IPC-02`
    *   *说明*: 打通宿主、Webview 渲染和基础 IPC Mock，释放前端 (`dreamweaver`) 的开发阻塞。
*   **路径 B (持久化与安全)**: `C-DB-01` -> `C-SEC-01` -> `C-SEC-02` -> `C-DB-02`
    *   *说明*: 解决 SQLite 的原生编译痛点，确立文件和密钥安全边界。
*   **路径 C (大模型与多智能体)**: `C-AI-01` -> `C-AI-02` -> `C-AGT-01` -> `C-AGT-02`
    *   *说明*: 解决原始设计报告中的“并发冲突”致命缺陷，建立串行队列，再接入智能体。

## 3. 测试与质量门禁要求 (QA Gates)

1.  **测试框架**: 必须在 `caiode` 根目录配置 `vitest`。
2.  **覆盖率门禁 (Coverage Gate)**:
    *   `C-IPC-*` (通信层) 和 `C-SEC-*` (安全沙箱层) 核心代码行覆盖率必须 **>= 90%**。
    *   `C-AI-01` (串行锁队列) 核心调度逻辑覆盖率必须 **= 100%**。
3.  **CI/CD 集成**: 所有 `C-*` 开头的原子任务提交前，必须在本地跑通 `npm run test`，并确保没有破坏任何现有的 `claude-code-src` 或 `trae-auto-extension` 里的历史测试。
4.  **验收标准**: 每一个任务卡片的合并 (Merge) 必须附带自动化测试代码，严禁“先写逻辑后补测试”。
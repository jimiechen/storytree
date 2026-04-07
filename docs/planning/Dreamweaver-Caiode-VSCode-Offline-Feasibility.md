# StoryTree 客户端与服务端离线部署 VS Code 定制开发可行性评估报告

## 1. 总体评审结论
**综合可行性等级：高 (High)**

将 `dreamweaver` (Next.js) 作为前端客户端，将 `caiode` (包含了 VS Code Extension、Ralph 引擎、多智能体组件等) 作为服务端，并实现离线部署到 VS Code 进行定制开发，在技术架构上是**完全可行且业界常用**的方案。

该方案的本质是：**以 VS Code 插件机制 (Extension Host) 作为后端宿主环境与系统权限代理，以 Webview 作为前端渲染容器。**

---

## 2. 核心模块离线部署分析

### 2.1 客户端 (`dreamweaver` 项目)
- **当前栈**：Next.js, React, Tailwind, Prisma。
- **离线部署方案**：
  - **方案 A (推荐)：纯静态导出 (Static HTML Export)**。在 `next.config.ts` 中配置 `output: 'export'`，将整个 Next.js 编译为静态的 HTML/CSS/JS 产物，直接塞入 VS Code Extension 的 `resources` 或 `out` 目录中，通过 Webview 加载。
  - **方案 B：本地服务器挂载**。VS Code 插件激活时，在后台以 Child Process 启动 Node.js 进程运行 Next.js 服务 (监听 `localhost:3000`)，然后在 Webview 中通过 iframe 加载。
- **可行性优势**：Next.js 兼容性强，支持快速降级为纯客户端应用 (SPA)。
- **需改造点**：如果当前大量使用了 Next.js 的 API Routes (`app/api/`) 或 Server Actions，静态导出时会受限。需要将前后端通信机制抽象化，在 VS Code 模式下切换为 `vscode.postMessage` (IPC 通信)。

### 2.2 服务端 (`caiode` 项目)
- **当前栈**：TypeScript (VS Code 扩展底座 `trae-auto-extension`)、Node.js (Ralph CDP 控制)、Python (`agentsTeam/nanobot` 智能体)。
- **离线部署方案**：
  - **TypeScript/Node.js 层**：可以通过 `esbuild` 或 `webpack` 打包为单一或少数几个 JS 文件，完美内置于 `.vsix` 离线安装包中。
  - **数据库**：`dreamweaver` 现有的 `Prisma` + `SQLite` (`dev.db`) 是离线客户端的最佳搭档。可将 SQLite 数据库文件保存在 VS Code 插件的全局存储路径 (`globalStorageUri`) 下。
  - **Python 智能体层**：可通过 `PyInstaller` 等工具将 Python 脚本与运行环境打包为对应操作系统的独立二进制可执行文件 (Executable)，随插件下发；或者在插件初始化时，在本地一键配置离线 Python 虚拟环境 (venv)。
- **可行性优势**：VS Code 的 Node.js 运行环境权限极高，完全可以读写本地文件、执行终端命令以及唤起 Python 子进程。

### 2.3 AI 模型的纯离线化
如果“离线部署”意味着**物理断网**（不仅是离线安装插件，还需要在无外网环境下工作）：
- **挑战**：无法调用 Claude/OpenAI 的云端 API。
- **解决方案**：必须在本地宿主机上运行开源大模型。`caiode` 的服务端需要增加对 `Ollama` 或 `LM Studio` (提供兼容 OpenAI 格式的本地接口) 的支持，并使用本地模型（如 Qwen2.5-Coder, Llama-3）来驱动 Ralph 与多智能体。

---

## 3. 架构整合与通信设计

离线部署到 VS Code 后，系统的拓扑结构将发生如下转变：

```text
[ VS Code 宿主进程 (Main) ]
       │
       ├─▶ [ Webview 容器 ] 运行 dreamweaver 编译后的静态前端
       │       ▲
       │       │ (IPC Message: acquireVsCodeApi().postMessage)
       │       ▼
       ├─▶ [ VS Code Extension 进程 (Node.js) ] caiode 的核心控制层
               │
               ├─▶ 读写本地 SQLite 数据库 (Prisma)
               ├─▶ 管理本地文件系统 (Workspace Files)
               └─▶ [ Child Process ] 运行 Python 多智能体 (nanobot)
                       │
                       └─▶ 访问本地 LLM 接口 (Ollama) -> 纯离线 AI 能力
```

---

## 4. 主要技术风险与应对策略

| 风险项 | 风险度 | 应对策略 |
|---|---|---|
| **网络请求路径耦合** | 高 | `dreamweaver` 的业务逻辑（如保存角色、生成大纲）当前可能直接发起了 HTTP 请求。需要构建一个 **Adapter (适配器) 层**。在浏览器环境走 Fetch/Axios，在 VS Code Webview 环境下走 `window.addEventListener('message')` 拦截。 |
| **安装包 (.vsix) 体积过大** | 中 | `caiode` 中包含了 Python 环境、多种依赖甚至测试用的二进制文件。需要严格编写 `.vscodeignore` 和 `.npmignore`。若附带本地大模型权重，必须采用“按需下载”或“局域网私服分发”策略，不能塞入插件包。 |
| **多进程管理稳定性** | 中 | VS Code 插件在重启或卸载时，容易遗留僵尸子进程 (如 Python 后台进程)。必须在 Extension 的 `deactivate()` 钩子中实现严格的进程清理与资源释放逻辑。 |

---

## 5. 实施路线建议 (Action Plan)

1. **第一步：环境剥离与适配器重构 (1周)**
   - 提取 `dreamweaver` 的网络请求库，增加环境判断：`if (isVSCode) { useIpc() } else { useHttp() }`。
   - 尝试将 `dreamweaver` 进行 `next build` 静态导出，跑通基础的静态 UI 渲染。
2. **第二步：VS Code Webview 挂载 (1周)**
   - 在 `caiode/trae-auto-extension/extension` 中新建一个 Webview Panel。
   - 将第一步导出的前端产物映射到 Webview 中，打通前端到 Extension 进程的 `Hello World` 通信。
3. **第三步：后端能力下沉 (2周)**
   - 将 `dreamweaver/src/app/api` 里面的业务逻辑，平移到 VS Code Extension 的命令或事件监听器中。
   - 接入本地 Prisma + SQLite 并在 Extension 进程中完成初始化。
4. **第四步：智能体子进程调度与打包 (1周)**
   - 在 Extension 中实现对 Python 进程的启停控制。
   - 完善 `.vsix` 的离线打包流程，测试在干净机器上的全离线安装。

## 结论
**将 `dreamweaver` 降维为纯前端挂载在 Webview，将 `caiode` 升维为 VS Code Extension 宿主后端并接管 SQLite 与 Python 智能体，是高度可行、逻辑严密且符合现代重型本地 IDE 插件开发规范的完美演进方案。**
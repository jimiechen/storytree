# StoryTree 一体化定制开发环境 (VS Code OSS) 三阶段实施计划

本计划旨在将 `caiode` (服务端智能体引擎) 与 `dreamweaver` (客户端 Web UI) 深度整合，最终合入 `VS Code OSS Fork` 中，打造一个专属于长篇小说创作的统一、可扩展定制化 IDE 解决方案 (StoryTree IDE)。

---

## 第一阶段：Caiode 插件化先行与核心架构重构

**目标**：完成 VS Code 插件基础架构设计，实现核心功能模块，重点引入“串行化大模型队列”与“并发文件锁”以解决物理资源独占冲突，并准备好插件市场发布及基础测试。

### 1.1 技术选型
*   **开发语言**：TypeScript, Node.js
*   **宿主框架**：VS Code Extension API
*   **并发控制**：`async-mutex` (实现文件锁与请求队列)
*   **进程通信**：Node.js `child_process` 或 `worker_threads` (管理 Python Agent)
*   **数据持久化**：SQLite3 (使用 Prisma Client 的底层引擎)

### 1.2 开发里程碑 (Milestones)
*   **M1.1 基础架构与环境搭建**：初始化 `caiode` 扩展宿主，建立 VS Code 插件生命周期管理，集成 `trae-auto-extension` 的底层代码。
*   **M1.2 串行化大模型队列实现**：实现 Global Model Request Queue。拦截所有 Agent 的 LLM 请求，推入单一队列串行执行，获取结果后再异步分发给各个 Agent。
*   **M1.3 并发文件锁 (File Lock) 实现**：引入基于文件路径的互斥锁 (Mutex)，确保多个 Agent 或插件并发修改沙箱文件时不会产生竞态条件或数据损坏。
*   **M1.4 插件市场发布准备与基础测试**：编写 `package.json` 清单，完善插件配置页面，打包 `.vsix` 文件并在干净的 VS Code 实例中进行功能验证。

### 1.3 测试标准
*   **单元测试覆盖率**：核心队列调度器、文件锁机制覆盖率 > 85%。
*   **压力测试**：模拟 10 个 Agent 同时发起文件写入与大模型请求，验证系统是否稳定串行，无崩溃、无文件损坏。

### 1.4 交付物清单
*   `caiode` VS Code 插件源码及 `.vsix` 安装包。
*   《大模型请求队列与并发文件锁设计文档》。
*   单元测试与压测报告。

### 1.5 质量门禁指标 (Quality Gates)
*   0 个致命 (Critical) 和严重 (High) 级别的并发死锁缺陷。
*   VS Code Extension Host 内存占用在闲置时 < 150MB，高负载下无内存泄漏。

### 1.6 风险预案
*   **风险**：Python 智能体子进程成为僵尸进程。
*   **预案**：在 Extension 的 `deactivate` 钩子中强制通过 OS 级 PID 树查杀关联子进程。

### 1.7 资源需求
*   1 名 VS Code 插件架构师，1 名后端开发工程师 (Node.js/Python)。

---

## 第二阶段：Dreamweaver 客户端重构与接口深度对接

**目标**：将 `dreamweaver` (Next.js) 的功能模块剥离服务端逻辑，重构为纯静态 Webview 客户端；完成与第一阶段 VS Code 插件的 IPC 通信对接与数据同步机制。

### 2.1 技术选型
*   **前端框架**：Next.js (配置 `output: 'export'` 静态导出), React, TailwindCSS
*   **通信桥梁**：VS Code Webview API (`acquireVsCodeApi().postMessage`)
*   **状态管理**：Zustand (适配 IPC 异步数据流)

### 2.2 开发里程碑 (Milestones)
*   **M2.1 网络层适配器 (Adapter) 重构**：剥离 Next.js 的 `/api` 路由调用，封装一层统一的 `RPC Client`，在 VS Code 环境下自动切换为向 Extension 宿主发送 `postMessage` 消息。
*   **M2.2 静态导出与 Webview 挂载**：配置 Next.js 静态编译，在 `caiode` 插件中创建 Webview Panel 并加载编译产物，跑通 "Hello World" 级别的双向通信。
*   **M2.3 数据同步机制实现**：将 `Prisma` 与 `SQLite` 的交互逻辑下沉至 `caiode` 插件层。Webview 触发操作 -> 插件操作 SQLite -> 插件推送数据更新事件至 Webview 更新状态。
*   **M2.4 核心业务模块联调测试**：完成角色库、大纲视图、工作台等业务模块在 Webview 环境下的集成兼容性测试。

### 2.3 测试标准
*   **UI 自动化测试**：使用 Playwright 测试 Webview 内的核心交互路径（新建项目、添加角色等）。
*   **通信性能测试**：验证大体积 JSON (如 1MB 的大纲树) 在 Webview 与 Extension 进程间的序列化与反序列化延迟 (< 50ms)。

### 2.4 交付物清单
*   重构后的 `dreamweaver` 前端静态产物 (HTML/CSS/JS)。
*   `caiode` 插件中集成的 Webview 渲染容器代码。
*   《Dreamweaver VS Code Webview IPC 接口契约文档》。

### 2.5 质量门禁指标
*   前端页面首次加载白屏时间 (FCP) < 1.5s。
*   核心业务逻辑全量跑通，无 HTTP 网络报错或 404 资源丢失。

### 2.6 风险预案
*   **风险**：Next.js 某些重度依赖 SSR (服务端渲染) 的第三方库在静态导出时报错。
*   **预案**：寻找客户端替代库，或使用 `next/dynamic` 并设置 `ssr: false` 强制客户端渲染。

### 2.7 资源需求
*   1 名高级前端工程师 (React/Next.js)，1 名全栈工程师。

---

## 第三阶段：VS Code OSS Fork 深度集成与最终交付

**目标**：Fork 官方的 `microsoft/vscode`，将前两阶段的成果直接作为“内置扩展 (Built-in Extension)” 打包进源码，进行深度定制、统一配置管理、性能优化及安全加固，输出开箱即用的 StoryTree IDE。

### 3.1 技术选型
*   **底层架构**：Electron, TypeScript, VS Code OSS 源码
*   **构建工具**：Gulp, Yarn, GitHub Actions (多平台跨编)
*   **打包分发**：Electron Builder / VS Code 打包脚本

### 3.2 开发里程碑 (Milestones)
*   **M3.1 VS Code OSS Fork 与基础定制**：Fork 官方代码库，修改 Product.json，定制 IDE 的 Logo、名称 (StoryTree IDE)、启动屏、默认主题与图标。
*   **M3.2 内置扩展与代码合并**：将 `caiode` (已包含 `dreamweaver` Webview) 注入到 VS Code OSS 的 `extensions/` 目录下，配置为随 IDE 启动自动激活的内置扩展。
*   **M3.3 统一配置与 UI 隐藏定制**：屏蔽掉不需要的 VS Code 默认面板 (如默认扩展市场、源代码管理面板中不需要的部分)，简化 UI，打造极致的“小说创作工作台”体验。
*   **M3.4 安全加固与性能优化**：限制 Webview 的执行权限 (CSP 配置)，禁用危险的 Node.js API 注入；优化 Electron 启动速度。
*   **M3.5 文档编写与交付验收**：输出全套安装部署文档与使用手册，完成多端 (Windows/macOS/Linux) 的最终构建验收。

### 3.3 测试标准
*   **多平台兼容测试**：在 Windows 11, macOS (Apple Silicon & Intel), Ubuntu 22.04 下进行端到端安装、启动及全流程测试。
*   **安全扫描**：进行依赖漏洞扫描 (Snyk/npm audit) 及 Webview CSP 策略检查。

### 3.4 交付物清单
*   StoryTree IDE 多平台安装包 (`.exe`, `.dmg`, `.AppImage`)。
*   定制化 VS Code OSS 的私有源码仓库。
*   《StoryTree IDE 最终交付验收报告》及《用户使用手册》。

### 3.5 质量门禁指标
*   IDE 冷启动时间 < 3s (中端 PC 标准)。
*   跨平台打包构建成功率 100%，无缺失动态链接库 (如 SQLite 原生编译问题)。

### 3.6 风险预案
*   **风险**：VS Code OSS 庞大且复杂的构建链导致多平台打包失败 (尤其是涉及 Prisma 的原生 C++ 绑定)。
*   **预案**：提前搭建 CI/CD 矩阵；若打包原生依赖失败，考虑通过预编译的静态库 (Prebuild Binaries) 直接替换，或将 SQLite 引擎替换为纯 JS 实现的 `sql.js` 进行降级。

### 3.7 资源需求
*   1 名客户端架构师 (Electron/VS Code 源码级开发)，1 名 QA 测试工程师。

---

**总周期预估**：约 6-8 周。
**核心价值**：通过这三个阶段的演进，StoryTree 将从松散的“独立前后端 + 脚本”体系，升维成一个**企业级、开箱即用、安全离线的专业写作 IDE 产品**。
# StoryTree 技术方案评审与决策报告

> **评审基准文件**: `.trae/documents/storytree-state-evaluation-report.md`
> **评审目标**: 架构设计、技术选型、风险评估、实施可行性及执行优先级排序
> **评审人**: Ralph AI 架构师
> **日期**: 2026-04-07

---

## 一、 总体实施方向决策

### 🏁 决策结论：同意推进，强烈推荐“混合渐进式迁移策略 (方案 C)”
该评估报告在时机把握上非常精准（即：在重度后端功能如 Harness/RAG 开发前及时止损），避免了极高的双端维护成本与技术债务。总体方案逻辑清晰、可行性较高。

**需要调整的关键点**：
双模式（Browser + VS Code Webview）不宜作为长期战略，而应仅作为**过渡期策略**。长期维护“适配双端”的代码会产生巨大的技术负担，建议在 M3（核心功能闭环）达成后，完全弃用独立的 Next.js Node 服务器模式，将 Dreamweaver 彻底固化为“纯静态 Webview UI”形态。

---

## 二、 架构设计与技术选型评审

### 2.1 架构设计 (RPC 适配层)
*   **设计优点**：引入 `IRPCClient` 适配层，将底层 HTTP Fetch 和 VS Code `postMessage` 抽象化，这是经典的 Adapter 设计模式，能最大程度保护现有的前端 React 组件和业务状态（Zustand）。
*   **隐藏风险**：**大数据量 IPC 传输瓶颈**。对于小说创作平台，单章数十万字或整个结构树 (JSON) 通过 `postMessage` 序列化传输，可能会阻塞 VS Code 的 UI 线程（Webview 和 Extension Host 间的通信是异步序列化的）。
*   **架构修正建议**：在 `IRPCClient` 的设计中，对于超过 500KB 的大对象传输，必须预留分片传输（Chunking）或考虑通过本地 `Blob URL` 加载的降级通道。

### 2.2 技术选型 (前端与后端)
*   **React/Tailwind/Zustand**：完全兼容 VS Code Webview，选型极佳。
*   **Next.js App Router**：**存在严重隐患**。VS Code Webview 仅支持纯静态文件加载。如果 Next.js 代码中含有依赖 Server Actions、动态 API Headers 或 SSR 的逻辑，`next build --output export` 会直接失败。
    *   *修正建议*：必须在 Week 1 立即执行一次静态编译尝试（PoC），确保现有的 UI 能够顺利转换为纯静态 HTML/JS。
*   **Prisma ORM + SQLite**：**存在极高环境风险**。VS Code Extension 运行在 Electron 的 Node.js ABI 下，而常规的 Prisma 会下载系统的二进制 Engine。
    *   *修正建议*：Prisma 在 Electron 下编译失败率极高。必须在 Week 2 提前介入，如果原生 Prisma Engine 无法在 Extension Host 稳定运行，必须准备好切换至 `wa-sqlite` (WASM 方案) 或纯 JS 版 `sql.js`。

---

## 三、 风险评估与技术债务分析

| 风险点 | 原评估等级 | 修正评估等级 | 应对与缓解策略 |
| :--- | :---: | :---: | :--- |
| **IPC 性能瓶颈** | 中 | **高** | 增量更新（Delta Sync）。只在 Webview 首次加载时传输全量 JSON，后续编辑只发送 JSON Patch。 |
| **Prisma 原生编译兼容性** | 中 | **极高** | 这是一个“Go/No-Go”的破坏性风险。第一周的 PoC 必须包含“在 VS Code 插件中跑通 Prisma CRUD”的任务，失败则立即改用 `better-sqlite3`。 |
| **next-intl 替换成本** | 中 | 低 | 静态导出不支持 next-intl，直接替换为 `i18next` 客户端渲染。技术债务可控，重构约 2 天。 |
| **双架构维护带来的技术债务** | 忽略 | **中** | 混合模式会导致大量的 `if (isVSCode) { ... } else { ... }` 脏代码。应尽早确立单一事实来源。 |

---

## 四、 性能、资源与时间成本评估

### 4.1 性能指标要求
*   **Webview 首次渲染时间 (FCP)**：< 1.5s（静态文件本地加载，理论上极快）。
*   **IPC 通信延迟**：核心操作（如保存章节）从前端触发到 Extension 响应，耗时必须 < 50ms。
*   **内存占用**：VS Code Extension Host 内存增量 < 200MB（需严格管理 Python 子进程生命周期）。

### 4.2 资源与时间成本
*   **预估周期**：原报告预估 12-14 周，较为保守合理。
*   **资源分布建议**：
    *   **前端工程师 (60%)**：专注于 UI 组件拆解、Zustand 状态对接、RPC Adapter 封装。
    *   **Node.js 架构师 (40%)**：专注于 Extension Host 开发、SQLite 集成、Python 进程调度。

---

## 五、 执行优先级排序与里程碑建议

为了遵循“Fail-Fast (快速失败)”的原则，必须将风险最高的技术验证项提到最前面执行。以下是调整后的强制执行优先级：

### 🥇 优先级 0：致命风险排除 (PoC 阶段) - **Day 1~3**
1.  **Prisma + SQLite 插件内运行验证**：创建一个空白的 VS Code Extension 模板，引入 Prisma 并操作 SQLite，验证在 Electron 环境下是否报错。
2.  **Next.js 纯静态导出验证**：对当前 Dreamweaver 项目执行 `next build --output export`，排查所有阻碍静态导出的错误（如动态路由、Server 依赖）。

### 🥈 优先级 1：核心架构抽象层 (Week 1~2)
1.  设计并实现 `IRPCClient` 抽象层。
2.  将所有现有 API Routes 封装到 `src/lib/api/` 目录中。
3.  替换掉不支持静态导出的 `next-intl` 和 `next-themes`。

### 🥉 优先级 2：VS Code 骨架与通信打通 (Week 3~4)
1.  实现 `caiode` VS Code 扩展的 `activate` 生命周期。
2.  创建 Webview Panel，将 Next.js 静态产物加载进 Webview。
3.  跑通 "项目列表查询" 的完整 IPC 通信链路。

### 🏅 优先级 3：核心业务全量迁移 (Week 5~9)
1.  章节读写、大纲树状图操作。
2.  知识库管理（角色、世界观）。
3.  AI 对话面板（重点实现流式 IPC 传输机制，模拟 Server-Sent Events）。

### 🎖️ 优先级 4：高级能力接入 (Week 10~12)
1.  Python 智能体（Ralph）的子进程挂载。
2.  RAG 与 Harness 工程集成。

## 六、 结论

原报告分析透彻，**同意执行方案 C (混合渐进式迁移)**。但请务必将“Prisma 插件端兼容性”与“Next.js 静态导出”作为首要任务验证。若这两个核心组件验证通过，整个 StoryTree VS Code 定制化开发环境的落地方案将畅通无阻，能为长篇小说创作带来突破性的极客级生产力体验。
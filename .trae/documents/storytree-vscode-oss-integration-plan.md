# StoryTree VS Code OSS 集成 - 任务拆分执行计划

> **基于文档**:
>
> * `docs/planning/StoryTree-VSCode-OSS-Integration-Plan.md` (三阶段实施计划)
>
> * `docs/planning/Dreamweaver-Caiode-VSCode-Offline-Feasibility.md` (离线可行性评估)
>
> * `caiode/Trae-Claude-MultiAgent-Feasibility-Report.md` (多智能体可行性评审)
>
> * `caiode/2026-04-06-trae-claude-multiagent-design.md` (完整架构设计)

***

## 📋 计划概述

### 项目目标

将 `caiode` (服务端智能体引擎) 与 `dreamweaver` (客户端 Web UI) 深度整合，最终合入 `VS Code OSS Fork` 中，打造 **StoryTree IDE** - 专属于长篇小说创作的统一 IDE 解决方案。

### 三阶段实施路线

```
Phase 1: Caiode 插件化 (8周) → Phase 2: Dreamweaver Webview 对接 (6周) → Phase 3: VS Code OSS Fork 定制 (6周)
总预估周期: 约 20-22 周
```

### 关键技术决策

1. **通信机制**: Webview IPC (`acquireVsCodeApi().postMessage`)
2. **并发控制**: `async-mutex` 实现文件锁 + 串行化大模型队列
3. **数据持久化**: SQLite3 + Prisma Client
4. **进程管理**: Python Agent 通过 `child_process` 管理，需防僵尸进程
5. **前端部署**: ⚠️ **需决策 - 见下方方案对比分析**

***

## 🔀 核心技术方案对比与选择 (CRITICAL)

### 方案 A: 纯静态导出 (Static HTML Export) ✅ 推荐

#### 技术架构

```
[dreamweaver Next.js] → next build (output: 'export') → [静态产物 HTML/CSS/JS]
                                                              ↓
                                                    [VS Code Webview 加载]
                                                              ↓
                                                    [IPC 通信 ↔ Extension]
```

#### 优势

* ✅ **零运行时依赖**: 无需启动 Node.js 服务器，降低资源消耗

* ✅ **加载速度快**: 直接从本地文件系统加载静态资源

* ✅ **安全性高**: 无动态路由攻击面

* ✅ **打包简单**: 所有前端产物可直接嵌入 `.vsix`

* ✅ **离线完美**: 完全断网可用（只要 LLM 也离线）

#### 劣势与应对

* ❌ **SSR 功能受限**: 无法使用 `getServerSideProps` / API Routes

  * **应对**: 将业务逻辑迁移到 Extension 层 (Prisma + Commands)

* ❌ **Image Optimization 失效**: Next.js `<Image>` 组件不可用

  * **应对**: 使用原生 `<img>` 标签或手动压缩图片

* ❌ **部分第三方库不兼容**: 强依赖 SSR 的库会报错

  * **应对**: 使用 `next/dynamic` + `ssr: false` 强制客户端渲染

#### 适用场景

* ✅ 小说创作工具（主要是 CRUD 操作，无需复杂 SSR）

* ✅ 离线优先应用

* ✅ 资源受限环境（嵌入式设备、低配 PC）

***

### 方案 B: 本地服务器挂载 (Local Server Mount)

#### 技术架构

```
[dreamweaver Next.js] → 运行在 localhost:3000 (Child Process Node.js)
                                                              ↓
                                                    [Webview iframe 嵌入]
                                                              ↓
                                                    [HTTP 通信 ←→ Extension]
```

#### 优势

* ✅ **保留完整 Next.js 能力**: API Routes、Server Actions、ISR 全部可用

* ✅ **开发体验一致**: 前端代码几乎无需修改

* ✅ **热更新支持**: 开发时支持 HMR (Hot Module Replacement)

* ✅ **渐进式迁移**: 可先跑通再逐步优化

#### 劣势与应对

* ❌ **资源消耗高**: 额外占用一个 Node.js 进程 (\~50-100MB 内存)

* ❌ **端口冲突风险**: 3000 端口可能被其他应用占用

  * **应对**: 使用随机端口或配置项指定

* ❌ **进程管理复杂**: 需确保服务器随插件启停

  * **应对**: 在 `activate()` 中 spawn，`deactivate()` 中 kill

* ❌ **CSP 配置复杂**: iframe 跨域访问需特殊处理

* ❌ **打包体积大**: 需将整个 `node_modules` 打包进 `.vsix`

#### 适用场景

* ✅ 快速原型验证 (MVP 阶段)

* ✅ 强依赖 SSR 的复杂应用

* ✅ 需要完整 Next.js 生态的项目

***

### 🎯 最终推荐: **混合策略 (Hybrid Approach)**

```
Phase 1 (MVP): 使用方案 B (Local Server) 快速验证可行性
    ↓ (验证通过后)
Phase 2 (Production): 重构为方案 A (Static Export) 提升性能
```

#### 实施路径

1. **Phase 1.5 (新增)**: 先用方案 B 实现 Dreamweaver Webview 挂载

   * 目标: 1 周内跑通 "Hello World" 级别的双向通信

   * 验证: IPC/HTTP 两种通信方式的延迟差异

   * 输出: 《前端部署方案对比测试报告》

2. **Phase 2 正式版**: 基于测试数据决定最终方案

   * 如果方案 B 性能可接受 → 保持方案 B（降低重构成本）

   * 如果方案 A 明显更优 → 切换到方案 A（投入 2 周重构）

***

## 🤖 扩展功能模块 (基于设计文档)

### 模块 1: AI 模型离线化支持 (Ollama/LM Studio 集成)

#### 背景

根据可行性报告 §2.3，如果"离线部署"意味着**物理断网**，必须支持本地大模型。

#### 技术方案

```typescript
interface LocalLLMConfig {
  provider: 'ollama' | 'lm-studio' | 'custom';
  endpoint: string;  // http://localhost:11434 (Ollama 默认)
  model: string;     // qwen2.5-coder, llama-3, etc.
  parameters: {
    temperature: number;
    maxTokens: number;
    contextWindow: number;
  };
}
```

#### 任务拆分 (建议放在 Phase 1.7 或 Phase 2.5)

* [ ] **实现 Ollama Adapter** (兼容 OpenAI API 格式)

* [ ] **实现 LM Studio Adapter** (兼容 OpenAI API 格式)

* [ ] **集成到现有 Model Queue** (作为可选 Backend)

* [ ] **开发模型切换 UI** (设置页面中添加"本地模型"选项卡)

* [ ] **编写离线模式端到端测试**

***

### 模块 2: 多智能体协作架构 (Pub/Sub 消息总线)

#### 背景

根据可行性报告 §4.2 和设计文档 §3.1，需要实现智能体间通信机制。

#### 技术方案

```typescript
class AgentEventBus {
  private subscribers: Map<string, Agent[]>;
  
  subscribe(agentId: string, eventType: HookEvent, handler: Function);
  publish(event: AgentEvent); // 广播给所有订阅者
  request(targetAgentId: string, message: AgentMessage): Promise<Response>; // 点对点通信
}
```

#### 任务拆分 (建议放在 Phase 2.6 或独立 Sprint)

* [ ] **实现 Pub/Sub 消息总线核心**

* [ ] **定义智能体通信协议 (Protocol Buffers / JSON-RPC)**

* [ ] **实现任务分发器 (Task Dispatcher)**

* [ ] **实现结果聚合器 (Result Aggregator)**

* [ ] **编写多智能体协作场景测试**

***

### 模块 3: 司令台界面 + 动画系统 (Command Center)

#### 背景

根据设计文档 §6.1 和 §6.2，需要集中展示所有智能体的工作状态。

#### 技术方案

```typescript
interface CommandCenterState {
  agents: AgentDisplay[];
  systemHealth: SystemHealth;
  totalTasks: number;
  runningTasks: number;
}

interface AgentAvatar {
  type: 'CHARACTER' | 'ROBOT' | 'ICON';
  animation: AnimationState; // idle / working / thinking / success / error
  resources: AvatarResources; // SVG/Canvas 动画资源
}
```

#### 任务拆分 (建议放在 Phase 2.7 或 Phase 3.6)

* [ ] **设计司令台布局 (Dashboard Layout)**

* [ ] **实现智能体状态实时更新 (WebSocket / Polling)**

* [ ] **集成动画引擎 (Framer Motion / Canvas API)**

* [ ] **实现系统健康监控面板**

* [ ] **编写司令台交互测试 + 动画性能测试**

***

### 模块 4: 飞书集成模块 (Feishu Integration)

#### 背景

根据设计文档 §2.1 和 Ralph 规则 §5，需要深度集成飞书任务管理与通知。

#### 功能清单

| 功能    | 描述                      | 优先级 |
| ----- | ----------------------- | --- |
| 任务同步  | 自动将 VS Code 任务同步到飞书多维表格 | P0  |
| 进度通知  | 任务完成时发送飞书群消息            | P0  |
| @消息监听 | 监听飞书群 @机器人 消息并自动评审      | P1  |
| 每日报告  | 定时生成每日进度汇报并推送飞书         | P1  |
| 文档联动  | 将任务完成报告写入飞书知识库          | P2  |

#### 任务拆分 (建议放在 Phase 1.8 或独立微服务)

* [ ] **实现飞书 OAuth 授权流程**

* [ ] **实现多维表格读写 SDK 封装**

* [ ] **实现群消息发送与接收**

* [ ] **实现 @消息事件监听与自动评审**

* [ ] **实现每日定时报告生成器 (Cron Job)**

* [ ] **编写飞书集成 E2E 测试**

***

### 模块 5: 钩子系统 (Hook System)

#### 背景

根据设计文档 §5.6 和 §4.4，需要实现任务生命周期钩子以支持自动化工作流。

#### 技术方案

```typescript
interface Hook {
  id: string;
  event: HookEvent; // TASK_CREATED | TASK_COMPLETED | CODE_REVIEW, etc.
  command: string;  // 要执行的命令或函数
  async?: boolean;  // 是否异步执行
  timeout?: number; // 超时时间 (秒)
}
```

#### 内置钩子示例

1. **任务完成 → 触发代码评审** (调用 Reviewer Agent)
2. **代码提交 → 更新飞书任务状态** (调用 Feishu Sync)
3. **文件修改 → 触发保存快照** (调用 Git Snapshot)

#### 任务拆分 (建议放在 Phase 2.8)

* [ ] **实现钩子注册与管理 API**

* [ ] **实现钩子执行引擎 (支持同步/异步)**

* [ ] **实现超时控制与错误隔离**

* [ ] **开发钩子可视化编辑器 (UI)**

* [ ] **编写钩子系统安全测试 (防止恶意命令注入)**

***

## 🎯 任务拆分策略

### 拆分原则

* ✅ **原子化**: 每个任务 0.5-2 小时开发量

* ✅ **TDD 强制**: 每个功能任务必须包含对应单元测试任务

* ✅ **依赖有序**: Infrastructure → Backend → Frontend → QA

* ✅ **可验证**: 每个任务有明确的验收标准

### 模块分组

按三阶段 × 功能模块进行分层：

* **Phase 1**: 基础架构 | 并发控制 | 进程管理 | 插件打包

* **Phase 2**: 网络适配器 | Webview 容器 | 数据同步 | 业务联调

* **Phase 3**: OSS Fork 定制 | 内置扩展 | UI 隐藏 | 安全加固 | 多平台构建

***

## 📦 Phase 1: Caiode 插件化先行与核心架构重构 (8 周)

### 1.1 基础架构与环境搭建 (M1.1)

#### 任务清单

```markdown
## Phase 1: Caiode 插件化核心架构

### 1.1 项目初始化与脚手架
- [ ] **1.1.1 初始化 VS Code Extension 项目结构**
    - 创建 `caiode/vscode-extension/` 目录结构
    - 配置 `package.json` (Extension manifest)
    - 配置 TypeScript 编译环境 (`tsconfig.json`)
    - 安装核心依赖: `vscode`, `async-mutex`, `@prisma/client`, `better-sqlite3`
    - **编写项目结构验证测试**

- [ ] **1.1.2 实现 Extension 生命周期管理**
    - 实现 `activate()` 函数 (插件激活入口)
    - 实现 `deactivate()` 函数 (资源清理钩子)
    - 注册 Extension Context 全局状态管理
    - **编写生命周期单元测试**

- [ ] **1.1.3 集成 trae-auto-extension 底层代码**
    - 迁移 `trae-auto-extension/src/sandbox/SandboxManager.ts`
    - 迁移 `trae-auto-extension/src/webview/` 基础组件
    - 适配新项目结构的 import 路径
    - **编写迁移兼容性测试**

### 1.2 串行化大模型队列系统 (M1.2)

#### 1.2.1 队列调度器核心
- [ ] **1.2.1 设计并实现 Global Model Request Queue**
    - 定义 `ModelRequest` 接口 (id, prompt, priority, agentId, callback)
    - 实现 `RequestQueue` 类 (FIFO + Priority Queue)
    - 实现请求入队/出队方法
    - **编写队列数据结构单元测试**

- [ ] **1.2.2 实现串行化执行引擎**
    - 实现 `QueueProcessor` 类 (单线程消费队列)
    - 实现模型调用封装 (支持超时、重试、取消)
    - 实现结果异步分发机制 (EventEmitter)
    - **编写处理器并发安全测试**

- [ ] **1.2.3 实现拦截器中间件**
    - 实现 LLM Request Interceptor (拦截所有 Agent 请求)
    - 实现请求去重逻辑 (相同 prompt 合并)
    - 实现请求限流 (Rate Limiter)
    - **编写拦截器功能测试**

### 1.3 并发文件锁系统 (M1.3)

#### 1.3.1 文件锁核心实现
- [ ] **1.3.1 基于 async-mutex 实现文件路径互斥锁**
    - 定义 `FileLockManager` 类
    - 实现 `acquire(filePath)` / `release(filePath)` 方法
    - 实现锁超时自动释放机制 (Deadlock Prevention)
    - **编写文件锁基本功能测试**

- [ ] **1.3.2 实现读写锁 (ReadWrite Lock)**
    - 支持多个读者 / 单个写者模式
    - 实现写锁优先级 (防止写者饥饿)
    - 实现锁等待队列可视化 (调试用)
    - **编写读写锁并发场景测试**

- [ ] **1.3.3 集成文件锁到沙箱文件操作**
    - 封装 `SafeFileOperations` 工具类 (读/写/删除均带锁)
    - 实现锁状态监控接口 (用于司令台展示)
    - **编写沙箱文件操作集成测试**

### 1.4 Python Agent 子进程管理 (扩展 M1.3)

#### 1.4.1 进程生命周期管理
- [ ] **1.4.1 实现 Python Agent Process Manager**
    - 定义 `AgentProcess` 接口 (pid, status, sandboxId, startTime)
    - 实现 `ProcessManager` 类 (spawn/monitor/kill)
    - 实现进程健康检查 (Heartbeat, 30s interval)
    - **编写进程启停单元测试**

- [ ] **1.4.2 实现僵尸进程防护机制**
    - 在 `deactivate()` 中实现 PID Tree 查杀
    - 实现孤儿进程回收 (Orphan Reclamation)
    - 实现进程退出码日志记录
    - **编写僵尸进程清理测试**

- [ ] **1.4.3 实现进程间通信 (IPC)**
    - 基于 stdio 实现 JSON-RPC 协议
    - 实现消息序列化/反序列化
    - 实现大消息分包传输 (>1MB)
    - **编写 IPC 通信集成测试**

### 1.5 插件配置与设置页面 (M1.4 部分)

#### 1.5.1 配置管理
- [ ] **1.5.1 实现 VS Code Configuration 管理**
    - 定义 `extensionSettings` schema (在 package.json)
    - 实现配置项: 模型 API 地址、队列大小、锁超时时间等
    - 实现配置变更监听与热更新
    - **编写配置验证测试**

- [ ] **1.5.2 开发插件设置 Webview 页面**
    - 创建 Settings Panel (React + TailwindCSS)
    - 实现表单控件绑定 VS Code Configuration
    - 实现配置导入/导出功能
    - **编写设置页面组件测试**

### 1.6 单元测试与压力测试 (M1.4 部分)

#### 1.6.1 测试基础设施
- [ ] **1.6.1 搭建 Vitest 测试框架**
    - 配置 `vitest.config.ts`
    - 设置测试覆盖率门槛 (>85% for core modules)
    - 实现 Mock 对象工厂 (VS Code API, Prisma, etc.)
    - **编写测试框架自检测试**

- [ ] **1.6.2 实现核心模块压力测试**
    - 模拟 10 个 Agent 并发写入同一文件 (验证 File Lock)
    - 模拟 10 个 Agent 并发请求 LLM (验证 Queue 串行化)
    - 监控内存占用 (<150MB idle, no leaks under load)
    - **编写压力测试脚本与报告生成**

---

## 📦 Phase 2: Dreamweaver 客户端重构与接口深度对接 (6 周)

### 2.1 网络层适配器重构 (M2.1)

#### 2.1.1 RPC 抽象层
- [ ] **2.1.1 设计并实现通用 RPC Client 抽象层**
    - 定义 `IRPCClient` 接口 (request<T>(method, params): Promise<T>)
    - 实现 `HTTPRPCClient` (基于 fetch/axios, 用于浏览器环境)
    - 实现 `IPCClient` (基于 vscode.postMessage, 用于 Webview 环境)
    - 实现环境检测与自动切换逻辑 (`isVSCode() ? IPC : HTTP`)
    - **编写 RPC Client 单元测试**

- [ ] **2.1.2 重构 dreamweaver 的 API 调用层**
    - 扫描 `dreamweaver/src/app/api/` 所有路由
    - 将每个 API 调用替换为 `rpcClient.request()` 调用
    - 保持原有 Type Safety (泛型约束)
    - **编写 API 层重构回归测试**

- [ ] **2.1.3 实现请求拦截与错误处理**
    - 统一错误码映射 (HTTP Status → Business Error)
    - 实现请求重试机制 (Exponential Backoff)
    - 实现请求取消 (AbortController 支持)
    - **编写错误处理流程测试**

### 2.2 Next.js 静态导出与 Webview 挂载 (M2.2)

#### 2.2.1 静态导出配置
- [ ] **2.2.1 配置 Next.js 静态编译**
    - 修改 `next.config.ts`: `output: 'export'`
    - 处理 SSR-only 依赖 (使用 `next/dynamic` + `ssr: false`)
    - 解决 Image Optimization 问题 (使用 `<img>` 替代 `<Image>`)
    - 执行 `next build` 并验证输出产物完整性
    - **编写构建脚本与产物验证测试**

- [ ] **2.2.2 在 caiode 插件中创建 Webview 容器**
    - 实现 `DreamweaverWebviewPanel` 类 (继承 `WebviewPanel`)
    - 实现静态资源加载 (从 extension Uri 加载 HTML/CSS/JS)
    - 配置 CSP (Content Security Policy) 策略
    - **编写 Webview 创建与加载测试**

- [ ] **2.2.3 实现 Webview ↔ Extension 双向通信**
    - Extension 端: 实现 `webview.onDidReceiveMessage()` 监听
    - Webview 端: 封装 `useVSCodeMessage()` React Hook
    - 实现 "Hello World" 级别消息往返验证
    - **编写双向通信 E2E 测试**

### 2.3 数据同步机制 (M2.3)

#### 2.3.1 SQLite + Prisma 集成
- [ ] **2.3.1 在 Extension 进程中初始化 Prisma + SQLite**
    - 配置 Prisma Schema (复用 dreamweaver 的 schema)
    - 数据库路径指向 `globalStorageUri` (VS Code 存储目录)
    - 实现数据库迁移自动化 (on activation)
    - **编写数据库连接与迁移测试**

- [ ] **2.3.2 实现数据操作命令 (Commands)**
    - 注册 VS Code Commands: `storytree.project.create`, `storytree.character.add`, 等
    - 每个 Command 封装对应的 Prisma CRUD 操作
    - 实现事务支持 (复杂业务操作)
    - **编写 Command 层单元测试**

- [ ] **2.3.3 实现实时数据推送机制**
    - Extension 端: 数据变更后通过 `webview.postMessage()` 推送事件
    - Webview 端: 使用 Zustand Store 接收更新并触发重渲染
    - 实现增量更新策略 (避免全量推送大数据)
    - **编写数据同步性能测试 (1MB 大纲树 <50ms)**

### 2.4 核心业务模块联调 (M2.4)

#### 2.4.1 角色库模块
- [ ] **2.4.1 角色库 Webview 适配**
    - 验证角色列表展示 (从 Extension 获取数据)
    - 验证角色增删改查操作 (通过 IPC → Command → Prisma)
    - 验证角色详情页渲染
    - **编写角色库 Playwright 测试**

#### 2.4.2 大纲视图模块
- [ ] **2.4.2 大纲树形结构 Webview 适配**
    - 验证大纲树的懒加载与展开/折叠
    - 验证拖拽排序功能 (需特殊处理 IPC 延迟)
    - 验证章节编辑器的保存流程
    - **编写大纲视图交互测试**

#### 2.4.3 工作台模块
- [ ] **2.4.3 写作工作台 Webview 适配**
    - 验证编辑器加载与内容回显
    - 验证 AI 辅助写作按钮触发 (调用 LLM Queue)
    - 验证自动保存机制 (debounce + IPC)
    - **编写工作台核心链路测试**

---

## 📦 Phase 3: VS Code OSS Fork 深度集成与最终交付 (6 周)

### 3.1 VS Code OSS Fork 基础定制 (M3.1)

#### 3.1.1 Fork 与基础配置
- [ ] **3.1.1 Fork microsoft/vscode 仓库**
    - Clone 最新稳定版 VS Code OSS
    - 创建 StoryTree 分支 (`storytree-v1.0`)
    - 修改 `product.json`: 名称、Logo、启动屏、默认主题
    - **编写 Fork 版本识别测试**

- [ ] **3.1.2 定制 IDE 品牌元素**
    - 替换应用图标 (Windows .ico, macOS .icns, Linux .png)
    - 修改启动画面 (Splash Screen)
    - 修改默认颜色主题 (StoryTree Theme)
    - 修改 About 对话框信息
    - **编写品牌元素视觉验证测试**

### 3.2 内置扩展注入 (M3.2)

#### 3.2.1 打包 caiode 为内置扩展
- [ ] **3.2.1 将 caiode 插件复制到 VS Code extensions/ 目录**
    - 整理插件依赖 (确保无外部 npm 依赖缺失)
    - 配置 `extensions/package.json` 的 `activationEvents` (自动激活)
    - 配置 `extensions/builtinExtensions.json` 注册为内置
    - **编写内置扩展激活测试**

- [ ] **3.2.2 解决原生依赖问题**
    - 处理 `better-sqlite3` 或 `Prisma` 的原生 C++ 绑定
    - 方案 A: 使用预编译的 Prebuild Binaries
    - 方案 B: 降级为纯 JS 实现 (`sql.js`)
    - **编写跨平台原生依赖加载测试**

### 3.3 统一配置与 UI 隐藏定制 (M3.3)

#### 3.3.1 隐藏不需要的 VS Code 默认面板
- [ ] **3.3.1 实现 UI 元素隐藏配置**
    - 隐藏默认扩展市场面板 (或替换为私有市场)
    - 隐藏源代码管理面板中不需要的部分
    - 隐藏调试面板 (非开发者不需要)
    - 修改默认布局 (侧边栏只显示 StoryTree 视图)
    - **编写 UI 隐藏验证测试**

- [ ] **3.3.2 定制欢迎页 (Welcome Page)**
    - 替换默认 Welcome 页为 StoryTree 引导页
    - 显示快速开始指南、最近项目列表
    - 集成新手教程链接
    - **编写欢迎页交互测试**

### 3.4 安全加固与性能优化 (M3.4)

#### 3.4.1 Webview 安全配置
- [ ] **3.4.1 强化 Webview CSP 策略**
    - 禁止 Webview 访问外部 URL (除本地 Extension 资源)
    - 禁止 Webview 使用 Node.js API 注入 (`enableScripts: false` 或白名单)
    - 实现内容安全审计日志
    - **编写 CSP 策略安全扫描测试**

- [ ] **3.4.2 Electron 启动性能优化**
    - 分析冷启动瓶颈 (使用 electron-launch-stats)
    - 延迟加载非核心内置扩展
    - 优化 SQLite 数据库初始化 (异步预加载)
    - 目标: 冷启动 <3s (中端 PC)
    - **编写启动性能基准测试**

### 3.5 多平台构建与交付 (M3.5)

#### 3.5.1 CI/CD 多平台构建矩阵
- [ ] **3.5.1 配置 GitHub Actions 多平台编译**
    - Windows 11 (x64)
    - macOS (Apple Silicon + Intel x64)
    - Ubuntu 22.04 (x64)
    - 配置 artifact 上传 (生成 .exe/.dmg/.AppImage)
    - **编写 CI 流水线冒烟测试**

- [ ] **3.5.2 多平台安装包验证**
    - 在每个平台上执行安装 → 启动 → 核心功能检查
    - 验证动态链接库完整性 (特别是 SQLite 相关)
    - 验证中文路径与特殊字符支持
    - **编写跨平台安装验收测试**

#### 3.5.3 文档与用户手册
- [ ] **3.5.3 编写用户使用手册**
    - 安装部署指南 (各平台)
    - 快速入门教程 (创建第一个小说项目)
    - 常见问题解答 (FAQ)
    - **编写文档完整性检查脚本**

---

## 📊 交付物清单汇总

### 代码交付物
| 阶段 | 交付物 | 格式 |
|------|--------|------|
| Phase 1 | caiode VS Code 插件源码 | TypeScript |
| Phase 1 | `.vsix` 安装包 (可独立安装测试) | VSIX |
| Phase 1 | 《大模型请求队列与并发文件锁设计文档》 | Markdown |
| Phase 2 | dreamweaver 静态导出产物 | HTML/CSS/JS |
| Phase 2 | caiode 插件中集成的 Webview 渲染容器 | TypeScript |
| Phase 2 | 《Dreamweaver VS Code Webview IPC 接口契约》 | Markdown |
| Phase 3 | StoryTree IDE 多平台安装包 | .exe/.dmg/.AppImage |
| Phase 3 | VS Code OSS 私有源码仓库 | Git Repository |

### 文档交付物
| 文档 | 内容 |
|------|------|
| 单元测试报告 | 核心模块覆盖率 >85% |
| 压力测试报告 | 10 Agent 并发稳定性验证 |
| 性能基准报告 | FCP <1.5s, 启动 <3s |
| 安全扫描报告 | Snyk/npm audit + CSP 检查 |
| 用户手册 | 安装、使用、FAQ |

---

## ⚠️ 关键风险与应对

| 风险 | 影响 | 应对措施 | 优先级 |
|------|------|----------|--------|
| **Python 僵尸进程** | 系统资源泄漏 | PID Tree 强制查杀 + Heartbeat 监控 | P0 |
| **Next.js SSR 依赖静态导出失败** | 前端无法运行 | 使用 `next/dynamic` + `ssr: false` 降级 | P0 |
| **SQLite 原生绑定跨平台编译失败** | 无法打包 | Prebuild Binaries 或降级 `sql.js` | P0 |
| **VS Code OSS 构建链复杂** | 多平台打包失败 | 提前搭建 CI 矩阵 + 预编译依赖 | P1 |
| **Webview IPC 大数据性能** | 1MB 大纲树延迟 >50ms | 增量更新 + 压缩传输 | P1 |
| **LLM Queue 成为性能瓶颈** | Agent 响应慢 | 异步分发 + 结果缓存 | P2 |

---

## 📈 质量门禁指标

### Phase 1 质量门禁
- [ ] 0 个 Critical/High 级别的并发死锁缺陷
- [ ] Extension Host 内存闲置 <150MB, 无内存泄漏
- [ ] 核心队列调度器、文件锁覆盖率 >85%
- [ ] 10 Agent 压力测试通过 (无崩溃、无文件损坏)

### Phase 2 质量门禁
- [ ] 前端 FCP (首次内容绘制) <1.5s
- [ ] 核心业务逻辑 100% 跑通 (无 HTTP 404 错误)
- [ ] 1MB JSON IPC 传输延迟 <50ms
- [ ] Playwright 核心交互路径测试通过

### Phase 3 质量门禁
- [ ] IDE 冷启动 <3s (中端 PC)
- [ ] 跨平台打包成功率 100%
- [ ] 安全扫描 0 个 Critical/High 漏洞
- [ ] 多平台端到端安装验收通过

---

## 🔄 下一步行动

✅ **本计划已完成 (v1.1 - 增强版)**，请确认后执行以下步骤：

### 📋 完整任务清单概览 (总计 ~120-150 个原子化任务)

#### **Phase 1: Caiode 插件化核心架构 (~40 任务)**
- 1.1 项目初始化与脚手架 (3 个任务)
- 1.2 **串行化大模型队列系统** (3 个任务) ⭐ 核心创新
- 1.3 **并发文件锁系统** (3 个任务) ⭐ 解决资源冲突
- 1.4 Python Agent 子进程管理 (3 个任务)
- 1.5 插件配置与设置页面 (2 个任务)
- 1.6 单元测试与压力测试 (2 个任务)
- **1.7 AI 模型离线化支持** (5 个任务) 🆕 Ollama/LM Studio
- **1.8 飞书集成基础版** (6 个任务) 🆕 任务同步 + 通知
- **1.5 (新增) 方案 B 快速验证** (3 个任务) 🆕 Local Server MVP

#### **Phase 2: Dreamweaver Webview 对接 + 高级功能 (~50 任务)**
- 2.1 网络层适配器重构 (3 个任务)
- 2.2 Next.js 静态导出 + Webview 容器 (3 个任务)
- 2.3 数据同步机制 (SQLite + Prisma + IPC) (3 个任务)
- 2.4 核心业务模块联调 (角色库/大纲/工作台) (3 个任务)
- **2.5 前端部署方案决策与重构** (2-4 个任务) 🆕 基于 Phase 1.5 测试数据
- **2.6 多智能体协作架构** (5 个任务) 🆕 Pub/Sub 消息总线
- **2.7 司令台界面 + 动画系统** (5 个任务) 🆕 Dashboard
- **2.8 钩子系统** (5 个任务) 🆕 任务生命周期自动化

#### **Phase 3: VS Code OSS Fork 定制交付 (~30 任务)**
- 3.1 Fork 基础定制 (品牌元素) (2 个任务)
- 3.2 内置扩展注入 (2 个任务)
- 3.3 UI 隐藏定制 (2 个任务)
- 3.4 安全加固 + 性能优化 (2 个任务)
- 3.5 多平台构建 + 文档 (3 个任务)
- **3.6 司令台深度集成** (可选, 3-5 个任务) 🆕 如果 Phase 2 未完成

---

### 📦 新增交付物清单

| 阶段 | 新增交付物 | 说明 |
|------|-----------|------|
| Phase 1.5 | 《前端部署方案对比测试报告》 | 方案 A vs B 性能基准数据 |
| Phase 1.7 | 本地 LLM Adapter 源码 | Ollama/LM Studio 支持 |
| Phase 1.8 | 飞书集成 SDK 封装 | OAuth + 多维表格 + 群消息 |
| Phase 2.6 | 多智能体协作引擎源码 | Pub/Sub + Task Dispatcher |
| Phase 2.7 | 司令台 Webview 源码 | React + 动画引擎 |
| Phase 2.8 | 钩子系统源码 | 可视化编辑器 + 安全沙箱 |

---

### 🎯 执行优先级建议 (MVP 策略)

#### **第一优先级 (P0 - 必须完成)**
```

Phase 1.1 → 1.2 → 1.3 → 1.4 → 1.6 (核心架构 + 并发控制 + 测试)
↓
Phase 2.1 → 2.2 (方案B) → 2.3 → 2.4 (Webview 对接 + 业务联调)
↓
Phase 3.1 → 3.2 → 3.5 (OSS Fork + 打包交付)

```
**预估工期**: 12-14 周 | **目标**: 可用的 StoryTree IDE v0.1 (MVP)

#### **第二优先级 (P1 - 强烈推荐)**
```

Phase 1.5 (方案验证) → 1.7 (离线 LLM) → 1.8 (飞书基础)
↓
Phase 2.5 (前端优化) → 2.8 (钩子系统)

```
**预估额外工期**: 4-6 周 | **目标**: v1.0 (生产就绪)

#### **第三优先级 (P2 - 锦上添花)**
```

Phase 2.6 (多智能体) → 2.7 (司令台+动画) → 3.6 (深度集成)

```
**预估额外工期**: 4-6 周 | **目标**: v2.0 (企业级功能完备)

---

### ✅ 正式文件生成清单

确认后我将立即生成：

1. **`docs/planning/vscode-oss-integration/04-ralph-tasks.md`**
   - 包含所有 ~120-150 个原子化任务
   - 按 Phase × Module 分组，带行号和依赖关系
   - 标注 P0/P1/P2 优先级和预计工时

2. **`docs/planning/vscode-oss-integration/05-test-plan.md`**
   - 包含所有测试用例 (TC-ID 编号)
   - 覆盖单元测试、集成测试、E2E、压力测试、安全测试
   - 明确验收标准和通过条件

3. **更新 `RALPH_STATE.md`**
   - 新建迭代: `vscode-oss-integration-phase1-mvp`
   - 设置当前阶段: Planning Locked → Implementation Ready
   - 配置 Git 分支: `feature/vscode-oss-phase1`

4. **启动 Ralph 执行引擎**
   - 使用 `ralph-task-executor` 开始逐任务执行
   - 严格 TDD 流程 (Red → Green → Refactor)
   - 每个任务完成后自动更新状态并生成报告

---

**计划版本**: v1.1 (增强版 - 补充方案对比 + 5 大功能模块)
**创建时间**: 2026-04-07
**更新时间**: 2026-04-07 (补充技术方案对比与扩展模块)
**总任务数**: ~120-150 个原子化任务 (含测试任务)
**总工期**: 20-28 周 (取决于 P0-P2 范围选择)
**MVP 工期**: 12-14 周 (仅 P0 任务)
```


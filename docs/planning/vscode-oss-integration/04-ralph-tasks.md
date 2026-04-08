# 混合渐进式迁移策略 任务清单 (Phase 1-3)

> 基于 ADR-001 (架构) 和 ADR-002 (网关、安全、Mock 下沉) 的决策，更新后的渐进式开发任务清单。

## [Phase 1.1] 制定前后端通信协议 (IPC Protocol Design)
- [x] **T-POC-001**: 定义标准的 JSON-RPC 格式的通信协议（如 `id`, `action`, `payload`, `status`），作为 Webview 与 VS Code 插件间的唯一通信契约。
- [x] **T-POC-002**: 在 `dreamweaver` 中实现基于该协议的 RPC 适配器 (Adapter)，取代现有的 `fetch/axios` 拦截。
- [x] **T-POC-003**: 在 `caiode` 扩展中实现对应的消息路由处理器 (Message Router)，解析并分发该格式的消息。

## [Phase 1.2] 前端静态导出验证 (Next.js Static Export PoC)
- [x] **T-POC-004**: 在 `dreamweaver/next.config.ts` 中配置 `output: 'export'`，移除所有阻碍静态导出的代码 (如 `next-intl` 的动态路由)。
- [x] **T-POC-005**: 成功构建出纯静态产物 (`out/` 目录)。

## [Phase 1.3] 插件骨架与 Mock 层下沉 (Extension Skeleton & Mock Migration)
- [x] **T-POC-006**: 初始化极简的 VS Code Extension 骨架，创建 Webview Panel，将 `dreamweaver` 静态产物加载至容器中。
- [x] **T-POC-007**: 将原 `dreamweaver` 中的 Mock 逻辑 (如 MSW 定义的假数据) 迁移到 `caiode` 扩展的 Node.js 层。
- [x] **T-POC-008**: 跑通双端通信：Webview 发起获取小说大纲的 IPC 请求 -> VS Code 扩展返回 Mock 数据 -> 前端成功渲染。

## [Phase 1.4] 持续推进 DW 页面开发与测试 (Stitch UI Dev & Test)
> 在完成 Phase 1.3 的 Mock 通信层后，前端团队可以在真实的 VS Code Webview 环境（或浏览器模拟环境）中继续迭代。
- [x] **T-FE-001**: 恢复剩余的 Stitch 原页面开发（如知识库、角色设定、设置页等）。
- [x] **T-FE-002**: 继续完善 Playwright 自动化 UI 测试和 VRT (Visual Regression Testing)。
- [x] **T-FE-003**: 确保所有新增页面的数据请求均通过 Phase 1.1 的 IPC 适配器。

## [Phase 1.5] 安全机制架构设计与验证 (Security & Isolation PoC)
- [x] **T-SEC-001**: **数据安全**：验证在 VS Code 插件中，通过 `SecretStorage` 读写 OpenAI API Keys 的流程，取代明文配置。
- [x] **T-SEC-002**: **文件隔离**：实现插件级的文件沙箱机制 (File Sandbox)，限制 Python Agent 或 Node 逻辑只能在当前工作区 (`Workspace`) 的指定 `.storytree` 目录下读写。
- [x] **T-SEC-003**: **反编译防护**：配置 `esbuild` 或 `webpack` 对 VS Code 扩展产物进行深度混淆；验证 Python 脚本的 `PyArmor` 编译流程。
- [x] **T-SEC-004**: **本地库加密**：验证 `sqlcipher` 或类似加密数据库驱动在 Electron 宿主下的可用性，保护用户小说数据不被外部工具窥探。

## [Phase 1.6] SQLite 本地化替换 (Replace Mock with Local DB)
> 在所有前端页面开发完成，且安全策略落地的基础上，最后执行此步骤。
- [x] **T-DB-001**: 在 `caiode` 中引入真实的 SQLite (`better-sqlite3` 或类似兼容库)，替换掉 Phase 1.3 中的 Mock 数据路由。
- [x] **T-DB-002**: 实现完整的 Prisma/SQL CRUD 逻辑。
- [x] **T-DB-003**: 联调前端业务与本地真实数据库。

## [Phase 1.7] 云端网关集成 (Cloud Gateway Integration)
- [x] **T-GW-001**: 在 `caiode` 扩展启动时，接入用户登录与云端授权 (License) 验证。
- [x] **T-GW-002**: 接入续费支付、全局配置拉取。
- [x] **T-GW-003**: 集成版本检查 (OTA Update) 和错误日志上报机制。
- [x] **T-GW-004**: 提供用户反馈入口 (Feedback Panel)，对接至云端系统。

---

## [Phase 2] Dreamweaver 客户端重构与深度对接 (Client Refactoring & Deep Integration)

> 基于《StoryTree-VSCode-OSS-Integration-Plan》第二阶段目标：将 Dreamweaver 功能模块完全剥离服务端逻辑，重构为纯静态 Webview 客户端；完成 IPC 深度对接、AI 引擎直连、VS Code 原生能力集成。

### [Phase 2.1] AI/LLM 引擎集成 (AI Engine Integration)

> **核心价值**：ADR-001 Section 2.3 决策 — "抛弃中心化转发网关，VS Code 本地直连第三方 OpenAPI"。这是 StoryTree IDE 最核心的差异化功能。

#### 2.1.1 LLM Provider 抽象层
- [x] **T-AI-001**: 定义 `LLMProvider` 接口抽象，统一封装 OpenAI / Anthropic / Ollama(本地) 三种后端的 `chatCompletion()` 和 `streamChatCompletion()` 方法签名。
    - [x] 实现 `OpenAIProvider` 类：基于 `openai` npm 包，支持 GPT-4o/GPT-4o-mini 模型，含超时控制 (30s) 和自动重试 (指数退避, 最大 3 次)。
    - [x] **编写 `OpenAIProvider` 单元测试** (mock fetch，验证请求格式、流式分片解析、错误重试)。
- [x] **T-AI-002**: 实现 `AnthropicProvider` 类：基于 `@anthropic-ai/sdk`，支持 Claude Sonnet/Haiku 系列，处理 Anthropic 特有的 message format (system/user/assistant role 分离) 和 token 计费限制。
    - [x] **编写 `AnthropicProvider` 单元测试** (验证 Claude API 调用格式、长文本截断、tool_use 处理)。
- [x] **T-AI-003**: 实现 `OllamaProvider` 类：基于 HTTP 调用本地 Ollama 服务 (`http://localhost:11434`)，支持 Qwen/Llama 等开源模型，用于离线/隐私敏感场景。
    - [x] **编写 `OllamaProvider` 单元测试** (验证本地连接检测、模型列表拉取、离线降级提示)。
- [x] **T-AI-004**: 实现 `LLMProviderFactory` 工厂函数：根据用户配置 (`settings.json` 中的 `storytree.ai.provider`) 自动实例化对应 Provider，未配置时降级为 NoopProvider 并提示引导。
    - [x] **编写 `LLMProviderFactory` 单元测试** (验证工厂选择逻辑、未知 provider 降级、运行时切换)。

#### 2.1.2 流式响应管道 (Streaming Pipeline)
- [x] **T-AI-005**: 实现 `StreamProcessor` 流式处理器：将 LLM 返回的 SSE (Server-Sent Events) / NDJSON 流实时解析为增量 Token 文本块，通过 `vscode.postMessage` 推送到 Webview 渲染 Markdown。
    - [x] 支持 `abortController` 中断（用户点击"停止生成"）。
    - [x] 支持 token 用量统计 (prompt_tokens / completion_tokens) 并回传给 Webview 显示。
    - [x] **编写 `StreamProcessor` 单元测试** (模拟 SSE 流、验证增量拼接、中断恢复、token 计数)。
- [x] **T-AI-006**: 实现 `ConversationManager` 对话管理器：维护多轮对话上下文窗口，支持上下文截断策略 (滑动窗口 / 摘要压缩)，将对话历史持久化到 SQLite `conversations` 表。
    - [x] **编写 `ConversationManager` 单元测试** (验证上下文追加、窗口溢出截断、摘要触发、持久化读写)。

#### 2.1.3 Prompt 模板系统
- [x] **T-AI-007**: 实现 `PromptTemplate` 引擎：加载 `.storytree/prompts/` 目录下的 YAML/EJS 模板文件，支持变量插值 (`{{project_name}}`, `{{chapter_content}}`)、条件渲染 (`{{#if has_outline}}`)、System/User 角色分离。
    - [x] 内置模板：章节续写 (chapter_continue)、角色对话生成 (character_dialogue)、大纲展开 (outline_expand)、文本润色 (text_polish)、风格迁移 (style_transfer)。
    - [x] **编写 `PromptTemplate` 单元测试** (验证模板编译、变量替换、条件渲染、内置模板可用性)。

### [Phase 2.2] 完整页面集与富交互 (Full Page Set & Rich Interactions)

> 当前 html-generator.ts 仅包含 4 个基础页面 (Dashboard/Characters/Outline/WorldSettings)。Phase 2 需要补全 StoryTree IDE 所需的全部页面，并增强交互体验。

#### 2.2.1 编辑器/工作台页面 (Editor Workbench)
- [x] **T-FE-004**: 实现 `WorkbenchPage` HTML 生成：富文本编辑区域 (基于 contenteditable + 自定义工具栏：加粗/斜体/标题层级/引用/列表)、左侧章节导航树、右侧 AI 助手面板 (聊天输入 + 流式输出区 + 快捷指令按钮)。
    - [x] 编辑器内容变更通过 IPC (`action: chapter.updateContent`) 自动保存到 SQLite，防抖延迟 500ms。
    - [x] 字数统计实时显示在底部状态栏。
    - [x] **编写 `WorkbenchPage` 单元测试** (验证 HTML 结构完整性、IPC save 事件触发、字数统计准确性)。
- [x] **T-FE-005**: 实现 `AIChatPanel` HTML 生成：嵌入工作台右侧的 AI 对话面板，支持多轮对话气泡展示、Markdown 流式渲染 (marked.js 内联)、代码块高亮 (highlight.js 内联)、快捷操作 (复制/重新生成/插入编辑器)。
    - [x] **编写 `AIChatPanel` 单元测试** (验证消息气泡 DOM 结构、Markdown 渲染、快捷操作按钮事件绑定)。

#### 2.2.2 设置与配置页面 (Settings Page)
- [x] **T-FE-006**: 实现 `SettingsPage` HTML 生成：AI Provider 选择 (OpenAI/Anthropic/Ollama/自定义)、API Key 输入 (调用 SecretStorage 存取)、模型选择下拉框、系统提示词编辑器 (textarea)、主题切换 (Light/Dark/System)、语言偏好 (zh-CN/en-US)、导出/导入数据按钮。
    - [x] 所有设置变更通过 IPC (`action: settings.update`) 同步到 Extension 层持久化。
    - [x] **编写 `SettingsPage` 单元测试** (验证表单元素完整、设置项 IPC 通信、主题切换 CSS class 应用)。

#### 2.2.3 项目管理增强 (Project Management Enhancement)
- [x] **T-FE-007**: 增强 `DashboardPage`：新增「新建项目」弹窗表单 (项目名称/类型/简介)、项目卡片支持右键菜单 (重命名/归档/删除)、最近编辑时间排序、项目搜索过滤。
    - [x] 新建/重命名/删除操作通过 IPC (`action: project.create/rename/delete`) 与 SQLite 交互。
    - [x] **编写增强 Dashboard 单元测试** (验证新建表单弹出、CRUD 操作 IPC 调用、搜索过滤逻辑)。

### [Phase 2.3] VS Code 原生能力集成 (VS Code Native Feature Integration)

> 将 StoryTree 深度融入 VS Code 生态，提供原生级的 IDE 体验。

#### 2.3.1 侧边栏 TreeView (Sidebar TreeView)
- [x] **T-VSC-001**: 实现 `StoryTreeTreeViewProvider`：注册 `StoryTreeExplorer` 自定义侧边栏视图，树形展示 当前项目 → 章节 → 场景 的层级结构，支持节点单击打开对应内容、右键菜单 (新建章节/删除/重命名)、拖拽排序。
    - [x] 树节点图标使用 VS Code ThemeIcon (file/book/list-ordered 等)。
    - [x] 数据源从 `repository.ts` 读取，变更时触发 `onDidChangeTreeData` 刷新。
    - [x] **编写 `StoryTreeTreeViewProvider` 单元测试** (验证树形数据构建、节点展开/折叠、刷新触发)。

#### 2.3.2 状态栏与命令面板 (StatusBar & CommandPalette)
- [x] **T-VSC-002**: 实现 `StatusBarManager`：在 VS Code 底部状态栏添加 StoryTree 区域，显示当前项目名、当前章节数、总字数、AI 连接状态 (绿点在线/红点离线/黄点配置缺失)，点击状态栏项可快速聚焦 Webview。
    - [x] **编写 `StatusBarManager` 单元测试** (验证状态栏项创建、文本更新、点击命令注册)。
- [x] **T-VSC-003**: 注册 CommandPalette 命令集：
    - [x] `storytree.openDashboard`: 打开主面板
    - [x] `storytree.newProject`: 新建项目
    - [x] `storytree.newChapter`: 新建章节
    - [x] `storytree.toggleAIChat`: 切换 AI 助手面板
    - [x] `storytree.showSettings`: 打开设置页
    - [x] `storytree.wordCount`: 显示当前项目字数统计
    - [x] 每个命令绑定快捷键 (Cmd/Ctrl+Shift+T 打开面板等)。
    - [x] **编写命令注册单元测试** (验证命令注册、快捷键绑定、命令执行回调)。

#### 2.3.3 文件系统监听 (FileSystem Watcher)
- [x] **T-VSC-004**: 实现 `ExternalFileSync` 监听器：使用 `vscode.workspace.createFileSystemWatcher` 监控 `.storytree/` 目录下的 JSON 文件变更，当外部工具 (如手动编辑/脚本) 修改了项目数据时，自动 reload SQLite 并推送通知到 Webview。
    - [x] 防抖处理 (300ms)，避免频繁触发。
    - [x] **编写 `ExternalFileSync` 单元测试** (验证文件变更检测、防抖逻辑、Webview 通知发送)。

### [Phase 2.4] 实时数据同步机制 (Real-time Data Sync)

> 从当前的 Request-Response 模型升级为 Event-Driven 模型，支持数据库变更实时推送到 Webview。

- [x] **T-SYNC-001**: 实现 `EventBus` 事件总线：在 Extension 进程内实现发布-订阅模式，支持 topic-based 过滤 (如 `db:chapter.*`, `db:project.*`)，SQLite CRUD 操作后自动 publish 对应事件。
    - [x] **编写 `EventBus` 单元测试** (验证订阅/发布/取消订阅、topic 通配符匹配、事件顺序保证)。
- [x] **T-SYNC-002**: 实现 `SyncPushService` 推送服务：订阅 EventBus 的数据变更事件，批量聚合 (window 100ms) 后通过 `webview.postMessage({ type: 'data-push', payload })` 推送到 Webview，Webview 端根据 type 局部刷新对应 UI 区域 (非全量重渲染)。
    - [x] 支持 diff-patch 算法 (可选 jsondiffpatch) 减少传输量。
    - [x] **编写 `SyncPushService` 单元测试** (验证事件聚合、消息格式、批量推送、断线重连)。

### [Phase 2.5] 构建与打包流水线 (Build & Package Pipeline)

> 为分发做准备：生产级混淆构建、.vsix 打包、多平台兼容性验证。

- [x] **T-BUILD-001**: 完善 `esbuild.config.mjs` 生产构建配置：配置外部依赖 (vscode, better-sqlite3 等原生模块标记为 external)、定义 entry points (extension 作为 main, webview 作为 separate bundle)、source-map 隐藏 (sources-content=false)、生成 LICENSE.third-party.txt。
    - [x] **编写构建脚本验证测试** (验证产物输出目录结构、external 依赖正确排除、产物大小合理 < 5MB)。
- [x] **T-BUILD-002**: 配置 `package.json` for VSIX 打包：完善 publisher/displayName/description/categories/keywords/activationEvents/contributes (commands/menus/views/configuration)、配置 vsce 打包参数 (`--no-dependencies`)。
    - [x] 编写 `package.json` schema 验证 (使用 `@vscode/vsce --package` 预检)。
    - [x] **编写 package.json 配置验证测试** (验证 contributes 合法性、activation events 覆盖完整)

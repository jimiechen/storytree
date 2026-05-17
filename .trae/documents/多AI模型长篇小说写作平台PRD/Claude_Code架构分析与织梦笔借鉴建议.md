# Claude Code 架构分析报告

> 基于 Claude Code CLI 反编译源码的深度架构分析
> 源码版本：从 `cli.js.map` (source map v3) 提取，共 1902 个 TypeScript/TSX 源文件

---

## 一、项目概览

### 1.1 基本信息

| 项目属性 | 值 |
|---------|---|
| 运行时 | Bun (通过 `bun:bundle` 的 `feature()` 实现条件编译和死代码消除) |
| UI 框架 | React + Ink (终端 UI) |
| API SDK | @anthropic-ai/sdk |
| 包管理 | npm (bun.lock) |
| 编译产物 | 单文件 cli.js (~13MB, ~30万行) + cli.js.map (~57MB) |
| 源文件总数 | 4756 (含 node_modules)，其中 src/ 下 1902 个 |
| 模块系统 | ESM (.js 扩展名导入) |

### 1.2 入口点结构

Claude Code 有多个入口点，通过 `src/entrypoints/cli.tsx` 进行路由分发：

```
cli.tsx (Bootstrap 入口)
  ├── --version/-v          → 快速路径，零模块加载
  ├── --dump-system-prompt  → 导出系统提示词（ANT-only）
  ├── --claude-in-chrome-mcp → Chrome MCP 服务器
  ├── --chrome-native-host  → Chrome 原生宿主
  ├── --computer-use-mcp    → Computer Use MCP 服务器
  ├── --daemon-worker       → 后台工作进程
  ├── remote-control/rc/remote/sync/bridge → Bridge 模式
  ├── daemon                → 后台守护进程
  ├── ps/logs/attach/kill   → 后台会话管理
  └── (默认)                → main.tsx → REPL 交互模式
```

**关键设计**：所有分支使用动态 `import()` 实现快速路径优化，`--version` 命令零模块加载即可返回。

---

## 二、整体架构模式

### 2.1 核心架构：REPL + QueryEngine + Tool 三层模型

Claude Code 采用经典的 **REPL (Read-Eval-Print Loop)** 架构，分为三层：

```
┌─────────────────────────────────────────────────────────────┐
│                     REPL Layer (UI)                         │
│  PromptInput → processUserInput → CommandQueue → Renderer   │
│  (React/Ink 终端 UI, 消息渲染, 权限对话框)                    │
├─────────────────────────────────────────────────────────────┤
│                  QueryEngine Layer (核心)                    │
│  submitMessage() → 系统提示词构建 → API 调用 → 工具执行循环    │
│  (会话状态管理, 消息历史, Token 计费, 上下文压缩)               │
├─────────────────────────────────────────────────────────────┤
│                    Tool Layer (工具)                         │
│  BashTool / FileEditTool / AgentTool / MCP Tools / Skills   │
│  (工具注册, 权限检查, 沙箱执行, 结果格式化)                    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 条件编译与特性门控

Claude Code 大量使用 Bun 的 `feature()` 宏进行编译时死代码消除（DCE）：

```typescript
// 示例：Auto Mode 仅在 ANT 内部版本中编译
const autoModeStateModule = feature('TRANSCRIPT_CLASSIFIER')
  ? require('./utils/permissions/autoModeState.js')
  : null
```

已识别的特性门控标记：
- `TRANSCRIPT_CLASSIFIER` — Auto Mode（自动权限分类器）
- `COORDINATOR_MODE` — 协调器模式（多 Agent 协调）
- `KAIROS` / `KAIROS_DREAM` — Assistant 模式
- `BRIDGE_MODE` — 远程控制 Bridge 模式
- `DAEMON` — 后台守护进程
- `BG_SESSIONS` — 后台会话管理
- `HISTORY_SNIP` — 历史压缩
- `ANTI_DISTILLATION_CC` — 反蒸馏保护
- `AGENT_TRIGGERS` / `AGENT_TRIGGERS_REMOTE` — Agent 触发器
- `BUILDING_CLAUDE_APPS` — Claude 应用构建
- `ABLATION_BASELINE` — 消融实验基线

---

## 三、模块划分与依赖关系

### 3.1 顶层模块结构

```
src/
├── entrypoints/          # 入口点 (cli.tsx, agentSdkTypes.ts)
├── main.tsx              # 主入口，CLI 参数解析，REPL 启动
├── QueryEngine.ts        # 核心查询引擎（对话循环）
├── Task.ts               # 任务系统类型定义
├── Tool.ts               # 工具系统核心类型
├── commands.ts           # 斜杠命令注册表
├── tools/                # 工具实现
│   ├── BashTool/         # Shell 命令执行 (18 文件)
│   ├── AgentTool/        # Agent 工具 (20 文件)
│   ├── FileEditTool/     # 文件编辑
│   ├── FileReadTool/     # 文件读取
│   ├── WebFetchTool/     # 网页抓取
│   ├── PowerShellTool/   # PowerShell 执行
│   ├── LSPTool/          # 语言服务协议
│   ├── BriefTool/        # 摘要工具
│   ├── SyntheticOutputTool/ # 结构化输出
│   └── ToolSearchTool/   # 工具搜索
├── services/             # 服务层
│   ├── api/              # Anthropic API 交互 (20 文件)
│   ├── mcp/              # MCP 协议客户端 (23 文件)
│   ├── compact/          # 上下文压缩 (11 文件)
│   ├── analytics/        # 分析/遥测 (9 文件)
│   ├── lsp/              # LSP 服务 (7 文件)
│   ├── oauth/            # OAuth 认证 (5 文件)
│   └── PromptSuggestion/ # 提示建议/推测执行
├── bridge/               # 远程控制 Bridge
├── remote/               # 远程会话管理
├── components/           # React/Ink UI 组件
│   ├── PromptInput/      # 输入框 (21 文件)
│   ├── permissions/      # 权限对话框 (51 文件)
│   ├── messages/         # 消息渲染 (41 文件)
│   ├── agents/           # Agent UI (26 文件)
│   └── design-system/    # 设计系统 (16 文件)
├── hooks/                # React Hooks
├── state/                # 状态管理
├── utils/                # 工具函数
│   ├── permissions/      # 权限系统 (24 文件)
│   ├── plugins/          # 插件系统 (44 文件)
│   ├── bash/             # Bash 解析/安全 (23 文件)
│   ├── settings/         # 配置管理 (19 文件)
│   ├── model/            # 模型管理 (16 文件)
│   ├── swarm/            # Agent 群体 (22 文件)
│   ├── hooks/            # 生命周期钩子 (17 文件)
│   └── computerUse/      # Computer Use (15 文件)
├── plugins/              # 内置插件定义
├── skills/bundled/       # 内置技能 (17 文件)
├── vim/                  # Vim 模式支持
├── daemon/               # 后台守护进程
├── cli/                  # CLI 传输层
├── ink/                  # Ink 渲染层
└── bootstrap/            # 启动状态管理
```

### 3.2 核心依赖关系图

```
main.tsx
  ├──→ REPL.tsx (交互循环)
  │     ├──→ PromptInput.tsx (用户输入)
  │     ├──→ useQueueProcessor.ts (命令队列)
  │     └──→ QueryEngine.submitMessage() (查询执行)
  │           ├──→ processUserInput() (输入处理)
  │           ├──→ fetchSystemPromptParts() (系统提示词)
  │           ├──→ claude.ts query() (API 调用)
  │           └──→ Tool.call() (工具执行)
  │                 └──→ permissions.ts (权限检查)
  ├──→ bridge/bridgeMain.ts (Bridge 模式)
  │     └──→ runBridgeLoop() (轮询循环)
  └──→ remote/RemoteSessionManager.ts (远程会话)
        └──→ SessionsWebSocket (WebSocket 连接)
```

---

## 四、工具系统设计

### 4.1 Tool 接口定义

每个工具实现统一的 `Tool` 接口（定义在 `src/Tool.ts`）：

```typescript
export type Tool = {
  name: string
  inputSchema: ToolInputJSONSchema
  isEnabled: () => boolean
  userFacingName: () => string
  renderToolUseMessage: (input: Record<string, unknown>) => string
  call: (input: Record<string, unknown>, context: ToolUseContext) => Promise<ToolResultBlockParam>
  description: () => string | Promise<string>
  prompt: () => string
  isReadOnly: () => boolean
  isMcp: boolean
  needsPermissions: () => boolean
  // 可选的权限检查
  checkPermissions?: (input, context) => Promise<PermissionResult>
}
```

### 4.2 工具注册机制

工具通过 `getTools()` 函数统一注册，支持：
- **内置工具**：BashTool, FileEditTool, FileReadTool, WebFetchTool, AgentTool 等
- **MCP 工具**：通过 MCP 协议动态加载的外部工具
- **技能工具**：通过 `/skill` 命令注册的技能
- **合成工具**：SyntheticOutputTool（结构化输出）

工具通过 `toolToAPISchema()` 转换为 Anthropic API 的 tool 定义格式。

### 4.3 BashTool 深度设计

BashTool 是最复杂的工具（18 个文件），包含：

**命令分析层**：
- `bashPermissions.ts` — 权限检查主逻辑
- `bashSecurity.ts` — 安全检查（危险命令检测）
- `bashClassifier.ts` — ML 分类器（ANT-only）
- `commandSemantics.ts` — 命令语义分析（读/写/搜索）
- `sedEditParser.ts` — sed 编辑解析
- `sedValidation.ts` — sed 安全验证
- `modeValidation.ts` — 模式验证
- `pathValidation.ts` — 路径约束检查
- `readOnlyValidation.ts` — 只读约束检查

**执行层**：
- `shouldUseSandbox.ts` — 沙箱决策
- `prompt.ts` — 提示词生成
- `bashCommandHelpers.ts` — 命令辅助函数

**UI 层**：
- `UI.tsx` — 工具使用/结果消息渲染
- `BashToolResultMessage.tsx` — 结果消息组件
- `destructiveCommandWarning.ts` — 破坏性命令警告

**命令分类**：BashTool 将命令分为搜索命令（grep, find 等）、读取命令（cat, head 等）、列表命令（ls, tree 等），用于 UI 折叠显示。

### 4.4 工具搜索与延迟发现

Claude Code 支持 **工具搜索**（Tool Search）和 **延迟工具发现**（Deferred Tools）：
- 工具搜索允许模型在运行时发现可用工具
- 延迟工具允许在对话中途动态添加新工具（如 MCP 服务器连接后）

---

## 五、权限系统设计

### 5.1 权限模式

权限系统支持 6 种模式（定义在 `src/types/permissions.ts`）：

| 模式 | 说明 | 外部可见 |
|------|------|---------|
| `default` | 默认模式，每次工具使用需确认 | 是 |
| `plan` | 计划模式，禁止工具使用 | 是 |
| `acceptEdits` | 自动接受编辑 | 是 |
| `bypassPermissions` | 跳过所有权限检查 | 是 |
| `dontAsk` | 不询问，自动拒绝 | 是 |
| `auto` | 自动模式，ML 分类器决策 | 否 (ANT-only) |

### 5.2 权限规则系统

权限规则结构（`PermissionRule`）：

```typescript
type PermissionRule = {
  source: PermissionRuleSource  // 规则来源
  ruleBehavior: 'allow' | 'deny' | 'ask'
  ruleValue: {
    toolName: string
    ruleContent?: string  // 可选的规则内容（如路径模式）
  }
}
```

**规则来源优先级**（从高到低）：
1. `policySettings` — 组织策略
2. `flagSettings` — 功能标志
3. `localSettings` — 本地设置
4. `projectSettings` — 项目设置
5. `userSettings` — 用户设置
6. `cliArg` — CLI 参数
7. `command` — 命令设置
8. `session` — 会话设置

### 5.3 权限决策流程

```
工具调用请求
  → checkPermissions()
    → 模式检查 (modeValidation)
    → 规则匹配 (permissionRuleMatching)
    → Bash 特殊检查:
      → AST 安全解析 (parseForSecurity)
      → 命令语义分析 (checkSemantics)
      → 路径约束 (pathValidation)
      → sed 约束 (sedValidation)
      → 只读约束 (readOnlyValidation)
      → 沙箱决策 (shouldUseSandbox)
    → ML 分类器 (bashClassifier, ANT-only)
    → Hook 检查 (executePermissionRequestHooks)
    → 拒绝追踪 (denialTracking)
  → PermissionResult: { behavior: 'allow' | 'deny' | 'ask', ... }
```

### 5.4 权限 UI 组件

权限系统有 51 个 UI 组件文件，按工具类型分类：
- `BashPermissionRequest` — Bash 权限请求
- `FileEditPermissionRequest` — 文件编辑权限
- `FileWritePermissionRequest` — 文件写入权限
- `FilesystemPermissionRequest` — 文件系统权限
- `PowerShellPermissionRequest` — PowerShell 权限
- `WebFetchPermissionRequest` — 网页抓取权限
- `SedEditPermissionRequest` — sed 编辑权限
- `NotebookEditPermissionRequest` — Notebook 编辑权限
- `ComputerUseApproval` — Computer Use 审批
- `SkillPermissionRequest` — 技能权限
- `AskUserQuestionPermissionRequest` — 用户问题权限
- `EnterPlanModePermissionRequest` — 进入计划模式
- `ExitPlanModePermissionRequest` — 退出计划模式
- `SandboxPermissionRequest` — 沙箱权限
- `FallbackPermissionRequest` — 后备权限请求

### 5.5 拒绝追踪与自动降级

系统实现了 **拒绝追踪**（`denialTracking.ts`）机制：
- 跟踪连续拒绝次数
- 当拒绝次数超过阈值时，自动降级为 `ask` 模式（而非持续拒绝）
- 防止用户因频繁拒绝而无法使用系统

---

## 六、输入处理流程

### 6.1 完整处理链路

```
用户输入 (PromptInput.tsx)
  │
  ├─ 键盘事件处理 (useInput, useKeybinding)
  ├─ Vim 模式处理 (VimTextInput)
  ├─ 粘贴处理 (getImageFromClipboard)
  ├─ @提及处理 (useIdeAtMentioned)
  │
  ▼
onSubmit() (handlePromptSubmit)
  │
  ▼
processUserInput() (processUserInput.ts)
  │
  ├─ 斜杠命令检测 (parseSlashCommand)
  │   ├─ /help, /clear, /compact ... (内置命令)
  │   ├─ /skill ... (技能命令)
  │   └─ /plugin ... (插件命令)
  │
  ├─ 附件处理 (getAttachmentMessages)
  ├─ 图片处理 (maybeResizeAndDownsampleImageBlock)
  ├─ Ultraplan 关键字检测 (hasUltraplanKeyword)
  │
  ├─ UserPromptSubmit Hook 执行
  │   └─ 阻塞检查 (blockingError)
  │
  ▼
processTextPrompt() (processTextPrompt.ts)
  │
  ├─ 消息构建 (createUserMessage)
  ├─ Agent 上下文注入
  ├─ 记忆加载 (loadMemoryPrompt)
  │
  ▼
QueryEngine.submitMessage()
  │
  ├─ 系统提示词构建 (fetchSystemPromptParts)
  ├─ 消息历史处理
  ├─ API 调用 (claude.ts query())
  │   ├─ 流式响应处理
  │   ├─ 工具调用解析
  │   └─ Token 使用统计
  │
  ├─ 工具执行循环
  │   ├─ 权限检查
  │   ├─ 工具调用
  │   └─ 结果返回
  │
  └─ 响应渲染
```

### 6.2 命令队列系统

使用 `useQueueProcessor` Hook 实现统一的命令队列：

```typescript
// 队列优先级: 'now' > 'next' (用户输入) > 'later' (任务通知)
type QueuedCommand = {
  input: string
  priority: 'now' | 'next' | 'later'
  // ...
}
```

处理条件：
- 无活跃查询（`queryGuard`）
- 队列中有待处理命令
- 无活跃的本地 JSX UI 阻塞

### 6.3 PromptInput 组件

PromptInput 是最复杂的 UI 组件（21 个文件），功能包括：
- 多模式输入（prompt/continue/agent）
- Vim 模式支持
- 历史搜索
- 自动补全/建议
- 快捷键绑定
- Agent @提及
- 图片粘贴
- 队列命令管理
- 模型选择器
- 权限模式切换
- 思考模式切换
- Fast Mode 切换
- 后台任务面板
- Teams 对话框

---

## 七、远程会话架构

### 7.1 Bridge 模式（远程控制）

Bridge 模式允许将本地机器作为远程执行环境：

```
┌──────────────────────┐     HTTP Poll/WebSocket     ┌──────────────────────┐
│   本地 CLI (Worker)   │ ◄──────────────────────────► │  Claude.ai (CCR)     │
│                      │                              │                      │
│  bridgeMain.ts       │  POST /v1/sessions          │  Session Manager     │
│  runBridgeLoop()     │  POST /v1/work/poll         │  Work Scheduler      │
│                      │  WS /v1/sessions/ws/...     │                      │
│  ┌────────────────┐  │                              │                      │
│  │ SessionSpawner │  │  → spawn claude processes    │                      │
│  │ (子进程管理)    │  │  → heartbeat work items      │                      │
│  └────────────────┘  │                              │                      │
└──────────────────────┘                              └──────────────────────┘
```

**关键组件**：
- `bridgeMain.ts` — Bridge 主循环，管理会话生命周期
- `bridgeApi.ts` — Bridge API 客户端
- `bridgeMessaging.ts` — 消息处理（入站/出站）
- `sessionRunner.ts` — 会话进程生成器
- `workSecret.ts` — 工作密钥管理
- `jwtUtils.ts` — JWT Token 刷新
- `capacityWake.ts` — 容量唤醒信号
- `pollConfig.ts` — 轮询配置

**多会话支持**：通过 GrowthBook 门控 `tengu_ccr_bridge_multi_session` 启用，默认支持 32 个并发会话。

### 7.2 REPL Bridge（Always-on Bridge）

REPL Bridge 是嵌入式 Bridge 模式，在正常 REPL 会话中同时运行远程控制：

```typescript
type ReplBridgeHandle = {
  bridgeSessionId: string
  environmentId: string
  sessionIngressUrl: string
  writeMessages(messages: Message[]): void
  writeSdkMessages(messages: SDKMessage[]): void
  sendControlRequest(request: SDKControlRequest): void
  sendControlResponse(response: SDKControlResponse): void
  teardown(): Promise<void>
}
```

**传输层**：支持 V1（HTTP 轮询）和 V2（WebSocket）两种传输协议，通过 `HybridTransport` 自动选择。

### 7.3 远程会话管理（Remote Session）

`RemoteSessionManager` 管理 CCR 远程会话：

```
RemoteSessionManager
  ├── SessionsWebSocket (WebSocket 连接)
  │     ├── 认证 (OAuth token)
  │     ├── 心跳 (30s 间隔)
  │     ├── 自动重连 (最多 5 次, 2s 间隔)
  │     └── 会话不存在重试 (3 次, 压缩期间)
  │
  ├── 消息处理
  │     ├── SDKMessage → 本地渲染
  │     ├── ControlRequest → 权限请求
  │     └── ControlCancelRequest → 取消权限
  │
  └── sdkMessageAdapter.ts (SDK ↔ 内部消息转换)
```

### 7.4 远程权限桥接

`remotePermissionBridge.ts` 处理远程会话的权限请求：
- 创建合成的 `AssistantMessage` 用于权限 UI
- 为未知工具创建工具桩（Tool Stub）
- 将本地权限决策转换为远程控制响应

---

## 八、插件与技能系统

### 8.1 插件系统

插件系统（44 个文件）支持：

**插件类型**：
- **内置插件**（`builtinPlugins.ts`）：随 CLI 分发，用户可启用/禁用
- **市场插件**：从插件市场安装
- **版本化插件**：支持多版本管理

**插件 ID 格式**：`{name}@builtin`（内置）/ `{name}@{marketplace}`（市场）

**插件能力**：
- Skills（技能）
- Hooks（生命周期钩子）
- MCP Servers（MCP 服务器）

```typescript
type LoadedPlugin = {
  name: string
  manifest: { name, description, version }
  path: string
  source: string
  enabled: boolean
  isBuiltin: boolean
  hooksConfig?: HooksConfig
  mcpServers?: MCPServerConfig[]
}
```

### 8.2 技能系统

内置技能（17 个文件）：

| 技能 | 文件 | 说明 |
|------|------|------|
| updateConfig | updateConfig.ts | 配置更新 |
| keybindings | keybindings.ts | 快捷键管理 |
| verify | verify.ts | 验证 |
| debug | debug.ts | 调试 |
| loremIpsum | loremIpsum.ts | 占位文本 |
| skillify | skillify.ts | 技能创建 |
| remember | remember.ts | 记忆管理 |
| simplify | simplify.ts | 简化 |
| batch | batch.ts | 批处理 |
| stuck | stuck.ts | 卡住处理 |
| dream | dream.ts | 梦境模式 (KAIROS) |
| hunter | hunter.ts | 代码审查 (REVIEW_ARTIFACT) |
| loop | loop.ts | 循环触发 (AGENT_TRIGGERS) |
| claudeApi | claudeApi.ts | Claude API (BUILDING_CLAUDE_APPS) |
| claudeInChrome | claudeInChrome.ts | Chrome 集成 |
| scheduleRemoteAgents | scheduleRemoteAgents.ts | 远程 Agent 调度 |
| verifyContent | verifyContent.ts | 内容验证 |

### 8.3 Hook 系统

Hook 系统支持在 Claude Code 生命周期的各个阶段执行用户定义的 shell 命令：

**Hook 事件类型**（从 `src/types/hooks.ts`）：
- `PreToolUse` / `PostToolUse` / `PostToolUseFailure`
- `PermissionDenied`
- `PreCompact` / `PostCompact`
- `SessionStart` / `SessionEnd`
- `Setup` / `Stop` / `StopFailure`
- `SubagentStart` / `SubagentStop`
- `TeammateIdle`
- `TaskCreated` / `TaskCompleted`
- `ConfigChange` / `CwdChanged` / `FileChanged`
- `InstructionsLoaded`
- `UserPromptSubmit`

Hook 支持 JSON 输出格式，允许返回结构化的权限决策和提示修改。

---

## 九、状态管理方案

### 9.1 Store 实现

Claude Code 使用自定义的轻量级状态管理（`src/state/store.ts`）：

```typescript
type Store<T> = {
  getState: () => T
  setState: (updater: (prev: T) => T) => void
  subscribe: (listener: () => void) => () => void
}
```

这是一个经典的 **发布-订阅** 模式，类似 Zustand 的极简实现。

### 9.2 AppState

`AppState`（定义在 `src/state/AppStateStore.ts`）是全局状态的完整类型，包含：

**核心状态**：
- `settings: SettingsJson` — 配置
- `mainLoopModel: ModelSetting` — 主循环模型
- `toolPermissionContext: ToolPermissionContext` — 权限上下文
- `verbose: boolean` — 详细模式

**任务状态**：
- `tasks: { [taskId: string]: TaskState }` — 任务映射
- `foregroundedTaskId` — 前台任务 ID
- `viewingAgentTaskId` — 查看的 Agent 任务 ID
- `agentNameRegistry: Map<string, AgentId>` — Agent 名称注册

**MCP 状态**：
- `mcp.clients: MCPServerConnection[]` — MCP 客户端列表
- `mcp.tools: Tool[]` — MCP 工具列表
- `mcp.commands: Command[]` — MCP 命令列表
- `mcp.pluginReconnectKey: number` — 插件重连键

**插件状态**：
- `plugins.enabled: LoadedPlugin[]` — 已启用插件
- `plugins.disabled: LoadedPlugin[]` — 已禁用插件
- `plugins.errors: PluginError[]` — 插件错误

**Bridge 状态**：
- `replBridgeEnabled` / `replBridgeConnected` / `replBridgeSessionActive`
- `replBridgeReconnecting` / `replBridgeError`

**远程状态**：
- `remoteSessionUrl` — 远程会话 URL
- `remoteConnectionStatus` — 连接状态
- `remoteBackgroundTaskCount` — 远程后台任务数

**推测执行状态**：
- `speculationState: SpeculationState` — 推测执行状态

### 9.3 React 集成

通过 `useAppState` / `useSetAppState` / `useAppStateStore` Hooks 与 React 组件集成，使用 `useSyncExternalStore` 确保响应式更新。

---

## 十、QueryEngine 核心设计

### 10.1 生命周期

`QueryEngine` 是对话的核心引擎，采用 **AsyncGenerator** 模式：

```typescript
class QueryEngine {
  async *submitMessage(
    prompt: string | ContentBlockParam[],
    options?: { uuid?: string; isMeta?: boolean },
  ): AsyncGenerator<SDKMessage, void, unknown>
}
```

**设计特点**：
- 每个对话一个 QueryEngine 实例
- 状态（消息、文件缓存、使用量）跨轮次持久化
- 通过 AsyncGenerator 流式输出 SDK 消息
- 支持嵌套内存路径加载
- 支持技能发现跟踪

### 10.2 查询循环

```
submitMessage()
  → 构建 ProcessUserInputContext
  → 处理孤立权限 (orphanedPermission)
  → processUserInput() (输入解析)
  → 构建 ToolPermissionContext
  → fetchSystemPromptParts() (系统提示词)
  → 主循环:
    → claude.ts query() (API 调用)
    → 流式响应处理
    → 工具调用解析
    → 权限检查 (canUseTool)
    → 工具执行
    → 结果注入
    → 上下文压缩 (compact, 如果需要)
    → 继续循环或返回
```

### 10.3 上下文压缩

Claude Code 实现了多层上下文压缩策略：
- **Micro Compact**（`apiMicrocompact.ts`）：API 级别的微压缩
- **Snip Compact**（`snipCompact.ts`）：基于特性的历史裁剪
- **Prompt Cache**：利用 Anthropic 的 Prompt Caching 机制
- **1h TTL Cache**：1 小时缓存 TTL（通过 GrowthBook 门控）

---

## 十一、API 服务层设计

### 11.1 API 客户端

`src/services/api/claude.ts` 是与 Anthropic API 交互的核心模块：

**关键功能**：
- 流式 API 调用（`query()` 函数）
- 模型选择与回退
- Token 使用量跟踪
- Prompt Caching 管理
- Beta 头部管理
- 重试逻辑（`withRetry.ts`）
- 错误分类（`categorizeRetryableAPIError`）
- 费用计算（`calculateUSDCost`）

**Beta 头部**：
- `interleaved-thinking` — 交错思考
- `prompt-caching` — 提示缓存
- `max-tokens-3-5-sonnet` — 扩展 Token
- `structured-outputs` — 结构化输出
- `effort` — 努力程度控制
- `fast-mode` — 快速模式
- `task-budgets` — 任务预算
- `anti-distillation` — 反蒸馏

### 11.2 多提供商支持

支持多个 API 提供商：
- **Anthropic 直连**（1P）
- **AWS Bedrock**
- **Google Cloud Vertex AI**

通过 `getAPIProvider()` 和 `isFirstPartyAnthropicBaseUrl()` 进行提供商检测。

### 11.3 反蒸馏保护

针对 1P CLI 实现了反蒸馏措施：
- 发送 `fake_tools` 注入
- 通过 `feature('ANTI_DISTILLATION_CC')` 条件编译

---

## 十二、任务系统设计

### 12.1 任务类型

```typescript
type TaskType =
  | 'local_bash'      // 本地 Shell 任务
  | 'local_agent'     // 本地 Agent 任务
  | 'remote_agent'    // 远程 Agent 任务
  | 'in_process_teammate' // 进程内队友
  | 'local_workflow'  // 本地工作流
  | 'monitor_mcp'     // MCP 监控
  | 'dream'           // 梦境任务
```

### 12.2 任务状态

```typescript
type TaskStatus =
  | 'pending'    // 等待中
  | 'running'    // 运行中
  | 'completed'  // 已完成
  | 'failed'     // 已失败
  | 'killed'     // 已终止
```

### 12.3 任务 ID 生成

使用加密安全的随机 ID（`randomBytes(8)`），36^8 ≈ 2.8 万亿组合，防止暴力猜测符号链接攻击。

---

## 十三、错误处理策略

### 13.1 API 错误处理

- **重试机制**（`withRetry.ts`）：指数退避重试，区分可重试和不可重试错误
- **529 错误**：过载错误，特殊处理
- **401/403 错误**：认证/授权错误，触发 Token 刷新
- **错误分类**（`categorizeRetryableAPIError`）：自动判断错误是否可重试

### 13.2 权限错误处理

- **拒绝追踪**：记录连续拒绝，自动降级
- **Hook 错误**：Hook 执行失败不阻塞主流程
- **分类器失败**：ML 分类器不可用时 fail-closed（30 分钟刷新间隔）

### 13.3 Bridge 错误处理

- **连接错误**：指数退避重连（2s → 120s 上限）
- **认证过期**：JWT 自动刷新调度器
- **会话丢失**：可抑制的 403 错误
- **永久关闭码**：4003（未授权）立即停止重连

---

## 十四、性能优化手段

### 14.1 启动优化

- **快速路径**：`--version` 零模块加载
- **并行初始化**：MDM 读取、Keychain 预取在模块加载期间并行执行
- **延迟导入**：大量使用动态 `import()` 减少启动加载
- **死代码消除**：`feature()` 条件编译排除未启用的功能
- **启动性能分析**：`startupProfiler.ts` 跟踪各阶段耗时

### 14.2 运行时优化

- **Prompt Caching**：利用 Anthropic 的提示缓存减少 API 成本
- **1h TTL Cache**：长生命周期缓存（通过 GrowthBook 门控）
- **推测执行**（Speculation）：在用户输入完成前预执行 API 调用
- **流式响应**：所有 API 调用使用流式传输
- **文件状态缓存**（`FileStateCache`）：缓存文件读取状态
- **LRU 缓存**：`safeParseJSON` 等使用 LRU 缓存

### 14.3 内存优化

- **上下文压缩**：多层压缩策略防止上下文无限增长
- **Snip 投影**：裁剪历史消息以限制内存使用
- **增量快照**：文件历史使用增量快照

### 14.4 并发优化

- **容量唤醒**（`capacityWake`）：会话完成时立即唤醒等待的 Bridge
- **命令队列**：统一优先级队列避免竞态条件
- **QueryGuard**：防止并发查询冲突

---

## 十五、Vim 模式支持

Claude Code 内置了完整的 Vim 模式（`src/vim/`），实现了经典 Vim 状态机：

```
VimState
├── INSERT 模式 (跟踪 insertedText)
└── NORMAL 模式 (CommandState 状态机)
    ├── idle → [d/c/y] → operator
    ├── idle → [1-9] → count
    ├── idle → [fFtT] → find
    ├── idle → [g] → g-prefix
    ├── idle → [r] → replace
    ├── idle → [><] → indent
    ├── operator → [motion] → execute
    ├── operator → [ia] → operatorTextObj
    └── ...
```

支持的操作符：`delete`、`change`、`yank`
支持文本对象：`inner`、`around`
持久状态：`lastChange`（dot-repeat）、`lastFind`、`register`

---

## 十六、安全设计

### 16.1 沙箱系统

- `SandboxManager`（`sandbox-adapter.ts`）：沙箱适配器
- `shouldUseSandbox()`：自动决策是否使用沙箱
- 支持 macOS Seatbelt 和 Linux namespace 沙箱

### 16.2 Bash 安全

- AST 级别的命令解析（`parseForSecurity`）
- 危险命令模式检测（`dangerousPatterns.ts`）
- 路径验证（`pathValidation.ts`）
- sed 编辑验证（`sedValidation.ts`）
- 只读约束检查（`readOnlyValidation.ts`）

### 16.3 权限绕过保护

- `bypassPermissionsKillswitch.ts`：绕过权限的紧急开关
- `stripDangerousPermissionsForAutoMode`：Auto 模式下剥离危险权限
- `removeDangerousPermissions`：移除危险权限规则

---

## 十七、总结

Claude Code 是一个设计精良的 AI 编程助手 CLI 工具，其架构特点如下：

1. **模块化程度极高**：1902 个源文件，职责划分清晰，模块间通过类型接口解耦
2. **条件编译驱动**：通过 Bun 的 `feature()` 实现编译时特性门控，有效控制产物体积
3. **多层权限系统**：从模式到规则到分类器到 Hook，层层递进的权限控制
4. **灵活的远程架构**：Bridge 模式支持将本地机器作为远程执行环境，REPL Bridge 实现嵌入式远程控制
5. **丰富的扩展机制**：插件系统、技能系统、Hook 系统、MCP 协议，多种扩展方式
6. **性能意识强**：从启动优化到运行时缓存到推测执行，全方位的性能优化
7. **安全设计周全**：沙箱、AST 解析、危险模式检测、权限绕过保护等多层安全防线
8. **状态管理简洁**：自定义的发布-订阅 Store，与 React 通过 `useSyncExternalStore` 无缝集成

---

## 十八、对「织梦笔」小说编辑器的借鉴建议

> 本章基于前述 Claude Code 的架构分析，结合「织梦笔」小说编辑器的产品定位，提出具体可落地的借鉴方案。每条建议均引用 Claude Code 的具体设计，并给出织梦笔的落地方案。

### 18.1 架构模式借鉴

**Claude Code 的设计**：采用 REPL + QueryEngine + Tool 三层架构（详见第二章 2.1 节）。REPL 层负责 UI 交互与消息渲染，QueryEngine 层负责对话循环、系统提示词构建与 API 调用，Tool 层负责具体能力的执行。三层之间通过清晰的接口解耦，QueryEngine 通过 AsyncGenerator 流式输出 SDK 消息（详见第十章 10.1 节）。

**织梦笔的落地方案**：

建议织梦笔采用类似的「编辑器 + AI 引擎 + 工具层」三层架构：

```
┌─────────────────────────────────────────────────────────────┐
│                   编辑器层 (Editor Layer)                    │
│  文本编辑区 → 指令输入 → 结果渲染 → 分支管理 UI              │
│  (基于 VS Code Fork / Monaco Editor, 消息面板, 权限对话框)    │
├─────────────────────────────────────────────────────────────┤
│                  AI 引擎层 (AI Engine Layer)                 │
│  submitWritingTask() → 上下文构建 → API 调用 → 工具执行循环   │
│  (会话状态管理, RAG 检索, Token 预算, 上下文压缩)             │
├─────────────────────────────────────────────────────────────┤
│                   工具层 (Writing Tool Layer)                │
│  续写Tool / 扩写Tool / 改写Tool / 描写Tool / 对话Tool        │
│  (工具注册, 权限检查, 输入验证, 结果格式化)                   │
└─────────────────────────────────────────────────────────────┘
```

**具体建议**：织梦笔的 AI 交互应采用类似 Claude Code 的 REPL 模式（用户输入 → AI 处理 → 工具执行 → 结果渲染），而非简单的请求-响应模式。这意味着：
- 用户在编辑器中发出的写作指令（如「续写下一段」）进入统一的指令队列
- AI 引擎层维护持续的会话上下文，支持多轮对话
- 工具执行结果可以触发后续的 AI 处理（如一致性检查失败后自动修正）
- 参照 Claude Code 的 `submitMessage()` AsyncGenerator 模式，实现流式输出，让用户实时看到 AI 生成的内容

### 18.2 工具系统借鉴

**Claude Code 的设计**：每个工具实现统一的 `Tool` 接口（详见第四章 4.1 节），包含 `name`、`inputSchema`、`call`、`checkPermissions` 等标准字段。工具通过 `getTools()` 函数统一注册，支持内置工具、MCP 工具、技能工具和合成工具四种来源。此外，Claude Code 还支持工具搜索（Tool Search）和延迟工具发现（Deferred Tools），允许在对话中途动态添加新工具（详见第四章 4.4 节）。

**织梦笔的落地方案**：

定义统一的 `WritingTool` 接口：

```typescript
type WritingTool = {
  name: string                              // 工具名称，如 "continue_writing"
  inputSchema: WritingToolInputSchema       // 输入 Schema（JSON Schema 格式）
  isEnabled: () => boolean                  // 是否启用
  userFacingName: () => string              // 用户可见名称，如 "续写"
  description: () => string                 // 工具描述（用于 AI 理解）
  call: (input: WritingToolInput, context: WritingToolContext) => Promise<WritingToolResult>
  isReadOnly: () => boolean                 // 是否只读（如一致性检查）
  needsPermissions: () => boolean           // 是否需要权限确认
  checkPermissions?: (input, context) => Promise<PermissionResult>  // 可选权限检查
  formatResult: (result: WritingToolResult) => FormattedOutput       // 结果格式化
}
```

**内置写作工具**：
- **续写 Tool**（`ContinueWritingTool`）：根据上下文续写内容，支持指定字数、风格、视角
- **扩写 Tool**（`ExpandWritingTool`）：对选中文本进行扩写，支持扩写方向（细节/心理/环境）
- **改写 Tool**（`RewriteWritingTool`）：对选中文本进行改写，支持风格转换、语调调整
- **对话 Tool**（`DialogueWritingTool`）：生成角色对话，支持多角色、性格一致性
- **描写 Tool**（`DescriptionWritingTool`）：生成场景/人物/动作描写，支持感官维度
- **一致性检查 Tool**（`ConsistencyCheckTool`）：检查情节/人物/设定的一致性（只读）
- **大纲生成 Tool**（`OutlineTool`）：生成或调整章节大纲

**工具注册与发现**：参照 Claude Code 的 `getTools()` + `toolToAPISchema()` 模式，织梦笔应实现：
- 统一的工具注册中心，所有工具在启动时注册
- 工具 Schema 自动转换为 AI API 的 tool 定义格式
- 支持动态工具发现（如用户安装新写作风格包后自动注册对应工具）

### 18.3 权限系统借鉴

**Claude Code 的设计**：权限系统支持 6 种模式（详见第五章 5.1 节），从严格的 `plan` 模式（禁止工具使用）到宽松的 `bypassPermissions` 模式（跳过所有检查）。权限规则支持 8 个来源的优先级（详见第五章 5.2 节），决策流程包含模式检查、规则匹配、Bash 特殊检查、ML 分类器和 Hook 检查等多个环节（详见第五章 5.3 节）。系统还实现了拒绝追踪机制，当连续拒绝超过阈值时自动降级（详见第五章 5.5 节）。

**织梦笔的落地方案**：

定义写作场景的权限粒度：

```typescript
type WritingPermission = {
  // 核心权限
  canModifyMainText: boolean      // AI 能否直接修改正文
  canCreateBranch: boolean        // AI 能否创建分支版本
  canModifyKnowledgeBase: boolean // AI 能否修改知识库/设定集
  canAccessFullContext: boolean   // AI 能否访问完整上下文（vs 仅当前章节）
  canExecuteConsistencyCheck: boolean  // AI 能否执行一致性检查
  canAutoSave: boolean            // AI 能否自动保存

  // 权限模式
  mode: WritingPermissionMode
}

type WritingPermissionMode =
  | 'suggest'        // 建议模式：AI 只能建议，不能直接修改（对应 Claude Code 的 plan）
  | 'confirm'        // 确认模式：每次修改需用户确认（对应 Claude Code 的 default）
  | 'autoEdit'       // 自动编辑：自动接受文本编辑，但创建分支需确认（对应 Claude Code 的 acceptEdits）
  | 'fullAuto'       // 全自动：所有操作自动执行（对应 Claude Code 的 bypassPermissions）
  | 'reviewOnly'     // 仅审阅：AI 只能读取和分析，不能修改（对应 Claude Code 的 dontAsk）
```

**具体建议**：
- 参照 Claude Code 的 `PermissionRule` 结构，定义写作权限规则，支持按项目/章节/场景设置不同规则
- 参照 Claude Code 的 `PermissionRequest` / `PermissionDecision` 模式，在 AI 尝试修改正文时弹出确认对话框，展示修改的 diff 预览
- 实现拒绝追踪机制：当用户连续拒绝 AI 的修改建议超过阈值时，自动切换为「仅建议」模式，避免打断写作心流
- 权限 UI 参照 Claude Code 的 51 个权限组件（详见第五章 5.4 节），为每种写作操作设计专门的权限请求界面

### 18.4 输入处理流程借鉴

**Claude Code 的设计**：`processUserInput()` 实现了完整的输入处理管道（详见第六章 6.1 节），支持多种输入类型：键盘事件、Vim 模式、剪贴板图片、@提及、斜杠命令、附件等。所有输入经过统一管道处理后进入 `QueryEngine.submitMessage()`。PromptInput 组件（21 个文件）是功能最丰富的 UI 组件（详见第六章 6.3 节）。

**织梦笔的落地方案**：

设计统一的写作指令处理管道：

```
用户输入（多种来源）
  │
  ├─ 斜杠命令检测（/续写 /扩写 /改写 /检查一致性 /生成大纲 ...）
  ├─ 选中文本 + 操作（选中段落 → 右键 → AI 操作）
  ├─ 自然语言描述（"帮我把这段对话改得更紧张一些"）
  ├─ 快捷键触发（Ctrl+Shift+C 续写 / Ctrl+Shift+E 扩写）
  ├─ 侧边栏指令面板（结构化的参数输入）
  │
  ▼
processWritingInput()（统一处理管道）
  │
  ├─ 指令解析（识别操作类型、目标文本、参数）
  ├─ 上下文收集（当前章节、前后文、人物设定、世界观）
  ├─ 权限检查（是否有权限执行该操作）
  ├─ Hook 执行（PreWritingHook）
  │
  ▼
AIEngine.submitWritingTask()
  │
  ├─ RAG 检索（相关知识片段）
  ├─ 提示词构建（系统提示 + 写作风格 + 上下文）
  ├─ API 调用（流式响应）
  ├─ 工具执行循环
  └─ 结果渲染（diff 预览 / 直接插入 / 分支创建）
```

**具体建议**：
- 参照 Claude Code 的 `parseSlashCommand` 模式，实现织梦笔的斜杠命令系统
- 参照 Claude Code 的 `getAttachmentMessages` 模式，支持将选中文本、图片参考、大纲片段等作为附件传入 AI
- 参照 Claude Code 的 `UserPromptSubmit` Hook，在指令提交前执行自定义校验（如检查上下文是否足够）

### 18.5 队列与并发控制借鉴

**Claude Code 的设计**：使用 `useQueueProcessor` Hook 实现统一的命令队列（详见第六章 6.2 节），支持三级优先级（`now` > `next` > `later`），通过 `queryGuard` 防止并发查询冲突。队列处理条件包括：无活跃查询、队列有待处理命令、无活跃的本地 UI 阻塞。

**织梦笔的落地方案**：

```typescript
type WritingTaskQueue = {
  tasks: PriorityQueue<WritingTask>
  // 优先级定义
  // 'urgent' — 用户主动触发的操作（如按快捷键续写）
  // 'normal' — 用户通过命令触发的操作（如 /续写）
  // 'background' — 后台任务（如自动一致性检查、自动保存）
  // 'deferred' — 延迟任务（如上下文预加载）

  // 控制机制
  activeTask: WritingTask | null     // 当前活跃任务
  queryGuard: boolean                // 防止并发
  cancelToken: AbortController       // 取消支持
  timeout: number                    // 超时设置
}
```

**具体建议**：
- AI 请求必须队列化处理，同一时间只允许一个 AI 任务执行，避免并发请求导致上下文混乱
- 支持优先级调度：用户主动触发的操作优先于后台任务
- 支持取消操作：用户可以随时取消正在进行的 AI 生成（参照 Claude Code 的 `AbortController` 模式）
- 支持超时机制：避免 AI 请求无限等待
- 参照 Claude Code 的 `queryGuard` 模式，在前一个 AI 任务未完成时，新任务进入队列等待而非直接执行

### 18.6 上下文管理借鉴

**Claude Code 的设计**：实现了多层上下文压缩策略（详见第十章 10.3 节），包括 Micro Compact（API 级微压缩）、Snip Compact（历史裁剪）、Prompt Cache（提示缓存）和 1h TTL Cache。Claude Code 还通过 Token 使用量跟踪（详见第十一章 11.1 节）和费用计算实现精细的 Token 预算管理。

**织梦笔的落地方案**：

小说写作的上下文管理与编程助手有显著差异——小说的上下文是长篇连续叙事，而非离散的代码文件。建议：

```typescript
type WritingContextManager = {
  // Token 预算分配
  tokenBudget: {
    systemPrompt: number      // 系统提示词（写作风格、角色设定）
    currentChapter: number    // 当前章节内容
    previousChapterSummary: number  // 前情摘要
    knowledgeBase: number     // 知识库（人物卡、世界观、伏笔）
    userInstruction: number   // 用户指令
    reserved: number          // 预留给 AI 输出
  }

  // 上下文压缩策略
  compression: {
    chapterSummary: (chapter: Chapter) => ChapterSummary     // 章节摘要压缩
    characterSnapshot: (characters: Character[]) => Snapshot  // 人物状态快照
    plotThreadTracker: (events: PlotEvent[]) => PlotThreads   // 情节线索追踪
    foreshadowingIndex: (hints: Foreshadowing[]) => Index     // 伏笔索引
  }

  // 智能检索
  retrieval: {
    relevantCharacters: (context: string) => Character[]      // 相关人物
    relevantPlotThreads: (context: string) => PlotThread[]    // 相关情节线
    relevantSettings: (context: string) => WorldSetting[]     // 相关设定
    styleReference: (genre: string) => StyleGuide             // 风格参考
  }
}
```

**具体建议**：
- 参照 Claude Code 的 Token 计数和预算分配策略，为写作场景设计专门的 Token 预算分配方案。系统提示词（写作风格、角色设定）和当前章节内容应占最大比例
- 参照 Claude Code 的 Snip Compact 模式，实现章节摘要压缩——当上下文窗口不足时，将较早的章节压缩为摘要，保留关键情节和人物状态
- 参照 Claude Code 的 Prompt Cache 机制，缓存不变的系统提示词部分（如写作风格指南、世界观设定），减少重复 Token 消耗
- 实现专门的 RAG 检索策略：根据当前写作场景，智能检索相关的人物卡、情节线索、伏笔和设定，而非简单地将所有知识库内容塞入上下文

### 18.7 远程会话与 Bridge 借鉴

**Claude Code 的设计**：Bridge 模式允许将本地机器作为远程执行环境（详见第七章 7.1 节），通过 HTTP Poll 或 WebSocket 与 Claude.ai 通信。REPL Bridge（详见第七章 7.2 节）实现了嵌入式远程控制，在正常会话中同时运行远程控制。传输层支持 V1（HTTP 轮询）和 V2（WebSocket）两种协议，通过 `HybridTransport` 自动选择。

**织梦笔的落地方案**：

未来织梦笔若支持 Web 端写作，可借鉴 Bridge 模式实现本地编辑器与云端 AI 引擎的桥接：

```
┌──────────────────────────┐     WebSocket/HTTP     ┌──────────────────────────┐
│   本地编辑器 (Electron)    │ ◄────────────────────► │  云端 AI 引擎             │
│                          │                        │                          │
│  WritingBridge           │  写作任务提交            │  AI Engine               │
│  - 本地文件管理           │  ◄── 任务结果流式返回 ──►  - 模型推理               │
│  - 离线编辑支持           │  - 心跳保活             │  - 上下文管理             │
│  - 本地知识库缓存         │  - 断线重连             │  - 知识库检索             │
│  - UI 渲染               │                        │  - 一致性检查             │
└──────────────────────────┘                        └──────────────────────────┘
```

**具体建议**：
- 参照 Claude Code 的 `HybridTransport` 模式，实现 WebSocket 优先、HTTP 轮询降级的传输策略
- 参照 Claude Code 的 `ReplBridgeHandle` 接口，定义写作 Bridge 的标准接口（任务提交、结果流式返回、取消、心跳）
- 参照 Claude Code 的认证机制（JWT + OAuth），实现安全的云端连接
- 参照 Claude Code 的断线重连策略（最多 5 次，2s 间隔），实现网络不稳定时的优雅降级
- 本地编辑器应支持离线写作，待网络恢复后自动同步

### 18.8 插件与技能系统借鉴

**Claude Code 的设计**：插件系统（44 个文件）支持内置插件和市场插件（详见第八章 8.1 节），插件可提供 Skills、Hooks 和 MCP Servers 三种能力。技能系统包含 17 个内置技能（详见第八章 8.2 节），通过 `/skill` 命令调用。

**织梦笔的落地方案**：

定义写作技能接口：

```typescript
type WritingSkill = {
  name: string                    // 技能名称，如 "ancient_chinese_description"
  displayName: string             // 显示名称，如 "古风描写"
  description: string             // 技能描述
  version: string                 // 版本号
  author: string                  // 作者
  source: 'builtin' | 'community' // 来源

  // 技能能力
  systemPromptAdditions: string[]  // 追加到系统提示词的内容
  tools?: WritingTool[]            // 技能专属工具
  hooks?: WritingHook[]            // 技能专属 Hook
  knowledgeBase?: KnowledgeEntry[] // 技能专属知识库

  // 技能参数
  parameters?: SkillParameter[]    // 用户可配置的参数
}
```

**内置写作技能示例**：
- **古风描写技能**：提供古文词汇库、古代礼仪知识、古典文学风格参考
- **悬疑推理技能**：提供推理逻辑模板、伏笔管理工具、线索追踪系统
- **言情描写技能**：提供情感描写模板、人物关系图谱、氛围营造技巧
- **科幻设定技能**：提供科技设定模板、世界观构建工具、硬科幻知识库
- **武侠战斗技能**：提供武功体系模板、战斗描写技巧、江湖设定参考

**具体建议**：
- 参照 Claude Code 的插件 ID 格式（`{name}@builtin` / `{name}@marketplace}`），定义织梦笔的技能 ID 规范
- 参照 Claude Code 的 `LoadedPlugin` 类型，定义技能的加载、启用、禁用生命周期
- 支持社区贡献：用户可以创建和分享自定义写作技能，通过技能市场分发
- 技能的 `systemPromptAdditions` 会在激活时追加到 AI 的系统提示词中，改变 AI 的写作风格和能力

### 18.9 Hook 系统借鉴

**Claude Code 的设计**：Hook 系统支持 20+ 生命周期事件（详见第八章 8.3 节），覆盖工具使用前后、权限拒绝、会话开始/结束、配置变更、文件变更等场景。Hook 支持 JSON 输出格式，允许返回结构化的权限决策和提示修改。

**织梦笔的落地方案**：

定义写作生命周期事件：

```typescript
type WritingHookEvent =
  // 内容相关
  | 'ChapterSave'              // 章节保存
  | 'ChapterCreate'            // 章节创建
  | 'BranchCreate'             // 分支创建
  | 'BranchMerge'              // 分支合并
  | 'ContentModify'            // 内容修改（AI 或人工）

  // AI 相关
  | 'PreAIGeneration'          // AI 生成前
  | 'PostAIGeneration'         // AI 生成后
  | 'AIGenerationFailure'      // AI 生成失败

  // 检查相关
  | 'ConsistencyCheckComplete' // 一致性检查完成
  | 'ConsistencyIssueFound'    // 发现一致性问题
  | 'StyleCheckComplete'       // 风格检查完成

  // 会话相关
  | 'WritingSessionStart'      // 写作会话开始
  | 'WritingSessionEnd'        // 写作会话结束
  | 'WordCountMilestone'       // 字数里程碑

  // 项目相关
  | 'ProjectOpen'              // 项目打开
  | 'ProjectConfigChange'      // 项目配置变更
  | 'KnowledgeBaseUpdate'      // 知识库更新
  | 'CharacterUpdate'          // 人物卡更新
```

**具体建议**：
- 参照 Claude Code 的 `PreToolUse` / `PostToolUse` 模式，在 AI 生成前后执行自定义逻辑（如生成前自动检查上下文完整性，生成后自动执行一致性检查）
- 参照 Claude Code 的 `FileChanged` Hook，在章节内容变更时触发自动保存、版本快照、字数统计等操作
- 参照 Claude Code 的 JSON 输出格式，允许 Hook 返回结构化数据（如一致性检查 Hook 返回具体的问题列表和建议修正方案）
- Hook 执行失败不应阻塞主流程（参照 Claude Code 的容错设计）

### 18.10 状态管理借鉴

**Claude Code 的设计**：使用自定义的轻量级发布-订阅 Store（详见第九章 9.1 节），仅包含 `getState`、`setState`、`subscribe` 三个方法。`AppState` 包含核心状态、任务状态、MCP 状态、插件状态、Bridge 状态、远程状态等多个维度（详见第九章 9.2 节），通过 `useSyncExternalStore` 与 React 组件集成。

**织梦笔的落地方案**：

```typescript
type WritingAppState = {
  // 项目状态
  project: {
    name: string
    path: string
    config: ProjectConfig
  }

  // 编辑器状态
  editor: {
    currentChapterId: string
    cursorPosition: Position
    selection: Selection | null
    viewMode: 'edit' | 'preview' | 'outline'
    isDirty: boolean
  }

  // AI 状态
  ai: {
    isGenerating: boolean
    currentTask: WritingTask | null
    taskQueue: WritingTask[]
    tokenUsage: TokenUsage
    lastError: AIError | null
  }

  // 知识库状态
  knowledge: {
    characters: Character[]
    worldSettings: WorldSetting[]
    plotThreads: PlotThread[]
    foreshadowing: Foreshadowing[]
  }

  // 分支状态
  branches: {
    currentBranchId: string
    branches: Branch[]
    history: HistoryEntry[]
  }
}
```

**具体建议**：
- 参照 Claude Code 的轻量化设计，采用简单的发布-订阅模式，避免引入 Redux、MobX 等重量级状态管理库
- 状态按功能域划分（项目/编辑器/AI/知识库/分支），每个域独立更新，减少不必要的重渲染
- 参照 Claude Code 的 `useSyncExternalStore` 模式，实现状态与 UI 组件的高效绑定
- 避免过度工程化：不需要中间件、不需要 action creator、不需要 reducer——直接通过 `setState` 更新状态即可

### 18.11 错误处理借鉴

**Claude Code 的设计**：实现了多层次的错误处理策略（详见第十三章）。API 层有重试机制（`withRetry.ts`，指数退避）和错误分类（`categorizeRetryableAPIError`）；权限层有拒绝追踪和自动降级；Bridge 层有连接错误处理（指数退避重连，2s → 120s 上限）和认证过期自动刷新。

**织梦笔的落地方案**：

定义统一的错误分类体系：

```typescript
type WritingError =
  | AIError           // AI 相关错误
  | NetworkError      // 网络错误
  | PermissionError   // 权限错误
  | ConsistencyError  // 一致性错误
  | ContextError      // 上下文错误
  | StorageError      // 存储错误

type AIError = {
  type: 'ai'
  category: 'timeout' | 'rate_limit' | 'model_error' | 'token_exceeded' | 'content_filter'
  retryable: boolean
  retryAfter?: number          // 建议重试时间
  userMessage: string          // 用户友好的错误信息
  technicalDetails: string     // 技术细节（用于日志）
}

type ErrorLogSink = {
  log: (error: WritingError, context: ErrorContext) => void
  getRecent: (count: number) => WritingError[]
  getByCategory: (category: string) => WritingError[]
}
```

**具体建议**：
- 参照 Claude Code 的 `categorizeRetryableAPIError` 模式，对 AI API 错误进行分类，区分可重试错误（如 429 限流、529 过载）和不可重试错误（如 401 认证失败）
- 参照 Claude Code 的 `withRetry` 指数退避策略，实现 AI 请求的自动重试
- 参照 Claude Code 的结构化 IO（`structuredIO`），实现结构化日志，记录每次 AI 交互的完整上下文（输入、输出、Token 消耗、耗时）
- 错误信息应区分「用户友好信息」和「技术细节」，前者展示给用户，后者记录到日志
- 参照 Claude Code 的 Bridge 错误处理，实现网络断线时的优雅降级（本地编辑不受影响，AI 功能标记为不可用）

### 18.12 Vim 模式借鉴

**Claude Code 的设计**：内置了完整的 Vim 模式（详见第十五章），实现了经典 Vim 状态机，支持 INSERT 和 NORMAL 两种模式，以及 `delete`、`change`、`yank` 操作符和 `inner`、`around` 文本对象。支持持久状态（`lastChange`、`lastFind`、`register`）。

**织梦笔的落地方案**：

由于织梦笔基于 VS Code Fork，Vim 支持可通过 VS Code 的 Vim 插件（如 VSCodeVim）实现基础能力。但针对写作场景，建议定制以下 Vim 操作：

**写作场景的 Vim 定制**：

| 操作 | 默认 Vim 行为 | 织梦笔定制行为 |
|------|-------------|---------------|
| `dap` | 删除段落 | 删除段落并自动调整后续段落编号 |
| `cip` | 修改段落内文本 | 修改段落并触发 AI 改写建议 |
| `yap` | 复制段落 | 复制段落并保留格式信息 |
| `gqap` | 格式化段落 | AI 辅助润色段落 |
| `<Leader>c` | 自定义 | 触发 AI 续写（在光标位置后） |
| `<Leader>e` | 自定义 | 触发 AI 扩写（对选中内容） |
| `<Leader>r` | 自定义 | 触发 AI 改写（对选中内容） |
| `<Leader>k` | 自定义 | 触发一致性检查（当前章节） |
| `<Leader>o` | 自定义 | 打开大纲视图 |
| `<Leader>b` | 自定义 | 创建分支版本 |
| `gd` | 跳转到定义 | 跳转到人物卡/设定条目 |

**具体建议**：
- 参照 Claude Code 的 Vim 状态机设计（`VimState` + `CommandState`），在织梦笔的 Vim 模式中增加写作场景的状态
- 参照 Claude Code 的 `lastChange` 持久化机制，实现写作操作的 dot-repeat（如重复上一次 AI 续写操作）
- 参照 Claude Code 的 `register` 系统，支持跨章节的文本复制粘贴，保留格式信息
- 为写作场景定义新的文本对象：`sentence`（句子）、`dialogue`（对话）、`paragraph`（段落）、`scene`（场景）、`chapter`（章节）

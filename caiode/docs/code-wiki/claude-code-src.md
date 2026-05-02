# claude-code-src Code Wiki

## 目录概述

这是 Claude Code AI 编程助手的核心源代码目录，包含了完整的 AI 对话、工具执行、状态管理等核心功能。

### 核心架构组件

```
claude-code-src/
├── assistant/          # 助手会话管理
├── bootstrap/          # 启动配置
├── bridge/             # 通信桥接
├── commands/           # 内置命令
├── constants/          # 常量定义
├── context/            # 上下文管理
├── entrypoints/        # 入口文件
├── hooks/              # React Hooks
├── ink/                # 终端 UI 库
├── keybindings/        # 快捷键
├── memdir/             # 记忆目录管理
├── migrations/         # 数据迁移
├── services/           # 核心服务
├── state/              # 状态管理
├── tasks/              # 任务处理
├── tools/              # 工具集
├── types/              # 类型定义
├── utils/              # 工具函数
├── QueryEngine.ts      # 查询引擎核心
├── Tool.ts             # 工具接口定义
└── commands.ts         # 命令注册
```

---

## 核心模块详解

### 1. QueryEngine (查询引擎)

**文件**: `QueryEngine.ts`

**职责**: 管理对话生命周期、处理消息流转、协调工具调用

**核心类**: `QueryEngine`

**主要方法**:
- `submitMessage()`: 提交新消息并启动查询流程
- `interrupt()`: 中断当前执行
- `getMessages()`: 获取对话历史

**关键特性**:
- 支持自定义系统提示词
- 预算控制（最大轮数、最大预算）
- 会话持久化
- 消息压缩（History Snip）
- 结构化输出支持

**核心流程**:
```
用户输入
    ↓
processUserInput() - 处理用户输入，解析命令
    ↓
fetchSystemPromptParts() - 获取系统提示词
    ↓
query() - 调用 API 进行对话
    ↓
工具执行 ← 权限检查 (canUseTool)
    ↓
结果返回
```

**配置参数** (`QueryEngineConfig`):
```typescript
{
  cwd: string;                      // 工作目录
  tools: Tools;                     // 可用工具集
  commands: Command[];              // 命令列表
  mcpClients: MCPServerConnection[];// MCP 客户端
  agents: AgentDefinition[];        // Agent 定义
  canUseTool: CanUseToolFn;         // 权限检查函数
  getAppState: () => AppState;      // 状态获取
  setAppState: (f: (prev: AppState) => AppState) => void; // 状态更新
  initialMessages?: Message[];      // 初始消息
  readFileCache: FileStateCache;    // 文件缓存
  customSystemPrompt?: string;      // 自定义系统提示词
  userSpecifiedModel?: string;      // 用户指定模型
  maxTurns?: number;                // 最大轮数
  maxBudgetUsd?: number;            // 最大预算
}
```

---

### 2. Tool (工具系统)

**文件**: `Tool.ts`

**核心类型**:
- `Tool`: 工具接口定义
- `Tools`: 工具集合类型
- `ToolDef`: 工具定义（包含默认值）
- `ToolUseContext`: 工具使用上下文
- `ToolResult`: 工具执行结果

**工具接口方法**:
```typescript
interface Tool {
  name: string;
  inputSchema: AnyObject;  // Zod schema
  call(args, context, canUseTool, parentMessage, onProgress?): Promise<ToolResult>;
  description(input, options): Promise<string>;
  checkPermissions(input, context): Promise<PermissionResult>;
  isEnabled(): boolean;
  isReadOnly(input): boolean;
  isConcurrencySafe(input): boolean;
  // ... 更多方法
}
```

**工具构建**: 使用 `buildTool()` 函数从部分定义创建完整工具

**权限系统**:
- `checkPermissions()`: 工具特定权限检查
- `canUseTool`: 全局权限检查回调
- 支持 `alwaysAllowRules`、`alwaysDenyRules`、`alwaysAskRules`

**工具生命周期**:
```
工具发现
    ↓
validateInput() - 输入验证
    ↓
checkPermissions() - 权限检查
    ↓
call() - 执行工具
    ↓
onProgress() - 进度报告
    ↓
ToolResult - 返回结果
```

---

### 3. State (状态管理)

**目录**: `state/`

**核心文件**:
- `AppState.ts`: 应用状态类型定义
- `AppStateStore.ts`: 状态存储实现
- `store.ts`: 状态访问入口

**状态结构**:
```typescript
AppState {
  toolPermissionContext: ToolPermissionContext;
  fileHistory: FileHistoryState;
  attribution: AttributionState;
  fastMode: FastModeState;
  // ... 更多状态字段
}
```

---

### 4. Services (服务层)

**目录**: `services/`

**主要服务**:
- `api/`: API 通信服务
- `mcp/`: MCP (Model Context Protocol) 服务
- `compact/`: 对话压缩服务
- `awaySummary.ts`: 离开摘要服务
- `claudeAiLimits.ts`: Claude AI 限制
- `diagnosticTracking.ts`: 诊断追踪
- `voice.ts`: 语音服务

---

### 5. Commands (命令系统)

**目录**: `commands/`

**内置命令**:
- `advisor.ts`: 顾问命令
- `commit-push-pr.ts`: Git 提交、推送、PR
- `commit.ts`: Git 提交
- `init.ts`: 初始化命令
- `install.tsx`: 安装命令
- `security-review.ts`: 安全审查
- `ultraplan.tsx`: 超级计划
- `version.ts`: 版本信息

---

### 6. Utils (工具函数)

**目录**: `utils/`

**核心模块**:
- `config.ts`: 配置管理
- `fileHistory.ts`: 文件历史
- `fileStateCache.ts`: 文件状态缓存
- `git.ts`: Git 操作
- `markdown.ts`: Markdown 处理
- `permissions/`: 权限管理
- `processUserInput/`: 用户输入处理
- `queryHelpers.ts`: 查询辅助
- `sessionStorage.ts`: 会话存储
- `systemPrompt.ts`: 系统提示词
- `terminal.ts`: 终端操作
- `theme.ts`: 主题系统
- `toolResultStorage.ts`: 工具结果存储

---

### 7. Hooks (React Hooks)

**目录**: `hooks/`

**常用 Hooks**:
- `useCanUseTool.ts`: 权限检查
- `useSettings.ts`: 设置访问
- `useTasksV2.ts`: 任务管理
- `useMainLoopModel.ts`: 主模型选择
- `useRemoteSession.ts`: 远程会话

---

## 数据流图

```
┌─────────────────┐
│   用户输入      │
└────────┬────────┘
         │
         ▼
┌───────────────────────────────┐
│  processUserInput()           │
│  - 解析命令                   │
│  - 处理附件                   │
└────────┬──────────────────────┘
         │
         ▼
┌───────────────────────────────┐
│  QueryEngine.submitMessage()  │
│  - 初始化上下文               │
│  - 构建系统提示词             │
└────────┬──────────────────────┘
         │
         ▼
┌───────────────────────────────┐
│  query()                      │
│  - 调用 API                   │
│  - 处理流式响应               │
└────────┬──────────────────────┘
         │
         ▼
┌───────────────────────────────┐
│  Tool.call()                  │
│  - 执行工具逻辑               │
│  - 报告进度                   │
└────────┬──────────────────────┘
         │
         ▼
┌───────────────────────────────┐
│  状态更新                     │
│  - 更新 AppState             │
│  - 持久化会话                 │
└────────┬──────────────────────┘
         │
         ▼
┌─────────────────┐
│   结果返回      │
└─────────────────┘
```

---

## 关键集成点

### 与 MCP (Model Context Protocol) 集成
- 位置: `services/mcp/`
- 功能: 动态加载外部 MCP 服务器的工具
- 类型: `MCPServerConnection`

### 与 IDE 集成
- 位置: `bridge/`
- 功能: 与 VS Code 等 IDE 通信
- 文件: `bridgeMain.ts`、`bridgeApi.ts`

### 会话持久化
- 位置: `utils/sessionStorage.ts`
- 功能: 会话历史保存与恢复
- 文件: `history.ts`

---

## 开发指南

### 添加新工具
1. 在 `tools/` 目录创建新工具文件
2. 使用 `buildTool()` 定义工具
3. 在 `tools.ts` 中注册
4. 实现必需方法: `call()`、`description()`、`inputSchema`

### 添加新命令
1. 在 `commands/` 目录创建命令文件
2. 实现命令逻辑
3. 在 `commands.ts` 中注册

### 状态修改
1. 在 `state/AppState.ts` 中定义类型
2. 使用 `setAppState()` 更新状态
3. 通过 hooks 或 context 访问状态

---

## 测试要点

- **单元测试**: 工具函数、纯逻辑
- **集成测试**: QueryEngine、工具集成
- **权限测试**: 各种权限场景
- **边界测试**: 超大输出、错误恢复

---

## 性能优化点

1. **文件缓存**: `FileStateCache` 减少重复读取
2. **提示词缓存**: 避免重复计算系统提示词
3. **流式处理**: 即时响应，减少等待
4. **对话压缩**: 减少 token 使用

---

## 安全考虑

1. **权限系统**: 工具执行前必须经过权限检查
2. **输入验证**: 所有工具输入必须验证
3. **隔离执行**: 敏感操作在隔离环境执行
4. **审计日志**: 所有工具调用记录在案

---

*文档生成时间: 2026-05-02*

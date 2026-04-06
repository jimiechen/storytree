# Claude Code 架构文档

> 版本: 2.1.88\
> 文档日期: 2025-04-06\
> 用途: 指导二次开发

***

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈](#2-技术栈)
3. [目录结构](#3-目录结构)
4. [核心架构](#4-核心架构)
5. [Harness与上下文调优架构](#5-harness与上下文调优架构)
6. [记忆系统 (Memory Mechanics)](#6-记忆系统-memory-mechanics)
7. [模块详解](#7-模块详解)
8. [工具系统](#8-工具系统)
9. [Agent 架构](#9-agent-架构)

   * 9.1 [多 Agent 并行执行](#91-多-agent-并行执行)

   * 9.2 [沙箱隔离机制](#92-沙箱隔离机制)

   * 9.3 [工作流编排](#93-工作流编排)

   * 9.4 [Coordinator 模式](#94-coordinator-模式)
10. [Hook 系统](#10-hook-系统)
11. [状态管理](#11-状态管理)
12. [API 通信](#12-api-通信)
13. [多分支多模型执行](#13-多分支多模型执行)
14. [二次开发指南](#14-二次开发指南)

***

## 1. 项目概述

Claude Code 是 Anthropic 开发的终端 AI 编程助手，基于 Claude 大模型，提供代码理解、文件编辑、命令执行等能力。

### 核心能力

* **代码理解与编辑**: 读取、分析、修改代码文件

* **终端命令执行**: 安全地执行 Bash/PowerShell 命令

* **Agent 任务**: 支持子代理并行执行任务

* **MCP 集成**: 支持 Model Context Protocol 扩展

* **交互式 TUI**: 基于 Ink 的终端用户界面

***

## 2. 技术栈

| 类别          | 技术                           |
| ----------- | ---------------------------- |
| **运行时**     | Bun (优先) / Node.js 18+       |
| **语言**      | TypeScript                   |
| **UI 框架**   | React + Ink (终端渲染)           |
| **状态管理**    | 自定义 Store (基于 React Context) |
| **API 客户端** | @anthropic-ai/sdk            |
| **构建工具**    | Bun Bundler                  |
| **包管理**     | Bun                          |

***

## 3. 目录结构

```
claude-code-2.1.88/
├── src/
│   ├── entrypoints/          # 入口文件
│   │   ├── cli.tsx          # CLI 主入口
│   │   ├── init.ts          # 初始化入口
│   │   └── mcp.ts           # MCP 入口
│   │
│   ├── commands/            # 斜杠命令实现
│   ├── components/          # React 组件
│   ├── tools/               # 工具实现
│   ├── services/            # 服务层
│   │   ├── api/             # API 通信
│   │   ├── mcp/             # MCP 服务
│   │   ├── compact/         # 上下文压缩与优化机制
│   │   └── ...
│   │
│   ├── state/               # 状态管理
│   ├── hooks/               # React Hooks
│   ├── query/               # QueryEngine 引擎配置及状态机
│   ├── memdir/              # 记忆与上下文持久化系统
│   ├── utils/               # 工具函数
│   │   ├── hooks/           # Hook 系统
│   │   ├── swarm/           # Swarm/多 Agent 协调
│   │   ├── sandbox/         # 沙箱隔离
│   │   └── ...
│   ├── types/               # 类型定义
│   └── ...
│
├── package.json
└── cli.js                   # 可执行入口
```

***

## 4. 核心架构

### 4.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Input     │  │  Messages   │  │     Tool Outputs        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      REPL / Main Loop                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Prompt    │  │   Parser    │  │    Command Router       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Query Engine                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Tools     │  │   Agent     │  │    API Client           │ │
│  │  Registry   │  │   Runner    │  │  (Anthropic SDK)        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     External Services                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Claude API │  │   MCP       │  │    LSP Servers          │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 数据流

```
User Input → Command Parser → Tool Selection → Tool Execution
                                                  │
                                                  ▼
API Response ← Query Engine ← Message History ← Result
```

***

## 5. Harness与上下文调优架构

Claude Code 拥有极为精细的上下文保护与生命周期调优（Harness）系统。其主要实现在 `src/query.ts` 的 `QueryEngine` 中。

### 5.1 Query Engine

`QueryEngine` 是每个对话会话的核心引擎。所有的消息提交都通过 `submitMessage` 转化为迭代执行的 `queryLoop`：

* **生命周期追踪**: 通过 `queryTracking.chainId` 维护查询链路

* **安全检查点**: 包括 `snip`、`microcompact`、`contextCollapse` 和 `autocompact` 四个压缩阶段，依次保证 Token 预算不会超限。

### 5.2 Token Budget (预算控制机制)

由于长对话消耗大量 Token（且提示词缓存失效成本极高），内置了预算防失控保护 `BudgetTracker` (`src/query/tokenBudget.ts`)：

* **收益递减检查 (`DIMINISHING_THRESHOLD`)**: 若连续三次调用新增 Token 不足 500，则被判定为收益递减并强制中止 (stop)。

* **续航机制 (`COMPLETION_THRESHOLD`)**: 运行未达到预算 90% 且未触及阈值，则继续执行 `action: 'continue'`，并下发 `NudgeMessage`。

### 5.3 四级上下文压缩策略 (Compact Harness)

在调用 API 前，会经过流水线处理 (`src/query.ts`)：

1. **Snip Compact (`snipModule`)**: 对无用历史记录执行切片，释放 Token。
2. **Microcompact (`deps.microcompact`)**: 将过长的 Tool 结果进行微缩，替换长文本。
3. **Context Collapse (`contextCollapse`)**: 将长篇历史消息聚合压缩为单条 summary message。
4. **Auto Compact (`deps.autocompact`)**: 当超出预算阈值时，自动调用模型，生成一个系统级别的 Summary 并截断先前的对话。

***

## 6. 记忆系统 (Memory Mechanics)

为避免每次重置上下文带来的信息丢失，Claude Code 构建了物理记忆存储机制，实现于 `src/memdir/`：

### 6.1 记忆模式

* **Auto Memory (自动记忆)**: 存放于项目下的自动目录中。它不是一个被动记录本，而是主动作为系统上下文引入：

  * `MEMORY.md`: 作为索引文件（Index），仅包含链接和一句话概要，限制最多 200 行和 25KB，避免占用过高 Context。

  * 各个独立的 Markdown 文件：用于描述特定配置（如 `user_role.md`）。

* **Team Memory (团队记忆)**: 团队共享维度的记忆。

* **Kairos 日志 (Assistant Daily Log)**: 在持续运行模式下，模型改为按日以 Append-Only 的方式将记忆写入 `YYYY-MM-DD.md`。后台离线任务（Dream Task）会在夜间自动提纯日志并合并入 `MEMORY.md` 中。

### 6.2 交互指令

QueryEngine 注入 System Prompt 时会强制附带《Memory Mechanics》，教导模型：

1. 更新或写入时使用 Frontmatter `---`。
2. 修改后主动维护 `MEMORY.md` 索引文件。
3. 查找知识时主动执行 `GrepTool` 或 shell 命令。

***

## 7. 模块详解

### 7.1 命令系统 (commands/)

命令是用户通过 `/` 调用的功能单元。

#### 命令类型

| 类型          | 说明               | 示例                  |
| ----------- | ---------------- | ------------------- |
| `prompt`    | 展开为提示词发送给模型      | `/help`, `/skills`  |
| `local`     | 本地执行，返回文本结果      | `/clear`, `/cost`   |
| `local-jsx` | 本地执行，渲染 React 组件 | `/config`, `/tasks` |

### 7.2 组件系统 (components/)

基于 Ink 的终端 UI 组件。

| 组件               | 功能     |
| ---------------- | ------ |
| `App.tsx`        | 主应用容器  |
| `Messages.tsx`   | 消息列表渲染 |
| `TaskListV2.tsx` | 任务列表   |
| `Spinner.tsx`    | 加载动画   |

### 7.3 服务层 (services/)

* **API 服务 (`api/claude.ts`)**: 通信及防缓存穿透 (`withRetry`, 错误重试等)

* **MCP 服务 (`mcp/client.ts`)**: 管理 MCP 服务器连接、工具发现与调用

* **LSP 服务 (`lsp/manager.ts`)**: 提供代码补全、诊断、符号搜索

***

## 8. 工具系统

### 8.1 内置工具列表

| 工具                          | 功能         | 关键文件                                 |
| --------------------------- | ---------- | ------------------------------------ |
| **AgentTool**               | 创建子代理执行任务  | `tools/AgentTool/`                   |
| **BashTool**                | 执行 Bash 命令 | `tools/BashTool/`                    |
| **FileRead/Write/EditTool** | 文件级操作      | `tools/File...Tool/`                 |
| **Glob/GrepTool**           | 搜索工具       | `tools/GlobTool/`, `tools/GrepTool/` |
| **MCPTool**                 | 代理执行外部协议工具 | `tools/MCPTool/`                     |

***

## 9. Agent 架构

### 9.1 多 Agent 并行执行

Claude Code 支持强大的多 Agent 并行执行能力，通过 `AgentTool` 和 `Swarm` 系统实现。

#### 9.1.1 Agent 类型 (`src/Task.ts`)

| 类型                    | 描述          | 前缀  |
| --------------------- | ----------- | --- |
| `local_bash`          | 本地 Bash 任务  | `b` |
| `local_agent`         | 本地 Agent 任务 | `a` |
| `remote_agent`        | 远程 Agent 任务 | `r` |
| `local_workflow`      | 本地工作流       | `w` |
| `dream`               | 离线后台任务      | `d` |
| `in_process_teammate` | 进程内协作 Agent | `t` |

#### 9.1.2 并行执行架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     Leader (主 Agent)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Task Queue │  │  Mailbox    │  │   Permission Bridge     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Agent 1       │  │   Agent 2       │  │   Agent 3       │
│ (Research)      │  │ (Implementation)│  │ (Verification)  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

#### 9.1.3 进程内 Teammate 执行 (`src/utils/swarm/inProcessRunner.ts`)

进程内 Teammate 通过 `runWithTeammateContext()` 实现上下文隔离：

```typescript
// 核心流程
export async function runInProcessTeammate({
  identity,        // Teammate 身份标识
  initialPrompt,   // 初始提示词
  abortController, // 中止控制器
  setAppState,     // 状态更新函数
}): Promise<void> {
  // 1. 创建独立的 AgentContext
  const agentContext = createAgentContext({
    agentId: identity.agentId,
    parentContext: getAgentContext(),
  })

  // 2. 使用 AsyncLocalStorage 隔离上下文
  await runWithAgentContext(agentContext, async () => {
    // 3. 创建独立的权限检查函数
    const canUseTool = createInProcessCanUseTool(identity, abortController)
    
    // 4. 运行 Agent
    await runAgent({
      prompt: initialPrompt,
      canUseTool,
      abortController,
      // ...
    })
  })
}
```

#### 9.1.4 并行执行示例

```typescript
// Coordinator 同时启动多个 Agent
const results = await Promise.all([
  agentTool.call({ 
    description: "研究问题 A", 
    subagent_type: "worker",
    prompt: "..." 
  }),
  agentTool.call({ 
    description: "研究问题 B", 
    subagent_type: "worker",
    prompt: "..." 
  }),
  agentTool.call({ 
    description: "研究问题 C", 
    subagent_type: "worker",
    prompt: "..." 
  }),
])
```

### 9.2 沙箱隔离机制

Claude Code 实现了多层次的沙箱隔离机制，确保 Agent 执行的安全性。

#### 9.2.1 沙箱类型

| 沙箱类型            | 实现位置                                     | 用途          |
| --------------- | ---------------------------------------- | ----------- |
| **Docker 沙箱**   | `src/utils/sandbox/docker.ts`            | 完全隔离的执行环境   |
| **Firejail 沙箱** | `src/utils/sandbox/firejail.ts`          | Linux 系统级隔离 |
| **Bash 沙箱**     | `src/tools/BashTool/shouldUseSandbox.ts` | 命令级沙箱决策     |

#### 9.2.2 沙箱决策逻辑

```typescript
// src/tools/BashTool/shouldUseSandbox.ts
export function shouldUseSandbox(command: string, cwd: string): boolean {
  // 1. 检查环境变量强制沙箱
  if (process.env.CLAUDE_CODE_FORCE_SANDBOX) {
    return true
  }

  // 2. 检查命令是否在沙箱白名单中
  const sandboxedCommands = [
    'npm install',
    'pip install',
    'cargo build',
    // ...
  ]
  
  // 3. 检查文件系统影响范围
  const impact = analyzeFilesystemImpact(command)
  if (impact > IMPACT_THRESHOLD) {
    return true
  }

  // 4. 检查网络访问需求
  if (requiresNetwork(command) && isNetworkRestricted()) {
    return true
  }

  return false
}
```

#### 9.2.3 沙箱适配器架构

```typescript
// src/utils/sandbox/sandbox-adapter.ts
export interface SandboxAdapter {
  // 执行命令
  execute(command: string, options: SandboxOptions): Promise<ExecutionResult>
  
  // 文件系统操作
  readFile(path: string): Promise<string>
  writeFile(path: string, content: string): Promise<void>
  
  // 生命周期管理
  start(): Promise<void>
  stop(): Promise<void>
  
  // 状态检查
  isHealthy(): boolean
}

// Docker 沙箱实现
export class DockerSandboxAdapter implements SandboxAdapter {
  private containerId: string
  
  async execute(command: string, options: SandboxOptions): Promise<ExecutionResult> {
    // 在 Docker 容器中执行
    return dockerExec(this.containerId, command, options)
  }
  // ...
}
```

#### 9.2.4 沙箱安全策略

```
┌─────────────────────────────────────────────────────────────┐
│                    Sandbox Security Layers                  │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: Command Validation                                │
│    - 危险命令检测 (rm -rf, mkfs, etc.)                      │
│    - 路径遍历检查                                           │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Filesystem Isolation                              │
│    - 只读挂载敏感目录                                       │
│    - 临时工作目录隔离                                       │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: Network Isolation                                 │
│    - 可选的网络命名空间隔离                                 │
│    - 出站流量限制                                           │
├─────────────────────────────────────────────────────────────┤
│  Layer 4: Resource Limits                                   │
│    - CPU/内存限制                                           │
│    - 执行超时控制                                           │
└─────────────────────────────────────────────────────────────┘
```

### 9.3 工作流编排

Claude Code 支持复杂的工作流编排，通过 `WorkflowTool` 实现。

#### 9.3.1 工作流定义

```typescript
// src/tools/WorkflowTool/types.ts
export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  
  // 工作流步骤
  steps: WorkflowStep[]
  
  // 执行策略
  strategy: 'sequential' | 'parallel' | 'dag'
  
  // 错误处理
  onError: 'stop' | 'continue' | 'retry'
  
  // 超时设置
  timeout?: number
}

export interface WorkflowStep {
  id: string
  name: string
  
  // 执行类型
  type: 'agent' | 'tool' | 'condition' | 'wait'
  
  // 执行配置
  config: AgentStepConfig | ToolStepConfig | ConditionConfig
  
  // 依赖步骤
  dependsOn?: string[]
  
  // 输出映射
  outputs?: Record<string, string>
}
```

#### 9.3.2 工作流执行引擎

```typescript
// src/tools/WorkflowTool/WorkflowEngine.ts
export class WorkflowEngine {
  private workflow: WorkflowDefinition
  private context: WorkflowContext
  private executionGraph: DAG<WorkflowStep>
  
  async execute(): Promise<WorkflowResult> {
    // 1. 构建执行图
    this.buildExecutionGraph()
    
    // 2. 拓扑排序确定执行顺序
    const executionOrder = this.executionGraph.topologicalSort()
    
    // 3. 按策略执行
    switch (this.workflow.strategy) {
      case 'sequential':
        return this.executeSequential(executionOrder)
      case 'parallel':
        return this.executeParallel(executionOrder)
      case 'dag':
        return this.executeDAG(executionOrder)
    }
  }
  
  private async executeDAG(steps: WorkflowStep[]): Promise<WorkflowResult> {
    const completed = new Set<string>()
    const running = new Map<string, Promise<void>>()
    
    while (completed.size < steps.length) {
      // 找到可执行的步骤（依赖已满足）
      const readySteps = steps.filter(step => 
        !completed.has(step.id) &&
        !running.has(step.id) &&
        step.dependsOn?.every(dep => completed.has(dep))
      )
      
      // 并行启动所有就绪步骤
      for (const step of readySteps) {
        running.set(step.id, this.executeStep(step).then(() => {
          completed.add(step.id)
          running.delete(step.id)
        }))
      }
      
      // 等待至少一个步骤完成
      await Promise.race(running.values())
    }
    
    return this.buildResult()
  }
}
```

#### 9.3.3 工作流示例

```typescript
const codeReviewWorkflow: WorkflowDefinition = {
  id: 'code-review',
  name: 'Code Review Workflow',
  strategy: 'dag',
  steps: [
    {
      id: 'analyze',
      type: 'agent',
      config: { prompt: '分析代码变更...' },
    },
    {
      id: 'security-check',
      type: 'agent',
      config: { prompt: '安全检查...' },
      dependsOn: ['analyze'],
    },
    {
      id: 'performance-check',
      type: 'agent',
      config: { prompt: '性能检查...' },
      dependsOn: ['analyze'],
    },
    {
      id: 'generate-report',
      type: 'agent',
      config: { prompt: '生成报告...' },
      dependsOn: ['security-check', 'performance-check'],
    },
  ],
}
```

### 9.4 Coordinator 模式

Coordinator 模式是 Claude Code 的高级多 Agent 编排模式。

#### 9.4.1 模式启用

```typescript
// src/coordinator/coordinatorMode.ts
export function isCoordinatorMode(): boolean {
  if (feature('COORDINATOR_MODE')) {
    return isEnvTruthy(process.env.CLAUDE_CODE_COORDINATOR_MODE)
  }
  return false
}
```

#### 9.4.2 Coordinator 系统提示词

Coordinator 拥有专门的系统提示词，定义了多 Agent 协调策略：

```
You are Claude Code, an AI assistant that orchestrates software engineering 
tasks across multiple workers.

## 1. Your Role

You are a coordinator. Your job is to:
- Help the user achieve their goal
- Direct workers to research, implement and verify code changes
- Synthesize results and communicate with the user

## 2. Your Tools

- **AgentTool** - Spawn a new worker
- **SendMessageTool** - Continue an existing worker
- **TaskStopTool** - Stop a running worker

## 3. Task Workflow

| Phase | Who | Purpose |
|-------|-----|---------|
| Research | Workers (parallel) | Investigate codebase |
| Synthesis | You (coordinator) | Understand and plan |
| Implementation | Workers | Make changes |
| Verification | Workers | Test changes |

## 4. Concurrency

Parallelism is your superpower. Workers are async. Launch independent 
workers concurrently whenever possible.
```

#### 9.4.3 Coordinator 通信机制

```
┌─────────────────────────────────────────────────────────────────┐
│                         Coordinator                             │
│                     (Leader Agent)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Mailbox 1     │  │   Mailbox 2     │  │   Mailbox 3     │
│  (Agent A)      │  │  (Agent B)      │  │  (Agent C)      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ▼
                    ┌─────────────────┐
                    │  Task Results   │
                    │  (Notification) │
                    └─────────────────┘
```

#### 9.4.4 权限桥接

```typescript
// src/utils/swarm/leaderPermissionBridge.ts
export function registerLeaderToolUseConfirmQueue(
  setter: SetToolUseConfirmQueueFn,
): void {
  registeredSetter = setter
}

// Teammate 使用 Leader 的权限对话框
function createInProcessCanUseTool(identity: TeammateIdentity): CanUseToolFn {
  return async (tool, input, toolUseContext) => {
    const setToolUseConfirmQueue = getLeaderToolUseConfirmQueue()
    
    // 使用 Leader 的权限对话框
    if (setToolUseConfirmQueue) {
      return new Promise<PermissionDecision>(resolve => {
        setToolUseConfirmQueue(prev => [
          ...prev,
          {
            tool,
            input,
            onDecision: resolve,
            workerBadge: identity.name, // 显示 Worker 标识
          },
        ])
      })
    }
    
    // Fallback: 使用 Mailbox 系统
    return requestPermissionViaMailbox(tool, input, identity)
  }
}
```

***

## 10. Hook 系统

Claude Code 拥有完善的 Hook 系统，支持在关键生命周期点插入自定义逻辑。

### 10.1 Hook 类型

| Hook 类型        | 触发时机      | 用途           |
| -------------- | --------- | ------------ |
| `PreQuery`     | API 查询前   | 修改请求参数、添加上下文 |
| `PostQuery`    | API 查询后   | 处理响应、记录日志    |
| `PreTool`      | 工具执行前     | 权限检查、参数验证    |
| `PostTool`     | 工具执行后     | 结果处理、副作用     |
| `PreAgent`     | Agent 启动前 | 初始化、配置注入     |
| `PostAgent`    | Agent 结束后 | 结果汇总、清理      |
| `SessionStart` | 会话开始时     | 初始化环境        |
| `FileChanged`  | 文件变更时     | 触发构建、更新索引    |

### 10.2 Hook 注册机制

```typescript
// src/utils/hooks/AsyncHookRegistry.ts
export type PendingAsyncHook = {
  processId: string
  hookId: string
  hookName: string
  hookEvent: HookEvent
  command: string
  shellCommand?: ShellCommand
  timeout: number
}

// 全局注册表
const pendingHooks = new Map<string, PendingAsyncHook>()

export function registerPendingAsyncHook({
  processId,
  hookId,
  hookName,
  hookEvent,
  command,
  shellCommand,
}: RegisterHookParams): void {
  const stopProgressInterval = startHookProgressInterval({
    hookId,
    hookName,
    hookEvent,
    getOutput: async () => {
      const stdout = await shellCommand?.taskOutput.getStdout()
      return { stdout, stderr: '', output: stdout }
    },
  })
  
  pendingHooks.set(processId, {
    processId,
    hookId,
    hookName,
    hookEvent,
    command,
    shellCommand,
    stopProgressInterval,
    // ...
  })
}
```

### 10.3 Hook 事件系统

```typescript
// src/utils/hooks/hookEvents.ts
export type HookExecutionEvent =
  | HookStartedEvent
  | HookProgressEvent
  | HookResponseEvent

export type HookStartedEvent = {
  type: 'started'
  hookId: string
  hookName: string
  hookEvent: string
}

export type HookProgressEvent = {
  type: 'progress'
  hookId: string
  hookName: string
  hookEvent: string
  stdout: string
  stderr: string
  output: string
}

export type HookResponseEvent = {
  type: 'response'
  hookId: string
  hookName: string
  hookEvent: string
  output: string
  exitCode?: number
  outcome: 'success' | 'error' | 'cancelled'
}

// 事件处理器注册
export function registerHookEventHandler(
  handler: HookEventHandler | null,
): void {
  eventHandler = handler
  // 处理挂起的事件
  if (handler && pendingEvents.length > 0) {
    for (const event of pendingEvents.splice(0)) {
      handler(event)
    }
  }
}
```

### 10.4 Hook 配置管理

```typescript
// src/utils/hooks/hooksConfigManager.ts
export interface HookConfig {
  name: string
  event: HookEvent
  command: string
  async?: boolean
  asyncTimeout?: number
  enabled: boolean
}

export class HooksConfigManager {
  private configs: Map<string, HookConfig>
  
  loadFromFile(path: string): void {
    const content = fs.readFileSync(path, 'utf-8')
    const configs = JSON.parse(content)
    for (const config of configs) {
      this.register(config)
    }
  }
  
  register(config: HookConfig): void {
    this.configs.set(config.name, config)
  }
  
  getHooksForEvent(event: HookEvent): HookConfig[] {
    return Array.from(this.configs.values())
      .filter(c => c.event === event && c.enabled)
  }
  
  // 执行 Hooks
  async executeHooks(event: HookEvent, context: HookContext): Promise<HookResult[]> {
    const hooks = this.getHooksForEvent(event)
    return Promise.all(hooks.map(hook => this.executeHook(hook, context)))
  }
}
```

### 10.5 自定义 Hook 示例

```typescript
// .claude/hooks/pre-commit.js
module.exports = {
  name: 'pre-commit-check',
  event: 'PreCommit',
  command: 'npm run lint && npm run test',
  async: true,
  asyncTimeout: 60000,
  enabled: true,
}
```

***

## 11. 状态管理

使用自定义 Store + React Context 实现，其核心状态存储在 `src/state/AppStateStore.ts`：

```typescript
export type AppState = {
  sessionId: string
  messages: Message[]
  mainLoopModel: string
  tools: Tools
  tasks: TaskState[]
  mcp: {
    clients: MCPServerConnection[]
    tools: Tools
  }
  toolPermissionContext: ToolPermissionContext
}
```

***

## 12. API 通信

通过 `@anthropic-ai/sdk` 进行，分为：

* `queryModelWithStreaming`: 流式查询

* `queryModelWithoutStreaming`: 非流式查询

* `queryHaiku`: 使用低成本 Haiku 模型进行快速评估

***

## 13. 多分支多模型执行

### 13.1 模型选择策略

```typescript
// src/utils/model/model.ts
export function getMainLoopModel(): ModelName {
  const model = getUserSpecifiedModelSetting()
  if (model !== undefined && model !== null) {
    return parseUserSpecifiedModel(model)
  }
  return getDefaultMainLoopModel()
}

// 模型优先级
export function getDefaultMainLoopModelSetting(): ModelName | ModelAlias {
  // Max/Team Premium → Opus
  if (isMaxSubscriber() || isTeamPremiumSubscriber()) {
    return getDefaultOpusModel()
  }
  // 其他用户 → Sonnet
  return getDefaultSonnetModel()
}
```

### 13.2 运行时模型切换

```typescript
// src/utils/model/model.ts
export function getRuntimeMainLoopModel(params: {
  permissionMode: PermissionMode
  mainLoopModel: string
  exceeds200kTokens?: boolean
}): ModelName {
  // opusplan: Plan 模式使用 Opus
  if (
    getUserSpecifiedModelSetting() === 'opusplan' &&
    permissionMode === 'plan'
  ) {
    return getDefaultOpusModel()
  }
  
  // sonnetplan: Plan 模式使用 Sonnet
  if (
    getUserSpecifiedModelSetting() === 'haiku' &&
    permissionMode === 'plan'
  ) {
    return getDefaultSonnetModel()
  }
  
  return mainLoopModel
}
```

### 13.3 多分支执行

```typescript
// 多分支并行探索
const branches = [
  { model: 'opus', prompt: '方案 A...' },
  { model: 'sonnet', prompt: '方案 B...' },
  { model: 'haiku', prompt: '方案 C...' },
]

const results = await Promise.all(
  branches.map(async ({ model, prompt }) => {
    return agentTool.call({
      description: `探索方案`,
      model,  // 指定模型
      prompt,
    })
  })
)

// 选择最佳结果
const bestResult = selectBestResult(results)
```

***

## 14. 二次开发指南

### 14.1 添加新工具

1. **创建工具目录**: `mkdir src/tools/MyTool`
2. **实现工具**: 继承 `buildTool`，实现 `call` 与 `renderToolUseMessage` 等。
3. **注册工具**: 在 `src/tools.ts` 中的 `getAllBaseTools` 注册。

### 14.2 添加自定义 Agent

```typescript
// src/tools/AgentTool/builtInAgents.ts
export const MyCustomAgent: AgentDefinition = {
  name: 'my-custom-agent',
  description: 'My custom agent',
  systemPrompt: 'You are a specialized agent for...',
  allowedTools: ['read', 'edit', 'bash'],
  model: 'claude-3-opus-20240229',
  subagentType: 'local_agent',
}
```

### 14.3 添加工作流

```typescript
// src/tools/WorkflowTool/customWorkflows.ts
export const myWorkflow: WorkflowDefinition = {
  id: 'my-workflow',
  name: 'My Workflow',
  strategy: 'parallel',
  steps: [
    {
      id: 'step1',
      type: 'agent',
      config: { prompt: 'Step 1...' },
    },
    {
      id: 'step2',
      type: 'agent',
      config: { prompt: 'Step 2...' },
    },
  ],
}
```

### 14.4 添加 Hook

```typescript
// src/utils/hooks/myCustomHook.ts
import { registerHook } from './hooksConfigManager'

registerHook({
  name: 'my-custom-hook',
  event: 'PreQuery',
  command: './scripts/preprocess.sh',
  async: true,
  enabled: true,
})
```

### 14.5 开发注意事项

1. **缓存成本**: 极度关注 Token Cache，不要随便翻转 Context，单次 Cache Bust 成本可能极高。
2. **权限安全 (`PermissionMode`)**: 确保使用 `toolPermissionContext` 执行权限检测。文件写操作默认受限。
3. **UI阻塞**: 终端组件在 Agent 工作时进行状态输出，不可出现长阻塞，尽量使用 `Spinner` 机制。
4. **并发安全**: 多 Agent 并行时注意资源竞争，使用 `AsyncLocalStorage` 进行上下文隔离。
5. **沙箱使用**: 涉及文件系统或网络的操作，优先使用沙箱隔离。

***

*文档结束*

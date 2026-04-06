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
10. [状态管理](#10-状态管理)
11. [API 通信](#11-api-通信)
12. [二次开发指南](#12-二次开发指南)

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

### 9.1 Agent 类型 (`src/Task.ts`)

| 类型               | 描述                   |
| ---------------- | -------------------- |
| `local_bash`     | 本地 Bash 任务 (前缀 `b`)  |
| `local_agent`    | 本地 Agent 任务 (前缀 `a`) |
| `remote_agent`   | 远程 Agent 任务 (前缀 `r`) |
| `local_workflow` | 本地工作流 (前缀 `w`)       |
| `dream`          | 离线后台任务 (前缀 `d`)      |

### 9.2 Agent 执行流程

`AgentTool.call()` -> `createSubagentContext()` -> 赋予 Agent 独立隔离的 ToolUseContext -> 发起全新的 `QueryEngine` 子查询。MCP 工具如果是 Agent-Specific 的，也会在这一层进行自动连接与析构。

***

## 10. 状态管理

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

## 11. API 通信

通过 `@anthropic-ai/sdk` 进行，分为：

* `queryModelWithStreaming`: 流式查询

* `queryModelWithoutStreaming`: 非流式查询

* `queryHaiku`: 使用低成本 Haiku 模型进行快速评估

***

## 12. 二次开发指南

### 12.1 添加新工具

1. **创建工具目录**: `mkdir src/tools/MyTool`
2. **实现工具**: 继承 `buildTool`，实现 `call` 与 `renderToolUseMessage` 等。
3. **注册工具**: 在 `src/tools.ts` 中的 `getAllBaseTools` 注册。

### 12.2 开发注意事项

1. **缓存成本**: 极度关注 Token Cache，不要随便翻转 Context，单次 Cache Bust 成本可能极高。
2. **权限安全 (`PermissionMode`)**: 确保使用 `toolPermissionContext` 执行权限检测。文件写操作默认受限。
3. **UI阻塞**: 终端组件在 Agent 工作时进行状态输出，不可出现长阻塞，尽量使用 `Spinner` 机制。

***

*文档结束*

# Claude Code 任务拆解机制移植文档

## 概述

本文档详细分析 Claude Code 如何根据用户提示词拆解为独立任务的核心机制，并提供移植策略。

## 1. 核心架构

### 1.1 Coordinator Mode（协调器模式）

Claude Code 的任务拆解基于**协调器模式**：

**角色划分：**
- **Coordinator（协调器）** - 理解用户需求、分解任务、编排多个 Worker
- **Worker（工作者）** - 执行具体任务（研究、实现、验证）

**关键文件：**
- `/coordinator/coordinatorMode.ts` - 协调器模式系统提示和模式管理

### 1.2 Agent 系统

**Agent 类型：**
- `General Purpose` - 通用 Agent
- `Explore` - 探索型 Agent（只读模式）
- `Plan` - 计划型 Agent（设计实现方案）
- `Verification` - 验证型 Agent
- `Claude Code Guide` - 指南型 Agent

**关键文件：**
- `/tools/AgentTool/builtInAgents.ts` - 内置 Agent 注册
- `/tools/AgentTool/built-in/planAgent.ts` - 计划 Agent 定义
- `/tools/AgentTool/built-in/exploreAgent.ts` - 探索 Agent 定义
- `/tools/AgentTool/runAgent.ts` - Agent 运行核心逻辑

## 2. 任务拆解四阶段流程

### 2.1 Research（研究阶段）

**执行者：** Workers（可并行）
**目的：** 调查代码库、找到相关文件、理解问题

**实现机制：**
- 使用 Explore Agent 进行只读模式探索
- 支持多个并行 Worker 从不同角度同时研究

**示例：**
```typescript
// 并行启动两个研究 Worker
AgentTool({ 
  description: "Investigate auth bug", 
  subagent_type: "worker", 
  prompt: "Investigate the auth module in src/auth/..." 
})
AgentTool({ 
  description: "Research auth tests", 
  subagent_type: "worker", 
  prompt: "Find all test files related to src/auth/..." 
})
```

### 2.2 Synthesis（综合阶段）

**执行者：** Coordinator（协调器）
**目的：** 阅读研究结果、理解问题、设计实现方案

**核心原则：**
- Coordinator 必须**真正理解**研究结果后才能继续
- 必须写出具体的实现规范（包含文件路径、行号等）
- 禁止"基于研究结果继续"这类偷懒的委托

**反模式（禁止）：**
```
"Based on your findings, fix the auth bug"
"The worker found an issue in the auth module. Please fix it."
```

**正确模式（必须）：**
```
"Fix the null pointer in src/auth/validate.ts:42. The user field on Session (src/auth/types.ts:15) is undefined when sessions expire..."
```

### 2.3 Implementation（实现阶段）

**执行者：** Workers
**目的：** 根据规范进行针对性修改、提交代码

**并发控制：**
- 写入密集型任务按文件集串行执行
- 读任务可并行自由执行

### 2.4 Verification（验证阶段）

**执行者：** Workers
**目的：** 验证代码工作

**验证标准：**
- 运行**启用该功能**的测试（不仅仅是"测试通过"）
- 运行类型检查并**调查错误**（不轻易视为"不相关"）
- 保持怀疑态度 - 如果有问题就深入调查
- **独立测试** - 证明更改有效，不是橡皮图章

## 3. Worker 管理机制

### 3.1 Continue vs Spawn 决策

| 场景 | 机制 | 原因 |
|------|------|------|
| 研究正好探索了需要编辑的文件 | **Continue**（SEND_MESSAGE） | Worker 已有文件上下文且获得清晰计划 |
| 研究很广但实现很窄 | **Spawn fresh**（AGENT_TOOL） | 避免探索噪音；聚焦上下文更清晰 |
| 修正失败或扩展近期工作 | **Continue** | Worker 有错误上下文知道刚才尝试了什么 |
| 验证不同 Worker 刚写的代码 | **Spawn fresh** | 验证者应该以新眼光看待代码，不携带实现假设 |
| 第一次实现尝试方法完全错误 | **Spawn fresh** | 错误方法上下文污染重试；干净 slate 避免锚定在失败路径 |
| 完全无关的任务 | **Spawn fresh** | 无有用上下文可重用 |

### 3.2 Worker 结果通知

Worker 结果以**用户角色消息**形式到达，包含 `<task-notification>` XML：

```xml
<task-notification>
<task-id>{agentId}</task-id>
<status>completed|failed|killed</status>
<summary>{human-readable status summary}</summary>
<result>{agent's final text response}</result>
<usage>
  <total_tokens>N</total_tokens>
  <tool_uses>N</tool_uses>
  <duration_ms>N</duration_ms>
</usage>
</task-notification>
```

### 3.3 Worker 停止机制

使用 TASK_STOP_TOOL_NAME 停止方向错误的 Worker：

```typescript
// 启动 Worker 进行 JWT 重构
AgentTool({ description: "Refactor auth to JWT", ... })
// 返回 task_id: "agent-x7q"

// 用户澄清："保持会话 - 只修复空指针"
TaskStopTool({ task_id: "agent-x7q" })

// 用修正后的指令继续
SendMessageTool({ to: "agent-x7q", message: "Stop JWT refactor. Instead, fix null pointer..." })
```

## 4. Agent 系统实现细节

### 4.1 Agent 定义结构

```typescript
interface AgentDefinition {
  agentType: string;
  whenToUse: string;
  disallowedTools?: string[];
  source: 'built-in' | 'plugin' | 'user';
  tools?: Tool[];
  baseDir?: string;
  model?: 'inherit' | string;
  omitClaudeMd?: boolean;
  getSystemPrompt: (context: any) => string;
  permissionMode?: string;
  effort?: number;
  hooks?: any;
  skills?: string[];
  mcpServers?: Array<string | Record<string, any>>;
  callback?: () => void;
  maxTurns?: number;
}
```

### 4.2 Plan Agent 设计示例

```typescript
const PLAN_AGENT: BuiltInAgentDefinition = {
  agentType: 'Plan',
  whenToUse: 'Software architect agent for designing implementation plans...',
  disallowedTools: [
    AGENT_TOOL_NAME,
    EXIT_PLAN_MODE_TOOL_NAME,
    FILE_EDIT_TOOL_NAME,
    FILE_WRITE_TOOL_NAME,
    NOTEBOOK_EDIT_TOOL_NAME,
  ],
  source: 'built-in',
  tools: EXPLORE_AGENT.tools,
  baseDir: 'built-in',
  model: 'inherit',
  omitClaudeMd: true,
  getSystemPrompt: () => getPlanV2SystemPrompt(),
}
```

### 4.3 Agent 运行流程

**核心步骤（runAgent）：**
1. 解析 Agent 定义和参数
2. 设置权限模式（可覆盖父级）
3. 解析可用工具集
4. 初始化 Agent 特定 MCP 服务器
5. 构建系统提示词
6. 执行查询循环（query()）
7. 记录 Sidechain 转录本
8. 清理资源

## 5. 移植策略

### 5.1 分阶段移植路线

**Phase 1 - 基础协调器框架**
- 实现 Coordinator 模式识别和切换
- 实现基本的 Worker 启动和通知机制
- 实现 task-notification XML 消息格式

**Phase 2 - Agent 系统**
- 实现 Agent 定义和注册
- 实现 Agent 运行器（类似 runAgent）
- 实现 Continue vs Spawn 决策逻辑

**Phase 3 - 内置 Agent**
- 实现 Explore Agent（只读模式）
- 实现 Plan Agent（规划模式）
- 实现 Verification Agent（验证模式）

**Phase 4 - 高级功能**
- 实现 Worker 停止机制
- 实现 Sidechain 转录本记录
- 实现权限模式管理

### 5.2 关键模块移植清单

| Claude Code 模块 | 移植优先级 | 说明 |
|-----------------|-----------|------|
| `coordinatorMode.ts` | P0 | 协调器模式核心系统提示 |
| `builtInAgents.ts` | P0 | 内置 Agent 注册机制 |
| `runAgent.ts` | P0 | Agent 运行核心逻辑 |
| `planAgent.ts` | P1 | 计划 Agent 实现 |
| `exploreAgent.ts` | P1 | 探索 Agent 实现 |

### 5.3 系统集成方案

**与现有 StoryTree 系统集成：**
1. **保持独立模块** - 移植的协调器系统作为独立模块运行
2. **渐进式启用** - 通过环境变量（类似 `CLAUDE_CODE_COORDINATOR_MODE`）控制是否启用
3. **会话状态跟踪** - 记录会话模式（coordinator/normal），在恢复会话时匹配

**关键接口：**
```typescript
// 检查协调器模式是否启用
function isCoordinatorMode(): boolean

// 匹配会话模式（会话恢复时使用）
function matchSessionMode(
  sessionMode: 'coordinator' | 'normal' | undefined,
): string | undefined

// 获取协调器用户上下文
function getCoordinatorUserContext(
  mcpClients: ReadonlyArray<{ name: string }>,
  scratchpadDir?: string,
): { [k: string]: string }

// 获取协调器系统提示
function getCoordinatorSystemPrompt(): string
```

## 6. 工具映射

### 6.1 Claude Code 工具 → StoryTree 工具映射

| Claude Code 工具 | StoryTree 对应机制 |
|-----------------|------------------|
| `AGENT_TOOL_NAME` | 多 Agent 协调器（新增） |
| `SEND_MESSAGE_TOOL_NAME` | 继续现有 Agent 对话（新增） |
| `TASK_STOP_TOOL_NAME` | 停止运行中的 Agent（新增） |
| `TEAM_CREATE_TOOL_NAME` | 团队创建（如适用） |
| `TEAM_DELETE_TOOL_NAME` | 团队删除（如适用） |

### 6.2 Worker 允许工具集

默认 Worker 可用工具（`ASYNC_AGENT_ALLOWED_TOOLS`）通常包括：
- Bash 工具（执行命令）
- 文件读取工具
- 文件编辑工具
- 文件写入工具
- MCP 工具（来自连接的 MCP 服务器）
- 技能工具（通过 Skill 工具）

## 7. 最佳实践和注意事项

### 7.1 写好 Worker 提示词的技巧

**必须：**
- 包含完整上下文（Worker 看不到对话）
- 包含文件路径、行号、错误消息
- 明确"完成"的样子
- 对于实现："运行相关测试和类型检查，然后提交更改并报告哈希"
- 对于研究："报告发现 - 不要修改文件"
- 对于验证："证明代码有效，不要只是确认存在"

**禁止：**
- "修复我们讨论的错误" - 无上下文
- "基于你的发现，实现修复" - 偷懒委托
- "为最近的更改创建 PR" - 范围不明确
- "测试出了问题，能看一下吗？" - 无错误信息

### 7.2 并发管理原则

- **只读任务（研究）** - 可自由并行运行
- **写入密集任务（实现）** - 按文件集一次一个
- **验证** - 有时可与实现并行在不同文件区域

### 7.3 处理 Worker 失败

当 Worker 报告失败（测试失败、构建错误、文件未找到）：
- 用 SEND_MESSAGE_TOOL 继续同一 Worker - 它有完整错误上下文
- 如果一次修正失败，尝试不同方法或向用户报告

## 8. 示例会话流程

### 8.1 完整的 bug 修复流程

```
用户: "auth 模块有空指针。能修复吗？"

协调器:
  让我先调查一下。
  
  AgentTool({ description: "Investigate auth bug", subagent_type: "worker", prompt: "Investigate the auth module in src/auth/..." })
  AgentTool({ description: "Research auth tests", subagent_type: "worker", prompt: "Find all test files related to src/auth/..." })
  
  从两个角度调查 - 我会报告发现。

用户:
  <task-notification>
  <task-id>agent-a1b</task-id>
  <status>completed</status>
  <summary>Agent "Investigate auth bug" completed</summary>
  <result>Found null pointer in src/auth/validate.ts:42. The user field on Session is undefined...</result>
  </task-notification>

协调器:
  找到 bug - validate.ts:42 的空指针。
  
  SendMessageTool({ to: "agent-a1b", message: "Fix the null pointer in src/auth/validate.ts:42. Add a null check before accessing user.id..." })
  
  修复进行中。

用户:
  进展如何？

协调器:
  新测试的修复进行中。还在等测试套件的结果。
```

## 9. 下一步行动项

1. 创建协调器模式基础实现（Phase 1）
2. 设计 Agent 系统核心接口（Phase 2）
3. 实现基础的 Explore 和 Plan Agent（Phase 3）
4. 设计与现有 StoryTree 系统的集成方案
5. 编写测试用例覆盖核心流程

## 10. 参考资源

- Claude Code 架构文档
- Task.ts 任务类型定义
- coordinator/coordinatorMode.ts 协调器系统提示
- tools/AgentTool/ 完整 Agent 工具实现

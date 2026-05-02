# Claude Code 代码库分析报告：AI 小说编辑器 AgentBridge 和工具白名单设计参考

**生成时间**：2026-05-02  
**分析目标**：为 AI 小说编辑器的 FakeAgentProvider、RealAgentProvider、工具白名单、AI 任务状态机和沙箱隔离测试提供架构和技术参考

---

## 1. Agent 主流程

### 结论

Claude Code Agent 采用 **QueryEngine** 作为核心任务引擎，通过 `submitMessage()` 异步生成器处理用户输入、协调工具调用、管理会话状态。流程为：**用户输入 → processUserInput() → QueryEngine → query() → 工具执行 → 结果返回**。

### 关键文件路径

| 文件 | 用途 |
|---|---|
| `claude-code-src/QueryEngine.ts` | 核心查询引擎 |
| `claude-code-src/query.ts` | API 调用和流式响应处理 |
| `claude-code-src/utils/processUserInput/processUserInput.ts` | 用户输入解析 |
| `claude-code-src/Tool.ts` | 工具接口定义 |
| `claude-code-src/hooks/useCanUseTool.tsx` | 权限检查 Hook |

### 关键函数/类型

```typescript
// QueryEngine.ts - 核心类
export class QueryEngine {
  async *submitMessage(
    prompt: string | ContentBlockParam[],
    options?: { uuid?: string; isMeta?: boolean }
  ): AsyncGenerator<SDKMessage, void, unknown>
  interrupt(): void
  getMessages(): readonly Message[]
}

// QueryEngineConfig - 配置接口
export type QueryEngineConfig = {
  cwd: string
  tools: Tools
  commands: Command[]
  canUseTool: CanUseToolFn  // 权限检查回调
  getAppState: () => AppState
  setAppState: (f: (prev: AppState) => AppState) => void
  maxTurns?: number
  maxBudgetUsd?: number
  // ...
}
```

### 可复用点

✅ **AsyncGenerator 模式**：可用于小说编辑器的 AI 任务流式输出  
✅ **权限检查回调**：可适配小说编辑器的工具白名单机制  
✅ **中断机制**：`interrupt()` 可用于取消 AI 任务

### 风险点

⚠️ **与 Anthropic SDK 强耦合**：需要解耦才能用于 OpenCode  
⚠️ **状态管理依赖 AppState**：需要适配到 OpenCode 的 Context 模式

### 对 AI 小说编辑器的落地建议

1. **创建 NovelQueryEngine**：基于 QueryEngine 封装小说创作专用引擎
2. **注入工具白名单**：通过 `canUseTool` 回调过滤可用工具
3. **实现中断机制**：支持用户取消 AI 章节生成任务

---

## 2. Tool 系统

### 结论

Claude Code 采用 **buildTool()** 工厂函数创建工具，统一的 `Tool` 接口包含 `call()`、`description()`、`checkPermissions()`、`inputSchema` 等核心方法。工具通过 `getAllBaseTools()` 注册，支持按条件启用/禁用。

### 工具定义位置

```
claude-code-src/tools/
├── AgentTool/         # Agent 调用工具
├── BashTool/          # Shell 命令工具
├── FileEditTool/      # 文件编辑工具
├── FileReadTool/      # 文件读取工具
├── FileWriteTool/     # 文件写入工具
├── GlobTool/          # 文件搜索工具
├── GrepTool/          # 内容搜索工具
├── TaskTool/          # 任务管理工具
├── WebFetchTool/      # 网页抓取工具
├── WebSearchTool/     # 网络搜索工具
└── ...
```

### 工具接口

```typescript
// Tool.ts - 核心接口
export type Tool<
  Input extends AnyObject = AnyObject,
  Output = unknown,
  P extends ToolProgressData = ToolProgressData,
> = {
  readonly name: string
  readonly inputSchema: Input
  outputSchema?: z.ZodType<unknown>
  
  call(
    args: z.infer<Input>,
    context: ToolUseContext,
    canUseTool: CanUseToolFn,
    parentMessage: AssistantMessage,
    onProgress?: ToolCallProgress<P>
  ): Promise<ToolResult<Output>>
  
  description(
    input: z.infer<Input>,
    options: { isNonInteractiveSession, toolPermissionContext, tools }
  ): Promise<string>
  
  checkPermissions(
    input: z.infer<Input>,
    context: ToolUseContext
  ): Promise<PermissionResult>
  
  isConcurrencySafe(input: z.infer<Input>): boolean
  isReadOnly(input: z.infer<Input>): boolean
  isDestructive?(input: z.infer<Input>): boolean
  interruptBehavior?(): 'cancel' | 'block'
  
  // ... 渲染相关方法
}

// buildTool - 工具工厂
export function buildTool<D extends AnyToolDef>(def: D): BuiltTool<D>
```

### 关键类型

```typescript
// 工具结果
export type ToolResult<T> = {
  data: T
  newMessages?: (UserMessage | AssistantMessage | AttachmentMessage | SystemMessage)[]
  contextModifier?: (context: ToolUseContext) => ToolUseContext
  mcpMeta?: { _meta?: Record<string, unknown>; structuredContent?: Record<string, unknown> }
}

// 工具调用进度
export type ToolCallProgress<P extends ToolProgressData = ToolProgressData> = (
  progress: ToolProgress<P>
) => void

// 工具使用上下文
export type ToolUseContext = {
  options: {
    commands: Command[]
    debug: boolean
    mainLoopModel: string
    tools: Tools
    mcpClients: MCPServerConnection[]
    // ...
  }
  abortController: AbortController
  readFileState: FileStateCache
  getAppState(): AppState
  setAppState(f: (prev: AppState) => AppState) => void
  // ...
}
```

### 工具注册方式

```typescript
// tools.ts - 工具注册
export function getAllBaseTools(): Tools {
  return [
    AgentTool,
    TaskOutputTool,
    BashTool,
    GlobTool,
    GrepTool,
    FileEditTool,
    FileReadTool,
    FileWriteTool,
    NotebookEditTool,
    WebFetchTool,
    TodoWriteTool,
    WebSearchTool,
    // ...
  ]
}

// 按条件注册
...(hasEmbeddedSearchTools() ? [] : [GlobTool, GrepTool])
...(process.env.USER_TYPE === 'ant' ? [ConfigTool] : [])

// 权限过滤
export function filterToolsByDenyRules(tools, permissionContext): Tools
```

### 对 AI 小说编辑器的落地建议

**可复用工具**：

| 工具 | 用途 | 说明 |
|---|---|---|
| `FileReadTool` | 读取章节内容 | 直接复用 |
| `FileEditTool` | 编辑章节 | 需要版本保护 |
| `GlobTool` | 搜索章节 | 可复用 |
| `GrepTool` | 搜索内容 | 可复用 |
| `TaskTool` | 任务管理 | 可适配为分支剧情管理 |

**应禁用工具**：

| 工具 | 禁用原因 |
|---|---|
| `BashTool` | 禁止执行任意命令 |
| `WebFetchTool` | 禁止访问外部网页 |
| `WebSearchTool` | 禁止网络搜索 |
| `AgentTool` | 禁止嵌套 Agent |

**建议新增小说专用工具**：

```typescript
// 章节续写工具
const NovelContinueTool = buildTool({
  name: 'novel_continue',
  description: 'Continue writing a chapter from the current point',
  inputSchema: z.object({
    chapter_id: z.string(),
    continuation_hint: z.string().optional(),
    target_length: z.number().optional()
  }),
  async call(input, context, canUseTool) {
    // 调用 AI 生成续写内容
  }
})

// 章节分支工具
const NovelBranchTool = buildTool({
  name: 'novel_branch',
  description: 'Create a branching point in the story',
  inputSchema: z.object({
    chapter_id: z.string(),
    branch_description: z.string(),
    branch_choices: z.array(z.string())
  })
})
```

---

## 3. 权限系统

### 结论

Claude Code 采用 **分层权限检查**：1) 规则匹配（alwaysAllow/alwaysDeny/alwaysAsk）→ 2) 工具特定检查 → 3) 沙箱安全检查。权限上下文 `ToolPermissionContext` 包含模式（mode）、规则、额外工作目录等配置。

### 权限检查入口

**文件**：`claude-code-src/utils/permissions/permissions.ts`

```typescript
// 核心权限检查函数
export const hasPermissionsToUseTool: CanUseToolFn = async (
  tool, input, context, assistantMessage, toolUseID
): Promise<PermissionDecision>

// 内部检查流程 (hasPermissionsToUseToolInner)
async function hasPermissionsToUseToolInner(tool, input, context) {
  // 1a. 工具被规则拒绝
  const denyRule = getDenyRuleForTool(context, tool)
  if (denyRule) return { behavior: 'deny', ... }
  
  // 1b. 工具被规则要求询问
  const askRule = getAskRuleForTool(context, tool)
  if (askRule) return { behavior: 'ask', ... }
  
  // 1c. 工具特定权限检查
  const toolPermissionResult = await tool.checkPermissions(input, context)
  
  // 2a. 模式绕过检查
  if (shouldBypassPermissions) return { behavior: 'allow', ... }
  
  // 2b. 工具被规则允许
  const alwaysAllowedRule = toolAlwaysAllowedRule(context, tool)
  if (alwaysAllowedRule) return { behavior: 'allow', ... }
  
  // 3. 返回询问/拒绝结果
}
```

### 权限模式

```typescript
// types/permissions.ts
export type PermissionMode = 
  | 'default'      // 默认模式，需要用户确认
  | 'acceptEdits'  // 允许文件编辑
  | 'bypassPermissions'  // 绕过所有权限
  | 'dontAsk'      // 不询问，直接拒绝
  | 'plan'         // 计划模式
  | 'auto'         // 自动模式（AI 分类器决策）
```

### 权限规则

```typescript
export type PermissionRule = {
  source: PermissionRuleSource  // 'userSettings' | 'projectSettings' | 'cliArg' | 'command' | 'session'
  ruleBehavior: PermissionBehavior  // 'allow' | 'deny' | 'ask'
  ruleValue: PermissionRuleValue  // { toolName: string, ruleContent?: string }
}

// 规则格式示例：
// "Bash" - 匹配整个工具
// "Bash(git *)" - 匹配带前缀的工具调用
// "mcp__server__*" - 匹配 MCP 服务器的所有工具
```

### 工具权限上下文

```typescript
export type ToolPermissionContext = {
  readonly mode: PermissionMode
  readonly additionalWorkingDirectories: ReadonlyMap<string, AdditionalWorkingDirectory>
  readonly alwaysAllowRules: ToolPermissionRulesBySource
  readonly alwaysDenyRules: ToolPermissionRulesBySource
  readonly alwaysAskRules: ToolPermissionRulesBySource
  readonly isBypassPermissionsModeAvailable: boolean
  readonly shouldAvoidPermissionPrompts?: boolean
}
```

### 沙箱安全检查

**文件**：`claude-code-src/utils/permissions/filesystem.ts`

```typescript
// 关键安全检查函数
checkWritePermissionForTool(tool, input, context)
checkReadPermissionForPath(path, context)
checkPathSafety(path)  // 检查 .git/, .claude/, .vscode/, shell configs
```

### 对 AI 小说编辑器的落地建议

**推荐工具白名单配置**：

```typescript
const NOVEL_TOOL_WHITELIST: ToolPermissionContext = {
  mode: 'acceptEdits',  // 允许文件编辑
  additionalWorkingDirectories: new Map(),  // 仅允许工作目录
  alwaysAllowRules: {
    userSettings: [
      'Read',        // 允许读取章节
      'Edit',        // 允许编辑章节
      'Write',       // 允许写入章节
      'Glob',        // 允许搜索章节
      'Grep',        // 允许搜索内容
      'novel_*',    // 允许所有小说专用工具
    ]
  },
  alwaysDenyRules: {
    userSettings: [
      'Bash',        // 禁止 Shell 命令
      'WebFetch',    // 禁止网页抓取
      'WebSearch',   // 禁止网络搜索
      'Agent',       // 禁止嵌套 Agent
      'Task',        // 禁止任务管理（保留小说分支）
    ]
  }
}
```

**必须禁止的操作**：

| 禁止操作 | 原因 |
|---|---|
| 读取 `/etc/`、`~/.ssh/`、`$HOME` | 禁止访问系统目录 |
| 读取 `*.env`、`*.pem`、`*.key` | 禁止读取密钥文件 |
| 执行 `curl`、`wget`、`pip`、`npm install` | 禁止安装依赖 |
| 访问网络 | 防止数据泄露 |

---

## 4. Session / Message / Task 数据结构

### 结论

Claude Code 使用 **消息流** 驱动的会话模型，`Message` 类型包含 `user`、`assistant`、`system` 三种主要类型，工具调用记录通过 `tool_use` 类型嵌入在 assistant 消息中。

### 会话结构

```typescript
// 从 utils/messages.ts 导出的类型
export type Message = 
  | AssistantMessage
  | UserMessage
  | SystemMessage
  | TombstoneMessage
  | ProgressMessage
  | AttachmentMessage

export type AssistantMessage = {
  type: 'assistant'
  message: {
    role: 'assistant'
    content: ContentBlock[]  // text | tool_use | thinking
    id: string
    model: string
    stop_reason: 'end_turn' | 'tool_use' | 'stop_sequence' | null
    stop_sequence: string | null
    usage: Usage
  }
  isApiErrorMessage?: boolean
  // ...
}

export type UserMessage = {
  type: 'user'
  message: {
    role: 'user'
    content: ContentBlockParam[]
  }
  // ...
}

export type SystemMessage = {
  type: 'system'
  subtype: SystemMessageSubtype
  content: string
  // ...
}
```

### 工具调用记录

```typescript
// tool_use 内容块
export type ToolUseBlock = {
  type: 'tool_use'
  id: string  // 工具调用 ID
  name: string  // 工具名称
  input: Record<string, unknown>  // 工具输入参数
}

// tool_result 内容块
export type ToolResultBlock = {
  type: 'tool_result'
  tool_use_id: string  // 对应的工具调用 ID
  content: ContentBlockParam[]
  is_error?: boolean
}
```

### 工具调用结果结构

```typescript
// 从 FileEditTool 返回的结果
export type FileEditOutput = {
  filePath: string
  oldString: string
  newString: string
  originalFile: string
  structuredPatch: {
    oldLines: number[]
    newLines: number[]
    hunks: DiffHunk[]
  }
  userModified: boolean
  replaceAll: boolean
}
```

### 对 AI 小说编辑器的映射

| Claude Code 结构 | 小说编辑器对应 |
|---|---|
| `Session` | `NovelProject`（小说项目） |
| `Message` | `AgentMessage`（AI 消息） |
| `ToolUseBlock` | `ToolCallRecord`（工具调用记录） |
| `ProgressMessage` | `AITaskProgress`（任务进度） |
| `UserMessage` | `UserInstruction`（用户指令） |
| `AssistantMessage` | `AIResponse`（AI 响应） |

### 建议的小说编辑器数据结构

```typescript
// AITask - AI 任务
export interface AITask {
  id: string
  type: 'continue' | 'branch' | 'edit' | 'review' | 'world_building'
  status: 'pending' | 'running' | 'completed' | 'cancelled' | 'failed'
  chapterId?: string
  branchId?: string
  input: Record<string, unknown>
  output?: AITaskOutput
  progress?: AITaskProgress
  createdAt: Date
  completedAt?: Date
  error?: string
}

// AILog - AI 日志
export interface AILog {
  id: string
  taskId: string
  timestamp: Date
  level: 'info' | 'warn' | 'error'
  message: string
  metadata?: Record<string, unknown>
}

// AgentMessage - Agent 消息
export interface AgentMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string | ToolCallRecord[]
  timestamp: Date
  attachments?: Attachment[]
}

// ToolCallRecord - 工具调用记录
export interface ToolCallRecord {
  id: string
  toolName: string
  input: Record<string, unknown>
  output?: unknown
  error?: string
  duration: number
  timestamp: Date
}
```

---

## 5. Model Provider 接口

### 结论

Claude Code 直接使用 **Anthropic SDK** 调用 Claude 模型，通过 `query.ts` 处理流式响应，支持错误重试、token 统计、成本追踪。模型选择通过 `getMainLoopModel()` 获取。

### 模型调用入口

**文件**：`claude-code-src/query.ts`

```typescript
// 查询入口
export async function* query(params: {
  messages: Message[]
  systemPrompt: SystemPrompt
  userContext: Record<string, string>
  canUseTool: CanUseToolFn
  toolUseContext: ToolUseContext
  maxTurns?: number
  taskBudget?: { total: number }
  fallbackModel?: string
}): AsyncGenerator<QueryMessage, void, unknown>
```

### SDK 消息类型

```typescript
// 从 entrypoints/agentSdkTypes.ts
export type SDKMessage = 
  | { type: 'result'; subtype: 'success' | 'error_*'; ... }
  | { type: 'user'; message: MessageParam; ... }
  | { type: 'assistant'; message: MessageParam; ... }
  | { type: 'system'; subtype: 'compact_boundary'; ... }
  | { type: 'stream_event'; event: StreamEvent; ... }
```

### 成本追踪

**文件**：`claude-code-src/cost-tracker.ts`

```typescript
// 成本追踪函数
export function getTotalCost(): number
export function getModelUsage(): Record<string, number>

// 用量追踪 (bootstrap/state.ts)
export function getTotalInputTokens(): number
export function getTotalOutputTokens(): number
export function getTotalCacheReadInputTokens(): number
export function getTotalCacheCreationInputTokens(): number
```

### 对 AI 小说编辑器的落地建议

**FakeAgentProvider 设计**：

```typescript
export class FakeAgentProvider implements ModelProvider {
  private mockResponses: Map<string, string>
  
  async *generate(prompt: string): AsyncGenerator<string> {
    // 返回预设的 Mock 响应
    const response = this.mockResponses.get(prompt) || this.defaultResponse
    for (const chunk of response.split('')) {
      yield chunk
      await sleep(10)  // 模拟打字效果
    }
  }
  
  async complete(prompt: string): Promise<string> {
    return this.mockResponses.get(prompt) || this.defaultResponse
  }
}

// RealAgentProvider 设计
export class RealAgentProvider implements ModelProvider {
  private apiKey: string
  private model: string
  
  async *generate(prompt: string): AsyncGenerator<string> {
    // 调用真实 API
    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
      stream: true
    })
    
    for await (const event of response) {
      if (event.type === 'content_block_delta') {
        yield event.delta.text
      }
    }
  }
  
  async complete(prompt: string): Promise<string> {
    // 非流式完整响应
  }
}

// ModelGatewayProvider - 模型网关
export class ModelGatewayProvider implements ModelProvider {
  constructor(
    private fakeProvider: FakeAgentProvider,
    private realProvider: RealAgentProvider,
    private mode: 'mock' | 'real' | 'hybrid'
  ) {}
  
  async *generate(prompt: string): AsyncGenerator<string> {
    if (this.mode === 'mock') {
      yield* this.fakeProvider.generate(prompt)
    } else {
      yield* this.realProvider.generate(prompt)
    }
  }
}
```

---

## 6. 文件修改与版本保护

### 结论

Claude Code 的 **FileEditTool** 实现了严格的版本保护机制：1) 修改前必须先读取文件；2) 检测文件是否被外部修改；3) 生成 structured patch；4) 支持文件历史快照。

### 关键保护机制

**文件**：`claude-code-src/tools/FileEditTool/FileEditTool.ts`

```typescript
// 1. 修改前必须读取
const readTimestamp = toolUseContext.readFileState.get(fullFilePath)
if (!readTimestamp || readTimestamp.isPartialView) {
  return {
    result: false,
    behavior: 'ask',
    message: 'File has not been read yet. Read it first before writing to it.'
  }
}

// 2. 检测文件是否被外部修改
const lastWriteTime = getFileModificationTime(fullFilePath)
if (lastWriteTime > readTimestamp.timestamp) {
  // 内容比较
  if (isFullRead && fileContent === readTimestamp.content) {
    // 内容未变，安全继续
  } else {
    return {
      result: false,
      behavior: 'ask',
      message: 'File has been modified since read. Read it again.'
    }
  }
}

// 3. 生成 structured patch
const { patch, updatedFile } = getPatchForEdit({
  filePath: absoluteFilePath,
  fileContents: originalFileContents,
  oldString: actualOldString,
  newString: actualNewString,
  replaceAll: replace_all
})

// 4. 文件历史快照
if (fileHistoryEnabled()) {
  await fileHistoryTrackEdit(
    updateFileHistoryState,
    absoluteFilePath,
    parentMessage.uuid
  )
}
```

### 版本快照机制

**文件**：`claude-code-src/utils/fileHistory.ts`

```typescript
export function fileHistoryMakeSnapshot(
  updater: (prev: FileHistoryState) => FileHistoryState,
  messageUuid: string
): Promise<void>

export function fileHistoryTrackEdit(
  updater: (prev: FileHistoryState) => FileHistoryState,
  filePath: string,
  messageUuid: string
): Promise<void>
```

### 对 AI 小说编辑器的落地建议

**章节版本保护机制**：

```typescript
// 章节状态
export enum ChapterStatus {
  Draft = 'draft',        // 草稿，可编辑
  Synced = 'synced',       // 已同步，禁止直接覆盖
  Published = 'published', // 已发布，禁止修改
  Archived = 'archived'     // 已归档，仅读
}

// 章节快照
export interface ChapterSnapshot {
  id: string
  chapterId: string
  content: string
  createdAt: Date
  taskId?: string  // 关联的 AI 任务
}

// AI 改写前的版本保护
export async function beforeAIEdit(chapterId: string, taskId: string): Promise<ChapterSnapshot> {
  const chapter = await getChapter(chapterId)
  
  // 检查章节状态
  if (chapter.status !== ChapterStatus.Draft) {
    throw new Error(`Chapter is ${chapter.status}, cannot be modified by AI`)
  }
  
  // 创建版本快照
  const snapshot = await createSnapshot({
    chapterId,
    content: chapter.content,
    taskId
  })
  
  return snapshot
}

// AI 任务取消后的保护
export async function onTaskCancelled(taskId: string, snapshot: ChapterSnapshot): Promise<void> {
  // 恢复快照
  await restoreSnapshot(snapshot.id)
  
  // 标记章节为草稿
  await updateChapter(snapshot.chapterId, {
    status: ChapterStatus.Draft
  })
}
```

---

## 7. 测试结构

### 结论

Claude Code 使用 **Vitest** 作为测试框架，测试文件位于 `__tests__/` 目录或同级的 `*.test.ts` 文件。测试覆盖工具函数、权限逻辑、消息处理等核心功能。

### 测试目录结构

```
claude-code-src/
├── __tests__/
│   ├── permissions/
│   │   ├── permissions.test.ts
│   │   └── sandbox.test.ts
│   ├── tools/
│   │   ├── edit.test.ts
│   │   ├── read.test.ts
│   │   └── write.test.ts
│   └── utils/
│       ├── messages.test.ts
│       └── diff.test.ts
└── utils/
    ├── __tests__/
    │   ├── diff.test.ts
    │   └── format.test.ts
    └── *.test.ts
```

### 测试命令

```bash
# 运行所有测试
bun test

# 运行特定测试文件
bun test src/__tests__/tools/edit.test.ts

# 带覆盖率
bun test --coverage
```

### 对 AI 小说编辑器的落地建议

**建议测试结构**：

```
caiode/src/novel/
├── __tests__/
│   ├── provider/
│   │   ├── fake-agent-provider.test.ts
│   │   └── real-agent-provider.test.ts
│   ├── tools/
│   │   ├── novel-continue.test.ts
│   │   └── novel-branch.test.ts
│   ├── permissions/
│   │   └── tool-whitelist.test.ts
│   └── version-protection.test.ts
```

**关键测试场景**：

```typescript
// 工具白名单测试
describe('Tool Whitelist', () => {
  it('should allow Read tool', async () => {
    const result = await canUseTool(FileReadTool, {}, context)
    expect(result.behavior).toBe('allow')
  })
  
  it('should deny Bash tool', async () => {
    const result = await canUseTool(BashTool, { command: 'ls' }, context)
    expect(result.behavior).toBe('deny')
  })
})

// 版本保护测试
describe('Chapter Version Protection', () => {
  it('should prevent editing synced chapter', async () => {
    const chapter = { id: '1', status: ChapterStatus.Synced }
    await expect(
      beforeAIEdit(chapter.id, 'task-1')
    ).rejects.toThrow('Chapter is synced')
  })
  
  it('should restore snapshot on task cancel', async () => {
    const snapshot = await createSnapshot({ chapterId: '1', content: 'original' })
    await onTaskCancelled('task-1', snapshot)
    const chapter = await getChapter('1')
    expect(chapter.content).toBe('original')
  })
})
```

---

## 8. 对小说编辑器 AgentBridge 的建议

### 结论

基于 Claude Code 的架构，建议小说编辑器采用 **Provider 模式** 实现 Fake/Real Agent 的切换，通过 **工具白名单** 限制 Agent 能力，使用 **Context 封装** 隔离沙箱环境。

### AgentBridge 架构

```typescript
// caiode/src/novel/agent-bridge/
├── types.ts           # AgentBridge 类型定义
├── AgentBridge.ts     # 核心桥接器
├── providers/
│   ├── FakeAgentProvider.ts
│   ├── RealAgentProvider.ts
│   └── ModelGatewayProvider.ts
├── tools/
│   ├── whitelist.ts   # 工具白名单
│   ├── novel-continue.ts
│   ├── novel-branch.ts
│   └── novel-edit.ts
├── sandbox/
│   └── sandbox-context.ts
└── index.ts
```

### 工具白名单设计

```typescript
// tools/whitelist.ts
export const NOVEL_TOOL_WHITELIST = {
  allowed: [
    'Read',
    'Edit', 
    'Write',
    'Glob',
    'Grep',
    'novel_continue',
    'novel_branch',
    'novel_world',
    'novel_character'
  ],
  denied: [
    'Bash',
    'WebFetch',
    'WebSearch',
    'Agent',
    'Task',
    'TaskStop'
  ],
  pathRestrictions: {
    allowed: ['**/novel/**', '**/chapters/**'],
    denied: ['**/.git/**', '**/node_modules/**', '**/*.env']
  }
}
```

### FakeAgentProvider 应该模拟的行为

```typescript
// FakeAgentProvider 模拟内容
const MOCK_RESPONSES = {
  continue: {
    hint: '请续写下一段剧情',
    response: '主角缓缓睁开眼睛，发现自己置身于一个陌生的房间...'
  },
  branch: {
    hint: '创建分支剧情',
    response: '好的，我为你创建了两个分支选项：\n1. 主角选择相信神秘人\n2. 主角保持警惕，选择独自探索'
  },
  world: {
    hint: '构建世界观设定',
    response: '这个世界观设定如下：\n- 时代：蒸汽朋克时代\n- 主要势力：机械公会、贵族联盟、自由行者'
  }
}
```

### 风险点

| 风险 | 缓解措施 |
|---|---|
| 沙箱逃逸 | 严格路径限制 + 权限白名单 |
| 提示词注入 | 输入转义 + 上下文隔离 |
| 数据泄露 | 禁止网络访问 + 日志脱敏 |
| 版本冲突 | 快照机制 + 状态检查 |

---

## 附录：关键文件速查表

| 功能 | 文件路径 |
|---|---|
| Agent 引擎 | `/workspace/caiode/claude-code-src/QueryEngine.ts` |
| Tool 接口 | `/workspace/caiode/claude-code-src/Tool.ts` |
| 工具注册 | `/workspace/caiode/claude-code-src/tools.ts` |
| 权限检查 | `/workspace/caiode/claude-code-src/utils/permissions/permissions.ts` |
| 权限类型 | `/workspace/caiode/claude-code-src/types/permissions.ts` |
| 文件编辑 | `/workspace/caiode/claude-code-src/tools/FileEditTool/FileEditTool.ts` |
| 消息处理 | `/workspace/caiode/claude-code-src/utils/messages.ts` |
| 成本追踪 | `/workspace/caiode/claude-code-src/cost-tracker.ts` |
| 文件历史 | `/workspace/caiode/claude-code-src/utils/fileHistory.ts` |
| 沙箱检查 | `/workspace/caiode/claude-code-src/utils/permissions/filesystem.ts` |

---

## 总结

Claude Code 的 Agent 系统提供了完整的技术参考，包括：

1. **QueryEngine 模式**：可用于封装小说创作专用引擎
2. **Tool + buildTool 模式**：易于扩展小说专用工具
3. **分层权限检查**：适合实现工具白名单
4. **版本快照机制**：保护章节内容不被覆盖

**建议下一步**：
1. 在 `caiode/src/novel/agent-bridge/` 下创建基础骨架
2. 实现 FakeAgentProvider 和工具白名单
3. 添加版本保护测试用例
4. 验证沙箱隔离机制

# Claude Code 提示词处理机制深度分析

> 基于 Claude Code v2.1.88 反编译源码（1902 个 TypeScript/TSX 文件）的提示词（Prompt）处理全流程分析

---

## 一、总体架构概览

Claude Code 的提示词处理采用 **分层组装 + 多级缓存 + 渐进压缩** 的架构，核心数据流如下：

```
┌─────────────────────────────────────────────────────────────────┐
│                    提示词处理全流程                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ 系统提示词构建 │    │ 上下文注入    │    │ 工具Schema构建 │       │
│  │ prompts.ts   │    │ context.ts   │    │ api.ts       │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌──────────────────────────────────────────────────┐           │
│  │         buildEffectiveSystemPrompt()              │           │
│  │         优先级链: override > coordinator >        │           │
│  │         agent > custom > default                  │           │
│  └──────────────────────┬───────────────────────────┘           │
│                         │                                       │
│                         ▼                                       │
│  ┌──────────────────────────────────────────────────┐           │
│  │         splitSysPromptPrefix()                    │           │
│  │         静态/动态分离 → Prompt Cache 优化          │           │
│  └──────────────────────┬───────────────────────────┘           │
│                         │                                       │
│                         ▼                                       │
│  ┌──────────────────────────────────────────────────┐           │
│  │         API 请求构建                              │           │
│  │  system blocks + user context + tool schemas      │           │
│  └──────────────────────┬───────────────────────────┘           │
│                         │                                       │
│                         ▼                                       │
│  ┌──────────────────────────────────────────────────┐           │
│  │         Token 预算管理 & 上下文压缩                │           │
│  │  autoCompact → microCompact → reactiveCompact     │           │
│  └──────────────────────────────────────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、系统提示词构建（System Prompt Assembly）

### 2.1 核心文件

| 文件 | 职责 |
|------|------|
| `src/constants/prompts.ts` | 系统提示词主构建器，定义所有静态/动态段落 |
| `src/constants/systemPromptSections.ts` | 段注册表，管理缓存/重算机制 |
| `src/utils/systemPrompt.ts` | 优先级链，决定最终使用哪套提示词 |
| `src/utils/systemPromptType.ts` | 品牌类型 `SystemPrompt`，防止误用 |
| `src/constants/system.ts` | 系统提示词前缀和归属头 |

### 2.2 静态/动态分离设计

这是 Claude Code 提示词处理最核心的设计之一。系统提示词通过 `SYSTEM_PROMPT_DYNAMIC_BOUNDARY` 标记分为两部分：

```
getSystemPrompt() 返回 string[]:
  ├── [静态段] — 可全局缓存，Prompt Cache 命中率高
  │     ├── getSimpleIntroSection()        — "你是 Claude Code..."
  │     ├── getSimpleSystemSection()       — 系统规则（Markdown格式、工具权限等）
  │     ├── getSimpleDoingTasksSection()   — 任务执行规范
  │     ├── getActionsSection()            — 谨慎执行操作
  │     ├── getUsingYourToolsSection()     — 工具使用指导
  │     ├── getSimpleToneAndStyleSection() — 语气风格
  │     └── getOutputEfficiencySection()   — 输出效率要求
  │
  ├── "__SYSTEM_PROMPT_DYNAMIC_BOUNDARY__"  ← 分隔标记
  │
  └── [动态段] — 通过注册表管理，按需缓存/重算
        ├── session_guidance               — 会话特定指导（缓存）
        ├── memory / loadMemoryPrompt()    — MEMORY.md 记忆（缓存）
        ├── env_info_simple                — 环境信息（缓存）
        ├── language                       — 语言偏好（缓存）
        ├── output_style                   — 输出风格（缓存）
        ├── mcp_instructions               — MCP 服务器指令（⚠️ 不缓存！每次重算）
        ├── scratchpad                     — 临时文件目录说明
        ├── function_result_clearing       — 函数结果清除策略
        ├── summarize_tool_results         — 工具结果摘要提醒
        └── token_budget_instruction       — Token 预算指令（条件性）
```

**设计意图**：静态段在会话期间不变，可以完美命中 Anthropic 的 Prompt Cache（`cache_control: {type: 'ephemeral', scope: 'global'}`）。动态段只在数据变化时重算，MCP 指令因为可能随时变化所以每次都重算。

### 2.3 段注册表机制

```typescript
// systemPromptSections.ts

// 缓存段：计算一次后缓存，直到 /clear 或 /compact 才清除
systemPromptSection(name, compute)

// 易失段：每 turn 重新计算（会破坏 prompt cache，谨慎使用）
DANGEROUS_uncachedSystemPromptSection(name, compute, reason)

// 解析所有段，返回 prompt 字符串数组
resolveSystemPromptSections(sections)

// 清除所有缓存
clearSystemPromptSections()
```

**关键设计**：
- 大部分动态段使用 `systemPromptSection()` 缓存，避免每 turn 重复计算
- 只有 MCP 指令使用 `DANGEROUS_uncachedSystemPromptSection()`，因为 MCP 服务器可能随时添加/移除
- `/clear` 和 `/compact` 命令会调用 `clearSystemPromptSections()` 重置所有缓存

### 2.4 优先级链（Priority Chain）

`buildEffectiveSystemPrompt()` 按以下优先级决定最终系统提示词：

```
优先级 0: overrideSystemPrompt    → 完全替换（loop 模式）
优先级 1: coordinatorSystemPrompt → 协调器模式专用提示词
优先级 2: agentSystemPrompt       → 自定义代理提示词
         ├─ Proactive 模式: 追加到默认提示词之后（不替换）
         └─ 普通模式: 替换默认提示词
优先级 3: customSystemPrompt      → --system-prompt 参数指定
优先级 4: defaultSystemPrompt     → 标准 Claude Code 提示词
+ 始终追加: appendSystemPrompt    → 追加在末尾（override 模式除外）
```

### 2.5 品牌类型保护

```typescript
// systemPromptType.ts
type SystemPrompt = readonly string[] & { __brand: 'SystemPrompt' }

function asSystemPrompt(parts: string[]): SystemPrompt {
  return Object.freeze(parts) as unknown as SystemPrompt
}
```

通过 TypeScript 品牌类型，确保普通字符串数组不会被误当作系统提示词使用，提供编译时类型安全。

---

## 三、上下文注入机制（Context Injection）

### 3.1 三层上下文结构

Claude Code 使用三层上下文注入，各有不同的注入位置和用途：

```
┌─────────────────────────────────────────────────────┐
│ Layer 1: System Prompt Blocks（系统提示词块）         │
│ 位置: API 请求的 system 参数                         │
│ 内容: 核心指令、环境信息、MCP 指令                    │
│ 缓存: global/org scope prompt cache                 │
├─────────────────────────────────────────────────────┤
│ Layer 2: User Context（用户上下文）                   │
│ 位置: 消息数组最前面，作为 user message               │
│ 格式: <system-reminder> XML 标签包裹                 │
│ 内容: CLAUDE.md 内容 + 当前日期                      │
│ 缓存: 随消息一起缓存                                 │
├─────────────────────────────────────────────────────┤
│ Layer 3: System Context（系统上下文）                 │
│ 位置: 系统提示词末尾追加                              │
│ 内容: Git 状态（分支、提交、状态）                    │
│ 缓存: 无独立缓存控制                                 │
└─────────────────────────────────────────────────────┘
```

### 3.2 用户上下文注入（prependUserContext）

```typescript
// api.ts
function prependUserContext(messages, context) {
  return [
    createUserMessage({
      content: `<system-reminder>
As you answer the user's questions, you can use the following context:
# claudeMd
[CLAUDE.md 内容]
# currentDate
Today's date is 2026-03-31.

IMPORTANT: this context may or may not be relevant to your tasks.
You should not respond to this context unless it is highly relevant to your task.
</system-reminder>`,
      isMeta: true,
    }),
    ...messages,
  ]
}
```

**设计要点**：
- 使用 `<system-reminder>` XML 标签（Anthropic 推荐的上下文注入格式）
- 标注 `IMPORTANT: this context may or may not be relevant` 防止模型过度关注
- `isMeta: true` 标记为元消息，不计入用户对话历史

### 3.3 系统上下文追加（appendSystemContext）

```typescript
// api.ts
function appendSystemContext(systemPrompt, context) {
  return [
    ...systemPrompt,
    Object.entries(context)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n'),
  ].filter(Boolean)
}
```

系统上下文直接追加到系统提示词末尾，包含 Git 状态信息。

### 3.4 CLAUDE.md 发现与加载

```
CLAUDE.md 加载优先级（从低到高）:
  1. 托管记忆:    /etc/claude-code/CLAUDE.md
  2. 用户记忆:    ~/.claude/CLAUDE.md
  3. 项目记忆:    CLAUDE.md / .claude/CLAUDE.md / .claude/rules/*.md
  4. 本地记忆:    CLAUDE.local.md

发现策略:
  - 从 CWD 向上遍历到根目录
  - 支持 @include 指令引用其他文件
  - MAX_MEMORY_CHARACTER_COUNT = 40,000 字符上限
```

### 3.5 MEMORY.md 自动记忆

```
MEMORY.md 加载流程:
  1. 读取 MEMORY.md 入口文件
  2. MAX_ENTRYPOINT_LINES = 200 行
  3. MAX_ENTRYPOINT_BYTES = 25,000 字节
  4. 超出限制自动截断
  5. 注入到系统提示词的 'memory' 段（缓存段）
```

---

## 四、工具描述注入（Tool Description Injection）

### 4.1 工具 Schema 构建流程

```
toolToAPISchema(tool, options)
  │
  ├── 1. 查找会话级缓存 (toolSchemaCache)
  │     cacheKey = tool.name 或 tool.name:inputJSONSchema
  │
  ├── 2. 缓存未命中时计算基础 schema:
  │     ├── tool.prompt() → 动态生成工具描述
  │     │     （根据权限上下文、可用工具列表、代理定义动态调整）
  │     ├── zodToJsonSchema() → Zod schema 转 JSON Schema
  │     ├── filterSwarmFieldsFromSchema() → 过滤未启用功能
  │     ├── strict mode → 结构化输出（feature flag 控制）
  │     └── eager_input_streaming → 细粒度流式传输
  │
  ├── 3. 缓存基础 schema（防止 GrowthBook 配置翻转导致 cache 失效）
  │
  └── 4. 添加每请求覆盖:
        ├── defer_loading → 工具搜索延迟加载
        └── cache_control → 缓存控制标记
```

### 4.2 动态工具描述

工具的 `description` 不是静态字符串，而是通过 `tool.prompt()` 动态生成：

```typescript
interface Tool {
  // 动态生成工具描述（注入 prompt）
  description(input, options): string

  // 生成完整的工具 prompt（包含描述和使用说明）
  prompt(options): Promise<string>
}
```

`prompt()` 方法接收当前权限上下文、可用工具列表、代理定义等参数，可以根据运行时状态动态调整工具描述。例如：
- 根据当前权限模式显示/隐藏某些工具能力
- 根据可用的代理列表调整 Agent 工具的描述
- 根据文件系统权限调整文件操作工具的说明

### 4.3 工具权限过滤

```typescript
// tools.ts
getTools(permissionContext)
  ├── Simple 模式: 仅返回 Bash/Read/Edit
  ├── assembleToolPool(): 组合内置工具 + MCP 工具
  └── filterToolsByDenyRules(): 过滤被拒绝规则禁止的工具

// tools.ts - 各模式的工具集合
ALL_AGENT_DISALLOWED_TOOLS    // 所有代理禁止的工具
ASYNC_AGENT_ALLOWED_TOOLS     // 异步代理允许的工具
IN_PROCESS_TEAMMATE_ALLOWED_TOOLS  // 进程内队友额外允许
COORDINATOR_MODE_ALLOWED_TOOLS    // 协调器模式仅允许
```

---

## 五、Prompt Cache 优化

### 5.1 splitSysPromptPrefix — 静态/动态分离

这是 Claude Code Prompt Cache 优化的核心。`splitSysPromptPrefix()` 将系统提示词拆分为多个 block，分别设置不同的缓存范围：

```
模式 1: 全局缓存模式（1P Anthropic，有 boundary marker）
  ┌──────────────────────────────────────────────┐
  │ Block 1: Attribution header  (cacheScope=null) │ ← 不缓存
  │ Block 2: System prompt prefix (cacheScope=null) │ ← 不缓存
  │ Block 3: Static content       (cacheScope='global') │ ← 全局缓存！
  │ Block 4: Dynamic content      (cacheScope=null) │ ← 不缓存
  └──────────────────────────────────────────────┘

模式 2: MCP 工具模式（跳过全局缓存）
  ┌──────────────────────────────────────────────┐
  │ Block 1: Attribution header  (cacheScope=null) │
  │ Block 2: System prompt prefix (cacheScope='org') │ ← 组织级缓存
  │ Block 3: Everything else      (cacheScope='org') │ ← 组织级缓存
  └──────────────────────────────────────────────┘

模式 3: 默认模式（3P 提供商）
  ┌──────────────────────────────────────────────┐
  │ Block 1: Attribution header  (cacheScope=null) │
  │ Block 2: System prompt prefix (cacheScope='org') │
  │ Block 3: Everything else      (cacheScope='org') │
  └──────────────────────────────────────────────┘
```

**关键洞察**：
- Attribution header 包含会话指纹，每次不同，不缓存
- System prompt prefix 是固定的身份声明，可以 org 级缓存
- **静态内容（boundary 之前）使用 global scope 缓存**，跨会话共享，大幅降低成本
- 动态内容（boundary 之后）不缓存，每次重新发送

### 5.2 工具 Schema 缓存

```typescript
// toolSchemaCache.ts
const cache = getToolSchemaCache()
let base = cache.get(cacheKey)
if (!base) {
  // 计算并缓存
  base = { name, description, input_schema, strict, ... }
  cache.set(cacheKey, base)
}
```

**缓存策略**：
- 缓存 key 包含 `tool.name` + `inputJSONSchema`（处理 StructuredOutput 等动态 schema 工具）
- 防止 GrowthBook 配置翻转（如 `tengu_tool_pear`、`tengu_fgts`）导致 prompt cache 失效
- 基础 schema 会话级缓存，per-request overlay（`defer_loading`、`cache_control`）每次重新计算

---

## 六、Token 预算管理

### 6.1 上下文窗口计算

```typescript
// context.ts
getContextWindowForModel(model, betas)
  ├── 默认: 200,000 tokens
  ├── [1m] 后缀模型: 1,000,000 tokens
  ├── Sonnet 4.6 / Opus 4.6: 支持 1M
  └── CLAUDE_CODE_MAX_CONTEXT_TOKENS 环境变量覆盖
```

### 6.2 自动压缩阈值

```typescript
// autoCompact.ts
AUTOCOMPACT_BUFFER_TOKENS = 13,000      // 自动压缩缓冲区
WARNING_THRESHOLD_BUFFER_TOKENS = 20,000 // 警告阈值缓冲区
ERROR_THRESHOLD_BUFFER_TOKENS = 20,000   // 错误阈值缓冲区
MANUAL_COMPACT_BUFFER_TOKENS = 3,000    // 手动压缩缓冲区

getAutoCompactThreshold(model)
  = getEffectiveContextWindowSize(model) - AUTOCOMPACT_BUFFER_TOKENS
  = (contextWindow - maxOutputTokens) - 13,000
```

### 6.3 工具结果大小限制

```typescript
// toolLimits.ts
DEFAULT_MAX_RESULT_SIZE_CHARS = 50,000       // 单个工具结果最大字符数
MAX_TOOL_RESULT_TOKENS = 100,000             // 工具结果最大 token 数
BYTES_PER_TOKEN = 4                          // token 估算比率
MAX_TOOL_RESULTS_PER_MESSAGE_CHARS = 200,000 // 单条消息所有工具结果聚合上限
TOOL_SUMMARY_MAX_LENGTH = 50                 // 工具摘要最大字符长度
```

超出限制时，工具结果会被持久化到磁盘，替换为预览文本。

---

## 七、上下文压缩策略（Context Compaction）

Claude Code 采用 **四级渐进式压缩** 策略：

### 7.1 第一级：微压缩（MicroCompact）

**触发条件**：基于工具结果数量阈值（cached MC）或时间间隔（time-based MC）

**机制**：
```
Cached MicroCompact（缓存编辑模式，不修改本地消息）:
  1. 注册所有 compactable 工具结果（Read/Bash/Grep/Glob/WebSearch/WebFetch/Edit/Write）
  2. 当数量超过 triggerThreshold 时，标记最早的工具结果为待删除
  3. 通过 API 的 cache_edits 机制删除，不破坏 prompt cache
  4. 保留最近 keepRecent 个结果

Time-Based MicroCompact（时间触发模式，直接修改消息）:
  1. 检测距上次 assistant 消息的时间间隔
  2. 超过 gapThresholdMinutes 时触发
  3. 直接将旧工具结果内容替换为 '[Old tool result content cleared]'
  4. 保留最近 N 个结果（至少 1 个）
  5. 重置 cached MC 状态（因为 cache 已失效）
```

**关键设计**：
- Cached MC 使用 API 的 `cache_edits` 机制，**不修改本地消息内容**，不破坏 prompt cache
- Time-based MC 在 cache 已过期时使用，直接修改消息内容
- 系统提示词中告知模型：`SUMMARIZE_TOOL_RESULTS_SECTION` 提醒模型工具结果可能被清除

### 7.2 第二级：自动压缩（AutoCompact）

**触发条件**：token 使用量超过 `autoCompactThreshold`（contextWindow - 13K）

**压缩流程**：
```
autoCompactIfNeeded()
  ├── 1. shouldAutoCompact() — 检查是否需要压缩
  │     ├── 递归保护：session_memory/compact 查询源跳过
  │     ├── Context Collapse 模式下跳过
  │     └── Reactive Compact 模式下跳过
  │
  ├── 2. trySessionMemoryCompaction() — 优先尝试会话记忆压缩
  │     （更轻量，仅裁剪消息，不调用 API）
  │
  └── 3. compactConversation() — 完整压缩
        ├── getCompactPrompt() → 9 段摘要模板
        ├── stripImagesFromMessages() → 移除图片
        ├── 调用 API 生成摘要（max 20K output tokens）
        ├── formatCompactSummary() → 提取 <summary>，移除 <analysis>
        └── getCompactUserSummaryMessage() → 包装为继续会话消息
```

**熔断器机制**：
```typescript
MAX_CONSECUTIVE_AUTOCOMPACT_FAILURES = 3
// 连续 3 次压缩失败后停止重试
// 防止上下文不可恢复时无限重试浪费 API 调用
```

### 7.3 第三级：响应式压缩（ReactiveCompact）

**触发条件**：API 返回 `prompt_too_long` 错误时

**机制**：在 API 报错后被动触发压缩，是自动压缩的安全网。

### 7.4 第四级：历史裁剪（SnipCompact）

**触发条件**：主动裁剪历史消息

**机制**：直接移除最早的消息，释放空间。

### 7.5 压缩提示词模板

压缩使用精心设计的 9 段摘要模板，确保关键信息不丢失：

```
1. Primary Request and Intent    — 用户的所有明确请求
2. Key Technical Concepts         — 技术概念、框架
3. Files and Code Sections        — 文件和代码段（含完整代码片段）
4. Errors and fixes               — 遇到的错误和修复方法
5. Problem Solving                — 已解决的问题和进行中的调试
6. All user messages              — 所有非工具结果的用户消息
7. Pending Tasks                  — 待完成的任务
8. Current Work                   — 当前正在做的工作（精确描述）
9. Optional Next Step             — 下一步（必须与用户最近请求直接相关）
```

**关键设计**：
- 使用 `<analysis>` + `<summary>` 双块结构：`<analysis>` 是模型的思考草稿，`formatCompactSummary()` 会将其剥离，只保留 `<summary>`
- 自动压缩时 `suppressFollowUpQuestions=true`，压缩后不询问用户，直接继续
- Proactive 模式下追加额外指令：告知模型这是自主模式，不要问候用户
- 支持自定义压缩指令（`customInstructions`）

---

## 八、消息格式化与 API 请求构建

### 8.1 消息规范化

```typescript
// query.ts
normalizeMessagesForAPI(messages)
  ├── 将内部 Message 格式转换为 API 格式
  ├── 处理 tool_use / tool_result 配对
  └── 过滤空内容消息
```

### 8.2 归属头（Attribution Header）

```typescript
// system.ts
getAttributionHeader(fingerprint)
  → "x-anthropic-billing-header: version=2.1.88;entrypoint=cli;..."
```

包含版本号、入口点、客户端认证占位符、工作负载类型，用于计费和监控。

### 8.3 完整 API 请求结构

```
API Request:
  ├── system: [
  │     { type: 'text', text: 'x-anthropic-billing-header: ...', cache_control: null },
  │     { type: 'text', text: 'You are Claude Code...', cache_control: null },
  │     { type: 'text', text: '[静态段内容...]', cache_control: { type: 'ephemeral', scope: 'global' } },
  │     { type: 'text', text: '[动态段内容...]', cache_control: null },
  │   ]
  ├── messages: [
  │     { role: 'user', content: '<system-reminder>...' },  // 用户上下文
  │     { role: 'user', content: '用户的实际消息' },
  │     { role: 'assistant', content: [...] },
  │     ...
  │   ]
  └── tools: [
        { name: 'Read', description: '...', input_schema: {...}, cache_control: {...} },
        { name: 'Bash', description: '...', input_schema: {...}, defer_loading: true },
        ...
      ]
```

---

## 九、子代理提示词增强

当创建子代理（Task tool）时，系统提示词会被增强：

```typescript
// prompts.ts
enhanceSystemPromptWithEnvDetails(existingSystemPrompt, model, ...)
  ├── 添加绝对路径要求（子代理不继承父代理的 CWD 感知）
  ├── 添加子代理注意事项
  └── 注入 DEFAULT_AGENT_PROMPT 默认代理提示词
```

---

## 十、关键设计模式总结

### 10.1 静态/动态分离 + Prompt Cache

| 层级 | 缓存策略 | 命中率影响 |
|------|---------|-----------|
| Attribution header | 不缓存 | 每次重发 |
| System prompt prefix | org/global | 高命中率 |
| 静态段（intro/system/tools/tone） | global scope | **最高命中率** |
| 动态段（env/mcp/memory） | 不缓存或 org scope | 中等命中率 |
| 工具 Schema | 会话级缓存 | 高命中率 |
| 用户消息 | 随 prompt cache | 取决于前缀匹配 |

### 10.2 注册表模式管理动态内容

- `systemPromptSection()` — 缓存段，一次计算多次使用
- `DANGEROUS_uncachedSystemPromptSection()` — 易失段，每 turn 重算
- `clearSystemPromptSections()` — `/clear` 和 `/compact` 时重置

### 10.3 品牌类型保护

```typescript
type SystemPrompt = readonly string[] & { __brand: 'SystemPrompt' }
```

编译时防止普通字符串数组被误当作系统提示词。

### 10.4 四级渐进压缩

```
微压缩 (Cached MC)     → 零成本，cache_edits API
    ↓ 失败
时间微压缩 (Time-based) → 低成本，直接修改消息
    ↓ 失败
自动压缩 (AutoCompact)  → 中成本，调用 API 生成摘要
    ↓ 失败
响应式压缩 (Reactive)   → 兜底，API 报错后触发
```

### 10.5 熔断器模式

```typescript
MAX_CONSECUTIVE_AUTOCOMPACT_FAILURES = 3
// 连续失败 3 次后停止重试，避免无限循环
```

### 10.6 动态工具描述

工具描述不是静态字符串，而是 `tool.prompt()` 动态生成，可以根据权限上下文、可用工具列表等运行时状态调整。

---

## 十一、对织梦笔的借鉴建议

### 11.1 提示词架构设计

**借鉴点**：采用静态/动态分离的系统提示词架构

织梦笔可以设计类似的分层提示词系统：
```
[静态段 — 全局缓存]
  ├── 小说编辑器身份和核心指令
  ├── 写作风格规范
  ├── 工具使用指导（大纲/角色/时间线/分支等）
  └── 输出格式要求

[DYNAMIC_BOUNDARY]

[动态段 — 按需缓存]
  ├── 当前项目信息（小说名、类型、字数目标）
  ├── 角色设定摘要（从知识库动态加载）
  ├── 已写章节概要（上下文窗口管理）
  ├── 当前分支状态
  ├── 一致性检查结果
  └── 用户自定义写作指令（类似 CLAUDE.md）
```

### 11.2 项目级写作指令（类似 CLAUDE.md）

**借鉴点**：CLAUDE.md 的多层发现和注入机制

织梦笔可以实现 `NOVEL.md` 或 `写作指南.md`：
```
加载优先级:
  1. 全局写作偏好: ~/.dreamweaver/NOVEL.md
  2. 项目写作指南: 项目根目录/NOVEL.md
  3. 章节级指令: 当前章节/.novel.md
  4. 场景级指令: 当前场景/.scene.md

支持 @include 引用其他文件（如世界观设定、角色卡等）
```

### 11.3 上下文压缩策略

**借鉴点**：四级渐进压缩 + 9 段摘要模板

织梦笔的长篇小说场景需要专门的压缩策略：
```
压缩摘要模板（小说写作定制版）:
  1. 核心剧情线        — 主要故事弧和当前进展
  2. 角色状态          — 各角色的当前位置、情感状态、关系变化
  3. 伏笔与悬念        — 已埋下的伏笔和待回收的悬念
  4. 世界观状态        — 当前世界观的关键设定和变化
  5. 写作风格记录      — 已建立的叙事风格和语言特色
  6. 分支状态          — 各分支的分歧点和当前走向
  7. 用户反馈          — 用户对写作方向的调整意见
  8. 当前场景          — 正在写的场景的精确状态
  9. 下一步计划        — 接下来要写的内容
```

### 11.4 工具描述动态化

**借鉴点**：`tool.prompt()` 根据运行时上下文动态生成工具描述

织梦笔的 AI 工具描述可以根据当前小说状态动态调整：
- 角色管理工具：根据当前场景涉及的角色动态调整描述
- 时间线工具：根据当前时间点高亮相关事件
- 一致性检查工具：根据最近的写作内容聚焦相关检查项

### 11.5 Prompt Cache 优化

**借鉴点**：`splitSysPromptPrefix()` 的静态/动态分离 + scope 控制

织梦笔使用多 AI 模型时，不同模型的 prompt cache 策略可能不同，需要：
- 为每个模型适配缓存策略
- 静态段使用最高级别缓存（如 global scope）
- 动态段使用组织级缓存或不缓存
- 工具 schema 会话级缓存

### 11.6 Token 预算管理

**借鉴点**：自动压缩阈值 + 熔断器 + 工具结果大小限制

长篇小说场景的 token 管理更加关键：
- 设置合理的自动压缩阈值（小说上下文通常比代码上下文更难压缩）
- 角色设定、世界观等参考材料使用 RAG 按需检索，而非全量注入
- 章节内容使用滑动窗口 + 摘要的方式管理
- 设置工具结果大小限制（如单次生成不超过 4000 字）

---

## 附录：核心源文件索引

| 文件路径 | 核心职责 |
|---------|---------|
| `src/constants/prompts.ts` | 系统提示词主构建器 |
| `src/constants/systemPromptSections.ts` | 段注册表（缓存/重算） |
| `src/constants/system.ts` | 系统提示词前缀和归属头 |
| `src/constants/messages.ts` | 消息常量 |
| `src/constants/tools.ts` | 工具权限常量 |
| `src/constants/toolLimits.ts` | 工具结果大小限制 |
| `src/utils/systemPrompt.ts` | 优先级链（buildEffectiveSystemPrompt） |
| `src/utils/systemPromptType.ts` | SystemPrompt 品牌类型 |
| `src/utils/api.ts` | splitSysPromptPrefix、toolToAPISchema、prependUserContext |
| `src/utils/toolSchemaCache.ts` | 工具 schema 会话级缓存 |
| `src/context.ts` | getUserContext、getSystemContext |
| `src/utils/claudemd.ts` | CLAUDE.md 发现和加载 |
| `src/memdir/memdir.ts` | MEMORY.md 自动记忆 |
| `src/QueryEngine.ts` | 查询引擎（submitMessage） |
| `src/query.ts` | 核心查询循环 |
| `src/services/compact/prompt.ts` | 压缩提示词模板 |
| `src/services/compact/autoCompact.ts` | 自动压缩触发和执行 |
| `src/services/compact/microCompact.ts` | 微压缩（cached + time-based） |
| `src/services/compact/compact.ts` | 完整压缩逻辑 |
| `src/services/tokenEstimation.ts` | Token 估算 |
| `src/cost-tracker.ts` | 费用追踪 |
| `src/utils/analyzeContext.ts` | 上下文分析（UI 展示用） |
| `src/tools.ts` | 工具注册表 |
| `src/Tool.ts` | 工具类型定义 |

# Claude Code Harness 决策深度分析

> 从 System Prompt、权限、记忆、压缩、协作五个维度，拆解 Claude Code 围绕模型 API 的工程基础设施设计决策

---

## 什么是 Harness

> "Claude Code is about 500K lines of TypeScript. The actual API call is maybe 200 of them. **Everything else is the harness.**"

Harness 不是某个模块，而是**所有围绕模型 API 调用的工程决策的总称**。本文从五个维度拆解这些决策。

---

## 一、System Prompt Harness

### 1.1 DYNAMIC_BOUNDARY — 缓存碎片化的修复

**决策**：在系统提示词数组中插入 `__SYSTEM_PROMPT_DYNAMIC_BOUNDARY__` 标记，将内容分为静态（可全局缓存）和动态（会话特定）两部分。

**为什么这么做**：

```typescript
/**
 * Session-variant guidance that would fragment the cacheScope:'global'
 * prefix if placed before SYSTEM_PROMPT_DYNAMIC_BOUNDARY. Each conditional
 * here is a runtime bit that would otherwise multiply the Blake2b prefix
 * hash variants (2^N). See PR #24490, #24171 for the same bug class.
 */
```

**生产事故痕迹**：每个放在 boundary 前的运行时条件位都会让 Blake2b 哈希变体指数级增长（2^N），导致全局缓存命中率暴跌。这是被真实 bug 逼出来的设计。

**三文件联动协议**：
```
prompts.ts → 产出标记
    ↓
api.ts (splitSysPromptPrefix) → 消费标记，分割为 3-4 个 block
    ↓
claude.ts (buildSystemPromptBlocks) → 映射为 API cache_control blocks
```

### 1.2 三种缓存分割模式

| 模式 | 触发条件 | Block 结构 | 缓存策略 |
|------|---------|-----------|---------|
| **Global Cache** | 有 boundary marker + 无 MCP 工具 | 4 blocks | attribution(null) + prefix(null) + **static(global)** + dynamic(null) |
| **Org Cache** | 有 MCP 工具 或 3P 提供商 | 3 blocks | attribution(null) + prefix(org) + rest(org) |
| **Default** | boundary 缺失 | 3 blocks | attribution(null) + prefix(org) + rest(org) |

**关键洞察**：
- Attribution header **永远不缓存**（包含 fingerprint，每请求不同）
- Static 段使用 **global scope**（跨用户共享，~3000 tokens）
- MCP 工具存在时退化为 org 级缓存（per-user 动态内容）

### 1.3 工具 Schema 两层缓存

**决策**：会话级缓存基础 schema + 每请求覆盖层

```typescript
// Session-stable base: name, description, input_schema, strict
let base = cache.get(cacheKey)
if (!base) { /* compute and cache */ }

// Per-request overlay: defer_loading, cache_control
const schema = {
  name: base.name,
  description: base.description,
  input_schema: base.input_schema,
  ...(base.strict && { strict: true }),
}
```

**为什么这么做**：

```
工具 schema 在 API 请求中位于位置 2（系统提示词之前），
任何字节级变化都会 bust 整个 ~11K token 的工具块以及下游所有内容。
```

**生产事故痕迹**：

```
StructuredOutput 实例共享名称 'StructuredOutput' 但携带不同 schema。
仅用工具名做 key 导致返回错误 schema，错误率从 5.4% 飙升到 51%。
修复：cacheKey 改为 `${tool.name}:${jsonStringify(tool.inputJSONSchema)}`
```

### 1.4 Beta Header 的 Sticky-on Latch

**决策**：AFK mode、fast mode、cache editing 等 beta header 一旦首次发送就锁存，会话内不再关闭。

```
Mid-session overage flips 会 bust 服务端 prompt cache (~20K tokens per flip)。
选择"只开不关"策略，避免 ~50-70K token 的缓存 bust 成本。
```

### 1.5 cache_reference 的精确放置

**决策**：每个请求只在最后一个消息放置 cache_control marker。

```
Mycro 的 turn-to-turn 驱逐策略会释放不在 cache_store_int_token_boundaries
中的缓存位置。两个 marker 会导致倒数第二个位置被保护但永远不会被恢复，
浪费 KV 缓存空间。
```

### 1.6 1h TTL 的会话级锁存

**决策**：1h TTL 资格在首次评估后锁存到 bootstrap state，整个会话不再变化。

**生产事故**：用户在会话中途从正常额度切换到 overage，TTL 变化导致缓存失效，每个 flip 浪费 ~20K token。

### 1.7 Ant-only 代码的 DCE 模式

```typescript
// DCE: `process.env.USER_TYPE === 'ant'` is build-time --define. It MUST be
// inlined at each callsite (not hoisted to a const) so the bundler can
// constant-fold it to `false` in external builds and eliminate the branch.
```

**决策**：`process.env.USER_TYPE === 'ant'` 必须在每个调用点内联，不能提取为常量。

**为什么**：如果提取为 `const isAnt = ...`，打包器可能无法在编译期确定其值，导致 ant-only 的提示词文本（内部模型名称、Slack channel ID、false-claims 缓解指令等）泄露到外部构建中。

### 1.8 Attestation 同长替换

```typescript
// cch=00000 placeholder is overwritten by Bun's HTTP stack with attestation token
const cch = feature('NATIVE_CLIENT_ATTESTATION') ? ' cch=00000;' : ''
```

**决策**：使用 `cch=00000` 作为占位符，Bun 的原生 HTTP 栈在序列化后、发送前找到并替换零值。

**工程考量**：同长替换避免 Content-Length 变化和缓冲区重分配。在热路径上的极致性能优化。

---

## 二、权限 Harness

### 2.1 Fail-closed 熔断器

**决策**：分类器在所有异常情况下都返回 `shouldBlock: true`。

```typescript
// 解析失败 → block
if (stage1Block === null) {
  return { shouldBlock: true, reason: 'Classifier stage 1 unparseable - blocking for safety' }
}
// API 错误 → block
// 用户中断 → block
// transcript 太长 → block
```

**为什么**：误报（阻止了安全操作）的代价远低于漏报（允许了危险操作）。用户可以手动批准被阻止的操作。

### 2.2 两阶段 XML 分类器

**决策**：第一阶段用 64 tokens 做快速 yes/no，只有阻止时才启动第二阶段（4096 tokens 完整推理）。

**工程考量**：大多数操作是安全的，第一阶段就能放行。两个阶段共享相同的系统提示词，受益于 prompt caching。

**生产事故**：

```
adaptive thinking 消耗了过多 token，导致 <block> 标签还没生成就触发了 max_tokens，
空响应被解析为"不可解析"→ 安全命令被阻止。
修复：对 alwaysOnThinking 模型增加 2048 token headroom。
```

### 2.3 权限拒绝 → tool_result 反馈

**决策**：权限拒绝不是简单地阻止，而是作为 `tool_result` 反馈给模型。

```
分类器 shouldBlock: true
    ↓ yoloClassifier.ts 返回 reason
interactiveHandler.ts
    ↓ cancelAndAbort(feedback, undefined, contentBlocks)
    ↓ 生成 tool_result content_block
claude.ts (query loop)
    ↓ tool_result 作为 user message 的一部分发回模型
模型看到拒绝原因 → 自动调整行为
```

### 2.4 多竞态者模式（Multi-racer Pattern）

**决策**：最多 5 个竞态者可以解决同一个权限请求，第一个 `claim()` 成功的胜出。

```
Racer 1: 本地用户交互（onAllow/onReject）
Racer 2: Bridge 响应（CCR claude.ai）
Racer 3: Channel 权限中继（Telegram, iMessage）
Racer 4: 权限 hooks
Racer 5: Bash 分类器检查
```

### 2.5 危险权限剥离与恢复

**决策**：进入 auto mode 时剥离危险权限（`Bash(*)`, `Bash(python:*)`, `Agent(*)`），退出时恢复。

**为什么**：如果用户有 `Bash(python:*)` 的 allow 规则，在 auto mode 下会绕过分类器直接允许任意 python 命令执行。

### 2.6 异步权限检查的竞态安全

**决策**：`verifyAutoModeGateAccess` 返回变换函数而非预计算结果。

```typescript
// 返回 transform 函数（而非预计算 context），让调用者在
// setAppState(prev => transformFn(prev)) 中应用，确保使用最新 context。
// 预计算会捕获过期快照：异步 GrowthBook 等待期间用户可能 Shift+Tab 切换模式。
```

### 2.7 复合命令死规则问题

**生产事故**：

```
用户在 settings.local.json 中累积了 150+ 永远不会再次匹配的死规则，
因为同步启发式对复合命令生成的前缀（如 `cd src:*`）是错误的。
修复：后端 tree-sitter 分割后的逐子命令分析优先于同步前缀启发式。
```

### 2.8 Shimmer 动画的性能隔离

**决策**：将 20fps shimmer 动画提取到独立组件。

```
之前：useShimmerAnimation 在 535 行的 Inner 组件内，
每 50ms tick 重渲染整个对话框（PermissionDialog + Select + 所有子组件），
持续 1-3 秒（分类器典型耗时）。
```

### 2.9 Transcript 格式安全

**决策**：使用 JSONL 格式（`{"Bash":"ls"}`）而非文本前缀格式（`Bash ls`）。

```
JSON 转义确保换行符被转义为 \n，无法逃逸出 JSON 字符串上下文。
防止 prompt 注入：恶意构造的输入无法伪造 User: ... 行来操纵分类器。
```

### 2.10 Bundled-skills 的随机 nonce 防护

```typescript
// SECURITY: 每 16 字节随机 nonce 是主要防御。
// uid、VERSION、skill name 都是公开信息，没有 nonce 的话，
// 本地攻击者可以在共享 /tmp 上预创建目录树。
const nonce = randomBytes(16).toString('hex')
return join(getClaudeTempDir(), 'bundled-skills', MACRO.VERSION, nonce)
```

---

## 三、记忆 Harness

### 3.1 MEMORY.md 双重截断

**决策**：行数上限 200 行 + 字节上限 25,000 字节。

```
~125 chars/line at 200 lines. At p97 today;
catches long-line indexes that slip past the line cap (p100 observed: 197KB under 200 lines).
```

**生产事故**：p100 观测到 197KB 的极端长行索引（行数在限制内但单行极长）。

### 3.2 记忆老化 — 最严重的设计缺陷

**生产事故**：

```
用户报告：过期的记忆包含 file:line 引用，代码已变更但模型仍将其作为事实断言。
引用格式反而让过期声明显得更权威。
修复：>1 天的记忆附加 <system-reminder> 过期警告。
```

### 3.3 记忆类型 — Eval 驱动的迭代

```
H1 eval: 0/2 → 3/3 — "Before recommending from memory" 标题比
"Trusting what you recall" 效果好 3 倍。

H5 eval: 位置很重要，作为独立 section 比作为 bullet 效果好。

H6 eval: "ignore" 指令需要显式命名反模式。
用户说"ignore memory about X" → Claude 读取代码正确但添加
"not Y as noted in memory" — 把"ignore"当成了"acknowledge then override"。
```

### 3.4 自动记忆提取 — Forked Agent 模式

**决策**：使用 `runForkedAgent` 创建完美分叉，共享父对话的 prompt cache。

**关键设计**：
- **互斥**：主 agent 已写入记忆文件时，后台提取器跳过该回合
- **重叠合并**：正在提取时到达的请求暂存（stash），当前提取完成后执行尾部提取
- **最大 5 回合**：防止验证兔子洞消耗回合
- **工具沙箱**：Read/Grep/Glob 无限制；Bash 仅只读；Edit/Write 仅限记忆目录内

### 3.5 会话记忆 — 双重阈值触发

```typescript
const shouldExtract =
  (hasMetTokenThreshold && hasMetToolCallThreshold) ||
  (hasMetTokenThreshold && !hasToolCallsInLastTurn)
```

**决策**：token 阈值是硬性要求，即使工具调用阈值满足也必须等 token 阈值。

### 3.6 记忆路径安全

```typescript
// SECURITY: projectSettings (.claude/settings.json committed to the repo)
// is intentionally excluded — 恶意仓库可以设置 autoMemoryDirectory: "~/.ssh"
// 获得对敏感目录的静默写入权限。
```

---

## 四、压缩 Harness

### 4.1 四级压缩体系

| 级别 | 名称 | 触发条件 | 修改消息 | API 调用 | 成本 |
|------|------|---------|---------|---------|------|
| L1 | Cached Microcompact | 工具结果数量超阈值 | 否（cache_edits） | 否 | 零 |
| L2 | Time-based Microcompact | 距上次 assistant >60min | 是（清空内容） | 否 | 低 |
| L3 | Session Memory Compact | autoCompact 阈值 + 记忆非空 | 是（替换消息） | 否 | 低 |
| L4 | Full Compact | autoCompact 阈值 + L3 不可用 | 是（摘要替换） | **是** | 高 |

**选择逻辑**：

```
microcompactMessages() 被调用
  │
  ├─ L2 time-based 触发？（缓存已冷）
  │   YES → 清空旧工具结果，重置 cached MC 状态，返回
  │   NO  → 继续
  │
  ├─ L1 cached MC 可用？（ant-only）
  │   YES → 生成 cache_edits，返回
  │   NO  → 返回未修改
  │
  （后续在 query loop 中）
  │
  ├─ autoCompactIfNeeded() 被调用
  │   ├─ L3 session memory compact 可用？
  │   │   YES → 用会话记忆替换旧消息
  │   │   NO  → 继续
  │   └─ L4 full compact（API 调用生成摘要）
```

### 4.2 `<analysis>` + `<summary>` 双块结构

**决策**：analysis 是草稿本（提高摘要质量），summary 是最终输出。

```typescript
// <analysis> 块是草稿本，formatCompactSummary() 在注入上下文前剥离，
// 不占用上下文 token。
```

**生产事故**：

```
Sonnet 4.6+ adaptive-thinking 模型有 2.79% 的概率尝试工具调用（vs 4.5 的 0.01%），
导致压缩失败回退。
修复：增加 NO_TOOLS_PREAMBLE 双重防护。
```

### 4.3 熔断器 — 数据驱动的决策

```typescript
// BQ 2026-03-10: 1,279 sessions had 50+ consecutive failures (up to 3,272)
// in a single session, wasting ~250K API calls/day globally.
const MAX_CONSECUTIVE_AUTOCOMPACT_FAILURES = 3
```

**为什么是 3**：BigQuery 分析发现 1,279 个会话有 50+ 次连续失败（最高 3,272 次），每天浪费约 250K API 调用。

### 4.4 工具结果大小限制

```typescript
DEFAULT_MAX_RESULT_SIZE_CHARS = 50_000       // 单个工具结果
MAX_TOOL_RESULT_TOKENS = 100_000             // ~400KB 文本
MAX_TOOL_RESULTS_PER_MESSAGE_CHARS = 200_000 // 单条消息聚合
BYTES_PER_TOKEN = 4                          // 估算比率
```

**溢出处理**：超出限制时持久化到磁盘，模型收到预览 + 文件路径。

### 4.5 Session Memory Compact — 无 API 调用的压缩

**决策**：直接使用已有的会话记忆文件内容作为摘要，不调用 LLM。

**关键约束**：
- 最小保留：10,000 token + 5 条含文本块的消息
- 最大保留：40,000 token 硬上限
- 工具对保护：不拆分 tool_use/tool_result 对和 thinking 块

**生产事故**：

```
流式传输将同一 message.id 的不同内容块（thinking、tool_use）拆分为独立消息，
压缩时的 startIndex 可能落在中间，导致孤立的 tool_result 引用不存在的 tool_use → API error。
修复：adjustIndexToPreserveAPIInvariants()
```

### 4.6 Context Collapse — 可逆压缩

**决策**：压缩记录以 `ContextCollapseCommitEntry` 持久化，可以**选择性地撤销**。

```typescript
type ContextCollapseCommitEntry = {
  type: 'marble-origami-commit'
  sessionId: UUID
  collapseId: string           // 16位折叠 ID
  summaryContent: string       // 完整折叠标记字符串
  summary: string              // 纯文本摘要
  firstArchivedUuid: string    // 归档消息起始边界
  lastArchivedUuid: string     // 归档消息结束边界
}
```

**可逆性关键**：UUID 边界追踪 + 完整摘要保留 + 有序提交链（commit B 可引用 commit A 的摘要）。

### 4.7 Prompt Cache 共享的压缩 Fork

**决策**：压缩请求默认使用 forked agent 复用主对话的缓存前缀。

```
实验确认 false 路径 98% cache miss，
消耗 ~0.76% 的全舰队 cache_creation。
```

---

## 五、协作 Harness

### 5.1 协调器模式 — 最小权限

**决策**：协调器只保留 4 个工具（TeamCreate、TeamDelete、SendMessage、SyntheticOutput）。

```typescript
const INTERNAL_WORKER_TOOLS = new Set([
  TEAM_CREATE_TOOL_NAME,
  TEAM_DELETE_TOOL_NAME,
  SEND_MESSAGE_TOOL_NAME,
  SYNTHETIC_OUTPUT_TOOL_NAME,
])
```

**为什么**：协调器的核心职责是任务分配和结果汇总，不应直接执行文件操作。

### 5.2 三层权限过滤体系

```
第一层: ALL_AGENT_DISALLOWED_TOOLS — 所有代理禁止
  ├── TaskOutput（防止递归读取任务输出）
  ├── ExitPlanMode（主线程 UI 抽象）
  ├── AskUserQuestion（子代理不能直接与用户交互）
  ├── TaskStop（需要主线程任务状态）
  └── AgentTool（外部用户，防止无限递归）

第二层: ASYNC_AGENT_ALLOWED_TOOLS — 异步代理白名单
  └── Read, Edit, Write, Bash, Grep, Glob, WebSearch...

第三层: COORDINATOR_MODE_ALLOWED_TOOLS — 协调器模式
  └── Agent, TaskStop, SendMessage, SyntheticOutput
```

**关键安全设计**：Plan mode 优先级高于 bypass permissions。即使父会话有 `--dangerously-skip-permissions`，子代理需要 plan mode 时不继承。

### 5.3 多代理生成 — 三种后端策略

```
策略 1: In-Process（优先）
  → AsyncLocalStorage 在同一 Node.js 进程中运行
  → 避免进程间通信开销

策略 2: 面板后端检测 + 回退
  → tmux/iTerm2 不可用时自动回退到 In-Process

策略 3: tmux/iTerm2 Split-Pane
  → Leader 在左，Teammates 在右
```

### 5.4 Bridge — 指数退避轮询 + 心跳双通道

**决策**：满容量时切换到心跳模式，避免无意义的轮询。

```typescript
const DEFAULT_BACKOFF: BackoffConfig = {
  connInitialMs: 2_000,    // 连接错误初始退避
  connCapMs: 120_000,       // 最大退避 2 分钟
  connGiveUpMs: 600_000,    // 放弃阈值 10 分钟
  generalInitialMs: 500,    // 一般错误初始退避
  generalCapMs: 30_000,     // 最大退避 30 秒
}
```

### 5.5 JWT 认证 — Proactive Refresh + 竞争控制

**决策**：JWT 过期前 5 分钟主动刷新，使用同步互斥防止双重 epoch 递增。

```
Laptop Wake 竞争：
  笔记本休眠后唤醒时，proactive timer 和 SSE 401 几乎同时触发。
  authRecoveryInFlight 在任何 await 之前同步设置，确保只有一个路径执行。
```

### 5.6 Token 隔离

**决策**：子进程不继承 bridge 的 OAuth token，使用独立的 session access token。

```typescript
env: {
  CLAUDE_CODE_OAUTH_TOKEN: undefined,  // 剥离 bridge OAuth token
  CLAUDE_CODE_SESSION_ACCESS_TOKEN: opts.accessToken,  // 独立 token
}
// JWT 通过闭包传递，不写入 process.env（防止 MCP 服务器读取）
```

### 5.7 FlushGate — 消息顺序保证

**决策**：初始历史 flush 期间，实时消息必须排队等待。

```
确保服务器按 [history..., live...] 顺序接收。
Transport 重建期间也启动 FlushGate，防止消息在旧 epoch 上静默丢失。
```

### 5.8 QueryGuard — 串行执行状态机

```typescript
class QueryGuard {
  private _status: 'idle' | 'dispatching' | 'running' = 'idle'
  
  reserve(): boolean {        // idle → dispatching
  tryStart(): number | null {  // dispatching → running
  end(generation: number): boolean {  // running → idle
}
```

**Generation 计数器**：解决异步取消的竞态——被取消查询的 `finally` 块中 `end()` 调用因 generation 不匹配而被忽略。

### 5.9 会话持久化 — 非对称设计

```typescript
// 用户消息：同步写入（await）→ 确保可恢复
// 助手消息：异步写入（fire-and-forget）→ 不阻塞响应
```

**生产事故**：

```
有人因为进程在用户按回车和 API 响应之间被杀死而丢失了会话。
修复：用户消息同步持久化，助手消息异步持久化。
```

---

## 六、Harness 决策的共性模式

### 6.1 数据驱动迭代

几乎所有关键决策都有 BigQuery 数据或 A/B eval 结果支撑：

| 决策 | 数据来源 |
|------|---------|
| 熔断器阈值 = 3 | BQ: 1,279 会话 50+ 连续失败，250K API 调用/天 |
| 记忆提示词措辞 | H1 eval: 0/2 → 3/3（标题措辞 3x 提升） |
| Schema cache key | PR#25424: 错误率 5.4% → 51% |
| 压缩 NO_TOOLS_PREAMBLE | Sonnet 4.6: 2.79% 工具调用率 vs 4.5 的 0.01% |
| 复合命令前缀 | GH#11380: 用户累积 150+ 死规则 |
| 1h TTL 锁存 | mid-session overage flip: ~20K token/flip |
| Cache fork | false 路径 98% miss, 0.76% 全舰队 cache_creation |

### 6.2 防御性编程

- **熔断器**：3 次连续压缩失败、10 次连续认证失败
- **PTL 重试**：压缩请求本身 hit prompt-too-long 时截断头部重试（最多 3 次）
- **互斥锁**：`authRecoveryInFlight` 同步设置、`inProgress` 标志
- **递归防护**：querySource 检查、子代理不能生成子代理
- **工具对保护**：不拆分 tool_use/tool_result 对

### 6.3 生产事故驱动的设计

几乎所有精妙设计都是被真实 bug 逼出来的：

| 设计 | 事故 |
|------|------|
| DYNAMIC_BOUNDARY | Blake2b 哈希碎片化（PR #24490） |
| 两层 Schema 缓存 | StructuredOutput 51% 错误率（PR #25424） |
| 1h TTL 锁存 | mid-session overage flip |
| 非对称持久化 | 进程杀死丢失会话 |
| 记忆老化警告 | 过期 file:line 引用被断言为事实 |
| JSONL Transcript | prompt 注入防护 |
| 随机 nonce | /tmp 预创建攻击 |
| QueryGuard Generation | 异步取消竞态 |
| adjustIndexToPreserveAPIInvariants | 流式传输消息拆分 |

---

## 七、对织梦笔的启示

### 7.1 核心原则

> **Harness 的本质是在模型 API 之外建立一层工程基础设施，让模型的行为可控、可观测、可恢复。**

Claude Code 的经验表明：
1. **缓存是最贵的资源** — 每个 cache bust 的成本是 20-70K tokens
2. **安全默认 fail-closed** — 误报的代价远低于漏报
3. **所有设计最终都会被生产事故验证** — 提前设计防御机制
4. **数据驱动迭代** — 用 BigQuery 和 A/B eval 验证每个决策
5. **非对称设计** — 用户输入同步持久化，AI 输出异步持久化

### 7.2 织梦笔应借鉴的 Harness 决策

| Claude Code 决策 | 织梦笔适配 |
|-----------------|-----------|
| DYNAMIC_BOUNDARY 缓存分割 | 写作风格/题材规则静态缓存，章节内容动态注入 |
| 两层 Schema 缓存 | AI 工具描述会话级缓存 + 每请求覆盖 |
| Fail-closed 分类器 | 一致性检查默认阻止，用户可手动放行 |
| 权限拒绝反馈 | 一致性冲突反馈给 AI，自动调整写作策略 |
| 四级压缩 | 章节摘要（无 API）→ 场景压缩 → 自动压缩 → 紧急压缩 |
| 记忆老化警告 | 过期角色设定/情节信息标注"可能已变更" |
| 非对称持久化 | 用户编辑同步保存，AI 生成异步保存 |
| QueryGuard 串行执行 | AI 操作队列串行执行，防止并发冲突 |

# NovelForge 工作流优化可行性评估

**借鉴 Claude Code 泄露源码特性，优化 OpenCode 二次开发工作流**

| 项目 | 内容 |
|---|---|
| 文档类型 | 技术可行性评估 |
| 创建日期 | 2026-06-12 |
| 评估对象 | OpenCode v1.17.3 + Claude Code v2.1.88 |

---

## 执行摘要

2026 年 3 月，Claude Code v2.1.88 的 npm 包意外泄露了约 512,000 行 TypeScript 源码，暴露了其内部的任务编排引擎、Hook 系统、多 Agent 协调机制和持久化记忆架构。这些机制代表了当前 AI Agent 工具的最高工程水平。

本评估报告系统分析了 Claude Code 泄露源码中的 7 大核心机制，逐一评估其在 OpenCode 基础上的复现可行性，并针对 NovelForge（AI 小说编辑器）的具体场景设计了 5 项工作流优化方案。

> **核心结论**：在 7 项 Claude Code 核心机制中，**5 项可在 OpenCode 基础上以中低难度实现**（Hook 增强、StreamingToolExecutor、Git Worktree 隔离、Daily-Log 记忆、Named Subagents），2 项需要较高投入（Ultraplan 远程卸载、Agent Teams 对等协作）。建议按"高价值低难度优先"原则分阶段实施。

---

## Claude Code 核心机制解析

### 机制一：Hook 系统（PreToolUse / PostToolUse / PermissionDenied）

Claude Code 的 Hook 系统支持 12 种生命周期事件，通过 stdin 接收 JSON、stdout 返回 JSON、exit code 控制行为。

**PreToolUse Hook** 在工具执行前触发，支持四种 handler 类型（command / HTTP / prompt / agent），可通过 exit code 控制流程：exit 0 允许执行，exit 2 阻断操作，或返回结构化 JSON（`{"decision": "allow/deny/defer"}`）。**PermissionDenied Hook**（v2.1.89 新增）是分类器误拒的救济机制，支持 retry 模式让模型重新尝试而非直接 bypass。

权限判定优先级从高到低：deny 规则 → PreToolUse Hook → Auto Mode 分类器 → PermissionDenied Hook。这种分层设计确保了安全性和灵活性的平衡。

### 机制二：Named Subagents 与 Git Worktree 隔离

Claude Code 的子 Agent 通过 Markdown + YAML frontmatter 定义，支持 `@agent-name` 直接点名调用。关键特性是可选的 `isolation: worktree` 配置，利用 git worktree 为每个子 Agent 创建独立的 working directory 和 branch，共享同一个 `.git` 对象存储。

并发控制方面，读操作工具（Read/Grep/Glob）可并行（最多 10 个），写操作工具串行执行。并发批次完成后按原始 block 顺序应用 context modifiers，保证确定性。

### 机制三：KAIROS 持久化助手模式

KAIROS 是 Anthropic 内部代号，核心架构包括：全局状态枢纽 `kairosActive`、Tick 循环（模型定期接收 `<tengu_tick>` 唤醒信号）、SleepTool（主动休眠避免空转）、以及 append-only 的 Daily-Log 记忆文件（按日分割的 Markdown 日志）。

专属工具集包括 SendUserMessage（模型主动向用户发消息）、PushNotification（系统级推送）、CronCreate/Delete/List（定时任务调度，持久化到磁盘可跨会话存活）。

### 机制四：Ultraplan 深度规划

Ultraplan 将重计算任务卸载到远程 CCR（Claude Code on the web）容器，本地终端保持可用。工作流程：触发（ultraplan 关键字）→ 资格检查 → 远程创建（打包上传代码库）→ 远程执行（Opus 4.6 分析，最长 30 分钟）→ 浏览器审批 → 执行选择（远程执行或传回本地）。

### 机制五：多 Agent 协调模式

Claude Code 实现了三层并行架构：**Native Subagents**（同进程上下文隔离）、**Agent Teams**（多进程对等协作，通过共享 Task List + Mailbox 通信）、**Git Worktrees**（物理文件系统隔离）。

### 机制六：任务编排引擎（QueryEngine / query.ts）

核心实现分为两层：QueryEngine.ts（~1,295 行，有状态类，管理会话生命周期）和 query.ts（~1,729 行，无状态 AsyncGenerator，实现七阶段 while(true) 循环）。

七阶段循环：Context Projection → Auto-Compaction Check → API Streaming → Error Recovery → Tool Execution → Attachment Processing → Continuation Decision。支持九种 continue 语义和五级压缩管道（Tool Result Budget → History Snip → Microcompact → Context Collapse → Autocompact）。

### 机制七：StreamingToolExecutor

核心设计是"边收边跑"：模型响应流式到达时，一旦 `tool_use` block 解析完成就立即入队执行，不等完整响应结束。状态机为 `queued → executing → completed → yielded`。

流式回退机制：当流式失败需要切换 fallback 模型时，丢弃旧的 StreamingToolExecutor，生成 tombstone 事件清理 UI 中的孤儿消息，创建新的 executor 用于 fallback 尝试。

---

## OpenCode 现有架构分析

### 插件与 Hook 系统

OpenCode 提供 14+ 直接钩子（可读写 input/output）和 20+ 系统事件（只读广播），总计 30+ 事件钩子。直接钩子包括 `config`、`chat.message`、`chat.params`、`tool.execute.before/after`、`shell.env` 等，可在函数内修改参数或抛出错误阻止执行。

插件通过 TypeScript 函数实现，上下文对象包括 `client`（SDK 客户端）、`project`、`directory`、`worktree`、`$`（Bun Shell API）。自定义工具使用 Zod Schema 定义参数，支持 `string`、`number`、`boolean`、`enum`、`array`、`object` 等类型。

### Agent 系统

OpenCode 原生支持主代理（Primary）和子代理（Subagent）两种模式，通过 Markdown 文件或 JSON 配置定义。子代理通过 `@agent-name` 提及调用，支持 `permission.task` 的 glob 模式控制可调用的子代理范围。

社区已出现 Oh My OpenAgent、Weave 等插件，在 OpenCode 基础上构建了更复杂的多 Agent 编排（Sisyphus 主协调器、Prometheus 战略规划、Atlas Todo 编排等），证明 OpenCode 的扩展空间充足。

### 与 Claude Code 的关键差距

| 维度 | OpenCode 现状 | Claude Code 能力 |
|---|---|---|
| Hook 条件触发 | 需在函数内手动写 if 判断 | 支持 matcher 字段按工具名/参数 glob 匹配 |
| Hook 返回值控制 | 修改 output 对象或 throw Error | exit code + 结构化 JSON（decision/allow/block/deny） |
| LLM 评估 Hook | 不支持 | 支持 type: "prompt" 和 type: "agent" |
| HTTP Hook | 不支持 | 支持 type: "http" POST 到外部端点 |
| Git Worktree 隔离 | 无原生支持 | isolation: worktree 一键启用 |
| 流式工具执行 | 支持基础流式 | StreamingToolExecutor 边收边跑 + tombstone 清理 |
| 上下文压缩 | 支持基础压缩 | 五级压缩管道 + 九种 continue 语义 |
| 持久化记忆 | 无跨会话记忆 | KAIROS Daily-Log + Cron 调度 |
| 多 Agent 对等协作 | 仅主从模式 | Agent Teams 共享 Task List + Mailbox |

---

## 可行性评估矩阵

| Claude Code 机制 | NovelForge 应用场景 | 实现难度 | 价值 | 优先级 |
|---|---|---|---|---|
| **Hook 增强（条件触发 + 结构化返回）** | AI 续写前的敏感词拦截、一致性检查触发、风格校验 | 低 | 高 | P0 |
| **StreamingToolExecutor** | AI 续写边生成边显示，降低用户等待感知 | 中 | 高 | P0 |
| **Git Worktree 隔离** | 多章节并行 AI 审校、不同风格 Agent 隔离运行 | 中 | 中 | P1 |
| **Daily-Log 记忆（KAIROS 简化版）** | 跨会话的角色状态追踪、写作进度记忆、伏笔状态持久化 | 低 | 高 | P0 |
| **Named Subagents + 工具白名单** | 角色审校 Agent、世界观检查 Agent、风格评估 Agent 专业化分工 | 低 | 高 | P0 |
| **五级上下文压缩** | 长篇小说 10 万字+ 项目的上下文管理、前文摘要生成 | 中 | 高 | P1 |
| **Ultraplan 远程卸载** | 全书大纲生成、复杂世界观构建等重计算任务 | 高 | 中 | P2 |
| **Agent Teams 对等协作** | 多角色并行审校、剧情逻辑交叉验证 | 高 | 中 | P2 |

---

## NovelForge 工作流优化方案

### 方案一：Hook 增强系统（P0）

**目标**：在 OpenCode 现有 `tool.execute.before` 钩子基础上，增加条件触发和结构化返回能力，实现 AI 续写前的自动化质量关卡。

**设计**：

```typescript
// 插件中的增强 Hook 示例
export const NovelForgeHooks: Plugin = async ({ project }) => {
  return {
    "tool.execute.before": async (input, output) => {
      // 条件触发：仅对 novel_outline / novel_continue 工具生效
      if (!input.toolName.match(/^novel_(outline|continue|polish)$/)) return;

      // 结构化决策返回
      const decision = await evaluateNovelTool(input, project);
      if (decision.action === "block") {
        output.result = { error: decision.reason };
        throw new Error(`Blocked: ${decision.reason}`);
      }
      if (decision.action === "modify") {
        input.args = { ...input.args, ...decision.modifiedArgs };
      }
      // action === "allow" 时继续执行
    }
  };
};
```

**可行性**：OpenCode 现有插件系统完全支持。仅需在插件函数内增加条件判断和结构化返回逻辑，无需修改 OpenCode 核心。**实现难度：低**

### 方案二：StreamingToolExecutor 适配（P0）

**目标**：实现 AI 续写内容的"边生成边显示"，降低用户等待感知，同时支持生成过程中的中断和回退。

**设计**：在 OpenCode SDK 的会话 API 基础上，封装一个 NovelForge Streaming 层：

```typescript
// 前端调用示例
const stream = await client.session.prompt({
  path: { id: session.id },
  body: {
    parts: [{ type: "text", text: "续写当前章节" }],
    stream: true, // 启用流式
  }
});

for await (const chunk of stream) {
  if (chunk.type === "text") {
    editor.appendText(chunk.text); // 边收边写
  }
  if (chunk.type === "tool_use" && chunk.name === "novel_continue") {
    // 工具调用确认，可在此拦截
    showToolConfirmDialog(chunk.input);
  }
}
```

**可行性**：OpenCode SDK 已支持 SSE 事件流。需要在前端实现增量文本渲染和 tombstone 清理机制（用户中断时清理未完成的内容块）。**实现难度：中**

### 方案三：Daily-Log 跨会话记忆（P0）

**目标**：解决长篇小说创作中的"跨会话记忆丢失"问题，自动持久化角色状态、伏笔进度、世界观变更等关键信息。

**设计**：借鉴 KAIROS 的 append-only Daily-Log 模式，在 NovelForge 项目目录中创建 `.novelforge/memory/logs/YYYY/MM/YYYY-MM-DD.md`：

```typescript
// 记忆写入（在 session.idle 钩子中触发）
"session.idle": async ({ event }) => {
  const memory = extractKeyChanges(event.session);
  await appendDailyLog(projectDir, memory);
}

// 记忆读取（会话启动时注入上下文）
"session.created": async ({ event }) => {
  const recentLogs = await readRecentLogs(projectDir, 7); // 最近 7 天
  event.session.systemPrompt += formatMemoryContext(recentLogs);
}
```

**可行性**：纯文件操作，无需修改 OpenCode 核心。利用现有 `session.idle` 和 `session.created` 钩子即可实现。**实现难度：低**

### 方案四：Named Subagents 专业化分工（P0）

**目标**：为小说创作场景定义专业化子 Agent（角色审校、世界观检查、风格评估），通过 `@mention` 调用，各 Agent 拥有独立的工具白名单和系统提示词。

**设计**：复用 OpenCode 现有的子 Agent 机制，增加小说创作专用配置：

```markdown
---
description: 角色行为一致性检查器
mode: subagent
model: deepseek/deepseek-chat
tools:
  read: true
  grep: true
  novel_character_check: true
  write: false
  bash: false
---
你是一位专业的角色一致性审校专家。你的职责是：
1. 对比角色档案与当前章节内容，检查角色行为是否符合设定
2. 检查角色语言风格是否前后一致
3. 标记时间线矛盾（如角色在同一时间出现在两个地点）
4. 输出问题列表，每项包含：问题描述、涉及段落、严重程度、修复建议
```

调用方式：`@character-checker 检查第三章中主角的行为是否符合档案设定`

**可行性**：OpenCode 原生支持子 Agent 定义和 `@mention` 调用。仅需创建小说创作专用的 Agent Markdown 文件。**实现难度：低**

### 方案五：Git Worktree 隔离的并行审校（P1）

**目标**：利用 git worktree 为不同审校 Agent 创建隔离的工作环境，实现多章节并行 AI 审校而不互相干扰。

**设计**：

```typescript
// 在插件中实现 worktree 管理
export const ParallelReviewPlugin: Plugin = async ({ $, directory }) => {
  return {
    tool: {
      novel_parallel_review: tool({
        description: "对多个章节并行启动审校 Agent",
        args: {
          chapters: tool.schema.array(tool.schema.string()),
          agent: tool.schema.string(), // @character-checker / @world-checker
        },
        async execute(args, ctx) {
          const worktrees = [];
          for (const chapter of args.chapters) {
            const wtPath = `${directory}/.novelforge/worktrees/${chapter}`;
            await $`git worktree add ${wtPath} ${chapter}`;
            worktrees.push(wtPath);
          }
          // 在每个 worktree 中启动子 Agent 审校
          const results = await Promise.all(
            worktrees.map(wt => runAgentInWorktree(args.agent, wt))
          );
          // 清理 worktree
          for (const wt of worktrees) {
            await $`git worktree remove ${wt}`;
          }
          return results;
        }
      })
    }
  };
};
```

**可行性**：git worktree 是原生 Git 功能，OpenCode 插件已有 `$`（Bun Shell）和 `worktree` 上下文。需要处理 worktree 的自动清理和冲突解决。**实现难度：中**

---

## 实施路线图

| 阶段 | 时间 | 交付内容 | 依赖 |
|---|---|---|---|
| **Phase 1：基础增强** | 2 周 | Hook 增强系统 + Daily-Log 记忆 + Named Subagents | OpenCode 插件系统（现有） |
| **Phase 2：流式体验** | 2 周 | StreamingToolExecutor 适配 + 前端增量渲染 | Phase 1 + OpenCode SDK SSE |
| **Phase 3：并行能力** | 2 周 | Git Worktree 隔离 + 多章节并行审校 | Phase 1 + Git 工作流 |
| **Phase 4：高级压缩** | 3 周 | 五级上下文压缩管道 + 前文摘要生成 | Phase 1 + LLM 摘要能力 |
| **Phase 5：远程卸载** | 4 周 | Ultraplan 简化版（全书大纲生成远程执行） | Phase 1-4 + 远程计算资源 |

---

## 风险与缓解策略

| 风险 | 描述 | 缓解策略 |
|---|---|---|
| OpenCode API Breaking Changes | OpenCode 迭代极快（日均 30-40 次提交），插件 API 可能存在 breaking changes | 锁定 OpenCode 依赖版本（~1.17.3）；关注 changelog；核心功能尽量使用稳定 API |
| Git Worktree 冲突 | 多 Agent 并行修改同一文件可能导致合并冲突 | 每个 worktree 只读或只写不同文件；审校结果以评论/报告形式返回；冲突时自动回退到串行执行 |
| Daily-Log 膨胀 | 长期项目（百万字级小说）的 Daily-Log 可能过于庞大 | 按周/月归档旧日志；启动时只加载最近 N 天的日志；关键信息提取到索引文件 |
| 流式渲染复杂度 | 边收边渲染需要处理中断、回退、格式保持等问题 | 采用虚拟 DOM diff 策略；tombstone 标记未完成块；用户中断时提供"保留已生成部分 / 全部丢弃"选项 |

---

## 结论

Claude Code 泄露源码暴露的 7 大核心机制中，**Hook 增强、Daily-Log 记忆、Named Subagents** 三项可在 OpenCode 基础上以**极低难度**快速实现，且对 NovelForge 的小说创作场景具有**极高价值**。StreamingToolExecutor 和 Git Worktree 隔离需要中等投入，但能显著提升用户体验和并行处理能力。

Ultraplan 远程卸载和 Agent Teams 对等协作的实现难度较高，建议在项目成熟后再考虑引入。整体实施周期约 13 周（3 个月），按"高价值低难度优先"原则分 5 个阶段推进。

> **最终建议**：以 Phase 1（Hook 增强 + Daily-Log + Named Subagents）作为 NovelForge MVP 的核心差异化特性，在 2 周内即可交付。这三项机制共同构成了"AI 原生小说编辑器"的技术护城河：Hook 增强确保输出质量、Daily-Log 解决跨会话记忆、Named Subagents 实现专业化分工。

---

## Sources

1. Claude Code Hooks Guide - https://claudefa.st/blog/tools/hooks/hooks-guide
2. PermissionDenied Hook 机制 - https://hatohato.jp/blog/core/single.php?id=588
3. Claude Code Subagents 与 Git Worktree - https://hatohato.jp/blog/core/single.php?id=598
4. StreamingToolExecutor 并发控制 - https://codewisdom.io/blog/ai-agents-claude-code-services-tools-runtime-notes/
5. KAIROS 持久化助手模式 - https://www.markdown.engineering/learn-claude-code/46-kairos-always-on
6. Ultraplan 深度规划 - https://zhanghandong.github.io/harness-engineering-from-cc-to-ai-coding/part6/ch20c.html
7. Agent Teams 多进程协作 - https://www.morphllm.com/ai-agent-orchestration
8. Claude Code Agent Loop 深度解析 - https://blog.vincentqiao.com/en/posts/claude-code-agent-loop/
9. Claude Code 源码泄露分析 - https://juejin.cn/post/7628254115258286143
10. OpenCode 官方插件文档 - https://opencode.ai/docs/plugins/
11. OpenCode 自定义工具文档 - https://www.mintlify.com/anomalyco/opencode/custom-tools
12. OpenCode 官方 Agent 文档 - https://opencode.ai/docs/agents/
13. Oh My OpenAgent 社区方案 - https://ohmyopenagent.com/docs

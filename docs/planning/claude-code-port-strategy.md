# Claude-Code 移植策略文档

> 版本：v1.0
> 日期：2026-04-09
> 关联文档：Claude-Code-移植文档.md / Sandbox-移植报告.md / 新移植策略-闭源依赖处理方案.md

---

## **移植策略的核心认知**

在动手之前，最重要的一点是要清楚：claude-code 的价值不在于它的 UI 或者交互层，而在于它的**工具执行引擎**和**任务上下文管理机制**。你们要移植的不是一个完整的应用，而是把它的"Agent 运行时"部分剥离出来，作为 caiode 插件里的一个可调度模块。

---

## **分层拆解：哪些值得移植，哪些不要碰**

### **第一层：工具调用框架（最高价值，优先移植）**

claude-code 的工具调用框架是整个 Agent 能力的基础，包括 `BashTool`、`ReadFileTool`、`WriteFileTool`、`GrepTool`、`WebFetchTool` 等。这些工具的实现逻辑已经被你们的团队分析过了（`Grep-Rgrep-实现分析报告.md`、`WebFetch-实现分析报告.md`），说明可行性已经验证。

移植策略是**接口适配而非直接复制**。claude-code 的工具接口大概长这样：

```typescript
interface Tool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  execute(input: unknown, context: ToolContext): Promise<ToolResult>;
}
```

你们需要做的是在 caiode 的沙箱上下文里实现一个 `ToolContext`，把 `WorktreeManager` 和 `PermissionManager` 注入进去。这样工具执行时，所有文件操作都自动被约束在当前 Agent 对应的 Worktree 沙箱里，权限边界由 Phase1 的基础设施来保证。

### **第二层：任务循环（Agent Loop）**

这是 Agent 能持续执行多步任务的关键。claude-code 的 Agent Loop 本质上是一个 `while (hasMoreWork)` 的循环，每轮迭代包括：接收模型输出 → 解析工具调用 → 执行工具 → 把结果追加到消息历史 → 再次调用模型。

你们已经有了 `GlobalModelRequestQueue`（Phase1 M1.2 的核心模块），这个队列正好可以作为 Agent Loop 里"调用模型"这一步的执行层。Agent Loop 把请求丢进队列，队列保证并发控制，结果通过回调或 Promise 返回给 Loop。两者的职责边界非常清晰，不会互相耦合。

移植时要注意的是**中断与恢复机制**。claude-code 的 Loop 支持在任意工具执行后暂停，等待用户确认。在你们的多 Agent 场景（多章节同写）里，这个机制要改造成"等待主控层调度"，而不是等待用户输入。

### **第三层：上下文压缩（Context Management）**

这是 claude-code 里最容易被忽视但实际上非常重要的模块。当对话历史太长时，它会自动做摘要压缩，避免超出模型的 context window。

对于 StoryTree 的多章节场景，这个机制的价值被放大了——每个 Agent 写完一章后，需要把本章的关键信息（人物状态、情节转折、新引入的设定）提炼出来，传递给下一个 Agent。这不只是"压缩"，而是**章节间上下文传递的核心机制**。建议直接复用 claude-code 的压缩逻辑，在此基础上扩展一个"章节摘要 Schema"，规定摘要必须包含哪些字段（角色状态、时间线位置、待解决的伏笔等）。

### **第四层：闭源依赖（不要移植，绕过）**

根据你们的 `非开源模块分析报告.md` 和 `新移植策略-闭源依赖处理方案.md`，claude-code 里有些模块是闭源的（主要是 Anthropic 的内部 SDK 部分）。这些不要尝试移植，而是通过接口 Mock 或者替换实现来绕过。你们已经有了 `ADR-002-Security-Gateway-and-Mock-Strategy.md`，说明这个方向已经有了明确的决策，按那个方向走就行。

---

## **与当前项目架构的整合点**

结合 Phase1-Implementation-Plan.md 的结构，移植后的 claude-code Agent 模块在整体架构里的位置应该是这样的：

```
caiode 插件（宿主层）
    │
    ├── ProcessGuardian（进程守护）
    ├── GlobalModelRequestQueue（LLM 请求队列）
    ├── FileMutex（跨进程文件锁）
    │
    └── AgentRuntime（移植自 claude-code）
            ├── ToolRegistry（工具注册表）
            │       ├── BashTool（注入沙箱路径）
            │       ├── ReadFileTool（注入 PermissionManager）
            │       └── WriteFileTool（注入 PermissionManager）
            ├── AgentLoop（任务循环）
            │       └── → 调用 GlobalModelRequestQueue
            └── ContextManager（上下文管理）
                    └── → 章节摘要服务（StoryTree 扩展）
```

每个 Agent 实例在初始化时，从 `WorktreeManager` 获取自己的沙箱路径，注入到 `ToolRegistry` 里的所有工具。这样工具执行时的文件隔离是自动的，不需要在 Agent 逻辑里手动处理权限。

---

## **移植顺序建议**

最优先的是 `ToolRegistry` 和基础工具集，因为这是 Agent 能"干活"的前提，也是最容易独立验证的部分。其次是 `AgentLoop`，把它接到 `GlobalModelRequestQueue` 上，验证单个 Agent 能完成一个端到端任务。最后才是 `ContextManager` 和章节摘要服务，这部分是 StoryTree 特有的业务逻辑，放在基础能力稳定之后再做。

一个实用的建议是：在 `docs/planning/` 下新建一个 `claude-code-port-strategy.md`，把每个模块的"原始实现位置 → 移植目标位置 → 接口适配说明"三列对应关系记录下来。这样多个工程师智能体协作时，不会出现重复移植或者接口不一致的问题。
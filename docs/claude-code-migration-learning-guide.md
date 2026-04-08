# Claude Code 模块化移植与学习指南 (Migration & Learning Guide)

> **核心原则**：不盲目拷贝源码，以“学习、重构、模块化渐进移植”为目的。所有闭源依赖（如 `@anthropic-ai/sdk`）优先使用 Mock 接口，在确保全链路跑通后，再逐步替换为真实的实现。

---

## 1. 外部依赖项梳理与处理策略 (Dependency Analysis)

在重写 Claude Code 时，我们需要面对大量第三方包的替换。以下是核心依赖及我们的重写/Mock 策略：

### 1.1 闭源或专有包
- **`@anthropic-ai/sdk`**：Anthropic 官方 SDK，大量存在于 `QueryEngine.ts`, `services/api/claude.ts` 和各种消息类型定义中。
  - **策略**：**构建隔离层 (ModelAdapter Layer)**。定义我们自己的 `BaseMessage` 和 `ToolCall` 接口，然后写一个 `MockModelAdapter`，在接收到特定的 Prompt 时，直接返回预设的 `ToolCall` JSON（比如模拟执行 Bash 命令）。
- **`@modelcontextprotocol/sdk` (MCP)**：用于接入外部工具（虽然协议开源，但在早期重构阶段会增加复杂度）。
  - **策略**：**Phase 2 再引入**。Phase 1 阶段我们只实现内置的 `BashTool` 和 `FileEditTool`，将 MCP 接口全部 Mock 返回空列表。

### 1.2 UI 与终端渲染包
- **`ink` / `react`**：用于终端界面的渲染。
  - **策略**：既然目标是 VS Code 插件并在后台作为 Daemon 运行，我们将完全摒弃 `ink`，采用标准的 Node.js `console.log` / `EventEmitter` 机制输出结构化日志（类似 `StructuredIO`）。
- **`commander`**：命令行参数解析。
  - **策略**：可替换为 VS Code 插件配置 (Configuration) 或极简的 `yargs`。

### 1.3 核心业务相关的开源包
- **`zod`**：大量用于 Tool 参数的 Schema 校验。
  - **策略**：**保留并引入**。它是工具参数解析和类型安全的基础。
- **`strip-ansi`**：用于清洗终端命令的输出。
  - **策略**：**保留**。对 `BashTool` 的输出处理很有用。

---

## 2. 模块化移植与学习路径 (Phased Learning Path)

为了将这个过程转化为“学习教材”，我们将 Claude Code 庞大的源码拆解为 4 个循序渐进的模块（里程碑）。每个模块开发完成后，都需要输出一篇《学习笔记》。

### Phase 1: 构建基础交互与 Mock 引擎 (Week 1)
**学习目标**：理解 Agent 的核心工作流（REPL 循环）与消息管理。
- **步骤 1**：在我们的项目中创建 `src/agent-core` 目录。
- **步骤 2**：提取 `QueryEngine.ts` 的骨架，移除所有复杂的缓存和权限逻辑。只保留 `mutableMessages` 数组。
- **步骤 3**：实现 `MockModelAdapter`。
  - 编写测试脚本：输入 "帮我创建一个 test.txt 文件"，Mock 模型返回一个调用 `FileWriteTool` 的指令。
- **步骤 4**：移植 `Tool.ts` 基类和极简版的 `FileWriteTool`。
- **输出物**：《学习笔记 1：从零手写一个极简 Agent REPL 循环》

### Phase 2: 工具系统与沙箱隔离 (Week 2)
**学习目标**：掌握如何安全地让 Agent 执行宿主机的命令与文件操作。
- **步骤 1**：深入研究 `BashTool/BashTool.tsx` 源码。学习它如何使用 `child_process.spawn`，以及如何处理长输出截断。
- **步骤 2**：移植 `BashTool` 和 `FileEditTool`（注意 Claude 的 FileEdit 采用了 AST 替换或正则替换的复杂逻辑，我们可以先实现一个基础的版本）。
- **步骤 3**：**核心！移植 Permission Harness**。在工具执行前插入一个拦截器函数 `canUseTool`。在当前的 Mock 环境中，将其实现为简单的 `console.question("是否允许执行？y/n")`。
- **输出物**：《学习笔记 2：Agent 工具箱设计与 Bash 权限安全拦截机制》

### Phase 3: 上下文管理与长文本截断 (Week 3)
**学习目标**：理解大模型上下文爆炸的解决方案（Compaction Harness）。
- **步骤 1**：研究 `services/compact/compact.ts`。学习它如何计算 Token 水位。
- **步骤 2**：在我们的 `QueryEngine` 中引入 `checkTokenBudget()`。
- **步骤 3**：实现基础的截断策略：当历史消息超过 8000 Token 时，利用 Mock 模型将前 10 轮对话压缩为一段 200 字的 Summary，并替换原消息。
- **输出物**：《学习笔记 3：防止 Token 爆窗：动态上下文摘要与历史截断算法》

### Phase 4: VS Code 司令台集成 (Week 4)
**学习目标**：理解进程隔离与结构化 IPC 通信。
- **步骤 1**：研究 `cli/structuredIO.ts`，学习如何将 Agent 的内部状态（如正在思考、正在执行 Bash）序列化为 JSON 抛出。
- **步骤 2**：编写一个 VS Code 插件入口。通过 `child_process.fork` 启动我们在 Phase 3 完成的 Agent 进程。
- **步骤 3**：在 VS Code 中监听子进程的 JSON 事件，并映射到之前设想的 Webview Dashboard (司令台) 上。将权限弹窗 `canUseTool` 映射到 `vscode.window.showWarningMessage`。
- **输出物**：《学习笔记 4：多进程 Agent 调度与 VS Code 司令台架构实战》

---

## 3. 为什么这种方案更好？(Why this approach?)

1. **深度掌握核心科技**：直接拷贝代码往往会导致“知其然不知其所以然”。通过抽丝剥茧地重写，我们能彻底吃透 Claude 的 Prompt Cache 机制和状态机设计。
2. **摆脱闭源束缚**：通过构建 `ModelAdapter` 和先期 Mock，我们的架构天然就支持未来接入 OpenAI、DeepSeek 或企业私有模型，而不会被绑死在 `@anthropic-ai/sdk` 上。
3. **团队赋能**：输出的 4 篇学习笔记可以直接作为团队内部的 AI 培训教材，帮助更多开发者理解 Agent 底层原理。
4. **性能完全可控**：因为是我们一行行重写的，我们可以精准控制日志输出、文件读取缓存等，彻底杜绝直接拷贝可能带来的隐藏内存泄漏问题。
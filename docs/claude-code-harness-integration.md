# Claude Code Harness 核心架构思想拆解与集成方案

## 一、 Claude Code Harness 核心架构思想提取

通过对 `/claude-code-src` 源码的深入分析，Claude Code CLI 的核心架构思想可以总结为：**“大模型调用的工程基础设施化（Harness 化）”**。其代码库中直接调用模型 API 的代码占比极小，绝大部分代码都是围绕 API 调用构建的工程基础设施（Harness 子系统）。

### 1. 架构分层
Claude Code 采用了经典的三层交互架构：
- **REPL 交互层 (Session Runner & Bridge)**：管理终端输入输出，生成子进程并与主循环进行通信，控制执行权限。
- **QueryEngine 引擎层**：核心推理中枢。负责意图识别、上下文装载、多步推理（Reasoning）、Tool Call 规划和状态机管理。
- **Tool System 工具层**：标准化工具接口（如 `BashTool`, `FileEditTool`, `GlobTool`, `MCPTool`），负责具体动作执行。

### 2. 六大核心 Harness 基础设施
1. **Prompt Cache Harness (提示词缓存)**：缓存 System Prompt、工具描述和历史消息，降低 Token 成本，提升首字节响应速度。
2. **Permission Harness (安全权限管控)**：拦截器模式设计，基于 `ToolPermissionContext` 预检工具调用（如阻断高危 Bash 命令），提供 `canUseTool` 的双阶段确认机制。
3. **Compaction Harness (历史压缩)**：当上下文增长超过预算（Token Budget）时，通过 `snipReplay` 和摘要算法智能截断历史消息。
4. **Memory Harness (工作区记忆)**：通过 `memdir` 和上下文提取能力，为模型提供长期的项目级记忆检索支持。
5. **Collaboration Harness (多智能体协作)**：通过协调器 (Coordinator) 管理不同职责的子代理（Agent），保障并发调用的顺序性（FlushGate, QueryGuard）。
6. **Build Harness (构建与灰度)**：Feature Gate 体系与无用代码消除 (DCE)，实现多版本能力控制。

### 3. 关键设计模式
- **状态机驱动 (State Machine)**：`QueryGuard` 使用 `idle -> dispatching -> running` 状态机避免异步竞态问题。
- **非对称持久化**：用户输入同步落盘，AI 回复异步落盘，防止进程意外中止导致数据丢失。
- **拦截器模式 (Interceptor)**：所有 Tool Call 必须经过 Permission 拦截，返回标准化的 `ToolResult`。

---

## 二、 融入 Trae 多智能体插件的技术方案

针对 `/vscode-extension` 与 `2026-04-06-trae-claude-multiagent-design.md` 的架构改造，我们将 Harness 理念完全注入 Trae 插件，构建以 `QueryEngine` 为中心的沙箱智能体体系。

### 1. 架构改造方案 (Architecture Refactoring)

在原有多智能体设计中，将“工作流引擎 (Workflow Engine)”升级替换为 **Harness 工程基础设施与 QueryEngine 架构**。
- **Trae QueryEngine**：作为每个任务沙箱的核心大脑，替代原有工作流。通过 CDP (Chrome DevTools Protocol) 与 Trae IDE 互通，维护一套运行时的 `mutableMessages`。
- **Trae Harness Layer**：
  - **Permission Harness**：将权限检查绑定到 VS Code 的 Webview 弹窗。当智能体调用高危工具（如删除关键文件）时，触发 VS Code 的确认弹窗。
  - **Compaction Harness**：结合 Trae IDE 的本地模型或快速模型，在后台异步压缩冗长的调试历史。
  - **Prompt Cache**：利用 Trae 内置大模型的 Cache 特性，将项目级 `Rules` 和 `Skills` 放入缓存区。

### 2. 核心接口设计规范 (API & Interfaces)

**QueryEngine 初始化接口：**
```typescript
interface TraeQueryEngineConfig {
  taskId: string;
  cwd: string;
  tools: TraeTool[];          // 注册的标准化工具
  mcpClients: MCPClient[];    // 接入 Trae 的外部能力
  canUseTool: CanUseToolFn;   // Permission Harness 注入点
  readFileCache: FileStateCache; // 沙箱文件缓存
  thinkingConfig: ThinkingConfig;
}
```

**Permission 预检接口 (VS Code UI 桥接)：**
```typescript
type CanUseToolFn = (
  tool: TraeTool,
  input: any,
  context: ToolUseContext
) => Promise<{ behavior: 'allow' | 'deny' | 'ask_user'; reason?: string }>;
```

### 3. 数据流设计 (Data Flow)

1. **任务分发**：Trae 将 `T-001` 任务拆解，分配给 Sandbox Agent。
2. **循环启动**：Agent 实例化 `QueryEngine`，开启 REPL (Read-Eval-Plan-Loop) 循环。
3. **上下文装载**：`QueryEngine` 向 `Memory Harness` 索要相关背景，构建初始 Prompt。
4. **执行推断**：调用 Trae Model 得到 `Tool Call`。
5. **Harness 拦截**：`Permission Harness` 拦截评估。
6. **工具执行**：`Tool System` 在沙箱内执行命令，结果返回 `QueryEngine`。
7. **历史管理**：每次回合结束，`Compaction Harness` 检查 Token 水位并视情况截断。

### 4. 性能与兼容性优化策略

- **缓存预热 (Warm-up)**：沙箱启动前，将常用的 `bash`, `grep` 工具说明与 Trae 规则预先注入 Prompt Cache。
- **异步文件追踪**：使用 `FileStateCache` 在内存中管理沙箱文件的 diff，只在必要时读写磁盘，降低 I/O 延迟。
- **断点恢复机制**：所有 `mutableMessages` 实现非对称持久化，如果 VS Code 崩溃，重启后可从本地 SQLite/JSON 恢复 `QueryEngine` 状态。

---

## 三、 渐进式迁移与实施计划

### 阶段 1：底座替换 (Week 1-2)
- 将 `/vscode-extension` 中基于规则的单步调用重构为 `QueryEngine` 的循环模式。
- 实现标准化的 `Tool System`，移植 `BashTool` 和 `FileEditTool`。

### 阶段 2：Harness 工程落地 (Week 3-4)
- 引入 **Permission Harness**：实现 VS Code 的弹窗确认机制。
- 引入 **Compaction Harness**：集成历史消息分级压缩策略（Level 1 丢弃，Level 2 摘要）。

### 阶段 3：多智能体协作与沙箱增强 (Week 5-6)
- 实现 **Collaboration Harness**：引入 Coordinator Agent 负责拆解任务并分发给 Worker Agent。
- 在 Trae Dashboard（司令台）中暴露每个 Agent 的 QueryEngine 当前所处的状态机阶段（Dispatching / Running / Waiting Permission）。

### 阶段 4：安全与可观测性 (Week 7-8)
- 完善 Hook System 的生命周期事件。
- 自动化生成每日汇报，集成飞书同步（结合 `ralph-feishu-sync` rule）。

---

## 四、 风险评估与应对策略

| 风险项 | 潜在影响 | 应对策略 (Harness 解决方案) |
|--------|----------|-----------------------------|
| **上下文爆炸** | 超出模型 128K 限制，导致报错或延迟极高 | 强制启用 **Compaction Harness** 熔断机制，连续 Token 超标即触发自动摘要。 |
| **工具越权执行** | 智能体可能误删代码库，造成数据丢失 | 完善 **Permission Harness** 的 Fail-closed 机制，并使用 Node.js 沙箱进程隔离。 |
| **异步回调竞态** | VS Code 界面更新与大模型流式输出冲突 | 采用 **QueryGuard 状态机**，确保同一 Agent 永远串行处理事件。 |
| **API 成本超标** | 多智能体频繁通信消耗大量 Token | 依赖 **Prompt Cache Harness**，静态化系统指令，利用 Anthropic 缓存协议。 |

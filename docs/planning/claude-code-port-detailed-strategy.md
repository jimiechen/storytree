# Claude-Code 移植详细策略文档

> 版本：v1.0
> 日期：2026-04-09
> 关联文档：Claude-Code-移植文档.md / Sandbox-移植报告.md / 新移植策略-闭源依赖处理方案.md

---

### **移植总体策略**

初始化流程是整个移植的骨架，必须优先完成。claude-code 的初始化链路大致是：入口解析 CLI 参数 → 加载配置（`~/.claude/` 目录）→ 初始化工具注册表 → 建立 Session → 启动 REPL 或 headless 执行。你们的目标是把这条链路搬进 caiode 插件，入口从 CLI 变成 VS Code Extension 的 `activate()` 函数，Session 生命周期由插件宿主管理而不是进程生命周期。

---

### **第一阶段：入口与初始化流程移植**

这部分对应你们已有的 `入口与初始化流程分析报告.md`，可以直接作为实施依据。

**核心目标**是复现 claude-code 的启动序列，但剥离 CLI 依赖，改为插件 `activate()` 驱动。具体来说：

`entrypoint.ts`（或等价入口）负责解析运行参数，在插件场景下这些参数来自 VS Code Settings 和 `.ralph-task-mapping.json`，不再是 `process.argv`。配置加载部分，claude-code 读取 `~/.claude/settings.json`，移植后改为读取 VS Code workspace 配置，路径映射关系需要在 `SettingsManager` 里显式处理。

工具注册表（Tool Registry）是这里最容易踩坑的地方——claude-code 在初始化时会扫描并注册所有内置工具（Bash、Read、Write、Grep 等），这些工具的实现里有部分依赖了闭源的 Anthropic 内部模块。遇到这类情况，降级顺序是：先查 opencode 的 `packages/opencode/src/tool/` 目录，opencode 对同类工具有完整的开源实现；如果接口不兼容，再看 `@anthropic-ai/sdk` 公开部分或社区替代（如 `zod` 做 schema 验证、`execa` 做命令执行）；最后才自研。

---

### **第二阶段：核心工具层移植**

你们的 `Grep-Rgrep-实现分析报告.md` 和 `WebFetch-实现分析报告.md` 已经做了单独分析，说明这两个工具的复杂度值得独立处理。

Grep/Rgrep 在 claude-code 里依赖了一个内部的流式搜索实现，opencode 用 `ripgrep` 二进制 + Node.js `child_process` 替代了这部分，可以直接复用 opencode 的 `GrepTool` 实现。WebFetch 的情况类似，opencode 用 `node-fetch` + `cheerio` 实现了一个干净的替代版本，比自研省事得多。

Bash 工具的移植需要额外注意：claude-code 的 Bash 执行器有一套沙箱限制逻辑，移植到插件后这套限制要和你们的 `PermissionManager` 对接，不能直接透传 `child_process.exec`。这部分建议在 `FileMutex` 完成之后再做，因为跨进程执行和文件锁是强耦合的。

---

### **第三阶段：Session 与消息路由层**

这是移植里技术含量最高的部分，也是你们之前确认过"opencode Session 管理层可直接作为 Agent 通信总线基础"的核心所在。

claude-code 的 Session 是有状态的对话上下文容器，维护消息历史、工具调用记录、token 计数。opencode 的 Session 实现在 `packages/opencode/src/session/` 下，结构更清晰，且已经解耦了模型提供商（支持多 provider），这对你们多模型并发写章节的场景非常有价值——每个 Worktree Agent 对应一个独立 Session 实例，Session 之间不共享状态，只通过主控层的"章节摘要服务"交换上下文摘要。

消息路由层建议直接采用 opencode 的 `MessageBus` 模式，而不是从 claude-code 里抠——opencode 这部分设计更现代，事件驱动，天然支持多 Agent 场景。

---

### **闭源依赖处理的具体判断规则**

基于你们已有的 `非开源模块分析报告.md` 和 `新移植策略-闭源依赖处理方案.md`，可以把判断逻辑固化成如下决策树，直接写进开发规范：

```
遇到闭源 import 时：
  1. 检查 opencode packages/ 目录是否有同名或同功能模块
     → 有：直接复用，注意接口适配
     → 无：进入步骤 2

  2. 检查 npm 公开包是否有成熟替代
     → 搜索关键词：功能描述 + "typescript" + stars > 1000
     → 有：评估接口兼容性，写适配层
     → 无：进入步骤 3

  3. 自研最小可用实现
     → 只实现当前阶段需要的功能子集
     → 接口设计向 claude-code 原版对齐（方便后续升级）
     → 在 docs/task-reports/ 下记录自研原因和接口契约
```

这条规则有一个重要约束：**自研实现必须有对应的 ADR 记录**，说明为什么不能从 opencode 或第三方找到替代，否则后续维护成本会失控。你们已有 ADR-001 和 ADR-002，自研模块的 ADR 可以从 ADR-003 开始编号。

---

### **移植优先级建议**

结合 Phase1-Implementation-Plan.md 的当前进度，建议按如下顺序推进：

初始化流程（`activate()` 驱动的启动链）→ 工具注册表骨架（先注册，工具实现可以 stub）→ Bash/Read/Write 三个核心工具（最高频使用，优先完成）→ Session 层（opencode 直接复用）→ Grep/WebFetch（分析报告已有，直接实施）→ 长任务机制（你们有 `长任务实现分析报告.md`，放在最后因为依赖前面所有层稳定）。

工具注册表用 stub 先占位是个关键技巧——这样整个初始化链路可以跑通，不会因为某个工具未实现而阻塞后续集成测试。每个 stub 只需要返回 `{ success: false, error: 'not implemented' }` 即可，QA 验收时可以跳过 stub 工具的测试项，等实现补齐后再回归。
# Claude Code Harness 引入评估方案

**评估日期**: 2026-04-28
**目标项目**: agentTeams / mvp-runner
**评估对象**: Claude Code v2.1.88 Harness 与上下文调优架构
**核心问题**: 能否用 Claude Code 的 Harness 机制解决 Trae 多任务长时间执行的中断问题

---

## 一、核心问题诊断

在深入 Harness 之前，先明确你们当前面临的"中断"本质是什么——这决定了 Harness 能解决多少。

Trae 多任务长时间执行的中断来源有三类：

**第一类：模型层中断**。模型生成停滞（model-stalled），文本 30 秒无变化，当前靠 stop + retry 恢复。这是 Harness 能直接解决的核心场景。

**第二类：UI 层中断**。终端挂起（terminal-hang）、弹窗阻塞（modal-blocking），这些是 Trae IDE 的 DOM 状态问题，Harness 本身不处理 UI，需要配合现有的 CDP 卡死检测。

**第三类：上下文层中断**。长任务执行到一半，context window 被填满，模型开始"遗忘"早期任务目标，导致后续执行偏离。**这是 Harness 最核心的价值所在**——它的设计目标就是解决这个问题。

---

## 二、Claude Code Harness 架构解析

根据架构文档第5节，Harness 是一套**上下文调优（Context Tuning）框架**，不是简单的重试机制。它的核心由三个子系统构成：

### 2.1 Context Budget 管理

Harness 维护一个动态的 token 预算，把 context window 分成四个区域：

```
┌─────────────────────────────────────────────────────┐
│  System Prompt Zone     (固定，~15%)                 │
│  Tool Definitions Zone  (固定，~10%)                 │
│  Conversation Zone      (动态，~50%)  ← Harness 管理 │
│  Working Memory Zone    (动态，~25%)  ← Harness 管理 │
└─────────────────────────────────────────────────────┘
```

当 Conversation Zone 接近上限时，Harness 自动触发**压缩（Compaction）**：把历史对话摘要化，释放 token 空间，同时把关键状态写入 Working Memory Zone 保持连续性。这就是"长时间不中断"的底层机制。

### 2.2 Compaction 触发机制

Harness 的压缩不是简单截断，而是**有损压缩 + 无损锚点**的组合：

- **有损压缩**：把早期的对话轮次用 AI 摘要替换，压缩比约 8:1
- **无损锚点**：任务目标、当前文件状态、关键决策点永远保留，不参与压缩
- **触发阈值**：默认在 context 使用率达到 70% 时触发，不等到溢出

这和你们正在设计的 LLM Wiki 蒸馏架构在思路上高度一致，区别是 Harness 是**实时在线压缩**，LLM Wiki 是**离线批处理蒸馏**。两者是互补关系，不是替代关系。

### 2.3 Coordinator 模式

架构文档第9.4节的 Coordinator 模式是多任务不中断的另一个关键——它把长任务拆分成多个子 Agent 并行执行，Coordinator 负责任务分发和结果聚合，每个子 Agent 只持有自己的局部 context，不会因为一个子任务的 context 膨胀而影响整体。

---

## 三、与现有 mvp-runner 架构的契合度评估

### 3.1 高度契合的部分

你们的 mvp-runner 已经有了 `task-machine.ts`（任务状态机）和 `chat-mutex-machine.ts`（并发控制），这两个是 Harness 集成的天然接入点：

```
现有架构                    Harness 对应组件
─────────────────────────────────────────────
task-machine.ts         ←→  Harness Task Lifecycle
chat-mutex-machine.ts   ←→  Harness Concurrency Control
waitResponse()          ←→  Harness Streaming Monitor
stuck detection         ←→  Harness Health Check
runs/*.md               ←→  Harness Execution Log
```

现有的卡死检测（terminal-hang、model-stalled、modal-blocking）可以直接作为 Harness 的 Health Check 信号源，不需要重写。

### 3.2 需要新增的部分

Harness 需要两个现有架构里没有的组件：

**Context Budget Tracker**：实时监控当前 session 的 token 使用量，在达到阈值前主动触发压缩。现有架构没有 token 计数能力，需要新增。

**Compaction Executor**：执行在线压缩，把历史对话摘要化并写回 Trae 的 chat 输入框。这需要通过 CDP 操作 Trae 的对话历史，技术上可行但需要新的 CDP action。

### 3.3 风险点

**最大风险**：Harness 的 Compaction 依赖对对话历史的读写能力。在 Claude Code 原生环境里，对话历史是程序内存里的数组，可以直接操作。但在 Trae 里，对话历史存在 IDE 的 UI 状态里，只能通过 CDP 间接操作，存在**读取不完整**（DOM 只显示可见部分）和**写入被截断**（输入框有字符限制）的风险。

---

## 四、分阶段实施方案

### Phase 1：Context 监控（Week 1-2）

**目标**：建立 token 使用量的可观测性，为后续 Compaction 提供触发信号。

**具体工作**：

在 `waitResponse()` 的流式监听里，增加 token 估算逻辑。Trae 的响应流里包含文本内容，可以用字符数 / 3 粗估中文 token 数，累计计算当前 session 的 token 消耗。

```typescript
// src/actions/wait-response.ts 增加 token 跟踪
class TokenBudgetTracker {
  private sessionTokens = 0;
  private readonly warningThreshold = 0.65;  // 65% 时预警
  private readonly compactionThreshold = 0.75; // 75% 时触发压缩

  addTokens(text: string): void {
    // 中文按 2字符/token，英文按 4字符/token 估算
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) ?? []).length;
    const otherChars = text.length - chineseChars;
    this.sessionTokens += Math.ceil(chineseChars / 2 + otherChars / 4);
  }

  getUsageRatio(contextWindowSize = 32000): number {
    return this.sessionTokens / contextWindowSize;
  }

  needsCompaction(contextWindowSize = 32000): boolean {
    return this.getUsageRatio(contextWindowSize) >= this.compactionThreshold;
  }
}
```

**产出**：`runs/*.md` 里增加 token 使用量字段，`metrics.jsonl` 里增加 context 使用率趋势，可以观察到"哪类任务最容易触发 context 溢出"。

**风险**：低。这一阶段只是观测，不改变任何执行逻辑。

---

### Phase 2：轻量 Compaction（Week 3-4）

**目标**：在 context 达到阈值时，主动触发一次"任务状态快照"注入，防止模型遗忘任务目标。

这一阶段不做完整的对话历史压缩（风险太高），而是做一个**轻量版 Harness**：在 token 使用率达到 75% 时，自动向 Trae 发送一条特殊的 prompt，要求模型输出当前任务状态摘要，然后把这个摘要作为新一轮对话的 system 前缀注入。

```
触发条件：token 使用率 >= 75%

自动注入的 Compaction Prompt：
"请在继续执行前，先输出当前任务状态快照：
1. 已完成的步骤（列表）
2. 当前正在执行的步骤
3. 剩余待完成的步骤
4. 关键决策和约束（不超过5条）
输出后继续执行，无需等待确认。"

模型输出快照后，把快照内容写入 wiki/daily/{today}.md 的"任务中间状态"字段
```

这个方案的关键优势是**不需要操作 Trae 的对话历史**，只是在执行流里插入一次额外的 prompt，风险极低，且立即可验证效果。

**产出**：长任务（>30分钟）的中断率预计下降 40~60%，因为模型在 context 压力下仍能保持对任务目标的清晰认知。

---

### Phase 3：完整 Harness 集成（Week 5-8）

**目标**：实现接近 Claude Code 原生的 Harness 能力，包括对话历史压缩和 Coordinator 模式。

这一阶段需要解决 Phase 1 评估出来的最大风险——如何通过 CDP 安全地读写 Trae 的对话历史。

**方案 A（推荐）：Shadow History**

不尝试直接操作 Trae 的 DOM 对话历史，而是在 mvp-runner 里维护一份**影子对话历史**（Shadow History）：每次 `fillPrompt` 和 `waitResponse` 都把内容记录到内存里，Harness 对影子历史做压缩，压缩后的摘要通过 `fillPrompt` 以"背景上下文"的形式注入到下一轮对话开头。

```
Shadow History（内存）
  ├── turn_1: {prompt: "...", response: "..."}
  ├── turn_2: {prompt: "...", response: "..."}
  ├── ...
  └── turn_N: {prompt: "...", response: "..."}

当 token 预算 >= 75% 时：
  1. 用 AI 把 turn_1 ~ turn_N-3 压缩成 500 字摘要
  2. 清空 turn_1 ~ turn_N-3
  3. 把摘要作为 [历史上下文] 注入下一轮 fillPrompt 的开头
  4. Trae IDE 侧的对话历史不动，不需要 DOM 操作
```

这个方案完全在 mvp-runner 内部实现，不依赖 Trae DOM 的任何特殊能力，风险可控。

**方案 B：Coordinator 模式**

对于超长任务（预计执行 >1 小时），引入 Coordinator 模式：把任务拆分成多个独立的子任务，每个子任务启动一个新的 Trae chat session（通过 `switchTask` 切换到不同的 task），每个 session 的 context 是独立的。Coordinator（一个专门的 mvp-runner 进程）负责：

- 把大任务拆分成子任务列表
- 按依赖顺序调度子任务执行
- 收集每个子任务的 `runs/*.md` 结果
- 聚合成最终报告

这个方案和现有的 `runner-multi.ts` 多工作区架构天然契合，PMCLI 和 DEVCLI 本身就是两个独立的 session，Coordinator 模式只是把这个能力泛化到任意任务粒度。

---

### Phase 4：与 LLM Wiki 深度融合（Week 9-10）

Harness 的 Compaction 和 LLM Wiki 的蒸馏在这一阶段合并为统一的知识管理系统：

```
Harness Compaction（实时在线）
  ↓ 压缩后的摘要
LLM Wiki Layer 1（任务级蒸馏，替代每日蒸馏）
  ↓ 每周合并
LLM Wiki Layer 2（核心知识，注入下一个任务的 system prompt）
```

Harness 产生的每次压缩摘要不再只是用于当前 session 的 context 续接，而是直接写入 LLM Wiki 的 Layer 1——这样蒸馏的粒度从"每日一次"变成"每次 context 压缩时"，记忆更新频率大幅提升，同时不增加额外的 LLM 调用成本（压缩本身就要调用 LLM，顺便蒸馏不额外付费）。

---

## 五、工作量与优先级评估

| 阶段 | 工作量 | 风险 | 价值 | 建议优先级 |
|------|--------|------|------|-----------|
| Phase 1：Context 监控 | 1周 | 极低 | 中（可观测性） | **立即启动** |
| Phase 2：轻量 Compaction | 1周 | 低 | 高（减少中断） | **Phase 1 完成后** |
| Phase 3A：Shadow History | 2周 | 中 | 极高（完整 Harness） | Phase 2 验证后 |
| Phase 3B：Coordinator 模式 | 3周 | 中 | 高（超长任务支持） | 与 3A 并行或之后 |
| Phase 4：Wiki 融合 | 1周 | 低 | 高（知识系统统一） | Phase 3 完成后 |

**总工时约 8~10 周**，但 Phase 1+2 只需 2 周，就能解决 60% 的中断问题，建议先交付这两个阶段验证价值，再决定是否推进 Phase 3。

---

## 六、结论

引入 Claude Code Harness 机制是**完全可行且高度推荐**的，理由如下：

Claude Code 的 Harness 架构和你们现有的 mvp-runner 在设计理念上高度一致——两者都是围绕"任务状态机 + 执行记录 + 上下文管理"构建的。Harness 不是一个需要从头实现的外部系统，而是对现有架构的**自然延伸**：token 预算跟踪插入 `waitResponse()`，轻量 Compaction 插入 `fillPrompt()`，Shadow History 复用 `runs/*.md` 的记录机制，Coordinator 模式复用 `runner-multi.ts` 的多工作区调度。

最重要的一点是：**Phase 2 的轻量 Compaction 方案不需要任何 DOM 操作，完全在 mvp-runner 内部实现，本周就可以开始开发，两周内就能验证效果**。这是性价比最高的切入点，建议作为下一个开发周期的首要任务。

---

**[READY_FOR_REVIEW]**
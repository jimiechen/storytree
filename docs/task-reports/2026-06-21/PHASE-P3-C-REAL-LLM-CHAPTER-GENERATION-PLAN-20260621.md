> 我是：前端工程师 / Novel 模块开发 Agent (Kimi-K2.7-Code)，本次任务：Phase P3-C Real LLM Chapter Generation 实施方案输出，职责范围：`packages/app/src/novel/`、`docs/task-reports/`；禁止触碰：其他模块源码。
> 越界操作申请：无。

# Phase P3-C：Real LLM Chapter Generation 实施方案

## 1. 阶段背景与目标

### 1.1 背景

- P3-0 完成了真实 LLM 的安全准备（FeatureGate、密钥策略、日志脱敏、事件协议）。
- P3-A 在 Chat Debug / AI 续写入口完成了第一次真实 LLM 试点调用与流式回显。
- P3-B 将真实 LLM 从 Chat Debug 试点迁移到「AI 续写」主 UI，实现了 `chapter.continue` 的流式事件聚合与 UI 预览。

### 1.2 本阶段目标

将真实 LLM 扩展到 `chapter.generate`（完整章节生成），在保持安全边界的前提下，增加：

1. 上下文裁剪（Context Assembler）
2. Token Budget 控制
3. 章节生成 Prompt Builder
4. 流式回显
5. 结果校验（空结果、过短、格式错误）
6. 失败重试与回退
7. 生成后可选信息审计
8. UI 写回仍需用户确认

### 1.3 阶段完成标记

```text
[READY_FOR_P3D_MODEL_ROUTING_AND_COST_GOVERNANCE]
```

---

## 2. 硬性边界

### 2.1 禁止事项

1. 禁止在前端源码中硬编码 API Key。
2. 禁止无 Token Budget 直接将超长上下文发给 LLM。
3. 禁止自动将生成结果覆盖章节正文。
4. 禁止无限重试导致费用失控。
5. 禁止批量生成多个章节。
6. 禁止记录完整 prompt / response。
7. 禁止默认开放给所有入口（仍受 FeatureGate 控制）。
8. 禁止真实调用未通过 gate 校验。
9. 禁止测试未通过提交。

### 2.2 允许事项

1. 在双 gate 开启时通过 `chapter.generate` 发起真实 LLM 调用。
2. 增加上下文裁剪、字数控制、失败重试。
3. 复用 P3-A/P3-B 的 `RealLLMExecutionAdapter`、`TargetLLMClient`、`LLMStreamEvent` 协议。
4. 新增测试覆盖生成、失败、重试、回退路径。
5. 测试通过后提交代码。

---

## 3. 当前状态

### 3.1 已有能力

| 文件 | 当前状态 | 说明 |
|------|---------|------|
| `chapter.generate.yaml` | v1，使用 `mock-generation-wrapper` | 未接入 `agent-run`，无 streaming |
| `chapter.continue.yaml` | v2，使用 `agent-run` | 已支持 adapter/stream 参数 |
| `agent-run.tool.ts` | 已支持 adapter 路由、流式执行 | 默认创建 real-llm adapter（无真实 transport） |
| `use-novel-workflow.ts` | 已支持 `chapter.continue` 流式事件聚合 | 可复用到 `chapter.generate` |
| `use-novel-llm-task.ts` | 已聚合 `LLMStreamEvent` → `AITask` | 可直接复用 |
| `real-llm-adapter.ts` | 已实现双 gate + stream | 支持 `chapter.generate` 与 `chapter.continue` |
| `target-llm-request-builder.ts` | 已支持 generate / continue prompt | generate prompt 较简单，P3-C 需增强 |

### 3.2 当前缺陷

1. `chapter.generate.yaml` 仍走 mock wrapper，未利用 P3-B 的 real-llm 路由。
2. 无上下文裁剪，prompt 可能无限增长。
3. 无 Token Budget 控制。
4. 无生成结果校验。
5. 无失败重试策略。
6. 生成结果未接入 info-theory audit。

---

## 4. 方案设计

### 4.1 总体链路

```text
UI 点击「开始生成」
→ NovelActionDispatcher.dispatch({ type: 'chapter.generate' })
→ YAML Workflow chapter.generate v2
→ agent-run Tool
→ AdapterRouter
→ RealLLMExecutionAdapter (gate 开启) / MockExecutionAdapter (gate 关闭)
→ TargetLLMClient
→ LLMStreamEvent
→ useNovelLLMTask 聚合
→ AI Task Panel / Progress Dock / AI Result Card 流式预览
→ GenerationResultValidator 校验
→ 用户点击「采纳」后写入章节
→ （可选）触发 info-theory audit
```

### 4.2 模块划分

```text
packages/app/src/novel/
├── llm/
│   ├── chapter-context-assembler.ts      # 新增：上下文裁剪与组装
│   ├── chapter-prompt-builder.ts         # 新增：章节生成专用 prompt
│   ├── token-budget.ts                   # 新增：token / 字符预算控制
│   ├── generation-result-validator.ts    # 新增：结果校验
│   └── retry-policy.ts                   # 新增：重试策略
├── adapters/
│   └── real-llm-adapter.ts               # 修改：接入 retry、validation
├── workflows/yaml/
│   └── chapter.generate.yaml             # 修改：v2 接入 agent-run
├── hooks/
│   └── use-novel-workflow.ts             # 修改：支持 chapter.generate 流式
├── components/novel-editor/
│   └── ai-result-card.tsx                # 修改：展示生成结果与校验提示
└── docs/phase-p3/
    └── p3-chapter-generation-scope.md    # 新增：P3-C 范围文档
```

---

## 5. 详细任务清单

### 5.1 Token Budget 与上下文裁剪

**新增文件**: `packages/app/src/novel/llm/token-budget.ts`

```typescript
export interface TokenBudget {
  maxPromptChars: number;      // 默认 6000 字符（约 2000 token 估算）
  maxResponseChars: number;    // 默认 8000 字符
  reserveChars: number;        // 为系统提示预留 500 字符
}

export const DEFAULT_CHAPTER_GENERATION_BUDGET: TokenBudget = {
  maxPromptChars: 6000,
  maxResponseChars: 8000,
  reserveChars: 500,
};

/**
 * 根据预算裁剪上下文文本。
 *
 * 策略：保留最近、最相关的尾部内容，头部做截断或摘要占位。
 */
export function trimContextToBudget(
  contextText: string,
  budget: TokenBudget,
): { text: string; wasTrimmed: boolean };
```

要求：

1. 不依赖分词器，使用字符数作为 proxy（中文 ≈ 1 token / 字，留 3x 余量）。
2. 裁剪后保留语义连续性，不能从句子中间截断。
3. 返回 `wasTrimmed` 标记，用于 UI 提示用户「上下文已裁剪」。
4. 支持配置覆盖，方便手动测试调整预算。

### 5.2 Context Assembler

**新增文件**: `packages/app/src/novel/llm/chapter-context-assembler.ts`

职责：

1. 收集 `NovelCommand` 中的 `text`、`selectedText`、`contextRefs`、`genre`、`style`。
2. 按优先级组装上下文：
   - 当前章节已有正文（最高优先级）
   - 选定文本 / 光标位置提示
   - 角色卡 / 世界观摘要（P3-C 只透传，不深度展开）
   - 目标字数
3. 调用 `trimContextToBudget` 裁剪。
4. 返回 `contextPayload`，供 Prompt Builder 使用。

### 5.3 Chapter Prompt Builder

**新增文件**: `packages/app/src/novel/llm/chapter-prompt-builder.ts`

职责：

1. 根据 `chapter.generate` 命令构造专用 prompt。
2. 区分：
   - 全新章节生成（`text` 为空或极短）
   - 基于已有草稿扩写
   - 基于大纲 / 细纲生成（P3-C 仅预留接口）
3. 注入目标字数要求（`targetWordCount`）。
4. 注入风格约束（`genre`、`style`、`tone`）。
5. 不记录完整 prompt 到日志。

### 5.4 结果校验器

**新增文件**: `packages/app/src/novel/llm/generation-result-validator.ts`

```typescript
export interface GenerationValidationResult {
  valid: boolean;
  text: string;
  issues: string[];
  wordCount: number;
}

export function validateGenerationResult(
  text: string,
  options?: { minWordCount?: number; maxWordCount?: number },
): GenerationValidationResult;
```

校验项：

1. 空结果 → `EMPTY_RESPONSE`
2. 过短（< 100 字或 < 50% targetWordCount）→ `RESULT_TOO_SHORT`
3. 包含 Markdown 代码块 / 列表 → `FORMAT_ISSUE`
4. 包含非正文内容（如「以下是续写：」）→ `PREAMBLE_POSTAMBLE`

要求：

1. 校验失败不崩溃，返回结构化 issue 列表。
2. UI 展示 issue，用户可重新生成或手动编辑后采纳。
3. 校验不阻塞流式回显，只在 `completed` 后执行。

### 5.5 重试策略

**新增文件**: `packages/app/src/novel/llm/retry-policy.ts`

```typescript
export interface RetryPolicy {
  maxAttempts: number;        // 默认 2（1 次原始 + 1 次重试）
  backoffMs: number;          // 默认 1000
  retryableErrorCodes: string[];
}

export const DEFAULT_GENERATION_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 2,
  backoffMs: 1000,
  retryableErrorCodes: [
    'LLM_REQUEST_TIMEOUT',
    'LLM_NETWORK_ERROR',
    'LLM_PROVIDER_ERROR',
    'LLM_EMPTY_RESPONSE',
  ],
};
```

职责：

1. 仅在 `maxAttempts > 1` 且错误码在 `retryableErrorCodes` 中时才重试。
2. 重试前等待 `backoffMs`。
3. 重试时更新 `requestId`，保证日志可追踪。
4. 重试仍失败返回最后一次错误，不伪成功。
5. 流式调用重试时，重新从头生成，不拼接上次 buffer。

### 5.6 Real LLM Adapter 增强

**修改文件**: `packages/app/src/novel/adapters/real-llm-adapter.ts`

变更：

1. 在 `executeStream` 中可选调用 `RetryPolicy`。
2. 流式完成后调用 `validateGenerationResult`。
3. 若校验失败且仍剩余重试次数，自动重试。
4. 把校验 issues 放入 `NovelAgentResult` 的 `metadata.validationIssues`。
5. 保持原有 gate 校验、日志脱敏、错误结构化不变。

### 5.7 chapter.generate.yaml 升级

**修改文件**: `packages/app/src/novel/workflows/yaml/chapter.generate.yaml`

从 v1 升级到 v2：

```yaml
id: chapter.generate
version: 2
commandType: chapter.generate
description: Generate a chapter through agent-run tool, route to real-llm when gate enabled.
steps:
  - id: agent-run-generate
    name: Agent Run Chapter Generation
    tool: agent-run
    inputs:
      adapter: "{{adapter}}"
      stream: "{{stream}}"
      projectId: "{{projectId}}"
      chapterId: "{{chapterId}}"
      branchId: "{{branchId}}"
      worktreeId: "{{worktreeId}}"
      modelProfileId: "{{modelProfileId}}"
      text: "{{text}}"
      targetWordCount: "{{targetWordCount}}"
      genre: "{{genre}}"
      style: "{{style}}"
      contextRefs: "{{contextRefs}}"
    outputs:
      result: result
      events: events
```

### 5.8 agent-run.tool.ts 扩展

**修改文件**: `packages/app/src/novel/plugins/core-writing-tools/agent-run.tool.ts`

变更：

1. `chapter.generate` 默认选择 `real-llm`（gate 开启时）或 `mock`（gate 关闭时）。
2. 解析 `targetWordCount`、`genre`、`style`、`contextRefs` 等输入。
3. 透传给 `RealLLMExecutionAdapter` 的 `AdapterContext`。

### 5.9 use-novel-workflow.ts 支持 chapter.generate 流式

**修改文件**: `packages/app/src/novel/hooks/use-novel-workflow.ts`

变更：

1. 识别 `chapter.generate` 命令，与 `chapter.continue` 同样走流式事件聚合。
2. 任务类型标记为 `'chapter-generation'`。
3. 保持不自动写回正文，结果进入 `AITask.output` 与 `preview`。

### 5.10 UI 结果卡增强

**修改文件**: `packages/app/src/novel/components/novel-editor/ai-result-card.tsx`

变更：

1. 展示 `validationIssues`（如果有）。
2. 「重新生成」按钮触发同命令重试。
3. 「采纳」按钮仍保持手动确认。
4. 流式过程中展示 Token Budget 已裁剪提示（如果 `wasTrimmed`）。

### 5.11 Info-Theory Audit 可选触发

**修改文件**: `packages/app/src/novel/hooks/use-novel-workflow.ts` 或 `agent-run.tool.ts`

变更：

1. 生成完成后，如果 `infoTheoryAuditAfterGeneration` gate 开启，自动触发 `info.extract`。
2. P3-C 默认不开启该 gate，仅预留调用点与测试。

### 5.12 文档

**新增文件**: `packages/app/src/novel/docs/phase-p3/p3-chapter-generation-scope.md`

内容：

1. P3-C 目标与边界。
2. Token Budget 设计。
3. 上下文裁剪策略。
4. 结果校验规则。
5. 重试策略。
6. 真实调用条件（双 gate + 受控 transport）。

---

## 6. 测试计划

### 6.1 单元测试

| 文件 | 测试内容 |
|------|---------|
| `token-budget.test.ts` | 预算裁剪、保留语义尾部、配置覆盖 |
| `chapter-context-assembler.test.ts` | 优先级组装、裁剪标记、字段透传 |
| `chapter-prompt-builder.test.ts` | generate / expand prompt、字数注入、风格注入 |
| `generation-result-validator.test.ts` | 空、过短、格式问题、前言后缀检测 |
| `retry-policy.test.ts` | 重试次数、退避、不可重试错误直接失败 |
| `real-llm-adapter.test.ts` | 接入 retry + validation、gate 阻断、流式事件 |
| `agent-run.tool.test.ts` | generate 默认路由、参数解析、上下文透传 |
| `chapter.generate.test.ts` | YAML workflow v2 执行、参数传递 |
| `use-novel-workflow.test.ts` | generate 走流式聚合、不自动写回 |

### 6.2 手动验证

真实 LLM 端到端调用仍不纳入默认 CI，需在受控环境手动执行：

```bash
# 假设已配置 DEEPSEEK_API_KEY
REAL_LLM_PILOT=1 bun test src/novel/llm/chapter-generation.manual.test.ts
```

验证项：

1. gate 开启后 `chapter.generate` 走 real-llm。
2. 超长上下文被裁剪并提示。
3. 生成过程可流式回显。
4. 结果进入 AI Result Card，不自动覆盖正文。
5. 结果过短或格式异常时显示 issue。
6. 网络超时后自动重试 1 次。
7. 日志脱敏，无完整 prompt/response。

---

## 7. 验收标准

| 编号 | 验收项 | 标准 |
|------|--------|------|
| 1 | `chapter.generate.yaml` v2 | 使用 `agent-run` Tool，支持 adapter/stream 参数 |
| 2 | Token Budget | 超长上下文被裁剪，不超出预算 |
| 3 | Prompt Builder | 生成专用 prompt，含字数 / 风格要求 |
| 4 | 流式回显 | 生成过程实时展示 preview |
| 5 | 结果校验 | 空/过短/格式问题被识别并展示 |
| 6 | 重试策略 | 可配置重试次数，网络/超时错误可重试 |
| 7 | 安全 | API Key 不进入前端，日志脱敏，默认 gate 关闭 |
| 8 | 不写回正文 | 结果先进结果卡，用户采纳后才写入 |
| 9 | 测试 | `bun typecheck` 0 errors，`bun test src/novel` 全通过，`bun run novel:precommit` PASSED |
| 10 | Git | 代码与报告已提交 |

---

## 8. 风险与未完成项

| 风险 | 说明 | 缓解 |
|------|------|------|
| 真实调用未验证 | P3-C 仍默认使用 disabled transport，真实调用需手动注入 | 与 P3-B 一致，真实调用验证留到受控环境手动执行 |
| Token Budget 不准确 | 使用字符数 proxy，可能与真实 token 数有偏差 | 预留配置覆盖，P3-D 可接入 tokenizer / usage |
| 上下文裁剪损失语义 | 粗暴截断可能影响生成质量 | 采用尾部保留 + 段落边界截断，P3-D 可引入摘要 |
| 重试费用 | 重试会再次产生调用费用 | 默认 maxAttempts=2，失败即停止 |

---

## 9. Git 提交计划

1. **代码提交**: `feat(novel): P3-C chapter generation with context budget and retry`
2. **报告提交**: `docs(novel): add Phase P3-C implementation plan`

---

## 10. 下一阶段

P3-C 完成后进入 **Phase P3-D：Model Routing + Cost Governance**，目标包括：

- ModelProfile / ModelRole 映射
- 多模型路由
- Token usage 记录
- 成本统计预留
- 真实失败时 fallback mock

---

## 11. 阶段进入标记

本方案待主控验收。验收方式：

- 通过：`[P3C_PLAN_ACCEPTED]` 或 `[APPROVED_FOR_P3C_IMPLEMENTATION]`
- 修改后通过：主控指出修改点，本 Agent 修订后重新提交


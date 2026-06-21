# Phase P2-C：Info-Theory Audit Tool 开发报告

**Agent 角色**：前端工程师 / Novel 模块开发 Agent (Kimi-K2.7-Code)  
**任务来源**：`caiode/docs/tabbit/06/Phase P2-C.md`  
**执行时间**：2026-06-21  
**报告路径**：`docs/task-reports/2026-06-21/PHASE-P2-C-INFO-THEORY-AUDIT-REPORT-20260621.md`

---

## 1. 本阶段目标

在 P2-B Tool Registry 基础上新增信息论建模服务与 `info-theory-audit` Tool，将 `info.extract` workflow 从 `NOT_IMPLEMENTED` 占位推进为可执行的信息论审计流程。核心要求：

- 提供稳定的 `InformationAtom`、`InformationLink`、`ChapterInformationState`、`InformationScore`、`InformationAuditWarning` 类型。
- 实现自信息、熵、互信息的 deterministic 计算。
- 实现基于规则的信息抽取、章节审计与评分。
- 注册 `info-theory-audit` Tool 并替换 `info.extract.yaml` 中的 `not-implemented`。
- 通过 YAML Workflow Engine 执行 `info.extract` 并返回 `state` / `score` / `events`。
- 不依赖真实 LLM、不写回真实 UI 状态、不破坏 P2-A/B 测试。

---

## 2. 阅读材料

- `caiode/docs/tabbit/06/Phase P2-C.md`
- `packages/app/src/novel/plugins/novel-tool-types.ts`
- `packages/app/src/novel/plugins/builtin-novel-tools.ts`
- `packages/app/src/novel/plugins/core-info-theory-tools/info-extract-placeholder.tool.ts`
- `packages/app/src/novel/workflows/yaml/info.extract.yaml`
- `packages/app/src/novel/workflows/engine/workflow-engine.ts`
- `packages/app/src/novel/workflows/engine/workflow-loader.test.ts`
- `packages/app/src/novel/types/information-flow.ts`

---

## 3. 新增 / 修改文件

### 新增信息论服务

- `packages/app/src/novel/info-theory/index.ts` — 模块聚合导出。
- `packages/app/src/novel/info-theory/information-types.ts` — `InformationAtomType`、`InformationAtom`、`InformationLink`、`InformationAuditWarning`、`ChapterInformationState`、`InformationScore` 等类型。
- `packages/app/src/novel/info-theory/text-segmenter.ts` — 将章节文本切分为可分析片段。
- `packages/app/src/novel/info-theory/information-extractor.ts` — 基于关键词与规则的 deterministic atom 抽取。
- `packages/app/src/novel/info-theory/entropy-calculator.ts` — 自信息 `I(x) = -log2(P(x))` 与熵 `H(X)` 计算。
- `packages/app/src/novel/info-theory/mutual-information-calculator.ts` — 面向小说结构的近似互信息与 link 构建。
- `packages/app/src/novel/info-theory/information-auditor.ts` — 章节信息审计：atoms / links / entropy / scores / warnings。

### 新增 Tool

- `packages/app/src/novel/plugins/core-info-theory-tools/info-theory-audit.tool.ts` — `info-theory-audit` Tool 实现。

### 新增测试

- `packages/app/src/novel/info-theory/entropy-calculator.test.ts`
- `packages/app/src/novel/info-theory/information-extractor.test.ts`
- `packages/app/src/novel/info-theory/mutual-information-calculator.test.ts`
- `packages/app/src/novel/info-theory/information-auditor.test.ts`
- `packages/app/src/novel/plugins/core-info-theory-tools/info-theory-audit.tool.test.ts`

### 修改

- `packages/app/src/novel/plugins/builtin-novel-tools.ts` — 注册 `info-theory-audit`，保留 `not-implemented`。
- `packages/app/src/novel/workflows/yaml/info.extract.yaml` — `tool: not-implemented` 改为 `tool: info-theory-audit`。
- `packages/app/src/novel/workflows/engine/workflow-loader.test.ts` — 更新断言，预期 `info.extract.yaml` 使用 `info-theory-audit`。

---

## 4. 信息论模型说明

```
InformationAtom
  ├─ id / projectId / chapterId
  ├─ type: character | event | location | item | relationship | conflict | clue | emotion | world-rule | theme
  ├─ title / content
  ├─ noveltyScore / relevanceScore / surpriseScore
  └─ selfInformation

InformationLink
  ├─ id / sourceAtomId / targetAtomId
  ├─ relationType: supports | contradicts | foreshadows | resolves | depends-on | echoes
  ├─ strength
  └─ mutualInformation

ChapterInformationState
  ├─ atoms / links
  ├─ entropyBefore / entropyAfter / entropyDelta
  ├─ selfInformationTotal / mutualInformationWithContext / conditionalEntropyAfter
  ├─ densityScore / redundancyScore / suspenseScore / progressionScore
  └─ warnings: InformationAuditWarning[]
```

- `InformationScore` 从 `ChapterInformationState` 聚合，返回 auditScore、各维度 score、atomCount、linkCount。
- 所有 score 均归一化到 `0..1`。
- 所有计算均为 deterministic，不引入随机数。

---

## 5. 自信息 / 熵 / 互信息计算说明

### 自信息

```text
I(x) = -log2(P(x))
```

- probability <= 0 时使用 epsilon。
- probability >= 1 时返回 0（避免 `-0`）。
- 结果通过 `safeNumber` 保证有限数值，不出现 `NaN` / `Infinity`。

### 熵

```text
H(X) = -sum(P(x) * log2(P(x)))
```

- 对正概率归一化后求和。
- 空数组或全零数组返回 0。

### 互信息（近似）

- 范围 `0..1`。
- 同类型 atom、标题/内容关键词重合会提高关联度。
- 基于关键词判断 `foreshadows`、`resolves`、`contradicts`、`echoes` 等关系。
- 不生成自环 link。

---

## 6. Info-Theory Audit Tool 说明

Tool 名称：`info-theory-audit`

输入解析优先级：

1. `input.text` / `input.content`
2. `context.variables.text` / `context.variables.content` / `context.variables.result.text`

执行逻辑：

1. 校验 `projectId` 与 `chapterId`，缺失返回结构化错误（`MISSING_PROJECT_ID` / `MISSING_CHAPTER_ID`）。
2. 调用 `auditChapterInformation(...)` 得到 `ChapterInformationState`。
3. 调用 `scoreChapterInformation(...)` 得到 `InformationScore`。
4. 生成 `info.theory.calculated` 事件。
5. 返回 `{ success: true, data: { state, score, events }, events }`。

约束：

- 不写回 UI。
- 不调用 `applyWorkflowEvents`。
- 不接 LLM / 网络 / 文件系统。
- 空文本返回 `success: true` 并携带 warnings。

---

## 7. Workflow Engine 集成说明

P2-B 已把 Engine 从硬编码 tool 分支改为通过 Tool Registry 执行。P2-C 无需改动 Engine 核心逻辑：

- `info.extract.yaml` 的 `tool: info-theory-audit` 由 Registry 解析并执行。
- Tool 返回的 `events` 进入 `WorkflowStepResult.output`。
- Engine 测试已验证 `info.extract` 返回 `state` / `score` / `events`。
- `not-implemented` 仍可通过自定义 workflow 返回 `NOT_IMPLEMENTED`。
- `chapter.generate` / `chapter.continue` 不回归。

---

## 8. YAML 更新说明

`packages/app/src/novel/workflows/yaml/info.extract.yaml`：

```yaml
id: info.extract
version: 1
commandType: info.extract
description: Extract and audit chapter information using deterministic information-theory heuristics.
steps:
  - id: info-theory-audit
    name: Info Theory Audit
    tool: info-theory-audit
    adapter: mock
    inputs:
      projectId: "{{projectId}}"
      chapterId: "{{chapterId}}"
      text: "{{text}}"
    outputs:
      state: state
      score: score
      events: events
```

- `info.extract` 现在可成功执行。
- 明确为 deterministic heuristic，不伪装为 LLM 提取。

---

## 9. Workspace / Branch / Model 字段透传说明

- `info-theory-audit` Tool 通过 `ToolContext` 接收 `projectId`、`chapterId`、`branchId`、`modelProfileId` 等字段。
- `context-assemble` tool 已负责聚合 workspace、branch、model 等上下文变量。
- 信息论服务本身不直接消费 branch / model，仅透传 `projectId` 与 `chapterId` 用于 atom / state 标识。

---

## 10. Chat Debug 兼容说明

P2-C 未切换 Chat Debug Runner。当前状态：

- YAML Engine 的 `info.extract` 已可执行并返回结构化结果。
- Chat Debug Runner 中的 `info.extract` 仍可能返回 `NOT_IMPLEMENTED`，因为 Runner 暂未切到 YAML Engine。
- 这是预期行为，P2-D 按钮绑定阶段再统一评估是否切换 Chat Debug Runner。

---

## 11. 测试结果

| 检查项 | 目标 | 实际 |
|---|---|---|
| `bun typecheck` | 0 errors | 0 errors ✅ |
| `bun test src/novel/info-theory` | 全部通过 | 28 pass / 0 fail ✅ |
| `bun test src/novel/plugins` | 全部通过 | 24 pass / 0 fail ✅ |
| `bun test src/novel/workflows/engine` | 全部通过 | 32 pass / 0 fail ✅ |
| `bun test src/novel/workflows` | 全部通过 | 50 pass / 0 fail ✅ |
| `bun test src/novel` | 全部通过 | 229 pass / 0 fail ✅ |
| 新增文件行数 | < 500 行 | 最大 `information-auditor.ts` 197 行 ✅ |
| OpenCode Core 侵入 | 禁止 | 0 侵入 ✅ |
| 真实 LLM / Git Worktree / 数据库 / 支付 / 云同步 | 禁止 | 未接入 ✅ |

### 修复记录

- `workflow-loader.test.ts` 中 `loads info.extract.yaml from file` 用例的断言从 `not-implemented` 更新为 `info-theory-audit`。

---

## 12. 风险与未完成项

| 风险 / 未完成项 | 说明 | 处理状态 |
|---|---|---|
| Chat Debug Runner 未切 YAML Engine | `/novel run info.extract` 仍可能返回 `NOT_IMPLEMENTED` | 已知，不阻塞 P2-C |
| 信息抽取为 heuristic | 不替代真实 NLP / LLM，仅提供可预测基线 | 已按 P2-C 要求实现 |
| 未加载项目级 / 用户自定义 Skill | FeatureGate 关闭，保持 P2 阶段限制 | 未触及 |

---

## 13. 下一阶段建议

进入 **Phase P2-D**：将 Novel 编辑器 UI 按钮（如“重新提取信息”）绑定到 YAML Engine 的 `info.extract` workflow，使 Chat Debug Runner 与 UI 共用同一执行路径。

---

## 14. 阶段完成标记

```text
[PHASE_P2_C_ACCEPTED]
[READY_FOR_P2D]
```

---

**Git 工作区**：存在未提交变更（含 P2-A0 / P2-0B / P2-A / P2-B / P2-C 相关文件）。系统级安全指令限制未自动提交，如需提交请明确指示。

# P2 总控提示词 + P2-0 执行提示词 评审意见

> 我是：前端工程师 / Novel 模块开发 Agent (Kimi-K2.7-Code)
> 本次任务：P2-CONTROL-PROMPT-REVIEW-20260619
> 职责范围：`caiode/docs/tabbit/06/` 文档评审、`docs/reviews/` 评审报告输出

---

## 一、评审对象

| 项目 | 内容 |
|------|------|
| 文件名 | `tabbit_二次开发规范与小说编辑器指南 (1).md` |
| 位置 | `caiode/docs/tabbit/06/` |
| 主题 | NovelForge Phase P2 总控提示词 + Phase P2-0 执行提示词 |
| 评审日期 | 2026-06-19 |

---

## 二、总体评价

该方案整体方向正确，边界清晰，阶段拆分合理，能够作为 Phase P2 的开发输入。核心优势在于：明确禁止真实 LLM / OpenCode Core 侵入、强制 STDD 方法、引入 FeatureGate 机制、将 Mock 工作流升级为配置化架构。

但文档存在以下主要问题：P2-0 文档产出过重、Action Contract 手动核查成本高、部分接口抽象不足、阶段顺序过于刚性、与当前代码目录结构存在不一致。

**评审结论：通过，但需按本报告建议精简并补充接口定义后进入执行。**

---

## 三、优点

1. **边界约束明确**
   - 明确禁止接入真实 LLM、OpenCode Server、ClaudeCode、数据库、支付、云同步。
   - 明确禁止修改 OpenCode Core，限定开发范围在 `packages/app/src/novel/`。

2. **阶段路线合理**
   - P2-0 基线 → P2-A0 Chat Debug → P2-A YAML Engine → P2-B Tool Registry → P2-C Info Theory → P2-D 按钮对齐 → P2-E Adapter Stub，依赖关系清晰。

3. **STDD 方法落地**
   - 每个子阶段要求先 Spec、再 Test、再 Develop，符合项目工程规范。

4. **FeatureGate 设计前置**
   - 提前识别 15 个 FeatureGate，避免未实现功能伪成功。

5. **验收标准具体**
   - 明确 typecheck、单元测试、E2E、FeatureGate、不破坏既有链路等要求。

---

## 四、问题与风险

### 4.1 P2-0 文档产出过重

方案要求 P2-0 输出 5-6 个独立文档：

- `p2-prd-coverage-matrix.md`
- `p2-action-execution-matrix.md`
- `p2-feature-gate-plan.md`
- `p2-p0-action-baseline.md`
- `p2-gap-report.md`
- 可选 `p2-stage-dependency-map.md`

**风险**：文档过多会导致 P2-0 阶段耗时过长，延缓编码开始。部分文档内容高度重叠（如 action matrix 与 p0 baseline）。

**建议**：合并为 3 个核心文档：
- `p2-baseline-matrix.md`：PRD 覆盖 + Action 执行矩阵合并。
- `p2-feature-gate-plan.md`：FeatureGate 清单。
- `p2-gap-report.md`：缺口与风险。

---

### 4.2 112 个 Action Contract 手动核查成本高

方案要求逐条核对 112 个交互点，并记录 14 个字段。这是一个高人工、高遗漏风险的工作。

**建议**：
- 提供半自动化脚本扫描 `packages/app/src/novel/components/` 和 `e2e/novel/` 中的 data-testid / 按钮 handler。
- 优先聚焦 P0 18 个核心动作和 P1 已实现的 20-30 个动作，其余标记为 FUTURE / FeatureGate。
- 不要求每个动作都记录 14 个字段，P0/P1 核心动作详细记录，其余简化为状态标记。

---

### 4.3 关键接口抽象不足

方案在“目标架构”中描述了模块关系，但缺少具体接口定义：

- `NovelWorkflowEngine` 的输入输出。
- `NovelTool` / `NovelToolPlugin` 的契约。
- `AgentExecutionAdapter` 的统一接口。
- `Workflow YAML` 的 schema 规范。
- `NovelCommand` / `NovelActionDispatcher` 的数据结构。

**风险**：不同子阶段由不同 Agent 执行时，接口理解不一致，集成困难。

**建议**：在 P2-0 或 P2-A 早期输出 `p2-interface-contract.md`，定义上述接口。

---

### 4.4 阶段顺序过于刚性

方案要求“必须按以下顺序执行，不允许跳阶段”。实际开发中，P2-A0 Chat Debug 与 P2-A YAML Engine 可以并行启动：Chat Debug 可以先基于现有 Mock workflow 实现，再逐步接入 YAML Engine。

**建议**：改为“推荐顺序”，明确各阶段输入依赖，允许在依赖满足的前提下并行或迭代。

---

### 4.5 与当前代码目录结构不一致

方案提到重点阅读 `packages/app/src/novel/stores/`，但当前代码中该目录可能不存在或内容为空。实际状态以 `providers/`、`hooks/`、`workflows/` 为主。

**建议**：P2-0 先确认当前目录结构，避免后续阶段基于错误假设设计。

---

### 4.6 P2-D 按钮绑定范围过大

方案要求 P2-D 对齐 18 个 P0 核心按钮。但 P2 阶段的核心目标是架构升级（YAML + Tool + Info Theory + Adapter Stub），不应承担全部 UI 动作实现。

**建议**：P2-D 聚焦 6-8 个与 YAML Workflow 直接相关的按钮（开始生成、AI 续写、重新提取、取消任务、采纳、忽略、保存草稿、标记完成），其余按钮在 P2-E 后或 P3 补齐。

---

### 4.7 P2-0 验收标准中 E2E 要求不当

方案在 P2-0 验收标准中列出 `bunx playwright test e2e/novel`。P2-0 以文档和基线为主，不应要求 E2E 全绿作为阶段验收条件。

**建议**：P2-0 验收标准改为“未破坏现有测试”即可，E2E 全绿作为 P2 整体验收标准。

---

### 4.8 缺少 Mock Workflow 到 YAML Workflow 的迁移策略

当前已有 `mock-generation-workflow.ts` 跑通主链路。方案未说明如何逐步替换为 YAML 工作流，存在“另起炉灶”风险。

**建议**：明确迁移策略：
1. P2-A 先让 YAML Engine 包装现有 `mock-generation-workflow` 逻辑。
2. P2-B 将硬编码步骤拆分为 Tool。
3. P2-E 将 MockAdapter 替换为 AdapterRouter。
4. 每个阶段保持 E2E 不回归。

---

## 五、修改建议汇总

| 序号 | 问题 | 建议 |
|------|------|------|
| 1 | P2-0 文档过多 | 合并为 3 个核心文档 |
| 2 | 112 Action 全量核对成本高 | 脚本辅助 + 聚焦 P0/P1 |
| 3 | 接口定义缺失 | 增加 `p2-interface-contract.md` |
| 4 | 阶段顺序刚性 | 改为推荐顺序，允许并行 |
| 5 | 目录结构假设错误 | P2-0 先确认当前目录 |
| 6 | P2-D 范围过大 | 聚焦 6-8 个核心按钮 |
| 7 | P2-0 要求 E2E | 改为不破坏现有测试 |
| 8 | 缺少迁移策略 | 明确 Mock → YAML 渐进替换路径 |

---

## 六、结论

该方案**评审通过（有条件）**。建议在采纳上述 8 条修改建议后，按调整后的实施方案进入 P2-0 执行。

---

[READY_FOR_MAIN_CONTROL_REVIEW]

> 我是：前端工程师 / Novel 模块开发 Agent（Kimi-K2.7-Code），本次任务：Phase P2 Review 实施方案编制与提交主控评审，职责范围：`packages/app/src/novel/`、`docs/task-reports/`、`workspaces/kimik27code/`；禁止触碰：`packages/opencode/`、`packages/sdk/`、`packages/plugin/`、`packages/desktop/`、`packages/ui/`、根目录 package.json / turbo.json / tsconfig。
> 越界操作申请：无。

# Phase P2 Review：P2 总体验收实施方案

## 1. 评审目标

对 Phase P2 全部阶段（P2-0 / P2-A0 / P2-0B / P2-A / P2-B / P2-C / P2-D / P2-E）进行冻结验收，确认 NovelForge 已具备进入 P3 真实 LLM 试点的完整架构闭环与工程治理基础。

## 2. 评审范围

| 范围 | 说明 |
|---|---|
| 代码范围 | `caiode/opencode-1.4.0/packages/app/src/novel/`、`scripts/trae-hooks/`、`.trae/hooks.json` |
| 文档范围 | `packages/app/src/novel/docs/phase-p2/`、`docs/task-reports/2026-06-21/` |
| 交付阶段 | P2-0 至 P2-E 全部阶段报告 |
| 外部边界 | 确认未引入真实 LLM / OpenCode / ClaudeCode / Git Worktree / 支付 / 云同步 |

## 3. 评审组织

| 角色 | 职责 |
|---|---|
| 主控（用户/PM） | 裁定是否通过、是否进入 P3、是否扣分/返工 |
| 开发 Agent（Kimi-K2.7-Code） | 准备验收材料、执行检查清单、输出评审报告、修复发现的问题 |
| Hook / Precommit | 自动执行类型检查、测试、行数、注释、禁止项扫描 |

## 4. 评审输入材料

| 材料 | 路径 | 状态 |
|---|---|---|
| P2-0 PRD / Action / FeatureGate / Interface 基线 | `packages/app/src/novel/docs/phase-p2/` | 已完成 |
| P2-A0 Chat Debug Console 报告 | `docs/task-reports/2026-06-21/` | 已完成 |
| P2-0B Workspace / Skills / Commands / Branch / Model 契约 | `packages/app/src/novel/docs/phase-p2/p2-workspace-skill-command-contract.md` | 已完成 |
| P2-A Workspace-aware YAML Workflow Engine 报告 | `docs/task-reports/2026-06-21/PHASE-P2-A-WORKSPACE-AWARE-YAML-WORKFLOW-ENGINE-REPORT-20260620.md` | 已完成 |
| P2-B Plugin Tool Registry 报告 | `docs/task-reports/2026-06-21/PHASE-P2-B-PLUGIN-TOOL-REGISTRY-REPORT-20260621.md` | 已完成 |
| P2-C Info-Theory Audit Tool 报告 | `docs/task-reports/2026-06-21/PHASE-P2-C-INFO-THEORY-AUDIT-REPORT-20260621.md` | 已完成 |
| P2-D Core UI Button Binding 报告 | `docs/task-reports/2026-06-21/PHASE-P2-D-CORE-UI-BUTTON-BINDING-REPORT-20260621.md` | 已完成 |
| P2-E Adapter Router + Stub + Commit Governance 报告 | `docs/task-reports/2026-06-21/PHASE-P2-E-ADAPTER-ROUTER-STUB-COMMIT-GOVERNANCE-REPORT-20260621.md` | 已完成 |
| P2 最终验收基准 | `packages/app/src/novel/docs/phase-p2/p2-final-acceptance.md` | 本方案同步产出 |

## 5. 评审步骤

### 5.1 预评审（开发 Agent 自检）

1. 拉取最新 `main`，确认工作区干净。
2. 执行 `bun run novel:precommit`。
3. 执行 `bun typecheck`。
4. 执行 `bun test src/novel`。
5. 执行专项测试：`bun test src/novel/adapters`、`bun test src/novel/plugins`、`bun test src/novel/workflows/engine`、`bun test src/novel/actions`。
6. 检查所有 P2 代码文件行数 ≤ 500 行。
7. 检查 Git 提交记录与提交信息规范。
8. 检查 `.trae/hooks.json` 与 `novel:precommit` 配置完整。
9. 输出自检报告与问题清单。

### 5.2 正式评审（主控执行）

1. 审阅 P2-0 至 P2-E 阶段报告。
2. 对照本方案第 6 节验收标准逐项确认。
3. 检查阻断条件清单（第 7 节）。
4. 评估风险清单（第 8 节）。
5. 确认 P3 准入清单（第 9 节）。
6. 给出验收结论：
   - `[PHASE_P2_REVIEW_ACCEPTED]` + `[APPROVED_FOR_P3_0]`
   - 或 `[PHASE_P2_REVIEW_REJECTED]` + `[NEED_FIX_BEFORE_P3_0]`

### 5.3 评审后收尾

1. 如通过，更新 `task-source-record.md` 当前阶段为 P3-0。
2. 冻结 P2 代码，后续只允许缺陷修复，不新增 P2 范围功能。
3. 将 P2 最终验收报告归档至 `docs/task-reports/2026-06-21/PHASE-P2-FINAL-REVIEW-REPORT-20260621.md`。

## 6. 验收标准

### 6.1 架构闭环

| 检查项 | 验收标准 | 验证方式 |
|---|---|---|
| UI 核心按钮已接 YAML Engine | 开始生成 / AI 续写 / 浮动续写 / 重新提取信息 均走 Workflow | 代码审查 + 单元测试 |
| Tool Registry 替代硬编码 tool | `chapter.generate`、`chapter.continue`、`info.extract` 均通过 Registry 调用 Tool | 代码审查 + `builtin-novel-tools.test.ts` |
| info.extract 可执行 | 调用 `info-theory-audit` Tool 返回 state / score / events | `info-theory-audit.tool.test.ts` |
| AdapterRouter 具备边界 | 默认 mock、显式 disabled adapter 返回 `ADAPTER_DISABLED`、不伪成功 | `adapter-router.test.ts`、`agent-run.tool.test.ts` |
| 真实外部服务仍关闭 | `realLLMEnabled`、`openCodeAdapterEnabled`、`claudeCodeAdapterEnabled` 均为 false | 代码审查 + `feature-gates.ts` |
| Workspace / Branch / Model 字段透传 | `branchId`、`worktreeId`、`modelProfileId`、`modelRole` 不触发真实操作 | `workflow-engine.test.ts`、`agent-run.tool.test.ts` |

### 6.2 工程治理闭环

| 检查项 | 验收标准 | 验证方式 |
|---|---|---|
| TRAE Hook 配置存在 | `.trae/hooks.json` 配置 SessionStart / PreToolUse / PostToolUse / Stop | 文件检查 |
| novel:precommit 可执行 | `bun run novel:precommit` 通过或仅有允许的 warning | 命令执行 |
| 中文注释规范 | 新增复杂逻辑文件均含中文注释 | `novel-precommit-check.ts` + 人工抽查 |
| BLACKBOX createStore 规则 | 至少进入 warning，新增 ViewModel 违规应 fail | `novel-precommit-check.ts` |
| Git 提交记录完整 | P2-A ~ P2-E 均有对应 commit，message 符合规范 | `git log` |
| 工作区干净 | 除已声明的非 P2 材料外无未提交代码 | `git status` |

### 6.3 测试结果

| 命令 | 目标 | 当前基线 |
|---|---|---|
| `bun run novel:precommit` | 通过 | ✅ PASSED |
| `bun typecheck` | 0 errors | ✅ 0 errors |
| `bun test src/novel/adapters` | 通过 | ✅ 20 pass / 0 fail |
| `bun test src/novel/plugins` | 通过 | ✅ 31 pass / 0 fail |
| `bun test src/novel/workflows/engine` | 通过 | ✅ 32 pass / 0 fail |
| `bun test src/novel/actions` | 通过 | ✅ 7 pass / 0 fail |
| `bun test src/novel` | 通过 | ✅ 260 pass / 0 fail |

## 7. 阻断条件

出现以下任一情况，P2 Review 不通过：

- [ ] P2-E 未通过
- [ ] AdapterRouter 未实现或不稳定
- [ ] disabled adapter 返回成功（伪成功）
- [ ] Stub 调用了真实外部服务
- [ ] `novel:precommit` 缺失或不可用
- [ ] Hook 配置缺失且无替代审查
- [ ] `bun typecheck` 失败
- [ ] `bun test src/novel` 失败
- [ ] 未提交代码
- [ ] 阶段报告缺少 Git hash
- [ ] 修改 OpenCode Core 未说明
- [ ] 引入真实 LLM 请求
- [ ] 执行真实 git worktree
- [ ] FeatureGate 不完整
- [ ] Git 工作区存在未解释的代码改动

## 8. 风险清单

| 风险 | 等级 | 说明 | 缓解措施 |
|---|---|---|---|
| Playwright E2E 环境未配置 | 中 | P2-E 未执行 E2E | P2 Review 不阻塞，P3-0 优先补齐 E2E 基线 |
| `workspace-view-model.ts` 多 createSignal | 低 | 历史遗留，precommit 仅 warning | 记录为技术债务，P3 非阻塞 |
| Chat Debug 适配器参数未全量回归 | 低 | 已加单元测试，但无 E2E | P3-0 增加 Chat Debug E2E |
| 真实 LLM 接入冲动 | 高 | 团队可能提前接入真实 API | P3-0 通过 FeatureGate + precommit 拦截硬编码 key/endpoint |
| 后续阶段范围蔓延 | 中 | P3 可能一次性接入过多模型 | P3-0 锁定第一次真实调用范围 |

## 9. P3 准入清单

进入 P3-0 前必须确认：

- [ ] P2 Review 正式通过
- [ ] `main` 分支已冻结 P2 代码
- [ ] 真实 LLM FeatureGate 设计完成
- [ ] 密钥策略文档就位
- [ ] 前端不持有 API Key 的约束写入 precommit
- [ ] 流式事件协议初稿就位
- [ ] 日志脱敏方案就位
- [ ] P3-A 第一次真实调用范围被锁定
- [ ] 下一阶段任务来源已更新

## 10. 时间计划

| 阶段 | 时间 | 产出 |
|---|---|---|
| 开发 Agent 自检 | 1 小时内 | 自检报告、问题清单 |
| 主控评审 | 1 小时内 | 评审结论 |
| 问题修复（如有） | 4 小时内 | 修复 commit、复测报告 |
| 归档与阶段切换 | 30 分钟 | 最终验收报告、task-source 更新 |

## 11. 预期完成标记

评审通过后输出：

```text
[PHASE_P2_REVIEW_ACCEPTED]
[APPROVED_FOR_P3_0]
[READY_FOR_REAL_LLM_READINESS]
```

评审不通过输出：

```text
[PHASE_P2_REVIEW_REJECTED]
[NEED_FIX_BEFORE_P3_0]
```

## 12. 附录：当前 P2 关键提交

| 提交 | 信息 | 说明 |
|---|---|---|
| `f7be931d` | feat(novel): P2-A~P2-D YAML workflow engine, tool registry, info-theory audit and UI action binding | P2-A~P2-D 代码 |
| `5e2b6038` | docs(novel): add Phase P2-D core UI button binding report | P2-D 报告 |
| `a44eb7f8` | docs(novel): complete Phase P2-D report with all sections and READY_FOR_P2E | P2-D 报告完整版 |
| `7bc5211c` | feat(novel): P2-E adapter router stubs and commit governance hooks | P2-E 代码 |
| `81b0773e` | docs(novel): update Phase P2-E report with commit hash | P2-E 报告回填 |
| `762e837a` | docs(rules): update agent score record for Phase P2-E | 扣分档案更新 |

## 13. 附录：相关文档链接

- [PHASE-P2-E-ADAPTER-ROUTER-STUB-COMMIT-GOVERNANCE-REPORT-20260621.md](PHASE-P2-E-ADAPTER-ROUTER-STUB-COMMIT-GOVERNANCE-REPORT-20260621.md)
- [PHASE-P2-D-CORE-UI-BUTTON-BINDING-REPORT-20260621.md](PHASE-P2-D-CORE-UI-BUTTON-BINDING-REPORT-20260621.md)
- [PHASE-P2-C-INFO-THEORY-AUDIT-REPORT-20260621.md](PHASE-P2-C-INFO-THEORY-AUDIT-REPORT-20260621.md)
- [PHASE-P2-B-PLUGIN-TOOL-REGISTRY-REPORT-20260621.md](PHASE-P2-B-PLUGIN-TOOL-REGISTRY-REPORT-20260621.md)
- [PHASE-P2-A-WORKSPACE-AWARE-YAML-WORKFLOW-ENGINE-REPORT-20260620.md](PHASE-P2-A-WORKSPACE-AWARE-YAML-WORKFLOW-ENGINE-REPORT-20260620.md)
- [p2-final-acceptance.md](../../../caiode/opencode-1.4.0/packages/app/src/novel/docs/phase-p2/p2-final-acceptance.md)

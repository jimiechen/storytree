# Phase P2 最终验收基准

> 本文件定义 NovelForge Phase P2（P2-0 ~ P2-E）的冻结验收标准。
> 只有全部满足以下基准，才能宣布 P2 通过并进入 P3 真实 LLM 试点。

---

## 一、验收版本

- **验收日期**：2026-06-21
- **验收对象**：`main` 分支 P2-A ~ P2-E 全部提交
- **关键提交**：
  - `f7be931d` feat(novel): P2-A~P2-D YAML workflow engine, tool registry, info-theory audit and UI action binding
  - `7bc5211c` feat(novel): P2-E adapter router stubs and commit governance hooks
  - `81b0773e` docs(novel): update Phase P2-E report with commit hash
  - `762e837a` docs(rules): update agent score record for Phase P2-E

---

## 二、架构闭环验收

### 2.1 数据流闭环

必须确认 NovelForge 已具备以下端到端链路：

```text
UI Button / Chat Debug
→ NovelActionDispatcher
→ NovelCommand
→ Workspace-aware YAML Workflow Engine
→ Tool Registry
→ Info-Theory Tool / Mock Tool / agent-run Tool
→ AdapterRouter / Mock Adapter / Stub Adapter
→ Workflow Result / Events
→ UI / Provider 消费
```

### 2.2 具体检查项

| 编号 | 检查项 | 验收标准 | 验证命令 / 文件 |
|---|---|---|---|
| A-01 | UI 核心按钮已接 YAML Engine | 开始生成、AI 续写、浮动续写、重新提取信息均走 Workflow | `bun test src/novel/actions` |
| A-02 | Tool Registry 替代硬编码 | `chapter.generate`、`chapter.continue`、`info.extract` 通过 Registry 调用 Tool | `bun test src/novel/plugins` |
| A-03 | info.extract 可执行 | 返回 state / score / events，不调用外部服务 | `bun test src/novel/plugins/core-info-theory-tools` |
| A-04 | AdapterRouter 具备边界 | 默认 mock；显式请求 disabled adapter 返回 `ADAPTER_DISABLED` | `bun test src/novel/adapters` |
| A-05 | 外部 Adapter 仅为 Stub | OpenCode / ClaudeCode Stub 不调用真实服务 | `bun test src/novel/adapters` |
| A-06 | Workspace / Branch / Model 字段透传 | `branchId`、`worktreeId`、`modelProfileId`、`modelRole` 不触发真实操作 | `bun test src/novel/workflows/engine` |
| A-07 | 不写真实小说项目文件 | Mock Provider 仅操作内存数据 | `bun test src/novel/hooks` |

---

## 三、工程治理验收

### 3.1 治理闭环

```text
TRAE Hook
→ novel:precommit
→ 中文注释规范
→ BLACKBOX 验收规则
→ 单元测试
→ Git commit
```

### 3.2 具体检查项

| 编号 | 检查项 | 验收标准 | 验证方式 |
|---|---|---|---|
| G-01 | TRAE Hook 配置存在 | `.trae/hooks.json` 已配置 SessionStart / PreToolUse / PostToolUse / Stop | 文件检查 |
| G-02 | novel:precommit 可执行 | `bun run novel:precommit` 通过 | 命令执行 |
| G-03 | 中文注释规范 | 新增复杂逻辑文件含中文注释 | precommit + 人工抽查 |
| G-04 | 文件行数控制 | `src/novel/` 下单文件 ≤ 500 行 | precommit |
| G-05 | 禁止真实外部调用 | 无硬编码 LLM endpoint / API Key / Git Worktree | precommit |
| G-06 | BLACKBOX createStore 规则 | 已接入检查或 warning | precommit |
| G-07 | Git 提交记录完整 | P2-A ~ P2-E 均有 commit，message 规范 | `git log` |
| G-08 | 工作区干净 | 除声明的非 P2 材料外无未提交代码 | `git status` |

---

## 四、测试结果基线

| 命令 | 目标 | 当前基线 |
|---|---|---|
| `bun run novel:precommit` | 通过 | ✅ PASSED |
| `bun typecheck` | 0 errors | ✅ 0 errors |
| `bun test src/novel/adapters` | 通过 | ✅ 20 pass / 0 fail |
| `bun test src/novel/plugins` | 通过 | ✅ 31 pass / 0 fail |
| `bun test src/novel/workflows/engine` | 通过 | ✅ 32 pass / 0 fail |
| `bun test src/novel/actions` | 通过 | ✅ 7 pass / 0 fail |
| `bun test src/novel` | 通过 | ✅ 260 pass / 0 fail |

---

## 五、阻断条件

只要出现以下任一情况，P2 最终验收不通过：

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

---

## 六、已知风险与未完成项

| 风险 | 等级 | 说明 | 处理建议 |
|---|---|---|---|
| Playwright E2E 未执行 | 中 | 环境未配置 | P2 不阻塞，P3-0 补齐 |
| `workspace-view-model.ts` 多 createSignal | 低 | 历史遗留 | 记为技术债务，P3 择机重构 |
| Chat Debug 无 E2E 回归 | 低 | 已有单元测试 | P3-0 增加 |
| 真实 LLM 接入冲动 | 高 | 可能提前调用真实 API | P3-0 通过 FeatureGate + precommit 拦截 |

---

## 七、P3 准入清单

进入 P3-0 前必须确认：

- [ ] 本验收基准全部通过
- [ ] 主控输出 `[PHASE_P2_REVIEW_ACCEPTED]`
- [ ] `main` 分支已冻结 P2 代码
- [ ] 真实 LLM FeatureGate 设计完成
- [ ] 密钥策略文档就位
- [ ] 前端不持有 API Key 的约束写入 precommit
- [ ] 流式事件协议初稿就位
- [ ] 日志脱敏方案就位
- [ ] P3-A 第一次真实调用范围被锁定

---

## 八、验收结论模板

```text
[PHASE_P2_REVIEW_ACCEPTED]
[APPROVED_FOR_P3_0]
[READY_FOR_REAL_LLM_READINESS]
```

或：

```text
[PHASE_P2_REVIEW_REJECTED]
[NEED_FIX_BEFORE_P3_0]
```

---

## 九、相关文档

- [PHASE-P2-E-ADAPTER-ROUTER-STUB-COMMIT-GOVERNANCE-REPORT-20260621.md](../../../../../../../../docs/task-reports/2026-06-21/PHASE-P2-E-ADAPTER-ROUTER-STUB-COMMIT-GOVERNANCE-REPORT-20260621.md)
- [PHASE-P2-D-CORE-UI-BUTTON-BINDING-REPORT-20260621.md](../../../../../../../../docs/task-reports/2026-06-21/PHASE-P2-D-CORE-UI-BUTTON-BINDING-REPORT-20260621.md)
- [PHASE-P2-FINAL-REVIEW-PLAN-20260621.md](../../../../../../../../docs/task-reports/2026-06-21/PHASE-P2-FINAL-REVIEW-PLAN-20260621.md)

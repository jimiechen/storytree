# Phase P2 提交审查清单

> 角色：前端工程师 / Novel 模块开发 Agent
> 任务：Phase P2-E Commit Governance
> 日期：2026-06-21

---

## 1. 提交前必须执行

```bash
cd packages/app
bun run novel:precommit
```

## 2. novel:precommit 检查项

| 检查项 | 级别 | 说明 |
|--------|------|------|
| `bun typecheck` | error | 类型必须全部通过 |
| `bun test src/novel` | error | Novel 全量测试必须通过 |
| 单文件代码行数 ≤ 500 | error | 超过必须拆分 |
| 空 handler / `TODO: implement` | error | 禁止伪成功占位 |
| 真实 LLM endpoint 硬编码 | error | 禁止真实外部服务 |
| 修改 OpenCode Core | error | 禁止触碰 packages/opencode/ 等 |
| 复杂逻辑缺少中文注释 | error | P2-E 新增复杂代码必须补充 |
| ViewModel 多相关 createSignal | warning | 历史遗留可先 warning，新增应 fail |
| git worktree / merge / rebase / push --force | error | P2 禁止高风险 Git 操作 |

---

## 3. Git 提交规范

- Commit message 遵循 Conventional Commits。
- 必须包含任务编号或阶段范围，例如 `feat(novel): P2-E adapter router and commit governance`。
- 禁止混入 `dist/`、`node_modules/`、tabbit 提示词文档、二进制截图。
- 工作区应在提交后保持干净（允许的未提交文件需分类说明）。

---

## 4. 提交后检查

```bash
git status
```

确认：
- [ ] 提交信息符合规范
- [ ] 无无关文件混入
- [ ] 阶段报告含 `[READY_*]` 标记
- [ ] typecheck / test 已通过

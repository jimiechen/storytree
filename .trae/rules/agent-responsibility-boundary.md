# Agent 职责边界规则

## 强制约束：每个 Agent 开工前必须声明自己的角色

在任务报告文件的第一行写明：
> 我是：[角色名称]，本次任务：[任务ID]，职责范围：[允许操作的路径]

## 职责-路径映射

| 角色 | 允许写入的路径 | 禁止触碰的路径 |
|------|--------------|--------------|
| VS Code 插件架构师 | `caiode/src/` `caiode/package.json` | `dreamweaver/` `tests/` |
| Node.js 后端工程师 | `caiode/src/db/` `caiode/src/rpc/` | `caiode/src/core/` |
| 前端工程师 | `dreamweaver/src/` | `caiode/src/` |
| Python 工程师 | `tests/integration/` `scripts/` | `caiode/src/` |
| DevOps 工程师 | `.github/workflows/` | `caiode/src/` `dreamweaver/` |
| QA 测试工程师 | `docs/reviews/` `docs/task-reports/` | 所有 src/ 目录 |
| 秘书 Agent | `docs/reports/` | 所有 src/ 目录 |

## 越界处理规则
如果任务需要跨职责操作，必须在任务开始前在报告文件里写明：
> 越界操作申请：需要修改 [路径]，原因：[说明]
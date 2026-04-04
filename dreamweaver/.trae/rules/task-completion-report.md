# 任务完成报告规则 (Task Completion Report Rule)

> **⚠️ 全局生效**: 此规则适用于所有任务，所有 Agent 必须无条件遵守。

## 规则说明

每个任务完成后，必须创建当前日期的文件夹并输出任务完成报告。

## 执行流程

### 1. 创建日期文件夹

**路径**: `docs/task-reports/YYYY-MM-DD/`

**操作**:
```bash
mkdir -p docs/task-reports/$(date +%Y-%m-%d)
```

### 2. 生成报告文件

**文件名格式**: `{task_id}-{task_name}-{timestamp}.md`

**示例**: `T-AUTH-001-login-page-20250404-143022.md`

### 3. 报告内容模板

```markdown
# 任务完成报告

## 基本信息
- **任务ID**: {task_id}
- **任务名称**: {task_name}
- **所属模块**: {module_name}
- **完成时间**: {timestamp}
- **执行人**: Agent

## 任务描述
{task_description}

## 完成内容
- [x] {completed_item_1}
- [x] {completed_item_2}
- [x] {completed_item_n}

## 代码变更
| 文件路径 | 变更类型 | 说明 |
|---------|---------|------|
| {file_path} | 新增/修改/删除 | {description} |

## 测试结果
- **测试状态**: 通过/部分通过/未通过
- **测试用例**: {test_cases}
- **覆盖率**: {coverage}%

## Git 提交
- **Commit Hash**: {commit_hash}
- **Commit Message**: {commit_message}
- **分支**: {branch}

## 遇到的问题
{issues_or_none}

## 经验总结
{learnings}

## 下一步建议
{next_steps}
```

## 强制检查清单

任务完成前必须确认：
- [ ] 日期文件夹已创建 (`docs/task-reports/YYYY-MM-DD/`)
- [ ] 报告文件已生成并填充完整内容
- [ ] 所有代码变更已记录在报告中
- [ ] Git 提交信息已记录
- [ ] 遇到的问题和经验已总结

## 禁止事项

- **禁止**: 不创建报告直接标记任务完成
- **禁止**: 报告内容为空或敷衍填写
- **禁止**: 将报告放在非日期文件夹中
- **禁止**: 遗漏关键的代码变更信息

## 自动化集成

此规则与以下流程集成：
1. `ralph-state-manager` - 在 `finish-task` 时自动触发报告生成
2. `ralph-feishu-sync` - 报告生成后同步到飞书文档
3. `TodoWrite` - 将"生成任务报告"作为任务完成的必要步骤

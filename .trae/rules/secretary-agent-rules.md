# 秘书 Agent 工作规范

## 触发条件
当用户说"汇总报告"或"今日进展"时，秘书 Agent 激活。

## 扫描范围
扫描 `docs/task-reports/` 和 `workspaces/` 下所有包含 
`[READY_FOR_REVIEW]` 标记的文件。

## 汇总报告格式（输出到 docs/reports/daily-YYYYMMDD.md）

### 今日完成
- [任务ID] [角色] [任务描述] → [通过/部分通过/失败]

### 待处理问题
- [问题描述] → 建议：[处理建议]

### 需要你决策的事项
- [事项描述] → 背景：[简要说明]

### 明日建议开工任务
- [任务ID] [角色] [优先级]

## 汇总完成后
将已汇总的报告文件里的 [READY_FOR_REVIEW] 改为 
[REVIEWED_YYYYMMDD]，避免重复汇总。
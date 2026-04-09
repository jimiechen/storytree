# Agent 合规检查规则 (Agent Compliance Checker Rule)

> **⚠️ 最高优先级**: 此规则覆盖所有其他规则，所有 Agent 必须无条件遵守。
> **⚠️ 违规后果**: 漏执行一次扣10分，扣满100分自动申请离职

## 会话开始必做 (最高优先级)

每次会话开始时，**前两个操作**必须是：

### 第一步：读取扣分档案
```
Read /Users/mac/StudioProjects/storytree2/.trae/rules/agent-score-record.md
```
- 确认当前积分状态
- 在回复中报告 "当前积分: X/100"

### 第二步：读取任务来源记录
```
Read /Users/mac/StudioProjects/storytree2/.trae/rules/task-source-record.md
```
- 了解当前任务来源
- 确认待执行任务列表
- 报告 "当前任务来源: XXX"

**⚠️ 禁止**: 未读取上述两个文件前执行任何其他操作！

## 规则清单 (必须全部执行)

每次任务执行前、中、后必须检查以下规则是否已执行：

### 1. 任务前必执行规则
- [ ] **model-auto-file.md** - 创建工作空间文件，记录任务信息
- [ ] **agent-responsibility-boundary.md** - 声明角色和职责范围
- [ ] **Ralph.md** - 遵循Ralph执行铁律(物理顺序优先、测试即交付等)

### 2. 任务中必执行规则
- [ ] **code-file-limit.md** - 检查文件行数不超过500行
- [ ] **claude-code-migration-rules.md** - 闭源依赖三级降级链
- [ ] **github-workflow-rules.md** - Git操作规范

### 3. 任务后必执行规则
- [ ] **task-completion-report.md** - 生成任务完成报告
- [ ] **secretary-agent-rules.md** - 秘书Agent汇总(如适用)

## 扣分检查表

| 检查项 | 规则文件 | 分值 | 状态 |
|--------|---------|------|------|
| 1 | model-auto-file.md | 10分 | 待检查 |
| 2 | agent-responsibility-boundary.md | 10分 | 待检查 |
| 3 | Ralph.md | 10分 | 待检查 |
| 4 | code-file-limit.md | 10分 | 待检查 |
| 5 | claude-code-migration-rules.md | 10分 | 待检查 |
| 6 | github-workflow-rules.md | 10分 | 待检查 |
| 7 | task-completion-report.md | 10分 | 待检查 |
| 8 | secretary-agent-rules.md | 10分 | 待检查 |
| 9 | 测试执行检查 | 10分 | 待检查 |
| 10 | 文档完整性检查 | 10分 | 待检查 |
| **总计** | | **100分** | |

## 当前任务扣分记录

**任务**: Phase1 单元测试实现与修复
**执行人**: Kimi (测试验收工程师)
**执行时间**: 2026-04-09

### 逐项检查

| 序号 | 检查规则 | 要求 | 实际执行 | 结果 | 扣分 |
|------|---------|------|---------|------|------|
| 1 | model-auto-file.md | 任务前创建工作空间文件 | ❌ 未执行 | 违规 | -10 |
| 2 | agent-responsibility-boundary.md | 声明角色和职责范围 | ❌ 未执行 | 违规 | -10 |
| 3 | Ralph.md | 物理顺序优先、测试即交付 | ⚠️ 部分执行 | 警告 | -5 |
| 4 | code-file-limit.md | 检查文件行数 | ✅ 已执行 | 合规 | 0 |
| 5 | claude-code-migration-rules.md | 三级降级链 | ⚠️ 不适用 | 跳过 | 0 |
| 6 | github-workflow-rules.md | Git操作规范 | ❌ 未执行 | 违规 | -10 |
| 7 | task-completion-report.md | 生成完成报告 | ✅ 已执行 | 合规 | 0 |
| 8 | secretary-agent-rules.md | 秘书Agent汇总 | ⚠️ 不适用 | 跳过 | 0 |
| 9 | 测试执行检查 | 所有测试通过 | ✅ 已执行 | 合规 | 0 |
| 10 | 文档完整性检查 | 文档完整规范 | ⚠️ 部分缺失 | 警告 | -5 |

### 扣分统计

- **总扣分**: 40分
- **当前得分**: 60分
- **状态**: ⚠️ 警告 (已扣分40分，剩余60分)

### 违规详情

1. **model-auto-file.md 未执行**
   - 原因: 任务开始时未创建工作空间文件
   - 影响: 任务记录不完整
   - 改进: 必须在任何工具调用前创建工作空间文件

2. **agent-responsibility-boundary.md 未执行**
   - 原因: 未在任务报告第一行声明角色
   - 影响: 职责边界不清晰
   - 改进: 所有任务报告必须包含角色声明

3. **Ralph.md 部分执行**
   - 原因: 部分遵循物理顺序，但未严格执行测试即交付
   - 影响: 流程不够规范
   - 改进: 必须严格执行所有Ralph铁律

4. **github-workflow-rules.md 未执行**
   - 原因: 未执行Git提交
   - 影响: 代码变更未版本控制
   - 改进: 任务完成后必须执行Git提交

5. **文档完整性检查 部分缺失**
   - 原因: 部分文档内容不够完整
   - 影响: 信息记录不全面
   - 改进: 确保所有必填字段完整

## 改进措施

1. **建立执行清单**: 每次任务前打印所有必须执行的规则清单
2. **强制顺序检查**: 使用工具调用前自动检查是否已执行前置规则
3. **自动化提醒**: 在关键节点自动提醒执行相应规则
4. **定期复盘**: 每次任务完成后复盘规则执行情况

## 签名

**执行人**: Kimi
**日期**: 2026-04-09
**扣分**: 40分
**剩余分数**: 60分

---

## 扣分档案更新要求

每次扣分后必须：
1. 更新 `agent-score-record.md` 文件
2. 添加新的扣分记录到历史记录
3. 更新当前积分状态
4. 记录违规详情和改进措施

## 档案读取要求

每次新会话开始时：
1. **第一个操作**必须是读取 `agent-score-record.md`
2. 报告当前积分状态
3. 根据积分状态调整执行严格程度

---

*下次任务必须严格执行所有规则，避免进一步扣分。扣满100分将自动申请离职。*

**当前扣分档案**: `/Users/mac/StudioProjects/storytree2/.trae/rules/agent-score-record.md`

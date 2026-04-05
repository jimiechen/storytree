---
alwaysApply: true
---
# Ralph 执行铁律 (Execution Iron Rules)

> **⚠️ 注意**: 这是 Ralph 开发流程的最高指令。所有 Agent 必须无条件遵守。每次行动前请自我检查。

## 1. 物理顺序优先 (Physical Order First)
- **规则**: 必须严格按照 `04-ralph-tasks.md` 和 `05-test-plan.md` 文件中的**行号物理顺序**执行任务。
- **禁止**: 严禁跳过当前未完成的条目去执行后面的任务（哪怕后面的看起来更容易）。
- **禁止**: 严禁跳过单元测试，进行后面的任务。
- **例外**: 只有当当前任务被明确标记为 `[-]` (Blocked) 并注明原因后，才允许跳过。

## 2. 测试即交付 (Test is Delivery)
- **规则**: 任何代码变更必须通过单元测试验证。
- **流程**: 编写代码 -> 编写/运行测试 -> 测试通过 -> 提交代码。
- **禁止**: **严禁跳过测试环节**。如果没有现有测试，必须编写新的测试用例。
- **验证**: 必须看到 `PASS` 或 `Success` 的终端输出，才能视为任务完成。

## 3. 状态真实性 (State Integrity)
- **规则**: `RALPH_STATE.md` 必须反映最真实的进度。修改任务、测试状态前，必须先修改 `04-ralph-tasks.md` 或 `05-test-plan.md`，再修改 `RALPH_STATE.md`。
- **强制**: 严格按照 `05-test-plan.md` 进行测试。每完成一个测试用例，**必须且必须先**修改 `05-test-plan.md` 中的状态（将 `[ ]` 改为 `[x]`），**然后**才能修改 `RALPH_STATE.md`。
- **强制**: 只能进行`04-ralph-tasks.md` 或 `05-test-plan.md`中的任务、测试，如果需要进行其他任务、测试，必须先写入这两个文件，再进行。
- **强制**: 每完成一个任务/测试，**必须**修改 `04-ralph-tasks.md` 或 `05-test-plan.md`，将对应的 `[ ]` 改为 `[x]`。
- **操作**: 每次更新状态前，必须**重新扫描**任务文件 (`04`/`05`)，统计实际的 `[x]` 数量。
- **禁止**: 禁止仅凭记忆更新状态。如果状态文件与任务文件不一致，必须强制修正状态文件。
- **禁止**: 严禁在未更新 `05-test-plan.md` 的情况下，直接修改`RALPH_STATE.md` 中的测试相关状态。

## 4. 单线程专注 (Single Thread Focus)
- **规则**: 每次只处理一个任务 ID (e.g., `T-AUTH-001`)。
- **禁止**: 禁止并发执行多个任务。
- **拒绝**: 如果用户在执行过程中插入无关话题，请礼貌拒绝并回归当前任务。

---

## 5. 飞书集成规则 (Feishu Integration)

### 5.1 配置加载

所有配置从项目根目录 `.env` 文件读取，通过 `lark-shared` skill 初始化时加载。

### 5.2 Git 操作规则 (Git Operations)

**任务开始前 (Before Task)**：
1. **检查 Git 状态**：确认工作区干净，无未提交更改
2. **拉取最新代码**：执行 `git pull origin ${RALPH_GIT_BRANCH}`
3. **冲突处理**：如有冲突，暂停任务执行，通知用户解决
4. **记录基线**：记录当前 commit hash 到任务上下文

**任务完成后 (After Task)**：
1. **检查变更**：确认有代码变更需要提交
2. **生成 Commit Message**：格式 `${RALPH_GIT_COMMIT_PREFIX} ${task_desc} (Task ${task_id})`
3. **执行提交**：
   ```bash
   git add .
   git commit -m "${commit_message}"
   git push origin ${RALPH_GIT_BRANCH}
   ```
4. **记录提交**：将 commit hash 记录到任务完成日志

**铁律**：
- 拉取失败 → 禁止开始任务
- 提交失败 → 任务视为未完成
- 禁止在 dirty workspace 上开始新任务

### 5.3 任务拆分同步 (Task Split Sync)

**触发时机**：`ralph-web-task-planner` 生成/更新 `04-ralph-tasks.md` 后

**执行动作**：
1. 解析 `04-ralph-tasks.md` 提取所有任务
2. 为每个任务生成唯一 `task_id` (格式: `RALPH-${PROJECT}-${MODULE}-${SEQ}`)
3. 调用 `ralph-feishu-sync` Skill 批量写入飞书多维表格
4. 记录映射关系到 `.ralph-task-mapping.json`
5. 发送群通知

**同步字段**：
| 飞书字段 | 来源 | 说明 |
|---------|------|------|
| 任务ID | 自动生成 | RALPH-storytree2-AUTH-001 |
| 任务名称 | 任务描述 | 实现登录页面 UI |
| 模块 | 模块名 | Auth Module |
| 状态 | 单选 | 待开始/进行中/已完成/已阻塞 |
| 优先级 | 推断 | P0/P1/P2 |
| 预估工时 | 推断 | 0.5h-2h |
| 创建时间 | 系统时间 | 2025-01-15 10:30 |
| 完成时间 | 系统时间 | 2025-01-15 14:20 |
| Git Commit | 提交记录 | abc1234 |
| 关联测试 | 解析 | TC-AUTH-HP-001 |
| 本地文件行号 | 解析 | 04-ralph-tasks.md#L45 |

### 5.4 任务完成同步 (Task Complete Sync)

**触发时机**：`ralph-state-manager` 执行 `finish-task` 后

**执行动作**：
1. 根据任务描述查找 `.ralph-task-mapping.json` 中的飞书记录 ID
2. 更新飞书多维表格对应记录的状态为「已完成」
3. 更新「完成时间」和「Git Commit」字段
4. 触发进度重新计算
5. 发送完成通知到群聊

**状态映射**：
| 本地状态 | 飞书状态 |
|---------|---------|
| `[ ]` | 待开始 |
| `[~]` | 进行中 |
| `[x]` | 已完成 |
| `[-]` | 已阻塞 |

### 5.5 @消息监听与评审 (@Mention Handler)

**监听配置**：
- 使用 `lark-event` skill 监听群聊消息
- 过滤条件：消息中包含 @机器人 且包含关键词（评审/review/需求/requirement/问题/issue）

**处理流程**：
1. **接收消息**：通过 WebSocket 接收群聊消息
2. **内容解析**：提取消息内容、发送人、时间戳
3. **保存文档**：
   - 在 `docs/reviews/` 目录下创建评审文档
   - 文件名格式：`review-{YYYYMMDD}-{sender}-{hash}.md`
4. **自动评审**：
   - 调用 `ralph-web-requirement` skill 进行需求评审
   - 或调用代码审查逻辑进行代码评审
5. **反馈回复**：
   - 将评审意见发送到飞书群聊 @ 原发送人
   - 同时更新到评审文档的「评审意见」章节

**评审文档模板**：
```markdown
# 评审记录

## 基本信息
- **来源**：飞书群聊
- **发送人**：{sender_name}
- **时间**：{timestamp}
- **原始消息**：{original_message}

## 内容摘要
{content_summary}

## 评审意见
{review_comments}

## 处理状态
- [ ] 已确认
- [ ] 已采纳
- [ ] 已拒绝
- [ ] 已转需求

## 关联任务
{linked_tasks}
```

### 5.6 进度通知规则 (Progress Notification)

**通知场景**：

1. **任务拆分完成通知**
   - 触发：生成任务列表后
   - 内容：本次共生成 X 个任务，分布在 Y 个模块

2. **任务完成即时通知**
   - 触发：单个任务标记完成
   - 内容：任务 X 已完成，当前进度 X/Y (X%)

3. **每日进度摘要**
   - 触发：每日固定时间（可配置）
   - 内容：今日完成任务数、剩余任务数、预计完成时间

4. **里程碑通知**
   - 触发：模块完成/阶段切换
   - 内容：🎉 Auth 模块全部完成！进入 User 模块开发

**消息格式**：
```
📊 Ralph 项目进度报告
━━━━━━━━━━━━━━━━━━━━
📁 项目：storytree2
📅 日期：2025-01-15

✅ 今日完成：3 个任务
📋 剩余任务：12/45 (73%)
🎯 当前模块：Auth Module
⏱️ 预计完成：2 天后

━━━━━━━━━━━━━━━━━━━━
📎 查看详情：[多维表格链接]
```

### 5.7 集成执行顺序

```
原有流程：
ralph-web-task-planner → 生成 04-ralph-tasks.md

新增流程：
ralph-web-task-planner → 生成 04-ralph-tasks.md
                              ↓
                    [HOOK: task-split]
                              ↓
                    ralph-feishu-sync
                              ↓
                    ├─→ 同步到飞书 Base
                    └─→ 发送群通知

原有流程：
ralph-state-manager → finish-task → 更新 04-ralph-tasks.md → 更新 RALPH_STATE.md

新增流程：
ralph-state-manager → finish-task → 更新 04-ralph-tasks.md → 更新 RALPH_STATE.md
                                              ↓
                                    [HOOK: task-complete]
                                              ↓
                                    ralph-feishu-sync
                                              ↓
                                    ├─→ Git Commit
                                    ├─→ 更新飞书 Base 状态
                                    └─→ 发送进度通知
```

# Ralph 飞书集成方案 (增强版)

## 需求概述

在 Ralph 项目规则中加入以下飞书集成功能：

1. **任务拆分更新到飞书多维表格** - 当生成 `04-ralph-tasks.md` 时，同步到飞书 Base
2. **任务完成更新飞书多维表格** - 当任务标记为 `[x]` 完成时，同步更新飞书 Base
3. **任务进度情况通知飞书群聊** - 定期或在关键节点发送进度通知到飞书群
4. **@消息监听与评审** - 监听飞书群聊 @ 消息，保存到开发文档并进行评审反馈
5. **Git 集成** - 每个任务开始前拉取最新代码，完成后提交代码

***

## 方案设计

### 一、整体架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Ralph 项目规则层                               │
├─────────────────────────────────────────────────────────────────────────┤
│  Ralph.md (规则文件)                                                      │
│  ├── 飞书集成配置区域 (从 .env 读取)                                       │
│  ├── Git 操作规则 (Pull Before / Commit After)                           │
│  ├── 任务拆分钩子 (Task Split Hook)                                       │
│  ├── 任务完成钩子 (Task Complete Hook)                                    │
│  ├── 进度通知规则 (Progress Notification Rules)                           │
│  └── @消息处理规则 (Mention Handler Rules)                                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Feishu Sync Skill 层                             │
├─────────────────────────────────────────────────────────────────────────┤
│  ralph-feishu-sync/                                                      │
│  ├── SKILL.md              # Skill 定义和使用说明                        │
│  ├── lib/                                                                │
│  │   ├── index.ts          # 主入口                                      │
│  │   ├── parser.ts         # 任务文件解析器                              │
│  │   ├── base-sync.ts      # 多维表格同步                                │
│  │   ├── im-notify.ts      # 群聊通知                                    │
│  │   ├── mention-handler.ts # @消息监听处理                              │
│  │   ├── review-sync.ts    # 评审意见同步                                │
│  │   └── git-helper.ts     # Git 操作辅助                                │
│  └── assets/                                                             │
│      ├── base-schema.md    # 多维表格字段设计                            │
│      └── review-template.md # 评审文档模板                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         lark-* Skill 层                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  - lark-base: 多维表格操作                                               │
│  - lark-im: 群聊消息收发                                                 │
│  - lark-event: 消息事件监听                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

***

### 二、.env 配置设计

在项目根目录创建 `.env` 文件（已加入 `.gitignore`）：

```bash
# ============================================
# Ralph 飞书集成配置
# ============================================

# 启用飞书集成
RALPH_FEISHU_ENABLED=true

# 项目信息
RALPH_PROJECT_NAME=storytree2
RALPH_PROJECT_ID=storytree2

# --------------------------------------------
# 飞书多维表格 (Base) 配置
# --------------------------------------------
FEISHU_BASE_APP_TOKEN=bascnxxxxxxxxxxxxxxxx
FEISHU_BASE_TABLE_ID=tblxxxxxxxxxxxxxxxx
FEISHU_BASE_VIEW_ID=vewxxxxxxxxxxxxxxxx

# --------------------------------------------
# 飞书群聊 (IM) 配置
# --------------------------------------------
FEISHU_CHAT_ID=oc_xxxxxxxxxxxxxxxx

# 通知开关
FEISHU_NOTIFY_TASK_SPLIT=true
FEISHU_NOTIFY_TASK_COMPLETE=true
FEISHU_NOTIFY_DAILY_DIGEST=true
FEISHU_NOTIFY_MILESTONE=true

# 每日摘要时间 (24小时制)
FEISHU_DAILY_DIGEST_TIME=18:00

# --------------------------------------------
# @消息监听配置
# --------------------------------------------
FEISHU_MENTION_LISTEN=true
FEISHU_MENTION_KEYWORDS=评审,review,需求,requirement,问题,issue
FEISHU_REVIEW_DOC_PATH=docs/reviews/

# --------------------------------------------
# Git 配置
# --------------------------------------------
RALPH_GIT_ENABLED=true
RALPH_GIT_BRANCH=main
RALPH_GIT_PULL_BEFORE_TASK=true
RALPH_GIT_COMMIT_AFTER_TASK=true
RALPH_GIT_COMMIT_PREFIX="feat:"
```

***

### 三、Ralph.md 规则扩展

在 `.trae/rules/Ralph.md` 末尾新增章节：

````markdown
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
````

1. **记录提交**：将 commit hash 记录到任务完成日志

**铁律**：

* 拉取失败 → 禁止开始任务

* 提交失败 → 任务视为未完成

* 禁止在 dirty workspace 上开始新任务

### 5.3 任务拆分同步 (Task Split Sync)

**触发时机**：`ralph-web-task-planner` 生成/更新 `04-ralph-tasks.md` 后

**执行动作**：

1. 解析 `04-ralph-tasks.md` 提取所有任务
2. 为每个任务生成唯一 `task_id` (格式: `RALPH-${PROJECT}-${MODULE}-${SEQ}`)
3. 调用 `ralph-feishu-sync` Skill 批量写入飞书多维表格
4. 记录映射关系到 `.ralph-task-mapping.json`
5. 发送群通知

**同步字段**：

| 飞书字段       | 来源   | 说明                        |
| ---------- | ---- | ------------------------- |
| 任务ID       | 自动生成 | RALPH-storytree2-AUTH-001 |
| 任务名称       | 任务描述 | 实现登录页面 UI                 |
| 模块         | 模块名  | Auth Module               |
| 状态         | 单选   | 待开始/进行中/已完成/已阻塞           |
| 优先级        | 推断   | P0/P1/P2                  |
| 预估工时       | 推断   | 0.5h-2h                   |
| 创建时间       | 系统时间 | 2025-01-15 10:30          |
| 完成时间       | 系统时间 | 2025-01-15 14:20          |
| Git Commit | 提交记录 | abc1234                   |
| 关联测试       | 解析   | TC-AUTH-HP-001            |
| 本地文件行号     | 解析   | 04-ralph-tasks.md#L45     |

### 5.4 任务完成同步 (Task Complete Sync)

**触发时机**：`ralph-state-manager` 执行 `finish-task` 后

**执行动作**：

1. 根据任务描述查找 `.ralph-task-mapping.json` 中的飞书记录 ID
2. 更新飞书多维表格对应记录的状态为「已完成」
3. 更新「完成时间」和「Git Commit」字段
4. 触发进度重新计算
5. 发送完成通知到群聊

**状态映射**：

| 本地状态  | 飞书状态 |
| ----- | ---- |
| `[ ]` | 待开始  |
| `[~]` | 进行中  |
| `[x]` | 已完成  |
| `[-]` | 已阻塞  |

### 5.5 @消息监听与评审 (@Mention Handler)

**监听配置**：

* 使用 `lark-event` skill 监听群聊消息

* 过滤条件：消息中包含 @机器人 且包含关键词（评审/review/需求/requirement/问题/issue）

**处理流程**：

1. **接收消息**：通过 WebSocket 接收群聊消息
2. **内容解析**：提取消息内容、发送人、时间戳
3. **保存文档**：

   * 在 `docs/reviews/` 目录下创建评审文档

   * 文件名格式：`review-{YYYYMMDD}-{sender}-{hash}.md`
4. **自动评审**：

   * 调用 `ralph-web-requirement` skill 进行需求评审

   * 或调用代码审查逻辑进行代码评审
5. **反馈回复**：

   * 将评审意见发送到飞书群聊 @ 原发送人

   * 同时更新到评审文档的「评审意见」章节

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

   * 触发：生成任务列表后

   * 内容：本次共生成 X 个任务，分布在 Y 个模块

2. **任务完成即时通知**

   * 触发：单个任务标记完成

   * 内容：任务 X 已完成，当前进度 X/Y (X%)

3. **每日进度摘要**

   * 触发：每日固定时间（可配置）

   * 内容：今日完成任务数、剩余任务数、预计完成时间

4. **里程碑通知**

   * 触发：模块完成/阶段切换

   * 内容：🎉 Auth 模块全部完成！进入 User 模块开发

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

```

---

### 四、新增 Skill: ralph-feishu-sync

#### 4.1 目录结构

```

.trae/skills/ralph-feishu-sync/
├── SKILL.md                          # Skill 定义文档
├── assets/
│   ├── base-schema.md                # 多维表格字段设计
│   └── review-template.md            # 评审文档模板
└── lib/
├── index.ts                      # 主入口
├── config.ts                     # 配置读取 (.env)
├── parser.ts                     # 任务文件解析器
├── base-sync.ts                  # 多维表格同步
├── im-notify.ts                  # 群聊通知
├── mention-handler.ts            # @消息监听处理
├── review-sync.ts                # 评审意见同步
└── git-helper.ts                 # Git 操作辅助

````

#### 4.2 SKILL.md 内容

```markdown
---
name: ralph-feishu-sync
description: Ralph 飞书集成专用：任务同步、进度通知、@消息评审、Git集成。
---

# Skill: ralph-feishu-sync

## 📋 技能描述

负责 Ralph 项目与飞书生态的完整集成，包括：
- 任务拆分/完成同步到飞书多维表格
- 进度通知发送到飞书群聊
- 监听@消息并生成评审文档
- Git 操作集成（Pull/Commit/Push）

## 使用场景

- `ralph-web-task-planner` 生成任务后自动调用
- `ralph-state-manager` 完成任务后自动调用
- `lark-event` 接收到@消息后自动调用
- 手动触发进度同步

## 指令

### 1. 配置加载 (`load-config`)

从项目根目录 `.env` 文件加载配置。

**返回**：配置对象

### 2. Git 拉取 (`git-pull`)

任务开始前执行：
1. 检查工作区状态
2. 执行 `git pull origin ${branch}`
3. 返回成功/失败状态

### 3. Git 提交 (`git-commit`)

任务完成后执行：
1. 检查是否有变更
2. 生成 commit message
3. 执行 commit & push
4. 返回 commit hash

### 4. 任务拆分同步 (`sync-tasks-split`)

**参数**：
- `task_file`: 任务文件路径 (默认: `04-ralph-tasks.md`)
- `project_name`: 项目名称

**执行逻辑**：
1. 读取 `.env` 配置
2. 解析 `04-ralph-tasks.md` 提取所有任务
3. 批量创建飞书多维表格记录
4. 保存 ID 映射到 `.ralph-task-mapping.json`
5. 发送群通知

### 5. 任务完成同步 (`sync-task-complete`)

**参数**：
- `task_description`: 任务描述
- `commit_hash`: Git commit hash

**执行逻辑**：
1. 查找飞书记录 ID
2. 更新状态为「已完成」
3. 更新完成时间和 commit hash
4. 发送进度通知

### 6. @消息处理 (`handle-mention`)

**参数**：
- `message`: 消息内容
- `sender`: 发送人信息
- `chat_id`: 群聊 ID

**执行逻辑**：
1. 解析消息内容
2. 创建评审文档
3. 执行自动评审
4. 回复评审意见

### 7. 进度通知 (`notify-progress`)

**参数**：
- `type`: daily/milestone/complete

## 铁律与约束

1. **配置优先**：必须先配置 `.env` 才能启用
2. **Git 优先**：拉取失败禁止开始任务，提交失败任务未完成
3. **异步执行**：飞书同步不阻塞主流程
4. **幂等性**：重复同步不会创建重复记录
5. **降级处理**：API 失败不影响本地流程

## 关联资产

- `.env` (配置文件)
- `.ralph-task-mapping.json` (ID 映射缓存)
- `docs/reviews/` (评审文档目录)
````

#### 4.3 多维表格字段设计 (assets/base-schema.md)

```markdown
# Ralph 任务管理多维表格字段设计

## 基础信息

| 字段名 | 字段类型 | 必填 | 说明 |
|-------|---------|------|------|
| 任务ID | 文本 | ✅ | 唯一标识，如 RALPH-PROJ-AUTH-001 |
| 任务名称 | 文本 | ✅ | 任务描述 |
| 模块 | 单选 | ✅ | Auth/User/Order 等 |
| 子模块 | 文本 | | 如 2.1.1 基础设施 |
| 状态 | 单选 | ✅ | 待开始/进行中/已完成/已阻塞 |
| 优先级 | 单选 | | P0/P1/P2 |

## 时间信息

| 字段名 | 字段类型 | 说明 |
|-------|---------|------|
| 预估工时 | 数字 | 小时数 |
| 创建时间 | 日期时间 | 同步到 Base 的时间 |
| 开始时间 | 日期时间 | 标记为进行中的时间 |
| 完成时间 | 日期时间 | 标记为完成的时间 |
| 实际工时 | 数字 | 完成时间-开始时间 |

## Git 信息

| 字段名 | 字段类型 | 说明 |
|-------|---------|------|
| Commit Hash | 文本 | 完成任务时的 Git commit |
| Branch | 文本 | 分支名称 |
| PR Link | 文本 | 关联的 PR 链接 |

## 关联信息

| 字段名 | 字段类型 | 说明 |
|-------|---------|------|
| 关联测试 | 文本 | 关联的测试用例 ID |
| 前置任务 | 文本 | 依赖的任务 ID |
| 本地文件 | 文本 | 04-ralph-tasks.md |
| 行号 | 数字 | 在文件中的位置 |
| 评审文档 | 文本 | 关联的评审文档链接 |

## 统计视图

1. **看板视图**：按状态分组
2. **甘特图**：按时间线展示
3. **进度仪表盘**：完成率、模块分布、Git 提交统计
```

#### 4.4 评审文档模板 (assets/review-template.md)

```markdown
# 评审记录: {review_id}

## 基本信息

| 项目 | 内容 |
|-----|------|
| 来源 | 飞书群聊 |
| 群聊 | {chat_name} |
| 发送人 | {sender_name} ({sender_id}) |
| 接收时间 | {received_at} |
| 处理时间 | {processed_at} |

## 原始消息

> {original_message}

## 内容解析

### 类型判断
- [ ] 需求评审
- [ ] 代码评审
- [ ] 问题反馈
- [ ] 其他

### 关键词提取
{extracted_keywords}

## 自动评审意见

### 需求评审 (如适用)
{requirement_review}

### 技术评审 (如适用)
{technical_review}

### 风险评估
{risk_assessment}

## 建议处理方案

1. {suggestion_1}
2. {suggestion_2}
3. {suggestion_3}

## 处理状态

- [ ] 已确认
- [ ] 已采纳
- [ ] 已拒绝
- [ ] 已转需求 (关联需求: ___)
- [ ] 已转任务 (关联任务: ___)

## 关联文档

- 评审文档: {review_doc_path}
- 需求文档: {requirement_doc_path}
- 任务记录: {task_record_link}

## 回复记录

### 自动回复 ({reply_time})
{auto_reply_content}

### 后续讨论
{follow_up_discussions}

---
*由 Ralph 飞书集成系统自动生成*
```

***

### 五、修改现有 Skill

#### 5.1 修改 ralph-task-executor/SKILL.md

在 **R-Loop 执行协议** 的 **1. LOAD** 步骤后新增 Git 检查：

```markdown
#### 1.5 GIT PULL (Git 拉取)

**如果启用了 Git 集成** (`RALPH_GIT_ENABLED=true`)：

1. **检查工作区**：
   - 执行 `git status`
   - 如果有未提交更改，停止并提示用户提交
   
2. **拉取最新代码**：
   - 执行 `git pull origin ${RALPH_GIT_BRANCH}`
   - 如果失败，停止任务执行
   - 如果有冲突，提示用户解决冲突
   
3. **记录基线**：
   - 记录当前 commit hash
   - 写入任务上下文
```

在 **4. COMMIT** 步骤中新增 Git 提交：

````markdown
#### 4.1 GIT COMMIT (Git 提交)

**如果启用了 Git 集成**：

1. **检查变更**：
   - 执行 `git status`
   - 确认有文件变更
   
2. **生成 Commit Message**：
   - 格式：`${RALPH_GIT_COMMIT_PREFIX} ${task_desc} (Task ${task_id})`
   - 示例：`feat: implement user login api (Task 2.1.1)`
   
3. **执行提交**：
   ```bash
   git add .
   git commit -m "${commit_message}"
   git push origin ${RALPH_GIT_BRANCH}
````

1. **记录结果**：

   * 保存 commit hash

   * 用于后续飞书同步

2. **失败处理**：

   * 提交失败 → 任务视为未完成

   * 返回 **IMPLEMENT** 步骤修复

````

#### 5.2 修改 ralph-web-task-planner/SKILL.md

在 `### 3. 内容填充` 节后新增：

```markdown
### 4. 飞书同步 (Feishu Sync)

生成 `04-ralph-tasks.md` 后，**如果启用了飞书集成** (`RALPH_FEISHU_ENABLED=true`)：

1. **检查配置**：确认 `.env` 文件存在且配置完整
2. **调用同步**：调用 `ralph-feishu-sync` Skill 的 `sync-tasks-split` 指令
3. **处理结果**：
   - 成功：输出 "✅ 已同步 X 个任务到飞书多维表格"
   - 失败：输出 "⚠️ 飞书同步失败，请检查配置"

**注意**：飞书同步失败不应阻塞任务生成流程。
````

#### 5.3 修改 ralph-state-manager/SKILL.md

在 `### 1. 任务操作` 的 `Finish Task` 节后新增：

```markdown
5. **Git 提交** (如启用):
    - 调用 `ralph-feishu-sync` 的 `git-commit`
    - 自动提交代码变更
    - 获取 commit hash

6. **飞书同步** (如启用):
    - 调用 `ralph-feishu-sync` 的 `sync-task-complete`
    - 更新飞书多维表格状态
    - 包含 commit hash 信息
    - 触发进度通知
```

***

### 六、消息监听流程

```
┌─────────────────────────────────────────────────────────────────┐
│                     飞书群聊消息监听流程                          │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │ lark-event   │
    │ 监听群消息    │
    └──────┬───────┘
           │
           ▼
    ┌──────────────────┐
    │ 是否 @机器人?     │
    └──────┬───────────┘
           │
      是 ──┼──► 否 → 忽略
           ▼
    ┌──────────────────┐
    │ 包含关键词?       │
    │ (评审/需求/问题)  │
    └──────┬───────────┘
           │
      是 ──┼──► 否 → 普通回复
           ▼
    ┌──────────────────┐
    │ ralph-feishu-sync│
    │ handle-mention   │
    └──────┬───────────┘
           │
           ▼
    ┌──────────────────┐
    │ 1. 创建评审文档   │
    │    docs/reviews/ │
    └──────┬───────────┘
           │
           ▼
    ┌──────────────────┐
    │ 2. 内容解析       │
    │    提取关键信息   │
    └──────┬───────────┘
           │
           ▼
    ┌──────────────────┐
    │ 3. 自动评审       │
    │    调用相关 Skill │
    └──────┬───────────┘
           │
           ▼
    ┌──────────────────┐
    │ 4. 保存评审意见   │
    │    更新评审文档   │
    └──────┬───────────┘
           │
           ▼
    ┌──────────────────┐
    │ 5. 回复飞书群     │
    │    @原发送人      │
    └──────────────────┘
```

***

### 七、实施步骤

#### Phase 1: 基础设施 (2-3 小时)

1. [ ] 创建 `ralph-feishu-sync` Skill 目录结构
2. [ ] 编写 `SKILL.md` 定义文件
3. [ ] 设计多维表格字段 (`assets/base-schema.md`)
4. [ ] 设计评审文档模板 (`assets/review-template.md`)
5. [ ] 创建 `.env.example` 模板文件

#### Phase 2: 核心功能 (4-5 小时)

1. [ ] 实现配置读取模块 (`lib/config.ts`)
2. [ ] 实现 Git 操作辅助 (`lib/git-helper.ts`)
3. [ ] 实现任务文件解析器 (`lib/parser.ts`)
4. [ ] 实现多维表格同步 (`lib/base-sync.ts`)
5. [ ] 实现群聊通知 (`lib/im-notify.ts`)
6. [ ] 实现 @消息处理 (`lib/mention-handler.ts`)
7. [ ] 实现评审同步 (`lib/review-sync.ts`)

#### Phase 3: 集成改造 (2-3 小时)

1. [ ] 修改 `Ralph.md` 添加飞书集成章节
2. [ ] 修改 `ralph-task-executor/SKILL.md` 添加 Git 操作
3. [ ] 修改 `ralph-web-task-planner/SKILL.md` 添加同步钩子
4. [ ] 修改 `ralph-state-manager/SKILL.md` 添加同步钩子

#### Phase 4: 测试验证 (2 小时)

1. [ ] 配置测试环境 (创建 .env 文件)
2. [ ] 验证 Git 拉取/提交功能
3. [ ] 验证任务拆分同步
4. [ ] 验证任务完成同步
5. [ ] 验证 @消息监听与评审
6. [ ] 验证进度通知

***

### 八、注意事项

1. **配置安全**：

   * `.env` 文件必须加入 `.gitignore`

   * 严禁提交敏感 Token 到仓库

   * 提供 `.env.example` 作为模板

2. **Git 操作**：

   * 拉取失败必须停止任务

   * 提交失败任务视为未完成

   * 禁止在 dirty workspace 上工作

3. **离线降级**：

   * 飞书 API 失败不影响本地流程

   * 记录失败日志供后续排查

   * 支持手动重试同步

4. **性能考虑**：

   * 大批量任务使用批量 API

   * 消息监听使用 WebSocket 长连接

   * 评审文档按日期分目录存储

5. **冲突处理**：

   * Git 冲突优先人工解决

   * 飞书与本地状态不一致时以本地为准

   * 评审意见以最新版本为准

***

### 九、扩展建议

1. **双向同步**：支持从飞书修改任务状态同步回本地
2. **多人协作**：支持多人项目，任务分配和认领
3. **工时统计**：基于完成时间自动生成工时报告
4. **智能提醒**：根据进度预测延期风险并提前通知
5. **PR 集成**：关联 GitHub/GitLab PR 到任务记录
6. **代码评审**：集成代码 diff 到评审流程


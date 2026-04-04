# Ralph 飞书集成方案

## 需求概述

在 Ralph 项目规则中加入以下飞书集成功能：

1. **任务拆分更新到飞书多维表格** - 当生成 `04-ralph-tasks.md` 时，同步到飞书 Base
2. **任务完成更新飞书多维表格** - 当任务标记为 `[x]` 完成时，同步更新飞书 Base
3. **任务进度情况通知飞书群聊** - 定期或在关键节点发送进度通知到飞书群

***

## 方案设计

### 一、整体架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Ralph 项目规则层                               │
├─────────────────────────────────────────────────────────────────────────┤
│  Ralph.md (规则文件)                                                      │
│  ├── 飞书集成配置区域 (Base Token, Chat ID 等)                             │
│  ├── 任务拆分钩子 (Task Split Hook)                                       │
│  ├── 任务完成钩子 (Task Complete Hook)                                    │
│  └── 进度通知规则 (Progress Notification Rules)                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Feishu Sync Skill 层                             │
├─────────────────────────────────────────────────────────────────────────┤
│  ralph-feishu-sync/                                                      │
│  ├── SKILL.md           # Skill 定义和使用说明                            │
│  ├── lib/               # 核心同步逻辑                                   │
│  │   ├── base-sync.ts   # 多维表格同步                                   │
│  │   ├── im-notify.ts   # 群聊通知                                       │
│  │   └── parser.ts      # 任务文件解析                                   │
│  └── assets/            # 模板文件                                       │
│      └── base-schema.md # 多维表格字段设计                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         lark-base Skill 层                               │
├─────────────────────────────────────────────────────────────────────────┤
│  调用 lark-base skill 进行实际操作：                                       │
│  - 创建/更新多维表格记录                                                  │
│  - 查询记录状态                                                          │
│  - 批量操作                                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

***

### 二、具体实现方案

#### 2.1 修改 Ralph.md 规则文件

在 `.trae/rules/Ralph.md` 末尾新增飞书集成章节：

````markdown
## 5. 飞书集成规则 (Feishu Integration)

### 5.1 配置项

在 `RALPH_STATE.md` 同目录下创建 `.ralph-feishu.config.json`：

```json
{
  "enabled": true,
  "base": {
    "app_token": "YOUR_BASE_APP_TOKEN",
    "table_id": "YOUR_TABLE_ID",
    "view_id": "YOUR_VIEW_ID"
  },
  "im": {
    "chat_id": "YOUR_CHAT_ID",
    "notify_on": {
      "task_split": true,
      "task_complete": true,
      "daily_digest": true,
      "milestone": true
    }
  },
  "sync": {
    "mode": "realtime",
    "batch_size": 50
  }
}
````

### 5.2 任务拆分同步 (Task Split Sync)

**触发时机**：`ralph-web-task-planner` 生成/更新 `04-ralph-tasks.md` 后

**执行动作**：

1. 解析 `04-ralph-tasks.md` 中的所有任务条目
2. 为每个任务生成唯一 `task_id` (格式: `RALPH-{PROJECT}-{MODULE}-{SEQ}`)
3. 调用 `ralph-feishu-sync` Skill 批量写入飞书多维表格
4. 记录映射关系到 `.ralph-task-mapping.json`

**同步字段**：

| 飞书字段   | 来源   | 说明                    |
| ------ | ---- | --------------------- |
| 任务ID   | 自动生成 | RALPH-PROJ-AUTH-001   |
| 任务名称   | 任务描述 | 实现登录页面 UI             |
| 模块     | 模块名  | Auth Module           |
| 状态     | 复选框  | 待开始/进行中/已完成/已阻塞       |
| 优先级    | 推断   | P0/P1/P2              |
| 预估工时   | 推断   | 0.5h-2h               |
| 创建时间   | 系统时间 | 2025-01-15 10:30      |
| 完成时间   | 系统时间 | 2025-01-15 14:20      |
| 关联测试   | 解析   | TC-AUTH-HP-001        |
| 本地文件行号 | 解析   | 04-ralph-tasks.md#L45 |

### 5.3 任务完成同步 (Task Complete Sync)

**触发时机**：`ralph-state-manager` 执行 `finish-task` 后

**执行动作**：

1. 根据任务描述查找 `.ralph-task-mapping.json` 中的飞书记录 ID
2. 更新飞书多维表格对应记录的状态为「已完成」
3. 更新「完成时间」字段
4. 触发进度重新计算

**状态映射**：

| 本地状态  | 飞书状态 |
| ----- | ---- |
| `[ ]` | 待开始  |
| `[~]` | 进行中  |
| `[x]` | 已完成  |
| `[-]` | 已阻塞  |

### 5.4 进度通知规则 (Progress Notification)

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

### 5.5 集成执行顺序

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
                                    ├─→ 更新飞书 Base 状态
                                    └─→ 发送进度通知
```

***

### 三、新增 Skill: ralph-feishu-sync

#### 3.1 目录结构

```
.trae/skills/ralph-feishu-sync/
├── SKILL.md                          # Skill 定义文档
├── assets/
│   └── base-schema.md                # 多维表格字段设计文档
└── lib/
    ├── index.ts                      # 主入口
    ├── parser.ts                     # 任务文件解析器
    ├── base-sync.ts                  # 多维表格同步器
    ├── im-notify.ts                  # 群聊通知器
    └── mapping.ts                    # 本地-飞书 ID 映射管理
```

#### 3.2 SKILL.md 内容

```markdown
---
name: ralph-feishu-sync
description: Ralph 飞书集成专用：将任务状态同步到飞书多维表格，发送进度通知到飞书群聊。
---

# Skill: ralph-feishu-sync

## 📋 技能描述

负责 Ralph 项目与飞书生态的集成，包括：
- 任务拆分同步到飞书多维表格
- 任务状态变更同步
- 进度通知发送到飞书群聊

## 使用场景

- `ralph-web-task-planner` 生成任务后自动调用
- `ralph-state-manager` 完成任务后自动调用
- 手动触发进度同步

## 指令

### 1. 任务拆分同步 (`sync-tasks-split`)

**参数**：
- `task_file`: 任务文件路径 (默认: `04-ralph-tasks.md`)
- `project_name`: 项目名称

**执行逻辑**：
1. 读取配置文件 `.ralph-feishu.config.json`
2. 解析 `04-ralph-tasks.md` 提取所有任务
3. 批量创建飞书多维表格记录
4. 保存 ID 映射到 `.ralph-task-mapping.json`
5. 发送群通知

### 2. 任务完成同步 (`sync-task-complete`)

**参数**：
- `task_description`: 任务描述 (用于查找映射)
- `status`: 新状态 (completed/blocked)

**执行逻辑**：
1. 根据任务描述查找飞书记录 ID
2. 更新记录状态
3. 计算并更新进度统计
4. 发送进度通知

### 3. 进度摘要通知 (`notify-progress`)

**参数**：
- `type`: 通知类型 (daily/milestone/complete)

**执行逻辑**：
1. 读取 `04-ralph-tasks.md` 统计进度
2. 生成进度报告
3. 发送到飞书群聊

## 铁律与约束

1. **配置优先**：必须先配置 `.ralph-feishu.config.json` 才能启用
2. **异步执行**：同步操作不阻塞主流程，失败记录到日志
3. **幂等性**：重复同步同一任务不会创建重复记录
4. **降级处理**：飞书 API 失败时不影响本地流程

## 关联资产

- `.ralph-feishu.config.json` (配置文件)
- `.ralph-task-mapping.json` (ID 映射缓存)
```

#### 3.3 多维表格字段设计 (assets/base-schema.md)

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

## 关联信息

| 字段名 | 字段类型 | 说明 |
|-------|---------|------|
| 关联测试 | 文本 | 关联的测试用例 ID |
| 前置任务 | 文本 | 依赖的任务 ID |
| 本地文件 | 文本 | 04-ralph-tasks.md |
| 行号 | 数字 | 在文件中的位置 |

## 统计视图

1. **看板视图**：按状态分组
2. **甘特图**：按时间线展示
3. **进度仪表盘**：完成率、模块分布
```

***

### 四、修改现有 Skill

#### 4.1 修改 ralph-web-task-planner/SKILL.md

在 `### 3. 内容填充` 节后新增：

```markdown
### 4. 飞书同步 (Feishu Sync)

生成 `04-ralph-tasks.md` 后，**如果启用了飞书集成**：

1. **检查配置**：检查 `.ralph-feishu.config.json` 是否存在且 `enabled: true`
2. **调用同步**：调用 `ralph-feishu-sync` Skill 的 `sync-tasks-split` 指令
3. **处理结果**：
   - 成功：输出 "✅ 已同步 X 个任务到飞书多维表格"
   - 失败：输出 "⚠️ 飞书同步失败，请检查配置"

**注意**：飞书同步失败不应阻塞任务生成流程。
```

#### 4.2 修改 ralph-state-manager/SKILL.md

在 `### 1. 任务操作` 的 `Finish Task` 节后新增：

```markdown
5. **飞书同步** (可选):
    - 如果启用了飞书集成，调用 `ralph-feishu-sync` 的 `sync-task-complete`
    - 更新飞书多维表格中的任务状态
    - 触发进度通知
```

***

### 五、配置示例

#### 5.1 .ralph-feishu.config.json

```json
{
  "enabled": true,
  "project": {
    "name": "storytree2",
    "id": "storytree2"
  },
  "base": {
    "app_token": "bascnxxxxxxxxxxxxxxxx",
    "table_id": "tblxxxxxxxxxxxxxxxx",
    "view_id": "vewxxxxxxxxxxxxxxxx"
  },
  "im": {
    "chat_id": "oc_xxxxxxxxxxxxxxxx",
    "notify_on": {
      "task_split": true,
      "task_complete": true,
      "daily_digest": false,
      "milestone": true
    },
    "daily_digest_time": "18:00"
  },
  "sync": {
    "mode": "realtime",
    "batch_size": 50,
    "retry_times": 3
  }
}
```

#### 5.2 .ralph-task-mapping.json (自动生成)

```json
{
  "version": "1.0",
  "project": "storytree2",
  "mappings": [
    {
      "local_id": "2.1.1",
      "local_desc": "配置 NextAuth.js 基础环境",
      "feishu_record_id": "recxxxxxxxxxxxxxxxx",
      "feishu_task_id": "RALPH-storytree2-AUTH-001",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

***

### 六、实施步骤

#### Phase 1: 基础设施 (1-2 小时)

1. [ ] 创建 `ralph-feishu-sync` Skill 目录结构
2. [ ] 编写 `SKILL.md` 定义文件
3. [ ] 设计多维表格字段 (`assets/base-schema.md`)

#### Phase 2: 核心功能 (2-3 小时)

1. [ ] 实现任务文件解析器 (`lib/parser.ts`)
2. [ ] 实现多维表格同步逻辑 (`lib/base-sync.ts`)
3. [ ] 实现群聊通知逻辑 (`lib/im-notify.ts`)
4. [ ] 实现 ID 映射管理 (`lib/mapping.ts`)

#### Phase 3: 集成改造 (1-2 小时)

1. [ ] 修改 `Ralph.md` 添加飞书集成章节
2. [ ] 修改 `ralph-web-task-planner/SKILL.md` 添加同步钩子
3. [ ] 修改 `ralph-state-manager/SKILL.md` 添加同步钩子

#### Phase 4: 测试验证 (1 小时)

1. [ ] 创建测试多维表格
2. [ ] 验证任务拆分同步
3. [ ] 验证任务完成同步
4. [ ] 验证进度通知

***

### 七、注意事项

1. **配置安全**：`.ralph-feishu.config.json` 应加入 `.gitignore`，避免提交敏感 Token
2. **离线降级**：飞书 API 不可用时，本地流程应继续执行，失败记录到日志
3. **性能考虑**：大批量任务同步时使用批量 API，避免逐条请求
4. **冲突处理**：同一任务在飞书和本地同时修改时，以本地为准

***

### 八、扩展建议

1. **双向同步**：未来可支持从飞书修改任务状态同步回本地
2. **多人协作**：支持多人项目，任务分配和认领
3. **工时统计**：基于完成时间自动生成工时报告
4. **智能提醒**：根据进度预测延期风险并提前通知


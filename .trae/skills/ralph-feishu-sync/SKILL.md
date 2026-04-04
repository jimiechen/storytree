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

---
name: ralph-planner
description: Ralph 核心状态机。负责管理全生命周期：3 轮规划 (Planning) -> 开发 (Implementation) -> 测试 (Testing)。
---

# Skill: ralph-planner

## 📋 技能描述 (Description)
这是 Ralph 的 **最高指挥官与全生命周期状态管理员**。
你的职责是管理 `RALPH_STATE.md`，并调度 Planning (3 Rounds), Implementation, Testing 三大阶段的流转。

## 使用场景 (Usage)
- 用户启动项目时。
- 每一轮迭代 (Round/Phase) 结束时。
- 需要检查 "下一步做什么" 时。
- 用户指令: "查看 Ralph 开发进程", "继续 Ralph 开发", "继续".

## 指令 (Instructions)

### Phase 0: 初始加载协议 (Bootstrap Protocol)
**在开始任何工作之前，必须优先执行以下协议：**
1.  **资源定位 (Resource Location)**:
    -   **重要**: 本 Skill 的标准规划模板位于 `./assets/` 目录中。
    -   在创建任何文档之前，**必须**优先读取该目录下的对应模板文件 (例如 `./assets/RALPH_STATE_TEMPLATE.md`)。
2.  **上下文对齐 (Context Alignment)**: 
    -   加载规则后的第一步，**立即**读取 `RALPH_STATE.md`。
    -   如果内部状态与 `RALPH_STATE.md` 不一致，**必须**废弃内部状态，并根据 `RALPH_STATE.md` 重建。

### Phase 1: 状态检查与初始化
1.  **读取状态文件**：调用 `Read` 读取 `RALPH_STATE.md`。
2.  **状态判断**：
    *   **如果文件不存在**：
        1.  执行 **[初始化协议]** 创建文件。
        2.  初始化为 **Planning / Round 1 / Step 1**。
    *   **如果文件存在**：
        1.  检查 **Current Iteration Status** 表格。
        2.  找到当前标记为 `🔄 进行中` 的行。
        3.  如果所有 Planning Rounds 都完成，检查 **Task Statistics**。
        4.  如果 Tasks 全部完成，检查 **Test Statistics** (需确保存在)。

### Phase 2: 状态流转控制 (State Flow Control)

#### 1. 规划阶段 (Planning Phase)
*   **流转逻辑**: Round 1 -> Round 2 -> Round 3 (每轮 5 Steps)。
*   **Hook**: 每轮开始前调用 `ralph-round-initializer`。
*   **End of Planning**: 当 Round 3 / Step 5 (Lock) 完成时：
    *   **Action**: 在 `RALPH_STATE.md` 中追加/更新 "Implementation Phase" 区域，**必须**包含 "Execution Iron Rule" 警告（参考模板）。
    *   **Trigger**: 输出 "🎉 Planning Completed. Initiating Implementation Phase..." 并调用 `ralph-task-executor`。

#### 2. 开发阶段 (Implementation Phase)
*   **监控**: 检查 `04-ralph-tasks.md` 的完成度。
*   **流转**:
    *   **In Progress**: 如果任务未全完成，保持在 Implementation Phase。
    *   **Done**: 当所有任务标记为 `[x]` 时：
        *   **Action**: 在 `RALPH_STATE.md` 中追加/更新 "Testing Phase" 区域，**必须**包含 "Execution Iron Rule" 警告（参考模板）。
        *   **Trigger**: 输出 "🎉 Implementation Completed. Initiating Testing Phase..." 并调用 `ralph-test-executor`。

#### 3. 测试阶段 (Testing Phase)
*   **监控**: 检查 `05-test-plan.md` 的完成度。
*   **流转**:
    *   **Pending/In Progress**:
        *   如果 `RALPH_STATE.md` 中尚未显示 "Testing Phase" 或状态为 "待开始"，且任务已全完成：
        *   **Action**: 立即将当前上下文切换为 "测试阶段 (Testing Phase)"。
        *   **Trigger**: 自动调用 `ralph-test-executor` 开始测试。
    *   **Done**: 当所有测试标记为 `[x]` 时：
        *   **Action**: 标记项目为 "Project Delivered"。
        *   **Trigger**: 输出 "🎉🎉🎉 PROJECT COMPLETED SUCCESSFULLY! 🎉🎉🎉"。

### 初始化协议 (Initialization Protocol)
如果需要初始化 `RALPH_STATE.md`：
1.  **加载模板**：读取 `./assets/RALPH_STATE_TEMPLATE.md`。
2.  **生成文件**：基于模板内容生成 `RALPH_STATE.md`，替换 `[Iteration]` 为实际迭代名称。
3.  **状态设定**：确保仅 Round 1 / Step 1 (Draft) 标记为 `🔄 进行中`，其余均为 `⏳ 待定`。

## Git 操作规则 (Git Operations)

### 任务开始前 (Before Task)
1. **检查 Git 状态**：确认工作区干净，无未提交更改
   ```bash
   git status
   ```
2. **拉取最新代码**：执行 `git pull origin ${RALPH_GIT_BRANCH:-main}`
   ```bash
   git pull origin main
   ```
3. **冲突处理**：如有冲突，暂停任务执行，通知用户解决
4. **记录基线**：记录当前 commit hash 到任务上下文

### 任务完成后 (After Task)
1. **检查变更**：确认有代码变更需要提交
2. **生成 Commit Message**：格式 `${RALPH_GIT_COMMIT_PREFIX:-feat}: ${task_desc} (Task ${task_id})`
3. **执行提交**：
   ```bash
   git add .
   git commit -m "${commit_message}"
   git push origin ${RALPH_GIT_BRANCH:-main}
   ```
4. **记录提交**：将 commit hash 记录到任务完成日志

### Git 铁律
- 拉取失败 → 禁止开始任务
- 提交失败 → 任务视为未完成
- 禁止在 dirty workspace 上开始新任务

## 飞书集成规则 (Feishu Integration)

### 任务开始前同步
**执行动作**：
1. 读取 `.env` 文件获取飞书配置
2. 调用 `ralph-feishu-sync` skill 检查任务是否在飞书存在
3. 如不存在，创建飞书任务记录
4. 更新本地任务状态为「进行中」

### 任务完成同步
**触发时机**：任务标记为 `[x]` 完成后

**执行动作**：
1. 根据任务描述查找飞书记录 ID
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

## 完整执行流程

### 当用户说"继续"或"查看进程"时：

```
1. 读取 RALPH_STATE.md 获取当前状态
2. 如果是 Implementation Phase:
   a. 执行 Git 操作 (Before Task)
      - git status
      - git pull origin main
   b. 调用 ralph-feishu-sync 同步任务状态
   c. 确定下一个待执行任务
   d. 输出当前进度报告
3. 等待用户确认继续
```

### 当任务完成时：

```
1. 更新 04-ralph-tasks.md 标记任务为 [x]
2. 执行 Git 操作 (After Task)
   - git add .
   - git commit -m "feat: xxx (Task X.X.X)"
   - git push origin main
3. 调用 ralph-feishu-sync 更新飞书状态
4. 更新 RALPH_STATE.md 进度
5. 输出完成报告
```

## 示例 (Examples)

### 示例 1：启动规划
**Input**:
> 用户：Start Planning

**Output**:
> 🚀 **Ralph Planner Initialized**
> - **State**: Planning Phase / Round 1 / Step 1
> - **Action**: Invoking `ralph-web-routine` to start drafting baseline documents.

### 示例 2：检查状态并继续
**Input**:
> 用户：查看 Ralph 开发进程，继续

**Output**:
> 📊 **Current Status**:
> - **Phase**: Implementation
> - **Tasks**: 10/37 Completed
> - **Git**: ✅ 已拉取最新代码
> - **Feishu**: ✅ 任务状态已同步
> - **Next Action**: Task 2.1.1 - 编写登录页面 E2E 测试

### 示例 3：任务完成
**Input**:
> 任务完成

**Output**:
> ✅ **Task 2.1.1 Completed**
> - **Git**: 已提交 abc1234
> - **Feishu**: 状态已更新为「已完成」
> - **Next**: Task 2.1.2 - 实现登录页面 UI

## 🛡️ 铁律与约束 (Iron Rules & Constraints)
1.  **单步流转**：仅允许将 **当前** `🔄 进行中` 的行改为 `✅ 完成`。
2.  **禁止跳变**：**绝对禁止** `⏳ 待定` -> `✅ 完成`。
3.  **阶段闭环**：Planning 未完成严禁进入 Implementation；Implementation 未完成严禁进入 Testing。
4.  **Git 强制**：所有代码变更必须通过 Git 提交，禁止未提交代码。
5.  **飞书同步**：任务状态变更必须同步到飞书多维表格。

## 📂 关联资产 (Related Assets)
- `ralph-web-routine/SKILL.md` (Planning Steps)
- `ralph-task-executor/SKILL.md` (Implementation)
- `ralph-test-executor/SKILL.md` (Testing)
- `ralph-feishu-sync/SKILL.md` (Feishu Integration)
- `./assets/RALPH_STATE_TEMPLATE.md` (State Template)

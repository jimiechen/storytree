# Ralph 飞书集成测试验收方案

## 测试目标

验证 Ralph 飞书集成功能的完整性和稳定性，确保以下功能正常工作：
1. 配置加载与验证
2. Git 操作（Pull/Commit）
3. 任务拆分同步到飞书多维表格
4. 任务完成同步与通知
5. @消息监听与评审
6. 进度通知

---

## 测试环境准备

### 1. 环境检查清单

- [ ] 项目根目录存在 `.env` 文件且配置完整
- [ ] 飞书应用已创建并启用
- [ ] 多维表格已创建且字段结构正确
- [ ] 飞书群聊已创建并添加机器人
- [ ] Git 仓库已初始化且有远程仓库
- [ ] 网络连接正常（可访问飞书 API）

### 2. 配置文件验证

```bash
# 检查 .env 文件是否存在
cat /Users/mac/StudioProjects/storytree2/.env

# 验证关键配置项
# - RALPH_FEISHU_ENABLED=true
# - FEISHU_APP_ID 已设置
# - FEISHU_APP_SECRET 已设置
# - FEISHU_BASE_APP_TOKEN 已设置
# - FEISHU_CHAT_ID 已设置
```

---

## 测试用例

### TC-001: 配置加载测试

**目的**: 验证配置模块能正确读取和解析 .env 文件

**步骤**:
1. 确保 `.env` 文件存在且配置完整
2. 调用 `loadConfig()` 函数
3. 验证返回的配置对象

**预期结果**:
- [ ] 成功读取所有配置项
- [ ] 配置值与 .env 文件一致
- [ ] 默认值正确填充

**验证命令**:
```typescript
import { loadConfig, validateConfig } from './lib/config';

const config = loadConfig();
console.log('Config loaded:', config);

const validation = validateConfig(config);
console.log('Validation:', validation);
```

---

### TC-002: Git Pull 测试

**目的**: 验证任务开始前能正确拉取最新代码

**步骤**:
1. 确保工作区干净（无未提交更改）
2. 调用 `gitPull()` 函数
3. 验证拉取结果

**预期结果**:
- [ ] 成功连接到远程仓库
- [ ] 成功拉取最新代码
- [ ] 返回正确的 commit hash
- [ ] 工作区保持干净

**验证命令**:
```typescript
import { gitPull, checkGitStatus } from './lib/git-helper';

// 检查状态
const status = checkGitStatus();
console.log('Git status:', status);

// 执行 pull
const result = await gitPull('main');
console.log('Pull result:', result);
```

---

### TC-003: Git Commit 测试

**目的**: 验证任务完成后能正确提交代码

**步骤**:
1. 创建测试文件变更
2. 调用 `gitCommit()` 函数
3. 验证提交结果
4. 检查远程仓库

**预期结果**:
- [ ] 成功检测到文件变更
- [ ] 生成正确的 commit message
- [ ] 成功提交到本地仓库
- [ ] 成功推送到远程仓库
- [ ] 返回正确的 commit hash

**验证命令**:
```typescript
import { gitCommit, generateCommitMessage } from './lib/git-helper';

// 生成 commit message
const message = generateCommitMessage(
  '测试任务提交功能',
  'TEST-001',
  'feat:'
);
console.log('Commit message:', message);

// 执行 commit
const result = await gitCommit(message, 'main');
console.log('Commit result:', result);
```

---

### TC-004: 任务解析测试

**目的**: 验证能正确解析 04-ralph-tasks.md 文件

**步骤**:
1. 确保 `04-ralph-tasks.md` 文件存在
2. 调用 `parseTasks()` 函数
3. 验证解析结果

**预期结果**:
- [ ] 成功读取任务文件
- [ ] 正确解析所有任务条目
- [ ] 任务ID格式正确
- [ ] 状态识别正确
- [ ] 优先级推断合理

**验证命令**:
```typescript
import { parseTasks, calculateProgress, groupTasksByModule } from './lib/parser';

const tasks = parseTasks('04-ralph-tasks.md', 'storytree2');
console.log('Tasks count:', tasks.length);
console.log('First task:', tasks[0]);

const progress = calculateProgress(tasks);
console.log('Progress:', progress);

const groups = groupTasksByModule(tasks);
console.log('Modules:', Object.keys(groups));
```

---

### TC-005: 任务拆分同步测试

**目的**: 验证能将任务同步到飞书多维表格

**步骤**:
1. 准备测试任务数据
2. 调用 `syncTasksToBase()` 函数
3. 验证飞书 Base 记录
4. 检查映射文件

**预期结果**:
- [ ] 成功连接飞书 Base
- [ ] 成功创建/更新记录
- [ ] 生成正确的任务ID映射
- [ ] 映射文件正确保存

**验证命令**:
```typescript
import { syncTasksToBase } from './lib/base-sync';
import { loadConfig } from './lib/config';
import { parseTasks } from './lib/parser';

const config = loadConfig();
const tasks = parseTasks('04-ralph-tasks.md', 'storytree2');

const result = await syncTasksToBase(tasks, 'storytree2', config);
console.log('Sync result:', result);

// 检查映射文件
const mapping = JSON.parse(fs.readFileSync('.ralph-task-mapping.json', 'utf-8'));
console.log('Mapping count:', mapping.mappings.length);
```

---

### TC-006: 任务完成同步测试

**目的**: 验证能将任务完成状态同步到飞书

**步骤**:
1. 确保任务已存在于映射中
2. 调用 `syncTaskComplete()` 函数
3. 验证飞书 Base 记录状态

**预期结果**:
- [ ] 成功找到任务映射
- [ ] 成功更新记录状态为"已完成"
- [ ] 正确记录完成时间
- [ ] 正确记录 commit hash

**验证命令**:
```typescript
import { syncTaskComplete } from './lib/base-sync';
import { loadConfig } from './lib/config';

const config = loadConfig();
const result = await syncTaskComplete(
  '实现登录页面 UI',
  'abc1234',
  config
);
console.log('Complete sync result:', result);
```

---

### TC-007: 群聊通知测试

**目的**: 验证能发送进度通知到飞书群聊

**步骤**:
1. 准备测试通知数据
2. 调用 `notifyProgress()` 函数
3. 验证群聊消息

**预期结果**:
- [ ] 成功构建通知消息
- [ ] 消息格式正确
- [ ] 成功发送到群聊

**验证命令**:
```typescript
import { notifyProgress } from './lib/im-notify';
import { loadConfig } from './lib/config';

const config = loadConfig();

// 测试任务拆分通知
const splitResult = await notifyProgress('split', {
  project: 'storytree2',
  taskCount: 10,
}, config);
console.log('Split notify result:', splitResult);

// 测试任务完成通知
const completeResult = await notifyProgress('complete', {
  project: 'storytree2',
  taskDescription: '实现登录页面 UI',
  commitHash: 'abc1234',
}, config);
console.log('Complete notify result:', completeResult);
```

---

### TC-008: @消息处理测试

**目的**: 验证能正确处理飞书@消息

**步骤**:
1. 准备测试消息数据
2. 调用 `handleMention()` 函数
3. 验证评审文档生成
4. 验证回复消息

**预期结果**:
- [ ] 成功解析消息内容
- [ ] 正确提取关键词
- [ ] 正确判断评审类型
- [ ] 生成正确的评审文档
- [ ] 生成正确的回复消息

**验证命令**:
```typescript
import { handleMention } from './lib/mention-handler';
import { loadConfig } from './lib/config';

const config = loadConfig();

const message = {
  messageId: 'test-msg-001',
  content: '@机器人 请评审这个需求：添加用户登录功能',
  sender: { id: 'user-001', name: '测试用户' },
  chatId: 'oc_9f741c1f2d5b1fc1e98a0b42c04283c5',
  chatName: '测试群',
  timestamp: new Date().toISOString(),
};

const result = await handleMention(message, config);
console.log('Mention result:', result);
console.log('Review ID:', result.reviewId);
console.log('Review path:', result.reviewPath);
```

---

### TC-009: 评审文档管理测试

**目的**: 验证能正确保存和管理评审文档

**步骤**:
1. 调用 `saveReviewDoc()` 保存文档
2. 调用 `readReviewDoc()` 读取文档
3. 调用 `updateReviewStatus()` 更新状态
4. 调用 `listReviewDocs()` 列出文档

**预期结果**:
- [ ] 成功保存评审文档
- [ ] 成功读取评审文档
- [ ] 成功更新文档状态
- [ ] 正确列出所有文档

**验证命令**:
```typescript
import { saveReviewDoc, readReviewDoc, updateReviewStatus, listReviewDocs } from './lib/review-sync';

// 保存文档
const saveResult = await saveReviewDoc(
  'docs/reviews/test-review.md',
  '# 测试评审文档\n\n内容...'
);
console.log('Save result:', saveResult);

// 读取文档
const content = readReviewDoc('docs/reviews/test-review.md');
console.log('Read content:', content);

// 更新状态
const updateResult = await updateReviewStatus(
  'docs/reviews/test-review.md',
  '已确认',
  '测试备注'
);
console.log('Update result:', updateResult);

// 列出文档
const docs = listReviewDocs('docs/reviews/');
console.log('Docs list:', docs);
```

---

### TC-010: 端到端集成测试

**目的**: 验证完整的工作流程

**步骤**:
1. 执行 `syncTasksSplit()` 同步任务
2. 模拟完成任务并执行 `syncTaskCompleteWithNotify()`
3. 模拟@消息并执行 `processMention()`

**预期结果**:
- [ ] 任务成功同步到飞书 Base
- [ ] 任务完成状态正确更新
- [ ] 通知成功发送到群聊
- [ ] @消息正确处理并生成评审

**验证命令**:
```typescript
import { syncTasksSplit, syncTaskCompleteWithNotify, processMention } from './lib';

// 测试任务拆分同步
const splitResult = await syncTasksSplit('04-ralph-tasks.md', 'storytree2');
console.log('Split result:', splitResult);

// 测试任务完成同步
const completeResult = await syncTaskCompleteWithNotify(
  '实现登录页面 UI',
  'abc1234'
);
console.log('Complete result:', completeResult);

// 测试@消息处理
const mentionResult = await processMention({
  messageId: 'test-001',
  content: '@机器人 评审需求',
  sender: { id: 'u001', name: '用户' },
  chatId: 'oc_9f741c1f2d5b1fc1e98a0b42c04283c5',
  timestamp: new Date().toISOString(),
});
console.log('Mention result:', mentionResult);
```

---

## 验收标准

### 功能验收

| 功能模块 | 验收标准 | 状态 |
|---------|---------|------|
| 配置加载 | 能正确读取 .env 所有配置项 | ⬜ |
| Git Pull | 能成功拉取代码，失败时阻止任务开始 | ⬜ |
| Git Commit | 能成功提交并推送代码 | ⬜ |
| 任务解析 | 能正确解析 04-ralph-tasks.md | ⬜ |
| 任务同步 | 能同步到飞书 Base，生成映射文件 | ⬜ |
| 完成同步 | 能更新状态并记录 commit | ⬜ |
| 群聊通知 | 能发送各类通知到飞书群 | ⬜ |
| @消息处理 | 能处理@消息并生成评审文档 | ⬜ |

### 性能验收

| 指标 | 标准 | 状态 |
|-----|------|------|
| 配置加载 | < 100ms | ⬜ |
| Git 操作 | < 5s | ⬜ |
| 任务解析 | < 500ms (100个任务) | ⬜ |
| 飞书 API 调用 | < 3s | ⬜ |
| 批量同步 | < 10s (50个任务) | ⬜ |

### 稳定性验收

| 场景 | 标准 | 状态 |
|-----|------|------|
| 网络异常 | 失败不阻塞主流程，记录日志 | ⬜ |
| API 限流 | 自动重试，最多3次 | ⬜ |
| 配置缺失 | 优雅降级，提示用户 | ⬜ |
| 并发操作 | 单线程执行，避免冲突 | ⬜ |

---

## 测试执行计划

### Phase 1: 单元测试 (30分钟)

1. [ ] TC-001: 配置加载测试
2. [ ] TC-002: Git Pull 测试
3. [ ] TC-003: Git Commit 测试
4. [ ] TC-004: 任务解析测试

### Phase 2: 集成测试 (45分钟)

5. [ ] TC-005: 任务拆分同步测试
6. [ ] TC-006: 任务完成同步测试
7. [ ] TC-007: 群聊通知测试

### Phase 3: 功能测试 (30分钟)

8. [ ] TC-008: @消息处理测试
9. [ ] TC-009: 评审文档管理测试

### Phase 4: 端到端测试 (30分钟)

10. [ ] TC-010: 端到端集成测试

---

## 问题记录

| ID | 问题描述 | 严重程度 | 状态 | 备注 |
|---|---------|---------|------|------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## 测试报告模板

```markdown
# Ralph 飞书集成测试报告

## 测试日期
YYYY-MM-DD

## 测试人员
[姓名]

## 测试环境
- OS: macOS/Linux/Windows
- Node.js: v18.x
- 飞书应用: [App ID]
- 多维表格: [链接]
- 群聊: [Chat ID]

## 测试结果摘要
- 总用例数: 10
- 通过: X
- 失败: X
- 跳过: X

## 详细结果

### 通过的测试
- TC-001: 配置加载测试 ✅
- ...

### 失败的测试
- TC-00X: [描述] ❌
  - 错误信息: ...
  - 截图/日志: ...

## 结论
[是否通过验收]

## 建议
[改进建议]
```

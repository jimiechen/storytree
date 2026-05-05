# Week 1 任务清单：Mock 接入阶段

**文档版本**: v1.0 (2026-05-05)
**基于**: 架构师评审意见 (TabAI会话_1777980331866.md)
**前置条件**: ✅ Week 0 Go 判定已通过
**执行模式**: **Mock 模式**（不接真实 Agent、不调用真实模型）

---

## 一、Week 1 目标

### 核心目标

> **在不接真实 Agent 的前提下，完成小说项目、章节、角色、AI 任务、AI 日志的最小闭环验证。**

### 成功标准

Week 1 不用"写了多少代码"作为通过标准，而用**"最小闭环是否跑通"**来判断：

| # | 检查项 | 通过标准 | 状态 |
|---|--------|---------|:----:|
| 1 | Mock 项目数据 | 能加载 1 个小说项目 | ⏳ |
| 2 | Mock 章节数据 | 能显示至少 3 个章节 | ⏳ |
| 3 | Mock 角色数据 | 能显示至少 3 个角色 | ⏳ |
| 4 | Provider 抽象 | UI 不直接依赖静态数据文件 | ⏳ |
| 5 | FakeAgentProvider | 能模拟续写、改写、摘要、失败、取消 | ⏳ |
| 6 | AITask 状态 | 能展示 pending/running/success/failed/cancelled | ⏳ |
| 7 | AILog | 能记录任务输入、输出、状态、时间 | ⏳ |
| 8 | 编辑器写回 | AI 结果能进入建议区或草稿区 | ⏳ |
| 9 | 权限边界 | 不调用真实 Bash/WebFetch/WebSearch/Agent/Task | ⏳ |
| 10 | 构建验证 | typecheck/build 仍然通过 | ⏳ |

---

## 二、Week 1 任务分解

### 阶段 1: 基础设施准备 (Day 1)

#### TASK-W1-001: 创建功能分支

```bash
git checkout -b feat/week1-mock-provider-novel-editor
```

**交付物**: 功能分支已创建并切换

**验证**: `git branch --show-current` 输出 `feat/week1-mock-provider-novel-editor`

---

#### TASK-W1-002: 创建 caiode 项目目录结构

在 `caiode/` 下创建 Week 1 开发所需的目录：

```
caiode/
├── src/
│   ├── providers/          # Provider 实现
│   │   ├── novel-project.ts
│   │   ├── novel-chapter.ts
│   │   ├── novel-character.ts
│   │   ├── novel-agent.ts      # FakeAgentProvider
│   │   └── index.ts
│   ├── types/              # 业务类型定义
│   │   ├── project.ts
│   │   ├── chapter.ts
│   │   ├── character.ts
│   │   ├── ai-task.ts
│   │   └── ai-log.ts
│   ├── mock-data/          # Mock 数据
│   │   ├── projects.json
│   │   ├── chapters.json
│   │   └── characters.json
│   └── utils/              # 工具函数
├── tests/                  # 单元测试
│   ├── providers.test.ts
│   └── fake-agent.test.ts
└── docs/
    └── week1/             # Week 1 文档
```

**交付物**: 目录结构已创建

**约束**: 不修改 `opencode-1.4.0/` 上游核心源码

---

### 阶段 2: 类型定义与 Mock 数据 (Day 1-2)

#### TASK-W1-003: 定义最小业务对象类型

**文件**: `caiode/src/types/*.ts`

**对象定义**:

```typescript
// project.ts
interface Project {
  id: string;
  name: string;
  path: string;
  type: 'novel-project';
  metadata: {
    author?: string;
    genre?: string;
    wordCount?: number;
    createdAt: Date;
    updatedAt: Date;
  };
}

// chapter.ts
interface Chapter {
  id: string;
  projectId: string;
  title: string;
  order: number;
  content: string;
  status: 'draft' | 'revising' | 'complete';
  wordCount: number;
  aiSuggestions?: AISuggestion[];
}

// character.ts
interface Character {
  id: string;
  projectId: string;
  name: string;
  description: string;
  traits: string[];
  voiceTone: string; // 语气设定
  relationships: CharacterRelationship[];
}

// ai-task.ts
type AITaskStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
type AITaskType = 'continue-writing' | 'rewrite' | 'summarize' | 'character-dialogue';

interface AITask {
  id: string;
  type: AITaskType;
  status: AITaskStatus;
  input: AITaskInput;
  output?: AITaskOutput;
  error?: string;
  progress?: number; // 0-1
  createdAt: Date;
  completedAt?: Date;
}

// ai-log.ts
interface AILog {
  id: string;
  taskId: string;
  provider: 'fake'; // Week 1 只用 fake
  model: string; // "fake-model-v1"
  prompt: string;
  response: string;
  duration: number; // ms
  timestamp: Date;
}
```

**交付物**: 5 个类型定义文件

**验证**: TypeScript 编译无错误

---

#### TASK-W1-004: 创建 Mock 数据集

**文件**: `caiode/src/mock-data/*.ts`

**Mock 项目数据**:

```typescript
// projects.json → projects.ts
export const mockProjects: Project[] = [
  {
    id: 'proj-001',
    name: '星辰物语',
    path: '/mock/novels/star-tale',
    type: 'novel-project',
    metadata: { author: '测试作者', genre: '玄幻', wordCount: 50000 }
  }
];
```

**Mock 章节数据** (至少 3 章):

```typescript
export const mockChapters: Chapter[] = [
  { id: 'ch-001', projectId: 'proj-001', title: '第一章 星辰初现', order: 1, content: '...', status: 'draft', wordCount: 3000 },
  { id: 'ch-002', projectId: 'proj-001', title: '第二章 迷雾森林', order: 2, content: '...', status: 'draft', wordCount: 2800 },
  { id: 'ch-003', projectId: 'proj-001', title: '第三章 古老契约', order: 3, content: '...', status: 'revising', wordCount: 3200 }
];
```

**Mock 角色数据** (至少 3 个):

```typescript
export const mockCharacters: Character[] = [
  { id: 'char-001', projectId: 'proj-001', name: '林星辰', description: '主角', traits: ['勇敢', '善良'], voiceTone: '坚定有力' },
  { id: 'char-002', projectId: 'proj-001', name: '苏婉儿', description: '女主角', traits: ['聪慧', '温柔'], voiceTone: '温婉细腻' },
  { id: 'char-003', projectId: 'proj-001', name: '老者', description: '神秘导师', traits: ['睿智', '神秘'], voiceTone: '深沉缓慢' }
];
```

**交付物**: 3 个 Mock 数据文件，包含完整示例数据

---

### 阶段 3: Provider 抽象层实现 (Day 2-3)

#### TASK-W1-005: 实现 NovelProjectProvider

**文件**: `caiode/src/providers/novel-project.ts`

**接口实现**:
```typescript
class NovelProjectProvider implements INovelProjectProvider {
  async listProjects(): Promise<Project[]> { /* 返回 mockProjects */ }
  async getProject(id: string): Promise<Project> { /* 按 ID 查找 */ }
  async createProject(data: CreateProjectInput): Promise<Project> { /* 创建新项目 */ }
}
```

---

#### TASK-W1-006: 实现 NovelChapterProvider

**文件**: `caiode/src/providers/novel-chapter.ts`

**接口实现**:
```typescript
class NovelChapterProvider implements INovelChapterProvider {
  async listChapters(projectId: string): Promise<Chapter[]> { /* 返回项目章节 */ }
  async getChapter(id: string): Promise<Chapter> { /* 获取章节详情 */ }
  async saveChapter(id: string, content: string): Promise<void> { /* 保存草稿 */ }
  async writeAIResult(chapterId: string, result: string): Promise<void> { /* 写入 AI 建议 */ }
}
```

---

#### TASK-W1-007: 实现 NovelCharacterProvider

**文件**: `caiode/src/providers/novel-character.ts`

**接口实现**:
```typescript
class NovelCharacterProvider implements INovelCharacterProvider {
  async listCharacters(projectId: string): Promise<Character[]> { /* 返回项目角色 */ }
  async getCharacter(id: string): Promise<Character> { /* 获取角色详情 */ }
  async updateCharacter(id: string, data: Partial<Character>): Promise<void> { /* 更新角色 */ }
}
```

---

### 阶段 4: FakeAgentProvider 核心 (Day 3-4)

#### TASK-W1-008: 实现 FakeAgentProvider (核心任务)

**文件**: `caiode/src/providers/novel-agent.ts`

**这是 Week 1 最重要的任务。**

**模拟场景覆盖**:

| 场景 | 触发条件 | 模拟行为 | 延迟 |
|------|---------|---------|------|
| AI 续写成功 | type=continue-writing | 返回续写文本 (~200字) | 1s |
| AI 改写成功 | type=rewrite | 返回改写文本 | 1s |
| AI 摘要成功 | type=summarize | 返回摘要 (~100字) | 1s |
| 角色语气改写 | type=character-dialogue | 返回对话内容 | 1s |
| 任务失败 | input 包含 "fail" 关键字 | 返回 failed + 错误信息 | 0.5s |
| 用户取消 | 模拟取消操作 | 返回 cancelled | 即时 |
| 权限不足 | input 包含 "sudo"/"admin" | 返回 permission_denied | 即时 |
| 配额不足 | 连续调用 >10 次 | 返回 quota_exceeded | 即时 |
| 长任务处理中 | 默认行为 | 先返回 running，延迟后返回 success | 2s |

**实现要点**:

```typescript
class FakeAgentProvider implements INovelAgentProvider {
  private callCount = 0;

  async submitTask(input: AITaskInput): Promise<AITask> {
    const task = this.createTask(input);

    // 模拟异步处理
    setTimeout(() => this.completeTask(task), this.getDelay(input));

    return task;
  }

  private getDelay(input: AITaskInput): number {
    if (input.prompt?.includes('fail')) return 500; // 快速失败
    if (input.prompt?.includes('cancel')) return 0;
    return 1000 + Math.random() * 1000; // 正常 1-2s
  }

  private completeTask(task: AITask): void {
    // 根据输入决定结果
    if (this.shouldFail(task)) { task.status = 'failed'; task.error = '模拟错误'; }
    else if (this.shouldCancel(task)) { task.status = 'cancelled'; }
    else {
      task.status = 'success';
      task.output = this.generateMockOutput(task);
    }

    task.completedAt = new Date();
    this.logTask(task); // 记录到 AILog
  }
}
```

**交付物**: FakeAgentProvider 完整实现，覆盖 9 种场景

**验证**: 单元测试覆盖所有 9 种场景

---

#### TASK-W1-009: 实现 AILog 记录系统

**文件**: `caiode/src/providers/ai-log.ts` (或在 novel-agent.ts 中)

**功能**:
- 记录每次 FakeAgentProvider 调用
- 存储输入、输出、状态、耗时
- 提供查询接口

---

### 阶段 5: 接入点与 UI 展示 (Day 4-5)

#### TASK-W1-010: 扩展 Workspace UI (novel-project 类型)

**位置**: 在 opencode 的 Sidebar 或 Workspace 页面添加入口

**最低要求**:
- 在侧边栏显示 "卡牌物语" 项目入口
- 点击后展示项目详情页（Mock 数据）
- 显示章节列表和角色列表

**实现方式优先级**:
1. **Workspace Mode** (强推荐): 定义 `novel-project` workspace type
2. **新页面** (推荐): 独立路由 `/novel/:projectId`
3. **Panel** (可选): 侧边面板嵌入

**约束**: 不修改 opencode 上游核心源码，仅在 caiode 自有代码中实现

---

#### TASK-W1-011: 实现 AI 任务触发与结果展示

**UI 流程**:
```
用户选择章节 → 点击 "AI 续写" 按钮
  ↓
调用 FakeAgentProvider.submitTask()
  ↓
UI 显示任务状态: pending → running → success
  ↓
展示 AI 结果到建议区/草稿区
  ↓
记录到 AILog
```

---

### 阶段 6: 测试与验证 (Day 5)

#### TASK-W1-012: 编写单元测试

**文件**: `caiode/tests/*.test.ts`

**测试覆盖**:
- [ ] Provider 数据读取正确性
- [ ] FakeAgentProvider 9 种场景
- [ ] AITask 状态流转正确性
- [ ] AILog 记录完整性
- [ ] 权限边界（确认未调用禁用工具）

#### TASK-W1-013: 执行构建验证

```bash
bun run typecheck  # 必须通过
bun run build     # 必须通过
```

#### TASK-W1-014: 生成 Week 1 完成报告

**输出**: `docs/planning/week1/WEEK1-MOCK-INTEGRATION-REPORT.md`

---

## 三、禁止事项 (Mock 模式铁律)

```
❌ 禁止:
  - 接真实 Agent (OpenAI/Claude/Gemini 等)
  - 调用真实模型 API
  - 执行真实远程 HTTP 请求
  - 使用 Bash 工具执行命令
  - 使用 WebFetch/WebSearch
  - 修改 opencode-1.4.0 上游核心源码
  - 提交 node_modules/.cache/dist/target 到 Git
  - 把"未实际验证"写成"已完成"
  - 在 Week 1 引入多 Agent 协作

✅ 允许:
  - 读取 opencode 源码进行分析
  - 在 caiode/ 自有目录下创建文件
  - 定义接口、类型、Mock 数据
  - 实现 Fake/Mock 类
  - 编写单元测试
  - 输出文档和报告
```

---

## 四、风险控制

| 风险项 | 缓解措施 | 应急方案 |
|--------|---------|---------|
| opencode 版本兼容 | 不修改上游核心源码 | 如遇问题回退到只读分析 |
| TypeScript 类型冲突 | 使用 namespace 或 alias | 隔离 caiode 类型定义 |
| UI 接入复杂度高 | 先做最小 Demo | 降低 UI 要求，先验证数据流 |
| Mock 数据不够真实 | 参考真实小说结构 | 请架构师审核 Mock 数据设计 |

---

## 五、时间估算

| 阶段 | 任务 | 预估时间 | 累计 |
|------|------|---------|------|
| 1 | 分支创建 + 目录结构 | 0.5h | 0.5h |
| 2 | 类型定义 + Mock 数据 | 1.5h | 2h |
| 3 | Provider 实现 (3个) | 2h | 4h |
| 4 | FakeAgentProvider 核心 | 2h | 6h |
| 5 | Workspace UI 接入 | 2h | 8h |
| 6 | 测试 + 验证 + 报告 | 2h | 10h |

**总计**: 约 **10 小时** (2 个工作日)

---

## 六、交付物清单

| # | 交付物 | 路径 | 状态 |
|---|--------|------|:----:|
| 1 | 功能分支 | `feat/week1-mock-provider-novel-editor` | ⏳ |
| 2 | 类型定义 (5个) | `caiode/src/types/*.ts` | ⏳ |
| 3 | Mock 数据 (3个) | `caiode/src/mock-data/*.ts` | ⏳ |
| 4 | Provider 实现 (4个) | `caiode/src/providers/*.ts` | ⏳ |
| 5 | 单元测试 | `caiode/tests/*.test.ts` | ⏳ |
| 6 | Week 1 报告 | `docs/planning/week1/WEEK1-MOCK-INTEGRATION-REPORT.md` | ⏳ |

---

*文档完成时间: 2026-05-05 19:33:00*
*状态: [READY_FOR_REVIEW]*
*下一步: 开始执行 TASK-W1-001*

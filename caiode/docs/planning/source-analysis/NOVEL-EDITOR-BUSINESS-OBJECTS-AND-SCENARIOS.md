# AI 小说编辑器业务对象与 Mock 场景清单

**生成时间**：2026-05-02  
**文档目的**：为 Mock 数据设计、MockProvider 实现和 TDD 测试提供业务对象、用户流程和场景参考  
**来源**：PRD-v1.0-MVP-AI-Novel-Editor.md 及相关 planning 文档

---

## 1. 核心业务对象

### 1.1 Project（项目）

**定义**：小说的顶层容器，包含所有创作内容、沙箱和配置。

**字段定义**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✓ | 项目唯一标识（UUID） |
| `name` | string | ✓ | 项目名称 |
| `description` | string | | 项目描述 |
| `circleId` | string | | 绑定的圈子 ID（可空） |
| `language` | enum | ✓ | `en` \| `zh` \| 其他 |
| `genre` | string | | 题材类型（奇幻/科幻/言情等） |
| `targetAudience` | string | | 目标读者群体 |
| `aiStyle` | enum | | `concise` \| `flowery` \| `suspense` \| `humor` |
| `defaultSandboxId` | string | | 默认沙箱 ID |
| `status` | enum | ✓ | `active` \| `archived` |
| `createdAt` | Date | ✓ | 创建时间 |
| `updatedAt` | Date | ✓ | 更新时间 |

**Mock 示例**：

```typescript
const mockProject: Project = {
  id: 'proj-shanhai-001',
  name: '山海关外·异兽录',
  description: '基于山海关传说创作的奇幻异兽故事',
  circleId: 'circle-cardstory',
  language: 'en',
  genre: 'fantasy',
  targetAudience: '13-18',
  aiStyle: 'flowery',
  defaultSandboxId: 'sandbox-main-001',
  status: 'active',
  createdAt: new Date('2026-04-01'),
  updatedAt: new Date('2026-04-15'),
}
```

---

### 1.2 Sandbox（沙箱）

**定义**：独立的工作目录、上下文环境和版本空间，用于隔离不同创作方案。

**字段定义**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✓ | 沙箱唯一标识 |
| `projectId` | string | ✓ | 所属项目 ID |
| `name` | string | ✓ | 沙箱名称（如"主线"、"实验"、"暗线"） |
| `type` | enum | ✓ | `main` \| `experiment` \| `alternate` \| `rewrite` \| `style` |
| `baseBranch` | string | | 基于的 Git 分支 |
| `worktreePath` | string | | Git worktree 路径 |
| `status` | enum | ✓ | `active` \| `archived` \| `deleted` |
| `isDefault` | boolean | | 是否为默认沙箱 |
| `createdAt` | Date | ✓ | 创建时间 |
| `archivedAt` | Date | | 归档时间（可选） |

**Mock 示例**：

```typescript
const mockSandboxes: Sandbox[] = [
  {
    id: 'sandbox-main-001',
    projectId: 'proj-shanhai-001',
    name: '主线',
    type: 'main',
    baseBranch: 'main',
    worktreePath: '/projects/shanhai/sandboxes/main',
    status: 'active',
    isDefault: true,
    createdAt: new Date('2026-04-01'),
  },
  {
    id: 'sandbox-exp-001',
    projectId: 'proj-shanhai-001',
    name: '实验·新结局',
    type: 'experiment',
    baseBranch: 'main',
    worktreePath: '/projects/shanhai/sandboxes/exp-new-ending',
    status: 'active',
    isDefault: false,
    createdAt: new Date('2026-04-10'),
  },
]
```

---

### 1.3 Chapter（章节）

**定义**：故事内容的基本单元，包含正文和元数据。

**字段定义**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✓ | 章节唯一标识 |
| `projectId` | string | ✓ | 所属项目 ID |
| `sandboxId` | string | ✓ | 所属沙箱 ID |
| `title` | string | ✓ | 章节标题 |
| `content` | string | | Markdown 正文内容 |
| `contentPath` | string | ✓ | 章节文件路径 |
| `status` | enum | ✓ | 见 ChapterStatus 状态机 |
| `order` | number | ✓ | 章节排序权重 |
| `summary` | string | | AI 生成的章节摘要 |
| `wordCount` | number | | 字数统计 |
| `characterIds` | string[] | | 出场角色 ID 列表 |
| `branchNodeId` | string | | 关联的分支节点 ID（可选） |
| `version` | number | | 当前版本号 |
| `parentChapterId` | string | | 父章节 ID（分支来源） |
| `createdAt` | Date | ✓ | 创建时间 |
| `updatedAt` | Date | ✓ | 更新时间 |
| `publishedAt` | Date | | 发布时间（可选） |

**ChapterStatus 状态机**：

```typescript
enum ChapterStatus {
  Draft = 'draft',        // 草稿，可自由编辑
  Editing = 'editing',    // 修改中，AI 正在改写
  PendingReview = 'pending_review',  // 待审核
  Approved = 'approved',   // 已审核通过
  Published = 'published', // 已发布，只读
  Archived = 'archived',  // 已归档，只读
}
```

**Mock 示例**：

```typescript
const mockChapters: Chapter[] = [
  {
    id: 'ch-001',
    projectId: 'proj-shanhai-001',
    sandboxId: 'sandbox-main-001',
    title: 'Chapter 1: The Gate Opens',
    content: '# Chapter 1: The Gate Opens\n\nThe ancient gate creaked...',
    contentPath: '/chapters/ch001.md',
    status: ChapterStatus.Published,
    order: 1,
    summary: '主角发现山海关遗迹，进入异兽世界',
    wordCount: 2850,
    characterIds: ['char-001', 'char-002'],
    branchNodeId: 'node-001',
    version: 3,
    createdAt: new Date('2026-04-01'),
    updatedAt: new Date('2026-04-05'),
    publishedAt: new Date('2026-04-06'),
  },
  {
    id: 'ch-002',
    projectId: 'proj-shanhai-001',
    sandboxId: 'sandbox-main-001',
    title: 'Chapter 2: First Encounter',
    content: '# Chapter 2: First Encounter\n\nA shadow moved in the mist...',
    contentPath: '/chapters/ch002.md',
    status: ChapterStatus.Draft,
    order: 2,
    summary: '',
    wordCount: 1200,
    characterIds: ['char-001', 'char-003'],
    version: 1,
    createdAt: new Date('2026-04-10'),
    updatedAt: new Date('2026-04-10'),
  },
]
```

---

### 1.4 Character（角色）

**定义**：故事中的角色实体，包含设定信息。

**字段定义**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✓ | 角色唯一标识 |
| `projectId` | string | ✓ | 所属项目 ID |
| `name` | string | ✓ | 角色名称 |
| `aliases` | string[] | | 别名列表 |
| `avatar` | string | | 头像 URL（可选） |
| `brief` | string | | 角色简介 |
| `personality` | string | | 性格特征 |
| `motivation` | string | | 行为动机 |
| `background` | string | | 背景故事 |
| `speakingStyle` | string | | 语言风格/口癖 |
| `taboos` | string | | 禁忌设定 |
| `appearance` | string | | 外貌描述 |
| `relationships` | Relationship[] | | 关系列表 |
| `chapterAppearances` | string[] | | 出场章节 ID 列表 |
| `cardContent` | string | | 异兽卡牌文案（卡牌物语专用） |
| `status` | enum | ✓ | `active` \| `archived` |
| `createdAt` | Date | ✓ | 创建时间 |
| `updatedAt` | Date | ✓ | 更新时间 |

**Relationship 类型**：

```typescript
interface Relationship {
  targetCharacterId: string
  type: 'friend' | 'enemy' | 'lover' | 'family' | 'rival' | 'mentor' | 'other'
  description: string
}
```

**Mock 示例**：

```typescript
const mockCharacters: Character[] = [
  {
    id: 'char-001',
    projectId: 'proj-shanhai-001',
    name: 'Lin Feng',
    aliases: ['林枫', 'Young Lin'],
    brief: '勇敢的守门人后裔',
    personality: '内向但坚定，好奇心强，重视承诺',
    motivation: '揭开家族秘密，找到失散的妹妹',
    background: '山海关守门人家族的最后传人',
    speakingStyle: '简洁有力，偶用古语',
    taboos: '绝不背叛信任他的人',
    appearance: '黑发，锐利眼神，身着改装探险服',
    relationships: [
      { targetCharacterId: 'char-002', type: 'friend', description: '青梅竹马的战友' },
      { targetCharacterId: 'char-003', type: 'enemy', description: '宿命对手' },
    ],
    chapterAppearances: ['ch-001', 'ch-002'],
    cardContent: '**Lin Feng** - The Last Gatekeeper\n守门人后裔，掌握开启异界之门的能力。',
    status: 'active',
    createdAt: new Date('2026-04-01'),
    updatedAt: new Date('2026-04-12'),
  },
]
```

---

### 1.5 WorldSetting（世界观设定）

**定义**：故事的世界背景设定，包括地点、势力、物品、规则等。

**字段定义**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✓ | 设定唯一标识 |
| `projectId` | string | ✓ | 所属项目 ID |
| `category` | enum | ✓ | `location` \| `faction` \| `item` \| `rule` \| `timeline` \| `creature` \| `culture` |
| `name` | string | ✓ | 设定名称 |
| `content` | string | | 设定内容 |
| `tags` | string[] | | 标签列表 |
| `relatedCharacterIds` | string[] | | 关联角色 ID |
| `relatedChapterIds` | string[] | | 关联章节 ID |
| `metadata` | Record<string, unknown> | | 分类特定元数据 |
| `status` | enum | ✓ | `active` \| `archived` |
| `createdAt` | Date | ✓ | 创建时间 |
| `updatedAt` | Date | ✓ | 更新时间 |

**category-specific metadata 示例**：

```typescript
// location 类型
{ coordinates: '113.2,23.1', climate: 'subtropical', population: 'unknown' }

// creature 类型（异兽设定，卡牌物语核心）
{ 
  type: 'Mythical Beast',
  rarity: 'Legendary',
  attributes: ['fire', 'wind'],
  abilities: ['Flame Breath', 'Storm Flight'],
  cardArtPrompt: 'A majestic fire bird with golden feathers...'
}
```

**Mock 示例**：

```typescript
const mockWorldSettings: WorldSetting[] = [
  {
    id: 'world-001',
    projectId: 'proj-shanhai-001',
    category: 'location',
    name: 'Shanhaiguan Pass',
    content: '山海关，天下第一关。明朝遗留下来的古长城东端起点。',
    tags: ['ancient', 'portal', 'historical'],
    relatedCharacterIds: ['char-001'],
    status: 'active',
    createdAt: new Date('2026-04-01'),
    updatedAt: new Date('2026-04-01'),
  },
  {
    id: 'world-002',
    projectId: 'proj-shanhai-001',
    category: 'creature',
    name: 'Flame Phoenix',
    content: '火焰凤凰，传说中的神兽。',
    tags: ['fire', 'phoenix', 'legendary'],
    metadata: {
      rarity: 'Legendary',
      attributes: ['fire', 'wind'],
      abilities: ['Flame Breath', 'Storm Flight', 'Rebirth'],
      cardArtPrompt: 'A majestic fire bird with golden feathers...',
    },
    status: 'active',
    createdAt: new Date('2026-04-02'),
    updatedAt: new Date('2026-04-02'),
  },
]
```

---

### 1.6 BranchNode（分支节点）

**定义**：分支剧情图中的节点，代表章节或选择点。

**字段定义**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✓ | 节点唯一标识 |
| `projectId` | string | ✓ | 所属项目 ID |
| `sandboxId` | string | ✓ | 所属沙箱 ID |
| `type` | enum | ✓ | 见 BranchNodeType 状态机 |
| `title` | string | | 节点标题 |
| `chapterId` | string | | 关联章节 ID |
| `content` | string | | 节点内容/描述 |
| `metadata` | Record<string, unknown> | | 类型特定元数据 |
| `position` | { x: number, y: number } | | 可视化位置（画布坐标） |
| `status` | enum | ✓ | `active` \| `archived` |
| `createdAt` | Date | ✓ | 创建时间 |
| `updatedAt` | Date | ✓ | 更新时间 |

**BranchNodeType 状态机**：

```typescript
enum BranchNodeType {
  Chapter = 'chapter',     // 普通章节节点
  Choice = 'choice',       // 选择节点
  Question = 'question',   // 问答节点
  Hidden = 'hidden',      // 隐藏节点（逻辑）
  Junction = 'junction',   // 汇合节点
  Ending = 'ending',       // 结局节点
}
```

**Mock 示例**：

```typescript
const mockBranchNodes: BranchNode[] = [
  {
    id: 'node-001',
    projectId: 'proj-shanhai-001',
    sandboxId: 'sandbox-main-001',
    type: BranchNodeType.Chapter,
    title: 'Gate Discovery',
    chapterId: 'ch-001',
    content: 'The protagonist discovers the ancient gate.',
    position: { x: 100, y: 100 },
    status: 'active',
    createdAt: new Date('2026-04-01'),
    updatedAt: new Date('2026-04-01'),
  },
  {
    id: 'node-002',
    projectId: 'proj-shanhai-001',
    sandboxId: 'sandbox-main-001',
    type: BranchNodeType.Choice,
    title: 'First Choice',
    content: 'Should Lin Feng enter the gate alone?',
    position: { x: 100, y: 200 },
    status: 'active',
    createdAt: new Date('2026-04-02'),
    updatedAt: new Date('2026-04-02'),
  },
  {
    id: 'node-003',
    projectId: 'proj-shanhai-001',
    sandboxId: 'sandbox-main-001',
    type: BranchNodeType.Ending,
    title: 'Bad Ending: Lone Explorer',
    content: 'Lin Feng enters alone and becomes lost...',
    position: { x: 50, y: 300 },
    status: 'active',
    createdAt: new Date('2026-04-02'),
    updatedAt: new Date('2026-04-02'),
  },
]
```

---

### 1.7 BranchEdge（分支边）

**定义**：分支节点之间的连接，包含条件或选项。

**字段定义**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✓ | 边唯一标识 |
| `projectId` | string | ✓ | 所属项目 ID |
| `sourceNodeId` | string | ✓ | 源节点 ID |
| `targetNodeId` | string | ✓ | 目标节点 ID |
| `type` | enum | ✓ | `choice` \| `question` \| `condition` \| `default` |
| `label` | string | | 选项文字/标签 |
| `conditions` | Condition[] | | 进入条件（可选） |
| `effects` | Effect[] | | 选择效果（可选） |
| `order` | number | | 多个出边的排序 |
| `createdAt` | Date | ✓ | 创建时间 |

**Condition 和 Effect 类型**：

```typescript
interface Condition {
  type: 'variable' | 'attribute' | 'choice_count'
  key: string
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte'
  value: string | number
}

interface Effect {
  type: 'set_variable' | 'modify_attribute' | 'unlock_ending'
  key: string
  value: string | number
}
```

**Mock 示例**：

```typescript
const mockBranchEdges: BranchEdge[] = [
  {
    id: 'edge-001',
    projectId: 'proj-shanhai-001',
    sourceNodeId: 'node-001',
    targetNodeId: 'node-002',
    type: 'default',
    label: 'Continue',
    order: 0,
    createdAt: new Date('2026-04-02'),
  },
  {
    id: 'edge-002',
    projectId: 'proj-shanhai-001',
    sourceNodeId: 'node-002',
    targetNodeId: 'node-003',
    type: 'choice',
    label: 'Enter alone',
    conditions: [],
    effects: [{ type: 'set_variable', key: 'lone_entry', value: true }],
    order: 0,
    createdAt: new Date('2026-04-02'),
  },
  {
    id: 'edge-003',
    projectId: 'proj-shanhai-001',
    sourceNodeId: 'node-002',
    targetNodeId: 'node-004',
    type: 'choice',
    label: 'Wait for backup',
    conditions: [],
    effects: [{ type: 'set_variable', key: 'has_backup', value: true }],
    order: 1,
    createdAt: new Date('2026-04-02'),
  },
]
```

---

### 1.8 AITask（AI 任务）

**定义**：AI 执行的任务记录。

**字段定义**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✓ | 任务唯一标识 |
| `projectId` | string | ✓ | 所属项目 ID |
| `sandboxId` | string | ✓ | 所属沙箱 ID |
| `type` | enum | ✓ | 见 AITaskType |
| `status` | enum | ✓ | 见 AITaskStatus |
| `chapterId` | string | | 目标章节 ID（可选） |
| `branchNodeId` | string | | 目标分支节点 ID（可选） |
| `input` | Record<string, unknown> | | 任务输入参数 |
| `output` | AITaskOutput | | 任务输出结果 |
| `error` | string | | 错误信息（失败时） |
| `progress` | number | | 进度 0-100 |
| `progressMessage` | string | | 进度描述 |
| `model` | string | | 使用的模型 |
| `tokenUsage` | TokenUsage | | Token 使用统计 |
| `startedAt` | Date | | 开始时间 |
| `completedAt` | Date | | 完成时间 |
| `createdAt` | Date | ✓ | 创建时间 |

**AITaskType 枚举**：

```typescript
enum AITaskType {
  Continue = 'continue',       // 续写
  Rewrite = 'rewrite',          // 改写
  Expand = 'expand',            // 扩写
  Outline = 'outline',         // 大纲生成
  Summary = 'summary',         // 摘要生成
  ConsistencyCheck = 'consistency_check',  // 一致性检查
  CharacterCheck = 'character_check',     // 角色一致性检查
  WorldCheck = 'world_check',           // 世界观冲突检查
  BranchGenerate = 'branch_generate',   // 分支生成
  BatchGenerate = 'batch_generate',     // 批量生成
  Polish = 'polish',            // 润色
  TitleSuggest = 'title_suggest',  // 标题建议
}
```

**AITaskStatus 状态机**：

```typescript
enum AITaskStatus {
  Pending = 'pending',       // 等待中
  Running = 'running',       // 执行中
  Completed = 'completed',   // 成功完成
  Failed = 'failed',         // 执行失败
  Cancelled = 'cancelled',   // 已取消
  NeedsConfirmation = 'needs_confirmation',  // 需人工确认
}
```

**TokenUsage 类型**：

```typescript
interface TokenUsage {
  inputTokens: number
  outputTokens: number
  cacheReadInputTokens: number
  cacheCreationInputTokens: number
  totalCost: number  // USD
}
```

**Mock 示例**：

```typescript
const mockAITasks: AITask[] = [
  {
    id: 'task-001',
    projectId: 'proj-shanhai-001',
    sandboxId: 'sandbox-main-001',
    type: AITaskType.Continue,
    status: AITaskStatus.Completed,
    chapterId: 'ch-001',
    input: {
      continuationHint: 'continue the mysterious atmosphere',
      targetLength: 'medium',
      styleMatch: true,
    },
    output: {
      generatedContent: 'The mist seemed to whisper ancient warnings...',
      wordCount: 850,
    },
    progress: 100,
    model: 'claude-sonnet-4-20250514',
    tokenUsage: {
      inputTokens: 1200,
      outputTokens: 320,
      cacheReadInputTokens: 0,
      cacheCreationInputTokens: 0,
      totalCost: 0.008,
    },
    startedAt: new Date('2026-04-05T10:00:00'),
    completedAt: new Date('2026-04-05T10:00:45'),
    createdAt: new Date('2026-04-05T10:00:00'),
  },
  {
    id: 'task-002',
    projectId: 'proj-shanhai-001',
    sandboxId: 'sandbox-main-001',
    type: AITaskType.Rewrite,
    status: AITaskStatus.Failed,
    chapterId: 'ch-002',
    input: {
      style: 'suspense',
      targetAudience: 'adult',
    },
    error: 'Model timeout after 60s',
    progress: 45,
    progressMessage: 'Generating middle section...',
    model: 'claude-opus-4-20250514',
    tokenUsage: {
      inputTokens: 2500,
      outputTokens: 0,
      cacheReadInputTokens: 0,
      cacheCreationInputTokens: 0,
      totalCost: 0.015,
    },
    startedAt: new Date('2026-04-05T11:00:00'),
    createdAt: new Date('2026-04-05T11:00:00'),
  },
]
```

---

### 1.9 AILog（AI 日志）

**定义**：AI 调用的详细日志。

**字段定义**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✓ | 日志唯一标识 |
| `taskId` | string | ✓ | 关联任务 ID |
| `timestamp` | Date | ✓ | 日志时间 |
| `level` | enum | ✓ | `info` \| `warn` \| `error` |
| `message` | string | ✓ | 日志消息 |
| `metadata` | Record<string, unknown> | | 额外元数据 |

**Mock 示例**：

```typescript
const mockAILogs: AILog[] = [
  {
    id: 'log-001',
    taskId: 'task-001',
    timestamp: new Date('2026-04-05T10:00:01'),
    level: 'info',
    message: 'Task started: Continue writing',
    metadata: { chapterId: 'ch-001' },
  },
  {
    id: 'log-002',
    taskId: 'task-001',
    timestamp: new Date('2026-04-05T10:00:05'),
    level: 'info',
    message: 'Reading chapter content',
    metadata: { filePath: '/chapters/ch001.md' },
  },
  {
    id: 'log-003',
    taskId: 'task-001',
    timestamp: new Date('2026-04-05T10:00:10'),
    level: 'info',
    message: 'Calling Claude API',
    metadata: { model: 'claude-sonnet-4-20250514' },
  },
  {
    id: 'log-004',
    taskId: 'task-001',
    timestamp: new Date('2026-04-05T10:00:40'),
    level: 'info',
    message: 'First token received',
  },
  {
    id: 'log-005',
    taskId: 'task-001',
    timestamp: new Date('2026-04-05T10:00:45'),
    level: 'info',
    message: 'Task completed successfully',
    metadata: { wordCount: 850, duration: 45000 },
  },
  {
    id: 'log-006',
    taskId: 'task-002',
    timestamp: new Date('2026-04-05T11:00:45'),
    level: 'error',
    message: 'Task failed: Model timeout',
    metadata: { timeout: 60000, progress: 45 },
  },
]
```

---

### 1.10 SyncRecord（同步记录）

**定义**：与后端同步的操作记录。

**字段定义**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✓ | 记录唯一标识 |
| `projectId` | string | ✓ | 所属项目 ID |
| `syncType` | enum | ✓ | `chapter` \| `branch` \| `character` \| `asset` \| `full` |
| `status` | enum | ✓ | 见 SyncStatus |
| `contentIds` | string[] | | 同步的内容 ID 列表 |
| `localVersion` | number | | 本地版本号 |
| `remoteVersion` | number | | 远程版本号 |
| `hasConflict` | boolean | | 是否有冲突 |
| `conflictResolution` | enum | | `local` \| `remote` \| `merged`（冲突时） |
| `error` | string | | 错误信息（失败时） |
| `syncDetails` | SyncDetail[] | | 同步详情列表 |
| `syncedAt` | Date | | 同步完成时间 |
| `createdAt` | Date | ✓ | 创建时间 |

**SyncStatus 状态机**：

```typescript
enum SyncStatus {
  Pending = 'pending',       // 待同步
  Syncing = 'syncing',       // 同步中
  Synced = 'synced',         // 已同步
  Conflict = 'conflict',     // 冲突
  Failed = 'failed',         // 同步失败
  Cancelled = 'cancelled',   // 已取消
}
```

**SyncDetail 类型**：

```typescript
interface SyncDetail {
  contentId: string
  contentType: string
  action: 'create' | 'update' | 'delete'
  localChecksum: string
  remoteChecksum: string
  result: 'success' | 'failed' | 'conflict'
  error?: string
}
```

**Mock 示例**：

```typescript
const mockSyncRecords: SyncRecord[] = [
  {
    id: 'sync-001',
    projectId: 'proj-shanhai-001',
    syncType: 'chapter',
    status: SyncStatus.Synced,
    contentIds: ['ch-001'],
    localVersion: 3,
    remoteVersion: 2,
    hasConflict: false,
    syncDetails: [
      {
        contentId: 'ch-001',
        contentType: 'chapter',
        action: 'update',
        localChecksum: 'abc123',
        remoteChecksum: 'abc123',
        result: 'success',
      },
    ],
    syncedAt: new Date('2026-04-06T10:00:00'),
    createdAt: new Date('2026-04-06T09:59:55'),
  },
  {
    id: 'sync-002',
    projectId: 'proj-shanhai-001',
    syncType: 'chapter',
    status: SyncStatus.Conflict,
    contentIds: ['ch-002'],
    localVersion: 2,
    remoteVersion: 3,
    hasConflict: true,
    conflictResolution: undefined,
    syncDetails: [
      {
        contentId: 'ch-002',
        contentType: 'chapter',
        action: 'update',
        localChecksum: 'def456',
        remoteChecksum: 'xyz789',
        result: 'conflict',
      },
    ],
    createdAt: new Date('2026-04-10T11:00:00'),
  },
]
```

---

### 1.11 Quota（配额）

**定义**：用户/项目的 AI 调用配额。

**字段定义**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✓ | 配额唯一标识 |
| `userId` | string | ✓ | 用户 ID |
| `projectId` | string | | 项目 ID（项目级配额） |
| `type` | enum | ✓ | `token` \| `calls` \| `storage` |
| `period` | enum | ✓ | `daily` \| `weekly` \| `monthly` |
| `total` | number | ✓ | 配额总量 |
| `used` | number | ✓ | 已使用量 |
| `remaining` | number | ✓ | 剩余量 |
| `resetAt` | Date | | 重置时间 |
| `taskTypeLimits` | Record<string, number> | | 按任务类型的配额限制 |
| `createdAt` | Date | ✓ | 创建时间 |
| `updatedAt` | Date | ✓ | 更新时间 |

**Mock 示例**：

```typescript
const mockQuota: Quota = {
  id: 'quota-user-001',
  userId: 'user-001',
  type: 'token',
  period: 'monthly',
  total: 1000000,
  used: 450000,
  remaining: 550000,
  resetAt: new Date('2026-05-01'),
  taskTypeLimits: {
    batch_generate: 50,
    consistency_check: 200,
  },
  createdAt: new Date('2026-04-01'),
  updatedAt: new Date('2026-04-15'),
}
```

---

### 1.12 Asset（资产）

**定义**：项目中使用的素材文件。

**字段定义**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✓ | 资产唯一标识 |
| `projectId` | string | ✓ | 所属项目 ID |
| `name` | string | ✓ | 资产名称 |
| `type` | enum | ✓ | `cover` \| `illustration` \| `character_art` \| `beast_art` \| `audio` \| `other` |
| `localPath` | string | | 本地路径 |
| `remoteUrl` | string | | 远程 URL（同步后） |
| `mimeType` | string | | MIME 类型 |
| `size` | number | | 文件大小（字节） |
| `syncStatus` | enum | ✓ | `local` \| `uploading` \| `synced` \| `failed` |
| `relatedContentId` | string | | 关联内容 ID |
| `createdAt` | Date | ✓ | 创建时间 |

**Mock 示例**：

```typescript
const mockAssets: Asset[] = [
  {
    id: 'asset-001',
    projectId: 'proj-shanhai-001',
    name: 'Chapter 1 Cover',
    type: 'cover',
    localPath: '/assets/covers/ch001-cover.png',
    mimeType: 'image/png',
    size: 2048000,
    syncStatus: 'synced',
    remoteUrl: 'https://cdn.example.com/covers/ch001-cover.png',
    relatedContentId: 'ch-001',
    createdAt: new Date('2026-04-05'),
  },
]
```

---

### 1.13 CircleBinding（圈子绑定）

**定义**：项目与圈子的关联。

**字段定义**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✓ | 绑定唯一标识 |
| `projectId` | string | ✓ | 项目 ID |
| `circleId` | string | ✓ | 圈子 ID |
| `circleName` | string | ✓ | 圈子名称 |
| `role` | enum | ✓ | `author` \| `editor` \| `viewer` |
| `syncPermission` | enum | ✓ | `none` \| `draft` \| `pending` \| `published` |
| `boundAt` | Date | ✓ | 绑定时间 |
| `boundBy` | string | | 绑定操作人 |

**Mock 示例**：

```typescript
const mockCircleBinding: CircleBinding = {
  id: 'binding-001',
  projectId: 'proj-shanhai-001',
  circleId: 'circle-cardstory',
  circleName: 'Card Story Studio',
  role: 'author',
  syncPermission: 'published',
  boundAt: new Date('2026-04-01'),
  boundBy: 'admin-001',
}
```

---

## 2. 核心用户流程

### 2.1 创建项目

```
用户操作                    系统响应                    数据变更
─────────────────────────────────────────────────────────────────
1. 点击"新建项目"           
2. 输入项目名称             → 显示表单                  
3. 选择圈子（可选）         → 查询可绑定圈子列表        
4. 选择语言、题材           → 验证输入                  
5. 点击"创建"              → 创建项目记录              
                              → 创建默认沙箱            
                              → 初始化目录结构           
                              → 返回项目详情            
```

**验收点**：
- [ ] 项目创建成功，返回项目 ID
- [ ] 默认沙箱自动创建
- [ ] 文件目录结构正确
- [ ] 项目显示在项目列表

---

### 2.2 创建章节

```
用户操作                    系统响应                    数据变更
─────────────────────────────────────────────────────────────────
1. 在章节树点击"+"         
2. 输入章节标题             → 显示创建表单              
3. 选择章节模板（可选）     
4. 点击"创建"              → 创建章节记录              
                              → 生成 Markdown 文件       
                              → 添加到章节树            
                              → 打开编辑器              
```

**验收点**：
- [ ] 章节创建成功
- [ ] Markdown 文件生成
- [ ] 章节状态为 Draft
- [ ] 章节显示在正确位置

---

### 2.3 AI 续写

```
用户操作                    系统响应                    数据变更
─────────────────────────────────────────────────────────────────
1. 打开章节编辑器           
2. 将光标放在续写位置        
3. 点击"续写"按钮           
4. 选择续写长度             → 创建 AI 任务              
5. 确认                     → 读取章节内容              
                              → 读取角色卡/世界观        
                              → 调用 AI 模型             
                              → 流式返回结果             
                              → 预览续写内容            
6. 确认接受                 → 更新章节内容              
                              → 保存文件                
                              → 更新章节版本            
                              → 记录 AI 日志            
```

**验收点**：
- [ ] 任务状态正确更新（Pending → Running → Completed）
- [ ] 续写内容正确追加
- [ ] 版本号递增
- [ ] AI 日志记录完整
- [ ] Token 使用统计正确

---

### 2.4 创建分支节点

```
用户操作                    系统响应                    数据变更
─────────────────────────────────────────────────────────────────
1. 打开分支剧情视图         
2. 点击"添加节点"           
3. 选择节点类型             → 显示节点类型选择器        
4. 输入节点标题/内容        
5. 点击"保存"               → 创建分支节点              
                              → 分配可视化位置          
                              → 更新分支图              
```

**验收点**：
- [ ] 节点创建成功
- [ ] 节点类型正确
- [ ] 节点显示在分支图中
- [ ] 可以连接节点

---

### 2.5 切换沙箱

```
用户操作                    系统响应                    数据变更
─────────────────────────────────────────────────────────────────
1. 点击沙箱选择器           
2. 选择目标沙箱             → 确认切换提示              
3. 确认                     → 保存当前编辑内容          
                              → 切换文件系统目录        
                              → 加载新沙箱数据          
                              → 更新 UI 状态            
```

**验收点**：
- [ ] 当前编辑内容自动保存
- [ ] 文件系统切换正确
- [ ] 章节/角色数据切换
- [ ] UI 正确反映新沙箱

---

### 2.6 同步发布

```
用户操作                    系统响应                    数据变更
─────────────────────────────────────────────────────────────────
1. 选择待发布章节           
2. 点击"同步"               → 显示同步预览              
3. 检查变更列表             
4. 点击"发布"               → 验证配额余额              
                              → 创建同步任务            
                              → 逐项同步内容            
                              → 处理冲突（如有）        
                              → 更新同步记录            
                              → 更新章节发布状态        
```

**验收点**：
- [ ] 同步任务创建
- [ ] 章节状态更新为 Published
- [ ] 冲突检测和处理
- [ ] 同步日志记录
- [ ] 配额扣减（如适用）

---

## 3. MVP 必做能力（按模块分组）

### P0 - UI 模块

| 能力 | 描述 | 验收标准 |
|---|---|---|
| 项目列表页 | 展示所有项目卡片 | 显示名称、状态、最近活动 |
| 项目详情页 | 展示项目概览和入口 | 显示章节数、角色数、配额 |
| 章节编辑器 | Markdown 实时编辑 | 支持语法高亮、预览、快捷键 |
| 章节树 | 展示章节列表 | 支持拖拽排序、状态标记 |
| 角色卡列表 | 卡片式展示角色 | 支持筛选、搜索 |
| 角色卡编辑 | 角色设定表单 | 支持所有设定字段 |
| 世界观库 | 分类展示设定 | 支持按类型筛选 |
| 分支树视图 | 树状展示分支 | MVP 简化版 |
| AI 面板 | AI 操作入口 | 续写、改写、扩写按钮 |
| 任务状态栏 | 显示当前任务 | 进度、取消按钮 |

### P0 - 本地数据模块

| 能力 | 描述 | 验收标准 |
|---|---|---|
| 项目 CRUD | 创建/读取/更新/删除项目 | SQLite 持久化 |
| 章节 CRUD | 创建/读取/更新/删除章节 | Markdown 文件 + 数据库 |
| 角色 CRUD | 创建/读取/更新/删除角色 | JSON 文件 + 数据库 |
| 世界观 CRUD | 创建/读取/更新/删除设定 | JSON 文件 + 数据库 |
| 版本历史 | 记录章节修改历史 | 支持版本对比 |
| 备份恢复 | 项目导出/导入 | ZIP 压缩包格式 |

### P0 - 沙箱模块

| 能力 | 描述 | 验收标准 |
|---|---|---|
| 沙箱列表 | 展示项目下所有沙箱 | 显示名称、类型、状态 |
| 创建沙箱 | 从主线复制/从模板 | 目录复制或 worktree |
| 切换沙箱 | 切换当前工作沙箱 | 自动保存当前编辑 |
| 归档沙箱 | 标记沙箱为只读 | 状态变更，保留数据 |
| 删除沙箱 | 删除沙箱（需确认） | 二次确认后删除 |

### P0 - 分支剧情模块

| 能力 | 描述 | 验收标准 |
|---|---|---|
| 创建节点 | 新增分支节点 | 支持选择节点类型 |
| 连接节点 | 创建节点间边 | 选择源节点和目标节点 |
| 编辑节点 | 修改节点内容 | 支持所有类型 |
| 删除节点 | 删除节点和连接 | 级联删除相关边 |
| 节点属性 | 设置选项/条件 | 选项文案、触发条件 |
| 树状视图 | 可视化分支结构 | MVP 简化版 |

### P0 - Agent 模块

| 能力 | 描述 | 验收标准 |
|---|---|---|
| AI 续写 | 基于上下文续写 | 支持长度选择 |
| AI 改写 | 按要求改写 | 支持风格/语气/长度 |
| AI 扩写 | 大纲扩写为章节 | 支持字数目标 |
| AI 摘要 | 生成章节摘要 | 自动提取关键信息 |
| 任务管理 | 任务列表/取消/重试 | 显示状态、进度、结果 |
| 日志记录 | AI 调用详细日志 | 记录请求/响应/成本 |

### P0 - 同步模块

| 能力 | 描述 | 验收标准 |
|---|---|---|
| 登录认证 | 账号登录 | 复用主产品认证 |
| 圈子绑定 | 绑定项目到圈子 | 支持切换圈子 |
| 章节同步 | 同步章节到后端 | 支持冲突检测 |
| 分支同步 | 同步分支结构 | 节点 ID 映射 |
| 资产上传 | 上传图片等素材 | 格式验证、大小限制 |
| 配额查询 | 显示当前配额 | 余额、使用趋势 |

### P0 - 测试模块

| 能力 | 描述 | 验收标准 |
|---|---|---|
| 单元测试 | 工具函数测试 | Vitest 框架 |
| 组件测试 | UI 组件测试 | Playwright Component |
| E2E 测试 | 关键路径测试 | Playwright E2E |
| Mock Provider | 模拟 AI 响应 | 快速验证 UI |

### P0 - Mock 数据

| 能力 | 描述 | 验收标准 |
|---|---|---|
| 场景 1 | empty-project | 空项目创建流程 |
| 场景 2 | shanhai-demo | 演示项目（山海关怀节） |
| 场景 3 | ten-chapter-project | 10 章完整项目 |
| 场景 4 | thirty-card-project | 30 张角色卡项目 |
| 场景 5 | branch-heavy-project | 多分支项目 |
| 场景 6 | multi-sandbox-project | 多沙箱项目 |
| 场景 7 | ai-task-failed | AI 任务失败场景 |
| 场景 8 | sync-conflict | 同步冲突场景 |
| 场景 9 | quota-exceeded | 配额超限场景 |
| 场景 10 | published-readonly | 已发布只读场景 |

---

## 4. Mock 场景清单

### 4.1 empty-project

**场景目的**：验证空项目创建流程

**需要的数据对象**：

```typescript
const emptyProjectScenario = {
  project: {
    id: 'proj-empty-001',
    name: 'My First Novel',
    status: 'active',
    language: 'en',
    sandboxes: [
      {
        id: 'sandbox-main-001',
        name: '主线',
        type: 'main',
        isDefault: true,
        status: 'active',
      },
    ],
    chapters: [],
    characters: [],
    worldSettings: [],
    branchNodes: [],
  },
}
```

**UI 应展示的状态**：
- 项目创建成功提示
- 空白的章节列表（带"创建第一章"引导）
- 空白的角色列表
- 空白的分支图

**需要覆盖的测试点**：

| 测试 ID | 测试描述 | 预期结果 |
|---|---|---|
| T-EMP-001 | 创建空项目 | 项目创建成功 |
| T-EMP-002 | 项目列表显示新项目 | 列表包含新项目 |
| T-EMP-003 | 创建第一章 | 章节创建成功 |
| T-EMP-004 | 无章节时显示引导 | 引导文案正确显示 |

---

### 4.2 shanhai-demo

**场景目的**：演示项目的标准结构

**需要的数据对象**：

```typescript
const shanhaiDemoScenario = {
  project: {
    id: 'proj-shanhai-001',
    name: '山海关·异兽录',
    description: '基于山海关传说的奇幻异兽故事',
    language: 'en',
    genre: 'fantasy',
    sandboxes: [
      {
        id: 'sandbox-main-001',
        name: '主线',
        type: 'main',
        chapters: [
          { id: 'ch-001', title: 'Chapter 1: The Gate Opens', status: 'published', order: 1 },
          { id: 'ch-002', title: 'Chapter 2: First Encounter', status: 'approved', order: 2 },
          { id: 'ch-003', title: 'Chapter 3: The Choice', status: 'draft', order: 3 },
        ],
        characters: [
          { id: 'char-001', name: 'Lin Feng', type: 'protagonist' },
          { id: 'char-002', name: 'Mei Ling', type: 'friend' },
          { id: 'char-003', name: 'Shadow Master', type: 'antagonist' },
        ],
        worldSettings: [
          { id: 'world-001', category: 'location', name: 'Shanhaiguan Pass' },
          { id: 'world-002', category: 'creature', name: 'Flame Phoenix' },
        ],
        branchNodes: [
          { id: 'node-001', type: 'chapter', title: 'Gate Discovery', chapterId: 'ch-001' },
          { id: 'node-002', type: 'choice', title: 'First Choice' },
          { id: 'node-003', type: 'ending', title: 'Bad Ending' },
          { id: 'node-004', type: 'ending', title: 'Good Ending' },
        ],
        branchEdges: [
          { id: 'edge-001', source: 'node-001', target: 'node-002' },
          { id: 'edge-002', source: 'node-002', target: 'node-003', label: 'Enter alone' },
          { id: 'edge-003', source: 'node-002', target: 'node-004', label: 'Wait for backup' },
        ],
      },
    ],
    assets: [
      { id: 'asset-001', type: 'cover', name: 'Main Cover', syncStatus: 'synced' },
    ],
    syncStatus: { latestSyncAt: '2026-04-10', hasPendingChanges: false },
  },
}
```

**UI 应展示的状态**：
- 项目详情页显示 3 章、3 角色、2 世界设定
- 分支图显示 4 节点、3 边
- 已同步状态

**需要覆盖的测试点**：

| 测试 ID | 测试描述 | 预期结果 |
|---|---|---|
| T-SHAN-001 | 加载演示项目 | 数据完整加载 |
| T-SHAN-002 | 章节列表显示 3 章 | 排序正确、状态正确 |
| T-SHAN-003 | 角色卡片显示 3 个 | 角色信息完整 |
| T-SHAN-004 | 分支图正确渲染 | 4 节点、3 边 |
| T-SHAN-005 | 同步状态显示 | "已同步"正确显示 |

---

### 4.3 ten-chapter-project

**场景目的**：验证大章节量项目的性能和管理

**需要的数据对象**：

```typescript
const tenChapterScenario = {
  project: {
    id: 'proj-ten-ch-001',
    name: 'Ten Chapter Epic',
    chapters: Array.from({ length: 10 }, (_, i) => ({
      id: `ch-${String(i + 1).padStart(3, '0')}`,
      title: `Chapter ${i + 1}: ${['Opening', 'Conflict', 'Rising', 'Climax', 'Resolution', 'New Dawn', 'Betrayal', 'Recovery', 'Finale', 'Epilogue'][i]}`,
      status: i < 3 ? 'published' : i < 7 ? 'approved' : 'draft',
      order: i + 1,
      wordCount: 2000 + Math.floor(Math.random() * 1000),
    })),
  },
}
```

**UI 应展示的状态**：
- 章节列表正确分页或虚拟滚动
- 状态筛选工作正常
- 批量操作可用

**需要覆盖的测试点**：

| 测试 ID | 测试描述 | 预期结果 |
|---|---|---|
| T-10CH-001 | 加载 10 章项目 | 首屏加载 < 2s |
| T-10CH-002 | 章节滚动性能 | 无明显卡顿 |
| T-10CH-003 | 按状态筛选 | 筛选结果正确 |
| T-10CH-004 | 章节拖拽排序 | 排序更新正确 |

---

### 4.4 thirty-card-project

**场景目的**：验证大量角色卡的管理

**需要的数据对象**：

```typescript
const thirtyCardScenario = {
  project: {
    id: 'proj-thirty-001',
    name: 'Card Collection Project',
    characters: Array.from({ length: 30 }, (_, i) => ({
      id: `char-${String(i + 1).padStart(3, '0')}`,
      name: `Character ${i + 1}`,
      type: ['protagonist', 'supporting', 'antagonist', 'creature'][i % 4],
      cardContent: `**Character ${i + 1}** - Card description text...`,
      status: 'active',
    })),
  },
}
```

**UI 应展示的状态**：
- 角色卡片网格布局
- 类型筛选可用
- 搜索功能正常

**需要覆盖的测试点**：

| 测试 ID | 测试描述 | 预期结果 |
|---|---|---|
| T-30CD-001 | 加载 30 张角色卡 | 卡片正确渲染 |
| T-30CD-002 | 按类型筛选 | 筛选正确 |
| T-30CD-003 | 搜索角色名 | 搜索正确 |
| T-30CD-004 | 分页或虚拟滚动 | 性能良好 |

---

### 4.5 branch-heavy-project

**场景目的**：验证复杂分支结构

**需要的数据对象**：

```typescript
const branchHeavyScenario = {
  project: {
    id: 'proj-branch-001',
    name: 'Branching Epic',
    branchNodes: [
      // 章节节点
      { id: 'n-ch1', type: 'chapter', title: 'Start' },
      { id: 'n-ch2a', type: 'chapter', title: 'Path A - Combat' },
      { id: 'n-ch2b', type: 'chapter', title: 'Path B - Diplomacy' },
      { id: 'n-ch3', type: 'chapter', title: 'Junction' },
      // 选择节点
      { id: 'n-choice1', type: 'choice', title: 'First Decision' },
      { id: 'n-choice2', type: 'choice', title: 'Second Decision' },
      // 结局
      { id: 'n-end1', type: 'ending', title: 'Peace Ending' },
      { id: 'n-end2', type: 'ending', title: 'War Ending' },
      { id: 'n-end3', type: 'ending', title: 'Secret Ending' },
    ],
    branchEdges: [
      { source: 'n-ch1', target: 'n-choice1' },
      { source: 'n-choice1', target: 'n-ch2a', label: 'Fight' },
      { source: 'n-choice1', target: 'n-ch2b', label: 'Negotiate' },
      { source: 'n-ch2a', target: 'n-choice2' },
      { source: 'n-ch2b', target: 'n-choice2' },
      { source: 'n-choice2', target: 'n-end1', label: 'Peace' },
      { source: 'n-choice2', target: 'n-end2', label: 'War' },
      { source: 'n-ch2a', target: 'n-end3', label: 'Secret (hidden)' },
    ],
  },
}
```

**UI 应展示的状态**：
- 分支图清晰展示 DAG 结构
- 结局数量正确（3 个）
- 路径可追溯

**需要覆盖的测试点**：

| 测试 ID | 测试描述 | 预期结果 |
|---|---|---|
| T-BRAN-001 | 分支图渲染正确 | 9 节点、8 边 |
| T-BRAN-002 | 结局数量正确 | 显示 3 个结局 |
| T-BRAN-003 | 路径高亮 | 选择路径正确高亮 |
| T-BRAN-004 | 添加新分支 | 分支添加成功 |

---

### 4.6 multi-sandbox-project

**场景目的**：验证多沙箱隔离

**需要的数据对象**：

```typescript
const multiSandboxScenario = {
  project: {
    id: 'proj-multi-sb-001',
    name: 'Multi-Sandbox Novel',
    sandboxes: [
      {
        id: 'sb-main',
        name: '主线',
        type: 'main',
        status: 'active',
        isDefault: true,
        chapters: [
          { id: 'ch-001', title: 'Chapter 1 - Published', status: 'published' },
        ],
      },
      {
        id: 'sb-exp-alternative',
        name: '实验·平行结局',
        type: 'experiment',
        status: 'active',
        chapters: [
          { id: 'ch-001-exp', title: 'Chapter 1 - Alternative', status: 'draft' },
          { id: 'ch-002-exp', title: 'Chapter 2 - What If', status: 'draft' },
        ],
      },
      {
        id: 'sb-rewrite',
        name: '重写·第一章',
        type: 'rewrite',
        status: 'archived',
        chapters: [
          { id: 'ch-001-rw', title: 'Chapter 1 - Rewritten', status: 'editing' },
        ],
      },
    ],
  },
}
```

**UI 应展示的状态**：
- 沙箱选择器显示 3 个沙箱
- 当前沙箱高亮
- 已归档沙箱显示但禁用切换

**需要覆盖的测试点**：

| 测试 ID | 测试描述 | 预期结果 |
|---|---|---|
| T-SB-001 | 沙箱列表显示 3 个 | 名称、类型、状态正确 |
| T-SB-002 | 切换到实验沙箱 | 章节列表更新 |
| T-SB-003 | 切换时自动保存 | 当前编辑保存 |
| T-SB-004 | 归档沙箱不可切换 | 提示正确 |

---

### 4.7 ai-task-failed

**场景目的**：验证 AI 任务失败处理

**需要的数据对象**：

```typescript
const aiTaskFailedScenario = {
  project: {
    id: 'proj-ai-fail-001',
    aiTasks: [
      {
        id: 'task-failed-001',
        type: 'rewrite',
        status: 'failed',
        error: 'Model timeout after 60s',
        progress: 45,
        progressMessage: 'Generating middle section...',
        chapterId: 'ch-001',
        startedAt: new Date('2026-04-15T10:00:00'),
      },
    ],
    chapters: [
      {
        id: 'ch-001',
        status: 'editing', // 任务失败时状态
      },
    ],
  },
}
```

**UI 应展示的状态**：
- 任务状态显示"失败"
- 错误信息清晰展示
- 重试按钮可用
- 章节状态保持 Editing

**需要覆盖的测试点**：

| 测试 ID | 测试描述 | 预期结果 |
|---|---|---|
| T-AIF-001 | 失败任务显示红色 | 状态正确高亮 |
| T-AIF-002 | 错误信息显示 | 超时信息正确 |
| T-AIF-003 | 重试按钮工作 | 任务重新开始 |
| T-AIF-004 | 章节状态正确 | 保持 Editing |

---

### 4.8 sync-conflict

**场景目的**：验证同步冲突处理

**需要的数据对象**：

```typescript
const syncConflictScenario = {
  project: {
    id: 'proj-conflict-001',
    chapters: [
      {
        id: 'ch-001',
        title: 'Chapter with Conflict',
        version: 3, // 本地版本
        // 远程版本为 4，由其他设备修改
      },
    ],
    syncRecords: [
      {
        id: 'sync-conflict-001',
        status: 'conflict',
        contentIds: ['ch-001'],
        localVersion: 3,
        remoteVersion: 4,
        hasConflict: true,
        syncDetails: [
          {
            contentId: 'ch-001',
            result: 'conflict',
            localChecksum: 'abc123',
            remoteChecksum: 'xyz789',
          },
        ],
      },
    ],
  },
}
```

**UI 应展示的状态**：
- 冲突警告提示
- 双版本对比视图
- 解决冲突选项

**需要覆盖的测试点**：

| 测试 ID | 测试描述 | 预期结果 |
|---|---|---|
| T-CON-001 | 冲突提示显示 | 警告正确显示 |
| T-CON-002 | 版本对比可用 | Diff 视图正确 |
| T-CON-003 | 保留本地版本 | 覆盖成功 |
| T-CON-004 | 接受远程版本 | 同步成功 |

---

### 4.9 quota-exceeded

**场景目的**：验证配额超限处理

**需要的数据对象**：

```typescript
const quotaExceededScenario = {
  user: {
    id: 'user-001',
    quotas: [
      {
        id: 'quota-monthly',
        type: 'token',
        period: 'monthly',
        total: 1000000,
        used: 1000000,
        remaining: 0,
        resetAt: new Date('2026-05-01'),
      },
    ],
  },
}
```

**UI 应展示的状态**：
- 配额显示为 0/1000000
- 红色警告提示
- AI 操作按钮禁用

**需要覆盖的测试点**：

| 测试 ID | 测试描述 | 预期结果 |
|---|---|---|
| T-QUO-001 | 配额显示 0 | 剩余量正确 |
| T-QUO-002 | 红色警告显示 | 警告正确 |
| T-QUO-003 | AI 按钮禁用 | 无法点击 |
| T-QUO-004 | 提示升级配额 | 引导文案正确 |

---

### 4.10 published-readonly

**场景目的**：验证已发布内容的只读保护

**需要的数据对象**：

```typescript
const publishedReadonlyScenario = {
  project: {
    id: 'proj-readonly-001',
    chapters: [
      {
        id: 'ch-001',
        title: 'Published Chapter',
        status: 'published',
        publishedAt: new Date('2026-04-10'),
      },
      {
        id: 'ch-002',
        title: 'Draft Chapter',
        status: 'draft',
      },
    ],
  },
}
```

**UI 应展示的状态**：
- 已发布章节显示锁定图标
- 编辑器禁用或只读模式
- 提示"需要创建新版本才能编辑"

**需要覆盖的测试点**：

| 测试 ID | 测试描述 | 预期结果 |
|---|---|---|
| T-RO-001 | 锁定图标显示 | 图标正确 |
| T-RO-002 | 编辑器禁用 | 无法输入 |
| T-RO-003 | 新建版本可用 | 版本创建成功 |
| T-RO-004 | 未发布章节正常 | Draft 可编辑 |

---

## 5. 状态机定义

### 5.1 ChapterStatus

```typescript
enum ChapterStatus {
  Draft = 'draft',           // 草稿
  Editing = 'editing',       // AI 修改中
  PendingReview = 'pending_review',  // 待审核
  Approved = 'approved',      // 已审核
  Published = 'published',   // 已发布
  Archived = 'archived',      // 已归档
}

// 状态转换规则
const chapterStatusTransitions = {
  draft: ['editing', 'pending_review', 'archived'],
  editing: ['draft', 'pending_review'],
  pending_review: ['approved', 'draft'],
  approved: ['published', 'pending_review'],
  published: ['archived'],
  archived: [],
}
```

### 5.2 AITaskStatus

```typescript
enum AITaskStatus {
  Pending = 'pending',           // 等待中
  Running = 'running',           // 执行中
  Completed = 'completed',       // 成功
  Failed = 'failed',             // 失败
  Cancelled = 'cancelled',       // 取消
  NeedsConfirmation = 'needs_confirmation',  // 需确认
}

// 状态转换规则
const taskStatusTransitions = {
  pending: ['running', 'cancelled'],
  running: ['completed', 'failed', 'cancelled', 'needs_confirmation'],
  completed: [],
  failed: ['running'], // 可重试
  cancelled: [],
  needs_confirmation: ['running', 'cancelled'],
}
```

### 5.3 SyncStatus

```typescript
enum SyncStatus {
  Pending = 'pending',       // 待同步
  Syncing = 'syncing',       // 同步中
  Synced = 'synced',         // 已同步
  Conflict = 'conflict',       // 冲突
  Failed = 'failed',          // 失败
  Cancelled = 'cancelled',    // 取消
}

// 状态转换规则
const syncStatusTransitions = {
  pending: ['syncing', 'cancelled'],
  syncing: ['synced', 'conflict', 'failed'],
  synced: ['pending'], // 再次编辑后
  conflict: ['pending', 'syncing'], // 解决后重新同步
  failed: ['pending', 'syncing'], // 可重试
  cancelled: [],
}
```

### 5.4 SandboxStatus

```typescript
enum SandboxStatus {
  Active = 'active',     // 活跃
  Archived = 'archived', // 归档
  Deleted = 'deleted',   // 已删除
}

// 状态转换规则
const sandboxStatusTransitions = {
  active: ['archived', 'deleted'],
  archived: ['active', 'deleted'],
  deleted: [], // 不可逆
}
```

### 5.5 BranchNodeType

```typescript
enum BranchNodeType {
  Chapter = 'chapter',   // 章节节点
  Choice = 'choice',    // 选择节点
  Question = 'question', // 问答节点
  Hidden = 'hidden',     // 隐藏节点
  Junction = 'junction', // 汇合节点
  Ending = 'ending',    // 结局节点
}

// 有效出边类型
const validOutEdgeTypes: Record<BranchNodeType, BranchNodeType[]> = {
  chapter: ['choice', 'junction', 'ending'],
  choice: ['chapter', 'choice', 'junction', 'ending'],
  question: ['chapter', 'junction'],
  hidden: ['chapter', 'hidden', 'junction'],
  junction: ['choice', 'chapter'],
  ending: [], // 结局无出边
}
```

### 5.6 ReviewStatus

```typescript
enum ReviewStatus {
  NotSubmitted = 'not_submitted',  // 未提交
  Pending = 'pending',             // 待审核
  Approved = 'approved',           // 通过
  Rejected = 'rejected',           // 拒绝
  RevisionNeeded = 'revision_needed', // 需修改
}

// 状态转换规则
const reviewStatusTransitions = {
  not_submitted: ['pending'],
  pending: ['approved', 'rejected', 'revision_needed'],
  approved: ['pending'], // 重新提交
  rejected: ['pending', 'revision_needed'],
  revision_needed: ['pending'],
}
```

---

## 6. 验收标准提取

### 6.1 第 2 周：假数据真流程演示

**验收内容**：
- [ ] 使用 Mock 数据跑通创建项目流程
- [ ] 使用 Mock 数据跑通创建章节流程
- [ ] 使用 Mock 数据跑通 AI 续写流程
- [ ] Mock Provider 返回预设响应
- [ ] UI 正确渲染 Mock 数据

**验收标准**：
- 演示流程无报错
- UI 状态正确更新
- Mock 响应符合预期

### 6.2 第 4 周：本地真实数据替换

**验收内容**：
- [ ] SQLite 数据库正常读写
- [ ] Markdown 文件正确创建/读取/更新
- [ ] JSON 文件（角色/世界观）正确处理
- [ ] 版本历史记录正确
- [ ] 数据持久化验证

**验收标准**：
- 重启应用后数据保持
- 文件系统操作无错误
- 数据一致性验证通过

### 6.3 第 6 周：真实 Agent 接入

**验收内容**：
- [ ] Claude Code Agent 正常调用
- [ ] 工具白名单生效
- [ ] 权限检查正确
- [ ] AI 响应正确写入文件
- [ ] Token 使用统计正确
- [ ] 沙箱隔离验证

**验收标准**：
- Agent 调用成功
- 沙箱外文件无法访问
- 日志记录完整

### 6.4 第 8 周：同步发布

**验收内容**：
- [ ] 登录认证成功
- [ ] 圈子绑定功能
- [ ] 章节同步到后端
- [ ] 分支同步正确
- [ ] 冲突检测和处理
- [ ] 配额查询和限制

**验收标准**：
- 同步成功率 > 95%
- 冲突提示正确
- 配额扣减准确

### 6.5 第 10 周：Alpha 验收

**验收内容**：
- [ ] 功能验收清单全通过
- [ ] 性能指标达标
- [ ] 稳定性无崩溃
- [ ] 内容产出验证
- [ ] 同步到主产品验证

**验收标准**：

| 类别 | 指标 | 目标值 |
|---|---|---|
| 启动速度 | 冷启动时间 | < 5s |
| AI 响应 | 首 token 时间 | < 3s |
| 保存速度 | 章节保存时间 | < 500ms |
| 稳定性 | 连续使用 | 2 周无崩溃 |
| 内容产出 | 英文章节 | ≥ 10 章 |
| 内容产出 | 异兽卡牌文案 | ≥ 30 张 |
| 内容产出 | 分支节点 | ≥ 20 个 |
| 同步 | 成功进入主产品 | 是 |

---

## 附录：Mock 数据文件结构

```
caiode/src/novel/provider/mock/
├── fixtures/
│   ├── empty-project.json
│   ├── shanhai-demo.json
│   ├── ten-chapter-project.json
│   ├── thirty-card-project.json
│   ├── branch-heavy-project.json
│   ├── multi-sandbox-project.json
│   ├── ai-task-failed.json
│   ├── sync-conflict.json
│   ├── quota-exceeded.json
│   └── published-readonly.json
├── mock-provider.ts
└── index.ts
```

**文件命名规范**：`{scenario-name}.json`

**文件内容格式**：
```typescript
{
  "scenario": "shanhai-demo",
  "description": "演示项目：山海关怀节",
  "data": {
    "project": { ... },
    "sandboxes": [ ... ],
    "chapters": [ ... ],
    "characters": [ ... ],
    "worldSettings": [ ... ],
    "branchNodes": [ ... ],
    "branchEdges": [ ... ],
    "aiTasks": [ ... ],
    "syncRecords": [ ... ],
    "quota": { ... }
  }
}
```

---

**文档版本**：v1.0  
**创建时间**：2026-05-02  
**最后更新**：2026-05-02

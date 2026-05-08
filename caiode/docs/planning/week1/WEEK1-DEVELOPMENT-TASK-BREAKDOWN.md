# Week 1 开发任务拆解：Mock 接入阶段

> **文档版本**: v1.0
> **创建日期**: 2026-05-08
> **前置条件**: ✅ Stitch V1.1 原型已通过验收 (92% A- 级)
> **评审来源**: TabAI 评审意见 + V1.1 原型评审报告
> **状态**: [READY_FOR_ARCHITECT_REVIEW]
> **关联文档**:
> - [WEEK1-MVP-PRODUCT-PROTOTYPE-CHECKLIST.md](WEEK1-MVP-PRODUCT-PROTOTYPE-CHECKLIST.md) - MVP 产品原型清单
> - [WEEK1-STITCH-MVP-PROTOTYPE-PROMPTS.md](WEEK1-STITCH-MVP-PROTOTYPE-PROMPTS.md) - Stitch 原型提示词 (v1.1)
> - [WEEK1-MOCK-INTEGRATION-TASKS.md](../WEEK1-MOCK-INTEGRATION-TASKS.md) - Mock 接入任务总览

---

## 一、原型验收结论

### V1.1 原型评审结果

```
┌─────────────────────────────────────────────────────────┐
│   ★★★★★  MVP MOCK 原型验收: 通过                      │
│   得分: 92/100 (A- 级)                                 │
│   验收标准: 8/10 通过 + 2/10 待编码验证                  │
│   v1.1 修正项: 9/11 完全落实                            │
│   阻塞项: 无                                            │
│   结论: 可进入技术开发阶段                               │
└─────────────────────────────────────────────────────────┘
```

### 原型已验证的关键设计决策

| # | 设计决策 | 原型验证结果 | 对开发的影响 |
|:-:|---------|:----------:|-----------|
| 1 | **三栏式编辑器布局** | ✅ 左侧章节列表 + 中央编辑区 + 右侧面板 | 直接决定 Workspace/Page 的 DOM 结构 |
| 2 | **底部固定 AI 工具栏** | ✅ 横条式工具栏，4 个任务按钮 | 决定 AITaskPanel 的组件形态 |
| 3 | **角色卡片信息架构** | ✅ 7 属性：姓名/身份/性格/口吻/目标/秘密/关系 | 决定 Character 类型的字段定义 |
| 4 | **章节大纲默认展开** | ✅ 3 要点：目标/冲突/关键剧情 | 决定 Chapter.outline 的数据结构 |
| 5 | **7 种 AI 任务状态** | ✅ pending/running/success/failed/cancelled/denied/quota | 决定 AITaskStatus 枚举值 |
| 6 | **Mock Mode 视觉标识** | ✅ 琥珀渐变大徽章 + 底部声明 | 决定全局 Mock 状态管理方案 |
| 7 | **AI 结果卡片三操作** | ✅ 采纳(主钮)/存为灵感(次钮)/忽略(文字) | 决定 AIResult 的交互状态机 |
| 8 | **AI 任务日志抽屉** | ✅ 右侧滑出，7 状态全覆盖 | 决定 AILogDrawer 的数据源设计 |

---

## 二、开发阶段总览

### 阶段划分（5 个阶段，14 个任务）

```
Day 1 (0.5h)  ┌─ 阶段 1: 基础设施准备 ───────────────────────────┐
              │ TASK-DEV-001 创建功能分支                          │
              │ TASK-DEV-002 创建项目目录结构                       │
              └───────────────────────────────────────────────────┘

Day 1-2 (4h)  ┌─ 阶段 2: 类型定义与 Mock 数据 ───────────────────┐
              │ TASK-DEV-003 定义业务对象类型 (6个)                │
              │ TASK-DEV-004 创建 Mock 数据集                       │
              │ TASK-DEV-005 定义 Provider 接口契约                 │
              └───────────────────────────────────────────────────┘

Day 2-3 (6h)  ┌─ 阶段 3: Provider 实现 ──────────────────────────┐
              │ TASK-DEV-006 实现 NovelProjectProvider             │
              │ TASK-DEV-007 实现 NovelChapterProvider             │
              │ TASK-DEV-008 实现 NovelCharacterProvider           │
              │ TASK-DEV-009 实现 FakeAgentProvider (核心)          │
              │ TASK-DEV-010 实现 AILog 记录系统                    │
              └───────────────────────────────────────────────────┘

Day 3-4 (6h)  ┌─ 阶段 4: UI 接入与展示 ──────────────────────────┐
              │ TASK-DEV-011 接入 opencode Workspace 页面           │
              │ TASK-DEV-012 实现章节编辑器组件                     │
              │ TASK-DEV-013 实现 AI 任务面板与结果展示             │
              │ TASK-DEV-014 实现 AI 日志抽屉                       │
              └───────────────────────────────────────────────────┘

Day 5 (4h)    ┌─ 阶段 5: 测试与验证 ─────────────────────────────┐
              │ TASK-DEV-015 编写单元测试 (Provider + FakeAgent)   │
              │ TASK-DEV-016 执行构建验证 (typecheck + build)      │
              │ TASK-DEV-017 权限边界检查                           │
              │ TASK-DEV-018 生成 Week 1 完成报告                   │
              └───────────────────────────────────────────────────┘
```

### 时间估算汇总

| 阶段 | 预估时间 | 累计时间 | 风险缓冲 |
|------|:-------:|:-------:|:-------:|
| 阶段 1: 基础设施 | 0.5h | 0.5h | 低 |
| 阶段 2: 类型与数据 | 4h | 4.5h | 中 |
| 阶段 3: Provider 实现 | 6h | 10.5h | **高** |
| 阶段 4: UI 接入 | 6h | 16.5h | **高** |
| 阶段 5: 测试验证 | 4h | 20.5h | 中 |
| **总计** | **~21h** | — | **建议 3-4 个工作日** |

---

## 三、详细任务拆解

### 阶段 1: 基础设施准备 (Day 1, 0.5h)

---

#### TASK-DEV-001: 创建功能分支

**任务 ID**: TASK-DEV-001
**优先级**: P0 (阻塞性)
**预估耗时**: 0.1h (5 分钟)
**前置条件**: 本地代码已同步到 origin/main

**执行命令**:
```bash
git checkout -b feat/week1-mock-provider-novel-editor
git push -u origin feat/week1-mock-provider-novel-editor
```

**交付物**:
- 功能分支 `feat/week1-mock-provider-novel-editor` 已创建
- 远程跟踪分支已设置

**验证方式**:
```bash
git branch --show-current
# 输出: feat/week1-mock-provider-novel-editor
```

**阻塞影响**: 所有后续任务依赖此分支，必须在任何代码编写前完成。

---

#### TASK-DEV-002: 创建项目目录结构

**任务 ID**: TASK-DEV-002
**优先级**: P0 (阻塞性)
**预估耗时**: 0.4h (20 分钟)
**前置条件**: TASK-DEV-001 完成

**目录结构**:
```
caiode/
├── src/
│   ├── types/              # 业务类型定义 (TASK-DEV-003)
│   │   ├── project.ts
│   │   ├── chapter.ts
│   │   ├── character.ts
│   │   ├── ai-task.ts
│   │   ├── ai-log.ts
│   │   └── sandbox.ts
│   ├── providers/          # Provider 实现 (TASK-DEV-006~010)
│   │   ├── novel-project.ts
│   │   ├── novel-chapter.ts
│   │   ├── novel-character.ts
│   │   ├── fake-agent.ts
│   │   ├── ai-log.ts
│   │   └── index.ts
│   ├── mock-data/          # Mock 数据 (TASK-DEV-004)
│   │   ├── projects.ts
│   │   ├── chapters.ts
│   │   ├── characters.ts
│   │   └── index.ts
│   ├── components/         # UI 组件 (TASK-DEV-012~014)
│   │   ├── novel-editor/
│   │   │   ├── index.tsx
│   │   │   ├── chapter-list.tsx
│   │   │   ├── chapter-editor.tsx
│   │   │   ├── outline-panel.tsx
│   │   │   ├── character-panel.tsx
│   │   │   ├── ai-task-panel.tsx
│   │   │   ├── ai-result-card.tsx
│   │   │   └── ai-log-drawer.tsx
│   │   └── mock-mode-banner.tsx
│   ├── hooks/              # React Hooks
│   │   ├── use-novel-project.ts
│   │   ├── use-ai-task.ts
│   │   └── use-ai-log.ts
│   └── utils/              # 工具函数
│       └── mock-delay.ts
├── tests/                  # 单元测试 (TASK-DEV-015)
│   ├── providers/
│   │   ├── novel-project.test.ts
│   │   ├── novel-chapter.test.ts
│   │   ├── novel-character.test.ts
│   │   └── fake-agent.test.ts
│   └── utils/
│       └── mock-delay.test.ts
└── docs/
    └── week1/             # 文档已存在
```

**交付物**:
- 所有目录已创建（空目录或含 .gitkeep）
- 目录结构与原型设计对齐

**约束**:
- ❌ 不修改 `opencode-1.4.0/` 上游核心源码
- ✅ 仅在 `caiode/` 自有目录下创建文件

---

### 阶段 2: 类型定义与 Mock 数据 (Day 1-2, 4h)

---

#### TASK-DEV-003: 定义业务对象类型 (6个)

**任务 ID**: TASK-DEV-003
**优先级**: P0 (阻塞性)
**预估耗时**: 1.5h
**前置条件**: TASK-DEV-002 完成

**文件**: `caiode/src/types/*.ts`

**类型定义清单**:

| # | 类型文件 | 定义内容 | 原型对应 |
|:-:|---------|---------|---------|
| 1 | `project.ts` | `Project` 接口 | 顶部项目信息栏 |
| 2 | `chapter.ts` | `Chapter` 接口 + `ChapterStatus` 枚举 | 左侧章节列表 + 中央编辑区 |
| 3 | `character.ts` | `Character` 接口 + `CharacterRelationship` | 右侧角色卡面板 |
| 4 | `sandbox.ts` | `Sandbox` 接口 | 右侧世界观词条 |
| 5 | `ai-task.ts` | `AITask` 接口 + `AITaskStatus` 枚举 + `AITaskType` 枚举 | AI 任务面板 + 日志 |
| 6 | `ai-log.ts` | `AILog` 接口 | AI 日志抽屉 |

**关键类型定义 (基于原型验证)**:

```typescript
// types/ai-task.ts
export type AITaskStatus = 
  | 'pending'      // ⏳ 等待中
  | 'running'      // 🔄 运行中
  | 'success'      // ✅ 成功
  | 'failed'       // ❌ 失败
  | 'cancelled'    // 🚫 已取消
  | 'denied'       // ⛔ 权限拒绝 (原型中显示为 denied)
  | 'quota';       // 💳 配额不足

export type AITaskType = 
  | 'continue-writing'   // ✏️ AI 续写
  | 'rewrite-selection'  // 🔄 重写选段
  | 'summarize-chapter'  // 📝 章节摘要
  | 'character-voice';   // 🎭 角色语气改写

export interface AITask {
  id: string;
  type: AITaskType;
  chapterId: string;
  status: AITaskStatus;
  input: {
    text: string;           // 输入文本
    selectedText?: string;  // 选中的文本（改写用）
    characterId?: string;   // 目标角色 ID（语气改写用）
  };
  output?: {
    text: string;           // 生成的文本
    wordCount: number;      // 生成字数
  };
  error?: string;           // 错误信息
  duration?: number;        // 耗时(ms)
  createdAt: Date;
  completedAt?: Date;
}
```

```typescript
// types/character.ts
export interface Character {
  id: string;
  projectId: string;
  name: string;
  role: string;                    // 身份: "核心主角 · 写作者"
  personalityTags: string[];       // 性格标签: ["冷静疏离", "内心藏有秘密"]
  speakingStyle: string;           // 口吻: "言简意赅，常用反问句。"
  goal: string;                    // 核心目标: "寻找真相"
  secret: string;                  // 隐藏秘密: "能听到卡牌的低语"
  relationships: CharacterRelationship[];
}

export interface CharacterRelationship {
  characterId: string;
  characterName: string;
  type: 'mentor' | 'ally' | 'antagonist' | 'family' | 'neutral';
  description: string;             // "亦师亦友" / "潜在威胁"
}
```

```typescript
// types/chapter.ts
export type ChapterStatus = 'draft' | 'revising' | 'completed';

export interface Chapter {
  id: string;
  projectId: string;
  title: string;
  orderIndex: number;
  status: ChapterStatus;
  wordCount: number;
  content: string;
  outline: {
    goal: string;        // 目标
    conflict: string;    // 冲突
    keyPlot: string;     // 关键剧情
  };
  aiSuggestions?: AISuggestion[];
}

export interface AISuggestion {
  id: string;
  taskId: string;
  text: string;
  status: 'pending' | 'accepted' | 'saved' | 'discarded';
  createdAt: Date;
}
```

**交付物**:
- 6 个类型定义文件
- TypeScript 编译无错误 (`tsc --noEmit`)

**验证方式**:
```bash
cd caiode && bun run typecheck
# 输出: 0 errors
```

---

#### TASK-DEV-004: 创建 Mock 数据集

**任务 ID**: TASK-DEV-004
**优先级**: P0
**预估耗时**: 1h
**前置条件**: TASK-DEV-003 完成

**文件**: `caiode/src/mock-data/*.ts`

**Mock 数据必须与原型完全一致**:

| 数据文件 | 内容 | 原型对应 |
|---------|------|---------|
| `projects.ts` | "山海关外·异兽录" 项目 | 顶部标题栏 |
| `chapters.ts` | 3 章：雪岭异兽/流萤夜火/失落符牌 | 左侧章节列表 |
| `characters.ts` | 3 角色：苏瑶/陆长风/凯瑟琳女王 | 右侧角色卡 |
| `ai-tasks.ts` | 7 种状态的任务示例 | 右侧 AI 任务日志 |

**关键 Mock 数据示例**:

```typescript
// mock-data/projects.ts
export const mockProject: Project = {
  id: 'proj-001',
  name: '山海关外·异兽录',
  genre: '奇幻',
  description: '在一个由巨大机械发条驱动的王国里...',
  totalWordCount: 12400,
  chapterCount: 3,
  characterCount: 3,
  lastUpdated: new Date('2026-05-08T14:32:00'),
  status: 'active'
};
```

```typescript
// mock-data/chapters.ts
export const mockChapters: Chapter[] = [
  {
    id: 'ch-001',
    projectId: 'proj-001',
    title: '第一章：雪岭异兽',
    orderIndex: 1,
    status: 'completed',      // ✅ 已完成 (绿色圆点)
    wordCount: 2450,
    content: '寒风卷过古老的废墟，扬起一阵暗灰色的尘沙...',
    outline: {
      goal: '苏瑶在雪岭中遭遇第一只异兽，觉醒卡牌之力',
      conflict: '异兽的攻击让苏瑶陷入绝境',
      keyPlot: '危急时刻，苏瑶体内的卡牌碎片产生共鸣'
    }
  },
  {
    id: 'ch-002',
    projectId: 'proj-001',
    title: '第二章：流萤夜火',
    orderIndex: 2,
    status: 'revising',       // 🔄 修订中 (蓝色圆点)
    wordCount: 3180,
    content: '风雪交加的夜晚，客栈大门被猛然推开...',
    outline: {
      goal: '苏瑶在流萤镇寻找关于符牌的线索',
      conflict: '镇民对异兽的恐惧转化为对苏瑶的敌意',
      keyPlot: '陆长风首次现身，暗示符牌与王室有关'
    }
  },
  {
    id: 'ch-003',
    projectId: 'proj-001',
    title: '第三章：失落符牌',
    orderIndex: 3,
    status: 'draft',          // 📝 草稿 (灰色圆点)
    wordCount: 1260,
    content: '苏瑶拍去肩头的残雪，看似漫不经心...',
    outline: {
      goal: '苏瑶需要在废墟中找到失落的符牌碎片，以证明自己的血脉',
      conflict: '遭遇遗迹守护者的阻拦，同时暗长风暗中施加压力',
      keyPlot: '符牌碎片产生共鸣，揭示了一段被掩盖的历史记忆'
    }
  }
];
```

```typescript
// mock-data/characters.ts
export const mockCharacters: Character[] = [
  {
    id: 'char-001',
    projectId: 'proj-001',
    name: '苏瑶',
    role: '核心主角 · 写作者',
    personalityTags: ['冷静疏离', '内心藏有秘密'],
    speakingStyle: '言简意赅，常用反问句。',
    goal: '寻找真相',
    secret: '能听到卡牌的低语',
    relationships: [
      { characterId: 'char-002', characterName: '陆长风', type: 'mentor', description: '亦师亦友' },
      { characterId: 'char-003', characterName: '凯瑟琳女王', type: 'antagonist', description: '潜在威胁' }
    ]
  },
  {
    id: 'char-002',
    projectId: 'proj-001',
    name: '陆长风',
    role: '铸卡师导师',
    personalityTags: ['谨慎', '博学', '隐瞒往事'],
    speakingStyle: '学术性、隐喻多、停顿频繁...',
    goal: '引导苏瑶但不暴露全部真相',
    secret: '曾是王室工程师',
    relationships: [
      { characterId: 'char-001', characterName: '苏瑶', type: 'mentor', description: '学生' },
      { characterId: 'char-003', characterName: '凯瑟琳女王', type: 'neutral', description: '旧识' }
    ]
  },
  {
    id: 'char-003',
    projectId: 'proj-001',
    name: '凯瑟琳女王',
    role: '统治者',
    personalityTags: ['冷酷', '果断', '控制欲强'],
    speakingStyle: '命令式、威严、不带感情',
    goal: '维持统治，消灭威胁',
    secret: '发条核心正在衰竭',
    relationships: [
      { characterId: 'char-001', characterName: '苏瑶', type: 'antagonist', description: '猎物' },
      { characterId: 'char-002', characterName: '陆长风', type: 'neutral', description: '叛徒' }
    ]
  }
];
```

**交付物**:
- 4 个 Mock 数据文件
- 数据与原型截图完全一致
- 导出聚合文件 `mock-data/index.ts`

---

#### TASK-DEV-005: 定义 Provider 接口契约

**任务 ID**: TASK-DEV-005
**优先级**: P0
**预估耗时**: 1.5h
**前置条件**: TASK-DEV-003 完成

**文件**: `caiode/src/providers/index.ts`

**接口设计原则**:
- 所有 Provider 返回 `Promise<T>`（异步接口，未来可替换为真实实现）
- 错误统一使用 `ProviderError` 类型
- 支持取消操作（`AbortSignal`）

```typescript
// providers/index.ts
export interface ProviderError {
  code: 'NOT_FOUND' | 'PERMISSION_DENIED' | 'QUOTA_EXCEEDED' | 'TIMEOUT' | 'UNKNOWN';
  message: string;
  details?: Record<string, unknown>;
}

export interface INovelProjectProvider {
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  getActiveProject(): Promise<Project | null>;
}

export interface INovelChapterProvider {
  listChapters(projectId: string): Promise<Chapter[]>;
  getChapter(id: string): Promise<Chapter | null>;
  saveChapter(id: string, content: string): Promise<void>;
  updateChapterStatus(id: string, status: ChapterStatus): Promise<void>;
  addAISuggestion(chapterId: string, suggestion: AISuggestion): Promise<void>;
  acceptSuggestion(chapterId: string, suggestionId: string): Promise<void>;
}

export interface INovelCharacterProvider {
  listCharacters(projectId: string): Promise<Character[]>;
  getCharacter(id: string): Promise<Character | null>;
  getCharacterRelationships(characterId: string): Promise<CharacterRelationship[]>;
}

export interface INovelAgentProvider {
  submitTask(input: AITaskInput): Promise<AITask>;
  cancelTask(taskId: string): Promise<void>;
  getTaskStatus(taskId: string): Promise<AITaskStatus>;
  onTaskUpdate(callback: (task: AITask) => void): () => void; // 订阅更新
}

export interface IAILogProvider {
  logTask(task: AITask): Promise<void>;
  listLogs(options?: { status?: AITaskStatus; limit?: number }): Promise<AILog[]>;
  getLog(taskId: string): Promise<AILog | null>;
}
```

**交付物**:
- 5 个 Provider 接口定义
- 统一的错误类型
- JSDoc 注释完整

---

### 阶段 3: Provider 实现 (Day 2-3, 6h)

---

#### TASK-DEV-006: 实现 NovelProjectProvider

**任务 ID**: TASK-DEV-006
**优先级**: P1
**预估耗时**: 0.5h
**前置条件**: TASK-DEV-004, TASK-DEV-005 完成

**文件**: `caiode/src/providers/novel-project.ts`

**实现要点**:
- 从 `mock-data/projects.ts` 读取数据
- 模拟异步延迟（100-300ms）
- 支持获取"当前活跃项目"

```typescript
export class NovelProjectProvider implements INovelProjectProvider {
  async listProjects(): Promise<Project[]> {
    await mockDelay(100);
    return [mockProject];
  }

  async getProject(id: string): Promise<Project | null> {
    await mockDelay(150);
    return mockProject.id === id ? mockProject : null;
  }

  async getActiveProject(): Promise<Project | null> {
    await mockDelay(100);
    return mockProject;
  }
}
```

**交付物**:
- `NovelProjectProvider` 完整实现
- 单元测试通过

---

#### TASK-DEV-007: 实现 NovelChapterProvider

**任务 ID**: TASK-DEV-007
**优先级**: P1
**预估耗时**: 0.5h
**前置条件**: TASK-DEV-006 完成

**文件**: `caiode/src/providers/novel-chapter.ts`

**实现要点**:
- 章节 CRUD 操作
- AI 建议管理（采纳/保存/丢弃）
- 字数自动统计

```typescript
export class NovelChapterProvider implements INovelChapterProvider {
  private chapters = new Map<string, Chapter>(
    mockChapters.map(c => [c.id, { ...c }])
  );

  async listChapters(projectId: string): Promise<Chapter[]> {
    await mockDelay(100);
    return Array.from(this.chapters.values())
      .filter(c => c.projectId === projectId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async saveChapter(id: string, content: string): Promise<void> {
    const chapter = this.chapters.get(id);
    if (!chapter) throw new ProviderError('NOT_FOUND', `Chapter ${id} not found`);
    
    chapter.content = content;
    chapter.wordCount = content.length; // 简化字数统计
    chapter.status = 'revising';
    await mockDelay(200);
  }

  async acceptSuggestion(chapterId: string, suggestionId: string): Promise<void> {
    const chapter = this.chapters.get(chapterId);
    if (!chapter) throw new ProviderError('NOT_FOUND', `Chapter ${chapterId} not found`);
    
    const suggestion = chapter.aiSuggestions?.find(s => s.id === suggestionId);
    if (!suggestion) throw new ProviderError('NOT_FOUND', `Suggestion ${suggestionId} not found`);
    
    // 将建议文本追加到章节内容
    chapter.content += '\n\n' + suggestion.text;
    suggestion.status = 'accepted';
    chapter.wordCount = chapter.content.length;
    await mockDelay(100);
  }
}
```

**交付物**:
- `NovelChapterProvider` 完整实现
- 支持建议采纳/保存/丢弃

---

#### TASK-DEV-008: 实现 NovelCharacterProvider

**任务 ID**: TASK-DEV-008
**优先级**: P1
**预估耗时**: 0.5h
**前置条件**: TASK-DEV-007 完成

**文件**: `caiode/src/providers/novel-character.ts`

**交付物**:
- `NovelCharacterProvider` 完整实现
- 角色关系查询支持

---

#### TASK-DEV-009: 实现 FakeAgentProvider (核心任务)

**任务 ID**: TASK-DEV-009
**优先级**: **P0 (Week 1 最关键任务)**
**预估耗时**: 2h
**前置条件**: TASK-DEV-008 完成

**文件**: `caiode/src/providers/fake-agent.ts`

**这是 Week 1 最重要的任务**，直接决定 MVP 闭环是否成立。

**模拟场景覆盖 (9 种)**:

| # | 场景 | 触发条件 | Mock 行为 | 延迟 |
|:-:|------|---------|----------|:----:|
| 1 | AI 续写成功 | `type='continue-writing'` | 返回续写文本 (~200字) | 1-2s |
| 2 | AI 改写成功 | `type='rewrite-selection'` | 返回改写文本 | 1-2s |
| 3 | AI 摘要成功 | `type='summarize-chapter'` | 返回摘要 (~100字) | 1-2s |
| 4 | 角色语气改写 | `type='character-voice'` | 返回符合角色口吻的文本 | 1-2s |
| 5 | 任务失败 | `input.text` 包含 "fail" 或 "错误" | 返回 failed + 错误信息 | 0.5s |
| 6 | 用户取消 | 调用 `cancelTask()` | 返回 cancelled | 即时 |
| 7 | 权限不足 | `input.text` 包含 "sudo"/"admin"/"权限" | 返回 denied | 即时 |
| 8 | 配额不足 | 连续调用 > 10 次 | 返回 quota | 即时 |
| 9 | 长任务处理 | 默认行为 | 先返回 running，延迟后 success | 2s |

**核心实现**:

```typescript
export class FakeAgentProvider implements INovelAgentProvider {
  private tasks = new Map<string, AITask>();
  private callCount = 0;
  private listeners = new Set<(task: AITask) => void>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  async submitTask(input: AITaskInput): Promise<AITask> {
    this.callCount++;
    
    const task: AITask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: input.type,
      chapterId: input.chapterId,
      status: 'pending',
      input: {
        text: input.text,
        selectedText: input.selectedText,
        characterId: input.characterId
      },
      createdAt: new Date()
    };

    this.tasks.set(task.id, task);
    this.notifyListeners(task);

    // 模拟异步处理
    await this.simulateTaskExecution(task);
    
    return task;
  }

  private async simulateTaskExecution(task: AITask): Promise<void> {
    // Step 1: pending → running (立即)
    task.status = 'running';
    this.notifyListeners(task);

    // Step 2: 根据输入决定结果
    const delay = this.getDelay(task);
    
    const timer = setTimeout(() => {
      this.completeTask(task);
    }, delay);
    
    this.timers.set(task.id, timer);
  }

  private completeTask(task: AITask): void {
    // 检查是否已取消
    if (task.status === 'cancelled') return;

    // 模拟各种结果
    if (this.shouldFail(task)) {
      task.status = 'failed';
      task.error = 'Mock Error: 模拟生成超时（测试用错误场景）';
    } else if (this.shouldDeny(task)) {
      task.status = 'denied';
      task.error = '当前无权执行此操作（Mock 测试场景）';
    } else if (this.shouldQuotaExceeded(task)) {
      task.status = 'quota';
      task.error = '今日 Mock 调用次数已达上限（测试场景）';
    } else {
      task.status = 'success';
      task.output = {
        text: this.generateMockOutput(task),
        wordCount: Math.floor(Math.random() * 300) + 100
      };
    }

    task.completedAt = new Date();
    task.duration = task.completedAt.getTime() - task.createdAt.getTime();
    
    this.notifyListeners(task);
    this.logTask(task); // 记录到 AILog
  }

  private generateMockOutput(task: AITask): string {
    const templates: Record<AITaskType, string[]> = {
      'continue-writing': [
        '那巨影发出令人牙酸的摩擦声，一柄巨大的石斧重重砸在地面上，激起漫天碎石。苏瑶眼神一凛，迅速抽出身侧的短刃，刃口流转着淡淡的银芒。她知道，这遗迹守护者绝不会轻易让她靠近祭坛中央那块散发着微光的符牌碎片。',
        '陆长风缓缓从阴影中走出，手中把玩着一枚古老的硬币。"看来，你遇到了一点小麻烦。"他的声音低沉而平静，仿佛眼前的巨兽不过是只温顺的猫。'
      ],
      'rewrite-selection': [
        '原文：她很快就意识到情况不对。\n改写：她以惊人的警觉察觉到事态正在向不可控的方向滑落。',
        '原文：这很危险。\n改写：这不合逻辑...而且感觉不对劲。'
      ],
      'summarize-chapter': [
        '本章讲述了苏瑶在废墟中寻找失落符牌碎片的过程。她遭遇了遗迹守护者的阻拦，同时发现陆长风似乎在暗中观察她。关键时刻，符牌碎片产生共鸣，揭示了一段被掩盖的历史记忆。'
      ],
      'character-voice': [
        '（苏瑶口吻）"这不合逻辑...除非齿轮本身就是活的。"',
        '（陆长风口吻）"年轻人，有些事情...知道得太多未必是好事。"'
      ]
    };

    const options = templates[task.type] || ['Mock 生成内容'];
    return options[Math.floor(Math.random() * options.length)];
  }

  async cancelTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) throw new ProviderError('NOT_FOUND', `Task ${taskId} not found`);
    
    // 清除定时器
    const timer = this.timers.get(taskId);
    if (timer) clearTimeout(timer);
    
    task.status = 'cancelled';
    task.completedAt = new Date();
    this.notifyListeners(task);
  }

  onTaskUpdate(callback: (task: AITask) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(task: AITask): void {
    this.listeners.forEach(cb => cb({ ...task }));
  }

  // 模拟判定逻辑...
  private shouldFail(task: AITask): boolean {
    return task.input.text?.includes('fail') || task.input.text?.includes('错误');
  }

  private shouldDeny(task: AITask): boolean {
    return task.input.text?.includes('sudo') || 
           task.input.text?.includes('admin') || 
           task.input.text?.includes('权限');
  }

  private shouldQuotaExceeded(task: AITask): boolean {
    return this.callCount > 10;
  }

  private getDelay(task: AITask): number {
    if (this.shouldFail(task)) return 500;
    if (this.shouldDeny(task) || this.shouldQuotaExceeded(task)) return 0;
    return 1000 + Math.random() * 1000;
  }
}
```

**交付物**:
- `FakeAgentProvider` 完整实现
- 覆盖全部 9 种模拟场景
- 支持任务状态实时订阅
- 支持取消操作

**验证方式**:
```typescript
// 单元测试示例
const provider = new FakeAgentProvider();

// 测试成功场景
const task = await provider.submitTask({
  type: 'continue-writing',
  chapterId: 'ch-003',
  text: '苏瑶拍去肩头的残雪...'
});
expect(task.status).toBe('running');
// 等待 2 秒后
expect(task.status).toBe('success');
expect(task.output).toBeDefined();

// 测试失败场景
const failTask = await provider.submitTask({
  type: 'continue-writing',
  chapterId: 'ch-003',
  text: 'fail'
});
expect(failTask.status).toBe('failed');
```

---

#### TASK-DEV-010: 实现 AILog 记录系统

**任务 ID**: TASK-DEV-010
**优先级**: P1
**预估耗时**: 1h
**前置条件**: TASK-DEV-009 完成

**文件**: `caiode/src/providers/ai-log.ts`

**实现要点**:
- 内存存储（Week 1 不持久化）
- 支持按状态筛选
- 与 FakeAgentProvider 集成

```typescript
export class AILogProvider implements IAILogProvider {
  private logs: AILog[] = [];

  async logTask(task: AITask): Promise<void> {
    const log: AILog = {
      id: `log-${Date.now()}`,
      taskId: task.id,
      taskType: task.type,
      inputSummary: task.input.text.slice(0, 100) + '...',
      outputSummary: task.output?.text.slice(0, 100) + '...' || 'N/A',
      status: task.status,
      duration: task.duration || 0,
      errorMessage: task.error,
      provider: 'FakeAgentProvider',
      createdAt: new Date()
    };
    this.logs.unshift(log); // 新日志在前
  }

  async listLogs(options?: { status?: AITaskStatus; limit?: number }): Promise<AILog[]> {
    let result = this.logs;
    if (options?.status) {
      result = result.filter(l => l.status === options.status);
    }
    if (options?.limit) {
      result = result.slice(0, options.limit);
    }
    return result;
  }
}
```

**交付物**:
- `AILogProvider` 完整实现
- 支持筛选和分页
- 与 FakeAgentProvider 自动集成

---

### 阶段 4: UI 接入与展示 (Day 3-4, 6h)

---

#### TASK-DEV-011: 接入 opencode Workspace 页面

**任务 ID**: TASK-DEV-011
**优先级**: P1
**预估耗时**: 1.5h
**前置条件**: TASK-DEV-010 完成

**技术方案**:
- 在 opencode 的 Workspace 系统中注册 `novel-project` 类型
- 使用 opencode 的 `registerWorkspace` API（假设存在）
- 或创建独立路由 `/novel/:projectId`

**实现方式**（需调研 opencode 扩展机制后确定）：

```typescript
// 方案 A: 使用 opencode Workspace API (推荐)
// 在 caiode/src/extension.ts 或入口文件中
import { registerWorkspace } from '@opencode-ai/core';
import { NovelEditor } from './components/novel-editor';

registerWorkspace({
  type: 'novel-project',
  icon: '📖',
  title: '卡牌物语',
  component: NovelEditor,
  // 其他配置...
});

// 方案 B: 独立路由 (备选)
// 在 opencode 的路由系统中添加
// /novel/:projectId → NovelEditor
```

**交付物**:
- Workspace 注册代码
- 项目入口页面
- 与 opencode 的集成点

**风险**: 需要调研 opencode 的扩展 API，如 API 不存在则使用方案 B。

---

#### TASK-DEV-012: 实现章节编辑器组件

**任务 ID**: TASK-DEV-012
**优先级**: **P0**
**预估耗时**: 2h
**前置条件**: TASK-DEV-011 完成

**组件清单**:

| 组件 | 文件 | 原型对应 | 复杂度 |
|-----|------|---------|:------:|
| ChapterList | `chapter-list.tsx` | 左侧章节列表 | 中 |
| ChapterEditor | `chapter-editor.tsx` | 中央编辑区 | 高 |
| OutlinePanel | `outline-panel.tsx` | 章节大纲区 | 低 |
| CharacterPanel | `character-panel.tsx` | 右侧角色卡 | 中 |
| MockModeBanner | `mock-mode-banner.tsx` | 顶部 Mock 徽章 | 低 |

**核心组件：ChapterEditor**

```tsx
// components/novel-editor/chapter-editor.tsx
export function ChapterEditor({ chapterId }: { chapterId: string }) {
  const { chapter, saveChapter } = useChapter(chapterId);
  const [content, setContent] = useState(chapter?.content || '');

  return (
    <div className="flex flex-col h-full">
      {/* 章节标题 */}
      <h1 className="text-2xl font-bold mb-4">{chapter?.title}</h1>
      
      {/* 章节大纲 (默认展开) */}
      <OutlinePanel outline={chapter?.outline} />
      
      {/* 正文编辑区 */}
      <textarea
        className="flex-1 resize-none p-4 text-lg leading-relaxed"
        style={{ background: '#F5F1E8', lineHeight: 1.8 }}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="开始写作..."
      />
      
      {/* AI 建议结果卡 */}
      <AIResultCard chapterId={chapterId} />
    </div>
  );
}
```

**交付物**:
- 5 个 UI 组件
- 与 Provider 层集成
- 响应式布局支持

---

#### TASK-DEV-013: 实现 AI 任务面板与结果展示

**任务 ID**: TASK-DEV-013
**优先级**: **P0**
**预估耗时**: 1.5h
**前置条件**: TASK-DEV-012 完成

**组件清单**:

| 组件 | 文件 | 原型对应 |
|-----|------|---------|
| AITaskPanel | `ai-task-panel.tsx` | 底部固定工具条 |
| AIResultCard | `ai-result-card.tsx` | AI 建议结果卡片 |

**关键交互状态机**:

```
用户点击任务按钮
    ↓
创建 AITask (status: pending)
    ↓
调用 FakeAgentProvider.submitTask()
    ↓
状态流转: pending → running (显示 Spinner)
    ↓
等待 1-2 秒
    ↓
状态流转: running → success/failed/cancelled/denied/quota
    ↓
展示 AIResultCard
    ↓
用户操作:
    ├── 采纳 → 插入到编辑器 + 记录 AILog
    ├── 存为灵感 → 保存到建议列表 + 记录 AILog
    └── 忽略 → 丢弃 + 记录 AILog
```

**交付物**:
- AI 任务面板组件
- AI 结果卡片组件
- 完整的状态流转交互

---

#### TASK-DEV-014: 实现 AI 日志抽屉

**任务 ID**: TASK-DEV-014
**优先级**: P1
**预估耗时**: 1h
**前置条件**: TASK-DEV-013 完成

**组件**: `components/novel-editor/ai-log-drawer.tsx`

**功能**:
- 右侧滑出抽屉
- 展示全部 7 种状态的任务记录
- 支持按状态筛选
- 点击展开详情

**交付物**:
- AI 日志抽屉组件
- 状态筛选功能
- 详情展开交互

---

### 阶段 5: 测试与验证 (Day 5, 4h)

---

#### TASK-DEV-015: 编写单元测试

**任务 ID**: TASK-DEV-015
**优先级**: P0
**预估耗时**: 1.5h
**前置条件**: 所有 Provider 实现完成

**测试覆盖矩阵**:

| 测试文件 | 测试内容 | 用例数 |
|---------|---------|:------:|
| `novel-project.test.ts` | ProjectProvider CRUD | 4 |
| `novel-chapter.test.ts` | ChapterProvider + 建议操作 | 6 |
| `novel-character.test.ts` | CharacterProvider + 关系查询 | 4 |
| `fake-agent.test.ts` | **9 种模拟场景全覆盖** | **9** |
| `ai-log.test.ts` | LogProvider 筛选/查询 | 4 |

**FakeAgentProvider 测试用例 (9 种)**:

```typescript
describe('FakeAgentProvider', () => {
  let provider: FakeAgentProvider;

  beforeEach(() => { provider = new FakeAgentProvider(); });

  test('场景1: AI续写成功', async () => {
    const task = await provider.submitTask({
      type: 'continue-writing', chapterId: 'ch-003', text: '正常输入'
    });
    expect(task.status).toBe('running');
    await waitFor(() => expect(task.status).toBe('success'));
    expect(task.output).toBeDefined();
  });

  test('场景5: 任务失败', async () => {
    const task = await provider.submitTask({
      type: 'continue-writing', chapterId: 'ch-003', text: 'fail'
    });
    await waitFor(() => expect(task.status).toBe('failed'));
    expect(task.error).toContain('Mock Error');
  });

  test('场景6: 用户取消', async () => {
    const task = await provider.submitTask({
      type: 'continue-writing', chapterId: 'ch-003', text: '正常输入'
    });
    await provider.cancelTask(task.id);
    expect(task.status).toBe('cancelled');
  });

  test('场景7: 权限不足', async () => {
    const task = await provider.submitTask({
      type: 'continue-writing', chapterId: 'ch-003', text: 'sudo admin'
    });
    expect(task.status).toBe('denied');
  });

  test('场景8: 配额不足', async () => {
    // 连续调用 11 次
    for (let i = 0; i < 10; i++) {
      await provider.submitTask({ type: 'continue-writing', chapterId: 'ch-003', text: 'x' });
    }
    const task = await provider.submitTask({
      type: 'continue-writing', chapterId: 'ch-003', text: 'x'
    });
    expect(task.status).toBe('quota');
  });
});
```

**交付物**:
- 5 个测试文件
- 全部测试通过
- 覆盖率 > 80%

---

#### TASK-DEV-016: 执行构建验证

**任务 ID**: TASK-DEV-016
**优先级**: **P0 (阻塞性)**
**预估耗时**: 0.5h
**前置条件**: TASK-DEV-015 完成

**验证命令**:
```bash
# 1. TypeScript 类型检查
cd caiode && bun run typecheck
# 预期: 0 errors, 0 warnings

# 2. 前端构建
cd caiode && bun run build
# 预期: Build successful

# 3. 测试执行
cd caiode && bun run test
# 预期: All tests passed
```

**交付物**:
- typecheck 通过截图/日志
- build 通过截图/日志
- test 通过截图/日志

---

#### TASK-DEV-017: 权限边界检查

**任务 ID**: TASK-DEV-017
**优先级**: **P0**
**预估耗时**: 0.5h
**前置条件**: TASK-DEV-016 完成

**检查清单**:

| # | 检查项 | 验证方式 | 预期结果 |
|:-:|-------|---------|---------|
| 1 | 无真实 Agent 调用 | 搜索代码中 `openai`/`anthropic`/`gemini` | 0 处引用 |
| 2 | 无真实 API Key | 搜索 `apiKey`/`API_KEY` | 仅 Mock 数据中有 |
| 3 | 无 HTTP 请求 | 搜索 `fetch`/`axios`/`http` | 0 处真实请求 |
| 4 | 无 Bash 工具 | 搜索 `exec`/`spawn`/`child_process` | 0 处引用 |
| 5 | 无 WebFetch | 搜索 `WebFetch`/`webFetch` | 0 处引用 |
| 6 | 无 WebSearch | 搜索 `WebSearch`/`webSearch` | 0 处引用 |
| 7 | 无外部 Agent | 搜索 `Agent` 工具调用 | 0 处引用 |
| 8 | 仅 FakeAgentProvider | 搜索 `AgentProvider` | 仅 FakeAgentProvider |

**验证命令**:
```bash
# 搜索真实 AI 相关引用
grep -r "openai\|anthropic\|gemini\|claude" caiode/src/ || echo "✅ 无真实 AI 引用"

# 搜索 HTTP 请求
grep -r "fetch\|axios" caiode/src/ || echo "✅ 无 HTTP 请求"

# 搜索命令执行
grep -r "exec\|spawn\|child_process" caiode/src/ || echo "✅ 无命令执行"
```

**交付物**:
- 权限边界检查报告
- 代码扫描结果

---

#### TASK-DEV-018: 生成 Week 1 完成报告

**任务 ID**: TASK-DEV-018
**优先级**: P1
**预估耗时**: 1h
**前置条件**: TASK-DEV-017 完成

**输出文件**: `caiode/docs/planning/week1/WEEK1-MOCK-INTEGRATION-REPORT.md`

**报告内容**:
- 任务完成清单（14/14）
- 代码变更统计
- 测试覆盖率
- 构建验证结果
- 权限边界检查结果
- 已知问题与风险
- Week 2 建议

**交付物**:
- Week 1 完成报告
- Git 提交记录
- PR 到 develop 分支

---

## 四、Mock 模式铁律

```
❌ 绝对禁止:
  - 接真实 Agent (OpenAI/Claude/Gemini 等)
  - 调用真实模型 API
  - 执行真实远程 HTTP 请求
  - 使用 Bash 工具执行命令
  - 使用 WebFetch/WebSearch
  - 修改 opencode-1.4.0 上游核心源码
  - 提交 node_modules/.cache/dist/target 到 Git
  - 把"未实际验证"写成"已完成"
  - 在 Week 1 引入多 Agent 协作

✅ 明确允许:
  - 读取 opencode 源码进行分析
  - 在 caiode/ 自有目录下创建文件
  - 定义接口、类型、Mock 数据
  - 实现 Fake/Mock 类
  - 编写单元测试
  - 输出文档和报告
```

---

## 五、风险控制

| 风险项 | 概率 | 影响 | 缓解措施 | 应急方案 |
|-------|:----:|:----:|---------|---------|
| opencode 扩展 API 不存在 | 中 | 高 | 提前调研 API | 使用独立路由方案 B |
| TypeScript 类型冲突 | 中 | 中 | 使用 namespace 隔离 | 添加 `// @ts-ignore` 临时绕过 |
| UI 组件复杂度超预期 | 高 | 中 | 先做最小 Demo | 降低 UI 要求，先验证数据流 |
| 构建失败 | 低 | 高 | 频繁执行 typecheck | 回退到上一稳定提交 |
| Mock 数据不够真实 | 低 | 低 | 参考真实小说结构 | 请架构师审核 Mock 数据设计 |

---

## 六、交付物清单

| # | 交付物 | 路径 | 负责人 | 状态 |
|:-:|--------|------|:------:|:----:|
| 1 | 功能分支 | `feat/week1-mock-provider-novel-editor` | 开发工程师 | ⏳ |
| 2 | 类型定义 (6个) | `caiode/src/types/*.ts` | 开发工程师 | ⏳ |
| 3 | Mock 数据 (4个) | `caiode/src/mock-data/*.ts` | 开发工程师 | ⏳ |
| 4 | Provider 接口 | `caiode/src/providers/index.ts` | 开发工程师 | ⏳ |
| 5 | Provider 实现 (5个) | `caiode/src/providers/*.ts` | 开发工程师 | ⏳ |
| 6 | UI 组件 (7个) | `caiode/src/components/novel-editor/*.tsx` | 前端工程师 | ⏳ |
| 7 | 单元测试 (5个) | `caiode/tests/*.test.ts` | 测试工程师 | ⏳ |
| 8 | 构建验证报告 | typecheck + build 日志 | 开发工程师 | ⏳ |
| 9 | 权限边界检查报告 | 代码扫描结果 | 开发工程师 | ⏳ |
| 10 | Week 1 完成报告 | `docs/planning/week1/WEEK1-MOCK-INTEGRATION-REPORT.md` | 开发工程师 | ⏳ |

---

## 七、架构师评审要点

### 请架构师重点评审以下方面：

1. **Provider 接口设计** (TASK-DEV-005)
   - 接口粒度是否合理？
   - 是否预留了真实实现的扩展点？
   - 错误处理机制是否完善？

2. **FakeAgentProvider 模拟场景** (TASK-DEV-009)
   - 9 种场景是否覆盖完整？
   - 状态流转是否正确？
   - 延迟模拟是否合理？

3. **与 opencode 的集成方案** (TASK-DEV-011)
   - Workspace 注册方案是否可行？
   - 是否需要修改 opencode 核心？
   - 备选方案是否足够？

4. **Mock 数据设计** (TASK-DEV-004)
   - 数据结构与原型是否一致？
   - 是否足够支撑 UI 展示？
   - 是否预留了扩展字段？

5. **类型定义完整性** (TASK-DEV-003)
   - 是否遗漏了原型中的字段？
   - 枚举值是否完整？
   - 类型约束是否合理？

---

## 八、文档元信息

| 属性 | 值 |
|-----|---|
| **文档编号** | WEEK1-DEV-TASK-001 |
| **文档标题** | Week 1 开发任务拆解：Mock 接入阶段 |
| **创建人** | Trae AI (基于原型评审结果) |
| **创建日期** | 2026-05-08 |
| **最后更新** | 2026-05-08 |
| **状态** | [READY_FOR_ARCHITECT_REVIEW] |
| **关联文档** | WEEK1-MVP-PRODUCT-PROTOTYPE-CHECKLIST.md, WEEK1-STITCH-MVP-PROTOTYPE-PROMPTS.md, WEEK1-MOCK-INTEGRATION-TASKS.md |
| **原型评审结果** | 92/100 (A- 级), 通过 MVP 验收 |
| **下一步行动** | 等待架构师评审，确认后执行 TASK-DEV-001 |

---

*本文档基于 Stitch V1.1 原型评审结果生成*
*原型评审得分: 92/100 (A- 级)*
*原型验收: 通过，可进入技术开发阶段*

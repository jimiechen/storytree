# NOVEL-EDITOR-AS-CORE-PRODUCT.md

> **角色**: 项目协调 Agent (Kimi-K2.6)  
> **任务ID**: DOC-PHASE0-014  
> **日期**: 2026-05-15  
> **版本**: v2.0 (MVP 对齐版)  
> **状态**: [READY_FOR_REVIEW]

---

## 一、核心定位

**Novel Editor Core 不是普通插件，而是 OpenCode Creative Studio 的基础入口和所有下游插件的内容源。**

如果 Novel Editor 是付费插件，用户没有购买就无法创建任何项目，整个平台失去意义。因此 Novel Editor 必须作为 Core 产品免费提供。

### 1.1 一句话定义

```text
小说编辑器是 OpenCode Creative Studio 的 Core Product，
是从"故事文本"到"可视化生产"的统一入口，
所有下游插件（剧本 / 分镜 / 3D / 图像 / 视频 / 剪辑 / 一致性）都消费它沉淀的结构化数据。
```

### 1.2 它不是什么

```text
不是普通 AI 写作工具（不替用户写故事）
不是普通付费插件（不能被禁用 / 卸载）
不是聊天驱动的对话框（编辑器才是主舞台）
不是富文本排版工具（不做 Word 那一套）
```

---

## 二、三层边界定义

| 维度 | MVP（14 天） | 中期（M2-M4，3 个月） | 长期（半年+） |
|------|-------------|---------------------|--------------|
| 核心目标 | 跑通"文本→场景→镜头" | 跑通"小说→分镜→图像提示词" | 成为创作流程的统一入口 |
| 用户数据 | Project / Chapter / Scene / Shot | + Character / Location / Asset 引用 | + Timeline / Beat / Continuity |
| AI 模式 | Mock 为主 + 1 条真实通道 | 多 Provider，Skill 体系标准化 | 多 Skill 工作流组合，Skill Pack |
| 插件 | 不做插件 | Storyboard / Image Prompt 两个插件 | 8–10 个商业插件 |
| 商业化 | 不做 | 不做 | 单插件 / 套餐 / 额度 |
| 编辑器 | contentEditable | 仍然 contentEditable，可加最小富文本 | 可考虑 Lexical 或自研 |
| 存储 | 本地 JSON 文件 | 本地 JSON + 资产目录 | 可选云同步 |
| 协作 | 不做 | 不做 | 可选只读分享 |

---

## 三、MVP 数据模型（schemaVersion: 2）

MVP 使用 schemaVersion 2，预留 Worktree 结构，但只用一个默认 main 分支。

```typescript
// packages/novel-core/src/types.ts

export interface NovelProjectMeta {
  schemaVersion: 2;
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  settings: { theme: 'light' | 'dark' };

  defaultWorktreeId: string;    // MVP 阶段固定 'main'
  worktreeIds: string[];        // MVP 阶段只有一个
}

export interface NovelWorktree {
  id: string;
  branchName: string;
  parentBranchId?: string;       // 从哪个分支 fork 出来
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'archived';

  providerConfig?: {             // M2 启用，MVP 阶段为空
    providerId: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  };

  // 实际故事数据
  chapters: Chapter[];
  scenes: Scene[];
  shots: Shot[];
  characters: Character[];
  locations: Location[];

  // Canvas 视图状态（M2 启用）
  canvas?: NovelCanvas;

  // Agent 会话（M2 启用）
  agentSessionId?: string;
}

export interface NovelCanvas {
  viewMode: 'structure' | 'character' | 'timeline';
  viewport: { x: number; y: number; zoom: number };
  nodeOverrides: Record<string, { x: number; y: number; pinned?: boolean }>;
  // 节点和边都从故事数据派生，这里只存"用户的视图覆盖"
}

export interface Chapter {
  id: string;
  order: number;
  title: string;
  rawText: string;
}

export interface Scene {
  id: string;
  chapterId: string;
  order: number;
  title: string;
  summary: string;
  locationId?: string;
  characterIds: string[];
  goal?: string;
  conflict?: string;
  mood?: string;
  rawTextSpan?: { start: number; end: number };
}

export interface Shot {
  id: string;
  sceneId: string;
  order: number;
  shotSize?: 'ECU' | 'CU' | 'MS' | 'WS' | 'EWS';
  cameraAngle?: 'eye' | 'high' | 'low' | 'dutch' | 'topdown';
  cameraMovement?: 'static' | 'pan' | 'tilt' | 'dolly' | 'tracking' | 'zoom';
  composition?: string;
  durationSec?: number;
  actionDescription?: string;
  dialogue?: string;
  imagePromptSeed?: string;
  videoPromptSeed?: string;
}

export interface Character {
  id: string;
  name: string;
  shortDescription?: string;
  appearance?: string;
  tags: string[];
}

export interface Location {
  id: string;
  name: string;
  shortDescription?: string;
  tags: string[];
}
```

---

## 四、MVP 磁盘结构

MVP 阶段使用单文件 `.novelproj.json`，内部包含 worktrees 数组（只有一个 main 分支）。M2 切换到目录模式时零数据迁移。

```text
my-novel.novelproj.json        # 单文件，内含 NovelProjectMeta + NovelWorktree[]
```

M2 起切换为目录模式：

```text
my-novel.novelproj/
├── project.json                # NovelProjectMeta
├── worktrees/
│   ├── main/
│   │   ├── worktree.json       # NovelWorktree（含所有故事数据）
│   │   ├── chat-history.jsonl  # Agent 会话历史
│   │   └── canvas.json
│   ├── draft-a/
│   │   ├── worktree.json
│   │   ├── chat-history.jsonl
│   │   └── canvas.json
│   └── explore-villain/
│       └── ...
└── assets/                     # M3 起，资产引用
```

---

## 五、下游插件消费链路

所有下游插件都消费 Novel Core 的数据：

```text
Novel Scene
  ↓
Script Studio：改写成剧本场景
  ↓
Storyboard Studio：拆成镜头
  ↓
3D Shot Draft：生成 3D 构图草稿
  ↓
Image Prompt：生成图像提示词
  ↓
Image Generation：生成图像资产
  ↓
Video Prompt：生成视频提示词
  ↓
Video Generation：生成视频资产
  ↓
Timeline Draft：拼接剪辑草稿
  ↓
Long Video Manager：管理长项目结构
```

---

## 六、MVP 页面结构

```text
/novel                      项目列表页
  ├── + 新建项目
  ├── 最近打开
  └── 项目卡片（点击进入）

/novel/:projectId           项目主界面
  ├── 顶栏：项目名 / 主题切换 / 保存状态 / 任务图标
  ├── 左栏：章节大纲 + 角色 / 地点 标签
  ├── 中栏：当前章节文本编辑器
  ├── 右栏：当前章节场景卡列表
  └── 右下：任务面板（折叠）

/novel/:projectId/scene/:sceneId   场景详情页（可弹层或独立页）
  ├── 场景元数据编辑（title/summary/location/characters/goal/conflict）
  ├── 场景对应原文段落（高亮）
  └── 镜头列表（卡片形态，可拖拽排序）

/novel/:projectId/canvas    Canvas 占位页（M2 实现）
  └── "Canvas v0 即将上线"
```

---

## 七、MVP 功能范围

### 7.1 必做（P0）

```text
F1  项目管理：新建项目、项目列表、打开项目、删除项目（带二次确认）
F2  章节管理：新建章节、章节列表（左侧大纲）、重命名、删除、排序（拖拽）
F3  章节编辑器：纯文本编辑、自动保存（节流 1s）、字数统计
F4  场景结构化：手动新建场景卡、绑定章节、填写 title/summary/location/characters/goal/conflict
F5  AI 拆场景：选中一段章节文字 → 调用 novel-outline Skill → 返回场景卡草稿
F6  AI 拆镜头：在场景卡上点「生成镜头」 → 调用 story-to-shot Skill → 返回 5–10 个 Shot
F7  镜头编辑：编辑 Shot 的所有字段；增加 / 删除 / 排序
F8  本地持久化：单文件 .novelproj.json，使用 File System Access API
F9  任务中心：右下角任务面板，显示 AI 任务状态（pending / running / done / failed）
F10 Mock AI Provider：固定模板返回结构化结果，保证流程能跑
F11 主题切换：深 / 浅
F12 错误兜底：AI 失败时给清晰提示并支持重试
```

### 7.2 推荐（P1，时间允许才做）

```text
F13 Character / Location 卡片管理：基础 CRUD
F14 文本选区与场景的位置绑定（rawTextSpan），可在编辑器中高亮
F15 OpenRouter 真 Provider：仅用于 demo
F16 项目导入 / 导出（.novelproj.json）
F17 最近打开项目列表
```

### 7.3 不做（P2，明确划掉）

```text
N1 图像 / 视频 / 3D / 剧本输出
N2 用户登录、云同步、多人协作
N3 付费 License、插件市场
N4 富文本编辑器（不上 TipTap / Lexical）
N5 移动端适配
N6 全文检索、全局替换
N7 版本历史、撤销栈持久化
N8 分支创建 / 切换 / 切分 UI（M2 再做）
N9 Canvas 渲染（M2 再做）
N10 分支对话 / 对比 / 合并（M3 再做）
N11 跨分支 Agent（M3 再做）
```

---

## 八、与 Plugin 的关系

| 属性 | Novel Editor Core | Script Studio Plugin |
|------|-------------------|---------------------|
| 定位 | Core Product | Paid Plugin |
| 付费 | 免费 | 付费 |
| 功能 | 小说创作 | 剧本转换 |
| 数据 | 生产数据 | 消费数据 |
| 依赖 | 无 | 依赖 Novel Core |
| 能否禁用 | 不能 | 能 |

---

## 九、分支沙箱机制（M2-M3 规划）

### 9.1 Worktree 沙箱

```text
NovelWorktree
  ├── id                         分支 id
  ├── projectId                  所属项目
  ├── branchName                 分支名（main / draft-A / explore-villain-arc）
  ├── workspacePath              磁盘上独立目录
  ├── agentSession               独立的 Agent Runtime 会话
  ├── providerConfig             独立的 LLM Provider 配置
  ├── status                     idle / writing / generating / merging / archived
  ├── lastActivityAt
  └── lockFile                   防止两个 Agent 同时写一个分支
```

### 9.2 关键原则

- **不用真正的 git worktree**：自己实现"逻辑分支"概念
- **Provider 配置挂在 Worktree 级**：不在 Project 级，更不在 Global 级
- **分支合并 = Cherry-pick 组装**：不做自动 merge，小说不是代码

### 9.3 阶段规划

| 阶段 | 内容 |
|------|------|
| M1（MVP） | 单分支 main，预留 worktree 字段 |
| M2 | Worktree 数据骨架 + 结构图 Canvas v0 |
| M3 | 分支对话 + 分支对比 + Cherry-pick 合并 |
| M4 | Storyboard 插件 + Canvas 多视图 + 一致性检查 |

---

*[READY_FOR_REVIEW]*

# NOVEL-EDITOR-AS-CORE-PRODUCT.md

> **角色**: 项目协调 Agent (Kimi-K2.6)  
> **任务ID**: DOC-PHASE0-014  
> **日期**: 2026-05-15  
> **版本**: v1.0  
> **状态**: [READY_FOR_REVIEW]

---

## 一、核心定位

**Novel Editor Core 不是普通插件，而是 OpenCode Creative Studio 的基础入口和所有下游插件的内容源。**

如果 Novel Editor 是付费插件，用户没有购买就无法创建任何项目，整个平台失去意义。因此 Novel Editor 必须作为 Core 产品免费提供。

---

## 二、数据模型

Novel Core 内置完整的小说创作数据模型：

```typescript
interface NovelProject {
  id: string
  name: string
  description: string
  type: 'novel' | 'screenplay' | 'short_story'
  status: 'draft' | 'in_progress' | 'completed'
  createdAt: string
  updatedAt: string
}

interface StoryWorld {
  id: string
  projectId: string
  name: string
  description: string
  rules: string[]
  history: string
  geography: string
  culture: string
  technology: string
  magicSystem?: string
}

interface Character {
  id: string
  projectId: string
  name: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  age: number
  gender: string
  appearance: string
  personality: string
  background: string
  motivation: string
  arc: string
  relationships: CharacterRelationship[]
}

interface CharacterRelationship {
  characterId: string
  type: 'friend' | 'enemy' | 'family' | 'lover' | 'mentor' | 'rival'
  description: string
}

interface Location {
  id: string
  projectId: string
  name: string
  description: string
  type: 'interior' | 'exterior' | 'virtual'
  significance: string
}

interface Chapter {
  id: string
  projectId: string
  number: number
  title: string
  summary: string
  scenes: Scene[]
  status: 'outline' | 'draft' | 'revision' | 'final'
}

interface Scene {
  id: string
  chapterId: string
  number: number
  title: string
  setting: string
  characters: string[]
  goal: string
  conflict: string
  outcome: string
  beats: Beat[]
}

interface Beat {
  id: string
  sceneId: string
  number: number
  description: string
  type: 'action' | 'dialogue' | 'description' | 'transition'
}

interface Draft {
  id: string
  projectId: string
  chapterId: string
  content: string
  version: number
  createdBy: 'human' | 'ai'
  status: 'draft' | 'suggestion' | 'accepted' | 'rejected'
}

interface Revision {
  id: string
  draftId: string
  changes: string
  reason: string
  createdAt: string
}

interface ContinuityNote {
  id: string
  projectId: string
  type: 'character' | 'plot' | 'setting' | 'timeline'
  description: string
  references: string[]
}
```

---

## 三、下游插件消费链路

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

## 四、Novel Editor 页面结构

```text
Novel Editor Page
├── Project Header
│   ├── Project Name
│   ├── Project Type
│   └── Project Status
├── StoryWorld Panel
│   ├── World Description
│   ├── Rules
│   ├── History
│   └── Geography
├── Character Panel
│   ├── Character List
│   ├── Character Detail
│   └── Relationships
├── Location Panel
│   ├── Location List
│   └── Location Detail
├── Timeline Panel
│   ├── Chapter List
│   ├── Scene List
│   └── Beat List
├── Chapter Editor
│   ├── Chapter Outline
│   ├── Scene Editor
│   └── Beat Editor
└── Draft Panel
    ├── Draft List
    ├── Draft Editor
    └── Revision History
```

---

## 五、与 Plugin 的关系

| 属性 | Novel Editor Core | Script Studio Plugin |
|------|-------------------|---------------------|
| 定位 | Core Product | Paid Plugin |
| 付费 | 免费 | 付费 |
| 功能 | 小说创作 | 剧本转换 |
| 数据 | 生产数据 | 消费数据 |
| 依赖 | 无 | 依赖 Novel Core |

---

*[READY_FOR_REVIEW]*

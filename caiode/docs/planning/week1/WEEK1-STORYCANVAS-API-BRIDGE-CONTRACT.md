# Week 1 StoryCanvas API Bridge 契约文档

**生成时间**：2026-05-15  
**所属阶段**：Phase 0（评审修订）  
**对应报告**：STORYCANVAS-OPENCODE-INTEGRATION-REPORT.md

---

## 一、契约概述

### 1.1 目的

定义 StoryCanvas API Bridge 的数据契约，确保前端与后端的数据格式一致，支持 Mock/真实数据切换。

### 1.2 适用范围

本契约适用于 Week 1 Mock MVP 阶段，后续阶段可扩展。

### 1.3 契约版本

**版本**：v1.0  
**生效日期**：2026-05-15  
**状态**：草案

---

## 二、核心业务对象

### 2.1 Project（项目）

```typescript
interface Project {
  /** 项目唯一标识 */
  id: string
  /** 项目名称 */
  name: string
  /** 项目描述 */
  description: string
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
}
```

### 2.2 Chapter（章节）

```typescript
interface Chapter {
  /** 章节唯一标识 */
  id: string
  /** 所属项目 ID */
  projectId: string
  /** 章节标题 */
  title: string
  /** 章节内容 */
  content: string
  /** 章节顺序 */
  order: number
  /** 章节状态 */
  status: 'draft' | 'published' | 'archived'
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
}
```

### 2.3 Character（角色）

```typescript
interface Character {
  /** 角色唯一标识 */
  id: string
  /** 所属项目 ID */
  projectId: string
  /** 角色名称 */
  name: string
  /** 角色描述 */
  description: string
  /** 角色头像 URL */
  avatar?: string
  /** 角色特质标签 */
  traits: string[]
  /** 创建时间 */
  createdAt: Date
}
```

### 2.4 StoryCard（故事卡）

```typescript
interface StoryCard {
  /** 故事卡唯一标识 */
  id: string
  /** 所属项目 ID */
  projectId: string
  /** 卡片类型 */
  type: 'character' | 'location' | 'event' | 'item'
  /** 卡片标题 */
  title: string
  /** 卡片内容 */
  content: string
  /** 元数据 */
  metadata: Record<string, unknown>
}
```

### 2.5 AITask（AI 任务）

```typescript
type AITaskType = 'continue' | 'rewrite' | 'summary' | 'character_rewrite'

type AITaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

interface AITask {
  /** 任务唯一标识 */
  id: string
  /** 所属项目 ID */
  projectId: string
  /** 任务类型 */
  type: AITaskType
  /** 任务状态 */
  status: AITaskStatus
  /** 任务输入参数 */
  input: Record<string, unknown>
  /** 任务输出结果 */
  output?: string
  /** 错误信息 */
  error?: string
  /** 创建时间 */
  createdAt: Date
  /** 完成时间 */
  completedAt?: Date
}
```

### 2.6 AILog（AI 日志）

```typescript
type AILogLevel = 'info' | 'warn' | 'error'

interface AILog {
  /** 日志唯一标识 */
  id: string
  /** 所属任务 ID */
  taskId: string
  /** 日志时间戳 */
  timestamp: Date
  /** 日志级别 */
  level: AILogLevel
  /** 日志消息 */
  message: string
  /** 元数据 */
  metadata?: Record<string, unknown>
}
```

---

## 三、API Bridge 接口契约

### 3.1 接口列表

| 接口名称 | 方法 | 路径 | 描述 |
|----------|------|------|------|
| `getProjects` | GET | `/api/projects` | 获取项目列表 |
| `getProject` | GET | `/api/projects/{id}` | 获取单个项目 |
| `createProject` | POST | `/api/projects` | 创建项目 |
| `updateProject` | PUT | `/api/projects/{id}` | 更新项目 |
| `deleteProject` | DELETE | `/api/projects/{id}` | 删除项目 |
| `getChapters` | GET | `/api/projects/{projectId}/chapters` | 获取章节列表 |
| `getChapter` | GET | `/api/chapters/{id}` | 获取单个章节 |
| `createChapter` | POST | `/api/projects/{projectId}/chapters` | 创建章节 |
| `updateChapter` | PUT | `/api/chapters/{id}` | 更新章节 |
| `deleteChapter` | DELETE | `/api/chapters/{id}` | 删除章节 |
| `getCharacters` | GET | `/api/projects/{projectId}/characters` | 获取角色列表 |
| `getCharacter` | GET | `/api/characters/{id}` | 获取单个角色 |
| `createCharacter` | POST | `/api/projects/{projectId}/characters` | 创建角色 |
| `updateCharacter` | PUT | `/api/characters/{id}` | 更新角色 |
| `deleteCharacter` | DELETE | `/api/characters/{id}` | 删除角色 |
| `getStoryCards` | GET | `/api/projects/{projectId}/storycards` | 获取故事卡列表 |
| `getStoryCard` | GET | `/api/storycards/{id}` | 获取单个故事卡 |
| `createStoryCard` | POST | `/api/projects/{projectId}/storycards` | 创建故事卡 |
| `updateStoryCard` | PUT | `/api/storycards/{id}` | 更新故事卡 |
| `deleteStoryCard` | DELETE | `/api/storycards/{id}` | 删除故事卡 |
| `createAITask` | POST | `/api/ai/tasks` | 创建 AI 任务 |
| `getAITask` | GET | `/api/ai/tasks/{id}` | 获取 AI 任务 |
| `listAITasks` | GET | `/api/projects/{projectId}/ai/tasks` | 获取任务列表 |
| `cancelAITask` | POST | `/api/ai/tasks/{id}/cancel` | 取消 AI 任务 |

### 3.2 接口详细定义

#### 3.2.1 getProjects

**请求**：无参数  
**响应**：`Project[]`

#### 3.2.2 getChapters

**请求**：`projectId: string`  
**响应**：`Chapter[]`

#### 3.2.3 updateChapter

**请求体**：
```typescript
{
  title?: string
  content?: string
  order?: number
  status?: Chapter['status']
}
```
**响应**：`Chapter`

#### 3.2.4 createAITask

**请求体**：
```typescript
{
  projectId: string
  type: AITaskType
  context: Record<string, unknown>
}
```
**响应**：`AITask`

---

## 四、API Bridge 职责

### 4.1 核心职责

| 职责 | 描述 |
|------|------|
| **数据契约转换** | 把 StoryCanvas 后端返回的数据转换成 OpenCode 前端可用的 ViewModel |
| **隐藏后端字段差异** | 统一不同版本后端的接口差异 |
| **统一错误格式** | 标准化错误响应 |
| **统一任务状态** | 定义 AITask 状态机 |
| **支持 Mock 数据切换** | 通过配置切换 Mock/真实数据 |

### 4.2 错误处理

```typescript
interface BridgeError {
  code: string
  message: string
  details?: Record<string, unknown>
}
```

**错误码**：

| 错误码 | 描述 |
|--------|------|
| `BRIDGE_ERROR_NETWORK` | 网络错误 |
| `BRIDGE_ERROR_NOT_FOUND` | 资源未找到 |
| `BRIDGE_ERROR_VALIDATION` | 验证错误 |
| `BRIDGE_ERROR_UNAUTHORIZED` | 未授权 |
| `BRIDGE_ERROR_INTERNAL` | 内部错误 |

---

## 五、Mock 数据规范

### 5.1 Mock 数据要求

| 要求 | 说明 |
|------|------|
| **数据完整性** | Mock 数据必须包含所有必需字段 |
| **数据合理性** | Mock 数据应符合业务逻辑 |
| **数据多样性** | 提供多种场景的 Mock 数据 |
| **可切换性** | 支持 Mock/真实数据切换 |

### 5.2 Mock 数据示例

#### 项目 Mock 数据

```typescript
const mockProjects: Project[] = [
  {
    id: 'mock-project-1',
    name: '山海志异',
    description: '一部奇幻小说，讲述少年穿越到神秘世界的冒险故事',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'mock-project-2',
    name: '都市迷案',
    description: '一部悬疑推理小说',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date()
  }
]
```

#### 章节 Mock 数据

```typescript
const mockChapters: Chapter[] = [
  {
    id: 'mock-chapter-1',
    projectId: 'mock-project-1',
    title: '第一章：奇遇',
    content: '清晨的阳光透过窗户，洒在少年的脸上。他缓缓睁开眼睛，发现自己置身于一个陌生的房间...',
    order: 1,
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]
```

---

## 六、状态机定义

### 6.1 AITask 状态机

```
pending → running → completed
       ↘         ↘
        → failed  → cancelled
```

**状态转换规则**：

| 从状态 | 到状态 | 条件 |
|--------|--------|------|
| `pending` | `running` | 任务开始执行 |
| `running` | `completed` | 任务成功完成 |
| `running` | `failed` | 任务执行失败 |
| `running` | `cancelled` | 用户取消任务 |
| `pending` | `cancelled` | 用户取消任务 |

---

## 七、兼容性说明

### 7.1 向后兼容

- 新增字段必须为可选
- 字段删除必须向后兼容
- 枚举值新增必须向后兼容

### 7.2 版本控制

- 使用 API 版本前缀 `/api/v1/`
- 重大变更升级版本号

---

*文档路径：docs/planning/week1/WEEK1-STORYCANVAS-API-BRIDGE-CONTRACT.md*

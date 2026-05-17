# CREATIVE-CORE-ARCHITECTURE.md

> **角色**: 项目协调 Agent (Kimi-K2.6)  
> **任务ID**: DOC-PHASE0-010  
> **日期**: 2026-05-15  
> **版本**: v1.0  
> **状态**: [READY_FOR_REVIEW]

---

## 一、架构定位

Creative Core 是 OpenCode Creative Studio 的创作业务抽象层，负责创作项目怎么管理。它建立在 Creative Agent Runtime 之上，提供面向创作流程的业务能力。

```text
Creative Core
  ├── Novel Editor Core     — 小说编辑器（Core Product，非插件）
  ├── Project Workspace     — 项目、文件、任务、资产基础管理
  ├── Task Center           — 所有生成任务统一调度
  ├── Asset Library         — 资产对象、版本、来源、引用关系
  ├── Provider Registry     — OpenRouter/图像/视频 Provider 注册
  ├── License Gate          — 单模块付费权限校验
  └── Workflow Orchestrator — 多步骤工作流、批处理
```

---

## 二、Novel Editor Core

### 2.1 定位

Novel Editor Core 不是普通插件，而是 OpenCode Creative Studio 的基础入口和所有下游插件的内容源。

### 2.2 数据模型

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

## 三、Project Workspace

### 3.1 职责

项目、文件、任务、资产基础管理。

### 3.2 核心接口

```typescript
interface ProjectWorkspace {
  createProject(config: ProjectConfig): Promise<NovelProject>
  getProject(projectId: string): NovelProject | undefined
  updateProject(projectId: string, data: Partial<NovelProject>): Promise<NovelProject>
  deleteProject(projectId: string): Promise<void>
  listProjects(): NovelProject[]
  openProject(projectId: string): Promise<void>
  closeProject(projectId: string): Promise<void>
}
```

---

## 四、Task Center

### 4.1 职责

所有生成任务统一调度，面向用户展示任务状态。

### 4.2 核心接口

```typescript
interface TaskCenter {
  createTask(task: TaskInput): Promise<CreativeTask>
  getTask(taskId: string): CreativeTask | undefined
  cancelTask(taskId: string): Promise<void>
  retryTask(taskId: string): Promise<CreativeTask>
  listTasks(filter?: TaskFilter): CreativeTask[]
  subscribeToTask(taskId: string, handler: TaskUpdateHandler): void
}

type TaskUpdateHandler = (task: CreativeTask) => void
```

---

## 五、Asset Library

### 5.1 职责

资产对象、版本、来源、引用关系。

### 5.2 核心接口

```typescript
interface AssetLibrary {
  createAsset(asset: AssetInput): Promise<Asset>
  getAsset(assetId: string): Asset | undefined
  updateAsset(assetId: string, data: Partial<Asset>): Promise<Asset>
  deleteAsset(assetId: string): Promise<void>
  listAssets(filter?: AssetFilter): Asset[]
  createVersion(assetId: string, data: unknown): Promise<AssetVersion>
  getVersions(assetId: string): AssetVersion[]
}

interface Asset {
  id: string
  type: string
  name: string
  projectId: string
  sceneId?: string
  shotId?: string
  versions: AssetVersion[]
  references: AssetReference[]
  createdAt: Date
  updatedAt: Date
}

interface AssetVersion {
  version: number
  data: unknown
  createdAt: Date
  source: string
}

interface AssetReference {
  assetId: string
  relation: 'parent' | 'child' | 'related'
}
```

---

## 六、Provider Registry

### 6.1 职责

OpenRouter/图像/视频 Provider 注册。

### 6.2 核心接口

```typescript
interface ProviderRegistry {
  register(provider: ProviderDefinition): void
  unregister(providerId: string): void
  getProvider(providerId: string): ProviderDefinition | undefined
  listProviders(): ProviderDefinition[]
}

interface ProviderDefinition {
  id: string
  name: string
  type: 'llm' | 'image' | 'video' | 'tts' | 'ffmpeg'
  inputSchema: JSONSchema
  outputSchema: JSONSchema
  errorSchema: JSONSchema
  execute: (input: unknown, context: ProviderContext) => Promise<ProviderResult>
}
```

---

## 七、License Gate

### 7.1 职责

单模块付费权限校验。

### 7.2 核心接口

```typescript
interface LicenseGate {
  check(pluginId: string, feature?: string): LicenseGateResult
  getLicenseInfo(pluginId: string): LicenseInfo
}

type LicenseGateResult = {
  allowed: boolean
  reason?: 'not_installed' | 'trial_expired' | 'license_missing' | 'quota_exceeded'
  upgradeUrl?: string
}

interface LicenseInfo {
  pluginId: string
  status: 'not_installed' | 'trial' | 'purchased' | 'expired' | 'quota_exceeded'
  trialDaysLeft?: number
  expiryDate?: Date
  quotaUsed?: number
  quotaTotal?: number
}
```

---

## 八、Workflow Orchestrator

### 8.1 职责

多步骤工作流、批处理、子 Agent 协作。

### 8.2 核心接口

```typescript
interface WorkflowOrchestrator {
  createWorkflow(definition: WorkflowDefinition): Promise<Workflow>
  executeWorkflow(workflowId: string): Promise<WorkflowResult>
  cancelWorkflow(workflowId: string): Promise<void>
  getWorkflow(workflowId: string): Workflow | undefined
}

interface WorkflowDefinition {
  id: string
  name: string
  steps: WorkflowStep[]
}

interface WorkflowStep {
  id: string
  type: 'task' | 'parallel' | 'condition' | 'loop'
  taskType?: string
  skillName?: string
  pluginId?: string
  condition?: string
  nextSteps: string[]
}
```

---

*[READY_FOR_REVIEW]*

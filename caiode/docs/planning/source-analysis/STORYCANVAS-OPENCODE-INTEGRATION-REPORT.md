# StoryCanvas 与 OpenCode 前端移植架构调研报告（修订版）

**生成时间**：2026-05-15  
**修订版本**：v2.0（后端隔离，前端移植）  
**分析目标**：评估 StoryCanvas 前端移植到 OpenCode 的技术可行性和融合度

---

## 一、核心策略变更

### 原策略 vs 新策略

| 对比项 | 原策略（完全融合） | 新策略（后端隔离） |
|--------|------------------|-------------------|
| **后端** | Python → TypeScript 重写 | ✅ 保持 Python 独立 |
| **前端** | React → Solid.js 重写 | 🔄 React → Solid.js 迁移 |
| **架构** | Monorepo 融合 | 微前端 + API 网关 |
| **部署** | 统一部署 | 后端 + 前端独立部署 |
| **工作量** | ~7 周 | ~4 周 |
| **复杂度** | 高 | 中 |

---

## 二、新架构图

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          架构图：后端隔离 + 前端移植                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌─────────────────────────────┐        ┌─────────────────────────────┐        │
│   │      StoryCanvas Backend    │        │        OpenCode Core        │        │
│   │        (Python + FastAPI)    │        │   (TypeScript + Effect)     │        │
│   │                               │        │                               │        │
│   │   ┌─────────────────────┐   │        │   ┌─────────────────────┐   │        │
│   │   │   Narrative Engine   │   │        │   │    Provider System   │   │        │
│   │   │   Story Cards API    │   │        │   │    Agent System     │   │        │
│   │   │   Block System API   │   │        │   │    Tool System      │   │        │
│   │   └─────────────────────┘   │        │   └─────────────────────┘   │        │
│   │            │                │        │            │                  │        │
│   └────────────┼────────────────┘        └────────────┼──────────────────┘        │
│                │                                      │                          │
│                │  REST API / WebSocket                 │                          │
│                └──────────────────┬───────────────────┘                          │
│                                   │                                              │
│                                   ▼                                              │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                      API Gateway / Bridge Layer                           │   │
│   │                                                                          │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│   │   │  Auth Proxy  │  │  API Router  │  │ WS Bridge   │  │  Rate Lim │  │   │
│   │   └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                        │
│                                       ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                     OpenCode + StoryCanvas Frontend                      │   │
│   │                         (Solid.js + TanStack Query)                      │   │
│   │                                                                          │   │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│   │   │                      StoryCanvas UI Layer                        │   │   │
│   │   │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │   │   │
│   │   │  │   Canvas   │  │   Block    │  │   Story    │  │ Narrative│ │   │   │
│   │   │  │   Editor   │  │   Editor   │  │   Card     │  │  Panel   │ │   │   │
│   │   │  └────────────┘  └────────────┘  └────────────┘  └──────────┘ │   │   │
│   │   └─────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                          │   │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│   │   │                      OpenCode Base UI                             │   │   │
│   │   │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │   │   │
│   │   │  │  Sidebar   │  │  Terminal  │  │  Settings  │  │  Theme   │ │   │   │
│   │   │  └────────────┘  └────────────┘  └────────────┘  └──────────┘ │   │   │
│   │   └─────────────────────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 三、融合度评估（修订版）

### 3.1 技术栈兼容性

| 模块 | StoryCanvas | OpenCode | 兼容性 | 融合策略 |
|------|-------------|----------|--------|----------|
| **前端框架** | React 18 | Solid.js | 🟡 中 | 🔄 迁移 |
| **状态管理** | Zustand | TanStack Query | 🟢 高 | ✅ 对接 API |
| **数据库** | SQLite | SQLite (Drizzle) | 🟢 高 | ✅ 独立 |
| **后端语言** | Python + FastAPI | TypeScript + Hono | 🟢 高 | ✅ 独立 |
| **AI Provider** | 自实现 | @ai-sdk | 🟢 高 | ✅ API 调用 |
| **构建工具** | Vite | Vite + Turborepo | 🟢 高 | ✅ 复用 |

**融合度得分**：4.2 / 5（高）

### 3.2 功能模块对应关系（修订版）

| StoryCanvas 模块 | OpenCode 对应模块 | 可复用度 | 说明 |
|-----------------|------------------|---------|------|
| Canvas Editor | 新开发 | 🟡 中 | 核心功能 |
| Block System | Tool System | 🟢 高 | 通过 API 调用 |
| Story Card | 新开发 | 🟡 中 | UI 组件 |
| Narrative Panel | Session UI | 🟢 高 | 复用布局 |
| Canvas UI | Session UI | 🟡 中 | 需适配 |
| Python Backend | - | ✅ 独立 | 保持不变 |
| LLM Integration | Provider System | 🟢 高 | API 对接 |

---

## 四、API 网关设计

### 4.1 通信架构

```
┌─────────────────┐                    ┌─────────────────┐
│  StoryCanvas    │                    │    OpenCode     │
│    Backend      │                    │    Frontend     │
│   (Python)      │                    │   (Solid.js)    │
│                 │                    │                 │
│  ┌───────────┐  │                    │  ┌───────────┐  │
│  │   FastAPI │  │◄─── REST API ────►│  │  API      │  │
│  └───────────┘  │                    │  │  Client   │  │
│        │        │                    │  └───────────┘  │
│        │        │◄── WebSocket ─────►│        │      │
│  ┌───────────┐  │                    │  ┌───────────┐  │
│  │  WebSocket│  │                    │  │  WS       │  │
│  │   Server  │  │                    │  │  Client   │  │
│  └───────────┘  │                    │  └───────────┘  │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         │  或通过 OpenCode Plugin API           │
         │  ┌────────────────────────────┐     │
         │  │   StoryCanvas Plugin        │     │
         │  │   (作为 OpenCode Extension) │     │
         │  └────────────────────────────┘     │
         │                                      │
         └──────────────────────────────────────┘
```

### 4.2 API 接口设计

```typescript
// OpenCode 插件中定义 StoryCanvas API 客户端
// packages/opencode-plugin-storycanvas/src/api-client.ts

import { Hono } from 'hono'
import { createProxyMiddleware } from 'hono-proxy'

// 代理 StoryCanvas 后端 API
const storyCanvasProxy = createProxyMiddleware({
  target: process.env.STORYCANVAS_BACKEND_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/storycanvas': '' }
})

// API 路由
export const storyCanvasRoutes = new Hono()
  // 代理后端 API
  .all('/storycanvas/*', storyCanvasProxy)
  
  // 前端专用接口
  .get('/storycanvas/status', async (c) => {
    const backendUrl = process.env.STORYCANVAS_BACKEND_URL
    const response = await fetch(`${backendUrl}/health`)
    return c.json(await response.json())
  })
  
  // WebSocket 升级代理
  .ws('/storycanvas/ws', async (ctx) => {
    const backendUrl = process.env.STORYCANVAS_BACKEND_URL
    const ws = new WebSocket(`${backendUrl}/ws`)
    
    // 双向代理
    ctx.send(ws)
    ws.onmessage = (event) => ctx.send(event.data)
  })
```

### 4.3 前端 API 客户端

```typescript
// packages/app/src/novel/api/storycanvas-client.ts

import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '../../../../storycanvas-reference/backend/api/trpc'

// 创建 StoryCanvas API 客户端
export const storyCanvasClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/storycanvas/trpc',
    })
  ]
})

// 使用示例
export const api = {
  // 块操作
  blocks: {
    list: (projectId: string) => 
      storyCanvasClient.blocks.list.query({ projectId }),
    create: (input: CreateBlockInput) => 
      storyCanvasClient.blocks.create.mutate(input),
    update: (id: string, input: UpdateBlockInput) => 
      storyCanvasClient.blocks.update.mutate({ id, ...input }),
    delete: (id: string) => 
      storyCanvasClient.blocks.delete.mutate({ id }),
  },
  
  // 连接操作
  connections: {
    list: (projectId: string) => 
      storyCanvasClient.connections.list.query({ projectId }),
    create: (input: CreateConnectionInput) => 
      storyCanvasClient.connections.create.mutate(input),
  },
  
  // 叙事操作
  narrative: {
    generate: (blockId: string, context: NarrativeContext) => 
      storyCanvasClient.narrative.generate.mutate({ blockId, context }),
    continue: (blockId: string) => 
      storyCanvasClient.narrative.continue.mutate({ blockId }),
  },
  
  // 故事卡
  storyCards: {
    list: (projectId: string) => 
      storyCanvasClient.storyCards.list.query({ projectId }),
    create: (input: CreateStoryCardInput) => 
      storyCanvasClient.storyCards.create.mutate(input),
    update: (id: string, input: UpdateStoryCardInput) => 
      storyCanvasClient.storyCards.update.mutate({ id, ...input }),
  }
}
```

---

## 五、前端移植策略

### 5.1 React → Solid.js 迁移映射

| StoryCanvas (React) | OpenCode (Solid.js) | 迁移方式 |
|--------------------|-------------------|----------|
| `useState` | `createSignal` | 直接替换 |
| `useEffect` | `createEffect` | 直接替换 |
| `useContext` | `createContext` + `use` | 略有差异 |
| `useSelector` | `from` | 差异较大 |
| `useDispatch` | 直接调用 | 差异较大 |
| `useStore` | `createStore` | 功能相似 |
| `useCallback` | `createMemo` | 功能相似 |
| `React.forwardRef` | `mergeProps` | 差异较大 |
| `React.memo` | `memo` | 功能相同 |

### 5.2 组件迁移示例

#### 块编辑器迁移

**StoryCanvas (React)**：
```tsx
// storycanvas-reference/frontend/src/components/BlockEditor.tsx
import { useState, useCallback } from 'react'
import { Block } from '../types'

export const BlockEditor = ({ block }: { block: Block }) => {
  const [content, setContent] = useState(block.content)
  const [isEditing, setIsEditing] = useState(false)
  
  const handleSave = useCallback(() => {
    api.blocks.update(block.id, { content })
    setIsEditing(false)
  }, [block.id, content])
  
  return (
    <div className="block-editor">
      {isEditing ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleSave}
        />
      ) : (
        <div onClick={() => setIsEditing(true)}>
          {content}
        </div>
      )}
    </div>
  )
}
```

**OpenCode (Solid.js) - 迁移后**：
```tsx
// packages/app/src/novel/components/BlockEditor.tsx
import { createSignal, Show } from 'solid-js'
import { api } from '../api/storycanvas-client'
import type { Block } from '../types'

export const BlockEditor = (props: { block: Block }) => {
  const [content, setContent] = createSignal(props.block.content)
  const [isEditing, setIsEditing] = createSignal(false)
  
  const handleSave = () => {
    api.blocks.update(props.block.id, { content: content() })
    setIsEditing(false)
  }
  
  return (
    <div class="block-editor">
      <Show
        when={isEditing()}
        fallback={
          <div onClick={() => setIsEditing(true)}>
            {content()}
          </div>
        }
      >
        <textarea
          value={content()}
          onInput={(e) => setContent(e.currentTarget.value)}
          onBlur={handleSave}
        />
      </Show>
    </div>
  )
}
```

### 5.3 状态管理迁移

**StoryCanvas (Zustand)**：
```typescript
// storycanvas-reference/frontend/src/store/canvasStore.ts
import { create } from 'zustand'

interface CanvasState {
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  addNode: (node: Node) => void
  removeNode: (id: string) => void
  setSelectedNode: (id: string | null) => void
}

export const useCanvasStore = create<CanvasState>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  addNode: (node) => set((state) => ({ 
    nodes: [...state.nodes, node] 
  })),
  removeNode: (id) => set((state) => ({ 
    nodes: state.nodes.filter(n => n.id !== id) 
  })),
  setSelectedNode: (id) => set({ selectedNodeId: id })
}))
```

**OpenCode (Solid.js Store + API)**：
```typescript
// packages/app/src/novel/context/canvas-store.ts
import { createStore } from 'solid-js/store'
import { api } from '../api/storycanvas-client'

interface CanvasState {
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  isLoading: boolean
}

const [canvasStore, setCanvasStore] = createStore<CanvasState>({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isLoading: false
})

export const useCanvasStore = () => {
  const loadProject = async (projectId: string) => {
    setCanvasStore('isLoading', true)
    
    // 通过 API 加载
    const [nodes, edges] = await Promise.all([
      api.blocks.list(projectId),
      api.connections.list(projectId)
    ])
    
    setCanvasStore({
      nodes,
      edges,
      isLoading: false
    })
  }
  
  const addNode = async (node: Node) => {
    setCanvasStore('nodes', (nodes) => [...nodes, node])
    await api.blocks.create({ ...node, projectId: node.projectId })
  }
  
  const removeNode = async (id: string) => {
    setCanvasStore('nodes', (nodes) => nodes.filter(n => n.id !== id))
    await api.blocks.delete(id)
  }
  
  const setSelectedNode = (id: string | null) => {
    setCanvasStore('selectedNodeId', id)
  }
  
  return {
    store: canvasStore,
    loadProject,
    addNode,
    removeNode,
    setSelectedNode
  }
}
```

---

## 六、技术风险评估（修订版）

| 风险项 | 概率 | 影响 | 缓解措施 |
|--------|------|------|----------|
| ReactFlow 无 Solid.js 版本 | 高 | 中 | 使用 `@xyflow/solid` |
| API 延迟影响体验 | 中 | 中 | 本地缓存 +乐观更新 |
| 跨域/CORS 问题 | 低 | 高 | API Gateway 代理 |
| WebSocket 断连 | 中 | 中 | 自动重连机制 |
| 状态同步一致性 | 低 | 高 | 使用 TanStack Query |

---

## 七、工作量估算（修订版）

### 7.1 代码行数统计

| 模块 | 工作内容 | 预计行数 | 说明 |
|------|----------|----------|------|
| API 客户端 | StoryCanvas API 封装 | 500 行 | TypeScript |
| Canvas 组件 | 画布编辑器 | 1500 行 | 核心迁移 |
| Block 组件 | 块编辑器 | 800 行 | UI 迁移 |
| Story Card UI | 卡牌界面 | 500 行 | UI 迁移 |
| Context/Store | 状态管理 | 300 行 | Solid.js |
| 样式迁移 | CSS 适配 | 500 行 | Tailwind |
| **合计** | | **~4100 行** | |

### 7.2 时间估算

| 阶段 | 任务 | 预计工时 |
|------|------|----------|
| Phase 1 | API 客户端 + 基础配置 | 3 天 |
| Phase 2 | Canvas Engine + Block System | 5 天 |
| Phase 3 | Story Card UI + Narrative Panel | 3 天 |
| Phase 4 | 样式迁移 + 响应式适配 | 2 天 |
| Phase 5 | 集成测试 + Bug 修复 | 2 天 |
| **总计** | | **~15 天 (3 周)** |

---

## 八、结论与建议（修订版）

### 8.1 融合度评估（修订版）

| 维度 | 原评分 | 新评分 | 说明 |
|------|--------|--------|------|
| 技术栈兼容性 | 3/5 | 4.5/5 | 后端独立，无冲突 |
| 功能复用度 | 3.5/5 | 4/5 | UI 组件可复用 |
| UI 迁移难度 | 2.5/5 | 3/5 | React → Solid.js 简化 |
| 数据层兼容性 | 4.5/5 | 5/5 | 完全独立 |
| **综合评分** | **3.4/5** | **4.2/5** | **高可行性** |

### 8.2 最终结论

✅ **StoryCanvas 前端移植到 OpenCode 技术上高度可行**

**可行性依据**：
1. 后端保持独立，无语言重写风险
2. 前端通过 API 与后端通信，架构清晰
3. OpenCode 的 Provider/Agent 系统仍可复用
4. Canvas 功能使用 `@xyflow/solid` 可实现
5. 工作量从 ~7 周降低到 ~3 周

### 8.3 推荐实施路径

```
Week 1: 基础搭建
  Day 1-2: 项目配置 + API 客户端开发
  Day 3-5: Canvas Engine 基础实现

Week 2: 核心功能
  Day 1-2: Block System 实现
  Day 3-4: Story Card UI 开发
  Day 5: Narrative Panel 集成

Week 3: 集成优化
  Day 1-2: 样式迁移 + 响应式适配
  Day 3-4: 集成测试 + Bug 修复
  Day 5: 文档完善 + 演示
```

---

## 九、附录：文件迁移对照表

| StoryCanvas 文件 | 迁移目标 | 工作类型 |
|-----------------|----------|----------|
| `frontend/src/components/Canvas/` | `packages/app/src/novel/components/Canvas/` | 迁移 + 适配 |
| `frontend/src/components/BlockEditor/` | `packages/app/src/novel/components/BlockEditor/` | 迁移 + 重写 |
| `frontend/src/components/StoryCard/` | `packages/app/src/novel/components/StoryCard/` | 迁移 + 重写 |
| `frontend/src/components/NarrativePanel/` | `packages/app/src/novel/components/NarrativePanel/` | 迁移 + 重写 |
| `frontend/src/store/` | `packages/app/src/novel/context/` | 替换架构 |
| `frontend/src/api/` | 新建 API 客户端 | 新开发 |
| `backend/` | 保持不变 | ✅ 独立 |
| `frontend/package.json` | 合并到 opencode | 配置调整 |

---

*本报告基于 StoryCanvas 和 OpenCode v1.4.0 源码分析生成*
*修订版本 v2.0 - 后端隔离，前端移植策略*

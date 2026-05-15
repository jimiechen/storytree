# StoryCanvas 与 OpenCode 架构融合度调研报告

**生成时间**：2026-05-15  
**分析目标**：评估 StoryCanvas 移植到 OpenCode 的技术可行性和融合度

---

## 一、项目概述

### 1.1 StoryCanvas（被移植方）

**定位**：自由画布叙事创作系统

**核心功能**：
- 画布式叙事块编辑（35种块类型）
- 故事卡体系（11张卡牌）
- 五层 Agent 写作管线
- 多 LLM 提供商支持
- 三层保存机制（实时/快照/检查点）

**技术栈**：
| 层级 | 技术 |
|------|------|
| 后端 | Python + FastAPI |
| 前端 | React + ReactFlow + Zustand |
| 数据库 | SQLite |
| AI | 多 Provider（DeepSeek/OpenAI/Claude/Gemini/Ollama） |
| 构建 | Vite |

### 1.2 OpenCode（目标平台）

**定位**：AI 驱动的开发工具

**核心功能**：
- AI Agent 对话
- Workspace 管理
- 多 Provider 支持
- 文件系统操作
- 插件扩展系统

**技术栈**：
| 层级 | 技术 |
|------|------|
| 后端 | TypeScript + Hono + Effect |
| 前端 | Solid.js + TanStack Query |
| 数据库 | SQLite (Drizzle ORM) |
| AI | 多 Provider (@ai-sdk) |
| 构建 | Vite + Turborepo |
| 桌面 | Tauri v2 |

---

## 二、架构对比图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           目标架构：OpenCode 二次开发                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         OpenCode 核心层                               │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │   Provider  │ │   Agent    │ │    Tool     │ │   Session   │   │   │
│  │  │   System    │ │   System    │ │   System    │ │   Manager   │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│  ┌───────────────────────────────────┼───────────────────────────────────┐   │
│  │                    StoryCanvas 插件层                                │   │
│  │                                                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                    StoryCanvas Core                           │   │   │
│  │  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐ │   │   │
│  │  │  │  Canvas    │ │   Block    │ │   Story    │ │ Narrative │ │   │   │
│  │  │  │   Engine   │ │   System   │ │    Card    │ │  Pipeline│ │   │   │
│  │  │  └────────────┘ └────────────┘ └────────────┘ └──────────┘ │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                       │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        UI 适配层                                     │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │    StoryCanvas UI (React)  ── 适配 ──▶  OpenCode UI (Solid)  │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 三、融合度评估矩阵

### 3.1 技术栈兼容性

| 模块 | StoryCanvas | OpenCode | 兼容性 | 融合策略 |
|------|-------------|----------|--------|----------|
| **后端语言** | Python | TypeScript | 🔴 低 | ⚠️ 重写 |
| **前端框架** | React 18 | Solid.js | 🟡 中 | 🔄 迁移 |
| **状态管理** | Zustand | TanStack Query | 🟡 中 | 🔄 替换 |
| **数据库** | SQLite (原生) | SQLite (Drizzle) | 🟢 高 | ✅ 复用 |
| **AI Provider** | 自实现 | @ai-sdk | 🟢 高 | ✅ 对接 |
| **构建工具** | Vite | Vite + Turborepo | 🟢 高 | ✅ 复用 |

**融合度得分**：3.5 / 5（中等偏高）

### 3.2 功能模块对应关系

| StoryCanvas 模块 | OpenCode 对应模块 | 可复用度 | 说明 |
|-----------------|------------------|---------|------|
| Canvas Engine | - | 🔴 低 | 需全新开发 |
| Block System | Tool System | 🟡 中 | 可借鉴 Tool 接口 |
| Story Card | - | 🟡 中 | 需全新开发 |
| Narrative Pipeline | Agent System | 🟢 高 | 可复用 Agent 框架 |
| LLM Integration | Provider System | 🟢 高 | 可直接对接 |
| Canvas UI | Session UI | 🟡 中 | 需适配 Solid.js |
| Storage | Storage Layer | 🟢 高 | 可复用 |

### 3.3 核心差异分析

#### 🔴 Python → TypeScript 差异

**StoryCanvas 后端（Python）**：
```python
# backend/main.py
from fastapi import FastAPI
from backend.api import projects, blocks, connections

app = FastAPI()
app.include_router(projects.router)
app.include_router(blocks.router)
```

**OpenCode 后端（TypeScript）**：
```typescript
// packages/opencode/src/server/server.ts
import { Hono } from 'hono'
import { apiRoutes } from './routes'

const app = new Hono()
app.route('/api', apiRoutes)
```

**融合难度**：🔴 **高** - 后端需完全重写

#### 🟡 React → Solid.js 差异

**StoryCanvas 前端（React）**：
```tsx
// React 组件
import { useState } from 'react'
import ReactFlow from 'reactflow'

const Canvas = () => {
  const [nodes, setNodes] = useState([])
  return <ReactFlow nodes={nodes} />
}
```

**OpenCode 前端（Solid.js）**：
```tsx
// Solid.js 组件
import { createSignal } from 'solid-js'
import { For, Show } from 'solid-js/web'

const Canvas = () => {
  const [nodes, setNodes] = createSignal<Node[]>([])
  return <ReactFlow nodes={nodes()} />
}
```

**融合难度**：🟡 **中** - UI 组件需迁移

#### 🟢 数据库层

**StoryCanvas（直接 SQL）**：
```python
conn.execute("SELECT * FROM blocks WHERE project_id = ?", (project_id,))
```

**OpenCode（Drizzle ORM）**：
```typescript
import { db } from './db'
await db.select().from(blocks).where(eq(blocks.projectId, projectId))
```

**融合难度**：🟢 **低** - 可直接复用 Drizzle ORM

---

## 四、推荐移植策略

### 4.1 架构分层策略

```
┌────────────────────────────────────────────────────────────────────────┐
│                          分层移植策略                                     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Layer 1: 数据层 (最高复用)                                              │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  ✅ 复用 OpenCode 的 Drizzle ORM + SQLite                       │    │
│  │  ✅ 定义 StoryCanvas 数据模型 (blocks, connections, projects)   │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                    │                                   │
│  Layer 2: 业务层 (部分复用)                                              │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  🔄 重写 Narrative Pipeline (Python → TypeScript)              │    │
│  │  🔄 适配 Story Card System                                     │    │
│  │  ✅ 复用 OpenCode Provider System (LLM)                        │    │
│  │  🔄 重写 Canvas Engine (ReactFlow → 自研/Solid适配)            │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                    │                                   │
│  Layer 3: Agent 层 (高复用)                                             │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  ✅ 复用 OpenCode Agent System                                 │    │
│  │  ✅ 定义 StoryCanvas 专用 Agent (narrative-writer, etc.)      │    │
│  │  ✅ 复用 Tool 接口定义                                         │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                    │                                   │
│  Layer 4: UI 层 (完全重写)                                             │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  🔄 重写 Canvas UI (React → Solid.js)                         │    │
│  │  🔄 重写 Block Editor (React → Solid.js)                      │    │
│  │  🔄 重写 Sidebar Panels (React → Solid.js)                    │    │
│  │  ✅ 复用 OpenCode Layout/Theme System                          │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.2 移植优先级

| 优先级 | 模块 | 工作量 | 说明 |
|-------|------|--------|------|
| P0 | 数据模型定义 | 小 | 定义 blocks, connections, projects 表结构 |
| P0 | Provider 对接 | 小 | 直接使用 OpenCode Provider |
| P1 | Narrative Pipeline | 大 | 重写五层 Agent 管线 |
| P1 | Canvas Engine | 大 | 核心画布功能 |
| P1 | Block System | 中 | 块编辑逻辑 |
| P2 | UI 迁移 | 大 | React → Solid.js |
| P2 | Story Card System | 中 | 卡牌体系 |

---

## 五、技术风险评估

| 风险项 | 概率 | 影响 | 缓解措施 |
|--------|------|------|----------|
| ReactFlow 无 Solid.js 版本 | 高 | 中 | 使用 `@xyflow/solid` 或自研 Canvas |
| Python 后端逻辑重写 | 高 | 高 | 优先移植核心算法，简化非核心功能 |
| 状态管理差异 | 中 | 中 | 使用 Solid.js createStore |
| React 组件库复用 | 中 | 中 | 使用 Solid.js 等效库或重写 |
| 性能差异 | 低 | 中 | 充分测试 ReactFlow 替代品 |

### 5.1 关键技术难点

#### 难点 1: Canvas 组件

**问题**：ReactFlow 无官方 Solid.js 版本

**解决方案**：
```
方案 A: 使用 @xyflow/solid (官方 Solid.js 适配)
  - 优点: 官方支持
  - 缺点: 功能可能不完整

方案 B: 使用 Interact.js + 自研 Canvas
  - 优点: 完全可控
  - 缺点: 开发量大

方案 C: 封装 ReactFlow 为 Web Component
  - 优点: 可复用现有实现
  - 缺点: 通信复杂

推荐: 方案 A (优先) → 方案 B (备选)
```

#### 难点 2: 状态管理

**问题**：Zustand 与 Solid.js 不兼容

**解决方案**：
```typescript
// StoryCanvas (Zustand)
const useCanvasStore = create((set) => ({
  nodes: [],
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] }))
}))

// OpenCode (Solid.js)
import { createStore } from 'solid-js/store'

const [canvasStore, setCanvasStore] = createStore({
  nodes: []
})
```

---

## 六、移植工作量估算

### 6.1 代码行数统计

| 模块 | StoryCanvas | 预计重写 | 说明 |
|------|-------------|----------|------|
| 后端 Python | ~3000 行 | ~2000 行 | 简化版重写 |
| 前端 React | ~5000 行 | ~4000 行 | 功能等效迁移 |
| 合计 | ~8000 行 | ~6000 行 | |

### 6.2 时间估算

| 阶段 | 任务 | 预计工时 |
|------|------|----------|
| Phase 1 | 数据模型 + Provider 对接 | 1 周 |
| Phase 2 | Narrative Pipeline 重写 | 2 周 |
| Phase 3 | Canvas Engine + Block System | 2 周 |
| Phase 4 | UI 迁移 + 集成测试 | 2 周 |
| **总计** | | **7 周** |

---

## 七、结论与建议

### 7.1 融合度评估

| 维度 | 得分 | 说明 |
|------|------|------|
| 技术栈兼容性 | 3/5 | Python 重写难度大 |
| 功能复用度 | 3.5/5 | Agent/Provider 可复用 |
| UI 迁移难度 | 2.5/5 | React → Solid.js 工作量大 |
| 数据层兼容性 | 4.5/5 | SQLite + Drizzle 可直接复用 |
| **综合评分** | **3.4/5** | **中等偏高，可行** |

### 7.2 最终结论

✅ **StoryCanvas 移植到 OpenCode 技术上可行**

**可行性依据**：
1. OpenCode 的 Provider/Agent 系统可以完全复用
2. 数据库层可直接使用 Drizzle ORM
3. 画布功能可使用 @xyflow/solid 实现
4. 分层架构设计清晰，便于逐步移植

⚠️ **主要挑战**：
1. 后端 Python → TypeScript 完全重写
2. UI 层 React → Solid.js 迁移
3. Canvas 组件需寻找合适的 Solid.js 替代

### 7.3 建议实施路径

```
Step 1: 基础层 (Week 1)
  ├── 定义 StoryCanvas 数据模型
  ├── 对接 OpenCode Provider System
  └── 搭建基础插件框架

Step 2: 核心业务 (Week 2-3)
  ├── 重写 Narrative Pipeline (TypeScript)
  ├── 实现 Block System
  └── 实现 Story Card System

Step 3: Canvas 功能 (Week 4-5)
  ├── 集成 @xyflow/solid
  ├── 实现 Canvas Engine
  └── 实现 Block Editor

Step 4: UI 集成 (Week 6-7)
  ├── 迁移 UI 到 Solid.js
  ├── 集成到 OpenCode Layout
  └── 端到端测试

Step 5: 优化发布 (Week 8)
  ├── 性能优化
  ├── 文档完善
  └── Alpha 发布
```

---

## 附录：关键文件对照表

| StoryCanvas 文件 | OpenCode 对应 | 融合策略 |
|-----------------|--------------|----------|
| `backend/main.py` | `packages/opencode/src/server/server.ts` | 重写 |
| `backend/api/` | `packages/opencode/src/server/routes/` | 重写 |
| `backend/narrative/` | `packages/opencode/src/agent/` | 适配复用 |
| `backend/llm/` | `packages/opencode/src/provider/` | 直接复用 |
| `backend/story_cards/` | 新建 `novel/story-cards/` | 新开发 |
| `frontend/src/` | `packages/app/src/` | 重写 |
| `frontend/store/` | `packages/app/src/context/` | 替换 |
| `frontend/components/Canvas` | `packages/app/src/components/` | 重写 |

---

*本报告基于 StoryCanvas 和 OpenCode v1.4.0 源码分析生成*

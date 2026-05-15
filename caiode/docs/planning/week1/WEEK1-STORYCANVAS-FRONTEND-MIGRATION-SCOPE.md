# Week 1 StoryCanvas 前端迁移范围文档

**生成时间**：2026-05-15  
**所属阶段**：Phase 0（评审修订）  
**对应报告**：STORYCANVAS-OPENCODE-INTEGRATION-REPORT.md

---

## 一、迁移范围概述

### 1.1 目标

Week 1 的目标是验证小说编辑器前端、StoryCanvas API Bridge、FakeAgentProvider 和最小创作闭环。不迁移完整 Canvas，不接真实模型，不启用真实工具执行。

### 1.2 范围边界

| 类别 | 包含 | 排除 |
|------|------|------|
| **UI 组件** | 故事卡、角色卡、章节编辑器、AI 任务面板、AI 结果卡片、AI 日志抽屉 | Canvas 编辑器、ReactFlow、实时协同 |
| **数据层** | Mock 数据、API Bridge、Provider 层 | 真实后端 API、真实数据库 |
| **AI 能力** | FakeAgentProvider | 真实 LLM、代码智能体工具链 |
| **基础设施** | API Bridge、Mock Adapter | 微前端、API Gateway、生产级鉴权 |

---

## 二、组件迁移清单

### 2.1 优先迁移组件

| 组件名称 | 来源文件 | 目标文件 | 难度 | 描述 |
|----------|----------|----------|------|------|
| **StoryCard** | `storycanvas-reference/frontend/src/components/StoryCard/` | `packages/app/src/novel/components/StoryCard/` | 中 | 故事卡展示组件 |
| **CharacterCard** | `storycanvas-reference/frontend/src/components/CharacterCard/` | `packages/app/src/novel/components/CharacterCard/` | 中 | 角色卡展示组件 |
| **ChapterEditor** | `storycanvas-reference/frontend/src/components/ChapterEditor/` | `packages/app/src/novel/components/ChapterEditor/` | 中 | 章节编辑器 |
| **AITaskPanel** | 新建 | `packages/app/src/novel/components/AITaskPanel/` | 低 | AI 任务面板（Mock 模式） |
| **AIResultCard** | 新建 | `packages/app/src/novel/components/AIResultCard/` | 低 | AI 结果卡片 |
| **AILogDrawer** | 新建 | `packages/app/src/novel/components/AILogDrawer/` | 低 | AI 日志抽屉 |
| **NovelWorkspace** | 新建 | `packages/app/src/novel/components/NovelWorkspace/` | 低 | 小说项目工作台 |

### 2.2 暂缓迁移组件

| 组件名称 | 原因 | 建议阶段 |
|----------|------|----------|
| **CanvasEditor** | ReactFlow 无 Solid.js 版本，复杂度高 | Phase 3 |
| **FlowCanvas** | 依赖 ReactFlow，迁移成本高 | Phase 3 |
| **CollaborativeEditor** | 实时协同，复杂度高 | Phase 4 |
| **WebSocketHandler** | 实时通信，非 MVP 核心 | Phase 4 |

---

## 三、状态管理迁移

### 3.1 Zustand → Solid.js 映射

| StoryCanvas (Zustand) | OpenCode (Solid.js) | 策略 |
|----------------------|-------------------|------|
| `create()` | `createStore()` | 直接替换 |
| `set()` | `setStore()` | 直接替换 |
| `useStore()` | 直接访问 store | 直接替换 |
| `persist()` | LocalStorage 手动实现 | 简化处理 |

### 3.2 状态管理文件

| 原文件 | 目标文件 | 状态 |
|--------|----------|------|
| `store/canvasStore.ts` | `context/canvas-store.ts` | 简化版 |
| `store/projectStore.ts` | `context/project-store.ts` | 新建 |
| `store/chapterStore.ts` | `context/chapter-store.ts` | 新建 |
| `store/characterStore.ts` | `context/character-store.ts` | 新建 |
| `store/aiTaskStore.ts` | `context/ai-task-store.ts` | 新建 |

---

## 四、API Bridge 范围

### 4.1 接口覆盖

| 接口类别 | 接口名称 | Mock | 真实 |
|----------|----------|------|------|
| **项目** | `getProjects()` | ✅ | ❌ |
| **章节** | `getChapters()` | ✅ | ❌ |
| **章节** | `updateChapter()` | ✅ | ❌ |
| **角色** | `getCharacters()` | ✅ | ❌ |
| **故事卡** | `getStoryCards()` | ✅ | ❌ |
| **AI 任务** | `createAITask()` | ✅ | ❌ |
| **AI 任务** | `getAITask()` | ✅ | ❌ |
| **AI 任务** | `listAITasks()` | ✅ | ❌ |

### 4.2 数据契约

见 WEEK1-STORYCANVAS-API-BRIDGE-CONTRACT.md

---

## 五、FakeAgentProvider 能力范围

### 5.1 支持的任务类型

| 任务类型 | 描述 | Mock 实现 |
|----------|------|----------|
| `continue` | 续写章节 | ✅ |
| `rewrite` | 改写章节 | ✅ |
| `summary` | 章节摘要 | ✅ |
| `character_rewrite` | 角色语气改写 | ✅ |

### 5.2 模拟结果分布

| 结果类型 | 概率 | 说明 |
|----------|------|------|
| 成功 | 80% | 返回模拟生成内容 |
| 失败 | 10% | 返回错误信息 |
| 取消 | 10% | 返回取消状态 |

---

## 六、样式迁移

### 6.1 CSS 方案

| 原方案 | 目标方案 | 说明 |
|--------|----------|------|
| Tailwind CSS 3 | Tailwind CSS 3 | 直接复用 |
| 自定义主题 | OpenCode 主题系统 | 适配 |
| 响应式设计 | 保持一致 | 复用 |

### 6.2 样式文件

| 原文件 | 目标文件 | 状态 |
|--------|----------|------|
| `src/index.css` | `packages/app/src/novel/index.css` | 迁移 |
| `src/components/StoryCard/styles.css` | `packages/app/src/novel/components/StoryCard/styles.css` | 迁移 |
| `src/components/ChapterEditor/styles.css` | `packages/app/src/novel/components/ChapterEditor/styles.css` | 迁移 |

---

## 七、依赖清单

### 7.1 新增依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `@tanstack/solid-query` | ^5.0.0 | 数据查询缓存 |
| `solid-js` | ^1.8.0 | 已存在 |
| `tailwindcss` | ^3.4.0 | 已存在 |

### 7.2 暂不引入

| 依赖 | 原因 | 建议阶段 |
|------|------|----------|
| `@xyflow/solid` | Canvas 暂缓迁移 | Phase 3 |
| `@trpc/client` | 真实 API 暂缓 | Phase 2 |
| `@ai-sdk/*` | 真实模型暂缓 | Phase 3 |

---

## 八、时间估算

| 任务 | 预估工时 | 负责人 |
|------|----------|--------|
| 项目配置 + Provider 层 | 1.5 天 | 前端开发 |
| StoryCard + CharacterCard | 1.5 天 | 前端开发 |
| ChapterEditor | 1.5 天 | 前端开发 |
| AITaskPanel + AIResultCard + AILogDrawer | 1.5 天 | 前端开发 |
| API Bridge + Mock Adapter | 1 天 | 前端开发 |
| 样式迁移 + 集成测试 | 1 天 | 前端开发 |
| **总计** | **8 天** | |

---

## 九、验收标准

### 9.1 功能验收

- [ ] 打开 Mock 小说项目
- [ ] 查看章节列表
- [ ] 查看角色卡/故事卡
- [ ] 编辑章节内容
- [ ] 触发 AI 续写
- [ ] 查看 AI 结果
- [ ] 采纳/丢弃结果
- [ ] 查看 AI 日志

### 9.2 非功能验收

- [ ] 页面加载时间 < 2s
- [ ] 响应式布局适配
- [ ] Mock 数据切换正常
- [ ] 错误边界处理

---

*文档路径：docs/planning/week1/WEEK1-STORYCANVAS-FRONTEND-MIGRATION-SCOPE.md*

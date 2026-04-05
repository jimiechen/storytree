# V2 架构演进方案 (Architecture Evolution for V2)

## 1. 演进目标

在 `dreamweaver-mvp-v1` 完成的 Next.js + MSW 纯客户端闭环基础上，本阶段 (V2: 知识资产与 AI 引擎破冰) 将引入以下三项核心架构变更：

1. **结构化资产状态管理**：新增 `knowledge-store` 处理角色、世界观、伏笔等层级化数据。
2. **AI 通道与流式响应**：引入 AI SDK (如 Vercel AI SDK) 建立流式通信管道，支持多模型路由配置。
3. **数据库与服务端渲染 (SSR) 准备**：为认证和工作台核心数据引入真实数据库 ORM，逐步实现 MSW 到真实 API 的灰度切换。

## 2. 核心技术选型

### 2.1 知识资产系统 (Frontend State)
- **Store 管理**: 继续采用 Zustand，拆分独立切片 `useKnowledgeStore`，以避免 `useProjectStore` 过于臃肿。
- **数据结构设计**: 采用实体引用 (Entity Reference) 替代深层嵌套对象，角色、世界观、章节通过 `id` 进行关联，并在内存中建立关联索引。

### 2.2 AI 写作引擎通道 (AI Gateway)
- **流式框架**: 采用 [Vercel AI SDK](https://sdk.vercel.ai/docs)，原生支持 React Server Components 和流式 UI (Streaming UI)。
- **模型路由层**: 在 Next.js API Routes (如 `/api/chat`) 中构建统一网关，读取用户配置中的首选语言和模型偏好，通过 `generateText` 或 `streamText` 分发到不同的提供商 (OpenAI/Anthropic/DeepSeek)。
- **Prompt 管理器**: 前端状态机将当前激活章节内容、最近修改角色卡作为 `system_prompt` 或 `context`，注入到每次聊天请求中。

### 2.3 数据持久化与灰度迁移 (Backend)
- **数据库 ORM**: 引入 **Prisma** (支持强类型和迁移) + **PostgreSQL**。
- **灰度策略 (Feature Flags)**: 利用环境变量 `NEXT_PUBLIC_USE_MOCK_API=true`，实现 API 客户端的动态代理。针对 `projects` 和 `chapters`，如果在配置下开启了真实 API，则直接发起后端请求；而新开发的 `characters` 和 `world_settings` 暂时在 MSW 中迭代。

## 3. 组件与数据流架构图

### 3.1 知识库结构 (Knowledge Base Graph)
```text
Project (1)
 ├── Chapters (N)
 │    └── Content (Rich Text)
 ├── Characters (N)
 │    ├── Profile (Name, Age, Backstory)
 │    └── Relationships (Map<CharacterId, RelationType>)
 └── World Settings (N)
      ├── Category (Geography, Magic, History)
      └── Details
```

### 3.2 AI 流式交互数据流
```text
[Editor Selection / Chat Input]
          │
          ▼ (User Prompt + Context Assembly)
[Zustand: chat-store / project-store]
          │
          ▼ (POST /api/chat)
[Next.js Route Handler]
          │ (Model Routing & System Prompt Injection)
          ▼
[LLM Provider (DeepSeek/Claude)]
          │ (Server-Sent Events)
          ▼
[Vercel AI SDK Client hook: useChat]
          │
          ▼ (Typewriter Effect / Append to Editor)
[ChatPanel.tsx / Editor.tsx]
```

## 4. 关键接口契约 (API Contracts)

### 4.1 角色管理 API (Mock -> Real)
- `GET /api/projects/:projectId/characters`
- `POST /api/projects/:projectId/characters`
- `PUT /api/characters/:characterId`
- `DELETE /api/characters/:characterId`

### 4.2 AI 辅助 API
- `POST /api/ai/chat` (通用对话，支持上下文注入)
- `POST /api/ai/complete` (编辑器续写，基于游标位置)
- `POST /api/ai/revise` (划词润色/改写)

## 5. 质量门禁 (Architecture Constraints)
1. **单向数据流**: AI 面板获取的流式结果必须先经过 `chat-store` 处理，不可直接操作 DOM 插入编辑器，必须通过 Tiptap 命令 API (如 `editor.commands.insertContent`) 注入，避免破坏撤销历史 (History Stack)。
2. **性能底线**: 即使包含数万字的章节内容，每次发送 AI 请求时的上下文字符串拼接耗时不得超过 50ms（通过防抖缓存处理）。
3. **真实接口兼容性**: Prisma Schema 的设计必须与 MVP 阶段定下的 TypeScript 接口 (`Project`, `Chapter`, `User`) 百分之百对应，不允许产生字段名差异（如 `name` vs `title` 冲突）。
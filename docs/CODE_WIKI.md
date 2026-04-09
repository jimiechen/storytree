# 织梦笔 (Dreamweaver) Code Wiki

> 本文档提供项目的完整技术架构、模块职责、关键类与函数说明、依赖关系及运行方式。

---

## 目录

1. [项目概述](#1-项目概述)
2. [整体架构](#2-整体架构)
3. [主要模块职责](#3-主要模块职责)
4. [关键类与函数说明](#4-关键类与函数说明)
5. [依赖关系](#5-依赖关系)
6. [项目运行方式](#6-项目运行方式)
7. [数据库模型](#7-数据库模型)
8. [API 接口规范](#8-api-接口规范)
9. [测试策略](#9-测试策略)
10. [Ralph 开发流程](#10-ralph-开发流程)

---

## 1. 项目概述

### 1.1 项目简介

**织梦笔 (Dreamweaver)** 是一个多AI模型多分支长篇小说写作平台。该项目旨在为小说作者提供智能化的写作辅助工具，支持：

- 多AI模型集成（GPT、Claude等）
- 多分支故事线管理
- 角色与世界观知识库
- 智能润色、续写、扩写功能
- 可视化分支地图

### 1.2 项目结构

```
/workspace/
├── dreamweaver/          # 主应用（Next.js 前端）
├── caiode/               # Claude Code 源码与扩展
│   ├── claude-code-src/  # Claude Code 核心源码
│   ├── vscode-extension/ # VS Code 扩展
│   └── Trae-Ralph-main/  # Ralph 开发流程框架
├── .trae/                # Trae 配置与 Skills
│   ├── rules/            # 项目规则
│   ├── skills/           # Ralph Skills
│   └── documents/        # 项目文档
├── docs/                 # 文档目录
├── scripts/              # 脚本工具
└── tests/                # 测试文件
```

---

## 2. 整体架构

### 2.1 技术栈概览

| 层级 | 技术选型 |
|------|---------|
| **前端框架** | Next.js 16.2.2 (App Router) |
| **UI 库** | React 19.2.4 |
| **状态管理** | Zustand 5.0.12 |
| **样式方案** | Tailwind CSS 4 |
| **富文本编辑** | TipTap 3.22.x |
| **流程图** | @xyflow/react 12.10.2 |
| **数据库** | SQLite (Prisma ORM) |
| **API Mock** | MSW 2.12.14 |
| **国际化** | next-intl 4.9.0 |
| **主题** | next-themes 0.4.6 |
| **测试** | Vitest + Playwright |

### 2.2 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Pages     │  │ Components  │  │      Stores (Zustand)   │  │
│  │ (App Router)│  │   (React)   │  │                         │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                      │                │
│         └────────────────┼──────────────────────┘                │
│                          ▼                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    API Layer (axios)                       │  │
│  └───────────────────────────┬───────────────────────────────┘  │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐             │
│         ▼                    ▼                    ▼             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐     │
│  │  MSW Mock   │    │  Next API   │    │   AI Service    │     │
│  │  (开发环境)  │    │  Routes     │    │   (外部API)     │     │
│  └─────────────┘    └──────┬──────┘    └─────────────────┘     │
│                            │                                    │
│                            ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Prisma ORM + SQLite Database                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 主要模块职责

### 3.1 Dreamweaver 主应用模块

#### 3.1.1 路由结构 (`src/app/`)

```
app/
├── [locale]/                    # 国际化路由
│   ├── (auth)/                  # 认证相关页面
│   │   ├── login/               # 登录页
│   │   ├── register/            # 注册页
│   │   └── layout.tsx           # 认证布局
│   ├── (main)/                  # 主应用页面
│   │   ├── projects/            # 项目管理
│   │   │   ├── create/          # 创建项目
│   │   │   └── page.tsx         # 项目列表
│   │   └── workbench/[projectId]/  # 工作台
│   │       ├── branches/        # 分支管理
│   │       ├── characters/      # 角色管理
│   │       ├── models/          # 模型中心
│   │       ├── outline/         # 大纲视图
│   │       └── world-settings/  # 世界观设定
│   ├── layout.tsx               # 根布局
│   └── page.tsx                 # 首页
├── api/                         # API 路由
│   ├── auth/                    # 认证 API
│   ├── chapters/                # 章节 API
│   ├── chat/                    # AI 对话 API
│   └── projects/                # 项目 API
└── components/                  # 全局组件
```

#### 3.1.2 组件模块 (`src/components/`)

| 目录 | 职责 |
|------|------|
| `ai/` | AI 相关组件（AIPanel） |
| `cards/` | 卡片组件（ProjectCard） |
| `chapters/` | 章节相关组件（CreateChapterModal） |
| `chat/` | 聊天面板组件（ChatPanel） |
| `editor/` | 富文本编辑器组件（Editor, EditorToolbar, AIBubbleMenu, StatusBar） |
| `knowledge/` | 知识库组件（CharacterForm, WorldSettingForm） |
| `layout/` | 布局组件（ActivityBar, ChapterSidebar, DashboardSidebar, StoryExplorer） |
| `projects/` | 项目相关组件（CreateProjectModal, ProjectCard, StatsCard, TemplateCard） |
| `ui/` | 基础 UI 组件（Alert, Badge, Button, Card, Form, Input, Modal, Select, Textarea） |

#### 3.1.3 状态管理 (`src/stores/`)

| Store | 职责 |
|-------|------|
| `auth-store.ts` | 用户认证状态（登录、注册、登出） |
| `project-store.ts` | 项目状态管理（项目列表、当前项目） |
| `knowledge-store.ts` | 知识库状态（角色、世界观设定） |

#### 3.1.4 核心库 (`src/lib/`)

| 文件 | 职责 |
|------|------|
| `api.ts` | Axios 封装，请求/响应拦截器，统一错误处理 |
| `auth.ts` | 认证相关工具函数 |
| `db.ts` | Prisma 客户端实例化 |

### 3.2 Caiode 模块

#### 3.2.1 Claude Code 源码 (`caiode/claude-code-src/`)

Claude Code 是 Anthropic 官方的命令行 AI 助手，本项目包含其源码用于扩展和定制。

**核心模块：**

| 目录 | 职责 |
|------|------|
| `entrypoints/` | 应用入口点（CLI, MCP, SDK） |
| `components/` | React 组件（消息、状态、对话框等） |
| `tools/` | 工具定义（文件操作、Shell、搜索等） |
| `utils/` | 工具函数（Git、文件、API、权限等） |
| `services/` | 服务层（语音、限流、诊断等） |
| `state/` | 状态管理（AppState, Store） |
| `hooks/` | React Hooks |
| `bridge/` | 远程桥接（WebSocket、会话管理） |
| `context/` | React Context |

**关键文件：**

- [QueryEngine.ts](file:///workspace/caiode/claude-code-src/QueryEngine.ts) - 查询引擎，管理对话生命周期
- [Tool.ts](file:///workspace/caiode/claude-code-src/Tool.ts) - 工具类型定义与构建器
- [Task.ts](file:///workspace/caiode/claude-code-src/Task.ts) - 任务类型定义

#### 3.2.2 VS Code 扩展 (`caiode/vscode-extension/`)

用于 VS Code 集成的扩展模块。

#### 3.2.3 Ralph 框架 (`caiode/Trae-Ralph-main/`)

Ralph 是一个结构化的 AI 辅助开发流程框架，包含：

- **Skills**: 可复用的任务处理模块
- **Templates**: 文档模板
- **Scripts**: 初始化和注入脚本

### 3.3 Skills 模块 (`.trae/skills/`)

Ralph Skills 是 Ralph 框架的核心组件，用于自动化开发流程：

| Skill | 职责 |
|-------|------|
| `ralph-planner` | 核心状态机，管理全生命周期（Planning → Implementation → Testing） |
| `ralph-web-routine` | Web 项目规划流程执行器 |
| `ralph-web-requirement` | 需求文档生成器 |
| `ralph-web-architecture` | 架构文档生成器 |
| `ralph-web-task-planner` | 任务拆分规划器 |
| `ralph-web-test-plan` | 测试计划生成器 |
| `ralph-task-executor` | 任务执行器 |
| `ralph-test-executor` | 测试执行器 |
| `ralph-state-manager` | 状态管理器 |
| `ralph-round-initializer` | 轮次初始化器 |
| `ralph-feishu-sync` | 飞书集成同步器 |
| `ralph-func-analyst` | 需求预分析器 |

---

## 4. 关键类与函数说明

### 4.1 Dreamweaver 核心类与函数

#### 4.1.1 API 客户端 (`src/lib/api.ts`)

```typescript
// API 响应类型
interface ApiResponse<T = unknown> {
  result: {
    code: number;
    message: string;
    data?: T;
  };
}

// API 错误码枚举
enum ApiErrorCode {
  SUCCESS = 10200,
  BAD_REQUEST = 10400,
  UNAUTHORIZED = 10401,
  FORBIDDEN = 10403,
  NOT_FOUND = 10404,
  SERVER_ERROR = 10500,
}

// 封装的请求方法
const api = {
  get: <T>(url: string, config?) => Promise<T>,
  post: <T>(url: string, data?, config?) => Promise<T>,
  put: <T>(url: string, data?, config?) => Promise<T>,
  delete: <T>(url: string, config?) => Promise<T>,
};
```

**功能说明：**
- 创建 Axios 实例，配置基础 URL 和超时
- 请求拦截器：自动注入 Bearer Token
- 响应拦截器：统一错误处理，401 自动跳转登录

#### 4.1.2 认证 Store (`src/stores/auth-store.ts`)

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  // 方法
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: { username: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}
```

**功能说明：**
- 使用 Zustand + persist 中间件持久化状态
- 自动存储 token 到 localStorage
- 提供完整的认证流程方法

#### 4.1.3 知识库 Store (`src/stores/knowledge-store.ts`)

```typescript
interface KnowledgeState {
  // 数据
  characters: Character[];
  currentCharacter: Character | null;
  worldSettings: WorldSetting[];
  currentWorldSetting: WorldSetting | null;
  
  // 状态
  isLoading: boolean;
  error: string | null;
  
  // 角色操作
  setCharacters: (characters: Character[]) => void;
  addCharacter: (characterData) => Character;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  setCurrentCharacter: (character: Character | null) => void;
  
  // 世界观操作
  setWorldSettings: (worldSettings: WorldSetting[]) => void;
  addWorldSetting: (settingData) => WorldSetting;
  updateWorldSetting: (id: string, updates: Partial<WorldSetting>) => void;
  deleteWorldSetting: (id: string) => void;
  setCurrentWorldSetting: (setting: WorldSetting | null) => void;
}
```

**功能说明：**
- 管理角色和世界观设定的 CRUD 操作
- 自动生成唯一 ID 和时间戳
- 支持当前选中项管理

#### 4.1.4 Chat Hook (`src/hooks/useChat.ts`)

```typescript
interface UseChatReturn {
  messages: Message[];
  input: string;
  handleInputChange: (e) => void;
  handleSubmit: (e) => void;
  isLoading: boolean;
  error: string | null;
  model: string;
  setModel: (model: string) => void;
  append: (message: Omit<Message, 'id'>) => void;
  clearMessages: () => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

// 构建系统提示词
function buildSystemPrompt(context?: ChatContext): string;
```

**功能说明：**
- 封装 AI 对话逻辑
- 支持流式响应处理
- 支持上下文注入（章节内容、选中文本等）
- 支持请求取消

### 4.2 Caiode 核心类与函数

#### 4.2.1 QueryEngine (`caiode/claude-code-src/QueryEngine.ts`)

```typescript
class QueryEngine {
  private config: QueryEngineConfig;
  private mutableMessages: Message[];
  private abortController: AbortController;
  
  constructor(config: QueryEngineConfig);
  
  // 提交消息并获取流式响应
  async *submitMessage(prompt: string | ContentBlockParam[], options?): AsyncGenerator<SDKMessage>;
  
  // 中断当前请求
  interrupt(): void;
  
  // 获取消息列表
  getMessages(): readonly Message[];
  
  // 获取文件读取状态
  getReadFileState(): FileStateCache;
  
  // 获取会话 ID
  getSessionId(): string;
  
  // 设置模型
  setModel(model: string): void;
}

// 便捷函数
async function* ask({...}): AsyncGenerator<SDKMessage>;
```

**功能说明：**
- 管理对话生命周期和会话状态
- 处理流式响应和消息持久化
- 支持权限管理和工具调用
- 支持压缩边界和消息重放

#### 4.2.2 Tool 类型 (`caiode/claude-code-src/Tool.ts`)

```typescript
type Tool<Input, Output, P> = {
  name: string;
  aliases?: string[];
  searchHint?: string;
  
  // 核心方法
  call(args, context, canUseTool, parentMessage, onProgress?): Promise<ToolResult<Output>>;
  description(input, options): Promise<string>;
  checkPermissions(input, context): Promise<PermissionResult>;
  
  // Schema
  inputSchema: Input;
  inputJSONSchema?: ToolInputJSONSchema;
  outputSchema?: z.ZodType;
  
  // 行为方法
  isEnabled(): boolean;
  isConcurrencySafe(input): boolean;
  isReadOnly(input): boolean;
  isDestructive?(input): boolean;
  
  // 渲染方法
  renderToolUseMessage(input, options): React.ReactNode;
  renderToolResultMessage?(content, progressMessages, options): React.ReactNode;
  
  // 其他
  maxResultSizeChars: number;
  userFacingName(input): string;
};

// 工具构建器
function buildTool<D extends AnyToolDef>(def: D): BuiltTool<D>;
```

**功能说明：**
- 定义工具的标准接口
- 提供权限检查、并发安全、只读判断等方法
- 支持自定义渲染和进度显示

#### 4.2.3 Task 类型 (`caiode/claude-code-src/Task.ts`)

```typescript
type TaskType =
  | 'local_bash'
  | 'local_agent'
  | 'remote_agent'
  | 'in_process_teammate'
  | 'local_workflow'
  | 'monitor_mcp'
  | 'dream';

type TaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'killed';

type Task = {
  name: string;
  type: TaskType;
  kill(taskId: string, setAppState: SetAppState): Promise<void>;
};

// 工具函数
function generateTaskId(type: TaskType): string;
function createTaskStateBase(id, type, description, toolUseId?): TaskStateBase;
function isTerminalTaskStatus(status: TaskStatus): boolean;
```

**功能说明：**
- 定义任务类型和状态
- 提供任务 ID 生成和状态判断工具

---

## 5. 依赖关系

### 5.1 生产依赖

```json
{
  "@ai-sdk/openai": "^3.0.50",      // OpenAI SDK 集成
  "@prisma/client": "^5.22.0",      // Prisma ORM 客户端
  "@tiptap/core": "^3.22.1",        // TipTap 富文本编辑器核心
  "@tiptap/react": "^3.22.1",       // TipTap React 绑定
  "@xyflow/react": "^12.10.2",      // React Flow 流程图库
  "ai": "^6.0.146",                 // Vercel AI SDK
  "axios": "^1.14.0",               // HTTP 客户端
  "bcryptjs": "^3.0.3",             // 密码加密
  "lucide-react": "^1.7.0",         // 图标库
  "msw": "^2.12.14",                // Mock Service Worker
  "next": "16.2.2",                 // Next.js 框架
  "next-intl": "^4.9.0",            // 国际化
  "next-themes": "^0.4.6",          // 主题切换
  "react": "19.2.4",                // React
  "react-dom": "19.2.4",            // React DOM
  "react-markdown": "^10.1.0",      // Markdown 渲染
  "zustand": "^5.0.12"              // 状态管理
}
```

### 5.2 开发依赖

```json
{
  "@playwright/test": "^1.59.1",    // E2E 测试
  "@tailwindcss/postcss": "^4",     // Tailwind CSS PostCSS
  "@testing-library/react": "^16.3.2",  // React 测试库
  "@vitejs/plugin-react": "^6.0.1", // Vite React 插件
  "eslint": "^9",                   // ESLint
  "husky": "^9.1.7",                // Git Hooks
  "lint-staged": "^16.4.0",         // 暂存区 lint
  "prettier": "^3.8.1",             // 代码格式化
  "prisma": "^5.22.0",              // Prisma CLI
  "tailwindcss": "^4",              // Tailwind CSS
  "typescript": "^5",               // TypeScript
  "vitest": "^4.1.2"                // 单元测试
}
```

### 5.3 模块依赖图

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │  Pages  │  │Components│  │ Stores  │  │     Hooks       │ │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────────┬────────┘ │
└───────┼────────────┼────────────┼────────────────┼──────────┘
        │            │            │                │
        ▼            ▼            ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                       Core Layer                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │   API   │  │  Types  │  │  Lib    │  │    Mocks        │ │
│  │ Client  │  │         │  │ (utils) │  │    (MSW)        │ │
│  └────┬────┘  └─────────┘  └────┬────┘  └────────┬────────┘ │
└───────┼─────────────────────────┼────────────────┼──────────┘
        │                         │                │
        ▼                         ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Prisma    │  │   SQLite    │  │   External APIs     │  │
│  │    ORM      │──│  Database   │  │   (OpenAI, etc.)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. 项目运行方式

### 6.1 环境要求

- **Node.js**: >= 18.0.0
- **包管理器**: npm / yarn / pnpm / bun

### 6.2 安装依赖

```bash
# 进入项目目录
cd dreamweaver

# 安装依赖
npm install
```

### 6.3 数据库初始化

```bash
# 生成 Prisma 客户端
npm run db:generate

# 运行数据库迁移
npm run db:migrate

# 填充种子数据
npm run db:seed

# 打开 Prisma Studio（可选）
npm run db:studio
```

### 6.4 开发模式

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 6.5 生产构建

```bash
# 构建
npm run build

# 启动生产服务器
npm start
```

### 6.6 测试

```bash
# 单元测试
npm run test:unit

# 单元测试（监听模式）
npm run test:unit:watch

# E2E 测试
npm run test:e2e

# E2E 测试（UI 模式）
npm run test:e2e:ui

# 视觉回归测试
npm run test:vrt

# 更新视觉回归快照
npm run test:vrt:update
```

### 6.7 代码质量

```bash
# ESLint 检查
npm run lint

# ESLint 自动修复
npm run lint:fix

# Prettier 格式化
npm run format

# Prettier 检查
npm run format:check
```

### 6.8 Git Hooks

项目使用 Husky 配置了 pre-commit hook：

- 提交前自动运行 ESLint 和 Prettier
- 仅对暂存区文件进行检查

---

## 7. 数据库模型

### 7.1 ER 图

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    User     │────▶│ UserPreferences │     │  Subscription   │
└──────┬──────┘     └─────────────────┘     └────────┬────────┘
       │                                             │
       │     ┌───────────────────────────────────────┘
       │     │
       ▼     ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Project   │────▶│   Chapter   │     │   Character     │
└──────┬──────┘     └─────────────┘     └─────────────────┘
       │
       │           ┌─────────────────┐     ┌─────────────────┐
       ├──────────▶│  WorldSetting   │     │     Branch      │
       │           └─────────────────┘     └─────────────────┘
       │
       │           ┌─────────────────┐     ┌─────────────────┐
       ├──────────▶│ Foreshadowing   │     │  AgentSession   │
       │           └─────────────────┘     └─────────────────┘
       │
       │           ┌─────────────────┐     ┌─────────────────┐
       ├──────────▶│  MemoryEntry    │     │   HookConfig    │
       │           └─────────────────┘     └─────────────────┘
       │
       │           ┌─────────────────┐
       └──────────▶│ PromptCacheEntry│
                   └─────────────────┘
```

### 7.2 核心模型说明

#### User（用户）
```prisma
model User {
  id               String   @id @default(uuid())
  email            String   @unique
  passwordHash     String
  nickname         String?
  avatarUrl        String?
  subscriptionTier String   @default("free")
  
  // 关联
  preferences      UserPreferences?
  subscription     Subscription?
  projects         Project[]
  agentSessions    AgentSession[]
}
```

#### Project（项目）
```prisma
model Project {
  id               String   @id @default(uuid())
  userId           String
  name             String
  description      String?
  genre            String?
  targetWordCount  Int?
  currentWordCount Int      @default(0)
  status           String   @default("draft")
  
  // 关联
  chapters          Chapter[]
  characters        Character[]
  worldSettings     WorldSetting[]
  branches          Branch[]
  foreshadowing     Foreshadowing[]
}
```

#### Character（角色）
```prisma
model Character {
  id              String   @id @default(uuid())
  projectId       String
  name            String
  aliases         String?
  roleType        String   // protagonist, supporting, antagonist, other
  profile         String?
  relationships   String?  // JSON
  arc             String?
  wordCount       Int      @default(0)
}
```

#### WorldSetting（世界观设定）
```prisma
model WorldSetting {
  id             String   @id @default(uuid())
  projectId      String
  name           String
  category       String   // geography, magic, history, culture, etc.
  type           String
  description    String?
  properties     String?  // JSON
  relations      String?  // JSON
  version        Int      @default(1)
}
```

---

## 8. API 接口规范

### 8.1 响应格式

```typescript
interface ApiResponse<T> {
  result: {
    code: number;      // 状态码
    message: string;   // 消息
    data?: T;          // 数据
  };
}
```

### 8.2 状态码定义

| 状态码 | 说明 |
|--------|------|
| 10200 | 成功 |
| 10400 | 请求参数错误 |
| 10401 | 未授权（未登录或 token 无效） |
| 10403 | 禁止访问 |
| 10404 | 资源不存在 |
| 10500 | 服务器内部错误 |

### 8.3 主要接口

#### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |

#### 项目接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects` | 获取项目列表 |
| POST | `/api/projects` | 创建项目 |
| GET | `/api/projects/:id` | 获取项目详情 |
| PUT | `/api/projects/:id` | 更新项目 |
| DELETE | `/api/projects/:id` | 删除项目 |

#### 章节接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects/:projectId/chapters` | 获取章节列表 |
| POST | `/api/projects/:projectId/chapters` | 创建章节 |
| GET | `/api/chapters/:id` | 获取章节详情 |
| PUT | `/api/chapters/:id` | 更新章节 |
| DELETE | `/api/chapters/:id` | 删除章节 |

#### 知识库接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects/:projectId/characters` | 获取角色列表 |
| POST | `/api/projects/:projectId/characters` | 创建角色 |
| PUT | `/api/projects/:projectId/characters/:characterId` | 更新角色 |
| DELETE | `/api/projects/:projectId/characters/:characterId` | 删除角色 |
| GET | `/api/projects/:projectId/world-settings` | 获取世界观列表 |
| POST | `/api/projects/:projectId/world-settings` | 创建世界观设定 |
| PUT | `/api/projects/:projectId/world-settings/:settingId` | 更新世界观设定 |
| DELETE | `/api/projects/:projectId/world-settings/:settingId` | 删除世界观设定 |

#### AI 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/chat` | AI 对话（流式响应） |

---

## 9. 测试策略

### 9.1 测试类型

| 类型 | 工具 | 目录 |
|------|------|------|
| 单元测试 | Vitest | `tests/unit/` |
| E2E 测试 | Playwright | `tests/e2e/` |
| 视觉回归测试 | Playwright | `tests/e2e/vrt.spec.ts` |

### 9.2 单元测试

```typescript
// tests/unit/example.test.ts
import { describe, it, expect } from 'vitest';

describe('Example', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});
```

### 9.3 E2E 测试

```typescript
// tests/e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test';

test('login page should display correctly', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('h1')).toContainText('登录');
});
```

### 9.4 Mock 服务

项目使用 MSW (Mock Service Worker) 进行 API Mock：

```typescript
// src/mocks/handlers.ts
export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    // Mock 登录逻辑
  }),
  http.get('/api/projects', () => {
    // Mock 项目列表
  }),
];
```

---

## 10. Ralph 开发流程

### 10.1 流程概览

Ralph 是一个结构化的 AI 辅助开发流程框架，包含三个主要阶段：

```
┌─────────────────────────────────────────────────────────────┐
│                    Ralph 开发流程                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Phase 1: Planning (3 Rounds)             │   │
│  │  ┌─────────┐   ┌─────────┐   ┌─────────┐            │   │
│  │  │ Round 1 │──▶│ Round 2 │──▶│ Round 3 │            │   │
│  │  │ (Draft) │   │(Review) │   │ (Lock)  │            │   │
│  │  └─────────┘   └─────────┘   └─────────┘            │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Phase 2: Implementation                     │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │  Task 1 → Task 2 → Task 3 → ... → Task N       │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Phase 3: Testing                         │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │  Test 1 → Test 2 → Test 3 → ... → Test N       │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 核心文件

| 文件 | 职责 |
|------|------|
| `RALPH_STATE.md` | 状态跟踪文件 |
| `01-requirements.md` | 需求文档 |
| `02-architecture.md` | 架构文档 |
| `04-ralph-tasks.md` | 任务列表 |
| `05-test-plan.md` | 测试计划 |
| `06-learnings.md` | 经验总结 |

### 10.3 执行铁律

1. **物理顺序优先**：必须按任务文件行号顺序执行
2. **测试即交付**：任何代码变更必须通过测试验证
3. **状态真实性**：状态文件必须反映真实进度
4. **单线程专注**：每次只处理一个任务

### 10.4 Git 集成

```bash
# 任务开始前
git status
git pull origin main

# 任务完成后
git add .
git commit -m "feat: xxx (Task X.X.X)"
git push origin main
```

### 10.5 飞书集成

- 任务状态自动同步到飞书多维表格
- 完成时发送群通知
- 支持 @消息评审

---

## 附录

### A. 项目配置文件

| 文件 | 说明 |
|------|------|
| `package.json` | 项目依赖和脚本 |
| `tsconfig.json` | TypeScript 配置 |
| `next.config.ts` | Next.js 配置 |
| `tailwind.config.ts` | Tailwind CSS 配置 |
| `playwright.config.ts` | Playwright 配置 |
| `vitest.config.ts` | Vitest 配置 |
| `eslint.config.mjs` | ESLint 配置 |
| `.prettierrc` | Prettier 配置 |
| `prisma/schema.prisma` | 数据库 Schema |

### B. 环境变量

```bash
# .env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_API_URL=""
```

### C. 常见问题

**Q: 如何重置数据库？**
```bash
rm prisma/dev.db
npm run db:migrate
npm run db:seed
```

**Q: 如何添加新的 API Mock？**
```typescript
// src/mocks/handlers.ts
export const handlers = [
  // 添加新的 handler
  http.get('/api/new-endpoint', () => {
    return HttpResponse.json({ result: { code: 10200, message: 'success' } });
  }),
];
```

**Q: 如何运行特定测试？**
```bash
# 单元测试
npm run test:unit -- --grep "test name"

# E2E 测试
npx playwright test tests/e2e/specific.spec.ts
```

---

> 文档版本: 1.0.0  
> 最后更新: 2026-04-07  
> 维护者: Ralph AI Assistant

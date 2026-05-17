# 系统架构设计 (System Architecture)

> **迭代版本**: dreamweaver-mvp-v1
> **目标**: UI优先 + Mock接口 + TDD模式开发

---

## 1. 技术栈 (Tech Stack)

### 1.1 前端
- **框架**: Next.js 15 + React 19 + TypeScript 5
- **UI 库**: Tailwind CSS 4 + shadcn/ui
- **状态管理**: Zustand
- **编辑器**: TipTap (ProseMirror)
- **HTTP 客户端**: Axios + MSW (Mock Service Worker)

### 1.2 Mock 服务
- **MSW (Mock Service Worker)**: 前端拦截请求，模拟 API 响应
- **Mock 数据**: 使用 faker.js 生成测试数据

### 1.3 测试
- **单元测试**: Vitest + React Testing Library
- **E2E 测试**: Playwright
- **TDD 模式**: 先写测试 -> 再写实现

### 1.4 质量保障
- **类型检查**: TypeScript 严格模式
- **代码规范**: ESLint + Prettier
- **测试覆盖率**: > 70%

---

## 2. 目录结构规范

```
dreamweaver/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 认证页面组
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (main)/            # 主页面组
│   │   │   ├── projects/
│   │   │   └── workbench/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/             # UI 组件
│   │   ├── ui/                # shadcn/ui 基础组件
│   │   ├── editor/            # 编辑器相关组件
│   │   ├── chat/              # AI 对话组件
│   │   └── layout/            # 布局组件
│   ├── lib/                    # 工具库
│   │   ├── api.ts             # API 请求封装
│   │   ├── api-types.ts       # API 类型定义
│   │   ├── auth.ts            # 认证工具
│   │   └── utils.ts           # 通用工具
│   ├── mocks/                  # MSW Mock 服务
│   │   ├── handlers.ts        # Mock 处理器
│   │   ├── data.ts            # Mock 数据
│   │   └── browser.ts         # 浏览器端初始化
│   ├── stores/                 # Zustand 状态管理
│   │   ├── auth-store.ts
│   │   ├── project-store.ts
│   │   └── editor-store.ts
│   ├── types/                  # TypeScript 类型定义
│   │   ├── api.ts             # API 响应类型
│   │   ├── project.ts
│   │   └── user.ts
│   └── hooks/                   # React Hooks
│       ├── use-auth.ts
│       └── use-project.ts
├── tests/
│   ├── e2e/                    # Playwright E2E 测试
│   │   ├── auth.spec.ts
│   │   ├── projects.spec.ts
│   │   └── workbench.spec.ts
│   └── unit/                   # Vitest 单元测试
│       ├── lib/
│       ├── components/
│       └── hooks/
├── playwright.config.ts         # Playwright 配置
├── vitest.config.ts           # Vitest 配置
└── package.json
```

---

## 3. 统一接口响应格式

### 3.1 标准响应结构

所有 API 响应必须遵循以下格式：

```typescript
interface ApiResponse<T = unknown> {
  result: {
    code: number;      // 业务状态码
    message: string;   // 响应消息
    data?: T;          // 响应数据（可选）
  }
}
```

### 3.2 状态码定义

| Code | 含义 | 说明 |
|------|------|------|
| 10200 | 成功 | 请求处理成功 |
| 10400 | 请求参数错误 | 参数校验失败 |
| 10401 | 未授权 | 需要登录 |
| 10403 | 禁止访问 | 权限不足 |
| 10404 | 资源不存在 | 请求的资源不存在 |
| 10500 | 服务器错误 | 服务端内部错误 |

### 3.3 响应示例

**成功响应 (200 OK)**:
```json
{
  "result": {
    "code": 10200,
    "message": "success",
    "data": {
      "userId": "uuid-...",
      "email": "user@example.com",
      "username": "john_doe"
    }
  }
}
```

**错误响应 (400 Bad Request)**:
```json
{
  "result": {
    "code": 10400,
    "message": "邮箱格式无效"
  }
}
```

**错误响应 (401 Unauthorized)**:
```json
{
  "result": {
    "code": 10401,
    "message": "登录已过期，请重新登录"
  }
}
```

---

## 4. API 接口定义 (API Specification)

### 4.1 模块: 认证 (Auth)

#### 4.1.1 接口: 用户注册
- **URL**: `POST /api/auth/register`
- **Auth**: Public

**Request Body**:
```json
{
  "email": "user@example.com",
  "username": "john_doe",
  "password": "securePassword123"
}
```

**Response (201 Created)**:
```json
{
  "result": {
    "code": 10200,
    "message": "注册成功",
    "data": {
      "userId": "uuid-...",
      "email": "user@example.com",
      "username": "john_doe"
    }
  }
}
```

**Response (400 Bad Request)**:
```json
{
  "result": {
    "code": 10400,
    "message": "该邮箱已被注册"
  }
}
```

#### 4.1.2 接口: 用户登录
- **URL**: `POST /api/auth/login`
- **Auth**: Public

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK)**:
```json
{
  "result": {
    "code": 10200,
    "message": "登录成功",
    "data": {
      "userId": "uuid-...",
      "email": "user@example.com",
      "username": "john_doe",
      "token": "jwt-token-..."
    }
  }
}
```

**Response (401 Unauthorized)**:
```json
{
  "result": {
    "code": 10401,
    "message": "邮箱或密码错误"
  }
}
```

### 4.2 模块: 项目管理 (Projects)

#### 4.2.1 接口: 获取项目列表
- **URL**: `GET /api/projects`
- **Auth**: Required (JWT)

**Response (200 OK)**:
```json
{
  "result": {
    "code": 10200,
    "message": "success",
    "data": {
      "projects": [
        {
          "id": "uuid-...",
          "name": "我的小说",
          "description": "...",
          "genre": "fantasy",
          "currentWordCount": 5000,
          "targetWordCount": 100000,
          "createdAt": "2026-04-04T00:00:00Z"
        }
      ]
    }
  }
}
```

#### 4.2.2 接口: 创建项目
- **URL**: `POST /api/projects`
- **Auth**: Required (JWT)

**Request Body**:
```json
{
  "name": "我的小说",
  "description": "...",
  "genre": "fantasy",
  "targetWordCount": 100000
}
```

**Response (201 Created)**:
```json
{
  "result": {
    "code": 10200,
    "message": "创建成功",
    "data": {
      "id": "uuid-...",
      "name": "我的小说",
      "description": "...",
      "genre": "fantasy",
      "targetWordCount": 100000,
      "createdAt": "2026-04-04T00:00:00Z"
    }
  }
}
```

#### 4.2.3 接口: 获取项目详情
- **URL**: `GET /api/projects/:id`
- **Auth**: Required (JWT)

**Response (200 OK)**:
```json
{
  "result": {
    "code": 10200,
    "message": "success",
    "data": {
      "id": "uuid-...",
      "name": "我的小说",
      "description": "...",
      "genre": "fantasy",
      "currentWordCount": 5000,
      "targetWordCount": 100000,
      "status": "writing",
      "chapters": [
        {
          "id": "uuid-...",
          "title": "第一章 觉醒",
          "order": 1,
          "wordCount": 2500,
          "status": "draft"
        }
      ],
      "createdAt": "2026-04-04T00:00:00Z"
    }
  }
}
```

### 4.3 模块: 章节管理 (Chapters)

#### 4.3.1 接口: 获取章节列表
- **URL**: `GET /api/projects/:projectId/chapters`
- **Auth**: Required (JWT)

**Response (200 OK)**:
```json
{
  "result": {
    "code": 10200,
    "message": "success",
    "data": {
      "chapters": [
        {
          "id": "uuid-...",
          "title": "第一章 觉醒",
          "order": 1,
          "wordCount": 2500,
          "status": "draft"
        }
      ]
    }
  }
}
```

#### 4.3.2 接口: 获取章节内容
- **URL**: `GET /api/projects/:projectId/chapters/:chapterId`
- **Auth**: Required (JWT)

**Response (200 OK)**:
```json
{
  "result": {
    "code": 10200,
    "message": "success",
    "data": {
      "id": "uuid-...",
      "title": "第一章 觉醒",
      "content": "林墨站在山巅，...",
      "order": 1,
      "wordCount": 2500,
      "status": "draft",
      "updatedAt": "2026-04-04T00:00:00Z"
    }
  }
}
```

#### 4.3.3 接口: 创建章节
- **URL**: `POST /api/projects/:projectId/chapters`
- **Auth**: Required (JWT)

**Request Body**:
```json
{
  "title": "第一章 觉醒",
  "content": ""
}
```

**Response (201 Created)**:
```json
{
  "result": {
    "code": 10200,
    "message": "创建成功",
    "data": {
      "id": "uuid-...",
      "title": "第一章 觉醒",
      "order": 1,
      "wordCount": 0,
      "status": "draft"
    }
  }
}
```

#### 4.3.4 接口: 更新章节
- **URL**: `PUT /api/projects/:projectId/chapters/:chapterId`
- **Auth**: Required (JWT)

**Request Body**:
```json
{
  "title": "第一章 觉醒（修改）",
  "content": "林墨站在山巅，望着远方的云海..."
}
```

**Response (200 OK)**:
```json
{
  "result": {
    "code": 10200,
    "message": "更新成功",
    "data": {
      "id": "uuid-...",
      "title": "第一章 觉醒（修改）",
      "wordCount": 25,
      "status": "draft",
      "updatedAt": "2026-04-04T00:00:00Z"
    }
  }
}
```

---

## 5. Mock 服务设计 (MSW)

### 5.1 Mock 处理器结构

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // 认证模块
  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json();
    // 模拟注册逻辑
    return HttpResponse.json({
      result: {
        code: 10200,
        message: '注册成功',
        data: { /* ... */ }
      }
    });
  }),
  
  http.post('/api/auth/login', async ({ request }) => {
    // 模拟登录逻辑
  }),
  
  // 项目管理模块
  http.get('/api/projects', () => {
    // 返回模拟项目列表
  }),
  
  http.post('/api/projects', async ({ request }) => {
    // 模拟创建项目
  }),
  
  // 章节管理模块
  http.get('/api/projects/:projectId/chapters', ({ params }) => {
    // 返回模拟章节列表
  }),
  
  http.get('/api/projects/:projectId/chapters/:chapterId', ({ params }) => {
    // 返回模拟章节内容
  }),
  
  http.post('/api/projects/:projectId/chapters', async ({ request, params }) => {
    // 模拟创建章节
  }),
  
  http.put('/api/projects/:projectId/chapters/:chapterId', async ({ request, params }) => {
    // 模拟更新章节
  }),
];
```

### 5.2 Mock 数据生成

```typescript
// src/mocks/data.ts
import { faker } from '@faker-js/faker';

export const generateMockUser = () => ({
  userId: faker.string.uuid(),
  email: faker.internet.email(),
  username: faker.internet.userName(),
});

export const generateMockProject = () => ({
  id: faker.string.uuid(),
  name: faker.lorem.words(3),
  description: faker.lorem.paragraph(),
  genre: 'fantasy',
  currentWordCount: faker.number.int({ min: 0, max: 100000 }),
  targetWordCount: 100000,
  createdAt: faker.date.past().toISOString(),
});

export const generateMockChapter = (order: number) => ({
  id: faker.string.uuid(),
  title: `第${order}章 ${faker.lorem.words(2)}`,
  content: faker.lorem.paragraphs(5),
  order,
  wordCount: faker.number.int({ min: 1000, max: 5000 }),
  status: 'draft',
});
```

---

## 6. 关键流程设计

### 6.1 TDD 开发流程

```
1. 编写测试用例 (Red)
   └── 先写 UI 组件测试或 E2E 测试
   
2. 运行测试，确认失败
   └── 验证测试逻辑正确
   
3. 编写最小实现 (Green)
   └── 实现 UI 组件
   └── 配置 Mock 接口
   
4. 运行测试，确认通过
   └── 所有测试通过
   
5. 重构优化 (Refactor)
   └── 代码优化，保持测试通过
```

### 6.2 用户认证流程

1. 用户访问 `/login` 或 `/register`
2. 前端表单校验
3. 调用 Mock API
4. 成功后存储 JWT Token 到 localStorage
5. 跳转到 `/projects`

### 6.3 写作工作台流程

1. 用户从项目列表进入 `/workbench/:projectId`
2. 调用 Mock API 加载项目章节列表
3. 用户选择章节加载内容到编辑器
4. 编辑器支持富文本编辑
5. 内容变更触发自动保存（防抖 2s，调用 Mock API）
6. AI 对话面板支持展开/折叠

---

## 7. 开发顺序

### Phase 1: 基础工程 + Mock 服务
1. 初始化 Next.js 项目 + TypeScript + Tailwind
2. 配置 ESLint + Prettier + Vitest
3. 安装 MSW + 配置 Mock 服务
4. 配置 Playwright

### Phase 2: 认证模块 (TDD)
1. 编写登录/注册页面 E2E 测试
2. 实现登录/注册 UI 组件
3. 配置认证相关 Mock API
4. 运行测试验证

### Phase 3: 项目管理模块 (TDD)
1. 编写项目列表 E2E 测试
2. 实现项目列表 UI
3. 配置项目管理 Mock API
4. 运行测试验证

### Phase 4: 写作工作台模块 (TDD)
1. 编写工作台 E2E 测试
2. 实现编辑器组件 (TipTap)
3. 实现 AI 对话面板
4. 配置章节管理 Mock API
5. 运行测试验证

### Phase 5: 集成测试
1. 全量 E2E 测试
2. 性能测试
3. 代码审查

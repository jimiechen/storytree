# PAGE-03 我的书架 — 后端数据存储方案

> **文档类型**: 后端架构设计方案
> **任务ID**: PAGE-03-STYLE-FIX-AND-BACKEND-STORAGE-PLAN-20260625
> **作者**: 前端工程师 / Novel 模块开发 Agent (Kimi-K2.7-Code)
> **创建日期**: 2026-06-25
> **状态**: 草案 v1.0（待评审）
> **关联文档**: `PAGE-03_bookshelf.md`、`PAGE-03-REAL-DATA-INVESTIGATION-REPORT-20260625.md`

---

## 1. 背景与问题陈述

### 1.1 现状

PAGE-03 我的书架页面当前所有数据均为前端 mock：

- `NovelProjectProvider`（`packages/app/src/novel/providers/novel-project.ts`）是模块级单例
- `mockProjects` 硬编码 4 个项目 → 内存 `Map<string, Project>` 副本
- `listProjects` / `getProject` / `createProject` / `deleteProject` / `restoreProject` 全部操作内存 Map
- **0 个真实 HTTP 调用**，刷新页面后数据丢失
- 创建项目流程断裂：`novel-app-shell.tsx:37` 的 `onSubmit` 忽略表单 input，直接跳转 workspace

### 1.2 目标

1. 设计 Novel 模块专用的后端数据存储方案（REST API + DB schema）
2. 将 `NovelProjectProvider` 从内存 Map 迁移为调用真实后端 API
3. 修复创建项目流程断裂问题
4. 保持与 opencode server 现有架构一致（Hono + drizzle + SQLite）

### 1.3 关键约束

- **不复用 opencode 的 `Project` 系统**：opencode 的 `Project` 是"代码项目"（基于 git worktree 发现），字段为 `id/worktree/vcs/name/icon/sandboxes/commands`，无小说专属字段（genre/description/chapterCount 等）
- **Novel Project 必须独立建表**：语义不同，强行复用会导致 schema 污染
- **遵循 opencode server 路由约定**：workspace 级路由通过 `directory` query 参数路由，挂在 `InstanceRoutes` 下
- **认证复用 opencode basicAuth**：不引入新的认证机制

---

## 2. 架构调研结论

### 2.1 opencode server 架构

| 组件 | 技术 | 说明 |
|------|------|------|
| Web 框架 | Hono | 轻量级、支持 OpenAPI |
| OpenAPI | hono-openapi | 自动生成 spec，`describeRoute` + `validator` |
| ORM | drizzle-orm | SQLite 驱动，类型安全 |
| 数据库 | SQLite | 本地文件数据库 |
| 认证 | basicAuth | 可选，由 `OPENCODE_SERVER_PASSWORD` 控制 |
| CORS | hono/cors | 允许 localhost/tauri/opencode.ai |
| 路由分层 | ControlPlane + Instance | ControlPlane 全局路由；Instance workspace 级路由（按 `directory` query 参数路由） |

### 2.2 opencode Project 系统（不适用）

**位置**: `packages/opencode/src/project/project.ts`

**ProjectTable schema**（`project.sql.ts`）:
```typescript
sqliteTable("project", {
  id: text().$type<ProjectID>().primaryKey(),
  worktree: text().notNull(),       // git worktree 路径
  vcs: text(),                       // 版本控制类型
  name: text(),                      // 项目名
  icon_url: text(),
  icon_color: text(),
  time_created: integer(),
  time_updated: integer(),
  time_initialized: integer(),
  sandboxes: text({ mode: "json" }).notNull().$type<string[]>(),
  commands: text({ mode: "json" }).$type<{ start?: string }>(),
})
```

**路由**（`server/routes/project.ts`）:
- `GET /project` — list（从文件系统发现，非用户创建）
- `GET /project/current` — 当前 workspace 的 project
- `POST /project/git/init` — 初始化 git
- `PATCH /project/:projectID` — 更新 name/icon/commands

**关键差异**：opencode Project 来自 git worktree 自动发现，**没有 `POST /project`（create）和 `DELETE /project/:id`**，因为代码项目不是用户创建的。

### 2.3 Novel Project 系统（前端 mock）

**Project 类型**（`packages/app/src/novel/types/project.ts`）:
```typescript
interface Project {
  id: string;
  name: string;
  genre: string;              // 玄幻/都市/穿越/科幻/仙侠/悬疑/古言/其他
  description: string;
  totalWordCount: number;
  chapterCount: number;
  characterCount: number;
  lastUpdated: Date;
  status: 'active' | 'archived' | 'draft';
}
```

**Provider 接口**（`providers/index.ts`）:
```typescript
interface INovelProjectProvider {
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  getActiveProject(): Promise<Project | null>;
  searchProjects(keyword: string): Promise<Project[]>;
  createProject(input: CreateProjectInput): Promise<Project>;
  deleteProject(id: string): Promise<void>;        // 软删除→回收站
  restoreProject(id: string): Promise<void>;
  listDeletedProjects(): Promise<Project[]>;
}
```

---

## 3. 数据库 Schema 设计

### 3.1 新建表：`novel_project`

**位置**: `packages/opencode/src/novel/novel-project.sql.ts`（新建 `novel/` 目录）

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { Timestamps } from "../storage/schema.sql"

export const NovelProjectTable = sqliteTable("novel_project", {
  id: text().primaryKey(),                                          // novel_proj_<ulid>
  workspace_id: text().notNull(),                                   // 所属 workspace（关联 directory）
  name: text().notNull(),
  genre: text().notNull(),                                          // 玄幻|都市|穿越|科幻|仙侠|悬疑|古言|其他
  description: text().notNull().default(""),
  total_word_count: integer().notNull().default(0),
  chapter_count: integer().notNull().default(0),
  character_count: integer().notNull().default(0),
  status: text().notNull().default("draft"),                        // draft|active|archived
  deleted_at: integer(),                                            // 软删除时间戳，null=未删除
  // 创建项目时的扩展输入（JSON 存储）
  protagonist: text({ mode: "json" }).$type<{ name: string; gender: string; age?: number; personality?: string }>(),
  target_audience: text(),                                          // general|male|female
  writing_style: text(),                                            // default|humorous|dark|...
  story_theme: text(),                                              // default|revenge|growth|...
  custom_settings: text(),
  ...Timestamps,                                                    // time_created, time_updated
})
```

### 3.2 字段映射（前端 Project ↔ DB Row）

| 前端 Project 字段 | DB 字段 | 转换 |
|------------------|---------|------|
| `id` | `id` | 直接 |
| `name` | `name` | 直接 |
| `genre` | `genre` | 直接 |
| `description` | `description` | 直接 |
| `totalWordCount` | `total_word_count` | camelCase → snake_case |
| `chapterCount` | `chapter_count` | camelCase → snake_case |
| `characterCount` | `character_count` | camelCase → snake_case |
| `lastUpdated` | `time_updated` | `Date` ↔ `integer`（Unix ms） |
| `status` | `status` | 直接 |
| — | `deleted_at` | 回收站：`deleted_at != null` 表示已软删除 |
| — | `workspace_id` | workspace 隔离 |

### 3.3 索引设计

```sql
-- 主键索引（自动）
-- workspace + 软删除过滤索引
CREATE INDEX idx_novel_project_workspace_active ON novel_project(workspace_id, deleted_at) WHERE deleted_at IS NULL;
-- 回收站索引
CREATE INDEX idx_novel_project_trash ON novel_project(workspace_id, deleted_at) WHERE deleted_at IS NOT NULL;
```

### 3.4 与 opencode Project 系统的关系

- **完全独立**：novel_project 表与 opencode project 表无外键关联
- **共享 workspace 上下文**：通过 `directory` query 参数路由到同一 workspace，novel_project.workspace_id = 当前 Instance.directory 的哈希
- **共享数据库连接**：复用 `Database.use()`（drizzle 实例）

---

## 4. REST API 设计

### 4.1 路由挂载点

在 `packages/opencode/src/server/instance.ts` 的 `InstanceRoutes` 中新增：

```typescript
import { NovelProjectRoutes } from "./routes/novel-project"

export const InstanceRoutes = (upgrade, app = new Hono()) =>
  app
    .route("/project", ProjectRoutes())
    .route("/novel/project", NovelProjectRoutes())  // 新增
    // ... 其他路由
```

**完整路径前缀**: `/novel/project`（workspace 级，需带 `?directory=<path>` query 参数）

### 4.2 API 端点清单

| 方法 | 路径 | operationId | 说明 |
|------|------|-------------|------|
| GET | `/novel/project` | novel.project.list | 列出当前 workspace 的小说项目（未删除） |
| GET | `/novel/project/:id` | novel.project.get | 获取单个项目 |
| POST | `/novel/project` | novel.project.create | 创建新项目 |
| PATCH | `/novel/project/:id` | novel.project.update | 更新项目（name/description 等） |
| DELETE | `/novel/project/:id` | novel.project.delete | 软删除项目（移入回收站） |
| POST | `/novel/project/:id/restore` | novel.project.restore | 从回收站恢复项目 |
| GET | `/novel/project/trash` | novel.project.trash.list | 列出回收站项目 |
| GET | `/novel/project/search` | novel.project.search | 按关键词搜索项目 |

### 4.3 请求/响应 Schema（zod）

```typescript
// packages/opencode/src/novel/schema.ts（新建）
import z from "zod"

export const NovelProjectID = z.string().regex(/^novel_proj_[a-zA-Z0-9]+$/)

export const NovelProject = z.object({
  id: NovelProjectID,
  name: z.string(),
  genre: z.enum(["玄幻", "都市", "穿越", "科幻", "仙侠", "悬疑", "古言", "其他"]),
  description: z.string(),
  totalWordCount: z.number().int().min(0),
  chapterCount: z.number().int().min(0),
  characterCount: z.number().int().min(0),
  lastUpdated: z.number(),  // Unix ms
  status: z.enum(["active", "archived", "draft"]),
})

export const CreateNovelProjectInput = z.object({
  name: z.string().min(1).max(100),
  genre: z.enum(["玄幻", "都市", "穿越", "科幻", "仙侠", "悬疑", "古言", "其他"]),
  description: z.string().max(2000).optional(),
  protagonist: z.object({
    name: z.string(),
    gender: z.enum(["male", "female"]),
    age: z.number().int().positive().optional(),
    personality: z.string().optional(),
  }).optional(),
  targetAudience: z.enum(["general", "male", "female"]).optional(),
  writingStyle: z.enum(["default", "humorous", "dark", "decisive", "literary", "fast-paced", "slow-paced", "mystery", "passionate", "light", "heartbreaking", "custom"]).optional(),
  storyTheme: z.enum(["default", "revenge", "growth", "love", "adventure", "redemption", "power", "friendship", "survival", "exploration", "competition", "family", "custom"]).optional(),
  customSettings: z.string().optional(),
})

export const UpdateNovelProjectInput = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(["active", "archived", "draft"]).optional(),
  totalWordCount: z.number().int().min(0).optional(),
  chapterCount: z.number().int().min(0).optional(),
  characterCount: z.number().int().min(0).optional(),
})
```

### 4.4 路由实现示例

```typescript
// packages/opencode/src/server/routes/novel-project.ts（新建）
import { Hono } from "hono"
import { describeRoute, validator, resolver } from "hono-openapi"
import z from "zod"
import { NovelProjectTable } from "../../novel/novel-project.sql"
import { NovelProject, CreateNovelProjectInput, UpdateNovelProjectInput, NovelProjectID } from "../../novel/schema"
import { Database } from "../../storage/db"
import { eq, and, isNull, isNotNull, like, or } from "drizzle-orm"
import { Instance } from "../../project/instance"
import { errors } from "../error"
import { lazy } from "../../util/lazy"
import { createHash } from "node:crypto"

function workspaceId(): string {
  // 用当前 Instance.directory 的哈希作为 workspace_id
  return createHash("sha256").update(Instance.directory).digest("hex").slice(0, 16)
}

function rowToProject(row: typeof NovelProjectTable.$inferSelect): z.infer<typeof NovelProject> {
  return {
    id: row.id,
    name: row.name,
    genre: row.genre,
    description: row.description,
    totalWordCount: row.total_word_count,
    chapterCount: row.chapter_count,
    characterCount: row.character_count,
    lastUpdated: row.time_updated,
    status: row.status as "active" | "archived" | "draft",
  }
}

export const NovelProjectRoutes = lazy(() =>
  new Hono()
    .get(
      "/",
      describeRoute({
        summary: "List novel projects",
        operationId: "novel.project.list",
        responses: { 200: { content: { "application/json": { schema: resolver(NovelProject.array()) } } } },
      }),
      async (c) => {
        const rows = Database.use((d) =>
          d.select().from(NovelProjectTable)
            .where(and(
              eq(NovelProjectTable.workspace_id, workspaceId()),
              isNull(NovelProjectTable.deleted_at),
            ))
            .all()
        )
        return c.json(rows.map(rowToProject))
      },
    )
    .get(
      "/trash",
      describeRoute({
        summary: "List deleted novel projects (trash)",
        operationId: "novel.project.trash.list",
        responses: { 200: { content: { "application/json": { schema: resolver(NovelProject.array()) } } } },
      }),
      async (c) => {
        const rows = Database.use((d) =>
          d.select().from(NovelProjectTable)
            .where(and(
              eq(NovelProjectTable.workspace_id, workspaceId()),
              isNotNull(NovelProjectTable.deleted_at),
            ))
            .all()
        )
        return c.json(rows.map(rowToProject))
      },
    )
    .get(
      "/search",
      describeRoute({
        summary: "Search novel projects by keyword",
        operationId: "novel.project.search",
        responses: { 200: { content: { "application/json": { schema: resolver(NovelProject.array()) } } } },
      }),
      validator("query", z.object({ q: z.string() })),
      async (c) => {
        const kw = `%${c.req.valid("query").q.toLowerCase()}%`
        const rows = Database.use((d) =>
          d.select().from(NovelProjectTable)
            .where(and(
              eq(NovelProjectTable.workspace_id, workspaceId()),
              isNull(NovelProjectTable.deleted_at),
              or(
                like(NovelProjectTable.name, kw),
                like(NovelProjectTable.genre, kw),
              ),
            ))
            .all()
        )
        return c.json(rows.map(rowToProject))
      },
    )
    .get(
      "/:id",
      describeRoute({
        summary: "Get novel project by id",
        operationId: "novel.project.get",
        responses: {
          200: { content: { "application/json": { schema: resolver(NovelProject) } } },
          ...errors(404),
        },
      }),
      validator("param", z.object({ id: NovelProjectID })),
      async (c) => {
        const id = c.req.valid("param").id
        const row = Database.use((d) =>
          d.select().from(NovelProjectTable).where(eq(NovelProjectTable.id, id)).get()
        )
        if (!row || row.deleted_at) return c.json({ error: "not found" }, 404)
        return c.json(rowToProject(row))
      },
    )
    .post(
      "/",
      describeRoute({
        summary: "Create novel project",
        operationId: "novel.project.create",
        responses: {
          201: { content: { "application/json": { schema: resolver(NovelProject) } } },
          ...errors(400),
        },
      }),
      validator("json", CreateNovelProjectInput),
      async (c) => {
        const input = c.req.valid("json")
        const id = `novel_proj_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
        const now = Date.now()
        const row = {
          id,
          workspace_id: workspaceId(),
          name: input.name,
          genre: input.genre,
          description: input.description ?? "",
          total_word_count: 0,
          chapter_count: 0,
          character_count: input.protagonist ? 1 : 0,
          status: "draft",
          deleted_at: null,
          protagonist: input.protagonist ?? null,
          target_audience: input.targetAudience ?? null,
          writing_style: input.writingStyle ?? null,
          story_theme: input.storyTheme ?? null,
          custom_settings: input.customSettings ?? null,
          time_created: now,
          time_updated: now,
        }
        Database.use((d) => d.insert(NovelProjectTable).values(row).run())
        const created = Database.use((d) => d.select().from(NovelProjectTable).where(eq(NovelProjectTable.id, id)).get())!
        return c.json(rowToProject(created), 201)
      },
    )
    .patch(
      "/:id",
      describeRoute({
        summary: "Update novel project",
        operationId: "novel.project.update",
        responses: {
          200: { content: { "application/json": { schema: resolver(NovelProject) } } },
          ...errors(400, 404),
        },
      }),
      validator("param", z.object({ id: NovelProjectID })),
      validator("json", UpdateNovelProjectInput),
      async (c) => {
        const id = c.req.valid("param").id
        const input = c.req.valid("json")
        const existing = Database.use((d) => d.select().from(NovelProjectTable).where(eq(NovelProjectTable.id, id)).get())
        if (!existing || existing.deleted_at) return c.json({ error: "not found" }, 404)
        const update: Record<string, unknown> = { time_updated: Date.now() }
        if (input.name !== undefined) update.name = input.name
        if (input.description !== undefined) update.description = input.description
        if (input.status !== undefined) update.status = input.status
        if (input.totalWordCount !== undefined) update.total_word_count = input.totalWordCount
        if (input.chapterCount !== undefined) update.chapter_count = input.chapterCount
        if (input.characterCount !== undefined) update.character_count = input.characterCount
        Database.use((d) => d.update(NovelProjectTable).set(update).where(eq(NovelProjectTable.id, id)).run())
        const updated = Database.use((d) => d.select().from(NovelProjectTable).where(eq(NovelProjectTable.id, id)).get())!
        return c.json(rowToProject(updated))
      },
    )
    .delete(
      "/:id",
      describeRoute({
        summary: "Soft delete novel project (move to trash)",
        operationId: "novel.project.delete",
        responses: { 204: { description: "Deleted" }, ...errors(404) },
      }),
      validator("param", z.object({ id: NovelProjectID })),
      async (c) => {
        const id = c.req.valid("param").id
        const existing = Database.use((d) => d.select().from(NovelProjectTable).where(eq(NovelProjectTable.id, id)).get())
        if (!existing || existing.deleted_at) return c.json({ error: "not found" }, 404)
        Database.use((d) =>
          d.update(NovelProjectTable)
            .set({ deleted_at: Date.now(), status: "archived", time_updated: Date.now() })
            .where(eq(NovelProjectTable.id, id))
            .run()
        )
        return c.body(null, 204)
      },
    )
    .post(
      "/:id/restore",
      describeRoute({
        summary: "Restore novel project from trash",
        operationId: "novel.project.restore",
        responses: { 200: { content: { "application/json": { schema: resolver(NovelProject) } } }, ...errors(404) },
      }),
      validator("param", z.object({ id: NovelProjectID })),
      async (c) => {
        const id = c.req.valid("param").id
        const existing = Database.use((d) => d.select().from(NovelProjectTable).where(eq(NovelProjectTable.id, id)).get())
        if (!existing || !existing.deleted_at) return c.json({ error: "not found" }, 404)
        Database.use((d) =>
          d.update(NovelProjectTable)
            .set({ deleted_at: null, status: "draft", time_updated: Date.now() })
            .where(eq(NovelProjectTable.id, id))
            .run()
        )
        const restored = Database.use((d) => d.select().from(NovelProjectTable).where(eq(NovelProjectTable.id, id)).get())!
        return c.json(rowToProject(restored))
      },
    ),
)
```

---

## 5. 认证与安全

### 5.1 认证

复用 opencode server 的 basicAuth 机制（`server.ts:50-58`）：
- 若设置了 `OPENCODE_SERVER_PASSWORD` 环境变量，所有 `/novel/project/*` 路由自动受保护
- 前端 HTTP 客户端需携带 `Authorization: Basic <base64(user:pass)>` header
- 若未设置密码，路由公开访问（本地开发模式）

### 5.2 Workspace 隔离

- 所有查询均带 `where workspace_id = <当前 directory 哈希>`
- 通过 `WorkspaceRouterMiddleware` 的 `directory` query 参数确定当前 workspace
- 不同目录的项目数据完全隔离

### 5.3 输入校验

- 所有请求体通过 `validator("json", ZodSchema)` 校验
- `name` 限制 1-100 字符，`description` 限制 2000 字符
- `genre` / `status` / `targetAudience` 等枚举字段用 `z.enum()` 严格校验
- 防止 SQL 注入：drizzle ORM 自动参数化

---

## 6. 前端迁移策略（Mock → Real）

### 6.1 新建 HTTP 客户端

**位置**: `packages/app/src/novel/providers/novel-project-http.ts`（新建）

```typescript
import type { Project, CreateProjectInput } from '../types'
import type { INovelProjectProvider } from './index'
import type { ProviderError } from '../types/provider-error'

interface HttpClientConfig {
  baseURL: string           // e.g. http://localhost:4096
  directory: string         // 当前 workspace directory
  auth?: { user: string; pass: string }
}

export class NovelProjectHttpProvider implements INovelProjectProvider {
  private baseHeaders: Record<string, string>

  constructor(private config: HttpClientConfig) {
    this.baseHeaders = {
      'Content-Type': 'application/json',
      ...(config.auth
        ? { Authorization: `Basic ${btoa(`${config.auth.user}:${config.auth.pass}`)}` }
        : {}),
    }
  }

  private url(path: string): string {
    return `${this.config.baseURL}${path}?directory=${encodeURIComponent(this.config.directory)}`
  }

  private async handle<T>(res: Response): Promise<T> {
    if (!res.ok) {
      const e: ProviderError = {
        code: res.status === 404 ? 'NOT_FOUND' : 'REMOTE_ERROR',
        message: `HTTP ${res.status}: ${await res.text().catch(() => '')}`,
      }
      throw e
    }
    if (res.status === 204) return undefined as T
    return res.json() as Promise<T>
  }

  private adapt(p: RemoteProject): Project {
    return {
      id: p.id,
      name: p.name,
      genre: p.genre,
      description: p.description,
      totalWordCount: p.totalWordCount,
      chapterCount: p.chapterCount,
      characterCount: p.characterCount,
      lastUpdated: new Date(p.lastUpdated),
      status: p.status,
    }
  }

  async listProjects(): Promise<Project[]> {
    const res = await fetch(this.url('/novel/project'), { headers: this.baseHeaders })
    const data = await this.handle<RemoteProject[]>(res)
    return data.map(this.adapt)
  }

  async getProject(id: string): Promise<Project | null> {
    const res = await fetch(this.url(`/novel/project/${id}`), { headers: this.baseHeaders })
    if (res.status === 404) return null
    return this.adapt(await this.handle<RemoteProject>(res))
  }

  async getActiveProject(): Promise<Project | null> {
    const all = await this.listProjects()
    return all.find(p => p.status === 'active') ?? null
  }

  async searchProjects(keyword: string): Promise<Project[]> {
    const res = await fetch(this.url(`/novel/project/search?q=${encodeURIComponent(keyword)}`), { headers: this.baseHeaders })
    const data = await this.handle<RemoteProject[]>(res)
    return data.map(this.adapt)
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    const res = await fetch(this.url('/novel/project'), {
      method: 'POST',
      headers: this.baseHeaders,
      body: JSON.stringify(input),
    })
    return this.adapt(await this.handle<RemoteProject>(res))
  }

  async deleteProject(id: string): Promise<void> {
    const res = await fetch(this.url(`/novel/project/${id}`), { method: 'DELETE', headers: this.baseHeaders })
    await this.handle<void>(res)
  }

  async restoreProject(id: string): Promise<void> {
    const res = await fetch(this.url(`/novel/project/${id}/restore`), { method: 'POST', headers: this.baseHeaders })
    await this.handle<void>(res)
  }

  async listDeletedProjects(): Promise<Project[]> {
    const res = await fetch(this.url('/novel/project/trash'), { headers: this.baseHeaders })
    const data = await this.handle<RemoteProject[]>(res)
    return data.map(this.adapt)
  }
}

interface RemoteProject {
  id: string
  name: string
  genre: string
  description: string
  totalWordCount: number
  chapterCount: number
  characterCount: number
  lastUpdated: number   // Unix ms
  status: 'active' | 'archived' | 'draft'
}
```

### 6.2 Provider 切换策略

**位置**: `packages/app/src/novel/hooks/use-novel-project.ts`

```typescript
// 根据 FeatureGate 决定使用 mock 还是 http
const projectProvider: INovelProjectProvider = gates.realNovelBackendEnabled
  ? new NovelProjectHttpProvider({
      baseURL: import.meta.env.VITE_OPENCODE_SERVER_URL ?? 'http://localhost:4096',
      directory: import.meta.env.VITE_WORKSPACE_DIRECTORY ?? process.cwd(),
      auth: import.meta.env.VITE_OPENCODE_AUTH
        ? { user: 'opencode', pass: import.meta.env.VITE_OPENCODE_AUTH }
        : undefined,
    })
  : new NovelProjectProvider()  // 保留 mock 作为 fallback
```

### 6.3 FeatureGate 新增

**位置**: `packages/app/src/novel/llm/feature-gates.ts`

```typescript
realNovelBackendEnabled: boolean  // 默认 false，开启后使用 HTTP Provider
```

### 6.4 创建项目流程修复

**位置**: `packages/app/src/novel/components/layout/novel-app-shell.tsx:37`

**当前（断裂）**:
```typescript
onSubmit={async () => nav.openView('workspace')}  // 忽略 input
```

**修复后**:
```typescript
onSubmit={async (input: CreateProjectInput) => {
  try {
    const project = await projectProvider.createProject(input)
    selectProject(project.id)
    nav.openView('workspace')
  } catch (e) {
    // 错误处理：toast 提示
  }
}}
```

---

## 7. 实施步骤（分阶段）

### 阶段 1：后端建表与路由（P0）

1. 新建 `packages/opencode/src/novel/` 目录
2. 创建 `novel-project.sql.ts`（drizzle schema）
3. 创建 `schema.ts`（zod schema）
4. 创建 `server/routes/novel-project.ts`（Hono 路由）
5. 在 `server/instance.ts` 注册路由：`.route("/novel/project", NovelProjectRoutes())`
6. 数据库迁移：drizzle 自动建表（`drizzle-kit generate` + `migrate`）
7. 后端单元测试：验证 CRUD + 软删除 + 搜索 + workspace 隔离

### 阶段 2：前端 HTTP Provider（P0）

1. 新建 `providers/novel-project-http.ts`
2. 实现 `INovelProjectProvider` 接口，所有方法调用 HTTP API
3. 新增 `realNovelBackendEnabled` FeatureGate
4. 修改 `use-novel-project.ts` 根据 FeatureGate 切换 Provider
5. 修复 `novel-app-shell.tsx:37` 创建项目流程断裂

### 阶段 3：集成测试与 E2E（P1）

1. Playwright E2E 测试补充：
   - 视觉断言：弹框背景色、字体色、hover 选中色（验证样式修复）
   - 持久化验证：创建项目 → 刷新页面 → 项目仍在
   - 真实 API 调用验证：监听 network，断言 `/novel/project` 请求
   - 回收站验证：删除 → 撤销 → 项目恢复
2. 启动 opencode server + 前端，端到端验证

### 阶段 4：文档更新（P2）

1. 在 `PAGE-03_bookshelf.md` 补充"后端 API 设计"章节
2. 更新"数据契约"章节为真实 API 契约（非前端 Hook 契约）
3. 删除"附录 B：Mock 数据结构"，改为"附录 B：数据库 Schema"

---

## 8. 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| drizzle schema 变更需数据库迁移 | 中 | 使用 `drizzle-kit` 自动生成迁移脚本，开发期可 drop 重建 |
| workspace_id 用 directory 哈希可能冲突 | 低 | SHA-256 前 16 位，碰撞概率极低；后续可改为 Instance.project.id |
| 前端 mock 与 http Provider 切换导致行为不一致 | 中 | 保留 mock Provider 作为 fallback，FeatureGate 控制；测试覆盖两种路径 |
| basicAuth 凭证在前端存储 | 低 | 仅本地开发环境使用；生产环境通过 Tauri 注入，不写入源码 |
| `searchProjects` 用 SQL LIKE 性能 | 低 | 小说项目数量通常 < 100，LIKE 足够；未来可加 FTS5 |

---

## 9. Exit Criteria（验收标准）

### 后端
- [ ] `packages/opencode/src/novel/novel-project.sql.ts` 创建，drizzle schema 定义完整
- [ ] `packages/opencode/src/novel/schema.ts` 创建，zod schema 定义完整
- [ ] `packages/opencode/src/server/routes/novel-project.ts` 创建，8 个端点全部实现
- [ ] `server/instance.ts` 注册 `/novel/project` 路由
- [ ] `bun test` 后端单元测试通过（CRUD + 软删除 + 搜索 + workspace 隔离）
- [ ] OpenAPI spec 生成成功（`/doc` 端点可访问）

### 前端
- [ ] `providers/novel-project-http.ts` 创建，实现 `INovelProjectProvider` 接口
- [ ] `feature-gates.ts` 新增 `realNovelBackendEnabled`
- [ ] `use-novel-project.ts` 根据 FeatureGate 切换 Provider
- [ ] `novel-app-shell.tsx:37` 创建项目流程修复（调用 `createProject(input)` 再跳转）
- [ ] `bun typecheck` 通过
- [ ] `bun test src/novel` 全部通过
- [ ] `bun run novel:precommit` 通过

### 集成
- [ ] 启动 opencode server + 前端，创建项目 → 刷新 → 项目持久化
- [ ] Playwright E2E 验证真实 API 调用（network 监听）
- [ ] Playwright E2E 验证弹框样式（视觉断言）

---

## 10. 文件清单

### 新建文件（后端）
| 路径 | 说明 | 预估行数 |
|------|------|---------|
| `packages/opencode/src/novel/novel-project.sql.ts` | drizzle schema | ~30 |
| `packages/opencode/src/novel/schema.ts` | zod schema | ~50 |
| `packages/opencode/src/server/routes/novel-project.ts` | Hono 路由 | ~200 |

### 新建文件（前端）
| 路径 | 说明 | 预估行数 |
|------|------|---------|
| `packages/app/src/novel/providers/novel-project-http.ts` | HTTP Provider | ~120 |

### 修改文件
| 路径 | 修改内容 |
|------|---------|
| `packages/opencode/src/server/instance.ts` | 注册 `/novel/project` 路由 |
| `packages/app/src/novel/llm/feature-gates.ts` | 新增 `realNovelBackendEnabled` |
| `packages/app/src/novel/hooks/use-novel-project.ts` | 根据 FeatureGate 切换 Provider |
| `packages/app/src/novel/components/layout/novel-app-shell.tsx` | 修复创建项目流程断裂 |
| `packages/app/src/novel/docs/page-specs/PAGE-03_bookshelf.md` | 补充后端 API 设计章节 |

---

## 11. 结论

本方案通过新建独立的 `novel_project` 表和 `/novel/project/*` REST API，将 Novel 模块从纯前端 mock 迁移为真实后端持久化。关键决策：

1. **不复用 opencode Project 系统**：语义不同（代码项目 vs 小说项目），独立建表避免 schema 污染
2. **复用 opencode server 基础设施**：Hono + drizzle + SQLite + basicAuth + CORS，保持架构一致性
3. **FeatureGate 控制迁移**：`realNovelBackendEnabled` 默认 false，可平滑切换 mock/real
4. **软删除 + 回收站**：`deleted_at` 字段实现，支持撤销删除

**[READY_FOR_BACKEND_IMPLEMENTATION_REVIEW]**

> 本方案为设计文档，未包含代码实施。实施需按"阶段 1 → 阶段 2 → 阶段 3"顺序进行，每阶段通过测试后方可进入下一阶段。

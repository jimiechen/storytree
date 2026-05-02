# OpenCode 代码库分析报告：AI 小说编辑器改造参考

**生成时间**：2026-05-02  
**分析目标**：为基于 OpenCode 二次开发的 AI 小说编辑器提供架构和技术参考

---

## 1. 顶层目录结构

### 结论

OpenCode 采用 **Monorepo** 架构，将核心功能、Web 应用、桌面应用等分离到不同的子包中，便于维护和复用。最适合 AI 小说编辑器改造的是 `packages/app`（Web 应用）和 `packages/opencode`（核心逻辑）。

### 目录树（节选）

```
/workspace/caiode/opencode
├── packages/
│   ├── app/                    # Web 前端应用（UI 改造主要目标）
│   │   ├── src/
│   │   │   ├── components/     # 通用组件
│   │   │   ├── context/        # 状态管理上下文
│   │   │   ├── pages/          # 页面组件
│   │   │   └── utils/          # 工具函数
│   │   └── package.json
│   │
│   ├── opencode/               # 核心逻辑包（Provider、工具、存储）
│   │   ├── src/
│   │   │   ├── agent/          # Agent 相关
│   │   │   ├── filesystem/     # 文件系统抽象
│   │   │   ├── project/        # 项目管理
│   │   │   ├── session/        # 会话管理
│   │   │   ├── storage/        # 存储层
│   │   │   ├── tool/           # 工具系统（read/write/编辑等）
│   │   │   └── worktree/       # 工作区管理
│   │   └── package.json
│   │
│   ├── desktop/                # Tauri 桌面应用
│   ├── desktop-electron/       # Electron 桌面应用
│   └── plugin/                 # 插件系统
│
├── patches/                    # 依赖包补丁
└── package.json                # 根 package.json
```

### 关键文件

- **根 package.json**：`/workspace/caiode/opencode/package.json`
  - 包管理器：Bun
  - 技术栈：Solid.js、Effect、Zod、Drizzle ORM、Playwright
  - 主入口：`packages/opencode/src/index.ts`

### 对小说编辑器的影响

✅ **可复用性强**：Web 应用 UI 框架已搭建，只需定制化改造  
✅ **架构清晰**：Provider 模式便于 Mock/真实实现切换  
⚠️ **技术栈学习曲线**：Effect（FP）、Solid.js（响应式 UI）、Bun（运行时）

---

## 2. 前端入口和 UI 架构

### 结论

OpenCode 使用 **Solid.js** 作为 UI 框架，采用 **Context + Hooks** 模式管理状态，**组件树**构成完整界面。路由由 `@solidjs/router` 管理，支持动态会话路由。

### 前端入口

- **Web 应用入口**：`packages/app/src/index.ts`
  - 初始化全局 Context Providers
  - 配置路由和主题
  - 连接后端服务

- **主 App 组件**：`packages/app/src/app.tsx`（节选）

```typescript
// packages/app/src/app.tsx（核心 Context 提供者）
export function AppBaseProviders(props: ParentProps<{ locale?: Locale }>) {
  return (
    <MetaProvider>
      <Font />
      <ThemeProvider>
        <LanguageProvider locale={props.locale}>
          <UiI18nBridge>
            <ErrorBoundary fallback={...}>
              <QueryProvider>
                <DialogProvider>
                  <MarkedProvider>
                    <FileComponentProvider component={File}>
                      {props.children}
                    </FileComponentProvider>
                  </MarkedProvider>
                </DialogProvider>
              </QueryProvider>
            </ErrorBoundary>
          </UiI18nBridge>
        </LanguageProvider>
      </ThemeProvider>
    </MetaProvider>
  );
}
```

### 主要 Context（状态管理）

| Context | 用途 | 文件位置 |
|---|---|---|
| `GlobalSync` | 同步会话数据、项目数据 | `packages/app/src/context/global-sync/` |
| `File` | 文件树、文件内容缓存、文件监听 | `packages/app/src/context/file/` |
| `Terminal` | 终端面板、终端会话 | `packages/app/src/context/terminal/` |
| `Permission` | 权限管理、用户确认 | `packages/app/src/context/permission/` |
| `Layout` | 布局状态（面板开合、尺寸） | `packages/app/src/context/layout.ts` |
| `Settings` | 设置管理 | `packages/app/src/context/settings/` |

### 核心页面组件

- **Home**：欢迎页（`packages/app/src/pages/home.tsx`）
- **Session**：会话主界面（`packages/app/src/pages/session.tsx`）
  - 左侧文件树
  - 中间消息时间线
  - 底部提示输入区
  - 右侧终端/项目信息

### UI 组件库

- 使用 **@opencode-ai/ui** 内部库
- 包含组件：`Button`、`Dialog`、`FileTree`、`Tabs` 等
- 支持主题切换

### 样式方案

- **Tailwind CSS**（`packages/app/src/index.css`）
- CSS 变量定义主题色
- 响应式设计（移动/桌面）

### 测试框架

- **单元测试**：Bun 测试库（`packages/app/src/` 下 `*.test.ts`）
- **E2E 测试**：Playwright（`packages/app/e2e/`）

### 对小说编辑器的影响

✅ **Context 模式可复用**：只需新增/替换 Provider 以适配小说数据  
✅ **组件库已成熟**：可复用 `FileTree`、`Tabs`、`Dialog` 等组件  
✅ **会话 UI 结构可借鉴**：会话页面的面板布局适合小说编辑器  
✅ **响应式设计已支持**：无需从零做适配

---

## 3. 适合小说编辑器的 UI 接入方案

### 结论

推荐采用 **"现有 Workspace 基础上的模式切换"** 方案，而非全新创建。这样可以最大程度复用 OpenCode 的功能，同时避免大量重构。

### 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|---|---|---|---|
| **独立新页面** | 完全隔离、定制灵活 | 代码复用低、与现有功能分离 | ⭐⭐ |
| **Workspace Mode 切换** | 与现有 UI 无缝融合、保留功能 | 需处理模式切换逻辑 | ⭐⭐⭐⭐⭐ |
| **插件扩展** | 最小侵入性、符合架构 | 插件 API 限制多 | ⭐⭐⭐ |

### 推荐方案详细设计

#### 方案："小说创作" Workspace Mode

**架构设计**：

1. **Context 新增**：`NovelContext` 管理小说相关状态
2. **面板定制**：
   - 左侧：章节树 + 角色/世界观面板
   - 中间：章节编辑 + AI 提示
   - 右侧：分支结构 + 发布状态
3. **路由扩展**：`/:dir/novel` 路由
4. **Provider 适配**：复用 `GlobalSync`、`File` 等基础 Provider

**接入步骤**：

1. 在 `packages/app/src/context/` 新增 `novel/` 目录
2. 在 `packages/app/src/pages/` 新增 `novel/` 目录（章节编辑、分支管理）
3. 扩展 `Layout` Context 支持"小说模式"
4. 在 Home 页面新增"打开小说创作环境"入口
5. 修改路由配置

---

## 4. 数据流与状态管理

### 结论

OpenCode 采用 **本地优先（Local-first）** 架构，数据存储在本地 SQLite，通过 **GlobalSync Context** 协调 UI 状态与存储状态。使用 **Effect** 库处理副作用，数据流清晰可追踪。

### 核心数据流图

```
用户交互 → UI 组件 → Context Hook → SDK Client → Effect Service → Storage/SQLite → GlobalSync 更新 → UI 重渲染
```

### SDK 客户端

- **位置**：`packages/app/src/context/global-sdk.tsx`
- **服务**：`packages/opencode/src/` 下各模块
- **通信**：通过 Effect 依赖注入或直接调用

### Session 数据同步

- **Session 加载**：`packages/app/src/context/global-sync/session-load.ts`
- **消息管理**：`packages/app/src/context/global-sync/event-reducer.ts`
- **状态投影**：Projectors 将原始数据映射为 UI 友好格式

### 事件总线

- **Bus Event**：`packages/opencode/src/bus/bus-event.ts`
- **使用**：模块间通信通过事件总线，松耦合

### 对小说编辑器的影响

✅ **Local-first 完全适配小说创作需求**：离线可用、数据主权在用户  
✅ **GlobalSync 模式可复用**：只需定义小说相关的 Event Reducer  
✅ **Effect 数据流清晰**：便于理解和改造  
⚠️ **Effect 的 FP 学习成本**：团队需要理解副作用处理模式

---

## 5. 文件读写机制

### 结论

OpenCode 已实现完整的文件读写工具系统，包括 `read`、`write`、`edit` 等工具，通过 **Provider 模式** 抽象文件系统操作，支持安全边界检查。

### 工具系统核心

- **工具定义**：`packages/opencode/src/tool/tool.ts`

```typescript
// Tool.Def 接口（工具定义）
export namespace Tool {
  export interface Def<Parameters extends z.ZodType = z.ZodType, M extends Metadata = Metadata> {
    description: string
    parameters: Parameters
    execute(
      args: z.infer<Parameters>,
      ctx: Context,
    ): Promise<{
      title: string
      metadata: M
      output: string
      attachments?: Omit<MessageV2.FilePart, "id" | "sessionID" | "messageID">[]
    }>
    formatValidationError?(error: z.ZodError): string
  }
}
```

### 主要工具

| 工具 | 文件位置 | 用途 |
|---|---|---|
| `ReadTool` | `packages/opencode/src/tool/read.ts` | 读取文件/目录 |
| `WriteTool` | `packages/opencode/src/tool/write.ts` | 写入文件 |
| `EditTool` | `packages/opencode/src/tool/edit.ts` | 编辑文件 |
| `GlobTool` | `packages/opencode/src/tool/glob.ts` | 搜索文件 |

### ReadTool 详细分析

- **参数**：`filePath`（绝对路径）、`offset`（起始行）、`limit`（行数限制）
- **功能**：
  - 读取文件/目录
  - 自动处理相对路径 → 绝对路径
  - 权限检查（当前沙箱目录外拒绝）
  - 二进制文件检测
  - 图片/PDF 特殊处理
  - 行号标注输出
- **代码片段**（`read.ts`）：

```typescript
// packages/opencode/src/tool/read.ts
const parameters = z.object({
  filePath: z.string().describe("The absolute path to the file or directory to read"),
  offset: z.coerce.number().describe("The line number to start reading from (1-indexed)").optional(),
  limit: z.coerce.number().describe("The maximum number of lines to read (defaults to 2000)").optional(),
})

export const ReadTool = Tool.defineEffect("read", Effect.gen(function* () {
  const fs = yield* AppFileSystem.Service
  // ... 权限检查、文件读取、结果格式化
}))
```

### 文件系统抽象

- **AppFileSystem**：`packages/opencode/src/filesystem/index.ts`
- **功能**：路径归一化、MIME 类型、文件监听
- **沙箱安全**：工具调用前会检查路径是否在允许范围内

### 项目目录管理

- **Project.Instance**：`packages/opencode/src/project/instance.ts`
- **worktree**：当前工作区根路径
- **directory**：当前会话目录

### 对小说编辑器的影响

✅ **文件读写工具可直接复用**：无需重新实现  
✅ **沙箱安全机制适配多版本创作**：天然适合沙箱隔离不同创作方案  
✅ **工具系统扩展性好**：可新增小说专用工具（如"章节续写"）

---

## 6. Agent 与工具调用机制

### 结论

OpenCode Agent 系统通过 **工具注册表** 管理可用工具，**会话处理器** 协调工具调用、消息管理、历史压缩等。AI 提示通过 `Instruction` Service 定制。

### 工具注册表

- **位置**：`packages/opencode/src/tool/` 各模块
- **注册方式**：通过 `Tool.define` 或 `Tool.defineEffect` 定义
- **权限检查**：工具执行前需要用户确认（`Permission.Context.ask`）

### 会话处理流程

- **Session.Processor**：`packages/opencode/src/session/processor.ts`
- **消息管理**：`packages/opencode/src/session/message.ts`
- **历史压缩**：`packages/opencode/src/session/compaction.ts`
- **提示注入**：`packages/opencode/src/session/instruction.ts`

### Agent 信息

- **Agent.Type**：`packages/opencode/src/agent/agent.ts`
- **功能**：配置 Agent 身份、提示词、权限等

### 对小说编辑器的影响

✅ **工具注册机制可复用**：新增小说相关工具  
✅ **权限检查机制可复用**：限制 Agent 访问范围  
✅ **会话历史管理可借鉴**：管理创作历史、分支版本

---

## 7. 测试框架与开发工具

### 结论

OpenCode 使用 **Bun 测试库** 做单元测试，**Playwright** 做 E2E 测试，支持 **Component Tests**。开发工具包括 ESLint、Prettier、Husky。

### 测试目录结构

```
packages/app/
├── e2e/                   # Playwright E2E 测试
│   ├── actions.ts         # 测试动作
│   ├── selectors.ts       # 选择器
│   └── *.spec.ts
└── src/
    ├── *.test.ts          # 单元测试
    └── **/*.test.ts
```

### 测试运行命令

- **单元测试**：`bun --cwd packages/app test`
- **E2E 测试**：`bun --cwd packages/app test:e2e`
- **类型检查**：`bun --cwd packages/app typecheck`

### 对小说编辑器的影响

✅ **TDD 模式已有基础**：按照 PRD 中的 TDD 建议执行  
✅ **E2E 测试可复用框架**：只需新增小说创作流程测试  
✅ **测试工具已成熟**：可直接复用测试 Helpers 和 Selectors

---

## 8. 对 AI 小说编辑器 Mock 开发的建议

### 可复用的类型与组件

| 组件/类型 | 来源 | 用途 |
|---|---|---|
| `FileProvider` | `packages/app/src/context/file` | 管理小说项目文件树 |
| `ThemeProvider` | `@opencode-ai/ui` | UI 主题切换 |
| `QueryClient` | `@tanstack/solid-query` | 数据查询缓存 |
| `Button` / `Dialog` / `Tabs` | `@opencode-ai/ui` | UI 控件 |
| `Storage` 架构 | `packages/opencode/src/storage` | 小说数据存储 |
| `Tool.Def` 接口 | `packages/opencode/src/tool/tool.ts` | 定义小说专用工具 |

### Mock Provider 开发建议

1. **目录结构**（建议新建）：

```
packages/app/src/novel/
├── context/
│   ├── novel.tsx          # Novel 主 Context
│   ├── chapter.tsx        # 章节管理
│   ├── character.tsx      # 角色卡
│   ├── world.tsx          # 世界观设定
│   └── branch.tsx         # 分支剧情
├── provider/
│   ├── mock/              # Mock Provider 实现
│   │   ├── mock-novel.ts
│   │   ├── mock-chapter.ts
│   │   └── ...
│   └── real/              # 真实 Provider 实现
├── components/
│   ├── chapter-tree.tsx   # 章节树组件
│   ├── character-card.tsx # 角色卡
│   └── ...
└── pages/
    └── novel-editor.tsx   # 主编辑页
```

2. **Mock 数据定义**：在 `packages/app/src/novel/provider/mock/fixtures/` 下创建典型小说项目示例，用于 UI 开发。

3. **Provider 接口设计**：

```typescript
// 示例：Novel Provider 接口
interface NovelProvider {
  project: NovelProject
  chapters: Chapter[]
  characters: Character[]
  worldSettings: WorldSetting[]
  branches: BranchNode[]
  
  loadChapter(id: string): Promise<Chapter>
  saveChapter(id: string, content: string): Promise<void>
  createBranch(parentId: string, choice: string): Promise<BranchNode>
  // ...
}
```

### 可直接复用不修改的模块

| 模块 | 用途 | 不修改原因 |
|---|---|---|
| `GlobalSync` | 数据同步 | 与 UI 状态管理无关，可复用 |
| `Layout` Context | 布局状态 | 只需新增 Mode 切换，无需重写 |
| `ThemeProvider` | 主题系统 | UI 主题与功能无关 |
| `FileTree` 组件 | 文件浏览 | 适配小说项目结构即可 |

### 新建/改造的重点模块

1. **Session 页面改造** → 小说编辑页面
2. **Context 新增** → Novel 相关状态管理
3. **Provider 新增** → 小说数据存取
4. **工具新增** → AI 小说创作专用工具
5. **测试新增** → 小说创作流程测试

---

## 附录：关键文件速查表

| 功能 | 文件路径 |
|---|---|
| Web 应用入口 | `/workspace/caiode/opencode/packages/app/src/index.ts` |
| App 组件 | `/workspace/caiode/opencode/packages/app/src/app.tsx` |
| 会话页面 | `/workspace/caiode/opencode/packages/app/src/pages/session.tsx` |
| Tool 接口 | `/workspace/caiode/opencode/packages/opencode/src/tool/tool.ts` |
| Read 工具 | `/workspace/caiode/opencode/packages/opencode/src/tool/read.ts` |
| File Context | `/workspace/caiode/opencode/packages/app/src/context/file/` |
| GlobalSync | `/workspace/caiode/opencode/packages/app/src/context/global-sync/` |
| 项目管理 | `/workspace/caiode/opencode/packages/opencode/src/project/` |
| 会话管理 | `/workspace/caiode/opencode/packages/opencode/src/session/` |
| 存储层 | `/workspace/caiode/opencode/packages/opencode/src/storage/` |

---

## 总结

OpenCode 代码库架构清晰，采用现代技术栈（Solid.js、Effect、Bun），完全适合作为 AI 小说编辑器的基础进行二次开发。推荐采用 **"现有 Workspace 基础上的模式切换"** 方案，复用现有 Context、组件、工具系统，只需新增小说相关的 Provider 和 UI 组件即可。

**建议下一步**：按照 PRD 中的"多模型智能体分工方案"，创建 Mock Provider 和基础 UI 框架，快速验证主流程。

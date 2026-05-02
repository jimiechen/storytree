# opencode Code Wiki

## 目录概述

Opencode 是一个 AI 驱动的开发工具，提供完整的开发环境，包括终端 UI (TUI)、桌面应用、Web 应用等。

### 技术栈
- **运行时**: Bun (Node.js 兼容)
- **前端框架**: Solid.js
- **效果系统**: Effect (函数式编程)
- **样式**: Tailwind CSS
- **构建**: Vite
- **数据库**: Drizzle ORM + SQLite
- **桌面应用**: Tauri / Electron
- **后端**: Hono (Web 框架)
- **包管理**: Turbo (Monorepo)
- **部署**: SST

---

## 项目结构

### Monorepo 结构

```
opencode/
├── packages/
│   ├── opencode/          # 核心库 (TUI/CLI)
│   ├── app/              # Web 应用
│   ├── desktop/          # Tauri 桌面应用
│   ├── desktop-electron/ # Electron 桌面应用
│   ├── console/          # 控制台 (SaaS)
│   ├── docs/             # 文档
│   ├── ui/               # UI 组件库
│   ├── plugin/           # 插件系统
│   ├── script/           # 脚本工具
│   ├── sdk/              # SDK
│   ├── storybook/        # Storybook
│   ├── util/             # 工具函数
│   ├── web/              # 官网
│   └── containers/       # Docker 容器
├── .opencode/           # 配置目录
├── .github/             # GitHub Actions
├── infra/               # 基础设施 (SST)
├── nix/                 # Nix 配置
├── patches/             # 依赖补丁
└── script/              # 脚本
```

---

## 核心模块详解

### 1. packages/opencode/ (核心库)

**主要功能**:
- TUI (终端 UI) 界面
- AI 对话系统
- 工具执行系统
- 会话管理
- 项目管理
- 插件系统
- MCP (Model Context Protocol)

**目录结构**:
```
src/
├── account/             # 账户管理
├── acp/                 # Agent Control Plane
├── agent/               # Agent 系统
├── auth/                # 认证
├── bus/                 # 事件总线
├── cli/                 # CLI 入口
├── command/             # 命令系统
├── config/              # 配置管理
├── control-plane/       # 控制平面
├── effect/              # Effect 效果系统
├── env/                 # 环境变量
├── file/                # 文件操作
├── filesystem/          # 文件系统
├── flag/                # 特性标志
├── format/              # 格式化
├── git/                 # Git 集成
├── global/              # 全局状态
├── id/                  # ID 生成
├── ide/                 # IDE 集成
├── installation/        # 安装管理
├── lsp/                 # LSP 客户端
├── mcp/                 # MCP 集成
├── npm/                 # NPM 集成
├── patch/               # 补丁系统
├── permission/          # 权限系统
├── plugin/              # 插件系统
├── project/             # 项目管理
├── provider/            # AI Provider
├── pty/                 # PTY (伪终端)
├── question/            # 问题系统
├── server/              # 服务器
├── session/             # 会话管理
├── share/               # 分享功能
├── shell/               # Shell 集成
├── skill/               # Skill 系统
├── snapshot/            # 快照系统
├── storage/             # 存储
├── sync/                # 同步系统
├── tool/                # 工具集
├── util/                # 工具函数
└── worktree/            # Worktree 管理
```

**核心工具 (src/tool/)**:
- `bash.ts`: Bash 命令执行
- `read.ts`: 读取文件
- `write.ts`: 写入文件
- `edit.ts`: 编辑文件
- `grep.ts`: Grep 搜索
- `glob.ts`: Glob 模式匹配
- `ls.ts`: 列出文件
- `codesearch.ts`: 代码搜索
- `lsp.ts`: LSP 集成
- `todo.ts`: Todo 管理
- `task.ts`: 任务管理
- `plan.ts`: 计划模式
- `multiedit.ts`: 多文件编辑
- `apply_patch.ts`: 应用补丁
- `websearch.ts`: Web 搜索
- `webfetch.ts`: Web 抓取
- `skill.ts`: Skill 调用
- `question.ts`: 问题询问
- `truncate.ts`: 截断工具
- `batch.ts`: 批量操作
- `external-directory.ts`: 外部目录

**会话系统 (src/session/)**:
- 消息历史管理
- 提示词构建
- LLM 调用
- 消息压缩
- 会话状态
- 撤销/重做
- 指令系统

**权限系统 (src/permission/)**:
- 工具权限评估
- 权限规则
- 自动批准规则
- 权限模式

---

### 2. packages/app/ (Web 应用)

**功能**:
- Web 版本的 Opencode
- AI 对话界面
- 项目管理
- 文件浏览器

**目录结构**:
```
src/
├── app.tsx             # 主应用
├── entry.tsx           # 入口
├── index.ts            # 主入口
└── index.css           # 样式
e2e/                    # E2E 测试
public/                 # 静态资源
```

---

### 3. packages/desktop/ (Tauri 桌面应用)

**功能**:
- 原生桌面应用
- 使用 Tauri (Rust)
- Webview 渲染 UI

**目录结构**:
```
src/
├── bindings.ts         # Tauri 绑定
├── cli.ts              # CLI
├── entry.tsx           # 入口
├── index.tsx           # 主应用
├── loading.tsx         # 加载页面
├── menu.ts             # 菜单
├── styles.css          # 样式
├── updater.ts          # 自动更新
└── webview-zoom.ts     # 缩放
src-tauri/              # Rust 后端
├── Cargo.toml
├── tauri.conf.json
└── build.rs
```

---

### 4. packages/console/ (控制台 SaaS)

**功能**:
- 多租户 SaaS 平台
- 用户管理
- 组织管理
- 会话同步

**目录结构**:
```
app/                    # Web 应用
core/                   # 核心逻辑 (Drizzle ORM)
function/               # Cloudflare Workers
mail/                   # 邮件服务
resource/               # 资源定义
```

---

### 5. packages/plugin/ (插件系统)

**功能**:
- 插件加载
- 插件 API
- 自定义工具
- TUI 插件

**核心文件**:
```
src/
├── index.ts            # 插件入口
├── tool.ts             # 工具 API
├── tui.ts              # TUI API
└── shell.ts            # Shell API
```

---

### 6. .opencode/ (配置目录)

**结构**:
```
.opencode/
├── agent/              # Agent 定义
├── command/            # 自定义命令
├── glossary/           # 多语言词汇表
├── plugins/            # 插件
├── themes/             # 主题
├── tool/               # 自定义工具
├── opencode.jsonc      # 配置文件
├── tui.json            # TUI 配置
└── env.d.ts            # 类型定义
```

---

## 核心架构

### Effect 效果系统

Opencode 大量使用 Effect 库进行函数式编程：

```typescript
// Effect 模式示例
import { Effect } from "effect"

const program = Effect.gen(function*() {
  const file = yield* readFile("test.txt")
  const parsed = yield* parseJSON(file)
  return parsed
})

// 错误处理
const result = await Effect.runPromise(
  program.pipe(Effect.catchAll((error) => Effect.succeed({ error })))
)
```

**主要特性**:
- 类型安全的错误处理
- 依赖注入
- 异步操作
- 可测试性
- 可组合性

---

### 会话架构

```
用户输入
    ↓
Session.process()
    ↓
消息历史管理
    ↓
构建提示词
    ↓
调用 Provider (LLM)
    ↓
工具调用 (Tool Use)
    ↓
权限检查 (Permission)
    ↓
执行工具
    ↓
返回结果
    ↓
更新会话状态
```

---

### 工具系统架构

```
Tool 定义 (buildTool())
    ↓
Tool Registry
    ↓
权限评估 (evaluatePermission())
    ↓
工具执行 (call())
    ↓
进度报告 (onProgress())
    ↓
结果返回
```

---

## 核心概念

### Provider (AI 提供商)

**位置**: `packages/opencode/src/provider/`

**支持的 Provider**:
- Anthropic Claude
- OpenAI GPT
- 自定义 Provider

**功能**:
- 模型列表
- API 调用
- 流式输出
- 错误处理

---

### Skill 系统

**位置**: `packages/opencode/src/skill/`

**功能**:
- 动态发现 Skills
- 加载 Skill 目录
- Skill 调用

**Skill 目录结构**:
```
.opencode/skills/
└── my-skill/
    ├── SKILL.md
    └── (其他资源)
```

---

### 插件系统

**位置**: `packages/plugin/`

**插件 API**:
```typescript
import { definePlugin, Tool, Tui } from "@opencode-ai/plugin"

export default definePlugin({
  name: "my-plugin",
  tools: [
    // 自定义工具
  ],
  tui: {
    // TUI 组件
  },
})
```

---

### MCP (Model Context Protocol)

**位置**: `packages/opencode/src/mcp/`

**功能**:
- MCP 客户端
- OAuth 认证
- 动态工具加载

---

## CLI 命令

**启动开发服务器**:
```bash
# 核心 TUI
bun run dev

# Web 应用
bun run dev:web

# 桌面应用
bun run dev:desktop

# 控制台
bun run dev:console

# Storybook
bun run dev:storybook
```

**其他命令**:
```bash
# 类型检查
bun run typecheck

# 构建
bun --cwd packages/opencode build

# 发布
bun --cwd packages/opencode publish
```

---

## 数据库模式

**ORM**: Drizzle ORM

**主要表**:
- `account`: 账户
- `session`: 会话
- `message`: 消息
- `project`: 项目
- `workspace`: 工作区
- `event`: 事件
- `share`: 分享

**迁移位置**: `packages/opencode/migration/`

---

## 开发指南

### 设置开发环境

```bash
# 1. 安装依赖
bun install

# 2. 安装 Git Hooks
bun run prepare

# 3. 启动开发
bun run dev
```

### 添加新工具

1. 在 `packages/opencode/src/tool/` 创建新文件
2. 使用 `buildTool()` 定义工具
3. 在 `registry.ts` 注册
4. 添加 `.txt` 提示词文件

```typescript
// 示例工具
import { buildTool } from "./tool.js"
import { z } from "zod"

export const MyTool = buildTool({
  name: "my_tool",
  description: "My custom tool",
  inputSchema: z.object({
    param: z.string(),
  }),
  call: async (input, context) => {
    return { data: { result: "success" } }
  },
})
```

### 创建插件

1. 使用 `@opencode-ai/plugin`
2. 定义工具和 UI 组件
3. 放置在 `.opencode/plugins/` 或发布到 npm

### 添加 Effect 服务

```typescript
import { Effect, Context } from "effect"

class MyService extends Context.Tag("MyService")<
  MyService,
  {
    doSomething: () => Effect.Effect<void>
  }
>() {}

const live = MyService.of({
  doSomething: () => Effect.succeed(undefined),
})
```

---

## 配置

### opencode.jsonc

```jsonc
{
  "provider": {
    "type": "anthropic",
    "apiKey": "sk-..."
  },
  "theme": "dark",
  "plugins": ["my-plugin"]
}
```

### tui.json

```json
{
  "keybindings": {
    "ctrl+c": "exit"
  }
}
```

---

## 测试

**测试框架**: Bun test + Playwright

**运行测试**:
```bash
# 单元测试
bun --cwd packages/opencode test

# E2E 测试
bun --cwd packages/app test:e2e
```

---

## 部署

**部署框架**: SST (Serverless Stack)

**部署命令**:
```bash
# 部署到 stage
bunx sst deploy --stage prod

# 控制台部署
bunx sst deploy --stage prod --console
```

---

## 性能优化

1. **Effect 流**: 使用 Effect 的流处理
2. **虚拟列表**: Virtua 虚拟滚动
3. **数据库优化**: Drizzle 查询优化
4. **缓存**: 文件状态缓存
5. **懒加载**: 模块懒加载

---

## 安全考虑

1. **权限系统**: 工具执行前权限检查
2. **隔离执行**: PTY 隔离
3. **文件保护**: 保护的文件/目录
4. **审计日志**: 所有操作记录
5. **认证**: OAuth + API Key

---

## 相关文档

- `packages/opencode/README.md` - 核心库文档
- `CONTRIBUTING.md` - 贡献指南
- `AGENTS.md` - Agent 指南
- `SECURITY.md` - 安全指南
- `packages/docs/` - 用户文档

---

*文档生成时间: 2026-05-02*

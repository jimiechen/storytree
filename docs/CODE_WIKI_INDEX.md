# StoryTree2 Code Wiki Index

> **项目**: OpenCode Creative Studio (StoryTree2)
> **版本**: v2.0
> **最后更新**: 2026-06-11

---

## 文档导航

### 核心文档

| 文档 | 说明 | 路径 |
|------|------|------|
| **Code Wiki** | 项目结构化代码文档（完整版） | [docs/CODE_WIKI.md](CODE_WIKI.md) |
| **快速导航** | 本文档，快速定位关键信息 | [docs/CODE_WIKI_INDEX.md](CODE_WIKI_INDEX.md) |

### 架构文档

| 文档 | 说明 | 路径 |
|------|------|------|
| **Creative Agent Runtime** | 底层执行内核架构 | [docs/roadmap/CREATIVE-AGENT-RUNTIME-ARCHITECTURE.md](../roadmap/CREATIVE-AGENT-RUNTIME-ARCHITECTURE.md) |
| **Creative Core** | 业务抽象层架构 | [docs/roadmap/CREATIVE-CORE-ARCHITECTURE.md](../roadmap/CREATIVE-CORE-ARCHITECTURE.md) |
| **Plugin 架构** | 插件系统规范 | [docs/roadmap/PLUGIN-ARCHITECTURE.md](../roadmap/PLUGIN-ARCHITECTURE.md) |
| **Novel Editor Core** | 小说编辑器核心定位 | [docs/roadmap/NOVEL-EDITOR-AS-CORE-PRODUCT.md](../roadmap/NOVEL-EDITOR-AS-CORE-PRODUCT.md) |
| **Skill 定义与使用** | Skill 规范文档 | [docs/roadmap/SKILL-DEFINITION-AND-USAGE.md](../roadmap/SKILL-DEFINITION-AND-USAGE.md) |
| **Claude Code 架构基准** | 源码分析基准 | [docs/roadmap/CLAUDE-CODE-SRC-ARCHITECTURE-BASELINE.md](../roadmap/CLAUDE-CODE-SRC-ARCHITECTURE-BASELINE.md) |
| **OpenCode StoryTree 规则** | Agent 消费版开发规则 | [caiode/opencode-1.4.0/STORYTREE_RULES.md](../../caiode/opencode-1.4.0/STORYTREE_RULES.md) |

### 规划文档

| 文档 | 说明 | 路径 |
|------|------|------|
| **产品路线图** | Plugin First 策略 | [docs/roadmap/PRODUCT-ROADMAP-PLUGIN-FIRST.md](../roadmap/PRODUCT-ROADMAP-PLUGIN-FIRST.md) |
| **商业插件模型** | 定价与授权策略 | [docs/roadmap/COMMERCIAL-PLUGIN-MODEL.md](../roadmap/COMMERCIAL-PLUGIN-MODEL.md) |
| **两年开发计划** | 阶段规划 | [docs/roadmap/TWO-YEAR-DEVELOPMENT-PLAN.md](../roadmap/TWO-YEAR-DEVELOPMENT-PLAN.md) |
| **模块定价策略** | 定价策略 | [docs/roadmap/MODULE-PRICING-STRATEGY.md](../roadmap/MODULE-PRICING-STRATEGY.md) |
| **30天行动计划** | 短期计划 | [docs/roadmap/FIRST-30-DAYS-ACTION-PLAN.md](../roadmap/FIRST-30-DAYS-ACTION-PLAN.md) |
| **Phase 0 前置清单** | 开发前检查清单 | [docs/planning/PRE-PHASE0-CHECKLIST.md](../planning/PRE-PHASE0-CHECKLIST.md) |

### Stitch 原型文档

| 文档 | 说明 | 路径 |
|------|------|------|
| **S01-S21 原型 PRD** | Stitch 各场景原型文档 | [docs/stitch/](../stitch/) |
| **Stitch 原型资产** | 原型截图与代码 | [stitch/](../../stitch/) |

### Agent 规则文档

| 文档 | 说明 | 路径 |
|------|------|------|
| **Ralph 执行铁律** | 核心执行规则 | [.trae/rules/Ralph.md](../../.trae/rules/Ralph.md) |
| **OpenCode StoryTree 规则** | 开发约束与规范 | [.trae/rules/opencode-storytree.md](../../.trae/rules/opencode-storytree.md) |
| **GitHub 工作流规范** | 分支/Commit/PR 规范 | [.trae/rules/github-workflow-rules.md](../../.trae/rules/github-workflow-rules.md) |
| **代码文件行数限制** | <= 500 行规则 | [.trae/rules/code-file-limit.md](../../.trae/rules/code-file-limit.md) |
| **模型自动文件规则** | 工作空间文件规范 | [.trae/rules/model-auto-file.md](../../.trae/rules/model-auto-file.md) |
| **Claude-Code 移植规则** | 闭源依赖降级链 | [.trae/rules/claude-code-migration-rules.md](../../.trae/rules/claude-code-migration-rules.md) |

---

## 快速定位

### 1. 想了解项目整体架构？
→ 阅读 [Code Wiki 第1-2章](CODE_WIKI.md#1-项目概述) - 项目概述、三层架构、OpenCode 底座包结构

### 2. 想了解核心模块职责？
→ 阅读 [Code Wiki 第3章](CODE_WIKI.md#3-核心模块详解) - OpenCode 底座、Runtime、Creative Core、Web 前端、VS Code 扩展

### 3. 想查找关键类和函数？
→ 阅读 [Code Wiki 第4章](CODE_WIKI.md#4-关键类和函数说明) - claude-code-src 映射、OpenCode 关键文件、Trae-Ralph 工具链

### 4. 想了解模块依赖关系？
→ 阅读 [Code Wiki 第5章](CODE_WIKI.md#5-依赖关系) - 依赖矩阵、包依赖关系、插件消费链路、外部依赖

### 5. 想了解如何运行项目？
→ 阅读 [Code Wiki 第6章](CODE_WIKI.md#6-项目运行方式) - 环境配置、OpenCode/VSCode Extension/Trae-Ralph 运行命令

### 6. 想查看数据类型定义？
→ 阅读 [Code Wiki 第7章](CODE_WIKI.md#7-数据类型定义) - Plugin/Provider/Skill 类型

### 7. 想了解扩展点和接口？
→ 阅读 [Code Wiki 第8章](CODE_WIKI.md#8-扩展点与接口) - 10个扩展点和权限边界

---

## 核心代码路径

### OpenCode 底座

```
caiode/opencode-1.4.0/
├── packages/opencode/src/         # CLI / Server 核心
│   ├── index.ts                   # 入口
│   ├── agent/agent.ts             # Agent 核心
│   ├── session/                   # 会话管理
│   ├── tool/                      # 工具系统
│   ├── provider/                  # Provider 管理
│   ├── plugin/                    # 插件系统
│   ├── skill/                     # Skill 系统
│   ├── bus/                       # 事件总线
│   ├── storage/                   # 存储层
│   ├── project/                   # 项目管理
│   ├── server/                    # HTTP/WS 服务器
│   └── cli/                       # CLI 界面
│
├── packages/app/src/              # Web 前端 (SolidJS)
│   ├── app.tsx                    # 根组件
│   ├── entry.tsx                  # 入口
│   ├── components/                # UI 组件
│   ├── context/                   # 全局上下文
│   └── pages/                     # 页面路由
│
├── packages/ui/src/               # UI 组件库
│   ├── components/                # 通用组件
│   ├── theme/                     # 主题系统
│   └── hooks/                     # 通用 Hooks
│
├── packages/plugin/src/           # 插件接口
│   ├── index.ts                   # 插件 API
│   ├── tool.ts                    # Tool 定义
│   └── tui.ts                     # TUI 组件
│
├── packages/sdk/js/src/           # SDK 协议
│   ├── index.ts                   # SDK 入口
│   ├── client.ts                  # Client 端
│   └── server.ts                  # Server 端
│
├── packages/desktop/src/          # Tauri 桌面壳
│   └── index.tsx                  # 桌面入口
│
└── packages/console/app/src/      # 控制台应用
```

### Claude Code 源码分析

```
caiode/claude-code-src/
├── QueryEngine.ts                 # 会话引擎
├── query.ts                       # Agent Loop
├── Tool.ts / tools.ts             # 工具抽象与执行
├── Task.ts / tasks.ts             # 任务状态机
├── skills/                        # Skill 加载
├── commands.ts                    # 命令注册
├── context.ts                     # 上下文构建
├── state/                         # 状态管理
├── bridge/                        # 服务桥接
├── coordinator/                   # 工作流编排
├── hooks/                         # 生命周期扩展点
├── cost-tracker.ts                # 成本追踪
├── ink/                           # TUI 渲染引擎
├── memdir/                        # 记忆目录
├── remote/                        # 远程会话
├── services/                      # 内部服务
└── utils/                         # 工具函数
```

### VS Code 扩展

```
caiode/vscode-extension/
├── package.json                   # 扩展清单
├── esbuild.config.mjs             # 构建配置
└── src/                           # 扩展源码
    ├── core/                      # 核心模块
    │   ├── sync-push-service.ts
    │   ├── sqlite-db.ts
    │   ├── global-model-request-queue.ts
    │   ├── file-mutex.ts
    │   ├── config-service.ts
    │   ├── event-bus.ts
    │   ├── rpc-adapter.ts
    │   ├── queue-monitor.ts
    │   └── ai/                    # AI Provider
    │       ├── anthropic-provider.ts
    │       ├── openai-provider.ts
    │       ├── ollama-provider.ts
    │       └── provider-factory.ts
    ├── webview/                   # Webview 面板
    │   ├── ai-chat-panel.ts
    │   ├── enhanced-dashboard.ts
    │   └── settings-page.ts
    ├── automation/                # 自动化
    │   ├── task-orchestrator.ts
    │   └── automation-queue.ts
    └── skills/                    # Skill 注册
        └── skill-registry.ts
```

### Trae-Ralph 工具链

```
caiode/Trae-Ralph-main/
├── bin/cli.js                     # CLI 入口
├── src/
│   ├── launcher.js                # CDP 自动化启动器
│   ├── injector.js                # 规则注入器
│   ├── config.js                  # 配置管理
│   └── setup-trae.js              # Trae 设置
└── scripts/
    ├── inject-rules.js            # 规则注入
    ├── inject-skills.js           # 技能注入
    ├── inject-templates.js        # 模板注入
    ├── clean-rules.js             # 规则清理
    └── init-planning.js           # 规划初始化
```

---

## 常用命令

### OpenCode 底座

```bash
# 进入目录
cd caiode/opencode-1.4.0

# 安装依赖
bun install

# 开发模式
bun dev                          # CLI
cd packages/app && bun dev       # Web 前端
cd packages/desktop && bun run tauri dev  # 桌面端

# 类型检查
bun typecheck

# 构建
bun turbo build
```

### 测试

```bash
# OpenCode 单元测试（进入具体 package 执行）
cd packages/opencode && bun test
cd packages/app && bun run test:unit

# E2E 测试
cd packages/app && bun run test:e2e

# VS Code Extension 测试
cd caiode/vscode-extension && npm run test
```

### 代码质量

```bash
# VS Code Extension
cd caiode/vscode-extension
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

### Trae-Ralph

```bash
cd caiode/Trae-Ralph-main
npm start
npm run start:cn
npm run rules:inject
npm run skills:inject
```

---

## 项目状态

| 模块 | 状态 | 说明 |
|------|------|------|
| OpenCode 底座 | 稳定 | v1.4.0，MIT 开源 |
| Creative Agent Runtime | 开发中 | 11个核心模块定义完成 |
| Creative Core | 开发中 | 业务抽象层设计完成 |
| Novel Editor Core | 开发中 | 数据模型定义完成 |
| Plugin System | 规划中 | 扩展点规范完成 |
| VS Code Extension | 开发中 | 核心功能实现中 |
| Trae-Ralph 工具链 | 稳定 | v1.1.2，自动化运行中 |
| Dreamweaver 前端 | 已归档 | Next.js 原型，备用参考 |

---

## 技术栈速查

| 层级 | 技术 | 版本 |
|------|------|------|
| 运行时 | Bun | 1.3.11 |
| 语言 | TypeScript | 5.8.2 |
| UI 框架 | SolidJS | 1.9.10 |
| 路由 | @solidjs/router | 0.15.4 |
| 构建 | Vite | 7.1.4 |
| Monorepo | Turbo | 2.8.13 |
| ORM | Drizzle ORM | 1.0.0-beta.19 |
| AI SDK | Vercel AI SDK | 6.0.149 |
| 函数式 | Effect-TS | 4.0.0-beta.43 |
| 样式 | TailwindCSS | 4.1.11 |
| 终端 UI | OpenTUI | 0.1.97 |
| 桌面壳 | Tauri | v2 |
| 测试 | Vitest | latest |
| E2E | Playwright | 1.51.0 |

---

## 获取帮助

- **架构问题** → 查看 [docs/roadmap/](../roadmap/)
- **代码问题** → 查看 [docs/CODE_WIKI.md](CODE_WIKI.md)
- **规划问题** → 查看 [docs/planning/](../planning/)
- **Agent 规则** → 查看 [.trae/rules/](../../.trae/rules/)
- **Stitch 原型** → 查看 [docs/stitch/](../stitch/)
- **OpenCode 规则** → 查看 [caiode/opencode-1.4.0/STORYTREE_RULES.md](../../caiode/opencode-1.4.0/STORYTREE_RULES.md)

---

*最后更新: 2026-06-11*

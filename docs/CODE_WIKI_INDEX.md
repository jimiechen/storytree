# StoryTree2 Code Wiki Index

> **项目**: OpenCode Creative Studio (StoryTree2)
> **版本**: v2.0
> **最后更新**: 2026-06-10

---

## 文档导航

### 核心文档

| 文档 | 说明 | 路径 |
|------|------|------|
| **Code Wiki** | 项目结构化代码文档（完整版） | [docs/CODE_WIKI.md](CODE_WIKI.md) |
| **快速导航** | 本文档，快速定位关键信息 | [docs/CODE_WIKI_INDEX.md](CODE_WIKI_INDEX.md) |
| **快速开始** | 项目快速启动指南 | [docs/QUICKSTART.md](QUICKSTART.md) |

### 架构文档

| 文档 | 说明 | 路径 |
|------|------|------|
| **Creative Agent Runtime** | 底层执行内核架构 | [docs/roadmap/CREATIVE-AGENT-RUNTIME-ARCHITECTURE.md](../roadmap/CREATIVE-AGENT-RUNTIME-ARCHITECTURE.md) |
| **Creative Core** | 业务抽象层架构 | [docs/roadmap/CREATIVE-CORE-ARCHITECTURE.md](../roadmap/CREATIVE-CORE-ARCHITECTURE.md) |
| **Plugin 架构** | 插件系统规范 | [docs/roadmap/PLUGIN-ARCHITECTURE.md](../roadmap/PLUGIN-ARCHITECTURE.md) |
| **Novel Editor Core** | 小说编辑器核心定位 | [docs/roadmap/NOVEL-EDITOR-AS-CORE-PRODUCT.md](../roadmap/NOVEL-EDITOR-AS-CORE-PRODUCT.md) |
| **Skill 定义与使用** | Skill 规范文档 | [docs/roadmap/SKILL-DEFINITION-AND-USAGE.md](../roadmap/SKILL-DEFINITION-AND-USAGE.md) |
| **Claude Code 架构基准** | 源码分析基准 | [docs/roadmap/CLAUDE-CODE-SRC-ARCHITECTURE-BASELINE.md](../roadmap/CLAUDE-CODE-SRC-ARCHITECTURE-BASELINE.md) |
| **Plugin Runtime 规范** | 插件运行时规范 | [docs/roadmap/PLUGIN-RUNTIME-SPEC.md](../roadmap/PLUGIN-RUNTIME-SPEC.md) |
| **Plugin 加载与 License** | 插件加载流程 | [docs/roadmap/PLUGIN-LOAD-AND-LICENSE-FLOW.md](../roadmap/PLUGIN-LOAD-AND-LICENSE-FLOW.md) |

### 规划文档

| 文档 | 说明 | 路径 |
|------|------|------|
| **产品路线图** | Plugin First 策略 | [docs/roadmap/PRODUCT-ROADMAP-PLUGIN-FIRST.md](../roadmap/PRODUCT-ROADMAP-PLUGIN-FIRST.md) |
| **商业插件模型** | 定价与授权策略 | [docs/roadmap/COMMERCIAL-PLUGIN-MODEL.md](../roadmap/COMMERCIAL-PLUGIN-MODEL.md) |
| **两年开发计划** | 阶段规划 | [docs/roadmap/TWO-YEAR-DEVELOPMENT-PLAN.md](../roadmap/TWO-YEAR-DEVELOPMENT-PLAN.md) |
| **模块定价策略** | 定价策略 | [docs/roadmap/MODULE-PRICING-STRATEGY.md](../roadmap/MODULE-PRICING-STRATEGY.md) |
| **30天行动计划** | 短期计划 | [docs/roadmap/FIRST-30-DAYS-ACTION-PLAN.md](../roadmap/FIRST-30-DAYS-ACTION-PLAN.md) |
| **Phase 0 前置清单** | 开发前检查清单 | [docs/planning/PRE-PHASE0-CHECKLIST.md](../planning/PRE-PHASE0-CHECKLIST.md) |

### 边界与规范

| 文档 | 说明 | 路径 |
|------|------|------|
| **边界定义** | 项目边界与约束 | [docs/boundary/BOUNDARY.md](../boundary/BOUNDARY.md) |
| **决策日志** | 架构决策记录 | [docs/boundary/DECISION_LOG.md](../boundary/DECISION_LOG.md) |
| **设计令牌** | 设计系统规范 | [docs/boundary/DESIGN_TOKENS.md](../boundary/DESIGN_TOKENS.md) |
| **模块地图** | 模块职责划分 | [docs/boundary/MODULE_MAP.md](../boundary/MODULE_MAP.md) |
| **TDD 协议** | 测试驱动开发规范 | [docs/boundary/TDD_PROTOCOL.md](../boundary/TDD_PROTOCOL.md) |
| **Vibe 任务规范** | 任务执行规范 | [docs/boundary/VIBE_TASK_SPEC.md](../boundary/VIBE_TASK_SPEC.md) |

---

## 快速定位

### 1. 想了解项目整体架构？
→ 阅读 [Code Wiki 第1-2章](CODE_WIKI.md#1-项目概述) - 项目概述和三层架构

### 2. 想了解 VS Code Extension 核心模块？
→ 阅读 [Code Wiki 第3.1节](CODE_WIKI.md#31-vs-code-extension-核心模块) - 9个核心模块详解

### 3. 想查找关键类和函数？
→ 阅读 [Code Wiki 第4章](CODE_WIKI.md#4-关键类和函数说明) - 类映射和函数说明

### 4. 想了解模块依赖关系？
→ 阅读 [Code Wiki 第5章](CODE_WIKI.md#5-依赖关系) - 依赖矩阵和消费链路

### 5. 想了解如何运行项目？
→ 阅读 [Code Wiki 第6章](CODE_WIKI.md#6-项目运行方式) - 环境配置和运行命令

### 6. 想查看数据类型定义？
→ 阅读 [Code Wiki 第7章](CODE_WIKI.md#7-数据类型定义) - IPC/Provider/Skill 类型

### 7. 想了解扩展点和接口？
→ 阅读 [Code Wiki 第8章](CODE_WIKI.md#8-扩展点与接口) - 10个扩展点和权限边界

### 8. 想了解测试体系？
→ 阅读 [Code Wiki 第9章](CODE_WIKI.md#9-测试体系) - 45+ 测试文件说明

---

## 核心代码路径

### VS Code Extension

```
caiode/vscode-extension/src/
├── extension.ts                    # 扩展主入口
├── core/                           # 核心服务层
│   ├── message-router.ts           # JSON-RPC 消息路由
│   ├── global-model-request-queue.ts  # LLM 请求队列
│   ├── file-mutex.ts               # 文件互斥锁
│   ├── config-service.ts           # 配置服务
│   ├── mock-store.ts               # Mock 数据存储
│   ├── process-guardian.ts         # 进程守护
│   ├── event-bus.ts                # 事件总线
│   ├── rpc-adapter.ts              # RPC 适配器
│   ├── queue-monitor.ts            # 队列监控
│   ├── sqlite-db.ts                # SQLite 数据库
│   ├── secret-manager.ts           # 密钥管理
│   └── ai/                         # AI Provider 层
│       ├── provider-factory.ts     # Provider 工厂
│       ├── openai-provider.ts      # OpenAI 适配
│       ├── anthropic-provider.ts   # Anthropic 适配
│       ├── ollama-provider.ts      # Ollama 本地模型
│       ├── stream-processor.ts     # 流式响应处理
│       └── conversation-manager.ts # 对话管理
├── webview/                        # Webview 面板层
│   ├── panel-manager.ts            # 面板管理器
│   ├── ai-chat-panel.ts            # AI 聊天面板
│   ├── enhanced-dashboard.ts       # 增强仪表板
│   ├── settings-page.ts            # 设置页面
│   ├── workbench-page.ts           # 工作台页面
│   └── html-generator.ts           # HTML 生成器
├── automation/                     # 自动化层
│   ├── orchestrator/task-orchestrator.ts  # 任务编排器
│   ├── queue/automation-queue.ts   # 自动化队列
│   └── drivers/cdp-driver.ts       # CDP 驱动
├── skills/                         # Skill 系统
│   ├── skill-registry.ts           # Skill 注册表
│   └── types.ts                    # Skill 类型定义
├── rules/                          # 规则引擎
│   ├── rule-engine.ts              # 规则执行引擎
│   └── types.ts                    # 规则类型定义
├── types/                          # 共享类型
│   └── ipc-protocol.ts             # IPC 通信协议
└── __tests__/                      # 测试目录（45+ 测试文件）
```

### Claude Code Src（参考架构）

```
caiode/claude-code-src/
├── QueryEngine.ts          # 会话引擎
├── query.ts                # Agent Loop
├── Tool.ts / tools.ts      # 工具抽象
├── Task.ts / tasks.ts      # 任务状态机
├── skills/                 # Skill 加载
├── commands.ts             # 命令注册
├── context.ts              # 上下文构建
├── state/                  # 状态管理
├── bridge/                 # 服务桥接
├── hooks/                  # 生命周期扩展
└── cost-tracker.ts         # 成本追踪
```

---

## 常用命令

### 开发

```bash
cd caiode/vscode-extension

# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run watch

# 生产构建
npm run build:prod

# 打包 .vsix
npm run package
```

### 测试

```bash
# 运行所有测试
npm run test

# 监听模式
npm run test:watch

# 覆盖率报告
npm run test:coverage
```

### 代码质量

```bash
# 代码检查
npm run lint

# 自动修复
npm run lint:fix

# 代码格式化
npm run format

# TypeScript 类型检查
npm run typecheck
```

---

## 项目状态

| 模块 | 状态 | 说明 |
|------|------|------|
| VS Code Extension | 🔄 开发中 | 核心功能已实现，45+ 测试覆盖 |
| AI Provider Layer | ✅ 已完成 | 支持 OpenAI/Anthropic/Ollama |
| Message Router | ✅ 已完成 | JSON-RPC 路由实现 |
| File Mutex | ✅ 已完成 | 基于 proper-lockfile |
| Mock Store | ✅ 已完成 | 内存数据存储 |
| Process Guardian | ✅ 已完成 | 进程守护实现 |
| Skill Registry | ✅ 已完成 | 4个内置 Skill |
| Creative Agent Runtime | 📋 规划中 | 11个核心模块定义完成 |
| Creative Core | 📋 规划中 | 业务抽象层设计完成 |
| Novel Editor Core | 📋 规划中 | 数据模型定义完成 |
| Plugin System | 📋 规划中 | 扩展点规范完成 |

---

## 获取帮助

- **架构问题** → 查看 [docs/roadmap/](../roadmap/)
- **代码问题** → 查看 [docs/CODE_WIKI.md](CODE_WIKI.md)
- **规划问题** → 查看 [docs/planning/](../planning/)
- **边界规范** → 查看 [docs/boundary/](../boundary/)
- **Agent 规则** → 查看 [.trae/rules/](../../.trae/rules/)
- **任务报告** → 查看 [docs/task-reports/](../task-reports/)

---

*最后更新: 2026-06-10*

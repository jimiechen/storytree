# StoryTree2 Code Wiki Index

> **项目**: OpenCode Creative Studio (StoryTree2)  
> **版本**: v1.1  
> **最后更新**: 2026-06-26

---

## 📚 文档导航

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

### 规划文档

| 文档 | 说明 | 路径 |
|------|------|------|
| **产品路线图** | Plugin First 策略 | [docs/roadmap/PRODUCT-ROADMAP-PLUGIN-FIRST.md](../roadmap/PRODUCT-ROADMAP-PLUGIN-FIRST.md) |
| **商业插件模型** | 定价与授权策略 | [docs/roadmap/COMMERCIAL-PLUGIN-MODEL.md](../roadmap/COMMERCIAL-PLUGIN-MODEL.md) |
| **两年开发计划** | 阶段规划 | [docs/roadmap/TWO-YEAR-DEVELOPMENT-PLAN.md](../roadmap/TWO-YEAR-DEVELOPMENT-PLAN.md) |
| **模块定价策略** | 定价策略 | [docs/roadmap/MODULE-PRICING-STRATEGY.md](../roadmap/MODULE-PRICING-STRATEGYGY.md) |
| **30天行动计划** | 短期计划 | [docs/roadmap/FIRST-30-DAYS-ACTION-PLAN.md](../roadmap/FIRST-30-DAYS-ACTION-PLAN.md) |
| **Phase 0 前置清单** | 开发前检查清单 | [docs/planning/PRE-PHASE0-CHECKLIST.md](../planning/PRE-PHASE0-CHECKLIST.md) |

---

## 🎯 快速定位

### 1. 想了解项目整体架构？
→ 阅读 [Code Wiki 第1-2章](CODE_WIKI.md#1-项目概述) - 项目概述和三层架构

### 2. 想了解核心模块职责？
→ 阅读 [Code Wiki 第3章](CODE_WIKI.md#3-核心模块详解) - 11个 Runtime 模块详解

### 3. 想查找关键类和函数？
→ 阅读 [Code Wiki 第4章](CODE_WIKI.md#4-关键类和函数说明) - 类映射和函数说明

### 4. 想了解模块依赖关系？
→ 阅读 [Code Wiki 第5章](CODE_WIKI.md#5-依赖关系) - 依赖矩阵和消费链路

### 5. 想了解如何运行项目？
→ 阅读 [Code Wiki 第6章](CODE_WIKI.md#6-项目运行方式) - 环境配置和运行命令

### 6. 想查看数据类型定义？
→ 阅读 [Code Wiki 第7章](CODE_WIKI.md#7-数据类型定义) - Plugin/Provider/Skill 类型

### 7. 想了解扩展点和接口？
→ 阅读 [Code Wiki 第8章](CODE_WIKI.md#8-扩展点与接口) - 10个扩展点和权限边界

---

## 📂 核心代码路径

```
caiode/
├── claude-code-src/             # Claude Code 源码分析
│   ├── QueryEngine.ts          # 会话引擎
│   ├── query.ts                # Agent Loop
│   ├── Tool.ts                 # 工具抽象
│   ├── Task.ts                 # 任务状态机
│   ├── skills/                 # Skill 加载
│   ├── commands.ts             # 命令注册
│   ├── context.ts              # 上下文构建
│   ├── state/                  # 状态管理
│   ├── bridge/                # 服务桥接
│   └── cost-tracker.ts         # 成本追踪
│
├── opencode-1.4.0/              # OpenCode 核心
│   ├── github/                  # GitHub 集成
│   └── infra/                   # 基础设施
│
├── vscode-extension/             # VS Code 扩展
│   └── src/
│       ├── core/               # 核心模块
│       │   ├── sync-push-service.ts
│       │   ├── sqlite-db.ts
│       │   ├── global-model-request-queue.ts
│       │   ├── file-mutex.ts
│       │   ├── ai/              # AI Provider
│       │   │   ├── anthropic-provider.ts
│       │   │   ├── openai-provider.ts
│       │   │   ├── ollama-provider.ts
│       │   │   └── provider-factory.ts
│       │   └── ...
│       ├── webview/             # Webview 面板
│       │   ├── ai-chat-panel.ts
│       │   ├── enhanced-dashboard.ts
│       │   └── settings-page.ts
│       ├── automation/          # 自动化
│       │   ├── task-orchestrator.ts
│       │   └── ...
│       └── skills/             # Skill 注册
│
└── Trae-Ralph-main/             # Trae + Ralph 工具链
    ├── bin/                     # CLI 工具
    └── scripts/                  # 初始化脚本
```

---

## 🔧 常用命令

### 开发
```bash
# 安装依赖
npm install

# 开发模式
cd caiode/vscode-extension && npm run watch

# 生产构建
npm run build
```

### 测试
```bash
# 单元测试
npm run test:unit

# E2E 测试
npm run test:e2e

# 覆盖率
npm run coverage
```

### 代码质量
```bash
# 检查
npm run lint

# 修复
npm run lint:fix

# 格式化
npm run format
```

---

## 📊 项目状态

| 模块 | 状态 | 说明 |
|------|------|------|
| Creative Agent Runtime | 📋 规划中 | 11 个核心模块接口定义完成，DEV-PHASE0-001~014 待实施 |
| Creative Core | 📋 规划中 | 业务抽象层设计完成 |
| **Novel Editor（opencode-1.4.0 二次开发）** | ✅ 主体完成 | SolidJS 实现，PAGE-03~14 + P2-A/B/C/E + P3-0/A/B/C/D 全部完成，424 UT + 67 E2E + 真实 DeepSeek 调用 |
| Plugin System | 📋 规划中 | 扩展点规范完成 |
| VS Code Extension | 🔄 开发中 | 核心功能实现中 |

### 🆕 Novel 模块二次开发进度（详见 [Code Wiki 第 9 章](CODE_WIKI.md#9-novel-模块二次开发调研基于-opencode-140)）

| 子模块 | 状态 | 关键产出 |
|--------|------|---------|
| YAML Workflow Engine | ✅ 完成 | `workflows/engine/` + 3 个内置 YAML |
| Plugin Tool Registry | ✅ 完成 | `plugins/` + 6 个内置 Tool |
| Info-Theory Audit | ✅ 完成 | `info-theory/` 熵/互信息/信息原子 |
| Adapter Router | ✅ 完成 | `adapters/` mock/opencode/claudecode/real-llm |
| Real LLM 全链路 | ✅ 完成 | `llm/` DeepSeek 真实调用 + 流式 + 重试 + 成本 |
| 书架 + 后端存储 | ✅ 完成 | PAGE-03 + Hono API + drizzle-orm + SQLite |
| 创建项目 6-Tab | ✅ 完成 | PAGE-04~08 基本信息/主角/世界观/剧情/自定义 |
| 章节编辑器 | ✅ 完成 | PAGE-10 三栏布局 + 章节 CRUD |
| AI 模型设置 | ✅ 完成 | PAGE-11 作者中心 Tab |
| 名字生成器 | ✅ 完成 | PAGE-14 随机/AI 双 Tab |
| 代码评审 | ✅ 完成 | 9 维度 28 改进建议 |

---

## 🆘 获取帮助

- **架构问题** → 查看 [docs/roadmap/](../roadmap/)
- **代码问题** → 查看 [docs/CODE_WIKI.md](CODE_WIKI.md)
- **Novel 模块二次开发** → 查看 [Code Wiki 第 9 章](CODE_WIKI.md#9-novel-模块二次开发调研基于-opencode-140)
- **规划问题** → 查看 [docs/planning/](../planning/)
- **Agent 规则** → 查看 [.trae/rules/](../../.trae/rules/)

---

*最后更新: 2026-06-26*

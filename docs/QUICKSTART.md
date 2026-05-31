# OpenCode Novel Editor - 快速开始指南

> **项目**: 基于 OpenCode 1.4.0 的 AI 小说编辑器  
> **快速开始**: 5 分钟上手  
> **最后更新**: 2026-05-31

---

## 🚀 5 分钟快速开始

### 前置条件

- **Bun**: 最新版本 (项目使用 bun)
- **Node.js**: >= 18.0
- **Git**: 最新版本

### 步骤 1: 克隆项目

```bash
cd /workspace
```

### 步骤 2: 安装依赖

```bash
cd /workspace/caiode/opencode-1.4.0
bun install
```

### 步骤 3: 启动开发服务器

```bash
# 启动 Web UI
bun run dev:web
```

### 步骤 4: 访问应用

打开浏览器访问: http://localhost:3000

---

## 📚 文档导航

### 核心文档

| 文档 | 路径 | 说明 |
|------|------|------|
| **作战计划** | `docs/prd/battle-plan.md` | 完整的开发作战计划 |
| **Sprint 0 任务卡** | `docs/tasks/sprint-0/vibe-tasks.md` | Sprint 0 的 Vibecoding 任务 |
| **Code Wiki** | `docs/CODE_WIKI.md` | 项目代码文档 |
| **Code Wiki 索引** | `docs/CODE_WIKI_INDEX.md` | 快速导航索引 |

### 架构文档

| 文档 | 路径 |
|------|------|
| Creative Agent Runtime | `docs/roadmap/CREATIVE-AGENT-RUNTIME-ARCHITECTURE.md` |
| Creative Core | `docs/roadmap/CREATIVE-CORE-ARCHITECTURE.md` |
| Plugin Architecture | `docs/roadmap/PLUGIN-ARCHITECTURE.md` |
| Novel Editor as Core | `docs/roadmap/NOVEL-EDITOR-AS-CORE-PRODUCT.md` |
| Skill Definition | `docs/roadmap/SKILL-DEFINITION-AND-USAGE.md` |

---

## 🏗️ 项目结构

```
/workspace
├── caiode/
│   └── opencode-1.4.0/          # OpenCode 1.4.0 核心
│       ├── packages/
│       │   ├── app/             # Web UI 应用
│       │   │   └── src/
│       │   │       ├── novel/  # 🎯 Novel Editor 核心（已有）
│       │   │       ├── novel-3d/ # 🎯 3D 分镜（已有）
│       │   │       └── novel-canvas/ # 🎯 故事画布（已有）
│       │   ├── console/
│       │   ├── desktop/
│       │   └── opencode/
├── docs/
│   ├── prd/                    # PRD 和作战计划
│   ├── roadmap/                # 架构文档
│   ├── tasks/                  # Sprint 任务卡
│   └── planning/               # 规划文档
└── workspaces/                 # AI 工作区
```

---

## 🎯 当前状态

### 已有的 Novel 模块

项目**已经有完整的 Novel Editor 实现**！位于：
- `/workspace/caiode/opencode-1.4.0/packages/app/src/novel/`
- `/workspace/caiode/opencode-1.4.0/packages/app/src/novel-3d/`
- `/workspace/caiode/opencode-1.4.0/packages/app/src/novel-canvas/`

### 包含的功能

| 功能 | 状态 |
|------|------|
| 项目管理 | ✅ 已实现 |
| 章节编辑 | ✅ 已实现 |
| 角色管理 | ✅ 已实现 |
| AI 任务 | ✅ 已实现 |
| 3D 分镜 | ✅ 已实现 |
| 故事画布 | ✅ 已实现 |

---

## 📝 开发流程

### Vibecoding 任务格式

所有任务都按照以下 7 段式格式发布：

```
[VIBE] 任务编号：S0-T01
[WHY] 为什么要做这个任务
[WHAT] 具体要做什么
[HOW] 如何做（包含约束）
[DONT] 禁止做什么
[DONE] 验收标准
[VIBE_TONE] 风格/氛围要求
```

### TDD 三色合同

- **red**: 只写测试，CI 必须红
- **green**: 只写业务代码，让测试转绿
- **refactor**: 只做重构，不改变功能

### Commit 规范

```bash
# Red 阶段（只写测试）
git commit -m "red: 测试大纲生成 Tool 的错误处理"

# Green 阶段（只写业务代码）
git commit -m "green: 实现大纲生成 Tool 的基础逻辑"

# Refactor 阶段（只做重构）
git commit -m "refactor: 提取 ContextResolver 模块"
```

---

## 🧪 测试

### 运行测试

```bash
# 所有测试
bun test

# 单元测试
bun test:unit

# E2E 测试
bun test:e2e

# 测试覆盖率
bun run coverage
```

---

## 🤝 参与开发

### 从 Sprint 0 开始

当前正在执行 **Sprint 0（地基阶段）**，任务卡位于：
`docs/tasks/sprint-0/vibe-tasks.md`

### 任务优先级

| 优先级 | 说明 |
|------|------|
| P0 | 阻塞级，必须立即处理 |
| P1 | 高优先级，尽快处理 |
| P2 | 中优先级，正常处理 |
| P3 | 低优先级，有空处理 |

### 需要确认的决策点

以下决策必须由主控确认：
- LLM Provider 的默认选型与降级策略
- 积分定价与 VIP 权益边界
- 富文本数据格式选择
- 任何对 `packages/core` 的 patch 需求
- 用户隐私与训练数据使用边界

---

## 📞 获取帮助

- **架构问题**: 查看 `docs/roadmap/`
- **代码问题**: 查看 `docs/CODE_WIKI.md`
- **规划问题**: 查看 `docs/planning/`
- **任务问题**: 查看 `docs/tasks/`

---

**祝开发顺利！** 🎉

# docs Code Wiki

## 目录概述

Caiode 项目文档目录，包含项目规划、任务分解和我们正在创建的 Code Wiki。

---

## 目录结构

```
docs/
├── code-wiki/                     # 代码 Wiki (正在创建)
│   ├── claude-code-src.md         # Claude Code 源代码 Wiki
│   ├── Trae-Ralph-main.md         # Trae Ralph 系统 Wiki
│   ├── opencode.md                # Opencode 项目 Wiki
│   ├── vscode-extension.md        # VS Code 扩展 Wiki
│   └── docs.md                    # 本文档
└── caiode-task-plan-20260407.md  # Caiode 任务计划
```

---

## 文档文件详解

### 1. caiode-task-plan-20260407.md (任务计划)

**创建日期**: 2026-04-07

**内容**:
- Caiode 项目的任务分解
- 开发计划
- 里程碑
- 任务分配

**用途**: 项目规划和任务追踪

---

### 2. code-wiki/ (代码 Wiki)

**目的**: 为 Caiode 项目的每个主要目录提供详细的技术文档

**包含的 Wiki**:
- `claude-code-src.md`: Claude Code 核心源代码文档
- `Trae-Ralph-main.md`: Trae Ralph 自动化系统文档
- `opencode.md`: Opencode AI 开发工具文档
- `vscode-extension.md`: VS Code 扩展文档
- `docs.md`: 本文档

**Wiki 结构**:
每个 Code Wiki 包含:
1. 目录概述
2. 项目结构
3. 核心模块详解
4. 核心架构
5. 关键概念
6. 开发指南
7. 测试/构建流程
8. 相关文档链接

---

## 文档使用指南

### 查找特定模块文档

1. 确定模块所在的目录:
   - Claude Code 核心: `claude-code-src.md`
   - Ralph 自动化: `Trae-Ralph-main.md`
   - Opencode 工具: `opencode.md`
   - VS Code 集成: `vscode-extension.md`

2. 打开对应的 Wiki 文档

3. 使用文档中的导航链接

### 添加新文档

1. 在 `docs/` 创建新的 Markdown 文件
2. 或在 `code-wiki/` 添加新的目录 Wiki
3. 保持文档格式一致性

---

## 文档规范

### 命名约定

- 任务计划: `caiode-task-plan-YYYYMMDD.md`
- Code Wiki: `目录名.md`
- 其他文档: 描述性名称

### 格式标准

- 使用 Markdown 格式
- 包含目录结构图示
- 代码块使用语法高亮
- 提供实际代码示例
- 包含架构图/流程图

---

## 项目文档索引

### Caiode 相关

- **任务计划**: `caiode-task-plan-20260407.md`

### 子项目文档 (Code Wiki)

- **Claude Code 核心**: `code-wiki/claude-code-src.md`
  - QueryEngine, Tool系统, 状态管理, 工具集
- **Trae Ralph**: `code-wiki/Trae-Ralph-main.md`
  - Ralph Loop, Skill系统, CDP集成
- **Opencode**: `code-wiki/opencode.md`
  - Monorepo, Effect系统, VS Code集成
- **VS Code 扩展**: `code-wiki/vscode-extension.md`
  - StoryTree IDE, 队列监控, 文件锁, 进程守护

---

## 文档维护

### 更新 Code Wiki

当代码结构发生变化时:
1. 更新对应目录的 Wiki 文档
2. 更新项目结构部分
3. 添加/修改核心模块详解
4. 保持文档与代码同步

### 添加新目录 Wiki

1. 分析新目录结构
2. 创建新的 Wiki 文件
3. 遵循现有 Wiki 模板
4. 在本文档中添加索引

---

## 相关资源

- 项目根目录 `README.md`
- `docs/planning/` 规划文档 (项目根级别)
- `docs/task-reports/` 任务报告 (项目根级别)
- `docs/reviews/` 评审文档 (项目根级别)

---

*文档生成时间: 2026-05-02*

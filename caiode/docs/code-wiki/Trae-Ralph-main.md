# Trae-Ralph-main Code Wiki

## 目录概述

Trae-Ralph 是一个通过 Chrome DevTools Protocol (CDP) 为 Trae IDE 实现自动化持续工作（Ralph Loop）的系统。

### 目录结构

```
Trae-Ralph-main/
├── .kiro/              # Kiro 配置
├── bin/                # 可执行文件
├── docs/               # 文档
├── scripts/            # 脚本工具
├── src/                # 源代码
│   ├── editor-api/    # 编辑器 API
│   ├── ralph/         # Ralph 核心逻辑
│   └── setup/         # 设置逻辑
├── templates/          # 模板文件
│   ├── rules/         # 规则模板
│   └── skills/        # Skill 模板
├── package.json
└── README.md
```

---

## 核心架构

### Ralph 循环 (Ralph Loop)

**核心概念**: 自动化持续开发流程，包括计划、执行、测试、交付等阶段

**主要组件**:
- **Planner**: 任务规划
- **Task Executor**: 任务执行
- **Test Executor**: 测试执行
- **State Manager**: 状态管理
- **Round Initializer**: 回合初始化
- **Web Requirement**: 需求分析
- **Web Architecture**: 架构设计
- **Web Task Planner**: 任务拆分
- **Web Test Plan**: 测试计划

---

## 核心模块详解

### 1. src/ralph/ (Ralph 核心)

**主要文件**:
- `main.js`: Ralph 主流程
- `index.js`: Ralph 入口
- `actions.js`: 动作定义
- `config.js`: 配置管理
- `dom.js`: DOM 操作
- `status.js`: 状态管理
- `trae-agent-task-manager.js`: 任务管理器
- `utils.js`: 工具函数

**Scenarios (场景)**:
- `click.js`: 点击动作
- `reply.js`: 回复动作
- `restart.js`: 重启动作
- `terminal.js`: 终端操作

**核心流程**:
```
初始化
    ↓
加载场景
    ↓
连接 CDP (Chrome DevTools Protocol)
    ↓
执行 Ralph Loop
    ↓
持续监控与自动化
```

---

### 2. src/setup/ (设置模块)

**主要文件**:
- `builder.js`: 构建器
- `cli.js`: CLI 设置
- `constants.js`: 常量定义
- `deploy.js`: 部署逻辑
- `reports.js`: 报告生成
- `utils.js`: 设置工具函数
- `validate.js`: 验证逻辑

**功能**:
- 项目初始化
- 规则注入
- Skill 注入
- 模板注入
- 配置验证

---

### 3. src/editor-api/ (编辑器 API)

**主要文件**:
- `selectors.js`: 选择器定义
- `README.md`: API 文档

**功能**:
- 提供与 Trae IDE 编辑器交互的 API
- DOM 元素选择器定义
- 编辑器操作封装

---

### 4. templates/skills/ (Skill 模板)

**内置 Skills**:
- `ralph-func-analyst/`: 需求分析师
- `ralph-planner/`: 规划器
- `ralph-round-initializer/`: 回合初始化器
- `ralph-state-manager/`: 状态管理器
- `ralph-task-executor/`: 任务执行器
- `ralph-test-executor/`: 测试执行器
- `ralph-web-architecture/`: Web 架构师
- `ralph-web-requirement/`: Web 需求分析师
- `ralph-web-routine/`: Web 日常流程
- `ralph-web-task-planner/`: Web 任务规划器
- `ralph-web-test-plan/`: Web 测试计划

**Skill 结构**:
```
skill-name/
├── SKILL.md          # Skill 定义
└── assets/          # 资源文件
    └── *.md        # 模板文件
```

---

### 5. scripts/ (脚本工具)

**主要脚本**:
- `inject-rules.js`: 注入规则
- `inject-skills.js`: 注入 Skills
- `inject-templates.js`: 注入模板
- `clean-rules.js`: 清理规则
- `init-planning.js`: 初始化规划
- `start-trae-debug.bat/ps1`: 调试启动脚本

---

## Ralph 执行铁律 (Execution Iron Rules)

**规则来源**: `templates/rules/Ralph.md`

### 1. 物理顺序优先 (Physical Order First)
- 严格按照 `04-ralph-tasks.md` 和 `05-test-plan.md` 文件中的行号顺序执行
- 禁止跳过当前未完成条目
- 禁止跳过单元测试

### 2. 测试即交付 (Test is Delivery)
- 任何代码变更必须通过单元测试验证
- 编写代码 → 编写/运行测试 → 测试通过 → 提交代码
- 必须看到 `PASS` 或 `Success` 输出

### 3. 状态真实性 (State Integrity)
- `RALPH_STATE.md` 必须反映真实进度
- 修改任务/测试状态前，先修改 `04-ralph-tasks.md` 或 `05-test-plan.md`
- 严格按照 `05-test-plan.md` 进行测试

### 4. 单线程专注 (Single Thread Focus)
- 每次只处理一个任务 ID
- 禁止并发执行多个任务

---

## 标准工作流程 (Web Routine)

**流程来自**: `ralph-web-routine` Skill

### 阶段 1: 需求分析 (Requirements)
1. 调用 `ralph-web-requirement` Skill
2. 生成 `docs/planning/<project>/01-requirements.md`
3. 用户确认需求

### 阶段 2: 架构设计 (Architecture)
1. 调用 `ralph-web-architecture` Skill
2. 生成 `docs/planning/<project>/02-architecture.md`
3. 用户确认架构

### 阶段 3: 任务规划 (Task Planning)
1. 调用 `ralph-web-task-planner` Skill
2. 生成 `04-ralph-tasks.md`
3. 生成 `05-test-plan.md`

### 阶段 4: 任务执行 (Execution)
1. 调用 `ralph-task-executor` Skill
2. 按物理顺序执行任务
3. 更新任务状态

### 阶段 5: 测试执行 (Testing)
1. 调用 `ralph-test-executor` Skill
2. 按测试计划执行测试
3. 更新测试状态

### 阶段 6: 总结 (Learnings)
1. 生成 `06-learnings.md`
2. 记录经验教训

---

## CLI 命令

**安装**:
```bash
npm install -g trae-ralph
```

**常用命令**:
```bash
# 配置
trae-ralph config
trae-ralph config:cn  # 中文版本

# 设置 Trae
trae-ralph setup-trae

# 启动 Ralph
trae-ralph start
trae-ralph start:nostop  # 不停止模式
trae-ralph start:cn      # 中文版本

# 注入资源
trae-ralph inject
trae-ralph inject:cn
npm run rules:inject
npm run skills:inject
npm run templates:inject

# 清理
npm run rules:clean

# 规划
npm run plan

# 构建
npm run build
```

---

## 关键集成点

### Chrome DevTools Protocol (CDP)
- 库: `chrome-remote-interface`
- 功能: 浏览器自动化、DOM 操作、JavaScript 执行
- 用途: 与 Trae IDE 交互

### Trae IDE 集成
- 通过 CDP 连接到 Trae IDE
- 操作编辑器 UI
- 执行自动化任务

### Skill 系统
- 每个 Skill 是独立的功能模块
- 通过 `Skill` 工具调用
- 有固定的输入输出格式

---

## 配置文件

### 项目配置
- `.trae/` 目录存放配置
- `RALPH_STATE.md` 当前状态
- `04-ralph-tasks.md` 任务列表
- `05-test-plan.md` 测试计划

---

## 开发指南

### 添加新 Skill
1. 在 `templates/skills/` 创建新目录
2. 创建 `SKILL.md` 定义
3. 添加所需的模板资源
4. 使用 `skills:inject` 注入

### 添加新场景
1. 在 `src/ralph/scenarios/defs/` 创建新文件
2. 定义场景动作
3. 在 `index.js` 中注册

### 自定义规则
1. 在 `templates/rules/` 添加规则文件
2. 使用 `rules:inject` 注入

---

## 状态文件说明

### RALPH_STATE.md
```markdown
# Ralph State

## 当前阶段
- 阶段: [Planning/Execution/Testing]
- 当前任务: [Task ID]

## 进度统计
- 总任务数: X
- 已完成: X
- 进度: X%

## 历史记录
- ...
```

### 04-ralph-tasks.md
```markdown
# Ralph Tasks

## 模块 1
- [ ] Task 1 (行号: 10)
- [x] Task 2 (行号: 15)

## 模块 2
- [ ] Task 3 (行号: 20)
```

### 05-test-plan.md
```markdown
# Test Plan

## 测试套件 1
- [ ] Test Case 1
- [x] Test Case 2
```

---

## 调试

### 启动调试模式
```bash
npm run start:debug
# 或使用提供的脚本
scripts/start-trae-debug.bat   # Windows
scripts/start-trae-debug.ps1   # PowerShell
```

### 调试输出
- 查看 `src/ralph/debug.js` 配置调试级别
- 所有动作都有日志记录

---

## 扩展开发

### 创建自定义 Action
1. 在 `src/ralph/actions.js` 定义
2. 实现动作逻辑
3. 在场景中调用

### 创建自定义 Scenario
1. 在 `src/ralph/scenarios/defs/` 创建
2. 导出场景定义
3. 在 `scenarios/index.js` 注册

---

## 性能优化

1. **CDP 连接池**: 复用浏览器连接
2. **批量操作**: 减少 CDP 调用次数
3. **缓存**: 缓存常用选择器结果
4. **异步执行**: 并行执行独立任务

---

## 安全考虑

1. **权限控制**: 限制 Ralph 的文件系统访问
2. **输入验证**: 所有用户输入必须验证
3. **审计日志**: 记录所有自动操作
4. **沙箱执行**: 敏感操作在隔离环境执行

---

## 相关文档

- `docs/CONFIGURATION.md` - 配置指南
- `docs/SELECTORS.md` - 选择器参考
- `docs/NPM-PUBLISH-GUIDE.md` - 发布指南
- `docs/CODE-HEADER-STANDARD.md` - 代码头标准

---

*文档生成时间: 2026-05-02*

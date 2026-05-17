# 任务来源记录 (Task Source Record)

> **⚠️ 重要**: 此文件记录当前任务来源和状态，每次会话必须首先读取

## 当前任务状态

**最后更新时间**: 2026-05-15 23:00:00
**当前任务来源**: `caiode/docs/tabbit/TabAI会话_1778947079619.md`
**当前阶段**: Novel Editor MVP 文档已完成，准备进入开发阶段
**下一步**: 创建 feature/novel-mvp 分支，启动 Day 1 任务（项目脚手架 + 路由 + 项目列表）

---

## 任务来源清单

### 主要任务来源 (按优先级排序)

1. **Novel Editor MVP 路书**
   - 路径: `caiode/docs/tabbit/TabAI会话_1778947079619.md`
   - 状态: 已解析，MVP 文档已创建
   - 优先级: P0
   - 核心内容: 14天MVP计划、PRD、技术栈、数据模型

2. **Novel Editor 长期定位与中期路线**
   - 路径: `caiode/docs/tabbit/TabAI会话_1778947039480.md`
   - 状态: 已解析
   - 优先级: P0
   - 核心内容: 三层边界定义（MVP/中期/长期）、M2-M4阶段规划

3. **Worktree + Canvas 扩展规划**
   - 路径: `caiode/docs/tabbit/TabAI会话_1778947122630.md`
   - 状态: 已解析
   - 优先级: P1
   - 核心内容: 分支沙箱、Canvas可视化、分支对比合并（M2-M3规划）

4. **OpenCode Creative Studio 架构优化路书**
   - 路径: `caiode/docs/tabbit/TabAI会话_1778901717836.md`
   - 状态: 已解析，13份文档已创建/更新
   - 优先级: P0

5. **Phase 0 路书文档 (13份)**
   - 路径: `docs/roadmap/`
   - 状态: 已完成
   - 优先级: P0

---

## 已完成的任务

### 2026-05-15 完成任务

1. **Phase 0 前置工作清单准备**
   - 任务ID: PRE-PHASE0-20260515
   - 状态: ✅ 已完成

2. **Phase 0 初始路书文档创建 (6份)**
   - 任务ID: DOC-PHASE0-002 ~ DOC-PHASE0-007
   - 状态: ✅ 已完成

3. **Phase 0 架构优化路书文档创建/更新 (13份)**
   - 任务ID: DOC-PHASE0-002 ~ DOC-PHASE0-014
   - 状态: ✅ 已完成

4. **Novel Editor MVP 文档创建 (5份)**
   - 来源: `TabAI会话_1778947079619.md`
   - 任务ID: MVP-DOC-001 ~ MVP-DOC-005
   - 状态: ✅ 已完成
   - 完成内容:
     - `docs/mvp/SCOPE-NOVEL-MVP.md` — MVP 范围定义
     - `docs/mvp/PRE-FLIGHT-CHECKLIST.md` — 前置检查清单
     - `docs/mvp/TECH-STACK-NOVEL-MVP.md` — 技术栈选型
     - `docs/mvp/PRD-NOVEL-EDITOR-MVP.md` — 完整产品需求文档
     - `docs/mvp/INDEX.md` — MVP 文档索引

5. **Novel Editor Core 文档更新 + Worktree 扩展规划**
   - 来源: `TabAI会话_1778947039480.md` + `TabAI会话_1778947122630.md`
   - 任务ID: DOC-PHASE0-014-UPDATE + DOC-PHASE0-015
   - 状态: ✅ 已完成
   - 完成内容:
     - `docs/roadmap/NOVEL-EDITOR-AS-CORE-PRODUCT.md` v2.0 — MVP对齐版（schemaVersion 2 + Worktree预留）
     - `docs/roadmap/NOVEL-WORKTREE-AND-CANVAS.md` — 分支沙箱与Canvas扩展规划

### 2026-04-09 完成任务 (历史)

1. **Phase1 单元测试实现**
   - 任务ID: TEST-PHASE1-UNIT
   - 状态: ✅ 已完成
   - 测试数: 68个全部通过

2. **Phase1 核心模块实现与文档更新**
   - 任务ID: T-PHASE1-20260409
   - 状态: ✅ 已完成

---

## 待执行任务

### Novel Editor MVP 研发任务 (当前阶段)

#### Day 1 (明天)

- [ ] **MVP-DEV-001** 项目脚手架 + 路由 + 项目列表 + 新建项目 + 本地存储读写
  - 角色：前端工程师
  - 优先级：P0
  - 截止：Day 1 EOD
  - 产出：packages/novel-core/ 初始化 + /novel 路由 + 项目列表页

- [ ] **MVP-DEV-002** 检查 feat/DEV-PHASE0-LIGHT-three-array-refactor 是否合入 main
  - 角色：项目协调
  - 优先级：P0
  - 截止：Day 1 上午

#### Day 2

- [ ] **MVP-DEV-003** 章节大纲 + 简易编辑器 + 自动保存
  - 角色：前端工程师
  - 优先级：P0
  - 截止：Day 2 EOD

#### Day 3

- [ ] **MVP-DEV-004** 场景卡数据结构 + 手动新建 + 列表展示
  - 角色：前端工程师
  - 优先级：P0
  - 截止：Day 3 EOD

#### Day 4

- [ ] **MVP-DEV-005** 场景详情页 + 镜头数据结构 + 手动新建/编辑
  - 角色：前端工程师
  - 优先级：P0
  - 截止：Day 4 EOD

#### Day 5

- [ ] **MVP-DEV-006** 任务中心 UI + Mock TextProvider + Skill Loader 最小版
  - 角色：前端工程师 + Node.js后端工程师
  - 优先级：P0
  - 截止：Day 5 EOD

#### Day 6

- [ ] **MVP-DEV-007** novel-outline Skill 接入 + scene.extract 任务 + 预览确认
  - 角色：前端工程师 + Node.js后端工程师
  - 优先级：P0
  - 截止：Day 6 EOD

#### Day 7

- [ ] **MVP-DEV-008** story-to-shot Skill 接入 + shot.extract 任务
  - 角色：前端工程师 + Node.js后端工程师
  - 优先级：P0
  - 截止：Day 7 EOD

#### Day 8-14

- [ ] **MVP-DEV-009** 主题切换 + 文案润色 + 空状态/错误态
- [ ] **MVP-DEV-010** 导入导出 + 最近项目
- [ ] **MVP-DEV-011** 自测 + Bug 修复 + 外部用户试用
- [ ] **MVP-DEV-012** 录制 2 分钟 demo 视频
- [ ] **MVP-DEV-013** 收尾、写后记、规划下一阶段

### Creative Agent Runtime 研发任务 (并行)

- [ ] **DEV-PHASE0-001** 实现 CreativeQueryEngine
- [ ] **DEV-PHASE0-002** 实现 AgentLoop
- [ ] **DEV-PHASE0-003** 实现 CreativeContextBuilder
- [ ] **DEV-PHASE0-004** 实现 TaskRuntime
- [ ] **DEV-PHASE0-005** 实现 ToolRuntime
- [ ] **DEV-PHASE0-006** 实现 SkillLoader
- [ ] **DEV-PHASE0-007** 实现 PluginRuntime
- [ ] **DEV-PHASE0-010** 实现 StateStore
- [ ] **DEV-PHASE0-013** 实现 Mock License Gate

### 环境配置修复任务 (历史遗留)

- [ ] DEV-ENV-001 安装缺失依赖（@tailwindcss/postcss、proper-lockfile、retry）
- [ ] DEV-ENV-002 修复 TypeScript 类型错误（MockFileMutex locks 属性）
- [ ] DEV-ENV-003 修复 LockHandle 类型定义
- [ ] DEV-ENV-004 修复 SkillRegistry 重复导出问题

### 作废任务（cancelled）

- [-] DEV-1.4.1 插件配置页面 Settings UI（原 dreamweaver 前端）
- [-] DEV-1.5.1 实现 VS Code 扩展打包脚本（依赖旧前端，暂缓）
- [-] 所有 dreamweaver/ 目录下的前端开发任务
- [-] FE-OP-001 ~ ARCH-OP-001 (旧 opencode 调研任务，已被新路书覆盖)

---

## 核心原则

- **Novel Editor Core** 是免费 Core Product，不是付费插件
- **Creative Agent Runtime** 是底层执行内核，负责 Agent 怎么运行
- **Creative Core** 是业务抽象层，负责创作项目怎么管理
- **Skill** 是 Agent 按需加载的 SKILL.md 任务说明包
- **Plugin** 是产品模块和商业模块
- **Provider** 是外部服务适配器
- **Tool** 是 Agent 可调用的具体执行动作

### 关键约束

- 禁止把 Skill 写成 Plugin
- 禁止把 OpenRouter 写成 Skill
- 禁止让 UI 直接调用插件生成逻辑
- 任务必须通过 Task Runtime 运行
- 任务过程中通过 Skill 指导 Agent 调用 Plugin Capability

---

## 任务获取流程

### 下次会话开始时的操作顺序

1. **读取扣分档案** (第一优先级)
   ```
   Read c:\projects\storytree\.trae\rules\agent-score-record.md
   ```

2. **读取任务来源记录** (第二优先级)
   ```
   Read c:\projects\storytree\.trae\rules\task-source-record.md
   ```

3. **检查 MVP 文档** (第三优先级)
   ```
   Read c:\projects\storytree\docs\mvp\PRD-NOVEL-EDITOR-MVP.md
   Read c:\projects\storytree\docs\mvp\PRE-FLIGHT-CHECKLIST.md
   ```

4. **确认当前任务**
   - 根据任务状态确定下一步任务
   - 向用户确认任务来源

---

## 任务状态标记

| 标记 | 含义 | 操作 |
|------|------|------|
| `[ ]` | 待开始 | 可以领取执行 |
| `[~]` | 进行中 | 正在执行中 |
| `[x]` | 已完成 | 已完成并通过测试 |
| `[-]` | 已阻塞 | 有依赖或其他问题 |

---

## 签名确认

**Agent**: Kimi-K2.6
**确认日期**: 2026-05-15
**当前任务来源**: TabAI会话_1778947079619.md
**下一步**: 创建 feature/novel-mvp 分支，启动 Day 1 任务

---

*每次会话开始时必须首先读取此文件和 agent-score-record.md*

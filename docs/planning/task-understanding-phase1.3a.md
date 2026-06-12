# Phase 1.3a 任务理解汇报：Workspace 壳层（三栏布局容器 + 状态管理）

> **我是**：GLM-5V-Turbo，本次任务：Phase 1.3a Workspace 壳层，职责范围：`caiode/opencode-1.4.0/packages/app/src/novel/`
> **当前积分**: 30/100 (危险)
> **状态**：📋 待评审

---

## 一、任务目标

将现有 `NovelEditor` 的三栏布局**提取为正式的 Workspace 壳层组件**，建立结构化的布局容器和面板状态管理，为后续 Phase 1.3b/1.3c 的数据流接入提供稳定壳层。

### 1.1 用户目标

| 角色 | 目标 | 输入 | 输出 |
|------|------|------|------|
| 作者 | 进入项目工作台 | 从书架点击项目卡片 | 三栏工作台（章节列表+编辑器+侧边面板） |
| 作者 | 切换右侧面板显示 | 点击"角色面板"/"AI任务"按钮 | 右侧面板显隐切换 |
| 作者 | 查看当前项目信息 | 顶部工具栏 | 项目名+类型+字数统计 |

### 1.2 现状分析

**现有 `NovelEditor` (index.tsx, 232 行)** 已包含：
- 三栏布局雏形：左侧 ChapterList(w-64) / 中间 ChapterEditor(flex-1) / 右侧 CharacterPanel+AITaskPanel(条件)
- 顶部工具栏：项目名+类型+字数 + 面板开关按钮
- AI 日志抽屉
- MockModeBanner

**问题**：
1. `projectId` 硬编码为 `'proj-001'`
2. 所有逻辑耦合在单一 232 行组件中
3. 无独立的状态管理 Hook
4. 非标准命名（叫 Editor 实际是 Workspace）

### 1.3 策略：渐进式提取（非重写）

```
NovelEditor (232行, 单体)
    ↓ 提取为
Workspace 主壳层 (~80行)
├── WorkspaceHeader (~50行)     ← 从 NovelEditor 提取顶部栏
├── LeftPanel: ChapterList      ← 复用现有
├── CenterPanel: ChapterEditor  ← 复用现有
├── RightPanel: 可切换           ← 封装显隐逻辑
│   ├── CharacterPanel          ← 复用现有
│   └── AITaskPanel             ← 复用现有
├── AILogDrawer                 ← 复用现有
└── useWorkspace() Hook (新增)  ← 统一管理面板状态 + projectId
```

---

## 二、范围界定

### 2.1 本阶段包含（In Scope）

| # | 功能 | 实现深度 | 依据 |
|---|------|---------|------|
| 1 | Workspace 主壳层组件 | 完整（三栏布局容器） | PLAN 1.3a |
| 2 | WorkspaceHeader 顶部工具栏 | 完整（项目名+字数+面板开关） | PLAN 1.3a |
| 3 | useWorkspace Hook | 完整（面板状态+projectId 管理） | PLAN 1.3a |
| 4 | 左侧面板 ~256px 固定宽 | 复用 ChapterList | PLAN |
| 5 | 中间面板 flex-1 | 复用 ChapterEditor + AIResultCard | PLAN |
| 6 | 右侧面板 ~300px 可切换 | CharacterPanel / AITaskPanel 显隐 | PLAN |
| 7 | 面板按钮激活态样式 | bg-indigo-100 text-indigo-700 | PLAN |
| 8 | projectId 动态化 | 接收 prop 替代硬编码 | 渐进改造 |
| 9 | NovelShell 接入 workspace 视图 | Show 条件渲染 | Phase 0.5 骨架 |

### 2.2 本阶段不含（Out of Scope — 明确延期）

| 功能 | 延期到 | 原因 |
|------|--------|------|
| Outline 数据流（大纲/细纲） | Phase 1.3b | 非本阶段范围 |
| AI 生成面板深度集成 | Phase 1.3c | 需要 Outline 先就位 |
| CharacterPanel mockCharacters 修复 | Phase 2.2 | Tabbit 明确延期 |
| 真实路由替换 NovelShell | Phase 7 | Tabbit 明确 |
| 编辑器增强功能 | Phase 2.1 | 非壳层范畴 |

### 2.3 底座保护区域

```
❌ packages/opencode/    ✅ 不触碰
❌ packages/sdk/          ✅ 不触碰
❌ packages/plugin/       ✅ 不触碰
❌ packages/desktop/      ✅ 不触碰
❌ packages/ui/           ✅ 不触碰
```

---

## 三、STDD 执行计划

### Step 1: Types（类型定义）

| 文件 | 内容 | 行数估算 |
|------|------|---------|
| `types/workspace.ts` (**新增**) | WorkspacePanelId, WorkspaceState 类型 | ~25 行 |
| `types/index.ts` (改) | 新增导出 | ~2 行 |

### Step 2: Tests（测试先行）

| 文件 | 用例数 | 覆盖内容 |
|------|--------|---------|
| `hooks/use-workspace.test.ts` (**新增**) | 4-5 | 面板初始状态/切换/全部关闭/projectId |

### Step 3: Mock（复用）

无需新增。复用现有 mock-data。

### Step 4: Dev（实现）

| 文件 | 操作 | 内容 |
|------|------|------|
| `types/workspace.ts` | **新增** | WorkspacePanelId 联合类型, WorkspaceState |
| `hooks/use-workspace.ts` | **新增** | useWorkspace() Hook（面板状态+projectId） |
| `hooks/use-workspace.test.ts` | **新增** | Hook 测试 |
| `components/novel-workspace/index.tsx` | **新增** | Workspace 主壳层（三栏布局） |
| `components/novel-workspace/workspace-header.tsx` | **新增** | 顶部工具栏 |
| `components/novel-editor/index.tsx` | **修改** | 标记 deprecated 或改为调用 Workspace |
| `components/index.ts` (改) | 导出更新 | 新增 Workspace 相关导出 |

### Step 5: Verify

```bash
cd caiode/opencode-1.4.0/packages/app && bun test
```

---

## 四、数据流设计

```
BookshelfPage → 用户点击 ProjectCard
  → setView('workspace') + selectProject(projectId)
       │
       ▼
NovelShell view='workspace' → 渲染 <Workspace projectId={id} />
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    useWorkspace(projectId) Hook               │
│  projectId: string                                          │
│  activePanels: Set<WorkspacePanelId>                        │
│  togglePanel(id)                                           │
│  isPanelVisible(id)                                        │
│  { project } = useNovelProject()                             │
│  { chapters, ... } = useNovelChapters(() => projectId)      │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                     Workspace 主壳层                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  WorkspaceHeader                                     │   │
│  │  左: 项目名 + 类型 + 字数统计                         │   │
│  │  右: [角色面板] [AI任务] [日志] 按钮                  │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  LeftPanel (~256px)  │  CenterPanel (flex-1)  │ Right │   │
│  │  ┌──────────────┐  │  ┌────────────────┐  │ ~300px │   │
│  │  │ ChapterList  │  │  │ ChapterEditor   │  │ 可切换  │   │
│  │  │ (Hook 数据)  │  │  │ + AIResultCards  │  │         │   │
│  │  └──────────────┘  │  └────────────────┘  │ Char/AI │   │
│  │                     │                      │ Panel   │   │
│  └─────────────────────┴──────────────────────┴─────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AILogDrawer (条件渲染)                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**关键约束**: UI 层 **禁止直接 import mock-data**，所有数据通过 Hook 获取。

---

## 五、文件行数预估与合规检查

| 文件 | 预估行数 | < 500? |
|------|---------|--------|
| types/workspace.ts | ~25 | ✅ |
| hooks/use-workspace.ts | ~40 | ✅ |
| hooks/use-workspace.test.ts | ~60 | ✅ |
| components/novel-workspace/index.tsx | ~90 | ✅ |
| components/novel-workspace/workspace-header.tsx | ~50 | ✅ |
| components/novel-editor/index.tsx (改) | ~10 行改动 | ✅ |
| components/index.ts (改) | ~5 行改动 | ✅ |

**预估总新增/修改**: ~280 行（含测试），每个文件均 < 500 行 ✅

---

## 六、Exit Criteria 验收标准

| # | 检查项 | 目标值 | 验证方法 |
|---|--------|--------|---------|
| 1 | 新增测试通过率 | 100% | `bun test` |
| 2 | 累计测试无回归 | 0 fail | 对比基线 |
| 3 | UI 不直连 mock-data | 0 处 | Grep |
| 4 | 所有文件 < 500 行 | 100% | wc -l |
| 5 | OpenCode 底座未触碰 | 0 处 | git diff |
| 6 | 三栏布局比例正确 | 左256/flex1/右300 | 组件验证 |
| 7 | 面板按钮激活态样式正确 | indigo 高亮 | 样式检查 |
| 8 | projectId 动态化 | 非 hardcode | Props 检查 |
| 9 | STDD 顺序执行 | 严格 | 步骤记录 |

---

## 七、风险与依赖

| 风险 | 级别 | 缓解措施 |
|------|------|---------|
| NovelEditor 重构影响现有功能 | 中 | 渐进式提取，保留原组件可回退 |
| Hook 测试 SolidJS context 问题 | 低 | 已知预存问题，不影响新测试 |
| 面板状态与 NovelEditor 原有状态冲突 | 低 | useWorkspace 统一管理，替代内联 signal |

---

*文档版本*: v1.0
*创建时间*: 2026-06-11
*状态*: ⏳ PENDING_REVIEW

# Phase P2-0 基线矩阵

> 来源：P2-IMPLEMENTATION-PLAN-20260619.md / P2-CONTROL-PROMPT-REVIEW-20260619.md
> 生成日期：2026-06-19

---

## 1. PRD 21 页面覆盖矩阵

| PRD 编号 | 页面名称 | PRD 路由 | 当前是否存在 | 当前实现文件 | 当前状态 | P0 主链路 | P2 处理策略 | FeatureGate | 备注 |
|---------|---------|---------|-------------|-------------|---------|----------|------------|------------|------|
| 01 | 首页 | `/` | 否 | — | 未实现 | 否 | 不进入 P2 | 否 | NovelForge 入口为书架 |
| 02 | 登录页 | `/auth` | 否 | — | 未实现 | 否 | 不进入 P2 | 否 | 沿用 OpenCode auth |
| 03 | 我的书架 | `/center` | 是 | `components/bookshelf/index.tsx` | 已实现 | 是 | 保持 | 否 | 书架主入口 |
| 04 | 创建新项目-基本信息 | `/center` | 是 | `components/create-project-modal/index.tsx` | 部分实现 | 是 | 保持弹窗形式 | 否 | PRD 为多步骤，当前为弹窗 |
| 05 | 创建新项目-主角设定 | `/center` | 是 | `components/create-project-modal/index.tsx` | 部分实现 | 是 | 弹窗内 Tab/字段 | 否 | 与 04 合并实现 |
| 06 | 创建新项目-世界观 | `/center` | 是 | `components/create-project-modal/index.tsx` | 部分实现 | 是 | 弹窗内 Tab/字段 | 否 | 与 04 合并实现 |
| 07 | 创建新项目-剧情总纲 | `/center` | 是 | `components/create-project-modal/index.tsx` | 部分实现 | 是 | 弹窗内 Tab/字段 | 否 | 与 04 合并实现 |
| 08 | 创建新项目-自定义设定 | `/center` | 是 | `components/create-project-modal/index.tsx` | 部分实现 | 是 | 弹窗内 Tab/字段 | 否 | 与 04 合并实现 |
| 09 | 25 道题引导首页 | `/novel-guide` | 是 | `components/novel-guide/index.tsx` | 部分实现 | 是 | 入口保留，深度 FeatureGate | `guide25Enabled` | 当前有引导流程骨架 |
| 10 | 25 道题引导新建 | `/novel-guide/new` | 是 | `components/novel-guide/guide-qa-step.tsx` | 部分实现 | 是 | 入口保留，深度 FeatureGate | `guide25Enabled` | 与 09 共用 |
| 11 | 成就系统 | `/center` | 是 | `components/achievements/index.tsx` | 已实现 | 否 | 保持 | 否 | 仅基础展示 |
| 12 | 我的书架(更新后) | `/center` | 是 | `components/bookshelf/index.tsx` | 已实现 | 是 | 保持 | 否 | 与 03 合并 |
| 13 | 作者中心-创作统计 | `/profile` | 是 | `components/profile/index.tsx` | 已实现 | 否 | 保持 | 否 | 展示统计 |
| 14 | 积分充值 | `/profile` | 是 | `components/profile/profile-recharge-tab.tsx` | 部分实现 | 否 | FeatureGate | `paymentEnabled` | UI 存在，支付逻辑关闭 |
| 15 | AI 模型设置 | `/profile` | 是 | `components/layout/generation-settings-modal.tsx` | 部分实现 | 是 | 保持 | 否 | 生成参数 Modal |
| 16 | 云同步 | `/profile` | 否 | — | 未实现 | 否 | FeatureGate | `cloudSyncEnabled` | — |
| 17 | 数据导出 | `/profile` | 否 | — | 未实现 | 否 | FeatureGate | `exportEnabled` | — |
| 18 | 数据导入 | `/profile` | 否 | — | 未实现 | 否 | FeatureGate | `importEnabled` | — |
| 19 | 名字生成器 | `/name-generator` | 否 | — | 未实现 | 否 | FeatureGate | `nameGeneratorEnabled` | — |
| 20 | AI 拆书工作室 | `/book-analysis` | 否 | — | 未实现 | 否 | FeatureGate | `bookAnalysisEnabled` | — |
| 21 | 新手教程 | `/tutorial` | 否 | — | 未实现 | 否 | FeatureGate | `guide25Enabled` | — |

### 页面覆盖统计

| 状态 | 数量 |
|------|------|
| 已实现 | 6 |
| 部分实现 | 7 |
| 未实现 | 8 |
| **P0 主链路覆盖** | **12 / 21** |
| **P2 需处理** | **13 / 21** |
| **必须 FeatureGate** | **8 / 21** |

---

## 2. Action Contract 覆盖矩阵

### 2.1 P0 核心动作（18 个）

| # | Action ID | 页面/区域 | UI 文案 | 类型 | 当前组件文件 | 当前 Handler | 当前状态 | 是否真实写回 | 是否参与 Mock Workflow | P2 处理策略 | 进入 P2-D | 需 YAML | 需 Tool | 需 InfoTheory | 需 Adapter | 风险 |
|---|-----------|----------|--------|------|-------------|-------------|---------|------------|---------------------|------------|----------|--------|--------|------------|------------|------|
| 1 | 01-S01 | SideNav | 立即写作 | MODAL | `layout/novel-side-nav.tsx` | `openCreateProject()` | 已实现 | 是 | 否 | 保持 | 否 | 否 | 否 | 否 | 否 | 低 |
| 2 | 02-P01 | Bookshelf | 项目卡片 | NAV | `bookshelf/index.tsx` | `selectProject()` | 已实现 | 是 | 否 | 保持 | 否 | 否 | 否 | 否 | 否 | 低 |
| 3 | 03-13 | CreateProjectModal | 提交创建 | CRUD/AI_WORKFLOW | `create-project-modal/index.tsx` | `submitCreateProject()` | 已实现 | 是 | 部分 | 保持 | 否 | 否 | 否 | 否 | 否 | 低 |
| 4 | 04-SN08 | WorkspaceSideNav | AI生成大纲 | AI_WORKFLOW | `novel-workspace/layout/workspace-side-nav.tsx` | `runOutlineGeneration()` | 已实现 | 是 | 是 | 保持 | 是 | 是 | 是 | 可选 | 是 | 中 |
| 5 | 04-SN09 | WorkspaceSideNav | 生成细纲 | AI_WORKFLOW | `novel-workspace/layout/workspace-side-nav.tsx` | `runOutlineGeneration(detail)` | 已实现 | 是 | 是 | 保持 | 是 | 是 | 是 | 可选 | 是 | 中 |
| 6 | 04-A01 | WorkspaceActions | 开始生成 | AI_WORKFLOW | `novel-workspace/generation/workspace-actions.tsx` | `runChapterGeneration()` | 已实现 | 是 | 是 | 保持 | 是 | 是 | 是 | 可选 | 是 | 中 |
| 7 | 04-OL01 | WorkspaceOutlineList | 章节行 | NAV | `novel-workspace/outline/workspace-outline-list.tsx` | `selectChapter()` | 已实现 | 是 | 否 | 保持 | 否 | 否 | 否 | 否 | 否 | 低 |
| 8 | 05-T01 | EditorToolbar | 返回 | NAV | `novel-editor/editor-toolbar.tsx` | `navigateBack()` | 已实现 | 是 | 否 | 保持 | 否 | 否 | 否 | 否 | 否 | 低 |
| 9 | 05-T03 | EditorToolbar | AI续写 | AI_WORKFLOW | `novel-editor/editor-toolbar.tsx` | `runContinueWriting()` | 已实现 | 是 | 是 | 保持 | 是 | 是 | 是 | 可选 | 是 | 中 |
| 10 | 05-FT01 | FloatingToolbar | 续写 | AI_WORKFLOW | `novel-editor/editor-ai-floating-toolbar.tsx` | `runEditorCommand('continue')` | 已实现 | 是 | 是 | 保持 | 是 | 是 | 是 | 可选 | 是 | 中 |
| 11 | 05-IP01 | ChapterInfoPanel | 重新提取 | AI_WORKFLOW | `novel-editor/chapter-info-panel.tsx` | `runExtractInfo()` | 已实现 | 是 | 是 | 保持 | 是 | 是 | 是 | 是 | 是 | 中 |
| 12 | 05-IP02 | ChapterInfoPanel | 信息审计块 | INFO_WORKFLOW | `novel-editor/chapter-info-panel.tsx` | `toggleInfoAudit()` | 已实现 | 否 | 否 | 保持 | 否 | 否 | 否 | 是 | 否 | 低 |
| 13 | 05-RC02 | AIResultCard | 采纳 | CRUD | `novel-editor/ai-result-card.tsx` | `acceptSuggestion()` | 已实现 | 是 | 否 | 保持 | 否 | 否 | 否 | 否 | 否 | 低 |
| 14 | 05-RC04 | AIResultCard | 忽略 | CRUD | `novel-editor/ai-result-card.tsx` | `discardResult()` | 已实现 | 是 | 否 | 保持 | 否 | 否 | 否 | 否 | 否 | 低 |
| 15 | 05-TP02 | AITaskPanel | 取消任务 | AI_WORKFLOW | `novel-editor/ai-task-panel.tsx` | `cancelTask()` | 已实现 | 是 | 是 | 保持 | 是 | 否 | 否 | 否 | 否 | 中 |
| 16 | 05-TP03 | AITaskPanel | 重试任务 | AI_WORKFLOW | `novel-editor/ai-task-panel.tsx` | `retryTask()` | 已实现 | 是 | 是 | 保持 | 是 | 否 | 否 | 否 | 否 | 中 |
| 17 | 05-RP02 | EditorRightPanel | 保存草稿 | CRUD | `novel-editor/editor-right-panel.tsx` | `saveDraft()` | 已实现 | 是 | 否 | 保持 | 否 | 否 | 否 | 否 | 否 | 低 |
| 18 | 05-RP03 | EditorRightPanel | 标记完成 | CRUD | `novel-editor/editor-right-panel.tsx` | `markComplete()` | 已实现 | 是 | 否 | 保持 | 否 | 否 | 否 | 否 | 否 | 低 |

### 2.2 P1 完整体验动作（约 23 个，节选关键）

| Action ID | 页面/区域 | 类型 | 当前状态 | P2 处理策略 | 备注 |
|-----------|----------|------|---------|------------|------|
| 05-FT02~FT05 | FloatingToolbar | AI_WORKFLOW | 占位/暂缓 | FeatureGate / P2-B 后实现 | 改写/扩写/润色/摘要 |
| 04-OL03/OL04 | OutlineList | CRUD | 已实现 | 保持 | 完成 checkbox / 星标 |
| 04-GF01~GF05 | GenerationForm | CONFIG | 已实现 | 保持 | 生成参数表单 |
| 04-CO01~CO06 | ContextOptions | CONFIG | 已实现 | 保持 | 上下文勾选 |
| 05-C01/C02 | EditorCanvas | CRUD | 已实现 | 保持 | 标题/正文编辑 |
| 07-T01~T04 | WorldSetting | NAV | 已实现 | 保持 | 世界设定 Tab |
| 02-S01 | SearchBar | CONFIG | 已实现 | 保持 | 搜索 |
| 05-LD01/LD02 | AILogDrawer | MODAL/CRUD | 已实现 | 保持 | 日志开关/清空 |
| 12-Q01~Q05 | GuideQA | NAV/CONFIG | 部分实现 | FeatureGate `guide25Enabled` | 引导流程 |

### 2.3 P2 / FUTURE 动作处理策略

| 区域 | 动作示例 | 处理策略 |
|------|---------|---------|
| ModalHost 占位弹框（MH-01~MH-08） | 导出、反馈、历史版本、通知、批量生成、设置、guide-create、成就详情 | 全部 FeatureGate |
| 个人中心 | 充值、导入导出 | FeatureGate |
| 成就系统 | 分类浏览 | FeatureGate |
| 角色追踪 | 详细面板 | FeatureGate |
| 书架工具栏 | 排序/筛选/视图 | 保持现有回调或 FeatureGate |
| 浮动组件 | 签到/活动 | FeatureGate |
| 暂停生成 | 04-PD01 | FeatureGate |
| 发布章节 | 05-T04 | FeatureGate |

### 2.4 P2-D 重点按钮候选（8 个）

| # | Action ID | 按钮 | 关联 YAML Workflow |
|---|-----------|------|-------------------|
| 1 | 04-A01 | 开始生成 | `chapter.generate` |
| 2 | 05-T03 | AI续写 | `chapter.continue` |
| 3 | 05-FT01 | 浮动续写 | `chapter.continue` |
| 4 | 05-IP01 | 重新提取 | `info.extract` |
| 5 | 05-TP02 | 取消任务 | 任务生命周期（Workflow Engine 支持） |
| 6 | 05-RC02 | 采纳 | 结果应用（Workflow Event 消费） |
| 7 | 05-RC04 | 忽略 | 结果丢弃（Workflow Event 消费） |
| 8 | 05-RP02 | 保存草稿 | 草稿持久化（当前 provider，不进入 YAML） |

候选范围控制在 8 个。`保存草稿` 可保留为直接 provider 调用，不强制进入 YAML。

---

## 3. 当前目录结构确认

```
packages/app/src/novel/
├── adapters/              # Agent Adapter（Mock 等）
├── components/
│   ├── achievements/      # 成就系统
│   ├── bookshelf/         # 我的书架
│   ├── character-panel/   # 角色面板
│   ├── layout/            # 布局、弹窗、导航
│   ├── novel-editor/      # 编辑器
│   ├── novel-guide/       # 25 道题引导
│   ├── novel-workspace/   # 工作台
│   ├── profile/           # 个人中心
│   ├── world-setting/     # 世界设定
│   └── ui/                # 通用 UI 组件
├── hooks/                 # UI 适配层
├── mock-data/             # 种子数据
├── providers/             # 数据访问层
├── services/              # 纯逻辑服务
├── styles/                # 设计 token
├── types/                 # 领域类型
└── workflows/             # 工作流编排
```

### 与原方案假设的差异

| 原方案假设 | 当前实际 | 影响 |
|-----------|---------|------|
| 存在 `stores/` 目录 | 不存在 | 状态管理通过 providers + hooks 实现 |
| YAML Workflow 目录已建立 | 尚未建立 | P2-A 需要新建 `workflows/yaml/`、`workflows/engine/` |
| Adapter 目录已建立 | `adapters/` 已存在，仅含 `mock-agent-adapter.ts` | P2-E 需要扩展为 `adapters/` 下多文件 |
| `plugins/` 目录 | 不存在 | P2-B 需要新建 |
| `info-theory/` 目录 | 不存在 | P2-C 需要新建 |
| `chat-debug/` 目录 | 不存在 | P2-A0 需要新建 |

---

## 4. 动作类型分类统计

| 动作类型 | 总数（约） | P1 已实现 | P2 必须处理 | P2/FUTURE FeatureGate |
|---------|----------|----------|------------|---------------------|
| NAV | ~30 | ~25 | ~5 | 其余 |
| MODAL | ~15 | ~6 | ~2 | 其余 |
| CRUD | ~15 | ~10 | ~3 | 其余 |
| CONFIG | ~20 | ~18 | ~2 | 其余 |
| AI_WORKFLOW | ~14 | ~9 | **8** | 其余 |
| INFO_WORKFLOW | ~8 | ~6 | ~2 | 其余 |
| FUTURE | ~10 | 0 | 0 | 全部 |

---

*基线矩阵用于锁定 Phase P2 的范围边界。后续阶段必须以本文档为准。*

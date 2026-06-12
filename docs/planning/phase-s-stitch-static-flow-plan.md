# Phase S Stitch Static Flow 评估报告与实施方案

> 我是：前端工程师（评审与方案 Agent），本次任务：Phase S Stitch 静态页面串联评估与方案输出，职责范围：`caiode/opencode-1.4.0/packages/app/src/novel/` 及相关规划文档

---

## 一、评估目标

基于 `TabAI会话_1781274036216.md` 提出的 Phase S「Stitch Static Flow」方案，对当前 `packages/app/src/novel/` 现有实现进行全面评估，输出差距分析、实施任务拆分与执行顺序，供开发团队评审后执行。

---

## 二、现有实现盘点

### 2.1 已存在文件清单

```
packages/app/src/novel/
├── index.tsx                              # 入口 /novel 路由，NovelRouter (Switch/Match)
├── types/
│   ├── index.ts                           # 统一导出
│   ├── novel-view.ts                      # NovelView 类型 (5个值)
│   ├── project.ts, chapter.ts, character.ts, ...
│   ├── generation-config.ts, workspace.ts, outline.ts
│   └── provider-error.ts
├── hooks/
│   ├── use-novel-view.tsx                 # currentView + projectId + setView (URL同步)
│   ├── use-workspace.ts                   # 工作台业务逻辑
│   ├── use-novel-outline.ts             # 大纲 Hook
│   ├── use-novel-chapters.ts            # 章节数据流
│   ├── use-novel-project.ts             # 项目/书架数据
│   ├── use-ai-task.ts, use-ai-log.ts    # AI 任务与日志
│   └── *.test.ts                          # 对应单元测试
├── providers/
│   ├── providers-index.ts
│   ├── novel-project.test.ts, novel-outline.test.ts, novel-character.test.ts
│   └── (Provider 层已部分实现)
├── components/
│   ├── novel-shell.tsx                    # 壳组件 (未在 NovelApp 中使用)
│   ├── bookshelf/
│   │   ├── index.tsx                      # 书架页面 (Stitch 02)
│   │   ├── project-card.tsx, project-grid.tsx
│   │   ├── search-bar.tsx, toolbar.tsx
│   │   ├── header.tsx, empty-state.tsx
│   │   └── floating-widgets.tsx           # 浮动组件
│   ├── create-project-modal/
│   │   └── index.tsx                      # 创建项目弹窗 (Stitch 03)
│   ├── novel-workspace/
│   │   ├── index.tsx                      # 工作台主界面 (Stitch 04)
│   │   ├── workspace-top-app-bar.tsx      # 工作台专用 TopAppBar
│   │   ├── workspace-header.tsx
│   │   ├── outline-sidebar.tsx            # 左侧大纲/章节栏
│   │   └── generation-settings.tsx        # 生成设置面板
│   ├── novel-editor/
│   │   ├── index.tsx                      # 章节编辑器 (Stitch 05)
│   │   ├── chapter-editor.tsx
│   │   ├── chapter-paper-editor.tsx       # 纸张编辑器
│   │   ├── chapter-info-panel.tsx         # 右侧信息面板
│   │   ├── character-panel.tsx            # 角色面板 (右侧嵌入)
│   │   ├── ai-task-panel.tsx, ai-result-card.tsx, ai-log-drawer.tsx
│   │   └── chapter-list.tsx
│   └── layout/
│       ├── index.ts
│       ├── novel-app-layout.tsx           # 统一布局 (SideNav + TopAppBar + Content)
│       ├── novel-top-app-bar.tsx          # 通用 TopAppBar
│       ├── novel-side-nav.tsx             # 通用 SideNav
│       └── novel-icon.tsx                 # Material Symbols 封装
├── styles/
│   └── design-tokens.ts                   # 设计令牌
```

### 2.2 当前路由与视图状态

- `NovelView` 仅 5 个值：`bookshelf` | `create-project` | `workspace` | `editor` | `guide`
- 导航通过 `useNovelView()` 管理，仅支持 `currentView` / `setView` / `projectId`
- URL 模式：`/novel?view=<view>`
- 默认视图：`bookshelf`
- `create-project` 当前作为**页面视图**渲染（覆盖在书架之上），不是 Modal
- `guide` 为占位符（只有返回按钮和 emoji）

### 2.3 当前测试状态

- `bun test`: 389 pass / 0 fail（截至 R5 完成时）
- `bun typecheck`: 通过
- E2E: 未针对 novel 模块新增专项测试

---

## 三、Phase S 方案核心要求摘要

### 3.1 主界面裁决

- `/novel` **默认进入 `04 小说项目工作台`**（当前为书架）
- `02 我的书架` 作为项目入口页
- `04 小说项目工作台` 是主工作区，串联所有子页面

### 3.2 视图状态扩展

- `NovelView` 需扩展至：
  `bookshelf` | `workspace` | `chapter-editor` | `character-panel` | `world-setting` | `profile` | `achievement` | `guide` | `tutorial` | `static-placeholder`
- 新增 `NovelModal`：
  `create-project` | `generation-settings` | `achievement` | `chapter-history` | `chapter-note` | `add-character` | `export` | `feedback` | `null`
- 页面与弹框状态分离

### 3.3 统一导航模型

- 新增 `useNovelNavigation`，支持：
  - `currentView` / `currentModal` / `previousView`
  - `openView(view)`：切页面并关弹框
  - `openModal(modal)`：保留页面开弹框
  - `closeModal()`：关弹框
  - `back()`：回 previousView，无则 bookshelf

### 3.4 公共壳层

- `NovelAppShell`：统一壳层
- `NovelModalHost`：统一弹框宿主
- `NovelTopAppBar` / `NovelSideNav`：已部分实现，需按 Phase S 映射调整

### 3.5 页面流转

```
02 书架 → 项目卡片 → 04 工作台
03 弹窗 → 创建成功 → 04 工作台
04 工作台 → SideNav 章节 → 05 编辑器
04 工作台 → SideNav 人物 → 06 角色面板
04 工作台 → SideNav 设定 → 07 世界设定
04 工作台 → TopAppBar 设置 → 10 弹窗
...（完整流转见原文档）
```

---

## 四、差距分析（逐项对比）

### 4.1 类型层差距

| 项 | 现有 | Phase S 要求 | 差距 |
|---|---|---|---|
| `NovelView` | 5 值 | 10 值 | **需扩展** |
| `NovelModal` | 无 | 9 值 + null | **需新增** |
| 导航状态接口 | `setView` 唯一方法 | `openView/openModal/closeModal/back` | **需重写** |

### 4.2 导航层差距

| 项 | 现有 | Phase S 要求 | 差距 |
|---|---|---|---|
| 默认视图 | `bookshelf` | `workspace` | **需调整** |
| 弹框状态 | 无 | `currentModal` Signal | **需新增** |
| 来源追踪 | 无 | `previousView` | **需新增** |
| `back()` | 无 | 返回上一页 | **需新增** |
| URL 同步 | `view` query | 先保持 query，后续接路由 | 可延期 |

### 4.3 布局层差距

| 项 | 现有 | Phase S 要求 | 差距 |
|---|---|---|---|
| `NovelAppShell` | 有 `novel-shell.tsx` 但未被使用 | 作为统一壳层 | **需接入** |
| `NovelModalHost` | 无 | 统一弹框管理 | **需新增** |
| `NovelTopAppBar` | 两个版本（通用版 + Workspace版） | 统一按 04 标准，映射所有入口 | **需整合** |
| `NovelSideNav` | 通用版（首页/书架/创作/社区/设置） | 按 04 标准：大纲/章节/人物/设定/导出 | **需调整** |
| `novel-icon.tsx` | 已实现 | Material Symbols | 已满足 |

### 4.4 页面层差距

| Stitch 页面 | 现有文件 | 状态 | 差距 |
|---|---|---|---|
| 02 书架 | `bookshelf/index.tsx` | 已实现 | SideNav 需调整映射；TopAppBar 需对齐 02 code.html |
| 03 创建弹窗 | `create-project-modal/index.tsx` | 已实现 | 当前是页面视图，**需改为 Modal** |
| 04 工作台 | `novel-workspace/index.tsx` | 已实现 | SideNav/TopAppBar 映射需按 Phase S 调整 |
| 05 编辑器 | `novel-editor/index.tsx` | R5 刚完成 | 返回/历史版本/备注/AI续写 需接入导航 Hook |
| 06 角色面板 | `novel-editor/character-panel.tsx` | 仅右侧嵌入 | **缺独立页面** |
| 07 世界设定 | 无 | 无 | **缺独立页面** |
| 09 个人中心 | 无 | 无 | **缺独立页面** |
| 10 生成设置 | `generation-settings.tsx` | 已实现 | 当前在工作台内部，**需接入 ModalHost** |
| 11 成就系统 | 无 | 无 | **缺弹框/页面** |
| 12 25道题 | `guide` 占位符 | 占位 | **缺独立页面** |

### 4.5 弹框层差距

| 弹框 | 现有 | Phase S 要求 | 差距 |
|---|---|---|---|
| `create-project` | 作为页面视图 | Modal | **需迁移** |
| `generation-settings` | 组件级实现 | 接入 NovelModalHost | **需迁移** |
| `achievement` | 无 | Modal | **需新增** |
| `chapter-history` | 无（历史版本按钮 alert） | Modal | **需新增** |
| `chapter-note` | 无（备注按钮 alert） | Modal | **需新增** |
| `add-character` | 无 | Modal | **需新增** |
| `export` | 无 | Modal | **需新增** |
| `feedback` | 无 | Modal | **需新增** |

### 4.6 测试层差距

| 项 | 现有 | Phase S 要求 | 差距 |
|---|---|---|---|
| `useNovelNavigation` 测试 | 无 | openView/openModal/closeModal/back | **需新增** |
| `NovelModal` 类型测试 | 无 | 基础类型测试 | **需新增** |
| Playwright E2E | 无 novel 专项 | 书架→工作台→弹框→关闭 | **需新增** |
| Playwright E2E | 无 novel 专项 | 工作台→章节→返回→人物→设定 | **需新增** |

---

## 五、实施方案

### 5.1 执行原则

1. **HTML First**：以各 `code.html` 为视觉第一参考
2. **不接真实后端/AI/认证**
3. **不触碰 OpenCode 底座保护区**
4. **文件行数 ≤ 500 行**，超限拆分
5. **默认不新增依赖**

### 5.2 任务拆分与执行顺序

建议按以下 5 个批次执行，每批次可独立测试：

#### 批次 A：基础设施（导航状态 + 壳层）

**目标**：建立统一的 `NovelView` / `NovelModal` / `useNovelNavigation` / `NovelModalHost` / `NovelAppShell`

| # | 任务 | 产出文件 | 预估行数 |
|---|---|---|---|
| A1 | 扩展 `NovelView` 类型 | `types/novel-view.ts` | ~15 |
| A2 | 新增 `NovelModal` 类型 | `types/novel-modal.ts` | ~15 |
| A3 | 新建 `use-novel-navigation.ts` | `hooks/use-novel-navigation.ts` | ~80 |
| A4 | 新建 `NovelModalHost` | `components/layout/novel-modal-host.tsx` | ~60 |
| A5 | 新建/整合 `NovelAppShell` | `components/layout/novel-app-shell.tsx` | ~50 |
| A6 | 重构 `NovelTopAppBar` 为统一组件 | `components/layout/novel-top-app-bar.tsx` | ~100 |
| A7 | 重构 `NovelSideNav` 为双模式 | `components/layout/novel-side-nav.tsx` | ~120 |
| A8 | 重构 `novel/index.tsx` 接入新壳层 | `index.tsx` | ~80 |

**关键设计决策**：
- `useNovelNavigation` 内部使用 `createStore` 管理 `{ currentView, currentModal, previousView }`
- `openView` 自动关闭 modal 并记录 previousView
- `back()` 优先回 previousView，无则 bookshelf
- `NovelModalHost` 使用 `fixed inset-0 bg-black/40` 遮罩 + `Switch/Match` 分发
- `NovelSideNav` 支持两种模式：bookshelf 模式（首页/书架/创作/社区/设置）和 workspace 模式（大纲/章节/人物/设定/导出）

#### 批次 B：页面视图补齐（06/07/09/11/12）

**目标**：把缺失的独立页面做成静态组件

| # | 任务 | 产出文件 | 参考 |
|---|---|---|---|
| B1 | 06 角色追踪面板页 | `components/character-panel-page.tsx` | `06_角色追踪面板/code.html` |
| B2 | 07 世界设定页面 | `components/world-setting-page.tsx` | `07_世界设定页面/code.html` |
| B3 | 09 个人中心页面 | `components/profile-page.tsx` | `09_个人中心页面/code.html` |
| B4 | 11 成就系统弹框 | `components/achievement-modal.tsx` | `11_成就系统页面/code.html` |
| B5 | 12 25道题引导页 | `components/guide-page.tsx` | `12_25道题引导页/code.html` |

**规则**：
- 每页均为静态组件，允许 mock 数据
- 必须使用 `NovelIcon`，禁止 emoji
- 保留 code.html 布局骨架、颜色、间距

#### 批次 C：弹框补齐

**目标**：补齐缺失的弹框

| # | 任务 | 产出文件 | 说明 |
|---|---|---|---|
| C1 | 历史版本弹框 | `components/modals/chapter-history-modal.tsx` | 静态列表 |
| C2 | 备注弹框 | `components/modals/chapter-note-modal.tsx` | 文本输入 |
| C3 | 添加角色弹框 | `components/modals/add-character-modal.tsx` | 表单 |
| C4 | 导出弹框 | `components/modals/export-modal.tsx` | 静态选项 |
| C5 | 反馈弹框 | `components/modals/feedback-modal.tsx` | 文本输入 |

**规则**：
- 所有弹框通过 `NovelModalHost` 渲染
- 弹框内部独立管理表单状态
- 关闭时调用 `closeModal()`

#### 批次 D：页面跳转串联

**目标**：在所有页面中接入 `useNovelNavigation`，建立完整静态流转

| # | 任务 | 涉及文件 |
|---|---|---|
| D1 | 02 书架映射 | `bookshelf/index.tsx` |
| D2 | 03 创建弹窗迁移为 Modal | `create-project-modal/index.tsx` + `novel/index.tsx` |
| D3 | 04 工作台 TopAppBar + SideNav 映射 | `novel-workspace/index.tsx`, `workspace-top-app-bar.tsx` |
| D4 | 05 编辑器工具栏映射 | `novel-editor/index.tsx` |
| D5 | 06/07/09 页面返回映射 | `character-panel-page.tsx`, `world-setting-page.tsx`, `profile-page.tsx` |
| D6 | 10 生成设置接入 ModalHost | `generation-settings.tsx` |
| D7 | 11/12 入口映射 | `bookshelf/index.tsx`, `guide-page.tsx`, `achievement-modal.tsx` |

#### 批次 E：测试

| # | 任务 | 产出 |
|---|---|---|
| E1 | `use-novel-navigation.test.ts` | openView/openModal/closeModal/back 覆盖 |
| E2 | `types/novel-modal.test.ts` | 基础类型测试 |
| E3 | Playwright E2E：书架→工作台→弹框→关闭 | `e2e/novel-static-flow.spec.ts` |
| E4 | Playwright E2E：工作台→章节→返回→人物→设定 | `e2e/novel-workspace-nav.spec.ts` |
| E5 | 运行 `bun test` + `bun typecheck` | 全部通过 |

### 5.3 主界面入口映射表（执行依据）

#### 04 工作台 TopAppBar

| 入口 | 当前行为 | Phase S 目标行为 |
|---|---|---|
| 墨语 AI / Logo | 静态文本 | `openView('workspace')` 或 `openView('bookshelf')` |
| 工作台 | 静态激活态 | `openView('workspace')` |
| 素材库 | 静态 href="#" | `openView('world-setting')` |
| 灵感区 | 静态 href="#" | `openView('guide')` |
| 发布章节 | 无 | `openView('chapter-editor')` |
| 通知 | alert 占位 | 静态通知弹框 |
| 设置 | alert 占位 | `openModal('generation-settings')` |
| 用户头像 | 无 | `openView('profile')` |

#### 04 工作台 SideNav

| 入口 | 当前行为 | Phase S 目标行为 |
|---|---|---|
| 大纲 | `outline-sidebar` 显示 | `openView('workspace')` |
| 章节 | 选择章节 | `openView('chapter-editor')` |
| 人物 | 打开右侧 character panel | `openView('character-panel')` |
| 设定 | 无 | `openView('world-setting')` |
| 导出 | 无 | `openModal('export')` |
| 帮助中心 | 无 | `openView('tutorial')` 或占位 |
| 反馈 | 无 | `openModal('feedback')` 或占位 |

---

## 六、验收标准

按 Phase S 原文标准逐项验证：

| # | 验收项 | 验证方式 |
|---|---|---|
| 1 | `/novel` 默认进入 04 工作台 | 手动/Playwright |
| 2 | 04 TopAppBar 可跳转或打开对应页面/弹框 | 手动/Playwright |
| 3 | 04 SideNav 可跳转章节/人物/设定/导出 | 手动/Playwright |
| 4 | 02 书架可点击项目进入 04 | Playwright E2E |
| 5 | 02 新建按钮可打开 03 弹窗 | Playwright E2E |
| 6 | 03 创建成功可进入 04 | Playwright E2E |
| 7 | 04 设置/批量生成可打开 10 弹窗 | Playwright E2E |
| 8 | 02 或 09 可打开 11 成就 | Playwright E2E |
| 9 | 02 可进入 12 引导页 | Playwright E2E |
| 10 | 所有页面按各自 code.html 为视觉参考 | 人工 VRT 对比 |
| 11 | 所有页面使用 Material Symbols，无 emoji | `grep -r emoji` / 人工 |
| 12 | 公共字体和 design tokens 已接入 | 人工 |
| 13 | UI 不直接 import mock-data | `grep` 检查 |
| 14 | `bun test` 通过 | 命令 |
| 15 | `bun typecheck` 通过 | 命令 |
| 16 | 至少一条 E2E：书架→工作台→弹框→关闭 | Playwright |
| 17 | 至少一条 E2E：工作台→章节→返回→人物→设定 | Playwright |

---

## 七、风险与未完成事项

### 7.1 风险

1. **现有代码回退风险**：`use-novel-view.tsx` 是当前所有页面的导航依赖，重构为 `useNovelNavigation` 时需保证接口兼容或一次性全量替换
2. **create-project 从视图迁 Modal**：当前 `create-project` 在 URL 中作为 `view=create-project`，改为 Modal 后 URL 不再反映弹框状态，需确认产品是否接受
3. **文件数量膨胀**：Phase S 将新增约 12-15 个组件文件，需严格控制在 `packages/app/src/novel/` 内
4. **视觉还原度**：静态页面以 code.html 为参考，但部分交互细节（如动画、Hover 态）可能未在 HTML 中完整定义

### 7.2 建议的下一步

1. **先执行批次 A**：基础设施是其他批次的前置依赖，必须先稳定
2. **批次 B/C 可并行**：页面补齐与弹框补齐彼此独立
3. **批次 D 依赖 A/B/C**：最后统一串联
4. **批次 E 全程伴随**：每批次完成后补充对应测试

### 7.3 未在 Phase S 范围内（明确不做）

- 不接真实后端
- 不接真实 AI
- 不做真实认证
- 不做完整权限/VIP/支付
- 不重构 OpenCode 底座
- 不引入真实 URL 路由（保留 query param 状态机）

---

## 八、结论

当前 novel 模块已完成约 **35-40%** 的 Phase S 目标：

- **已完成**：02 书架、03 创建弹窗（组件级）、04 工作台、05 编辑器（R5 刚完成）、10 生成设置（组件级）、基础 layout 组件
- **缺失核心**：统一导航状态机（`useNovelNavigation`）、弹框宿主（`NovelModalHost`）、6 个独立页面/弹框、完整的跳转串联

**建议批准本方案，按 A→B/C→D→E 顺序执行**，预计可在 1-2 个开发周期内完成全部 Phase S 静态串联目标，形成可演示的产品原型。

---

*评估来源: `caiode/docs/tabbit/06/TabAI会话_1781274036216.md`*
*评估日期: 2026-06-12*
*评估人: Kimi-K2.6*

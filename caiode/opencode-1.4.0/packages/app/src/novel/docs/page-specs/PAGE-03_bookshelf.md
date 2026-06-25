# PAGE-03 我的书架 开发文档

> PRD 来源：AI小说创作助手_PRD文档_完整版.md §3.3、§3.3(更新后 12)
> 路由：`/center`（PRD） → 当前实现 `/novel?view=bookshelf`
> 状态：草稿 v1.0（待评审）
> 文档版本：v1.0
> 最后更新：2026-06-25

---

## 1. 页面定位

| 项 | 内容 |
|----|------|
| 一句话目标 | 用户管理已创建的小说项目，快速进入创作或维护项目生命周期 |
| 用户角色 | 已登录作者 |
| 入口 | 登录成功跳转、顶部导航"书架"、侧栏"书架" |
| 出口 | 创建项目（弹窗）/ 25 题引导 / 工作台 / 作者中心 / 名字生成器 / 拆书分析 / 教程 / 成就 / 签到 / 活动 |
| 关键指标 | 项目打开率、创建转化率、签到留存 |

---

## 2. 信息架构

### 2.1 页面分区图

```
┌──────────────────────────────────────────────────────────────────┐
│ NovelAppLayout                                                    │
│ ┌──────┐ ┌──────────────────────────────────────────────────────┐ │
│ │ Side │ │ TopAppBar: 我的书架 [N本]  [刷新]                      │ │
│ │ Nav  │ ├──────────────────────────────────────────────────────┤ │
│ │      │ │ SearchBar: [搜索小说...] [?]                          │ │
│ │      │ ├──────────────────────────────────────────────────────┤ │
│ │      │ │ ToolbarRow: [彩圆×4] [新建▼] [AI工具箱] [article|draft]│ │
│ │      │ ├──────────────────────────────────────────────────────┤ │
│ │      │ │ ProjectGrid (1列 / 2列 / 3列 / 4列 响应式)            │ │
│ │      │ │  ┌──────────┐ ┌──────────┐ ┌──────────┐              │ │
│ │      │ │  │ Card     │ │ Card     │ │ Card     │              │ │
│ │      │ │  └──────────┘ └──────────┘ └──────────┘              │ │
│ │      │ │                                                          │ │
│ │      │ ├──────────────────────────────────────────────────────┤ │
│ │      │ │              [EmptyState 当 projects=[]]              │ │
│ │      │ └──────────────────────────────────────────────────────┘ │
│ └──────┘                                                            │
│                                              FloatingWidgets (右下) │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 元素清单

| 元素ID | 类型 | PRD描述 | 当前数据来源 | 交互 | 备注 |
|--------|------|---------|------------|------|------|
| EL-01 | 页面标题 | "我的书架" | 静态 | — | TopAppBar.title |
| EL-02 | 数字徽章 | "{N}本" | `projects().length` | — | 应基于 filteredProjects 或全量？需确认 |
| EL-03 | 刷新按钮 | 刷新书架数据 | `refetchProjects()` | onClick | 已实现 |
| EL-04 | 搜索框 | "搜索小说..." | `searchKeyword` signal | onInput 实时过滤 | 当前实时过滤，无防抖 |
| EL-05 | 帮助图标 | 帮助 | — | **未实现** | PRD 未明确，建议跳转教程 |
| EL-06 | 彩圆×4 | 更新/教程/名字生成/拆书分析（PRD） | — | **未实现，无 onClick** | 当前仅装饰 |
| EL-07 | 新建按钮 | 新建项目下拉菜单 | `nav.openView('create-project')` | onClick | **未实现下拉，直接跳弹窗** |
| EL-08 | AI工具箱 | AI工具集合 | — | **未实现** | PRD P2 |
| EL-09 | article/draft 徽标 | 已签/未签章节计数 | 硬编码 2/5 | **未实现** | |
| EL-10 | 项目卡片 | 封面/书名/类型/章数/字数/时间 | `Project` 类型 | onClick 打开工作台 | 已实现基础 |
| EL-11 | 空状态 | 书本图标+标题+3 按钮 | — | onCreateQuick/onCreateProject/onGuide | 已实现，但 3 按钮均跳 create-project |
| EL-12 | 浮动签到 | 今日已签到 N 天 | 硬编码 signinStreak=7 | **未实现 onClick** | |
| EL-13 | 浮动成就 | 成就 N/98 | 硬编码 12/98 | **未实现 onClick** | |
| EL-14 | 浮动活动 | 活动 点击查看 | 硬编码 | **未实现 onClick** | |
| EL-15 | 浮动统计 | 总字数/在线人数 | 硬编码 134,053,060 / 256 | — | |

---

## 3. 用户流程

### 3.1 主流程：打开已有项目

```
[入口: 登录/导航]
  ↓
渲染 BookshelfPage
  ↓ useNovelProject().filteredProjects()
  ↓
判断 isEmpty()
  ├─ 是 → EmptyState
  │       ├─ 点"简易创作" → create-project 视图
  │       ├─ 点"创建新项目" → create-project 视图
  │       └─ 点"25道题引导" → guide 视图
  └─ 否 → ProjectGrid
          ↓ 点 Card
          handleSelectProject(projectId)
          ├─ selectProject(projectId)  ← 写入 URL
          └─ nav.openView('workspace')
```

### 3.2 异常分支

| 异常 | 触发条件 | 当前行为 | 期望行为 |
|------|---------|---------|---------|
| 项目列表加载中 | `isLoadingList=true` | 无 loading 反馈 | 显示骨架屏 |
| 项目列表加载失败 | Provider reject | 无错误反馈 | 显示错误态+重试按钮 |
| 搜索无匹配 | `filteredProjects=[]` 但全量≠[] | 显示 EmptyState（误导） | 显示"未匹配到相关小说" |
| 选中已删除项目 | 项目 ID 失效 | 直接跳工作台，工作台显示空 | 跳工作台前校验，失效则 toast |
| 网络断开刷新 | `refetchProjects` reject | 静默失败 | toast 提示 |

### 3.3 边界条件

- 项目数 = 0：显示 EmptyState
- 项目数 = 1：单列单卡，不应居中拉伸
- 项目数 > 50：分页或虚拟滚动（当前无）
- 书名超长：line-clamp-2，OK
- 类型不在 8 种预设内：fallback 到默认紫色

---

## 4. 交互规格

### 4.1 按钮行为表

| 按钮 | 触发 | disabled 条件 | loading 态 | 反馈 |
|------|------|--------------|-----------|------|
| 刷新 | `refetchProjects()` | `isLoadingList` | 旋转图标 | 成功 toast"已刷新" |
| 搜索 | onInput 实时过滤 | 无 | 无 | 无 |
| 彩圆-更新 | `openModal('whats-new')` | 无 | 无 | 弹窗显示更新内容 |
| 彩圆-教程 | `openView('tutorial')` | 无 | 无 | 跳教程页 |
| 彩圆-名字生成 | `openView('name-generator')` | gate 关闭时禁用+灰显 | 无 | 跳名字生成器 |
| 彩圆-拆书 | `openView('book-analysis')` | gate 关闭时禁用 | 无 | 跳拆书工作室 |
| 新建 | `openView('create-project')` 或下拉 | 无 | 无 | 当前直接跳，PRD 要求下拉 |
| 新建-简易创作 | `openView('create-project', {mode:'quick'})` | 无 | 无 | 跳创建弹窗 |
| 新建-漫剧剧本 | `openView('create-project', {mode:'drama'})` | gate 关闭 | 无 | 跳创建弹窗 |
| 新建-短篇创作 | `openView('create-project', {mode:'short'})` | gate 关闭 | 无 | 跳创建弹窗 |
| 新建-签约审核 | `openModal('signing-review')` | gate 关闭 | 无 | 弹窗 |
| AI工具箱 | `openModal('ai-toolbox')` | 无 | 无 | 弹窗聚合工具 |
| 回收站 | `openModal('trash')` | 无 | 无 | 弹窗显示已删除项目 |
| 浮动-签到 | `openModal('signin')` 或 `signin()` | 已签到则 disabled | 签到中 spinner | 积分 +N toast |
| 浮动-成就 | `openView('achievements')` | 无 | 无 | 跳成就页 |
| 浮动-活动 | `openModal('activity')` | 无 | 无 | 弹窗显示活动 |
| 项目卡-编辑 | `selectProject(id); openView('workspace')` | 无 | 无 | 同主流程 |
| 项目卡-删除 | `deleteProject(id)` | 无 | spinner | 二次确认 + 撤销 toast |
| 项目卡-右键菜单 | 上下文菜单 | 无 | 无 | 复制/导出/删除 |

### 4.2 表单校验规则

- 搜索框：无校验，输入即触发过滤；建议加 300ms 防抖
- 搜索匹配：按书名 includes（大小写不敏感），可选扩展到类型/简介

### 4.3 选区/焦点/键盘行为

- 进入页面自动聚焦搜索框（可选，PRD 未要求）
- `Esc` 清空搜索
- `Cmd/Ctrl+N` 触发新建（快捷键，PRD 未要求但增强体验）
- 项目卡支持键盘上下左右导航 + Enter 打开（无障碍）

---

## 5. 数据契约

### 5.1 输入

| 来源 | 字段 | 类型 | 说明 |
|------|------|------|------|
| URL | `view` | string | 固定 `bookshelf` |
| URL | `projectId` | string? | 选中项目（不影响书架显示） |
| URL | `keyword` | string? | 可选：URL 持久化搜索词 |

### 5.2 调用的 Provider / Hook 方法

| 方法 | 来源 | 用途 |
|------|------|------|
| `useNovelProject().filteredProjects` | hook | 获取过滤后列表 |
| `useNovelProject().searchKeyword` / `setSearchKeyword` | hook | 搜索词读写 |
| `useNovelProject().isLoadingList` | hook | 加载态 |
| `useNovelProject().refetchProjects` | hook | 重新拉取 |
| `useNovelProject().deleteProject(id)` | hook（**待补**） | 删除项目 |
| `useNovelView().selectProject(id)` | hook | 写入 URL projectId |
| `useNovelNavigation().openView(view)` | hook | 切换视图 |
| `useNovelNavigation().openModal(modal)` | hook | 打开弹窗 |
| `useAchievements().signin()` | hook（**待补**） | 签到 |
| `useProfile().stats` | hook | 浮动统计真实数据 |

### 5.3 输出事件 / Mutation

| 事件 | 触发时机 | Payload |
|------|---------|---------|
| `project.selected` | 点 Card | `{projectId}` |
| `project.deleted` | 删除确认 | `{projectId}` |
| `signin.completed` | 签到成功 | `{days, reward}` |
| `navigation.view` | 切换视图 | `{view, params}` |
| `navigation.modal` | 打开弹窗 | `{modal, params}` |

---

## 6. 状态机

### 6.1 状态枚举

```
BookshelfState:
  - 'loading'      // 首次加载
  - 'idle'         // 已加载，正常浏览
  - 'searching'    // 搜索词非空
  - 'empty'        // 全量项目为 0
  - 'no-match'     // 搜索无匹配（与 empty 区分）
  - 'error'        // 加载失败
  - 'refreshing'   // 刷新中
```

### 6.2 状态转移图

```
                ┌──────────┐
                │ loading  │
                └────┬─────┘
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   ┌────────┐  ┌────────┐  ┌───────┐
   │ empty  │  │  idle  │  │ error │
   └────┬───┘  └──┬─────┘  └───┬───┘
        │         │            │ refetch
        │         │ input      │
        │         ▼            │
        │   ┌──────────┐       │
        │   │searching │       │
        │   └────┬─────┘       │
        │        │ no match    │
        │        ▼             │
        │   ┌──────────┐       │
        │   │no-match  │       │
        │   └────┬─────┘       │
        │        │ clear       │
        └────────┴─────────────┘
```

### 6.3 状态归属 Hook

**当前**：状态分散于 `useNovelProject`（filteredProjects / isLoadingList）+ 组件内 `isEmpty` memo
**目标**：统一到 `useNovelProject` 暴露 `bookshelfState` 派生 signal，组件只读

---

## 7. 视觉规格

### 7.1 设计 Token

| Token | 值 | 用途 |
|-------|----|----|
| `--bookshelf-bg` | `#f8f9ff` | 页面背景 |
| `--bookshelf-surface` | `#ffffff` | 卡片/工具栏背景 |
| `--bookshelf-primary` | `#6b38d4` | 主色（按钮/聚焦/选中） |
| `--bookshelf-primary-hover` | `#8455ef` | 主色悬停 |
| `--bookshelf-border` | `#cbc3d7` | 边框 |
| `--bookshelf-text` | `#0d1c2f` | 主文本 |
| `--bookshelf-text-muted` | `#7b7486` | 次要文本 |
| `--bookshelf-text-faint` | `#999` | 弱化文本 |
| `--bookshelf-tag-bg` | `#e9ddff` | 标签背景 |
| `--bookshelf-radius-card` | `12px` | 卡片圆角 |
| `--bookshelf-radius-pill` | `9999px` | 胶囊圆角 |
| `--bookshelf-shadow-sm` | `0 1px 2px rgba(0,0,0,0.04)` | 轻阴影 |
| `--bookshelf-shadow-hover` | `0 8px 24px rgba(107,56,212,0.12)` | 悬停阴影 |

> 注：当前代码与 PRD §7.3（深紫渐变 + Glassmorphism）不一致，书架页实际采用 Stitch 02 浅色风格。需确认以哪个为准。**建议**：保持 Stitch 02 浅色风格作为书架页定稿，PRD §7.3 仅适用于首页落地页（PAGE-01）。

### 7.2 响应式断点

| 断点 | 列数 | 间距 | 侧栏 |
|------|------|------|------|
| < 640px (sm) | 1 列 | 16px | 隐藏，汉堡菜单 |
| 640-1024px (md) | 2 列 | 20px | 隐藏，汉堡菜单 |
| 1024-1280px (lg) | 3 列 | 20px | 显示 |
| ≥ 1280px (xl) | 4 列 | 24px | 显示 |

当前实现仅 1 列 / 2 列，需扩展到 4 列。

### 7.3 状态视觉

| 状态 | 视觉 |
|------|------|
| 空状态 | 居中书本图标 + 标题 + 描述 + 3 按钮（已实现） |
| 加载态 | 6 个骨架卡片（脉冲动画） |
| 错误态 | 居中错误图标 + 文案 + 重试按钮 |
| 无匹配 | 居中放大镜图标 + "未匹配到相关小说" + 清空按钮 |
| 刷新中 | TopAppBar 刷新图标旋转 |

### 7.4 字体

| 元素 | 字体 | 大小 | 字重 |
|------|------|------|------|
| 页面标题 | Plus Jakarta Sans | 20px | 600 |
| 书名 | Plus Jakarta Sans | 14-16px | 600 |
| 正文 | Work Sans / PingFang SC | 12-14px | 400 |
| 标签 | Work Sans | 12px | 500 |
| 时间 | Work Sans | 12px | 400 |

---

## 8. 与其他页面的协同

### 8.1 前置页面

| 页面 | 协同点 |
|------|--------|
| PAGE-02 登录 | 登录成功跳转至本页 |
| PAGE-01 首页 | 点 CTA"开始创作"跳转至本页 |

### 8.2 后续页面

| 页面 | 协同点 |
|------|--------|
| PAGE-04~08 创建项目 | 点"新建"/"创建新项目"打开 |
| PAGE-09~10 25 题引导 | 点"25 道题引导"打开 |
| Workspace 工作台 | 点项目卡打开（携带 projectId） |
| PAGE-13 作者中心 | 侧栏/顶栏入口 |
| PAGE-11 成就 | 浮动组件入口 |
| PAGE-19 名字生成器 | 工具栏入口 |
| PAGE-20 拆书 | 工具栏入口 |
| PAGE-21 教程 | 工具栏入口 |

### 8.3 共享状态

| 状态 | 归属 | 消费方 |
|------|------|--------|
| `projectId` | URL | 工作台/编辑器 |
| `projects[]` | `useNovelProject` | 书架/工作台项目切换 |
| `achievements count` | `useAchievements` | 书架浮动组件/成就页 |
| `signin streak` | `useProfile` 或独立 `useSignin` | 书架浮动组件 |

---

## 9. 当前实现差距

| PRD 项 | 现状 | 差距 | 修复优先级 |
|--------|------|------|-----------|
| 页面标题 + N 本徽章 | ✅ 已实现 | 无 | — |
| 刷新按钮 | ✅ 已实现 | 无 | — |
| 搜索框 | ✅ 已实现 | 无防抖、无 URL 持久化、无"无匹配"态 | P1 |
| 帮助图标 | ✅ 图标存在 | 无 onClick | P2 |
| 工具栏 4 彩圆（更新/教程/名字生成/拆书） | ❌ 仅装饰无 onClick | 4 个按钮全缺 | P1 |
| 新建按钮 | ⚠️ 直接跳弹窗 | 缺下拉菜单（简易/漫剧/短篇/签约） | P1 |
| AI 工具箱 | ❌ 仅装饰 | 缺弹窗聚合 | P2 |
| article/draft 徽标 | ❌ 硬编码 2/5 | 缺真实数据源 | P2 |
| 项目卡片-封面 | ✅ 渐变+首字 | 缺图片上传封面支持 | P2 |
| 项目卡片-类型标签 | ✅ 已实现 | 无 | — |
| 项目卡片-章数/字数/时间 | ✅ 已实现 | 无 | — |
| 项目卡片-删除按钮 | ❌ onClick stopPropagation 无行为 | 缺二次确认 + Provider 调用 | P1 |
| 项目卡片-右键菜单 | ❌ 未实现 | 缺复制/导出/删除 | P2 |
| 空状态-3 按钮 | ⚠️ 3 按钮都跳 create-project | "25 道题引导"应跳 guide 视图 | P1 |
| 浮动-签到 | ❌ 硬编码 7 天，无 onClick | 缺签到 API + 弹窗 | P1 |
| 浮动-成就 | ❌ 硬编码 12/98，无 onClick | 缺真实计数 + 跳转 | P1 |
| 浮动-活动 | ❌ 无 onClick | 缺活动弹窗 | P2 |
| 浮动-统计 | ❌ 硬编码 | 缺真实统计 | P2 |
| 加载态/错误态/无匹配态 | ❌ 未实现 | 缺三态 | P1 |
| 响应式 4 列 | ⚠️ 仅 1/2 列 | 扩展到 4 列 | P2 |
| 组件碎片化 | ❌ index.tsx 内联 ProjectCard，未用 project-card.tsx | 二者并存，行为不一致 | P1 |
| 回收站 | ❌ 未实现 | 缺弹窗 | P2 |
| 签到领积分入口 | ❌ 仅浮动组件 | PRD 要求顶部按钮 | P2 |
| 成就 1/98 入口 | ❌ 仅浮动组件 | PRD 要求顶部按钮 | P2 |

---

## 10. 验收清单

### 10.1 功能验收

- [ ] 顶部显示"我的书架"+ 项目数徽章
- [ ] 刷新按钮点击后重新拉取列表，有 loading 反馈
- [ ] 搜索框输入实时过滤，300ms 防抖
- [ ] 搜索无匹配显示"未匹配到相关小说"+ 清空按钮
- [ ] 工具栏 4 彩圆分别跳转：更新弹窗/教程/名字生成器/拆书
- [ ] 新建按钮显示下拉菜单含 4 项（简易/漫剧/短篇/签约）
- [ ] 项目卡片点击进入工作台
- [ ] 项目卡片删除按钮弹二次确认，确认后软删除进入回收站
- [ ] 空状态 3 按钮分别跳转 create-project / create-project / guide
- [ ] 浮动签到可点击，签到后显示积分 +N toast
- [ ] 浮动成就可点击跳成就页
- [ ] 浮动活动可点击弹活动窗
- [ ] 浮动统计显示真实总字数与在线人数

### 10.2 交互验收

- [ ] 卡片悬停有阴影加深 + 边框变色
- [ ] 卡片支持键盘导航（Tab + Enter）
- [ ] 刷新中图标旋转，按钮 disabled
- [ ] 网络断开刷新有 toast 提示
- [ ] Esc 清空搜索
- [ ] 删除后显示撤销 toast 5 秒

### 10.3 数据验收

- [ ] 项目数徽章随列表实时更新
- [ ] 搜索过滤后徽章显示全量数（非过滤后数）
- [ ] 删除项目后列表立即移除（乐观更新）
- [ ] 签到状态跨页面一致（profile 与书架同步）

### 10.4 视觉验收

- [ ] 4 列响应式断点正确
- [ ] 加载态骨架屏与卡片尺寸一致
- [ ] 错误态文案居中
- [ ] 浮动组件不遮挡卡片内容（z-index 与 padding 正确）

---

## 11. 关联割裂点

| 割裂点编号 | 描述 | 本页影响 |
|-----------|------|---------|
| 新增 #16 | `index.tsx` 内联 `ProjectCard`，未复用 `project-card.tsx` | 维护两份卡片实现，行为不一致（一个有删除按钮，一个无） |
| 新增 #17 | `header.tsx` / `toolbar.tsx` / `search-bar.tsx` / `project-grid.tsx` 全为孤立组件，未被 `index.tsx` 引用 | 仓库存在 5 份未使用组件，易误导 |
| 新增 #18 | `FloatingWidgets` 数据全部硬编码，无 Provider 接入 | 签到/成就/统计与真实状态脱节 |
| 新增 #19 | 工具栏 4 彩圆无 `onClick`，无 `title`，无障碍缺失 | 用户无法识别按钮用途 |
| 新增 #20 | "新建"按钮跳 create-project，但 PRD 要求下拉菜单含 4 种创建模式 | 创建入口单一 |

---

## 12. 重构建议（优先级排序）

### P0（阻塞）

1. **删除孤立组件**：移除 `header.tsx` / `toolbar.tsx` / `search-bar.tsx` / `project-grid.tsx`，统一使用 `index.tsx` 内联或迁移到单一 `project-card.tsx`
2. **修复空状态 3 按钮**：`onGuide` 应跳 `guide` 视图（当前跳 create-project）

### P1（重要）

3. **接入 4 彩圆 onClick**：更新/教程/名字生成/拆书分别绑定
4. **新建下拉菜单**：替换直接跳转为 4 项下拉
5. **删除项目流程**：二次确认 + `deleteProject` + 撤销 toast
6. **浮动组件接入真实数据**：签到状态/成就计数/统计
7. **加载/错误/无匹配三态**：骨架屏 + 错误态 + 无匹配态
8. **搜索防抖 + URL 持久化**：300ms 防抖，keyword 写入 URL

### P2（增强）

9. **响应式 4 列**
10. **回收站弹窗**
11. **AI 工具箱弹窗**
12. **article/draft 真实数据**
13. **项目卡右键菜单**
14. **图片封面上传**

---

## 附录

### A. 关键文件路径

| 文件 | 职责 | 状态 |
|------|------|------|
| `components/bookshelf/index.tsx` | 书架页主组件 | 使用中 |
| `components/bookshelf/empty-state.tsx` | 空状态 | 使用中 |
| `components/bookshelf/floating-widgets.tsx` | 浮动组件 | 使用中（硬编码） |
| `components/bookshelf/header.tsx` | 顶部栏 | **孤立未用** |
| `components/bookshelf/toolbar.tsx` | 工具栏 | **孤立未用** |
| `components/bookshelf/search-bar.tsx` | 搜索栏 | **孤立未用** |
| `components/bookshelf/project-card.tsx` | 项目卡片 | **孤立未用** |
| `components/bookshelf/project-grid.tsx` | 卡片网格 | **孤立未用** |
| `hooks/use-novel-project.ts` | 项目 Hook | 使用中 |
| `hooks/use-novel-view.tsx` | 视图路由 | 使用中 |
| `hooks/use-novel-navigation.tsx` | 导航 + Modal | 使用中 |
| `types/bookshelf.ts` | 书架类型 | 部分使用 |
| `mock-data/projects.ts` | Mock 项目数据 | 使用中 |

### B. Mock 数据结构

```ts
interface Project {
  id: string;
  name: string;            // 书名
  genre: string;           // 类型（玄幻/奇幻/仙侠/科幻/古言/都市/悬疑/穿越）
  chapterCount: number;    // 章节数
  totalWordCount: number;  // 总字数
  lastUpdated: Date;       // 最后编辑时间
  // 待补字段：
  coverUrl?: string;       // 封面图（可选）
  status?: 'draft' | 'ongoing' | 'completed' | 'archived';
  signedStatus?: 'unsigned' | 'pending' | 'signed';
  isDeleted?: boolean;     // 软删除标记
}
```

### C. 建议测试用例编号

| 用例 ID | 描述 |
|---------|------|
| TC-BS-001 | 首次进入显示项目列表 |
| TC-BS-002 | 项目数=0 显示空状态 |
| TC-BS-003 | 3 个空状态按钮分别跳转 |
| TC-BS-004 | 搜索实时过滤 + 防抖 |
| TC-BS-005 | 搜索无匹配显示无匹配态 |
| TC-BS-006 | 4 彩圆分别跳转 |
| TC-BS-007 | 新建下拉 4 项 |
| TC-BS-012 | 项目卡删除二次确认 |
| TC-BS-013 | 删除后撤销 toast 恢复 |
| TC-BS-014 | 浮动签到点击 + 积分 toast |
| TC-BS-015 | 浮动成就点击跳成就页 |
| TC-BS-016 | 加载态骨架屏 |
| TC-BS-017 | 错误态重试 |
| TC-BS-018 | 响应式 1/2/3/4 列断点 |
| TC-BS-019 | Esc 清空搜索 |
| TC-BS-020 | 键盘导航卡片 + Enter 打开 |

---

**文档结束**

*下一步：请评审本文档，确认后进入 PAGE-04 创建新项目-基本信息 开发文档*

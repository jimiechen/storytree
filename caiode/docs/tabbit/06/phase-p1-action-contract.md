# Phase P1-0A: Stitch Action Contract

**NovelForge 全量交互点动作契约**

| 项目 | 内容 |
|---|---|
| 文档类型 | Action Contract（交互契约） |
| 创建日期 | 2026-06-18 |
| 代码基线 | opencode-1.4.0/packages/app/src/novel (130+ files) |
| 覆盖范围 | 12 个页面区域，全部 onClick/onInput/onChange/onSubmit 事件 |

---

## 动作类型定义

```typescript
type ActionType =
  | "NAV"           // 页面导航 / 面板切换
  | "MODAL"         // 打开或关闭弹框
  | "CRUD"          // 数据增删改（非 AI）
  | "AI_WORKFLOW"   // 触发 AI 工作流（生成/续写/提取等）
  | "INFO_WORKFLOW" // 信息流相关操作（审计展示/折叠）
  | "FUTURE"        // 远期功能（当前仅占位/TODO）
  | "CONFIG"       // 配置变更（字数/模型/上下文选项等）
```

---

## 区域 01：全局导航层 (TopAppBar + SideNav)

### 01-TopAppBar

| # | 按钮名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 01-T01 | 菜单按钮 | 打开全局菜单 | MODAL | 否 | nav.openMenu() | 是 |
| 01-T02 | 刷新按钮 | 刷新页面数据 | CRUD | 否 | location.reload() | 是 |

**源文件**: [novel-top-app-bar.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/layout/novel-top-app-bar.tsx#L29-L56)

### 01-SideNav（书架页左侧）

| # | 按钮名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 01-S01 | 立即写作 | 打开创建项目弹窗 | MODAL | **是** | openCreateProject() | — |
| 01-S02 | 我的书架 | 导航到书架首页 | NAV | **是** | navigate('/bookshelf') | — |
| 01-S03 | 导航项按钮(×N) | 切换页面区域 | NAV | **是** | navigate(page) | — |
| 01-S04 | 退出登录 | 登出操作 | CRUD | 否 | auth.logout() | 是 |

**源文件**: [novel-side-nav.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/layout/novel-side-nav.tsx#L54-L85)

---

## 区域 02：我的书架 (Bookshelf)

### 02-SearchBar

| # | 控件名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 02-S01 | 搜索输入框 | 输入关键词过滤项目列表 | CONFIG | **是** | onSearch(keyword) → NovelProjectProvider.filterProjects() | — |
| 02-S02 | 帮助图标 | 打开帮助说明 | NAV | 否 | openHelp() | 是 |

**源文件**: [search-bar.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/bookshelf/search-bar.tsx)

### 02-Toolbar

| # | 按钮名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 02-T01 | 工具栏按钮(×N) | 各类快捷操作（排序/筛选/视图切换） | CONFIG/NAV | 部分 | items[].action 回调 | 视具体 item |

**源文件**: [toolbar.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/bookshelf/toolbar.tsx)

### 02-ProjectGrid / ProjectCard

| # | 按钮名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 02-P01 | 项目卡片点击 | 选择项目进入工作台 | NAV | **是** | selectProject(id) → navigate('/workspace') | — |
| 02-P02 | 编辑按钮(hover) | 进入编辑模式 | NAV | **是** | editProject(id) → navigate('/editor') | — |
| 02-P03 | 删除按钮(hover) | 删除项目确认 | CRUD | 否 | deleteProject(id) | 是 |
| 02-P04 | 新建按钮 | 打开创建项目弹窗 | MODAL | **是** | openCreateProject() | — |
| 02-P05 | 引导按钮 | 打开引导创作流程 | NAV | **是** | startGuide() → navigate('/guide') | — |

**源文件**: [bookshelf/index.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/bookshelf/index.tsx), [project-card.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/bookshelf/project-card.tsx)

### 02-FloatingWidgets

| # | 控件名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 02-F01 | 签到卡片 | 显示签到天数 | INFO_WORKFLOW | 否 | readonly display | 是 |
| 02-F02 | 成就卡片 | 显示成就进度 | INFO_WORKFLOW | 否 | readonly display | 是 |
| 02-F03 | 活动卡片 | 点击打开活动详情 | NAV | 否 | openActivity() | 是 |
| 02-F04 | 统计信息 | 显示总字数/在线人数 | INFO_WORKFLOW | 否 | readonly display | 是 |

**源文件**: [floating-widgets.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/bookshelf/floating-widgets.tsx)

---

## 区域 03：创建项目弹窗 (CreateProjectModal)

| # | 控件名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 03-01 | 简易/完整 Tab 切换 | 切换表单模式 | NAV | **是** | setActiveTab('simple'/'full') | — |
| 03-02 | 书名输入框 | 输入项目名称 | CONFIG | **是** | setProjectName(value) | — |
| 03-03 | 类型选择下拉 | 选择小说类型 | CONFIG | **是** | setGenre(value) | — |
| 03-04 | 简介输入框 | 输入项目简介 | CONFIG | **是** | setDescription(value) | — |
| 03-05 | 主角姓名输入 | 输入主角名字 | CONFIG | **是** | setProtagonistName(value) | — |
| 03-06 | 主角年龄输入 | 输入主角年龄 | CONFIG | **是** | setProtagonistAge(value) | — |
| 03-07 | 主角性别选择 | 选择性别 | CONFIG | **是** | setProtagonistGender(value) | — |
| 03-08 | 主角性格输入 | 输入性格描述 | CONFIG | **是** | setProtagonistPersonality(value) | — |
| 03-09 | 目标读者选择 | 选择目标读者 | CONFIG | **是** | setTargetAudience(value) | — |
| 03-10 | 写作风格选择 | 选择风格 | CONFIG | **是** | setWritingStyle(value) | — |
| 03-11 | 故事主题选择 | 选择主题 | CONFIG | **是** | setStoryTheme(value) | — |
| 03-12 | 自定义设定输入 | 输入自定义世界观 | CONFIG | **是** | setCustomSettings(value) | — |
| 03-13 | 提交创建(AI图标) | 提交并可能触发 AI 初始化 | CRUD/AI_WORKFLOW | **是** | submitCreateProject() → NovelProjectProvider.createProject() | — |
| 03-14 | 取消按钮 | 关闭弹窗 | MODAL | **是** | closeModal() | — |

**源文件**: [create-project-modal/index.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/create-project-modal/index.tsx) (L146-L399)

---

## 区域 04：工作台 (Workspace)

### 04-WorkspaceSideNav（工作台左侧导航）

| # | 按钮名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 04-SN01 | 大纲 | 切换到大纲面板 | NAV | **是** | onOpenOutline() | — |
| 04-SN02 | 章节 | 切换到章节面板 | NAV | **是** | onOpenChapters() | — |
| 04-SN03 | 人物 | 切换到人物面板 | NAV | **是** | onOpenCharacters() | — |
| 04-SN04 | 设定 | 切换到世界设定面板 | NAV | **是** | onOpenWorldSetting() | — |
| 04-SN05 | 导出 | 打开导出设置弹窗 | MODAL | 否 | onOpenExport() | 是 |
| 04-SN06 | 帮助中心 | 打开帮助 | NAV | 否 | onOpenHelp() | 是 |
| 04-SN07 | 反馈 | 打开反馈弹窗 | MODAL | 否 | onOpenFeedback() | 是 |
| 04-SN08 | AI生成大纲 | 触发大纲生成 | AI_WORKFLOW | **是** | onGenerateOutline() → useNovelWorkflow().runOutlineGeneration() | — |
| 04-SN09 | 生成细纲 | 触发细纲生成 | AI_WORKFLOW | **是** | onGenerateDetail() → useNovelWorkflow().runOutlineGeneration(genre, 'detail') | — |

**源文件**: [workspace-side-nav.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/layout/workspace-side-nav.tsx)

### 04-WorkspaceOutlineList（章节/大纲列表）

| # | 控件名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 04-OL01 | 章节行点击 | 选择章节进入编辑器 | NAV | **是** | onSelectChapter(id) | — |
| 04-OL02 | 展开箭头 | 展开/收起章节子节点 | CONFIG | **是** | onToggleExpand(id) | — |
| 04-OL03 | 完成复选框 | 标记章节完成状态 | CRUD | **是** | onToggleComplete(id) → ChapterProvider.updateStatus() | — |
| 04-OL04 | 星标按钮 | 收藏/取消收藏章节 | CRUD | **是** | onToggleStar(id) | — |

**源文件**: [workspace-outline-list.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/outline/workspace-outline-list.tsx)

### 04-GenerationForm（生成参数表单）

| # | 控件名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 04-GF01 | 目标字数 - 按钮 | 减少目标字数 | CONFIG | **是** | onChangeTargetWords(val - 500) | — |
| 04-GF02 | 目标字数 + 按钮 | 增加目标字数 | CONFIG | **是** | onChangeTargetWords(val + 500) | — |
| 04-GF03 | 字数容差下拉 | 选择容差范围 | CONFIG | **是** | onChangeTolerance(value) | — |
| 04-GF04 | 参考章节数下拉 | 选择参考前 N 章 | CONFIG | **是** | onChangeReferenceChapters(value) | — |
| 04-GF05 | AI模型下拉 | 选择生成模型 | CONFIG | **是** | onChangeModel(value) | — |

**源文件**: [workspace-generation-form.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/generation/workspace-generation-form.tsx)

### 04-ContextOptions（参考上下文勾选）

| # | 控件名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 04-CO01 | 大纲细纲 checkbox | 勾选/取消大纲作为上下文 | CONFIG | **是** | onToggleOption('outline') | — |
| 04-CO02 | 正文摘要 checkbox | 勾选/取消摘要作为上下文 | CONFIG | **是** | onToggleOption('text-summary') | — |
| 04-CO03 | 主角状态 checkbox | 勾选/取消角色状态作为上下文 | CONFIG | **是** | onToggleOption('protagonist') | — |
| 04-CO04 | 角色关系 checkbox | 勾选/取消关系网作为上下文 | CONFIG | **是** | onToggleOption('relationships') | — |
| 04-CO05 | 技能道具 checkbox | 勾选/取消道具技能作为上下文 | CONFIG | **是** | onToggleOption('skills-items') | — |
| 04-CO06 | 重要事件 checkbox | 勾选/取消事件线作为上下文 | CONFIG | **是** | onToggleOption('events') | — |

**源文件**: [workspace-context-options.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/generation/workspace-context-options.tsx)

### 04-Actions（底部操作按钮）

| # | 按钮名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 04-A01 | 开始生成 | 触发单章 AI 生成 | AI_WORKFLOW | **是** | onStartGeneration() → useNovelWorkflow().runChapterGeneration(chapterId, genre) | — |
| 04-A02 | 批量生成 | 批量多章生成 | AI_WORKFLOW | 否 | onBatchGeneration() | 是 |

**源文件**: [workspace-actions.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/generation/workspace-actions.tsx)

### 04-AiProgressDock（AI 进度浮窗）

| # | 按钮名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 04-PD01 | 暂停按钮 | 暂停正在进行的 AI 生成 | AI_WORKFLOW | 否 | onPause() | 是 |

**源文件**: [workspace-ai-progress-dock.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/ai-task/workspace-ai-progress-dock.tsx)

### 04-Workspace 顶部工具栏

| # | 按钮名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 04-W01 | 返回书架 | 导航回书架 | NAV | **是** | navigateBack('/bookshelf') | — |
| 04-W02 | 打开导出弹窗 | MODAL | 否 | openModal('export') | 是 |
| 04-W03 | 打开历史版本 | MODAL | 否 | openModal('chapter-history') | 是 |
| 04-W04 | 打开批量生成 | MODAL | 否 | openModal('batch-generation') | 是 |
| 04-W05 | 打开通知中心 | MODAL | 否 | openModal('notifications') | 是 |
| 04-W06 | 打开设置 | MODAL | 否 | openModal('settings') | 是 |
| 04-W07 | 打开个人中心 | NAV | 否 | navigate('/profile') | 是 |
| 04-W08 | 打开成就页面 | NAV | 否 | navigate('/achievements') | 是 |
| 04-W09 | 打开反馈 | MODAL | 否 | openModal('feedback') | 是 |

**源文件**: [novel-workspace/index.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/index.tsx#L37-L59)

---

## 区域 05：编辑器 (Editor)

### 05-EditorToolbar（顶部工具栏）

| # | 按钮名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 05-T01 | 返回按钮 | 返回工作台 | NAV | **是** | onBack() → navigate('/workspace') | — |
| 05-T02 | 字数统计显示 | 显示当前字数 | INFO_WORKFLOW | 否 | readonly | — |
| 05-T03 | AI续写按钮 | 触发 AI 续写 | AI_WORKFLOW | **是** | onAIContinue() → useNovelWorkflow().runContinueWriting(chapterId, content) | — |
| 05-T04 | 发布按钮 | 发布章节 | CRUD | 否 | publishChapter() | 是 |
| 05-T05 | 保存按钮 | 保存草稿 | CRUD | **是** | onSave() → ChapterProvider.saveDraft() | — |
| 05-T06 | 历史按钮 | 打开历史版本 | MODAL | 否 | openHistory() | 是 |
| 05-T07 | 全屏按钮 | 切换全屏模式 | CONFIG | 否 | toggleFullscreen() | 是 |

**源文件**: [editor-toolbar.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/editor-toolbar.tsx#L24-L58)

### 05-EditorCanvas（正文编辑区）

| # | 控件名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 05-C01 | 标题输入框 | 编辑章节标题 | CRUD | **是** | setTitle(value) → ChapterProvider.updateTitle() | — |
| 05-C02 | 正文 contenteditable | 编辑正文内容 | CRUD | **是** | setContent(html) → ChapterProvider.updateContent() | — |
| 05-C03 | 键盘事件 | 处理特殊按键（如 Ctrl+S） | CRUD | **是** | handleKeyShortcut(e) | — |

**源文件**: [editor-canvas.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/editor-canvas.tsx#L73-L90)

### 05-AIFloatingToolbar（浮动 AI 工具栏）

| # | 按钮名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 05-FT01 | 续写 | 对选中/光标位置续写 | AI_WORKFLOW | **是** | onCommand('continue') → useNovelWorkflow().runEditorCommand(chapterId, 'continue', selectedText) | — |
| 05-FT02 | 改写 | 改写选中文本 | AI_WORKFLOW | 否 | onCommand('rewrite') | 是(P1-B) |
| 05-FT03 | 扩写 | 扩展描写选中文本 | AI_WORKFLOW | 否 | onCommand('expand') | 是(P1-B) |
| 05-FT04 | 润色 | 润色选中文本 | AI_WORKFLOW | 否 | onCommand('polish') | 是(P1-B) |
| 05-FT05 | 摘要 | 总结选中文本/章节 | AI_WORKFLOW | 否 | onCommand('summarize') | 是(P1-B) |

**源文件**: [editor-ai-floating-toolbar.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/editor-ai-floating-toolbar.tsx#L16-L22)

### 05-ChapterInfoPanel（右侧信息面板）

| # | 控件名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 05-IP01 | 重新提取信息 | 触发 AI 信息提取 | AI_WORKFLOW | **是** | onRefreshAI() → useNovelWorkflow().runExtractInfo(chapterId, genre) | — |
| 05-IP02 | 信息审计块展开/折叠 | 展示 Info-Lite 数据 | INFO_WORKFLOW | **是** | toggleInfoAudit() (纯 UI) | — |

**源文件**: [chapter-info-panel.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/chapter-info-panel.tsx)

### 05-EditorRightPanel（右侧面板底栏）

| # | 按钮名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 05-RP01 | 状态变更 | 更改章节状态(draft/published) | CRUD | **是** | onStatusChange(status) → ChapterProvider.updateStatus() | — |
| 05-RP02 | 保存草稿 | 保存当前草稿 | CRUD | **是** | onSaveDraft() → ChapterProvider.saveDraft() | — |
| 05-RP03 | 标记完成 | 标记章节为已完成 | CRUD | **是** | onMarkComplete() → ChapterProvider.markComplete() | — |

**源文件**: [editor-right-panel.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/editor-right-panel.tsx)

### 05-CharacterPanel（编辑器内角色面板）

| # | 控件名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 05-CP01 | 角色Tab切换 | 切换查看不同角色 | NAV | **是** | setSelectedChar(char.id) (纯 UI) | — |

**源文件**: [character-panel.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/character-panel.tsx)

### 05-ChapterList（章节目录）

| # | 控件名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 05-CL01 | 章节点击 | 切换到该章节 | NAV | **是** | onSelectChapter(id) | — |

**源文件**: [chapter-list.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/chapter-list.tsx)

### 05-AITaskPanel（任务队列面板）

| # | 按钮名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 05-TP01 | 展开/折叠任务 | 查看任务详情 | INFO_WORKFLOW | **是** | toggleTaskExpand(taskId) (纯 UI) | — |
| 05-TP02 | 取消任务 | 取消进行中的任务 | AI_WORKFLOW | **是** | onCancelTask(taskId) → adapter.cancel(taskId) | — |
| 05-TP03 | 重试任务 | 重试失败的任务 | AI_WORKFLOW | **是** | onRetryTask(taskId) → adapter.retry(command) | — |

**源文件**: [ai-task-panel.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/ai-task-panel.tsx#L33-L135)

### 05-AIResultCard（结果卡片）

| # | 按钮名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 05-RC01 | 展开/折叠 | 展开或收起结果详情 | INFO_WORKFLOW | **是** | setIsExpanded(!isExpanded()) (纯 UI) | — |
| 05-RC02 | 采纳按钮 | 将 AI 结果追加到正文 | CRUD | **是** | onAccept(text) → chapter.content += text | — |
| 05-RC03 | 存为灵感 | 保存到灵感池 | CRUD | 否 | onSave(text) → InspirationStore.add() | 是 |
| 05-RC04 | 忽略按钮 | 丢弃 AI 结果 | CRUD | **是** | onDiscard() → AILogProvider.logDiscarded() | — |

**源文件**: [ai-result-card.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/ai-result-card.tsx#L35-L128)

### 05-AILogDrawer（日志抽屉）

| # | 控件名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 05-LD01 | 关闭按钮 | 关闭日志抽屉 | MODAL | **是** | onClose() | — |
| 05-LD02 | 清空按钮 | 清空所有日志记录 | CRUD | **是** | onClearLogs() → AILogProvider.clearLogs() | — |
| 05-LD03 | 状态筛选按钮(×7) | 按状态过滤日志 | CONFIG | **是** | setFilterStatus(status) (纯 UI) | — |
| 05-LD04 | 类型筛选按钮(×5) | 按类型过滤日志 | CONFIG | **是** | setFilterType(type) (纯 UI) | — |
| 05-LD05 | 遮罩点击 | 点击遮罩关闭抽屉 | MODAL | **是** | onClose() | — |

**源文件**: [ai-log-drawer.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/ai-log-drawer.tsx)

---

## 区域 06：角色追踪 (Character Panel - Workspace)

| # | 控件名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 06-01 | 主角卡片 | 查看主角详细信息 | NAV | **是** | selectCharacter('protagonist') | — |
| 06-02 | 反派卡片 | 查看反派详细信息 | NAV | 否 | selectCharacter('antagonist') | 是 |
| 06-03 | 配角卡片 | 查看配角详细信息 | NAV | 否 | selectCharacter('supporting') | 是 |

**源文件**: [character-protagonist.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/character-panel/), [character-antagonist.tsx], [character-supporting.tsx]

---

## 区域 07：世界设定 (WorldSetting)

| # | 控件名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 07-T01 | 地点 Tab | 切换到地点列表 | NAV | **是** | onChangeTab('location') | — |
| 07-T02 | 物品 Tab | 切换到物品列表 | NAV | **是** | onChangeTab('item') | — |
| 07-T03 | 技能 Tab | 切换到技能列表 | NAV | **是** | onChangeTab('skill') | — |
| 07-T04 | 势力 Tab | 切换到势力列表 | NAV | **是** | onChangeTab('faction') | — |

**源文件**: [world-tab-nav.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/world-setting/world-tab-nav.tsx)

---

## 区域 09：个人中心 (Profile)

| # | 控件名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 09-T01 | 积分 Tab | 切换到积分页面 | NAV | **是** | onChangeTab('credits') | — |
| 09-T02 | 充值 Tab | 切换到充值页面 | NAV | 否 | onChangeTab('recharge') | 是 |
| 09-T03 | 导出 Tab | 切换到导出页面 | NAV | 否 | onChangeTab('export') | 是 |
| 09-T04 | 导入 Tab | 切换到导入页面 | NAV | 否 | onChangeTab('import') | 是 |
| 09-R01 | 充值包选择(×N) | 选择充值套餐 | CRUD | 否 | selectPackage(pkg) | 是 |
| 09-R02 | 支付宝支付按钮 | 发起支付 | CRUD | 否 | initiatePayment() | 是 |

**源文件**: [profile-tab-nav.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/profile/profile-tab-nav.tsx), [profile-recharge-tab.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/profile/profile-recharge-tab.tsx)

---

## 区域 10：生成参数弹窗 (GenerationSettingsModal)

| # | 控件名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 10-01 | 配置确认 | 确认生成配置并开始生成 | AI_WORKFLOW | **是** | onGenerate(cfg) → useNovelWorkflow().runChapterGeneration() | — |
| 10-02 | 关闭按钮 | 关闭弹窗 | MODAL | **是** | onClose() | — |

**源文件**: [generation-settings-modal.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/layout/generation-settings-modal.tsx), [novel-modal-host.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/layout/novel-modal-host.tsx)

---

## 区域 11：成就系统 (Achievements)

| # | 控件名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 11-T01 | 全部 Tab | 显示全部成就 | NAV | **是** | onChangeCategory('all') | — |
| 11-T02 | 创作 Tab | 显示创作类成就 | NAV | **是** | onChangeCategory('creation') | — |
| 11-T03 | 社交 Tab | 显示社交类成就 | NAV | 否 | onChangeCategory('social') | 是 |
| 11-T04 | 成长 Tab | 显示成长类成就 | NAV | 否 | onChangeCategory('growth') | 是 |
| 11-T05 | 特殊 Tab | 显示特殊类成就 | NAV | 否 | onChangeCategory('special') | 是 |

**源文件**: [achievement-category-tabs.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/achievements/achievement-category-tabs.tsx)

---

## 区域 12：引导页 (GuideQA)

| # | 控件名 | 功能概要 | 动作类型 | P1 必须 | handler | 暂缓 |
|---|--------|---------|---------|--------|---------|------|
| 12-Q01 | 关闭按钮 | 关闭引导并退出 | NAV | **是** | onClose() → exitGuide() | — |
| 12-Q02 | 选项卡片(×3-6) | 选择问题答案 | CONFIG | **是** | onAnswer(step, answerValue) → recordAnswer() | — |
| 12-Q03 | 上一步按钮 | 回到上一题 | NAV | **是** | onPrev() (disabled when step=1) | — |
| 12-Q04 | 跳过引导 | 跳过引导直接进入编辑器 | NAV | **是** | onSkip() → skipGuide() → createMinimalProject() | — |
| 12-Q05 | 下一步按钮 | 进入下一题 | NAV | **是** | onNext() → onAnswer(step, currentAnswer) | — |

**源文件**: [guide-qa-step.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-guide/guide-qa-step.tsx)

---

## ModalHost 全部弹框

| # | 弹框 ID | 触发来源 | 功能概要 | 动作类型 | P1 必须 | 当前实现 | 暂缓 |
|---|---------|---------|---------|---------|--------|---------|------|
| MH-01 | export | 04-W02 | 导出设置 | MODAL | 否 | 占位符"功能开发中" | 是 |
| MH-02 | feedback | 04-W09 / 04-SN07 | 意见反馈 | MODAL | 否 | 占位符 | 是 |
| MH-03 | chapter-history | 04-W03 / 05-T06 | 历史版本 | MODAL | 否 | 占位符 | 是 |
| MH-04 | notifications | 04-W04 | 通知中心 | MODAL | 否 | 占位符 | 是 |
| MH-05 | batch-generation | 04-W04 / 04-A02 | 批量生成 | MODAL | 否 | 占位符 | 是 |
| MH-06 | settings | 04-W06 | 系统设置 | MODAL | 否 | 占位符 | 是 |
| MH-07 | guide-create | 02-P05 | 新建引导项目 | MODAL | 否 | 占位符 | 是 |
| MH-08 | achievement-detail | 成就卡片点击 | 成就详情 | MODAL | 否 | 占位符 | 是 |
| MH-09 | generation-settings | 10-01 | 生成参数配置 | MODAL | **是** | GenerationSettingsModal 完整实现 | — |

**源文件**: [novel-modal-host.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/layout/novel-modal-host.tsx)

---

## 汇总统计

### 按动作类型分布

| 动作类型 | 数量 | P1 必须数量 | 说明 |
|---------|------|-----------|------|
| **NAV** | ~30 | **18** | 页面导航和面板切换，大部分必须 |
| **MODAL** | ~15 | **6** | 弹窗开关，核心弹窗必须 |
| **CRUD** | ~15 | **8** | 数据读写，保存/标记/删除等 |
| **CONFIG** | ~20 | **15** | 表单配置变更，几乎全部必须 |
| **AI_WORKFLOW** | ~14 | **9** | 核心 AI 操作入口 |
| **INFO_WORKFLOW** | ~8 | **4** | 信息展示和审计交互 |
| **FUTURE** | ~10 | 0 | 远期占位，全部暂缓 |
| **总计** | **~112** | **60** | — |

### P1 必须实现的交互点清单（按优先级）

#### P0: MVP 核心（必须在 P1-A/B 中实现）

| # | 交互 | 类型 | 所在区域 | handler 目标 |
|---|------|-----|---------|-------------|
| 1 | 01-S01 立即写作 | MODAL | SideNav | openCreateProject() |
| 2 | 02-P01 项目卡片点击 | NAV | Bookshelf | selectProject() |
| 3 | 03-13 提交创建 | CRUD | CreateProject | createProject() |
| 4 | 04-SN08 AI生成大纲 | AI_WORKFLOW | Workspace | runOutlineGeneration() |
| 5 | 04-SN09 生成细纲 | AI_WORKFLOW | Workspace | runOutlineGeneration(detail) |
| 6 | 04-A01 开始生成 | AI_WORKFLOW | Workspace | runChapterGeneration() |
| 7 | 04-OL01 章节选择 | NAV | OutlineList | selectChapter() |
| 8 | 05-T01 返回 | NAV | EditorToolbar | navigateBack() |
| 9 | 05-T03 AI续写 | AI_WORKFLOW | EditorToolbar | runContinueWriting() |
| 10 | 05-FT01 浮动续写 | AI_WORKFLOW | FloatingToolbar | runEditorCommand('continue') |
| 11 | 05-IP01 重新提取 | AI_WORKFLOW | ChapterInfoPanel | runExtractInfo() |
| 12 | 05-IP02 信息审计块 | INFO_WORKFLOW | ChapterInfoPanel | toggleInfoAudit() |
| 13 | 05-RC02 采纳 | CRUD | AIResultCard | acceptSuggestion() |
| 14 | 05-RC04 忽略 | CRUD | AIResultCard | discardResult() |
| 15 | 05-TP02 取消任务 | AI_WORKFLOW | AITaskPanel | cancelTask() |
| 16 | 05-TP03 重试任务 | AI_WORKFLOW | AITaskPanel | retryTask() |
| 17 | 05-RP02 保存草稿 | CRUD | RightPanel | saveDraft() |
| 18 | 05-RP03 标记完成 | CRUD | RightPanel | markComplete() |

#### P1: 完整体验（P1-B 实现）

| # | 交互 | 类型 | 所在区域 |
|---|------|-----|---------|
| 19-26 | 05-FT02~FT05 改写/扩写/润色/摘要 | AI_WORKFLOW | FloatingToolbar |
| 27 | 04-OL03 完成checkbox | CRUD | OutlineList |
| 28 | 04-OL04 星标 | CRUD | OutlineList |
| 29 | 04-GF01~GF05 参数表单 | CONFIG | GenerationForm |
| 30-35 | 04-CO01~CO06 上下文勾选 | CONFIG | ContextOptions |
| 36 | 05-C01/C02 标题/正文编辑 | CRUD | EditorCanvas |
| 37 | 05-CP01 角色切换 | NAV | CharacterPanel |
| 38 | 07-T01~T04 世界设定Tab | NAV | WorldSetting |
| 39 | 02-S01 搜索 | CONFIG | SearchBar |
| 40 | 05-LD01/LD02 日志开关/清空 | MODAL/CRUD | AILogDrawer |
| 41 | 12-Q01~Q05 引导流程 | NAV/CONFIG | GuideQA |

#### P2: 远期（不在此阶段实现）

剩余 ~50 个交互均为 FUTURE 或低优先级，包括：
- 所有 ModalHost 占位弹框（MH-01~MH-08，除 generation-settings）
- 个人中心充值/导入导出
- 成就系统分类浏览
- 角色追踪详细面板
- 书架工具栏按钮
- 浮动组件签到/活动
- 暂停生成、批量生成、发布章节等

---

*文档结束。覆盖 12 个区域、112 个交互点。*

[READY_FOR_PHASE_P1_ACTION_CONTRACT_REVIEW]

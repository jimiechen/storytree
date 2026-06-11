# AI小说创作助手 - 开发计划与阶段划分

> **版本**: v2.0（根据主控评审意见修订）
> **日期**: 2026-06-11
> **基于**: 10个Stitch原型截图 + PRD文档 + 现有novel模块代码库
> **方法论**: STDD（Spec & Test Driven Development）
> **汇报等级**: L3 架构级任务
> **评审来源**: `TabAI会话_1781176909788.md`

---

## 0. 硬性边界（默认禁止修改）

```
❌ 本计划默认不修改以下区域（除非单独提交 L3 任务理解汇报并获得确认）：
   - packages/opencode/
   - packages/sdk/
   - packages/plugin/
   - packages/desktop/
   - packages/ui/
   - 根目录 package.json
   - 根目录 turbo.json
   - 根目录 tsconfig.json
   - 根目录 vite.config.ts

✅ 本计划所有改动限定在：
   - packages/app/src/novel/          （类型、数据、Provider、Hook、组件、工具）
   - packages/app/src/pages/          （路由入口，仅条件渲染或最小路由）
   - .trae/rules/                    （规则文档）
   - stitch/                          （原型文档和计划）
```

---

## 一、资源归属规则（防止 Provider 互相引用混乱）

```text
Project 级资源（归属 NovelProjectProvider 管理）：
  - Project, Chapter, Outline, WorldSetting
  - GenerationConfig, GuideProject
  - Character（角色属于项目内）

User 级资源（归属 UserProfileProvider 管理）：
  - UserProfile, Achievement, PointsRecord
  - SigninState, Activity

AI 级资源（归属已有 AITaskProvider / FakeAgent）：
  - AITask, AILog, AISuggestion
  - AI 任务状态机（pending→running→success/failed/cancelled/denied/quota）

原则：一个资源只归一个 Provider 管。不跨 Provider 引用同级别资源。
BookshelfPage / CreateProjectModal 是 UI 场景，数据统一来自 NovelProjectProvider，
不新增独立 BookshelfProvider。
```

---

## 二、现状盘点

### 2.1 已有资产（Stitch 原型库）

| # | 组件 | 截图 | PRD覆盖 | 代码状态 |
|---|------|------|---------|----------|
| 02 | 我的书架 | ✅ | PRD 3.3 | ❌ 无 |
| 03 | 创建新项目弹窗 | ✅ | PRD 3.4 | ❌ 无 |
| 04 | 小说项目工作台 | ✅ | PRD 四 | ⚠️ MVP版(布局不同) |
| 05 | 章节编辑器 | ✅ | PRD 五 | ⚠️ 基础版(缺AI提取面板) |
| 06 | 角色追踪面板 | ✅ | PRD 六(P1) | ⚠️ 基础版(缺分组/关系图) |
| 07 | 世界设定页面 | ✅ | PRD 七(P1) | ❌ 无 |
| 09 | 个人中心页面 | ✅ | PRD 3.12 | ❌ 无 |
| 10 | AI生成参数设置弹窗 | ✅ | PRD 十 | ❌ 无 |
| 11 | 成就系统页面 | ✅ | PRD 3.11(P1) | ❌ 无 |
| 12 | 25道题引导页 | ✅ | PRD 3.9-3.10 | ❌ 无 |

### 2.2 现有代码库（novel 模块）

```
packages/app/src/novel/
├── types/           → 7个类型文件 (project, chapter, character, ai-task, ai-log, sandbox)
├── mock-data/       → 4个数据文件 + 测试
├── providers/       → 5个Provider + 测试
├── hooks/           → 3个Hook
├── components/      → NovelEditor主组件 + 8个子组件
└── utils/           → mock-delay
```

### 2.3 关键问题（必须优先解决）

**问题A — 数据流违规**: `NovelEditor` 直接 import 并修改 `mockChapters`
- [index.tsx:12](file:///c:\projects\storytree\caiode\opencode-1.4.0\packages\app\src\novel\components\novel-editor\index.tsx#L12)
- [index.tsx:27-32](file:///c:\projects\storytree\caicode\opencode-1.4.0\packages\app\src\novel\components\novel-editor\index.tsx#L27-L32)
- [index.tsx:60-66](file:///c:\projects\storytree\caicode\opencode-1.4.0\packages\app\src\novel\components\novel-editor\index.tsx#L60-L66)

**问题B — 类型缺失**: WorldSetting, Achievement, UserProfile, GuideQuestion 等完全不存在

**问题C — Provider 能力不足**: 缺多项目管理、世界设定、成就、引导等 Provider

---

## 三、开发阶段总览（修订后）

```
Phase 0:   基础重构（数据流修正）          ← 第1步执行
Phase 0.5: 项目规则与骨架约束            ← 第2步执行（新增）
Phase 1:   核心页面                      ← 第3~7步执行
  1.1     我的书架（复用 NovelProjectProvider）
  1.2     创建新项目弹窗
  1.3a    Workspace 壳层（三栏布局+状态容器）
  1.3b    Outline Provider + Hook（大纲/细纲数据流）
  1.3c    Editor 嵌入与生成面板接入
Phase 2:   编辑器增强                     ← 第8步
Phase 3:   内容管理(P1)                  ← 并行可选
Phase 4:   用户系统                       ← 并行可选
Phase 5:   AI能力闭环                     ← 第9步
Phase 6:   辅助工具(P2)                   ← 独立并行
Phase 7:   首页与认证                     ← 独立并行
```

---

## 四、各阶段详细规划

### Phase 0: 基础重构（数据流修正）

**目标**: 消除 UI 对 mock-data 的直接依赖，建立正确的分层边界

**STDD Spec**:
- 用户在小说工作台中保存章节时，通过 Hook 调用 Provider，UI 不直接修改数据源
- 所有章节操作（列表、选择、保存、状态切换）统一走 Hook
- Mock 模式保持可运行，行为不变
- AI 结果接受流程明确：AITask success → AIResultCard 展示 → 用户保存为建议(addAISuggestion) → 用户接受(acceptSuggestion) → 正文追加

**不做范围**: 不新增页面、不修改视觉样式、不改类型定义

**涉及文件**:
| 文件 | 操作 | 说明 |
|------|------|------|
| `hooks/use-novel-chapters.ts` | **新增** | 封装章节数据流的核心 Hook |
| `components/novel-editor/index.tsx` | **修改** | 移除 mockChapters import，改用 Hook |
| `providers/novel-chapter.ts` | **修改** | 增强 refetch 方法 |
| `hooks/use-novel-chapters.test.ts` | **新增** | Hook 测试 |

**验收标准（可检查项）**:

| # | 验收项 | 检查方式 |
|---|--------|----------|
| 1 | `grep -r "mockChapters" components/` 返回空 | 命令 |
| 2 | `grep -r "mockCharacters" components/` 返回空 | 命令 |
| 3 | components 目录不得出现 `import.*mock-data` 或 `import.*../../mock-data` | grep |
| 4 | Hook 不直接暴露 mock 数据引用（返回值均为 Provider 方法调用结果） | 代码审查 |
| 5 | Provider 返回副本，外部修改不会污染内部状态 | 测试：获取对象后修改属性，再次获取验证未被污染 |
| 6 | 保存正文后 wordCount 通过 Provider 更新 | 测试 |
| 7 | 接受 AI 结果流程：先 addAISuggestion 再 acceptSuggestion，不能跳过 | 测试 |
| 8 | useNovelChapters 覆盖 loading / error / empty 三种状态 | 测试 |
| 9 | `cd packages/app && bun test` 全部通过 | 命令 |
| 10 | `cd packages/app && bun typecheck` 无错误 | 命令 |

**三层测试验收**:

```
Provider 验收:
  ✓ listChapters 返回排序后的副本
  ✓ getChapter 找不到返回 null（NOT_FOUND 场景）
  ✓ saveChapter 更新 content + wordCount + status(draft→revising)
  ✓ acceptSuggestion 追加文本到正文

Hook 验收:
  ✓ 初始加载返回 chapters 列表（loading → data）
  ✓ selectChapter 切换当前章节
  ✓ saveChapter 后 refresh 自动更新列表
  ✓ 错误场景暴露 error signal

UI 验收:
  ✓ ChapterList 通过 Hook 获取数据（非 mock-data）
  ✓ ChapterEditor onSave 触发 Hook.saveChapter
  ✓ AIResultCard onAccept 触发 Hook.acceptSuggestion
  ✓ 空章节选中时显示占位提示
```

**预估复杂度**: 中等

---

### Phase 0.5: 项目规则与骨架约束（新增）

**目标**: 固化边界、契约、路由模型，让后续 Phase 1~7 有稳定地基

**STDD Spec**:
- OpenCode 底座保护边界以代码形式固化
- novel 业务模块目录规则确认
- 最小页面状态/路由模型定义（不再用散落的条件渲染）
- Provider 统一接口契约和错误格式
- 测试命令与 Trae 汇报模板集成

**不做范围**: 不新增业务页面、不改视觉样式、不接真实 API

**涉及文件**:
| 文件 | 操作 | 说明 |
|------|------|------|
| `types/novel-view.ts` | **新增** | NovelView 状态机类型 |
| `types/provider-error.ts` | **新增** | 统一 ProviderError 类型定义 |
| `providers/index.ts` | **修改** | 补充 ProviderRegistry 或统一导出契约 |
| `hooks/use-novel-view.ts` | **新增** | 页面视图切换 Hook |
| `components/novel-shell.tsx` | **新增** | 应用壳层组件（含视图路由容器） |

**新增类型定义**:

```ts
// 页面/视图状态机（替代散落条件渲染）
type NovelView =
  | "bookshelf"       // 我的书架
  | "create-project"  // 创建新项目
  | "workspace"       // 小说工作台
  | "editor"          // 章节编辑（workspace 内的子视图）
  | "guide"           // 25道题引导
  | "profile"         // 个人中心
  | "achievement"      // 成就系统
  | "name-generator"  // 名字生成器
  | "book-analysis"   // 拆书分析
  | "tutorial"        // 新手教程
  | "landing";         // 首页落地页

// 统一 ProviderError（所有 Provider 共用）
type ProviderErrorCode =
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "DENIED"
  | "QUOTA"
  | "CONFLICT"
  | "UNAUTHORIZED";

interface ProviderError {
  code: ProviderErrorCode;
  message: string;
  details?: unknown;
}
```

**验收标准（可检查项）**:

| # | 验收项 |
|---|--------|
| 1 | NovelView 类型定义完整，覆盖所有已知页面 |
| 2 | useNovelView Hook 可切换视图，切换时旧视图卸载 |
| 3 | NovelShell 组件根据 currentView 渲染对应页面组件 |
| 4 | ProviderError 在所有 Provider 中统一使用同一类型定义 |
| 5 | providers/index.ts 导出统一的 Provider 接口契约 |
| 6 | `cd packages/app && bun typecheck` 无错误 |
| 7 | `cd packages/app && bun test` 全部通过（含新增测试） |

**三层测试验收**:

```
Provider 验收:
  ✓ ProviderError 类型被至少 2 个 Provider 导入使用
  ✓ Provider 返回副本行为一致

Hook 验收:
  ✓ useNovelView 初始值为 "bookshelf"
  ✓ setView("workspace") 后 currentView() === "workspace"
  ✓ setView 不可设置为未定义值

UI 验收:
  ✓ NovelShell 根据 view 渲染正确子组件
  ✓ 视图切换无闪烁、无残留旧状态
```

**预估复杂度**: 低（纯骨架和约定，不含复杂业务）

---

### Phase 1: 核心页面（项目管理）

#### 1.1 我的书架页面 (`02_我的书架`)

**对应原型**: [02_我的书架/prd.md](../stitch/stitch_ai_novel_writing_dashboard/02_我的书架/prd.md)

**STDD Spec**:
- 用户看到项目卡片网格
- 用户可以搜索小说（按书名模糊匹配）
- 用户点击创建按钮触发操作
- 空状态显示引导文案和三个创建按钮
- 右下角显示签到、成就、活动浮动组件

**关键决策**: **不新增 BookshelfProvider**。书架的数据来自增强后的 NovelProjectProvider。

**涉及文件**:
| 文件 | 操作 | 说明 |
|------|------|------|
| `types/bookshelf.ts` | **新增** | BookshelfFilter, SigninState, Activity（UI 场景类型，非独立领域模型） |
| `mock-data/projects.ts` | **修改** | 扩展为多项目种子数据 |
| `providers/novel-project.ts` | **修改** | 增强：listProjects, searchProjects, createQuickProject, getSigninState |
| `hooks/use-novel-project.ts` | **修改** | 增加搜索、多项目列表支持 |
| `components/bookshelf/` | **新增** | BookshelfPage, ProjectGrid, ProjectCard, SearchBar, Toolbar, FloatingWidgets |

**视觉验收（可检查条目）**:
- [ ] 桌面端为项目卡片网格，最小 3 列，宽屏可扩展
- [ ] 项目卡片包含：封面占位(渐变色)、书名、类型标签、章节数(`共X章`)、字数(`共X,X00字`)、最后编辑时间
- [ ] 顶部有全宽搜索框（placeholder: "搜索小说..."），右侧帮助图标
- [ ] 工具栏行包含彩色图标按钮（更新/教程/名字生成/拆书分析/作者 等）
- [ ] 主创建区有三个按钮："简易创作 推荐"(紫粉渐变) / "创建新项目" / "25道题引导"
- [ ] 空状态居中显示书本图标 + "书架空空如也" + 三个创建按钮
- [ ] 右下角浮动组件：签到(火焰图标+天数) / 成就(X/98) / 活动(礼物图标)
- [ ] 移动端卡片单列，文字不溢出

**三层测试验收**:

```
Provider 验收:
  ✓ listProjects 返回多项目数组，按 lastUpdated 降序
  ✓ searchProjects("关键词") 过滤 name 包含关键词的项目
  ✓ searchProjects("") 返回全部（空搜索 = 全量）
  ✓ createQuickProject 返回新 Project（含默认 genre/description）
  ✓ getSigninState 返回今日签到状态

Hook 验收:
  ✓ 初始加载 projects 列表（loading → data）
  ✓ search keyword 变更后自动重新查询
  ✓ createProject 成功后自动刷新列表
  ✓ 空项目列表时显示 empty 状态

UI 验收:
  ✓ 卡片网格渲染正确数量
  ✓ 搜索输入后列表实时过滤
  ✓ 空状态在 0 个项目时显示
  ✓ 点击"创建新项目"触发 setView("create-project")
  ✓ 点击"25道题引导"触发 setView("guide")
  ✓ 点击项目卡片触发 setView("workspace") + 选中的 projectId
  ✓ 浮动组件（签到/成就/活动）可见且可交互
```

#### 1.2 创建新项目弹窗 (`03_创建新项目弹窗`)

**对应原型**: [03_创建新项目弹窗/prd.md](../stitch/stitch_ai_novel_writing_dashboard/03_创建新项目弹窗/prd.md)

**STDD Spec**:
- 点击"创建新项目"弹出模态框
- Tab 切换：基本信息 / 主角设定 / 世界观 / 剧情总纲 / 自定义设定
- 基本信息 Tab：书名*(必填)、类型*(必填)、简介、目标读者、写作风格、故事主题
- 底部按钮：取消 / 下一步(或创建)
- 表单验证：必填项未填时禁用提交

**涉及文件**:
| 文件 | 操作 |
|------|------|
| `components/create-project-modal/` | **新增**: CreateProjectModal, BasicInfoTab, ProtagonistTab, WorldTab, PlotTab, CustomTab |

**视觉验收（可检查条目）**:
- [ ] 白色模态框居中，圆角 8-12px，带半透明遮罩
- [ ] 标题栏："创建新项目" + 关闭按钮(×)
- [ ] Tab 栏水平排列，当前 Tab 高亮
- [ ] 基本信息 Tab：书名 input(必填*) + 类型 dropdown(必填*) + 简介 textarea
- [ ] 目标读者 dropdown：大众/男频/女频
- [ ] 写作风格 dropdown：默认/诙谐幽默/.../自定义（11+1选项）
- [ ] 故事主题 dropdown：默认/复仇/成长/.../自定义（12+1选项）
- [ ] 底部：取消(灰色描边) + 创建(紫粉渐变，未填完必填项时 disabled)
- [ ] 关闭遮罩或关闭按钮可关闭弹窗

**三层测试验收**:

```
Provider 验收:
  ✓ createProject 接受 { name, genre, description, targetReader, writingStyle, theme }
  ✓ name 为空时抛 INVALID_INPUT
  ✓ genre 为空时抛 INVALID_INPUT
  ✓ 创建成功返回含 id 的新 Project 对象

Hook 验收:
  ✓ openCreateModal 设置 modalVisible = true
  ✓ submitCreate 调用 Provider.createProject
  ✓ 创建成功后回调 onSuccess（由父组件决定跳转）
  ✓ 取消时 closeModal

UI 验收:
  ✓ 弹窗打开/关闭动画正常
  ✓ Tab 切换内容区正确
  ✓ 必填项未填时"创建"按钮 disabled
  ✓ 必填项填写后"创建"按钮 enabled
  ✓ 点击关闭/遮罩/取消均可关闭
```

#### 1.3a: Workspace 壳层 (`04_小说项目工作台` — 第一部分)

**目标**: 只建立三栏布局和状态容器，不迁移复杂业务逻辑

**STDD Spec**:
- Workspace 替代 NovelEditor 作为工作台入口
- 三栏布局：左侧面板区 | 中间内容区 | 右侧面板区
- 左侧默认展示章节列表（复用现有 ChapterList）
- 中间默认展示章节编辑器（复用现有 ChapterEditor）
- 右侧默认折叠（可通过按钮切换显示角色/AI面板）
- 顶部工具栏显示项目名称 + 字数统计 + 面板开关按钮

**这是对现有 NovelEditor 的渐进改造，不是重写**：
- 保留 ChapterList / ChapterEditor / CharacterPanel / AITaskPanel 等现有组件
- 只是改变它们的布局容器和状态来源

**涉及文件**:
| 文件 | 操作 | 说明 |
|------|------|------|
| `components/novel-workspace/` | **新增** | Workspace 主壳层组件 |
| `components/novel-workspace/index.tsx` | **新增** | 三栏布局 + 面板插槽 |
| `components/novel-workspace/workspace-header.tsx` | **新增** | 顶部工具栏 |
| `components/novel-editor/index.tsx` | **修改** | 改为被 Workspace 内嵌调用，或标记为 deprecated |

**视觉验收（可检查条目）**:
- [ ] 三栏布局：左侧 ~256px 固定宽 | 中间 flex-1 | 右侧 ~300px 可切换
- [ ] 顶部 Header：左侧项目名+类型+字数 | 右侧面板开关按钮组
- [ ] 左侧面板：ChapterList 正常渲染（来自 Hook 数据）
- [ ] 中间面板：ChapterEditor 正常渲染（来自 Hook 数据）
- [ ] 右侧面板：默认隐藏，点击"角色面板"/"AI任务"按钮切换显示
- [ ] 面板切换按钮有激活态样式（bg-indigo-100 text-indigo-700）
- [ ] 整体背景 bg-gray-100

**三层测试验收**:

```
Provider 验收:
  ✓（本阶段无新 Provider 方法，复用已有的）

Hook 验收:
  ✓ Workspace 接收 projectId prop
  ✓ 内部调用 useNovelChapters 获取章节列表
  ✓ 内部调用 useNovelProject 获取项目信息
  ✓ 面板显隐状态通过 local signal 管理

UI 验收:
  ✓ 三栏布局比例正确
  ✓ Header 显示正确的项目名和字数
  ✓ 左侧 ChapterList 显示该项目的章节
  ✓ 中间 ChapterEditor 显示选中章节内容
  ✓ 右侧面板开关按钮控制显隐
  ✓ 现有保存/编辑功能不受影响（行为不变）
```

#### 1.3b: Outline Provider + Hook (`04_小说项目工作台` — 第二部分)

**目标**: 实现大纲/细纲/章节三种视图切换的数据流

**STDD Spec**:
- 左侧面板增加视图切换器：大纲 / 细纲 / 章节
- 大纲视图：显示章节点（第X章 标题），可展开查看细纲
- 细纲视图：显示每章的目标/冲突/关键情节
- 章节视图：保持原有 ChapterList 行为
- 切换视图时不丢失当前选中的章节

**涉及文件**:
| 文件 | 操作 | 说明 |
|------|------|------|
| `types/outline.ts` | **新增** | OutlineNode, OutlineType, DetailOutline |
| `mock-data/outlines.ts` | **新增** | 大纲/细纲种子数据 |
| `providers/novel-outline.ts` | **新增** | listOutlines, getOutline, generateOutline |
| `hooks/use-novel-outline.ts` | **新增** | 大纲数据流 Hook |
| `components/novel-workspace/outline-sidebar.tsx` | **新增** | 左侧大纲面板（替代/增强 ChapterList） |

**三层测试验收**:

```
Provider 验收:
  ✓ listOutlines(projectId) 返回 OutlineNode 数组，按 orderIndex 排序
  ✓ getOutline(chapterId) 返回该章 DetailOutline
  ✓ getOutline(不存在id) 返回 null
  ✓ generateOutline(projectId) 生成/刷新大纲（Mock 返回预设数据）

Hook 验收:
  ✓ 切换 viewMode("outline"|"detail"|"chapter")
  ✓ outline 数据随 projectId 加载
  ✓ detail 数据随 chapterId 切换
  ✓ 切换回 chapter 视图时 selectedChapterId 保持不变

UI 验收:
  ✓ 左侧显示三种视图切换 tabs
  ✓ 大纲视图：章节点列表，可展开
  ✓ 细纲视图：每章的目标/冲突/关键情节文本
  ✓ 章节视图：原有 ChapterList 行为
  ✓ 视图切换流畅，无状态丢失
```

#### 1.3c: Editor 嵌入与生成面板接入 (`04_小说项目工作台` — 第三部分)

**目标**: 将 AI 生成设置面板接入 Workspace 右侧

**STDD Spec**:
- 右侧面板增加"AI 生成设置"视图（与角色面板并列）
- 生成设置包含：目标字数滑块、字数容差、参考章节数下拉、AI模型选择
- 上下文参考复选框组：大纲和细纲(必选禁用)/已有正文摘要/主角状态追踪/角色关系/技能道具/重要事件
- "开始生成"（紫粉渐变主按钮）和"批量生成"（描边次按钮）
- 点击"开始生成"触发 AI 任务（走 AITask 协议）

**涉及文件**:
| 文件 | 操作 | 说明 |
|------|------|------|
| `types/generation-config.ts` | **新增** | GenerationConfig, ContextReference |
| `components/novel-workspace/generation-settings.tsx` | **新增** | 右侧生成设置面板 |
| `components/novel-workspace/index.tsx` | **修改** | 接入生成面板 |

**三层测试验收**:

```
Provider 验收:
  ✓（复用已有 FakeAgentProvider 和 AITaskProvider）

Hook 验收:
  ✓ generation config 可读取/修改（local state 或传入参数）
  ✓ submitGeneration 调用 useAITask.submitTask
  ✓ 上下文参考选项可勾选/取消

UI 验收:
  ✓ 右侧面板可在"角色面板"和"AI生成设置"间切换
  ✓ 目标字数滑块可拖动（300-10000）
  ✓ 模型下拉可选择
  ✓ 复选框组可交互
  ✓ "开始生成"按钮点击后创建 AITask
  ✓ 生成中显示进度指示
```

---

### Phase 2: 编辑器增强

#### 2.1 章节编辑器增强 (`05_章节编辑器页面`)

**对应原型**: [05_章节编辑器页面/prd.md](../stitch/stitch_ai_novel_writing_dashboard/05_章节编辑器页面/prd.md)

**视觉验收（可检查条目）**:
- [ ] 顶部工具栏：← 返回箭标 + "第X章 XXXXX" + "共 X,XXX 字"
- [ ] 工具栏右侧按钮：历史版本(v) | 备注 | AI续写 | 保存(Ctrl+S)
- [ ] 主区域为富文本编辑区（大文本域，舒适行高）
- [ ] 右侧信息面板（~280px）：章节状态徽章 | 创建时间 | 最后修改时间
- [ ] AI 提取信息区：章节摘要 | 新角色(链接) | 主角状态(位置/实力/情绪) | 获得道具 | 重要事件
- [ ] "重新提取信息"按钮（小型描边）

**三层测试验收**:（每个 Phase 都必须包含此结构，后续 Phase 简写为要点）

```
Provider: 正常/空/NOT_FOUND + 返回副本
Hook:   加载/刷新/mutation/error 暴露
UI:     操作路径/空状态/loading/禁用态
```

#### 2.2 角色追踪面板升级 (`06_角色追踪面板`)

**对应原型**: [06_角色追踪面板/prd.md](../stitch/stitch_ai_novel_writing_dashboard/06_角色追踪面板/prd.md)

**视觉验收（可检查条目）**:
- [ ] 分组标题行：主角(1) | 配角(N) | 反派(M) | 其他(可折叠箭头)
- [ ] 角色卡：圆形头像(首字母+紫色) + 姓名 + 类型徽章 + 描述一行 + "首次出场: 第X章"
- [ ] 主角卡额外区域：状态追踪器（位置/实力等级/情绪/已获技能/已获道具）
- [ ] 底部："添加角色"按钮（紫色，+ 图标）
- [ ] 底部区域：人物关系简化图（节点+连线+标签）

---

### Phase 3: 内容管理（P1 优先级）

#### 3.1 世界设定页面 (`07_世界设定页面`)

**对应原型**: [07_世界设定页面/prd.md](../stitch/stitch_ai_novel_writing_dashboard/07_世界设定页面/prd.md)

**视觉验收（可检查条目）**:
- [ ] 顶部："世界设定" + 副标题 + "AI生成设定"按钮
- [ ] 世界概览卡：四格信息（背景/力量体系/社会结构/特殊规则）
- [ ] Tab 栏：地点 | 物品 | 技能 | 势力
- [ ] 每个 Tab 内为卡片网格（2-3列）
- [ ] 地点卡：名称 + 类型标签(城镇/秘境/学府) + 描述 + 编辑/删除悬停
- [ ] 底部提示："💡 设定越详细，生成内容越符合你的想法"

---

### Phase 4: 用户系统

#### 4.1 个人中心 (`09_个人中心页面`) + 积分

**视觉验收（可检查条目）**:
- [ ] 头像大圆（用户首字母）+ 用户名 + VIP 金色徽章 + 到期时间
- [ ] 统计三卡片：创作字数 / 小说数量 / 章节数量
- [ ] Tab 栏：积分 | 充值 | 导出 | 导入
- [ ] 积分 Tab：大号紫色积分数字 + 变动记录表（变动/事由/日期）
- [ ] 充值 Tab：VIP特权说明 + 4档套餐(体验/标准/超值/年度) + 各有"立即充值"

#### 4.2 成就系统 (`11_成就系统页面`)

**视觉验收（可检查条目）**:
- [ ] 进度条："12/98 已解锁" + 百分比
- [ ] 分类 pills：全部(98) | 已解锁(12) | 未解锁(86) | 创作 | 社交 | 成长 | 特殊
- [ ] 成就网格 3 列：
  - 已解锁：彩色卡片（图标+名称+描述+"2026-05-20 解锁"）
  - 未锁定：灰色卡片（锁图标+名称+描述）

---

### Phase 5: AI 能力闭环

#### 5.1 AI 生成参数设置弹窗 (`10_AI生成参数设置弹窗`)

**视觉验收（可检查条目）**:
- [ ] Modal 标题："生成设置" + 副标题 + 关闭按钮
- [ ] Section1 基础设置：生成数量(10, range 5-20) | 目标字数(3000, slider) | 字数容差(±300) | AI模型(豆包 dropdown)
- [ ] Section2 上下文参考：2列复选框网格（大纲和细纲✓禁用/已有正文摘要☐/主角状态追踪☐/...）
- [ ] Section3 包含设定（可折叠）：角色设定☐/技能法宝☐/物品地点☐/...
- [ ] 底部：恢复默认(左) | 取消(中) | 开始生成(右, 紫粉渐变)

#### 5.2 25道题引导 (`12_25道题引导页`)

**视觉验收（可检查条目）**:
- [ ] 引导首页：✨25道题创建引导 + 新建按钮 + 如何使用? + 空状态
- [ ] 新建表单：书名 input* + 类型 dropdown* + 目标字数 dropdown
- [ ] 问答页：进度条 "1/25" + Q1 徽章 + 问题文本 + 2x3 选项卡片网格
- [ ] 底部：上一步(disabled at Q1) | 下一步(紫粉渐变) | 跳过引导

---

### Phase 6: 辅助工具（P2 优先级，可独立并行）

| # | 页面 | 视觉验收要点 |
|---|------|-------------|
| 1 | 名字生成器 | 性别♂♀/通用 tab + 风格按钮(简约/古风/玄幻/现代/酷炫/可爱) + 长度滑块 + 生成按钮 |
| 2 | AI拆书工作室 | 标题 + 返回按钮 + 上传区域(虚线框+选择文件) |
| 3 | 新手教程 | 返回 + 标题 + 分类按钮(🚀快速开始/📖核心/⚡进阶/💰积分/❓FAQ/📞帮助/视频) |

---

### Phase 7: 首页与认证（可独立并行）

| # | 页面 | 视觉验收要点 |
|---|------|-------------|
| 1 | 首页/落地页 | 深紫渐变背景+星光粒子 | 主标题"释放你的创作想象力" | CTA"开始创作"(紫粉渐变大按钮) | 功能标签4个(智能续写/角色追踪/批量生成/封面生成) | 备案信息 |
| 2 | 登录/注册 | Modal | 标题"AI 小说创作助手" | Tab:登录/注册 | 用户名+密码 | 注册额外邮箱 | 法律链接3个 | 登录/注册按钮 |
| 3 | 路由整合 | 将所有页面接入 NovelView 状态机 + NovelShell 路由容器 |

---

## 五、修订后的依赖关系图

```
Phase 0 (数据流重构)
  │
  ├──→ Phase 0.5 (骨架约束) ← 新增！定义路由/视图/Provider契约
  │       │
  │       └──→ Phase 1.1 (我的书架) ← 复用 NovelProjectProvider（不新增 BookshelfProvider）
  │               │
  │               ├──→ Phase 1.2 (创建项目弹窗) ← 由书架触发
  │               │       │
  │               │       └──→ Phase 1.3a (Workspace 壳层) ← 只建布局容器
  │               │               │
  │               │               ├──→ Phase 1.3b (Outline 数据流) ← 大纲/细纲/章节切换
  │               │               │       │
  │               │               │       └──→ Phase 1.3c (Editor/AI 接入) ← 生成面板
  │               │               │
  │               │               ├──→ Phase 2.1 (编辑器增强)
  │               │               │       └──→ Phase 5.1 (AI生成设置)
  │               │               │
  │               │               └──→ Phase 2.2 (角色追踪升级)
  │               │                       │
  │               │                       └──→ Phase 3.1 (世界设定)
  │               │
  │               └──→ Phase 4.1 (个人中心)
  │                           │
  │                           └──→ Phase 4.2 (成就系统)
  │
  ├──→ Phase 6 (辅助工具) ← 独立并行
  │
  └──→ Phase 7 (首页+认证) ← 独立并行
```

**可并行组合**:
- **核心闭环**: Phase 0 → 0.5 → 1.1 → 1.2 → 1.3a → 1.3b → 1.3c（MVP 完成）
- **增强闭环**: → Phase 2 → Phase 5
- **扩展**: Phase 3 / 4 / 6 / 7 可随时插入

---

## 六、每个阶段的 STDD 交付清单（通用模板）

每个 Phase 完成后必须逐项确认：

```text
□ Spec: 本计划的对应章节作为 Spec，用户目标/输入/输出/状态变化/成功/失败/验收齐全
□ Types: 新增类型文件已创建并加入 types/index.ts 导出；无 any
□ Mock Data: 种子数据已补充；覆盖正常/空/异常边界
□ Provider: 实现 + async + 返回副本 + 抛统一 ProviderError + mockDelay
□ Provider 测试:
    □ 正常路径（list/get/save/update）
    □ 空数据（返回 [] 或 null）
    □ NOT_FOUND / INVALID_INPUT 错误路径
    □ 返回副本验证（外部修改不污染内部状态）
□ Hook: 实现 + loading/error/empty 状态覆盖 + mutation 后自动刷新
□ Hook 测试:
    □ 初始加载
    □ 刷新/refetch
    □ mutation 后状态更新
    □ error 暴露给 UI
□ UI: 组件实现 + 只消费 Hook（不 import mock-data）
□ UI 测试:
    □ 用户操作路径（主流程走通）
    □ 空状态正确显示
    □ loading 状态正确显示
    □ 禁用态/错误态正确显示
□ 视觉验收: 对照 prd.md 中的可检查条目逐项确认
□ 集成测试: Types → Mock → Provider → Hook → UI 全链路跑通
□ cd packages/app && bun typecheck → 无错误
□ cd packages/app && bun test → 全部通过
□ grep -r "mock-data" components/ → 空（Phase 0 及以后持续满足）
```

---

## 七、风险与阻塞（修订后）

| 风险 | 影响 | 缓解措施 | 状态 |
|------|------|----------|------|
| Phase 0 重构破坏现有功能 | 高 | 先跑通现有测试再动；增量迁移 | ⚠️ 监控中 |
| Phase 1.3 拆为 a/b/c 后单步风险可控 | 低 | 每个子步骤独立可验证 | ✅ 已缓解 |
| Provider 命名分裂 | 中 | 已统一为 NovelProjectProvider，不新增 BookshelfProvider | ✅ 已修复 |
| 路由/视图状态缺失导致页面跳转混乱 | 中 | Phase 0.5 定义 NovelView 状态机 + NovelShell | ✅ 已修复 |
| 类型膨胀过快 | 中 | 按 Phase 逐步添加 | ⚠️ 监控中 |
| SolidJS 组件库生态有限 | 中 | Tailwind 手写为主 | ⚠️ 接受 |
| "视觉一致"不可执行 | 低 | 已改为可检查条目 | ✅ 已修复 |
| Trae 越界修改底座 | 高 | 文档开头硬边界 + 每次任务理解汇报检查 | ✅ 已加固 |

---

## 八、建议启动顺序（修订后）

```
第 1 步: Phase 0（数据流重构）     — 消除 mock-data 直接依赖
第 2 步: Phase 0.5（骨架约束）     — 路由/视图/Provider契约/统一错误
第 3 步: Phase 1.1（我的书架）     — 复用 NovelProjectProvider
第 4 步: Phase 1.2（创建项目弹窗）— 接 ProjectProvider.createProject
第 5 步: Phase 1.3a（Workspace壳）— 三栏布局容器
第 6 步: Phase 1.3b（Outline数据）— 大纲/细纲/章节切换
第 7 步: Phase 1.3c（Editor/AI）  — 生成面板接入
第 8 步: Phase 2（编辑器增强+角色）— 写作体验提升
```

**前 5 步构成最小可用产品(MVP)**: 进入应用 → 书架 → 创建项目 → Workspace 壳层。

**前 7 步构成完整写作闭环**: ... → 大纲/细纲 → 编辑器 → AI 生成。

---

## 九、修订记录

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| v1.0 | 2026-06-11 | 初版，基于 Stitch 原型 + PRD + 现有代码制定 |
| v2.0 | 2026-06-11 | 根据主控评审意见（`TabAI会话_1781176909788.md`）全面修订：

**v2.0 修复清单（8项全部落地）**:

| # | 评审意见 | 修复方式 |
|---|----------|----------|
| 1 | Phase 1.3 风险过大 | ✅ 拆为 1.3a(壳层) / 1.3b(Outline) / 1.3c(Editor+AI) |
| 2 | Provider 命名分裂风险 | ✅ 取消 BookshelfProvider，统一归 NovelProjectProvider |
| 3 | Phase 0 验收不完整 | ✅ 从 6 项扩充至 10 项（含 import 禁止/副本验证/Loading-Hook/AI流程） |
| 4 | 测试粒度偏笼统 | ✅ 每个阶段强制三层验收（Provider 4项 + Hook 4项 + UI 4项） |
| 5 | 路由太晚 | ✅ 新增 Phase 0.5（NovelView 状态机 + NovelShell + Provider 契约） |
| 6 | "视觉一致"太模糊 | ✅ 每个页面改为可检查条目（具体布局/元素/交互） |
| 7 | 缺少保护边界 | ✅ 文档开头 §0 新增硬性边界清单（9 个禁止修改目录） |
| 8 | 类型缺少聚合设计 | ✅ 新增 §1 资源归属规则（Project级/User级/AI级三级） |

---

*本文档是 Stitch 原型图组件库的开发总计划 v2.0。每个 Phase 开始前应单独输出该 Phase 的任务理解汇报（遵循 reporting-protocol.md）。*

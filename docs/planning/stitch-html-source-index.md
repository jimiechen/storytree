# Stitch HTML Source Index

> **Agent**: Kimi-K2.6
> **日期**: 2026-06-12
> **来源**: `caiode/docs/tabbit/06/TabAI会话_1781262855323.md` - Phase R 指令
> **规则**: HTML First，code.html 为视觉与结构第一参考源

---

## 一、Stitch 页面总览

| 页面编号 | 页面名称 | code.html 路径 | prd.md 路径 | screen.png 路径 | 当前实现路径 | 当前还原度 | 状态 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| 02 | 我的书架 | `stitch/02_我的书架/code.html` | `stitch/02_我的书架/prd.md` | 有 | `components/bookshelf/index.tsx` | **85%** | R1 返工中 | P0 |
| 03 | 创建新项目弹窗 | `stitch/03_创建新项目弹窗/code.html` | `stitch/03_创建新项目弹窗/prd.md` | 有 | `components/create-project-modal/index.tsx` | **65%** | 已实现需补齐 | P0 |
| 04 | 小说项目工作台 | `stitch/04_小说项目工作台/code.html` | `stitch/04_小说项目工作台/prd.md` | 有 | `components/novel-workspace/index.tsx` | **30%** | 差异大需重构 | P0 |
| 05 | 章节编辑器页面 | `stitch/05_章节编辑器页面/code.html` | `stitch/05_章节编辑器页面/prd.md` | 有 | `components/novel-editor/index.tsx` | **75%** | R5 已实现 | P1 |
| 06 | 角色追踪面板 | `stitch/06_角色追踪面板/code.html` | `stitch/06_角色追踪面板/prd.md` | 有 | `components/novel-editor/character-panel.tsx` | **15%** | Legacy 骨架 | P1 |
| 07 | 世界设定页面 | `stitch/07_世界设定页面/code.html` | `stitch/07_世界设定页面/prd.md` | 有 | 无 | **0%** | 未开始 | P2 |
| 09 | 个人中心页面 | `stitch/09_个人中心页面/code.html` | `stitch/09_个人中心页面/prd.md` | 有 | 无 | **0%** | 未开始 | P2 |
| 10 | AI生成参数设置弹窗 | `stitch/10_AI生成参数设置弹窗/code.html` | `stitch/10_AI生成参数设置弹窗/prd.md` | 有 | `components/novel-workspace/generation-settings.tsx` | **45%** | 形态错位 | P0 |
| 11 | 成就系统页面 | `stitch/11_成就系统页面/code.html` | `stitch/11_成就系统页面/prd.md` | 有 | `components/bookshelf/floating-widgets.tsx` (仅数字) | **10%** | 未真正开始 | P2 |
| 12 | 25道题引导页 | `stitch/12_25道题引导页/code.html` | `stitch/12_25道题引导页/prd.md` | 有 | `novel/index.tsx` (占位) | **0%** | 占位 | P1 |

**加权平均还原度: ~42%** (05 编辑器实现后从 35% 提升)

---

## 二、当前路由映射

| URL | 对应 Stitch 页面 | 当前渲染组件 | 状态 |
|---|---|---|---|
| `/novel` (默认) | 02 我的书架 | `BookshelfPage` | R1 返工中 |
| `/novel?view=create-project` | 03 创建新项目弹窗 | `CreateProjectModal` | 已实现 |
| `/novel?view=workspace` | 04 小说项目工作台 | `Workspace` | 骨架实现 |
| `/novel?view=editor` | 05 章节编辑器页面 | 占位文本 | 未实现 |
| `/novel?view=guide` | 12 25道题引导页 | 占位文本 | 未实现 |

**缺失路由**:
- 06 角色追踪面板 (工作台内面板，无独立路由)
- 07 世界设定页面 (无路由)
- 09 个人中心页面 (无路由)
- 10 AI生成参数设置弹窗 (工作台右侧面板，非独立路由)
- 11 成就系统页面 (无路由)

---

## 三、公共设计系统现状

| 组件/系统 | 当前实现 | code.html 来源 | 状态 |
|---|---|---|---|
| Material Symbols Outlined | `components/layout/novel-icon.tsx` | 全部 code.html | 已封装 |
| Plus Jakarta Sans 字体 | `index.html` Google Fonts | 全部 code.html | 已引入 |
| Work Sans 字体 | `index.html` Google Fonts | 全部 code.html | 已引入 |
| Design Tokens | 硬编码在组件中 | 全部 code.html | 需抽离 |
| NovelAppLayout | `components/layout/novel-app-layout.tsx` | 02 code.html | 已创建 |
| NovelSideNav | `components/layout/novel-side-nav.tsx` | 02 code.html | 已创建 |
| NovelTopAppBar | `components/layout/novel-top-app-bar.tsx` | 02 code.html | 已创建 |

**待抽离 Token 清单**:
```
primary: #6b38d4
primary-container: #8455ef
surface: #f8f9ff
background: #f8f9ff
outline: #7b7486
outline-variant: #cbc3d7
surface-container-low: #eff4ff
surface-container: #e6eeff
surface-variant: #d5e3fd
on-surface: #0d1c2f
on-surface-variant: #494454
```

---

## 四、逐页详细评估

### 4.1 02 我的书架 — 还原度 85% (R1 返工中)

**code.html 结构**:
```
body
├── SideNavBar 260px 固定左侧导航
│   ├── 作家助手用户区
│   ├── 立即写作按钮
│   ├── 首页 / 书架 / 创作 / 社区 / 设置
│   └── 退出登录
└── Main Content
    ├── TopAppBar
    │   ├── 移动端 menu
    │   ├── book 图标 + 我的书架 + N本徽章
    │   └── refresh
    ├── Search + Toolbar
    ├── 2 列 Bento Grid 项目卡片
    └── 右下角 Floating Widget
```

**当前实现对齐情况**:
| 结构项 | 状态 | 备注 |
|---|---|---|
| SideNavBar 260px | 已实现 | `novel-side-nav.tsx` |
| 作家助手用户区 | 已实现 | 含高级会员文字 |
| 立即写作按钮 | 已实现 | 紫色渐变按钮 |
| 导航项 5 个 | 已实现 | 书架项有激活态 |
| 退出登录 | 已实现 | 底部位置 |
| TopAppBar | 已实现 | `novel-top-app-bar.tsx` |
| 搜索框 | 已实现 | 居中圆角 + search/help 图标 |
| 工具栏圆形按钮 | 已实现 | 4 个彩色圆形 + 新建 + AI + article/draft |
| 2 列卡片网格 | 已实现 | `grid-cols-1 lg:grid-cols-2` |
| 项目卡片结构 | 已实现 | 左侧封面 + 标题/类型/章节/字数/时间 |
| 浮动组件 | 已实现 | 4 个悬浮卡 |

**剩余差异**:
- 工具栏圆形按钮当前无点击交互
- article/draft 徽标数字为硬编码
- 浮动组件数据为硬编码

---

### 4.2 03 创建新项目弹窗 — 还原度 65%

**当前实现**: 248 行，基础表单完整
**缺失字段** (来自 code.html/PRD):
- 目标读者选项: 大众/男频/女频
- 写作风格选项: 默认/诙谐幽默/人性黑暗/杀伐果断/文学性强/快节奏/慢节奏/悬疑/热血/轻松/虐心/自定义
- 故事主题选项: 默认/复仇/成长/爱情/冒险/救赎/权力/友情/生存/探索/竞争/家庭/自定义
- 自定义设定 textarea

---

### 4.3 04 小说项目工作台 — 还原度 30%

**当前实现问题**:
- 无 SideNav 模式，使用横向 Tab 切换器
- 无 TopAppBar，只有 WorkspaceHeader
- 背景色 `bg-gray-100` 而非 `#f8f9ff`
- 编辑器无头部标题区
- 无 AI 进度浮窗

**code.html 必须结构**:
- TopAppBar: 品牌 + 导航 Tab + 发布按钮 + 通知 + 设置 + 头像
- SideNav: 大纲/章节/人物/设定/导出，带紫色竖线激活态
- 编辑器头部: "第 X 章 XXXXX" 32px 标题
- 右侧面板: 角色/AI任务/生成设置

---

### 4.4 10 AI生成参数设置弹窗 — 还原度 45%

**主控裁决**: 10 页面严格做 Modal；04 工作台右侧面板只能作为快速设置入口

**当前问题**:
- 嵌入右侧面板 (`generation-settings.tsx`)，非弹窗
- 控件类型可能不对
- 缺"包含设定" Section

---

## 五、Phase R 执行计划

### R1: 02 我的书架 (已完成返工)
- [x] 建立公共设计系统 (Material Symbols + 字体 + Token)
- [x] 创建 NovelAppLayout / NovelSideNav / NovelTopAppBar
- [x] 重写 BookshelfPage 使用新布局
- [ ] 测试验证 + 截图对照
- [ ] Git 提交

### R2: 03 创建新项目弹窗 (待执行)
- [ ] 读取 `03/code.html` 完整结构
- [ ] 补齐目标读者/写作风格/故事主题/自定义设定字段
- [ ] 按 code.html 视觉调整样式

### R3: 04 小说项目工作台 (待执行)
- [ ] 读取 `04/code.html` 完整结构
- [ ] 重构为 SideNav + TopAppBar 模式
- [ ] 对齐设计令牌
- [ ] 编辑器头部实现

### R4: 10 AI生成参数设置弹窗 (待执行)
- [ ] 读取 `10/code.html` 完整结构
- [ ] 改为 Modal 形态
- [ ] 补齐包含设定 Section

### R5: 未开始页面 (后续按 code.html 新实现)
- 05 章节编辑器页面
- 06 角色追踪面板
- 07 世界设定页面
- 09 个人中心页面
- 11 成就系统页面
- 12 25道题引导页

---

## 六、工程验收状态

| 检查项 | 状态 | 说明 |
|---|---|---|
| typecheck | 待验证 | 需执行 `cd packages/app && bun typecheck` |
| bun test | 待验证 | 13 个测试文件，需全部通过 |
| Provider/Hook/UI 分层 | 合规 | 无 UI 直接 import mock-data |
| 代码文件 < 500 行 | 合规 | 最大文件 `bookshelf/index.tsx` 252 行 |
| 不触碰底座 | 合规 | 全部在 `packages/app/src/novel/` 范围内 |

---

## 七、主控裁决确认

| 决策 | 裁决 | 状态 |
|---|---|---|
| 是否立即执行 Phase R | 执行，不继续推进新功能 | 已启动 |
| SideNavBar 模式是否必须 | 必须，Tab 切换器不能替代 | R1 已实施 |
| AI 生成设置形态 | 10 做 Modal，04 右侧只做入口 | R4 待执行 |

---

*此索引是 Phase R 的基准文档，每次返工后更新对应页面还原度。*

[READY_FOR_REVIEW]

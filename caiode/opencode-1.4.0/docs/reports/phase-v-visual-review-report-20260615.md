# Phase V 视觉与交互复核报告

> 我是：前端工程师（Phase V 复核 Agent），本次任务：视觉还原度评估，职责范围：`caiode/opencode-1.4.0/packages/app/src/novel/`

---

## 一、视觉复核结论

**整体评价：当前工作台与 Stitch 04 code.html 的视觉还原度约为 75%，布局骨架一致，但在色彩精确度、交互反馈、头像组件、响应式适配方面存在可感知的差距。**

**达成项（与 Stitch 一致）：**
- 三栏布局比例（260px / flex-1 / 300px）完全对齐
- 整体配色方案（primary `#6b38d4`、background `#f8f9ff`、outline `#cbc3d7`）一致
- TopAppBar 高度 64px、SideNav 结构、Editor 排版大体正确
- AI Progress Dock 位置（absolute bottom + 居中）、阴影、进度条样式基本一致
- Generation Panel 表单结构、按钮样式高度还原
- 字体家族（Plus Jakarta Sans / Work Sans / Noto Serif SC）已配置

**差距项（与 Stitch 不一致）：**
- SideNav 激活态背景色使用浅蓝而非紫色半透明
- TopAppBar 头像使用图标按钮替代真实头像图片
- Generation Panel Header 使用白色而非背景色
- 部分组件缺少 `active:scale-95` 等微交互动画
- 窄屏下无响应式处理，存在崩坏风险
- PlaceholderPage 为临时占位，与产品风格一致但非最终设计

---

## 二、差异清单（P0 / P1 / P2 分级）

### P0 — 阻塞级（明显崩坏或功能不可用）

无 P0 项。当前工作台在桌面端可正常运行，无视觉崩坏。

---

### P1 — 高优先级（明显视觉差异 / 用户体验受损）

#### P1-01 · TopAppBar 头像使用图标替代真实图片

| 项目 | 内容 |
|------|------|
| **检查对象** | TopAppBar 右侧头像区域 |
| **Stitch 标准** | `<img>` 真实头像图片，`w-10 h-10 rounded-full object-cover border border-outline-variant cursor-pointer` |
| **当前实现** | `<button>` + `<NovelIcon name="person">`，紫色背景圆形 `bg-[#e9ddff] text-[#6b38d4]` |
| **差异描述** | 当前为图标占位，Stitch 为真实头像。视觉风格从"精致用户头像"降级为"通用图标按钮" |
| **对应文件** | `components/novel-workspace/layout/workspace-top-app-bar.tsx` (L72-77) |
| **建议修复** | 替换为 `<img>` 标签，使用 mock-data 中的角色图片或默认头像占位图；保留 `onClick={props.onOpenProfile}` |
| **修复难度** | 低 |

#### P1-02 · SideNav 激活态背景色不一致

| 项目 | 内容 |
|------|------|
| **检查对象** | SideNav 导航项激活态背景 |
| **Stitch 标准** | `bg-primary-container/10`（`#8455ef` 10% 透明度，淡紫色调） |
| **当前实现** | `bg-[#eff4ff]`（浅蓝色调） |
| **差异描述** | 激活态色调从紫色系变为蓝色系，与产品主色调不一致 |
| **对应文件** | `components/novel-workspace/layout/workspace-side-nav.tsx` (L87) |
| **建议修复** | 改为 `bg-[#8455ef]/10` 或 `bg-primary-container/10`（如已配置 Tailwind 自定义色） |
| **修复难度** | 低 |

#### P1-03 · Generation Panel Header 背景色不一致

| 项目 | 内容 |
|------|------|
| **检查对象** | 右侧生成设置面板头部 |
| **Stitch 标准** | `bg-surface-container-lowest`（即 `#f8f9ff`，与页面背景融合） |
| **当前实现** | `bg-white`（纯白色，与背景形成明显分割） |
| **差异描述** | 头部使用白色导致右侧面板视觉层级过重，Stitch 中使用背景色使面板更柔和 |
| **对应文件** | `components/novel-workspace/index.tsx` (L109) |
| **建议修复** | 改为 `bg-[#f8f9ff]` 或移除 bg 类继承父级背景 |
| **修复难度** | 低 |

#### P1-04 · Editor Header 标题字号偏小

| 项目 | 内容 |
|------|------|
| **检查对象** | 编辑器章节标题 |
| **Stitch 标准** | `font-headline-lg text-headline-lg`（32px / line-height 1.2 / weight 700） |
| **当前实现** | `text-3xl font-bold`（约 30px / line-height 默认 1.2 / weight 700） |
| **差异描述** | 字号略小 2px，在高分屏上可能感知不明显，但严格对比有差距 |
| **对应文件** | `components/novel-workspace/editor/workspace-editor-header.tsx` (L17-21) |
| **建议修复** | 改为 `text-[32px] leading-[1.2] tracking-tight` 精确匹配 |
| **修复难度** | 低 |

#### P1-05 · TopAppBar 导航链接缺少点击反馈动画

| 项目 | 内容 |
|------|------|
| **检查对象** | TopAppBar 工作台/素材库/灵感区按钮 |
| **Stitch 标准** | `active:scale-95 duration-150`（点击时轻微缩小，150ms 过渡） |
| **当前实现** | 无 active 动画，仅有 `hover:bg-[#eff4ff]` |
| **差异描述** | 缺少微交互反馈，按钮点击感觉"生硬" |
| **对应文件** | `components/novel-workspace/layout/workspace-top-app-bar.tsx` (L32-49) |
| **建议修复** | 为所有导航按钮添加 `active:scale-95 transition-transform duration-150` |
| **修复难度** | 低 |

#### P1-06 · 响应式缺失：窄屏下可能崩坏

| 项目 | 内容 |
|------|------|
| **检查对象** | 工作台整体布局 |
| **Stitch 标准** | 有 `md:hidden` 等响应式类，移动端隐藏部分元素 |
| **当前实现** | `workspace-layout.tsx` 使用固定宽度 `w-[260px]` 和 `w-[300px]`，无媒体查询 |
| **差异描述** | 在宽度 < 1000px 的屏幕上，三栏布局会挤压中间编辑器区域，可能导致内容截断或水平滚动 |
| **对应文件** | `components/novel-workspace/layout/workspace-layout.tsx` (L28, 38) |
| **建议修复** | 添加响应式断点：`lg:w-[260px]` / `lg:w-[300px]`，窄屏时隐藏侧边栏或改为抽屉式（`drawer`） |
| **修复难度** | 中 |

---

### P2 — 低优先级（细微差异 / 可延后）

#### P2-01 · SideNav NavItem 非激活态 hover 背景色

| 项目 | 内容 |
|------|------|
| **Stitch 标准** | `hover:bg-surface-container-high` |
| **当前实现** | `hover:bg-[#e6eeff]` |
| **差异描述** | 颜色接近，Stitch 更偏灰蓝，当前更偏浅蓝 |
| **对应文件** | `components/novel-workspace/layout/workspace-side-nav.tsx` (L88) |
| **建议修复** | 统一为 `hover:bg-[#e6eeff]` 或 `hover:bg-surface-container-high`（如已配置） |
| **修复难度** | 低 |

#### P2-02 · AI Progress Dock 背景色

| 项目 | 内容 |
|------|------|
| **Stitch 标准** | `bg-surface-container-lowest/90`（`#f8f9ff` 90% 不透明） |
| **当前实现** | `bg-white/90` |
| **差异描述** |  Dock 使用白色而非背景色，在深色正文区域上对比度略高 |
| **对应文件** | `components/novel-workspace/ai-task/workspace-ai-progress-dock.tsx` (L26) |
| **建议修复** | 改为 `bg-[#f8f9ff]/90` |
| **修复难度** | 低 |

#### P2-03 · PlaceholderPage 为临时占位

| 项目 | 内容 |
|------|------|
| **检查对象** | character-panel / world-setting / profile / tutorial 占位页 |
| **当前实现** | 统一灰色图标 + 标题 + "返回工作台" 按钮 |
| **差异描述** | 与产品风格一致（颜色、字体、圆角），但内容仅为占位文本。Stitch 中没有这些页面的设计，属于新增页面 |
| **对应文件** | `components/layout/placeholder-page.tsx` |
| **建议修复** | Phase V-Fix 不处理，待后续批次实现真实页面时替换 |
| **修复难度** | — |

#### P2-04 · TopAppBar Logo 语义为 button 而非 div

| 项目 | 内容 |
|------|------|
| **Stitch 标准** | `<div>` 纯展示文本 |
| **当前实现** | `<button>` 可点击，触发返回书架 |
| **差异描述** | 语义不同，但功能合理（Logo 可点击返回首页是常见 UX 模式）。视觉上无差异 |
| **对应文件** | `components/novel-workspace/layout/workspace-top-app-bar.tsx` (L22-28) |
| **建议修复** | 保持现状，无需修复 |
| **修复难度** | — |

---

## 三、E2E 问题根因分析与修复建议

### §E2E-01 · TopAppBar Logo 未匹配到可见元素

**根因分析：**

1. **选择器问题**：E2E 使用 `page.getByText("墨语 AI")`，该文本在 `workspace-top-app-bar.tsx` 中实际为 `"墨语 AI (InkVerse)"`。Playwright 的 `getByText` 支持子串匹配，理论上应能匹配。
2. **时序问题**：`page.goto("/novel")` 后，NovelNavigationProvider 的 `onMount` 会触发视图重定向到 `workspace`。SolidJS 的响应式渲染可能导致元素在 `waitForTimeout(800)` 内尚未稳定挂载。
3. **多重匹配与可见性**：如果页面上存在多个包含 "墨语 AI" 的元素（如 Workspace 和 Bookshelf 同时存在于 DOM 中），`.first()` 可能选中被隐藏的元素。
4. **最可能根因**：SolidJS 的 `<Switch>` 在视图切换时，旧视图可能仍在 DOM 中短暂存在，导致 `getByText` 匹配到不可见的旧实例。

**修复建议：**
- **方案 A（推荐）**：为 Logo 添加 `data-testid="workspace-logo"`，E2E 改为 `page.getByTestId('workspace-logo')`
- **方案 B**：使用更精确的角色选择器：`page.getByRole('button', { name: /墨语/ }).first()`
- **方案 C**：在 E2E 中增加 `await page.waitForSelector('text=墨语 AI', { state: 'visible' })` 显式等待

**对应文件**：
- `e2e/novel/novel-workspace-nav.spec.ts` (L23)
- `e2e/novel/novel-static-flow.spec.ts` (L40)
- `components/novel-workspace/layout/workspace-top-app-bar.tsx` (L22)

---

### §E2E-02 · bookshelf → workspace 路径测试不稳定

**根因分析：**

1. `/novel` 默认进入 `workspace`，测试需要先回到 `bookshelf`。
2. 当前测试通过 Logo 点击回到书架，但 Logo 本身不可见（见 §E2E-01）。
3. 即使 Logo 可见，点击后 NovelNavigation 的视图切换可能有延迟，导致后续断言不稳定。

**修复建议：**
- **方案 A（推荐）**：直接在测试中通过 URL 参数导航到书架：`await page.goto('/novel?view=bookshelf')`，绕过 UI 点击
- **方案 B**：在 NovelNavigationProvider 中暴露 `?view=bookshelf` 的 URL 解析支持（如尚未支持）
- **方案 C**：在 BookshelfPage 的 E2E 中单独测试，不依赖从 workspace 反向导航

**对应文件**：
- `e2e/novel/novel-static-flow.spec.ts` (L33-72)

---

## 四、ModalHost 视觉检查

| 检查项 | Stitch 标准 | 当前实现 | 评价 |
|--------|-----------|---------|------|
| 遮罩层 | `bg-black/40 backdrop-blur-sm` | `bg-black/40 backdrop-blur-sm` | ✅ 一致 |
| 弹框宽度 | `max-w-lg` (512px) | `max-w-lg` (512px) | ✅ 一致 |
| 圆角 | `rounded-xl` | `rounded-xl` | ✅ 一致 |
| 阴影 | `shadow-[0_8px_32px_rgba(0,0,0,0.12)]` | `shadow-[0_8px_32px_rgba(0,0,0,0.12)]` | ✅ 一致 |
| 标题栏 | 边框分隔 + 关闭按钮 | 边框分隔 + 关闭按钮 | ✅ 一致 |
| 视觉层级 | z-50 最高层 | z-50 最高层 | ✅ 一致 |

**结论**：NovelModalHost 的视觉实现与常见设计规范一致，无需修改。

---

## 五、PlaceholderPage 风格检查

| 检查项 | 评价 |
|--------|------|
| 颜色 | 使用 `#cbc3d7`（图标）、`#0d1c2f`（标题）、`#7b7486`（描述），与产品色调一致 |
| 字体 | 使用 Plus Jakarta Sans，与 Stitch 一致 |
| 圆角 | `rounded-lg`，与产品一致 |
| 按钮 | `bg-[#eff4ff] text-[#6b38d4]`，与产品主色调一致 |
| 布局 | 垂直居中，视觉平衡 |

**结论**：PlaceholderPage 虽然是临时占位，但视觉风格与产品整体一致，不会给用户造成"风格突变"的违和感。

---

## 六、是否建议进入 Phase V-Fix

**建议：是，但限制范围。**

Phase V-Fix 应仅处理以下低风险、高影响的视觉修正（预计工作量 1-2 小时）：

| 编号 | 修复项 | 优先级 | 工作量 |
|------|--------|--------|--------|
| V-Fix-01 | SideNav 激活态背景色改为 `bg-[#8455ef]/10` | P1 | 5 min |
| V-Fix-02 | Generation Panel Header 改为 `bg-[#f8f9ff]` | P1 | 5 min |
| V-Fix-03 | Editor Header 标题改为 `text-[32px]` | P1 | 5 min |
| V-Fix-04 | TopAppBar 导航按钮添加 `active:scale-95` | P1 | 10 min |
| V-Fix-05 | TopAppBar 头像改为 `<img>` | P1 | 15 min |
| V-Fix-06 | E2E Logo 选择器添加 `data-testid` | P2 | 10 min |
| V-Fix-07 | E2E bookshelf 测试改为直接 URL 导航 | P2 | 10 min |

**不建议在 Phase V-Fix 中处理：**
- 响应式适配（P1-06）：工作量较大，建议单独开一个批次
- PlaceholderPage 替换真实页面：属于功能开发，非视觉修复
- NovelModalHost 弹框内容替换：属于功能开发

---

## 七、_legacy 保留建议

**建议：继续保留 `_legacy/novel-workspace-20260612/`。**

理由：
1. Phase V-Fix 不涉及 _legacy 目录的清理
2. 待 Phase V-Fix 完成并验证通过后，可在 Phase W（收尾阶段）统一删除
3. 当前 _legacy 不影响构建和运行时性能

---

## 八、验证说明

本次 Phase V 复核为**静态代码审查**，未修改任何运行时代码，因此未执行 `bun typecheck` / `bun test` / E2E。

如主控批准进入 Phase V-Fix，修复完成后将执行完整验证命令。

---

## [READY_FOR_PHASE_V_REVIEW]

**执行人**: Kimi-K2.6
**日期**: 2026-06-15
**基准文件**: `stitch/stitch_ai_novel_writing_dashboard/04_小说项目工作台/code.html`
**检查范围**: `packages/app/src/novel/components/novel-workspace/` + `layout/novel-app-shell.tsx` + `layout/novel-modal-host.tsx` + `layout/placeholder-page.tsx`

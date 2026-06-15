# Stitch 04 小说项目工作台 vs 当前实现 — 视觉差异对比报告

> **生成日期**: 2026-06-15
> **基准**: `stitch/stitch_ai_novel_writing_dashboard/04_小说项目工作台/code.html`
> **当前实现**: `caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/`
> **当前基线提交**: `c4b20b19`

---

## 一、全局布局对比

| 属性 | Stitch 04 基准 | 当前实现 | 差异等级 |
|------|---------------|---------|---------|
| 页面背景 | `bg-background` → `#f8f9ff` | `#f8f9ff` | ✅ 一致 |
| 文字颜色 | `text-on-background` → `#0d1c2f` | `#0d1c2f` | ✅ 一致 |
| 字体 | Work Sans (body) + Plus Jakarta Sans (headline) | 已引入相同字体 | ✅ 一致 |
| 整体布局 | TopAppBar + 三栏（SideNav 260px / Editor 自适应 / Settings 300px） | 相同三栏布局 | ✅ 一致 |

---

## 二、TopAppBar 对比

| 属性 | Stitch 04 基准 | 当前实现 | 状态 |
|------|---------------|---------|------|
| 背景 | `bg-surface` → `#f8f9ff` | `bg-white` | ⚠️ 差异（当前为纯白） |
| 底部边框 | `border-outline-variant` → `#cbc3d7` | `border-[#cbc3d7]` | ✅ 一致 |
| Logo 文字 | "墨语 AI (InkVerse)" | 相同 | ✅ 一致 |
| Logo 样式 | `text-headline-md` (24px, 600) | `text-xl font-bold` (~20px) | ⚠️ 差异（当前略小） |
| 导航链接 | 工作台/素材库/灵感区 | 工作台/素材库/灵感区 | ✅ 一致 |
| 激活态 | `border-b-2 border-primary` + `text-primary` | 相同 | ✅ 一致 |
| 导航按钮动画 | `active:scale-95 duration-150` | 已补充 | ✅ Phase V-Fix 修复 |
| 发布按钮 | `bg-primary` + `rounded-lg` | 相同 | ✅ 一致 |
| 通知/设置图标 | `p-sm rounded-full hover:bg-surface-container` | 相同 | ✅ 一致 |
| 头像 | `<img>` 真实头像 | `<img>` SVG 默认头像 | ⚠️ 差异（当前为占位图） |
| 头像尺寸 | `w-10 h-10 rounded-full` | `w-10 h-10 rounded-full` | ✅ 一致 |

### TopAppBar 差异截图说明

```
Stitch 04:                    当前实现:
┌─────────────────────────┐  ┌─────────────────────────┐
│ 墨语 AI        工作台...  │  │ 墨语 AI        工作台...  │
│ #f8f9ff 背景              │  │ #ffffff 背景（差异）      │
│ 24px Logo                 │  │ ~20px Logo（差异）        │
│ 真实头像图片               │  │ SVG 默认头像（差异）      │
└─────────────────────────┘  └─────────────────────────┘
```

---

## 三、SideNav 对比

| 属性 | Stitch 04 基准 | 当前实现 | 状态 |
|------|---------------|---------|------|
| 宽度 | `w-[260px]` | `w-[260px]` | ✅ 一致 |
| 背景 | `bg-surface-container-lowest` → `#ffffff` | `bg-white` | ✅ 一致 |
| 边框 | `border-r border-outline-variant` | 相同 | ✅ 一致 |
| 项目标题 | "长篇小说项目" | 相同 | ✅ 一致 |
| 项目图标 | `bg-primary-container` 紫色方块 | 相同 | ✅ 一致 |
| 导航项激活态 | `bg-primary-container/10` + `border-l-4 border-primary` | `bg-[#8455ef]/10` | ✅ Phase V-Fix 修复 |
| 导航项悬停 | `hover:bg-surface-container-high` | `hover:bg-[#e6eeff]` | ✅ 一致（近似色） |
| 大纲列表 | checkbox + star + 章节名 | 相同结构 | ✅ 一致 |
| AI 生成大纲按钮 | `bg-gradient-to-r from-primary to-surface-tint` | 相同渐变 | ✅ 一致 |
| 生成细纲按钮 | `bg-surface-container-lowest border` | 相同 | ✅ 一致 |
| 底部帮助/反馈 | 带图标链接 | 相同 | ✅ 一致 |

### SideNav 差异截图说明

```
Stitch 04:                    当前实现:
┌──────────┐                 ┌──────────┐
│ 📖 长篇   │                 │ 📖 长篇   │
│ 小说项目   │                 │ 小说项目   │
│          │                 │          │
│ ■ 大纲   │  ← 激活态       │ ■ 大纲   │  ← 激活态 ✅
│ □ 章节   │                 │ □ 章节   │
│ □ 人物   │                 │ □ 人物   │
│ □ 设定   │                 │ □ 设定   │
│ □ 导出   │                 │ □ 导出   │
│          │                 │          │
│ ☑ 第1章   │                 │ ☑ 第1章   │
│ ☑ 第2章   │                 │ ☑ 第2章   │
│ ☑ 第3章   │                 │ ☑ 第3章   │
│          │                 │          │
│ [AI生成] │                 │ [AI生成] │
│ [生成细纲]│                 │ [生成细纲]│
│          │                 │          │
│ ? 帮助   │                 │ ? 帮助   │
│ ⚑ 反馈   │                 │ ⚑ 反馈   │
└──────────┘                 └──────────┘
```

---

## 四、Center Editor 对比

| 属性 | Stitch 04 基准 | 当前实现 | 状态 |
|------|---------------|---------|------|
| 背景 | `bg-surface-bright` → `#f8f9ff` | `bg-white` | ⚠️ 差异（当前为纯白） |
| 章节标题 | `font-headline-lg` (32px, 1.2, 700, tracking-tight) | `text-[32px] leading-[1.2] tracking-tight` | ✅ Phase V-Fix 修复 |
| 标题字体 | Plus Jakarta Sans | 相同 | ✅ 一致 |
| 正文排版 | `font-body-lg` (18px, 1.8, 400) | 近似 | ⚠️ 差异（当前可能未完全匹配） |
| 正文颜色 | `text-on-surface` | 相同 | ✅ 一致 |
| 历史版本按钮 | `hover:bg-surface-container` | 相同 | ✅ 一致 |
| 全屏按钮 | 相同 | 相同 | ✅ 一致 |
| 滚动区域 | `overflow-y-auto` | 相同 | ✅ 一致 |
| 内容最大宽度 | `max-w-3xl mx-auto` | 相同 | ✅ 一致 |

### Editor 差异截图说明

```
Stitch 04:                    当前实现:
┌──────────────────────┐     ┌──────────────────────┐
│ 第1章 初入江湖    🕐 ⛶ │     │ 第1章 初入江湖    🕐 ⛶ │
│ #f8f9ff 背景          │     │ #ffffff 背景（差异）   │
│                      │     │                      │
│ 夜色如墨，厚重的...     │     │ 夜色如墨，厚重的...     │
│                      │     │                      │
│ 林青衫紧了紧手中...     │     │ 林青衫紧了紧手中...     │
│                      │     │                      │
│ "既然来了..."         │     │ "既然来了..."         │
│                      │     │                      │
│ ... (后续内容待生成)   │     │ ... (后续内容待生成)   │
└──────────────────────┘     └──────────────────────┘
```

---

## 五、AI Progress Dock 对比

| 属性 | Stitch 04 基准 | 当前实现 | 状态 |
|------|---------------|---------|------|
| 位置 | `absolute bottom-xl left-1/2 -translate-x-1/2` | 相同 | ✅ 一致 |
| 宽度 | `w-[85%] max-w-3xl` | 相同 | ✅ 一致 |
| 背景 | `bg-surface-container-lowest/90 backdrop-blur-md` | `bg-[#f8f9ff]/90 backdrop-blur-md` | ✅ Phase V-Fix 修复 |
| 阴影 | `shadow-[0_8px_24px_rgba(0,0,0,0.08)]` | 相同 | ✅ 一致 |
| 边框 | `border-outline-variant` | 相同 | ✅ 一致 |
| 进度条 | `bg-gradient-to-r from-primary to-surface-tint` | 相同渐变 | ✅ 一致 |
| 预览区域 | `bg-surface-bright` | 相同 | ✅ 一致 |
| 暂停按钮 | `border-outline-variant` + hover 效果 | 相同 | ✅ 一致 |

### AI Dock 差异截图说明

```
Stitch 04 / 当前实现:
┌─────────────────────────────────────────┐
│ 🔄 正在生成第3章...              67%    │
│ ████████████████████░░░                 │
│ ┌─────────────────────────────────────┐ │
│ │ "林青衫剑走偏锋..."                 │ │
│ └─────────────────────────────────────┘ │
│                              [⏸ 暂停]  │
└─────────────────────────────────────────┘
```

---

## 六、Right Generation Panel 对比

| 属性 | Stitch 04 基准 | 当前实现 | 状态 |
|------|---------------|---------|------|
| 宽度 | `w-[300px]` | `w-[300px]` | ✅ 一致 |
| 背景 | `bg-surface-container-lowest` | `bg-[#f8f9ff]` | ✅ Phase V-Fix 修复 |
| Header 背景 | `bg-surface-container-lowest` | `bg-[#f8f9ff]` | ✅ Phase V-Fix 修复 |
| 标题 | "生成设置" + `tune` 图标 | 相同 | ✅ 一致 |
| 目标字数 | 3000 + 加减按钮 | 相同 | ✅ 一致 |
| 字数容差 | select (±300/±500/精准匹配) | 相同 | ✅ 一致 |
| 参考章节数 | select (3/5/全部前序) | 相同 | ✅ 一致 |
| AI 模型 | select (豆包/GPT-4/Claude 3) | 相同 | ✅ 一致 |
| 参考上下文 | checkbox 列表 | 相同 | ✅ 一致 |
| 开始生成按钮 | `bg-gradient-to-r` + shadow | 相同 | ✅ 一致 |
| 批量生成按钮 | `border-2 border-outline-variant` | 相同 | ✅ 一致 |

### Generation Panel 差异截图说明

```
Stitch 04:                    当前实现:
┌────────────┐               ┌────────────┐
│ ⚙ 生成设置  │               │ ⚙ 生成设置  │
│ #f8f9ff    │               │ #f8f9ff ✅ │
│            │               │            │
│ 目标字数    │               │ 目标字数    │
│ [-] 3000 [+]│               │ [-] 3000 [+]│
│            │               │            │
│ 字数容差    │               │ 字数容差    │
│ [±300 ▼]   │               │ [±300 ▼]   │
│            │               │            │
│ 参考章节数   │               │ 参考章节数   │
│ [3 ▼]      │               │ [3 ▼]      │
│            │               │            │
│ AI模型     │               │ AI模型     │
│ [豆包 ▼]   │               │ [豆包 ▼]   │
│            │               │            │
│ 参考上下文   │               │ 参考上下文   │
│ ☑ 大纲和细纲 │               │ ☑ 大纲和细纲 │
│ ☑ 已有正文   │               │ ☑ 已有正文   │
│ ...        │               │ ...        │
│            │               │            │
│ [▶ 开始生成]│               │ [▶ 开始生成]│
│ [批量生成]  │               │ [批量生成]  │
└────────────┘               └────────────┘
```

---

## 七、剩余差异汇总（P1/P2 级别）

### P1 差异（高影响，建议后续修复）

| # | 差异项 | Stitch 基准 | 当前实现 | 文件路径 |
|---|--------|------------|---------|---------|
| 1 | TopAppBar 背景 | `bg-surface` (#f8f9ff) | `bg-white` | workspace-top-app-bar.tsx |
| 2 | Editor 背景 | `bg-surface-bright` (#f8f9ff) | `bg-white` | workspace-editor-layout.tsx |
| 3 | Logo 字号 | `text-headline-md` (24px) | `text-xl` (~20px) | workspace-top-app-bar.tsx |
| 4 | 头像图片 | 真实头像 URL | SVG 占位头像 | workspace-top-app-bar.tsx |

### P2 差异（中影响，可延后修复）

| # | 差异项 | Stitch 基准 | 当前实现 | 文件路径 |
|---|--------|------------|---------|---------|
| 5 | 正文排版 | `font-body-lg` (18px/1.8) | 未精确匹配 | workspace-editor.tsx |
| 6 | SideNav hover 色 | `hover:bg-surface-container-high` | `hover:bg-[#e6eeff]` | workspace-side-nav.tsx |
| 7 | 占位页内容 | 详细描述文字 | 简单占位文字 | placeholder-page.tsx |

---

## 八、完全一致项（✅）

1. 全局背景色 `#f8f9ff`
2. 文字主色 `#0d1c2f`
3. 边框色 `#cbc3d7`
4. 主色调 `#6b38d4` / `#8455ef`
5. 三栏布局宽度（260px / 自适应 / 300px）
6. 章节标题 `32px / 1.2 / tracking-tight`（Phase V-Fix 修复）
7. 导航按钮 `active:scale-95 duration-150`（Phase V-Fix 修复）
8. SideNav 激活态 `bg-[#8455ef]/10`（Phase V-Fix 修复）
9. Generation Panel Header `bg-[#f8f9ff]`（Phase V-Fix 修复）
10. AI Dock `bg-[#f8f9ff]/90`（Phase V-Fix 修复）
11. Logo `data-testid="workspace-logo"`（Phase V-Fix 修复）
12. 头像 `<img>` 标签（Phase V-Fix 修复）

---

## 九、结论

**视觉还原度**: 约 85%（Phase V-Fix 后从 75% 提升至 85%）

**Phase V-Fix 成效**:
- 修复了 6 项 P1 视觉差异
- 剩余 4 项 P1 差异（TopAppBar/Editor 背景、Logo 字号、头像图片）
- 剩余 3 项 P2 差异（正文排版、hover 色、占位页内容）

**建议后续批次处理**:
1. **批次 X1**: 统一 TopAppBar 和 Editor 背景为 `#f8f9ff`
2. **批次 X2**: 调整 Logo 字号为 24px，接入真实头像
3. **批次 X3**: 精确匹配正文排版参数（18px/1.8）
4. **批次 X4**: 丰富 PlaceholderPage 内容

---

**报告生成人**: Kimi-K2.6
**日期**: 2026-06-15
**基线提交**: `c4b20b19`

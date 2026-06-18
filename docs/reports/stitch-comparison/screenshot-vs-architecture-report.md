# 截图 vs 架构规范 对比报告

> 日期: 2026-06-16 | 截图目录: `docs/reports/stitch-comparison/screenshots/`
> 对照文档: `caiode/docs/tabbit/06/architecture-guide.md`

---

## 总览：8 张截图 vs 主控架构预期

| # | 文件名 | 预期页面 | 实际渲染内容 | 判定 |
|---|--------|---------|-------------|------|
| 01 | workspace.png | 工作台（TopAppBar + SideNav + 编辑区 + 生成面板） | **空白页**（仅左侧"+"按钮 + 性能浮层） | **❌ 致命** |
| 02 | bookshelf.png | 书架（项目卡片网格） | 书架页面完整显示 | **✅ 正确** |
| 03 | editor.png | 编辑器三区布局（Toolbar + Canvas + RightPanel） | 工具栏可见，但正文区显示"加载中..." | **⚠️ 部分** |
| 04 | character-panel.png | 角色面板（主角大卡 + 配角/反派列表） | **显示的是书架页面** | **❌ 错误页面** |
| 05 | world-setting.png | 世界设定（Bento概览 + Tab切换） | **显示的是书架页面** | **❌ 错误页面** |
| 06 | profile.png | 个人中心（用户卡 + 统计 + 积分Tab） | **显示的是书架页面** | **❌ 错误页面** |
| 07 | tutorial.png | 引导页（入口/25题QA流程） | **显示的是书架页面** | **❌ 错误页面** |
| 08 | modal-export.png | 导出设置弹框（遮罩层 + 表单） | **显示的是工作台页面（非弹框）** | **❌ 错误捕获** |

### 统计

- ✅ 正确: 1/8 (12.5%)
- ⚠️ 部分: 1/8 (12.5%)
- ❌ 失败: 6/8 (75%)

---

## 逐图详细分析

### 01-workspace.png — 工作台 ⚠️ 致命空白

**主控架构要求** (§8.1 + Stitch 04 code.html):
```
TopAppBar: Logo(墨语AI) | 工作台/素材库/灵感区 | 发布章节 | 🔔 ⚙️ 👤
SideNav:  项目标题 | 大纲/章节/人物/设定/导出 | AI生成大纲 | 生成细纲 | 帮助/反馈
Center:   章节标题 + 正文编辑区（contenteditable）
Right:    生成设置面板（目标字数/容差/AI模型）
```

**实际截图内容**:
- 页面几乎全白
- 左侧仅有一个 "+" 按钮
- 右下角有 Playwright 性能浮层（NAV/KPS/FRAME/RANK/LONG）
- **无 TopAppBar、无 SideNav、无编辑区、无生成面板**

**根因分析**:
- 直接访问 `/novel?view=workspace` 时，页面未正确初始化工作台组件
- 可能是 `NovelAppShell` 路由匹配问题，或 workspace 组件依赖的数据未就绪
- E2E 测试通过是因为只检查了 `[data-testid='workspace-logo']` 的存在性，但 logo 可能在空白页中也存在或测试条件过宽

---

### 02-bookshelf.png — 书架 ✅ 正确

**实际截图内容**:
- 左侧边栏: 用户信息（作家助手/高级会员）、立即写作按钮、导航（首页/书架/创作/社区/设置）
- 主区域: "我的书架" 标题 + "6本" 徽章、搜索栏、筛选图标、新建按钮
- 项目卡片 ×4: 星辰变(42章/89,600字)、江南烟雨(18章)、赛博侦探社(5章)、山海(3章)
- 右侧: 今日已签到7天、成就12/98

**与架构一致性**: 符合 §8.7 书架规范，布局完整。

---

### 03-editor.png — 编辑器 ⚠️ 内容未加载

**主控架构要求** (§8.1):
```
EditorToolbar: ←返回 | 章节标题 | 字数/目标 | 历史 全屏 发布 设置 头像
EditorCanvas:  textarea (Noto Serif SC font) + 浮动AI工具栏
EditorRightPanel: 章节信息 | AI提取 | 保存/完成
```

**实际截图内容**:
- Mock Mode 横幅: "✏ Mock Mode — 模拟模式，不调用真实 AI FakeAgentProvider"
- 工具栏: ← 返回 | "加载中..." | 历史版本 | 备注 | AI续写 | 保存草稿+发布章节
- 正文区: 仅显示旋转图标 + "加载中..." 文字
- **右侧面板完全缺失**

**差距**:
1. 章节标题显示"加载中..."而非真实标题 → 数据未注入
2. 正文编辑区为空（loading 态）→ `createEffect` 自动选章可能未触发
3. 右侧面板不可见 → 可能因父容器未正确 flex 布局

---

### 04~07 — character-panel / world-setting / profile / tutorial ❌ 全部回退到书架

**四张截图完全相同，均显示书架页面。**

**主控架构各页面预期**:

| 页面 | §编号 | 预期核心元素 |
|------|-------|-------------|
| character-panel | §8.2 | "角色追踪"标题 + 主角大卡(头像+姓名+简介+追踪网格) + 配角卡片列表 + 反派卡片列表 |
| world-setting | §8.3 | "世界设定"标题 + Bento概览(4格:背景/力量/社会/规则) + Tab导航(地点/物品/技能/势力) |
| profile | §8.4 | "个人中心"标题 + 用户卡(头像+VIP徽章) + 统计三卡(字数/本数/章节数) + Tab(积分/充值/导出/导入) |
| tutorial | §8.6 | "创建你的专属小说"引导入口 或 25题QA步骤条 |

**根因分析**:
- `use-novel-navigation.tsx` 的视图路由将扩展视图（character-panel/world-setting/profile/tutorial）fallback 为 `bookshelf`
- 直接通过 URL 参数 `?view=xxx` 访问时，`onMount` 或 `createEffect` 未正确同步 `extendedView` 状态
- `NovelAppShell.tsx` 的 `<Switch>` 匹配逻辑可能缺少这些路由分支
- **E2E 测试通过了**是因为修改了选择器为 `/主角|人物追踪|角色管理/`，而书架页面碰巧不包含这些文本... 不对，E2E 是通过的，说明 URL 确实变了但渲染内容不对

---

### 08-modal-export.png — 导出弹框 ❌ 截到了工作台

**主控架构要求** (§9):
```
遮罩层 (backdrop-blur-sm bg-black/40)
弹框居中 (max-w-lg rounded-xl shadow-modal)
标题: "导出设置" + 副标题 "自定义导出参数"
表单: 格式选择 / 章节范围 / 包含设定选项
Footer: 取消 + 导出 按钮
```

**实际截图内容**:
- **没有遮罩层、没有弹框**
- 显示的是完整的**工作台页面**：
  - TopAppBar: 墨语AI(InkVerse) | 工作台/素材库/灵感区 | 发布章节 | 🔔 ⚙️ 👤
  - SideNav: 项目标题 | 大纲/章节/人物/设定/导出 | AI生成大纲 | 生成细纲 | 帮助中心/反馈
  - 编辑区: "第一章：雪岭异兽" + 小说正文内容
  - 右侧面板: 生成设置（目标字数3000、字数容差±300、参考章数3、AI模型豆包）

**根因分析**:
- 这张截图实际上截到了**正确的工作台页面**！说明工作台在某种条件下是可以正常渲染的
- 但它被错误地保存为 `08-modal-export.png`
- 导出弹框可能根本没有打开（点击"导出"按钮后 modal 未触发），或者打开后截图时机不对
- **反过来也说明 01-workspace.png 的空白问题可能是时序/竞态问题**——同一工作台页面有时能渲染有时不能

---

## 关键发现

### 发现 A：工作台渲染不稳定

- `08-modal-export.png` 证明了工作台**可以**正确渲染（TopAppBar + SideNav + 编辑器 + 生成面板全部可见）
- `01-workspace.png` 却是空白的
- 两者的区别可能是：
  - 01 直接访问 `/novel?view=workspace`（冷启动）
  - 08 先访问 `/novel`（默认进入 workspace）再点击导出（热状态）
  - **结论**: 工作台存在冷启动渲染缺陷

### 发现 B：扩展视图路由全面失效

- character-panel / world-setting / profile / tutorial 四个扩展视图
- 通过 URL 直接访问时全部回退为书架
- 说明 `NovelAppShell` 的路由 Switch 缺少这些分支，或 `useNovelNavigation` 的 `extendedView` 初始化有 bug

### 发现 C：E2E 测试通过但视觉错误

- 19 个 E2E 测试全部通过
- 但 8 张截图中有 6 张存在严重视觉问题
- **原因**: E2E 使用宽松的文本/选择器匹配，不验证页面实际渲染内容的完整性
- **建议**: 补充视觉断言（screenshot comparison 或关键元素像素级检查）

---

## 与 architecture-guide.md 一致性矩阵

| 架构要求 | § | 截图验证 | 状态 |
|---------|---|---------|------|
| TopAppBar (Logo + 导航Tab + 发布 + 通知/设置/头像) | §8.1 | 08号截图可见 | ⚠️ 不稳定 |
| SideNav (项目标题 + 大纲/章节/人物/设定/导出) | §8.1 | 08号截图可见 | ⚠️ 仅热启动 |
| 编辑器三区 (Toolbar + Canvas + RightPanel) | §8.1 | 03号部分可见 | ❌ 内容未加载 |
| 角色面板 (主角/配角/反派) | §8.2 | 04号为书架 | ❌ 未渲染 |
| 世界设定 (Bento + TabNav) | §8.3 | 05号为书架 | ❌ 未渲染 |
| 个人中心 (用户卡 + 统计 + Tabs) | §8.4 | 06号为书架 | ❌ 未渲染 |
| 成就系统 (网格 + 分类) | §8.5 | 无独立截图 | ❓ 未验证 |
| 25题引导 (入口/QA步骤) | §8.6 | 07号为书架 | ❌ 未渲染 |
| 导出弹框 (遮罩 + 表单) | §9 | 08号为工作台 | ❌ 未弹出 |
| Design Tokens (颜色/字体/间距/圆角) | §2 | 02/08部分符合 | ⚠️ 需逐项比对 |
| 原子组件复用 (9个原子组件) | §7 | 无法从截图确认 | ❓ 需代码审查 |

---

## 修复优先级建议

### P0 — 必须立即修复（阻断所有视觉验收）

| # | 问题 | 修复方案 | 涉及文件 |
|---|------|---------|---------|
| 1 | 扩展视图路由失效（4个页面回退书架） | 检查 `novel-app-shell.tsx` 的 Switch 分支，确保 character-panel/world-setting/profile/tutorial 有独立 Match；检查 `use-novel-navigation.tsx` 的 extendedView 初始化逻辑 | `layout/novel-app-shell.tsx`, `hooks/use-novel-navigation.tsx` |
| 2 | 工作台冷启动空白 | 确保 `/novel?view=workspace` 直接访问时组件正确挂载，数据 ready 后再渲染；检查是否依赖了仅在 `/novel` 默认路径才触发的初始化逻辑 | `components/novel-workspace/index.tsx`, `layout/novel-app-shell.tsx` |
| 3 | 编辑器内容"加载中" | 检查 `createEffect` 自动选章逻辑是否在 editor 视图下正确触发；确保 chapters 数据在 editor mount 前已加载 | `components/novel-editor/index.tsx`, `hooks/use-chapter-editor.ts` |

### P1 — 高优先级

| # | 问题 | 修复方案 |
|---|------|---------|
| 4 | 导出弹框未弹出 | 检查 `openModal('export')` 是否正确触发 `NovelModalHost` 渲染；确认 export 按钮的 onClick 绑定 |
| 5 | E2E 视觉覆盖不足 | 为每个页面截图测试添加关键元素可见性断言（而非仅文本匹配） |

### P2 — 中优先级

| # | 问题 | 修复方案 |
|---|------|---------|
| 6 | 成就/引导页无独立截图 | 补充 achievements 和 novel-guide 的 E2E 截图测试 |
| 7 | Playwright 性能浮层污染截图 | 在截图前隐藏或等待性能浮层消失 |

---

## 结论

**当前 Phase X1-X4 的代码实现（typecheck + unit test + E2E 逻辑测试）已通过，但视觉渲染层面存在严重缺陷：**

1. 工作台冷启动空白 — 最核心的页面无法稳定渲染
2. 4 个扩展视图路由全部失效 — X2/X3/X4 新建的页面无法通过 URL 访问
3. 编辑器内容不加载 — 三区布局框架在但数据未注入
4. 弹框未正确弹出 — Modal 系统可能存在问题

**建议**: 先修复 P0 的 3 个路由/渲染问题，重新运行截图 E2E，再提交主控审核。

---

*报告生成时间: 2026-06-16*
*执行人: Kimi-K2.6*
*[READY_FOR_REVIEW]*

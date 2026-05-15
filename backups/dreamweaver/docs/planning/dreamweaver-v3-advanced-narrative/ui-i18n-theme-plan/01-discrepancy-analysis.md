# 知识库与 AI 面板全量差异分析及主题/国际化重构计划

## 一、 核心页面全量差异分析

基于自动化测试截图对比工具中 `knowledge_base_characters` (L73-83) 与 `ai_chat_panel` (L87-94) 的差异反馈，我们对“差距依然很大”的根本原因进行了深度排查。核心问题并非 CSS 样式本身，而是**数据链路断裂、Mock 数据缺失与国际化字段不统一**导致页面降级为“空状态”或“错误态”。

### 1. 知识库角色面板 (`knowledge_base_characters`)

#### 🔴 差异根因分析 (P0 优先级)
- **数据层 (Data Layer)**: 严重缺失。
  - **报错定位**: 控制台持续抛出 `Failed to fetch characters: "Error: 请求失败"`。
  - **根因**: 项目在 V3 阶段设置了 `NEXT_PUBLIC_USE_MOCK_API=false` 接入真实数据库，但 `src/app/api/projects/[id]/characters/route.ts` 这个真实的后端接口**根本不存在**（仅实现了 `chapters` 路由）。这导致接口返回 `404 Not Found`。
- **逻辑层 (Logic Layer)**:
  - 页面因为 `catch (err)` 进入了错误态或空数组态，导致原本复杂的左侧角色列表、右侧能力雷达图和关系网表单**完全没有被渲染** (DOM Tree 被截断)。
- **样式层与多语言 (Style & i18n)**:
  - 原型图中顶部标题为英文 "Characters" 和 "World Forge"，当前组件代码里硬编码了中文 "角色管理" 和 "获取角色列表失败"。
  - Tailwind 类名方面，空状态组件缺乏针对 `bg-surface-container` 的适配。

### 2. AI 对话面板 (`ai_chat_panel`)

#### 🟠 差异根因分析 (P1 优先级)
- **数据层 (Data Layer)**:
  - 原型面板上方包含 "SELECTED MODEL: Claude 4 Opus" 和 "CONTEXT REFERENCE" (关联角色：李云、苏婉)。
  - **根因**: 当前的 `ChatPanel.tsx` 组件尚未订阅 `knowledge-store.ts`，无法获取当前激活的角色和世界观设定（这也依赖于即将开发的 RAG 检索引擎），导致这部分面板完全缺失。
- **逻辑层 (Logic Layer)**:
  - 原型中的 "Consistency Check" (角色一致性、时间线校对) 模块在代码中完全没有对应的 React Component。
  - AI 建议悬浮卡片（"AI Suggestion: 此刻李云的真气运行路径..."）在开发版中仅是一个静态对话流，缺乏独立挂载的 Suggestion 气泡逻辑。
- **样式层 (Style Layer)**:
  - AI 消息气泡的头像、边框样式 (`border-outline-variant`) 未完全遵循原型的 1px 细线发光效果。

---

## 二、 浅色/深色模式与中英文切换实施计划

为了彻底解决上述国际化硬编码和硬编码颜色问题，并建立企业级的无障碍与多语言体系，制定以下四个阶段的实施计划：

### 1. 设计令牌 (Design Tokens) 与一键主题切换
- **机制**: 在 `globals.css` 中引入语义化的 CSS Variables，并基于 `next-themes` 实现 `<html class="dark/light">` 的无刷新切换。
- **实施步骤**:
  1. 定义 `light` 与 `dark` 两套完整的色板：
     ```css
     :root {
       --color-surface: #ffffff;
       --color-surface-container: #f5f5f5;
       --color-primary: #006688;
       /* ... */
     }
     .dark {
       --color-surface: #111125;
       --color-surface-container: #1e1e32;
       --color-primary: #75d1ff;
       /* ... */
     }
     ```
  2. 集成 `next-themes` 的 `ThemeProvider`，在 `Settings` 面板中暴露 Theme Toggle。

### 2. 国际化 (i18n) 语言包缺省字段补全与动态加载
- **机制**: 引入 `next-intl` 建立服务端/客户端双重国际化支持。
- **实施步骤**:
  1. 在项目根目录创建 `messages/zh-CN.json` 和 `messages/en-US.json`。
  2. 提取 `knowledge_base_characters` 和 `ai_chat_panel` 中所有的硬编码字符串：
     - `"characters.title": "Characters" / "角色管理"`
     - `"chat.consistency_check": "Consistency Check" / "一致性校验"`
  3. 配置 Next.js 的 `[locale]` 动态路由中间件 (`middleware.ts`)，实现 `/zh-CN/workbench/...` 与 `/en-US/workbench/...` 的自动重定向。

### 3. 无障碍访问 (A11y: aria-label & 焦点顺序)
- **机制**: 符合 WCAG 2.1 AA 标准。
- **实施步骤**:
  1. 为所有仅有图标的按钮（如侧边栏导航、AI 快捷指令）补充 `aria-label`。
  2. 为表单元素（Input/Textarea）补充 `aria-describedby` 与 `htmlFor` 关联。
  3. 优化 `tabIndex`，确保键盘导航顺序为：侧边栏 -> 大纲/角色列表 -> 编辑器/详情表单 -> AI 面板。
  4. 动态设置 `<html lang="zh-CN">`，随 i18n 状态联动。

### 4. 视觉回归测试 (VRT) 与 CI 矩阵
- **机制**: 使用 Playwright + Percy 或 Storybook 搭建视觉回归测试网格。
- **实施步骤**:
  1. 编写独立的 `tests/vrt/` 脚本，针对核心页面生成 4 种矩阵截图：
     - `Light Mode` × `zh-CN`
     - `Light Mode` × `en-US`
     - `Dark Mode` × `zh-CN`
     - `Dark Mode` × `en-US`
  2. 将 VRT 脚本接入 GitHub Actions / CI 流程。
  3. 设定阈值：任何像素差异超过 1% 的 PR 将被标记为 Failed 阻塞合并，必须由开发确认 (Approve)。
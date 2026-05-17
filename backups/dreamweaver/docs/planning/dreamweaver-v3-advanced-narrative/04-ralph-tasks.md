# Ralph V3 开发任务清单 (Task List)

> **迭代名称**: dreamweaver-v3-advanced-narrative
> **状态**: ⏳ 规划中

## 任务执行铁律 (Execution Iron Rules)
1.  **严格按物理顺序执行**: 必须按从上到下的顺序逐个完成任务，**绝对禁止跳跃**执行。
2.  **TDD 驱动**: 对于每一个带有测试要求的任务，必须先写测试 (Red)，再写实现 (Green)，最后重构 (Refactor)。
3.  **单点闭环**: 必须完成当前任务的**所有**子项，且相关测试通过后，才能将状态改为 `[x]` 并进入下一个任务。

---

## Sprint 0: UI 视觉与布局差异修复 (UI Polish)
> **目标**: 在进入 V3 服务端架构前，彻底修复 V2 遗留的 UI 布局坍塌与视觉偏差，确保核心业务串联。

### T-UI-FIX-001: 修复 P1/P2 轻微样式与视觉偏差
- [x] 在 `src/app/layout.tsx` 中引入 Material Symbols 字体库，恢复全局图标渲染。
- [x] 强制全局启用暗黑主题 (Dark Mode)，恢复深空蓝高级质感。
- [x] 修复 AI 面板 (`ChatPanel.tsx`) 输入框底部间距，恢复悬浮感。
- [x] 修复编辑器 Toolbar 吸顶高度的轻微偏差。
- [x] 调整知识库角色表单 (`CharacterForm.tsx`) 的控件间距 (`gap-4` 改为 `gap-6`)。

### T-UI-FIX-002: 修复 P0 项目主页全局布局缺失
- [x] 创建/重构 `src/app/(main)/projects/layout.tsx`，将 `ActivityBar` 和 `TopNav` (顶部居中导航) 引入项目主页。
- [x] 为项目主页内容区添加正确的 Sidebar 宽度挤压 (margin-left)，确保网格布局对齐。

### T-UI-FIX-003: 修复 P0 大纲管理视图降级
- [x] 与产品/设计确认，创建独立路由 `src/app/(main)/workbench/[projectId]/outline/page.tsx`。
- [x] 实现原型的全屏三栏布局（侧边栏、大纲列表树、右侧详情）。

### T-UI-FIX-004: 修复 P0 分支树形图静态化
- [x] 在 `src/app/(main)/workbench/[projectId]/branches/page.tsx` 引入图形学库 (如 `React Flow`)。
- [x] 重写现有静态 Flex/Grid 卡片，渲染为带连线和绝对定位层级的树状结构。

### T-UI-FIX-005: 核心业务链路串联验证 (E2E)
- [x] 运行现有 E2E 测试，修复由于 UI DOM 结构调整带来的测试定位器 (Locator) 失效。
- [x] 验证数据流串联：登录 -> 项目列表 -> 工作台大纲 -> 编辑器/AI面板 -> 分支视图 -> 知识库。
- [x] 确保端到端测试 100% 通过后，再进入 Sprint 1 开发。

---

## Sprint 0.5: 主题/国际化与无障碍基建 (Theme & i18n & A11y)
> **目标**: 彻底解决知识库和 AI 面板由于数据报错和硬编码造成的视觉塌方，建立完整的设计令牌、中英双语、无障碍与视觉回归矩阵。

### T-SYS-001: 知识库真实后端数据接入 (修复 404 空白)
- [x] 创建 `src/app/api/projects/[id]/characters/route.ts` 与 `world-settings/route.ts` 的真实数据库增删改查。
- [x] 确保测试环境生成包含角色的种子数据 (`seed.ts`)，恢复 `knowledge_base_characters` 丰富界面。
- [x] 修复 AI 面板的 "Consistency Check" 与 "Context Reference" 的静态组件结构占位。

### T-SYS-002: 设计令牌与 Light/Dark 一键切换
- [x] 在 `globals.css` 中重构 CSS 变量，分为 `:root` (Light) 和 `.dark` 两套完整的语义化色板。
- [x] 引入 `next-themes`，在全局 `layout.tsx` 中包裹 `ThemeProvider`。
- [x] 在 `Settings` 菜单中添加主题切换开关，测试深/浅色模式切换的无缝过渡。

### T-SYS-003: 国际化双语支持 (zh-CN / en-US)
- [x] 引入 `next-intl`，建立 `messages/zh-CN.json` 和 `en-US.json` 语言包字典。
- [x] 重构知识库 (`knowledge_base_characters`) 和 AI 面板 (`ai_chat_panel`) 中所有硬编码的中/英文字符串。
- [x] 配置 `[locale]` 动态路由与 `middleware.ts` 拦截，支持随浏览器语言或手动切换。

### T-SYS-004: 无障碍访问 (A11y) 改造
- [x] 为所有 Icon 按钮 (如侧边栏、快捷指令) 添加 `aria-label` 属性。
- [x] 设置全局 `<html>` 的 `lang` 属性随 i18n 动态变化。
- [x] 为表单元素配置正确的 `htmlFor` 与焦点顺序 (`tabIndex`)。

### T-SYS-005: 视觉回归测试 (VRT) 矩阵搭建
- [x] 引入 Playwright 视觉对比库 (Visual Comparisons) 或 Percy。
- [x] 编写测试脚本，覆盖 `Light/Dark` × `zh-CN/en-US` 四种组合下的核心页面快照比对。
- [x] 配置 GitHub Actions 脚本，使得任何超过 1% 像素差异的改动触发 CI 失败。

---

## Sprint 1: Harness 工程基础设施 (Harness Foundation)

### T-HAR-001: 建立 Context Manager 与 Compaction 雏形
- [ ] 创建 `src/lib/harness/context-manager.ts`，实现基于 `maxTokens` 的截断策略。
- [ ] 将现有的 `useChat` 组装系统提示词的逻辑重构到 `ContextManager` 中。
- [ ] 编写 Vitest 单元测试，验证超过指定长度的文本会被正确截断或替换为摘要。

### T-HAR-002: 实现 Prompt Cache Harness (基于 AI SDK)
- [ ] 创建 `src/lib/harness/prompt-cache.ts`，封装对模型 (如 Claude 3.5 Sonnet / GPT-4o) 缓存 API 的调用。
- [ ] 修改 `app/api/chat/route.ts`，在向大模型发送长篇世界观设定或章节前文时，加入 provider 特有的 cache 控制指令。
- [ ] 编写测试，验证传递的 messages 数组中正确包含了缓存标识。

## Sprint 2: 知识库 RAG 检索 (Knowledge Retrieval)

### T-RAG-001: 向量存储架构选型与 Prisma 扩展
- [ ] 研究并引入适合的向量化方案 (如 `pgvector` 扩展，或在开发期使用轻量级内存向量)。
- [ ] 在 `schema.prisma` 中为 `Character` 和 `WorldSetting` 添加 `embedding` 字段 (如果采用原生 DB 支持)。
- [ ] 编写测试脚本，验证能够成功保存和查询向量字段。

### T-RAG-002: 实体数据 Ingestion (写入向量库)
- [ ] 创建 `src/lib/rag/embedder.ts`，集成 OpenAI 的 `embed` 函数 (或其他轻量模型)。
- [ ] 在角色和世界观设定的 `POST`/`PUT` 路由中，加入异步触发 Embedding 生成的逻辑。
- [ ] 编写集成测试，验证新增一个角色后，其向量数据被正确生成并存入。

### T-RAG-003: 智能检索与上下文注入 (Retrieval & Injection)
- [ ] 修改 `app/api/chat/route.ts`，在对话或补全前，先对用户的 `messages` 进行意图/实体提取。
- [ ] 根据提取的实体，调用向量检索引擎获取 Top-K 最相关的 `Character`/`WorldSetting` 记录。
- [ ] 将检索到的记录作为动态 Context 注入到 `ContextManager` 的 System Prompt 中。
- [ ] 编写 E2E/集成测试，验证 AI 能准确回答未在当前正文中但存在于知识库的设定问题。

## Sprint 3: 多分支叙事系统 (Branching Narrative)

### T-BRN-001: Prisma 分支模型设计与迁移
- [ ] 更新 `schema.prisma`，引入 `Branch`, `Commit`, `ChapterSnapshot` 数据模型，并建立关联。
- [ ] 生成迁移脚本 `npx prisma migrate dev`，更新测试种子数据 `seed.ts`。
- [ ] 编写基础的 API Route (`GET /api/projects/[id]/branches`, `POST /api/projects/[id]/branches`)。

### T-BRN-002: 工作台分支 UI 组件与状态
- [ ] 在左侧 `StoryExplorer` 顶部新增分支切换器 (Branch Selector) UI。
- [ ] 更新 `useProjectStore` 或新增 `useBranchStore`，管理当前激活的分支 `currentBranchId`。
- [ ] 编写 Playwright E2E 测试，验证 UI 能够正确显示主分支 (main) 及其下挂的快照。

### T-BRN-003: 分支切换与编辑器联动
- [ ] 当用户切换分支时，重新拉取该分支下的 `ChapterSnapshot`，并更新 TipTap 编辑器内容。
- [ ] 确保自动保存逻辑将变更写入到当前激活的 `Branch` 及其最新 `Commit` 中，而非覆盖主线。
- [ ] 编写 E2E 测试，验证在分支 A 修改的内容，切换回分支 B 后不会相互污染。

### T-BRN-004: 基于 AI 的“假设推演”交互 (What-if Execution)
- [ ] 在 AI 聊天面板中增加“基于新路线推演”的快捷动作 (Quick Action)。
- [ ] 点击后，自动创建一个基于当前光标/段落的新 `Branch`，并让 AI 在该分支中流式生成不同走向的后续情节。
- [ ] 编写 E2E 测试，验证推演动作能成功创建新分支并展示 AI 生成的内容。

## Sprint 4: 质量门禁与性能调优 (QA & Tuning)

### T-QA-001: 全链路回归测试与缺陷修复
- [ ] 运行 V1, V2 的所有 E2E 测试 (`npm run test:e2e`)。
- [ ] 修复因引入分支系统而导致的任何存量 UI 或逻辑的破坏。
- [ ] 确保测试覆盖率 (Statements/Branches/Functions) 保持在 80% 以上。

### T-QA-002: 性能基准与首字延迟优化
- [ ] 使用 Playwright 的 Trace 性能分析工具，验证开启 RAG 和 Prompt Cache 后的长文本补全的首字延迟 (TTFB) < 500ms。
- [ ] 在 `06-learnings.md` 中记录针对 RAG 检索和模型路由的性能调优经验。
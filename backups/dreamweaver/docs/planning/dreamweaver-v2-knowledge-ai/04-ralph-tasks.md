# V2 迭代开发任务清单 (04-ralph-tasks)

> **基于文档**: `03-execution-plan.md`
> **当前阶段**: 知识资产与 AI 引擎破冰 (dreamweaver-v2-knowledge-ai)
> **执行规则**: 必须严格按列表物理顺序执行，TDD 模式 (Red -> Green -> Refactor)

## 1. 阶段一：UI 原型高保真还原与 Mock 填充 (Sprint 1)

- [x] **1.1 还原欢迎页与项目列表原型**
  - **任务 ID**: `T-UI-001`
  - **描述**: 基于 `stitch_main_workbench/welcome_workbench_home/code.html` 重构 `/projects` 列表页。
  - **验收**: 视觉高保真，对接现有 MSW 获取列表数据，新建弹窗样式一致。
- [x] **1.2 还原工作台主界面与编辑器原型**
  - **任务 ID**: `T-UI-002`
  - **描述**: 基于 `main_workbench/code.html` 重构 `/workbench/[projectId]` 的三栏布局、顶部操作栏与编辑器样式。
  - **验收**: 视觉高保真，保留现有章节切换和 TipTap 编辑器逻辑。
- [x] **1.3 还原大纲结构视图原型**
  - **任务 ID**: `T-UI-003`
  - **描述**: 基于 `outline_structure_view/code.html` 将大纲/卷章管理 UI 嵌入到工作台左侧栏。
  - **验收**: 左侧边栏支持大纲层级的展示，点击高亮。
- [x] **1.4 还原知识库与角色管理原型**
  - **任务 ID**: `T-UI-004`
  - **描述**: 基于 `knowledge_base_characters/code.html` 还原知识库/角色面板界面。
  - **验收**: 静态 UI 完成，为后续对接 `useKnowledgeStore` 提供基础。
- [x] **1.5 还原 AI 对话面板原型**
  - **任务 ID**: `T-UI-005`
  - **描述**: 基于 `ai_chat_panel/code.html` 还原工作台右侧的 AI 会话气泡、输入框与提示词快捷项。
  - **验收**: 视觉高保真，消息气泡样式对齐，输入框可交互。
  - **完成时间**: 2026-04-05
  - **完成备注**: ChatPanel 组件已完全还原原型设计，包含用户/AI 消息气泡、快捷操作 Chips (/续写, /扩写等)、输入框和发送按钮。支持 compact 模式和完整模式。
- [x] **1.6 还原分支导图视图原型**
  - **任务 ID**: `T-UI-006`
  - **描述**: 基于 `branch_map_view/code.html` 建立分支管理 UI 组件（暂作为占位页面）。
  - **验收**: UI 静态还原完成。
  - **完成时间**: 2026-04-05
  - **完成备注**: 创建了分支导图页面 `/workbench/[projectId]/branches`，包含顶部导航栏、二级工具栏、画布区域（网格背景+SVG连接线+分支节点）、右侧详情面板和底部状态栏。已添加路由配置和E2E测试。
- [x] **1.7 还原模型中心原型**
  - **任务 ID**: `T-UI-007`
  - **描述**: 基于 `model_center_pipelines/code.html` 建立模型配置中心 UI。
  - **验收**: UI 静态还原完成。
  - **完成时间**: 2026-04-05
  - **完成备注**: 创建了模型中心页面 `/workbench/[projectId]/models`，包含顶部导航栏、我的模型区域（2x2网格展示4个AI模型卡片）、协作流水线区域（4个阶段步骤）、浮动操作按钮。已添加路由配置和14个E2E测试用例。

## 2. 阶段二：角色与世界观管理逻辑 (Sprint 2)

- [x] **1.1 结构化资产状态管理**
  - **任务 ID**: `T-KNOW-001`
  - **描述**: 设计 `Character` 与 `WorldSetting` 的 TypeScript 接口，建立 `knowledge-store.ts` (Zustand)。
  - **验收**: 单元测试覆盖 `addCharacter`, `updateCharacter`, `deleteCharacter` 方法。
- [x] **2.2 知识库 Mock API 编写**
  - **任务 ID**: `T-KNOW-002`
  - **描述**: 在 `src/mocks/handlers.ts` 补充对 `/api/projects/:projectId/characters` 等 CRUD 接口的拦截。
  - **验收**: 验证 MSW 能正确返回 `result.code === 10200` 格式的数据包裹。
- [x] **2.3 知识库页面骨架与侧边栏入口**
  - **任务 ID**: `T-KNOW-003`
  - **描述**: 在工作台布局新增知识库入口 (Characters/World Settings tab)，实现 `app/(main)/workbench/[projectId]/characters/page.tsx`。
  - **验收**: E2E 测试验证点击导航能正确切换到角色管理列表。
- [x] **2.4 角色管理列表与表单组件**
  - **任务 ID**: `T-KNOW-004`
  - **描述**: 编写角色卡片列表 UI，新建/编辑角色的抽屉 (Drawer) 或弹窗 (Modal) 表单。
  - **验收**: E2E 测试覆盖新建角色、填写名称/设定、保存成功并在列表显示。
- [x] **2.5 世界观设定列表与表单组件**
  - **任务 ID**: `T-KNOW-005`
  - **描述**: 编写世界观分类 (地理/魔法/历史) 的列表与设定详情表单。
  - **验收**: E2E 测试覆盖新建设定、保存并验证列表渲染。

## 3. 阶段三：AI 引擎基础集成 (Sprint 3)

- [x] **3.1 服务端 AI 路由搭建**
  - **任务 ID**: `T-AI-001`
  - **描述**: 安装 `ai` 和 `@ai-sdk/openai`，创建 `app/api/chat/route.ts` 接口，支持流式传输 (Streaming)。
  - **验收**: 单元测试模拟 Request 并验证返回 `ReadableStream` 响应格式。
- [x] **3.2 AI 面板流式会话交互**
  - **任务 ID**: `T-AI-002`
  - **描述**: 基于原型还原的 UI 重构 `ChatPanel.tsx`，使用 `useChat` hook 支持发送消息与实时打字机效果。
  - **验收**: E2E 测试拦截 API 返回 Mock Stream，验证面板能正确逐字渲染消息和 Markdown 格式。
- [x] **3.3 上下文自动注入逻辑**
  - **任务 ID**: `T-AI-003`
  - **描述**: 发送聊天请求时，自动从 Zustand 提取当前激活章节文本，作为 `system` prompt 发送。
  - **验收**: 单元测试拦截发出的 Fetch Request，验证 Body 中包含了 `context: "章节内容..."` 字段。
- [x] **3.4 编辑器划词 AI 辅助**
  - **任务 ID**: `T-AI-004`
  - **描述**: 在 TipTap 中增加 Bubble Menu (悬浮菜单)，选中文本后显示"润色/续写/扩写"按钮，一键发送 AI 请求。
  - **验收**: E2E 测试模拟选中文本，点击润色，等待流式返回，验证编辑器内容被更新且未破坏其他内容。

## 4. 阶段四：真实后端迁移准备 (Sprint 4)

- [x] **4.1 数据库 Schema 设计与 Prisma 初始化**
  - **任务 ID**: `T-DB-001`
  - **描述**: 安装 `prisma`, `sqlite` (或 postgresql)，定义 `User`, `Project`, `Chapter` 的数据模型，并执行 `prisma migrate dev`。
  - **验收**: 验证生成的 Prisma Client 类型能与现有的 API 接口类型无缝对接。
- [x] **4.2 项目与章节 API Route 实现**
  - **任务 ID**: `T-DB-002`
  - **描述**: 编写真实 `/api/projects` 和 `/api/projects/:id/chapters` 的 GET/POST 处理逻辑，连接 Prisma 查询。
  - **验收**: 单元测试验证 API 能正确查表并返回与 MSW 完全一致的 `{ result: { code: 10200, data: ... } }` 格式。
- [x] **4.3 认证网关与双轨控制环境变量**
  - **任务 ID**: `T-DB-003`
  - **描述**: 实现基础 JWT/Cookie 校验中间件，配置 `NEXT_PUBLIC_USE_MOCK_API` 开关，在 `MockServiceWorker.tsx` 中增加拦截条件。
  - **验收**: 关闭环境变量后，E2E 测试的认证、项目创建、章节保存流程能够顺利打通真实数据库。
- [x] **4.4 V2 阶段全量集成测试与代码审查**
  - **任务 ID**: `T-DB-004`
  - **描述**: 确保所有 E2E 测试全部 PASS，TypeScript 检查 0 报错，执行上线前评审。
  - **验收**: CI/CD 流水线全绿，出具测试覆盖率报告。
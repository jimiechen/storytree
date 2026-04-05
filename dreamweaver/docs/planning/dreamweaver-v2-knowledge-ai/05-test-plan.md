# V2 验收测试计划 (05-test-plan)

> **基于文档**: `04-ralph-tasks.md`
> **执行规则**: 必须严格按照列表物理顺序执行测试，先标记 `[ ]` 再修改为 `[x]`。

## 测试策略
- **测试框架**: Playwright (E2E) + Vitest (Unit)
- **数据策略**: 继续复用 `src/mocks/handlers.ts` 进行 UI 测试。对于阶段三的真实 API 测试，引入专用的 `playwright.db.setup.ts` 初始化数据库。

## 1. UI 原型还原验证 (UI Integration)

- [ ] **TC-UI-001: 欢迎页与项目列表原型回归 (E2E)**
  - **描述**: 验证新引入的 `welcome_workbench_home` 样式未破坏原有项目列表功能。
  - **断言**: 项目卡片、新建按钮渲染位置与原型一致，点击卡片能正确跳转。
- [ ] **TC-UI-002: 工作台主界面与大纲视图 (E2E)**
  - **描述**: 验证 `main_workbench` 和 `outline_structure_view` 的三栏/双栏布局，调整左侧边栏。
  - **断言**: 章节树能正确折叠/展开，编辑器居中对齐，响应式布局正常。
- [x] **TC-UI-003: AI 面板与知识库面板视图 (E2E)**
  - **描述**: 验证 `ai_chat_panel` 和 `knowledge_base_characters` 的基础样式渲染。
  - **断言**: 面板切换流畅，UI 元素(输入框/卡片)显示不越界。
  - **完成备注**: ChatPanel 组件已还原原型设计，包含消息气泡、快捷操作 Chips、输入框等所有 UI 元素。
- [x] **TC-UI-004: 模型中心与分支导图路由 (E2E)**
  - **描述**: 验证 `model_center_pipelines` 和 `branch_map_view` 占位页的访问连通性。
  - **断言**: 通过导航菜单可成功切换到对应空状态页面，不报 404。
  - **完成备注**: 分支导图页面 `/workbench/[projectId]/branches` 和模型中心页面 `/workbench/[projectId]/models` 已实现，包含完整的UI组件和27个E2E测试用例。

## 2. 知识库模块 (Knowledge Assets)

- [ ] **TC-KNOW-001: 角色状态管理 (Unit)**
  - **描述**: 测试 `useKnowledgeStore` 能正确添加、更新、删除角色对象。
  - **断言**: `characters.length` 正确增减；修改某角色属性后状态同步更新。
- [ ] **TC-KNOW-002: Mock 接口响应 (E2E/API)**
  - **描述**: 直接请求 `/api/projects/test-id/characters`，验证返回数据结构是否符合 API 契约 (`code: 10200`)。
  - **断言**: 响应包含 `id`, `name`, `backstory` 等关键字段。
- [ ] **TC-KNOW-003: 知识库侧边栏导航 (E2E)**
  - **描述**: 在工作台点击“知识库”Tab，验证主内容区切换至角色/设定列表。
  - **断言**: URL 变为 `/workbench/[id]/characters`，且页面渲染出“角色列表”标题。
- [ ] **TC-KNOW-004: 新建与编辑角色 (E2E)**
  - **描述**: 在角色列表点击“新建角色”，填写表单并保存。点击已有角色进行编辑。
  - **断言**: 列表展示新增/修改后的角色名称，Mock API 成功接收 POST/PUT 请求。
- [ ] **TC-KNOW-005: 世界观设定增删改查 (E2E)**
  - **描述**: 切换至世界观 Tab，新建一个设定并选择分类。
  - **断言**: 设定成功保存，列表能按分类过滤显示。

## 3. AI 引擎交互 (AI Engine)

- [ ] **TC-AI-001: 流式路由基础响应 (Unit/API)**
  - **描述**: 测试 `app/api/chat/route.ts` 能否正确处理消息数组并返回 `ReadableStream`。
  - **断言**: `Response.body` 是流对象，响应头包含 `text/event-stream`。
- [ ] **TC-AI-002: 聊天面板实时渲染 (E2E)**
  - **描述**: 在 `ChatPanel` 输入消息并发送，拦截 API 模拟流式返回 (`Chunk 1... Chunk 2...`)。
  - **断言**: 消息列表新增一条助手回复，且文字逐个出现，支持 Markdown 解析（如加粗、代码块）。
- [ ] **TC-AI-003: 上下文自动注入验证 (E2E)**
  - **描述**: 在编辑器输入特定长文本，然后发送 AI 请求，抓取网络请求。
  - **断言**: 发送的 Request Payload 中，`messages` 或 `context` 包含了当前编辑器的文本片段。
- [ ] **TC-AI-004: 编辑器悬浮 AI 润色 (E2E)**
  - **描述**: 在 TipTap 中选中文本，触发 Bubble Menu，点击“润色”，等待结果并插入。
  - **断言**: 选中的原文被替换或附加了 AI 润色后的文本，且撤销 (`Cmd+Z`) 能够恢复原文。

## 4. 真实后端迁移 (Database & Backend)

- [ ] **TC-DB-001: Prisma Schema 生成 (Unit)**
  - **描述**: 验证 `prisma generate` 产出的类型与前端 API 类型 (`Project`, `Chapter`) 一致。
  - **断言**: 编译时不出现属性缺失或类型不匹配的错误。
- [ ] **TC-DB-002: 项目列表真实 API (E2E/API)**
  - **描述**: 关闭 Mock 开关，向真实的 `/api/projects` 发起 GET/POST 请求。
  - **断言**: 数据库插入成功，响应体完全符合 `{ result: { code: 10200, data: ... } }` 标准。
- [ ] **TC-DB-003: 双轨灰度开关验证 (E2E)**
  - **描述**: 配置 `NEXT_PUBLIC_USE_MOCK_API=false` 启动项目，执行 MVP v1 遗留的创建项目、创建章节、自动保存用例。
  - **断言**: 所有 39 个核心 E2E 测试用例在真实数据库环境下依旧保持 PASS，无数据格式异常或超时。
# V2 执行计划 (Phase 2 Execution Plan)

## 1. 里程碑概览

本次迭代主要针对 PRD v5 的 **核心知识资产 (Stage 2)** 与 **AI 引擎破冰 (Stage 3 基础能力)**，并逐步过渡到真实数据库，脱离纯前端状态，实现**工作台 AI 辅写全链路**与**知识库管理闭环**。

> **迭代名称**: dreamweaver-v2-knowledge-ai
> **开发模式**: Mock 驱动 UI 优先 -> TDD 闭环 -> 真实后端平滑迁移 (灰度发布)
> **预期周期**: 2-3 Sprints (共 20 人天左右)

## 2. 分阶段执行步骤

### 2.1 第一阶段 (Sprint 1): UI 原型高保真还原与 Mock 填充 (UI Prototype Integration)
> **目标**: 将 `stitch_main_workbench` 目录下的 7 个 HTML UI 原型转换为 Next.js React 组件，并填充 MSW Mock 数据，确保视觉高保真与交互连贯。

1. **工作台主页还原**: 转换 `welcome_workbench_home` (项目列表/欢迎页) 和 `main_workbench` (编辑器主界面)。
2. **知识资产 UI 还原**: 转换 `knowledge_base_characters` (角色管理/世界观面板) 和 `outline_structure_view` (大纲视图)。
3. **AI 与分支系统 UI 还原**: 转换 `ai_chat_panel` (对话面板)、`branch_map_view` (分支视图) 以及 `model_center_pipelines` (模型配置中心)。
4. **Mock 数据绑定**: 将静态 HTML 中的占位文本替换为来自 `useProjectStore` 或新增 Store 的 Mock 数据驱动，确保点击和切页流畅。

### 2.2 第二阶段 (Sprint 2): 角色与世界观管理逻辑 (Frontend Logic)
> **目标**: 在完成高保真 UI 的基础上，实现 PRD 中长篇小说所需的核心结构化资产管理的业务闭环。

1. **结构设计**: 确定角色卡片和世界观设定的数据模型 (Types & Mocks)。
2. **状态管理**: 建立 `useKnowledgeStore`，管理当前项目的知识实体列表，对接前一阶段的 UI。
3. **UI 逻辑挂载**: 让 UI 面板支持实际的增删改查表单提交，触发状态流转。
4. **集成测试**: 编写 Playwright 用例，验证新建角色、设定关系、查看详情等操作（依赖 MSW 响应）。

### 2.3 第三阶段 (Sprint 3): AI 引擎基础集成 (AI Gateway & UI)
> **目标**: 激活原型还原后的 `ai_chat_panel`，打通多模型调用和流式交互。

1. **服务端环境搭建**: 引入 Vercel AI SDK，在 Next.js 创建 `app/api/chat/route.ts` 路由网关。
2. **AI 基础对话**: 接入 OpenAI 或 DeepSeek (Mock 环境可拦截)，完成基础文字会话流、Markdown 渲染、失败重试。
3. **上下文注入**: 在发起 AI 对话前，自动提取当前编辑器所在的“章节内容”及“相关角色名”，构建系统提示词 (System Prompt)。
4. **编辑器联动**: 在富文本选区悬浮工具栏 (Floating Toolbar) 增加 "AI 润色/续写" 入口，将生成内容一键替换/插入编辑器，且不破坏撤销堆栈。
5. **集成测试**: 利用 Playwright 模拟流式请求响应，验证 AI 聊天面板渲染与指令插入流程。

### 2.4 第四阶段 (Sprint 4): 真实后端迁移破冰 (Real DB & Migration)
> **目标**: 在保障现有前端体验不变的前提下，为用户、项目、章节数据接入真实的 PostgreSQL 数据库。

1. **ORM 选型与建模**: 引入 Prisma，构建 `User`, `Project`, `Chapter`, `Character`, `WorldSetting` 的 Schema。
2. **真实 API 编写**: 在 Next.js 编写服务端路由处理器 (Route Handlers)，对接 Prisma 增删改查，并应用认证鉴权 (JWT/Session 中间件)。
3. **双轨灰度开关**: 实现 `NEXT_PUBLIC_USE_MOCK_API` 控制，允许开发环境一键切换真实 API。
4. **数据库端到端测试**: 将 Playwright 测试运行环境切换至真实测试库，全量执行 MVP v1 (39个测试用例) 与 V2 的测试套件，验证接口重构无退化 (Regression Free)。

## 3. 准出条件 (Exit Criteria)

- ✅ **功能闭环**: 作者可以在同一个项目中撰写章节、维护角色设定，并在聊天面板中让 AI 辅助续写章节。
- ✅ **流式响应**: AI 对话不阻塞主线程，编辑器交互流畅 (FID < 100ms)。
- ✅ **测试覆盖率**: 知识库模块和 AI 面板逻辑覆盖率不低于 85%，E2E 测试新增 15+ 核心链路验证，全量通过率保持 100%。
- ✅ **数据解耦**: `projects` 和 `chapters` 的请求在环境变量切换后，能正确读写真实数据库。

## 4. 后续规划 (Next Steps After V2)
- 完成基础 AI 对话后，演进至 **RAG (检索增强生成)**，支持 AI 对角色设定的精准检索。
- 开始介入 **多分支叙事系统**，建立小说的版本控制树 (Git-like)。
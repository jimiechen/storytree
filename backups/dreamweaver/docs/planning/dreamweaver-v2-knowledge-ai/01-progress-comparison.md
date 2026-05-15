# 进度对比与差距分析报告 (Gap Analysis)

## 1. 当前代码状态 (MVP v1 验收总结)

基于对项目源码 `/Users/mac/StudioProjects/storytree2/dreamweaver` 的审阅，目前系统已经完成了**基础平台与治理 (Stage 0)** 以及**核心创作闭环 (Stage 1)** 的核心 UI 与 Mock API 接入，实现了真正的 TDD 闭环（测试通过率 90.7%）。

### 已完成的基建与业务能力：
- **工程底座**: Next.js 15 App Router, Tailwind CSS, Zustand 状态管理。
- **质量保障**: Playwright E2E 测试框架（支持 HTML/JSON 报告），Vitest 单元测试，MSW 全局 Mock 拦截（通过 `MockServiceWorker.tsx` 在根布局挂载）。
- **认证模块**: 完整的注册、登录页面与表单校验，以及相应的 `auth-store` 状态管理。
- **项目管理**: 项目列表页、空状态展示、新建项目 Modal 与路由跳转。
- **工作台核心 (核心创作闭环)**:
  - TipTap 富文本编辑器集成（基础格式、字数统计）。
  - 章节导航器（侧边栏列表、激活状态、切换章节逻辑）。
  - 基于 2 秒防抖的自动保存机制与状态指示器（Mock API 层面）。
  - 占位性质的 AI 对话面板 (`ChatPanel.tsx`)。

## 2. 与 PRD v5 的进度对比

将当前代码进度与 `/Users/mac/StudioProjects/storytree2/.trae/documents/多AI模型长篇小说写作平台PRD/多AI模型多分支长篇小说写作平台PRD_v5.md` 进行对比，存在以下核心功能差距：

| PRD 模块 | 当前代码状态 | 差距描述 (Gap) |
| --- | --- | --- |
| **基础写作闭环** | ✅ UI与Mock闭环 | 已完成前台逻辑，但完全依赖本地 MSW，缺乏真实后端集成（含数据库、鉴权验证等）。 |
| **AI 写作引擎** | 🚧 仅有 UI 外壳 | 缺乏真实大模型接入、多模型路由策略、Prompt 组装、流式响应处理与编辑器选区联动。 |
| **知识资产系统** | ❌ 未开始 | 完全缺失角色卡、世界观设定、伏笔追踪的 CRUD 页面与状态管理。 |
| **多分支叙事** | ❌ 未开始 | 缺失底层分支数据结构、Git-like 差异对比与合并逻辑。 |
| **多模型编排/RAG**| ❌ 未开始 | 缺失向量检索、知识注入、上下文组装等 Harness 工程。 |
| **全球化/商业化** | ❌ 未开始 | 暂无 i18n 多语言、Stripe 支付订阅与用户偏好持久化。 |

## 3. 演进策略 (Next Stage Strategy)

根据项目当前“UI 优先 + Mock 驱动 TDD”的开发节奏，以及《03-stage-execution-plan.md》中定义的里程碑，下一阶段（**V2 迭代**）应当采取**双轨并行**策略：

1. **业务功能推进 (Frontend/Mock 轨)**:
   继续采用 TDD 与 Mock 数据驱动，完成 PRD 中 **Stage 2 (知识资产与分支系统)** 的 UI 交互，优先把“角色”与“世界观”这两个最影响后续 AI 上下文质量的基础结构化数据搭建完毕。
2. **核心 AI 能力破冰 (AI Integration 轨)**:
   打通 **Stage 1 的 AI 对话面板** 的真实模型能力，接入基础的 LLM 服务（如 OpenAI/Claude/DeepSeek），实现流式打字机效果与基础 Prompt 交互，验证底层 AI 通道是否可用。
3. **真实后端平滑迁移 (Backend 轨)**:
   开始为认证与核心写作闭环设计真实的数据库 Schema（如 PostgreSQL + Prisma/Drizzle），并用真实 API 替换 Stage 0/1 的 MSW Mock 接口。

因此，V2 迭代的核心代号定为：**知识资产与 AI 引擎破冰 (Knowledge Assets & AI Engine Icebreaking)**。
# V3 执行计划 (Phase 3 Execution Plan)

## 1. 里程碑概览

本次迭代代号为 **dreamweaver-v3-advanced-narrative**，旨在突破长篇小说的“上下文限制”与“线性叙事”，将 DreamWeaver 打造为支持 **多分支版本控制** 与 **RAG 智能检索** 的高阶 AI 写作平台。

> **迭代名称**: dreamweaver-v3-advanced-narrative
> **开发模式**: TDD + Harness Engineering + 真实数据库演进
> **预期周期**: 3-4 Sprints (共 25 人天左右)

## 2. 分阶段执行步骤

### 2.1 第零阶段 (Sprint 0): UI 视觉与布局差异修复 (UI Polish)
> **目标**: 在进入 V3 服务端架构前，彻底修复 V2 遗留的 UI 布局坍塌与视觉偏差，确保核心业务串联。

1. **基础体验打磨**: 引入缺失的 Material Symbols 图标库，全局强制开启暗黑模式 (Dark Mode)，微调 AI 面板输入框与编辑器 Toolbar。
2. **全局路由重构**: 修复 `/projects` 路由全局布局缺失问题，补充 `ActivityBar` 和 `TopNav`。
3. **视图级重构**: 
   - 确认大纲管理需求，必要时创建独立的三栏大纲视图 `/workbench/[id]/outline`。
   - 引入 `React Flow` 图形学库，重写多分支树形视图。
4. **端到端测试覆盖**: 修复因 DOM 变更带来的用例失效，跑通完整业务链路，建立每日进度同步。

### 2.2 第一阶段 (Sprint 1): Harness 工程基础设施 (Harness Foundation)
> **目标**: 构建符合 PRD v5 理念的工程化基础设施，优化 AI 上下文成本。

1. **Context Manager (上下文组装与压缩)**:
   - 提取 V2 的 `system-prompt` 构建逻辑，将其独立为 `src/lib/harness/context-manager.ts`。
   - 实现简单的基于字符/Token 长度的截断和分级压缩 (Compaction Harness 雏形)。
2. **Prompt Cache Harness (提示词缓存)**:
   - 针对 Anthropic Claude 3.5 / OpenAI gpt-4o 等模型，在 API Route 中应用其特有的缓存指令，使得小说长背景成为“静态冷启动缓存”，大幅降低多轮对话和自动补全的 Token 消耗。

### 2.2 第二阶段 (Sprint 2): RAG 检索引擎破冰 (Knowledge Retrieval)
> **目标**: 让 AI “真正记住”知识库中的设定和角色，不再局限于当前页面的上下文。

1. **向量库准备**: 在 Prisma 中集成 `pgvector` (若环境允许) 或引入轻量级内存向量检索引擎。
2. **数据 Ingestion**: 监听角色/世界观保存事件，调用 Embeddings API 将其转换为向量并持久化。
3. **意图识别与检索 (Entity Extraction)**:
   - 在向大模型发问前，利用一个小模型或正则，提取用户输入或当前段落中的“实体名”。
   - 执行向量检索，拉取 Top-3 的设定条目。
4. **注入与推演**: 将检索到的条目无缝混入 System Prompt 中，完成端到端的 AI 响应测试。

### 2.3 第三阶段 (Sprint 3): 多分支叙事系统 (Branching System)
> **目标**: 彻底重构项目的线状结构，引入分支、快照概念，实现“What-if”写作。

1. **数据模型升级**: 在 `schema.prisma` 中增加 `Branch`, `Commit`, `Snapshot` 模型。
2. **工作台分支 UI**: 在左侧边栏顶端加入“分支选择器”，点击可新建“推演分支”。
3. **版本切换逻辑**:
   - 切换分支时，清空当前编辑器，加载新分支最新的 `Snapshot` 数据。
   - 保证切换操作的丝滑与防抖保存逻辑兼容。
4. **AI 假设性写作联动**: 在新分支中，允许 AI 自动基于不同路线展开情节（如：分支A选择反抗，分支B选择妥协）。

### 2.4 第四阶段 (Sprint 4): 全链路验收与集成 (E2E Integration & QA)
> **目标**: 保障 V3 新功能不对 V2 核心创作链路产生回退。

1. **E2E 用例补充**: 针对分支创建、切换，以及 RAG 上下文问答编写不少于 10 个 Playwright 测试。
2. **性能基准测试**: 测量开启 Prompt Caching 后的 AI 响应速度 (首字延迟 < 500ms) 及 Token 成本。
3. **文档与体验闭环**: 完善 UI/UX 的加载态，确保“分支合并”或“冲突提示”交互友好。

## 3. 准出条件 (Exit Criteria)

- ✅ **RAG 生效**: 用户提问一个在知识库存在、但在前文未提及的角色，AI 能准确回答其设定。
- ✅ **分支可用**: 用户可以从主线任意节点创建新分支，修改内容互不干扰。
- ✅ **成本优化**: 通过 Harness 机制，在同一章节的多轮对话中，AI 的响应延迟明显下降。
- ✅ **回归通过**: V1、V2 的 E2E 测试保持 100% Pass，未引入新 Bug。

## 4. 后续规划 (Next Steps After V3)
- 进入 **V4 (Agent & Global)**，引入类似 Claude Code 的主动智能代理，它将自动审核整本小说的一致性。
- 引入 Stripe 支付订阅和中英双语的国际化 (i18n) 部署方案。
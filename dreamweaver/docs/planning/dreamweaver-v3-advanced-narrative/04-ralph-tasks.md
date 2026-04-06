# Ralph V3 开发任务清单 (Task List)

> **迭代名称**: dreamweaver-v3-advanced-narrative
> **状态**: ⏳ 规划中

## 任务执行铁律 (Execution Iron Rules)
1.  **严格按物理顺序执行**: 必须按从上到下的顺序逐个完成任务，**绝对禁止跳跃**执行。
2.  **TDD 驱动**: 对于每一个带有测试要求的任务，必须先写测试 (Red)，再写实现 (Green)，最后重构 (Refactor)。
3.  **单点闭环**: 必须完成当前任务的**所有**子项，且相关测试通过后，才能将状态改为 `[x]` 并进入下一个任务。

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
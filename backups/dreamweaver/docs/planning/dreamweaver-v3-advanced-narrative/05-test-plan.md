# V3 验收测试计划 (Acceptance Test Plan)

## 1. 测试目标 (Testing Goals)

验证 V3 引入的 **多分支叙事系统 (Branching Narrative)** 与 **检索增强生成 (RAG & Harness)** 功能的正确性、稳定性和性能。确保在不破坏 V1/V2 现有核心创作链路的前提下，实现“假设性推演”写作与 AI 长篇上下文成本优化。

## 2. 测试策略 (Testing Strategy)

### 2.1 E2E 端到端测试 (Playwright)
- **多分支测试**: 覆盖分支创建、切换、合并、独立修改、快照保存的完整链路。
- **RAG 交互测试**: 模拟用户在对话中提问特定实体，验证系统能否准确检索并注入相关知识库设定。
- **Harness 集成测试**: 在真实大模型环境下，测试流式请求的稳定性和缓存击中率（针对特定 Provider）。

### 2.2 单元测试与集成测试 (Vitest)
- **核心逻辑覆盖**: 对 `ContextManager`, `Embedder`, `Compactor` 等纯函数或状态类进行 95% 以上覆盖率测试。
- **API 路由测试**: 验证 `/api/chat` 和分支相关的 RESTful API 返回数据的结构、权限拦截和边缘情况。

## 3. 验收测试用例 (Test Cases)

### 3.1 Harness 与 RAG 检索引擎 (TC-RAG)
- [ ] **TC-RAG-001: 向量 Ingestion 触发 (Integration)**
  - **描述**: 用户在前端新建一个角色并保存，后端应异步触发 Embeddings 生成。
  - **断言**: 数据库中该 `Character` 记录的 `embedding` 字段不为空，且维度符合模型要求。
- [ ] **TC-RAG-002: 实体意图提取与检索 (Unit/Integration)**
  - **描述**: 向 `ContextManager` 传入包含特定角色名字的 `messages`。
  - **断言**: `ContextManager` 能正确调用检索函数，并返回该角色的详细设定字符串。
- [ ] **TC-RAG-003: AI 对话上下文注入 (E2E)**
  - **描述**: 在工作台新建一个知识库条目“青云城”，在当前章节正文**未提及**该城市的情况下，在 AI 聊天面板提问“青云城是什么地方？”。
  - **断言**: AI 的回答必须包含该条目的设定细节，而不是大模型的通用幻觉。

### 3.2 多分支叙事系统 (TC-BRN)
- [ ] **TC-BRN-001: 分支选择器渲染与主线展示 (E2E)**
  - **描述**: 进入工作台后，左侧边栏顶部应渲染分支选择器，默认选中 `main` 分支。
  - **断言**: `[data-testid="branch-selector"]` 可见，且当前值为 `main`。
- [ ] **TC-RAG-002: 创建与切换新分支 (E2E)**
  - **描述**: 用户点击“新建分支”，输入名称 `alternate-ending`，确认后自动切换。
  - **断言**: 分支选择器更新为 `alternate-ending`，编辑器内容初始化为克隆自 `main` 分支的快照。
- [ ] **TC-BRN-003: 分支独立修改互不污染 (E2E)**
  - **描述**: 在 `alternate-ending` 分支中修改章节内容，等待自动保存。然后切换回 `main` 分支。
  - **断言**: `main` 分支的章节内容保持原样，未受 `alternate-ending` 修改的影响。
- [ ] **TC-BRN-004: 基于 AI 的假设推演 (What-if Execution) (E2E)**
  - **描述**: 选中一段文本，点击 AI 快捷动作“推演新分支”。
  - **断言**: 系统自动创建一个形如 `what-if-123` 的新分支并切换，AI 面板开始流式输出基于该选区的不同走向续写，并最终插入编辑器。

### 3.3 性能与回归门禁 (TC-QA)
- [ ] **TC-QA-001: V1/V2 全量回归 (Regression E2E)**
  - **描述**: 运行所有 V1 和 V2 遗留的 39+ 个 E2E 测试用例。
  - **断言**: `npm run test:e2e` 全部通过，分支和快照的引入未破坏原有的线性单章节的读写体验。
- [ ] **TC-QA-002: 性能与缓存测试 (Performance/Trace)**
  - **描述**: 连续进行 3 轮 AI 对话，检查网络面板中 `/api/chat` 的首字节时间 (TTFB)。
  - **断言**: 由于启用了 Prompt Cache，第 2 轮和第 3 轮的响应时间明显短于第 1 轮冷启动（或符合特定的性能指标 < 500ms）。
- [ ] **TC-QA-003: 代码覆盖率基准线 (Unit)**
  - **描述**: 运行 `npm run test:coverage`。
  - **断言**: 整体 Statements 覆盖率 >= 80%，`src/lib/harness` 和 `src/lib/rag` 的函数覆盖率 >= 95%。
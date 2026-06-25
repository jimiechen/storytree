# 任务来源记录 (Task Source Record)

> **⚠️ 重要**: 此文件记录当前任务来源和状态，每次会话必须首先读取

## **当前任务状态**

**最后更新时间**: 2026-06-25
**当前任务来源**: 用户直接反馈（小说编辑器按钮交互割裂，按 PRD 逐页输出文档并修复 P0）
**当前阶段**: PAGE-03 后端阶段 4（端到端真实后端集成验证 + drizzle-orm `.run()` 生产 bug 修复）已完成
**下一步**: 进入 PAGE-04（创建新项目-基本信息）/ 用户确认

---

## 任务来源清单

### 主要任务来源 (按优先级排序)

1. **OpenCode Creative Studio 架构优化路书**
   - 路径: `caiode/docs/tabbit/TabAI会话_1778901717836.md`
   - 状态: 已解析，13份文档已创建/更新
   - 优先级: P0
   - 核心变更: Novel Editor 移出付费插件改为 Core Product、Claude-Code-Style Agent Runtime 架构、Skill/Plugin/Provider 严格区分

2. **Phase 0 路书文档 (13份)**
   - 路径: `docs/roadmap/`
   - 状态: 已完成
   - 优先级: P0

3. **Phase 0 前置工作清单**
   - 路径: `docs/planning/PRE-PHASE0-CHECKLIST.md`
   - 状态: 已完成
   - 优先级: P0

4. **Phase1 任务分解文档 (历史)**
   - 路径: `docs/planning/vscode-oss-integration/phase1-task-breakdown.md`
   - 状态: 单元测试已完成，集成测试待执行
   - 优先级: P2 (历史任务)

---

## 已完成的任务

### 2026-06-21 完成任务

1. **Phase P3-0 Real LLM Readiness 实施**
   - 来源: `caiode/docs/tabbit/06/Phase P30+P3A.md`
   - 任务ID: P3-0-REAL-LLM-READINESS-20260621
   - 状态: ✅ 已完成
   - 结论: `[READY_FOR_P3A_REAL_LLM_PILOT]`
   - 关键提交:
     - `4e7ddf07` chore(novel): prepare real llm adapter readiness
     - `1d62b0c6` docs(novel): update Phase P3-0 report with commit hash
     - `5662a4ab` docs(rules): update task source record for Phase P3-0
     - `c6d6419c` docs(rules): update agent score record for Phase P3-0
     - `66c99ddc` docs(novel): refine Phase P3-0 plan and P2 acceptance doc numbering
     - `3dd770af` docs(rules): fill Phase P3-0 commit hashes in task source record
     - `44148f69` docs(novel): fill all Phase P3-0 commit hashes in report

2. **Phase P3-A Real LLM Adapter Pilot 实施**
   - 来源: `caiode/docs/tabbit/06/Phase P30+P3A.md`
   - 任务ID: P3-A-REAL-LLM-ADAPTER-PILOT-20260621
   - 状态: ✅ 已完成
   - 结论: `[READY_FOR_P3B]`
   - 关键提交:
     - `92db2690` feat(P3-A): add real llm adapter pilot with streaming echo
     - `988254c8` docs(P3-A): add Phase P3-A implementation report
     - `e0a80e72` docs(rules): update task source and score records for Phase P3-A
     - `55f9e11b` docs(P3-A): fill commit hashes in report and rules records
     - `090ae779` docs(P3-A): fill final commit hashes in report and records
     - `360246dd` docs(rules): fill final P3-A commit hashes in records
     - `d858dadd` docs(P3-A): add Phase P3-A implementation plan

3. **Phase P3-B Real LLM UI Continue Integration 实施方案输出**
   - 来源: `caiode/docs/tabbit/06/Phase P30+P3A.md`
   - 任务ID: P3-B-REAL-LLM-UI-CONTINUE-PLAN-20260621
   - 状态: ✅ 已完成
   - 结论: `[READY_FOR_P3B_IMPLEMENTATION]`
   - 方案文档: `docs/task-reports/2026-06-21/PHASE-P3-B-REAL-LLM-UI-CONTINUE-PLAN-20260621.md`
   - 工作空间记录: `workspaces/kimik27code/hellokimik27code.md`

4. **Phase P3-B Real LLM UI Continue Integration 实施**
   - 来源: `caiode/docs/tabbit/06/Phase P30+P3A.md`
   - 任务ID: P3-B-REAL-LLM-UI-CONTINUE-IMPLEMENTATION-20260621
   - 状态: ✅ 已完成
   - 结论: `[READY_FOR_P3C_REAL_LLM_CHAPTER_GENERATION]`
   - 关键提交:
     - `2971437d` feat(novel): P3-B integrate real LLM UI continue writing
     - `829ce41c` docs(novel): update Phase P3-B report and records with commit hash
   - 实施报告: `docs/task-reports/2026-06-21/PHASE-P3-B-REAL-LLM-UI-CONTINUE-IMPLEMENTATION-REPORT-20260621.md`
   - 验证结果: `bun typecheck` 0 errors，`bun test src/novel` 362 pass / 0 fail，`bun run novel:precommit` PASSED

6. **Phase P3-C Real LLM Chapter Generation 实施方案输出**
   - 来源: `caiode/docs/tabbit/06/P3P4P5阶段目标.md#L356-385`
   - 任务ID: P3-C-REAL-LLM-CHAPTER-GENERATION-PLAN-20260621
   - 状态: ✅ 方案已输出，待评审
   - 结论: `[READY_FOR_P3C_IMPLEMENTATION_REVIEW]`
   - 方案文档: `docs/task-reports/2026-06-21/PHASE-P3-C-REAL-LLM-CHAPTER-GENERATION-PLAN-20260621.md`
   - 关键提交:
     - `d337dee5` docs(novel): add Phase P3-C real LLM chapter generation plan

7. **Phase P3-C Real LLM Chapter Generation 实施**
   - 来源: `caiode/docs/tabbit/06/P3P4P5阶段目标.md#L356-385`
   - 任务ID: P3-C-REAL-LLM-CHAPTER-GENERATION-IMPLEMENTATION-20260621
   - 状态: ✅ 已完成
   - 结论: `[READY_FOR_P3D_MODEL_ROUTING_AND_COST_GOVERNANCE]`
   - 关键提交:
     - `dfdd88c9` feat(novel): P3-C real LLM chapter generation with context budget and retry
     - `ee8ce2eb` test(novel): add chapter context assembler tests for P3-C
     - `2b1ddf70` docs(novel): add Phase P3-C implementation report and records
   - 实施报告: `docs/task-reports/2026-06-21/PHASE-P3-C-REAL-LLM-CHAPTER-GENERATION-REPORT-20260621.md`
   - 验证结果: `bun typecheck` 0 errors，`bun test src/novel` 390 pass / 0 fail，`bun run novel:precommit` PASSED（含真实 DeepSeek 调用）

8. **Phase P3-D Model Routing + Cost Governance 实施**
   - 来源: `caiode/docs/tabbit/06/P3P4P5阶段目标.md`
   - 任务ID: P3-D-MODEL-ROUTING-COST-GOVERNANCE-IMPLEMENTATION-20260622
   - 状态: ✅ 已完成
   - 结论: `[READY_FOR_P3_FINAL_REVIEW]` / `[READY_FOR_PHASE_P3_REVIEW]`
   - 方案文档: `docs/task-reports/2026-06-22/PHASE-P3-D-MODEL-ROUTING-COST-GOVERNANCE-PLAN-20260622.md`
   - 实施报告: `docs/task-reports/2026-06-22/PHASE-P3-D-MODEL-ROUTING-COST-GOVERNANCE-REPORT-20260622.md`
   - 验证结果: `bun typecheck` 0 errors，`bun test src/novel` 424 pass / 0 fail / 2 skip，`bun run novel:precommit` PASSED
   - 关键提交:
    - `7b255efb` docs(P3-D): add Phase P3-D model routing and cost governance plan
    - `22d18e55` docs(rules): fill Phase P3-D plan commit hash in task source record
    - `01d70995` feat(P3-D): implement model routing and cost governance

### 2026-06-25 完成任务

1. **PAGE-03 后端阶段 1 实施（建表与路由）**
   - 来源: 用户确认方案，要求"开始实施方案阶段1"
   - 任务ID: PAGE-03-BACKEND-PHASE1-20260625
   - 状态: ✅ 已完成
   - 结论: `[READY_FOR_PHASE_2_FRONTEND_HTTP_PROVIDER]`
   - 验证结果: `bun run typecheck` 0 errors + `bun test src/novel/schema.test.ts` 18 pass / 0 fail
   - 关键提交:
     - `21f6f653` feat(novel): add backend novel project storage with REST API and DB schema（6 files, +609）
   - 新建文件: novel-project.sql.ts（drizzle schema）、schema.ts（zod）、schema.test.ts（18 测试）、server/routes/novel-project.ts（8 API 端点）、migration.sql（建表）
   - 修改文件: server/instance.ts（注册 /novel/project 路由）
   - API 端点: GET /、GET /trash、GET /search、GET /:id、POST /、PATCH /:id、DELETE /:id、POST /:id/restore
   - 工作空间记录: `workspaces/kimik27code/hellokimik27code.md`

2. **PAGE-03 样式修复 + 后端数据存储方案输出**
   - 来源: 用户直接反馈（先修复弹框样式：背景色/字体色/选中字体色，再输出后端数据存储方案）
   - 任务ID: PAGE-03-STYLE-FIX-AND-BACKEND-STORAGE-PLAN-20260625
   - 状态: ✅ 已完成
   - 结论: `[READY_FOR_BACKEND_IMPLEMENTATION_REVIEW]`
   - 方案文档: `docs/task-reports/2026-06-25/PAGE-03-BACKEND-STORAGE-PLAN-20260625.md`
   - 调研报告: `docs/task-reports/2026-06-25/PAGE-03-REAL-DATA-INVESTIGATION-REPORT-20260625.md`
   - 验证结果: `bun run typecheck` 通过（0 errors）
   - 关键提交:
     - `dd70fa1f` fix(PAGE-03): repair invisible modal/input styles and add backend storage plan（3 files, +1102/-33）
   - 样式修复范围: 新建下拉容器、CreateMenuItem（hover 选中色 #6b38d4）、新建按钮、搜索框、ToolbarCircle、删除确认 Modal、撤销/签到 Toast、Skeleton/Error/NoMatch 状态组件
   - 后端方案要点: 新建 `novel_project` 表（SQLite+drizzle）、8 个 REST API 端点（`/novel/project/*`）、FeatureGate 控制 mock→real 迁移、创建项目流程断裂修复方案
   - 工作空间记录: `workspaces/kimik27code/hellokimik27code.md`

2. **PAGE-03 我的书架端到端真实交互实现**
   - 来源: 用户直接反馈（小说编辑器按钮交互割裂，按 PRD 逐页输出文档并修复 P0）
   - 任务ID: PAGE-03-BOOKSHELF-E2E-20260625
   - 状态: ✅ 已完成
   - 结论: `[READY_FOR_PAGE-03_REVIEW]`
   - 页级规范: `caiode/opencode-1.4.0/packages/app/src/novel/docs/page-specs/PAGE-03_bookshelf.md`
   - 验证结果: `bun typecheck` 0 errors，`bun test src/novel` 424 pass / 0 fail / 2 skip，`bun run novel:precommit` PASSED
   - 关键提交:
     - `2fae5976` feat(PAGE-03): 实现我的书架页端到端真实交互（13 files, +1141/-428）
   - 工作空间记录: `workspaces/kimik27code/hellokimik27code.md`
   - 实施范围: 删除 4 个孤立组件、空态 onGuide 修复、4 彩圆 onClick、创建下拉菜单、删除流程+撤销 toast、浮动组件真实数据、三态+300ms 防抖、响应式 4 列

2. **PAGE-03 我的书架 E2E 验收测试与录屏证据**
   - 来源: 用户直接请求（执行 playwright 测试，输出测试证据录屏，验收 PAGE-03_bookshelf.md）
   - 任务ID: PAGE-03-BOOKSHELF-E2E-ACCEPTANCE-20260625
   - 状态: ✅ 已完成
   - 结论: `[READY_FOR_PAGE-03_FINAL_REVIEW]`
   - 验收报告: `docs/task-reports/2026-06-25/PAGE-03-E2E-ACCEPTANCE-REPORT-20260625.md`
   - 验证结果: Playwright E2E 13/13 passed (3.0m) + .last-run.json status=passed + bun typecheck 0 errors + bun test src/novel 424 pass / 0 fail / 2 skip
   - 测试证据: HTML 报告 `e2e/playwright-report/index.html`（含 13 个内嵌 .webm 录屏）+ 17 张关键步骤 PNG 截图
   - 关键提交:
     - `f207736d` test(PAGE-03): add E2E acceptance tests with video evidence and fix three-state bug（3 files, +574/-2）
   - 测试覆盖: TC-BS-001/004/005/006/007/012/013/014/015/016/018/019 + 数据隔离性
   - Bug 修复: 三态渲染逻辑 Bug（搜索无匹配时显示空白 grid）已修复并通过回归测试

3. **PAGE-03 后端阶段 2 实施（前端 HTTP Provider + FeatureGate + 创建项目流程修复）**
   - 来源: 用户要求"继续实施阶段2"
   - 任务ID: PAGE-03-BACKEND-PHASE2-20260625
   - 状态: ✅ 已完成
   - 结论: `[READY_FOR_PHASE_3_E2E_INTEGRATION]`
   - 验证结果: `bun run typecheck` 0 errors + `bun test src/novel` 424 pass / 0 fail / 2 skip / 1211 expect() calls + `bun run novel:precommit` PASSED
   - 关键提交:
     - `22eb113f` feat(novel): PAGE-03 backend phase 2 - HTTP provider + FeatureGate + create project flow fix（6 files, +198/-5）
   - 新建文件: novel-project-http.ts（141 行，HTTP Provider，8 方法）
   - 修改文件: feature-gates.ts（新增 realNovelBackendEnabled）、use-novel-project.ts（Provider 切换 + createProject）、novel-app-shell.tsx（创建项目流程修复）、providers-index.ts（导出）、provider-error.ts（REMOTE_ERROR）
   - 工作空间记录: `workspaces/kimik27code/hellokimik27code.md`

4. **PAGE-03 后端阶段 3 实施（Playwright E2E 测试 + FeatureGate 测试钩子 + 弹框样式 bug 修复）**
   - 来源: 用户要求"继续阶段3"
   - 任务ID: PAGE-03-BACKEND-PHASE3-20260625
   - 状态: ✅ 已完成
   - 结论: `[READY_FOR_PAGE-03_BACKEND_FINAL_REVIEW]`
   - 验证结果: `bun run typecheck` 0 errors + `bun test src/novel` 424 pass / 0 fail / 2 skip / 1211 expect() calls + `bun run novel:precommit` PASSED + `bun test:e2e -- e2e/bookshelf/page-03-backend-integration.spec.ts` 7 passed (2.8m)
   - 新建文件: e2e/bookshelf/page-03-backend-integration.spec.ts（387 行，7 个 E2E 测试用例）
   - 修改文件: use-feature-gates.ts（E2E 测试钩子 window.__NOVEL_BACKEND_ENABLED__）、create-project-modal/index.tsx（修复弹框背景色 bug：bg-white 类因 Tailwind --color-*: initial 无效，改为内联样式）
   - 测试覆盖: TC-BE-001~007（API 调用验证、持久化验证、视觉断言、回收站验证）
   - Bug 修复: 3 个测试 bug（提交按钮选择器误匹配 TAB、弹框背景色查找逻辑、生产代码 bg-white 类无效）
   - 关键提交:
     - `e16fa096` feat(novel): PAGE-03 backend phase 3 - E2E tests + FeatureGate test hook + modal bg fix（5 files, +486/-5）
   - 工作空间记录: `workspaces/kimik27code/hellokimik27code.md`

5. **PAGE-03 后端阶段 4 端到端真实后端集成验证**
   - 来源: 用户要求"PAGE-03 后端阶段 4 — 启动 opencode server + 前端，端到端真实后端集成验证"
   - 任务ID: PAGE-03-BACKEND-PHASE4-20260625
   - 状态: ✅ 已完成
   - 结论: `[READY_FOR_PAGE-04_REVIEW]`
   - 验证结果: `bun run typecheck` 0 errors + `bun test src/novel` 424 pass / 0 fail / 2 skip / 1211 expect() calls + `bun run novel:precommit` PASSED + `bun run test:e2e -- --grep "TC-BE"` 7 passed (2.2m) + 真实 server CRUD 全部通过（端口 4096）
   - 关键 bug 修复: drizzle-orm bun-sqlite `.run()` 缺失 — `db.insert().values()` 和 `db.update().set().where()` 返回查询构建器不执行 SQL，必须链式 `.run()`；4 处 mutation 全部修复（INSERT/UPDATE/DELETE/RESTORE）
   - 真实 CRUD 验证: GET 200 / PATCH 200 / DELETE 204 / 双重删除 404 / 回收站列表 / restore 200
   - 修改文件: novel-project.ts（4 处 `.run()` 添加）
   - 关键提交:
     - `54b5dfe7` fix(novel): add missing .run() to drizzle-orm mutations in novel-project routes（1 file, +6/-4）
   - 工作空间记录: `workspaces/kimik27code/hellokimik27code.md`

### 2026-06-24 完成任务

1. **P3 真实 DeepSeek 端到端验收与测试报告补全**
   - 来源: 用户直接反馈（P3-D 后端到端测试超时无反应、测试报告未更新、无 DeepSeek 日志、看不到续写入口）
   - 任务ID: P3-REAL-DEEPSEEK-E2E-ACCEPTANCE-20260624
   - 状态: ✅ 已完成
   - 结论: `[READY_FOR_PHASE_P3_REVIEW]`
   - 验收报告: `docs/task-reports/2026-06-22/P3-REAL-LLM-MANUAL-TEST-CASES-20260622.md`
   - 验证结果: `bun typecheck` 0 errors，`bun test src/novel` 424 pass / 0 fail / 2 skip，`bun run novel:precommit` PASSED，Playwright E2E 15/15 passed（含真实 DeepSeek 调用与录屏）
   - 关键提交:
     - `9ccd6d98` test(novel): P3 真实 DeepSeek 端到端验收与录屏

5. **Phase P2 总体验收**
   - 来源: `caiode/docs/tabbit/06/P3P4P5阶段目标.md#L882-892`
   - 任务ID: REVIEW-P2-20260621
   - 状态: ✅ 已完成
   - 结论: `[PHASE_P2_REVIEW_ACCEPTED]` / `[APPROVED_FOR_P3_0]` / `[READY_FOR_REAL_LLM_READINESS]`
   - 关键提交:
     - `7bc5211c` feat(novel): P2-E adapter router stubs and commit governance hooks
     - `11f3425c` docs(novel): add Phase P2 Review plan and final acceptance baseline
     - `tbd` docs(novel): add Phase P2 Final Review report

7. **Novel 模块代码评审（9 维度全覆盖）**
   - 来源: 用户直接请求
   - 任务ID: NOVEL-CODE-REVIEW-20260621
   - 状态: ✅ 已完成
   - 结论: `[READY_FOR_REVIEW]`（评审通过附条件，P0 问题须在 P3-B 启动前修复）
   - 评审文档: `docs/reviews/2026-06-21/NOVEL-CODE-REVIEW-20260621.md`
   - 工作空间记录: `workspaces/glm52/helloglm52.md`
   - 关键提交:
     - `9526c423` docs(reviews): add Novel module code review report for Phase P3-A
   - 评审范围: 基础架构/模块依赖/调用链/数据流/通讯方式/状态管理/安全/边界/代码质量
   - 发现问题: 2 高风险 + 5 中风险 + 4 低风险
   - 改进建议: 28 条（P0-P3 优先级分级）

### 2026-05-15 完成任务

1. **Phase 0 前置工作清单准备**
   - 来源: `TabAI会话_1778857995607.md`
   - 任务ID: PRE-PHASE0-20260515
   - 状态: ✅ 已完成

2. **Phase 0 初始路书文档创建 (6份)**
   - 来源: `TabAI会话_1778857995607.md`
   - 任务ID: DOC-PHASE0-002 ~ DOC-PHASE0-007
   - 状态: ✅ 已完成

3. **Phase 0 架构优化路书文档创建/更新 (13份)**
   - 来源: `TabAI会话_1778901717836.md`
   - 任务ID: DOC-PHASE0-002 ~ DOC-PHASE0-014
   - 状态: ✅ 已完成
   - 完成内容:
     - **更新文档 (6份)**:
       - `PRODUCT-ROADMAP-PLUGIN-FIRST.md` v2.0 — Novel Editor Core + Skill Loader
       - `PLUGIN-ARCHITECTURE.md` v2.0 — Creative Agent Runtime 架构
       - `COMMERCIAL-PLUGIN-MODEL.md` v2.0 — Novel 移出付费插件
       - `TWO-YEAR-DEVELOPMENT-PLAN.md` v2.0 — 阶段调整
       - `MODULE-PRICING-STRATEGY.md` v2.0 — 定价调整
       - `FIRST-30-DAYS-ACTION-PLAN.md` v2.0 — 30天计划调整
     - **新建文档 (7份)**:
       - `CLAUDE-CODE-SRC-ARCHITECTURE-BASELINE.md` — claude-code-src 模块分析
       - `CREATIVE-AGENT-RUNTIME-ARCHITECTURE.md` — 11个核心模块接口定义
       - `CREATIVE-CORE-ARCHITECTURE.md` — Creative Core 业务抽象层
       - `SKILL-DEFINITION-AND-USAGE.md` — Skill 定义与使用规范
       - `PLUGIN-RUNTIME-SPEC.md` — Plugin Runtime 规范
       - `PLUGIN-LOAD-AND-LICENSE-FLOW.md` — 插件加载与 License 流程
       - `NOVEL-EDITOR-AS-CORE-PRODUCT.md` — Novel Editor Core 定位

### 2026-04-09 完成任务 (历史)

1. **Phase1 单元测试实现**
   - 任务ID: TEST-PHASE1-UNIT
   - 状态: ✅ 已完成
   - 测试数: 68个全部通过

2. **Phase1 核心模块实现与文档更新**
   - 任务ID: T-PHASE1-20260409
   - 状态: ✅ 已完成

---

## 待执行任务

### Phase 0 核心任务 (当前阶段)

#### 文档任务 (全部完成)

- [x] **DOC-PHASE0-001** 创建 `docs/roadmap/` 目录 ✅
- [x] **DOC-PHASE0-002** `PRODUCT-ROADMAP-PLUGIN-FIRST.md` v2.0 ✅
- [x] **DOC-PHASE0-003** `PLUGIN-ARCHITECTURE.md` v2.0 ✅
- [x] **DOC-PHASE0-004** `COMMERCIAL-PLUGIN-MODEL.md` v2.0 ✅
- [x] **DOC-PHASE0-005** `TWO-YEAR-DEVELOPMENT-PLAN.md` v2.0 ✅
- [x] **DOC-PHASE0-006** `MODULE-PRICING-STRATEGY.md` v2.0 ✅
- [x] **DOC-PHASE0-007** `FIRST-30-DAYS-ACTION-PLAN.md` v2.0 ✅
- [x] **DOC-PHASE0-008** `CLAUDE-CODE-SRC-ARCHITECTURE-BASELINE.md` ✅
- [x] **DOC-PHASE0-009** `CREATIVE-AGENT-RUNTIME-ARCHITECTURE.md` ✅
- [x] **DOC-PHASE0-010** `CREATIVE-CORE-ARCHITECTURE.md` ✅
- [x] **DOC-PHASE0-011** `SKILL-DEFINITION-AND-USAGE.md` ✅
- [x] **DOC-PHASE0-012** `PLUGIN-RUNTIME-SPEC.md` ✅
- [x] **DOC-PHASE0-013** `PLUGIN-LOAD-AND-LICENSE-FLOW.md` ✅
- [x] **DOC-PHASE0-014** `NOVEL-EDITOR-AS-CORE-PRODUCT.md` ✅

#### 研发任务 (Phase 0)

- [ ] **DEV-PHASE0-001** 实现 CreativeQueryEngine
  - 角色：VS Code 插件架构师
  - 优先级：P0
  - 截止：第 1 周末
  - 产出：packages/app/src/core/creative-query-engine/

- [ ] **DEV-PHASE0-002** 实现 AgentLoop
  - 角色：VS Code 插件架构师
  - 优先级：P0
  - 截止：第 1 周末
  - 产出：packages/app/src/core/agent-loop/

- [ ] **DEV-PHASE0-003** 实现 CreativeContextBuilder
  - 角色：VS Code 插件架构师
  - 优先级：P0
  - 截止：第 1 周末

- [ ] **DEV-PHASE0-004** 实现 TaskRuntime
  - 角色：Node.js 后端工程师
  - 优先级：P0
  - 截止：第 1 周末

- [ ] **DEV-PHASE0-005** 实现 ToolRuntime
  - 角色：Node.js 后端工程师
  - 优先级：P0
  - 截止：第 1 周末

- [ ] **DEV-PHASE0-006** 实现 SkillLoader
  - 角色：Node.js 后端工程师
  - 优先级：P0
  - 截止：第 2 周末

- [ ] **DEV-PHASE0-007** 实现 PluginRuntime
  - 角色：VS Code 插件架构师
  - 优先级：P0
  - 截止：第 1 周末

- [ ] **DEV-PHASE0-008** 实现 HookPipeline
  - 角色：Node.js 后端工程师
  - 优先级：P1
  - 截止：第 2 周末

- [ ] **DEV-PHASE0-009** 实现 CommandRegistry
  - 角色：Node.js 后端工程师
  - 优先级：P1
  - 截止：第 2 周末

- [ ] **DEV-PHASE0-010** 实现 StateStore
  - 角色：Node.js 后端工程师
  - 优先级：P0
  - 截止：第 1 周末

- [ ] **DEV-PHASE0-011** 实现 CostTracker
  - 角色：Node.js 后端工程师
  - 优先级：P1
  - 截止：第 2 周末

- [ ] **DEV-PHASE0-012** 实现 Novel Editor Core
  - 角色：前端工程师
  - 优先级：P0
  - 截止：第 3 周末
  - 产出：Novel Editor 页面 + 数据模型

- [ ] **DEV-PHASE0-013** 实现 Mock License Gate
  - 角色：Node.js 后端工程师
  - 优先级：P0
  - 截止：第 1 周末

- [ ] **DEV-PHASE0-014** 实现 Mock Provider (LLM/Image/Video)
  - 角色：Node.js 后端工程师
  - 优先级：P0
  - 截止：第 2 周末

### 环境配置修复任务 (历史遗留)

- [ ] DEV-ENV-001 安装缺失依赖（@tailwindcss/postcss、proper-lockfile、retry）
- [ ] DEV-ENV-002 修复 TypeScript 类型错误（MockFileMutex locks 属性）
- [ ] DEV-ENV-003 修复 LockHandle 类型定义
- [ ] DEV-ENV-004 修复 SkillRegistry 重复导出问题

### 作废任务（cancelled）

- [-] DEV-1.4.1 插件配置页面 Settings UI（原 dreamweaver 前端）
- [-] DEV-1.5.1 实现 VS Code 扩展打包脚本（依赖旧前端，暂缓）
- [-] 所有 dreamweaver/ 目录下的前端开发任务
- [-] FE-OP-001 ~ ARCH-OP-001 (旧 opencode 调研任务，已被新路书覆盖)

---

## 新增任务（基于架构优化路书）

### 核心原则

- **Novel Editor Core** 是免费 Core Product，不是付费插件
- **Creative Agent Runtime** 是底层执行内核，负责 Agent 怎么运行
- **Creative Core** 是业务抽象层，负责创作项目怎么管理
- **Skill** 是 Agent 按需加载的 SKILL.md 任务说明包
- **Plugin** 是产品模块和商业模块
- **Provider** 是外部服务适配器
- **Tool** 是 Agent 可调用的具体执行动作

### 关键约束

- 禁止把 Skill 写成 Plugin
- 禁止把 OpenRouter 写成 Skill
- 禁止让 UI 直接调用插件生成逻辑
- 任务必须通过 Task Runtime 运行
- 任务过程中通过 Skill 指导 Agent 调用 Plugin Capability

---

## 任务获取流程

### 下次会话开始时的操作顺序

1. **读取扣分档案** (第一优先级)
   ```
   Read c:\projects\storytree\.trae\rules\agent-score-record.md
   ```

2. **读取任务来源记录** (第二优先级)
   ```
   Read c:\projects\storytree\.trae\rules\task-source-record.md
   ```

3. **检查路书文档** (第三优先级)
   ```
   Read c:\projects\storytree\docs\roadmap\CREATIVE-AGENT-RUNTIME-ARCHITECTURE.md
   Read c:\projects\storytree\docs\roadmap\FIRST-30-DAYS-ACTION-PLAN.md
   ```

4. **确认当前任务**
   - 根据任务状态确定下一步任务
   - 向用户确认任务来源

---

## 任务状态标记

| 标记 | 含义 | 操作 |
|------|------|------|
| `[ ]` | 待开始 | 可以领取执行 |
| `[~]` | 进行中 | 正在执行中 |
| `[x]` | 已完成 | 已完成并通过测试 |
| `[-]` | 已阻塞 | 有依赖或其他问题 |

---

## 签名确认

**Agent**: Kimi-K2.6
**确认日期**: 2026-05-15
**当前任务来源**: TabAI会话_1778901717836.md
**下一步**: 按新架构启动 Creative Agent Runtime 实现

---

*每次会话开始时必须首先读取此文件和 agent-score-record.md*

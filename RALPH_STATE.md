# Ralph 项目状态 (Project State)

<!-- 
AI 指令: 
1. 本文件是 Ralph 项目的**唯一事实来源 (Source of Truth)**，任何状态变更必须同步更新此文件。
2. **生命周期**: 必须遵循 Planning (3 Rounds) -> Implementation -> Testing 的标准流程。
3. **顺序强制**: 在开发与测试阶段，必须严格按照 `04-ralph-tasks.md` 和 `05-test-plan.md` 中的列表物理顺序执行，**严禁跳跃**或乱序执行。
4. **状态维护**: 每次 Skill 执行结束，必须更新此文件中的进度条 (Progress) 和状态 (Status)。
-->

> **当前上下文 (Current Context)**: dreamweaver-v2-knowledge-ai 已完成，正式进入 dreamweaver-v3-advanced-narrative 迭代。
> **迭代名称 (Iteration)**: dreamweaver-v3-advanced-narrative
> **开发模式**: Harness Engineering + TDD + 多分支与 RAG 真实架构演进

## 1. 规划阶段 (Planning Phase)
> **目标**: 在编码前通过 3 轮迭代完善需求与架构。

| 轮次 (Round) | 步骤 1: 草稿 (Draft) | 步骤 2: 自查 (Critique) | 步骤 3: 调研 (Research) | 步骤 4: 推演 (Simulation) | 步骤 5: 锁定 (Lock) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Round 1** (MVP v1) | ✅ 完成 | ✅ 完成 | ✅ 完成 | ✅ 完成 | ✅ 完成 |
| **Round 1** (V2) | ✅ 完成 | ✅ 完成 | ✅ 完成 | ✅ 完成 | ✅ 完成 |
| **Round 1** (V3) | ✅ 完成 | ⏳ 待定 | ⏳ 待定 | ⏳ 待定 | ⏳ 待定 |
| **Round 2** (V3) | ⏳ 待定 | ⏳ 待定 | ⏳ 待定 | ⏳ 待定 | ⏳ 待定 |
| **Round 3** (V3) | ⏳ 待定 | ⏳ 待定 | ⏳ 待定 | ⏳ 待定 | ⏳ 待定 |

### Round 1 (V3) 完成内容
- ✅ 创建 `01-progress-comparison.md` - V3 进度对比与差距分析
- ✅ 创建 `02-architecture-v3.md` - V3 架构演进方案 (Harness & RAG)
- ✅ 创建 `03-execution-plan.md` - V3 执行计划 (多分支叙事)
- ✅ 创建 `04-ralph-tasks.md` - V3 开发任务清单
- ✅ 创建 `05-test-plan.md` - V3 验收测试计划
- ✅ 创建 `06-learnings.md` - V3 迭代学习与经验总结

## 2. 开发阶段 (Implementation Phase)
> **目标**: 严格按顺序执行开发任务。
> **⚠️ 执行铁律**: 必须严格按照 `04-ralph-tasks.md` 中的列表顺序执行任务。**严禁跳跃**或乱序执行。
> **TDD 铁律**: 先写测试(Red) -> 再写实现(Green) -> 运行测试 -> 重构(Refactor)

- **状态**: 🔄 进行中 (Sprint 0: UI Polish)
- **进度**: **0 / 17 任务完成 (0%)**
- **引用**: `docs/planning/dreamweaver-v3-advanced-narrative/04-ralph-tasks.md`

### Sprint 0: UI 视觉与布局差异修复 (UI Polish) ✅ 已完成
- [x] **T-UI-FIX-001**: 修复 P1/P2 轻微样式与视觉偏差
- [x] **T-UI-FIX-002**: 修复 P0 项目主页全局布局缺失
- [x] **T-UI-FIX-003**: 修复 P0 大纲管理视图降级
- [x] **T-UI-FIX-004**: 修复 P0 分支树形图静态化
- [x] **T-UI-FIX-005**: 核心业务链路串联验证 (E2E)

### Sprint 1: Harness 工程基础设施 (Harness Foundation) ⏳ 待定
- [ ] **T-HAR-001**: 建立 Context Manager 与 Compaction 雏形
- [ ] **T-HAR-002**: 实现 Prompt Cache Harness (基于 AI SDK)

### Sprint 2: 知识库 RAG 检索 (Knowledge Retrieval) ⏳ 待定
- [ ] **T-RAG-001**: 向量存储架构选型与 Prisma 扩展
- [ ] **T-RAG-002**: 实体数据 Ingestion (写入向量库)
- [ ] **T-RAG-003**: 智能检索与上下文注入 (Retrieval & Injection)

### Sprint 3: 多分支叙事系统 (Branching Narrative) ⏳ 待定
- [ ] **T-BRN-001**: Prisma 分支模型设计与迁移
- [ ] **T-BRN-002**: 工作台分支 UI 组件与状态
- [ ] **T-BRN-003**: 分支切换与编辑器联动
- [ ] **T-BRN-004**: 基于 AI 的“假设推演”交互 (What-if Execution)

### Sprint 4: 质量门禁与性能调优 (QA & Tuning) ⏳ 待定
- [ ] **T-QA-001**: 全链路回归测试与缺陷修复
- [ ] **T-QA-002**: 性能基准与首字延迟优化

## 3. 质量基准与规范 (Quality Standards & Baselines)

### 3.1 测试覆盖率要求
- **单元测试 (Vitest)**: 
  - 整体语句覆盖率 (Statements)、分支覆盖率 (Branches)、函数覆盖率 (Functions) **>= 80%**。
  - 核心状态管理 (Zustand Stores) 和核心业务 Utils 函数的覆盖率必须 **>= 95%**。
- **E2E 测试 (Playwright)**: 
  - 必须覆盖 **100%** 的 P0 核心用户链路。

### 3.2 性能基准指标
- **核心 Web Vitals (前端)**:
  - LCP (Largest Contentful Paint) **< 1.5s**
  - FID (First Input Delay) **< 100ms**
  - CLS (Cumulative Layout Shift) **< 0.1**
- **AI 流式响应**: 首字响应时间 **< 500ms**，流式传输流畅无卡顿

### 3.3 持续集成 (CI/CD) 流程规范
- **Pre-commit 阶段**: 强制执行 Husky 钩子，运行 ESLint 检查、Prettier 格式化和局部 TypeScript 类型检查。
- **Pull Request 阶段**:
  - 自动运行 Vitest 全量单元测试。
  - 自动运行 Playwright E2E 测试（Headless 模式）。
  - 任何测试失败或覆盖率低于基准线，则直接拦截合并请求。

## 4. 测试阶段 (Testing Phase)
> **目标**: 确保所有功能满足验收标准，通过所有用例。
> **⚠️ 执行铁律**: 必须严格按照 `05-test-plan.md` 中的列表顺序执行测试。**严禁跳跃**或乱序执行。

- **状态**: ⏸ 待开始
- **进度**: 0 / 10 测试通过 (0%)
- **引用**: `docs/planning/dreamweaver-v3-advanced-narrative/05-test-plan.md`

### 测试用例清单
| 类别 | 通过 | 失败 | 跳过 | 通过率 |
|------|------|------|------|--------|
| Harness与RAG (TC-RAG) | 0 | 0 | 3 | 0% |
| 多分支系统 (TC-BRN) | 0 | 0 | 4 | 0% |
| 性能与回归门禁 (TC-QA) | 0 | 0 | 3 | 0% |

## 5. 质量门禁标准 (Quality Gates)
在完成 V3 迭代前，必须通过以下强制门禁：
1. **缺陷清零**: 无 P0/P1 级别的功能性崩溃、渲染白屏或安全性 Bug。 ⏳
2. **测试全通过**: E2E 和 Unit 测试 **100% Pass**。 ⏳
3. **覆盖率达标**: 满足 3.1 定义的 80% / 95% 覆盖率红线。 ⏳
4. **类型安全**: TypeScript `strict` 模式全量检查 **0 Error**。 ⏳
5. **性能达标**: Prompt Cache 启用后，同章节多次对话首字延迟明显优化。 ⏳

## 6. 关键风险与注意事项

### ⚠️ 风险 1: AI 模型密钥管理
- **状态**: 🔄 待解决
- **描述**: API Key 的存储方案需在 T-AI-001 前确定
- **方案**: 使用 Next.js Environment Variables + `.env.local`

### ⚠️ 风险 2: 流式响应错误处理
- **状态**: 🔄 待解决
- **描述**: 网络中断/模型服务不可用的降级方案
- **方案**: 在 T-AI-002 中增加重试机制和错误边界 UI

### ⚠️ 风险 3: 上下文长度限制
- **状态**: 🔄 待解决
- **描述**: 长章节可能超出 LLM 上下文窗口
- **方案**: 在 T-AI-003 中增加上下文截断或摘要策略

## 7. 项目交付 (Project Delivery)
- **最终审查**: ⏳ 待开始
- **用户验收**: ⏳ 待开始

---

## 关键变更记录

### 2026-04-06: 进入 V3 迭代 (dreamweaver-v3-advanced-narrative)
- ✅ V2 全部 15 个任务完成，测试 100% 覆盖通过
- ✅ V3 规划文档评审通过 (多分支叙事 + RAG)
- 🔄 准备进入 V3 Sprint 1: Harness 工程基础设施
- 📋 当前任务: T-HAR-001 建立 Context Manager 与 Compaction 雏形

### 2026-04-05: 进入 V2 迭代 (dreamweaver-v2-knowledge-ai)
- ✅ MVP v1 全部 37 个任务完成
- ✅ V2 规划文档评审通过
- 🔄 进入 V2 Sprint 1: 知识资产系统开发
- 📋 当前任务: T-KNOW-001 结构化资产状态管理

### 2026-04-05: V2 规划文档完成
- ✅ 进度对比与差距分析 (01-progress-comparison.md)
- ✅ 架构演进方案 (02-architecture-v2.md)
- ✅ 执行计划 (03-execution-plan.md)
- ✅ 开发任务清单 (04-ralph-tasks.md)
- ✅ 验收测试计划 (05-test-plan.md)

### 2026-04-05: MVP v1 完成交付
- ✅ 全量单元测试执行完成
- ✅ 全量 E2E 测试执行完成 (39/43 通过)
- ✅ TypeScript 类型检查通过
- ✅ ESLint 检查通过
- ✅ 代码审查完成

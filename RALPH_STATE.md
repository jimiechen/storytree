# Ralph 项目状态 (Project State)

<!-- 
AI 指令: 
1. 本文件是 Ralph 项目的**唯一事实来源 (Source of Truth)**，任何状态变更必须同步更新此文件。
2. **生命周期**: 必须遵循 Planning (3 Rounds) -> Implementation -> Testing 的标准流程。
3. **顺序强制**: 在开发与测试阶段，必须严格按照 `04-ralph-tasks.md` 和 `05-test-plan.md` 中的列表物理顺序执行，**严禁跳跃**或乱序执行。
4. **状态维护**: 每次 Skill 执行结束，必须更新此文件中的进度条 (Progress) 和状态 (Status)。
-->

> **当前上下文 (Current Context)**: dreamweaver-mvp-v1 已完成，准备进入 dreamweaver-v2-knowledge-ai
> **迭代名称 (Iteration)**: dreamweaver-v2-knowledge-ai
> **开发模式**: UI优先 + Mock接口 + TDD模式 + 真实AI引擎集成

## 1. 规划阶段 (Planning Phase)
> **目标**: 在编码前通过 3 轮迭代完善需求与架构。

| 轮次 (Round) | 步骤 1: 草稿 (Draft) | 步骤 2: 自查 (Critique) | 步骤 3: 调研 (Research) | 步骤 4: 推演 (Simulation) | 步骤 5: 锁定 (Lock) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Round 1** (MVP v1) | ✅ 完成 | ✅ 完成 | ✅ 完成 | ✅ 完成 | ✅ 完成 |
| **Round 1** (V2) | ✅ 完成 | ✅ 完成 | ✅ 完成 | ✅ 完成 | ✅ 完成 |
| **Round 2** (V2) | ⏳ 待定 | ⏳ 待定 | ⏳ 待定 | ⏳ 待定 | ⏳ 待定 |
| **Round 3** (V2) | ⏳ 待定 | ⏳ 待定 | ⏳ 待定 | ⏳ 待定 | ⏳ 待定 |

### Round 1 (V2) 完成内容
- ✅ 创建 `01-progress-comparison.md` - 进度对比与差距分析
- ✅ 创建 `02-architecture-v2.md` - V2 架构演进方案
- ✅ 创建 `03-execution-plan.md` - V2 执行计划
- ✅ 创建 `04-ralph-tasks.md` - V2 开发任务清单
- ✅ 创建 `05-test-plan.md` - V2 验收测试计划

## 2. 开发阶段 (Implementation Phase)
> **目标**: 严格按顺序执行开发任务。
> **⚠️ 执行铁律**: 必须严格按照 `04-ralph-tasks.md` 中的列表顺序执行任务。**严禁跳跃**或乱序执行。
> **TDD 铁律**: 先写测试(Red) -> 再写实现(Green) -> 运行测试 -> 重构(Refactor)

- **状态**: 🔄 开发阶段进行中
- **进度**: **1 / 15 任务完成 (6.7%)**
- **引用**: `docs/planning/dreamweaver-v2-knowledge-ai/04-ralph-tasks.md`

### Sprint 1: 知识资产系统 🔄 进行中
- [x] **T-KNOW-001**: 结构化资产状态管理
- [ ] **T-KNOW-002**: 知识库 Mock API 编写
- [ ] **T-KNOW-003**: 知识库页面骨架与侧边栏入口
- [ ] **T-KNOW-004**: 角色管理列表与表单组件
- [ ] **T-KNOW-005**: 世界观设定列表与表单组件

### Sprint 2: AI 引擎破冰集成 ⏳ 待开始
- [ ] **T-AI-001**: 服务端 AI 路由搭建
- [ ] **T-AI-002**: AI 面板流式会话交互
- [ ] **T-AI-003**: 上下文自动注入逻辑
- [ ] **T-AI-004**: 编辑器划词 AI 辅助

### Sprint 3: 真实后端迁移准备 ⏳ 待开始
- [ ] **T-DB-001**: 数据库 Schema 设计与 Prisma 初始化
- [ ] **T-DB-002**: 项目与章节 API Route 实现
- [ ] **T-DB-003**: 认证网关与双轨控制环境变量
- [ ] **T-DB-004**: V2 阶段全量集成测试与代码审查

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
- **状态**: ⏳ 待开始
- **进度**: 0 / 14 测试通过 (0%)
- **引用**: `docs/planning/dreamweaver-v2-knowledge-ai/05-test-plan.md`

### 测试用例清单
| 类别 | 通过 | 失败 | 跳过 | 通过率 |
|------|------|------|------|--------|
| 知识库模块 (TC-KNOW) | 0 | 0 | 5 | 0% |
| AI 引擎交互 (TC-AI) | 0 | 0 | 4 | 0% |
| 真实后端迁移 (TC-DB) | 0 | 0 | 3 | 0% |

## 5. 质量门禁标准 (Quality Gates)
在完成 V2 迭代前，必须通过以下强制门禁：
1. **缺陷清零**: 无 P0/P1 级别的功能性崩溃、渲染白屏或安全性 Bug。 ⏳
2. **测试全通过**: E2E 和 Unit 测试 **100% Pass**。 ⏳
3. **覆盖率达标**: 满足 3.1 定义的 80% / 95% 覆盖率红线。 ⏳
4. **类型安全**: TypeScript `strict` 模式全量检查 **0 Error**。 ⏳
5. **性能达标**: 核心交互页面满足 3.2 定义的性能基准。 ⏳

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

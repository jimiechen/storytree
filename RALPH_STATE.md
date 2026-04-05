# Ralph 项目状态 (Project State)

<!-- 
AI 指令: 
1. 本文件是 Ralph 项目的**唯一事实来源 (Source of Truth)**，任何状态变更必须同步更新此文件。
2. **生命周期**: 必须遵循 Planning (3 Rounds) -> Implementation -> Testing 的标准流程。
3. **顺序强制**: 在开发与测试阶段，必须严格按照 `04-ralph-tasks.md` 和 `05-test-plan.md` 中的列表物理顺序执行，**严禁跳跃**或乱序执行。
4. **状态维护**: 每次 Skill 执行结束，必须更新此文件中的进度条 (Progress) 和状态 (Status)。
-->

> **当前上下文 (Current Context)**: 测试修复与质量加固阶段 (Test Infrastructure Repair & Quality Hardening)
> **迭代名称 (Iteration)**: dreamweaver-mvp-v1
> **开发模式**: UI优先 + Mock接口 + TDD模式 -> 演进至 真实服务端接入准备

## 1. 规划阶段 (Planning Phase)
> **目标**: 在编码前通过 3 轮迭代完善需求与架构。

| 轮次 (Round) | 步骤 1: 草稿 (Draft) | 步骤 2: 自查 (Critique) | 步骤 3: 调研 (Research) | 步骤 4: 推演 (Simulation) | 步骤 5: 锁定 (Lock) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Round 1** (基线) | ✅ 完成 | ⏳ 待定 | ⏳ 待定 | ⏳ 待定 | ⏳ 待定 |
| **Round 2** (修订) | ⏳ 待定 | ⏳ 待定 | ⏳ 待定 | ⏳ 待定 | ⏳ 待定 |
| **Round 3** (终定) | ⏳ 待定 | ⏳ 待定 | ⏳ 待定 | ⏳ 待定 | ⏳ 待定 |

### Round 1 完成内容
- ✅ 创建 `01-requirements.md` - 产品需求文档
- ✅ 创建 `02-architecture.md` - 系统架构设计
- ✅ 创建 `04-ralph-tasks.md` - 开发任务列表
- ✅ 创建 `05-test-plan.md` - 测试计划
- ✅ 创建 `06-learnings.md` - 经验总结模板

## 2. 开发阶段 (Implementation Phase)
> **目标**: 严格按顺序执行开发任务。
> **⚠️ 执行铁律**: 必须严格按照 `04-ralph-tasks.md` 中的列表顺序执行任务。**严禁跳跃**或乱序执行。
> **TDD 铁律**: 先写测试(Red) -> 再写实现(Green) -> 运行测试 -> 重构(Refactor)

- **状态**: 🔄 测试修复进行中 (Reopened for Test Fixes)
- **进度**: **33 / 37 任务完成 (89%)** (因假阳性回退部分任务状态)
- **引用**: `docs/planning/dreamweaver-mvp-v1/04-ralph-tasks.md`

### Phase 1-3: 基础工程与前置模块 ✅ 已完成
- 基础工程、Mock服务搭建 (Phase 1)
- 认证模块 (Phase 2)
- 项目管理模块 (Phase 3)

### Phase 4: 写作工作台模块 (TDD模式) 🔄 待修复
- [x] 4.1.1 编写编辑器组件单元测试 (Red)
- [x] 4.1.2 集成 TipTap 编辑器 (Green)
- [x] 4.1.3 运行测试验证 (Green)
- [ ] 4.2.1 编写章节导航 E2E 测试 (Red) - **[阻塞: 需修复测试框架假阳性]**
- [ ] 4.2.2 实现章节导航组件 (Green)
- [ ] 4.2.3 运行测试验证 (Green)
- [ ] 4.3.1 编写工作台 E2E 测试 (Red)
- [ ] 4.3.2 实现写作工作台页面 (Green)
- [ ] 4.3.3 运行测试验证 (Green)
- [ ] 4.4.1 编写 AI 对话面板单元测试 (Red)
- [ ] 4.4.2 实现 AI 对话面板 (Green)
- [ ] 4.4.3 运行测试验证 (Green)
- [ ] 4.5.1 完善章节管理 Mock API

### Phase 5: 集成测试与验收 ⏳ 待开始
- [ ] 5.1.1 运行全量单元测试
- [ ] 5.1.2 运行全量 E2E 测试
- [ ] 5.2.1 TypeScript 类型检查
- [ ] 5.2.2 ESLint 检查
- [ ] 5.2.3 代码审查

## 3. 测试框架修复方案 (Test Infrastructure Repair Plan)
> **问题背景**: 当前 Playwright 测试框架存在假阳性（用例实际执行失败，如 `expect is not defined` 或渲染崩溃，但报告错误地统计为成功），导致 TDD 流程失效。

### 3.1 重新设计测试用例结构
- **POM (Page Object Model) 强制规范**: 页面元素定位器和操作必须封装在 `src/pages` 下的 Page 类中，测试文件（`.spec.ts`）仅保留测试意图和业务断言逻辑，严禁在用例中硬编码 DOM 结构。
- **状态隔离与重置**: 每个测试用例 (`test`) 必须在独立上下文中运行，通过 `beforeEach` 钩子重置 MSW 的 mock handlers，确保用例间数据互不污染。

### 3.2 修正断言逻辑
- **全局依赖修复**: 全面检查并修复所有测试辅助文件（如 `RegisterPage.ts`, `LoginPage.ts`），确保顶部正确导入 `import { test, expect } from '@playwright/test';`。
- **异步断言修复**: Playwright 的 `expect` 针对 Locator 的断言必须配合 `await` 使用（如 `await expect(locator).toBeVisible()`），避免同步执行导致 Promise 未决而提前误判成功。
- **未捕获错误拦截**: 增加全局页面错误监听 (`page.on('pageerror', ...)`)，任何 JS 运行时崩溃（如 `map is not a function`）必须直接使当前测试用例 Failed。

### 3.3 完善 Mock 数据与真实接口的映射关系
- **契约严格对齐**: 基于真实服务端的 API 蓝图（Swagger/OpenAPI），统一并锁定 `src/types/api.ts` 中的 TypeScript 接口定义。
- **Mock 响应校验**: MSW 的 handlers 必须返回完全符合 `ApiResponse<T>` 类型结构的数据，包括准确的 HTTP 状态码、错误码枚举 (`code`) 和标准化的数据包裹层 (`data`)。
- **异常场景模拟**: 在 MSW 中补充完整的网络异常、Token 过期、权限不足等边界场景的 Mock 逻辑，确保前端异常处理链路闭环。

### 3.4 建立准确的测试结果统计机制
- **严格退出码 (Strict Exit Codes)**: 配置 Playwright 在发现任何 `failed`, `flaky` 或 `timedOut` 的测试时，强制返回非 0 的 exit code，直接阻断 CI 流程。
- **报告生成与存档**: 启用 Playwright 的 HTML Reporter 和 JSON Reporter，并保留失败用例的 Trace、Video 和 Screenshot 产物，提供准确的错误上下文。

## 4. 质量基准与规范 (Quality Standards & Baselines)

### 4.1 测试覆盖率要求
- **单元测试 (Vitest)**: 
  - 整体语句覆盖率 (Statements)、分支覆盖率 (Branches)、函数覆盖率 (Functions) **>= 80%**。
  - 核心状态管理 (Zustand Stores 如 auth-store, project-store) 和核心业务 Utils 函数的覆盖率必须 **>= 95%**。
- **E2E 测试 (Playwright)**: 
  - 必须覆盖 **100%** 的 P0 核心用户链路（包含：注册登录闭环、项目创建与列表加载、工作台章节切换、内容编辑与防抖保存）。

### 4.2 性能基准指标
- **核心 Web Vitals (前端)**:
  - LCP (Largest Contentful Paint) **< 1.5s**
  - FID (First Input Delay) **< 100ms**
  - CLS (Cumulative Layout Shift) **< 0.1**
- **API 响应预期**: Mock 接口响应时间通过 `delay()` 设定在 **50-200ms** 之间，真实模拟网络延迟并验证 UI 的 Loading 状态。
- **测试执行效率**: E2E 全量回归测试时间 **< 5 分钟**（在 CI 中开启多 worker 并行）。

### 4.3 持续集成 (CI/CD) 流程规范
- **Pre-commit 阶段**: 强制执行 Husky 钩子，运行 ESLint 检查、Prettier 格式化和局部 TypeScript 类型检查。
- **Pull Request 阶段**:
  - 自动运行 Vitest 全量单元测试。
  - 自动运行 Playwright E2E 测试（Headless 模式）。
  - 任何测试失败或覆盖率低于基准线，则直接拦截合并请求。
- **Merge to Main 阶段**: 触发生产/测试环境的构建与自动化部署流程。

## 5. Mock 到真实服务端迁移计划 (Migration Plan)

> **实施策略**: 采用环境变量控制的"双轨制"灰度迁移，在不中断前端开发进度的情况下平滑接入。

- **Phase A: 契约对齐与开关预埋 (当前阶段)**
  - 引入全局环境变量 `NEXT_PUBLIC_API_MOCKING=true/false`。
  - 在应用入口 (`src/mocks/browser.ts` 或布局层) 判断该变量，仅在为 `true` 时启动 MSW 服务。
- **Phase B: 局部联调接入 (模块化灰度)**
  - 后端提供可用的联调环境后，配置本地代理 (`next.config.ts` 的 `rewrites`) 解决跨域。
  - 按业务模块顺序（认证 -> 项目管理 -> 写作工作台）逐个关闭对应的 MSW Mock Handler，将前端请求直接打向真实联调接口。
- **Phase C: E2E 测试环境切换**
  - 在 CI 中配置独立的 Staging 阶段，设置 `NEXT_PUBLIC_API_MOCKING=false`。
  - 使用预置好种子数据的真实数据库和服务端环境运行全量 Playwright E2E 测试，验证前后端集成质量。
- **Phase D: 生产环境部署**
  - 完全移除客户端生产构建包中的 MSW 依赖，对接线上真实域名，上线发布。

## 6. 质量门禁标准 (Quality Gates)
在完成本轮 MVP 迭代或进行真实接口迁移前，必须通过以下强制门禁：
1. **缺陷清零**: 无 P0/P1 级别的功能性崩溃、渲染白屏或安全性 Bug。
2. **测试全通过**: E2E 和 Unit 测试 **100% Pass**，杜绝任何假阳性，并附带可追溯的测试报告。
3. **覆盖率达标**: 满足 4.1 定义的 80% / 95% 覆盖率红线。
4. **类型安全**: TypeScript `strict` 模式全量检查 **0 Error**。
5. **性能达标**: 核心交互页面满足 4.2 定义的 Web Vitals 性能基准。

## 7. 测试阶段 (Testing Phase)
- **状态**: ⏳ 待重新执行 (Pending Fix)
- **进度**: 0 / 50+ 测试通过 (因假阳性重置)
- **引用**: `docs/planning/dreamweaver-mvp-v1/05-test-plan.md`

## 8. 项目交付 (Project Delivery)
- **最终审查**: [ ]
- **用户验收**: [ ]

---

## 关键变更记录

### 2026-04-05: 重构测试框架与质量保障体系
- ❌ 发现重大风险：Playwright 测试框架存在假阳性，用例执行抛出异常（如 `expect is not defined` 或 UI 崩溃）但报告仍统计为成功。
- 🔄 纠正状态偏差：将 Phase 4、Phase 5 及整体测试阶段的状态从"已完成"回退至"待修复/待开始"。
- 📝 重构项目计划文档：新增并细化《测试框架修复方案》、《质量基准与规范》及《Mock到真实服务端迁移计划》，明确下一步的质量门禁标准。
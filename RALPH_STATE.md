# Ralph 项目状态 (Project State)

<!-- 
AI 指令: 
1. 本文件是 Ralph 项目的**唯一事实来源 (Source of Truth)**，任何状态变更必须同步更新此文件。
2. **生命周期**: 必须遵循 Planning (3 Rounds) -> Implementation -> Testing 的标准流程。
3. **顺序强制**: 在开发与测试阶段，必须严格按照 `04-ralph-tasks.md` 和 `05-test-plan.md` 中的列表物理顺序执行，**严禁跳跃**或乱序执行。
4. **状态维护**: 每次 Skill 执行结束，必须更新此文件中的进度条 (Progress) 和状态 (Status)。
-->

> **当前上下文 (Current Context)**: dreamweaver-v3-advanced-narrative 已冻结，正式转向 vscode-oss-integration-hybrid 混合渐进式迁移迭代。
> **迭代名称 (Iteration)**: vscode-oss-integration-hybrid
> **开发模式**: TDD + 纯静态 Webview UI + SQLite 持久化 + OpenAPI 直连

## 1. 规划阶段 (Planning Phase)
> **目标**: 在编码前通过多轮架构评审确定最稳妥的迁移方案。

| 轮次 (Round) | 步骤 1: 草稿 (Draft) | 步骤 2: 自查 (Critique) | 步骤 3: 调研 (Research) | 步骤 4: 推演 (Simulation) | 步骤 5: 锁定 (Lock) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Round 1** (V3) | ✅ 完成 | ⏳ 冻结 | ⏳ 冻结 | ⏳ 冻结 | ⏳ 冻结 |
| **Round 1** (Hybrid) | ✅ 完成 | ✅ 完成 | ✅ 完成 | ✅ 完成 | ✅ 完成 |

### Round 1 (Hybrid) 完成内容
- ✅ 产出 `Dreamweaver-Caiode-VSCode-Offline-Feasibility.md` (离线可行性报告)
- ✅ 产出 `StoryTree-VSCode-OSS-Integration-Plan.md` (三阶段实施计划)
- ✅ 产出 `ADR-001-Architecture-Finalization.md` (纯静态+SQLite+OpenAPI架构)
- ✅ 产出 `ADR-002-Security-Gateway-and-Mock-Strategy.md` (网关与Mock下沉)
- ✅ 创建 `04-ralph-tasks.md` - 混合渐进式迁移任务清单

## 2. 开发阶段 (Implementation Phase)
> **目标**: 严格按顺序执行开发任务。
> **⚠️ 执行铁律**: 必须严格按照 `04-ralph-tasks.md` 中的列表顺序执行任务。**严禁跳跃**或乱序执行。
> **TDD 铁律**: 先写测试(Red) -> 再写实现(Green) -> 运行测试 -> 重构(Refactor)

- **状态**: 🔄 进行中 (Phase 1: PoC)
- **进度**: **1 / 23 任务完成 (4.3%)**
- **引用**: `docs/planning/vscode-oss-integration/04-ralph-tasks.md`

### Phase 1.1: 制定前后端通信协议 (IPC Protocol Design) ✅ 已完成
- [x] **T-POC-001**: 定义标准的 JSON-RPC 格式的通信协议
- [ ] **T-POC-002**: 在 `dreamweaver` 中实现基于该协议的 RPC 适配器
- [ ] **T-POC-003**: 在 `caiode` 扩展中实现对应的消息路由处理器

### Phase 1.2: 前端静态导出验证 (Next.js Static Export PoC) ⏳ 待定
- [ ] **T-POC-004**: 配置 `output: 'export'` 并移除阻碍依赖
- [ ] **T-POC-005**: 成功构建出纯静态产物 (`out/` 目录)

### Phase 1.3: 插件骨架与 Mock 层下沉 (Extension Skeleton) ⏳ 待定
- [ ] **T-POC-006**: 初始化 VS Code Extension 骨架与 Webview
- [ ] **T-POC-007**: 迁移 Mock 逻辑至 Node.js 层
- [ ] **T-POC-008**: 跑通双端 IPC 数据通信渲染

### Phase 1.4: 持续推进 DW 页面开发与测试 ⏳ 待定
- [ ] **T-FE-001**: 恢复剩余的 Stitch 原页面开发
- [ ] **T-FE-002**: 完善 Playwright 自动化 UI 测试和 VRT
- [ ] **T-FE-003**: 接入新增页面的 IPC 请求

### Phase 1.5: 安全机制架构设计与验证 ⏳ 待定
- [ ] **T-SEC-001**: 数据安全 (SecretStorage API Keys)
- [ ] **T-SEC-002**: 文件隔离 (沙箱机制)
- [ ] **T-SEC-003**: 反编译防护 (esbuild / PyArmor)
- [ ] **T-SEC-004**: 本地库加密 (sqlcipher)

### Phase 1.6: SQLite 本地化替换 ⏳ 待定
- [ ] **T-DB-001**: 引入真实 SQLite 替换 Mock
- [ ] **T-DB-002**: 实现 Prisma/SQL CRUD
- [ ] **T-DB-003**: 联调前端业务与本地数据库

### Phase 1.7: 云端网关集成 ⏳ 待定
- [ ] **T-GW-001**: 接入用户登录与授权验证
- [ ] **T-GW-002**: 接入续费支付、全局配置拉取
- [ ] **T-GW-003**: 集成版本检查与日志上报
- [ ] **T-GW-004**: 提供用户反馈入口

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

- **状态**: 🔄 就绪 (测试计划已生成)
- **进度**: **0 / ~91 测试通过 (0%)**
- **引用**: `docs/planning/vscode-oss-integration/05-test-plan.md`

### 测试用例清单
| 类别 | 总数 | 通过 | 失败 | 跳过 | 通过率 |
|------|------|------|------|------|--------|
| IPC Protocol (TC-IPC) | 16 | 0 | 0 | 16 | 0% |
| Static Export (TC-EXPORT) | 11 | 0 | 0 | 11 | 0% |
| Extension Skeleton (TC-EXT) | 12 | 0 | 0 | 12 | 0% |
| Frontend UI (TC-FE) | 9 | 0 | 0 | 9 | 0% |
| Security (TC-SEC) | 11 | 0 | 0 | 11 | 0% |
| SQLite Database (TC-DB) | 14 | 0 | 0 | 14 | 0% |
| Cloud Gateway (TC-GW) | 7 | 0 | 0 | 7 | 0% |
| Performance Benchmark (TC-PERF) | 6 | 0 | 0 | 6 | 0% |
| Security Audit (TC-SEC-AUDIT) | 5 | 0 | 0 | 5 | 0% |
| **总计** | **~91** | **0** | **0** | **91** | **0%** |

### Round 1 (Hybrid) 补充完成内容
- ✅ 创建 `05-test-plan.md` - VS Code OSS 集成测试计划 (~91 个测试用例)
- ✅ 包含单元测试/集成测试/E2E测试/安全扫描/性能基准全覆盖

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

### 2026-04-07: 正式启动 VS Code OSS 集成 (vscode-oss-integration-hybrid)
- ✅ 完成项目状态评估与技术决策报告
- ✅ 生成增强版任务拆分计划 (v1.1 - 含方案对比 + 5 大功能模块)
- ✅ 完成 Ralph 就绪性评估 (95% Ready)
- ✅ 创建 `05-test-plan.md` - VS Code OSS 集成测试计划 (~91 个测试用例)
- 🔄 **准备启动 ralph-task-executor 执行 T-POC-001**
- 📋 当前任务: T-POC-001 定义 JSON-RPC 通信协议

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

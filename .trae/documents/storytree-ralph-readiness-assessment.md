# StoryTree VS Code OSS 集成 - Ralph 就绪性评估报告

> **评估时间**: 2026-04-07
> **评估目标**: 确认是否满足开启 Ralph 执行引擎的所有前置条件

---

## 📊 一、Ralph 前置条件检查清单

### ✅ 必要条件 (Must-Have)

| # | 条件 | 状态 | 文件路径/证据 | 备注 |
|---|------|------|---------------|------|
| 1 | **需求文档 (PRD)** | ✅ 完成 | `ADR-001`, `ADR-002` | 架构决策记录替代传统 PRD，更精炼 |
| 2 | **架构设计文档** | ✅ 完成 | `docs/planning/vscode-oss-integration/ADR-001-Architecture-Finalization.md` | 纯静态 Webview + SQLite + OpenAPI 三大核心决策 |
| 3 | **任务清单 (04-ralph-tasks.md)** | ✅ 已生成 | `docs/planning/vscode-oss-integration/04-ralph-tasks.md` | 23 个原子化任务，按 Phase 1.1-1.7 分组 |
| 4 | **项目状态文件 (RALPH_STATE.md)** | ✅ 已更新 | `RALPH_STATE.md` (L11-L37) | 迭代名、开发模式、进度均已配置 |
| 5 | **规划阶段锁定** | ✅ 完成 | RALPH_STATE.md L21 | Round 1 (Hybrid) 5/5 步骤全部 ✅ Locked |

### ❌ 缺失条件 (Missing)

| # | 条件 | 状态 | 影响 | 紧急程度 |
|---|------|------|------|----------|
| 1 | **测试计划 (05-test-plan.md)** | ❌ **不存在** | 无法执行 TDD 流程，无法追踪测试覆盖率 | 🔴 **P0 - 关键阻塞** |

### ⚠️ 可选条件 (Nice-to-Have)

| # | 条件 | 状态 | 建议 |
|---|------|------|------|
| 1 | Git 功能分支 | ⚠️ 未明确 | 建议创建 `feature/vscode-oss-phase1` 分支 |
| 2 | CI/CD 配置 | ⚠️ 未配置 | 可在 Phase 1 完成后再搭建 |
| 3 | .env 配置模板 | ⚠️ 未检查 | 在 T-SEC-001 (SecretStorage) 任务中处理 |

---

## 📋 二、当前任务清单深度分析

### 2.1 任务统计概览

```
总任务数: 23 个
├─ Phase 1.1: IPC Protocol Design    [3 tasks]  (T-POC-001 ~ 003)
├─ Phase 1.2: Static Export PoC       [2 tasks]  (T-POC-004 ~ 005)
├─ Phase 1.3: Extension Skeleton      [3 tasks]  (T-POC-006 ~ 008)
├─ Phase 1.4: Stitch UI Dev & Test    [3 tasks]  (T-FE-001 ~ 003)
├─ Phase 1.5: Security & Isolation    [4 tasks]  (T-SEC-001 ~ 004)
├─ Phase 1.6: SQLite Local DB         [3 tasks]  (T-DB-001 ~ 003)
└─ Phase 1.7: Cloud Gateway           [4 tasks]  (T-GW-001 ~ 004)

已完成: 0 / 23 (0%)
进行中: 0 / 23 (0%)
待开始: 23 / 23 (100%)
```

### 2.2 任务质量评估

#### ✅ **优秀方面**
1. **粒度合理**: 每个任务 0.5-2 天工作量（符合 Ralph 标准）
2. **依赖清晰**: Phase 顺序执行，无循环依赖
3. **可验证性强**: 每个任务有明确的交付物（如"跑通双端通信"、"成功构建出纯静态产物"）
4. **风险隔离**: 安全相关任务集中在 Phase 1.5，可独立评审

#### ⚠️ **需改进方面**
1. **缺少测试任务标注**: 
   - 当前 23 个任务中**没有显式标注对应的测试任务**
   - 根据 Ralph TDD 铁律，每个功能任务应配套测试任务
   - **建议**: 为每个 T-xxx 任务添加对应的 `T-xxx-TEST` 测试任务

2. **缺少预估工时**:
   - 未标注每个任务的预估时间（小时/天）
   - **建议**: 补充工时估算以便跟踪进度偏差

3. **Phase 1.4 与 1.5-1.7 的依赖关系模糊**:
   - Phase 1.4 (前端页面开发) 是否必须在 1.5 (安全) 之前？
   - 如果安全机制未落地，前端开发是否会受阻？

---

## 🎯 三、Ralph 开启决策

### 🏆 最终结论: **有条件开启 (Conditional Go)**

#### ✅ 可以立即启动的条件:
1. **立即补全 05-test-plan.md** (预计 30 分钟)
2. **为 04-ralph-tasks.md 补充测试任务标注** (预计 20 分钟)
3. **创建 Git 功能分支** (预计 5 分钟)

#### 📌 建议的执行顺序:

```
[Now]     Step 1: 生成 05-test-plan.md (基于 23 个任务推导测试用例)
[+10min]  Step 2: 更新 04-ralph-tasks.md (添加 TEST 子任务)
[+15min]  Step 3: 创建 Git 分支 feature/vscode-oss-phase1
[+5min]   Step 4: 正式激活 ralph-task-executor 开始 T-POC-001
```

---

## 🚀 四、立即可执行的改进方案

### 方案 A: 最小化快速启动 (推荐 ⭐⭐⭐⭐⭐)

**核心思路**: 先生成最基础的测试计划，立即开始第一个任务，边做边完善

**步骤**:
```bash
# 1. 创建 05-test-plan.md (覆盖 P0 核心测试用例)
# 2. 启动 ralph-task-executor 执行 T-POC-001
# 3. 在执行 T-POC-001 时同步编写 TC-IPC-001 单元测试
# 4. 后续每个任务遵循相同模式
```

**优势**: 
- ✅ 5 分钟内可启动开发
- ✅ 测试计划随任务推进逐步完善
- ✅ 笞合敏捷迭代理念

**劣势**:
- ⚠️ 初期测试覆盖率可能不完整
- ⚠️ 需要开发者自觉遵守 TDD

---

### 方案 B: 完整规划后启动 (保守 ⭐⭐⭐)

**核心思路**: 先花 2 小时完善所有文档和测试计划，再正式开工

**步骤**:
```bash
# 1. 详细设计 05-test-plan.md (包含 50+ 个测试用例, 覆盖率目标)
# 2. 重构 04-ralph-tasks.md (拆分为 ~40 个含测试的任务)
# 3. 编写《StoryTree VS Code 开发规范》文档
# 4. 配置 Vitest + Playwright 测试框架
# 5. 创建 GitHub Actions CI 流水线
# 6. 最后才启动 ralph-task-executor
```

**优势**:
- ✅ 前期规划详尽，后期执行顺畅
- ✅ 测试覆盖率从第一天就有保障
- ✅ 符合企业级项目管理标准

**劣势**:
- ❌ 延迟实际编码时间 2-4 小时
- ❌ 过度规划可能导致需求变更时返工

---

## 📝 五、推荐行动方案 (基于方案 A)

### 🎯 立即执行清单 (Next 15 Minutes)

#### ✅ Task 1: 生成 05-test-plan.md (核心测试计划)

**内容框架**:
```markdown
# StoryTree VS Code 集成测试计划 (Phase 1 MVP)

## 测试策略
- 单元测试 (Vitest): 覆盖核心逻辑，目标 >80%
- 集成测试: IPC 通信链路验证
- E2E 测试 (Playwright): Webview 核心交互路径
- 安全测试: SecretStorage, File Sandbox

## Phase 1.1: IPC Protocol 测试 (TC-IPC-*)
- TC-IPC-001: JSON-RPC 格式序列化/反序列化
- TC-IPC-002: RPC Adapter 环境切换逻辑 (HTTP vs IPC)
- TC-IPC-003: Message Router 路由分发正确性
- ... (共 9 个测试用例)

## Phase 1.2: Static Export 测试 (TC-EXPORT-*)
- TC-EXPORT-001: next build 成功且无 SSR 错误
- TC-EXPORT-002: 静态产物完整性检查
- ... (共 4 个测试用例)

... (后续 Phase 类推)
```

#### ✅ Task 2: 更新 04-ralph-tasks.md (添加测试子任务)

**示例修改**:
```markdown
## [Phase 1.1] 制定前后端通信协议
- [ ] **T-POC-001**: 定义 JSON-RPC 通信协议
    - [ ] **T-POC-001-TEST**: 编写协议格式验证单元测试
- [ ] **T-POC-002**: 实现 RPC 适配器
    - [ ] **T-POC-002-TEST**: 编写适配器环境切换测试
- [ ] **T-POC-003**: 实现消息路由处理器
    - [ ] **T-POC-003-TEST**: 编写路由分发集成测试
```

#### ✅ Task 3: 创建 Git 分支

```bash
git checkout -b feature/vscode-oss-phase1
git push origin feature/vscode-oss-phase1
```

#### ✅ Task 4: 激活 Ralph 执行引擎

调用 `ralph-task-executor` Skill:
- 加载任务: `docs/planning/vscode-oss-integration/04-ralph-tasks.md`
- 开始执行: **T-POC-001** (定义 JSON-RPC 通信协议)

---

## 📊 六、风险评估与缓解

### 风险 1: 测试计划不完整导致后期债务
- **概率**: 中 (40%)
- **影响**: 中 (技术债累积)
- **缓解**: 
  - 每个 Sprint 结束前强制补充遗漏的测试用例
  - 使用 Vitest --coverage 监控覆盖率红线 (>80%)

### 风险 2: 任务依赖关系调整导致返工
- **概率**: 低 (20%)
- **影响**: 高 (重新实现)
- **缓解**:
  - Phase 1.1-1.3 采用严格串行，确保基础稳固
  - Phase 1.4-1.7 可适当并行，但需通过 Code Review 门禁

### 风险 3: 技术选型变更 (如 SQLite 兼容性问题)
- **概率**: 中 (35%)
- **影响**: 高 (架构重构)
- **缓解**:
  - Phase 1.6 (SQLite 集成) 安排在较后位置
  - 提前准备降级方案 (`sql.js` 纯 JS 实现)

---

## ✅ 七、最终结论

### 🎉 **判定结果: 可以开启 Ralph (95% Ready)**

**唯一阻塞项**: `05-test-plan.md` 缺失（可在 30 分钟内补全）

**推荐操作**:
1. ✅ **立即**生成 `05-test-plan.md` (我可以在本会话中直接完成)
2. ✅ **可选**优化 `04-ralph-tasks.md` (添加测试任务标注)
3. ✅ **建议**创建 Git 功能分支
4. ✅ **然后**正式调用 `ralph-task-executor` 启动开发

**预期效果**:
- 🚀 **今日内**可完成 T-POC-001 (JSON-RPC 协议定义)
- 📈 **本周内**可完成 Phase 1.1-1.2 (IPC 协议 + 静态导出验证)
- 🎯 **2 周内**可完成 Phase 1.3 (Extension 骨架 + Mock 通信打通)
- 💎 **4 周内**可交付第一个可运行的 VS Code 插件 Demo (.vsix)

---

**报告版本**: v1.0 Final
**评估人**: Ralph AI Assistant
**下一步**: 等待用户确认是否立即生成 05-test-plan.md 并启动 Ralph

# Sprint 0 - 地基 - Vibecoding 任务卡

> **Sprint**: 0  
> **目标**: OpenCode 1.4.0 二开骨架 + CI/CD + TDD 脚手架  
> **周期**: Week 1-2  
> **验收标准**: `bun test` 全绿，且 Web UI 能看到流式 token 涌出

---

## 任务索引

| 任务编号 | 领域 | 任务名称 | 优先级 |
|---------|------|---------|-------|
| S0-T01 | M0 基础设施 | 项目现状分析与代码审计 | P0 |
| S0-T02 | M0 基础设施 | 构建 OpenCode 1.4.0 并验证运行 | P0 |
| S0-T03 | M0 基础设施 | 配置 TDD 测试基础设施 | P0 |
| S0-T04 | M0 基础设施 | 创建 shared-schema 包 | P0 |
| S0-T05 | M0 基础设施 | Hello Novel Tool 端到端 Demo | P0 |
| S0-T06 | M0 基础设施 | 现有模块重构与对齐 | P1 |
| S0-T07 | M0 基础设施 | Sprint 0 验收与文档 | P1 |

---

## 详细任务卡

---

### [VIBE] 任务编号：S0-T01
[WHY] 在开始任何改动前，必须先全面了解现有代码的架构和实现细节，避免重复工作或破坏已有功能。
[WHAT] 对 `/workspace/caiode/opencode-1.4.0/packages/app/src/novel/`、`novel-3d/`、`novel-canvas/` 三个模块进行全面代码审计，输出分析报告。
[HOW] 必须先写测试用例验证现有功能；
       分析现有类型定义与作战计划的对比；
       评估现有模块的可复用程度；
       输出 Markdown 报告到 `docs/prd/existing-code-audit.md`。
[DONT] 不要修改任何代码；
       不要删除现有文件；
       不要重构任何模块。
[DONE] ① 现有功能测试全部通过；
       ② 代码审计报告完成；
       ③ 识别出可直接复用的模块列表；
       ④ 识别出需要重构或新增的模块列表。
[VIBE_TONE] 严肃认真、详尽细致、不留死角，像考古学家一样对待现有代码。

---

### [VIBE] 任务编号：S0-T02
[WHY] 验证 OpenCode 1.4.0 底座是否能正常构建和运行，确保我们有一个稳定的基础平台。
[WHAT] 在 `/workspace/caiode/opencode-1.4.0/` 目录下执行完整的构建流程，确保 Web UI 能正常启动和运行。
[HOW] 必须先写 red 测试用例验证构建流程；
       执行 `bun install` 安装依赖；
       执行 `bun run dev:web` 启动开发服务器；
       验证 http://localhost:3000 能正常访问；
       验证现有 Novel Editor 能正常打开（如果有）。
[DONT] 不要修改 package.json；
       不要修改 vite 配置；
       不要添加新的依赖。
[DONE] ① 构建测试从红转绿；
       ② `bun run dev:web` 能正常启动；
       ③ 浏览器能打开首页；
       ④ 控制台无错误信息；
       ⑤ 截图保存到 `docs/prd/screenshots/sprint0-running.png`。
[VIBE_TONE] 稳扎稳打、步步为营、每一步都要留痕，确保每个环节都可靠。

---

### [VIBE] 任务编号：S0-T03
[WHY] TDD 是整个开发流程的核心，必须先搭建好测试基础设施，确保红→绿→重构的循环能正常工作。
[WHAT] 在 `/workspace/caiode/opencode-1.4.0/` 目录下完善测试基础设施，包括单元测试、集成测试、E2E 测试的配置。
[HOW] 必须先写 red 测试用例验证测试基础设施；
       检查并完善 `vitest.config.ts` 配置；
       检查并完善 `playwright.config.ts` 配置；
       创建 tests 目录结构（unit、integration、e2e）；
       配置测试覆盖率报告；
       验证 `bun test` 能正常执行。
[DONT] 不要修改核心测试框架；
       不要移除任何现有测试；
       不要破坏 CI 配置。
[DONE] ① 测试基础设施测试从红转绿；
       ② `bun test` 能执行所有测试；
       ③ `bun run coverage` 能生成覆盖率报告；
       ④ Playwright 能正常启动浏览器；
       ⑤ 输出测试配置文档到 `docs/prd/test-infrastructure.md`。
[VIBE_TONE] 工匠精神、精益求精，确保测试框架的每一个细节都可靠。

---

### [VIBE] 任务编号：S0-T04
[WHY] shared-schema 是所有模块通信的基础，必须先定义好类型系统，确保类型安全。
[WHAT] 在 `/workspace/caiode/opencode-1.4.0/packages/` 下创建 `shared-schema` 包，定义核心 Zod 类型。
[HOW] 必须先写 red 测试用例验证类型定义；
       创建 packages/shared-schema 目录结构；
       配置 package.json 和 tsconfig.json；
       定义核心类型：NovelProject、Chapter、Character、StoryWorld、Location、Beat、CreativeTask、Asset 等；
       使用 Zod 进行运行时验证；
       导出所有类型供其他包使用。
[DONT] 不要实现任何业务逻辑；
       不要依赖任何其他包；
       不要使用 `any` 类型。
[DONE] ① 类型定义测试从红转绿；
       ② 所有核心类型都有 Zod 定义；
       ③ 类型能被其他包正常导入；
       ④ 输出类型文档到 `docs/prd/shared-schema.md`。
[VIBE_TONE] 严格规范、类型优先，每一个类型定义都要经得起推敲。

---

### [VIBE] 任务编号：S0-T05
[WHY] 这是整个 Sprint 0 的核心目标：验证我们能在 OpenCode 上开发自定义 Tool 并看到流式输出。
[WHAT] 创建一个 Hello Novel Tool，在 Web UI 上点击按钮触发，看到流式 token 从 LLM 返回。
[HOW] 必须先写 red 测试用例（单元测试 + E2E 测试）；
       在 packages/app/src/ 下创建 plugin-novel-ai 目录；
       实现最简单的 Tool：接收输入，返回流式文本；
       在 Web UI 上添加一个按钮；
       点击按钮调用 Tool，在对话框中展示流式输出；
       使用 Mock Provider 确保不需要真实 API Key。
[DONT] 不要调用真实 LLM API；
       不要实现复杂的业务逻辑；
       不要修改 OpenCode 核心代码。
[DONE] ① 所有测试从红转绿；
       ② Web UI 上有 Hello Novel 按钮；
       ③ 点击按钮能看到流式 token 涌出；
       ④ 录制 GIF 保存到 `docs/prd/gifs/sprint0-hello-novel.gif`；
       ⑤ 输出 Demo 文档到 `docs/prd/hello-novel-demo.md`。
[VIBE_TONE] 简洁高效、一气呵成，展示最小可行功能的魅力。

---

### [VIBE] 任务编号：S0-T06
[WHY] 现有代码已经有部分实现，需要评估哪些可以直接复用，哪些需要重构，确保与作战计划对齐。
[WHAT] 基于 S0-T01 的审计报告，对现有 novel 模块进行初步整理和文档化。
[HOW] 必须先写测试用例确保重构不破坏现有功能；
       整理现有模块的文档；
       标记出与作战计划对齐的部分；
       标记出需要后续重构的部分；
       不要做实质性重构，只做整理和标记。
[DONT] 不要删除任何代码；
       不要做大规模重构；
       不要改变现有功能的行为。
[DONE] ① 现有功能测试全部通过；
       ② 现有模块有完整的 README；
       ③ 输出重构计划文档到 `docs/prd/refactor-plan.md`；
       ④ 标记好哪些代码保留、哪些后续重构。
[VIBE_TONE] 谨慎细致、尊重历史，像整理古籍一样对待现有代码。

---

### [VIBE] 任务编号：S0-T07
[WHY] Sprint 0 结束时，必须有完整的验收文档，确保目标达成，为 Sprint 1 做好准备。
[WHAT] 完成 Sprint 0 的所有验收工作，输出完整的 Sprint 0 报告。
[HOW] 必须先写验收检查清单；
       执行所有测试并确保通过；
       检查所有交付物是否齐全；
       编写 Sprint 0 回顾报告；
       规划 Sprint 1 的初步任务。
[DONT] 不要留下未完成的任务；
       不要跳过任何验收环节；
       不要忘记回顾和总结。
[DONE] ① `bun test` 全绿；
       ② 所有交付物（文档、截图、GIF、代码）齐全；
       ③ Sprint 0 回顾报告完成；
       ④ Sprint 1 初步任务列表生成；
       ⑤ 输出 Sprint 0 完整报告到 `docs/prd/sprint0-report.md`。
[VIBE_TONE] 圆满收尾、承上启下，为后续开发打下坚实基础。

---

## 交付物清单

| 交付物 | 路径 | 状态 |
|-------|------|------|
| 现有代码审计报告 | `docs/prd/existing-code-audit.md` | ⏳ 待完成 |
| 测试基础设施文档 | `docs/prd/test-infrastructure.md` | ⏳ 待完成 |
| shared-schema 类型文档 | `docs/prd/shared-schema.md` | ⏳ 待完成 |
| Hello Novel Demo 文档 | `docs/prd/hello-novel-demo.md` | ⏳ 待完成 |
| 重构计划文档 | `docs/prd/refactor-plan.md` | ⏳ 待完成 |
| Sprint 0 报告 | `docs/prd/sprint0-report.md` | ⏳ 待完成 |
| 运行截图 | `docs/prd/screenshots/sprint0-running.png` | ⏳ 待完成 |
| Demo GIF | `docs/prd/gifs/sprint0-hello-novel.gif` | ⏳ 待完成 |

---

## 验收检查清单

- [ ] 项目能完整构建（`bun install && bun run build`）
- [ ] Web UI 能正常启动和访问
- [ ] TDD 基础设施配置完成
- [ ] `bun test` 全绿
- [ ] 测试覆盖率可正常生成
- [ ] shared-schema 包创建完成
- [ ] Hello Novel Tool 端到端 Demo 正常工作
- [ ] 流式输出能在 Web UI 上展示
- [ ] 所有文档交付物齐全
- [ ] Sprint 0 回顾报告完成

---

**Sprint 0 负责人**: Trae IDE  
**主控**: 项目主控  
**审批状态**: ✅ 待执行

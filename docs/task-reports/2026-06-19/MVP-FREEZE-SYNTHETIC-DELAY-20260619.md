> 我是：前端工程师 / Novel 模块开发 Agent (Kimi-K2.7-Code)，本次任务：MVP-FREEZE-SYNTHETIC-DELAY，职责范围：packages/app/src/novel/adapters/、packages/app/src/novel/workflows/（P1-MVP 范围内最小改动，未触及 OpenCode 底座）

# 任务完成报告

## 基本信息
- **任务ID**: MVP-FREEZE-SYNTHETIC-DELAY
- **任务名称**: MVP-Freeze 改进任务：为 AI 工作流增加「真实感」模拟异步延迟
- **所属模块**: packages/app/src/novel/adapters
- **完成时间**: 2026-06-19
- **执行人**: Kimi-K2.7-Code

## 任务描述

用户反馈当前点击「开始生成」按钮后结果「秒回」，无法观察到 Running 状态，导致「取消任务」按钮难以被人工或 E2E 稳定测试。本任务要求在 P1 Mock 模式下引入阶梯式异步延迟（Synthetic Delay），总延迟 3s-8s，模拟 Context Analysis / Model Reasoning / Information Audit / Result Formatting 四个阶段。

## 完成内容
- [x] 修改 `MockAgentAdapter.run()` 为真正异步阶梯执行
- [x] 按目标字数动态计算 3s-8s 总延迟
- [x] 输出四阶段 `[MockAgent] Phase X/4 - ...` 中间日志
- [x] 新增 `delayMultiplier` 配置（默认 1，测试可设为 0）
- [x] 更新 `mock-agent-adapter.test.ts` 使用 `delayMultiplier: 0`
- [x] 更新 `mock-generation-workflow.test.ts` 在 `beforeEach` 设置 `delayMultiplier(0)`
- [x] 通过 `bun typecheck`
- [x] 通过 `bun test`（425 pass / 0 fail）
- [x] 通过 adapter 专项测试（12 pass）
- [x] 通过 workflow 专项测试（18 pass）
- [x] 通过 Playwright E2E（1 passed，真实延迟生效）

## 代码变更

| 文件路径 | 变更类型 | 说明 |
|---------|---------|------|
| `packages/app/src/novel/adapters/mock-agent-adapter.ts` | 修改 | `run()` 改为 async 阶梯执行；新增 `MockAgentAdapterOptions`（`delayMultiplier`、`silent`）；按字数计算 3s-8s 延迟；`durationMs` 改为真实耗时 |
| `packages/app/src/novel/adapters/mock-agent-adapter.test.ts` | 修改 | 测试实例使用 `delayMultiplier: 0, silent: true` |
| `packages/app/src/novel/workflows/mock-generation-workflow.ts` | 修改 | `runMockGeneration` 增加可选 `adapter` 参数，支持依赖注入 |
| `packages/app/src/novel/workflows/mock-generation-workflow.test.ts` | 修改 | 合并重复 `./novel-command` import；使用本地 `testAdapter`（`delayMultiplier: 0, silent: true`）调用 `runMockGeneration`；移除对全局单例的修改，避免测试状态泄漏 |

## 测试结果
- **测试状态**: 通过
- **测试用例**: 425 个单元测试 + 18 个 workflow 专项 + 12 个 adapter 专项 + 1 个 Playwright E2E
- **覆盖率**: 未单独生成覆盖率报告，全部测试通过

## Git 提交
- **Commit Hash**: 未提交（工作区存在未提交更改）
- **Commit Message**: 待提交
- **分支**: 当前工作分支
- **备注**: 按系统级指令，未在用户未明确授权时执行 Git 提交。建议用户确认后按 `github-workflow-rules.md` 规范提交。

## 遇到的问题
- 无重大问题。单元测试需要避免真实延迟，通过 `delayMultiplier` 配置解决。

## 经验总结
- 使用 `delayMultiplier` 模式可以兼顾生产真实感和测试速度。
- `async/await` + `mockDelay`  naturally 保持 `useNovelWorkflow.isRunning` 为 `true`。
- 中间日志对调试和 E2E 诊断非常有价值。

## 下一步建议
1. 用户确认后执行 Git 提交（建议按 `feat(DEV-MVP-FREEZE): Mock AI 生成增加阶梯式异步延迟` 规范）。
2. 如需在 `AiProgressDock` 显示当前 Phase 文字，需要增加 adapter → hook 的 phase 回调机制（可选，本次未实现）。
3. 人工验收访问 http://localhost:4445/novel?view=workspace 点击「开始生成」，确认进度浮窗出现且存在 3s-8s 延迟。

[READY_FOR_REVIEW]

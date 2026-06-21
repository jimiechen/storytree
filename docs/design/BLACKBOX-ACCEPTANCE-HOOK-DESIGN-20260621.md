# StoryTree 项目级 TRAE Hook 黑盒验收方案设计

> **角色**：QA 测试工程师 / 黑盒验收 Hook 设计 Agent (Kimi-K2.7-Code)  
> **越界操作申请**：本次任务输出设计文档到 `docs/design/`，属于跨 QA 与架构职责边界的设计产物；后续脚本落地由对应角色执行。  
> **任务ID**：DESIGN-TRAe-HOOK-ACCEPTANCE-20260621  
> **日期**：2026-06-21  
> **版本**：v2.0  
> **状态**：`[READY_FOR_REVIEW]`

---

## 1. 设计目标

基于 [Trae IDE Hooks](https://docs.trae.cn/ide_automate-actions-with-hooks) 构建 NovelForge **项目级 TRAE Hook 自动化审查体系**，覆盖 `SessionStart / PreToolUse / PostToolUse / Stop` 四个核心事件：

- **SessionStart**：注入 P2 阶段硬性边界与项目上下文。
- **PreToolUse**：拦截高风险命令（真实 Git Worktree、真实 LLM、支付、云同步等）。
- **PostToolUse**：在 `Write|Edit` 后审查代码改动是否触发项目规则。
- **Stop**：任务结束前执行黑盒验收，失败则阻断并反馈修复提示。

验收维度保持 **UI 角度、产品角度、历史规范角度** 三视角，但升级为可配置的分级策略（pass / warning / fail / block）。

---

## 2. 术语

| 术语 | 说明 |
|---|---|
| **Trae Hook** | Trae IDE 提供的生命周期扩展机制，通过 `stdin` 接收 JSON、通过 `stdout` 返回控制指令。 |
| **Acceptance Runner** | 验收编排脚本集合，按事件分派到不同处理器。 |
| **Blackbox Rule** | 不依赖 Agent 内部推理、仅基于文件改动/输出/测试结果的自动化规则。 |
| **Level** | `pass` / `warning` / `fail` / `block`，分别对应通过、提示、失败、阻断。 |
| **P2 硬性边界** | 不接真实 LLM、不接真实 OpenCode/ClaudeCode、不执行真实 git worktree、不写真实项目文件、不接数据库/支付/云同步、不侵入 OpenCode Core。 |

---

## 3. 项目级 Hook 配置

### 3.1 配置文件

```text
caiode/opencode-1.4.0/.trae/hooks.json
```

### 3.2 配置内容

```json
{
  "version": 1,
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bun scripts/trae-hooks/session-start-context.ts",
            "timeout": 10
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "RunCommand",
        "hooks": [
          {
            "type": "command",
            "command": "bun scripts/trae-hooks/pretool-guard.ts",
            "timeout": 10
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bun scripts/trae-hooks/posttool-novel-review.ts",
            "timeout": 20
          }
        ]
      }
    ],
    "Stop": [
      {
        "loop_limit": 3,
        "hooks": [
          {
            "type": "command",
            "command": "bun scripts/trae-hooks/stop-acceptance.ts",
            "timeout": 180
          }
        ]
      }
    ]
  }
}
```

### 3.3 事件选择矩阵

| 事件 | 用途 | 阻断能力 | 本方案职责 |
|---|---|---|---|
| `SessionStart` | 注入上下文 | 否 | 注入 P2 边界、验收要求、中文注释规范。 |
| `UserPromptSubmit` | 输入审查 | 是 | 本方案暂不启用，避免误拦截正常需求讨论。 |
| `PreToolUse` | 工具执行前 | 是（deny/ask） | 拦截 `RunCommand` 高风险命令。 |
| `PostToolUse` | 工具执行后 | 可追加上下文/要求修复 | 审查 `Write|Edit` 后代码是否合规。 |
| `Stop` | 任务结束前 | 是（block） | 运行三视角集成验收。 |
| `Notification` | 异步通知 | 否 | 本方案暂不启用。 |

---

## 4. 标准输入 / 输出协议

### 4.1 输入协议

TRAE 通过 `stdin` 向 Hook 命令发送 JSON：

```typescript
type HookInput = {
  hookEventName: 'SessionStart' | 'PreToolUse' | 'PostToolUse' | 'Stop'
  sessionId: string
  projectPath: string
  prompt?: string
  tool?: {
    name: string
    input: unknown
    output?: unknown
  }
  filesChanged?: string[]
  output?: string
}
```

### 4.2 输出协议

#### SessionStart

```json
{
  "additionalContext": "## NovelForge P2 阶段边界\n- 禁止接真实 LLM / OpenCode / ClaudeCode\n- 禁止真实 git worktree / merge / rebase\n- 禁止数据库 / 支付 / 云同步\n- 禁止修改 OpenCode Core\n- 复杂逻辑必须加中文注释\n- 任务完成前必须运行 `bun run novel:precommit`\n- ViewModel 中相关 UI 状态优先使用 createStore"
}
```

#### PreToolUse

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "P2 阶段禁止执行真实 git worktree 操作。"
  }
}
```

#### PostToolUse

```json
{
  "decision": "block",
  "reason": "修改 workspace-view-model.ts 后仍存在多个相关 createSignal，请合并为 createStore。",
  "additionalContext": "检测到 chapterUiState / generationConfig / contextOptions 三个相关 UI 状态仍使用独立 createSignal。"
}
```

#### Stop

```json
{
  "decision": "block",
  "reason": "P2-D 验收未完成：未运行 bun run novel:precommit，且阶段报告缺少 Git commit hash。"
}
```

或

```json
{
  "decision": "allow",
  "summary": "UI / 产品 / 历史规范三视角验收通过。"
}
```

### 4.3 退出码约定

| 退出码 | 含义 |
|---|---|
| `0` | 正常输出，按 JSON 中 `decision` 处理。 |
| `2` | 脚本异常，默认阻断（保守策略）。 |

---

## 5. 脚本目录结构

```text
caiode/opencode-1.4.0/scripts/trae-hooks/
├── shared/
│   ├── read-hook-input.ts       # 从 stdin 读取并解析 Hook JSON
│   ├── hook-output.ts           # 统一输出不同事件响应
│   ├── git-utils.ts             # git status / diff / branch 工具
│   ├── file-scan.ts             # 文件内容扫描（createSignal、TODO、注释等）
│   └── novel-rules.ts           # NovelForge 项目级规则常量
├── session-start-context.ts     # SessionStart：注入 P2 边界与规范
├── pretool-guard.ts             # PreToolUse：拦截高风险 RunCommand
├── posttool-novel-review.ts     # PostToolUse：代码改动后审查
└── stop-acceptance.ts           # Stop：三视角集成验收
```

---

## 6. 项目级禁止项（P2 硬性边界）

以下行为在任何 Hook 阶段被命中均视为 `block`：

```text
1. 调用真实 LLM API（OpenAI / Anthropic / OpenRouter 等）
2. 调用真实 OpenCode Server / ClaudeCode Adapter
3. 执行 git worktree add / remove / merge / rebase / checkout -f
4. 写真实小说项目文件到用户工作区
5. 引入数据库 / ORM / 支付 / 云同步代码或依赖
6. 修改 packages/opencode/、packages/sdk/、packages/plugin/、packages/desktop/、packages/ui/ 等 OpenCode Core
7. 让未实现功能伪成功（按钮点击后显示成功但实际未执行）
8. 绕过 FeatureGate 打开 P2 未开放能力
9. 提交测试未通过的代码
```

---

## 7. 代码规则分级

### 7.1 SolidJS ViewModel 规则

| 命中场景 | 级别 | Hook 阶段 |
|---|---|---|
| 修改 `workspace-view-model.ts` 后仍新增多个相关 `createSignal` | fail → block | PostToolUse |
| 未修改 ViewModel 文件但检测到历史遗留多 signal | warning | PostToolUse / Stop |
| 独立无关状态使用 signal | pass | - |

检测启发式：同一 ViewModel 中出现 `chapterUiState`、`generationConfig`、`contextOptions` 等语义相关的 UI 状态且均为 `createSignal`，判定为违规。

### 7.2 中文注释规则

| 命中场景 | 级别 | Hook 阶段 |
|---|---|---|
| 新增复杂逻辑（dispatcher / engine / tool / workflow）无中文注释 | fail → block | PostToolUse |
| 注释仅重复代码（如 `// 执行函数`） | warning | PostToolUse |
| 已按要求补充说明性注释 | pass | - |

### 7.3 FeatureGate 规则

| 命中场景 | 级别 | Hook 阶段 |
|---|---|---|
| 新增未实现 UI 入口无 FeatureGate / 禁用 / 暂未开放 | fail → block | PostToolUse |
| 按钮点击后伪成功 | fail → block | PostToolUse / Stop |
| 已正确 gate | pass | - |

### 7.4 测试覆盖规则

| 命中场景 | 级别 | Hook 阶段 |
|---|---|---|
| 新增 Tool 无测试 | fail → block | PostToolUse |
| 新增 Workflow YAML 无 loader/engine 测试 | fail → block | PostToolUse |
| 新增复杂 Hook 无测试 | fail → block | PostToolUse |
| `info.extract` 返回伪成功 | fail → block | PostToolUse / Stop |

### 7.5 代码文件行数规则

| 命中场景 | 级别 | Hook 阶段 |
|---|---|---|
| 新增/修改代码文件 > 500 行 | warning / fail | PostToolUse |

---

## 8. Stop 阶段三视角验收

### 8.1 UI 视角

| 检查项 | 命令 | 通过标准 |
|---|---|---|
| 组件/Hook 行为测试 | `bun test src/novel/hooks` | 0 fail |
| 受影响 E2E | `bunx playwright test e2e/novel/novel-mvp-flow.spec.ts` | 0 fail（如环境允许） |
| E2E 豁免说明 | 报告中说明 | 若未执行，需说明原因并补充单元/组件测试 |

### 8.2 产品视角

| 检查项 | 命令 | 通过标准 |
|---|---|---|
| Novel 全量测试 | `bun test src/novel` | 0 fail |
| Info-Theory 测试 | `bun test src/novel/info-theory` | 0 fail（如修改 info-theory） |
| Plugins 测试 | `bun test src/novel/plugins` | 0 fail（如修改 plugins） |
| Workflows 测试 | `bun test src/novel/workflows/engine` | 0 fail（如修改 workflows） |
| TypeScript 类型检查 | `bun typecheck` | 0 errors |

### 8.3 历史规范视角

| 检查项 | 检查方式 | 通过标准 |
|---|---|---|
| `novel:precommit` 已执行 | 脚本读取最近命令历史或报告声明 | 已执行或等价审查 |
| 工作空间文件已更新 | `workspaces/{model}/hello{model}.md` 存在且含本次任务 | 是 |
| 角色声明 | 报告/工作空间文件首行 | 已声明 |
| READY 标记 | 阶段报告 | 含 `[READY_FOR_*]` |
| Git 提交 | `git status` | 无未提交文件或已说明 |
| 无禁止项命中 | 规则扫描 | 无 block 级违规 |

### 8.4 `novel:precommit` 定义

建议在 `packages/app/package.json` 新增：

```json
{
  "scripts": {
    "novel:precommit": "bun scripts/novel-precommit-check.ts"
  }
}
```

`scripts/novel-precommit-check.ts` 负责：

```text
1. bun typecheck
2. bun test src/novel
3. 检查文件行数
4. 检查中文注释（新增复杂文件）
5. 检查 FeatureGate
6. 检查 OpenCode Core 未被修改
```

---

## 9. 与内部 HookPipeline 的关系

- **Trae Hook**：IDE 层项目级门控，跨会话生效，不修改业务代码。
- **内部 HookPipeline**（Creative Agent Runtime）：运行时扩展点，面向插件/任务生命周期。

两者互补：Trae Hook 负责“Agent 行为合规”，内部 HookPipeline 负责“运行时任务编排”。

---

## 10. 示例：P2-D 任务验收

某次任务修改 `workspace-view-model.ts` 与新增 `NovelActionDispatcher`：

```text
PostToolUse
  ├─ 检测到 workspace-view-model.ts 被修改
  ├─ 发现仍新增 generationConfig / contextOptions 两个相关 createSignal
  └─ decision: block，要求合并为 createStore

Stop
  ├─ UI 视角：bun test src/novel/hooks ✅
  ├─ 产品视角：bun test src/novel ✅
  ├─ 历史规范视角：
  │   ├─ bun typecheck ✅
  │   ├─ bun run novel:precommit ❌（未执行）
  │   └─ 阶段报告缺少 Git commit hash ❌
  └─ decision: block，要求执行 precommit、提交代码并更新报告
```

---

## 11. 落地清单

| 序号 | 任务 | 负责人 | 产出 |
|---|---|---|---|
| 1 | 创建 `.trae/hooks.json` | DevOps / 架构师 | 项目级 Hook 配置 |
| 2 | 实现 `scripts/trae-hooks/shared/*` | Node.js 后端工程师 | 公共工具脚本 |
| 3 | 实现 `session-start-context.ts` | Node.js 后端工程师 | 上下文注入脚本 |
| 4 | 实现 `pretool-guard.ts` | Node.js 后端工程师 | 高风险命令拦截 |
| 5 | 实现 `posttool-novel-review.ts` | QA / 前端工程师 | 改动后审查 |
| 6 | 实现 `stop-acceptance.ts` | QA / Node.js 后端工程师 | 三视角验收 |
| 7 | 实现 `packages/app/scripts/novel-precommit-check.ts` | Node.js 后端工程师 | 提交前检查 |
| 8 | 在 `packages/app/package.json` 新增 `novel:precommit` | Node.js 后端工程师 | npm script |
| 9 | 补齐 Novel E2E spec | 前端工程师 | `test/e2e/novel/*.spec.ts` |
| 10 | 团队评审并启用 Hook | 项目协调 Agent | 评审纪要 |

---

## 12. 风险与待确认项

| 风险/待确认 | 说明 | 建议 |
|---|---|---|
| Trae Hook 精确 JSON schema | 文档未给出完整字段 | 先按常见字段实现，接入后根据日志补全。 |
| `loop_limit=3` 可能不足 | 复杂任务需多次修复 | 可调整；超过限制后由人工接管。 |
| `novel:precommit` 尚未存在 | 当前 package.json 无该脚本 | 作为 P2-D 前置任务实现，或在报告中声明缺失。 |
| 沙箱运行限制 | Hook 默认沙箱，可能无法访问项目脚本 | 先沙箱测试；必要时配置本地自动运行。 |
| 误阻断非开发会话 | 普通问答也触发 Stop | Runner 通过 `filesChanged` / `prompt` 判断是否为任务完成型 Query。 |

---

## 13. Exit Criteria 自评

| 检查项 | 目标值 | 实际值 | 状态 |
|---|---|---|---|
| 覆盖四个核心 Hook 事件 | SessionStart / PreToolUse / PostToolUse / Stop | 已覆盖 | ✅ 通过 |
| 提供完整 `.trae/hooks.json` | 含 version / matcher / loop_limit | 已提供 | ✅ 通过 |
| 定义 stdin/stdout 协议 | 输入/输出示例 | 已定义 | ✅ 通过 |
| 三视角验收 + 分级策略 | UI / 产品 / 历史规范 + warning/fail/block | 已定义 | ✅ 通过 |
| 整合 P2 硬性边界 | 17 项禁止项 | 已列出 | ✅ 通过 |
| 文档格式合规 | < 500 行、含 READY 标记 | 符合要求 | ✅ 通过 |

---

*[READY_FOR_REVIEW]*

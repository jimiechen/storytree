# BOUNDARY.md - StoryTree2 不可逾越的边界清单

> **版本**: v0.1  
> **日期**: 2026-05-31  
> **状态**: 生效中  
> **优先级**: 最高（宪法级）

---

## 一、总则

本文档是 StoryTree2 项目的**工程宪法**，定义了 Trae IDE 在本项目中**永远不允许做**的事。凡是本文档未明文允许的事，**必须升级到主控决策**。

> **冲突解决规则**: 本文档与 `Ralph.md`、`CODE_WIKI.md` 等其他指导性文件冲突时，**以本文档为准**。

---

## 二、绝对禁止事项（Hard Boundaries）

### 2.1 禁止修改核心代码

| 禁止行为 | 原因 | 例外处理 |
|---------|------|---------|
| 修改 `caiode/opencode-1.4.0/packages/core/` | 上游核心区，保持与 opencode 同步 | 必须发起 RFC，由主控批准 |
| 修改 `caiode/opencode-1.4.0/packages/opencode/` | 上游核心包 | 必须发起 RFC，由主控批准 |
| 直接 patch 任何 `@opencode-ai/*` 包 | 依赖上游升级通道 | 通过 Plugin/Tool API 扩展 |

### 2.2 禁止引入新的状态管理方案

| 禁止行为 | 允许方案 |
|---------|---------|
| 引入 Redux / Zustand / Jotai | ✅ 使用 SolidJS Signal |
| 引入 Vuex / Pinia | ✅ 使用 SolidJS Store |
| 引入其他状态管理库 | ❌ 禁止 |

### 2.3 禁止使用 TypeScript 逃逸机制

| 禁止行为 | 违规代码示例 |
|---------|------------|
| 使用 `any` 类型 | `const x: any = ...` |
| 使用 `@ts-ignore` | `// @ts-ignore` |
| 使用 `@ts-expect-error` | `// @ts-expect-error` |
| 使用 `as unknown as X` | `x as unknown as Y` |

**例外**: 仅在类型定义文件（`*.d.ts`）中允许。

### 2.4 禁止绕过 Provider Registry

| 禁止行为 | 正确做法 |
|---------|---------|
| 直接 import `anthropic` SDK | 通过 ProviderRegistry 获取 |
| 直接 import `openai` SDK | 通过 ProviderRegistry 获取 |
| 直接调用第三方 LLM API | 通过 Tool → Provider → LLM 调用链 |

### 2.5 禁止数据外泄

| 禁止行为 | 说明 |
|---------|------|
| 将小说内容作为训练数据 | 用户内容受隐私保护 |
| 将用户数据上传到非授权服务器 | 仅允许云同步（VIP）且需加密 |
| 打印敏感信息到日志 | 禁止日志中包含用户内容 |

### 2.6 禁止跳过 TDD 流程

| 禁止行为 | 正确做法 |
|---------|---------|
| 先写实现后补测试 | 必须 red → green → refactor |
| commit 不带 `red:`/`green:`/`refactor:` 前缀 | 必须按三色合同提交 |
| 跳过 CI 测试直接合并 | CI 全绿是 merge 前置条件 |

---

## 三、目录结构约束

### 3.1 允许的顶层目录

| 目录 | 用途 | 约束 |
|------|------|------|
| `caiode/` | 所有源代码 | 必须在 `caiode/opencode-1.4.0/` 下 |
| `docs/` | 文档 | 按 `docs/boundary/`、`docs/precheck/`、`docs/prd/` 组织 |
| `.trae/` | Agent 规则 | 仅限 `.trae/rules/` |
| `workspaces/` | AI 工作空间 | 每个模型独立目录 |

### 3.2 禁止的目录操作

- ❌ 禁止在项目根目录创建新的顶层目录
- ❌ 禁止在 `caiode/opencode-1.4.0/packages/` 下创建非 `app/` 子包
- ❌ 禁止删除现有的 `packages/app/src/novel/` 等已实现模块

---

## 四、包边界约束

### 4.1 已定义的新包（待创建）

| 包名 | 用途 | Owner | 约束 |
|------|------|-------|------|
| `plugin-novel-ai` | 5 个 AI Tool | 待定 | 仅实现 Tool，不做 UI |
| `plugin-novel-assets` | MCP Server | 待定 | 仅实现 MCP，不做业务逻辑 |
| `server-billing` | 积分/VIP/订单 | 待定 | 后端服务，不做前端 |
| `shared-schema` | Zod 类型定义 | 待定 | 仅类型，无实现 |

### 4.2 禁止的包操作

- ❌ 禁止在 `packages/` 下创建其他包
- ❌ 禁止将业务代码放入 `packages/core/` 或 `packages/opencode/`
- ❌ 禁止跨包直接 import（必须通过 public API）

---

## 五、提交约束

### 5.1 Commit Message 前缀（强制）

| 前缀 | 用途 | 约束 |
|------|------|------|
| `red:` | 测试先行 | 仅修改 `*.spec.ts`，CI 必须红 |
| `green:` | 实现代码 | 仅修改实现文件，不改测试 |
| `refactor:` | 重构优化 | 不改功能，不降覆盖率 |
| `fix:` | 缺陷修复 | 必须附测试用例 |
| `docs:` | 文档更新 | 不改代码 |

### 5.2 禁止的 Commit

- ❌ 禁止无前缀 commit
- ❌ 禁止 `wip:` / `temp:` / `xxx:` 等无意义前缀
- ❌ 禁止在 `red:` commit 中改实现代码
- ❌ 禁止在 `green:` commit 中改测试

---

## 六、RFC 流程

### 6.1 需要发起 RFC 的情况

1. 需要修改 `packages/core/` 或 `packages/opencode/`
2. 需要引入新的 npm 依赖（非 workspace 内）
3. 需要修改 Provider Registry 核心逻辑
4. 需要修改 Session/SQLite Schema
5. 需要修改 CI/CD 流程

### 6.2 RFC 流程

1. 在 `docs/adr/` 下创建 `RFC-XXX.md`
2. 描述：问题/提案/影响/替代方案
3. 提交 PR 并 @主控 审批
4. 批准后方可实施

---

## 七、违规处理

| 违规类型 | 处理方式 |
|---------|---------|
| Soft Boundary 违规 | PR Request Changes，要求修复 |
| Hard Boundary 违规 | PR 关闭，要求重新提交 |
| 重复违规 | 暂停执行资格，主控约谈 |

---

*本文档是 StoryTree2 工程的宪法，所有 Agent 必须无条件遵守。*

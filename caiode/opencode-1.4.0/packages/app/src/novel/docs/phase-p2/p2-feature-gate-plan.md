# Phase P2-0 FeatureGate 计划

> 角色：前端工程师 / Novel 模块开发 Agent (Kimi-K2.7-Code)
> 任务：Phase P2-0 基线
> 来源：`tabbit_Phase P2-0.md` / `P2-IMPLEMENTATION-PLAN-20260619.md`
> 日期：2026-06-20

---

## 1. 设计目标

P2 阶段必须保证“未实现功能不伪装成功”。FeatureGate 是 P2 的核心安全网，所有依赖真实外部服务、尚未接入 YAML Workflow 或仅保留入口的功能，默认关闭，并在 UI 上明确表达“暂未开放”或禁用状态。

---

## 2. Gate 默认值总览

| Gate Key | 默认值 | 控制范围 |
|----------|--------|---------|
| `realLLMEnabled` | `false` | 真实 LLM 调用 |
| `openCodeAdapterEnabled` | `false` | OpenCode 真实执行器 |
| `claudeCodeAdapterEnabled` | `false` | ClaudeCode 真实执行器 |
| `paymentEnabled` | `false` | 积分充值 / 付费 |
| `cloudSyncEnabled` | `false` | 云同步 |
| `exportEnabled` | `false` | 数据导出 |
| `importEnabled` | `false` | 数据导入 |
| `bookAnalysisEnabled` | `false` | AI 拆书工作室 |
| `nameGeneratorEnabled` | `false` | 名字生成器 |
| `guide25Enabled` | `false` | 25 道题引导（保留入口） |
| `batchGenerationEnabled` | `false` | 批量生成 |

---

## 3. Gate 清单

### 3.1 `realLLMEnabled`

| 字段 | 值 |
|------|-----|
| 默认值 | `false` |
| 控制范围 | 是否允许真实 LLM 网络请求 |
| 涉及页面 | Workspace、Editor、Guide |
| 涉及按钮 | 开始生成、AI 续写、浮动续写、重新提取 |
| P2 是否允许开启 | 否 |
| 关闭时 UI 行为 | 工作流固定走 Mock / Stub Adapter；设置页中真实模型选项隐藏或禁用 |
| 关闭时测试断言 | `expect(realLLMRequest).not.toHaveBeenCalled()` |

### 3.2 `openCodeAdapterEnabled`

| 字段 | 值 |
|------|-----|
| 默认值 | `false` |
| 控制范围 | AdapterRouter 是否可选 OpenCode Stub/真实执行器 |
| 涉及页面 | Workspace、Editor、Profile/AI 模型设置 |
| 涉及按钮 | 开始生成、AI 续写、重新提取 |
| P2 是否允许开启 | 否（仅保留 P2-E 接口） |
| 关闭时 UI 行为 | Adapter 选择器中不显示 OpenCode 选项 |
| 关闭时测试断言 | `adapterRouter.route('opencode')` 抛出或返回 disabled 错误 |

### 3.3 `claudeCodeAdapterEnabled`

| 字段 | 值 |
|------|-----|
| 默认值 | `false` |
| 控制范围 | AdapterRouter 是否可选 ClaudeCode Stub |
| 涉及页面 | Workspace、Editor、Profile/AI 模型设置 |
| 涉及按钮 | 开始生成、AI 续写、重新提取 |
| P2 是否允许开启 | 否（仅保留 P2-E 接口） |
| 关闭时 UI 行为 | Adapter 选择器中不显示 ClaudeCode 选项 |
| 关闭时测试断言 | `adapterRouter.route('claudecode')` 抛出或返回 disabled 错误 |

### 3.4 `paymentEnabled`

| 字段 | 值 |
|------|-----|
| 默认值 | `false` |
| 控制范围 | 积分充值、付费弹窗、扣费逻辑 |
| 涉及页面 | Profile / 个人中心 |
| 涉及按钮 | 充值、去充值 |
| P2 是否允许开启 | 否 |
| 关闭时 UI 行为 | 充值按钮禁用并提示“暂未开放”；扣费事件不影响真实余额 |
| 关闭时测试断言 | `expect(rechargeButton).toBeDisabled()`；扣费事件 `creditDelta` 仅在 profile stats 展示，不调用支付 API |

### 3.5 `cloudSyncEnabled`

| 字段 | 值 |
|------|-----|
| 默认值 | `false` |
| 控制范围 | 云同步开关、跨设备同步请求 |
| 涉及页面 | Profile / 个人中心 |
| 涉及按钮 | 开启云同步 |
| P2 是否允许开启 | 否 |
| 关闭时 UI 行为 | 云同步入口隐藏或显示“暂未开放”占位 |
| 关闭时测试断言 | `expect(cloudSyncToggle).not.toBeVisible()` 或 `toBeDisabled()` |

### 3.6 `exportEnabled`

| 字段 | 值 |
|------|-----|
| 默认值 | `false` |
| 控制范围 | 数据导出功能（小说、章节、设定） |
| 涉及页面 | Profile / 个人中心、ModalHost 导出弹窗 |
| 涉及按钮 | 导出 |
| P2 是否允许开启 | 否 |
| 关闭时 UI 行为 | 导出按钮禁用或隐藏；点击提示“暂未开放” |
| 关闭时测试断言 | `expect(exportButton).toBeDisabled()` |

### 3.7 `importEnabled`

| 字段 | 值 |
|------|-----|
| 默认值 | `false` |
| 控制范围 | 数据导入功能 |
| 涉及页面 | Profile / 个人中心、ModalHost 导入弹窗 |
| 涉及按钮 | 导入 |
| P2 是否允许开启 | 否 |
| 关闭时 UI 行为 | 导入按钮禁用或隐藏；点击提示“暂未开放” |
| 关闭时测试断言 | `expect(importButton).toBeDisabled()` |

### 3.8 `bookAnalysisEnabled`

| 字段 | 值 |
|------|-----|
| 默认值 | `false` |
| 控制范围 | AI 拆书工作室页面入口 |
| 涉及页面 | `/book-analysis` |
| 涉及按钮 | 拆书工作室入口 |
| P2 是否允许开启 | 否 |
| 关闭时 UI 行为 | 入口隐藏；直接访问路由显示占位页“暂未开放” |
| 关闭时测试断言 | `expect(page.getByText('暂未开放')).toBeVisible()` |

### 3.9 `nameGeneratorEnabled`

| 字段 | 值 |
|------|-----|
| 默认值 | `false` |
| 控制范围 | 名字生成器页面入口 |
| 涉及页面 | `/name-generator` |
| 涉及按钮 | 名字生成器入口 |
| P2 是否允许开启 | 否 |
| 关闭时 UI 行为 | 入口隐藏；直接访问路由显示占位页“暂未开放” |
| 关闭时测试断言 | `expect(page.getByText('暂未开放')).toBeVisible()` |

### 3.10 `guide25Enabled`

| 字段 | 值 |
|------|-----|
| 默认值 | `false` |
| 控制范围 | 25 道题引导完整流程 |
| 涉及页面 | `/novel-guide`、`/novel-guide/new` |
| 涉及按钮 | 立即体验 25 道题、引导新建 |
| P2 是否允许开启 | 可局部开启用于开发调试，默认关闭 |
| 关闭时 UI 行为 | 保留入口但显示“暂未开放”或仅展示介绍；进入后弹窗提示 |
| 关闭时测试断言 | `expect(startButton).toBeDisabled()` 或 `expect(page.getByText('暂未开放')).toBeVisible()` |

### 3.11 `batchGenerationEnabled`

| 字段 | 值 |
|------|-----|
| 默认值 | `false` |
| 控制范围 | 批量生成、批量续写 |
| 涉及页面 | Workspace、Outline |
| 涉及按钮 | 批量生成 |
| P2 是否允许开启 | 否 |
| 关闭时 UI 行为 | 批量操作按钮隐藏或禁用 |
| 关闭时测试断言 | `expect(batchGenerateButton).not.toBeVisible()` |

---

## 4. P2 默认规则

- 真实 LLM 关闭。
- OpenCode 真实执行关闭。
- ClaudeCode 真实执行关闭。
- 支付关闭。
- 云同步关闭。
- 真实导入导出关闭。
- 批量生成关闭。
- 25 道题引导默认关闭或仅保留入口。
- AI 拆书默认关闭。
- 名字生成器默认关闭。

---

## 5. 关闭时 UI 行为统一约定

| 场景 | UI 行为 |
|------|---------|
| 独立页面（拆书、名字生成器、云同步） | 路由可访问但显示占位页；标题“暂未开放”；不发起真实请求 |
| 设置/个人中心功能项 | 开关禁用、按钮禁用并带 `title` 提示 |
| 工具栏/操作按钮 | 禁用态 + tooltip“暂未开放” |
| 涉及真实扣费 | 隐藏金额输入与确认按钮 |
| 涉及真实外部 Adapter | 下拉框中不展示对应选项 |

禁止行为：

- 关闭时按钮仍可点击并弹出“成功”提示。
- 关闭时仍然发起真实网络请求。
- 关闭时显示“加载中”无限等待。

---

## 6. 推荐实现方式

建议新增 `packages/app/src/novel/hooks/use-feature-gates.ts`：

```typescript
export interface NovelFeatureGates {
  realLLMEnabled: boolean;
  openCodeAdapterEnabled: boolean;
  claudeCodeAdapterEnabled: boolean;
  paymentEnabled: boolean;
  cloudSyncEnabled: boolean;
  exportEnabled: boolean;
  importEnabled: boolean;
  bookAnalysisEnabled: boolean;
  nameGeneratorEnabled: boolean;
  guide25Enabled: boolean;
  batchGenerationEnabled: boolean;
}

export function useFeatureGates(): NovelFeatureGates {
  // P2 默认值全部 false，后续从配置/环境变量读取
  return {
    realLLMEnabled: false,
    openCodeAdapterEnabled: false,
    claudeCodeAdapterEnabled: false,
    paymentEnabled: false,
    cloudSyncEnabled: false,
    exportEnabled: false,
    importEnabled: false,
    bookAnalysisEnabled: false,
    nameGeneratorEnabled: false,
    guide25Enabled: false,
    batchGenerationEnabled: false,
  };
}
```

组件层用法：

```tsx
const gates = useFeatureGates();

<button disabled={!gates.paymentEnabled} title={gates.paymentEnabled ? '' : '暂未开放'}>
  充值
</button>
```

---

## 7. 测试断言策略

| 测试层级 | 策略 |
|----------|------|
| 单元测试 | `useFeatureGates()` 默认返回全 `false`；可传入 mock 配置覆盖 |
| 组件测试 | 关闭时按钮 `aria-disabled="true"` 或不可见；点击不触发 handler |
| E2E | 关闭页面访问后可见“暂未开放”；关闭按钮点击后无真实网络请求 |
| Workflow 测试 | `realLLMEnabled=false` 时，Workflow Engine 必须走 Mock/Stub Adapter |

---

## 8. P2 允许开启项说明

P2 阶段只允许以下 gate 在开发/测试环境局部开启：

- `guide25Enabled`：用于验证引导流程 UI，但不得接入真实后端。
- `chatDebugEnabled`：dev-only gate，用于 Chat Debug Console，不影响产品默认功能。
- `branchExperimentEnabled`：dev/mock mode 下允许内存或 mock 分支实验。

其余 gate 在 P2 结束前保持 `false`。

---

## 9. P2-0B 新增 Gate

| Gate Key | 默认值 | 控制范围 |
|----------|--------|---------|
| `chatDebugEnabled` | `true`（dev-only） | Chat Debug Console 是否可用 |
| `branchExperimentEnabled` | `true`（dev/mock mode） | 是否允许内存或 mock 分支 |
| `gitWorktreeEnabled` | `false` | 是否允许真实 git worktree 操作 |
| `customSkillEnabled` | `false` | 是否加载用户自定义 Skill |
| `projectCommandEnabled` | `false` | 是否加载项目级 Command |

### 9.1 `chatDebugEnabled`

| 字段 | 值 |
|------|-----|
| 默认值 | `true`（仅开发态） |
| 控制范围 | Chat Debug Console 是否可用 |
| 涉及页面 | 开发态调试入口 |
| 涉及按钮 | `/novel` 调试命令 |
| P2 是否允许开启 | 是，dev-only |
| 关闭时 UI 行为 | 调试命令解析不可用，返回 `not_implemented` |
| 关闭时测试断言 | `parseNovelDebugCommand` 被禁用或返回 `FEATURE_DISABLED` |

### 9.2 `branchExperimentEnabled`

| 字段 | 值 |
|------|-----|
| 默认值 | `true`（dev/mock mode） |
| 控制范围 | 是否允许内存或 mock 分支 |
| 涉及页面 | Chat Debug、未来分支面板 |
| 涉及按钮 | 创建分支、切换分支 |
| P2 是否允许开启 | 是，仅限 mock/内存 |
| 关闭时 UI 行为 | 分支操作按钮禁用或隐藏 |
| 关闭时测试断言 | `branchId` 参数被忽略或返回 `FEATURE_DISABLED` |

### 9.3 `gitWorktreeEnabled`

| 字段 | 值 |
|------|-----|
| 默认值 | `false` |
| 控制范围 | 是否允许真实 git worktree 操作 |
| 涉及页面 | 分支面板、工作空间设置 |
| 涉及按钮 | git worktree add / remove |
| P2 是否允许开启 | 否 |
| 关闭时 UI 行为 | 不显示真实 git worktree 操作；`WorktreeProfile.status` 只允许 `planned` |
| 关闭时测试断言 | `git worktree add` 不被调用；stub adapter 返回 `not_implemented` |

### 9.4 `customSkillEnabled`

| 字段 | 值 |
|------|-----|
| 默认值 | `false` |
| 控制范围 | 是否加载用户自定义 Skill |
| 涉及页面 | Skill 市场、项目设置 |
| 涉及按钮 | 加载自定义 Skill |
| P2 是否允许开启 | 否 |
| 关闭时 UI 行为 | 不显示自定义 Skill 入口 |
| 关闭时测试断言 | `NovelSkillRegistry` 只返回 builtin skills |

### 9.5 `projectCommandEnabled`

| 字段 | 值 |
|------|-----|
| 默认值 | `false` |
| 控制范围 | 是否加载项目级 Command |
| 涉及页面 | 项目设置、Command Registry |
| 涉及按钮 | 编辑项目命令 |
| P2 是否允许开启 | 否 |
| 关闭时 UI 行为 | 只加载内置命令 |
| 关闭时测试断言 | `NovelCommandRegistry` 只返回 builtin commands |

---

*FeatureGate 计划用于锁定 P2 阶段的功能可见性边界，后续阶段新增功能必须先在此文档登记 gate。*

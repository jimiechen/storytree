# PAGE-11 AI 模型设置

> **页级规范** · 作者中心「AI模型」Tab · 2026-06-26
> 来源：PRD 3.14（AI模型设置）+ PRD 2.14（页面 15_AI模型设置）

---

## 1. 概述

作者中心（Profile）页面的一个新 Tab，允许用户配置 AI 创作所使用的 LLM 模型、API Key、生成参数（温度/最大 tokens），并将配置持久化到 localStorage。

PRD 原描述极为简略（仅"模型选择 + 保存按钮"），本规范结合现有 `llm/` 基础设施（ModelProfile / ModelRouter / DeepSeekTransport / FeatureGate）进行合理扩展，使前端能在不修改源码的前提下切换模型与参数。

### 范围

- **前端**：新建 `profile-ai-model-tab.tsx` 组件 + `use-ai-model-settings.ts` hook + 扩展 ProfileTab 类型与 Tab 导航
- **后端**：无（本阶段不持久化到数据库，仅 localStorage；后续 P4 可扩展）
- **FeatureGate**：开启 `modelSelectionUIEnabled = true`，使本 Tab 可见

### 不做的事

- 不实现后端 AI 模型配置表 / API 路由
- 不在前端源码中硬编码 API Key
- 不自动覆盖主文本（仅保存配置，不影响生成行为）
- 不实现"测试连接"按钮（P4 范围）

---

## 2. 功能需求

### 2.1 模型选择

用户可从下拉框选择 AI 模型，选项来源于 `DEFAULT_MODEL_PROFILES`（排除 mock）：

| profileId | 名称 | provider | modelId | 适用场景 |
|-----------|------|----------|---------|---------|
| `deepseek-flash` | DeepSeek Flash | deepseek | `deepseek-v4-flash` | 快速生成（草稿/大纲/摘要/审计） |
| `deepseek-chat` | DeepSeek Chat | deepseek | `deepseek-chat` | 精细改写/批评 |

> mock-default 不在选择列表中（仅作为 fallback）

### 2.2 API Key 输入

- 类型：密码框（`type="password"`），默认脱敏显示
- 切换按钮：点击"显示"切换为明文
- 占位符：`sk-...`
- 校验：非空时长度 ≥ 20 字符（basic sanity check）
- 安全：保存到 localStorage 时不做额外加密（浏览器端存储，用户自行承担风险）

### 2.3 API 端点（可选）

- 默认值：`https://api.deepseek.com`
- 用户可自定义（支持 OpenAI 兼容端点）
- 校验：非空且以 `https://` 开头

### 2.4 生成参数

| 参数 | 类型 | 范围 | 默认值 | 说明 |
|------|------|------|--------|------|
| temperature | range | 0 - 1，步长 0.1 | 0.7 | 生成随机性 |
| maxTokens | number | 256 - 8192 | 2048 | 最大生成长度 |

### 2.5 操作按钮

| 按钮 | 功能 |
|------|------|
| 保存设置 | 将配置写入 localStorage，显示成功提示 |
| 重置默认 | 恢复为默认值，清空 API Key |

### 2.6 配置摘要

页面底部显示当前配置摘要（脱敏）：
- 当前模型：DeepSeek Flash
- API Key：`sk-****...****abcd`（仅显示后 4 位）
- 端点：https://api.deepseek.com
- 温度：0.7 / 最大 Tokens：2048

---

## 3. 数据模型

### 3.1 AIModelSettings（localStorage 存储）

```typescript
interface AIModelSettings {
  /** 选中的模型 profile ID */
  modelProfileId: string;
  /** API Key（明文存储，浏览器端） */
  apiKey: string;
  /** API 端点 */
  baseURL: string;
  /** 生成温度 */
  temperature: number;
  /** 最大 tokens */
  maxTokens: number;
  /** 最后更新时间（ISO 字符串） */
  updatedAt: string;
}
```

### 3.2 localStorage Key

```
novel:ai-model-settings
```

### 3.3 默认值

```typescript
const DEFAULT_AI_MODEL_SETTINGS: AIModelSettings = {
  modelProfileId: 'deepseek-flash',
  apiKey: '',
  baseURL: 'https://api.deepseek.com',
  temperature: 0.7,
  maxTokens: 2048,
  updatedAt: new Date().toISOString(),
};
```

---

## 4. 组件设计

### 4.1 ProfileAiModelTab

**路径**：`packages/app/src/novel/components/profile/profile-ai-model-tab.tsx`

**Props**：
```typescript
interface ProfileAiModelTabProps {
  settings: AIModelSettings;
  onChange: (settings: AIModelSettings) => void;
  onSave: () => void;
  onReset: () => void;
  /** 是否正在保存 */
  saving: boolean;
  /** 是否已保存（用于显示成功提示） */
  saved: boolean;
}
```

**布局**（SolidJS）：
```
┌─────────────────────────────────────────┐
│  AI 模型设置                              │
├─────────────────────────────────────────┤
│  模型选择                                 │
│  [ DeepSeek Flash          ▼ ]           │
│                                          │
│  API Key                                 │
│  [ ••••••••••••••••••••   ] [显示]       │
│                                          │
│  API 端点                                 │
│  [ https://api.deepseek.com]             │
│                                          │
│  生成温度                  0.7            │
│  [━━━━━●━━━━━━━━━━━━━━━━]                │
│                                          │
│  最大 Tokens             2048            │
│  [ 2048                    ]             │
│                                          │
│  [ 重置默认]        [ 保存设置 ]          │
├─────────────────────────────────────────┤
│  当前配置                                 │
│  模型: DeepSeek Flash                     │
│  API Key: sk-****...****abcd              │
│  端点: https://api.deepseek.com           │
│  温度: 0.7 / 最大 Tokens: 2048            │
└─────────────────────────────────────────┘
```

### 4.2 use-ai-model-settings.ts

**路径**：`packages/app/src/novel/hooks/use-ai-model-settings.ts`

**API**：
```typescript
function useAiModelSettings(): {
  settings: AIModelSettings;
  updateSettings: (patch: Partial<AIModelSettings>) => void;
  saveSettings: () => Promise<void>;
  resetSettings: () => void;
  saving: boolean;
  saved: boolean;
}
```

**行为**：
- 初始化时从 localStorage 读取（无则用默认值）
- `updateSettings` 更新内存信号
- `saveSettings` 写入 localStorage，设置 saved=true，2 秒后清除
- `resetSettings` 恢复默认值并写入 localStorage

---

## 5. 集成点

### 5.1 ProfileTab 类型扩展

```typescript
// types/profile.ts
export type ProfileTab = 'credits' | 'recharge' | 'export' | 'import' | 'ai-model';
```

### 5.2 profile-tab-nav.tsx

在 TABS 数组中添加：
```typescript
{ id: 'ai-model', label: 'AI模型', icon: 'auto_awesome' }
```

### 5.3 profile/index.tsx Switch

添加 Match 分支：
```typescript
<Match when={profile.activeTab() === 'ai-model'}>
  <ProfileAiModelTab {...} />
</Match>
```

### 5.4 FeatureGate

开启 `modelSelectionUIEnabled = true`（feature-gates.ts）

---

## 6. 验收标准

### Exit Criteria

- [ ] 1. `profile-tab-nav.tsx` TABS 数组包含 'ai-model' 项
- [ ] 2. `profile/index.tsx` Switch 包含 'ai-model' 分支
- [ ] 3. `profile-ai-model-tab.tsx` 组件完整渲染（模型选择/API Key/端点/温度/maxTokens/按钮）
- [ ] 4. `use-ai-model-settings.ts` hook 读写 localStorage 正确
- [ ] 5. `feature-gates.ts` 中 `modelSelectionUIEnabled = true`
- [ ] 6. API Key 输入框默认脱敏，可切换显示
- [ ] 7. 保存按钮写入 localStorage 并显示成功提示
- [ ] 8. 重置按钮恢复默认值
- [ ] 9. 配置摘要脱敏显示 API Key（仅后 4 位）
- [ ] 10. `bun run typecheck` 0 errors
- [ ] 11. `bun test src/novel` 全部通过
- [ ] 12. `bun run novel:precommit` PASSED
- [ ] 13. E2E 5/5 有头浏览器验证通过

### E2E 测试用例

| ID | 描述 |
|----|------|
| TC-AM-001 | 导航到 Profile 页面，点击 AI模型 Tab，显示设置表单 |
| TC-AM-002 | 模型下拉框包含 DeepSeek Flash 和 DeepSeek Chat 选项 |
| TC-AM-003 | API Key 输入框默认脱敏，点击显示切换为明文 |
| TC-AM-004 | 填写表单并点击保存，显示成功提示 |
| TC-AM-005 | 点击重置默认，恢复为 deepseek-flash + 空 API Key |

---

## 7. 安全注意事项

1. **API Key 不进入源码**：API Key 仅通过用户输入进入 localStorage，不硬编码在前端源码中
2. **precommit 拦截**：`novel:precommit` 脚本会拦截硬编码 API Key 和 `process.env.*API_KEY`
3. **脱敏显示**：配置摘要中 API Key 仅显示后 4 位
4. **不自动覆盖主文本**：本页面仅保存配置，不影响 AI 生成行为
5. **localStorage 风险**：浏览器端存储 API Key 存在 XSS 风险，后续 P4 可迁移到后端加密存储

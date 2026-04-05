# DreamWeaver PRD v5 Playwright 验收测试方案

> **目标**: 为 `04-ralph-tasks.md` 中的全部任务提供可自动化执行的 Playwright 验收设计
> **执行框架**: Playwright + Page Object + Fixtures + HTML/JSON 报告
> **脚本组织建议**: 按阶段分 spec，按领域复用 fixture 与测试数据

---

## 1. 执行策略

### 1.1 运行命令

```bash
npm run test:e2e
npm run test:e2e -- --grep @phase1
npm run test:e2e -- --grep @p0
```

### 1.2 报告要求

- HTML 报告：用于人工验收与失败定位
- JSON 报告：用于 CI 聚合、任务状态同步、缺陷自动归档
- 失败产物：保留 trace、screenshot、video
- 阶段标签：所有脚本统一打上 `@phase1` ~ `@phase6` 与 `@p0/@p1`

### 1.3 断言原则

- UI 断言：页面元素、文案、状态标记、交互结果
- 数据断言：响应载荷、列表数量、状态变更、订阅态/分支态/权限态
- 稳定性断言：无 console error、关键网络请求成功、重试后状态一致
- 业务断言：必须围绕“作者是否真的完成任务”而非仅校验 DOM 是否存在

## 2. 测试数据

### 2.1 固定测试账户

| 代号           | 用途                     | 关键字段                                             |
| -------------- | ------------------------ | ---------------------------------------------------- |
| `freeAuthor`   | 免费用户主流程           | `plan=free`, `ui_language=zh`, `writing_language=zh` |
| `proAuthor`    | Pro 订阅与高级模型能力   | `plan=pro`, `region=us`, `currency=USD`              |
| `studioAuthor` | Agent、Harness、高级能力 | `plan=studio`, `region=eu`, `ui_language=en`         |
| `teamOwner`    | 团队/协作入口预留        | `plan=team`, `region=ap`                             |

### 2.2 固定项目数据

| 代号               | 用途               | 关键字段                                       |
| ------------------ | ------------------ | ---------------------------------------------- |
| `fantasyProject`   | 中文仙侠写作与伏笔 | 10 章、3 角色、2 伏笔、主语言 `zh`             |
| `scifiProject`     | 英文科幻与分支     | 6 章、主语言 `en`、存在 exploration 分支       |
| `bilingualProject` | 双语写作           | `primary_language=zh`, `secondary_language=en` |
| `longDraftProject` | 长文稿性能         | 单章 100,000+ 字、20 个检索片段                |

### 2.3 固定异常数据

| 代号                     | 用途         | 场景                     |
| ------------------------ | ------------ | ------------------------ |
| `paymentFailedWebhook`   | 支付失败回归 | `invoice.payment_failed` |
| `permissionDeniedAction` | 权限拒绝回归 | 删除分支/危险批量编辑    |
| `staleMemoryEntry`       | 记忆老化警告 | `last_accessed > 1 day`  |
| `compactionFailureBurst` | 压缩熔断     | 连续 3 次压缩失败        |

## 3. 测试用例清单

> **ID 规则**: `[TC-<MODULE>-<TYPE>-<NUMBER>]`

### 3.1 Phase 1：认证、设置、工程底座

- [ ] `[TC-AUTH-HP-001]` 注册成功后自动登录并创建默认偏好记录 (`@phase1 @p0`)
- [ ] `[TC-AUTH-HP-003]` 已登录用户刷新私有路由后自动恢复会话 (`@phase1 @p0`)
- [ ] `[TC-AUTH-SP-001]` 注册时邮箱重复，显示业务错误并阻止提交 (`@phase1 @p0`)
- [ ] `[TC-AUTH-SP-002]` 登录密码错误，页面提示错误且不进入项目列表 (`@phase1 @p0`)
- [ ] `[TC-AUTH-SP-003]` API 返回 500 时，统一错误提示组件正确渲染 (`@phase1 @p1`)
- [ ] `[TC-AUTH-EC-001]` 未登录访问 `/projects` 被重定向到 `/login` (`@phase1 @p0`)
- [ ] `[TC-SETTING-HP-001]` 注册完成后设置页可读取默认 `ui_language`/`writing_language` (`@phase1 @p1`)
- [ ] `[TC-QA-HP-001]` 执行基础冒烟集时生成 HTML/JSON 报告 (`@phase1 @p0`)
- [ ] `[TC-OBS-HP-001]` 登录和项目创建请求都携带 traceId 并可在日志面板中查看 (`@phase1 @p1`)

### 3.2 Phase 2：项目、章节、工作台、AI 对话

- [ ] `[TC-PROJ-HP-001]` 项目列表成功加载并显示项目卡片 (`@phase2 @p0`)
- [ ] `[TC-PROJ-HP-002]` 创建项目成功并自动跳转工作台 (`@phase2 @p0`)
- [ ] `[TC-PROJ-SP-001]` 项目名称为空时阻止提交并提示 (`@phase2 @p0`)
- [ ] `[TC-WB-HP-001]` 工作台三栏布局完整显示 (`@phase2 @p0`)
- [ ] `[TC-WB-HP-002]` 切换章节后编辑区内容正确更新 (`@phase2 @p0`)
- [ ] `[TC-WB-HP-003]` 输入内容后字数统计实时更新 (`@phase2 @p0`)
- [ ] `[TC-WB-HP-004]` 编辑内容 2 秒后自动保存成功 (`@phase2 @p0`)
- [ ] `[TC-WB-SP-001]` 自动保存失败时显示失败状态并允许重试 (`@phase2 @p1`)
- [ ] `[TC-WB-EC-001]` 富文本基础能力可用：加粗、斜体、标题 (`@phase2 @p1`)
- [ ] `[TC-WB-UI-001]` 工作台加载期间无 console error (`@phase2 @p0`)
- [ ] `[TC-WB-UI-002]` 自动保存请求遵守 2 秒防抖 (`@phase2 @p0`)
- [ ] `[TC-CHAPTER-HP-001]` 新建章节后列表顺序和选中态正确 (`@phase2 @p0`)
- [ ] `[TC-CHAPTER-HP-002]` 更新章节标题后导航区同步展示 (`@phase2 @p1`)
- [ ] `[TC-AI-HP-001]` 通过聊天输入框发送消息并收到 AI 回复 (`@phase2 @p0`)
- [ ] `[TC-AI-HP-002]` 通过快捷操作栏发起续写请求并将结果插入编辑器 (`@phase2 @p0`)
- [ ] `[TC-AI-HP-003]` 切换模型后后续请求使用新的模型标识 (`@phase2 @p1`)
- [ ] `[TC-AI-SP-001]` 主模型不可用时自动提示 fallback 模型 (`@phase2 @p1`)

### 3.3 Phase 3：知识资产与分支系统

- [ ] `[TC-CHAR-HP-001]` 创建角色卡并关联章节、关系与成长弧线 (`@phase3 @p0`)
- [ ] `[TC-CHAR-SP-001]` 角色名称为空时阻止保存 (`@phase3 @p1`)
- [ ] `[TC-WORLD-HP-001]` 创建世界观设定并在章节引用面板中展示 (`@phase3 @p0`)
- [ ] `[TC-WORLD-EC-001]` 更新世界观版本后引用视图展示最新版本号 (`@phase3 @p1`)
- [ ] `[TC-FORESHADOW-HP-001]` 创建伏笔并展示 planted 章节锚点 (`@phase3 @p0`)
- [ ] `[TC-FORESHADOW-HP-002]` 将伏笔状态流转到 payoff 并记录实际回收章节 (`@phase3 @p0`)
- [ ] `[TC-BRANCH-HP-001]` 从当前章节创建 exploration 分支 (`@phase3 @p0`)
- [ ] `[TC-BRANCH-HP-002]` 切换分支后章节内容与分支标签同步变化 (`@phase3 @p0`)
- [ ] `[TC-BRANCH-HP-003]` 分支差异页展示章节 diff (`@phase3 @p1`)
- [ ] `[TC-BRANCH-SP-001]` 存在冲突时阻止合并并说明冲突原因 (`@phase3 @p1`)

### 3.4 Phase 4：多模型编排、Agent、Hook

- [ ] `[TC-ROUTER-HP-001]` 中文输入路由到中文优先模型，英文输入路由到英文优先模型 (`@phase4 @p0`)
- [ ] `[TC-RAG-HP-001]` AI 回复前正确注入角色、世界观、章节检索结果 (`@phase4 @p0`)
- [ ] `[TC-RAG-EC-001]` 检索结果过多时遵守 token 预算截断 (`@phase4 @p1`)
- [ ] `[TC-AGENT-HP-001]` 创建 agent 会话并完成多回合任务，状态从 active 变为 completed (`@phase4 @p0`)
- [ ] `[TC-AGENT-SP-001]` 超过最大回合后任务自动终止并提示 (`@phase4 @p1`)
- [ ] `[TC-HOOK-HP-001]` 命中 modify hook 后请求被改写并留下执行日志 (`@phase4 @p1`)
- [ ] `[TC-HOOK-SP-001]` 命中 deny hook 后阻断危险操作 (`@phase4 @p0`)

### 3.5 Phase 5：Harness 工程基础设施

- [ ] `[TC-HARNESS-HP-001]` 相同上下文重复请求时命中 Prompt Cache 并展示缓存指标 (`@phase5 @p1`)
- [ ] `[TC-PERM-HP-001]` 危险操作需要用户确认后才执行 (`@phase5 @p0`)
- [ ] `[TC-PERM-SP-001]` 权限分类器异常时默认阻断操作 (`@phase5 @p0`)
- [ ] `[TC-MEMORY-HP-001]` 触发记忆提取后后续请求可命中相关记忆 (`@phase5 @p1`)
- [ ] `[TC-MEMORY-EC-001]` 命中过期记忆时页面显示老化警告 (`@phase5 @p1`)
- [ ] `[TC-COMPACT-HP-001]` 超长会话触发压缩后上下文仍保留关键剧情摘要 (`@phase5 @p1`)
- [ ] `[TC-COMPACT-SP-001]` 连续 3 次压缩失败后熔断器打开并退化到 L2 (`@phase5 @p1`)
- [ ] `[TC-COLLAB-HP-001]` 协调器模式可分派子代理并按顺序汇总结果 (`@phase5 @p1`)
- [ ] `[TC-COLLAB-SP-001]` 子代理尝试直接与用户交互时被权限层阻止 (`@phase5 @p1`)
- [ ] `[TC-FEATURE-HP-001]` 开启 feature gate 后 Beta 功能对目标用户可见 (`@phase5 @p1`)
- [ ] `[TC-FEATURE-SP-001]` 通过环境变量紧急禁用后入口立即隐藏 (`@phase5 @p1`)

### 3.6 Phase 6：国际化、支付、合规、发布

- [ ] `[TC-I18N-HP-001]` 设置页切换 `zh/en` 后全站文案即时更新并持久化 (`@phase6 @p0`)
- [ ] `[TC-I18N-HP-002]` 日期、时间、货币格式随 locale 变化 (`@phase6 @p1`)
- [ ] `[TC-I18N-HP-003]` 切换写作语言后字数统计与模型路由同步改变 (`@phase6 @p0`)
- [ ] `[TC-BILLING-HP-001]` 用户完成 Stripe Checkout 后订阅升级为 Pro (`@phase6 @p0`)
- [ ] `[TC-BILLING-HP-002]` 套餐额度使用接近上限时显示提醒并可跳转 Customer Portal (`@phase6 @p0`)
- [ ] `[TC-BILLING-SP-001]` 支付失败 webhook 到达后本地状态变为 past_due (`@phase6 @p0`)
- [ ] `[TC-BILLING-EC-001]` 年付取消后保留到 current_period_end (`@phase6 @p1`)
- [ ] `[TC-SETTING-HP-002]` 用户修改时区、货币、区域后设置立即生效 (`@phase6 @p1`)
- [ ] `[TC-COMPLIANCE-HP-001]` 用户可以导出个人数据并提交删除申请 (`@phase6 @p0`)
- [ ] `[TC-COMPLIANCE-SP-001]` 未同意 cookie 前非必要埋点不生效 (`@phase6 @p0`)
- [ ] `[TC-PERF-HP-001]` 长文稿工作台输入与保存性能达到基线 (`@phase6 @p0`)
- [ ] `[TC-PERF-EC-001]` 大量检索片段场景下 AI 请求仍在预算内返回 (`@phase6 @p1`)
- [ ] `[TC-RELEASE-HP-001]` 执行 P0 回归集后产出阶段性发布报告 (`@phase6 @p0`)

## 4. 建议脚本结构

```text
tests/e2e/prd-v5/
├── fixtures/
│   └── prd-v5.fixture.ts
├── data/
│   └── prd-v5.data.ts
├── phase-1-auth-projects.spec.ts
├── phase-2-workbench-ai.spec.ts
├── phase-3-knowledge-branch.spec.ts
├── phase-4-agent-harness.spec.ts
├── phase-5-i18n-billing.spec.ts
└── phase-6-compliance-release.spec.ts
```

## 5. 完整脚本蓝图

### 5.1 共享测试数据

```ts
export const users = {
  freeAuthor: {
    email: 'free-author@example.com',
    password: 'Password123!',
    plan: 'free',
    uiLanguage: 'zh',
    writingLanguage: 'zh',
  },
  proAuthor: {
    email: 'pro-author@example.com',
    password: 'Password123!',
    plan: 'pro',
    uiLanguage: 'en',
    writingLanguage: 'en',
  },
  studioAuthor: {
    email: 'studio-author@example.com',
    password: 'Password123!',
    plan: 'studio',
    uiLanguage: 'en',
    writingLanguage: 'zh',
  },
};

export const projects = {
  fantasyProject: {
    id: 'proj-fantasy-001',
    name: '青云宗纪事',
    language: 'zh',
  },
  bilingualProject: {
    id: 'proj-bilingual-001',
    name: 'Twin Suns',
    primaryLanguage: 'zh',
    secondaryLanguage: 'en',
  },
};
```

### 5.2 共享 Fixture

```ts
import { test as base, expect } from '@playwright/test';
import { users, projects } from '../data/prd-v5.data';

export const test = base.extend({
  freeAuthor: async ({}, use) => use(users.freeAuthor),
  proAuthor: async ({}, use) => use(users.proAuthor),
  fantasyProject: async ({}, use) => use(projects.fantasyProject),
  mockApi: async ({ page }, use) => {
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/api/projects')) {
        return route.fulfill({
          json: { result: { code: 10200, data: { projects: [projects.fantasyProject] } } },
        });
      }
      return route.continue();
    });
    await use(page);
  },
});

export { expect };
```

### 5.3 Phase 1：认证与项目入口

```ts
import { test, expect } from './fixtures/prd-v5.fixture';

test.describe('@phase1 认证与项目入口', () => {
  test('@p0 [TC-AUTH-HP-001] 注册成功后自动创建默认偏好记录', async ({ page, freeAuthor }) => {
    await page.goto('/register');
    await page.getByLabel('用户名').fill('free-author');
    await page.getByLabel('邮箱').fill(freeAuthor.email);
    await page.getByLabel('密码').fill(freeAuthor.password);
    await page.getByRole('button', { name: '注册' }).click();
    await expect(page).toHaveURL(/\/projects/);
    await expect(page.getByTestId('ui-language-value')).toHaveText('中文');
  });

  test('@p0 [TC-PROJ-HP-002] 创建项目成功并自动跳转工作台', async ({ page }) => {
    await page.goto('/projects');
    await page.getByRole('button', { name: '新建项目' }).click();
    await page.getByLabel('项目名称').fill('青云宗纪事');
    await page.getByLabel('小说类型').click();
    await page.getByRole('option', { name: '仙侠' }).click();
    await page.getByRole('button', { name: '创建' }).click();
    await expect(page).toHaveURL(/\/workbench\//);
    await expect(page.getByTestId('project-title')).toHaveText('青云宗纪事');
  });
});
```

### 5.4 Phase 2：工作台与 AI 对话

```ts
import { test, expect } from './fixtures/prd-v5.fixture';

test.describe('@phase2 工作台与 AI', () => {
  test('@p0 [TC-WB-HP-004] 编辑内容 2 秒后自动保存成功', async ({ page }) => {
    await page.goto('/workbench/proj-fantasy-001');
    await page.getByTestId('editor').click();
    await page.keyboard.type('林墨抬头望向天穹。');
    await expect(page.getByTestId('word-count')).not.toHaveText('0');
    await expect(page.getByTestId('save-status')).toHaveText(/已保存|Saved/);
  });

  test('@p0 [TC-AI-HP-002] 快捷续写可将结果插入编辑器', async ({ page }) => {
    await page.goto('/workbench/proj-fantasy-001');
    await page.getByTestId('quick-action-continue').click();
    await expect(page.getByTestId('ai-message-assistant').last()).toContainText('续写建议');
    await page.getByRole('button', { name: '插入正文' }).click();
    await expect(page.getByTestId('editor-content')).toContainText('续写建议');
  });
});
```

### 5.5 Phase 3：知识资产与分支

```ts
import { test, expect } from './fixtures/prd-v5.fixture';

test.describe('@phase3 知识资产与分支', () => {
  test('@p0 [TC-CHAR-HP-001] 创建角色卡并关联章节', async ({ page }) => {
    await page.goto('/projects/proj-fantasy-001/characters');
    await page.getByRole('button', { name: '新建角色' }).click();
    await page.getByLabel('角色名称').fill('林墨');
    await page.getByLabel('角色类型').selectOption('protagonist');
    await page.getByLabel('首次出场章节').selectOption('chapter-001');
    await page.getByRole('button', { name: '保存' }).click();
    await expect(page.getByText('林墨')).toBeVisible();
  });

  test('@p0 [TC-BRANCH-HP-001] 从当前章节创建 exploration 分支', async ({ page }) => {
    await page.goto('/workbench/proj-fantasy-001');
    await page.getByRole('button', { name: '分支' }).click();
    await page.getByLabel('分支名称').fill('explore-ending-a');
    await page.getByLabel('分支类型').selectOption('exploration');
    await page.getByRole('button', { name: '创建分支' }).click();
    await expect(page.getByTestId('active-branch')).toHaveText('explore-ending-a');
  });
});
```

### 5.6 Phase 4-5：Agent 与 Harness

```ts
import { test, expect } from './fixtures/prd-v5.fixture';

test.describe('@phase4 @phase5 Agent 与 Harness', () => {
  test('@p0 [TC-AGENT-HP-001] Agent 会话完成多回合任务', async ({ page }) => {
    await page.goto('/projects/proj-fantasy-001/agents');
    await page.getByRole('button', { name: '启动代理任务' }).click();
    await page.getByLabel('任务描述').fill('总结最近三章并生成角色状态更新');
    await page.getByRole('button', { name: '开始执行' }).click();
    await expect(page.getByTestId('agent-status')).toHaveText('completed');
  });

  test('@p0 [TC-PERM-SP-001] 权限分类器异常时默认阻断危险操作', async ({ page }) => {
    await page.goto('/workbench/proj-fantasy-001');
    await page.getByRole('button', { name: '批量删除章节' }).click();
    await expect(page.getByTestId('permission-denied-banner')).toContainText('已阻止');
  });

  test('@p1 [TC-COMPACT-SP-001] 压缩连续失败后熔断器打开', async ({ page }) => {
    await page.goto('/projects/proj-fantasy-001/ai-console');
    await page.getByRole('button', { name: '模拟压缩失败' }).click();
    await page.getByRole('button', { name: '模拟压缩失败' }).click();
    await page.getByRole('button', { name: '模拟压缩失败' }).click();
    await expect(page.getByTestId('compact-breaker-state')).toHaveText('open');
  });
});
```

### 5.7 Phase 6：国际化、支付、合规、发布

```ts
import { test, expect } from './fixtures/prd-v5.fixture';

test.describe('@phase6 国际化、支付、合规、发布', () => {
  test('@p0 [TC-I18N-HP-001] 切换 UI 语言后全站文案即时更新', async ({ page }) => {
    await page.goto('/settings');
    await page.getByLabel('界面语言').selectOption('en');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('@p0 [TC-BILLING-HP-001] Checkout 成功后订阅升级为 Pro', async ({ page }) => {
    await page.goto('/billing');
    await page.getByRole('button', { name: '升级到 Pro' }).click();
    await page.getByRole('button', { name: '模拟支付成功' }).click();
    await expect(page.getByTestId('subscription-plan')).toHaveText('Pro');
  });

  test('@p0 [TC-COMPLIANCE-HP-001] 用户可以导出个人数据并提交删除申请', async ({ page }) => {
    await page.goto('/settings/privacy');
    await page.getByRole('button', { name: '导出我的数据' }).click();
    await expect(page.getByText('导出任务已创建')).toBeVisible();
    await page.getByRole('button', { name: '申请删除账户' }).click();
    await page.getByRole('button', { name: '确认删除' }).click();
    await expect(page.getByText('删除申请已提交')).toBeVisible();
  });
});
```

## 6. 覆盖映射说明

- `04-ralph-tasks.md` 中每个任务至少映射 1 个 P0/P1 用例
- 关键链路任务映射 2 个以上用例，覆盖成功与失败场景
- Harness 任务除了 UI 用例，还应补充 API 合同测试或状态面板断言
- 长文稿、分支冲突、支付失败、权限拒绝、熔断降级属于强制回归场景

## 7. 通过门槛

| 维度               | 门槛                          |
| ------------------ | ----------------------------- |
| P0 用例通过率      | 100%                          |
| P1 用例通过率      | ≥ 95%                         |
| Console Error      | 0                             |
| 核心网络请求失败率 | 0                             |
| HTML/JSON 报告     | 必须生成                      |
| 关键产物           | trace、video、screenshot 完整 |

## 8. 失败分流建议

- 认证/支付失败：优先检查会话、webhook 幂等、测试数据状态
- 工作台/编辑器失败：优先检查选择器、自动保存节流、mock 数据完整性
- 分支/知识资产失败：优先检查 fixture 中项目初始化与引用关系
- Harness 失败：优先检查 feature gate、mock 状态注入、测试前置开关
- 国际化失败：优先检查 locale 装载、持久化与格式化函数

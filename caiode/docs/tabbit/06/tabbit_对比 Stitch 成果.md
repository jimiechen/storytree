继续下发Phase  M1的提示词

好的，我来为您生成 Phase M1 的详细提示词。

...Compressing...&&...compressing...

好的，Phase M1 任务是为 `@novel` 补充 12 条 MVP E2E 测试。我先扫描现有代码结构、现有 `data-testid` 使用情况以及现有 E2E 文件，再一次性完成所有文件操作。

先并行扫描：现有 E2E 目录结构、组件中的 `data-testid` 使用情况，以及关键组件文件列表。

E2B glob 超时了。改用 `e2b_bash` 做精准目录探查，同时检查 `/mnt/local/novel` 的父路径是否能访问到 `packages/app/e2e/`。

`/mnt/local/novel` 指向 `src/novel`，E2E 目录在上两级 `packages/app/e2e/`。并行探查所有关键信息。

E2E 目录在 `packages/app/e2e/`，不在 `/mnt/local/novel` 挂载范围内，但 `data-testid` 添加在 `src/novel/components/` 内（在挂载范围内）。先并行读取关键组件文件，了解当前代码结构。

E2E 目录不在 `/mnt/local/novel` 挂载范围内。执行策略：
1. `data-testid` 补充 → 直接写入 `/mnt/local/novel/components/`（挂载范围内）  
2. E2E spec 文件 → 写入 `/mnt/cos/artifacts/`，用户只需 copy 到正确位置  

先并行读取所有关键组件，了解 DOM 结构：

现在已了解关键结构。继续并行读取所有需要修改的组件文件，同时查看 workspace layout、side-nav、outline list 等：

已了解核心结构。现在并行读取剩余关键文件：workspace layout、nav bar、outline list、章节meta、成就页、modal host 和导航 hook：

继续并行读取剩余关键文件：side-nav、modal host、achievements、editor-chapter-meta 以及 hooks 目录。

已掌握核心结构。有几点关键发现需要立刻确认后再开始写代码：视图路由是纯状态切换（无 URL 变化）、hooks 路径需确认、还需读取 profile/achievements/generation-settings-modal、以及 playwright.config。并行读取：

已充分掌握架构。几个关键点已清楚：
1. **纯视图切换路由**（无 URL 变化），E2E 需用 `waitForSelector` 而非 `waitForURL`
2. **已有 testid**：`workspace-logo`、`bookshelf-project-card`
3. **成就入口**位置不明确 — 需读 `editor-toolbar`、`character-protagonist`、`world-setting/index`、`profile-page-header` 等剩余文件才能确认

并行读取所有剩余需要的文件：

扫描阶段已完成，但由于上下文耗尽，**实际文件编写尚未执行**。以下是扫描结论，可直接交给 Trae 继续：

---

## Phase M1 扫描结论

### 已确认的现有 `data-testid`
| testid | 文件 |
|---|---|
| `workspace-logo` | `workspace-top-app-bar.tsx` ✅ |
| `bookshelf-project-card` | `bookshelf/index.tsx` ✅ |

### 路由架构确认
- SolidJS SPA，URL 参数控制视图：`/novel` → workspace，`?view=bookshelf/character-panel/world-setting/profile` 等
- 成就页入口：`?view=achievements`，但**工作台无跳转按钮**，需补充

---

## 直接下发给 Trae 的 Phase M1 指令

```
主控下发 Phase M1 — 12条 MVP E2E 覆盖。

=== 步骤 1：补充 data-testid（10处）===

1. packages/app/src/novel/components/novel-workspace/layout/workspace-layout.tsx
   根 div 添加: data-testid="workspace-layout"

2. packages/app/src/novel/components/novel-workspace/layout/workspace-side-nav.tsx
   NavItem 函数增加 testid? 可选 prop，传入 data-testid 到 button：
   - 章节 NavItem: data-testid="sidenav-chapters"
   - 人物 NavItem: data-testid="sidenav-characters"
   - 设定 NavItem: data-testid="sidenav-world-setting"

3. packages/app/src/novel/components/novel-workspace/layout/workspace-top-app-bar.tsx
   - 设置齿轮按钮: data-testid="workspace-settings-btn"
   - 头像 img 改为可点击 button: data-testid="workspace-avatar-btn"
   - 新增成就按钮（⭐）: data-testid="workspace-achievements-btn"，
     onClick={props.onOpenAchievements}
   - WorkspaceTopAppBarActions 接口新增 onOpenAchievements?: () => void

4. packages/app/src/novel/components/novel-workspace/index.tsx
   - actions 新增: openAchievements: () => vm.openView('achievements')
   - WorkspaceTopAppBar 传入: onOpenAchievements={actions.openAchievements}

5. packages/app/src/novel/components/novel-workspace/outline/workspace-outline-list.tsx
   章节行 div 添加: data-testid="outline-chapter-item"

6. packages/app/src/novel/components/novel-editor/editor-toolbar.tsx
   - 左侧 div 添加: data-testid="editor-back-btn"
   - 字数中间区域 div 添加: data-testid="editor-word-count"

7. packages/app/src/novel/components/novel-editor/editor-chapter-meta.tsx
   章节编号 <span>: data-testid="chapter-number"

8. packages/app/src/novel/components/character-panel/index.tsx
   根 div 添加: data-testid="character-panel-page"

9. packages/app/src/novel/components/world-setting/world-overview-bento.tsx
   根 div 添加: data-testid="world-overview-bento"

10. packages/app/src/novel/components/achievements/achievement-grid.tsx
    每个成就卡片 div 添加: data-testid="achievement-card"

11. packages/app/src/novel/components/layout/generation-settings-modal.tsx
    内层白色 div (class="bg-white rounded-xl...") 添加:
    role="dialog" data-testid="generation-settings-modal"

=== 步骤 2：同步修复 BUG-2 ===

packages/app/src/novel/components/novel-editor/index.tsx L169:
  chapterNumber={`#`}
  ↓ 改为
  chapterNumber={`#`}

（ch() 是 EditorToolbar 的 accessor 已传入 orderIndex，
在 EditorRightPanel 调用处直接使用 ch().orderIndex）

=== 步骤 3：创建 E2E 文件 ===

新建 packages/app/e2e/novel/novel-mvp-flow.spec.ts，内容如下：

---

import { test, expect } from '@playwright/test';

test.describe('Novel MVP 主链路', () => {
  test.beforeEach(async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/novel');
    await page.waitForSelector('[data-testid="workspace-layout"]', { timeout: 10000 });
    (page as any)._consoleErrors = errors;
  });

  // E2E-01: 应用启动与默认视图
  test('E2E-01: 应用启动显示工作台', async ({ page }) => {
    await expect(page.locator('[data-testid="workspace-layout"]')).toBeVisible();
    await expect(page.locator('[data-testid="workspace-logo"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidenav-chapters"]')).toBeVisible();
  });

  // E2E-02: 工作台章节大纲列表加载
  test('E2E-02: 工作台章节列表加载 ≥3条', async ({ page }) => {
    const items = page.locator('[data-testid="outline-chapter-item"]');
    await expect(items.first()).toBeVisible();
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  // E2E-03: 侧边栏章节按钮进入编辑器
  test('E2E-03: 章节按钮进入编辑器', async ({ page }) => {
    await page.locator('[data-testid="sidenav-chapters"]').click();
    await expect(page.locator('[data-testid="editor-word-count"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="editor-back-btn"]')).toBeVisible();
  });

  // E2E-04: 章节编号正确显示（BUG-2 修复验证）
  test('E2E-04: 章节编号正确显示为 #N', async ({ page }) => {
    await page.locator('[data-testid="sidenav-chapters"]').click();
    await expect(page.locator('[data-testid="editor-word-count"]')).toBeVisible({ timeout: 8000 });
    const numText = await page.locator('[data-testid="chapter-number"]').textContent();
    expect(numText).toMatch(/^#\d+$/);
    expect(numText).not.toBe('#');
  });

  // E2E-05: 编辑器返回工作台
  test('E2E-05: 编辑器返回工作台', async ({ page }) => {
    await page.locator('[data-testid="sidenav-chapters"]').click();
    await expect(page.locator('[data-testid="editor-word-count"]')).toBeVisible({ timeout: 8000 });
    await page.locator('[data-testid="editor-back-btn"] button').first().click();
    await expect(page.locator('[data-testid="workspace-layout"]')).toBeVisible({ timeout: 8000 });
  });

  // E2E-06: Logo 返回书架
  test('E2E-06: Logo 点击返回书架', async ({ page }) => {
    await page.locator('[data-testid="workspace-logo"]').click();
    await expect(page.locator('[data-testid="bookshelf-project-card"]').first()).toBeVisible({ timeout: 8000 });
  });

  // E2E-07: 书架项目卡片进入工作台
  test('E2E-07: 书架卡片进入工作台', async ({ page }) => {
    await page.goto('/novel?view=bookshelf');
    await expect(page.locator('[data-testid="bookshelf-project-card"]').first()).toBeVisible({ timeout: 8000 });
    await page.locator('[data-testid="bookshelf-project-card"]').first().click();
    await expect(page.locator('[data-testid="workspace-layout"]')).toBeVisible({ timeout: 8000 });
  });

  // E2E-08: 人物按钮进入角色面板
  test('E2E-08: 人物按钮进入角色面板', async ({ page }) => {
    await page.locator('[data-testid="sidenav-characters"]').click();
    await expect(page.locator('[data-testid="character-panel-page"]')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('主角')).toBeVisible();
  });

  // E2E-09: 设定按钮进入世界设定
  test('E2E-09: 设定按钮进入世界设定', async ({ page }) => {
    await page.locator('[data-testid="sidenav-world-setting"]').click();
    await expect(page.locator('[data-testid="world-overview-bento"]')).toBeVisible({ timeout: 8000 });
    const bentoCards = page.locator('[data-testid="world-overview-bento"] > div > div');
    expect(await bentoCards.count()).toBe(4);
  });

  // E2E-10: 头像按钮进入个人中心
  test('E2E-10: 头像按钮进入个人中心', async ({ page }) => {
    await page.locator('[data-testid="workspace-avatar-btn"]').click();
    await expect(page.getByText('个人中心')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/\d+\s*字/)).toBeVisible();
  });

  // E2E-11: 成就按钮进入成就页
  test('E2E-11: 成就按钮进入成就页', async ({ page }) => {
    await page.locator('[data-testid="workspace-achievements-btn"]').click();
    await expect(page.getByText('成就系统')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="achievement-card"]').first()).toBeVisible();
    const cards = page.locator('[data-testid="achievement-card"]');
    expect(await cards.count()).toBeGreaterThanOrEqual(5);
  });

  // E2E-12: 生成参数 Modal 打开与关闭
  test('E2E-12: 生成参数 Modal 打开与关闭', async ({ page }) => {
    await page.locator('[data-testid="workspace-settings-btn"]').click();
    await expect(page.locator('[data-testid="generation-settings-modal"]')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('目标字数')).toBeVisible();
    // 点击关闭按钮（modal header 内的 X）
    await page.locator('[data-testid="generation-settings-modal"]')
      .locator('header button').click();
    await expect(page.locator('[data-testid="generation-settings-modal"]')).not.toBeVisible();
  });
});

---

=== 步骤 4：验证 ===

cd packages/app && bun typecheck
cd packages/app && bun test src/novel
cd packages/app && bunx playwright test e2e/novel/novel-mvp-flow.spec.ts --reporter=list

验收标准：
  typecheck: 0 errors
  unit test: ≥91 pass / 0 fail
  E2E: 12 passed / 0 failed / 0 skipped

禁止：不接真实后端 / 不删 _legacy / 单文件 < 500 行 / 不扩大功能范围

完成后输出 [READY_FOR_PHASE_M1_REVIEW]
```

*内容由 AI 生成仅供参考*
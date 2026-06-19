import { test, expect } from '@playwright/test';

/**
 * Phase M1 — 12 条 MVP 主链路 E2E 测试
 *
 * 覆盖: 工作台 → 编辑器 → 书架 → 角色面板 → 世界设定 → 个人中心 → 成就 → Modal
 * 前置: 所有 data-testid 已在各组件中就位
 */

test.describe('Novel MVP 主链路', () => {
  /** 每个测试前：打开 /novel 并等待工作台加载 */
  test.beforeEach(async ({ page }) => {
    await page.goto('/novel');
    await page.waitForLoadState('load');
    // 等待工作台布局渲染（冷启动可能较慢）
    await page.waitForSelector('[data-testid="workspace-layout"]', { timeout: 20_000 });
  });

  // ─── E2E-01: 应用启动与默认视图 ──────────────────────────────
  test('E2E-01: 应用启动显示工作台', async ({ page }) => {
    await expect(page.locator('[data-testid="workspace-layout"]')).toBeVisible();
    await expect(page.locator('[data-testid="workspace-logo"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidenav-chapters"]')).toBeVisible();
  });

  // ─── E2E-02: 工作台章节大纲列表加载 ─────────────────────────
  test('E2E-02: 工作台章节列表加载 >=3条', async ({ page }) => {
    const items = page.locator('[data-testid="outline-chapter-item"]');
    await expect(items.first()).toBeVisible({ timeout: 8000 });
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  // ─── E2E-03: 侧边栏章节按钮进入编辑器 ───────────────────────
  test('E2E-03: 章节按钮进入编辑器', async ({ page }) => {
    await page.locator('[data-testid="sidenav-chapters"]').click();
    // 编辑器工具栏出现即表示进入编辑器
    await expect(page.locator('[data-testid="editor-word-count"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="editor-back-btn"]')).toBeVisible();
  });

  // ─── E2E-04: 章节编号正确显示（BUG-2 修复验证）──────────────
  test('E2E-04: 章节编号正确显示为 #N', async ({ page }) => {
    await page.locator('[data-testid="sidenav-chapters"]').click();
    await expect(page.locator('[data-testid="editor-word-count"]')).toBeVisible({ timeout: 10_000 });
    const numText = await page.locator('[data-testid="editor-right-panel-chapter-number"]').textContent();
    expect(numText).toMatch(/^#\d+$/);
    expect(numText).not.toBe('#');
  });

  // ─── E2E-05: 编辑器返回工作台 ───────────────────────────────
  test('E2E-05: 编辑器返回工作台', async ({ page }) => {
    // 先进入编辑器
    await page.locator('[data-testid="sidenav-chapters"]').click();
    await expect(page.locator('[data-testid="editor-word-count"]')).toBeVisible({ timeout: 10_000 });
    // 点击返回按钮（editor-back-btn 内的 arrow_back 按钮）
    await page.locator('[data-testid="editor-back-btn"]').locator('button').first().click();
    // 应回到工作台
    await expect(page.locator('[data-testid="workspace-layout"]')).toBeVisible({ timeout: 10_000 });
  });

  // ─── E2E-06: Logo 返回书架 ──────────────────────────────────
  test('E2E-06: Logo 点击返回书架', async ({ page }) => {
    await page.locator('[data-testid="workspace-logo"]').click();
    await expect(page.locator('[data-testid="bookshelf-project-card"]').first()).toBeVisible({ timeout: 10_000 });
  });

  // ─── E2E-07: 书架项目卡片进入工作台 ─────────────────────────
  test('E2E-07: 书架卡片进入工作台', async ({ page }) => {
    // 直接导航到书架
    await page.goto('/novel?view=bookshelf');
    await page.waitForLoadState('load');
    await expect(page.locator('[data-testid="bookshelf-project-card"]').first()).toBeVisible({ timeout: 10_000 });
    // 点击第一个项目卡片
    await page.locator('[data-testid="bookshelf-project-card"]').first().click();
    // 应进入工作台
    await expect(page.locator('[data-testid="workspace-layout"]')).toBeVisible({ timeout: 10_000 });
  });

  // ─── E2E-08: 人物按钮进入角色面板 ───────────────────────────
  test('E2E-08: 人物按钮进入角色面板', async ({ page }) => {
    await page.locator('[data-testid="sidenav-characters"]').click();
    await expect(page.locator('[data-testid="character-panel-page"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('主角')).toBeVisible();
  });

  // ─── E2E-09: 设定按钮进入世界设定 ───────────────────────────
  test('E2E-09: 设定按钮进入世界设定（Bento 4卡可见）', async ({ page }) => {
    await page.locator('[data-testid="sidenav-world-setting"]').click();
    await expect(page.locator('[data-testid="world-overview-bento"]')).toBeVisible({ timeout: 10_000 });
    // Bento 卡片应为 4 个子 div
    const bentoCards = page.locator('[data-testid="world-overview-bento"] > div');
    expect(await bentoCards.count()).toBe(4);
  });

  // ─── E2E-10: 头像按钮进入个人中心 ───────────────────────────
  test('E2E-10: 头像按钮进入个人中心', async ({ page }) => {
    await page.locator('[data-testid="workspace-avatar-btn"]').click();
    await expect(page.getByText(/个人中心|用户信息/)).toBeVisible({ timeout: 10_000 });
    // 统计数字应可见（如 "字" 或 "本"）
    await expect(page.getByText(/\d+\s*字/)).toBeVisible({ timeout: 5000 });
  });

  // ─── E2E-11: 成就按钮进入成就页 ─────────────────────────────
  test('E2E-11: 成就按钮进入成就页', async ({ page }) => {
    await page.locator('[data-testid="workspace-achievements-btn"]').click();
    await expect(page.getByText(/成就系统|成就/)).toBeVisible({ timeout: 10_000 });
    // 至少应有 5 张成就卡片
    const cards = page.locator('[data-testid="achievement-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
    expect(await cards.count()).toBeGreaterThanOrEqual(5);
  });

  // ─── E2E-12: 生成参数 Modal 打开与关闭 ─────────────────────
  test('E2E-12: 生成参数 Modal 打开与关闭', async ({ page }) => {
    // 点击设置齿轮按钮打开 Modal
    await page.locator('[data-testid="workspace-settings-btn"]').click();
    // Modal 对话框应可见
    await expect(page.locator('[data-testid="generation-settings-modal"][role="dialog"]')).toBeVisible({ timeout: 10_000 });
    // "目标字数" 标签应可见
    await expect(page.getByText('目标字数')).toBeVisible();
    // 点击关闭按钮（modal header 内的 X）
    await page
      .locator('[data-testid="generation-settings-modal"]')
      .locator('header button')
      .click();
    // Modal 应消失
    await expect(page.locator('[data-testid="generation-settings-modal"]')).not.toBeVisible();
  });
});

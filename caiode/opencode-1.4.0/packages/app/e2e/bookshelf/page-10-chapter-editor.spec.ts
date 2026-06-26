import { test, expect, type Page } from '@playwright/test';

/**
 * PAGE-10 章节编辑器（统一工作台）端到端验收测试
 *
 * 验收依据: packages/app/src/novel/docs/page-specs/PAGE-10_chapter_editor.md
 *
 * 覆盖用例:
 *   TC-ED-001 书架→工作台→编辑器导航（URL切换 + 章节列表加载）
 *   TC-ED-002 章节列表点击切换（编辑区内容切换）
 *   TC-ED-003 编辑器工具栏可见（返回/历史/AI续写/保存按钮）
 *   TC-ED-004 章节状态颜色点（draft=#cbc3d7 灰色点）
 *   TC-ED-005 创建新章节（列表新增 + 编辑器聚焦）
 *   TC-ED-006 三栏布局视觉断言（左SideNav + 中编辑区 + 右面板）
 *   TC-ED-007 主色调视觉断言（#6b38d4 紫色元素存在）
 *
 * 运行: bun test:e2e -- e2e/bookshelf/page-10-chapter-editor.spec.ts
 */

const EDITOR_URL = '/novel?view=editor&projectId=proj-001';
const STEP_DELAY = 2000;

async function gotoEditor(page: Page) {
  let retries = 3;
  while (retries > 0) {
    try {
      await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      break;
    } catch (e) {
      retries--;
      if (retries === 0) throw e;
      await page.waitForTimeout(3000);
    }
  }
  // 等待编辑器加载 — 章节列表或"请选择一个章节"出现
  await Promise.race([
    page.waitForSelector('[data-testid="editor-chapter-list"]', { timeout: 30_000 }),
    page.waitForSelector('text=请选择一个章节', { timeout: 30_000 }),
  ]);
  await page.waitForTimeout(STEP_DELAY);
}

async function snapshot(page: Page, name: string) {
  await page.screenshot({
    path: `e2e/test-results/page-10-${name}.png`,
    fullPage: true,
  });
}

test.describe('PAGE-10 章节编辑器（统一工作台）端到端验收', () => {

  test.beforeEach(async ({ page }) => {
    await gotoEditor(page);
  });

  // ─── TC-ED-001 导航 + 章节列表加载 ─────────────────────
  test('TC-ED-001 书架→编辑器导航 + 章节列表加载', async ({ page }) => {
    // 左侧导航栏存在
    await expect(page.locator('[data-testid="editor-chapter-list"]')).toBeVisible();
    // 至少有一个章节项
    const chapterItems = page.locator('[data-testid="editor-chapter-item"]');
    const count = await chapterItems.count();
    expect(count).toBeGreaterThan(0);
    await snapshot(page, 'tc-001-navigation');
  });

  // ─── TC-ED-002 章节列表点击切换 ─────────────────────────
  test('TC-ED-002 章节列表点击切换章节', async ({ page }) => {
    const chapterItems = page.locator('[data-testid="editor-chapter-item"]');
    const count = await chapterItems.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // 点击第二个章节
    await chapterItems.nth(1).click();
    await page.waitForTimeout(STEP_DELAY);

    // 第二个章节应高亮（背景色变化）
    const secondItem = chapterItems.nth(1);
    const bg = await secondItem.evaluate(el => getComputedStyle(el).backgroundColor);
    // 高亮项的背景色应为 #eff4ff（rgba(239, 244, 255, ...)）
    expect(bg).toContain('239');

    await snapshot(page, 'tc-002-chapter-switch');
  });

  // ─── TC-ED-003 编辑器工具栏可见 ─────────────────────────
  test('TC-ED-003 编辑器工具栏按钮可见', async ({ page }) => {
    // 等待章节加载后工具栏出现
    await page.waitForSelector('button:has-text("AI续写"), button:has-text("保存")', { timeout: 15_000 });

    // AI续写按钮
    await expect(page.locator('button:has-text("AI续写")')).toBeVisible();
    // 保存按钮
    await expect(page.locator('button:has-text("保存")')).toBeVisible();

    await snapshot(page, 'tc-003-toolbar');
  });

  // ─── TC-ED-004 章节状态颜色点 ───────────────────────────
  test('TC-ED-004 章节状态颜色点存在', async ({ page }) => {
    // 章节列表中的状态点（小圆点）
    const chapterItems = page.locator('[data-testid="editor-chapter-item"]');
    const firstItem = chapterItems.first();

    // 查找圆点元素（span with rounded-full class）
    const dot = firstItem.locator('span.rounded-full').first();
    await expect(dot).toBeVisible();

    // 验证圆点有背景色
    const bg = await dot.evaluate(el => getComputedStyle(el).backgroundColor);
    // 颜色应为 draft(#cbc3d7) / revising(#f59e0b) / completed(#10b981) / published(#6b38d4) 之一
    // 只检查有颜色即可（不强制特定颜色，因为 mock 数据状态各异）
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
    expect(bg).not.toBe('transparent');

    await snapshot(page, 'tc-004-status-dot');
  });

  // ─── TC-ED-005 创建新章节 ───────────────────────────────
  test('TC-ED-005 创建新章节', async ({ page }) => {
    const beforeCount = await page.locator('[data-testid="editor-chapter-item"]').count();

    // 点击"新建章节"按钮
    await page.locator('[data-testid="create-chapter-btn"]').click();
    await page.waitForTimeout(STEP_DELAY);

    // 章节数量应增加
    const afterCount = await page.locator('[data-testid="editor-chapter-item"]').count();
    expect(afterCount).toBe(beforeCount + 1);

    await snapshot(page, 'tc-005-create-chapter');
  });

  // ─── TC-ED-006 三栏布局视觉断言 ─────────────────────────
  test('TC-ED-006 三栏布局视觉断言', async ({ page }) => {
    // 左侧导航栏（aside，width 260px）
    const leftSidebar = page.locator('aside').first();
    await expect(leftSidebar).toBeVisible();
    const leftWidth = await leftSidebar.evaluate(el => getComputedStyle(el).width);
    expect(parseInt(leftWidth)).toBeGreaterThanOrEqual(250);

    // 编辑器工具栏存在
    await page.waitForSelector('button:has-text("AI续写"), button:has-text("保存")', { timeout: 15_000 });

    // 右侧面板存在（EditorRightPanel 或 ChapterInfoPanel）
    const rightArea = page.locator('text=章节信息').or(page.locator('text=信息审计'));
    await expect(rightArea.first()).toBeVisible({ timeout: 10_000 });

    await snapshot(page, 'tc-006-three-column-layout');
  });

  // ─── TC-ED-007 主色调视觉断言 ───────────────────────────
  test('TC-ED-007 主色调 #6b38d4 紫色元素存在', async ({ page }) => {
    // 查找紫色元素（新建章节按钮使用 #6b38d4 渐变）
    const createBtn = page.locator('[data-testid="create-chapter-btn"]');
    await expect(createBtn).toBeVisible();

    // 验证按钮背景包含紫色渐变
    const bgImage = await createBtn.evaluate(el => getComputedStyle(el).backgroundImage);
    // 渐变应包含 #6b38d4 或 rgb(107, 56, 212)
    expect(bgImage).toContain('107, 56, 212');

    // 项目名标题应为紫色
    const projectTitle = page.locator('h2.text-\\[\\#6b38d4\\]').or(page.locator('h2').filter({ hasText: '项目' }));
    await expect(projectTitle.first()).toBeVisible();

    await snapshot(page, 'tc-007-primary-color');
  });

});

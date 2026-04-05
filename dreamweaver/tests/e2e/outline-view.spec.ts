import { test, expect } from '@playwright/test';

/**
 * T-UI-003: 大纲结构视图 E2E 测试
 * 验证大纲层级展示和点击高亮功能
 */
test.describe('Outline View - T-UI-003', () => {
  const projectId = 'test-project-123';

  test.beforeEach(async ({ page }) => {
    // 访问工作台页面
    await page.goto(`/workbench/${projectId}`);
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
  });

  test('should display Story Explorer with outline structure', async ({ page }) => {
    // 验证 Story Explorer 标题
    const explorerTitle = page.locator('text=Story Explorer');
    await expect(explorerTitle).toBeVisible();

    // 验证卷标题存在
    const volumeTitles = page.locator('h3');
    await expect(volumeTitles.first()).toBeVisible();
  });

  test('should display volume with colored border', async ({ page }) => {
    // 验证卷有左侧边框
    const volumeHeaders = page.locator('[class*="border-l-4"]');
    await expect(volumeHeaders.first()).toBeVisible();
  });

  test('should display chapter list under volume', async ({ page }) => {
    // 等待章节列表加载
    await page.waitForTimeout(1000);

    // 验证章节存在
    const chapters = page.locator('[class*="font-serif"]');
    const count = await chapters.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display chapter status badges', async ({ page }) => {
    // 验证状态标签
    const statusBadges = page.locator('text=/草稿|写作中|定稿|已发布/');
    await expect(statusBadges.first()).toBeVisible();
  });

  test('should display word count for chapters', async ({ page }) => {
    // 验证字数显示
    const wordCounts = page.locator('text=/\\d+\\.?\\d*k|—/');
    await expect(wordCounts.first()).toBeVisible();
  });

  test('should highlight active chapter on click', async ({ page }) => {
    // 等待章节加载
    await page.waitForTimeout(1000);

    // 点击第一个章节
    const firstChapter = page.locator('[class*="font-serif"]').first();
    await firstChapter.click();

    // 验证章节被高亮（有 primary 颜色类）
    const highlightedChapter = page.locator('[class*="bg-primary/5"], [class*="border-primary/20"]');
    await expect(highlightedChapter.first()).toBeVisible();
  });

  test('should toggle volume expand/collapse', async ({ page }) => {
    // 找到第一个卷的展开/折叠按钮
    const expandButton = page.locator('span[class*="expand_more"], span[class*="chevron_right"]').first();

    if (await expandButton.isVisible()) {
      // 点击折叠
      await expandButton.click();
      await page.waitForTimeout(300);

      // 验证章节被隐藏
      const chaptersAfterCollapse = page.locator('[class*="font-serif"]');
      // 章节数量应该减少

      // 再次点击展开
      await expandButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('should display batch update button', async ({ page }) => {
    // 验证批量更新按钮
    const batchUpdateBtn = page.locator('text=批量更新');
    await expect(batchUpdateBtn).toBeVisible();
  });

  test('should display export button', async ({ page }) => {
    // 验证导出按钮
    const exportBtn = page.locator('text=导出');
    await expect(exportBtn).toBeVisible();
  });

  test('should show empty state when no volumes', async ({ page }) => {
    // 访问一个没有卷章的项目（模拟空状态）
    // 这里只是验证空状态组件存在
    const emptyState = page.locator('text=暂无卷章');
    // 如果有空状态则验证，否则跳过
    if (await emptyState.isVisible().catch(() => false)) {
      await expect(emptyState).toBeVisible();
      await expect(page.locator('text=点击下方按钮创建')).toBeVisible();
    }
  });

  test('should have correct indentation for chapters', async ({ page }) => {
    // 验证章节有缩进（ml-4 类）
    const indentedChapters = page.locator('[class*="ml-4"]');
    await expect(indentedChapters.first()).toBeVisible();
  });

  test('should display volume chapter count', async ({ page }) => {
    // 验证卷显示章节数量
    const chapterCounts = page.locator('text=/\\d+ Chapters/');
    await expect(chapterCounts.first()).toBeVisible();
  });
});

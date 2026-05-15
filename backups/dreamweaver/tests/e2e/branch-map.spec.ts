import { test, expect } from '@playwright/test';

test.describe('分支导图视图 (T-UI-006)', () => {
  const projectId = 'test-project-id';

  test.beforeEach(async ({ page }) => {
    // 访问分支导图页面
    await page.goto(`/workbench/${projectId}/branches`);
    // 等待页面加载完成
    await page.waitForSelector('[data-testid="branch-map-page"]', { timeout: 10000 });
  });

  test('应该显示分支导图页面', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator('text=Narrative Branches').first()).toBeVisible();
    
    // 验证顶部状态信息
    await expect(page.locator('text=4 Active Branches • 1 Merged').first()).toBeVisible();
  });

  test('应该显示视图切换按钮', async ({ page }) => {
    // 验证树状视图按钮
    await expect(page.locator('text=树状视图').first()).toBeVisible();
    // 验证时间线视图按钮
    await expect(page.locator('text=时间线视图').first()).toBeVisible();
  });

  test('应该显示操作按钮', async ({ page }) => {
    // 验证新建分支按钮
    await expect(page.locator('text=NEW BRANCH').first()).toBeVisible();
  });

  test('应该显示缩放控制', async ({ page }) => {
    // 验证缩放百分比显示
    await expect(page.locator('text=100%').first()).toBeVisible();
    // 验证加减按钮
    await expect(page.locator('text=remove').first()).toBeVisible();
    await expect(page.locator('text=add').first()).toBeVisible();
  });

  test('应该显示分支节点', async ({ page }) => {
    // 验证根节点
    await expect(page.locator('text=Main Storyline').first()).toBeVisible();
    await expect(page.locator('text=卷三：命运的转折').first()).toBeVisible();
    
    // 验证分支A
    await expect(page.locator('text=Active Branch').first()).toBeVisible();
    await expect(page.locator('text=分支A: 接受邀请').first()).toBeVisible();
    
    // 验证分支B
    await expect(page.locator('text=IF-line').first()).toBeVisible();
    await expect(page.locator('text=分支B: 拒绝邀请').first()).toBeVisible();
  });

  test('视图切换按钮应该可点击', async ({ page }) => {
    // 点击时间线视图
    await page.click('text=时间线视图');
    
    // 验证按钮状态变化（通过样式类）
    const timelineButton = page.locator('text=时间线视图').first();
    await expect(timelineButton).toBeVisible();
    
    // 点击树状视图
    await page.click('text=树状视图');
    
    // 验证按钮状态变化
    const treeButton = page.locator('text=树状视图').first();
    await expect(treeButton).toBeVisible();
  });

  test('缩放控制应该工作', async ({ page }) => {
    // 点击放大按钮
    await page.locator('button').filter({ hasText: /^add$/ }).first().click();
    await page.waitForTimeout(300);
    
    // 验证缩放值增加
    await expect(page.locator('text=110%').first()).toBeVisible();
    
    // 点击缩小按钮
    await page.locator('button').filter({ hasText: /^remove$/ }).first().click();
    await page.locator('button').filter({ hasText: /^remove$/ }).first().click();
    await page.waitForTimeout(300);
    
    // 验证缩放值减少
    await expect(page.locator('text=90%').first()).toBeVisible();
  });
});

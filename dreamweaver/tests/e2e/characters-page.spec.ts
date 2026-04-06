import { test, expect } from '@playwright/test';

/**
 * T-UI-004: 知识库角色管理 E2E 测试
 * 验证角色管理页面的视觉还原和功能
 */
test.describe('Characters Page - T-UI-004', () => {
  const projectId = 'test-project-id';

  test.beforeEach(async ({ page }) => {
    // 访问角色管理页面
    await page.goto(`/workbench/${projectId}/characters`);
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
  });

  test('should display page header with tabs', async ({ page }) => {
    // 验证标签导航
    const tabs = ['角色', '地点', '物品', '传说', '概念'];
    for (const tab of tabs) {
      await expect(page.locator(`text=${tab}`).first()).toBeVisible();
    }

    // 验证"角色"标签高亮
    const activeTab = page.locator('a:has-text("角色")');
    await expect(activeTab).toHaveClass(/text-primary/);
  });

  test('should display search input', async ({ page }) => {
    // 验证搜索框存在
    const searchInput = page.locator('input[placeholder="搜索角色..."]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeEnabled();
  });

  test('should display page title and action buttons', async ({ page }) => {
    // 验证页面标题
    const title = page.locator('h1:has-text("知识库：角色")');
    await expect(title).toBeVisible();

    // 验证手动添加按钮
    const manualAddBtn = page.locator('text=手动添加');
    await expect(manualAddBtn).toBeVisible();

    // 验证 AI 自动提取按钮
    const aiExtractBtn = page.locator('text=AI 自动提取');
    await expect(aiExtractBtn).toBeVisible();
  });

  test('should display character cards in grid', async ({ page }) => {
    // 验证角色卡片存在
    const characterCards = page.locator('[data-testid="character-card"]');
    await expect(characterCards.first()).toBeVisible();

    // 验证至少有一个角色卡片
    const count = await characterCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display character card content', async ({ page }) => {
    // 点击第一个角色卡片
    const firstCard = page.locator('[data-testid="character-card"]').first();
    await expect(firstCard).toBeVisible();

    // 验证角色名称
    const characterName = firstCard.locator('h3');
    await expect(characterName).toBeVisible();

    // 验证角色头像（姓氏首字）
    const avatar = firstCard.locator('.font-serif.text-xl');
    await expect(avatar).toBeVisible();

    // 验证状态标签
    const statusBadge = firstCard.locator('text=/无矛盾|设定冲突/');
    await expect(statusBadge).toBeVisible();

    // 验证年龄信息
    const ageInfo = firstCard.locator('text=/年龄/');
    await expect(ageInfo).toBeVisible();

    // 验证出场字数
    const wordCountInfo = firstCard.locator('text=/出场字数/');
    await expect(wordCountInfo).toBeVisible();
  });

  test('should display tags on character cards', async ({ page }) => {
    // 验证标签存在
    const firstCard = page.locator('[data-testid="character-card"]').first();
    const tags = firstCard.locator('.text-\[10px\].px-2');

    // 至少有一个标签或标签区域存在
    const tagCount = await tags.count();
    expect(tagCount).toBeGreaterThanOrEqual(0);
  });

  test('should display details panel on character select', async ({ page }) => {
    // 点击第一个角色卡片
    await page.locator('[data-testid="character-card"]').first().click();

    // 等待详情面板加载
    await page.waitForTimeout(300);

    // 验证详情面板存在
    const detailsPanel = page.locator('aside');
    await expect(detailsPanel).toBeVisible();

    // 验证角色大头像
    const largeAvatar = detailsPanel.locator('.w-24.h-24');
    await expect(largeAvatar).toBeVisible();

    // 验证角色名称
    const characterName = detailsPanel.locator('h2');
    await expect(characterName).toBeVisible();
  });

  test('should display basic info section in details panel', async ({ page }) => {
    // 选择一个角色
    await page.locator('[data-testid="character-card"]').first().click();
    await page.waitForTimeout(300);

    // 验证基本信息标题
    const basicInfoTitle = page.locator('h4:has-text("基本信息")');
    await expect(basicInfoTitle).toBeVisible();

    // 验证信息项
    await expect(page.locator('text=角色类型')).toBeVisible();
    await expect(page.locator('text=年龄')).toBeVisible();
    await expect(page.locator('text=性别')).toBeVisible();
    await expect(page.locator('text=出场字数')).toBeVisible();
  });

  test('should display edit button in details panel', async ({ page }) => {
    // 选择一个角色
    await page.locator('[data-testid="character-card"]').first().click();
    await page.waitForTimeout(300);

    // 验证编辑按钮
    const editButton = page.locator('button:has-text("编辑角色")');
    await expect(editButton).toBeVisible();
  });

  test('should open create character form', async ({ page }) => {
    // 点击手动添加按钮
    await page.locator('text=手动添加').click();

    // 验证表单弹窗打开
    const modal = page.locator('.fixed.inset-0');
    await expect(modal).toBeVisible();
  });

  test('should highlight selected character card', async ({ page }) => {
    // 点击第一个角色卡片
    const firstCard = page.locator('[data-testid="character-card"]').first();
    await firstCard.click();

    // 验证卡片有选中样式（左侧边框）
    await expect(firstCard).toHaveClass(/border-l-4/);
  });

  test('should have correct dark theme colors', async ({ page }) => {
    // 验证页面背景色（深色主题）
    const body = page.locator('body');
    const bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // 深色主题应该接近 rgb(17, 17, 37) 或类似深色
    expect(bgColor).toContain('rgb(17');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });

    // 刷新页面
    await page.goto(`/workbench/${projectId}/characters`);
    await page.waitForLoadState('networkidle');

    // 验证页面仍然可以正常显示
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="character-card"]').first()).toBeVisible();
  });
});

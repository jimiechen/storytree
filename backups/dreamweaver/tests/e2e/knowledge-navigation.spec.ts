import { test, expect } from '@playwright/test';

test.describe('知识库导航 (T-KNOW-003)', () => {
  const projectId = 'test-project-id';

  test.beforeEach(async ({ page }) => {
    // 访问工作台页面
    await page.goto(`/workbench/${projectId}`);
    // 等待页面加载完成
    await page.waitForSelector('[data-testid="workbench-layout"]', { timeout: 10000 });
  });

  test('工作台布局应该包含侧边栏导航', async ({ page }) => {
    // 验证侧边栏存在
    const sidebar = page.locator('[data-testid="workbench-sidebar"]');
    await expect(sidebar).toBeVisible();

    // 验证导航项存在
    await expect(page.locator('[data-testid="nav-编辑器"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-角色管理"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-世界观设定"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-项目设置"]')).toBeVisible();
  });

  test('点击角色管理导航应该切换到角色管理页面', async ({ page }) => {
    // 稍等页面完全可交互
    await page.waitForTimeout(500);
    
    // 点击导航项
    await page.click('[data-testid="nav-角色管理"]', { force: true });
    
    // 验证 URL 变化
    await expect(page).toHaveURL(new RegExp(`/workbench/${projectId}/characters`));
    
    // 验证页面加载
    await expect(page.locator('[data-testid="characters-page"]')).toBeVisible();
  });

  test('点击世界观设定导航应该切换到世界观设定页面', async ({ page }) => {
    // 点击导航项
    await page.click('[data-testid="nav-世界观设定"]', { force: true });
    
    // 验证 URL 变化
    await expect(page).toHaveURL(new RegExp(`/workbench/${projectId}/world-settings`));
    
    // 验证页面加载
    await expect(page.locator('[data-testid="world-settings-page"]')).toBeVisible();
  });

  test('点击编辑器导航应该返回编辑器页面', async ({ page }) => {
    // 先切换到角色管理页面
    await page.click('[data-testid="nav-角色管理"]', { force: true });
    await expect(page).toHaveURL(`/workbench/${projectId}/characters`);

    // 点击编辑器导航
    await page.click('[data-testid="nav-编辑器"]', { force: true });

    // 验证 URL 变化
    await expect(page).toHaveURL(`/workbench/${projectId}`);

    // 验证编辑器页面加载
    await expect(page.locator('[data-testid="workbench-page"]')).toBeVisible();
  });

  test('导航项应该有正确的激活状态', async ({ page }) => {
    // 编辑器页面 - 编辑器导航应该激活
    await expect(page.locator('[data-testid="nav-编辑器"]')).toHaveClass(/bg-blue-600/);

    // 切换到角色管理
    await page.click('[data-testid="nav-角色管理"]', { force: true });
    await page.waitForURL(`/workbench/${projectId}/characters`);

    // 角色管理导航应该激活，编辑器导航应该非激活
    await expect(page.locator('[data-testid="nav-角色管理"]')).toHaveClass(/bg-blue-600/);
    await expect(page.locator('[data-testid="nav-编辑器"]')).not.toHaveClass(/bg-blue-600/);

    // 切换到世界观设定
    await page.click('[data-testid="nav-世界观设定"]');
    await page.waitForURL(`/workbench/${projectId}/world-settings`);

    // 世界观设定导航应该激活
    await expect(page.locator('[data-testid="nav-世界观设定"]')).toHaveClass(/bg-blue-600/);
    await expect(page.locator('[data-testid="nav-角色管理"]')).not.toHaveClass(/bg-blue-600/);
  });

  test('角色管理页面应该显示角色列表', async ({ page }) => {
    // 切换到角色管理页面
    await page.click('[data-testid="nav-角色管理"]', { force: true });
    await page.waitForURL(`/workbench/${projectId}/characters`);

    // 等待加载完成
    await page.waitForSelector('[data-testid="characters-page"]', { timeout: 10000 });

    // 验证页面结构
    await expect(page.locator('[data-testid="create-character-button"]')).toBeVisible();
    await expect(page.locator('input[placeholder="搜索角色..."]')).toBeVisible();
  });

  test('世界观设定页面应该显示设定列表', async ({ page }) => {
    // 切换到世界观设定页面
    await page.click('[data-testid="nav-世界观设定"]', { force: true });
    await page.waitForURL(`/workbench/${projectId}/world-settings`);

    // 等待加载完成
    await page.waitForSelector('[data-testid="world-settings-page"]', { timeout: 10000 });

    // 验证页面结构
    await expect(page.locator('[data-testid="create-setting-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="setting-search-input"]')).toBeVisible();

    // 验证分类筛选存在
    await expect(page.locator('[data-testid="category-filter"]')).toBeVisible();
  });

  test('角色管理页面应该支持搜索功能', async ({ page }) => {
    // 切换到角色管理页面
    await page.click('[data-testid="nav-角色管理"]', { force: true });
    await page.waitForURL(`/workbench/${projectId}/characters`);

    // 等待加载完成
    await page.waitForSelector('[data-testid="characters-page"]', { timeout: 10000 });

    // 输入搜索关键词
    const searchInput = page.locator('input[placeholder="搜索角色..."]');
    await searchInput.fill('测试角色');

    // 验证搜索输入框的值
    await expect(searchInput).toHaveValue('测试角色');
  });

  test('世界观设定页面应该支持分类筛选', async ({ page }) => {
    // 切换到世界观设定页面
    await page.click('[data-testid="nav-世界观设定"]', { force: true });
    await page.waitForURL(`/workbench/${projectId}/world-settings`);

    // 等待加载完成
    await page.waitForSelector('[data-testid="world-settings-page"]', { timeout: 10000 });

    // 选择分类
    const categoryFilter = page.locator('[data-testid="category-filter"]');
    await categoryFilter.selectOption('magic');

    // 验证筛选值
    await expect(categoryFilter).toHaveValue('magic');
  });

  test('新建角色按钮应该打开弹窗', async ({ page }) => {
    // 切换到角色管理页面
    await page.click('[data-testid="nav-角色管理"]', { force: true });
    await page.waitForURL(`/workbench/${projectId}/characters`);

    // 等待加载完成
    await page.waitForSelector('[data-testid="characters-page"]', { timeout: 10000 });

    // 点击新建按钮
    await page.click('[data-testid="create-character-button"]');

    // 验证弹窗出现
    await expect(page.locator('[data-testid="character-form-modal"]')).toBeVisible();
    await expect(page.locator('text=新建角色')).toBeVisible();
  });

  test('新建设定按钮应该打开弹窗', async ({ page }) => {
    // 切换到世界观设定页面
    await page.click('[data-testid="nav-世界观设定"]', { force: true });
    await page.waitForURL(`/workbench/${projectId}/world-settings`);

    // 等待加载完成
    await page.waitForSelector('[data-testid="world-settings-page"]', { timeout: 10000 });

    // 点击新建按钮
    await page.click('[data-testid="create-setting-button"]');

    // 验证弹窗出现
    await expect(page.locator('[data-testid="world-setting-form-modal"]')).toBeVisible();
    await expect(page.locator('text=新建世界观设定')).toBeVisible();
  });
});

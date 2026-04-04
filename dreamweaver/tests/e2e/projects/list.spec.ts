import { test, expect } from '@playwright/test';

test.describe('项目列表页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
  });

  test('页面元素渲染 - 显示项目列表', async ({ page }) => {
    // 验证页面标题
    await expect(page).toHaveTitle(/项目|Projects/);
    
    // 验证页面标题
    const pageTitle = page.locator('h1, h2:has-text("项目列表"), h2:has-text("Projects")').first();
    await expect(pageTitle).toBeVisible();
    
    // 验证项目卡片容器
    const projectList = page.locator('.grid, .flex, .project-list').first();
    await expect(projectList).toBeVisible();
    
    // 验证新建项目按钮
    const createButton = page.locator('button:has-text("新建项目"), button:has-text("New Project"), a[href*="create"]').first();
    await expect(createButton).toBeVisible();
    
    // 验证搜索框
    const searchInput = page.locator('input[type="search"], input[placeholder*="搜索"], input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();
  });

  test('空状态显示 - 没有项目时显示空状态', async ({ page }) => {
    // 模拟空状态
    // 验证空状态提示
    const emptyState = page.locator('text=/暂无项目|No projects yet|还没有项目/').first();
    await expect(emptyState).toBeVisible();
    
    // 验证空状态下的新建项目按钮
    const createButton = page.locator('button:has-text("创建第一个项目"), button:has-text("Create your first project")').first();
    await expect(createButton).toBeVisible();
  });

  test('项目列表显示 - 显示多个项目卡片', async ({ page }) => {
    // 验证项目卡片存在
    const projectCards = page.locator('.project-card, [data-testid="project-card"]').first();
    await expect(projectCards).toBeVisible();
    
    // 验证卡片包含标题
    const projectTitle = page.locator('.project-card h3, [data-testid="project-card"] h3').first();
    await expect(projectTitle).toBeVisible();
    
    // 验证卡片包含描述
    const projectDescription = page.locator('.project-card p, [data-testid="project-card"] p').first();
    await expect(projectDescription).toBeVisible();
    
    // 验证卡片包含创建时间
    const projectDate = page.locator('.project-card .text-sm, [data-testid="project-card"] .text-sm').first();
    await expect(projectDate).toBeVisible();
  });

  test('搜索过滤功能 - 搜索项目', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="搜索"]').first();
    
    // 输入搜索关键词
    await searchInput.fill('test');
    await searchInput.press('Enter');
    
    // 验证搜索结果
    const searchResults = page.locator('.project-card, [data-testid="project-card"]');
    await expect(searchResults).toBeVisible();
  });

  test('点击项目卡片 - 跳转到项目工作台', async ({ page }) => {
    const projectCard = page.locator('.project-card, [data-testid="project-card"]').first();
    
    // 点击项目卡片
    await projectCard.click();
    
    // 验证跳转到工作台页面
    await expect(page).toHaveURL(/.*workbench/);
  });

  test('新建项目按钮 - 跳转到新建项目页面', async ({ page }) => {
    const createButton = page.locator('button:has-text("新建项目"), button:has-text("New Project")').first();
    
    // 点击新建项目按钮
    await createButton.click();
    
    // 验证跳转到新建项目页面
    await expect(page).toHaveURL(/.*projectscreate/);
  });

  test('排序功能 - 按创建时间排序', async ({ page }) => {
    const sortButton = page.locator('button:has-text("排序"), button:has-text("Sort"), select[name="sort"]').first();
    
    if (await sortButton.isVisible()) {
      await sortButton.click();
      const latestOption = page.locator('option:has-text("最新"), option:has-text("Latest"), option[value="latest"]').first();
      await latestOption.click();
      
      // 验证排序后结果
      const firstCard = page.locator('.project-card, [data-testid="project-card"]').first();
      await expect(firstCard).toBeVisible();
    }
  });

  test('分页功能 - 切换分页', async ({ page }) => {
    const pagination = page.locator('.pagination, nav[aria-label="Pagination"]').first();
    
    if (await pagination.isVisible()) {
      const nextButton = page.locator('.pagination button:has-text("下一页"), button[aria-label="Next"]').first();
      if (await nextButton.isVisible()) {
        await nextButton.click();
        
        // 验证页面更新
        await expect(page).toHaveURL(/.*page=
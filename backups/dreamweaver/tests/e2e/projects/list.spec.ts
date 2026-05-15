import { test, expect } from '../../src/fixtures/auth.fixture';

test.describe('项目列表页面', () => {
  test.beforeEach(async ({ authenticated }) => {
    // authenticated 夹具会自动登录并导航到 /projects
  });

  test('页面元素渲染 - 正常显示项目列表', async ({ page }) => {
    // 检查页面标题
    await expect(page).toHaveTitle(/DreamWeaver/);

    // 检查页面头部
    await expect(page.locator('h1:has-text("织梦笔")')).toBeVisible();

    // 检查新建项目按钮
    await expect(page.locator('text=新建作品').first()).toBeVisible();

    // 检查搜索框
    await expect(page.locator('input[placeholder="Search manuscripts..."]')).toBeVisible();

    // 检查项目列表容器 (至少包含一个项目)
    await expect(page.locator('text=最近作品').first()).toBeVisible();
  });

  test.skip('空状态 - 无项目时显示空提示', async ({ page }) => {
    // 模拟无项目状态
    // 这里可以通过修改 Mock 数据来实现
    
    // 检查空状态提示
    await expect(page.locator('.empty-state')).toBeVisible();
    await expect(page.locator('.empty-state')).toContainText('暂无项目');
    await expect(page.locator('.empty-state button')).toContainText('创建第一个项目');
  });

  test('项目卡片 - 正常渲染项目内容', async ({ page }) => {
    // 检查项目卡片是否存在
    const projectCards = page.locator('.project-card');
    await expect(projectCards).not.toHaveCount(0); // 假设 Mock 数据有项目

    // 检查第一个项目卡片的内容
    const firstCard = projectCards.first();
    await expect(firstCard).toBeVisible();
  });

  test('搜索功能 - 可通过标题搜索项目', async ({ page }) => {
    // 输入搜索关键词
    await page.fill('input[placeholder="Search manuscripts..."]', '测试');
    await page.press('input[placeholder="Search manuscripts..."]', 'Enter');

    // 检查搜索结果
    const projectCards = page.locator('.project-card');
    await expect(projectCards).not.toHaveCount(0); // 假设至少有一个项目匹配
    await expect(projectCards.first()).toContainText('测试项目');
  });

  test('点击卡片 - 跳转到工作台', async ({ page }) => {
    // 点击第一个项目卡片
    const firstCardLink = page.locator('.project-card').first();
    await firstCardLink.click({ force: true });

    // 检查导航到工作台页面
    await expect(page).toHaveURL(/workbench/);
  });

  test('点击新建按钮 - 弹出新建弹窗', async ({ page }) => {
    // 点击新建项目按钮
    await page.locator('text=新建作品').first().click();

    // 检查弹窗是否存在
    await expect(page.locator('text=作品名称').first()).toBeVisible();
  });
});

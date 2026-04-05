import { test, expect } from '../../src/fixtures/auth.fixture';

test.describe('新建项目', () => {
  test.beforeEach(async ({ authenticated }) => {
    // authenticated 夹具会自动登录并导航到 /projects
  });

  test('点击新建项目按钮时应该打开弹窗', async ({ page }) => {
    // 点击新建项目按钮
    await page.click('button:has-text("新建项目")');

    // 检查弹窗是否打开
    await expect(page.getByText('项目标题').first()).toBeVisible();
  });

  test('表单验证功能', async ({ page }) => {
    // 打开新建项目弹窗
    await page.click('button:has-text("新建项目")');

    // 直接点击创建按钮，不填写任何字段
    await page.click('button:has-text("创建")');

    // 检查表单验证错误
    await expect(page.locator('.text-red-600, .text-red-500')).toHaveCount(2);
    await expect(page.getByText('项目标题不能为空')).toBeVisible();
    await expect(page.getByText('项目描述不能为空')).toBeVisible();
  });

  test('成功创建项目', async ({ page }) => {
    // 打开新建项目弹窗
    await page.click('button:has-text("新建项目")');

    // 填写项目信息
    await page.fill('input[name="title"]', '测试项目');
    await page.fill('textarea[name="description"]', '这是一个测试项目');
    // 省略状态选择，使用默认值
    
    // 点击创建按钮
    await page.click('button:has-text("创建")');

    // 检查弹窗是否关闭
    await expect(page.getByText('项目标题').first()).not.toBeVisible();

    // 检查新创建的项目是否显示在列表中
    await expect(page.locator('.project-card').last()).toContainText('测试项目');
  });

  test('点击取消按钮时关闭弹窗', async ({ page }) => {
    // 打开新建项目弹窗
    await page.click('button:has-text("新建项目")');

    // 点击取消按钮
    await page.click('button:has-text("取消")');

    // 检查弹窗是否关闭
    await expect(page.getByText('项目标题').first()).not.toBeVisible();
  });

  test('点击外部时关闭弹窗', async ({ page }) => {
    // 打开新建项目弹窗
    await page.click('button:has-text("新建项目")');

    // 点击弹窗外部 (背景遮罩层)
    await page.mouse.click(10, 10);

    // 检查弹窗是否关闭
    await expect(page.getByText('项目标题').first()).not.toBeVisible();
  });
});

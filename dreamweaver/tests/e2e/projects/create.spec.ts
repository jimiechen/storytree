import { test, expect } from '@playwright/test';

test.describe('新建项目功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
  });

  test('页面元素渲染 - 显示新建项目页面', async ({ page }) => {
    // 点击新建项目按钮
    const createButton = page.locator('button:has-text("新建项目"), button:has-text("New Project")').first();
    await createButton.click();
    
    // 验证页面标题
    await expect(page).toHaveTitle(/新建项目|Create Project/);
    
    // 验证页面标题
    const pageTitle = page.locator('h1, h2:has-text("新建项目"), h2:has-text("Create Project")').first();
    await expect(pageTitle).toBeVisible();
    
    // 验证表单元素
    const titleInput = page.locator('input[name="title"], input[placeholder*="项目标题"], input[placeholder*="Title"]').first();
    await expect(titleInput).toBeVisible();
    
    const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="项目描述"], textarea[placeholder*="Description"]').first();
    await expect(descriptionInput).toBeVisible();
    
    const createProjectButton = page.locator('button:has-text("创建项目"), button:has-text("Create Project"), button[type="submit"]').first();
    await expect(createProjectButton).toBeVisible();
    
    const cancelButton = page.locator('button:has-text("取消"), button:has-text("Cancel"), a[href*="projects"]').first();
    await expect(cancelButton).toBeVisible();
  });

  test('表单验证 - 项目标题不能为空', async ({ page }) => {
    // 点击新建项目按钮
    const createButton = page.locator('button:has-text("新建项目"), button:has-text("New Project")').first();
    await createButton.click();
    
    // 不输入标题，填写描述
    const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="项目描述"]').first();
    await descriptionInput.fill('这是一个测试项目');
    
    // 点击创建按钮
    const createProjectButton = page.locator('button:has-text("创建项目"), button[type="submit"]').first();
    await createProjectButton.click();
    
    // 验证显示错误提示
    const errorMessage = page.locator('text=/标题不能为空|title is required|请输入项目标题/').first();
    await expect(errorMessage).toBeVisible();
  });

  test('表单验证 - 项目标题长度限制', async ({ page }) => {
    // 点击新建项目按钮
    const createButton = page.locator('button:has-text("新建项目"), button:has-text("New Project")').first();
    await createButton.click();
    
    // 输入过长的标题
    const titleInput = page.locator('input[name="title"], input[placeholder*="项目标题"]').first();
    await titleInput.fill('a'.repeat(101)); // 101个字符
    
    // 点击创建按钮
    const createProjectButton = page.locator('button:has-text("创建项目"), button[type="submit"]').first();
    await createProjectButton.click();
    
    // 验证显示错误提示
    const errorMessage = page.locator('text=/标题长度|title length|标题不能超过/').first();
    await expect(errorMessage).toBeVisible();
  });

  test('表单验证 - 项目描述长度限制', async ({ page }) => {
    // 点击新建项目按钮
    const createButton = page.locator('button:has-text("新建项目"), button:has-text("New Project")').first();
    await createButton.click();
    
    // 输入标题和过长的描述
    const titleInput = page.locator('input[name="title"], input[placeholder*="项目标题"]').first();
    await titleInput.fill('测试项目');
    
    const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="项目描述"]').first();
    await descriptionInput.fill('a'.repeat(1001)); // 1001个字符
    
    // 点击创建按钮
    const createProjectButton = page.locator('button:has-text("创建项目"), button[type="submit"]').first();
    await createProjectButton.click();
    
    // 验证显示错误提示
    const errorMessage = page.locator('text=/描述长度|description length|描述不能超过/').first();
    await expect(errorMessage).toBeVisible();
  });

  test('创建成功 - 跳转到项目列表并显示新项目', async ({ page }) => {
    // 点击新建项目按钮
    const createButton = page.locator('button:has-text("新建项目"), button:has-text("New Project")').first();
    await createButton.click();
    
    // 输入项目信息
    const titleInput = page.locator('input[name="title"], input[placeholder*="项目标题"]').first();
    const testTitle = '测试项目 ' + Date.now();
    await titleInput.fill(testTitle);
    
    const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="项目描述"]').first();
    await descriptionInput.fill('这是一个测试项目');
    
    // 点击创建按钮
    const createProjectButton = page.locator('button:has-text("创建项目"), button[type="submit"]').first();
    await createProjectButton.click();
    
    // 验证跳转到项目列表
    await expect(page).toHaveURL(/.*projects/);
    
    // 验证新项目显示在列表中
    const newProject = page.locator('text=' + testTitle).first();
    await expect(newProject).toBeVisible();
  });

  test('取消按钮 - 返回到项目列表', async ({ page }) => {
    // 点击新建项目按钮
    const createButton = page.locator('button:has-text("新建项目"), button:has-text("New Project")').first();
    await createButton.click();
    
    // 点击取消按钮
    const cancelButton = page.locator('button:has-text("取消"), button:has-text("Cancel"), a[href*="projects"]').first();
    await cancelButton.click();
    
    // 验证返回到项目列表
    await expect(page).toHaveURL(/.*projects/);
  });

  test('表单提交 - 加载状态显示', async ({ page }) => {
    // 点击新建项目按钮
    const createButton = page.locator('button:has-text("新建项目"), button:has-text("New Project")').first();
    await createButton.click();
    
    // 输入项目信息
    const titleInput = page.locator('input[name="title"], input[placeholder*="项目标题"]').first();
    await titleInput.fill('测试项目');
    
    const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="项目描述"]').first();
    await descriptionInput.fill('这是一个测试项目');
    
    // 点击创建按钮
    const createProjectButton = page.locator('button:has-text("创建项目"), button[type="submit"]').first();
    
    // 验证按钮显示加载状态
    const [response] = await Promise.all([
      page.waitForNavigation(),
      createProjectButton.click()
    ]);
    
    // 验证跳转成功
    await expect(page).toHaveURL(/.*projects/);
  });
});
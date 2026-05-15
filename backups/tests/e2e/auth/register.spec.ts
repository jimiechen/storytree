import { test, expect } from '@playwright/test';

test.describe('注册页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('页面元素渲染 - 显示注册表单', async ({ page }) => {
    // 验证页面标题
    await expect(page).toHaveTitle(/注册|Register/);
    
    // 验证用户名输入框存在
    const usernameInput = page.locator('input[name="username"], input[placeholder*="用户名"]').first();
    await expect(usernameInput).toBeVisible();
    
    // 验证邮箱输入框存在
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible();
    
    // 验证密码输入框存在
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    await expect(passwordInput).toBeVisible();
    
    // 验证注册按钮存在
    const registerButton = page.locator('button[type="submit"], button:has-text("注册"), button:has-text("Register")').first();
    await expect(registerButton).toBeVisible();
  });

  test('表单验证 - 用户名为空', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const registerButton = page.locator('button[type="submit"]').first();
    
    // 不输入用户名，填写其他字段
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    await registerButton.click();
    
    // 验证显示错误提示
    const errorMessage = page.locator('text=/用户名不能为空|username is required/i').first();
    await expect(errorMessage).toBeVisible();
  });

  test('表单验证 - 邮箱格式无效', async ({ page }) => {
    const usernameInput = page.locator('input[name="username"], input[placeholder*="用户名"]').first();
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const registerButton = page.locator('button[type="submit"]').first();
    
    // 输入无效邮箱
    await usernameInput.fill('testuser');
    await emailInput.fill('invalid-email');
    await registerButton.click();
    
    // 验证显示错误提示
    const errorMessage = page.locator('text=/邮箱格式|email format/i').first();
    await expect(errorMessage).toBeVisible();
  });

  test('表单验证 - 密码少于8位', async ({ page }) => {
    const usernameInput = page.locator('input[name="username"], input[placeholder*="用户名"]').first();
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const registerButton = page.locator('button[type="submit"]').first();
    
    // 输入短密码
    await usernameInput.fill('testuser');
    await emailInput.fill('test@example.com');
    await passwordInput.fill('123');
    await registerButton.click();
    
    // 验证显示错误提示
    const errorMessage = page.locator('text=/密码至少|password must be at least/i').first();
    await expect(errorMessage).toBeVisible();
  });

  test('注册成功 - 跳转到登录页或项目列表', async ({ page }) => {
    const usernameInput = page.locator('input[name="username"], input[placeholder*="用户名"]').first();
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const registerButton = page.locator('button[type="submit"]').first();
    
    // 输入有效注册信息
    await usernameInput.fill('newuser' + Date.now());
    await emailInput.fill('newuser' + Date.now() + '@example.com');
    await passwordInput.fill('password123');
    await registerButton.click();
    
    // 验证跳转 (登录页或项目列表)
    await expect(page).toHaveURL(/.*\/(login|projects)/);
  });

  test('注册失败 - 邮箱已被注册', async ({ page }) => {
    const usernameInput = page.locator('input[name="username"], input[placeholder*="用户名"]').first();
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const registerButton = page.locator('button[type="submit"]').first();
    
    // 使用已存在的邮箱
    await usernameInput.fill('testuser');
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    await registerButton.click();
    
    // 验证显示错误提示
    const errorMessage = page.locator('text=/邮箱已被注册|email already exists/i').first();
    await expect(errorMessage).toBeVisible();
    
    // 验证仍在注册页
    await expect(page).toHaveURL(/.*\/register/);
  });

  test('异步校验 - 用户名唯一性检查', async ({ page }) => {
    const usernameInput = page.locator('input[name="username"], input[placeholder*="用户名"]').first();
    
    // 输入已存在的用户名
    await usernameInput.fill('existinguser');
    await usernameInput.blur();
    
    // 验证显示异步校验错误
    const errorMessage = page.locator('text=/用户名已被使用|username already exists/i').first();
    await expect(errorMessage).toBeVisible();
  });

  test('登录链接 - 点击跳转到登录页', async ({ page }) => {
    const loginLink = page.locator('a[href="/login"], a:has-text("登录"), a:has-text("Login")').first();
    await loginLink.click();
    
    // 验证跳转到登录页
    await expect(page).toHaveURL(/.*\/login/);
  });
});

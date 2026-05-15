import { test, expect } from '@playwright/test';

test.describe('登录页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('页面元素渲染 - 显示登录表单', async ({ page }) => {
    // 验证页面标题
    await expect(page).toHaveTitle(/登录|Login/);
    
    // 验证邮箱输入框存在
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="邮箱"]').first();
    await expect(emailInput).toBeVisible();
    
    // 验证密码输入框存在
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    await expect(passwordInput).toBeVisible();
    
    // 验证登录按钮存在
    const loginButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")').first();
    await expect(loginButton).toBeVisible();
  });

  test('表单验证 - 邮箱格式无效', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const loginButton = page.locator('button[type="submit"]').first();
    
    // 输入无效邮箱
    await emailInput.fill('invalid-email');
    await loginButton.click();
    
    // 验证显示错误提示
    const errorMessage = page.locator('text=/邮箱格式|email format/i').first();
    await expect(errorMessage).toBeVisible();
  });

  test('表单验证 - 密码为空', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const loginButton = page.locator('button[type="submit"]').first();
    
    // 输入有效邮箱，不输入密码
    await emailInput.fill('test@example.com');
    await loginButton.click();
    
    // 验证显示错误提示
    const errorMessage = page.locator('text=/密码不能为空|password is required/i').first();
    await expect(errorMessage).toBeVisible();
  });

  test('登录成功 - 跳转到项目列表', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const loginButton = page.locator('button[type="submit"]').first();
    
    // 输入有效凭据
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    await loginButton.click();
    
    // 验证跳转到项目列表页
    await expect(page).toHaveURL(/.*\/projects/);
  });

  test('登录失败 - 显示错误提示', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const loginButton = page.locator('button[type="submit"]').first();
    
    // 输入错误密码
    await emailInput.fill('test@example.com');
    await passwordInput.fill('wrongpassword');
    await loginButton.click();
    
    // 验证显示错误提示
    const errorMessage = page.locator('text=/邮箱或密码错误|invalid credentials/i').first();
    await expect(errorMessage).toBeVisible();
    
    // 验证仍在登录页
    await expect(page).toHaveURL(/.*\/login/);
  });
});

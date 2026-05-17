import { test, expect } from '../../src/fixtures/auth.fixture';

test.describe('登录页面', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('页面元素渲染 - 显示登录表单', async ({ loginPage, page }) => {
    // 验证登录表单可见
    await loginPage.expectLoginFormVisible();
    // 截图保存
    await page.screenshot({ path: 'test-results/screenshots/login-page-render.png', fullPage: true });
  });

  test('表单验证 - 邮箱格式无效', async ({ loginPage, page }) => {
    const emailInput = await loginPage.getEmailInput();
    const loginButton = await loginPage.getLoginButton();
    
    // 输入无效邮箱
    await emailInput.fill('invalid-email');
    // 截图保存
    await page.screenshot({ path: 'test-results/screenshots/login-email-validation.png', fullPage: true });
    
    await loginButton.click();
    
    // 验证显示错误提示
    await loginPage.expectErrorMessageVisible();
    // 截图保存
    await page.screenshot({ path: 'test-results/screenshots/login-email-error.png', fullPage: true });
  });

  test('表单验证 - 密码为空', async ({ loginPage, page }) => {
    const emailInput = await loginPage.getEmailInput();
    const loginButton = await loginPage.getLoginButton();
    
    // 输入有效邮箱，不输入密码
    await emailInput.fill('test@example.com');
    // 截图保存
    await page.screenshot({ path: 'test-results/screenshots/login-password-validation.png', fullPage: true });
    
    await loginButton.click();
    
    // 验证显示错误提示
    await loginPage.expectErrorMessageVisible();
    // 截图保存
    await page.screenshot({ path: 'test-results/screenshots/login-password-error.png', fullPage: true });
  });

  test('登录成功 - 跳转到项目列表', async ({ loginPage, testUser, page }) => {
    // 输入有效凭据
    await loginPage.login(testUser.email, testUser.password);
    // 截图保存
    await page.screenshot({ path: 'test-results/screenshots/login-success.png', fullPage: true });
    
    // 验证跳转到项目列表页
    await loginPage.expectLoginSuccess();
    // 截图保存
    await page.screenshot({ path: 'test-results/screenshots/login-redirect-projects.png', fullPage: true });
  });

  test('登录失败 - 显示错误提示', async ({ loginPage, testUser, page }) => {
    // 输入错误密码
    await loginPage.login(testUser.email, 'wrongpassword');
    // 截图保存
    await page.screenshot({ path: 'test-results/screenshots/login-failure.png', fullPage: true });
    
    // 验证显示错误提示
    await loginPage.expectLoginFailed();
    // 截图保存
    await page.screenshot({ path: 'test-results/screenshots/login-failure-error.png', fullPage: true });
  });

  test('点击注册链接 - 跳转到注册页面', async ({ loginPage, page }) => {
    const registerLink = await loginPage.getRegisterLink();
    // 截图保存
    await page.screenshot({ path: 'test-results/screenshots/login-register-link.png', fullPage: true });
    
    await registerLink.click();
    
    // 验证跳转到注册页面
    await expect(page).toHaveURL(/.*\/register/);
    // 截图保存
    await page.screenshot({ path: 'test-results/screenshots/login-redirect-register.png', fullPage: true });
  });
});

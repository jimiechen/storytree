import { test, expect } from '../../src/fixtures/auth.fixture';

test.describe('注册页面', () => {
  test.beforeEach(async ({ registerPage }) => {
    await registerPage.goto();
  });

  test('页面元素渲染 - 显示注册表单', async ({ registerPage }) => {
    // 验证注册表单可见
    await registerPage.expectRegisterFormVisible();
  });

  test('表单验证 - 用户名为空', async ({ registerPage }) => {
    const emailInput = await registerPage.getEmailInput();
    const passwordInput = await registerPage.getPasswordInput();
    const registerButton = await registerPage.getRegisterButton();
    
    // 不输入用户名，输入其他字段
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    await registerButton.click();
    
    // 验证显示错误提示
    await registerPage.expectErrorMessageVisible();
  });

  test('表单验证 - 邮箱格式无效', async ({ registerPage }) => {
    const usernameInput = await registerPage.getUsernameInput();
    const emailInput = await registerPage.getEmailInput();
    const passwordInput = await registerPage.getPasswordInput();
    const registerButton = await registerPage.getRegisterButton();
    
    // 输入无效邮箱
    await usernameInput.fill('testuser');
    await emailInput.fill('invalid-email');
    await passwordInput.fill('password123');
    await registerButton.click();
    
    // 验证显示错误提示
    await registerPage.expectErrorMessageVisible();
  });

  test('表单验证 - 密码少于8位', async ({ registerPage }) => {
    const usernameInput = await registerPage.getUsernameInput();
    const emailInput = await registerPage.getEmailInput();
    const passwordInput = await registerPage.getPasswordInput();
    const registerButton = await registerPage.getRegisterButton();
    
    // 输入短密码
    await usernameInput.fill('testuser');
    await emailInput.fill('test@example.com');
    await passwordInput.fill('123');
    await registerButton.click();
    
    // 验证显示错误提示
    await registerPage.expectErrorMessageVisible();
  });

  test('注册成功 - 跳转到登录页或项目列表', async ({ registerPage }) => {
    // 输入有效信息
    const uniqueEmail = 'newuser' + Date.now() + '@example.com';
    await registerPage.register('newuser' + Date.now(), uniqueEmail, 'password123');
    
    // 验证跳转到登录页或项目列表
    await registerPage.expectRegisterSuccess();
  });

  test('注册失败 - 邮箱已被注册', async ({ registerPage }) => {
    // 输入已注册的邮箱
    await registerPage.register('testuser', 'test@example.com', 'password123');
    
    // 验证显示错误提示
    await registerPage.expectRegisterFailed();
  });

  test('点击登录链接 - 跳转到登录页面', async ({ registerPage, page }) => {
    const loginLink = await registerPage.getLoginLink();
    await loginLink.click();
    
    // 验证跳转到登录页面
    await expect(page).toHaveURL(/.*\/login/);
  });
});

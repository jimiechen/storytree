import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';

type AuthFixtures = {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  authenticated: Page;
  testUser: {
    email: string;
    password: string;
    username: string;
  };
};

export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  registerPage: async ({ page }, use) => {
    const registerPage = new RegisterPage(page);
    await use(registerPage);
  },

  authenticated: async ({ page }, use) => {
    // 自动登录
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
    await page.waitForURL(/\/projects/);
    await use(page);
  },

  testUser: {
    email: 'test@example.com',
    password: 'password123',
    username: 'testuser'
  }
});

export { expect } from '@playwright/test';

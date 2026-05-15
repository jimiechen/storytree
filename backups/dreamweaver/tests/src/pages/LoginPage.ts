import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await super.goto('/login');
  }

  async getEmailInput() {
    return this.page.locator('input[type="email"]').first();
  }

  async getPasswordInput() {
    return this.page.locator('input[type="password"]').first();
  }

  async getLoginButton() {
    return this.page.locator('button[type="submit"]').first();
  }

  async getErrorMessage() {
    return this.page.locator('.text-red-700, .text-red-600, [role="alert"]').first();
  }

  async getRegisterLink() {
    return this.page.locator('a:has-text("注册"), a:has-text("Register")');
  }

  async login(email: string, password: string) {
    const emailInput = await this.getEmailInput();
    const passwordInput = await this.getPasswordInput();
    const loginButton = await this.getLoginButton();

    await emailInput.fill(email);
    await passwordInput.fill(password);
    await loginButton.click();
  }

  async expectLoginFormVisible() {
    await this.expectElementToBeVisible('input[type="email"]');
    await this.expectElementToBeVisible('input[type="password"]');
    await this.expectElementToBeVisible('button[type="submit"]');
  }

  async expectErrorMessageVisible() {
    const errorMessage = await this.getErrorMessage();
    await expect(errorMessage).toBeVisible();
  }

  async expectLoginSuccess() {
    await this.expectUrlToContain('/projects');
  }

  async expectLoginFailed() {
    await this.expectUrlToContain('/login');
    await this.expectErrorMessageVisible();
  }
}

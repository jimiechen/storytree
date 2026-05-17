import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class RegisterPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await super.goto('/register');
  }

  async getUsernameInput() {
    return this.page.locator('input[type="text"], input[name="username"]').first();
  }

  async getEmailInput() {
    return this.page.locator('input[type="email"]').first();
  }

  async getPasswordInput() {
    return this.page.locator('input[type="password"]').first();
  }

  async getRegisterButton() {
    return this.page.locator('button[type="submit"]').first();
  }

  async getErrorMessage() {
    return this.page.locator('.text-red-700, .text-red-600').first();
  }

  async getLoginLink() {
    return this.page.locator('a:has-text("登录"), a:has-text("Login")');
  }

  async register(username: string, email: string, password: string) {
    const usernameInput = await this.getUsernameInput();
    const emailInput = await this.getEmailInput();
    const passwordInput = await this.getPasswordInput();
    const registerButton = await this.getRegisterButton();

    await usernameInput.fill(username);
    await emailInput.fill(email);
    await passwordInput.fill(password);
    await registerButton.click();
  }

  async expectRegisterFormVisible() {
    await this.expectElementToBeVisible('input[type="text"]');
    await this.expectElementToBeVisible('input[type="email"]');
    await this.expectElementToBeVisible('input[type="password"]');
    await this.expectElementToBeVisible('button[type="submit"]');
  }

  async expectErrorMessageVisible() {
    const errorMessage = await this.getErrorMessage();
    await expect(errorMessage).toBeVisible();
  }

  async expectRegisterSuccess() {
    await this.expectUrlToContain('/login|/projects');
  }

  async expectRegisterFailed() {
    await this.expectUrlToContain('/register');
    await this.expectErrorMessageVisible();
  }
}

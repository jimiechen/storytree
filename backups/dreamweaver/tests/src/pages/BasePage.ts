import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }

  async waitForPageReady() {
    await this.page.waitForLoadState('networkidle');
  }

  async screenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  async getByTestId(testId: string): Promise<Locator> {
    return this.page.locator(`[data-testid="${testId}"]`);
  }

  async getByRole(role: any, options?: { name?: string }): Promise<Locator> {
    return this.page.getByRole(role, options);
  }

  async getByLabel(label: string): Promise<Locator> {
    return this.page.getByLabel(label);
  }

  async getByText(text: string): Promise<Locator> {
    return this.page.getByText(text);
  }

  async goto(url: string) {
    await this.page.goto(url);
    await this.page.waitForFunction(() => (window as any).__MSW_READY__ === true, undefined, { timeout: 10000 }).catch(() => console.log('MSW wait timeout'));
    await this.waitForPageReady();
  }

  async waitForNavigation() {
    await this.page.waitForNavigation();
  }

  async fillInput(selector: string, value: string) {
    const input = this.page.locator(selector);
    await input.fill(value);
  }

  async clickButton(selector: string) {
    const button = this.page.locator(selector);
    await button.click();
  }

  async expectTextToBeVisible(text: string) {
    const element = this.page.getByText(text);
    await element.waitFor();
    await expect(element).toBeVisible();
  }

  async expectUrlToContain(text: string) {
    await expect(this.page).toHaveURL(new RegExp(text));
  }

  async expectElementToBeVisible(selector: string) {
    const element = this.page.locator(selector);
    await expect(element).toBeVisible();
  }

  async expectElementToBeHidden(selector: string) {
    const element = this.page.locator(selector);
    await expect(element).toBeHidden();
  }
}

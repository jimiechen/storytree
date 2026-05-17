import { test, expect } from '@playwright/test';

test('主页标题测试', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Create Next App|DreamWeaver/);
});

/**
 * @file page-14-name-generator.spec.ts
 * @description PAGE-14 名字生成器 E2E 测试
 */

import { test, expect, type Page } from '@playwright/test';

const PROFILE_URL = '/novel?view=name-generator';
const STEP_DELAY = 2000;

async function gotoNameGenerator(page: Page) {
  let retries = 3;
  while (retries > 0) {
    try {
      await page.goto(PROFILE_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      break;
    } catch {
      retries--;
      if (retries === 0) throw new Error('Failed to load name-generator page');
      await page.waitForTimeout(3000);
    }
  }
  await page.waitForSelector('[data-testid="ng-page-title"]', { timeout: 30_000 });
  await page.waitForTimeout(STEP_DELAY);
}

test.describe('PAGE-14 名字生成器', () => {
  test.beforeEach(async ({ page }) => {
    await gotoNameGenerator(page);
    // 清空历史记录
    await page.evaluate(() => {
      localStorage.removeItem('novel:name-generator:history');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="ng-page-title"]', { timeout: 30_000 });
  });

  test('TC-NG-001: 页面标题与返回按钮可见', async ({ page }) => {
    await expect(page.getByTestId('ng-page-title')).toHaveText('名字生成器');
    await expect(page.getByTestId('ng-back-btn')).toContainText('返回管理中心');
    await page.waitForTimeout(STEP_DELAY);
  });

  test('TC-NG-002: 模式 Tab 可切换（随机/AI）', async ({ page }) => {
    // 默认随机模式选中
    await expect(page.getByTestId('ng-tab-random')).toHaveClass(/bg-\[#6b38d4\]/);
    await page.waitForTimeout(STEP_DELAY);

    // 切换到 AI 模式
    await page.getByTestId('ng-tab-ai').click();
    await expect(page.getByTestId('ng-tab-ai')).toHaveClass(/bg-\[#6b38d4\]/);
    await page.waitForTimeout(STEP_DELAY);

    // 切换回随机模式
    await page.getByTestId('ng-tab-random').click();
    await expect(page.getByTestId('ng-tab-random')).toHaveClass(/bg-\[#6b38d4\]/);
    await page.waitForTimeout(STEP_DELAY);
  });

  test('TC-NG-003: 3 个性别按钮可选择', async ({ page }) => {
    // 默认男性选中
    await expect(page.getByTestId('ng-gender-male')).toHaveClass(/border-\[#6b38d4\]/);
    await page.waitForTimeout(STEP_DELAY);

    // 选择女性
    await page.getByTestId('ng-gender-female').click();
    await expect(page.getByTestId('ng-gender-female')).toHaveClass(/border-\[#6b38d4\]/);
    await page.waitForTimeout(STEP_DELAY);

    // 选择通用
    await page.getByTestId('ng-gender-neutral').click();
    await expect(page.getByTestId('ng-gender-neutral')).toHaveClass(/border-\[#6b38d4\]/);
    await page.waitForTimeout(STEP_DELAY);
  });

  test('TC-NG-004: 6 个风格按钮可选择', async ({ page }) => {
    const styles = ['minimal', 'ancient', 'fantasy', 'modern', 'cool', 'cute'];
    for (const s of styles) {
      await page.getByTestId(`ng-style-${s}`).click();
      await expect(page.getByTestId(`ng-style-${s}`)).toHaveClass(/border-\[#6b38d4\]/);
      await page.waitForTimeout(STEP_DELAY);
    }
  });

  test('TC-NG-005: 名字长度滑块可调节', async ({ page }) => {
    // 默认值 3
    await expect(page.getByTestId('ng-length-value')).toContainText('3');
    await page.waitForTimeout(STEP_DELAY);

    // 调到 5
    await page.getByTestId('ng-length-slider').fill('5');
    await expect(page.getByTestId('ng-length-value')).toContainText('5');
    await page.waitForTimeout(STEP_DELAY);

    // 调到 2
    await page.getByTestId('ng-length-slider').fill('2');
    await expect(page.getByTestId('ng-length-value')).toContainText('2');
    await page.waitForTimeout(STEP_DELAY);
  });

  test('TC-NG-006: 生成名字并显示结果', async ({ page }) => {
    await page.getByTestId('ng-generate-btn').click();
    await expect(page.getByTestId('ng-result')).toBeVisible({ timeout: 5_000 });
    const text = await page.getByTestId('ng-result').textContent();
    expect(text).toBeTruthy();
    expect((text ?? '').length).toBeGreaterThanOrEqual(2);
    await page.waitForTimeout(STEP_DELAY);
  });

  test('TC-NG-007: 生成名字长度匹配滑块设置', async ({ page }) => {
    // 设置长度为 4
    await page.getByTestId('ng-length-slider').fill('4');
    await page.waitForTimeout(STEP_DELAY);

    await page.getByTestId('ng-generate-btn').click();
    await expect(page.getByTestId('ng-result')).toBeVisible({ timeout: 5_000 });
    const text = await page.getByTestId('ng-result').textContent();
    expect((text ?? '').length).toBe(4);
    await page.waitForTimeout(STEP_DELAY);
  });

  test('TC-NG-008: 历史记录显示已生成的名字', async ({ page }) => {
    // 生成一个名字
    await page.getByTestId('ng-generate-btn').click();
    await expect(page.getByTestId('ng-result')).toBeVisible({ timeout: 5_000 });
    await page.waitForTimeout(STEP_DELAY);

    // 历史记录应显示
    await expect(page.getByTestId('ng-history')).toBeVisible();
    const historyItems = page.locator('[data-testid="ng-history"] li');
    await expect(historyItems).toHaveCount(1);
    await page.waitForTimeout(STEP_DELAY);
  });

  test('TC-NG-009: 复制按钮可点击', async ({ page }) => {
    await page.getByTestId('ng-generate-btn').click();
    await expect(page.getByTestId('ng-result')).toBeVisible({ timeout: 5_000 });
    await page.waitForTimeout(STEP_DELAY);

    // 点击复制按钮（不验证剪贴板内容，因为浏览器可能拒绝）
    await page.getByTestId('ng-copy-btn').click();
    await page.waitForTimeout(STEP_DELAY);
    // 按钮文本应变化为"已复制"或保持"复制"
    const btnText = await page.getByTestId('ng-copy-btn').textContent();
    expect(btnText).toBeTruthy();
  });
});

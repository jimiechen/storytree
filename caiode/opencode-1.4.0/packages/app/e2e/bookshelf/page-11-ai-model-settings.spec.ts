import { test, expect, type Page } from '@playwright/test';

/**
 * PAGE-11 AI 模型设置 端到端验收测试
 *
 * 验收依据: packages/app/src/novel/docs/page-specs/PAGE-11_ai_model_settings.md
 *
 * 覆盖用例:
 *   TC-AM-001 导航到 Profile 页面，点击 AI模型 Tab，显示设置表单
 *   TC-AM-002 模型下拉框包含 DeepSeek Flash 和 DeepSeek Chat 选项
 *   TC-AM-003 API Key 输入框默认脱敏，点击显示切换为明文
 *   TC-AM-004 填写表单并点击保存，显示成功提示
 *   TC-AM-005 点击重置默认，恢复为 deepseek-flash + 空 API Key
 *
 * 运行: bun test:e2e -- --headed e2e/bookshelf/page-11-ai-model-settings.spec.ts
 */

const PROFILE_URL = '/novel?view=profile';
const STEP_DELAY = 2000;

async function gotoProfile(page: Page) {
  let retries = 3;
  while (retries > 0) {
    try {
      await page.goto(PROFILE_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      break;
    } catch {
      retries--;
      if (retries === 0) throw new Error('Failed to load profile page');
      await page.waitForTimeout(3000);
    }
  }
  await page.waitForSelector('text=个人中心', { timeout: 30_000 });
  await page.waitForTimeout(STEP_DELAY);
}

async function clickAiModelTab(page: Page) {
  await page.getByRole('button', { name: 'AI模型' }).click();
  await page.waitForTimeout(STEP_DELAY);
}

async function resetSettings(page: Page) {
  await page.getByRole('button', { name: '重置默认' }).click();
  await page.waitForTimeout(STEP_DELAY);
}

// ─── 测试套件 ────────────────────────────────────────────────
test.describe('PAGE-11 AI 模型设置 端到端验收', () => {

  test.beforeEach(async ({ page }) => {
    await gotoProfile(page);
    await clickAiModelTab(page);
    // 确保每个测试从默认状态开始
    await resetSettings(page);
  });

  // ─── TC-AM-001 显示设置表单 ─────────────────────────────
  test('TC-AM-001 导航到 Profile 页面，点击 AI模型 Tab，显示设置表单', async ({ page }) => {
    await expect(page.locator('text=模型选择')).toBeVisible();
    await expect(page.locator('label').filter({ hasText: 'API Key' })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: 'API 端点' })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: '生成温度' })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: '最大 Tokens' })).toBeVisible();
    await expect(page.getByRole('button', { name: '保存设置' })).toBeVisible();
    await expect(page.getByRole('button', { name: '重置默认' })).toBeVisible();
  });

  // ─── TC-AM-002 模型下拉框选项 ────────────────────────────
  test('TC-AM-002 模型下拉框包含 DeepSeek Flash 和 DeepSeek Chat 选项', async ({ page }) => {
    const modelSelect = page.locator('select').first();
    await expect(modelSelect).toBeVisible();
    const options = modelSelect.locator('option');
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(2);
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      texts.push((await options.nth(i).textContent()) ?? '');
    }
    expect(texts.some((t) => t.includes('DeepSeek Flash'))).toBeTruthy();
    expect(texts.some((t) => t.includes('DeepSeek Chat'))).toBeTruthy();
  });

  // ─── TC-AM-003 API Key 脱敏切换 ──────────────────────────
  test('TC-AM-003 API Key 输入框默认脱敏，点击显示切换为明文', async ({ page }) => {
    const apiKeyInput = page.locator('input[placeholder="sk-..."]');
    await expect(apiKeyInput).toBeVisible();
    await expect(apiKeyInput).toHaveAttribute('type', 'password');
    await apiKeyInput.fill('sk-test-key-1234567890abcdef');
    await page.waitForTimeout(STEP_DELAY);
    await page.getByRole('button', { name: '显示' }).click();
    await page.waitForTimeout(STEP_DELAY);
    await expect(apiKeyInput).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: '隐藏' }).click();
    await page.waitForTimeout(STEP_DELAY);
    await expect(apiKeyInput).toHaveAttribute('type', 'password');
  });

  // ─── TC-AM-004 保存设置 ──────────────────────────────────
  test('TC-AM-004 填写表单并点击保存，显示成功提示', async ({ page }) => {
    const apiKeyInput = page.locator('input[placeholder="sk-..."]');
    await apiKeyInput.fill('sk-test-save-1234567890abcdef');
    await page.waitForTimeout(STEP_DELAY);
    await page.getByRole('button', { name: '保存设置' }).click();
    // saved 信号在 2 秒后清除，直接检查不等待 STEP_DELAY
    await expect(page.getByText('已保存')).toBeVisible({ timeout: 5_000 });
    await page.waitForTimeout(STEP_DELAY);
  });

  // ─── TC-AM-005 重置默认 ──────────────────────────────────
  test('TC-AM-005 点击重置默认，恢复为 deepseek-flash + 空 API Key', async ({ page }) => {
    const apiKeyInput = page.locator('input[placeholder="sk-..."]');
    await apiKeyInput.fill('sk-should-be-reset-12345678');
    await page.waitForTimeout(STEP_DELAY);
    await page.getByRole('button', { name: '保存设置' }).click();
    await page.waitForTimeout(STEP_DELAY);
    await page.getByRole('button', { name: '重置默认' }).click();
    await page.waitForTimeout(STEP_DELAY);
    await expect(apiKeyInput).toHaveValue('');
    const modelSelect = page.locator('select').first();
    await expect(modelSelect).toHaveValue('deepseek-flash');
  });
});

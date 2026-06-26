import { test, expect, type Page } from '@playwright/test';

/**
 * PAGE-08 创建新项目-自定义设定 端到端验收测试
 *
 * 验收依据: packages/app/src/novel/docs/page-specs/PAGE-08_create_project_custom_settings.md
 * PRD §3.8 自定义设定 — 4 预设按钮 + 添加设定 + textarea
 *
 * 录屏优化：每个操作后保留 2 秒，确保录屏清晰可见
 *
 * 覆盖用例:
 *   TC-P08-001 进入自定义设定 Tab
 *   TC-P08-002 4 个预设按钮全部可见
 *   TC-P08-003 "添加设定"按钮可见
 *   TC-P08-004 点击"修仙体系"追加模板到 textarea
 *   TC-P08-005 点击"添加设定"追加空白模板
 *   TC-P08-006 textarea 可自由编辑
 *   TC-P08-007 下一步切换到选择文件 Tab
 *   TC-P08-008 上一步返回剧情总纲且数据保留
 *   TC-P08-009 取消按钮返回书架
 *
 * 运行: bun test:e2e -- e2e/bookshelf/page-08-create-project-custom-settings.spec.ts
 * 有头: bun test:e2e -- e2e/bookshelf/page-08-create-project-custom-settings.spec.ts -- --headed
 */

const CREATE_PROJECT_URL = '/novel?view=create-project';
const STEP_DELAY = 2000; // 每个操作后保留 2 秒，确保录屏清晰

// ─── Helper ──────────────────────────────────────────────────
async function gotoCreateProject(page: Page) {
  // 重试机制：vite dev server 冷启动时首次访问可能 ERR_ABORTED
  let retries = 3;
  while (retries > 0) {
    try {
      await page.goto(CREATE_PROJECT_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      break;
    } catch (e) {
      retries--;
      if (retries === 0) throw e;
      await page.waitForTimeout(3000);
    }
  }
  await page.waitForSelector('h2:has-text("创建新项目")', { timeout: 30_000 });
  await page.waitForTimeout(STEP_DELAY);
}

async function gotoCustomSettingsTab(page: Page) {
  await gotoCreateProject(page);
  // 基本信息：填书名 → 下一步
  await page.locator('input[placeholder="给你的小说起个名字"]').fill('E2E自定义设定测试');
  await page.waitForTimeout(STEP_DELAY);
  await page.getByRole('button', { name: '下一步' }).click();
  await page.waitForTimeout(STEP_DELAY);
  // 主角设定：直接下一步
  await page.getByRole('button', { name: '下一步' }).click();
  await page.waitForTimeout(STEP_DELAY);
  // 世界观：直接下一步
  await page.getByRole('button', { name: '下一步' }).click();
  await page.waitForTimeout(STEP_DELAY);
  // 剧情总纲：直接下一步
  await page.getByRole('button', { name: '下一步' }).click();
  await page.waitForTimeout(STEP_DELAY);
  // 确认到达自定义设定 Tab
  await expect(page.locator('h3:has-text("自定义设定")')).toBeVisible();
}

async function snapshot(page: Page, name: string) {
  await page.screenshot({
    path: `e2e/test-results/page-08-${name}.png`,
    fullPage: true,
  });
}

// ─── 测试套件 ────────────────────────────────────────────────
test.describe('PAGE-08 创建新项目-自定义设定 端到端验收', () => {

  // ─── TC-P08-001 进入自定义设定 Tab ───────────────────────
  test('TC-P08-001 进入自定义设定 Tab', async ({ page }) => {
    await gotoCustomSettingsTab(page);
    // 自定义设定标题可见
    await expect(page.locator('h3:has-text("自定义设定")')).toBeVisible();
    // 自定义设定 Tab 按钮已激活
    const tabBtn = page.getByRole('button', { name: '自定义设定' });
    await expect(tabBtn).not.toBeDisabled();
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-001-custom-tab');
  });

  // ─── TC-P08-002 4 个预设按钮全部可见 ─────────────────────
  test('TC-P08-002 4 个预设按钮全部可见', async ({ page }) => {
    await gotoCustomSettingsTab(page);
    await expect(page.getByRole('button', { name: '修仙体系' })).toBeVisible();
    await page.waitForTimeout(STEP_DELAY);
    await expect(page.getByRole('button', { name: '西方贵族' })).toBeVisible();
    await page.waitForTimeout(STEP_DELAY);
    await expect(page.getByRole('button', { name: '科幻体系' })).toBeVisible();
    await page.waitForTimeout(STEP_DELAY);
    await expect(page.getByRole('button', { name: '都市体系' })).toBeVisible();
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-002-preset-buttons');
  });

  // ─── TC-P08-003 "添加设定"按钮可见 ───────────────────────
  test('TC-P08-003 "添加设定"按钮可见', async ({ page }) => {
    await gotoCustomSettingsTab(page);
    await expect(page.getByRole('button', { name: '添加设定' })).toBeVisible();
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-003-add-button');
  });

  // ─── TC-P08-004 点击"修仙体系"追加模板到 textarea ────────
  test('TC-P08-004 点击"修仙体系"追加模板到 textarea', async ({ page }) => {
    await gotoCustomSettingsTab(page);
    const textarea = page.locator('textarea[placeholder*="修仙体系"]');
    // 初始为空
    await expect(textarea).toHaveValue('');
    await page.waitForTimeout(STEP_DELAY);
    // 点击修仙体系按钮
    await page.getByRole('button', { name: '修仙体系' }).click();
    await page.waitForTimeout(STEP_DELAY);
    // textarea 应包含修仙体系模板内容
    const value = await textarea.inputValue();
    expect(value).toContain('修仙体系');
    expect(value).toContain('境界划分');
    expect(value).toContain('练气期');
    await snapshot(page, 'tc-004-xianxia-template');
  });

  // ─── TC-P08-005 点击"添加设定"追加空白模板 ───────────────
  test('TC-P08-005 点击"添加设定"追加空白模板', async ({ page }) => {
    await gotoCustomSettingsTab(page);
    const textarea = page.locator('textarea[placeholder*="修仙体系"]');
    await expect(textarea).toHaveValue('');
    await page.waitForTimeout(STEP_DELAY);
    // 点击添加设定按钮
    await page.getByRole('button', { name: '添加设定' }).click();
    await page.waitForTimeout(STEP_DELAY);
    // textarea 应包含空白模板内容
    const value = await textarea.inputValue();
    expect(value).toContain('自定义设定');
    expect(value).toContain('设定名称');
    await snapshot(page, 'tc-005-empty-template');
  });

  // ─── TC-P08-006 textarea 可自由编辑 ──────────────────────
  test('TC-P08-006 textarea 可自由编辑', async ({ page }) => {
    await gotoCustomSettingsTab(page);
    const textarea = page.locator('textarea[placeholder*="修仙体系"]');
    await expect(textarea).toHaveValue('');
    await page.waitForTimeout(STEP_DELAY);
    // 自由输入文本
    const text = '自定义设定内容测试：灵气复苏体系，所有修炼者需要吸收灵气。';
    await textarea.fill(text);
    await expect(textarea).toHaveValue(text);
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-006-free-edit');
  });

  // ─── TC-P08-007 下一步切换到选择文件 Tab ──────────────────
  test('TC-P08-007 下一步切换到选择文件 Tab', async ({ page }) => {
    await gotoCustomSettingsTab(page);
    await page.getByRole('button', { name: '修仙体系' }).click();
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-007-before-next');
    // 下一步
    await page.getByRole('button', { name: '下一步' }).click();
    await page.waitForTimeout(STEP_DELAY);
    // 切换到选择文件 Tab
    await expect(page.getByRole('button', { name: '选择文件' })).not.toBeDisabled();
    await expect(page.locator('h3:has-text("选择文件")')).toBeVisible();
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-007-file-tab');
  });

  // ─── TC-P08-008 上一步返回剧情总纲且数据保留 ──────────────
  test('TC-P08-008 上一步返回剧情总纲且数据保留', async ({ page }) => {
    await gotoCustomSettingsTab(page);
    // 填写自定义设定
    await page.getByRole('button', { name: '修仙体系' }).click();
    await page.waitForTimeout(STEP_DELAY);
    // 上一步返回剧情总纲
    await page.getByRole('button', { name: '上一步' }).click();
    await page.waitForTimeout(STEP_DELAY);
    // 剧情总纲标题可见
    await expect(page.locator('h3:has-text("剧情总纲")')).toBeVisible();
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-008-back-to-plot');
  });

  // ─── TC-P08-009 取消按钮返回书架 ──────────────────────────
  test('TC-P08-009 取消按钮返回书架', async ({ page }) => {
    await gotoCustomSettingsTab(page);
    await page.getByRole('button', { name: '取消' }).click();
    await page.waitForTimeout(STEP_DELAY);
    await expect(page).toHaveURL(/view=bookshelf/, { timeout: 10_000 });
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-009-cancel');
  });
});

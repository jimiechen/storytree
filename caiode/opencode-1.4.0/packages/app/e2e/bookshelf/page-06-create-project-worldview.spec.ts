import { test, expect, type Page } from '@playwright/test';

/**
 * PAGE-06 创建新项目-世界观 端到端验收测试
 *
 * 验收依据: packages/app/src/novel/docs/page-specs/PAGE-06_create_project_worldview.md
 * PRD §3.6 世界观设定 — 3 个下拉框 + 世界观描述 + LLM 生成
 *
 * 录屏优化：每个操作后保留 2 秒，确保录屏清晰可见
 *
 * 覆盖用例:
 *   TC-P06-001 进入世界观 Tab（基本信息 → 主角设定 → 世界观）
 *   TC-P06-002 5 个元素全部可见（3 下拉框 + 提示词 + 描述 textarea）
 *   TC-P06-003 世界类型下拉框有 7 个选项
 *   TC-P06-004 时代背景下拉框有 10 个选项
 *   TC-P06-005 社会制度下拉框有 8 个选项
 *   TC-P06-006 选择世界类型/时代背景/社会制度
 *   TC-P06-007 世界观描述 textarea 可输入
 *   TC-P06-008 下一步切换到剧情总纲 Tab
 *   TC-P06-009 上一步返回主角设定且数据保留
 *
 * 运行: bun test:e2e -- e2e/bookshelf/page-06-create-project-worldview.spec.ts
 * 有头: bun test:e2e -- e2e/bookshelf/page-06-create-project-worldview.spec.ts -- --headed
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

async function gotoWorldviewTab(page: Page) {
  await gotoCreateProject(page);
  // 基本信息：填书名 → 下一步
  await page.locator('input[placeholder="给你的小说起个名字"]').fill('E2E世界观测试');
  await page.waitForTimeout(STEP_DELAY);
  await page.getByRole('button', { name: '下一步' }).click();
  await page.waitForTimeout(STEP_DELAY);
  // 主角设定：直接下一步（主角字段非必填）
  await page.getByRole('button', { name: '下一步' }).click();
  await page.waitForTimeout(STEP_DELAY);
  // 确认到达世界观 Tab
  await expect(page.locator('h3:has-text("世界观")')).toBeVisible();
}

async function snapshot(page: Page, name: string) {
  await page.screenshot({
    path: `e2e/test-results/page-06-${name}.png`,
    fullPage: true,
  });
}

// ─── 测试套件 ────────────────────────────────────────────────
test.describe('PAGE-06 创建新项目-世界观 端到端验收', () => {

  // ─── TC-P06-001 进入世界观 Tab ─────────────────────────
  test('TC-P06-001 进入世界观 Tab（基本信息 → 主角设定 → 世界观）', async ({ page }) => {
    await gotoWorldviewTab(page);
    // 世界观标题可见
    await expect(page.locator('h3:has-text("世界观")')).toBeVisible();
    // 世界观 Tab 按钮已激活
    const tabBtn = page.getByRole('button', { name: '世界观' });
    await expect(tabBtn).not.toBeDisabled();
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-001-worldview-tab');
  });

  // ─── TC-P06-002 5 个元素全部可见 ─────────────────────────
  test('TC-P06-002 5 个元素全部可见（3 下拉框 + 提示词 + 描述 textarea）', async ({ page }) => {
    await gotoWorldviewTab(page);
    // 3 个下拉框（世界类型/时代背景/社会制度）
    const selects = page.locator('select');
    await expect(selects).toHaveCount(3);
    await page.waitForTimeout(STEP_DELAY);
    // 提示词输入框
    await expect(page.locator('input[placeholder*="输入关键词"]')).toBeVisible();
    // 世界观描述 textarea（始终可见）
    await expect(page.locator('textarea[placeholder*="世界观设定"]')).toBeVisible();
    // AI 生成按钮
    await expect(page.getByRole('button', { name: /AI 生成|生成中/ })).toBeVisible();
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-002-five-elements');
  });

  // ─── TC-P06-003 世界类型下拉框有 7 个选项 ──────────────────
  test('TC-P06-003 世界类型下拉框有 7 个选项', async ({ page }) => {
    await gotoWorldviewTab(page);
    const worldTypeSelect = page.locator('select').nth(0);
    // 7 个选项 + 1 个"请选择" = 8
    const options = worldTypeSelect.locator('option');
    await expect(options).toHaveCount(8);
    await page.waitForTimeout(STEP_DELAY);
    // 验证选项文本
    await expect(options.nth(1)).toHaveText('中国古代');
    await expect(options.nth(2)).toHaveText('欧洲中世纪');
    await expect(options.nth(7)).toHaveText('⚡ 自定义');
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-003-world-type-options');
  });

  // ─── TC-P06-004 时代背景下拉框有 10 个选项 ──────────────────
  test('TC-P06-004 时代背景下拉框有 10 个选项', async ({ page }) => {
    await gotoWorldviewTab(page);
    const eraSelect = page.locator('select').nth(1);
    // 10 个选项 + 1 个"请选择" = 11
    const options = eraSelect.locator('option');
    await expect(options).toHaveCount(11);
    await page.waitForTimeout(STEP_DELAY);
    await expect(options.nth(1)).toHaveText('原始社会');
    await expect(options.nth(10)).toHaveText('魔导科技混合');
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-004-era-options');
  });

  // ─── TC-P06-005 社会制度下拉框有 8 个选项 ──────────────────
  test('TC-P06-005 社会制度下拉框有 8 个选项', async ({ page }) => {
    await gotoWorldviewTab(page);
    const socialSelect = page.locator('select').nth(2);
    // 8 个选项 + 1 个"请选择" = 9
    const options = socialSelect.locator('option');
    await expect(options).toHaveCount(9);
    await page.waitForTimeout(STEP_DELAY);
    await expect(options.nth(1)).toHaveText('部落制');
    await expect(options.nth(8)).toHaveText('无政府');
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-005-social-options');
  });

  // ─── TC-P06-006 选择世界类型/时代背景/社会制度 ─────────────
  test('TC-P06-006 选择世界类型/时代背景/社会制度', async ({ page }) => {
    await gotoWorldviewTab(page);
    // 选择世界类型 = 奇幻架空
    await page.locator('select').nth(0).selectOption('fantasy');
    await expect(page.locator('select').nth(0)).toHaveValue('fantasy');
    await page.waitForTimeout(STEP_DELAY);
    // 选择时代背景 = 中世纪
    await page.locator('select').nth(1).selectOption('medieval');
    await expect(page.locator('select').nth(1)).toHaveValue('medieval');
    await page.waitForTimeout(STEP_DELAY);
    // 选择社会制度 = 帝制
    await page.locator('select').nth(2).selectOption('imperial');
    await expect(page.locator('select').nth(2)).toHaveValue('imperial');
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-006-selections');
  });

  // ─── TC-P06-007 世界观描述 textarea 可输入 ─────────────────
  test('TC-P06-007 世界观描述 textarea 可输入', async ({ page }) => {
    await gotoWorldviewTab(page);
    const textarea = page.locator('textarea[placeholder*="世界观设定"]');
    // 初始为空
    await expect(textarea).toHaveValue('');
    await page.waitForTimeout(STEP_DELAY);
    // 输入文本
    const desc = '这是一个灵气复苏的世界，修仙者隐于都市，上古遗迹遍布全球，蕴含无尽机缘与危险。';
    await textarea.fill(desc);
    await expect(textarea).toHaveValue(desc);
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-007-description-input');
  });

  // ─── TC-P06-008 下一步切换到剧情总纲 Tab ─────────────────
  test('TC-P06-008 下一步切换到剧情总纲 Tab', async ({ page }) => {
    await gotoWorldviewTab(page);
    // 选择一些下拉框值
    await page.locator('select').nth(0).selectOption('ancient_china');
    await page.waitForTimeout(STEP_DELAY);
    await page.locator('select').nth(1).selectOption('ancient');
    await page.waitForTimeout(STEP_DELAY);
    await page.locator('select').nth(2).selectOption('imperial');
    await page.waitForTimeout(STEP_DELAY);
    // 填写世界观描述
    await page.locator('textarea[placeholder*="世界观设定"]').fill('九州大陆，皇权鼎盛，江湖暗流涌动。');
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-008-before-next');
    // 下一步
    await page.getByRole('button', { name: '下一步' }).click();
    await page.waitForTimeout(STEP_DELAY);
    // 切换到剧情总纲 Tab
    await expect(page.getByRole('button', { name: '剧情总纲' })).not.toBeDisabled();
    // 剧情总纲 h3 标题可见
    await expect(page.locator('h3:has-text("剧情总纲")')).toBeVisible();
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-008-plot-tab');
  });

  // ─── TC-P06-009 上一步返回主角设定且数据保留 ─────────────
  test('TC-P06-009 上一步返回主角设定且数据保留', async ({ page }) => {
    await gotoWorldviewTab(page);
    // 先在主角设定 Tab 填写数据
    await page.getByRole('button', { name: '上一步' }).click();
    await page.waitForTimeout(STEP_DELAY);
    await page.locator('input[placeholder="主角名字"]').fill('陈墨白');
    await page.waitForTimeout(STEP_DELAY);
    await page.locator('select').first().selectOption('male');
    await page.waitForTimeout(STEP_DELAY);
    // 下一步回到世界观
    await page.getByRole('button', { name: '下一步' }).click();
    await page.waitForTimeout(STEP_DELAY);
    // 在世界观填写数据
    await page.locator('select').nth(0).selectOption('fantasy');
    await page.waitForTimeout(STEP_DELAY);
    await page.locator('textarea[placeholder*="世界观设定"]').fill('奇幻架空世界测试数据保留');
    await page.waitForTimeout(STEP_DELAY);
    // 上一步返回主角设定
    await page.getByRole('button', { name: '上一步' }).click();
    await page.waitForTimeout(STEP_DELAY);
    // 主角设定数据应保留
    await expect(page.locator('input[placeholder="主角名字"]')).toHaveValue('陈墨白');
    await expect(page.locator('select').first()).toHaveValue('male');
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-009-data-retained');
  });

  // ─── TC-P06-010 取消按钮返回书架 ──────────────────────────
  test('TC-P06-010 取消按钮返回书架', async ({ page }) => {
    await gotoWorldviewTab(page);
    await page.getByRole('button', { name: '取消' }).click();
    await page.waitForTimeout(STEP_DELAY);
    await expect(page).toHaveURL(/view=bookshelf/, { timeout: 10_000 });
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-010-cancel');
  });
});

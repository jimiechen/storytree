import { test, expect, type Page } from '@playwright/test';

/**
 * PAGE-07 创建新项目-剧情总纲 端到端验收测试
 *
 * 验收依据: packages/app/src/novel/docs/page-specs/PAGE-07_create_project_plot_outline.md
 * PRD §3.7 剧情总纲 — 8 个大文本框 + LLM 生成
 *
 * 录屏优化：每个操作后保留 2 秒，确保录屏清晰可见
 *
 * 覆盖用例:
 *   TC-P07-001 进入剧情总纲 Tab（基本信息 → 主角设定 → 世界观 → 剧情总纲）
 *   TC-P07-002 10 个元素全部可见（提示词 + AI 按钮 + 8 文本框）
 *   TC-P07-003 核心剧情线文本框可输入
 *   TC-P07-004 8 个文本框全部可输入
 *   TC-P07-005 下一步切换到自定义设定 Tab
 *   TC-P07-006 上一步返回世界观且数据保留
 *   TC-P07-007 取消按钮返回书架
 *
 * 运行: bun test:e2e -- e2e/bookshelf/page-07-create-project-plot-outline.spec.ts
 * 有头: bun test:e2e -- e2e/bookshelf/page-07-create-project-plot-outline.spec.ts -- --headed
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

async function gotoPlotOutlineTab(page: Page) {
  await gotoCreateProject(page);
  // 基本信息：填书名 → 下一步
  await page.locator('input[placeholder="给你的小说起个名字"]').fill('E2E剧情总纲测试');
  await page.waitForTimeout(STEP_DELAY);
  await page.getByRole('button', { name: '下一步' }).click();
  await page.waitForTimeout(STEP_DELAY);
  // 主角设定：直接下一步
  await page.getByRole('button', { name: '下一步' }).click();
  await page.waitForTimeout(STEP_DELAY);
  // 世界观：直接下一步
  await page.getByRole('button', { name: '下一步' }).click();
  await page.waitForTimeout(STEP_DELAY);
  // 确认到达剧情总纲 Tab
  await expect(page.locator('h3:has-text("剧情总纲")')).toBeVisible();
}

async function snapshot(page: Page, name: string) {
  await page.screenshot({
    path: `e2e/test-results/page-07-${name}.png`,
    fullPage: true,
  });
}

// ─── 测试套件 ────────────────────────────────────────────────
test.describe('PAGE-07 创建新项目-剧情总纲 端到端验收', () => {

  // ─── TC-P07-001 进入剧情总纲 Tab ─────────────────────────
  test('TC-P07-001 进入剧情总纲 Tab', async ({ page }) => {
    await gotoPlotOutlineTab(page);
    // 剧情总纲标题可见
    await expect(page.locator('h3:has-text("剧情总纲")')).toBeVisible();
    // 剧情总纲 Tab 按钮已激活
    const tabBtn = page.getByRole('button', { name: '剧情总纲' });
    await expect(tabBtn).not.toBeDisabled();
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-001-plot-tab');
  });

  // ─── TC-P07-002 10 个元素全部可见 ─────────────────────────
  test('TC-P07-002 10 个元素全部可见（提示词 + AI 按钮 + 8 文本框）', async ({ page }) => {
    await gotoPlotOutlineTab(page);
    // 提示词输入框
    await expect(page.locator('input[placeholder*="输入关键词"]')).toBeVisible();
    await page.waitForTimeout(STEP_DELAY);
    // AI 生成按钮
    await expect(page.getByRole('button', { name: /AI 生成|生成中/ })).toBeVisible();
    await page.waitForTimeout(STEP_DELAY);
    // 8 个文本框（按 placeholder 查找）
    await expect(page.locator('textarea[placeholder*="核心剧情描述"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="世界观建立"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="冲突升级"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="核心冲突推进"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="最高潮对决"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="收束线索"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="最终结局描述"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="核心矛盾冲突"]')).toBeVisible();
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-002-ten-elements');
  });

  // ─── TC-P07-003 核心剧情线文本框可输入 ─────────────────────
  test('TC-P07-003 核心剧情线文本框可输入', async ({ page }) => {
    await gotoPlotOutlineTab(page);
    const textarea = page.locator('textarea[placeholder*="核心剧情描述"]');
    // 初始为空
    await expect(textarea).toHaveValue('');
    await page.waitForTimeout(STEP_DELAY);
    // 输入文本
    const text = '少年林墨渊出身没落世家，偶得上古修仙传承，踏上逆天改命之路。';
    await textarea.fill(text);
    await expect(textarea).toHaveValue(text);
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-003-core-input');
  });

  // ─── TC-P07-004 8 个文本框全部可输入 ───────────────────────
  test('TC-P07-004 8 个文本框全部可输入', async ({ page }) => {
    await gotoPlotOutlineTab(page);
    // 依次填写 8 个文本框
    const inputs = [
      { placeholder: '核心剧情描述', text: '少年逆袭修仙，踏上巅峰之路。' },
      { placeholder: '世界观建立', text: '灵气复苏的现代都市，修仙者隐于市井。' },
      { placeholder: '冲突升级', text: '各大势力争夺上古遗迹，冲突不断升级。' },
      { placeholder: '核心冲突推进', text: '主角发现身世之谜，与暗影组织正面对抗。' },
      { placeholder: '最高潮对决', text: '最终决战，主角与暗影之主巅峰对决。' },
      { placeholder: '收束线索', text: '暗影组织覆灭，世界重归和平。' },
      { placeholder: '最终结局描述', text: '主角飞升仙界，留下传说。' },
      { placeholder: '核心矛盾冲突', text: '人性与力量的终极矛盾。' },
    ];
    for (const item of inputs) {
      const textarea = page.locator(`textarea[placeholder*="${item.placeholder}"]`);
      await textarea.fill(item.text);
      await expect(textarea).toHaveValue(item.text);
      await page.waitForTimeout(STEP_DELAY);
    }
    await snapshot(page, 'tc-004-all-filled');
  });

  // ─── TC-P07-005 下一步切换到自定义设定 Tab ─────────────────
  test('TC-P07-005 下一步切换到自定义设定 Tab', async ({ page }) => {
    await gotoPlotOutlineTab(page);
    // 填写核心剧情线
    await page.locator('textarea[placeholder*="核心剧情描述"]').fill('少年逆袭修仙，踏上巅峰之路。');
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-005-before-next');
    // 下一步
    await page.getByRole('button', { name: '下一步' }).click();
    await page.waitForTimeout(STEP_DELAY);
    // 切换到自定义设定 Tab
    await expect(page.getByRole('button', { name: '自定义设定' })).not.toBeDisabled();
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-005-custom-tab');
  });

  // ─── TC-P07-006 上一步返回世界观且数据保留 ───────────────
  test('TC-P07-006 上一步返回世界观且数据保留', async ({ page }) => {
    await gotoPlotOutlineTab(page);
    // 在世界观填写数据（先上一步到世界观）
    await page.getByRole('button', { name: '上一步' }).click();
    await page.waitForTimeout(STEP_DELAY);
    await page.locator('textarea[placeholder*="世界观设定"]').fill('奇幻架空世界测试');
    await page.waitForTimeout(STEP_DELAY);
    // 下一步回到剧情总纲
    await page.getByRole('button', { name: '下一步' }).click();
    await page.waitForTimeout(STEP_DELAY);
    // 在剧情总纲填写数据
    await page.locator('textarea[placeholder*="核心剧情描述"]').fill('剧情总纲测试数据');
    await page.waitForTimeout(STEP_DELAY);
    // 上一步返回世界观
    await page.getByRole('button', { name: '上一步' }).click();
    await page.waitForTimeout(STEP_DELAY);
    // 世界观数据应保留
    await expect(page.locator('textarea[placeholder*="世界观设定"]')).toHaveValue('奇幻架空世界测试');
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-006-data-retained');
  });

  // ─── TC-P07-007 取消按钮返回书架 ──────────────────────────
  test('TC-P07-007 取消按钮返回书架', async ({ page }) => {
    await gotoPlotOutlineTab(page);
    await page.getByRole('button', { name: '取消' }).click();
    await page.waitForTimeout(STEP_DELAY);
    await expect(page).toHaveURL(/view=bookshelf/, { timeout: 10_000 });
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-007-cancel');
  });
});

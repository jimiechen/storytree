import { test, expect, type Page } from '@playwright/test';

/**
 * PAGE-05 创建新项目-主角设定 端到端验收测试
 *
 * 验收依据: packages/app/src/novel/docs/page-specs/PAGE-05_create_project_protagonist.md
 * PRD §3.5 主角设定 9 个元素
 *
 * 覆盖用例:
 *   TC-P05-001 进入主角设定 Tab（先填基本信息再下一步）
 *   TC-P05-002 9 个元素全部可见（姓名/随机按钮/性别/年龄/性格/外貌/背景/动机/软肋）
 *   TC-P05-003 随机按钮生成姓名（非空）
 *   TC-P05-004 性别下拉框（男/女/其他）
 *   TC-P05-005 切换性别为"其他"
 *   TC-P05-006 填写全部字段后下一步切换到世界观 Tab
 *   TC-P05-007 上一步返回主角设定且数据保留
 *   TC-P05-008 取消按钮返回书架
 *
 * 运行: bun test:e2e -- e2e/bookshelf/page-05-create-project-protagonist.spec.ts
 * 有头: bun test:e2e -- e2e/bookshelf/page-05-create-project-protagonist.spec.ts -- --headed
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

async function gotoProtagonistTab(page: Page) {
  await gotoCreateProject(page);
  // 填写书名并进入下一步
  await page.locator('input[placeholder="给你的小说起个名字"]').fill('E2E主角设定测试');
  await page.waitForTimeout(STEP_DELAY);
  await page.getByRole('button', { name: '下一步' }).click();
  await page.waitForTimeout(STEP_DELAY);
  // 确认到达主角设定 Tab
  await expect(page.locator('input[placeholder="主角名字"]')).toBeVisible();
}

async function snapshot(page: Page, name: string) {
  await page.screenshot({
    path: `e2e/test-results/page-05-${name}.png`,
    fullPage: true,
  });
}

// ─── 测试套件 ────────────────────────────────────────────────
test.describe('PAGE-05 创建新项目-主角设定 端到端验收', () => {

  // ─── TC-P05-001 进入主角设定 Tab ─────────────────────────
  test('TC-P05-001 进入主角设定 Tab（先填基本信息再下一步）', async ({ page }) => {
    await gotoProtagonistTab(page);
    // 主角设定标题可见
    await expect(page.locator('h3:has-text("主角设定")')).toBeVisible();
    // 主角设定 Tab 按钮已激活
    const tabBtn = page.getByRole('button', { name: '主角设定' });
    await expect(tabBtn).not.toBeDisabled();
    await snapshot(page, 'tc-001-protagonist-tab');
  });

  // ─── TC-P05-002 9 个元素全部可见 ─────────────────────────
  test('TC-P05-002 9 个元素全部可见', async ({ page }) => {
    await gotoProtagonistTab(page);
    // 1. 姓名输入框
    await expect(page.locator('input[placeholder="主角名字"]')).toBeVisible();
    // 2. 随机按钮（title=随机生成姓名）
    await expect(page.locator('button[title="随机生成姓名"]')).toBeVisible();
    // 3. 性别 select
    await expect(page.locator('select')).toBeVisible();
    // 4. 年龄 number input（placeholder=如：18）
    await expect(page.locator('input[type="number"]')).toBeVisible();
    // 5-9. 五个 textarea（性格/外貌/背景/动机/软肋）
    await expect(page.locator('textarea[placeholder*="性格特点"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="外貌特征"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="身世背景"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="主角的目标"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="主角的弱点"]')).toBeVisible();
    await snapshot(page, 'tc-002-nine-elements');
  });

  // ─── TC-P05-003 随机按钮生成姓名 ──────────────────────────
  test('TC-P05-003 随机按钮生成姓名（非空）', async ({ page }) => {
    await gotoProtagonistTab(page);
    const nameInput = page.locator('input[placeholder="主角名字"]');
    // 初始为空
    await expect(nameInput).toHaveValue('');
    // 点击随机按钮
    await page.locator('button[title="随机生成姓名"]').click();
    await page.waitForTimeout(STEP_DELAY);
    // 姓名应非空（2-3 字中文）
    const value = await nameInput.inputValue();
    expect(value.length).toBeGreaterThanOrEqual(2);
    await snapshot(page, 'tc-003-random-name');
  });

  // ─── TC-P05-004 性别下拉框（男/女/其他）──────────────────
  test('TC-P05-004 性别下拉框包含男/女/其他', async ({ page }) => {
    await gotoProtagonistTab(page);
    const genderSelect = page.locator('select').first();
    // 默认值应为 male（男）
    await expect(genderSelect).toHaveValue('male');
    // 三个选项
    const options = genderSelect.locator('option');
    await expect(options).toHaveCount(3);
    await expect(options.nth(0)).toHaveText('男');
    await expect(options.nth(1)).toHaveText('女');
    await expect(options.nth(2)).toHaveText('其他');
    await snapshot(page, 'tc-004-gender-options');
  });

  // ─── TC-P05-005 切换性别为"其他" ──────────────────────────
  test('TC-P05-005 切换性别为"其他"', async ({ page }) => {
    await gotoProtagonistTab(page);
    const genderSelect = page.locator('select').first();
    await genderSelect.selectOption('other');
    await page.waitForTimeout(STEP_DELAY);
    await expect(genderSelect).toHaveValue('other');
    await snapshot(page, 'tc-005-gender-other');
  });

  // ─── TC-P05-006 填写全部字段后下一步切换到世界观 ─────────
  test('TC-P05-006 填写全部字段后下一步切换到世界观 Tab', async ({ page }) => {
    await gotoProtagonistTab(page);
    // 填写所有字段
    await page.locator('input[placeholder="主角名字"]').fill('林墨渊');
    await page.waitForTimeout(STEP_DELAY);
    await page.locator('select').first().selectOption('male');
    await page.waitForTimeout(STEP_DELAY);
    await page.locator('input[type="number"]').fill('25');
    await page.waitForTimeout(STEP_DELAY);
    await page.locator('textarea[placeholder*="性格特点"]').fill('外冷内热、机智果断');
    await page.waitForTimeout(STEP_DELAY);
    await page.locator('textarea[placeholder*="外貌特征"]').fill('剑眉星目、身形修长');
    await page.waitForTimeout(STEP_DELAY);
    await page.locator('textarea[placeholder*="身世背景"]').fill('出身名门却家道中落');
    await page.waitForTimeout(STEP_DELAY);
    await page.locator('textarea[placeholder*="主角的目标"]').fill('复仇');
    await page.waitForTimeout(STEP_DELAY);
    await page.locator('textarea[placeholder*="主角的弱点"]').fill('亲人被威胁时失控');
    await page.waitForTimeout(STEP_DELAY);
    await snapshot(page, 'tc-006-all-filled');
    // 下一步
    await page.getByRole('button', { name: '下一步' }).click();
    await page.waitForTimeout(STEP_DELAY);
    // 切换到世界观 Tab
    await expect(page.getByRole('button', { name: '世界观' })).not.toBeDisabled();
    // 世界观 Tab 已激活 — LLMGenerationTab 的 h3 标题 "世界观" 可见
    // (textarea 仅在有值或生成中才渲染，故检查标题/提示词输入)
    await expect(page.locator('h3:has-text("世界观")')).toBeVisible();
    await expect(page.locator('input[placeholder*="输入关键词"]')).toBeVisible();
    await snapshot(page, 'tc-006-worldview-tab');
  });

  // ─── TC-P05-007 上一步返回主角设定且数据保留 ─────────────
  test('TC-P05-007 上一步返回主角设定且数据保留', async ({ page }) => {
    await gotoProtagonistTab(page);
    // 填写部分字段
    await page.locator('input[placeholder="主角名字"]').fill('苏雪瑶');
    await page.waitForTimeout(STEP_DELAY);
    await page.locator('select').first().selectOption('female');
    await page.waitForTimeout(STEP_DELAY);
    await page.locator('input[type="number"]').fill('18');
    await page.waitForTimeout(STEP_DELAY);
    await page.locator('textarea[placeholder*="性格特点"]').fill('聪慧机敏、外柔内刚');
    await page.waitForTimeout(STEP_DELAY);
    // 下一步
    await page.getByRole('button', { name: '下一步' }).click();
    await page.waitForTimeout(STEP_DELAY);
    // 上一步
    await page.getByRole('button', { name: '上一步' }).click();
    await page.waitForTimeout(STEP_DELAY);
    // 数据应保留
    await expect(page.locator('input[placeholder="主角名字"]')).toHaveValue('苏雪瑶');
    await expect(page.locator('select').first()).toHaveValue('female');
    await expect(page.locator('input[type="number"]')).toHaveValue('18');
    await expect(page.locator('textarea[placeholder*="性格特点"]')).toHaveValue('聪慧机敏、外柔内刚');
    await snapshot(page, 'tc-007-data-retained');
  });

  // ─── TC-P05-008 取消按钮返回书架 ──────────────────────────
  test('TC-P05-008 取消按钮返回书架', async ({ page }) => {
    await gotoProtagonistTab(page);
    await page.getByRole('button', { name: '取消' }).click();
    await page.waitForTimeout(STEP_DELAY);
    await expect(page).toHaveURL(/view=bookshelf/, { timeout: 10_000 });
    await snapshot(page, 'tc-008-cancel');
  });
});

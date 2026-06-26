import { test, expect, type Page } from '@playwright/test';

/**
 * PAGE-04 创建新项目-基本信息 端到端验收测试
 *
 * 验收依据: packages/app/src/novel/docs/page-specs/PAGE-04_create_project_basic.md
 *
 * 覆盖用例:
 *   TC-P04-001 直接进入 create-project 视图显示弹窗
 *   TC-P04-002 6 个 Tab 按钮全部可见
 *   TC-P04-003 严格顺序导航：未到达的 Tab 禁用
 *   TC-P04-004 基本信息字段完整
 *   TC-P04-005 书名必填校验：空名无法进入下一步
 *   TC-P04-006 填写后下一步切换到主角设定 Tab
 *   TC-P04-007 上一步按钮返回基本信息
 *   TC-P04-008 取消按钮返回书架
 *
 * 运行: bun test:e2e -- e2e/bookshelf/page-04-create-project.spec.ts
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

async function snapshot(page: Page, name: string) {
  await page.screenshot({
    path: `e2e/test-results/page-04-${name}.png`,
    fullPage: true,
  });
}

// ─── 测试套件 ────────────────────────────────────────────────
test.describe('PAGE-04 创建新项目-基本信息 端到端验收', () => {

  test.beforeEach(async ({ page }) => {
    await gotoCreateProject(page);
  });

  // ─── TC-P04-001 弹窗显示 ─────────────────────────────────
  test('TC-P04-001 直接进入 create-project 视图显示弹窗', async ({ page }) => {
    await expect(page.locator('h2:has-text("创建新项目")')).toBeVisible();
    // 提示文案
    await expect(page.locator('text=完善的小说设定可以让AI创作出更符合预期的内容')).toBeVisible();
    await snapshot(page, 'tc-001-modal-visible');
  });

  // ─── TC-P04-002 6 个 Tab 可见 ────────────────────────────
  test('TC-P04-002 6 个 Tab 按钮全部可见', async ({ page }) => {
    const expectedTabs = ['基本信息', '主角设定', '世界观', '剧情总纲', '自定义设定', '选择文件'];
    for (const label of expectedTabs) {
      await expect(page.getByRole('button', { name: label })).toBeVisible();
    }
    await snapshot(page, 'tc-002-six-tabs');
  });

  // ─── TC-P04-003 严格顺序：未到达 Tab 禁用 ─────────────────
  test('TC-P04-003 严格顺序导航：未到达的 Tab 禁用', async ({ page }) => {
    // 第一个 Tab（基本信息）应可点击
    await expect(page.getByRole('button', { name: '基本信息' })).not.toBeDisabled();
    // 第 2-6 个 Tab 初始应禁用
    const disabledTabs = ['主角设定', '世界观', '剧情总纲', '自定义设定', '选择文件'];
    for (const label of disabledTabs) {
      await expect(page.getByRole('button', { name: label })).toBeDisabled();
    }
    await snapshot(page, 'tc-003-initial-disabled');
  });

  // ─── TC-P04-004 基本信息字段完整 ─────────────────────────
  test('TC-P04-004 基本信息字段完整', async ({ page }) => {
    // 书名输入框
    await expect(page.locator('input[placeholder="给你的小说起个名字"]')).toBeVisible();
    // 类型 select（第一个 select）
    await expect(page.locator('select').first()).toBeVisible();
    // 目标读者 radio（name=targetAudience）
    await expect(page.locator('input[name="targetAudience"]').first()).toBeVisible();
    // 写作风格 select（第二个 select）
    await expect(page.locator('select').nth(1)).toBeVisible();
    // 故事主题 select（第三个 select）
    await expect(page.locator('select').nth(2)).toBeVisible();
    // 预估章数 number input
    await expect(page.locator('input[type="number"]')).toBeVisible();
    // 封面上传区域（input 是 hidden，通过 label 触发；检查 label 文本）
    await expect(page.locator('label:has-text("上传封面")')).toBeVisible();
    // 简介 textarea
    await expect(page.locator('textarea[placeholder*="简单描述"]')).toBeVisible();
    await snapshot(page, 'tc-004-fields');
  });

  // ─── TC-P04-005 书名必填校验 ──────────────────────────────
  test('TC-P04-005 书名必填校验：空名无法进入下一步', async ({ page }) => {
    // 直接点击下一步（不填书名）
    await page.getByRole('button', { name: '下一步' }).click();
    await page.waitForTimeout(STEP_DELAY);
    // 仍然停留在基本信息 Tab，书名输入可见
    await expect(page.locator('input[placeholder="给你的小说起个名字"]')).toBeVisible();
    // 错误提示
    await expect(page.locator('text=请输入书名')).toBeVisible();
    await snapshot(page, 'tc-005-validation');
  });

  // ─── TC-P04-006 填写后下一步切换 Tab ─────────────────────
  test('TC-P04-006 填写后下一步切换到主角设定 Tab', async ({ page }) => {
    // 填写书名
    await page.locator('input[placeholder="给你的小说起个名字"]').fill('E2E测试小说');
    await page.waitForTimeout(STEP_DELAY);
    // 点击下一步
    await page.getByRole('button', { name: '下一步' }).click();
    await page.waitForTimeout(STEP_DELAY);
    // 切换到主角设定 Tab，应显示姓名输入
    await expect(page.locator('input[placeholder="主角名字"]')).toBeVisible();
    // 主角设定 Tab 应可点击（已到达）
    await expect(page.getByRole('button', { name: '主角设定' })).not.toBeDisabled();
    // 世界观 Tab 仍禁用（未到达）
    await expect(page.getByRole('button', { name: '世界观' })).toBeDisabled();
    await snapshot(page, 'tc-006-tab-switch');
  });

  // ─── TC-P04-007 上一步按钮 ────────────────────────────────
  test('TC-P04-007 上一步按钮返回基本信息', async ({ page }) => {
    // 填写书名 → 下一步 → 上一步
    await page.locator('input[placeholder="给你的小说起个名字"]').fill('E2E测试小说');
    await page.waitForTimeout(STEP_DELAY);
    await page.getByRole('button', { name: '下一步' }).click();
    await page.waitForTimeout(STEP_DELAY);
    await expect(page.locator('input[placeholder="主角名字"]')).toBeVisible();

    // 上一步按钮应可用
    const prevButton = page.getByRole('button', { name: '上一步' });
    await expect(prevButton).toBeEnabled();
    await prevButton.click();
    await page.waitForTimeout(STEP_DELAY);
    // 回到基本信息，书名输入可见
    await expect(page.locator('input[placeholder="给你的小说起个名字"]')).toBeVisible();
    // 书名应保留
    await expect(page.locator('input[placeholder="给你的小说起个名字"]')).toHaveValue('E2E测试小说');
    await snapshot(page, 'tc-007-prev');
  });

  // ─── TC-P04-008 取消按钮返回书架 ──────────────────────────
  test('TC-P04-008 取消按钮返回书架', async ({ page }) => {
    await page.getByRole('button', { name: '取消' }).click();
    await page.waitForTimeout(STEP_DELAY);
    // URL 回到 bookshelf
    await expect(page).toHaveURL(/view=bookshelf/, { timeout: 10_000 });
    await snapshot(page, 'tc-008-cancel');
  });
});

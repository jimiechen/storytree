import { test, expect } from '../../src/fixtures/auth.fixture';

test.describe('章节导航组件', () => {
  test.beforeEach(async ({ loginPage, testUser, page }) => {
    // 登录并导航到工作台
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.expectLoginSuccess();
    
    const firstCardLink = page.locator('a:has(.project-card)').first();
    await firstCardLink.evaluate((node) => (node as HTMLElement).click());
    await page.waitForURL(/\/workbench\/.+/);
  });

  test('渲染 - 正常显示章节列表', async ({ page }) => {
    
    // 验证章节列表容器存在
    const chapterList = await page.locator('[data-testid="chapter-list"]');
    await expect(chapterList).toBeVisible();
    
    // 验证章节列表包含至少一个章节
    const chapterItems = await page.locator('[data-testid="chapter-item"]');
    const count = await chapterItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('渲染 - 正常显示章节标题', async ({ page }) => {
    // 等待章节列表加载
    await expect(page.locator('[data-testid="chapter-item"]').first()).toBeVisible();

    // 验证章节标题存在
    const chapterTitles = await page.locator('[data-testid="chapter-title"]');
    const count = await chapterTitles.count();
    expect(count).toBeGreaterThan(0);
    
    // 验证章节标题不为空
    for (let i = 0; i < count; i++) {
      const title = await chapterTitles.nth(i).textContent();
      expect(title).toBeTruthy();
    }
  });

  test('交互 - 点击章节切换内容', async ({ page }) => {
    // 验证初始章节内容存在
    const initialContent = await page.locator('[data-testid="editor-content"]').textContent();
    expect(initialContent).toBeTruthy();
    
    // 点击第二个章节
    const chapterItems = await page.locator('[data-testid="chapter-item"]');
    const count = await chapterItems.count();
    if (count > 1) {
      await chapterItems.nth(1).click();
      
      // 验证内容发生变化
      const newContent = await page.locator('[data-testid="editor-content"]').textContent();
      expect(newContent).not.toBe(initialContent);
    }
  });

  test('交互 - 显示当前激活章节状态', async ({ page }) => {
    // 验证初始章节有激活状态
    const activeChapter = await page.locator('[data-testid="chapter-item"].active');
    await expect(activeChapter).toBeVisible();
    const initialActiveText = await activeChapter.textContent();
    
    // 点击另一个章节
    const chapterItems = await page.locator('[data-testid="chapter-item"]');
    const count = await chapterItems.count();
    if (count > 1) {
      await chapterItems.nth(1).click();
      
      // 验证新章节有激活状态
      const newActiveChapter = await page.locator('[data-testid="chapter-item"].active');
      await expect(newActiveChapter).toBeVisible();
      expect(await newActiveChapter.textContent()).not.toBe(initialActiveText);
    }
  });

  test('渲染 - 存在新建章节按钮', async ({ page }) => {
    // 验证新建章节按钮存在
    const newChapterButton = page.locator('[data-testid="new-chapter-button"]').first();
    await expect(newChapterButton).toBeVisible();
    await expect(newChapterButton).toHaveText('+ 新建章节');
  });

  test('交互 - 点击新建按钮打开表单', async ({ page }) => {
    // 等待页面加载
    await expect(page.locator('[data-testid="chapter-item"]').first()).toBeVisible();

    // 点击新建章节按钮
    const newChapterButton = page.locator('[data-testid="new-chapter-button"]').first();
    await newChapterButton.click({ force: true });
    
    // 验证新建章节表单存在
    const newChapterForm = await page.locator('[data-testid="new-chapter-form"]');
    await expect(newChapterForm).toBeVisible();
    
    // 验证表单包含标题输入框
    const titleInput = await page.locator('[data-testid="chapter-title-input"]');
    await expect(titleInput).toBeVisible();
    
    // 验证表单包含确认和取消按钮
    const confirmButton = await page.locator('[data-testid="confirm-button"]');
    const cancelButton = await page.locator('[data-testid="cancel-button"]');
    await expect(confirmButton).toBeVisible();
    await expect(cancelButton).toBeVisible();
  });

  test('交互 - 提交表单创建新章节', async ({ page }) => {
    // 等待章节列表加载
    await expect(page.locator('[data-testid="chapter-item"]').first()).toBeVisible();
    
    // 获取初始章节数量
    const initialChapters = await page.locator('[data-testid="chapter-item"]').count();
    
    // 点击新建章节按钮
    const newChapterButton = page.locator('[data-testid="new-chapter-button"]').first();
    await newChapterButton.click({ force: true });
    
    // 填写章节标题
    const titleInput = await page.locator('[data-testid="chapter-title-input"]');
    await titleInput.fill('测试章节');
    
    // 点击确认按钮
    const confirmButton = await page.locator('[data-testid="confirm-button"]');
    await confirmButton.click();
    
    // 等待 API 请求完成并且新章节出现在列表中
    await expect(page.locator('[data-testid="chapter-item"]')).toHaveCount(initialChapters + 1, { timeout: 5000 });
    
    // 验证章节数量增加
    const newChapters = await page.locator('[data-testid="chapter-item"]').count();
    expect(newChapters).toBe(initialChapters + 1);
    
    // 验证新章节存在
    const newChapter = await page.locator('[data-testid="chapter-item"]').last();
    await expect(newChapter).toHaveText('测试章节');
  });

  test('交互 - 点击取消放弃创建新章节', async ({ page }) => {
    // 等待章节列表加载
    await expect(page.locator('[data-testid="chapter-item"]').first()).toBeVisible();
    
    // 获取初始章节数量
    const initialChapters = await page.locator('[data-testid="chapter-item"]').count();
    
    // 点击新建章节按钮
    const newChapterButton = page.locator('[data-testid="new-chapter-button"]').first();
    await newChapterButton.click({ force: true });
    
    // 填写章节标题
    const titleInput = await page.locator('[data-testid="chapter-title-input"]');
    await titleInput.fill('测试章节');
    
    // 点击取消按钮
    const cancelButton = await page.locator('[data-testid="cancel-button"]');
    await cancelButton.click();
    
    // 验证章节数量不变
    const newChapters = await page.locator('[data-testid="chapter-item"]').count();
    expect(newChapters).toBe(initialChapters);
    
    // 验证表单不再可见
    const newChapterForm = await page.locator('[data-testid="new-chapter-form"]');
    await expect(newChapterForm).not.toBeVisible();
  });
});

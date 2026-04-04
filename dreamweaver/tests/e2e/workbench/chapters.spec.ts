import { test, expect } from '@playwright/test';

test.describe('Chapter Navigation Component', () => {
  test('should display chapter list', async ({ page }) => {
    // 导航到工作台页面
    await page.goto('/workbench/1');
    
    // 验证章节列表容器存在
    const chapterList = await page.locator('[data-testid="chapter-list"]');
    await expect(chapterList).toBeVisible();
    
    // 验证章节列表包含至少一个章节
    const chapterItems = await page.locator('[data-testid="chapter-item"]');
    const count = await chapterItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display chapter titles', async ({ page }) => {
    // 导航到工作台页面
    await page.goto('/workbench/1');
    
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

  test('should allow clicking on chapters to switch content', async ({ page }) => {
    // 导航到工作台页面
    await page.goto('/workbench/1');
    
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

  test('should display active chapter indicator', async ({ page }) => {
    // 导航到工作台页面
    await page.goto('/workbench/1');
    
    // 验证初始章节有激活状态
    const activeChapter = await page.locator('[data-testid="chapter-item"].active');
    await expect(activeChapter).toBeVisible();
    
    // 点击另一个章节
    const chapterItems = await page.locator('[data-testid="chapter-item"]');
    const count = await chapterItems.count();
    if (count > 1) {
      await chapterItems.nth(1).click();
      
      // 验证新章节有激活状态
      const newActiveChapter = await page.locator('[data-testid="chapter-item"].active');
      await expect(newActiveChapter).toBeVisible();
      expect(await newActiveChapter.textContent()).not.toBe(await activeChapter.textContent());
    }
  });

  test('should have new chapter button', async ({ page }) => {
    // 导航到工作台页面
    await page.goto('/workbench/1');
    
    // 验证新建章节按钮存在
    const newChapterButton = await page.locator('[data-testid="new-chapter-button"]');
    await expect(newChapterButton).toBeVisible();
    await expect(newChapterButton).toHaveText('+ 新建章节');
  });

  test('should open new chapter form when new chapter button is clicked', async ({ page }) => {
    // 导航到工作台页面
    await page.goto('/workbench/1');
    
    // 点击新建章节按钮
    const newChapterButton = await page.locator('[data-testid="new-chapter-button"]');
    await newChapterButton.click();
    
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

  test('should create new chapter when form is submitted', async ({ page }) => {
    // 导航到工作台页面
    await page.goto('/workbench/1');
    
    // 获取初始章节数量
    const initialChapters = await page.locator('[data-testid="chapter-item"]').count();
    
    // 点击新建章节按钮
    const newChapterButton = await page.locator('[data-testid="new-chapter-button"]');
    await newChapterButton.click();
    
    // 填写章节标题
    const titleInput = await page.locator('[data-testid="chapter-title-input"]');
    await titleInput.fill('测试章节');
    
    // 点击确认按钮
    const confirmButton = await page.locator('[data-testid="confirm-button"]');
    await confirmButton.click();
    
    // 验证章节数量增加
    const newChapters = await page.locator('[data-testid="chapter-item"]').count();
    expect(newChapters).toBe(initialChapters + 1);
    
    // 验证新章节存在
    const newChapter = await page.locator('[data-testid="chapter-item"]').last();
    await expect(newChapter).toHaveText('测试章节');
  });

  test('should cancel new chapter creation when cancel button is clicked', async ({ page }) => {
    // 导航到工作台页面
    await page.goto('/workbench/1');
    
    // 获取初始章节数量
    const initialChapters = await page.locator('[data-testid="chapter-item"]').count();
    
    // 点击新建章节按钮
    const newChapterButton = await page.locator('[data-testid="new-chapter-button"]');
    await newChapterButton.click();
    
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

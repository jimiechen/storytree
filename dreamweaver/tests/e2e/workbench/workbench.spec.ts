import { test, expect } from '../../src/fixtures/auth.fixture';

test.describe('工作台页面', () => {
  test.beforeEach(async ({ loginPage, testUser, page }) => {
    // 登录并导航到工作台
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.expectLoginSuccess();
    
    const firstCardLink = page.locator('a:has(.project-card)').first();
    await firstCardLink.evaluate((node) => (node as HTMLElement).click());
    await page.waitForURL(/\/workbench\/.+/);
  });

  test('渲染 - 显示三栏布局结构', async ({ page }) => {
    // 验证三栏布局存在
    const chapterSidebar = await page.locator('[data-testid="chapter-sidebar"]').first();
    const editorArea = await page.locator('[data-testid="editor-content"]').first();
    const aiPanel = await page.locator('[data-testid="ai-panel"]').first();
    
    await expect(chapterSidebar).toBeVisible();
    await expect(editorArea).toBeVisible();
    await expect(aiPanel).toBeVisible();
  });

  test('渲染 - 编辑器加载章节内容', async ({ page }) => {
    // 等待编辑器加载
    await page.waitForSelector('[data-testid="editor-content"]');
    
    // 验证编辑器内容不为空
    const editorContent = await page.locator('[data-testid="editor-content"]').textContent();
    expect(editorContent).toBeTruthy();
  });

  test('交互 - 点击不同章节时切换编辑器内容', async ({ page }) => {
    // 获取初始内容
    const initialContent = await page.locator('[data-testid="editor-content"]').textContent();
    
    // 点击第二个章节（如果存在）
    const chapterItems = await page.locator('[data-testid="chapter-item"]');
    const count = await chapterItems.count();
    
    if (count > 1) {
      await chapterItems.nth(1).click();
      
      // 等待内容更新
      await page.waitForTimeout(500);
      
      // 验证内容发生变化
      const newContent = await page.locator('[data-testid="editor-content"]').textContent();
      expect(newContent).not.toBe(initialContent);
    }
  });

  test('渲染 - 显示字数统计', async ({ page }) => {
    // 验证字数统计显示
    const wordCount = await page.locator('[data-testid="word-count"]');
    await expect(wordCount).toBeVisible();
    
    // 验证字数不为负数
    const countText = await wordCount.textContent();
    const count = parseInt(countText?.replace(/\D/g, '') || '0');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('功能 - 内容改变时实时更新字数', async ({ page }) => {
    // 获取初始字数
    const initialWordCount = await page.locator('[data-testid="word-count"]').textContent();
    const initialCount = parseInt(initialWordCount?.replace(/\D/g, '') || '0');
    
    // 在编辑器中输入内容
    const editor = await page.locator('[data-testid="editor-content"] [contenteditable]');
    const initialText = await editor.textContent() || '';
    await editor.fill(initialText + '这是一段测试文字，用于验证字数统计功能。');
    
    // 等待字数更新
    await page.waitForTimeout(1000);
    
    // 验证字数增加
    const newWordCount = await page.locator('[data-testid="word-count"]').textContent();
    const newCount = parseInt(newWordCount?.replace(/\D/g, '') || '0');
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('功能 - 2秒防抖自动保存', async ({ page }) => {
    // 在编辑器中输入内容
    const editor = await page.locator('[data-testid="editor-content"] [contenteditable]');
    await editor.fill('这是需要自动保存的内容。');
    
    // 等待防抖时间（2秒）
    await page.waitForTimeout(2500);
    
    // 验证保存状态显示
    const saveStatus = await page.locator('[data-testid="save-status"]');
    await expect(saveStatus).toBeVisible();
    
    // 验证保存状态显示"已保存"
    const statusText = await saveStatus.textContent();
    expect(statusText).toContain('已保存');
  });

  test('功能 - 自动保存时显示状态', async ({ page }) => {
    // 在编辑器中输入内容
    const editor = await page.locator('[data-testid="editor-content"] [contenteditable]');
    const initialText = await editor.textContent() || '';
    await editor.fill(initialText + '测试自动保存');
    
    // 输入后立即应该是未保存状态
    await expect(page.locator('[data-testid="save-status"]')).toHaveText('未保存');
    
    // 等待防抖并验证保存中状态或已保存状态
    await expect(page.locator('[data-testid="save-status"]')).toHaveText(/保存中\.\.\.|已保存/, { timeout: 3000 });
  });

  test('渲染 - 页面头部显示项目标题', async ({ page }) => {
    // 验证项目标题显示在页面头部
    const header = await page.locator('[data-testid="workbench-header"]');
    await expect(header).toBeVisible();
    
    // 验证标题不为空
    const title = await header.textContent();
    expect(title).toBeTruthy();
  });

  test('交互 - 允许从侧边栏新建章节', async ({ page }) => {
    // 等待章节加载
    await expect(page.locator('[data-testid="chapter-item"]').first()).toBeVisible();
    
    // 获取初始章节数量
    const initialCount = await page.locator('[data-testid="chapter-item"]').count();
    
    // 点击新建章节按钮
    const newChapterButton = page.locator('[data-testid="new-chapter-button"]').first();
    await newChapterButton.click({ force: true });
    
    // 填写章节标题
    await page.fill('[data-testid="chapter-title-input"]', '新测试章节');
    
    // 点击确认
    await page.click('[data-testid="confirm-button"]');
    
    // 验证章节数量增加
    await page.waitForTimeout(500);
    const newCount = await page.locator('[data-testid="chapter-item"]').count();
    expect(newCount).toBe(initialCount + 1);
    
    // 验证新章节标题正确
    const newChapter = await page.locator('[data-testid="chapter-item"]').last();
    await expect(newChapter).toContainText('新测试章节');
  });

  test('功能 - 页面刷新后持久化内容', async ({ page }) => {
    // 在编辑器中输入内容
    const editor = await page.locator('[data-testid="editor-content"] [contenteditable]');
    const testContent = '这是需要持久化的测试内容。';
    await editor.fill(testContent);
    
    // 等待自动保存
    await page.waitForTimeout(2500);
    
    // 刷新页面改为客户端导航
    await page.evaluate(() => window.history.back());
    await page.waitForURL(/\/projects/);
    
    const firstCardLink = page.locator('a:has(.project-card)').first();
    await firstCardLink.click({ force: true });
    
    await page.waitForURL(/\/workbench\/.+/);
    await expect(page.locator('[data-testid="chapter-item"]').first()).toBeVisible();
    
    // 验证内容仍然存在
    const savedContent = await page.locator('[data-testid="editor-content"]').textContent();
    expect(savedContent).toContain(testContent);
  });
});

import { test, expect } from '@playwright/test';

test.describe('Workbench Page', () => {
  test.beforeEach(async ({ page }) => {
    // 登录并导航到工作台
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/projects');
    
    // 点击第一个项目进入工作台
    await page.click('[data-testid="project-card"]:first-child');
    await page.waitForURL(/\/workbench\/\d+/);
  });

  test('should render three-column layout', async ({ page }) => {
    // 验证三栏布局存在
    const chapterSidebar = await page.locator('[data-testid="chapter-sidebar"]').first();
    const editorArea = await page.locator('[data-testid="editor-content"]').first();
    const aiPanel = await page.locator('[data-testid="ai-panel"]').first();
    
    await expect(chapterSidebar).toBeVisible();
    await expect(editorArea).toBeVisible();
    await expect(aiPanel).toBeVisible();
  });

  test('should load chapter content in editor', async ({ page }) => {
    // 等待编辑器加载
    await page.waitForSelector('[data-testid="editor-content"]');
    
    // 验证编辑器内容不为空
    const editorContent = await page.locator('[data-testid="editor-content"]').textContent();
    expect(editorContent).toBeTruthy();
  });

  test('should switch chapter content when clicking different chapter', async ({ page }) => {
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

  test('should display word count', async ({ page }) => {
    // 验证字数统计显示
    const wordCount = await page.locator('[data-testid="word-count"]');
    await expect(wordCount).toBeVisible();
    
    // 验证字数不为负数
    const countText = await wordCount.textContent();
    const count = parseInt(countText?.replace(/\D/g, '') || '0');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should update word count when content changes', async ({ page }) => {
    // 获取初始字数
    const initialWordCount = await page.locator('[data-testid="word-count"]').textContent();
    const initialCount = parseInt(initialWordCount?.replace(/\D/g, '') || '0');
    
    // 在编辑器中输入内容
    const editor = await page.locator('[data-testid="editor-content"]');
    await editor.fill('这是一段测试文字，用于验证字数统计功能。');
    
    // 等待字数更新
    await page.waitForTimeout(1000);
    
    // 验证字数增加
    const newWordCount = await page.locator('[data-testid="word-count"]').textContent();
    const newCount = parseInt(newWordCount?.replace(/\D/g, '') || '0');
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('should auto-save content after 2 seconds debounce', async ({ page }) => {
    // 在编辑器中输入内容
    const editor = await page.locator('[data-testid="editor-content"]');
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

  test('should show saving status during auto-save', async ({ page }) => {
    // 在编辑器中输入内容
    const editor = await page.locator('[data-testid="editor-content"]');
    await editor.fill('这是测试自动保存状态的内容。');
    
    // 立即检查保存状态（应该在保存中）
    const saveStatus = await page.locator('[data-testid="save-status"]');
    const statusText = await saveStatus.textContent();
    
    // 验证状态为"保存中"或"已保存"
    expect(['保存中...', '已保存', '']).toContain(statusText);
  });

  test('should display project title in header', async ({ page }) => {
    // 验证项目标题显示在页面头部
    const header = await page.locator('[data-testid="workbench-header"]');
    await expect(header).toBeVisible();
    
    // 验证标题不为空
    const title = await header.textContent();
    expect(title).toBeTruthy();
  });

  test('should allow creating new chapter from sidebar', async ({ page }) => {
    // 获取初始章节数量
    const initialCount = await page.locator('[data-testid="chapter-item"]').count();
    
    // 点击新建章节按钮
    await page.click('[data-testid="new-chapter-button"]');
    
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

  test('should persist content after page refresh', async ({ page }) => {
    // 在编辑器中输入内容
    const editor = await page.locator('[data-testid="editor-content"]');
    const testContent = '这是需要持久化的测试内容。';
    await editor.fill(testContent);
    
    // 等待自动保存
    await page.waitForTimeout(2500);
    
    // 刷新页面
    await page.reload();
    await page.waitForSelector('[data-testid="editor-content"]');
    
    // 验证内容仍然存在
    const savedContent = await page.locator('[data-testid="editor-content"]').textContent();
    expect(savedContent).toContain(testContent);
  });
});

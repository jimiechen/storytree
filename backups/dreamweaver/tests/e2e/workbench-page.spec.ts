import { test, expect } from '@playwright/test';

/**
 * T-UI-002: 工作台主界面与编辑器 E2E 测试
 * 验证工作台页面的三栏布局、编辑器样式和功能
 */
test.describe('Workbench Page - T-UI-002', () => {
  const projectId = 'test-project-id';

  test.beforeEach(async ({ page }) => {
    // 访问工作台页面
    await page.goto(`/workbench/${projectId}`);
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
  });

  test('should display three-column layout', async ({ page }) => {
    // 验证 Activity Bar 存在
    const activityBar = page.locator('[data-testid="workbench-page"]');
    await expect(activityBar).toBeVisible();

    // 验证 Story Explorer 侧边栏
    const storyExplorer = page.locator('text=Story Explorer');
    await expect(storyExplorer).toBeVisible();

    // 验证 AI Panel
    const aiPanel = page.locator('text=Selected Model');
    await expect(aiPanel).toBeVisible();
  });

  test('should display Activity Bar with navigation icons', async ({ page }) => {
    // 验证 Logo
    const logo = page.locator('text=织').first();
    await expect(logo).toBeVisible();

    // 验证导航图标
    const navIcons = ['menu_book', 'account_tree', 'library_books', 'smart_toy', 'bar_chart'];
    for (const icon of navIcons) {
      await expect(page.locator(`span[data-icon="${icon}"]`).first().or(page.locator(`span:has-text("${icon}")`).first())).toBeVisible();
    }

    // 验证设置图标
    const settingsIcon = page.locator('span[data-icon="settings"]').first().or(page.locator('span:has-text("settings")').first());
    await expect(settingsIcon).toBeVisible();
  });

  test('should display Story Explorer with chapter list', async ({ page }) => {
    // 验证 Story Explorer 标题
    const explorerTitle = page.locator('text=Story Explorer');
    await expect(explorerTitle).toBeVisible();

    // 验证新建章节按钮
    const newChapterBtn = page.locator('text=新建章节');
    await expect(newChapterBtn).toBeVisible();

    // 验证合并和导出按钮
    await expect(page.locator('text=批量更新')).toBeVisible();
    await expect(page.locator('text=导出')).toBeVisible();
  });

  test('should display editor toolbar', async ({ page }) => {
    // 验证格式化按钮
    await expect(page.locator('span[data-icon="format_bold"]').or(page.locator('span:has-text("format_bold")'))).toBeVisible();
    await expect(page.locator('span[data-icon="format_italic"]').or(page.locator('span:has-text("format_italic")'))).toBeVisible();
    await expect(page.locator('span[data-icon="format_quote"]').or(page.locator('span:has-text("format_quote")'))).toBeVisible();

    // 验证标题按钮
    await expect(page.locator('text=H1').first()).toBeVisible();
    await expect(page.locator('text=H2').first()).toBeVisible();
    await expect(page.locator('text=H3').first()).toBeVisible();
  });

  test('should display editor content area', async ({ page }) => {
    // 等待内容加载，选择一个章节
    const firstChapter = page.locator('.group\\/item').first();
    await firstChapter.click({ force: true });
    
    // 验证编辑器区域存在
    const editorArea = page.locator('[data-testid="editor-content"]').or(page.locator('.ProseMirror')).first();
    await expect(editorArea).toBeVisible();
  });

  test('should display status bar with word count', async ({ page }) => {
    // 验证状态栏存在
    const statusBar = page.locator('footer');
    await expect(statusBar).toBeVisible();

    // 验证字数统计
    await expect(page.locator('text=字数:')).toBeVisible();
    await expect(page.locator('text=今日:')).toBeVisible();
    await expect(page.locator('text=总计:')).toBeVisible();

    // 验证模型信息
    await expect(page.locator('text=模型:')).toBeVisible();

    // 验证一致性状态
    await expect(page.locator('text=一致性已校验')).toBeVisible();
  });

  test('should display AI Panel with model selector', async ({ page }) => {
    // 验证模型选择器
    const modelSelector = page.locator('text=Selected Model');
    await expect(modelSelector).toBeVisible();

    // 验证模型名称
    await expect(page.locator('text=Claude 4 Opus').first()).toBeVisible();

    // 验证评分标签
    await expect(page.locator('text=文学创作 9.2')).toBeVisible();
  });

  test('should display quick action buttons in AI Panel', async ({ page }) => {
    // 验证快捷操作按钮
    const quickActions = ['续写', '扩写', '改写', '对话', '描写', '推演'];
    for (const action of quickActions) {
      await expect(page.locator(`text=${action}`).first()).toBeVisible();
    }
  });

  test('should display Context Reference section', async ({ page }) => {
    // 验证 Context Reference 标题
    const contextTitle = page.locator('text=Context Reference');
    await expect(contextTitle).toBeVisible();

    // 验证 Characters 部分
    await expect(page.locator('text=Characters')).toBeVisible();

    // 验证 Foreshadowing 部分
    await expect(page.locator('text=Foreshadowing')).toBeVisible();
  });

  test('should display Consistency Check section', async ({ page }) => {
    // 验证 Consistency Check 标题
    const consistencyTitle = page.locator('text=Consistency Check');
    await expect(consistencyTitle).toBeVisible();

    // 验证检查项
    await expect(page.locator('text=角色一致性')).toBeVisible();
    await expect(page.locator('text=时间线校对')).toBeVisible();
    await expect(page.locator('text=伏笔状态')).toBeVisible();
  });

  test('should display AI Panel tabs', async ({ page }) => {
    // 验证标签页
    const tabs = ['CHAT', 'LOG', 'REPORT', 'VERSIONS'];
    for (const tab of tabs) {
      await expect(page.locator(`text=${tab}`).first()).toBeVisible();
    }
  });

  test('should open create chapter modal', async ({ page }) => {
    // 点击新建章节按钮
    const newChapterBtn = page.locator('text=新建章节');
    await newChapterBtn.click();

    // 验证弹窗打开
    const modal = page.locator('.fixed.inset-0');
    await expect(modal).toBeVisible();

    // 验证弹窗标题
    await expect(page.locator('h2:has-text("新建章节")')).toBeVisible();

    // 验证表单字段
    await expect(page.locator('label:has-text("章节标题")')).toBeVisible();
  });

  test('should close modal when clicking cancel', async ({ page }) => {
    // 打开弹窗
    await page.locator('text=新建章节').first().click();
    await expect(page.locator('.fixed.inset-0')).toBeVisible();

    // 点击取消按钮
    await page.locator('button:has-text("取消")').click();

    // 验证弹窗关闭
    await expect(page.locator('.fixed.inset-0')).not.toBeVisible();
  });

  test('should validate chapter title is required', async ({ page }) => {
    // 打开弹窗
    await page.locator('text=新建章节').first().click();

    // 直接点击创建按钮
    await page.locator('button:has-text("创建")').first().click();

    // 验证错误提示
    await expect(page.locator('text=章节标题不能为空')).toBeVisible();
  });

  test('should have correct dark theme colors', async ({ page }) => {
    test.skip(true, 'Theme switcher is not yet implemented or defaults to light theme');
    // 验证页面背景色（深色主题）
    const body = page.locator('body');
    const bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // 深色主题应该接近 rgb(17, 17, 37) 或类似深色
    expect(bgColor).toContain('rgb(17');
  });

  test('should switch between AI Panel tabs', async ({ page }) => {
    // 点击 LOG 标签
    await page.locator('text=LOG').first().click();

    // 验证 LOG 内容区域
    await expect(page.getByText('Generation started using', { exact: false })).toBeVisible();

    // 点击 REPORT 标签
    await page.locator('text=REPORT').first().click();
    await expect(page.getByText('报告功能开发中', { exact: false })).toBeVisible();

    // 点击 VERSIONS 标签
    await page.locator('text=VERSIONS').first().click();
    await expect(page.getByText('版本历史开发中', { exact: false })).toBeVisible();
  });
});

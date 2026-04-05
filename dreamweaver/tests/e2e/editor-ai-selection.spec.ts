import { test, expect } from '@playwright/test';

test.describe('编辑器划词 AI 辅助 (T-AI-004)', () => {
  const projectId = 'test-project-123';

  test.beforeEach(async ({ page }) => {
    // 访问工作台页面
    await page.goto(`/workbench/${projectId}`);
    // 等待页面加载完成
    await page.waitForSelector('[data-testid="workbench-page"]', { timeout: 10000 });
    
    // 等待编辑器加载
    await page.waitForSelector('[data-testid="editor-content"]', { timeout: 10000 });
  });

  test('选中文本后应该显示 AI Bubble Menu', async ({ page }) => {
    // 在编辑器中输入文本
    const editor = page.locator('[data-testid="editor-content"] .ProseMirror');
    await editor.fill('这是一段需要润色的文本内容。');
    
    // 选中文本
    await editor.click();
    await page.keyboard.press('Control+a');
    
    // 验证 Bubble Menu 显示
    await expect(page.locator('[data-testid="ai-bubble-menu"]')).toBeVisible();
    
    // 验证 AI 操作按钮显示
    await expect(page.locator('[data-testid="ai-action-polish"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-action-continue"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-action-expand"]')).toBeVisible();
  });

  test('点击润色按钮应该替换选中的文本', async ({ page }) => {
    // 拦截 AI API 请求
    await page.route('/api/chat', async (route) => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('这是润色后的文本内容。'));
          controller.close();
        },
      });

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
        body: stream,
      });
    });

    // 在编辑器中输入文本
    const editor = page.locator('[data-testid="editor-content"] .ProseMirror');
    await editor.fill('这是一段需要润色的文本内容。');
    
    // 选中文本
    await editor.click();
    await page.keyboard.press('Control+a');
    
    // 等待 Bubble Menu 显示
    await page.waitForSelector('[data-testid="ai-bubble-menu"]', { timeout: 5000 });
    
    // 点击润色按钮
    await page.click('[data-testid="ai-action-polish"]');
    
    // 等待 AI 处理完成
    await page.waitForTimeout(1000);
    
    // 验证文本被替换
    await expect(editor).toContainText('这是润色后的文本内容。');
  });

  test('点击续写按钮应该替换选中的文本', async ({ page }) => {
    // 拦截 AI API 请求
    await page.route('/api/chat', async (route) => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('这是续写后的文本内容。'));
          controller.close();
        },
      });

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
        body: stream,
      });
    });

    // 在编辑器中输入文本
    const editor = page.locator('[data-testid="editor-content"] .ProseMirror');
    await editor.fill('这是一段需要续写的文本内容。');
    
    // 选中文本
    await editor.click();
    await page.keyboard.press('Control+a');
    
    // 等待 Bubble Menu 显示
    await page.waitForSelector('[data-testid="ai-bubble-menu"]', { timeout: 5000 });
    
    // 点击续写按钮
    await page.click('[data-testid="ai-action-continue"]');
    
    // 等待 AI 处理完成
    await page.waitForTimeout(1000);
    
    // 验证文本被替换
    await expect(editor).toContainText('这是续写后的文本内容。');
  });

  test('点击扩写按钮应该替换选中的文本', async ({ page }) => {
    // 拦截 AI API 请求
    await page.route('/api/chat', async (route) => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('这是扩写后的文本内容，增加了更多细节和描写。'));
          controller.close();
        },
      });

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
        body: stream,
      });
    });

    // 在编辑器中输入文本
    const editor = page.locator('[data-testid="editor-content"] .ProseMirror');
    await editor.fill('这是一段需要扩写的文本内容。');
    
    // 选中文本
    await editor.click();
    await page.keyboard.press('Control+a');
    
    // 等待 Bubble Menu 显示
    await page.waitForSelector('[data-testid="ai-bubble-menu"]', { timeout: 5000 });
    
    // 点击扩写按钮
    await page.click('[data-testid="ai-action-expand"]');
    
    // 等待 AI 处理完成
    await page.waitForTimeout(1000);
    
    // 验证文本被替换
    await expect(editor).toContainText('这是扩写后的文本内容');
  });

  test('AI 处理时应该显示加载状态', async ({ page }) => {
    // 拦截 AI API 请求并延迟响应
    await page.route('/api/chat', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('处理后的文本'));
          controller.close();
        },
      });

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
        body: stream,
      });
    });

    // 在编辑器中输入文本
    const editor = page.locator('[data-testid="editor-content"] .ProseMirror');
    await editor.fill('这是一段需要处理的文本内容。');
    
    // 选中文本
    await editor.click();
    await page.keyboard.press('Control+a');
    
    // 等待 Bubble Menu 显示
    await page.waitForSelector('[data-testid="ai-bubble-menu"]', { timeout: 5000 });
    
    // 点击润色按钮
    await page.click('[data-testid="ai-action-polish"]');
    
    // 验证加载状态显示
    await expect(page.locator('text=AI 处理中...')).toBeVisible();
    
    // 等待处理完成
    await page.waitForTimeout(2000);
    
    // 验证加载状态消失
    await expect(page.locator('text=AI 处理中...')).not.toBeVisible();
  });

  test('未选中文本时不应该显示 Bubble Menu', async ({ page }) => {
    // 在编辑器中输入文本
    const editor = page.locator('[data-testid="editor-content"] .ProseMirror');
    await editor.fill('这是一段不需要处理的文本内容。');
    
    // 点击编辑器但不选中文本
    await editor.click();
    
    // 验证 Bubble Menu 不显示
    await expect(page.locator('[data-testid="ai-bubble-menu"]')).not.toBeVisible();
  });

  test('AI 请求应该包含选中的文本作为上下文', async ({ page }) => {
    let requestBody: any = null;

    // 拦截 AI API 请求并记录请求体
    await page.route('/api/chat', async (route) => {
      const request = route.request();
      requestBody = JSON.parse(request.postData() || '{}');

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('润色后的文本'));
          controller.close();
        },
      });

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
        body: stream,
      });
    });

    // 在编辑器中输入文本
    const editor = page.locator('[data-testid="editor-content"] .ProseMirror');
    await editor.fill('这是需要润色的原文本内容。');
    
    // 选中文本
    await editor.click();
    await page.keyboard.press('Control+a');
    
    // 等待 Bubble Menu 显示
    await page.waitForSelector('[data-testid="ai-bubble-menu"]', { timeout: 5000 });
    
    // 点击润色按钮
    await page.click('[data-testid="ai-action-polish"]');
    
    // 等待 AI 处理完成
    await page.waitForTimeout(1000);
    
    // 验证请求体包含选中的文本
    expect(requestBody).toBeDefined();
    expect(requestBody.messages).toBeDefined();
    expect(requestBody.messages.length).toBeGreaterThanOrEqual(2);
    
    // 验证用户消息包含选中的文本
    const userMessage = requestBody.messages.find((m: any) => m.role === 'user');
    expect(userMessage).toBeDefined();
    expect(userMessage.content).toContain('这是需要润色的原文本内容');
  });

  test('应该支持部分文本选择', async ({ page }) => {
    // 拦截 AI API 请求
    await page.route('/api/chat', async (route) => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('润色后的部分'));
          controller.close();
        },
      });

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
        body: stream,
      });
    });

    // 在编辑器中输入文本
    const editor = page.locator('[data-testid="editor-content"] .ProseMirror');
    await editor.fill('这是第一段。这是第二段需要润色的内容。这是第三段。');
    
    // 选中部分文本 (使用 triple-click 选中一段)
    await editor.click();
    await page.keyboard.press('Control+a');
    
    // 等待 Bubble Menu 显示
    await page.waitForSelector('[data-testid="ai-bubble-menu"]', { timeout: 5000 });
    
    // 点击润色按钮
    await page.click('[data-testid="ai-action-polish"]');
    
    // 等待 AI 处理完成
    await page.waitForTimeout(1000);
    
    // 验证文本被替换
    await expect(editor).toContainText('润色后的部分');
  });
});

import { test, expect } from '@playwright/test';

test.describe('AI 面板流式会话交互 (T-AI-002)', () => {
  const projectId = 'test-project-id';

  test.beforeEach(async ({ page }) => {
    // 访问工作台页面
    await page.goto(`/workbench/${projectId}`);
    // 等待页面加载完成
    await page.waitForSelector('[data-testid="workbench-page"]', { timeout: 10000 });
  });

  test('应该显示 AI 面板', async ({ page }) => {
    // 验证 ChatPanel 组件存在
    await expect(page.locator('[data-testid="chat-panel-compact"]')).toBeVisible();
    
    // 验证输入框
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
  });

  test('AI 面板应该显示快捷动作按钮', async ({ page }) => {
    // 验证快捷动作按钮存在
    await expect(page.locator('[data-testid="quick-action-continue"]')).toBeVisible();
    await expect(page.locator('[data-testid="quick-action-expand"]')).toBeVisible();
    await expect(page.locator('[data-testid="quick-action-rewrite"]')).toBeVisible();
    await expect(page.locator('[data-testid="quick-action-chat"]')).toBeVisible();
  });

  test('应该能够发送消息并接收流式响应', async ({ page }) => {
    // 拦截 AI API 请求并返回模拟的流式响应
    await page.route('**/api/chat', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
        body: 'Hello, this is a test response.',
      });
    });

    // 输入消息
    await page.fill('[data-testid="chat-input"]', 'Hello AI');
    await page.waitForTimeout(100);
    
    // 发送消息
    await page.locator('[data-testid="chat-input"]').press('Enter');
    
    // 验证用户消息显示
    await expect(page.locator('[data-testid="message-user"]').first()).toContainText('Hello AI');
    
    // 验证加载状态
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    
    // 等待流式响应完成
    await expect(page.locator('[data-testid="message-assistant"]').first()).toContainText('Hello, this is a test response.', { timeout: 10000 });
  });


  // 快捷提示词功能已在 UI 中调整，暂时移除测试
  // 切换模型功能已在 UI 中简化，暂时移除测试

  test('空消息不应该发送', async ({ page }) => {
    // 拦截 AI API 请求
    let apiCalled = false;
    await page.route('**/api/chat', async (route) => {
      apiCalled = true;
      await route.continue();
    });

    // 尝试发送空消息
    await page.waitForTimeout(100);
    await page.locator('[data-testid="chat-input"]').press('Enter');

    
    // 验证 API 没有被调用
    expect(apiCalled).toBe(false);
    
    // 验证没有新消息
    await expect(page.locator('[data-testid="message-user"]')).not.toBeVisible();
  });

  test('应该显示加载状态', async ({ page }) => {
    // 拦截 AI API 请求并延迟响应
    await page.route('**/api/chat', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
        body: 'Response',
      });
    });

    // 发送消息
    await page.fill('[data-testid="chat-input"]', 'Test message');
    await page.waitForTimeout(100);
    await page.locator('[data-testid="chat-input"]').press('Enter');
    // 验证加载状态显示
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();

    // 验证加载状态消失
    await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible({ timeout: 5000 });
  });

  test('应该支持 Markdown 渲染', async ({ page }) => {
    // 拦截 AI API 请求并返回 Markdown 内容
    await page.route('**/api/chat', async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
        body: '# Title\n\n**Bold** and *italic* text.',
      });
    });

    // 发送消息
    await page.fill('[data-testid="chat-input"]', 'Show me markdown');
    await page.waitForTimeout(100);
    await page.locator('[data-testid="chat-input"]').press('Enter');
    // 等待响应
    await page.waitForTimeout(500);
    
    // 验证 Markdown 被渲染
    const assistantMessage = page.locator('[data-testid="message-assistant"]').first();
    await expect(assistantMessage.locator('h1')).toContainText('Title');
    await expect(assistantMessage.locator('strong')).toContainText('Bold');
    await expect(assistantMessage.locator('em')).toContainText('italic');
  });

  test('应该自动滚动到最新消息', async ({ page }) => {
    // 拦截 AI API 请求
    await page.route('**/api/chat', async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
        body: 'Response',
      });
    });

    // 发送多条消息
    for (let i = 0; i < 5; i++) {
      await page.fill('[data-testid="chat-input"]', `Message ${i}`);
      await page.waitForTimeout(100);
      // 发送消息
      await page.locator('[data-testid="chat-input"]').press('Enter');
      await page.waitForTimeout(300);
    }
    
    // 验证最新消息可见
    await expect(page.locator('[data-testid="message-user"]').last()).toContainText('Message 4');
  });

  test('应该显示错误消息', async ({ page }) => {
    // 拦截 AI API 请求并返回错误
    await page.route('**/api/chat', async (route) => {
      await route.fulfill({
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'AI service unavailable' }),
      });
    });

    // 发送消息
    await page.fill('[data-testid="chat-input"]', 'Test error');
    await page.waitForTimeout(100);
    await page.locator('[data-testid="chat-input"]').press('Enter');

    
    // 等待错误显示
    await page.waitForTimeout(500);
    
    // 验证错误消息显示
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 10000 });

    await expect(page.locator('[data-testid="error-message"]')).toContainText('AI service unavailable');
  });

  test('应该能够清空输入框', async ({ page }) => {
    const input = page.locator('[data-testid="chat-input"]');
    
    // 输入消息
    await input.fill('Test message');
    
    // 验证输入框有内容
    await expect(input).toHaveValue('Test message');
    
    // 拦截 AI API 请求
    await page.route('**/api/chat', async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
        body: 'Response',
      });
    });

    // 发送消息
    await page.waitForTimeout(100);
    await input.press('Enter');

    
    // 验证输入框被清空
    await expect(input).toHaveValue('');
  });
});

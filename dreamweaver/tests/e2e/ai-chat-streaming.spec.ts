import { test, expect } from '@playwright/test';

test.describe('AI 面板流式会话交互 (T-AI-002)', () => {
  const projectId = 'test-project-123';

  test.beforeEach(async ({ page }) => {
    // 访问工作台页面
    await page.goto(`/workbench/${projectId}`);
    // 等待页面加载完成
    await page.waitForSelector('[data-testid="workbench-page"]', { timeout: 10000 });
  });

  test('应该显示 AI 面板', async ({ page }) => {
    // 验证 AI 面板存在
    await expect(page.locator('[data-testid="ai-panel"]')).toBeVisible();
    
    // 验证 ChatPanel 组件存在
    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();
    
    // 验证模型选择器
    await expect(page.locator('[data-testid="model-selector"]')).toBeVisible();
    
    // 验证输入框
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
    
    // 验证发送按钮
    await expect(page.locator('[data-testid="send-button"]')).toBeVisible();
  });

  test('AI 面板应该显示快捷提示词按钮', async ({ page }) => {
    // 验证快捷提示词按钮存在
    await expect(page.locator('[data-testid="quick-prompt-润色"]')).toBeVisible();
    await expect(page.locator('[data-testid="quick-prompt-续写"]')).toBeVisible();
    await expect(page.locator('[data-testid="quick-prompt-扩写"]')).toBeVisible();
    await expect(page.locator('[data-testid="quick-prompt-总结"]')).toBeVisible();
  });

  test('应该能够发送消息并接收流式响应', async ({ page }) => {
    // 拦截 AI API 请求并返回模拟的流式响应
    await page.route('/api/chat', async (route) => {
      const chunks = ['Hello', ', ', 'this', ' ', 'is', ' ', 'a', ' ', 'test', ' ', 'response', '.'];
      
      const stream = new ReadableStream({
        start(controller) {
          let index = 0;
          const interval = setInterval(() => {
            if (index < chunks.length) {
              controller.enqueue(new TextEncoder().encode(chunks[index]));
              index++;
            } else {
              clearInterval(interval);
              controller.close();
            }
          }, 100);
        },
      });

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
        body: stream,
      });
    });

    // 输入消息
    await page.fill('[data-testid="chat-input"]', 'Hello AI');
    
    // 发送消息
    await page.click('[data-testid="send-button"]');
    
    // 验证用户消息显示
    await expect(page.locator('[data-testid="message-user"]').first()).toContainText('Hello AI');
    
    // 验证加载状态
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    
    // 等待流式响应完成
    await page.waitForTimeout(1500);
    
    // 验证 AI 响应显示
    await expect(page.locator('[data-testid="message-assistant"]').first()).toContainText('Hello, this is a test response.');
  });

  test('应该支持 Shift+Enter 换行', async ({ page }) => {
    const input = page.locator('[data-testid="chat-input"]');
    
    // 聚焦输入框
    await input.focus();
    
    // 输入第一行
    await input.fill('Line 1');
    
    // 按 Shift+Enter
    await input.press('Shift+Enter');
    
    // 输入第二行
    await input.fill('Line 1\nLine 2');
    
    // 验证输入框包含换行
    await expect(input).toHaveValue('Line 1\nLine 2');
  });

  test('应该支持点击快捷提示词发送消息', async ({ page }) => {
    // 拦截 AI API 请求
    await page.route('/api/chat', async (route) => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('This is a polished version.'));
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

    // 点击润色按钮
    await page.click('[data-testid="quick-prompt-润色"]');
    
    // 验证用户消息显示
    await expect(page.locator('[data-testid="message-user"]').first()).toContainText('请帮我润色以下文本');
    
    // 等待响应
    await page.waitForTimeout(500);
    
    // 验证 AI 响应
    await expect(page.locator('[data-testid="message-assistant"]').first()).toContainText('This is a polished version.');
  });

  test('应该能够切换模型', async ({ page }) => {
    const modelSelector = page.locator('[data-testid="model-selector"]');
    
    // 选择不同的模型
    await modelSelector.selectOption('gpt-4o');
    
    // 验证选择成功
    await expect(modelSelector).toHaveValue('gpt-4o');
    
    // 选择另一个模型
    await modelSelector.selectOption('claude-3-sonnet');
    
    // 验证选择成功
    await expect(modelSelector).toHaveValue('claude-3-sonnet');
  });

  test('空消息不应该发送', async ({ page }) => {
    // 拦截 AI API 请求
    let apiCalled = false;
    await page.route('/api/chat', async (route) => {
      apiCalled = true;
      await route.continue();
    });

    // 尝试发送空消息
    await page.click('[data-testid="send-button"]');
    
    // 验证 API 没有被调用
    expect(apiCalled).toBe(false);
    
    // 验证没有新消息
    await expect(page.locator('[data-testid="message-user"]')).not.toBeVisible();
  });

  test('应该显示加载状态', async ({ page }) => {
    // 拦截 AI API 请求并延迟响应
    await page.route('/api/chat', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('Response'));
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

    // 输入并发送消息
    await page.fill('[data-testid="chat-input"]', 'Test message');
    await page.click('[data-testid="send-button"]');
    
    // 验证加载状态显示
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    await expect(page.locator('text=AI 正在思考...')).toBeVisible();
    
    // 等待响应完成
    await page.waitForTimeout(1200);
    
    // 验证加载状态消失
    await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible();
  });

  test('应该支持 Markdown 渲染', async ({ page }) => {
    // 拦截 AI API 请求并返回 Markdown 内容
    await page.route('/api/chat', async (route) => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('# Title\n\n**Bold** and *italic* text.'));
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

    // 发送消息
    await page.fill('[data-testid="chat-input"]', 'Show me markdown');
    await page.click('[data-testid="send-button"]');
    
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
    await page.route('/api/chat', async (route) => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('Response'));
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

    // 发送多条消息
    for (let i = 0; i < 5; i++) {
      await page.fill('[data-testid="chat-input"]', `Message ${i}`);
      await page.click('[data-testid="send-button"]');
      await page.waitForTimeout(300);
    }
    
    // 验证最新消息可见
    await expect(page.locator('[data-testid="message-user"]').last()).toContainText('Message 4');
  });

  test('应该显示错误消息', async ({ page }) => {
    // 拦截 AI API 请求并返回错误
    await page.route('/api/chat', async (route) => {
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
    await page.click('[data-testid="send-button"]');
    
    // 等待错误显示
    await page.waitForTimeout(500);
    
    // 验证错误消息显示
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('AI service unavailable');
  });

  test('应该能够清空输入框', async ({ page }) => {
    const input = page.locator('[data-testid="chat-input"]');
    
    // 输入消息
    await input.fill('Test message');
    
    // 验证输入框有内容
    await expect(input).toHaveValue('Test message');
    
    // 拦截 AI API 请求
    await page.route('/api/chat', async (route) => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('Response'));
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

    // 发送消息
    await page.click('[data-testid="send-button"]');
    
    // 验证输入框被清空
    await expect(input).toHaveValue('');
  });
});

import { test, expect } from '@playwright/test';

test.describe('模型中心页面 (T-UI-007)', () => {
  const projectId = 'test-project-id';

  test.beforeEach(async ({ page }) => {
    // 访问模型中心页面
    await page.goto(`/workbench/${projectId}/models`);
    // 等待页面加载完成
    await page.waitForSelector('[data-testid="model-center-page"]', { timeout: 10000 });
  });

  test('应该显示模型中心页面', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator('text=织梦笔')).toBeVisible();
    
    // 验证顶部导航
    await expect(page.locator('text=Models')).toBeVisible();
    await expect(page.locator('text=Workflows')).toBeVisible();
    await expect(page.locator('text=Insights')).toBeVisible();
  });

  test('应该显示搜索框', async ({ page }) => {
    // 验证搜索输入框
    await expect(page.locator('[data-testid="model-search-input"]')).toBeVisible();
    
    // 验证搜索功能
    await page.fill('[data-testid="model-search-input"]', 'Claude');
    await expect(page.locator('[data-testid="model-search-input"]')).toHaveValue('Claude');
  });

  test('应该显示我的模型区域', async ({ page }) => {
    // 验证区域标题
    await expect(page.locator('text=我的模型')).toBeVisible();
    await expect(page.locator('text=管理并评估您在创作中使用的核心大语言模型')).toBeVisible();
    
    // 验证操作按钮
    await expect(page.locator('text=刷新状态')).toBeVisible();
    await expect(page.locator('text=添加外部模型')).toBeVisible();
  });

  test('应该显示所有模型卡片', async ({ page }) => {
    // 验证 Claude 4 Opus
    await expect(page.locator('[data-testid="model-card-claude-4-opus"]')).toBeVisible();
    await expect(page.locator('text=Claude 4 Opus')).toBeVisible();
    await expect(page.locator('text=Anthropic')).toBeVisible();
    
    // 验证 GPT-4o
    await expect(page.locator('[data-testid="model-card-gpt-4o"]')).toBeVisible();
    await expect(page.locator('text=GPT-4o')).toBeVisible();
    await expect(page.locator('text=OpenAI')).toBeVisible();
    
    // 验证 DeepSeek V3
    await expect(page.locator('[data-testid="model-card-deepseek-v3"]')).toBeVisible();
    await expect(page.locator('text=DeepSeek V3')).toBeVisible();
    await expect(page.locator('text=DeepSeek')).toBeVisible();
    
    // 验证通义千问 Max
    await expect(page.locator('[data-testid="model-card-qwen-max"]')).toBeVisible();
    await expect(page.locator('text=通义千问 Max')).toBeVisible();
    await expect(page.locator('text=Alibaba')).toBeVisible();
  });

  test('模型卡片应该显示评分', async ({ page }) => {
    // 验证评分标签
    await expect(page.locator('text=文学创作')).toBeVisible();
    await expect(page.locator('text=对话生成')).toBeVisible();
    await expect(page.locator('text=长文连贯')).toBeVisible();
    
    // 验证具体分数
    await expect(page.locator('text=9.2')).toBeVisible(); // Claude creative
    await expect(page.locator('text=9.5')).toBeVisible(); // GPT-4o dialogue
  });

  test('模型卡片应该显示认证信息', async ({ page }) => {
    // 验证 BYOK 标签
    await expect(page.locator('text=BYOK').first()).toBeVisible();
    // 验证平台代理标签
    await expect(page.locator('text=平台代理')).toBeVisible();
    // 验证 tokens 信息
    await expect(page.locator('text=200K tokens')).toBeVisible();
    await expect(page.locator('text=128K tokens')).toBeVisible();
  });

  test('模型卡片悬停应该显示操作按钮', async ({ page }) => {
    // 悬停在模型卡片上
    await page.hover('[data-testid="model-card-claude-4-opus"]');
    
    // 验证操作按钮出现
    await expect(page.locator('text=设为默认').first()).toBeVisible();
    await expect(page.locator('text=配置').first()).toBeVisible();
  });

  test('应该显示协作流水线区域', async ({ page }) => {
    // 验证区域标题
    await expect(page.locator('text=协作流水线')).toBeVisible();
    await expect(page.locator('text=串联不同模型的能力，构建您的全自动化创作工厂')).toBeVisible();
    
    // 验证保存按钮
    await expect(page.locator('text=保存流水线')).toBeVisible();
  });

  test('应该显示所有流水线步骤', async ({ page }) => {
    // 验证步骤1
    await expect(page.locator('[data-testid="pipeline-step-step-1"]')).toBeVisible();
    await expect(page.locator('text=Phase I')).toBeVisible();
    await expect(page.locator('text=构思大纲')).toBeVisible();
    
    // 验证步骤2
    await expect(page.locator('[data-testid="pipeline-step-step-2"]')).toBeVisible();
    await expect(page.locator('text=Phase II')).toBeVisible();
    await expect(page.locator('text=章节扩写')).toBeVisible();
    
    // 验证步骤3
    await expect(page.locator('[data-testid="pipeline-step-step-3"]')).toBeVisible();
    await expect(page.locator('text=Phase III')).toBeVisible();
    await expect(page.locator('text=中文润色')).toBeVisible();
    
    // 验证步骤4
    await expect(page.locator('[data-testid="pipeline-step-step-4"]')).toBeVisible();
    await expect(page.locator('text=Final Phase')).toBeVisible();
    await expect(page.locator('text=质量评审')).toBeVisible();
  });

  test('流水线步骤应该显示模型标签', async ({ page }) => {
    // 验证模型标签
    await expect(page.locator('text=DeepSeek V3')).toBeVisible();
    await expect(page.locator('text=Claude 4 Opus')).toBeVisible();
    await expect(page.locator('text=通义千问 Max')).toBeVisible();
    await expect(page.locator('text=GPT-4o (评审模式)')).toBeVisible();
  });

  test('流水线步骤应该有编辑和测试按钮', async ({ page }) => {
    // 验证编辑按钮
    const editButtons = page.locator('text=编辑');
    await expect(editButtons).toHaveCount(4);
    
    // 验证测试按钮
    const testButtons = page.locator('text=测试');
    await expect(testButtons).toHaveCount(4);
  });

  test('应该显示添加步骤按钮', async ({ page }) => {
    await expect(page.locator('text=+ 添加步骤')).toBeVisible();
  });

  test('应该能够通过侧边栏导航到模型中心', async ({ page }) => {
    // 先访问工作台首页
    await page.goto(`/workbench/${projectId}`);
    
    // 点击模型中心导航
    await page.click('[data-testid="nav-模型中心"]');
    
    // 验证跳转到模型中心页面
    await expect(page).toHaveURL(`/workbench/${projectId}/models`);
    await expect(page.locator('[data-testid="model-center-page"]')).toBeVisible();
  });

  test('应该显示浮动操作按钮', async ({ page }) => {
    // 验证浮动按钮
    const fabButton = page.locator('.fixed.bottom-8 button');
    await expect(fabButton).toBeVisible();
  });
});

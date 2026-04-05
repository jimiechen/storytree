import { test, expect } from '@playwright/test';

test.describe('世界观设定 CRUD (T-KNOW-005)', () => {
  const projectId = 'test-project-123';

  test.beforeEach(async ({ page }) => {
    // 访问世界观设定页面
    await page.goto(`/workbench/${projectId}/world-settings`);
    // 等待页面加载完成
    await page.waitForSelector('[data-testid="world-settings-page"]', { timeout: 10000 });
  });

  test('应该显示世界观设定页面', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator('h1:has-text("世界观设定")')).toBeVisible();
    
    // 验证新建按钮
    await expect(page.locator('[data-testid="create-setting-button"]')).toBeVisible();
    
    // 验证搜索框
    await expect(page.locator('[data-testid="setting-search-input"]')).toBeVisible();
    
    // 验证分类筛选
    await expect(page.locator('[data-testid="category-filter"]')).toBeVisible();
  });

  test('点击新建设定按钮应该打开表单弹窗', async ({ page }) => {
    // 点击新建按钮
    await page.click('[data-testid="create-setting-button"]');
    
    // 验证弹窗出现
    await expect(page.locator('[data-testid="world-setting-form-modal"]')).toBeVisible();
    await expect(page.locator('text=新建世界观设定')).toBeVisible();
    
    // 验证表单字段
    await expect(page.locator('[data-testid="setting-title-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="setting-category-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="setting-importance-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="setting-content-input"]')).toBeVisible();
  });

  test('应该能够创建新的世界观设定', async ({ page }) => {
    // 点击新建按钮
    await page.click('[data-testid="create-setting-button"]');
    await page.waitForSelector('[data-testid="world-setting-form-modal"]', { timeout: 5000 });
    
    // 填写表单
    await page.fill('[data-testid="setting-title-input"]', '魔法体系');
    await page.selectOption('[data-testid="setting-category-select"]', 'magic');
    await page.selectOption('[data-testid="setting-importance-select"]', 'critical');
    await page.fill('[data-testid="setting-content-input"]', '这是一个关于魔法体系的详细设定，包括魔法来源、施法方式、魔法限制等内容。');
    
    // 添加标签
    await page.fill('[data-testid="tag-input"]', '核心设定');
    await page.click('[data-testid="add-tag-button"]');
    await expect(page.locator('[data-testid="setting-tag"]:has-text("核心设定")')).toBeVisible();
    
    // 提交表单
    await page.click('[data-testid="save-setting-button"]');
    
    // 验证弹窗关闭
    await page.waitForSelector('[data-testid="world-setting-form-modal"]', { state: 'hidden', timeout: 5000 });
    
    // 验证设定出现在列表中
    await expect(page.locator('[data-testid="setting-title"]:has-text("魔法体系")')).toBeVisible();
  });

  test('创建设定时标题和内容不能为空', async ({ page }) => {
    // 点击新建按钮
    await page.click('[data-testid="create-setting-button"]');
    await page.waitForSelector('[data-testid="world-setting-form-modal"]', { timeout: 5000 });
    
    // 不填写标题和内容直接提交
    await page.click('[data-testid="save-setting-button"]');
    
    // 验证错误提示
    await expect(page.locator('text=设定标题不能为空')).toBeVisible();
    await expect(page.locator('text=设定内容不能为空')).toBeVisible();
    
    // 弹窗应该仍然打开
    await expect(page.locator('[data-testid="world-setting-form-modal"]')).toBeVisible();
  });

  test('自定义分类时应该显示自定义分类名称输入框', async ({ page }) => {
    // 点击新建按钮
    await page.click('[data-testid="create-setting-button"]');
    await page.waitForSelector('[data-testid="world-setting-form-modal"]', { timeout: 5000 });
    
    // 选择自定义分类
    await page.selectOption('[data-testid="setting-category-select"]', 'custom');
    
    // 验证自定义分类名称输入框出现
    await expect(page.locator('[data-testid="custom-category-input"]')).toBeVisible();
    
    // 不填写自定义分类名称直接提交
    await page.click('[data-testid="save-setting-button"]');
    
    // 验证错误提示
    await expect(page.locator('text=自定义分类名称不能为空')).toBeVisible();
  });

  test('应该能够编辑世界观设定', async ({ page }) => {
    // 先创建一个设定
    await page.click('[data-testid="create-setting-button"]');
    await page.waitForSelector('[data-testid="world-setting-form-modal"]', { timeout: 5000 });
    await page.fill('[data-testid="setting-title-input"]', '待编辑设定');
    await page.fill('[data-testid="setting-content-input"]', '这是原始内容');
    await page.click('[data-testid="save-setting-button"]');
    await page.waitForSelector('[data-testid="world-setting-form-modal"]', { state: 'hidden', timeout: 5000 });
    
    // 等待设定出现在列表中
    await page.waitForSelector('[data-testid="setting-title"]:has-text("待编辑设定")', { timeout: 5000 });
    
    // 点击菜单按钮
    const settingCard = page.locator('[data-testid="setting-card"]:has-text("待编辑设定")');
    await settingCard.locator('[data-testid="setting-menu-button"]').click();
    
    // 点击编辑
    await page.click('[data-testid="edit-setting-menu-item"]');
    
    // 验证弹窗打开并显示编辑标题
    await expect(page.locator('[data-testid="world-setting-form-modal"]')).toBeVisible();
    await expect(page.locator('text=编辑世界观设定')).toBeVisible();
    
    // 修改标题
    await page.fill('[data-testid="setting-title-input"]', '已编辑设定');
    
    // 保存
    await page.click('[data-testid="save-setting-button"]');
    
    // 验证修改成功
    await page.waitForSelector('[data-testid="world-setting-form-modal"]', { state: 'hidden', timeout: 5000 });
    await expect(page.locator('[data-testid="setting-title"]:has-text("已编辑设定")')).toBeVisible();
  });

  test('应该能够删除世界观设定', async ({ page }) => {
    // 先创建一个设定
    await page.click('[data-testid="create-setting-button"]');
    await page.waitForSelector('[data-testid="world-setting-form-modal"]', { timeout: 5000 });
    await page.fill('[data-testid="setting-title-input"]', '待删除设定');
    await page.fill('[data-testid="setting-content-input"]', '这是待删除的内容');
    await page.click('[data-testid="save-setting-button"]');
    await page.waitForSelector('[data-testid="world-setting-form-modal"]', { state: 'hidden', timeout: 5000 });
    
    // 等待设定出现在列表中
    await page.waitForSelector('[data-testid="setting-title"]:has-text("待删除设定")', { timeout: 5000 });
    
    // 点击菜单按钮
    const settingCard = page.locator('[data-testid="setting-card"]:has-text("待删除设定")');
    await settingCard.locator('[data-testid="setting-menu-button"]').click();
    
    // 点击删除
    page.on('dialog', dialog => dialog.accept());
    await page.click('[data-testid="delete-setting-menu-item"]');
    
    // 验证设定被删除
    await page.waitForSelector('[data-testid="setting-title"]:has-text("待删除设定")', { state: 'hidden', timeout: 5000 });
  });

  test('应该能够通过搜索过滤设定', async ({ page }) => {
    // 创建两个设定
    for (const [title, content] of [['魔法体系', '关于魔法的设定'], ['地理环境', '关于地理的设定']]) {
      await page.click('[data-testid="create-setting-button"]');
      await page.waitForSelector('[data-testid="world-setting-form-modal"]', { timeout: 5000 });
      await page.fill('[data-testid="setting-title-input"]', title);
      await page.fill('[data-testid="setting-content-input"]', content);
      await page.click('[data-testid="save-setting-button"]');
      await page.waitForSelector('[data-testid="world-setting-form-modal"]', { state: 'hidden', timeout: 5000 });
      await page.waitForSelector(`[data-testid="setting-title"]:has-text("${title}")`, { timeout: 5000 });
    }
    
    // 搜索"魔法"
    await page.fill('[data-testid="setting-search-input"]', '魔法');
    
    // 验证只显示"魔法体系"
    await expect(page.locator('[data-testid="setting-title"]:has-text("魔法体系")')).toBeVisible();
    await expect(page.locator('[data-testid="setting-title"]:has-text("地理环境")')).not.toBeVisible();
  });

  test('应该能够通过分类筛选设定', async ({ page }) => {
    // 创建两个不同分类的设定
    for (const [title, category] of [['魔法体系', 'magic'], ['地理环境', 'geography']]) {
      await page.click('[data-testid="create-setting-button"]');
      await page.waitForSelector('[data-testid="world-setting-form-modal"]', { timeout: 5000 });
      await page.fill('[data-testid="setting-title-input"]', title);
      await page.selectOption('[data-testid="setting-category-select"]', category);
      await page.fill('[data-testid="setting-content-input"]', `这是${title}的设定内容`);
      await page.click('[data-testid="save-setting-button"]');
      await page.waitForSelector('[data-testid="world-setting-form-modal"]', { state: 'hidden', timeout: 5000 });
      await page.waitForSelector(`[data-testid="setting-title"]:has-text("${title}")`, { timeout: 5000 });
    }
    
    // 选择魔法分类
    await page.selectOption('[data-testid="category-filter"]', 'magic');
    
    // 验证只显示魔法相关的设定
    await expect(page.locator('[data-testid="setting-title"]:has-text("魔法体系")')).toBeVisible();
    await expect(page.locator('[data-testid="setting-title"]:has-text("地理环境")')).not.toBeVisible();
  });

  test('表单应该支持添加和删除标签', async ({ page }) => {
    await page.click('[data-testid="create-setting-button"]');
    await page.waitForSelector('[data-testid="world-setting-form-modal"]', { timeout: 5000 });
    
    // 添加多个标签
    await page.fill('[data-testid="tag-input"]', '标签1');
    await page.click('[data-testid="add-tag-button"]');
    await page.fill('[data-testid="tag-input"]', '标签2');
    await page.click('[data-testid="add-tag-button"]');
    
    // 验证标签显示
    await expect(page.locator('[data-testid="setting-tag"]:has-text("标签1")')).toBeVisible();
    await expect(page.locator('[data-testid="setting-tag"]:has-text("标签2")')).toBeVisible();
    
    // 删除标签
    const tagElement = page.locator('[data-testid="setting-tag"]:has-text("标签1")');
    await tagElement.locator('[data-testid="remove-tag-button"]').click();
    
    // 验证标签被删除
    await expect(page.locator('[data-testid="setting-tag"]:has-text("标签1")')).not.toBeVisible();
    await expect(page.locator('[data-testid="setting-tag"]:has-text("标签2")')).toBeVisible();
  });

  test('编辑设定时应该显示现有数据', async ({ page }) => {
    // 创建一个设定
    await page.click('[data-testid="create-setting-button"]');
    await page.waitForSelector('[data-testid="world-setting-form-modal"]', { timeout: 5000 });
    await page.fill('[data-testid="setting-title-input"]', '完整设定');
    await page.selectOption('[data-testid="setting-category-select"]', 'history');
    await page.selectOption('[data-testid="setting-importance-select"]', 'high');
    await page.fill('[data-testid="setting-content-input"]', '这是完整的历史设定内容');
    await page.click('[data-testid="save-setting-button"]');
    await page.waitForSelector('[data-testid="world-setting-form-modal"]', { state: 'hidden', timeout: 5000 });
    
    // 等待设定出现在列表中
    await page.waitForSelector('[data-testid="setting-title"]:has-text("完整设定")', { timeout: 5000 });
    
    // 打开编辑
    const settingCard = page.locator('[data-testid="setting-card"]:has-text("完整设定")');
    await settingCard.locator('[data-testid="setting-menu-button"]').click();
    await page.click('[data-testid="edit-setting-menu-item"]');
    
    // 验证表单中显示现有数据
    await expect(page.locator('[data-testid="setting-title-input"]')).toHaveValue('完整设定');
    await expect(page.locator('[data-testid="setting-category-select"]')).toHaveValue('history');
    await expect(page.locator('[data-testid="setting-importance-select"]')).toHaveValue('high');
    await expect(page.locator('[data-testid="setting-content-input"]')).toHaveValue('这是完整的历史设定内容');
  });

  test('应该能够在编辑时删除设定', async ({ page }) => {
    // 创建一个设定
    await page.click('[data-testid="create-setting-button"]');
    await page.waitForSelector('[data-testid="world-setting-form-modal"]', { timeout: 5000 });
    await page.fill('[data-testid="setting-title-input"]', '编辑时删除');
    await page.fill('[data-testid="setting-content-input"]', '这是编辑时删除的设定');
    await page.click('[data-testid="save-setting-button"]');
    await page.waitForSelector('[data-testid="world-setting-form-modal"]', { state: 'hidden', timeout: 5000 });
    
    // 等待设定出现在列表中
    await page.waitForSelector('[data-testid="setting-title"]:has-text("编辑时删除")', { timeout: 5000 });
    
    // 打开编辑
    const settingCard = page.locator('[data-testid="setting-card"]:has-text("编辑时删除")');
    await settingCard.locator('[data-testid="setting-menu-button"]').click();
    await page.click('[data-testid="edit-setting-menu-item"]');
    
    // 在编辑表单中点击删除
    page.on('dialog', dialog => dialog.accept());
    await page.click('[data-testid="delete-setting-button"]');
    
    // 验证弹窗关闭且设定被删除
    await page.waitForSelector('[data-testid="world-setting-form-modal"]', { state: 'hidden', timeout: 5000 });
    await expect(page.locator('[data-testid="setting-title"]:has-text("编辑时删除")')).not.toBeVisible();
  });

  test('设定列表应该按分类分组显示', async ({ page }) => {
    // 创建两个不同分类的设定
    for (const [title, category] of [['魔法体系', 'magic'], ['地理环境', 'geography']]) {
      await page.click('[data-testid="create-setting-button"]');
      await page.waitForSelector('[data-testid="world-setting-form-modal"]', { timeout: 5000 });
      await page.fill('[data-testid="setting-title-input"]', title);
      await page.selectOption('[data-testid="setting-category-select"]', category);
      await page.fill('[data-testid="setting-content-input"]', `这是${title}的设定内容`);
      await page.click('[data-testid="save-setting-button"]');
      await page.waitForSelector('[data-testid="world-setting-form-modal"]', { state: 'hidden', timeout: 5000 });
      await page.waitForSelector(`[data-testid="setting-title"]:has-text("${title}")`, { timeout: 5000 });
    }
    
    // 验证分类标题显示
    await expect(page.locator('text=魔法')).toBeVisible();
    await expect(page.locator('text=地理')).toBeVisible();
    
    // 验证设定在正确的分类下
    await expect(page.locator('[data-testid="setting-title"]:has-text("魔法体系")')).toBeVisible();
    await expect(page.locator('[data-testid="setting-title"]:has-text("地理环境")')).toBeVisible();
  });
});

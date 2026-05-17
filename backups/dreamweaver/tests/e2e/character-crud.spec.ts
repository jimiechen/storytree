import { test, expect } from '@playwright/test';

test.describe('角色管理 CRUD (T-KNOW-004)', () => {
  const projectId = 'test-project-id';

  test.beforeEach(async ({ page }) => {
    // 访问角色管理页面
    await page.goto(`/workbench/${projectId}/characters`);
    // 等待页面加载完成
    await page.waitForSelector('[data-testid="characters-page"]', { timeout: 10000 });
  });

  test('应该显示角色管理页面', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator('h1:has-text("知识库：角色")')).toBeVisible();
    
    // 验证新建按钮
    await expect(page.locator('[data-testid="create-character-button"]')).toBeVisible();
    
    // 验证搜索框
    await expect(page.locator('input[placeholder="搜索角色..."]')).toBeVisible();
  });

  test('点击新建角色按钮应该打开表单弹窗', async ({ page }) => {
    // 点击新建按钮
    await page.click('[data-testid="create-character-button"]');
    
    // 验证弹窗出现 
    await expect(page.locator('[data-testid="character-form-modal"]')).toBeVisible();
    await expect(page.locator('h2:has-text("新建角色")')).toBeVisible();
    
    // 验证表单字段
    await expect(page.locator('[data-testid="character-name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="character-age-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="character-gender-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="character-occupation-input"]')).toBeVisible();
  });

  test('应该能够创建新角色', async ({ page }) => {
    // 点击新建按钮
    await page.click('[data-testid="create-character-button"]');
    await page.waitForSelector('[data-testid="character-form-modal"]', { timeout: 5000 });
    
    // 填写表单
    await page.fill('[data-testid="character-name-input"]', '测试角色');
    await page.fill('[data-testid="character-age-input"]', '25');
    await page.selectOption('[data-testid="character-gender-select"]', 'male');
    await page.fill('[data-testid="character-occupation-input"]', '剑客');
    await page.fill('[data-testid="character-appearance-input"]', '英俊潇洒，手持长剑');
    await page.fill('[data-testid="character-personality-input"]', '正直勇敢，乐于助人');
    await page.fill('[data-testid="character-backstory-input"]', '出身贫寒，靠自己的努力成为一代剑客');
    await page.fill('[data-testid="character-goals-input"]', '成为天下第一剑客');
    
    // 添加别名
    await page.fill('[data-testid="alias-input"]', '小测试');
    await page.click('[data-testid="add-alias-button"]');
    await expect(page.locator('[data-testid="alias-tag"]:has-text("小测试")')).toBeVisible();
    
    // 添加标签
    await page.fill('[data-testid="tag-input"]', '主角');
    await page.click('[data-testid="add-tag-button"]');
    await expect(page.locator('[data-testid="character-tag"]:has-text("主角")')).toBeVisible();
    
    // 提交表单
    await page.click('[data-testid="save-character-button"]');
    
    // 验证弹窗关闭
    await page.waitForSelector('[data-testid="character-form-modal"]', { state: 'hidden', timeout: 5000 });
    
    // 验证角色出现在列表中
    await expect(page.locator('[data-testid="character-name"]:has-text("测试角色")')).toBeVisible();
  });

  test('创建角色时名称不能为空', async ({ page }) => {
    // 点击新建按钮
    await page.click('[data-testid="create-character-button"]');
    await page.waitForSelector('[data-testid="character-form-modal"]', { timeout: 5000 });
    
    // 不填写名称直接提交
    await page.click('[data-testid="save-character-button"]');
    
    // 验证错误提示
    await expect(page.locator('text=角色名称不能为空')).toBeVisible();
    
    // 弹窗应该仍然打开
    await expect(page.locator('[data-testid="character-form-modal"]')).toBeVisible();
  });

  test('应该能够编辑角色', async ({ page }) => {
    // 先创建一个角色
    await page.click('[data-testid="create-character-button"]');
    await page.waitForSelector('[data-testid="character-form-modal"]', { timeout: 5000 });
    await page.fill('[data-testid="character-name-input"]', '待编辑角色');
    await page.click('[data-testid="save-character-button"]');
    await page.waitForSelector('[data-testid="character-form-modal"]', { state: 'hidden', timeout: 5000 });
    
    // 等待角色出现在列表中
    await page.waitForSelector('[data-testid="character-name"]:has-text("待编辑角色")', { timeout: 5000 });
    
    // 点击角色卡片
    const characterCard = page.locator('[data-testid="character-card"]:has-text("待编辑角色")');
    await characterCard.click();
    
    // 点击详情面板中的编辑按钮
    await page.click('button:has-text("编辑角色")');
    
    // 验证弹窗打开并显示编辑标题
    await expect(page.locator('[data-testid="character-form-modal"]')).toBeVisible();
    await expect(page.getByText('编辑角色', { exact: true })).toBeVisible();
    
    // 修改名称
    await page.fill('[data-testid="character-name-input"]', '已编辑角色');
    
    // 保存
    await page.click('[data-testid="save-character-button"]');
    
    // 验证修改成功
    await page.waitForSelector('[data-testid="character-form-modal"]', { state: 'hidden', timeout: 5000 });
    await expect(page.locator('[data-testid="character-name"]:has-text("已编辑角色")')).toBeVisible();
  });

  test('应该能够删除角色', async ({ page }) => {
    // 先创建一个角色
    await page.click('[data-testid="create-character-button"]');
    await page.waitForSelector('[data-testid="character-form-modal"]', { timeout: 5000 });
    await page.fill('[data-testid="character-name-input"]', '待删除角色');
    await page.click('[data-testid="save-character-button"]');
    await page.waitForSelector('[data-testid="character-form-modal"]', { state: 'hidden', timeout: 5000 });
    
    // 等待角色出现在列表中
    await page.waitForSelector('[data-testid="character-name"]:has-text("待删除角色")', { timeout: 5000 });
    
    // 点击角色卡片
    const characterCard = page.locator('[data-testid="character-card"]:has-text("待删除角色")');
    await characterCard.click();
    
    // 点击详情面板中的编辑按钮
    await page.click('button:has-text("编辑角色")');
    
    // 在编辑弹窗中点击删除
    page.on('dialog', dialog => dialog.accept());
    await page.click('[data-testid="delete-character-button"]');
    
    // 验证角色被删除
    await page.waitForSelector('[data-testid="character-name"]:has-text("待删除角色")', { state: 'hidden', timeout: 5000 });
  });

  test('应该能够通过搜索过滤角色', async ({ page }) => {
    // 创建两个角色
    for (const name of ['张三', '李四']) {
      await page.click('[data-testid="create-character-button"]');
      await page.waitForSelector('[data-testid="character-form-modal"]', { timeout: 5000 });
      await page.fill('[data-testid="character-name-input"]', name);
      await page.click('[data-testid="save-character-button"]');
      await page.waitForSelector('[data-testid="character-form-modal"]', { state: 'hidden', timeout: 5000 });
      await page.waitForSelector(`[data-testid="character-name"]:has-text("${name}")`, { timeout: 5000 });
    }
    
    // 搜索"张三"
    await page.fill('input[placeholder="搜索角色..."]', '张三');
    
    // 验证只显示"张三"
    await expect(page.locator('[data-testid="character-name"]:has-text("张三")')).toBeVisible();
    await expect(page.locator('[data-testid="character-name"]:has-text("李四")')).not.toBeVisible();
  });

  test('应该能够通过别名搜索角色', async ({ page }) => {
    // 创建一个带别名的角色
    await page.click('[data-testid="create-character-button"]');
    await page.waitForSelector('[data-testid="character-form-modal"]', { timeout: 5000 });
    await page.fill('[data-testid="character-name-input"]', '主角');
    await page.fill('[data-testid="alias-input"]', '小明');
    await page.click('[data-testid="add-alias-button"]');
    await page.click('[data-testid="save-character-button"]');
    await page.waitForSelector('[data-testid="character-form-modal"]', { state: 'hidden', timeout: 5000 });
    
    // 搜索别名
    await page.fill('input[placeholder="搜索角色..."]', '小明');
    
    // 验证能找到角色
    await expect(page.locator('[data-testid="character-name"]:has-text("主角")')).toBeVisible();
  });

  test('表单应该支持添加和删除别名', async ({ page }) => {
    await page.click('[data-testid="create-character-button"]');
    await page.waitForSelector('[data-testid="character-form-modal"]', { timeout: 5000 });
    
    // 添加多个别名
    await page.fill('[data-testid="alias-input"]', '别名1');
    await page.click('[data-testid="add-alias-button"]');
    await page.fill('[data-testid="alias-input"]', '别名2');
    await page.click('[data-testid="add-alias-button"]');
    
    // 验证别名显示
    await expect(page.locator('[data-testid="alias-tag"]:has-text("别名1")')).toBeVisible();
    await expect(page.locator('[data-testid="alias-tag"]:has-text("别名2")')).toBeVisible();
    
    // 删除别名
    const aliasTag = page.locator('[data-testid="alias-tag"]:has-text("别名1")');
    await aliasTag.locator('[data-testid="remove-alias-button"]').click();
    
    // 验证别名被删除
    await expect(page.locator('[data-testid="alias-tag"]:has-text("别名1")')).not.toBeVisible();
    await expect(page.locator('[data-testid="alias-tag"]:has-text("别名2")')).toBeVisible();
  });

  test('表单应该支持添加和删除标签', async ({ page }) => {
    await page.click('[data-testid="create-character-button"]');
    await page.waitForSelector('[data-testid="character-form-modal"]', { timeout: 5000 });
    
    // 添加多个标签
    await page.fill('[data-testid="tag-input"]', '标签1');
    await page.click('[data-testid="add-tag-button"]');
    await page.fill('[data-testid="tag-input"]', '标签2');
    await page.click('[data-testid="add-tag-button"]');
    
    // 验证标签显示
    await expect(page.locator('[data-testid="character-tag"]:has-text("标签1")')).toBeVisible();
    await expect(page.locator('[data-testid="character-tag"]:has-text("标签2")')).toBeVisible();
    
    // 删除标签
    const tagElement = page.locator('[data-testid="character-tag"]:has-text("标签1")');
    await tagElement.locator('[data-testid="remove-tag-button"]').click();
    
    // 验证标签被删除
    await expect(page.locator('[data-testid="character-tag"]:has-text("标签1")')).not.toBeVisible();
    await expect(page.locator('[data-testid="character-tag"]:has-text("标签2")')).toBeVisible();
  });

  test('编辑角色时应该显示现有数据', async ({ page }) => {
    // 创建一个角色
    await page.click('[data-testid="create-character-button"]');
    await page.waitForSelector('[data-testid="character-form-modal"]', { timeout: 5000 });
    await page.fill('[data-testid="character-name-input"]', '完整角色');
    await page.fill('[data-testid="character-age-input"]', '30');
    await page.selectOption('[data-testid="character-gender-select"]', 'female');
    await page.fill('[data-testid="character-occupation-input"]', '法师');
    await page.click('[data-testid="save-character-button"]');
    await page.waitForSelector('[data-testid="character-form-modal"]', { state: 'hidden', timeout: 5000 });
    
    // 等待角色出现在列表中
    await page.waitForSelector('[data-testid="character-name"]:has-text("完整角色")', { timeout: 5000 });
    
    // 打开编辑
    const characterCard = page.locator('[data-testid="character-card"]:has-text("完整角色")');
    await characterCard.click();
    await page.click('button:has-text("编辑角色")');
    
    // 验证表单中显示现有数据
    await expect(page.locator('[data-testid="character-name-input"]')).toHaveValue('完整角色');
    await expect(page.locator('[data-testid="character-age-input"]')).toHaveValue('30');
    await expect(page.locator('[data-testid="character-gender-select"]')).toHaveValue('female');
    await expect(page.locator('[data-testid="character-occupation-input"]')).toHaveValue('法师');
  });

  test('应该能够在编辑时删除角色', async ({ page }) => {
    // 创建一个角色
    await page.click('[data-testid="create-character-button"]');
    await page.waitForSelector('[data-testid="character-form-modal"]', { timeout: 5000 });
    await page.fill('[data-testid="character-name-input"]', '编辑时删除');
    await page.click('[data-testid="save-character-button"]');
    await page.waitForSelector('[data-testid="character-form-modal"]', { state: 'hidden', timeout: 5000 });
    
    // 等待角色出现在列表中
    await page.waitForSelector('[data-testid="character-name"]:has-text("编辑时删除")', { timeout: 5000 });
    
    // 打开编辑
    const characterCard = page.locator('[data-testid="character-card"]:has-text("编辑时删除")');
    await characterCard.click();
    await page.click('button:has-text("编辑角色")');
    
    // 在编辑表单中点击删除
    page.on('dialog', dialog => dialog.accept());
    await page.click('[data-testid="delete-character-button"]');
    
    // 验证弹窗关闭且角色被删除
    await page.waitForSelector('[data-testid="character-form-modal"]', { state: 'hidden', timeout: 5000 });
    await expect(page.locator('[data-testid="character-name"]:has-text("编辑时删除")')).not.toBeVisible();
  });
});

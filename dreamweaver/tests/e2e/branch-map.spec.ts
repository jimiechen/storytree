import { test, expect } from '@playwright/test';

test.describe('分支导图视图 (T-UI-006)', () => {
  const projectId = 'test-project-id';

  test.beforeEach(async ({ page }) => {
    // 访问分支导图页面
    await page.goto(`/workbench/${projectId}/branches`);
    // 等待页面加载完成
    await page.waitForSelector('[data-testid="branch-map-page"]', { timeout: 10000 });
  });

  test('应该显示分支导图页面', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator('text=Branch Map')).toBeVisible();
    
    // 验证顶部导航栏
    await expect(page.locator('text=Focus')).toBeVisible();
    await expect(page.locator('text=Zoom')).toBeVisible();
    await expect(page.locator('text=Filter')).toBeVisible();
    await expect(page.locator('text=Export')).toBeVisible();
  });

  test('应该显示视图切换按钮', async ({ page }) => {
    // 验证树状视图按钮
    await expect(page.locator('text=树状视图')).toBeVisible();
    // 验证时间线视图按钮
    await expect(page.locator('text=时间线视图')).toBeVisible();
  });

  test('应该显示操作按钮', async ({ page }) => {
    // 验证新建分支按钮
    await expect(page.locator('text=新建分支')).toBeVisible();
    // 验证合并分支按钮
    await expect(page.locator('text=合并分支')).toBeVisible();
    // 验证导出分支按钮
    await expect(page.locator('text=导出分支')).toBeVisible();
  });

  test('应该显示缩放控制', async ({ page }) => {
    // 验证缩放适配按钮
    await expect(page.locator('text=缩放适配')).toBeVisible();
    // 验证缩放百分比显示
    await expect(page.locator('text=100%')).toBeVisible();
    // 验证加减按钮
    await expect(page.locator('text=remove')).toBeVisible();
    await expect(page.locator('button:has-text("add")').first()).toBeVisible();
  });

  test('应该显示分支节点', async ({ page }) => {
    // 验证根节点
    await expect(page.locator('[data-testid="branch-node-root-01"]')).toBeVisible();
    await expect(page.locator('text=第一章：相遇')).toBeVisible();
    
    // 验证分支A
    await expect(page.locator('[data-testid="branch-node-br-a"]')).toBeVisible();
    await expect(page.locator('text=分支A: 接受邀请').first()).toBeVisible();
    
    // 验证分支B
    await expect(page.locator('[data-testid="branch-node-br-b"]')).toBeVisible();
    await expect(page.locator('text=分支B: 拒绝邀请')).toBeVisible();
  });

  test('点击分支节点应该显示详情面板', async ({ page }) => {
    // 点击分支A节点
    await page.click('[data-testid="branch-node-br-a"]');
    
    // 验证详情面板显示
    await expect(page.locator('[data-testid="branch-detail-panel"]')).toBeVisible();
    
    // 验证详情内容
    await expect(page.locator('text=Branch Details')).toBeVisible();
    await expect(page.locator('text=分支A: 接受邀请').first()).toBeVisible();
    await expect(page.locator('text=Word Count')).toBeVisible();
    await expect(page.locator('text=12,450')).toBeVisible();
    await expect(page.locator('text=Chapters')).toBeVisible();
    await expect(page.locator('text=4').first()).toBeVisible();
  });

  test('应该显示底部状态栏', async ({ page }) => {
    // 验证总分支数
    await expect(page.locator('text=总分支数:')).toBeVisible();
    // 验证活跃分支
    await expect(page.locator('text=活跃分支:')).toBeVisible();
    // 验证最大深度
    await expect(page.locator('text=最大深度:')).toBeVisible();
    // 验证已归档
    await expect(page.locator('text=已归档:')).toBeVisible();
    // 验证系统状态
    await expect(page.locator('text=System Status: Optimal')).toBeVisible();
    await expect(page.locator('text=Cloud Synced')).toBeVisible();
  });

  test('应该能够通过侧边栏导航到分支导图', async ({ page }) => {
    // 先访问工作台首页
    await page.goto(`/workbench/${projectId}`);
    
    // 点击分支导图导航
    await page.click('[data-testid="nav-分支导图"]');
    
    // 验证跳转到分支导图页面
    await expect(page).toHaveURL(`/workbench/${projectId}/branches`);
    await expect(page.locator('[data-testid="branch-map-page"]')).toBeVisible();
  });

  test('视图切换按钮应该可点击', async ({ page }) => {
    // 点击时间线视图
    await page.click('text=时间线视图');
    
    // 验证按钮状态变化（通过样式类）
    const timelineButton = page.locator('text=时间线视图');
    await expect(timelineButton).toHaveClass(/bg-surface-bright|bg-surface/);
    
    // 点击树状视图
    await page.click('text=树状视图');
    
    // 验证按钮状态变化
    const treeButton = page.locator('text=树状视图');
    await expect(treeButton).toHaveClass(/bg-surface-bright|bg-surface/);
  });

  test('缩放控制应该工作', async ({ page }) => {
    // 获取初始缩放值
    const initialZoom = await page.locator('text=/^\\d+%$/').textContent();
    expect(initialZoom).toBe('100%');
    
    // 点击放大按钮
    await page.locator('button').filter({ hasText: /^add$/ }).click();
    await page.waitForTimeout(300);
    
    // 验证缩放值增加
    await expect(page.locator('text=110%').or(page.locator('text=125%'))).toBeVisible();
    
    // 点击缩小按钮
    await page.locator('button').filter({ hasText: /^remove$/ }).click();
    await page.locator('button').filter({ hasText: /^remove$/ }).click();
    await page.waitForTimeout(300);
    
    // 验证缩放值减少
    await expect(page.locator('text=90%').or(page.locator('text=75%')).or(page.locator('text=80%'))).toBeVisible();
  });

  test('应该显示分支状态标签', async ({ page }) => {
    // 验证 main 标签
    await expect(page.locator('text=main').first()).toBeVisible();
    // 验证 IF-line 标签
    await expect(page.locator('text=IF-line').first()).toBeVisible();
    // 验证 archived 标签
    await expect(page.locator('text=archived')).toBeVisible();
    // 验证 active 标签
    await expect(page.locator('text=active').first()).toBeVisible();
  });

  test('详情面板应该可以关闭', async ({ page }) => {
    // 点击分支节点打开详情面板
    await page.click('[data-testid="branch-node-br-a"]');
    await expect(page.locator('[data-testid="branch-detail-panel"]')).toBeVisible();
    
    // 点击关闭按钮
    await page.click('[data-testid="branch-detail-panel"] button:has-text("close")');
    
    // 验证详情面板关闭
    await expect(page.locator('[data-testid="branch-detail-panel"]')).not.toBeVisible();
  });
});

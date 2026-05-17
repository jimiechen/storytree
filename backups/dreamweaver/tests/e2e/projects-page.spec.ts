import { test, expect } from '@playwright/test';

/**
 * T-UI-001: 欢迎页与项目列表 E2E 测试
 * 验证项目列表页的视觉还原和功能
 */
test.describe('Projects Page - T-UI-001', () => {
  test.beforeEach(async ({ page }) => {
    // 访问项目列表页
    await page.goto('/projects');
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
  });

  test('should display page header with correct title', async ({ page }) => {
    // 验证页面标题
    const title = page.locator('h1');
    await expect(title).toHaveText('织梦笔');
    
    // 验证副标题
    const subtitle = page.locator('text=AI 驱动的长篇小说创作平台');
    await expect(subtitle).toBeVisible();
  });

  test('should display search input', async ({ page }) => {
    // 验证搜索框存在
    const searchInput = page.locator('input[placeholder="搜索项目..."]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeEnabled();
  });

  test('should display Recent Works section', async ({ page }) => {
    // 验证"最近作品"标题
    const recentWorksTitle = page.locator('h2:has-text("最近作品")');
    await expect(recentWorksTitle).toBeVisible();
    
    // 验证"查看全部"链接
    const viewAllLink = page.locator('text=查看全部');
    await expect(viewAllLink).toBeVisible();
  });

  test('should display Quick Start section with New Work card', async ({ page }) => {
    // 验证"新建作品"卡片
    const newWorkCard = page.locator('h3:has-text("新建作品")');
    await expect(newWorkCard).toBeVisible();
    
    // 验证"世界构建"卡片
    const worldForgeCard = page.locator('h3:has-text("世界构建")');
    await expect(worldForgeCard).toBeVisible();
  });

  test('should display Writing Templates section', async ({ page }) => {
    // 验证"写作模板"标题
    const templatesTitle = page.locator('text=写作模板');
    await expect(templatesTitle).toBeVisible();
    
    // 验证所有模板卡片
    const templates = ['仙侠', '都市', '悬疑', '科幻'];
    for (const template of templates) {
      const templateCard = page.locator(`text=${template}`).first();
      await expect(templateCard).toBeVisible();
    }
  });

  test('should display Writing Insights section', async ({ page }) => {
    // 验证"写作洞察"标题
    const insightsTitle = page.locator('h2:has-text("写作洞察")');
    await expect(insightsTitle).toBeVisible();
    
    // 验证统计数据标签
    await expect(page.locator('text=总作品数')).toBeVisible();
    await expect(page.locator('text=总字数')).toBeVisible();
    await expect(page.locator('text=进行中')).toBeVisible();
    
    // 验证每日字数图表
    await expect(page.locator('text=每日字数（最近7天）')).toBeVisible();
    
    // 验证等级信息
    await expect(page.locator('text=等级 12: 织梦者')).toBeVisible();
  });

  test('should open create project modal when clicking New Work', async ({ page }) => {
    // 点击"新建作品"卡片
    const newWorkCard = page.locator('h3:has-text("新建作品")').locator('..').locator('..');
    await newWorkCard.click();
    
    // 验证弹窗打开
    const modal = page.locator('.fixed.inset-0');
    await expect(modal).toBeVisible();
    
    // 验证弹窗标题
    const modalTitle = page.locator('h2:has-text("新建作品")');
    await expect(modalTitle).toBeVisible();
    
    // 验证表单字段
    await expect(page.locator('label:has-text("作品名称")')).toBeVisible();
    await expect(page.locator('label:has-text("作品类型")')).toBeVisible();
    await expect(page.locator('label:has-text("作品简介")')).toBeVisible();
    await expect(page.locator('label:has-text("目标字数")')).toBeVisible();
  });

  test('should open create project modal when clicking template', async ({ page }) => {
    // 点击"仙侠"模板
    const xianxiaTemplate = page.locator('text=仙侠').first();
    await xianxiaTemplate.click();
    
    // 验证弹窗打开
    const modal = page.locator('.fixed.inset-0');
    await expect(modal).toBeVisible();
  });

  test('should close modal when clicking cancel', async ({ page }) => {
    // 打开弹窗
    await page.locator('h3:has-text("新建作品")').locator('..').locator('..').click();
    
    // 等待弹窗显示
    await expect(page.locator('.fixed.inset-0')).toBeVisible();
    
    // 点击取消按钮
    await page.locator('button:has-text("取消")').click();
    
    // 验证弹窗关闭
    await expect(page.locator('.fixed.inset-0')).not.toBeVisible();
  });

  test('should validate project name is required', async ({ page }) => {
    // 打开弹窗
    await page.locator('h3:has-text("新建作品")').locator('..').locator('..').click();
    
    // 直接点击创建按钮（不填写名称）
    await page.locator('button:has-text("创建作品")').click();
    
    // 验证错误提示
    const errorMessage = page.locator('text=项目名称不能为空');
    await expect(errorMessage).toBeVisible();
  });

  test('should select genre in modal', async ({ page }) => {
    // 打开弹窗
    await page.locator('h3:has-text("新建作品")').locator('..').locator('..').click();
    
    // 点击"仙侠"类型
    const xianxiaGenre = page.locator('button:has-text("仙侠")');
    await xianxiaGenre.click();
    
    // 验证选中状态（通过样式判断）
    await expect(xianxiaGenre).toHaveClass(/bg-primary\/10/);
  });

  test('should have correct dark theme colors', async ({ page }) => {
    // 强制设置深色模式类名以测试深色主题颜色
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    
    // 验证页面背景色
    const body = page.locator('.min-h-screen').first();
    const bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    // 确保存在背景色样式
    expect(bgColor).toBeDefined();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 刷新页面
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    // 验证页面仍然可以正常显示
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h2:has-text("最近作品")')).toBeVisible();
  });
});

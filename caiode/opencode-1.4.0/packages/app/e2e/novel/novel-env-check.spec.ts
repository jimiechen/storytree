import { test, expect } from '@playwright/test';

/**
 * 验证 Vite 环境变量是否正确注入到浏览器 bundle
 *
 * 注意：import.meta.env 无法在 page.evaluate() 中直接序列化访问，
 * 因此本测试通过页面加载 + 直接 DeepSeek API 调用（novel-direct-deepseek.spec.ts）
 * 来间接验证 VITE_DEEPSEEK_API_KEY 是否注入。
 */
test('ENV-CHECK: 验证 /novel 页面可加载且 Vite bundle 正常', async ({ page }) => {
  await page.goto('/novel');
  await page.waitForLoadState('load');
  await page.waitForTimeout(3000);

  // 检查页面基本元素加载（说明 Vite bundle 已运行）
  const layout = page.locator('[data-testid="workspace-layout"]');
  const logo = page.locator('[data-testid="workspace-logo"]');

  const layoutVisible = await layout.count() > 0 && await layout.first().isVisible();
  const logoVisible = await logo.count() > 0 && await logo.first().isVisible();

  const result = {
    url: page.url(),
    layoutVisible,
    logoVisible,
    title: await page.title(),
  };

  console.log('[ENV CHECK] 页面加载状态:');
  console.log(`  URL: ${result.url}`);
  console.log(`  Title: ${result.title}`);
  console.log(`  Workspace layout visible: ${result.layoutVisible}`);
  console.log(`  Logo visible: ${result.logoVisible}`);

  // 写入报告
  const fs = await import('fs');
  fs.writeFileSync('e2e/test-results/env-check-report.json', JSON.stringify(result, null, 2));

  await expect(page).toHaveURL(/\/novel/);
  expect(result.layoutVisible || result.logoVisible).toBe(true);
});

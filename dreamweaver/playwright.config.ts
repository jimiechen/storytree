import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  timeout: 60 * 1000, // 每个测试用例 60 秒超时
  globalTimeout: 15 * 60 * 1000, // 全局执行 15 分钟超时
  expect: {
    timeout: 10000, // 每个 expect 断言 10 秒超时
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01, // 允许最大 1% 的像素差异
      threshold: 0.1, // 感知差异阈值 (YIQ 颜色比较)
      animations: 'disabled', // 截图时禁用动画
    },
  },
  use: {
    baseURL: 'http://localhost:3000',
    actionTimeout: 5000, // 每个操作（click, fill等） 5 秒超时
    navigationTimeout: 30000, // 页面导航 30 秒超时
    trace: 'on-first-retry',
    screenshot: 'on', // 自动截图
    video: 'on', // 自动录制视频
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 120秒超时
  },
});

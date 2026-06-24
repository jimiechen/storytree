import { test, expect } from '@playwright/test';

/**
 * P3-D 真实 DeepSeek 调用验证测试
 *
 * 目的：开启 Gate 后点击「AI续写」，确认：
 * 1. 是否有对 deepseek.com 或 chat/completions 的网络请求
 * 2. 页面状态变化（错误/成功/超时）
 * 3. 全程录屏
 *
 * 前置：feature-gates.ts realLLMEnabled=true, targetLLMAdapterEnabled=true
 *       .env.local 含 VITE_DEEPSEEK_API_KEY
 */

async function enterEditor(page: Awaited<ReturnType<typeof page['new']>>) {
  await page.goto('/novel');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('[data-testid="workspace-layout"]', { timeout: 90000 });
  await page.locator('[data-testid="sidenav-chapters"]').click();
  await expect(page.locator('[data-testid="editor-word-count"]')).toBeVisible({ timeout: 30000 });
}

test('DEEPSEEK-PROBE: 点击AI续写后捕获所有网络请求', async ({ page }) => {
  // ──── 捕获所有网络请求 ────
  const allRequests: { method: string; url: string; type: string }[] = [];
  const allResponses: { status: number; url: string; type: string }[] = [];

  page.on('request', req => {
    allRequests.push({
      method: req.method(),
      url: req.url(),
      type: req.resourceType(),
    });
  });

  page.on('response', res => {
    allResponses.push({
      status: res.status(),
      url: res.url(),
      type: 'response',
    });
  });

  // ──── 捕获控制台日志 ────
  const consoleLogs: { type: string; text: string }[] = [];
  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text().slice(0, 200) });
  });

  // ──── 进入编辑器 ────
  await enterEditor(page);

  // 记录初始状态
  const initialWc = await page.locator('[data-testid="editor-word-count"]').textContent();
  console.log(`[INIT] 字数: ${initialWc}`);

  // 检查 MockMode 横幅是否还在（Gate 开启后可能消失或变化）
  const mockBanner = page.locator('text=/Mock.*模式|模拟/');
  const bannerVisible = await mockBanner.count() > 0 && await mockBanner.first().isVisible();
  console.log(`[INIT] MockMode横幅可见: ${bannerVisible}`);

  // ──── 点击 AI续写 ────
  const aiBtn = page.locator('button:has-text("AI续写")').first();
  await expect(aiBtn).toBeVisible({ timeout: 5000 });
  console.log('[ACTION] 点击「AI续写」');
  try {
    await aiBtn.click();
  } catch (e) {
    console.log(`[WARN] 点击AI续写失败: ${e}`);
  }

  // 等待足够时间让 DeepSeek 请求完成（可能需要 5-15 秒）
  console.log('[WAIT] 等待响应（最多15秒）...');
  try {
    await page.waitForTimeout(15000);
  } catch (e) {
    console.log(`[WARN] 等待超时: ${e}`);
  }

  // ──── 分析网络请求 ────
  console.log('\n=== 所有网络请求 ===');
  const llmRelated = allRequests.filter(r =>
    r.url.includes('deepseek') ||
    r.url.includes('chat/completions') ||
    r.url.includes('api.openai') ||
    r.url.includes('v1/chat')
  );

  const backendRequests = allRequests.filter(r =>
    r.url.includes(':4096') ||
    r.url.includes('opencode')
  );

  console.log(`总请求数: ${allRequests.length}`);
  console.log(`LLM/DeepSeek 相关: ${llmRelated.length}`);
  console.log(`后端相关: ${backendRequests.length}`);

  for (const r of llmRelated) {
    console.log(`  [LLM] ${r.method} ${r.url}`);
  }

  for (const r of backendRequests.slice(0, 10)) {
    console.log(`  [API] ${r.method} ${r.url}`);
  }

  // ──── 分析控制台日志 ────
  console.log('\n=== 控制台日志（关键） ===');
  const importantLogs = consoleLogs.filter(l =>
    l.type === 'error' ||
    l.text.toLowerCase().includes('deepseek') ||
    l.text.toLowerCase().includes('llm') ||
    l.text.toLowerCase().includes('adapter') ||
    l.text.toLowerCase().includes('transport') ||
    l.text.toLowerCase().includes('client_stub') ||
    l.text.toLowerCase().includes('fallback')
  );
  for (const l of importantLogs) {
    console.log(`  [${l.type}] ${l.text}`);
  }

  // ──── 最终截图 ────
  await page.screenshot({
    path: 'e2e/test-results/deepseek-probe-after-click.png',
    fullPage: true,
  });

  const finalWc = await page.locator('[data-testid="editor-word-count"]').textContent();
  console.log(`\n[FINAL] 字数: ${finalWc} (初始: ${initialWc})`);

  // ──── 输出诊断结论 ────
  console.log('\n=== 诊断结论 ===');
  if (llmRelated.length > 0) {
    console.log('✅ 检测到 DeepSeek/LLM API 请求！真实调用路径已打通');
  } else if (backendRequests.length > 0) {
    console.log('⚠️ 有后端请求但无直接 DeepSeek 调用');
    console.log('   可能原因: 请求通过后端代理 / transport 仍为 disabled / fallback 到 mock');
  } else {
    console.log('❌ 无任何 LLM 相关网络请求');
    console.log('   可能原因: FeatureGate 未生效 / transport 未注入 / CORS 被拦截');
  }

  // 至少页面不应崩溃（软检查，不阻塞报告生成）
  try {
    await expect(page.locator('[data-testid="editor-word-count"]')).toBeVisible({ timeout: 5000 });
    console.log('[OK] 页面正常');
  } catch (e) {
    console.log(`[WARN] 编辑器不可能: ${e}`);
  }

  // 将完整数据写入文件供后续分析
  const report = {
    timestamp: new Date().toISOString(),
    llmRequestCount: llmRelated.length,
    llmRequests: llmRelated,
    backendRequestCount: backendRequests.length,
    backendRequests: backendRequests.map(r => ({ method: r.method, url: r.url })),
    totalRequests: allRequests.length,
    importantConsoleLogs: importantLogs,
    wordCountChange: { initial: initialWc, final: finalWc },
  };
  // 使用 Playwright 的方式写入（避免 require('fs') 兼容问题）
  const fs = await import('fs');
  fs.writeFileSync(
    'e2e/test-results/deepseek-probe-report.json',
    JSON.stringify(report, null, 2)
  );
  console.log('\n[REPORT] 完整报告已写入 e2e/test-results/deepseek-probe-report.json');
});

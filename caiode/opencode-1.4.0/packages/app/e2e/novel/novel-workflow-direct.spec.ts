import { test, expect } from '@playwright/test';

/**
 * P3-D Workflow 直连验证测试
 *
 * 目的：绕过 UI 按钮，直接在浏览器上下文中调用 NovelActionDispatcher
 * 执行 chapter.continue，验证真实 DeepSeek 调用链路是否打通。
 */

test('WORKFLOW-DIRECT: 直接 dispatch chapter.continue 触发真实 DeepSeek', async ({ page }) => {
  // 捕获网络请求
  const allRequests: { method: string; url: string }[] = [];
  page.on('request', req => {
    allRequests.push({ method: req.method(), url: req.url() });
  });

  // 捕获控制台日志
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text().slice(0, 300)}`);
  });

  // 捕获页面错误
  const pageErrors: string[] = [];
  page.on('pageerror', err => {
    pageErrors.push(err.message.slice(0, 300));
  });

  // 导航到 /novel
  await page.goto('/novel');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('[data-testid="workspace-layout"]', { timeout: 90000 });
  await page.waitForTimeout(2000);

  // 在浏览器中直接 dispatch chapter.continue
  const result = await page.evaluate(async () => {
    try {
      // 动态导入相关模块
      const [{ createNovelActionDispatcher }, { createDefaultNovelFeatureGates }] = await Promise.all([
        import('/src/novel/actions/novel-action-dispatcher.ts'),
        import('/src/novel/feature-gates.ts'),
      ]);

      const dispatcher = createNovelActionDispatcher();

      const actionResult = await dispatcher.dispatch({
        type: 'chapter.continue',
        projectId: 'test-project',
        chapterId: 'chapter-1',
        payload: {
          chapterIndex: 1,
          genre: '玄幻',
          text: '寒风卷过古老的废墟，扬起一阵暗灰色的尘沙。苏瑶紧了紧身上的斗篷，指尖在粗糙的石壁上缓缓划过。',
          stream: true,
        },
      });

      return {
        success: actionResult.success,
        error: actionResult.error ?? null,
        errorCode: (actionResult as any).errorCode ?? null,
        hasResult: !!actionResult.result,
        resultText: (actionResult.result as any)?.text?.slice(0, 100) ?? null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message, errorCode: 'EXCEPTION', hasResult: false, resultText: null };
    }
  });

  // 分析请求
  const proxyRequests = allRequests.filter(r =>
    r.url.includes('deepseek') || r.url.includes('chat/completions')
  );

  // 输出结果
  console.log('\n=== Workflow 直连结果 ===');
  console.log(`[RESULT] success: ${result.success}`);
  console.log(`[RESULT] errorCode: ${result.errorCode}`);
  console.log(`[RESULT] error: ${result.error}`);
  console.log(`[RESULT] hasResult: ${result.hasResult}`);
  console.log(`[RESULT] resultText: ${result.resultText}`);

  console.log('\n=== 网络请求分析 ===');
  console.log(`总请求数: ${allRequests.length}`);
  console.log(`DeepSeek/代理请求数: ${proxyRequests.length}`);
  for (const r of proxyRequests) {
    console.log(`  [REQ] ${r.method} ${r.url}`);
  }

  console.log('\n=== 关键控制台日志 ===');
  const relevantLogs = consoleLogs.filter(l =>
    l.includes('[P3-TEST]') ||
    l.includes('DeepSeek') ||
    l.includes('deepseek') ||
    l.includes('transport') ||
    l.includes('adapter') ||
    l.includes('LLM') ||
    l.includes('WORKFLOW') ||
    l.includes('error')
  );
  for (const l of relevantLogs) {
    console.log(`  ${l}`);
  }

  if (pageErrors.length > 0) {
    console.log('\n=== 页面错误 ===');
    for (const e of pageErrors) {
      console.log(`  ${e}`);
    }
  }

  // 写入报告
  const fs = await import('fs');
  fs.writeFileSync(
    'e2e/test-results/workflow-direct-report.json',
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        result,
        network: { totalRequests: allRequests.length, proxyRequests: proxyRequests.map(r => ({ method: r.method, url: r.url })) },
        relevantConsoleLogs: relevantLogs,
        pageErrors,
      },
      null,
      2,
    ),
  );

  // 软断言
  expect(proxyRequests.length).toBeGreaterThan(0);
});

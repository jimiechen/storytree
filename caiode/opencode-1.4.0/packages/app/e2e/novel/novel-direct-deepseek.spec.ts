import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * P3-D DeepSeek Transport 直连验证测试
 *
 * 目的：在浏览器上下文中直接调用 /deepseek-proxy/chat/completions，
 * 验证 Vite 代理 + API Key 注入 + 真实 API 调用全链路是否打通。
 *
 * 前置条件：
 * - vite.config.ts 已配置 /deepseek-proxy → https://api.deepseek.com 代理
 * - .env.local 含 VITE_DEEPSEEK_API_KEY
 * - feature-gates.ts realLLMEnabled=true, targetLLMAdapterEnabled=true
 */

function loadEnvLocal(): { apiKey?: string; baseURL?: string; model?: string } {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    return {};
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  const vars: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*VITE_(\w+)\s*=\s*(.*?)\s*$/);
    if (match) {
      vars[match[1]] = match[2];
    }
  }
  return {
    apiKey: vars.DEEPSEEK_API_KEY,
    baseURL: vars.DEEPSEEK_BASE_URL,
    model: vars.DEEPSEEK_MODEL,
  };
}

test('DIRECT-PROXY: 通过 Vite 代理直接调用 DeepSeek API', async ({ page }) => {
  // ──── 捕获网络请求 ────
  const capturedRequests: { method: string; url: string }[] = [];
  const capturedResponses: { status: number; url: string; body?: string }[] = [];

  page.on('request', req => {
    capturedRequests.push({ method: req.method(), url: req.url() });
  });

  page.on('response', async res => {
    const url = res.url();
    if (url.includes('deepseek') || url.includes('chat/completions')) {
      let body = '';
      try {
        body = (await res.text()).slice(0, 500);
      } catch { /* ignore */ }
      capturedResponses.push({ status: res.status(), url, body });
    }
  });

  // ──── 捕获控制台日志 ────
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text().slice(0, 200)}`);
  });

  // ──── 导航到应用页面（触发 Vite bundle 加载）────
  await page.goto('/novel');
  await page.waitForLoadState('load');
  await page.waitForSelector('[data-testid="workspace-layout"]', { timeout: 20000 });
  await page.waitForTimeout(2000);

  // ──── 直接在浏览器中发起 DeepSeek API 调用 ────
  const env = loadEnvLocal();
  console.log('[ACTION] 直接调用 /deepseek-proxy/chat/completions ...');

  const apiResult = await page.evaluate(async ({ apiKey, baseURL, model }) => {
    try {
      if (!apiKey || apiKey.length < 8) {
        return {
          success: false,
          status: 0,
          statusText: '',
          data: null,
          error: 'VITE_DEEPSEEK_API_KEY not provided',
          env: { hasKey: false, baseURL, model, apiKeyPrefix: 'NOT_SET' },
        };
      }

      const effectiveBaseURL = baseURL ?? '/deepseek-proxy';
      const effectiveModel = model ?? 'deepseek-chat';

      // 使用与 deepseek-transport.ts 相同的请求格式
      const response = await fetch(`${effectiveBaseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: effectiveModel,
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Say "Hello from DeepSeek!" in one sentence.' },
          ],
          stream: false,
          temperature: 0.7,
          max_tokens: 50,
        }),
      });

      const status = response.status;
      const statusText = response.statusText;
      const data = await response.json();

      return {
        success: status >= 200 && status < 300,
        status,
        statusText,
        data,
        error: null,
        env: { hasKey: true, baseURL: effectiveBaseURL, model: effectiveModel, apiKeyPrefix: apiKey.slice(0, 6) },
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        status: 0,
        statusText: '',
        data: null,
        error: message,
        env: { hasKey: !!apiKey, baseURL, model, apiKeyPrefix: apiKey ? apiKey.slice(0, 6) : 'NOT_SET' },
      };
    }
  }, env);

  const envCheck = {
    hasApiKey: apiResult.env?.hasKey ?? false,
    apiKeyPrefix: apiResult.env?.apiKeyPrefix ?? 'NOT_SET',
    baseURL: apiResult.env?.baseURL ?? 'NOT_SET',
    model: apiResult.env?.model ?? 'NOT_SET',
  };
  console.log(`[ENV] API Key: ${envCheck.apiKeyPrefix}..., BaseURL: ${envCheck.baseURL}, Model: ${envCheck.model}`);

  // ──── 输出结果 ────
  console.log('\n=== DeepSeek 直连结果 ===');
  console.log(`[RESULT] 成功: ${apiResult.success}`);
  console.log(`[RESULT] HTTP Status: ${apiResult.status} ${apiResult.statusText}`);

  if (apiResult.data) {
    const content = apiResult.data.choices?.[0]?.message?.content;
    console.log(`[RESULT] 模型回复: ${content?.slice(0, 100) ?? 'NO CONTENT'}`);
    console.log(`[RESULT] 完整响应: ${JSON.stringify(apiResult.data).slice(0, 300)}`);

    if (apiResult.data.error) {
      console.log(`[ERROR] API 错误: ${apiResult.data.error.message}`);
    }

    if (apiResult.data.usage) {
      console.log(`[USAGE] Token 用量: ${JSON.stringify(apiResult.data.usage)}`);
    }
  }

  if (apiResult.error) {
    console.log(`[ERROR] 异常: ${apiResult.error}`);
  }

  // ──── 分析捕获的网络请求 ────
  console.log('\n=== 网络请求分析 ===');
  console.log(`总请求数: ${capturedRequests.length}`);

  const proxyRequests = capturedRequests.filter(r =>
    r.url.includes('deepseek') || r.url.includes('chat/completions')
  );
  console.log(`DeepSeek/代理请求数: ${proxyRequests.length}`);
  for (const r of proxyRequests) {
    console.log(`  [REQ] ${r.method} ${r.url}`);
  }

  for (const r of capturedResponses) {
    console.log(`  [RES] ${r.status} ${r.url.slice(0, 80)}...`);
    if (r.body) {
      console.log(`         Body: ${r.body.slice(0, 150)}...`);
    }
  }

  // ──── 控制台日志中的关键信息 ────
  console.log('\n=== 关键控制台日志 ===');
  const importantLogs = consoleLogs.filter(l =>
    l.includes('P3-TEST') ||
    l.includes('DEEPSEEK') ||
    l.includes('transport') ||
    l.toLowerCase().includes('error')
  );
  for (const l of importantLogs.slice(0, 20)) {
    console.log(`  ${l}`);
  }

  // ──── 截图 ────
  await page.screenshot({
    path: 'e2e/test-results/direct-deepseek-probe.png',
    fullPage: true,
  });

  // ──── 写入报告 ────
  const report = {
    timestamp: new Date().toISOString(),
    envCheck,
    apiCall: {
      success: apiResult.success,
      status: apiResult.status,
      statusText: apiResult.statusText,
      hasContent: !!apiResult.data?.choices?.[0]?.message?.content,
      contentPreview: apiResult.data?.choices?.[0]?.message?.content?.slice(0, 100) ?? null,
      error: apiResult.error ?? apiResult.data?.error?.message ?? null,
      usage: apiResult.data?.usage ?? null,
    },
    networkAnalysis: {
      totalRequests: capturedRequests.length,
      proxyRequestCount: proxyRequests.length,
      proxyRequests: proxyRequests.map(r => ({ method: r.method, url: r.url })),
      responses: capturedResponses.map(r => ({ status: r.status, url: r.url.slice(0, 100), hasBody: !!r.body })),
    },
    importantConsoleLogs: importantLogs,
  };

  fs.writeFileSync(
    'e2e/test-results/direct-deepseek-report.json',
    JSON.stringify(report, null, 2)
  );

  // ──── 断言 ────
  // 核心断言：API 调用成功返回了内容
  if (apiResult.success && apiResult.data?.choices?.[0]?.message?.content) {
    console.log('\n✅ PASS: DeepSeek 真实调用成功！代理 + API Key 全链路已打通');
  } else {
    console.log('\n❌ FAIL: DeepSeek 调用未成功');
    console.log(`   可能原因:`);
    if (!envCheck.hasApiKey) console.log(`   - API Key 未正确注入到浏览器`);
    if (proxyRequests.length === 0) console.log(`   - 代理请求未发出（Vite proxy 配置问题？）`);
    if (apiResult.status === 401) console.log(`   - API Key 无效或过期`);
    if (apiResult.status === 403) console.log(`   - CORS 或权限被拒`);
    if (apiResult.error?.includes('fetch')) console.log(`   - 网络层错误（DNS/连接/超时）`);
  }

  // 软断言：不阻塞但记录结果
  expect(apiResult.success).toBeTruthy();
});

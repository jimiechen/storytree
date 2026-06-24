import { test, expect } from '@playwright/test';

/**
 * DOM 探测脚本 — 找到续写/AI 按钮的真实选择器
 * 前置: frontend http://localhost:4444, backend http://localhost:4096
 */

test.describe('DOM 探测 — 寻找续写入口', () => {
  test('探测-01: 进入编辑器后全量快照', async ({ page }) => {
    await page.goto('/novel');
    await page.waitForLoadState('load');
    await page.waitForSelector('[data-testid="workspace-layout"]', { timeout: 20000 });

    // 点击章节进入编辑器
    await page.locator('[data-testid="sidenav-chapters"]').click();
    await expect(page.locator('[data-testid="editor-word-count"]')).toBeVisible({ timeout: 10000 });

    // 截图
    await page.screenshot({ path: 'e2e/test-results/dom-snapshot-editor.png', fullPage: true });
    console.log('[截图] 编辑器页面已保存');

    // 列出所有 button 文本
    const buttons = page.locator('button');
    const count = await buttons.count();
    console.log(`\n[info] 总共 ${count} 个 button:\n`);
    for (let i = 0; i < Math.min(count, 30); i++) {
      const btn = buttons.nth(i);
      const text = (await btn.textContent())?.trim();
      const className = await btn.getAttribute('class');
      const testId = await btn.getAttribute('data-testid');
      const ariaLabel = await btn.getAttribute('aria-label');
      console.log(`  [${i}] text="${text}" data-testid="${testId}" aria-label="${ariaLabel}" class=${className?.slice(0, 60)}`);
    }
  });

  test('探测-02: 搜索 AI/续写/生成 相关元素', async ({ page }) => {
    await page.goto('/novel');
    await page.waitForLoadState('load');
    await page.waitForSelector('[data-testid="workspace-layout"]', { timeout: 20000 });
    await page.locator('[data-testid="sidenav-chapters"]').click();
    await expect(page.locator('[data-testid="editor-word-count"]')).toBeVisible({ timeout: 10000 });

    // 搜索包含关键词的元素
    const keywords = ['AI', '续写', '生成', '润色', '摘要', 'continue', 'generate', 'write', 'llm'];
    for (const kw of keywords) {
      // 按文本搜索
      const byText = page.getByText(new RegExp(kw, 'i'));
      const textCount = await byText.count();
      if (textCount > 0) {
        console.log(`[找到] 关键词 "${kw}" 匹配 ${textCount} 个文本元素`);
        for (let i = 0; i < Math.min(textCount, 5); i++) {
          const el = byText.nth(i);
          const tag = await el.evaluate(e => e.tagName);
          const txt = (await el.textContent())?.trim().slice(0, 50);
          const tid = await el.getAttribute('data-testid');
          console.log(`  -> <${tag}> "${txt}" data-testid="${tid}"`);
        }
      }

      // 按 data-testid 搜索
      const byTestId = page.locator(`[data-testid*="${kw.toLowerCase()}"], [data-testid*="${kw}"]`);
      const tidCount = await byTestId.count();
      if (tidCount > 0) {
        console.log(`[找到] data-testid 包含 "${kw}" 的有 ${tidCount} 个`);
        for (let i = 0; i < Math.min(tidCount, 5); i++) {
          const tid = await byTestId.nth(i).getAttribute('data-testid');
          console.log(`  -> data-testid="${tid}"`);
        }
      }

      // 按 aria-label 搜索
      const byAria = page.locator(`[aria-label*="${kw}" i]`);
      const ariaCount = await byAria.count();
      if (ariaCount > 0) {
        console.log(`[找到] aria-label 包含 "${kw}" 的有 ${ariaCount} 个`);
      }
    }
  });

  test('探测-03: 编辑器工具栏完整结构', async ({ page }) => {
    await page.goto('/novel');
    await page.waitForLoadState('load');
    await page.waitForSelector('[data-testid="workspace-layout"]', { timeout: 20000 });
    await page.locator('[data-testid="sidenav-chapters"]').click();
    await expect(page.locator('[data-testid="editor-word-count"]')).toBeVisible({ timeout: 10000 });

    // 获取 editor 区域的所有 data-testid
    const allTestIds = await page.evaluate(() => {
      const els = document.querySelectorAll('[data-testid]');
      return Array.from(els).map(el => ({
        tag: el.tagName,
        testId: el.getAttribute('data-testid'),
        text: el.textContent?.trim().slice(0, 40),
        visible: el.offsetParent !== null,
      }));
    });

    console.log(`\n[info] 页面共 ${allTestIds.length} 个 data-testid 元素:\n`);
    // 过滤出可见的
    const visible = allTestIds.filter(t => t.visible);
    console.log(`[info] 其中可见: ${visible.length} 个\n`);

    // 按区域分组输出
    const editorRelated = visible.filter(t =>
      /editor|ai|toolbar|writing|generate|continue|chapter|result|card|panel|btn|button/i.test(t.testId ?? '')
    );
    console.log('[编辑器相关 data-testid]:');
    for (const t of editorRelated) {
      console.log(`  <${t.tag}> data-testid="${t.testId}" text="${t.text}"`);
    }

    // 输出所有可见的
    console.log('\n[全部可见 data-testid]:');
    for (const t of visible) {
      console.log(`  <${t.tag}> "${t.testId}" → "${t.text}"`);
    }
  });

  test('探测-04: 网络请求监控 + 点击所有可疑按钮', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', req => {
      const url = req.url();
      if (url.includes('chat') || url.includes('llm') || url.includes('generate') || url.includes('ai') || url.includes('agent') || url.includes('complete')) {
        requests.push(`${req.method()} ${url}`);
      }
    });

    await page.goto('/novel');
    await page.waitForLoadState('load');
    await page.waitForSelector('[data-testid="workspace-layout"]', { timeout: 20000 });
    await page.locator('[data-testid="sidenav-chapters"]').click();
    await expect(page.locator('[data-testid="editor-word-count"]')).toBeVisible({ timeout: 10000 });

    // 尝试点击各种可能的按钮
    const candidates = [
      'button:has-text("续写")',
      'button:has-text("AI")',
      'button:has-text("生成")',
      'button:has-text("润色")',
      '[data-testid*="ai"]',
      '[data-testid*="continue"]',
      '[data-testid*="generate"]',
      '[data-testid*="writing"]',
      '[data-testid*="tool"]',
      'button[aria-label*="续写"]',
      'button[aria-label*="AI"]',
      'button[aria-label*="生成"]',
    ];

    for (const sel of candidates) {
      try {
        const loc = page.locator(sel).first();
        if (await loc.count() > 0 && await loc.isVisible()) {
          const text = (await loc.textContent())?.trim();
          const tid = await loc.getAttribute('data-testid');
          console.log(`[点击] selector="${sel}" → text="${text}" testid="${tid}"`);
          await loc.click();
          await page.waitForTimeout(3000);
        }
      } catch {
        // 忽略
      }
    }

    console.log(`\n[网络请求] 监控到的 LLM 相关请求 (${requests.length}):`);
    for (const r of requests) {
      console.log(`  ${r}`);
    }
    if (requests.length === 0) {
      console.log('  (无 LLM 相关请求)');
    }

    // 最终截图
    await page.screenshot({ path: 'e2e/test-results/dom-after-clicks.png', fullPage: true });
  });
});

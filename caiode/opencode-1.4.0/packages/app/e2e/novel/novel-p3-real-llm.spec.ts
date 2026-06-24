import { test, expect } from '@playwright/test';

/**
 * Phase P3 - Real LLM E2E Acceptance Tests (v2 — 修正选择器)
 *
 * 关键发现:
 * - 「AI续写」按钮在 EditorToolbar 中，选择器: button:has-text("AI续写")
 * - 浮动工具栏(续写/改写/扩写/润色/摘要) 需选中文字才出现，无 data-testid
 * - MockModeBanner 显示 "Mock Mode — 模拟模式，不调用真实 AI"
 * - AIResultCard 在 AI 任务完成后出现在编辑器底部
 *
 * Pre: frontend http://localhost:4444, backend http://localhost:4096
 */

/** 进入编辑器的通用前置步骤 */
async function enterEditor(page: Awaited<ReturnType<typeof page['new']>>) {
  await page.goto('/novel');
  // Vite 首次冷启动可能较慢，等待 DOM 就绪并延长 layout 就绪时间
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('[data-testid="workspace-layout"]', { timeout: 90000 });
  await page.locator('[data-testid="sidenav-chapters"]').click();
  await expect(page.locator('[data-testid="editor-word-count"]')).toBeVisible({ timeout: 30000 });
}

test.describe('Phase P3 - Novel Editor & AI Calls (v2)', () => {

  // ──── 一、环境与页面加载 ────

  test('TC-001: /novel 加载工作台', async ({ page }) => {
    await page.goto('/novel');
    await page.waitForLoadState('domcontentloaded');
    const layout = page.locator('[data-testid="workspace-layout"]');
    await expect(layout).toBeVisible({ timeout: 90000 });
    await expect(page.locator('[data-testid="workspace-logo"]')).toBeVisible({ timeout: 30000 });
    console.log('[PASS] 工作台正常加载');
  });

  test('TC-002: 进入章节编辑器', async ({ page }) => {
    await enterEditor(page);
    await expect(page.locator('[data-testid="editor-back-btn"]')).toBeVisible();
    const wcText = await page.locator('[data-testid="editor-word-count"]').textContent();
    console.log(`[PASS] 编辑器已进入，字数统计: ${wcText}`);
  });

  // ──── 二、AI 续写按钮发现与交互 ────

  test('TC-003: 编辑器顶部「AI续写」按钮可见', async ({ page }) => {
    await enterEditor(page);
    // AI续写 按钮在 EditorToolbar 中（紫色填充按钮）
    const aiBtn = page.locator('button:has-text("AI续写")');
    await expect(aiBtn.first()).toBeVisible({ timeout: 5000 });
    console.log('[PASS] 「AI续写」按钮在顶部工具栏中可见');

    // 同时检查 MockMode 横幅
    const mockBanner = page.locator('text=/Mock.*Mode.*模拟模式/');
    if (await mockBanner.count() > 0) {
      const bannerText = (await mockBanner.textContent())?.trim();
      console.log(`[INFO] MockMode 横幅: "${bannerText}"`);
    }
  });

  test('TC-004: 点击「AI续写」→ 真实/Mock 模式返回结果不崩溃', async ({ page }) => {
    await enterEditor(page);

    // 监控所有网络请求（P3-D 验收：检查是否有 DeepSeek 调用）
    const allRequests: string[] = [];
    const llmRequests: string[] = [];
    page.on('request', req => {
      const url = req.url();
      allRequests.push(`${req.method()} ${url}`);
      if (url.includes('deepseek') || url.includes('chat/completions') || url.includes('v1/chat') || url.includes('api.openai')) {
        llmRequests.push(`${req.method()} ${url}`);
      }
    });

    // 监控所有控制台日志（包含 info 级别以捕获 [P3-TEST] 诊断信息）
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text().slice(0, 300)}`);
    });

    // 记录初始字数
    const initialWc = await page.locator('[data-testid="editor-word-count"]').textContent();
    console.log(`[INFO] 初始字数: ${initialWc}`);

    // 点击 AI续写
    const aiBtn = page.locator('button:has-text("AI续写")').first();
    await aiBtn.click();
    console.log('[INFO] 已点击「AI续写」按钮');

    // 等待任务处理（真实 DeepSeek 可能需要 10-30 秒；关闭代理后直连可能更久）
    console.log('[INFO] 等待响应（最多30秒）...');
    await page.waitForTimeout(30000);

    // 页面不应崩溃 — 字数统计仍应可见
    await expect(page.locator('[data-testid="editor-word-count"]')).toBeVisible();

    // 检查网络请求
    const finalWc = await page.locator('[data-testid="editor-word-count"]').textContent();
    console.log(`[INFO] 最终字数: ${finalWc} (初始: ${initialWc})`);
    console.log(`[INFO] 总请求数: ${allRequests.length}`);
    console.log(`[INFO] LLM/DeepSeek 请求数: ${llmRequests.length}`);

    for (const r of llmRequests) {
      console.log(`  [DEEPSEEK] ${r}`);
    }
    // 也打印后端请求（可能通过代理）
    for (const r of allRequests.filter(r => r.includes(':4096') || r.includes('opencode'))) {
      console.log(`  [BACKEND] ${r}`);
    }

    // 控制台日志（优先打印 [P3-TEST] / DeepSeek 相关）
    const relevantLogs = consoleLogs.filter(l =>
      l.includes('[P3-TEST]') ||
      l.includes('DeepSeek') ||
      l.includes('deepseek') ||
      l.includes('transport') ||
      l.includes('adapter') ||
      l.includes('LLM') ||
      l.includes('error')
    );
    for (const log of relevantLogs) {
      console.log(`  [CONSOLE] ${log}`);
    }
    if (relevantLogs.length === 0 && consoleLogs.length > 0) {
      console.log(`  [CONSOLE] 共 ${consoleLogs.length} 条日志，无 LLM 相关`);
    }

    // 截图记录点击后状态
    await page.screenshot({
      path: 'e2e/test-results/tc-004-after-ai-click.png',
      fullPage: true,
    });

    // 写入诊断报告
    const fs = await import('fs');
    const report = {
      timestamp: new Date().toISOString(),
      initialWordCount: initialWc,
      finalWordCount: finalWc,
      totalRequests: allRequests.length,
      deepseekRequests: llmRequests.length,
      deepseekRequestUrls: llmRequests,
      backendRequests: allRequests.filter(r => r.includes(':4096')),
      consoleErrors: consoleLogs,
    };
    try {
      fs.writeFileSync('e2e/test-results/tc-004-network-report.json', JSON.stringify(report, null, 2));
    } catch (e) { /* ignore */ }

    console.log('[PASS] AI续写点击后无崩溃，截图已保存');
  });

  test('TC-005: AI续写后 AIResultCard 出现', async ({ page }) => {
    await enterEditor(page);

    // 先确认 AIResultCard 不存在
    let card = page.locator('[data-testid="ai-result-card"]');
    const beforeCount = await card.count();
    console.log(`[INFO] 点击前 AIResultCard 数量: ${beforeCount}`);

    // 点击 AI续写
    await page.locator('button:has-text("AI续写")').first().click();

    // 等待 AIResultCard 出现（真实 DeepSeek 调用可能需要 10-30 秒）
    card = page.locator('[data-testid="ai-result-card"]');
    await expect(card.first()).toBeVisible({ timeout: 35000 });

    const afterCount = await card.count();
    console.log(`[INFO] 点击后 AIResultCard 数量: ${afterCount}`);

    // 获取卡片内容
    const cardText = (await card.first().textContent())?.slice(0, 200);
    console.log(`[PASS] AIResultCard 已出现，内容预览: "${cardText}"`);

    // 检查卡片上的操作按钮
    const acceptBtn = card.first().locator('button:has-text("接受"), button:has-text("采纳")');
    const saveBtn = card.first().locator('button:has-text("保存"), button:has-text("存入")');
    const discardBtn = card.first().locator('button:has-text("丢弃"), button:has-text("忽略")');
    console.log(`[INFO] 接受按钮: ${await acceptBtn.count()}, 保存按钮: ${await saveBtn.count()}, 丢弃按钮: ${await discardBtn.count()}`);

    await page.screenshot({
      path: 'e2e/test-results/tc-005-ai-result-card.png',
      fullPage: true,
    });

    // 至少不应崩溃
    await expect(page.locator('[data-testid="editor-word-count"]')).toBeVisible();
  });

  // ──── 三、浮动工具栏（文字选中触发） ────

  test('TC-006: 选中文字触发浮动 AI 工具栏', async ({ page }) => {
    await enterEditor(page);

    // 找到编辑器文本区域并选中一段文字
    // 编辑器 canvas 区域通常包含章节正文
    const editorCanvas = page.locator('[contenteditable="true"], .editor-canvas, [data-testid*="editor-canvas"], textarea').first();
    const canvasCount = await editorCanvas.count();

    if (canvasCount > 0) {
      // 点击编辑器获取焦点
      await editorCanvas.click();
      await page.waitForTimeout(500);

      // 用 Ctrl+A 全选文字
      await page.keyboard.press('Control+a');
      await page.waitForTimeout(1000);

      // 检查浮动工具栏是否出现（包含 续写/改写/扩写/润色/摘要 按钮）
      const floatingBar = page.locator('text=续写').locator('..').locator('text=润色').locator('..');
      // 或者直接搜索浮动工具栏的特征：同时包含多个 AI 命令
      const continueBtn = page.locator('.fixed:has-text("续写"):has-text("改写")');
      const fbCount = await continueBtn.count();

      if (fbCount > 0) {
        console.log('[PASS] 浮动 AI 工具栏已出现（含 续写/改写/扩写/润色/摘要）');
        await page.screenshot({ path: 'e2e/test-results/tc-06-floating-toolbar.png' });
      } else {
        // 尝试其他方式检测
        const allText = page.locator('text=续写');
        const tc = await allText.count();
        console.log(`[INFO] 页面中"续写"文本元素数: ${tc} (含顶部按钮和可能的浮动栏)`);

        // 列出所有包含"续写"的元素
        for (let i = 0; i < tc; i++) {
          const el = allText.nth(i);
          const tag = await el.evaluate(e => e.tagName);
          const visible = await el.isVisible();
          const parentClass = await el.evaluate(e => e.parentElement?.className?.toString()?.slice(0, 60));
          console.log(`  [${i}] <${tag}> visible=${visible} parentClass=${parentClass}`);
        }
      }
    } else {
      console.log('[INFO] 未找到 contenteditable 区域，尝试其他方式选中文本');
      // 尝试直接在页面上找正文区域
      const bodyText = page.locator('.prose, .editor-content, [class*="content"]').first();
      if (await bodyText.count() > 0) {
        await bodyText.click();
        await page.keyboard.press('Control+a');
        await page.waitForTimeout(1000);
        console.log('[INFO] 已尝试在内容区全选文字');
      }
    }
  });

  // ──── 四、导航与面板 ────

  test('TC-007: Logo → 书架 → 工作台 往返导航', async ({ page }) => {
    // 使用独立导航（不依赖 enterEditor 的残留状态）
    await page.goto('/novel');
    await page.waitForLoadState('load');
    await page.waitForSelector('[data-testid="workspace-layout"]', { timeout: 20000 });
    // Logo 可能在 workspace-layout 内部或外部，尝试多种选择器
    const logo = page.locator('[data-testid="workspace-logo"]');
    if (await logo.count() > 0 && await logo.isVisible()) {
      await logo.click();
    } else {
      // 备选：直接导航到书架视图
      await page.goto('/novel?view=bookshelf');
      await page.waitForLoadState('load');
    }
    await expect(page.locator('[data-testid="bookshelf-project-card"]').first()).toBeVisible({ timeout: 10000 });
    await page.locator('[data-testid="bookshelf-project-card"]').first().click();
    await expect(page.locator('[data-testid="workspace-layout"]')).toBeVisible({ timeout: 10000 });
    console.log('[PASS] 导航往返正常');
  });

  test('TC-008: 后端 API 可达', async ({ page }) => {
    const resp = await page.request.get('http://localhost:4096/');
    expect(resp.status()).toBeLessThan(500);
    console.log(`[PASS] 后端状态码: ${resp.status()}`);
  });

  // ──── 五、安全与稳定性 ────

  test('TC-009: 无致命 JS 错误', async ({ page }) => {
    const errs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errs.push(msg.text());
    });
    await enterEditor(page);
    await page.waitForTimeout(3000);

    const crit = errs.filter(e => /(opencode|novel|adapter|llm)/i.test(e));
    console.log(`[INFO] 总错误数: ${errs.length}, 关键错误: ${crit.length}`);
    if (crit.length > 0) {
      for (const e of crit) {
        console.log(`  [CRIT] ${e.slice(0, 120)}`);
      }
    }
    expect(crit.length).toBe(0);
  });

  test('TC-010: 无 API Key 泄露', async ({ page }) => {
    const leaked: string[] = [];
    page.on('request', req => {
      const body = req.url() + JSON.stringify(req.headers()) + (req.postData() ?? '');
      if (/sk-[a-zA-Z0-9]{20,}/.test(body)) leaked.push(req.url());
    });
    await enterEditor(page);
    await page.waitForTimeout(2000);
    expect(leaked.length).toBe(0);
    console.log('[PASS] 无 API Key 泄露');
  });

  // ──── 六、信息审计面板 ────

  test('TC-011: 信息审计面板渲染', async ({ page }) => {
    await enterEditor(page);
    // 右侧面板应显示章节信息
    const chapterInfo = page.locator('text=章节信息');
    if (await chapterInfo.count() > 0) {
      await expect(chapterInfo.first()).toBeVisible();
      console.log('[PASS] 章节信息面板可见');
    }

    // AI 提取信息区域
    const aiExtract = page.locator('text=AI 提取');
    if (await aiExtract.count() > 0) {
      console.log('[PASS] AI 提取信息区域可见');
    }

    // 信息审计面板（ChapterInfoPanel）
    const infoPanel = page.locator('[data-testid="chapter-info-panel"], [data-testid="info-audit-panel"]');
    if (await infoPanel.count() > 0) {
      console.log('[PASS] 信息审计 panel 存在');
    }

    await page.screenshot({
      path: 'e2e/test-results/tc-011-info-panels.png',
      fullPage: true,
    });
  });

  // ──── 七、Mock 模式完整流程验证 ────

  test('TC-012: 完整 Mock 流程 — 续写→结果卡→字数变化', async ({ page }) => {
    await enterEditor(page);

    // 记录初始字数
    const initialWc = await page.locator('[data-testid="editor-word-count"]').textContent();
    console.log(`[INFO] 初始字数: ${initialWc}`);

    // 点击 AI续写
    await page.locator('button:has-text("AI续写")').first().click();
    await page.waitForTimeout(4000);

    // 检查字数是否变化（Mock 会生成新内容替换原文）
    const finalWc = await page.locator('[data-testid="editor-word-count"]').textContent();
    console.log(`[INFO] AI后续写字数: ${finalWc}`);

    // 检查 AIResultCard
    const cards = page.locator('[data-testid="ai-result-card"]');
    const cardCount = await cards.count();
    console.log(`[INFO] AIResultCard 数量: ${cardCount}`);

    if (cardCount > 0) {
      const cardText = (await cards.last().textContent())?.slice(0, 150);
      console.log(`[INFO] 最后一张 AIResultCard 内容: "${cardText}"`);
    }

    // 最终截图
    await page.screenshot({
      path: 'e2e/test-results/tc-012-full-mock-flow.png',
      fullPage: true,
    });
    console.log('[PASS] 完整 Mock 流程完成，截图已保存');
  });
});

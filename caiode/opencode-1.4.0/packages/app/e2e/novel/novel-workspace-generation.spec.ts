import { test, expect } from '@playwright/test';

/**
 * P0 阻断修复验收：工作台「开始生成」按钮触发章节生成工作流
 *
 * 目标链路：
 *   WorkspaceActions.onClick
 *   → workspace-view-model.submitChapterGenerationTask
 *   → useNovelWorkflow.runChapterGeneration
 *   → runMockGeneration
 *   → applyWorkflowEvents(events, mutations)
 *   → updateChapterContent / updateChapterInfoState
 *   → UI 正文和信息审计更新
 */
test.describe('Novel Workspace Generation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // 监听并收集所有 console 日志（用于失败诊断）
    (page as any).__consoleLogs = [];
    (page as any).__consoleErrors = [];
    page.on('console', (msg) => {
      const line = `[${msg.type()}] ${msg.text()}`;
      ((page as any).__consoleLogs as string[]).push(line);
      if (msg.type() === 'error') {
        ((page as any).__consoleErrors as string[]).push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      const line = `[pageerror] ${err.message}`;
      ((page as any).__consoleLogs as string[]).push(line);
      ((page as any).__consoleErrors as string[]).push(err.message);
    });

    await page.goto('/novel?view=workspace');
    await page.waitForLoadState('load');
    await page.waitForSelector('[data-testid="workspace-layout"]', { timeout: 20_000 });
  });

  test('workspace start generation updates chapter content, summary, word count and info state', async ({ page }) => {
    // 1. 确认工作台已加载且开始生成按钮可见
    const startBtn = page.locator('[data-testid="start-generation-btn"]');
    await expect(startBtn).toBeVisible({ timeout: 10_000 });
    await expect(startBtn).toContainText('开始生成');

    // 2. 记录点击前的正文内容与字数
    const content = page.locator('[data-testid="chapter-content"]');
    await expect(content).toBeVisible();
    const beforeText = await content.textContent();
    expect(beforeText).toBeTruthy();

    // 3. 点击开始生成
    await startBtn.click();

    // 4. 等待正文内容变化（生成的新文本写回）—— 这是工作流成功执行的最直接证据
    console.log(`[e2e] beforeText length=${beforeText?.length}, preview=${beforeText?.slice(0, 60)}`);
    await expect.poll(
      async () => {
        const afterText = await content.textContent();
        console.log(`[e2e] polling afterText length=${afterText?.length}, changed=${afterText !== beforeText}, preview=${afterText?.slice(0, 60)}`);
        return afterText !== beforeText;
      },
      { timeout: 20_000, message: 'chapter content should change after generation' },
    ).toBe(true);

    // 5. 验证所有 mutation 都被调用且 SAVED（console 事件异步到达，使用 poll）
    const hasLog = (text: string) => {
      const logs = ((page as any).__consoleLogs as string[]) ?? [];
      return logs.some((l) => l.includes(text));
    };
    await expect.poll(() => hasLog('updateChapterContent SAVED'), { timeout: 5_000 }).toBe(true);
    await expect.poll(() => hasLog('updateChapterSummary SAVED'), { timeout: 5_000 }).toBe(true);
    await expect.poll(() => hasLog('updateChapterWordCount SAVED'), { timeout: 5_000 }).toBe(true);
    await expect.poll(() => hasLog('updateChapterInfoState SAVED'), { timeout: 5_000 }).toBe(true);
    await expect.poll(() => hasLog('updateChapterExtractedInfo SAVED'), { timeout: 5_000 }).toBe(true);

    // 6. 验证控制台不再出现 "is not implemented yet"
    const logs = ((page as any).__consoleLogs as string[]) ?? [];
    const notImplementedLogs = logs.filter((l) => l.includes('is not implemented yet'));
    expect(notImplementedLogs, `found "is not implemented yet" logs: ${notImplementedLogs.join('; ')}`).toEqual([]);

    // 7. 进度浮窗可能一闪而过，不强求可见；但如果出现则必须为 running 状态
    const progressDock = page.locator('[data-testid="ai-progress-dock"]');
    if (await progressDock.isVisible().catch(() => false)) {
      await expect(page.locator('[data-testid="ai-progress-title"]')).toContainText('AI 正在');
    }

    // 8. 检查无 fatal console 错误
    const errors = ((page as any).__consoleErrors as string[]) ?? [];
    const fatalErrors = errors.filter((e) =>
      /ReferenceError|TypeError|unhandledrejection|e2e:error-boundary/i.test(e),
    );
    expect(fatalErrors, `fatal console errors: ${fatalErrors.join('; ')}`).toEqual([]);
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      const logs = ((page as any).__consoleLogs as string[]) ?? [];
      console.log('--- Console logs for failed test ---');
      console.log(logs.join('\n'));
      console.log('--- End console logs ---');
    }
  });
});

# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workbench/workbench.spec.ts >> Workbench Page >> should show saving status during auto-save
- Location: tests/e2e/workbench/workbench.spec.ts:103:7

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('[data-testid="email-input"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - heading "登录" [level=2] [ref=e6]
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]: 邮箱
        - textbox "请输入邮箱" [ref=e10]
      - generic [ref=e11]:
        - generic [ref=e12]: 密码
        - textbox "请输入密码" [ref=e13]
      - button "登录" [ref=e14]
    - link "还没有账号？立即注册" [ref=e16] [cursor=pointer]:
      - /url: /register
  - button "Open Next.js Dev Tools" [ref=e22] [cursor=pointer]:
    - img [ref=e23]
  - alert [ref=e26]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Workbench Page', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // 登录并导航到工作台
  6   |     await page.goto('/login');
> 7   |     await page.fill('[data-testid="email-input"]', 'test@example.com');
      |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  8   |     await page.fill('[data-testid="password-input"]', 'password123');
  9   |     await page.click('[data-testid="login-button"]');
  10  |     await page.waitForURL('/projects');
  11  |     
  12  |     // 点击第一个项目进入工作台
  13  |     await page.click('[data-testid="project-card"]:first-child');
  14  |     await page.waitForURL(/\/workbench\/\d+/);
  15  |   });
  16  | 
  17  |   test('should render three-column layout', async ({ page }) => {
  18  |     // 验证三栏布局存在
  19  |     const chapterSidebar = await page.locator('[data-testid="chapter-sidebar"]').first();
  20  |     const editorArea = await page.locator('[data-testid="editor-content"]').first();
  21  |     const aiPanel = await page.locator('[data-testid="ai-panel"]').first();
  22  |     
  23  |     await expect(chapterSidebar).toBeVisible();
  24  |     await expect(editorArea).toBeVisible();
  25  |     await expect(aiPanel).toBeVisible();
  26  |   });
  27  | 
  28  |   test('should load chapter content in editor', async ({ page }) => {
  29  |     // 等待编辑器加载
  30  |     await page.waitForSelector('[data-testid="editor-content"]');
  31  |     
  32  |     // 验证编辑器内容不为空
  33  |     const editorContent = await page.locator('[data-testid="editor-content"]').textContent();
  34  |     expect(editorContent).toBeTruthy();
  35  |   });
  36  | 
  37  |   test('should switch chapter content when clicking different chapter', async ({ page }) => {
  38  |     // 获取初始内容
  39  |     const initialContent = await page.locator('[data-testid="editor-content"]').textContent();
  40  |     
  41  |     // 点击第二个章节（如果存在）
  42  |     const chapterItems = await page.locator('[data-testid="chapter-item"]');
  43  |     const count = await chapterItems.count();
  44  |     
  45  |     if (count > 1) {
  46  |       await chapterItems.nth(1).click();
  47  |       
  48  |       // 等待内容更新
  49  |       await page.waitForTimeout(500);
  50  |       
  51  |       // 验证内容发生变化
  52  |       const newContent = await page.locator('[data-testid="editor-content"]').textContent();
  53  |       expect(newContent).not.toBe(initialContent);
  54  |     }
  55  |   });
  56  | 
  57  |   test('should display word count', async ({ page }) => {
  58  |     // 验证字数统计显示
  59  |     const wordCount = await page.locator('[data-testid="word-count"]');
  60  |     await expect(wordCount).toBeVisible();
  61  |     
  62  |     // 验证字数不为负数
  63  |     const countText = await wordCount.textContent();
  64  |     const count = parseInt(countText?.replace(/\D/g, '') || '0');
  65  |     expect(count).toBeGreaterThanOrEqual(0);
  66  |   });
  67  | 
  68  |   test('should update word count when content changes', async ({ page }) => {
  69  |     // 获取初始字数
  70  |     const initialWordCount = await page.locator('[data-testid="word-count"]').textContent();
  71  |     const initialCount = parseInt(initialWordCount?.replace(/\D/g, '') || '0');
  72  |     
  73  |     // 在编辑器中输入内容
  74  |     const editor = await page.locator('[data-testid="editor-content"]');
  75  |     await editor.fill('这是一段测试文字，用于验证字数统计功能。');
  76  |     
  77  |     // 等待字数更新
  78  |     await page.waitForTimeout(1000);
  79  |     
  80  |     // 验证字数增加
  81  |     const newWordCount = await page.locator('[data-testid="word-count"]').textContent();
  82  |     const newCount = parseInt(newWordCount?.replace(/\D/g, '') || '0');
  83  |     expect(newCount).toBeGreaterThan(initialCount);
  84  |   });
  85  | 
  86  |   test('should auto-save content after 2 seconds debounce', async ({ page }) => {
  87  |     // 在编辑器中输入内容
  88  |     const editor = await page.locator('[data-testid="editor-content"]');
  89  |     await editor.fill('这是需要自动保存的内容。');
  90  |     
  91  |     // 等待防抖时间（2秒）
  92  |     await page.waitForTimeout(2500);
  93  |     
  94  |     // 验证保存状态显示
  95  |     const saveStatus = await page.locator('[data-testid="save-status"]');
  96  |     await expect(saveStatus).toBeVisible();
  97  |     
  98  |     // 验证保存状态显示"已保存"
  99  |     const statusText = await saveStatus.textContent();
  100 |     expect(statusText).toContain('已保存');
  101 |   });
  102 | 
  103 |   test('should show saving status during auto-save', async ({ page }) => {
  104 |     // 在编辑器中输入内容
  105 |     const editor = await page.locator('[data-testid="editor-content"]');
  106 |     await editor.fill('这是测试自动保存状态的内容。');
  107 |     
```
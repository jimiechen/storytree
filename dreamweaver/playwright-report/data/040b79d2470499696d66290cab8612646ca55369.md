# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workbench/chapters.spec.ts >> Chapter Navigation Component >> should open new chapter form when new chapter button is clicked
- Location: tests/e2e/workbench/chapters.spec.ts:85:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('[data-testid="new-chapter-button"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]: 获取章节列表失败
  - generic [ref=e8] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e9]:
      - img [ref=e10]
    - generic [ref=e13]:
      - button "Open issues overlay" [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: "0"
          - generic [ref=e17]: "1"
        - generic [ref=e18]: Issue
      - button "Collapse issues badge" [ref=e19]:
        - img [ref=e20]
  - alert [ref=e22]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Chapter Navigation Component', () => {
  4   |   test('should display chapter list', async ({ page }) => {
  5   |     // 导航到工作台页面
  6   |     await page.goto('/workbench/1');
  7   |     
  8   |     // 验证章节列表容器存在
  9   |     const chapterList = await page.locator('[data-testid="chapter-list"]');
  10  |     await expect(chapterList).toBeVisible();
  11  |     
  12  |     // 验证章节列表包含至少一个章节
  13  |     const chapterItems = await page.locator('[data-testid="chapter-item"]');
  14  |     const count = await chapterItems.count();
  15  |     expect(count).toBeGreaterThan(0);
  16  |   });
  17  | 
  18  |   test('should display chapter titles', async ({ page }) => {
  19  |     // 导航到工作台页面
  20  |     await page.goto('/workbench/1');
  21  |     
  22  |     // 验证章节标题存在
  23  |     const chapterTitles = await page.locator('[data-testid="chapter-title"]');
  24  |     const count = await chapterTitles.count();
  25  |     expect(count).toBeGreaterThan(0);
  26  |     
  27  |     // 验证章节标题不为空
  28  |     for (let i = 0; i < count; i++) {
  29  |       const title = await chapterTitles.nth(i).textContent();
  30  |       expect(title).toBeTruthy();
  31  |     }
  32  |   });
  33  | 
  34  |   test('should allow clicking on chapters to switch content', async ({ page }) => {
  35  |     // 导航到工作台页面
  36  |     await page.goto('/workbench/1');
  37  |     
  38  |     // 验证初始章节内容存在
  39  |     const initialContent = await page.locator('[data-testid="editor-content"]').textContent();
  40  |     expect(initialContent).toBeTruthy();
  41  |     
  42  |     // 点击第二个章节
  43  |     const chapterItems = await page.locator('[data-testid="chapter-item"]');
  44  |     const count = await chapterItems.count();
  45  |     if (count > 1) {
  46  |       await chapterItems.nth(1).click();
  47  |       
  48  |       // 验证内容发生变化
  49  |       const newContent = await page.locator('[data-testid="editor-content"]').textContent();
  50  |       expect(newContent).not.toBe(initialContent);
  51  |     }
  52  |   });
  53  | 
  54  |   test('should display active chapter indicator', async ({ page }) => {
  55  |     // 导航到工作台页面
  56  |     await page.goto('/workbench/1');
  57  |     
  58  |     // 验证初始章节有激活状态
  59  |     const activeChapter = await page.locator('[data-testid="chapter-item"].active');
  60  |     await expect(activeChapter).toBeVisible();
  61  |     
  62  |     // 点击另一个章节
  63  |     const chapterItems = await page.locator('[data-testid="chapter-item"]');
  64  |     const count = await chapterItems.count();
  65  |     if (count > 1) {
  66  |       await chapterItems.nth(1).click();
  67  |       
  68  |       // 验证新章节有激活状态
  69  |       const newActiveChapter = await page.locator('[data-testid="chapter-item"].active');
  70  |       await expect(newActiveChapter).toBeVisible();
  71  |       expect(await newActiveChapter.textContent()).not.toBe(await activeChapter.textContent());
  72  |     }
  73  |   });
  74  | 
  75  |   test('should have new chapter button', async ({ page }) => {
  76  |     // 导航到工作台页面
  77  |     await page.goto('/workbench/1');
  78  |     
  79  |     // 验证新建章节按钮存在
  80  |     const newChapterButton = await page.locator('[data-testid="new-chapter-button"]');
  81  |     await expect(newChapterButton).toBeVisible();
  82  |     await expect(newChapterButton).toHaveText('+ 新建章节');
  83  |   });
  84  | 
  85  |   test('should open new chapter form when new chapter button is clicked', async ({ page }) => {
  86  |     // 导航到工作台页面
  87  |     await page.goto('/workbench/1');
  88  |     
  89  |     // 点击新建章节按钮
  90  |     const newChapterButton = await page.locator('[data-testid="new-chapter-button"]');
> 91  |     await newChapterButton.click();
      |                            ^ Error: locator.click: Test timeout of 30000ms exceeded.
  92  |     
  93  |     // 验证新建章节表单存在
  94  |     const newChapterForm = await page.locator('[data-testid="new-chapter-form"]');
  95  |     await expect(newChapterForm).toBeVisible();
  96  |     
  97  |     // 验证表单包含标题输入框
  98  |     const titleInput = await page.locator('[data-testid="chapter-title-input"]');
  99  |     await expect(titleInput).toBeVisible();
  100 |     
  101 |     // 验证表单包含确认和取消按钮
  102 |     const confirmButton = await page.locator('[data-testid="confirm-button"]');
  103 |     const cancelButton = await page.locator('[data-testid="cancel-button"]');
  104 |     await expect(confirmButton).toBeVisible();
  105 |     await expect(cancelButton).toBeVisible();
  106 |   });
  107 | 
  108 |   test('should create new chapter when form is submitted', async ({ page }) => {
  109 |     // 导航到工作台页面
  110 |     await page.goto('/workbench/1');
  111 |     
  112 |     // 获取初始章节数量
  113 |     const initialChapters = await page.locator('[data-testid="chapter-item"]').count();
  114 |     
  115 |     // 点击新建章节按钮
  116 |     const newChapterButton = await page.locator('[data-testid="new-chapter-button"]');
  117 |     await newChapterButton.click();
  118 |     
  119 |     // 填写章节标题
  120 |     const titleInput = await page.locator('[data-testid="chapter-title-input"]');
  121 |     await titleInput.fill('测试章节');
  122 |     
  123 |     // 点击确认按钮
  124 |     const confirmButton = await page.locator('[data-testid="confirm-button"]');
  125 |     await confirmButton.click();
  126 |     
  127 |     // 验证章节数量增加
  128 |     const newChapters = await page.locator('[data-testid="chapter-item"]').count();
  129 |     expect(newChapters).toBe(initialChapters + 1);
  130 |     
  131 |     // 验证新章节存在
  132 |     const newChapter = await page.locator('[data-testid="chapter-item"]').last();
  133 |     await expect(newChapter).toHaveText('测试章节');
  134 |   });
  135 | 
  136 |   test('should cancel new chapter creation when cancel button is clicked', async ({ page }) => {
  137 |     // 导航到工作台页面
  138 |     await page.goto('/workbench/1');
  139 |     
  140 |     // 获取初始章节数量
  141 |     const initialChapters = await page.locator('[data-testid="chapter-item"]').count();
  142 |     
  143 |     // 点击新建章节按钮
  144 |     const newChapterButton = await page.locator('[data-testid="new-chapter-button"]');
  145 |     await newChapterButton.click();
  146 |     
  147 |     // 填写章节标题
  148 |     const titleInput = await page.locator('[data-testid="chapter-title-input"]');
  149 |     await titleInput.fill('测试章节');
  150 |     
  151 |     // 点击取消按钮
  152 |     const cancelButton = await page.locator('[data-testid="cancel-button"]');
  153 |     await cancelButton.click();
  154 |     
  155 |     // 验证章节数量不变
  156 |     const newChapters = await page.locator('[data-testid="chapter-item"]').count();
  157 |     expect(newChapters).toBe(initialChapters);
  158 |     
  159 |     // 验证表单不再可见
  160 |     const newChapterForm = await page.locator('[data-testid="new-chapter-form"]');
  161 |     await expect(newChapterForm).not.toBeVisible();
  162 |   });
  163 | });
  164 | 
```
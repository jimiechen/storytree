# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: projects/list.spec.ts >> 项目列表页面 >> 页面元素渲染 - 显示项目列表
- Location: tests/e2e/projects/list.spec.ts:8:7

# Error details

```
Error: expect(page).toHaveTitle(expected) failed

Expected pattern: /项目|Projects/
Received string:  "Create Next App"
Timeout: 5000ms

Call log:
  - Expect "toHaveTitle" with timeout 5000ms
    8 × unexpected value "Create Next App"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - heading "项目列表" [level=1] [ref=e6]
        - paragraph [ref=e7]: 管理您的小说写作项目
      - button "新建项目" [ref=e8]
    - searchbox "搜索项目..." [ref=e11]
    - generic [ref=e12]: 获取项目列表失败
    - generic [ref=e13]:
      - generic [ref=e14]: 📝
      - heading "暂无项目" [level=3] [ref=e15]
      - paragraph [ref=e16]: 开始创建您的第一个小说写作项目
      - button "创建第一个项目" [ref=e17]
  - button "Open Next.js Dev Tools" [ref=e23] [cursor=pointer]:
    - img [ref=e24]
  - alert [ref=e27]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('项目列表页面', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto('/projects');
  6   |   });
  7   | 
  8   |   test('页面元素渲染 - 显示项目列表', async ({ page }) => {
  9   |     // 验证页面标题
> 10  |     await expect(page).toHaveTitle(/项目|Projects/);
      |                        ^ Error: expect(page).toHaveTitle(expected) failed
  11  |     
  12  |     // 验证页面标题
  13  |     const pageTitle = page.locator('h1, h2:has-text("项目列表"), h2:has-text("Projects")').first();
  14  |     await expect(pageTitle).toBeVisible();
  15  |     
  16  |     // 验证项目卡片容器
  17  |     const projectList = page.locator('.grid, .flex, .project-list').first();
  18  |     await expect(projectList).toBeVisible();
  19  |     
  20  |     // 验证新建项目按钮
  21  |     const createButton = page.locator('button:has-text("新建项目"), button:has-text("New Project"), a[href*="create"]').first();
  22  |     await expect(createButton).toBeVisible();
  23  |     
  24  |     // 验证搜索框
  25  |     const searchInput = page.locator('input[type="search"], input[placeholder*="搜索"], input[placeholder*="Search"]').first();
  26  |     await expect(searchInput).toBeVisible();
  27  |   });
  28  | 
  29  |   test('空状态显示 - 没有项目时显示空状态', async ({ page }) => {
  30  |     // 模拟空状态
  31  |     // 验证空状态提示
  32  |     const emptyState = page.locator('text=/暂无项目|No projects yet|还没有项目/').first();
  33  |     await expect(emptyState).toBeVisible();
  34  |     
  35  |     // 验证空状态下的新建项目按钮
  36  |     const createButton = page.locator('button:has-text("创建第一个项目"), button:has-text("Create your first project")').first();
  37  |     await expect(createButton).toBeVisible();
  38  |   });
  39  | 
  40  |   test('项目列表显示 - 显示多个项目卡片', async ({ page }) => {
  41  |     // 验证项目卡片存在
  42  |     const projectCards = page.locator('.project-card, [data-testid="project-card"]').first();
  43  |     await expect(projectCards).toBeVisible();
  44  |     
  45  |     // 验证卡片包含标题
  46  |     const projectTitle = page.locator('.project-card h3, [data-testid="project-card"] h3').first();
  47  |     await expect(projectTitle).toBeVisible();
  48  |     
  49  |     // 验证卡片包含描述
  50  |     const projectDescription = page.locator('.project-card p, [data-testid="project-card"] p').first();
  51  |     await expect(projectDescription).toBeVisible();
  52  |     
  53  |     // 验证卡片包含创建时间
  54  |     const projectDate = page.locator('.project-card .text-sm, [data-testid="project-card"] .text-sm').first();
  55  |     await expect(projectDate).toBeVisible();
  56  |   });
  57  | 
  58  |   test('搜索过滤功能 - 搜索项目', async ({ page }) => {
  59  |     const searchInput = page.locator('input[type="search"], input[placeholder*="搜索"]').first();
  60  |     
  61  |     // 输入搜索关键词
  62  |     await searchInput.fill('test');
  63  |     await searchInput.press('Enter');
  64  |     
  65  |     // 验证搜索结果
  66  |     const searchResults = page.locator('.project-card, [data-testid="project-card"]');
  67  |     await expect(searchResults).toBeVisible();
  68  |   });
  69  | 
  70  |   test('点击项目卡片 - 跳转到项目工作台', async ({ page }) => {
  71  |     const projectCard = page.locator('.project-card, [data-testid="project-card"]').first();
  72  |     
  73  |     // 点击项目卡片
  74  |     await projectCard.click();
  75  |     
  76  |     // 验证跳转到工作台页面
  77  |     await expect(page).toHaveURL(/.*workbench/);
  78  |   });
  79  | 
  80  |   test('新建项目按钮 - 跳转到新建项目页面', async ({ page }) => {
  81  |     const createButton = page.locator('button:has-text("新建项目"), button:has-text("New Project")').first();
  82  |     
  83  |     // 点击新建项目按钮
  84  |     await createButton.click();
  85  |     
  86  |     // 验证跳转到新建项目页面
  87  |     await expect(page).toHaveURL(/.*projectscreate/);
  88  |   });
  89  | 
  90  |   test('排序功能 - 按创建时间排序', async ({ page }) => {
  91  |     const sortButton = page.locator('button:has-text("排序"), button:has-text("Sort"), select[name="sort"]').first();
  92  |     
  93  |     if (await sortButton.isVisible()) {
  94  |       await sortButton.click();
  95  |       const latestOption = page.locator('option:has-text("最新"), option:has-text("Latest"), option[value="latest"]').first();
  96  |       await latestOption.click();
  97  |       
  98  |       // 验证排序后结果
  99  |       const firstCard = page.locator('.project-card, [data-testid="project-card"]').first();
  100 |       await expect(firstCard).toBeVisible();
  101 |     }
  102 |   });
  103 | 
  104 |   test('分页功能 - 切换分页', async ({ page }) => {
  105 |     const pagination = page.locator('.pagination, nav[aria-label="Pagination"]').first();
  106 |     
  107 |     if (await pagination.isVisible()) {
  108 |       const nextButton = page.locator('.pagination button:has-text("下一页"), button[aria-label="Next"]').first();
  109 |       if (await nextButton.isVisible()) {
  110 |         await nextButton.click();
```
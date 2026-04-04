# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: projects/create.spec.ts >> 新建项目功能 >> 创建成功 - 跳转到项目列表并显示新项目
- Location: tests/e2e/projects/create.spec.ts:91:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=测试项目 1775301740643').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=测试项目 1775301740643').first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]
  - generic [ref=e14]:
    - generic [ref=e15]:
      - heading "新建项目" [level=1] [ref=e16]
      - paragraph [ref=e17]: 创建一个新的小说写作项目
    - generic [ref=e18]: 创建项目失败，请稍后重试
    - generic [ref=e20]:
      - generic [ref=e21]:
        - generic [ref=e22]: 项目标题
        - textbox "请输入项目标题" [ref=e23]: 测试项目 1775301740643
      - generic [ref=e24]:
        - generic [ref=e25]: 项目描述
        - textbox "项目描述" [ref=e26]:
          - /placeholder: 请输入项目描述（可选）
          - text: 这是一个测试项目
        - paragraph [ref=e27]: 8/1000
      - generic [ref=e28]:
        - button "取消" [ref=e29]
        - button "创建项目" [ref=e30]
```

# Test source

```ts
  13  |     // 验证页面标题
  14  |     await expect(page).toHaveTitle(/新建项目|Create Project/);
  15  |     
  16  |     // 验证页面标题
  17  |     const pageTitle = page.locator('h1, h2:has-text("新建项目"), h2:has-text("Create Project")').first();
  18  |     await expect(pageTitle).toBeVisible();
  19  |     
  20  |     // 验证表单元素
  21  |     const titleInput = page.locator('input[name="title"], input[placeholder*="项目标题"], input[placeholder*="Title"]').first();
  22  |     await expect(titleInput).toBeVisible();
  23  |     
  24  |     const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="项目描述"], textarea[placeholder*="Description"]').first();
  25  |     await expect(descriptionInput).toBeVisible();
  26  |     
  27  |     const createProjectButton = page.locator('button:has-text("创建项目"), button:has-text("Create Project"), button[type="submit"]').first();
  28  |     await expect(createProjectButton).toBeVisible();
  29  |     
  30  |     const cancelButton = page.locator('button:has-text("取消"), button:has-text("Cancel"), a[href*="projects"]').first();
  31  |     await expect(cancelButton).toBeVisible();
  32  |   });
  33  | 
  34  |   test('表单验证 - 项目标题不能为空', async ({ page }) => {
  35  |     // 点击新建项目按钮
  36  |     const createButton = page.locator('button:has-text("新建项目"), button:has-text("New Project")').first();
  37  |     await createButton.click();
  38  |     
  39  |     // 不输入标题，填写描述
  40  |     const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="项目描述"]').first();
  41  |     await descriptionInput.fill('这是一个测试项目');
  42  |     
  43  |     // 点击创建按钮
  44  |     const createProjectButton = page.locator('button:has-text("创建项目"), button[type="submit"]').first();
  45  |     await createProjectButton.click();
  46  |     
  47  |     // 验证显示错误提示
  48  |     const errorMessage = page.locator('text=/标题不能为空|title is required|请输入项目标题/').first();
  49  |     await expect(errorMessage).toBeVisible();
  50  |   });
  51  | 
  52  |   test('表单验证 - 项目标题长度限制', async ({ page }) => {
  53  |     // 点击新建项目按钮
  54  |     const createButton = page.locator('button:has-text("新建项目"), button:has-text("New Project")').first();
  55  |     await createButton.click();
  56  |     
  57  |     // 输入过长的标题
  58  |     const titleInput = page.locator('input[name="title"], input[placeholder*="项目标题"]').first();
  59  |     await titleInput.fill('a'.repeat(101)); // 101个字符
  60  |     
  61  |     // 点击创建按钮
  62  |     const createProjectButton = page.locator('button:has-text("创建项目"), button[type="submit"]').first();
  63  |     await createProjectButton.click();
  64  |     
  65  |     // 验证显示错误提示
  66  |     const errorMessage = page.locator('text=/标题长度|title length|标题不能超过/').first();
  67  |     await expect(errorMessage).toBeVisible();
  68  |   });
  69  | 
  70  |   test('表单验证 - 项目描述长度限制', async ({ page }) => {
  71  |     // 点击新建项目按钮
  72  |     const createButton = page.locator('button:has-text("新建项目"), button:has-text("New Project")').first();
  73  |     await createButton.click();
  74  |     
  75  |     // 输入标题和过长的描述
  76  |     const titleInput = page.locator('input[name="title"], input[placeholder*="项目标题"]').first();
  77  |     await titleInput.fill('测试项目');
  78  |     
  79  |     const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="项目描述"]').first();
  80  |     await descriptionInput.fill('a'.repeat(1001)); // 1001个字符
  81  |     
  82  |     // 点击创建按钮
  83  |     const createProjectButton = page.locator('button:has-text("创建项目"), button[type="submit"]').first();
  84  |     await createProjectButton.click();
  85  |     
  86  |     // 验证显示错误提示
  87  |     const errorMessage = page.locator('text=/描述长度|description length|描述不能超过/').first();
  88  |     await expect(errorMessage).toBeVisible();
  89  |   });
  90  | 
  91  |   test('创建成功 - 跳转到项目列表并显示新项目', async ({ page }) => {
  92  |     // 点击新建项目按钮
  93  |     const createButton = page.locator('button:has-text("新建项目"), button:has-text("New Project")').first();
  94  |     await createButton.click();
  95  |     
  96  |     // 输入项目信息
  97  |     const titleInput = page.locator('input[name="title"], input[placeholder*="项目标题"]').first();
  98  |     const testTitle = '测试项目 ' + Date.now();
  99  |     await titleInput.fill(testTitle);
  100 |     
  101 |     const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="项目描述"]').first();
  102 |     await descriptionInput.fill('这是一个测试项目');
  103 |     
  104 |     // 点击创建按钮
  105 |     const createProjectButton = page.locator('button:has-text("创建项目"), button[type="submit"]').first();
  106 |     await createProjectButton.click();
  107 |     
  108 |     // 验证跳转到项目列表
  109 |     await expect(page).toHaveURL(/.*projects/);
  110 |     
  111 |     // 验证新项目显示在列表中
  112 |     const newProject = page.locator('text=' + testTitle).first();
> 113 |     await expect(newProject).toBeVisible();
      |                              ^ Error: expect(locator).toBeVisible() failed
  114 |   });
  115 | 
  116 |   test('取消按钮 - 返回到项目列表', async ({ page }) => {
  117 |     // 点击新建项目按钮
  118 |     const createButton = page.locator('button:has-text("新建项目"), button:has-text("New Project")').first();
  119 |     await createButton.click();
  120 |     
  121 |     // 点击取消按钮
  122 |     const cancelButton = page.locator('button:has-text("取消"), button:has-text("Cancel"), a[href*="projects"]').first();
  123 |     await cancelButton.click();
  124 |     
  125 |     // 验证返回到项目列表
  126 |     await expect(page).toHaveURL(/.*projects/);
  127 |   });
  128 | 
  129 |   test('表单提交 - 加载状态显示', async ({ page }) => {
  130 |     // 点击新建项目按钮
  131 |     const createButton = page.locator('button:has-text("新建项目"), button:has-text("New Project")').first();
  132 |     await createButton.click();
  133 |     
  134 |     // 输入项目信息
  135 |     const titleInput = page.locator('input[name="title"], input[placeholder*="项目标题"]').first();
  136 |     await titleInput.fill('测试项目');
  137 |     
  138 |     const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="项目描述"]').first();
  139 |     await descriptionInput.fill('这是一个测试项目');
  140 |     
  141 |     // 点击创建按钮
  142 |     const createProjectButton = page.locator('button:has-text("创建项目"), button[type="submit"]').first();
  143 |     
  144 |     // 验证按钮显示加载状态
  145 |     const [response] = await Promise.all([
  146 |       page.waitForNavigation(),
  147 |       createProjectButton.click()
  148 |     ]);
  149 |     
  150 |     // 验证跳转成功
  151 |     await expect(page).toHaveURL(/.*projects/);
  152 |   });
  153 | });
```
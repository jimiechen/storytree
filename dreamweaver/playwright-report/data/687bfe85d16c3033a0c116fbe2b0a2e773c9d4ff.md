# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth/register.spec.ts >> 注册页面 >> 异步校验 - 用户名唯一性检查
- Location: tests/e2e/auth/register.spec.ts:112:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=/用户名已被使用|username already exists/i').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=/用户名已被使用|username already exists/i').first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - heading "注册" [level=2] [ref=e6]
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]: 用户名
        - textbox "请输入用户名" [ref=e10]: existinguser
      - generic [ref=e11]:
        - generic [ref=e12]: 邮箱
        - textbox "请输入邮箱" [ref=e13]
      - generic [ref=e14]:
        - generic [ref=e15]: 密码
        - textbox "请输入密码（至少8位）" [ref=e16]
      - button "注册" [ref=e17]
    - link "已有账号？立即登录" [ref=e19] [cursor=pointer]:
      - /url: /login
  - button "Open Next.js Dev Tools" [ref=e25] [cursor=pointer]:
    - img [ref=e26]
  - alert [ref=e29]
```

# Test source

```ts
  21  |     const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  22  |     await expect(passwordInput).toBeVisible();
  23  |     
  24  |     // 验证注册按钮存在
  25  |     const registerButton = page.locator('button[type="submit"], button:has-text("注册"), button:has-text("Register")').first();
  26  |     await expect(registerButton).toBeVisible();
  27  |   });
  28  | 
  29  |   test('表单验证 - 用户名为空', async ({ page }) => {
  30  |     const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  31  |     const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  32  |     const registerButton = page.locator('button[type="submit"]').first();
  33  |     
  34  |     // 不输入用户名，填写其他字段
  35  |     await emailInput.fill('test@example.com');
  36  |     await passwordInput.fill('password123');
  37  |     await registerButton.click();
  38  |     
  39  |     // 验证显示错误提示
  40  |     const errorMessage = page.locator('text=/用户名不能为空|username is required/i').first();
  41  |     await expect(errorMessage).toBeVisible();
  42  |   });
  43  | 
  44  |   test('表单验证 - 邮箱格式无效', async ({ page }) => {
  45  |     const usernameInput = page.locator('input[name="username"], input[placeholder*="用户名"]').first();
  46  |     const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  47  |     const registerButton = page.locator('button[type="submit"]').first();
  48  |     
  49  |     // 输入无效邮箱
  50  |     await usernameInput.fill('testuser');
  51  |     await emailInput.fill('invalid-email');
  52  |     await registerButton.click();
  53  |     
  54  |     // 验证显示错误提示
  55  |     const errorMessage = page.locator('text=/邮箱格式|email format/i').first();
  56  |     await expect(errorMessage).toBeVisible();
  57  |   });
  58  | 
  59  |   test('表单验证 - 密码少于8位', async ({ page }) => {
  60  |     const usernameInput = page.locator('input[name="username"], input[placeholder*="用户名"]').first();
  61  |     const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  62  |     const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  63  |     const registerButton = page.locator('button[type="submit"]').first();
  64  |     
  65  |     // 输入短密码
  66  |     await usernameInput.fill('testuser');
  67  |     await emailInput.fill('test@example.com');
  68  |     await passwordInput.fill('123');
  69  |     await registerButton.click();
  70  |     
  71  |     // 验证显示错误提示
  72  |     const errorMessage = page.locator('text=/密码至少|password must be at least/i').first();
  73  |     await expect(errorMessage).toBeVisible();
  74  |   });
  75  | 
  76  |   test('注册成功 - 跳转到登录页或项目列表', async ({ page }) => {
  77  |     const usernameInput = page.locator('input[name="username"], input[placeholder*="用户名"]').first();
  78  |     const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  79  |     const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  80  |     const registerButton = page.locator('button[type="submit"]').first();
  81  |     
  82  |     // 输入有效注册信息
  83  |     await usernameInput.fill('newuser' + Date.now());
  84  |     await emailInput.fill('newuser' + Date.now() + '@example.com');
  85  |     await passwordInput.fill('password123');
  86  |     await registerButton.click();
  87  |     
  88  |     // 验证跳转 (登录页或项目列表)
  89  |     await expect(page).toHaveURL(/.*\/(login|projects)/);
  90  |   });
  91  | 
  92  |   test('注册失败 - 邮箱已被注册', async ({ page }) => {
  93  |     const usernameInput = page.locator('input[name="username"], input[placeholder*="用户名"]').first();
  94  |     const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  95  |     const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  96  |     const registerButton = page.locator('button[type="submit"]').first();
  97  |     
  98  |     // 使用已存在的邮箱
  99  |     await usernameInput.fill('testuser');
  100 |     await emailInput.fill('test@example.com');
  101 |     await passwordInput.fill('password123');
  102 |     await registerButton.click();
  103 |     
  104 |     // 验证显示错误提示
  105 |     const errorMessage = page.locator('text=/邮箱已被注册|email already exists/i').first();
  106 |     await expect(errorMessage).toBeVisible();
  107 |     
  108 |     // 验证仍在注册页
  109 |     await expect(page).toHaveURL(/.*\/register/);
  110 |   });
  111 | 
  112 |   test('异步校验 - 用户名唯一性检查', async ({ page }) => {
  113 |     const usernameInput = page.locator('input[name="username"], input[placeholder*="用户名"]').first();
  114 |     
  115 |     // 输入已存在的用户名
  116 |     await usernameInput.fill('existinguser');
  117 |     await usernameInput.blur();
  118 |     
  119 |     // 验证显示异步校验错误
  120 |     const errorMessage = page.locator('text=/用户名已被使用|username already exists/i').first();
> 121 |     await expect(errorMessage).toBeVisible();
      |                                ^ Error: expect(locator).toBeVisible() failed
  122 |   });
  123 | 
  124 |   test('登录链接 - 点击跳转到登录页', async ({ page }) => {
  125 |     const loginLink = page.locator('a[href="/login"], a:has-text("登录"), a:has-text("Login")').first();
  126 |     await loginLink.click();
  127 |     
  128 |     // 验证跳转到登录页
  129 |     await expect(page).toHaveURL(/.*\/login/);
  130 |   });
  131 | });
  132 | 
```
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth/register.spec.ts >> 注册页面 >> 注册成功 - 跳转到登录页或项目列表
- Location: tests/e2e/auth/register.spec.ts:76:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*\/(login|projects)/
Received string:  "http://localhost:3000/register"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    9 × unexpected value "http://localhost:3000/register"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - heading "注册" [level=2] [ref=e6]
    - generic [ref=e7]: 注册失败，请稍后重试
    - generic [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e10]: 用户名
        - textbox "请输入用户名" [ref=e11]: newuser1775301690773
      - generic [ref=e12]:
        - generic [ref=e13]: 邮箱
        - textbox "请输入邮箱" [ref=e14]: newuser1775301691584@example.com
      - generic [ref=e15]:
        - generic [ref=e16]: 密码
        - textbox "请输入密码（至少8位）" [ref=e17]: password123
      - button "注册" [ref=e18]
    - link "已有账号？立即登录" [ref=e20] [cursor=pointer]:
      - /url: /login
  - button "Open Next.js Dev Tools" [ref=e26] [cursor=pointer]:
    - img [ref=e27]
  - alert [ref=e30]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('注册页面', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto('/register');
  6   |   });
  7   | 
  8   |   test('页面元素渲染 - 显示注册表单', async ({ page }) => {
  9   |     // 验证页面标题
  10  |     await expect(page).toHaveTitle(/注册|Register/);
  11  |     
  12  |     // 验证用户名输入框存在
  13  |     const usernameInput = page.locator('input[name="username"], input[placeholder*="用户名"]').first();
  14  |     await expect(usernameInput).toBeVisible();
  15  |     
  16  |     // 验证邮箱输入框存在
  17  |     const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  18  |     await expect(emailInput).toBeVisible();
  19  |     
  20  |     // 验证密码输入框存在
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
> 89  |     await expect(page).toHaveURL(/.*\/(login|projects)/);
      |                        ^ Error: expect(page).toHaveURL(expected) failed
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
  121 |     await expect(errorMessage).toBeVisible();
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
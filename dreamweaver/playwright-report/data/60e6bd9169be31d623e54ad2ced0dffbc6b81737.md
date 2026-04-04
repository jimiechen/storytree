# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth/login.spec.ts >> 登录页面 >> 表单验证 - 邮箱格式无效
- Location: tests/e2e/auth/login.spec.ts:25:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=/邮箱格式|email format/i').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=/邮箱格式|email format/i').first()

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e4]:
    - heading "登录" [level=2] [ref=e6]
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]: 邮箱
        - textbox "请输入邮箱" [active] [ref=e10]: invalid-email
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
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('登录页面', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/login');
  6  |   });
  7  | 
  8  |   test('页面元素渲染 - 显示登录表单', async ({ page }) => {
  9  |     // 验证页面标题
  10 |     await expect(page).toHaveTitle(/登录|Login/);
  11 |     
  12 |     // 验证邮箱输入框存在
  13 |     const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="邮箱"]').first();
  14 |     await expect(emailInput).toBeVisible();
  15 |     
  16 |     // 验证密码输入框存在
  17 |     const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  18 |     await expect(passwordInput).toBeVisible();
  19 |     
  20 |     // 验证登录按钮存在
  21 |     const loginButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")').first();
  22 |     await expect(loginButton).toBeVisible();
  23 |   });
  24 | 
  25 |   test('表单验证 - 邮箱格式无效', async ({ page }) => {
  26 |     const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  27 |     const loginButton = page.locator('button[type="submit"]').first();
  28 |     
  29 |     // 输入无效邮箱
  30 |     await emailInput.fill('invalid-email');
  31 |     await loginButton.click();
  32 |     
  33 |     // 验证显示错误提示
  34 |     const errorMessage = page.locator('text=/邮箱格式|email format/i').first();
> 35 |     await expect(errorMessage).toBeVisible();
     |                                ^ Error: expect(locator).toBeVisible() failed
  36 |   });
  37 | 
  38 |   test('表单验证 - 密码为空', async ({ page }) => {
  39 |     const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  40 |     const loginButton = page.locator('button[type="submit"]').first();
  41 |     
  42 |     // 输入有效邮箱，不输入密码
  43 |     await emailInput.fill('test@example.com');
  44 |     await loginButton.click();
  45 |     
  46 |     // 验证显示错误提示
  47 |     const errorMessage = page.locator('text=/密码不能为空|password is required/i').first();
  48 |     await expect(errorMessage).toBeVisible();
  49 |   });
  50 | 
  51 |   test('登录成功 - 跳转到项目列表', async ({ page }) => {
  52 |     const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  53 |     const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  54 |     const loginButton = page.locator('button[type="submit"]').first();
  55 |     
  56 |     // 输入有效凭据
  57 |     await emailInput.fill('test@example.com');
  58 |     await passwordInput.fill('password123');
  59 |     await loginButton.click();
  60 |     
  61 |     // 验证跳转到项目列表页
  62 |     await expect(page).toHaveURL(/.*\/projects/);
  63 |   });
  64 | 
  65 |   test('登录失败 - 显示错误提示', async ({ page }) => {
  66 |     const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  67 |     const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  68 |     const loginButton = page.locator('button[type="submit"]').first();
  69 |     
  70 |     // 输入错误密码
  71 |     await emailInput.fill('test@example.com');
  72 |     await passwordInput.fill('wrongpassword');
  73 |     await loginButton.click();
  74 |     
  75 |     // 验证显示错误提示
  76 |     const errorMessage = page.locator('text=/邮箱或密码错误|invalid credentials/i').first();
  77 |     await expect(errorMessage).toBeVisible();
  78 |     
  79 |     // 验证仍在登录页
  80 |     await expect(page).toHaveURL(/.*\/login/);
  81 |   });
  82 | });
  83 | 
```
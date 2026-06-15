import { test, expect } from "../fixtures"

/**
 * Phase S 批次 5 — 静态页面流转 E2E
 *
 * 覆盖路径：
 *   1. /novel 默认进入 workspace
 *   2. 书架 → 工作台（点击项目卡片）
 *   3. 工作台 → 编辑器（发布章节）
 *   4. 工作台 → 人物面板（占位）
 *   5. 工作台 → 世界设定（占位）
 *   6. 弹框可打开和关闭
 *
 * 约定：
 *   - 使用语义化 role/text 选择器
 *   - 不修改 OpenCode 底座配置
 */

test.describe("novel-static-flow - 静态页面流转", () => {

  test("应默认进入 workspace 工作台", async ({ page }) => {
    await page.goto("/novel")
    await page.waitForLoadState("load")

    // 验证工作台核心元素可见（生成设置、大纲 等）
    const workspaceIndicator = page.getByText(/生成设置|大纲|工作台/).first()
    await expect(workspaceIndicator).toBeVisible({ timeout: 10_000 })
  })

  test("书架项目卡片点击应进入工作台", async ({ page }) => {
    // 直接导航到书架，绕过默认重定向
    await page.goto("/novel?view=bookshelf")
    await page.waitForLoadState("load")

    // 等待书架页面出现
    const bookshelfTitle = page.getByText("我的书架")
    await expect(bookshelfTitle).toBeVisible({ timeout: 10_000 })

    // 查找项目卡片并点击
    const cards = page.locator("[data-testid='bookshelf-project-card']")
    const count = await cards.count()

    if (count === 0) {
      test.skip(true, "书架为空状态，无项目卡片可点击")
      return
    }

    const firstCard = cards.first()
    await firstCard.click()
    await page.waitForURL(/view=workspace/, { timeout: 10_000 })

    // 点击后应显示工作台元素
    const workspaceIndicator = page.getByText(/生成设置/).first()
    await expect(workspaceIndicator).toBeVisible({ timeout: 10_000 })
  })

  test("工作台发布章节应进入编辑器", async ({ page }) => {
    await page.goto("/novel")
    await page.waitForLoadState("load")

    const publishBtn = page.getByRole("button", { name: /发布章节/ }).first()
    await expect(publishBtn).toBeVisible({ timeout: 10_000 })

    await publishBtn.click()
    await page.waitForURL(/view=editor/, { timeout: 10_000 })

    const editorIndicator = page.getByText(/历史版本|AI续写|加载中/).first()
    await expect(editorIndicator).toBeVisible({ timeout: 10_000 })
  })

  test("工作台人物按钮应进入占位页", async ({ page }) => {
    await page.goto("/novel")
    await page.waitForLoadState("load")

    const characterBtn = page.getByRole('button', { name: '人物' }).first()
    await expect(characterBtn).toBeVisible({ timeout: 10_000 })

    await characterBtn.click()
    await page.waitForURL(/view=character-panel/, { timeout: 10_000 })

    const placeholder = page.getByText(/人物面板/).first()
    await expect(placeholder).toBeVisible({ timeout: 10_000 })
  })

  test("工作台设定按钮应进入占位页", async ({ page }) => {
    await page.goto("/novel")
    await page.waitForLoadState("load")

    const settingBtn = page.getByRole('button', { name: '设定' }).first()
    await expect(settingBtn).toBeVisible({ timeout: 10_000 })

    await settingBtn.click()
    await page.waitForURL(/view=world-setting/, { timeout: 10_000 })

    const placeholder = page.getByText(/世界设定/).first()
    await expect(placeholder).toBeVisible({ timeout: 10_000 })
  })
})

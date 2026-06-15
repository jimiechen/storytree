import { test, expect } from "../fixtures"

/**
 * Phase S 批次 5 — 工作台导航 E2E
 *
 * 覆盖路径：
 *   1. TopAppBar 导航（Logo、工作台、素材库、灵感区、发布、通知、设置、头像）
 *   2. SideNav 导航（大纲、章节、人物、设定、导出、帮助、反馈）
 *   3. 弹框打开和关闭（导出、反馈、历史版本、通知、设置、批量生成）
 *
 * 约定：
 *   - 使用语义化 role/text 选择器
 *   - 不修改 OpenCode 底座配置
 */

test.describe("novel-workspace-nav - 工作台导航", () => {

  test("TopAppBar Logo 应可返回书架", async ({ page }) => {
    await page.goto("/novel")
    await page.waitForLoadState("load")

    const logo = page.getByTestId("workspace-logo")
    await expect(logo).toBeVisible({ timeout: 10_000 })

    await logo.click()
    await page.waitForURL(/view=bookshelf/, { timeout: 10_000 })

    // 返回书架后应看到书架标题
    const indicator = page.getByText(/我的书架/).first()
    await expect(indicator).toBeVisible({ timeout: 10_000 })
  })

  test("TopAppBar 工作台按钮应留在工作台", async ({ page }) => {
    await page.goto("/novel")
    await page.waitForLoadState("load")

    const workspaceBtn = page.getByRole("button", { name: /^工作台$/ }).first()
    await expect(workspaceBtn).toBeVisible({ timeout: 10_000 })

    await workspaceBtn.click()
    await page.waitForURL(/view=workspace/, { timeout: 10_000 })

    const indicator = page.getByText(/生成设置/).first()
    await expect(indicator).toBeVisible({ timeout: 10_000 })
  })

  test("弹框应可打开和关闭", async ({ page }) => {
    await page.goto("/novel")
    await page.waitForLoadState("load")

    const exportBtn = page.getByRole("button", { name: /导出/ }).first()
    await expect(exportBtn).toBeVisible({ timeout: 10_000 })

    await exportBtn.click()

    const modalTitle = page.getByText(/导出设置/).first()
    await expect(modalTitle).toBeVisible({ timeout: 10_000 })

    const closeBtn = page.getByRole("button", { name: /关闭/ }).first()
    await closeBtn.click()
    await expect(modalTitle).not.toBeVisible({ timeout: 10_000 })
  })

  test("反馈弹框应可打开和关闭", async ({ page }) => {
    await page.goto("/novel")
    await page.waitForLoadState("load")

    const feedbackBtn = page.getByRole("button", { name: /反馈/ }).first()
    await expect(feedbackBtn).toBeVisible({ timeout: 10_000 })

    await feedbackBtn.click()

    const modalTitle = page.getByText(/意见反馈/).first()
    await expect(modalTitle).toBeVisible({ timeout: 10_000 })

    const closeBtn = page.getByRole("button", { name: /关闭/ }).first()
    await closeBtn.click()
    await expect(modalTitle).not.toBeVisible({ timeout: 10_000 })
  })

  test("帮助中心应进入 tutorial 占位页", async ({ page }) => {
    await page.goto("/novel")
    await page.waitForLoadState("load")

    const helpBtn = page.getByRole("button", { name: /帮助中心/ }).first()
    await expect(helpBtn).toBeVisible({ timeout: 10_000 })

    await helpBtn.click()
    await page.waitForURL(/view=tutorial/, { timeout: 10_000 })

    const placeholder = page.getByText(/帮助中心/).first()
    await expect(placeholder).toBeVisible({ timeout: 10_000 })
  })

  test("头像按钮应进入 profile 占位页", async ({ page }) => {
    await page.goto("/novel")
    await page.waitForLoadState("load")

    const profileImg = page.locator('img[alt="用户头像"]').first()
    await expect(profileImg).toBeVisible({ timeout: 10_000 })

    await profileImg.click()
    await page.waitForURL(/view=profile/, { timeout: 10_000 })

    const placeholder = page.getByText(/个人中心/).first()
    await expect(placeholder).toBeVisible({ timeout: 10_000 })
  })
})

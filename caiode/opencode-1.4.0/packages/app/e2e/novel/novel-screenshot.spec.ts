/**
 * @file novel-screenshot.spec.ts
 * @description Playwright 截图测试 — 截取关键页面画面供主控审核
 * @phase Phase W — Stitch 视觉对比
 */

import { test } from "@playwright/test"
import * as path from "path"
import * as fs from "fs"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SCREENSHOT_DIR = path.resolve(__dirname, "../../../../docs/reports/stitch-comparison/screenshots")

// 确保截图目录存在
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

test.describe("novel-screenshot — 关键页面截图", () => {

  test("工作台 /novel 截图", async ({ page }) => {
    await page.goto("/novel")
    await page.waitForLoadState("load")
    await page.waitForTimeout(1500)

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "01-workspace.png"),
      fullPage: false,
    })
  })

  test("书架 /novel?view=bookshelf 截图", async ({ page }) => {
    await page.goto("/novel?view=bookshelf")
    await page.waitForLoadState("load")
    await page.waitForTimeout(1500)

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "02-bookshelf.png"),
      fullPage: false,
    })
  })

  test("编辑器 /novel?view=editor 截图", async ({ page }) => {
    await page.goto("/novel?view=editor")
    await page.waitForLoadState("load")
    await page.waitForTimeout(1500)

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "03-editor.png"),
      fullPage: false,
    })
  })

  test("人物面板 /novel?view=character-panel 截图", async ({ page }) => {
    await page.goto("/novel?view=character-panel")
    await page.waitForLoadState("load")
    await page.waitForTimeout(1500)

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "04-character-panel.png"),
      fullPage: false,
    })
  })

  test("世界设定 /novel?view=world-setting 截图", async ({ page }) => {
    await page.goto("/novel?view=world-setting")
    await page.waitForLoadState("load")
    await page.waitForTimeout(1500)

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "05-world-setting.png"),
      fullPage: false,
    })
  })

  test("个人中心 /novel?view=profile 截图", async ({ page }) => {
    await page.goto("/novel?view=profile")
    await page.waitForLoadState("load")
    await page.waitForTimeout(1500)

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "06-profile.png"),
      fullPage: false,
    })
  })

  test("帮助中心 /novel?view=tutorial 截图", async ({ page }) => {
    await page.goto("/novel?view=tutorial")
    await page.waitForLoadState("load")
    await page.waitForTimeout(1500)

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "07-tutorial.png"),
      fullPage: false,
    })
  })

  test("弹框 — 导出设置截图", async ({ page }) => {
    await page.goto("/novel")
    await page.waitForLoadState("load")
    await page.waitForTimeout(1000)

    // 点击导出按钮打开弹框
    const exportBtn = page.getByRole("button", { name: "导出" }).first()
    if (await exportBtn.isVisible().catch(() => false)) {
      await exportBtn.click()
      await page.waitForTimeout(1000)
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "08-modal-export.png"),
        fullPage: false,
      })
    }
  })
})

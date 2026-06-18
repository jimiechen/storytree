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
    // 直接访问 workspace，避免 onMount 重定向的中间状态
    await page.goto("/novel?view=workspace")
    await page.waitForLoadState("load")
    // 工作台冷启动编译较慢，给足等待时间
    await page.waitForSelector("[data-testid='workspace-logo']", { timeout: 20_000 })
    await page.waitForTimeout(1000)

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
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto("/novel?view=editor")
    await page.waitForLoadState("load")
    await page.waitForSelector('[contenteditable]', { timeout: 10_000 })
    await page.waitForTimeout(1500)

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "03-editor.png"),
      fullPage: true,
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
    await page.waitForSelector("[data-testid='workspace-logo']", { timeout: 10_000 })
    await page.waitForTimeout(1000)

    // 点击 SideNav 中的导出按钮打开弹框
    const exportBtn = page.locator("button:text-is('导出')").first()
    if (await exportBtn.isVisible().catch(() => false)) {
      await exportBtn.click()
      // 等待模态框出现（遮罩层 + 标题）
      await page.waitForSelector("text=导出设置", { timeout: 5_000 })
      await page.waitForTimeout(500)
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "08-modal-export.png"),
        fullPage: false,
      })
    } else {
      // 备用：直接通过导航触发
      await page.evaluate(() => {
        // 尝试找到并点击包含"导出"文本的可点击元素
        const btns = Array.from(document.querySelectorAll('button'))
        const exportBtn = btns.find(b => b.textContent?.includes('导出'))
        if (exportBtn) exportBtn.click()
      })
      await page.waitForTimeout(1000)
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "08-modal-export.png"),
        fullPage: false,
      })
    }
  })
})

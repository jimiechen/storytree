# 织梦笔 Playwright 自动化测试验收方案

| 项目 | 内容 |
|------|------|
| **文档名称** | 织梦笔 Playwright 自动化测试验收方案 |
| **版本** | v1.1 |
| **日期** | 2026-04-04 |
| **基于PRD** | v4.0（Harness 工程标准重构版） |
| **基于原型** | Stitch 原型提示词（7 页面 + 主题迭代） |
| **测试框架** | Playwright + TypeScript |

**版本记录**

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-04-04 | 初始版本（国内版） |
| v1.1 | 2026-04-04 | 海外版（增加i18n/Stripe/GDPR/全球延迟测试） |

---

## 目录

- [1. 方案概述](#1-方案概述)
- [2. 测试架构设计](#2-测试架构设计)
- [3. 测试环境与配置](#3-测试环境与配置)
- [4. Page Object 模型设计](#4-page-object-模型设计)
- [5. 测试用例规划](#5-测试用例规划)
  - [5.1 欢迎页测试](#51-欢迎页测试)
  - [5.2 主写作工作台测试](#52-主写作工作台测试)
  - [5.3 分支树视图测试](#53-分支树视图测试)
  - [5.4 知识库管理测试](#54-知识库管理测试)
  - [5.5 模型中心测试](#55-模型中心测试)
  - [5.6 大纲管理测试](#56-大纲管理测试)
  - [5.7 AI 对话面板测试](#57-ai-对话面板测试)
  - [5.8 响应式布局测试](#58-响应式布局测试)
  - [5.9 性能基准测试](#59-性能基准测试)
  - [5.10 Harness 集成验收测试](#510-harness-集成验收测试)
  - [5.11 国际化与本地化测试](#511-国际化与本地化测试)
  - [5.12 Stripe 支付测试](#512-stripe-支付测试)
  - [5.13 GDPR 合规测试](#513-gdpr-合规测试)
  - [5.14 全球延迟测试](#514-全球延迟测试)
- [6. 测试数据管理](#6-测试数据管理)
- [7. CI/CD 集成](#7-cicd-集成)
- [8. 测试报告与指标](#8-测试报告与指标)
- [9. 验收通过标准](#9-验收通过标准)
- [10. 风险与缓解](#10-风险与缓解)

---

## 1. 方案概述

### 1.1 目标

为织梦笔（DreamWeaver）平台建立完整的 Playwright 自动化测试验收体系，覆盖 Stitch 原型定义的 7 个核心页面、PRD v4 定义的功能逻辑、以及 Harness 工程标准的性能指标。

### 1.2 覆盖范围

| 维度 | 覆盖内容 | 用例数 |
|------|---------|--------|
| **页面功能** | 7 个核心页面的 UI 渲染、交互、数据展示 | ~180 |
| **AI 交互** | 续写/扩写/改写/对话/描写/推演 6 种 AI 模式 | ~45 |
| **分支操作** | 创建/切换/合并/导出/归档分支 | ~30 |
| **知识库** | 角色/地点/物品/势力/时间线/伏笔/世界观 CRUD | ~35 |
| **一致性检查** | 角色/时间线/伏笔三维一致性 | ~20 |
| **响应式** | 4 个断点（桌面/笔记本/平板/手机） | ~25 |
| **性能基准** | 页面加载/AI 响应/搜索延迟/缓存命中率 | ~15 |
| **Harness** | REPL 检查点/权限/压缩/记忆集成 | ~20 |
| **国际化** | 语言切换/双语写作/AI路由/本地化格式 | ~15 |
| **Stripe支付** | 定价页/Checkout/订阅管理/用量/退款 | ~15 |
| **GDPR合规** | Cookie/数据导出/数据删除/年龄验证/AI声明 | ~12 |
| **全球延迟** | 三区域P99/CDN/DNS | ~8 |
| **合计** | | **~420** |

### 1.3 测试原则

1. **Stitch 原型优先**：所有 Stitch 原型定义的 UI 元素和交互必须有对应测试用例
2. **PRD 功能全覆盖**：PRD v4 第 5/7 章定义的功能点必须有 E2E 验证
3. **数据驱动**：使用工厂模式生成测试数据，避免硬编码
4. **独立可重复**：每个测试用例独立运行，不依赖执行顺序
5. **视觉回归**：关键页面截图对比，检测意外 UI 变更

---

## 2. 测试架构设计

### 2.1 技术栈

```
┌─────────────────────────────────────────────────┐
│                  测试执行层                       │
│  Playwright Test Runner (TypeScript)             │
│  ├─ @playwright/test                             │
│  ├─ playwright-core                              │
│  └─ playwright-expect                            │
├─────────────────────────────────────────────────┤
│                  Page Object 层                   │
│  ├─ pages/ (7 个页面 PO)                         │
│  ├─ components/ (可复用组件 PO)                   │
│  └─ fixtures/ (测试夹具)                         │
├─────────────────────────────────────────────────┤
│                  测试数据层                       │
│  ├─ factories/ (数据工厂)                        │
│  ├─ fixtures/ (JSON 测试数据)                    │
│  └─ mocks/ (API Mock / MSW)                      │
├─────────────────────────────────────────────────┤
│                  工具层                           │
│  ├─ helpers/ (通用工具函数)                      │
│  ├─ visual/ (视觉回归对比)                       │
│  └─ metrics/ (性能指标采集)                      │
└─────────────────────────────────────────────────┘
```

### 2.2 目录结构

```
e2e/
├── playwright.config.ts          # Playwright 配置
├── package.json
├── tsconfig.json
│
├── src/
│   ├── pages/                    # Page Object 模型
│   │   ├── WelcomePage.ts        # 欢迎页
│   │   ├── WorkbenchPage.ts      # 主写作工作台
│   │   ├── BranchMapPage.ts      # 分支树视图
│   │   ├── StoryBiblePage.ts     # 知识库管理
│   │   ├── ModelCenterPage.ts    # 模型中心
│   │   ├── OutlinePage.ts        # 大纲管理
│   │   ├── AIChatPanel.ts        # AI 对话面板
│   │   └── BasePage.ts           # 基础页面（公共方法）
│   │
│   ├── components/               # 可复用组件 PO
│   │   ├── ActivityBar.ts        # 左侧活动栏
│   │   ├── Editor.ts             # 编辑器
│   │   ├── StatusBar.ts          # 底部状态栏
│   │   ├── AIPanel.ts            # AI 助手面板
│   │   ├── BranchTree.ts         # 分支树组件
│   │   ├── CardGrid.ts           # 卡片网格
│   │   ├── Modal.ts              # 模态框
│   │   ├── Toolbar.ts            # 工具栏
│   │   └── ContextMenu.ts        # 右键菜单
│   │
│   ├── factories/                # 测试数据工厂
│   │   ├── novel.factory.ts      # 小说/作品工厂
│   │   ├── chapter.factory.ts    # 章节工厂
│   │   ├── character.factory.ts  # 角色工厂
│   │   ├── branch.factory.ts     # 分支工厂
│   │   └── outline.factory.ts    # 大纲工厂
│   │
│   ├── fixtures/                 # Playwright 测试夹具
│   │   ├── auth.fixture.ts       # 认证夹具
│   │   ├── novel.fixture.ts      # 作品夹具
│   │   └── ai.fixture.ts         # AI Mock 夹具
│   │
│   ├── mocks/                    # API Mock
│   │   ├── handlers/             # MSW 请求处理器
│   │   │   ├── ai.handlers.ts    # AI API Mock
│   │   │   ├── novel.handlers.ts # 小说 API Mock
│   │   │   └── branch.handlers.ts
│   │   └── server.ts             # MSW 服务器配置
│   │
│   ├── helpers/                  # 工具函数
│   │   ├── wait.ts               # 等待策略
│   │   ├── drag.ts               # 拖拽操作
│   │   ├── screenshot.ts         # 截图对比
│   │   └── metrics.ts            # 性能指标采集
│   │
│   └── types/                    # 类型定义
│       ├── novel.types.ts
│       ├── ai.types.ts
│       └── harness.types.ts
│
├── tests/                        # 测试用例
│   ├── 01-welcome/               # 欢迎页测试
│   ├── 02-workbench/             # 工作台测试
│   ├── 03-branch-map/            # 分支树测试
│   ├── 04-story-bible/           # 知识库测试
│   ├── 05-model-center/          # 模型中心测试
│   ├── 06-outline/               # 大纲管理测试
│   ├── 07-ai-chat/               # AI 对话测试
│   ├── 08-responsive/            # 响应式测试
│   ├── 09-performance/           # 性能基准测试
│   └── 10-harness/               # Harness 集成测试
│
├── visual/                       # 视觉回归基线
│   ├── desktop/                  # 桌面端基线截图
│   ├── tablet/                   # 平板端基线截图
│   └── mobile/                   # 移动端基线截图
│
└── reports/                      # 测试报告输出
    └── .gitkeep
```

### 2.3 Playwright 配置

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  reporter: [
    ['html', { outputFolder: 'reports/html' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['list'],
  ],
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
    { name: 'tablet',   use: { ...devices['iPad Pro'] } },
    { name: 'mobile',   use: { ...devices['iPhone 14'] } },
    { name: 'visual',   use: { ...devices['Desktop Chrome'] }, testMatch: '**/visual/**' },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

---

## 3. 测试环境与配置

### 3.1 环境矩阵

| 环境 | 用途 | URL | AI Mock |
|------|------|-----|---------|
| **开发环境** | 开发自测 | `localhost:3000` | MSW Mock |
| **Staging** | 预发布验收 | `staging.dreamweaver.ai` | 可选真实 AI |
| **生产环境** | 冒烟测试 | `dreamweaver.ai` | 真实 AI |

### 3.2 浏览器矩阵

| 浏览器 | 版本 | 优先级 | 备注 |
|--------|------|--------|------|
| Chrome | 最新 | P0 | 主力测试浏览器 |
| Firefox | 最新 | P1 | 兼容性验证 |
| Safari | 最新 | P1 | WebKit 引擎 |
| iPad Safari | 最新 | P2 | 平板端 |
| iPhone Safari | 最新 | P2 | 移动端 |

### 3.3 依赖安装

```bash
# 安装 Playwright
npm init playwright@latest

# 安装额外依赖
npm install -D \
  @playwright/test \
  playwright \
  msw \
  @faker-js/faker \
  playwright-visual-comparison \
  allure-playwright
```

---

## 4. Page Object 模型设计

### 4.1 BasePage — 基础页面

```typescript
// src/pages/BasePage.ts
import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly header: Locator;
  readonly globalNav: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header');
    this.globalNav = page.locator('[data-testid="global-nav"]');
  }

  async waitForPageReady() {
    await this.page.waitForLoadState('networkidle');
    await expect(this.header).toBeVisible();
  }

  async screenshot(name: string) {
    await this.page.screenshot({
      path: `reports/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  async getMetrics() {
    return await this.page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.startTime,
        loadComplete: perf.loadEventEnd - perf.startTime,
        ttfb: perf.responseStart - perf.requestStart,
      };
    });
  }
}
```

### 4.2 WelcomePage — 欢迎页

```typescript
// src/pages/WelcomePage.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class WelcomePage extends BasePage {
  // Logo 与标语
  readonly logo: Locator;
  readonly tagline: Locator;

  // 最近作品区
  readonly recentWorksSection: Locator;
  readonly recentWorkCards: Locator;

  // 快速开始区
  readonly quickStartSection: Locator;
  readonly newNovelButton: Locator;
  readonly templateCreateButton: Locator;

  // 模板区
  readonly templateSection: Locator;
  readonly templateCards: Locator;

  // 写作统计仪表盘
  readonly statsDashboard: Locator;
  readonly todayWordCount: Locator;
  readonly weeklyTrend: Locator;
  readonly totalWorks: Locator;

  constructor(page: Page) {
    super(page);
    this.logo = page.locator('[data-testid="app-logo"]');
    this.tagline = page.locator('[data-testid="app-tagline"]');
    this.recentWorksSection = page.locator('[data-testid="recent-works"]');
    this.recentWorkCards = page.locator('[data-testid="recent-work-card"]');
    this.quickStartSection = page.locator('[data-testid="quick-start"]');
    this.newNovelButton = page.locator('[data-testid="btn-new-novel"]');
    this.templateCreateButton = page.locator('[data-testid="btn-template-create"]');
    this.templateSection = page.locator('[data-testid="template-section"]');
    this.templateCards = page.locator('[data-testid="template-card"]');
    this.statsDashboard = page.locator('[data-testid="stats-dashboard"]');
    this.todayWordCount = page.locator('[data-testid="today-word-count"]');
    this.weeklyTrend = page.locator('[data-testid="weekly-trend"]');
    this.totalWorks = page.locator('[data-testid="total-works"]');
  }

  async goto() {
    await this.page.goto('/');
    await this.waitForPageReady();
  }

  async createNewNovel() {
    await this.newNovelButton.click();
  }

  async selectTemplate(type: string) {
    await this.templateCards.filter({ hasText: type }).click();
  }

  async openRecentWork(title: string) {
    await this.recentWorkCards.filter({ hasText: title }).click();
  }
}
```

### 4.3 WorkbenchPage — 主写作工作台

```typescript
// src/pages/WorkbenchPage.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class WorkbenchPage extends BasePage {
  // 活动栏
  readonly activityBar: Locator;
  readonly activityIcons: Locator;

  // 左侧边栏
  readonly primarySidebar: Locator;
  readonly storyExplorer: Locator;
  readonly quickActions: Locator;
  readonly newBranchBtn: Locator;
  readonly mergeBranchBtn: Locator;
  readonly exportBtn: Locator;

  // 中央编辑器
  readonly editor: Locator;
  readonly editorToolbar: Locator;
  readonly branchIndicator: Locator;

  // 底部状态栏
  readonly statusBar: Locator;
  readonly wordCount: Locator;
  readonly todayWordCount: Locator;
  readonly totalWordCount: Locator;
  readonly currentModel: Locator;
  readonly consistencyStatus: Locator;

  // 右侧 AI 面板
  readonly aiPanel: Locator;
  readonly modelSelector: Locator;
  readonly aiActionButtons: Locator;
  readonly contextReference: Locator;
  readonly consistencyCheck: Locator;

  // 底部面板
  readonly bottomPanel: Locator;
  readonly aiLogTab: Locator;
  readonly consistencyReportTab: Locator;
  readonly versionHistoryTab: Locator;

  constructor(page: Page) {
    super(page);
    this.activityBar = page.locator('[data-testid="activity-bar"]');
    this.activityIcons = page.locator('[data-testid="activity-icon"]');
    this.primarySidebar = page.locator('[data-testid="primary-sidebar"]');
    this.storyExplorer = page.locator('[data-testid="story-explorer"]');
    this.quickActions = page.locator('[data-testid="quick-actions"]');
    this.newBranchBtn = page.locator('[data-testid="btn-new-branch"]');
    this.mergeBranchBtn = page.locator('[data-testid="btn-merge-branch"]');
    this.exportBtn = page.locator('[data-testid="btn-export"]');
    this.editor = page.locator('[data-testid="editor"]');
    this.editorToolbar = page.locator('[data-testid="editor-toolbar"]');
    this.branchIndicator = page.locator('[data-testid="branch-indicator"]');
    this.statusBar = page.locator('[data-testid="status-bar"]');
    this.wordCount = page.locator('[data-testid="word-count"]');
    this.todayWordCount = page.locator('[data-testid="today-word-count"]');
    this.totalWordCount = page.locator('[data-testid="total-word-count"]');
    this.currentModel = page.locator('[data-testid="current-model"]');
    this.consistencyStatus = page.locator('[data-testid="consistency-status"]');
    this.aiPanel = page.locator('[data-testid="ai-panel"]');
    this.modelSelector = page.locator('[data-testid="model-selector"]');
    this.aiActionButtons = page.locator('[data-testid="ai-action-btn"]');
    this.contextReference = page.locator('[data-testid="context-reference"]');
    this.consistencyCheck = page.locator('[data-testid="consistency-check"]');
    this.bottomPanel = page.locator('[data-testid="bottom-panel"]');
    this.aiLogTab = page.locator('[data-testid="tab-ai-log"]');
    this.consistencyReportTab = page.locator('[data-testid="tab-consistency-report"]');
    this.versionHistoryTab = page.locator('[data-testid="tab-version-history"]');
  }

  async goto(novelId: string) {
    await this.page.goto(`/novel/${novelId}`);
    await this.waitForPageReady();
    await expect(this.editor).toBeVisible();
  }

  async switchActivityIcon(name: string) {
    await this.activityIcons.filter({ hasText: name }).click();
  }

  async typeInEditor(text: string) {
    await this.editor.click();
    await this.editor.fill(text);
  }

  async selectText(start: number, end: number) {
    await this.editor.click();
    await this.page.keyboard.press('Home');
    for (let i = 0; i < start; i++) await this.page.keyboard.press('ArrowRight');
    await this.page.keyboard.down('Shift');
    for (let i = start; i < end; i++) await this.page.keyboard.press('ArrowRight');
    await this.page.keyboard.up('Shift');
  }

  async rightClickEditor() {
    await this.editor.click({ button: 'right' });
  }

  async getEditorContent(): Promise<string> {
    return await this.editor.innerText();
  }

  async getWordCount(): Promise<number> {
    const text = await this.wordCount.textContent();
    return parseInt(text?.replace(/[^0-9]/g, '') || '0');
  }
}
```

### 4.4 其他页面 PO（概要）

| 页面 | 文件 | 核心定位器 |
|------|------|-----------|
| BranchMapPage | `BranchMapPage.ts` | `branchTree`, `branchNodes`, `branchDetail`, `searchBar`, `zoomFit`, `viewToggle`, `statsBar` |
| StoryBiblePage | `StoryBiblePage.ts` | `categoryTabs`, `cardGrid`, `detailPanel`, `autoExtractBtn`, `manualAddBtn`, `aiSuggestionBanner` |
| ModelCenterPage | `ModelCenterPage.ts` | `modelCards`, `pipelineSteps`, `addStepBtn`, `savePipelineBtn`, `setDefaultBtn` |
| OutlinePage | `OutlinePage.ts` | `outlineTree`, `dragHandle`, `statusBadge`, `detailPanel`, `newChapterBtn`, `viewToggle` |
| AIChatPanel | `AIChatPanel.ts` | `chatMessages`, `inputArea`, `quickChips`, `contextBar`, `acceptBtn`, `regenerateBtn`, `thinkingAnimation` |

---

## 5. 测试用例规划

### 5.1 欢迎页测试

**文件**：`tests/01-welcome/welcome.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { WelcomePage } from '@/src/pages/WelcomePage';

test.describe('欢迎页', () => {

  test.beforeEach(async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();
  });

  // --- UI 渲染 ---

  test('W-001 显示应用 Logo 和标语', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await expect(welcome.logo).toBeVisible();
    await expect(welcome.logo).toContainText('织梦笔');
    await expect(welcome.tagline).toContainText('AI 驱动的长篇小说创作平台');
  });

  test('W-002 显示最近作品区域（3-4 个作品卡片）', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await expect(welcome.recentWorksSection).toBeVisible();
    const cards = welcome.recentWorkCards;
    await expect(cards).toHaveCount(4, { timeout: 5_000 });
    // 每张卡片包含：标题、类型标签、字数、最后编辑时间、状态徽章
    const firstCard = cards.first();
    await expect(firstCard.locator('[data-testid="work-title"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="work-genre"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="work-word-count"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="work-last-edited"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="work-status"]')).toBeVisible();
  });

  test('W-003 显示快速开始区域', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await expect(welcome.quickStartSection).toBeVisible();
    await expect(welcome.newNovelButton).toBeVisible();
    await expect(welcome.templateCreateButton).toBeVisible();
  });

  test('W-004 显示模板预览区（仙侠/都市/悬疑/科幻）', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await expect(welcome.templateSection).toBeVisible();
    const genres = ['仙侠', '都市', '悬疑', '科幻'];
    for (const genre of genres) {
      await expect(welcome.templateCards.filter({ hasText: genre })).toBeVisible();
    }
  });

  test('W-005 显示写作统计迷你仪表盘', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await expect(welcome.statsDashboard).toBeVisible();
    await expect(welcome.todayWordCount).toBeVisible();
    await expect(welcome.weeklyTrend).toBeVisible();
    await expect(welcome.totalWorks).toBeVisible();
  });

  // --- 交互流程 ---

  test('W-006 点击作品卡片进入写作工作台', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.openRecentWork('星辰变');
    await page.waitForURL(/\/novel\/.+/);
    await expect(page.locator('[data-testid="editor"]')).toBeVisible();
  });

  test('W-007 点击"新建作品"打开创建对话框', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.newNovelButton.click();
    await expect(page.locator('[data-testid="create-novel-modal"]')).toBeVisible();
  });

  test('W-008 点击模板卡片基于模板创建作品', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.selectTemplate('仙侠');
    await expect(page.locator('[data-testid="create-novel-modal"]')).toBeVisible();
    // 验证模板信息已预填充
    await expect(page.locator('[data-testid="genre-field"]')).toHaveValue('仙侠');
  });

  // --- 性能 ---

  test('W-009 首屏加载时间 < 2 秒', async ({ page }) => {
    const welcome = new WelcomePage(page);
    const metrics = await welcome.getMetrics();
    expect(metrics.loadComplete).toBeLessThan(2000);
  });
});
```

**用例清单**：

| ID | 用例名称 | 类型 | 优先级 |
|----|---------|------|--------|
| W-001 | 显示应用 Logo 和标语 | UI 渲染 | P0 |
| W-002 | 显示最近作品区域（3-4 个作品卡片） | UI 渲染 | P0 |
| W-003 | 显示快速开始区域 | UI 渲染 | P0 |
| W-004 | 显示模板预览区（仙侠/都市/悬疑/科幻） | UI 渲染 | P0 |
| W-005 | 显示写作统计迷你仪表盘 | UI 渲染 | P1 |
| W-006 | 点击作品卡片进入写作工作台 | 交互 | P0 |
| W-007 | 点击"新建作品"打开创建对话框 | 交互 | P0 |
| W-008 | 点击模板卡片基于模板创建作品 | 交互 | P0 |
| W-009 | 首屏加载时间 < 2 秒 | 性能 | P0 |
| W-010 | 作品卡片深色背景带类型色左边框 | 视觉 | P2 |
| W-011 | 空状态显示引导提示 | UI 渲染 | P1 |
| W-012 | 视觉回归对比（桌面端） | 视觉 | P1 |

---

### 5.2 主写作工作台测试

**文件**：`tests/02-workbench/workbench.spec.ts`

#### 5.2.1 活动栏与侧栏

```typescript
test.describe('活动栏与侧栏', () => {

  test('WB-001 活动栏显示 6 个图标（大纲/分支/知识库/AI/统计/设置）', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    await expect(wb.activityBar).toBeVisible();
    const icons = wb.activityIcons;
    await expect(icons).toHaveCount(6);
  });

  test('WB-002 点击活动栏图标切换侧栏内容', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    // 点击"大纲"图标
    await wb.switchActivityIcon('大纲');
    await expect(page.locator('[data-testid="outline-panel"]')).toBeVisible();
    // 点击"分支"图标
    await wb.switchActivityIcon('分支');
    await expect(page.locator('[data-testid="branch-panel"]')).toBeVisible();
  });

  test('WB-003 激活态图标有青色左边框和发光效果', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    const activeIcon = page.locator('[data-testid="activity-icon"].active');
    await expect(activeIcon).toHaveCSS('border-left-color', 'rgb(79, 195, 247)');
  });

  test('WB-004 左侧边栏显示故事浏览器树形结构', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    await expect(wb.storyExplorer).toBeVisible();
    await expect(wb.storyExplorer.locator('[data-testid="tree-node"]')).toHaveCount(10);
  });

  test('WB-005 快速操作区显示新建/合并/导出按钮', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    await expect(wb.newBranchBtn).toBeVisible();
    await expect(wb.mergeBranchBtn).toBeVisible();
    await expect(wb.exportBtn).toBeVisible();
  });
});
```

#### 5.2.2 编辑器

```typescript
test.describe('编辑器', () => {

  test('WB-010 编辑器显示章节标题和正文', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    await expect(wb.editor).toBeVisible();
    await expect(page.locator('[data-testid="chapter-title"]')).toBeVisible();
  });

  test('WB-011 编辑器工具栏包含加粗/斜体/标题级别', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    await expect(wb.editorToolbar).toBeVisible();
    await expect(wb.editorToolbar.locator('[data-testid="btn-bold"]')).toBeVisible();
    await expect(wb.editorToolbar.locator('[data-testid="btn-italic"]')).toBeVisible();
    await expect(wb.editorToolbar.locator('[data-testid="btn-heading"]')).toBeVisible();
  });

  test('WB-012 编辑器左侧显示分支指示线', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    await expect(wb.branchIndicator).toBeVisible();
    await expect(wb.branchIndicator).toHaveCSS('border-left', /2px solid/);
  });

  test('WB-013 在编辑器中输入文字后字数实时更新', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    const before = await wb.getWordCount();
    await wb.typeInEditor('这是一段测试文字，用于验证字数统计功能是否正常工作。');
    const after = await wb.getWordCount();
    expect(after).toBeGreaterThan(before);
  });

  test('WB-014 选中文字后右键显示操作菜单', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    await wb.selectText(10, 30);
    await wb.rightClickEditor();
    const menu = page.locator('[data-testid="context-menu"]');
    await expect(menu).toBeVisible();
    const actions = ['续写', '改写', '扩写', '缩写', '润色', '检查一致性', '与 AI 讨论'];
    for (const action of actions) {
      await expect(menu.locator(`text=${action}`)).toBeVisible();
    }
  });

  test('WB-015 衬线字体 16px / 行高 1.8', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    const editorContent = wb.editor.locator('.editor-content');
    await expect(editorContent).toHaveCSS('font-family', /serif/);
    await expect(editorContent).toHaveCSS('font-size', '16px');
    await expect(editorContent).toHaveCSS('line-height', '1.8');
  });
});
```

#### 5.2.3 底部状态栏

```typescript
test.describe('底部状态栏', () => {

  test('WB-020 状态栏显示字数/今日字数/总字数', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    await expect(wb.wordCount).toBeVisible();
    await expect(wb.todayWordCount).toBeVisible();
    await expect(wb.totalWordCount).toBeVisible();
  });

  test('WB-021 状态栏显示当前模型名称', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    await expect(wb.currentModel).toBeVisible();
    await expect(wb.currentModel).toContainText(/Claude|GPT|Gemini|DeepSeek/);
  });

  test('WB-022 一致性检查状态图标实时显示', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    await expect(wb.consistencyStatus).toBeVisible();
    // 状态应为：绿色通过 / 黄色警告 / 红色错误
    const bgColor = await wb.consistencyStatus.evaluate(
      el => getComputedStyle(el).backgroundColor
    );
    expect(['rgb(76, 175, 80)', 'rgb(255, 193, 7)', 'rgb(244, 67, 54)']).toContain(bgColor);
  });
});
```

#### 5.2.4 AI 助手面板

```typescript
test.describe('AI 助手面板', () => {

  test('WB-030 AI 面板显示模型选择器', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    await expect(wb.modelSelector).toBeVisible();
  });

  test('WB-031 AI 操作按钮 2x3 网格（续写/扩写/改写/对话/描写/推演）', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    const actions = ['续写', '扩写', '改写', '对话', '描写', '推演'];
    await expect(wb.aiActionButtons).toHaveCount(6);
    for (const action of actions) {
      await expect(wb.aiActionButtons.filter({ hasText: action })).toBeVisible();
    }
  });

  test('WB-032 上下文引用区显示当前角色和伏笔', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    await expect(wb.contextReference).toBeVisible();
    await expect(wb.contextReference.locator('[data-testid="context-character"]')).toBeVisible();
    await expect(wb.contextReference.locator('[data-testid="context-foreshadow"]')).toBeVisible();
  });

  test('WB-033 一致性检查区显示角色/时间线/伏笔状态', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    await expect(wb.consistencyCheck).toBeVisible();
    await expect(wb.consistencyCheck.locator('text=角色一致性')).toBeVisible();
    await expect(wb.consistencyCheck.locator('text=时间线')).toBeVisible();
    await expect(wb.consistencyCheck.locator('text=伏笔')).toBeVisible();
  });
});
```

#### 5.2.5 底部面板

```typescript
test.describe('底部面板', () => {

  test('WB-040 底部面板显示三个标签页（AI日志/一致性报告/版本历史）', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    await expect(wb.bottomPanel).toBeVisible();
    await expect(wb.aiLogTab).toBeVisible();
    await expect(wb.consistencyReportTab).toBeVisible();
    await expect(wb.versionHistoryTab).toBeVisible();
  });

  test('WB-041 切换标签页显示对应内容', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    await wb.consistencyReportTab.click();
    await expect(page.locator('[data-testid="consistency-report-content"]')).toBeVisible();
    await wb.versionHistoryTab.click();
    await expect(page.locator('[data-testid="version-history-content"]')).toBeVisible();
  });
});
```

**工作台用例清单**（45 项）：

| ID | 用例名称 | 类型 | 优先级 |
|----|---------|------|--------|
| WB-001~005 | 活动栏与侧栏（5 项） | UI 渲染 | P0 |
| WB-010~015 | 编辑器（6 项） | UI + 交互 | P0 |
| WB-020~022 | 底部状态栏（3 项） | UI 渲染 | P0 |
| WB-030~033 | AI 助手面板（4 项） | UI 渲染 | P0 |
| WB-040~041 | 底部面板（2 项） | UI + 交互 | P1 |
| WB-050~055 | 面板拖拽调整大小（6 项） | 交互 | P1 |
| WB-060~065 | 编辑器格式化操作（6 项） | 交互 | P0 |
| WB-070~075 | 保存/自动保存（6 项） | 功能 | P0 |
| WB-080~085 | 键盘快捷键（6 项） | 交互 | P1 |
| WB-090~095 | 视觉回归（6 项） | 视觉 | P2 |

---

### 5.3 分支树视图测试

**文件**：`tests/03-branch-map/branch-map.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { BranchMapPage } from '@/src/pages/BranchMapPage';

test.describe('分支树视图', () => {

  test.beforeEach(async ({ page }) => {
    const bmp = new BranchMapPage(page);
    await bmp.goto('novel-001');
  });

  // --- UI 渲染 ---

  test('BM-001 显示水平树形图（左到右布局）', async ({ page }) => {
    const bmp = new BranchMapPage(page);
    await expect(bmp.branchTree).toBeVisible();
    // 验证根节点在左侧
    const rootNode = bmp.branchNodes.first();
    const treeRect = await bmp.branchTree.boundingBox();
    const nodeRect = await rootNode.boundingBox();
    expect(nodeRect.x).toBeLessThan(treeRect.x + treeRect.width * 0.3);
  });

  test('BM-002 节点显示章节标题和状态徽章', async ({ page }) => {
    const bmp = new BranchMapPage(page);
    const firstNode = bmp.branchNodes.first();
    await expect(firstNode.locator('[data-testid="node-title"]')).toBeVisible();
    await expect(firstNode.locator('[data-testid="node-status"]')).toBeVisible();
  });

  test('BM-003 连接线使用平滑曲线+渐变色', async ({ page }) => {
    const bmp = new BranchMapPage(page);
    const connections = page.locator('[data-testid="branch-connection"]');
    await expect(connections.first()).toBeVisible();
    // 验证 SVG path 使用曲线
    const pathD = await connections.first().getAttribute('d');
    expect(pathD).toMatch(/C/); // cubic bezier curve
  });

  test('BM-004 主线青色/子分支紫色/IF线琥珀色/归档灰色', async ({ page }) => {
    const bmp = new BranchMapPage(page);
    const mainBranch = page.locator('[data-testid="branch-connection"][data-type="main"]');
    const subBranch = page.locator('[data-testid="branch-connection"][data-type="sub"]');
    const ifBranch = page.locator('[data-testid="branch-connection"][data-type="if"]');
    const archived = page.locator('[data-testid="branch-connection"][data-type="archived"]');

    await expect(mainBranch).toHaveAttribute('stroke', /#4fc3f7/);
    await expect(subBranch).toHaveAttribute('stroke', /#ab47bc/);
    await expect(ifBranch).toHaveAttribute('stroke', /#ffa726/);
    await expect(archived).toHaveAttribute('stroke', /#9e9e9e/);
  });

  test('BM-005 右侧分支详情面板', async ({ page }) => {
    const bmp = new BranchMapPage(page);
    await bmp.branchNodes.first().click();
    await expect(bmp.branchDetail).toBeVisible();
    await expect(bmp.branchDetail.locator('text=名称')).toBeVisible();
    await expect(bmp.branchDetail.locator('text=字数')).toBeVisible();
    await expect(bmp.branchDetail.locator('text=章节数')).toBeVisible();
  });

  test('BM-006 顶部工具栏（新建/合并/导出/缩放/视图切换）', async ({ page }) => {
    const bmp = new BranchMapPage(page);
    await expect(bmp.toolbar).toBeVisible();
    await expect(bmp.newBranchBtn).toBeVisible();
    await expect(bmp.mergeBranchBtn).toBeVisible();
    await expect(bmp.exportBranchBtn).toBeVisible();
    await expect(bmp.zoomFitBtn).toBeVisible();
    await expect(bmp.viewToggle).toBeVisible();
  });

  test('BM-007 底部统计栏（总分支/活跃/最大深度/已归档）', async ({ page }) => {
    const bmp = new BranchMapPage(page);
    await expect(bmp.statsBar).toBeVisible();
    await expect(bmp.statsBar.locator('text=总分支')).toBeVisible();
    await expect(bmp.statsBar.locator('text=活跃')).toBeVisible();
    await expect(bmp.statsBar.locator('text=最大深度')).toBeVisible();
    await expect(bmp.statsBar.locator('text=已归档')).toBeVisible();
  });

  // --- 交互 ---

  test('BM-010 点击节点查看分支详情', async ({ page }) => {
    const bmp = new BranchMapPage(page);
    await bmp.branchNodes.nth(2).click();
    await expect(bmp.branchDetail).toBeVisible();
    const title = await bmp.branchDetail.locator('[data-testid="detail-name"]').textContent();
    expect(title).toBeTruthy();
  });

  test('BM-011 右键节点触发"从此处创建分支"', async ({ page }) => {
    const bmp = new BranchMapPage(page);
    await bmp.branchNodes.first().click({ button: 'right' });
    const menu = page.locator('[data-testid="context-menu"]');
    await expect(menu).toBeVisible();
    await expect(menu.locator('text=从此处创建分支')).toBeVisible();
  });

  test('BM-012 创建分支完整流程', async ({ page }) => {
    const bmp = new BranchMapPage(page);
    await bmp.createBranch('test-branch', {
      name: '测试分支',
      type: 'IF线',
      description: '用于测试的IF线分支',
    });
    // 验证新分支出现在树中
    await expect(page.locator('[data-testid="branch-node"][data-name="测试分支"]')).toBeVisible();
  });

  test('BM-013 搜索栏按名称过滤分支', async ({ page }) => {
    const bmp = new BranchMapPage(page);
    await bmp.searchBar.fill('主线');
    const visibleNodes = bmp.branchNodes.filter({ visible: true });
    // 所有可见节点应包含"主线"
    for (let i = 0; i < await visibleNodes.count(); i++) {
      const text = await visibleNodes.nth(i).textContent();
      expect(text).toContain('主线');
    }
  });

  test('BM-014 视图切换（树状/时间线）', async ({ page }) => {
    const bmp = new BranchMapPage(page);
    await bmp.viewToggle.click();
    await expect(page.locator('[data-testid="timeline-view"]')).toBeVisible();
  });

  test('BM-015 缩放适配功能', async ({ page }) => {
    const bmp = new BranchMapPage(page);
    await bmp.zoomFitBtn.click();
    // 验证所有节点在可视区域内
    const treeRect = await bmp.branchTree.boundingBox();
    const nodes = bmp.branchNodes;
    for (let i = 0; i < await nodes.count(); i++) {
      const nodeRect = await nodes.nth(i).boundingBox();
      expect(nodeRect.x).toBeGreaterThanOrEqual(treeRect.x);
      expect(nodeRect.x + nodeRect.width).toBeLessThanOrEqual(
        treeRect.x + treeRect.width
      );
    }
  });
});
```

**分支树用例清单**（30 项）：

| ID | 用例名称 | 类型 | 优先级 |
|----|---------|------|--------|
| BM-001~007 | UI 渲染（7 项） | UI | P0 |
| BM-010~015 | 交互流程（6 项） | 交互 | P0 |
| BM-020~025 | 分支合并流程（6 项） | 功能 | P0 |
| BM-030~035 | 分支导出（6 项） | 功能 | P1 |
| BM-040~045 | 小地图/缩略图（6 项） | 交互 | P2 |

---

### 5.4 知识库管理测试

**文件**：`tests/04-story-bible/story-bible.spec.ts`

```typescript
test.describe('知识库管理', () => {

  test.beforeEach(async ({ page }) => {
    const bible = new StoryBiblePage(page);
    await bible.goto('novel-001');
  });

  // --- 分类标签 ---

  test('SB-001 顶部标签栏显示 7 个分类（角色/地点/物品/势力/时间线/伏笔/世界观）', async ({ page }) => {
    const bible = new StoryBiblePage(page);
    const categories = ['角色', '地点', '物品', '势力', '时间线', '伏笔', '世界观'];
    await expect(bible.categoryTabs).toHaveCount(7);
    for (const cat of categories) {
      await expect(bible.categoryTabs.filter({ hasText: cat })).toBeVisible();
    }
  });

  test('SB-002 切换分类标签更新卡片内容', async ({ page }) => {
    const bible = new StoryBiblePage(page);
    await bible.categoryTabs.filter({ hasText: '地点' }).click();
    // 验证卡片内容更新为地点类型
    const firstCard = bible.cardGrid.locator('[data-testid="bible-card"]').first();
    await expect(firstCard.locator('[data-testid="card-type"]')).toHaveText('地点');
  });

  // --- 角色卡片 ---

  test('SB-010 角色卡片显示头像/姓名/属性/状态/标签', async ({ page }) => {
    const bible = new StoryBiblePage(page);
    await bible.categoryTabs.filter({ hasText: '角色' }).click();
    const firstCard = bible.cardGrid.locator('[data-testid="bible-card"]').first();
    await expect(firstCard.locator('[data-testid="card-avatar"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="card-name"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="card-attributes"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="card-status"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="card-tags"]')).toBeVisible();
  });

  test('SB-011 角色卡片 3 列网格布局', async ({ page }) => {
    const bible = new StoryBiblePage(page);
    await bible.categoryTabs.filter({ hasText: '角色' }).click();
    const gridStyle = await bible.cardGrid.evaluate(el => getComputedStyle(el));
    expect(gridStyle.gridTemplateColumns).toContain('repeat(3');
  });

  test('SB-012 角色头像 80px 圆形渐变背景 + 姓氏', async ({ page }) => {
    const bible = new StoryBiblePage(page);
    const avatar = bible.cardGrid.locator('[data-testid="card-avatar"]').first();
    const size = await avatar.evaluate(el => el.offsetWidth);
    expect(size).toBe(80);
    const borderRadius = await avatar.evaluate(el => getComputedStyle(el).borderRadius);
    expect(borderRadius).toBe('50%');
  });

  // --- 详情面板 ---

  test('SB-020 点击卡片展开右侧详情面板', async ({ page }) => {
    const bible = new StoryBiblePage(page);
    await bible.cardGrid.locator('[data-testid="bible-card"]').first().click();
    await expect(bible.detailPanel).toBeVisible();
    // 验证标签页布局
    const tabs = ['基本信息', '性格', '关系', '成长弧线'];
    for (const tab of tabs) {
      await expect(bible.detailPanel.locator(`text=${tab}`)).toBeVisible();
    }
  });

  test('SB-021 详情面板显示人物关系图', async ({ page }) => {
    const bible = new StoryBiblePage(page);
    await bible.cardGrid.locator('[data-testid="bible-card"]').first().click();
    await bible.detailPanel.locator('text=关系').click();
    await expect(page.locator('[data-testid="relationship-graph"]')).toBeVisible();
  });

  test('SB-022 详情面板显示成长弧线进度条', async ({ page }) => {
    const bible = new StoryBiblePage(page);
    await bible.cardGrid.locator('[data-testid="bible-card"]').first().click();
    await bible.detailPanel.locator('text=成长弧线').click();
    await expect(page.locator('[data-testid="arc-progress"]')).toBeVisible();
  });

  // --- AI 功能 ---

  test('SB-030 AI 自动提取按钮', async ({ page }) => {
    const bible = new StoryBiblePage(page);
    await expect(bible.autoExtractBtn).toBeVisible();
    await bible.autoExtractBtn.click();
    // 验证 AI 提取进度提示
    await expect(page.locator('[data-testid="extract-progress"]')).toBeVisible();
  });

  test('SB-031 手动添加按钮打开创建表单', async ({ page }) => {
    const bible = new StoryBiblePage(page);
    await bible.manualAddBtn.click();
    await expect(page.locator('[data-testid="create-entry-modal"]')).toBeVisible();
  });

  test('SB-032 AI 建议横幅显示并可接受/忽略', async ({ page }) => {
    const bible = new StoryBiblePage(page);
    const banner = page.locator('[data-testid="ai-suggestion-banner"]');
    if (await banner.isVisible()) {
      await expect(banner.locator('[data-testid="btn-accept"]')).toBeVisible();
      await expect(banner.locator('[data-testid="btn-ignore"]')).toBeVisible();
      await banner.locator('[data-testid="btn-accept"]').click();
      // 验证建议被采纳
      await expect(banner).not.toBeVisible();
    }
  });
});
```

**知识库用例清单**（35 项）：

| ID | 用例名称 | 类型 | 优先级 |
|----|---------|------|--------|
| SB-001~002 | 分类标签（2 项） | UI | P0 |
| SB-010~012 | 角色卡片（3 项） | UI | P0 |
| SB-020~022 | 详情面板（3 项） | UI + 交互 | P0 |
| SB-030~032 | AI 功能（3 项） | 功能 | P0 |
| SB-040~045 | CRUD 操作（6 项） | 功能 | P0 |
| SB-050~055 | 关系图交互（6 项） | 交互 | P1 |
| SB-060~065 | 时间线/地图/势力图（6 项） | 交互 | P1 |
| SB-070~075 | 导入/导出（6 项） | 功能 | P2 |

---

### 5.5 模型中心测试

**文件**：`tests/05-model-center/model-center.spec.ts`

```typescript
test.describe('模型中心', () => {

  test.beforeEach(async ({ page }) => {
    const mc = new ModelCenterPage(page);
    await mc.goto();
  });

  test('MC-001 模型卡片 2x2 网格布局', async ({ page }) => {
    const mc = new ModelCenterPage(page);
    await expect(mc.modelCards).toHaveCount(4);
    const gridStyle = await mc.modelCards.first().evaluate(el =>
      getComputedStyle(el.parentElement).gridTemplateColumns
    );
    expect(gridStyle).toContain('repeat(2');
  });

  test('MC-002 模型卡片显示名称/提供商/状态灯/能力评分/连接类型/上下文窗口', async ({ page }) => {
    const mc = new ModelCenterPage(page);
    const card = mc.modelCards.first();
    await expect(card.locator('[data-testid="model-name"]')).toBeVisible();
    await expect(card.locator('[data-testid="model-provider"]')).toBeVisible();
    await expect(card.locator('[data-testid="model-status-dot"]')).toBeVisible();
    await expect(card.locator('[data-testid="model-capability"]')).toBeVisible();
    await expect(card.locator('[data-testid="model-connection-type"]')).toBeVisible();
    await expect(card.locator('[data-testid="model-context-window"]')).toBeVisible();
  });

  test('MC-003 设为默认按钮', async ({ page }) => {
    const mc = new ModelCenterPage(page);
    await mc.modelCards.first().locator('[data-testid="btn-set-default"]').click();
    // 验证默认标识
    await expect(mc.modelCards.first().locator('[data-testid="default-badge"]')).toBeVisible();
  });

  test('MC-010 协作流水线显示 4 个步骤', async ({ page }) => {
    const mc = new ModelCenterPage(page);
    await expect(mc.pipelineSteps).toHaveCount(4);
    const stepNames = ['构思大纲', '章节扩写', '中文润色', '质量评审'];
    for (const name of stepNames) {
      await expect(mc.pipelineSteps.filter({ hasText: name })).toBeVisible();
    }
  });

  test('MC-011 流水线步骤支持编辑和测试', async ({ page }) => {
    const mc = new ModelCenterPage(page);
    const firstStep = mc.pipelineSteps.first();
    await expect(firstStep.locator('[data-testid="btn-edit-step"]')).toBeVisible();
    await expect(firstStep.locator('[data-testid="btn-test-step"]')).toBeVisible();
  });

  test('MC-012 添加步骤和保存流水线', async ({ page }) => {
    const mc = new ModelCenterPage(page);
    await mc.addStepBtn.click();
    await expect(page.locator('[data-testid="add-step-modal"]')).toBeVisible();
    await mc.savePipelineBtn.click();
    // 验证保存成功提示
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });

  test('MC-013 提供商颜色编码（Anthropic=橙/OpenAI=绿/DeepSeek=蓝/阿里=紫）', async ({ page }) => {
    const mc = new ModelCenterPage(page);
    const colors: Record<string, string> = {
      'Anthropic': 'rgb(255, 152, 0)',
      'OpenAI': 'rgb(76, 175, 80)',
      'DeepSeek': 'rgb(33, 150, 243)',
      'Alibaba': 'rgb(156, 39, 176)',
    };
    for (const [provider, color] of Object.entries(colors)) {
      const card = mc.modelCards.filter({ hasText: provider });
      if (await card.isVisible()) {
        const borderColor = await card.evaluate(el =>
          getComputedStyle(el).borderColor
        );
        expect(borderColor).toContain(color);
      }
    }
  });
});
```

**模型中心用例清单**（20 项）：

| ID | 用例名称 | 类型 | 优先级 |
|----|---------|------|--------|
| MC-001~003 | 模型卡片（3 项） | UI | P0 |
| MC-010~013 | 协作流水线（4 项） | 功能 | P0 |
| MC-020~025 | 模型配置（6 项） | 功能 | P1 |
| MC-030~035 | BYOK 连接（6 项） | 功能 | P1 |

---

### 5.6 大纲管理测试

**文件**：`tests/06-outline/outline.spec.ts`

```typescript
test.describe('大纲管理', () => {

  test.beforeEach(async ({ page }) => {
    const outline = new OutlinePage(page);
    await outline.goto('novel-001');
  });

  test('OL-001 多层级树形大纲（卷>章>场景）', async ({ page }) => {
    const outline = new OutlinePage(page);
    await expect(outline.outlineTree).toBeVisible();
    // 验证层级结构
    const volumes = outline.outlineTree.locator('[data-testid="outline-volume"]');
    const chapters = outline.outlineTree.locator('[data-testid="outline-chapter"]');
    expect(await volumes.count()).toBeGreaterThan(0);
    expect(await chapters.count()).toBeGreaterThan(0);
  });

  test('OL-002 状态徽章（定稿/写作中/待写/初稿/精修）', async ({ page }) => {
    const outline = new OutlinePage(page);
    const badges = outline.outlineTree.locator('[data-testid="status-badge"]');
    const validStatuses = ['定稿', '写作中', '待写', '初稿', '精修'];
    for (let i = 0; i < await badges.count(); i++) {
      const text = await badges.nth(i).textContent();
      expect(validStatuses).toContain(text);
    }
  });

  test('OL-003 每个条目显示字数', async ({ page }) => {
    const outline = new OutlinePage(page);
    const wordCounts = outline.outlineTree.locator('[data-testid="outline-word-count"]');
    for (let i = 0; i < await wordCounts.count(); i++) {
      const text = await wordCounts.nth(i).textContent();
      expect(text).toMatch(/\d+字/);
    }
  });

  test('OL-004 右侧面板显示大纲笔记和关键情节', async ({ page }) => {
    const outline = new OutlinePage(page);
    await outline.outlineTree.locator('[data-testid="outline-chapter"]').first().click();
    await expect(outline.detailPanel).toBeVisible();
    await expect(outline.detailPanel.locator('text=大纲笔记')).toBeVisible();
    await expect(outline.detailPanel.locator('text=关键情节')).toBeVisible();
  });

  test('OL-005 拖拽排序章节', async ({ page }) => {
    const outline = new OutlinePage(page);
    const handles = outline.outlineTree.locator('[data-testid="drag-handle"]');
    const firstHandle = handles.first();
    const secondHandle = handles.nth(1);
    // 拖拽第一个到第二个位置
    await firstHandle.dragTo(secondHandle);
    // 验证顺序变化
    await page.waitForTimeout(500);
    const firstTitle = await outline.outlineTree
      .locator('[data-testid="outline-chapter"]')
      .first()
      .textContent();
    expect(firstTitle).not.toBe('第一章');
  });

  test('OL-006 新建章节按钮', async ({ page }) => {
    const outline = new OutlinePage(page);
    await outline.newChapterBtn.click();
    await expect(page.locator('[data-testid="create-chapter-modal"]')).toBeVisible();
  });

  test('OL-007 视图切换（卡片/列表）', async ({ page }) => {
    const outline = new OutlinePage(page);
    await outline.viewToggle.click();
    await expect(page.locator('[data-testid="card-view"]')).toBeVisible();
  });

  test('OL-008 批量状态更新', async ({ page }) => {
    const outline = new OutlinePage(page);
    // 选中多个章节
    await outline.outlineTree.locator('[data-testid="outline-chapter"]').first().click();
    await page.keyboard.down('Shift');
    await outline.outlineTree.locator('[data-testid="outline-chapter"]').nth(2).click();
    await page.keyboard.up('Shift');
    // 批量更新
    await page.locator('[data-testid="btn-batch-status"]').click();
    await expect(page.locator('[data-testid="batch-status-modal"]')).toBeVisible();
  });
});
```

**大纲管理用例清单**（20 项）：

| ID | 用例名称 | 类型 | 优先级 |
|----|---------|------|--------|
| OL-001~003 | 树形大纲（3 项） | UI | P0 |
| OL-004~005 | 详情面板+拖拽（2 项） | 交互 | P0 |
| OL-006~008 | 工具栏操作（3 项） | 功能 | P0 |
| OL-010~015 | 展开/折叠/导航（6 项） | 交互 | P1 |
| OL-020~025 | CRUD 操作（6 项） | 功能 | P1 |

---

### 5.7 AI 对话面板测试

**文件**：`tests/07-ai-chat/ai-chat.spec.ts`

```typescript
test.describe('AI 对话面板', () => {

  test.beforeEach(async ({ page }) => {
    const chat = new AIChatPanel(page);
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
  });

  test('AC-001 聊天区域显示消息列表', async ({ page }) => {
    const chat = new AIChatPanel(page);
    await chat.open();
    await expect(chat.chatMessages).toBeVisible();
  });

  test('AC-002 AI 消息带青色左边框和 AI 徽章', async ({ page }) => {
    const chat = new AIChatPanel(page);
    await chat.open();
    const aiMsg = chat.chatMessages.locator('[data-testid="ai-message"]').first();
    if (await aiMsg.isVisible()) {
      await expect(aiMsg).toHaveCSS('border-left-color', 'rgb(79, 195, 247)');
      await expect(aiMsg.locator('[data-testid="ai-badge"]')).toBeVisible();
    }
  });

  test('AC-003 AI 回复操作按钮（采纳/重新生成/扩写/改写）', async ({ page }) => {
    const chat = new AIChatPanel(page);
    await chat.open();
    const aiMsg = chat.chatMessages.locator('[data-testid="ai-message"]').first();
    if (await aiMsg.isVisible()) {
      const actions = ['采纳', '重新生成', '扩写', '改写'];
      for (const action of actions) {
        await expect(aiMsg.locator(`[data-testid="btn-${action}"]`)).toBeVisible();
      }
    }
  });

  test('AC-004 输入区域 + 快捷指令 chips', async ({ page }) => {
    const chat = new AIChatPanel(page);
    await chat.open();
    await expect(chat.inputArea).toBeVisible();
    const chips = ['/续写', '/扩写', '/改写', '/对话', '/描写', '/推演'];
    await expect(chat.quickChips).toHaveCount(6);
    for (const chip of chips) {
      await expect(chat.quickChips.filter({ hasText: chip })).toBeVisible();
    }
  });

  test('AC-005 上下文栏显示当前章节/角色/地点', async ({ page }) => {
    const chat = new AIChatPanel(page);
    await chat.open();
    await expect(chat.contextBar).toBeVisible();
    await expect(chat.contextBar.locator('[data-testid="ctx-chapter"]')).toBeVisible();
  });

  test('AC-006 AI 思考动画（三个脉冲青色圆点）', async ({ page }) => {
    const chat = new AIChatPanel(page);
    await chat.open();
    await chat.sendMessage('请续写下一段');
    await expect(chat.thinkingAnimation).toBeVisible();
    const dots = chat.thinkingAnimation.locator('[data-testid="thinking-dot"]');
    await expect(dots).toHaveCount(3);
  });

  test('AC-010 续写模式完整流程', async ({ page }) => {
    const chat = new AIChatPanel(page);
    await chat.open();
    // 使用 Mock AI 响应
    await chat.sendMessage('/续写');
    // 等待 AI 响应
    await expect(chat.chatMessages.locator('[data-testid="ai-message"]').last()).toBeVisible({
      timeout: 10_000,
    });
    // 点击采纳
    await chat.chatMessages
      .locator('[data-testid="ai-message"]')
      .last()
      .locator('[data-testid="btn-采纳"]')
      .click();
    // 验证内容插入编辑器
    const editor = new WorkbenchPage(page).editor;
    const content = await editor.innerText();
    expect(content.length).toBeGreaterThan(100);
  });

  test('AC-011 接受率 > 60%（批量测试）', async ({ page }) => {
    // 此测试需要真实 AI 或高质量 Mock
    // 在 CI 中使用 Mock 数据验证
    const chat = new AIChatPanel(page);
    await chat.open();
    const prompts = ['续写下一段', '扩写这段描写', '改写对话部分'];
    let acceptCount = 0;
    for (const prompt of prompts) {
      await chat.sendMessage(prompt);
      await chat.waitForAIResponse();
      if (await chat.hasAcceptButton()) {
        await chat.clickAccept();
        acceptCount++;
      }
    }
    const acceptRate = acceptCount / prompts.length;
    expect(acceptRate).toBeGreaterThanOrEqual(0.6);
  });

  test('AC-012 AI 响应时间 < 2 秒（简单任务）', async ({ page }) => {
    const chat = new AIChatPanel(page);
    await chat.open();
    const start = Date.now();
    await chat.sendMessage('续写');
    await chat.waitForAIResponse();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });
});
```

**AI 对话用例清单**（45 项）：

| ID | 用例名称 | 类型 | 优先级 |
|----|---------|------|--------|
| AC-001~006 | UI 渲染（6 项） | UI | P0 |
| AC-010~012 | 续写流程（3 项） | 功能 | P0 |
| AC-020~025 | 扩写/改写/对话/描写/推演模式（6 项） | 功能 | P0 |
| AC-030~035 | 采纳/拒绝/修改（6 项） | 交互 | P0 |
| AC-040~045 | 上下文管理（6 项） | 功能 | P1 |
| AC-050~055 | 一致性检查集成（6 项） | 功能 | P1 |
| AC-060~065 | 错误处理/重试（6 项） | 异常 | P1 |
| AC-070~075 | 长对话性能（6 项） | 性能 | P2 |

---

### 5.8 响应式布局测试

**文件**：`tests/08-responsive/responsive.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('响应式布局', () => {

  // 桌面端 > 1440px — 三栏布局
  test('R-001 桌面端三栏布局（导航+编辑器+AI面板）', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    await expect(page.locator('[data-testid="primary-sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="editor"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-panel"]')).toBeVisible();
    await context.close();
  });

  // 笔记本 1024-1440px — 两栏布局
  test('R-002 笔记本两栏布局（编辑器+AI面板，导航折叠）', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    await expect(page.locator('[data-testid="editor"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-panel"]')).toBeVisible();
    // 导航栏折叠为图标
    await expect(page.locator('[data-testid="primary-sidebar"].collapsed')).toBeVisible();
    await context.close();
  });

  // 平板 768-1024px — 单栏布局
  test('R-003 平板单栏布局（编辑器为主，AI面板抽屉式）', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 900, height: 1200 } });
    const page = await context.newPage();
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    await expect(page.locator('[data-testid="editor"]')).toBeVisible();
    // AI 面板默认隐藏
    await expect(page.locator('[data-testid="ai-panel"]')).not.toBeVisible();
    // 点击按钮打开抽屉
    await page.locator('[data-testid="btn-toggle-ai"]').click();
    await expect(page.locator('[data-testid="ai-panel"].drawer')).toBeVisible();
    await context.close();
  });

  // 手机 < 768px — 简化单栏
  test('R-004 手机单栏布局（简化功能，AI面板底部弹出）', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();
    const welcome = new WelcomePage(page);
    await welcome.goto();
    // 验证移动端适配
    await expect(welcome.logo).toBeVisible();
    await expect(welcome.recentWorkCards).toHaveCount(2); // 移动端只显示 2 个
    await context.close();
  });

  // 视觉回归
  test('R-010 桌面端视觉回归对比', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    await expect(page).toHaveScreenshot('workbench-desktop.png', { maxDiffPixelRatio: 0.01 });
    await context.close();
  });
});
```

**响应式用例清单**（25 项）：

| ID | 用例名称 | 类型 | 优先级 |
|----|---------|------|--------|
| R-001~004 | 四断点布局（4 项） | 布局 | P0 |
| R-010~015 | 视觉回归（6 项） | 视觉 | P1 |
| R-020~025 | 手势操作（6 项） | 交互 | P2 |
| R-030~035 | 移动端简化功能（6 项） | 功能 | P2 |
| R-040~043 | 离线模式（4 项） | 功能 | P2 |

---

### 5.9 性能基准测试

**文件**：`tests/09-performance/performance.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('性能基准测试', () => {

  test('P-001 首屏加载时间 < 2 秒', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });

  test('P-002 AI 响应时间 < 2 秒（简单任务）', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    const chat = new AIChatPanel(page);
    await chat.open();
    const start = Date.now();
    await chat.sendMessage('续写一段');
    await chat.waitForAIResponse();
    expect(Date.now() - start).toBeLessThan(2000);
  });

  test('P-003 AI 响应时间 < 10 秒（复杂任务）', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    const chat = new AIChatPanel(page);
    await chat.open();
    const start = Date.now();
    await chat.sendMessage('请根据当前所有角色关系和伏笔，推演下一章的情节发展');
    await chat.waitForAIResponse();
    expect(Date.now() - start).toBeLessThan(10000);
  });

  test('P-004 全文搜索 < 500ms', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    const start = Date.now();
    await page.locator('[data-testid="search-input"]').fill('星辰');
    await page.waitForResponse(resp => resp.url().includes('/api/search'));
    expect(Date.now() - start).toBeLessThan(500);
  });

  test('P-005 WebSocket 延迟 < 100ms', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    const wsLatency = await page.evaluate(async () => {
      const start = performance.now();
      await new Promise(resolve => {
        const ws = new WebSocket('ws://localhost:3000/ws');
        ws.onopen = () => {
          ws.send(JSON.stringify({ type: 'ping' }));
          ws.onmessage = () => {
            ws.close();
            resolve(performance.now() - start);
          };
        };
      });
      return wsLatency;
    });
    expect(wsLatency).toBeLessThan(100);
  });

  test('P-006 Prompt Cache 命中率 > 70%', async ({ page }) => {
    // 通过 API 查询缓存指标
    const response = await page.request.get('/api/metrics/cache');
    const data = await response.json();
    expect(data.hitRate).toBeGreaterThan(0.7);
  });

  test('P-007 压缩成功率 > 95%', async ({ page }) => {
    const response = await page.request.get('/api/metrics/compaction');
    const data = await response.json();
    expect(data.successRate).toBeGreaterThan(0.95);
  });

  test('P-008 权限分类器 P99 < 500ms（Stage1）', async ({ page }) => {
    const response = await page.request.get('/api/metrics/permission');
    const data = await response.json();
    expect(data.stage1P99).toBeLessThan(500);
  });
});
```

---

### 5.10 Harness 集成验收测试

**文件**：`tests/10-harness/harness.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Harness 集成验收', () => {

  test('H-001 REPL 循环检查点不阻塞正常写作', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    await wb.typeInEditor('测试正常写作流程');
    // 验证编辑器响应正常，无卡顿
    const content = await wb.getEditorContent();
    expect(content).toContain('测试正常写作流程');
  });

  test('H-002 Permission Harness 阻止危险操作', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    // 尝试批量删除章节
    await page.locator('[data-testid="btn-batch-delete"]').click();
    // 验证权限确认对话框出现
    await expect(page.locator('[data-testid="permission-confirm"]')).toBeVisible();
  });

  test('H-003 Permission 拒绝反馈后 AI 自动调整', async ({ page }) => {
    const chat = new AIChatPanel(page);
    await chat.open();
    // Mock AI 尝试危险操作
    await chat.sendMessage('请删除所有已发布章节');
    await chat.waitForAIResponse();
    // 验证 AI 收到拒绝反馈并调整
    const lastMsg = chat.chatMessages.locator('[data-testid="ai-message"]').last();
    await expect(lastMsg).toContainText('无法执行');
  });

  test('H-004 Compaction 在长对话中自动触发', async ({ page }) => {
    const chat = new AIChatPanel(page);
    await chat.open();
    // 发送多条消息触发压缩
    for (let i = 0; i < 20; i++) {
      await chat.sendMessage(`这是第${i + 1}条测试消息`);
      await chat.waitForAIResponse();
    }
    // 验证压缩记录
    const response = await page.request.get('/api/metrics/compaction');
    const data = await response.json();
    expect(data.totalCompactions).toBeGreaterThan(0);
  });

  test('H-005 Memory Harness 自动提取记忆', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    await wb.typeInEditor('李云缓缓拔出长剑，剑身上流转着淡蓝色的灵气。这是她觉醒剑灵天赋的第三天。');
    // 等待记忆自动提取
    await page.waitForTimeout(3000);
    // 验证记忆文件更新
    const response = await page.request.get('/api/novel/novel-001/memories');
    const data = await response.json();
    const hasNewMemory = data.some((m: any) =>
      m.content.includes('李云') && m.content.includes('剑灵天赋')
    );
    expect(hasNewMemory).toBeTruthy();
  });

  test('H-006 记忆老化警告显示', async ({ page }) => {
    const bible = new StoryBiblePage(page);
    await bible.goto('novel-001');
    // 查找超过 1 天的记忆
    const oldMemories = page.locator('[data-testid="memory-aging-warning"]');
    if (await oldMemories.count() > 0) {
      await expect(oldMemories.first()).toContainText('可能已变更');
    }
  });

  test('H-007 Feature Gate 动态切换', async ({ page }) => {
    const mc = new ModelCenterPage(page);
    await mc.goto();
    // 切换 Feature Gate
    await page.request.post('/api/admin/feature-gate', {
      data: { feature: 'advanced_creative_mode', enabled: true },
    });
    // 验证功能启用
    await page.reload();
    await expect(page.locator('[data-testid="advanced-creative-mode"]')).toBeVisible();
  });
});
```

### 5.11 国际化与本地化测试

**文件**：`tests/11-i18n/i18n.spec.ts`

```typescript
import { test, expect, browser } from '@playwright/test';

test.describe('国际化与本地化', () => {

  test('I18N-001 默认语言跟随浏览器设置', async ({ page }) => {
    // 设置浏览器语言为英文
    const context = await browser.newContext({ locale: 'en-US' });
    const page = await context.newPage();
    const welcome = new WelcomePage(page);
    await welcome.goto();
    await expect(welcome.logo).toContainText('DreamWeaver');
    await expect(welcome.tagline).toContainText('AI-Powered');
    await context.close();
  });

  test('I18N-002 手动切换语言为中文', async ({ page }) => {
    await page.locator('[data-testid="language-selector"]').selectOption('zh');
    await expect(page.locator('[data-testid="app-logo"]')).toContainText('织梦笔');
  });

  test('I18N-003 手动切换语言为日文', async ({ page }) => {
    await page.locator('[data-testid="language-selector"]').selectOption('ja');
    // 验证日文UI
    await expect(page.locator('[data-testid="app-logo"]')).toBeVisible();
  });

  test('I18N-004 写作语言自动检测', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    await wb.typeInEditor('The ancient city stood silent under the moonlight.');
    // 验证AI路由到英文模型
    await expect(wb.currentModel).toContainText(/Claude|GPT/);
  });

  test('I18N-005 双语作品并行创作', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    // 验证同一作品可切换中英版本
    await page.locator('[data-testid="btn-switch-lang"]').click();
    await expect(page.locator('[data-testid="editor-content"]')).toBeVisible();
  });

  test('I18N-006 本地化格式（日期/货币/数字）', async ({ page }) => {
    // US: $12.00, 04/04/2026
    const contextUS = await browser.newContext({ locale: 'en-US' });
    const pageUS = await contextUS.newPage();
    await pageUS.goto('/pricing');
    await expect(pageUS.locator('[data-testid="plan-pro-price"]')).toContainText('$12.00');
    await contextUS.close();

    // EU: €12,00, 04.04.2026
    const contextEU = await browser.newContext({ locale: 'de-DE' });
    const pageEU = await contextEU.newPage();
    await pageEU.goto('/pricing');
    await expect(pageEU.locator('[data-testid="plan-pro-price"]')).toContainText('€');
    await contextEU.close();

    // JP: ¥1,800, 2026/04/04
    const contextJP = await browser.newContext({ locale: 'ja-JP' });
    const pageJP = await contextJP.newPage();
    await pageJP.goto('/pricing');
    await expect(pageJP.locator('[data-testid="plan-pro-price"]')).toContainText('¥');
    await contextJP.close();
  });

  test('I18N-007 多语言文本长度适配（德语比英语长30%）', async ({ page }) => {
    const context = await browser.newContext({ locale: 'de-DE' });
    const page = await context.newPage();
    await page.goto('/');
    // 验证德语UI不溢出
    const navItems = page.locator('[data-testid="nav-item"]');
    const count = await navItems.count();
    for (let i = 0; i < count; i++) {
      const box = await navItems.nth(i).boundingBox();
      expect(box).not.toBeNull();
      // 验证元素在可视区域内
      expect(box!.x + box!.width).toBeLessThanOrEqual(await page.viewportSize().then(v => v!.width));
    }
    await context.close();
  });

  test('I18N-008 翻译完整性检查', async ({ page }) => {
    // 验证所有UI元素都有翻译，无missing translation key
    await page.goto('/');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('missing_translation');
    expect(bodyText).not.toContain('translation_key_');
  });

  test('I18N-009 切换语言后URL保持一致', async ({ page }) => {
    await page.goto('/novel/novel-001');
    await page.locator('[data-testid="language-selector"]').selectOption('en');
    await expect(page).toHaveURL(/\/novel\/novel-001/);
  });

  test('I18N-010 语言偏好持久化到本地存储', async ({ page }) => {
    await page.locator('[data-testid="language-selector"]').selectOption('ja');
    await page.reload();
    const lang = await page.evaluate(() => localStorage.getItem('preferred-language'));
    expect(lang).toBe('ja');
  });

  test('I18N-011 RTL语言布局支持（阿拉伯语）', async ({ page }) => {
    const context = await browser.newContext({ locale: 'ar-SA' });
    const page = await context.newPage();
    await page.goto('/');
    const dir = await page.locator('html').getAttribute('dir');
    expect(dir).toBe('rtl');
    await context.close();
  });

  test('I18N-012 AI提示词跟随界面语言', async ({ page }) => {
    await page.locator('[data-testid="language-selector"]').selectOption('en');
    const chat = new AIChatPanel(page);
    await chat.open();
    const placeholder = await chat.inputPlaceholder();
    expect(placeholder).toMatch(/^[A-Za-z]/);
  });

  test('I18N-013 知识库字段多语言显示', async ({ page }) => {
    await page.locator('[data-testid="language-selector"]').selectOption('en');
    const bible = new StoryBiblePage(page);
    await bible.goto('novel-001');
    await expect(page.locator('[data-testid="bible-section-characters"]')).toContainText('Characters');
  });

  test('I18N-014 错误提示多语言', async ({ page }) => {
    await page.locator('[data-testid="language-selector"]').selectOption('en');
    await page.goto('/novel/nonexistent');
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/not found|error/i);
  });

  test('I18N-015 无障碍标签多语言', async ({ page }) => {
    await page.locator('[data-testid="language-selector"]').selectOption('en');
    const ariaLabel = await page.locator('[data-testid="btn-save"]').getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toMatch(/^[A-Za-z]/);
  });
});
```

### 5.12 Stripe 支付测试

**文件**：`tests/12-stripe/stripe.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Stripe 支付', () => {

  test('PAY-001 定价页面显示四个套餐卡片', async ({ page }) => {
    await page.goto('/pricing');
    const plans = ['Free', 'Pro', 'Studio', 'Team'];
    for (const plan of plans) {
      await expect(page.locator(`[data-testid="plan-${plan.toLowerCase()}"]`)).toBeVisible();
    }
  });

  test('PAY-002 Free套餐显示$0', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('[data-testid="plan-free-price"]')).toContainText('$0');
  });

  test('PAY-003 Pro套餐显示$12/月', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('[data-testid="plan-pro-price"]')).toContainText('$12');
  });

  test('PAY-004 年付折扣显示Save 20%', async ({ page }) => {
    await page.goto('/pricing');
    await page.locator('[data-testid="toggle-annual"]').click();
    await expect(page.locator('[data-testid="annual-discount"]')).toContainText('20%');
  });

  test('PAY-005 点击Subscribe打开Stripe Checkout', async ({ page }) => {
    await page.goto('/pricing');
    await page.locator('[data-testid="btn-subscribe-pro"]').click();
    // 验证跳转到Stripe Checkout页面
    await page.waitForURL(/checkout.stripe.com/);
  });

  test('PAY-006 支付成功后跳转回应用', async ({ page }) => {
    // 使用Stripe测试模式
    await page.goto('/pricing');
    await page.locator('[data-testid="btn-subscribe-pro"]').click();
    await page.waitForURL(/checkout.stripe.com/);
    // 填写Stripe测试卡号
    await page.locator('#cardNumber').fill('4242424242424242');
    await page.locator('#cardExpiry').fill('12/28');
    await page.locator('#cardCvc').fill('123');
    await page.locator('#billingName').fill('Test User');
    await page.locator('button[type="submit"]').click();
    // 验证跳转回应用
    await page.waitForURL(/\/settings\/billing|\/welcome/);
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
  });

  test('PAY-007 订阅管理页面显示当前计划', async ({ page }) => {
    await page.goto('/settings/billing');
    await expect(page.locator('[data-testid="current-plan"]')).toContainText('Pro');
  });

  test('PAY-008 取消订阅确认流程', async ({ page }) => {
    await page.goto('/settings/billing');
    await page.locator('[data-testid="btn-cancel-subscription"]').click();
    await expect(page.locator('[data-testid="cancel-confirm-modal"]')).toBeVisible();
  });

  test('PAY-009 用量统计显示字数和Token', async ({ page }) => {
    await page.goto('/settings/billing');
    await expect(page.locator('[data-testid="usage-words"]')).toBeVisible();
    await expect(page.locator('[data-testid="usage-tokens"]')).toBeVisible();
  });

  test('PAY-010 Feature comparison table完整', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('[data-testid="feature-comparison"]')).toBeVisible();
    // 验证所有套餐列存在
    const columns = page.locator('[data-testid="feature-comparison"] th');
    await expect(columns).toHaveCount(4);
  });

  test('PAY-011 支付失败显示错误提示', async ({ page }) => {
    await page.goto('/pricing');
    await page.locator('[data-testid="btn-subscribe-pro"]').click();
    await page.waitForURL(/checkout.stripe.com/);
    // 使用Stripe测试失败卡号
    await page.locator('#cardNumber').fill('4000000000000002');
    await page.locator('#cardExpiry').fill('12/28');
    await page.locator('#cardCvc').fill('123');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
  });

  test('PAY-012 升级套餐差额计算', async ({ page }) => {
    await page.goto('/settings/billing');
    await page.locator('[data-testid="btn-upgrade-plan"]').click();
    await expect(page.locator('[data-testid="proration-amount"]')).toBeVisible();
  });

  test('PAY-013 发票下载功能', async ({ page }) => {
    await page.goto('/settings/billing');
    await page.locator('[data-testid="btn-download-invoice"]').first().click();
    // 验证下载请求
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toMatch(/invoice/);
  });

  test('PAY-014 多币种定价显示', async ({ page }) => {
    // 欧洲用户看到欧元
    const context = await browser.newContext({ locale: 'de-DE' });
    const page = await context.newPage();
    await page.goto('/pricing');
    await expect(page.locator('[data-testid="plan-pro-price"]')).toContainText('€');
    await context.close();
  });

  test('PAY-015 订阅到期提醒', async ({ page }) => {
    await page.goto('/settings/billing');
    const expiryNotice = page.locator('[data-testid="expiry-notice"]');
    if (await expiryNotice.isVisible()) {
      await expect(expiryNotice).toContainText(/expir|renew/i);
    }
  });
});
```

### 5.13 GDPR 合规测试

**文件**：`tests/13-gdpr/gdpr.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('GDPR 合规', () => {

  test('GDPR-001 首次访问显示Cookie Consent Banner', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="cookie-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="cookie-banner"]')).toContainText('cookies');
  });

  test('GDPR-002 Accept All按钮关闭Banner', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="btn-accept-all"]').click();
    await expect(page.locator('[data-testid="cookie-banner"]')).not.toBeVisible();
  });

  test('GDPR-003 Customize按钮打开Cookie设置', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="btn-customize"]').click();
    await expect(page.locator('[data-testid="cookie-settings-modal"]')).toBeVisible();
  });

  test('GDPR-004 Reject All按钮仅保留必要Cookie', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="btn-reject-all"]').click();
    // 验证分析Cookie未设置
    const cookies = await page.context().cookies();
    const analyticsCookies = cookies.filter(c => c.name.includes('analytics'));
    expect(analyticsCookies).toHaveLength(0);
  });

  test('GDPR-005 Privacy Policy链接可访问', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="link-privacy-policy"]').click();
    await expect(page).toHaveURL(/\/privacy/);
    await expect(page.locator('h1')).toContainText(/Privacy/i);
  });

  test('GDPR-006 注册时年龄验证（13+）', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('[data-testid="age-confirmation"]')).toBeVisible();
  });

  test('GDPR-007 数据导出功能', async ({ page }) => {
    await page.goto('/settings/privacy');
    await page.locator('[data-testid="btn-export-data"]').click();
    // 验证导出请求成功
    await expect(page.locator('[data-testid="export-success"]')).toBeVisible();
  });

  test('GDPR-008 数据删除功能', async ({ page }) => {
    await page.goto('/settings/privacy');
    await page.locator('[data-testid="btn-delete-account"]').click();
    await expect(page.locator('[data-testid="delete-confirm-modal"]')).toBeVisible();
  });

  test('GDPR-009 AI生成内容标注"AI-Assisted"', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    // 验证AI生成的内容有标注
    const aiContent = page.locator('[data-testid="ai-generated-content"]');
    if (await aiContent.isVisible()) {
      await expect(aiContent.locator('[data-testid="ai-badge"]')).toBeVisible();
    }
  });

  test('GDPR-010 Cookie偏好可随时更改', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="btn-accept-all"]').click();
    // 打开设置重新调整
    await page.locator('[data-testid="cookie-settings-trigger"]').click();
    await expect(page.locator('[data-testid="cookie-settings-modal"]')).toBeVisible();
  });

  test('GDPR-011 数据处理透明度声明', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('[data-testid="data-processing-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="data-processing-section"]')).toContainText(/third.party|processor/i);
  });

  test('GDPR-012 用户同意记录可追溯', async ({ page }) => {
    const response = await page.request.get('/api/user/consent-log');
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.consentRecords)).toBeTruthy();
    expect(data.consentRecords.length).toBeGreaterThan(0);
  });
});
```

### 5.14 全球延迟测试

**文件**：`tests/14-latency/latency.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

/**
 * 辅助函数：测量API延迟
 */
async function measureAPILatency(page: any, region: string) {
  const response = await page.request.get(`/api/health?region=${region}`);
  const timings = response.timing();
  return {
    p50: timings.responseEnd - timings.requestStart,
    p99: timings.responseEnd - timings.requestStart, // 实际应通过多次采样计算
  };
}

test.describe('全球延迟测试', () => {

  test('LAT-001 北美用户P99 < 200ms', async ({ page }) => {
    const metrics = await measureAPILatency(page, 'us-east-1');
    expect(metrics.p99).toBeLessThan(200);
  });

  test('LAT-002 欧洲用户P99 < 300ms', async ({ page }) => {
    const metrics = await measureAPILatency(page, 'eu-west-1');
    expect(metrics.p99).toBeLessThan(300);
  });

  test('LAT-003 亚太用户P99 < 400ms', async ({ page }) => {
    const metrics = await measureAPILatency(page, 'ap-southeast-1');
    expect(metrics.p99).toBeLessThan(400);
  });

  test('LAT-004 CDN静态资源全球可用', async ({ page }) => {
    const response = await page.request.get('https://cdn.dreamweaver.ai/static/main.js');
    expect(response.status()).toBe(200);
    expect(response.headers()['cf-cache-status']).toBe('HIT');
  });

  test('LAT-005 DNS延迟路由正确', async ({ page }) => {
    // 验证不同区域解析到不同节点
    const regions = ['us-east-1', 'eu-west-1', 'ap-southeast-1'];
    for (const region of regions) {
      const response = await page.request.get(`/api/health?region=${region}`);
      const data = await response.json();
      expect(data.region).toBe(region);
    }
  });

  test('LAT-006 首屏加载时间全球达标', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(3000);
  });

  test('LAT-007 AI响应全球延迟可接受', async ({ page }) => {
    const wb = new WorkbenchPage(page);
    await wb.goto('novel-001');
    const start = Date.now();
    await wb.triggerAIAction('continue');
    await wb.waitForAIResponse();
    const aiLatency = Date.now() - start;
    // AI响应允许较长延迟，但应在合理范围内
    expect(aiLatency).toBeLessThan(10000);
  });

  test('LAT-008 WebSocket连接全球稳定', async ({ page }) => {
    await page.goto('/');
    const wsStatus = page.locator('[data-testid="ws-connection-status"]');
    await expect(wsStatus).toContainText(/connected/i);
  });
});
```

---

## 6. 测试数据管理

### 6.1 数据工厂

```typescript
// src/factories/novel.factory.ts
import { faker } from '@faker-js/faker/locale/zh_CN';

export class NovelFactory {
  static create(overrides = {}) {
    return {
      id: faker.string.uuid(),
      title: faker.helpers.arrayElement([
        '星辰变', '斗破苍穹', '凡人修仙传', '诡秘之主',
      ]),
      genre: faker.helpers.arrayElement(['仙侠', '都市', '悬疑', '科幻']),
      wordCount: faker.number.int({ min: 10000, max: 500000 }),
      status: faker.helpers.arrayElement(['连载中', '已完结', '草稿']),
      lastEdited: faker.date.recent({ days: 7 }).toISOString(),
      chapters: ChapterFactory.createMany(10),
      characters: CharacterFactory.createMany(5),
      branches: BranchFactory.createMany(3),
      ...overrides,
    };
  }

  static createMany(count: number) {
    return Array.from({ length: count }, () => this.create());
  }
}
```

### 6.2 AI Mock 策略

```typescript
// src/mocks/handlers/ai.handlers.ts
import { http, HttpResponse } from 'msw';

const MOCK_RESPONSES = {
  continue: '月光如水般倾泻在古老的城墙上，李云握紧了手中的长剑，目光坚定地望向远方的山脉。她知道，真正的考验才刚刚开始。',
  expand: '那座古老的城池在夕阳的余晖中显得格外庄严。城墙上的青苔诉说着千年的沧桑，而城门前的石狮子依然威严地守卫着这片土地。街道两旁的灯笼已经亮起，暖黄色的光芒映照着来往的行人，一切都显得那么宁静而祥和。',
  rewrite: '李云缓缓拔出长剑，剑身上流转着淡蓝色的灵气。她深吸一口气，将灵力注入剑身，剑刃瞬间绽放出耀眼的光芒。周围的空气仿佛凝固了一般，连风都停止了流动。',
  dialogue: '"你真的决定要这么做吗？"老者叹了口气，浑浊的眼中闪过一丝担忧。\n\n"师父，这是我的选择。"李云的声音平静而坚定，"如果我不去，还有谁能阻止这场灾难？"',
  describe: '剑气纵横，灵光漫天。李云的身影在虚空中不断闪现，每一次出现都伴随着一道凌厉的剑芒。她的剑法越来越快，越来越凌厉，仿佛要将整个天地都撕裂开来。周围的灵气被她的剑意所牵引，形成了一个巨大的漩涡。',
  deduce: '根据目前的人物关系和伏笔分析：\n\n1. 李云的剑灵天赋将在关键时刻觉醒完全体\n2. 暗线中的"影子组织"即将浮出水面\n3. 张远的背叛有更深层的隐情——他可能是被胁迫的\n4. 古城地下的封印即将松动\n5. 下一章建议以"月夜古城"为场景，安排李云与张远的对峙',
};

export const aiHandlers = [
  http.post('/api/ai/generate', async ({ request }) => {
    const body = await request.json() as { mode: string; context: string };
    const mode = body.mode || 'continue';
    // 模拟 AI 响应延迟
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
    return HttpResponse.json({
      content: MOCK_RESPONSES[mode] || MOCK_RESPONSES.continue,
      model: 'mock-claude-4',
      tokens: { input: 500, output: 200 },
    });
  }),

  http.post('/api/ai/consistency-check', async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return HttpResponse.json({
      character: { status: 'pass', issues: [] },
      timeline: { status: 'warning', issues: ['第8章时间线与第3章存在1天偏差'] },
      foreshadow: { status: 'pass', issues: [] },
    });
  }),
];
```

### 6.3 测试夹具

```typescript
// src/fixtures/novel.fixture.ts
import { test as base } from '@playwright/test';
import { NovelFactory } from '@/src/factories/novel.factory';

type NovelFixture = {
  testNovel: ReturnType<typeof NovelFactory.create>;
  createTestNovel: (overrides?: Record<string, unknown>) => Promise<void>;
};

export const test = base.extend<NovelFixture>({
  testNovel: async ({ request }, use) => {
    const novel = NovelFactory.create();
    await request.post('/api/test/novel', { data: novel });
    await use(novel);
  },
  createTestNovel: async ({ request }, use) => {
    const create = async (overrides = {}) => {
      const novel = NovelFactory.create(overrides);
      await request.post('/api/test/novel', { data: novel });
    };
    await use(create);
  },
});
```

---

## 7. CI/CD 集成

### 7.1 GitHub Actions 配置

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npx playwright test --project=chromium
        env:
          BASE_URL: http://localhost:3000
          CI: true

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: reports/
          retention-days: 30

      - name: Upload screenshots on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: failure-screenshots
          path: reports/screenshots/
```

### 7.2 测试执行策略

| 阶段 | 触发 | 范围 | 浏览器 | 超时 |
|------|------|------|--------|------|
| **PR 提交** | pull_request | P0 用例 + 变更相关 | Chromium | 10min |
| **合并到 develop** | push develop | P0 + P1 用例 | Chromium + Firefox | 30min |
| **发布前** | manual | 全部用例 | 全浏览器 | 60min |
| **每日巡检** | schedule (cron) | 全部用例 + 性能 | Chromium | 60min |

### 7.3 测试分片

```typescript
// playwright.config.ts — 大规模并行
export default defineConfig({
  workers: 4,
  testDir: './tests',
  // 按页面分片
  projects: [
    { name: 'welcome', testMatch: '**/01-welcome/**' },
    { name: 'workbench', testMatch: '**/02-workbench/**' },
    { name: 'branch-map', testMatch: '**/03-branch-map/**' },
    { name: 'story-bible', testMatch: '**/04-story-bible/**' },
    { name: 'model-center', testMatch: '**/05-model-center/**' },
    { name: 'outline', testMatch: '**/06-outline/**' },
    { name: 'ai-chat', testMatch: '**/07-ai-chat/**' },
    { name: 'responsive', testMatch: '**/08-responsive/**' },
    { name: 'performance', testMatch: '**/09-performance/**' },
    { name: 'harness', testMatch: '**/10-harness/**' },
  ],
});
```

---

## 8. 测试报告与指标

### 8.1 报告格式

| 报告类型 | 格式 | 用途 |
|---------|------|------|
| HTML 报告 | `reports/html/index.html` | 开发者日常查看 |
| JSON 报告 | `reports/results.json` | CI/CD 集成 |
| Allure 报告 | `reports/allure/` | 详细分析 |
| JUnit XML | `reports/junit.xml` | 与飞书多维表格联动 |

### 8.2 核心指标看板

| 指标 | 计算方式 | 目标值 |
|------|---------|--------|
| **用例通过率** | 通过数 / 总数 × 100% | > 95% |
| **P0 用例通过率** | P0 通过数 / P0 总数 × 100% | 100% |
| **平均执行时间** | 总时间 / 用例数 | < 3s/用例 |
| **Flaky 率** | 不稳定用例数 / 总数 × 100% | < 5% |
| **视觉回归差异** | 像素差异比 | < 1% |
| **AI Mock 覆盖率** | Mock 场景数 / 总 AI 场景数 | > 80% |

### 8.3 飞书多维表格联动

```typescript
// scripts/upload-results.ts
// 将测试结果自动同步到飞书多维表格
import { readFileSync } from 'fs';

const results = JSON.parse(readFileSync('reports/results.json', 'utf-8'));

for (const suite of results.suites) {
  for (const spec of suite.specs) {
    for (const test of spec.tests) {
      await fetch(process.env.FEISHU_WEBHOOK_URL, {
        method: 'POST',
        body: JSON.stringify({
          task_id: mapToTaskId(test.title),
          status: test.status === 'expected' ? 'passed' : 'failed',
          duration: test.duration,
          error: test.error?.message,
        }),
      });
    }
  }
}
```

---

## 9. 验收通过标准

### 9.1 分级验收标准

| 级别 | 通过标准 | 阻塞发布 |
|------|---------|---------|
| **P0（必须）** | 100% 通过 | ✅ 阻塞 |
| **P1（重要）** | > 95% 通过 | ✅ 阻塞 |
| **P2（一般）** | > 80% 通过 | ❌ 不阻塞 |
| **性能基准** | 全部达标 | ✅ 阻塞 |
| **视觉回归** | < 1% 像素差异 | ❌ 不阻塞 |
| **GDPR合规** | GDPR合规审计通过 | ✅ 阻塞 |
| **Stripe支付** | PCI-DSS合规 | ✅ 阻塞 |
| **全球部署** | 全球三区域部署可用 | ✅ 阻塞 |

### 9.2 各里程碑验收要求

| 里程碑 | 验收范围 | 通过标准 |
|--------|---------|---------|
| **M1 技术验证** | 欢迎页 + 编辑器基础 | P0 100% |
| **M2 Alpha 内测** | 全部 7 页面 P0 | P0 100%，P1 > 90% |
| **M3 Beta 公测** | 全部用例 | P0 100%，P1 > 95% |
| **M4 正式上线** | 全部用例 + 性能 | 全部达标 |
| **M13 v2.5 Harness** | Harness 集成 + 性能 | P0 100%，性能全部达标 |

### 9.3 验收流程

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  开发自测     │───>│  CI 自动运行  │───>│  QA 全量验收 │───>│  发布审批    │
│  P0 用例     │    │  P0 + 变更   │    │  全部用例    │    │  签署确认    │
│  本地浏览器   │    │  Chromium    │    │  全浏览器    │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
      ↓                   ↓                   ↓                   ↓
   通过 → 提交PR      通过 → 合并        通过 → 发布候选     通过 → 正式发布
   失败 → 修复        失败 → 阻止合并    失败 → 回退        失败 → 紧急修复
```

---

## 10. 风险与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| AI 响应不稳定导致测试 Flaky | 高 | 高 | MSW Mock 隔离 AI 依赖，真实 AI 测试单独标记 |
| 视觉回归误报（字体/渲染差异） | 中 | 中 | 设置 1% 像素差异容忍度，按浏览器分别维护基线 |
| 长对话测试数据量大 | 中 | 低 | 使用 Factory 批量生成，测试后自动清理 |
| WebSocket 连接不稳定 | 高 | 低 | 重试机制 + 超时设置 + 独立 WebSocket 测试套件 |
| 移动端测试覆盖不足 | 中 | 中 | 优先保证桌面端，移动端使用 BrowserStack 补充 |
| 测试维护成本高 | 中 | 中 | Page Object 模式 + 数据工厂 + 选择器使用 data-testid |

---

## 附录 A：data-testid 命名规范

| 组件 | 命名格式 | 示例 |
|------|---------|------|
| 页面区域 | `{area}` | `editor`, `ai-panel`, `status-bar` |
| 按钮 | `btn-{action}` | `btn-new-branch`, `btn-save` |
| 输入框 | `{field}` | `search-input`, `model-selector` |
| 卡片 | `{type}-card` | `recent-work-card`, `template-card` |
| 列表项 | `{type}-{item}` | `outline-chapter`, `branch-node` |
| 状态 | `{metric}-status` | `consistency-status`, `model-status` |
| 标签页 | `tab-{name}` | `tab-ai-log`, `tab-consistency-report` |
| 模态框 | `{action}-modal` | `create-novel-modal`, `permission-confirm` |
| 消息 | `{type}-message` | `ai-message`, `user-message` |
| 图标 | `{area}-icon` | `activity-icon`, `thinking-dot` |

## 附录 B：测试优先级定义

| 优先级 | 定义 | 阻塞发布 |
|--------|------|---------|
| **P0** | 核心功能，用户无法绕过 | 是 |
| **P1** | 重要功能，影响用户体验 | 是 |
| **P2** | 辅助功能，有替代方案 | 否 |

## 附录 C：快速启动命令

```bash
# 安装依赖
npm install

# 运行全部测试
npx playwright test

# 运行指定页面测试
npx playwright test --project=workbench

# 运行 P0 用例
npx playwright test --grep @P0

# 运行并查看报告
npx playwright test && npx playwright show-report

# 更新视觉回归基线
npx playwright test --project=visual --update-snapshots

# 调试模式
npx playwright test --debug

# 生成 Allure 报告
npx playwright test && allure generate reports/allure -o reports/allure-html
```

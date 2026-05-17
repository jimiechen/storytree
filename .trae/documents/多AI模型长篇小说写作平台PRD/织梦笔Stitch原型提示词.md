# 「织梦笔」Stitch 原型提示词

> **工具**：Google Stitch
> **设备类型**：Web（桌面端应用）
> **设计模式**：Thinking with 3 Pro（首次生成）→ 2.5 Pro（精修）

### 版本记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2025-01 | 初始版本，中文UI |
| v2.0 | 2025-04 | 海外版：UI文案改为英文、增加双语切换、增加Stripe支付流程 |

---

## 一、起始提示词（Initial Prompt）

### 1.1 主 Workbench 布局

**Idea：**
A desktop writing application called "织梦笔" (DreamWeaver) — an AI-powered long-form novel writing platform with multi-branch narrative management. The layout is inspired by VS Code's IDE structure but redesigned specifically for creative writing.

**Theme：**
Dark, immersive, and distraction-free. Use a deep navy-to-dark-blue gradient background (#1a1a2e → #16213e). The editing area should be near-black (#0f0f23) for comfortable long writing sessions. Accent color is a soft cyan (#4fc3f7) for AI-related elements. Use warm amber (#ffb74d) for warnings and soft green (#66bb6a) for success states. Typography should use a serif font (Noto Serif SC / Source Han Serif) for the editor body text and a clean sans-serif (Noto Sans SC) for UI elements. The overall feel should be calm, focused, and slightly literary — like a modern digital writer's studio.

**Content：**
The main Workbench screen contains:
- **Left: Activity Bar** — A narrow vertical icon bar (48px wide) with icons for: Outline (📖), Branches (🌿), Knowledge Base (📚), AI Assistant (🤖), Statistics (📊), and Settings (⚙️). The active icon has a cyan left border indicator and subtle glow.
  > 🌐 **海外版英文UI文案** — Tooltip: "Outline / Branch / Bible / AI / Stats / Settings"
- **Left Sidebar (Primary Side Bar, ~260px)** — Shows the Story Explorer panel with a collapsible tree view displaying: Branch tree structure (with branch nodes, depth indicators, and status icons like ✦ for main line, 🔮 for IF-line, 📦 for archived). Below the tree is a "Quick Actions" section with buttons: "+ New Branch", "Merge Branch", "Export".
  > 🌐 **海外版英文UI文案** — Quick Actions: "New Branch" / "Merge Branch" / "Export"
- **Center: Editor Area** — The main writing editor. Shows a chapter titled "第三章：命运的转折" with Chinese novel text. The editor has a clean, minimal toolbar at the top with formatting options (bold, italic, heading levels). The text area uses a comfortable serif font at 16px with generous line-height (1.8). A subtle vertical line on the left margin shows the current branch indicator. At the bottom of the editor, show a thin status bar with: word count "字数: 3,847", today's count "今日: 2,150", total count "总计: 128,450", current model "模型: Claude 4 Opus", and a green consistency check icon "✅ 一致性".
  > 🌐 **海外版英文UI文案** — Status Bar: "Words: 2,345 | Today: 4,500/6,000 | Model: Claude 4 | ✓ Consistent"
- **Right Sidebar (Secondary Side Bar, ~320px)** — The AI Assistant panel with:
  - A model selector dropdown at the top showing "Claude 4 Opus" with a small capability badge "⭐ 文学创作 9.2"
  - AI action buttons in a 2×3 grid: "续写", "扩写", "改写", "对话", "描写", "推演"
    > 🌐 **海外版英文UI文案** — AI Panel buttons: "Continue / Expand / Rewrite / Chat / Describe / Deduce"
  - A collapsible "Context Reference" section showing: "角色: 李云, 苏婉" and "伏笔: 玉佩秘密 (已5章未回收)"
  - A "Consistency Check" section at the bottom with status indicators: ✅ 角色一致性, ✅ 时间线, ⚠️ 伏笔提醒
- **Bottom Panel** — A slim panel (~180px tall) with tabs: "AI 日志", "一致性报告", "版本历史". Currently showing the AI Log tab with a few recent AI generation entries.
  > 🌐 **海外版英文UI文案** — Bottom Panel tabs: "AI Log / Consistency Report / Version History"

**Navigation：**
The layout should feel like a professional IDE — fixed sidebars, resizable panels, and a clean editor area that takes maximum space. The Activity Bar icons should have tooltips on hover.

---

## 二、分屏幕迭代提示词（Screen-by-Screen）

### 2.1 欢迎页 / 工作台首页

**Idea：**
The welcome/home screen of DreamWeaver that users see when they first open the app or click the app icon in the Activity Bar.

**Theme：**
Same dark theme as the main Workbench. Clean, inviting, and purposeful. The center area should feel like a calm workspace entrance.

**Content：**
- **Top area**: App logo "织梦笔" in elegant serif font with a subtle cyan glow, and a tagline "AI 驱动的长篇小说创作平台" in smaller sans-serif text below.
  > 🌐 **海外版英文UI文案** — Logo: "DreamWeaver" + tagline "AI-Powered Long-Form Novel Writing Platform"
- **Center-left**: A "Recent Works" section showing 3-4 work cards in a vertical list. Each card displays: novel title (e.g., "青云志"), genre tag (e.g., "仙侠"), word count (e.g., "128,450 字"), last edited time (e.g., "2小时前"), and a small status badge (e.g., "连载中" in cyan). Cards have a dark card background (#1e1e3a) with a subtle left border color indicating the genre.
  > 🌐 **海外版英文UI文案** — Section title: "Recent Works"; Status badge: "Ongoing" (in cyan)
- **Center-right**: A "Quick Start" section with two large action cards: "新建作品" (Create New Work) with a + icon, and "从模板创建" (Create from Template) with a grid icon. Below that, a "Templates" section showing 4 small template preview cards for genres: 仙侠, 都市, 悬疑, 科幻 — each with a distinct color accent and a brief description.
  > 🌐 **海外版英文UI文案** — Quick Start: "Create New" / "From Template"; Templates: "Xianxia / Urban / Mystery / Sci-Fi"（保留中文类型名但英文UI）
- **Bottom**: A "Writing Stats" mini dashboard showing: today's word count with a small bar chart, this week's trend line, and total works count. All in muted colors that don't distract.
  > 🌐 **海外版英文UI文案** — Stats: "Today's Words" / "This Week" / "Total Works"

### 2.2 分支树视图（Branch Map）

**Idea：**
A dedicated full-screen view of the story's branch structure, showing all narrative branches as an interactive tree diagram.

**Theme：**
Dark background with the branch tree rendered in soft, glowing lines. Main branch in cyan, sub-branches in purple (#ce93d8), IF-lines in amber, archived in gray. The overall feel should be like a constellation map or a mind map — organic and exploratory.

**Content：**
- **Main area**: A horizontal tree diagram flowing left-to-right. The root node "第一章：相遇" is on the left. It branches into two paths: "分支A: 接受邀请" (going up-right) and "分支B: 拒绝邀请" (going down-right). Branch A further splits into "A1: 前往城堡" and "A2: 留在镇上". Each node is a rounded rectangle with the chapter title inside, and a small status badge (✦ main, 🔮 IF-line, 📦 archived). Nodes are connected by smooth curved lines with subtle gradient colors.
- **Right panel**: A "Branch Details" panel showing info about the selected branch: name, type, word count, chapter count, creation date, and a brief description.
  > 🌐 **海外版英文UI文案** — Detail panel labels: "Name / Type / Words / Chapters / Created / Description"
- **Top toolbar**: Buttons for "新建分支", "合并分支", "导出分支", "缩放适配", and view toggle buttons for "树状视图" / "时间线视图".
  > 🌐 **海外版英文UI文案** — Toolbar: "New Branch / Merge / Export / Fit / Tree | Timeline"
- **Bottom stats bar**: "总分支数: 5 | 活跃分支: 3 | 最大深度: 3 | 已归档: 1"
  > 🌐 **海外版英文UI文案** — Stats: "Total / Active / Max Depth / Archived"
  > 🌐 **海外版英文UI文案** — Detail panel actions: "Switch to Branch / Merge to Main / Delete"

### 2.3 知识库管理（Story Bible）

**Idea：**
The Story Bible management screen where authors manage characters, locations, world rules, foreshadowing, and timelines for their novel.

**Theme：**
Dark theme with a card-based layout. Each knowledge type (character, location, item, etc.) has its own accent color. Character cards use a warm teal, location cards use earthy brown, foreshadowing cards use amber/gold. The layout should feel like a well-organized reference library.

**Content：**
- **Top tabs**: Horizontal tab bar with categories: "角色" (Characters), "地点" (Locations), "物品" (Items), "势力" (Factions), "时间线" (Timeline), "伏笔" (Foreshadowing), "世界观" (World Rules). "角色" tab is active.
  > 🌐 **海外版英文UI文案** — Tabs: "Characters / Locations / Items / Factions / Timeline / Foreshadowing / World"
- **Main area**: A grid of character cards (3 columns). Each card shows:
  - Character avatar placeholder (a stylized circular icon with the character's surname)
  - Name in large serif font (e.g., "李云")
  - Key attributes in a compact layout: "年龄: 22 | 身份: 修仙弟子 | 出场: 45章"
  - A status indicator: "✅ 无矛盾" or "⚠️ 1个矛盾"
  - Tags at the bottom: e.g., "主角", "青云宗"
- **Right panel (expanded card)**: When a character card is selected, the right panel shows detailed info in sections: "基本信息" (name, age, appearance, identity), "性格特征" (personality traits as tags), "人物关系" (relationship graph with connected character names), "成长弧线" (character arc timeline: "Ch1-10 菜鸟入门 → Ch11-30 初露锋芒 → Ch31+ 挑战权威"), "语言风格" (speech style description).
- **Top-right**: An "AI 自动提取" button and a "+ 手动添加" button.
  > 🌐 **海外版英文UI文案** — Buttons: "AI Extract" / "+ Add Entry"
- **AI suggestion banner**: A subtle banner at the bottom: "💡 AI建议：第42章中李云使用了'剑气'，建议添加到角色能力列表 [接受] [忽略]"
  > 🌐 **海外版英文UI文案** — AI Suggestion: "AI suggests: Add 'Sword Spirit' to Li Yun's abilities [Accept] [Dismiss]"

### 2.4 模型中心（Model Center）

**Idea：**
The AI model management screen where users can browse, configure, and compare AI models, and set up collaboration pipelines.

**Theme：**
Dark theme with a tech-forward aesthetic. Each model card has a subtle gradient border indicating its provider (Anthropic = warm orange, OpenAI = green, DeepSeek = blue, Alibaba = purple). The collaboration pipeline section should feel like a visual workflow builder.

**Content：**
- **Top section "我的模型"**: A 2×2 grid of model cards. Each card contains:
  - Model name (e.g., "Claude 4 Opus") with a colored status dot (🟢 active)
  - Provider name in small text
  - Capability scores as horizontal progress bars: "文学创作 9.2", "对话生成 9.0", "长文连贯 9.4"
  - Connection type badge: "平台代理" or "BYOK"
  - Context window size: "200K tokens"
  - Action buttons: "设为默认", "配置"
    > 🌐 **海外版英文UI文案** — Model cards: "Set as Default" / "Configure"
- **Bottom section "协作流水线"**: A vertical pipeline visualization showing 4 steps connected by arrows:
  - Step 1: "构思大纲" — model icon "DeepSeek V3 → Claude 4 Opus" with [编辑] [测试] buttons
  - Step 2: "章节扩写" — model icon "Claude 4 Opus" with [编辑] [测试] buttons
  - Step 3: "中文润色" — model icon "通义千问 Max → Claude 4 Opus" with [编辑] [测试] buttons
  - Step 4: "质量评审" — model icon "GPT-4o (评审模式)" with [编辑] [测试] buttons
  - At the bottom: "[+ 添加步骤]" and "[保存流水线]" buttons
  > 🌐 **海外版英文UI文案** — Pipeline steps: "Outline Drafting → Chapter Expansion → Polishing → Quality Review"
  > 🌐 **海外版英文UI文案** — Buttons: "Edit Step" / "Test" / "+ Add Step" / "Save Pipeline"

### 2.5 大纲管理（Outline View）

**Idea：**
A multi-level outline management view showing the novel's structure from volumes down to scenes, with progress tracking.

**Theme：**
Dark theme with an indented tree structure. Each level has a slightly different left border color. Completed items have a green checkmark, in-progress items have a pulsing cyan dot, and pending items are gray.

**Content：**
- **Tree structure** (indented, collapsible):
  ```
  📖 第一卷：初入江湖
    ├── 第一章：相遇 ............ ✅ 定稿 (3,200字)
    ├── 第二章：拜师 ............ ✅ 定稿 (4,100字)
    ├── 第三章：命运的转折 ........ 🔵 写作中 (2,150字)
    └── 第四章：初试锋芒 ........ ⚪ 待写
  📖 第二卷：风云际会
    ├── 第五章： ................ ⚪ 待写
    └── 第六章： ................ ⚪ 待写
  ```
- Each tree item shows: chapter title, status badge (✅定稿/🔵写作中/⚪待写/🟡初稿/🟣精修), and word count
  > 🌐 **海外版英文UI文案** — Status badges: "Final / Writing / Pending / Draft / Polished"
- **Right panel**: Shows the selected chapter's outline notes and key plot points
- **Drag handle**: Each item has a drag handle (⠿) for reordering
- **Top toolbar**: "新建章节", "批量状态更新", "卡片视图/列表视图" toggle
  > 🌐 **海外版英文UI文案** — Toolbar: "New Chapter" / "Batch Update" / "Card | List"

### 2.6 AI 对话面板（AI Chat Panel - 侧边栏内）

**Idea：**
The AI assistant chat panel embedded in the right sidebar, where users can have conversational interactions with the AI about their story.

**Theme：**
Dark theme with a chat interface. AI messages have a subtle cyan left border, user messages have a white/light left border. The typing indicator should use the app's accent cyan color with a pulsing animation.

**Content：**
- **Chat area**: A scrollable message list showing:
  - User message: "帮我续写下一段，李云在悬崖边遇到苏婉的场景"
  - AI response: A generated paragraph of Chinese novel text in serif font, with a subtle "AI" badge. Below the text, small action buttons: "采纳", "重新生成", "扩写", "改写"
    > 🌐 **海外版英文UI文案** — Actions: "Accept / Regenerate / Expand / Rewrite"
  - User message: "把苏婉的对话改得更温柔一些"
  - AI response: The revised version with changes highlighted
- **Input area** at the bottom: A text input field with a send button. Above the input, quick action chips: "/续写", "/扩写", "/改写", "/对话", "/描写", "/推演"
  > 🌐 **海外版英文UI文案** — Quick chips: "/continue /expand /rewrite /chat /describe /deduce"
- **Context bar** above the chat: Shows current context being used: "📖 第三章 | 🧑 李云, 苏婉 | 📍 悬崖"
  > 🌐 **海外版英文UI文案** — Context bar: "Chapter 8 · Li Yun · Ancient City"

---

## 三、新增页面（海外版）

### 3.1 语言切换与设置（Settings）

**Idea：**
The Settings screen where users can configure language preferences, writing language, region, and theme. This is a new screen for the overseas version to support internationalization.

**Theme：**
Dark theme consistent with the rest of the app. Clean form layout with grouped settings sections, using the same card-based design (#1e1e3a card background). Section headers in sans-serif with subtle cyan accent. Toggle switches and dropdown selectors should feel native and polished.

**Content：**
- **Page title**: "设置" (Settings) displayed at the top of the panel.
- **Section 1 — "语言" (Language)**:
  - A dropdown selector for the UI display language with options: "English / 中文 / 日本語 / 한국어"
  - The currently selected language is highlighted with a cyan border
- **Section 2 — "写作语言" (Writing Language)**:
  - A dropdown selector for the default writing language: "Chinese / English / Auto-detect"
  - A brief description below: "Auto-detect will match the language of your current project"
- **Section 3 — "地区" (Region)**:
  - A dropdown selector: "Auto-detect / US / EU / Asia"
  - A note: "Affects data residency and default AI model routing"
- **Section 4 — "主题" (Theme)**:
  - Three theme preview cards displayed horizontally: "Dark / Light / Warm"
  - Each card shows a small preview thumbnail of the theme
  - The active theme has a cyan border and a checkmark indicator
- **Bottom**: A "Save Settings" / "保存设置" button in primary cyan style.

> 🌐 **海外版英文UI文案** —
> - Page title: "Settings"
> - Section headers: "Language / Writing Language / Region / Theme"
> - Language options: "English / 中文 / 日本어 / 한국어"
> - Writing Language options: "Chinese / English / Auto-detect"
> - Region options: "Auto-detect / US / EU / Asia"
> - Theme options: "Dark / Light / Warm"
> - Save button: "Save Settings"

---

### 3.2 Stripe 支付流程（Subscription & Pricing）

**Idea：**
The subscription and pricing page where users can view plan details, compare features, and subscribe via Stripe integration. This is a new page for the overseas version to support monetization.

**Theme：**
Dark theme with a clean, marketing-oriented layout. The pricing cards should feel premium and trustworthy. Use the app's dark background (#1a1a2e) with card backgrounds (#1e1e3a). The recommended plan (Pro) should have a prominent cyan border with a "Recommended" badge. Stripe branding should be subtle — a small "Powered by Stripe" text at the bottom.

**Content：**
- **Page title**: "选择你的计划" (Choose Your Plan) centered at the top.
- **Billing toggle**: A toggle switch at the top-right: "月付 / 年付" (Monthly / Annual) with a discount note: "年付节省20%".
  > 🌐 **海外版英文UI文案** — Toggle: "Monthly / Annual"; Discount note: "Save 20% with annual billing"
- **Four pricing cards** arranged horizontally:
  - **Free Plan** (免费版):
    - Price: "$0 / month"
    - Features: "Basic AI writing (10K words/day)", "3 active branches", "Basic Story Bible (50 entries)", "Community support"
    - Button: "Current Plan" (if user is on Free) or "Get Started"
  - **Pro Plan** (专业版) — Recommended:
    - Price: "$19 / month" (or "$15 / month" with annual)
    - A "Recommended" / "推荐" badge in cyan at the top
    - Features: "Advanced AI writing (unlimited)", "Unlimited branches", "Full Story Bible", "Priority support", "Custom pipelines"
    - Button: "Subscribe" / "订阅"
  - **Studio Plan** (工作室版):
    - Price: "$49 / month" (or "$39 / month" with annual)
    - Features: "Everything in Pro", "Multi-model collaboration", "Team sharing (up to 5)", "API access", "Dedicated support"
    - Button: "Subscribe" / "订阅"
  - **Team Plan** (团队版):
    - Price: "Custom pricing"
    - Features: "Everything in Studio", "Unlimited team members", "Admin dashboard", "SSO integration", "SLA guarantee"
    - Button: "Contact Sales" / "联系销售"
- **Feature comparison table** below the cards: A detailed table comparing all features across the 4 plans, with checkmarks (✅) and dashes (—) for unavailable features.
- **Bottom**: A small "Powered by Stripe" badge and a link to "Terms of Service" / "服务条款".

> 🌐 **海外版英文UI文案** —
> - Page title: "Choose Your Plan"
> - Plan names: "Free / Pro / Studio / Team"
> - Buttons: "Subscribe" / "Current Plan" / "Contact Sales"
> - Recommended badge: "Recommended"
> - Annual discount: "Save 20% with annual billing"
> - Footer: "Powered by Stripe" · "Terms of Service"

---

### 3.3 GDPR Cookie Banner（Cookie 同意横幅）

**Idea：**
A GDPR-compliant cookie consent banner that appears at the bottom of the screen on first visit for EU users. This is a mandatory element for the overseas version to comply with European data protection regulations.

**Theme：**
A semi-transparent dark overlay banner fixed to the bottom of the viewport. Use a slightly lighter background than the app (#2a2a4a with 95% opacity) with a subtle top border in cyan. Text should be clean and readable in white/light gray. Buttons should follow the app's button style — primary button in cyan, secondary buttons with transparent background and cyan border.

**Content：**
- **Banner text**: "我们使用 Cookie 来改善您的体验。继续浏览即表示您同意我们的 Cookie 政策。" displayed on the left side.
- **Three buttons** on the right side:
  - "全部接受" — Primary button (cyan background, white text)
  - "自定义" — Secondary button (transparent background, cyan border)
  - "全部拒绝" — Text-only link style
- **Links**: A small "隐私政策" (Privacy Policy) link at the bottom-left of the banner.

> 🌐 **海外版英文UI文案** —
> - Banner text: "We use cookies to improve your experience. By continuing to browse, you agree to our Cookie Policy."
> - Buttons: "[Accept All] [Customize] [Reject All]"
> - Link: "Privacy Policy"

---

## 四、主题迭代提示词（Theme Iteration）

### 4.1 修改整体主题色

```
Update the app theme to use a warmer, more literary color palette.
Change the background from navy-blue to a deep charcoal with warm undertones (#1a1a1a → #2d2d2d).
Replace the cyan accent (#4fc3f7) with a warm gold (#d4a574).
Keep the dark editor area but add a very subtle warm tint.
Update all status indicators and buttons to match the new warm palette.
```

### 4.2 调整编辑器区域

```
Focus on the center editor area. Make the following changes:
- Increase the editor font size to 18px and line-height to 2.0 for more comfortable reading
- Add a subtle parchment-like texture to the editor background (very low opacity, 3-5%)
- Add a narrow vertical "branch indicator" line on the left margin in cyan color
- Show paragraph-level word counts in the right margin (very subtle, muted gray text)
- Add a subtle drop shadow around the editor area to create depth separation from sidebars
```

### 4.3 优化侧边栏

```
Redesign the right sidebar (AI Assistant panel) to be more compact and efficient:
- Reduce the model selector to a single-line dropdown without the capability badge
- Change the AI action buttons from a 2×3 grid to a horizontal icon-only toolbar (6 small circular icon buttons)
- Make the "Context Reference" section collapsible and default to collapsed state
- Move the "Consistency Check" section to a small floating indicator at the top-right corner of the editor area instead
- Add a small "AI thinking..." animation (three pulsing dots in cyan) that appears at the cursor position when AI is generating
```

### 4.4 分支树视图优化

```
Redesign the branch tree view with these improvements:
- Change from left-to-right horizontal layout to a top-to-bottom vertical tree layout
- Make the branch connection lines thicker (2px) with a subtle glow effect
- Add small chapter count badges on each branch node
- Add a mini-map overview in the bottom-right corner showing the full tree at a glance
- Add a search bar at the top to filter branches by name or content
- Use different node shapes: rounded rectangles for active branches, dashed borders for archived branches
```

### 4.5 知识库卡片优化

```
Refine the Story Bible character cards:
- Make the character avatar a larger, more prominent circular element (80px) with a gradient background using the character's associated color
- Rearrange the card layout to a horizontal format: avatar on the left, info on the right
- Add small relationship icons (❤️ ally, ⚔️ rival, 👨‍🏫 mentor) next to related character names
- Add a subtle progress bar showing the character's "story arc completion" percentage
- For the expanded detail panel, use a tabbed layout instead of stacked sections: "基本信息 | 性格 | 关系 | 成长弧线"
```

---

## 五、多屏幕批量更新提示词

### 5.1 全局主题切换

```
Make all buttons across all screens have fully rounded corners (border-radius: 8px).
Update the primary action buttons to use the brand cyan color (#4fc3f7) with white text.
Make all secondary buttons have a transparent background with a 1px cyan border.
Ensure consistent spacing and padding across all panels and cards.
```

### 5.2 语言切换

```
Switch all product copy, button text, and labels to English.
Keep the novel content (chapter text, character names) in Chinese.
Translate all UI elements including: Activity Bar tooltips, sidebar headers, button labels, status messages, and placeholder text.
```

---

## 六、变体生成提示词（Variations）

### 6.1 布局变体

```
Generate 3 layout variations of the main Workbench screen:
- Variation A: Move the AI Assistant panel to the bottom (as a horizontal panel below the editor)
- Variation B: Use a single sidebar with tabs to switch between Story Explorer, Knowledge Base, and AI Assistant
- Variation C: Make the editor full-width with floating panels that can be toggled on/off
```

### 6.2 风格变体

```
Generate 3 style variations of the main Workbench:
- Variation A: Use a Glassmorphism style with frosted glass panels, subtle blur effects, and semi-transparent backgrounds
- Variation B: Use a minimal Swiss Style with strict grid alignment, heavy use of whitespace, and monochrome accent colors
- Variation C: Use a subtle literary aesthetic with warm paper-like textures, classic serif typography, and sepia-toned accent colors
```

---

## 七、使用建议

### 7.1 推荐生成顺序

| 步骤 | 屏幕 | 设计模式 | 说明 |
|------|------|---------|------|
| 1 | 主 Workbench 布局 | Thinking with 3 Pro | 最核心的屏幕，先确定整体布局 |
| 2 | 欢迎页 | 2.5 Pro | 确定品牌调性 |
| 3 | 分支树视图 | Thinking with 3 Pro | 复杂交互，需要深度推理 |
| 4 | 知识库管理 | 2.5 Pro | 卡片布局 |
| 5 | 模型中心 | 2.5 Pro | 技术感界面 |
| 6 | 大纲管理 | Fast | 相对简单的树形结构 |
| 7 | AI 对话面板 | 2.5 Pro | 聊天界面 |
| 8 | 语言切换与设置 | 2.5 Pro | 海外版新增，国际化配置 |
| 9 | Stripe 支付流程 | Thinking with 3 Pro | 海外版新增，定价页面 |
| 10 | GDPR Cookie Banner | Fast | 海外版新增，合规横幅 |

### 7.2 迭代技巧

1. **一次只改一个主要元素**：每次 Prompt 只聚焦一个面板或一个视觉变化
2. **使用 UI/UX 关键词**：如 "card layout"、"tree view"、"split panel"、"status bar"、"tooltip"
3. **指定具体屏幕**：如 "On the main Workbench screen, change..." 避免歧义
4. **善用 Variations**：不确定方向时，生成 3 个变体对比选择
5. **参考品牌主题**：可描述 "Reference VS Code's sidebar behavior" 或 "Like Notion's clean minimal style"

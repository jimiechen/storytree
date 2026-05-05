# Week 1：Stitch MVP 原型工具提示词集

> **文档版本**: v1.0
> **创建日期**: 2026-05-05
> **状态**: 可直接使用
> **来源**: TabAI 评审意见 (TabAI会话_1777981039651.md)
> **关联文档**: WEEK1-MVP-PRODUCT-PROTOTYPE-CHECKLIST.md

---

## 使用说明

### 📌 如何使用本文档

1. **复制英文提示词** → 粘贴到 Stitch 或其他原型生成工具（如 v0, Galileo, Figma AI 等）
2. **阅读中文说明** → 理解每个提示词的设计意图和覆盖范围
3. **按优先级执行** → 先做 P0 原型（章节编辑器、AI 任务面板、AI 结果卡片）
4. **保持 Mock 模式** → 所有原型必须明确标识为模拟模式，不展示真实模型能力

### ⚠️ 核心约束

| 约束项 | 要求 |
|-------|------|
| **模式** | 仅 Mock Mode，不接真实 AI |
| **模型调用** | ❌ 禁止出现真实 API Key、模型配置 |
| **高权限工具** | ❌ 禁止 Bash/WebFetch/WebSearch/Agent/Task |
| **外部访问** | ❌ 禁止网络请求、远程 API、云服务 |
| **核心目标** | 验证最小产品闭环，而非展示 AI 能力 |

---

## Prompt 1: 总体 MVP App 原型

### 英文提示词 (可直接粘贴)

```text
Design a desktop-first MVP prototype for an AI novel editor called "Card Story Novel Studio" (卡牌物语小说工作室).

The app is in Mock Mode only. It does not connect to real AI models, real agents, API keys, command execution, web search, or external tools.

The product helps a novelist manage a fiction project, edit chapters, view character cards, and run simulated AI writing tasks through a FakeAgentProvider.

Create a clean, modern, professional writing workspace with the following main areas:

1. A top project header showing project name, genre, word count, last updated time, and a visible "Mock Mode" badge (🧪).
2. A left sidebar with chapter list, chapter status (draft/revised/completed), word count, and selected chapter highlight.
3. A central chapter editor with title input, outline section, main rich text writing area, and AI suggestion result cards below.
4. A right sidebar with character cards (name, role, personality, speaking style, relationships) and worldbuilding notes.
5. A bottom or floating AI task panel with buttons for "Continue Writing", "Rewrite Selection", "Summarize Chapter", and "Rewrite in Character Voice".
6. An AI task log drawer sliding from the right, showing task history with status badges: pending, running, success, failed, cancelled, permission_denied, quota_exceeded.
7. Clear action buttons on AI result cards: "Accept to Editor", "Save to Suggestions", "Discard".

Use a calm creative writing style with:
- Soft neutral backgrounds (warm gray or soft parchment)
- White or light content cards with subtle borders
- Comfortable readable typography for long-form writing
- Clear status badges with color coding (gray=pending, blue=running, green=success, red=failed, orange=warning)
- Minimal distractions, editor-first layout
- Elegant fantasy writing atmosphere but NOT game-like
- Professional productivity tool feel, NOT chatbot UI
- Side panels should feel supportive, not dominant

Color palette suggestions:
- Background: #F5F1E8 (warm parchment) or #FAFAFA (soft gray)
- Primary: #4338CA (deep indigo) or #7C3AED (muted violet)
- Accent: #D97706 (amber) or #F59E0B (soft gold)
- Success: #10B981 (green)
- Warning: #F59E0B (orange)
- Error: #EF4444 (red)
- Info: #3B82F6 (blue)

DO NOT INCLUDE:
- Real AI model provider settings (OpenAI, Claude, Gemini, etc.)
- API key input fields or configuration panels
- Billing, subscription, or usage quota pages
- Command execution tools, terminal panels, Shell/Bash interfaces
- Web search tools, web scraping, URL fetchers
- External agent tools, multi-agent orchestration
- Deployment settings, Docker configs, CI/CD panels
- Plugin marketplace or extension management
- Admin dashboard, user management, role-based access
- Real cloud sync settings or Git integration panels
- Social features, community, comments, sharing
- Publishing marketplace, e-book export, format conversion
- NFT, token, blockchain, or Web3 features
- Gaming UI elements, heavy gradients, cyberpunk aesthetics
- Chat-first layouts or conversational interfaces

The prototype must clearly communicate: "This is a Mock Mode prototype for validating the minimum viable product loop of an AI novel editor."
```

### 中文说明

这个提示词用于生成**完整 MVP 应用总览原型**。它强调：

**核心要素**：
- ✅ 桌面端优先的写作工作空间布局
- ✅ 明确的 Mock Mode 标识
- ✅ 5 大区域：项目头部 + 章节侧栏 + 编辑区 + 角色侧栏 + AI 任务面板
- ✅ AI 日志抽屉 + 结果操作按钮

**设计风格**：
- 专业写作工具感（类似 Notion、Scrivener、Ulysses）
- 温暖创意氛围（非游戏化、非聊天机器人）
- 编辑器优先布局（侧栏辅助，不喧宾夺主）

**严格禁止**：
- 所有真实模型配置、API Key、计费系统
- 所有高权限工具（终端、命令行、网络搜索）
- 所有非 MVP 功能（社交、发布、插件市场等）

---

## Prompt 2: 小说项目工作台 / Dashboard 页面

### 英文提示词 (可直接粘贴)

```text
Design the project dashboard (home/workspace) screen for an AI novel editor MVP in Mock Mode.

This is the first screen users see when opening the app. It provides an overview of the current fiction project.

PROJECT INFORMATION TO DISPLAY:

Project Title: "卡牌物语：发条王国" (Card Story: The Clockwork Kingdom)
Genre: Fantasy Adventure (奇幻冒险)
Description: "在一个由巨大机械发条驱动的王国里，一位年轻的铸卡师发现了能改写现实的神秘卡牌..."
Total Word Count: 128,450 words
Chapter Count: 24 chapters (8 draft, 12 revised, 4 completed)
Character Count: 15 characters
Last Updated: 2026-05-04 14:32
Current Mode: MOCK MODE (display prominent badge)

LAYOUT REQUIREMENTS:

1. TOP HEADER SECTION:
   - Project title (large, bold)
   - Genre badge (pill-shaped, colored)
   - Word count statistic
   - Last updated timestamp
   - Mock Mode banner/badge (🧪 Mock Mode - 模拟模式) - MUST be visible and unmissable

2. LEFT SECTION - CHAPTER PROGRESS OVERVIEW:
   - Chapter progress bar or visual chart
   - Breakdown by status:
     * Draft chapters: 8 (gray dots/cards)
     * Revised chapters: 12 (blue dots/cards)
     * Completed chapters: 4 (green dots/cards)
   - Recent chapter activity (last 5 edited chapters with timestamps)
   - Quick action: "Continue Writing" button (links to latest draft chapter)

3. CENTER/MAIN SECTION - CURRENT WRITING FOCUS:
   - Current chapter being edited (Chapter 12: "齿轮的秘密")
   - Chapter word count: 3,240 words
   - Chapter status badge: "Revised"
   - Last edited: 2 hours ago
   - Quick preview of first 100 characters of chapter content
   - "Open Editor" button

4. RIGHT SECTION - ACTIVE CHARACTERS & WORLD NOTES:
   - Active character cards (top 3-5 characters appearing in current chapter):
     * Character name + role
     * Personality trait tag
     * Small avatar or icon
   - Worldbuilding quick notes (3-4 key points):
     * Current location setting
     * Important rule of the world
     * Pending plot thread
   - "View All Characters" link
   - "View World Bible" link

5. BOTTOM SECTION - RECENT AI MOCK TASKS:
   - Recent AI task history (last 5-10 tasks)
   - Each task shows:
     * Task type icon (✏️ Continue Writing / 🔄 Rewrite / 📝 Summarize / 🎭 Voice Rewrite)
     * Related chapter name
     * Status badge (pending/running/success/failed/cancelled)
     * Timestamp
   - "View All Tasks" link to open AILog drawer

STATUS BADGE EXAMPLES TO INCLUDE:
- Show at least one task in each state: pending (gray), running (blue with spinner), success (green), failed (red), cancelled (gray strikethrough)

UI STYLE REQUIREMENTS:
- Clean, focused dashboard layout
- Card-based information grouping
- Soft shadows, rounded corners (8-12px radius)
- Comfortable spacing between sections
- Professional productivity tool aesthetic
- Suitable for a novelist starting a writing session

EXPLICITLY EXCLUDE:
- Real AI model configuration panels
- API key input fields
- External integration settings (GitHub, Google Drive, Dropbox)
- Billing or subscription information
- Terminal or command-line access
- Plugin or extension marketplace
- Admin or developer settings
- Social features or community feeds
```

### 中文说明

这个提示词用于生成**项目首页 / 工作台页面**。

**设计目标**：
让用户一进入系统就能快速了解：
1. 当前项目的基本信息（名称、题材、字数）
2. 章节进度概览（草稿/修订/完成分布）
3. 当前正在编辑的章节
4. 活跃角色和世界观要点
5. 最近执行的 AI Mock 任务记录

**关键数据**（Mock 数据示例）：
- 项目名："卡牌物语：发条王国"
- 题材：奇幻冒险
- 字数：128,450
- 章节：24 章（8 草稿 / 12 修订 / 4 完成）
- 角色：15 个

**布局结构**：
```
┌─────────────────────────────────────────────────────┐
│  [项目标题] [题材标签]  字数: 128,450  更新: 14:32    │
│  🧪 MOCK MODE - 模拟模式                              │
├──────────┬─────────────────────┬─────────────────────┤
│ 章节进度  │   当前编辑焦点       │   活跃角色 & 世界观  │
│          │                     │                     │
│ ●●●○○○  │  第12章: 齿轮的秘密   │  🔮 艾琳 · 铸卡师   │
│ 草稿: 8  │  状态: 已修订        │  ⚙️ 维克多 · 发条匠 │
│ 修订: 12 │  字数: 3,240         │  👑 凯瑟琳女王      │
│ 完成: 4  │  [打开编辑器]        │                     │
├──────────┴─────────────────────┴─────────────────────┤
│  最近 AI Mock 任务                                     │
│  ✏️ 续写 第11章  ✅ 成功  13:45                       │
│  🔄 改写 第9章   🔄 运行中  14:20                      │
│  📝 摘要 第15章  ❌ 失败   12:30                       │
└─────────────────────────────────────────────────────┘
```

---

## Prompt 3: 章节编辑器页面 (核心页面)

### 英文提示词 (可直接粘贴)

```text
Design the chapter editor screen - this is THE CORE PAGE of the AI novel editor MVP in Mock Mode.

This page is where writers spend 80%+ of their time. It must feel like a professional writing tool first, with AI assistance as supportive features (not the main focus).

PAGE LAYOUT (Three-column layout):

┌──────────────────────────────────────────────────────────────────────┐
│ [← 返回工作台]  第12章: 齿轮的秘密  [保存] [Mock Mode 🧪]           │
├────────────┬───────────────────────────────┬────────────────────────┤
│            │                               │                        │
│  章节列表   │      章节编辑主区域             │    角色卡 & 世界观侧栏   │
│            │                               │                        │
│ ▸ 第10章   │  [章节标题输入框]              │  ┌──────────────────┐  │
│ ▸ 第11章   │  齿轮的秘密                    │  │ 艾琳 · 铸卡师     │  │
│ ▾ 第12章 ★ │  ─────────────────             │  │ 身份: 主角        │  │
│ ▸ 第13章   │                               │  │ 性格: 好奇、勇敢   │  │
│ ▸ 第14章   │  【章节目标】                   │  │ 目标: 找到真相     │  │
│            │  揭示发条王国的能源核心          │  │ 口吻: 简洁直接     │  │
│            │  是由某种生物组织驱动的...       │  │ 秘密: 能听到卡牌   │  │
│            │                               │  │     低语           │  │
│  状态筛选:  │  【剧情要点】                   │  ├──────────────────┤  │
│  ○ 全部    │  • 艾琳进入地下工坊              │  │ 关系:            │  │
|  ● 草稿    │  • 发现异常的发条装置            │  │ ↗ 维克多 (导师)   │  │
|  ○ 修订    │  • 与守卫发生对峙               │  │ ↘ 凯瑟琳 (对立)   │  │
|  ○ 完成    │                               │  └──────────────────┘  │
│            │  ─────────────────             │                        │
│            │                               │  ┌──────────────────┐  │
│            │  正式正文编辑区:                │  │ 世界观备注         │  │
│            │                               │  │ 地点: 地下工坊     │  │
│  在昏暗的  │  在昏暗的地底工坊里，艾琳...    │  │ 规则: 发条不能     │  │
│  地底工坊  │  （可编辑的富文本区域）          │  │     倒转运行       │  │
│  里，艾琳  │                               │  │ 时间线: 第3天      │  │
│  ...       │  ████ 光标位置                  │  └──────────────────┘  │
│            │                               │                        │
│            │  ─────────────────             │                        │
│            │                               │                        │
│            │  🤖 AI 建议结果区               │                        │
│            │  ┌────────────────────────┐   │                        │
│            │  │ ✏️ 续写建议 (Mock)      │   │                        │
│            │  │ 状态: ✅ 成功           │   │                        │
│            │  │                       │   │                        │
│            │  │ 她轻轻转动最外面的     │   │                        │
│            │  │ 齿轮，突然听到了细微   │   │                        │
│            │  │ 的嗡鸣声...            │   │                        │
│            │  │                       │   │                        │
│            │  │ [采纳到正文] [保存到   │   │                        │
│            │  │  建议] [丢弃]          │   │                        │
│            │  └────────────────────────┘   │                        │
├────────────┴───────────────────────────────┴────────────────────────┤
│ [✏️ 续写] [🔄 改写选中] [📝 摘要] [🎭 角色语气改写]  │ FakeAgentProvider │
└──────────────────────────────────────────────────────────────────────┘

LEFT SIDEBAR - CHAPTER LIST (width: 220-260px):
- Chapter title (collapsible tree if needed)
- Chapter status indicator (colored dot or icon):
  * 🟢 Draft (gray)
  * 🔵 Revised (blue)
  * ✅ Completed (green)
- Word count per chapter
- Currently selected chapter highlighted (soft background color)
- Status filter tabs: All | Draft | Revised | Completed
- Scrollable list (show 15-20 chapters visible area)

CENTER EDITOR - MAIN WRITING AREA (flexible width, takes remaining space):
- Chapter title input field (editable, large font)
- Outline/Goal section (collapsed by default, expandable):
  * Chapter goal (1-2 sentences)
  * Plot beats/key events (bullet list)
- Main text editing area:
  * Rich text or Markdown support
  * Clean typography, comfortable line height (1.6-1.8)
  * Wide margins for readability
  * Word count display (bottom-right of editor)
  * Auto-save indicator
- AI Suggestion Result Cards (below editor):
  * Each card shows:
    - Task type icon + label (e.g., "✏️ 续写建议")
    - Mock Mode badge ("Generated by FakeAgentProvider")
    - Status badge (success/failed/cancelled)
    - Generated text preview (200-300 chars visible, expandable)
    - Action buttons: "Accept to Editor" (primary) | "Save to Suggestions" (secondary) | "Discard" (tertiary)
  * Multiple suggestion cards can stack vertically

RIGHT SIDEBAR - CHARACTER & WORLDBUILDING (width: 280-320px):
- Character cards section:
  * Character avatar/icon
  * Name + Role (e.g., "艾琳 · 铸卡师 - 主角")
  * Personality tags (e.g., "好奇", "勇敢", "固执")
  * Goal (short description)
  * Secret (hidden behind click/tap, show eye icon)
  * Speaking style (example dialogue snippet)
  * Relationship tags (linked to other characters)
  * Action buttons: "Use as Context" | "Pin Character" | "View Relationships"
- Worldbuilding notes section:
  * Current location
  * Rules of the world (2-3 bullet points)
  * Timeline position
  * Unresolved conflicts or clues
- Collapsible sections to save space

BOTTOM ACTION BAR - AI TASK PANEL:
- Floating or fixed at bottom of editor
- Task type buttons with icons:
  * ✏️ Continue Writing (续写)
  * 🔄 Rewrite Selection (改写选中文本)
  * 📝 Summarize Chapter (摘要)
  * 🎭 Rewrite in Character Voice (角色语气改写)
- When clicked, show brief input confirmation then execute
- Show task status inline: pending → running (with spinner) → success/failed
- Provider label: "FakeAgentProvider"

EDITOR DESIGN PRINCIPLES:
- Typography-first: Use serif or clean sans-serif fonts suitable for long reading
- Distraction-free: Minimal chrome, maximum content area
- Comfortable line length: 60-80 characters per line
- Generous whitespace: Don't cram information
- Subtle UI elements: Borders, dividers should be soft, not harsh
- Focus mode option: Could collapse sidebars for full-screen writing

MOCK MODE INDICATORS (MUST BE VISIBLE):
- Top bar: "🧪 Mock Mode" badge (persistent)
- AI result cards: "Generated by FakeAgentProvider" label
- AI task panel: "Simulated AI output, no real model call" hint
- No real model names (no GPT-4, Claude, etc.)
- No API keys, no provider selection, no temperature/settings

EXPLICITLY PROHIBITED:
- Real AI model configuration (OpenAI/Claude/Gemini settings panels)
- API key input or management
- Token usage counters or billing information
- Command execution terminals or shell access
- Web search or browser integration
- External agent or plugin management
- Code editor or developer tools
- Chat interface or conversation view (this is NOT a chatbot)
- Heavy animations or distracting effects
```

### 中文说明

这个提示词用于生成**核心章节编辑器页面**——这是 MVP 最重要的页面。

**为什么这是 P0 优先级？**
- 用户 80%+ 的时间花在这里
- 决定产品的"专业写作工具"定位
- 必须体现"编辑器优先，AI 辅助"的理念
- 验证最小闭环的核心环节

**三栏布局**：
```
左栏 (220-260px)     中栏 (弹性宽度)           右栏 (280-320px)
┌────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  章节列表    │   │                  │   │   角色卡 & 世界观  │
│  · 状态筛选  │   │  章节标题输入      │   │                  │
│  · 章节导航  │   │  ─────────       │   │  · 角色信息卡片   │
│  · 字数统计  │   │  章节目标/大纲    │   │  · 口吻设定      │
│            │   │  ─────────       │   │  · 关系网络      │
│            │   │                  │   │  · 世界观备注     │
│            │   │  正文编辑区       │   │                  │
│            │   │  (富文本/Markdown)│   │                  │
│            │   │                  │   │                  │
│            │   │  ─────────       │   │                  │
│            │   │  AI 建议结果区    │   │                  │
│            │   │  [结果卡片]       │   │                  │
│            │   │  [采纳/保存/丢弃]  │   │                  │
└────────────┘   └──────────────────┘   └──────────────────┘
                  ┌──────────────────────────────────────────┐
                  │  [续写] [改写] [摘要] [语气改写]  Mock   │
                  └──────────────────────────────────────────┘
```

**关键交互**：
1. 选择章节 → 加载内容到编辑器
2. 编辑正文 → 实时字数统计
3. 点击 AI 任务按钮 → 创建任务 → 显示状态 → 返回结果卡片
4. 对结果卡片操作 → 采纳/保存建议/丢弃 → 记录日志

---

## Prompt 4: 角色卡与世界观侧栏

### 英文提示词 (可直接粘贴)

```text
Design a right sidebar panel for character cards and worldbuilding notes in an AI novel editor MVP.

This sidebar appears alongside the chapter editor and helps writers maintain story consistency while writing. It provides quick reference to character details and world settings without leaving the editing context.

CONTEXT:
- This panel is part of the chapter editor page (right column)
- Width: 280-320px (adjustable/collapsible)
- Must support writing workflow, not distract from editor
- All data is Mock data (no real database or API)

SECTION 1: CHARACTER CARDS (Primary Content)

Display 1-3 active character cards that are relevant to the currently selected chapter.

CHARACTER CARD DESIGN (for each character):

┌────────────────────────────────┐
│  🎭 艾琳 · 铸卡师               │
│  ──────────────────────────    │
│  身份: 主角 | 年龄: 17岁        │
│                                 │
│  🏷️ 性格标签:                   │
│  [好奇] [勇敢] [固执] [ empathetic] │
│                                 │
│  🎯 目标:                       │
│  找到能改写现实的神秘密卡，      │
│  拯救被囚禁的妹妹               │
│                                 │
│  🔒 秘密: (点击查看) 👁         │
│  → 展开后显示:                 │
│  "她能听到卡牌的低语，          │
│   但从未告诉任何人"             │
│                                 │
│  💬 口吻示例:                   │
│  "这不合逻辑...除非齿轮本身      │
│   就是活的。" (简短、直接、      │
│   带有质疑语气)                │
│                                 │
│  🔗 关系:                       │
│  · ↗ 维克多 · 发条匠 (导师)    │
│    信任、依赖、偶尔分歧          │
│  · ↘ 凯瑟琳女王 (对立)         │
│    敌对、恐惧、必须推翻          │
│  · ↔ 里奥 · 卡牌商 (盟友)      │
│    合作、交易、隐藏动机          │
│                                 │
│  [设为上下文引用] [固定角色卡]   │
│  [查看完整关系图]               │
└────────────────────────────────┘

Character card elements:
- Avatar/Icon (simple illustration or stylized initial)
- Name + Role/Identity (bold header)
- Age (if relevant)
- Personality Tags (pill-shaped badges, 2-4 tags)
- Goal (1-2 sentence motivation)
- Secret (click-to-reveal, adds mystery/engagement)
- Speaking Style (dialogue example showing voice)
- Relationships (list of related characters with relationship type)
- Action Buttons (small, secondary style):
  * "Use as Context" - Passes character info to AI task
  * "Pin Card" - Keeps card visible even when scrolling
  * "View Relationships" - Opens relationship diagram

SECTION 2: WORLDBUILDING NOTES (Secondary Content)

┌────────────────────────────────┐
│  🌍 世界观备注                   │
│  ──────────────────────────    │
│                                 │
│  📍 当前场景地点:               │
│  地下工坊 - 王城底层第7区        │
│  昏暗、充满机油味和金属撞击声    │
│                                 │
│  ⚙️ 世界规则 (相关):             │
│  · 发条装置是唯一能源来源        │
│  · 发条不能倒转运行（否则时空错乱）│
│  · 只有王室血统能操控核心发条    │
│                                 │
│  ⏰ 时间线位置:                 │
│  故事第3天 | 下午 | 正在探索中   │
│                                 │
│  ⚠️ 待解决线索:                 │
│  · 艾琳的发条为何能逆转？        │
│  · 地下工坊的主人是谁？          │
│  · 维克多隐瞒了什么？           │
│                                 │
│  [编辑世界圣经] [添加备注]       │
└────────────────────────────────┘

Worldbuilding elements:
- Current Location (scene setting)
- World Rules (2-3 relevant rules)
- Timeline Position (story time)
- Unresolved Conflicts/Clues (plot threads)
- Edit/Add actions (for future real use, mock only now)

SECTION 3: CONTINUITY REMINDERS (Optional, Lower Priority)

Small section showing:
- Recent events in previous chapters
- Character state changes (injuries, emotional states)
- Promises or foreshadowing to remember
- Avoid contradictions helper

DESIGN STYLE REQUIREMENTS:
- Compact card layout (information-dense but readable)
- Soft colors, subtle borders (1px solid #E5E7EB)
- Rounded corners (8-12px border-radius)
- Clear hierarchy (name > personality > details > actions)
- Typography: Clean sans-serif, good contrast
- Collapsible sections (character cards can collapse)
- Scrollable if content overflows
- Support dark mode consideration (future)

INTERACTION PATTERNS:
- Click character card → Expand/collapse details
- Click secret → Reveal with subtle animation
- Hover relationship tag → Tooltip with more info
- "Use as Context" button → Highlights character for AI task input
- "Pin Card" → Card sticks to top when scrolling
- Drag to reorder character priority

MOCK DATA EXAMPLES (Include in prototype):

Character 1: 艾琳 · 铸卡师 (Protagonist)
- Role: 主角 (Protagonist)
- Age: 17
- Personality: 好奇, 勇敢, 固执, 共情能力强
- Goal: 找到神密码卡，拯救妹妹
- Secret: 能听到卡牌低语
- Speaking Style: 简短、直接、质疑语气

Character 2: 维克多 · 发条匠 (Mentor)
- Role: 导师/配角 (Mentor/Sidekick)
- Age: 52
- Personality: 谨慎, 博学, 隐瞒, 保护欲强
- Goal: 引导艾琳但不让她知道全部真相
- Secret: 曾是王室工程师，背叛原因未知
- Speaking Style: 学术性、隐喻、停顿多

Character 3: 凯瑟琳女王 (Antagonist)
- Role: 反派/对立角色 (Antagonist)
- Age: 34
- Personality: 冷酷, 果断, 傲慢, 控制欲强
- Goal: 维持统治，消灭任何威胁
- Secret: 发条核心正在衰竭
- Speaking Style: 命令式、威严、不带感情

EXPLICIT CONSTRAINTS:
- This is Mock Mode only - no real data persistence
- No real AI model integration in this panel
- No external APIs or network calls
- Characters are static mock data for Week 1
- Worldbuilding notes are manually entered mock data
- "Edit" buttons exist but don't need to function in prototype
```

### 中文说明

这个提示词用于生成**右侧角色卡和世界观面板**。

**设计目的**：
- 给作者提供**即时上下文参考**
- 避免"写到后面忘记前面设定"的问题
- 为 AI Mock 任务提供**角色口吻参考**

**对应业务对象**：
- `Character` - 角色实体
- `Sandbox` - 世界观/创作沙箱
- `NovelCharacterProvider` - 数据接口（未来实现）

**关键功能**：
1. **角色卡展示** - 姓名、身份、性格、目标、秘密、口吻
2. **关系网络** - 角色间关系可视化
3. **世界观备注** - 场景规则、时间线、待解决线索
4. **上下文传递** - "设为引用"按钮，将角色信息传给 AI 任务

---

## Prompt 5: AI 任务面板

### 英文提示词 (可直接粘贴)

```text
Design an AI task panel for an AI novel editor MVP in Mock Mode.

This panel allows writers to run simulated AI writing tasks through FakeAgentProvider. It's the primary interaction point for AI features in the editor.

PANEL POSITIONING:
- Can be: Bottom toolbar in editor OR Right sidebar section OR Floating panel
- Recommend: Fixed bottom toolbar in chapter editor (always visible, easy access)
- Height: 60-80px when collapsed, 300-400px when expanded

TASK TYPES SUPPORTED (4 core types for MVP):

┌─────────────────────────────────────────────────────────────────────┐
│  🤖 AI 写作助手 (Mock Mode)                          [− 收起] [×]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  选择任务类型:                                                       │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐│
│  │ ✏️ 续写       │  │ 🔄 改写       │  │ 📝 摘要       │  │ 🎭 语气  ││
│  │              │  │              │  │              │  │   改写   ││
│  │ 从光标位置    │  │ 改写选中的    │  │ 生成当前章节  │  │ 用指定   ││
│  │ 继续写下去    │  │ 文本段落      │  │ 的内容摘要    │  │ 角色的   ││
│  │              │  │              │  │              │  │ 口吻改写 ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘│
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  当前任务:                                                          │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ 任务类型: ✏️ 续写                                             │   │
│  │ 输入预览: "...在昏暗的地底工坊里，艾琳听到了细微的嗡鸣声..."    │   │
│  │ 关联章节: 第12章 - 齿轮的秘密                                   │   │
│  │                                                                 │   │
│  │ 状态: 🔄 运行中                                               │   │
│  │ 进度: ████████░░░░░░░ 67%  预计剩余: 2秒                      │   │
│  │                                                                 │   │
│  │ 提供方: FakeAgentProvider (模拟模式)                            │   │
│  │                                                                 │   │
│  │ [取消任务]                                                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

TASK TYPE DETAILS:

1. ✏️ CONTINUE WRITING (续写)
   - Input: Last N characters from cursor position (default: last 500 chars)
   - Output: Continuation text (200-500 words)
   - Mock behavior: Return fixed creative continuation after 1-3 second delay
   - Example output: "她轻轻转动最外面的齿轮，突然听到了细微的嗡鸣声。那声音不像机械摩擦，更像...呼吸。"

2. 🔄 REWRITE SELECTION (改写)
   - Input: User-selected text passage (highlighted in editor)
   - Options: Formal/Casual/Detailed/Concise (style selector)
   - Output: Rewritten version maintaining meaning
   - Mock behavior: Return paraphrased version after 1-2 second delay
   - Example: Original "她很快跑开了" → Rewritten "她以惊人的速度逃离了现场"

3. 📝 SUMMARIZE CHAPTER (摘要)
   - Input: Full chapter text
   - Output: Summary (100-200 words)
   - Mock behavior: Extract key plot points, generate concise summary after 2-3 seconds
   - Example: "本章讲述了艾琳潜入地下工坊，发现发条装置的异常..."

4. 🎭 REWRITE IN CHARACTER VOICE (角色语气改写)
   - Input: Text passage + Target character selection
   - Character selector: Dropdown with available characters
   - Output: Text rewritten in character's speaking style
   - Mock behavior: Apply character's voice patterns (from character card) after 2 seconds
   - Example: Original "这很危险" → In 艾琳's voice "这不合逻辑...而且感觉不对劲"

TASK STATUS STATES (Must demonstrate all):

┌────────────────────────────────────────────────────────────────────┐
│  状态演示 (Mock Data Examples):                                    │
│                                                                    │
│  ⏳ PENDING (等待中)                                              │
│  │  任务: 续写 | 章节: 第12章 | 时间: 刚刚创建                      │
│  │  样式: 灰色背景 + 时钟图标 + "等待执行..."                       │
│                                                                    │
│  🔄 RUNNING (运行中)                                              │
│  │  任务: 改写 | 章节: 第9章 | 时间: 执行中                         │
│  │  样式: 蓝色背景 + Spinner 动画 + 进度条 + "处理中..."            │
│                                                                    │
│  ✅ SUCCESS (成功)                                                │
│  │  任务: 续写 | 章节: 第11章 | 时间: 13:45 | 耗时: 2.3s          │
│  │  样式: 绿色背景 + 对勾图标 + "已完成" + [查看结果] 按钮          │
│                                                                    │
│  ❌ FAILED (失败)                                                 │
│  │  任务: 摘要 | 章节: 第15章 | 时间: 12:30                         │
│  │  样式: 红色背景 + 警告图标 + "执行失败"                         │
│  │  错误信息: "Mock Error: 模拟生成超时（测试用）"                   │
│  │  [重试] [查看日志]                                              │
│                                                                    │
│  🚫 CANCELLED (已取消)                                            │
│  │  任务: 语气改写 | 章节: 第8章 | 时间: 11:20                      │
│  │  样式: 灰色背景 + 删除线 + "已取消"                             │
│                                                                    │
│  ⛔ PERMISSION_DENIED (权限拒绝)                                   │
│  │  任务: 续写 | 章节: 第20章 | 时间: 10:15                         │
│  │  样式: 橙红色背景 + 锁图标 + "权限不足"                          │
│  │  提示: "当前无权执行此操作（Mock 测试）"                          │
│                                                                    │
│  💳 QUOTA_EXCEEDED (配额不足)                                      │
│  │  任务: 改写 | 章节: 第18章 | 时间: 09:30                         │
│  │  样式: 橙色背景 + 信用卡图标 + "配额不足"                        │
│  │  提示: "今日 Mock 调用次数已达上限（测试用）"                     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

SUCCESS RESULT CARD (When task completes):

┌────────────────────────────────────────────────────────────────────┐
│  ✏️ 续写结果 - 第12章                          [Mock Mode 🧪]      │
│  ─────────────────────────────────────────────────────────────── │
│  状态: ✅ 成功 | 耗时: 2.3s | 提供方: FakeAgentProvider           │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ 她轻轻转动最外面的齿轮，突然听到了细微的嗡鸣声。那声音不像   │   │
│  │ 机械摩擦，更像...呼吸。艾琳屏住心跳，将耳朵贴近冰冷的金属    │   │
│  │ 表面。嗡鸣声再次响起，这次伴随着一种奇异的节奏——像是心跳，   │   │
│  │ 又像是某种古老的语言在低语...                                │   │
│  │                                                            │   │
│  │ [展开全文 (显示剩余 186 字)]                               │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  操作:                                                             │
│  [✓ 采纳到正文]  [📋 保存到建议区]  [✗ 丢弃结果]                   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

ACTION BUTTONS:
- "Accept to Editor" (Primary button, solid color): Inserts result at cursor position
- "Save to Suggestions" (Secondary button, outline): Saves to suggestion library for later
- "Discard" (Tertiary button, text-only): Removes result, logs discard action

PANEL DESIGN REQUIREMENTS:
- Always accessible (fixed position or easily openable)
- Clear task type icons and labels
- Progress indication for running tasks
- One active task at a time (queue others if needed)
- Cancel button for running tasks
- History of recent tasks (clickable to view results again)
- Mock Mode badge always visible
- Provider label: "FakeAgentProvider"

COLOR CODING FOR STATUS:
- Pending: #6B7280 (gray) + ⏳ icon
- Running: #3B82F6 (blue) + 🔄 spinner animation
- Success: #10B981 (green) + ✓ icon
- Failed: #EF4444 (red) + ✗ icon
- Cancelled: #9CA3AF (light gray) + 🚫 icon
- Permission Denied: #F97316 (orange-red) + ⛔ icon
- Quota Exceeded: #F59E0B (amber) + 💳 icon

INTERACTION FLOW:
1. User selects task type (icon/button)
2. Panel expands (if collapsed) showing task configuration
3. User confirms input (auto-populated from editor context)
4. User clicks "Execute" / "Run"
5. Task created → Status: PENDING (brief) → RUNNING (with progress)
6. After delay (1-3s mock) → Status: SUCCESS or FAILED
7. If success → Result card appears with action buttons
8. User chooses: Accept / Save / Discard
9. Action logged to AILog

MOCK MODE INDICATORS (CRITICAL):
- Panel header: "🤖 AI 写作助手 (Mock Mode)"
- Every result card: "[Mock Mode 🧪]" badge
- Provider label: "FakeAgentProvider"
- Footer note: "Simulated AI output - no real model called"
- NO real model names (GPT-4, Claude, etc.)
- NO API keys, tokens, temperature settings
- NO cost/usage information

EXPLICITLY PROHIBITED IN THIS PANEL:
- Real AI model selector/dropdown (OpenAI/Claude/Gemini/etc.)
- API key input field
- Temperature/top_p/other parameter sliders
- Token count or cost display
- System prompt editor
- Conversation history view
- Model comparison features
- Advanced settings or developer options
- Network status indicators
- Rate limiting notices (real ones)
```

### 中文说明

这个提示词用于生成 **AI 任务面板**——这是 FakeAgentProvider 的**产品化入口**。

**为什么这是 P0 优先级？**
- 验证 AI 功能的**用户交互方式**
- 测试**任务类型定义**是否合理
- 验证**状态流转**是否清晰（pending → running → success/failed）
- 测试**结果处理**流程（采纳/保存/丢弃）

**支持的 4 种任务类型**：

| 任务 | 图标 | 输入 | 输出 | Mock 行为 |
|-----|------|------|------|----------|
| 续写 | ✏️ | 光标前 500 字 | 续写 200-500 字 | 延迟 1-3 秒返回固定文本 |
| 改写 | 🔄 | 选中文本 + 风格选项 | 改写后的文本 | 保持语义调整表达 |
| 摘要 | 📝 | 完整章节正文 | 100-200 字摘要 | 提取关键情节 |
| 语气改写 | 🎭 | 文本 + 目标角色 | 符合角色的口吻 | 模拟角色语言风格 |

**必须展示的状态**（7种）：
- 正常：pending / running / success / failed / cancelled
- 异常：permission_denied / quota_exceeded

---

## Prompt 6: AI 日志抽屉

### 英文提示词 (可直接粘贴)

```text
Design an AI task log drawer for an AI novel editor MVP in Mock Mode.

The drawer slides in from the right side of the screen and displays the complete history of simulated AI tasks executed through FakeAgentProvider.

DRAWER SPECIFICATIONS:
- Trigger: Global log icon/button (in top header or accessible via shortcut)
- Animation: Slide from right (300-400ms ease-out)
- Width: 480-560px (or 40% of screen width)
- Height: Full viewport height
- Overlay: Semi-transparent backdrop (click to close)
- Close button: X in top-right corner
- Z-index: Above main content, below modals

DRAWER LAYOUT:

┌─────────────────────────────────────────────────────────────┐
│  ← 关闭    📋 AI 任务日志 (Mock Mode)        [筛选 ▼] [清空] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  筛选标签:                                                   │
│  [全部] [✅ 成功] [🔄 运行中] [❌ 失败] [🚫 已取消]           │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  任务历史 (按时间倒序)                                        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ #1047  ✏️ 续写  |  第12章: 齿轮的秘密                   │ │
│  │ ────────────────────────────────────────────────────   │ │
│  │ 状态: ✅ 成功  |  耗时: 2.3s  |  2026-05-04 14:32:15   │ │
│  │ 输入: "...在昏暗的地底工坊里，艾琳听到了..." (512字)    │ │
│  │ 输出: "她轻轻转动最外面的齿轮..." (287字)               │ │
│  │ 提供方: FakeAgentProvider                               │ │
│  │                                           [展开详情 ▼] │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ #1046  🔄 改写  |  第9章: 王城的阴影                    │ │
│  │ ────────────────────────────────────────────────────   │ │
│  │ 状态: 🔄 运行中  |  已执行: 1.2s  |  2026-05-04 14:30  │ │
│  │ 输入: "她很快就意识到情况不对。" (18字)                 │ │
│  │ 输出: 等待中...                                       │ │
│  │ 提供方: FakeAgentProvider                               │ │
│  │                                           [取消任务]   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ #1045  📝 摘要  |  第15章: 真相大白                    │ │
│  │ ────────────────────────────────────────────────────   │ │
│  │ 状态: ❌ 失败  |  耗时: 3.1s  |  2026-05-04 12:30:08   │ │
│  │ 错误: Mock Error: 模拟生成超时（测试用错误场景）        │ │
│  │ 输入: (完整章节 4230 字)                                │ │
│  │ 提供方: FakeAgentProvider                               │ │
│  │                                           [重试] [详情] │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ #1044  🎭 语气改写  |  第8章: 初遇                      │ │
│  │ ────────────────────────────────────────────────────   │ │
│  │ 状态: 🚫 已取消  |  2026-05-04 11:20:45               │ │
│  │ 取消原因: 用户手动取消                                  │ │
│  │ 输入: "这很危险" + 角色: 艾琳                           │ │
│  │ 提供方: FakeAgentProvider                               │ │
│  │                                           [详情]       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ #1043  ✏️ 续写  |  第20章: 最终决战                    │ │
│  │ ────────────────────────────────────────────────────   │ │
│  │ 状态: ⛔ 权限拒绝  |  2026-05-04 10:15:22              │ │
│  │ 提示: 当前无权执行此操作（Mock 测试场景）               │ │
│  │ 提供方: FakeAgentProvider                               │ │
│  │                                           [详情]       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ #1042  🔄 改写  |  第18章: 背叛                        │ │
│  │ ────────────────────────────────────────────────────   │ │
│  │ 状态: 💳 配额不足  |  2026-05-04 09:30:11              │ │
│  │ 提示: 今日 Mock 调用次数已达上限（测试场景）            │ │
│  │ 提供方: FakeAgentProvider                               │ │
│  │                                           [详情]       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘

LOG ITEM CARD ELEMENTS:

Each log entry contains:
- Task ID (auto-incrementing, e.g., #1047)
- Task Type Icon + Label (✏️ 续写 / 🔄 改写 / 📝 摘要 / 🎭 语气改写)
- Related Chapter (chapter title or number)
- Status Badge (color-coded, see below)
- Duration (elapsed time in seconds)
- Timestamp (ISO format or localized)
- Input Summary (truncated preview, show char count)
- Output Summary (truncated preview, show char count) - or "等待中"/"N/A"
- Provider Label: "FakeAgentProvider"
- Action Button: "Expand Details" or "Retry" or "Cancel"

DETAIL VIEW (when expanded):

Clicking "Expand Details" opens a modal or inline expansion showing:

┌────────────────────────────────────────────────────────────────────┐
│  任务详情 #1047 - ✏️ 续写                          [← 返回列表]   │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  基本信息:                                                           │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ 任务 ID: #1047                                             │     │
│  │ 类型: ✏️ Continue Writing (续写)                            │     │
│  │ 关联章节: 第12章 - 齿轮的秘密                                │     │
│  │ 状态: ✅ Success (成功)                                    │     │
│  │ 创建时间: 2026-05-04 14:32:12                               │     │
│  │ 完成时间: 2026-05-04 14:32:14                               │     │
│  │ 总耗时: 2.3 秒                                              │     │
│  │ 提供方: FakeAgentProvider (Mock Provider)                   │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  输入内容:                                                           │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ "...在昏暗的地底工坊里，艾琳听到了细微的嗡鸣声。那声音不像  │     │
│  │ 机械摩擦，更像...某种有生命的律动。她停下手中的工具，缓缓    │     │
│  │ 将视线投向那些巨大的齿轮装置..."                             │     │
│  │                                                             │     │
│  │ (共 512 字符)                                               │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  输出结果:                                                           │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ "她轻轻转动最外面的齿轮，突然听到了细微的嗡鸣声。那声音不像  │     │
│  │ 机械摩擦，更像...呼吸。艾琳屏住心跳，将耳朵贴近冰冷的金属    │     │
│  │ 表面。嗡鸣声再次响起，这次伴随着一种奇异的节奏——像是心跳，    │     │
│  │ 又像是某种古老的语言在低语..."                               │     │
│  │                                                             │     │
│  │ (共 287 字符)                                               │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  状态时间线:                                                         │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ 14:32:12  ⏳ Created (任务创建)                              │     │
│  │ 14:32:12  🔄 Running (开始执行)                             │     │
│  │ 14:32:13  🔄 Processing (处理中 - 50%)                     │     │
│  │ 14:32:14  ✅ Completed (执行完成)                           │     │
│  │ 14:32:15  📋 Logged (已记录到日志)                          │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  调试信息 (仅 Mock 模式可见):                                        │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ ⚠️ Debug Notice:                                            │     │
│  │ This result was generated by FakeAgentProvider.             │     │
│  │ No real API call was made. No actual AI model was used.    │     │
│  │ This is simulated output for MVP prototype validation.     │     │
│  │                                                             │     │
│  │ Mock Seed: 42 | Latency: 2300ms | Template: continue_v1     │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘

FILTER OPTIONS:
- Filter Tabs: All | Success | Running | Failed | Cancelled
- Search box: Search by task type, chapter name, or content
- Date range picker: Filter by time period
- Sort options: By time (default), by duration, by status
- Export button: "Export Log" (CSV/JSON) - mock only, no real file

STATUS BADGE STYLES:
- ✅ Success: Green background (#DCFCE7), dark green text (#166534)
- 🔄 Running: Blue background (#DBEAFE), dark blue text (#1E40AF), spinner animation
- ❌ Failed: Red background (#FEE2E2), dark red text (#991B1B)
- 🚫 Cancelled: Gray background (#F3F4F6), gray text (#6B7280), strikethrough
- ⛔ Permission Denied: Orange-red background (#FED7AA), dark orange text (#9A3412)
- 💳 Quota Exceeded: Amber background (#FEF3C7), dark amber text (#92400E)

UI STYLE:
- Clean, developer-readable layout
- Monospace font for IDs and timestamps (JetBrains Mono, Fira Code)
- Sans-serif for content (Inter, system-ui)
- Card-based log entries with soft shadows
- Generous padding and line height for readability
- Dark mode compatible (future consideration)
- Responsive (drawer width adjusts on smaller screens)

MOCK MODE MARKERS (REQUIRED):
- Drawer header: "📋 AI 任务日志 (Mock Mode)"
- Each log item: "提供方: FakeAgentProvider"
- Detail view debug notice: Explicit statement about no real API call
- No real model names, no token counts, no costs
- No IP addresses, URLs, or external identifiers

EXPLICITLY PROHIBITED:
- Real API request/response payloads (headers, auth tokens, etc.)
- Actual error stacks or tracebacks (unless sanitized mock versions)
- Network timing details (DNS lookup, TLS handshake, etc.)
- Server IP addresses or endpoint URLs
- Authentication credentials or session tokens
- Environment variables or config values
- Database queries or ORM logs
- Memory usage or performance metrics (real ones)
- User PII or sensitive content
```

### 中文说明

这个提示词用于生成 **AI 日志抽屉**——对应 `AILog` 业务对象。

**设计目的**：
- 提供**完整的任务审计追踪**
- 支持**问题排查**（失败任务的错误信息）
- 验证**状态流转**的可视化
- 给开发者/测试者提供**调试信息**

**关键功能**：
1. **任务列表视图** - 按时间倒序展示所有历史任务
2. **状态筛选** - 全部/成功/运行中/失败/已取消
3. **详情展开** - 查看完整输入/输出/时间线
4. **调试信息** - 明确标注 FakeAgentProvider 和 Mock 模式

**必须包含的状态示例**（至少各 1 条）：
- ✅ 成功（正常完成任务）
- 🔄 运行中（正在进行）
- ❌ 失败（含错误信息）
- 🚫 已取消（用户主动取消）
- ⛔ 权限拒绝（权限不足场景）
- 💳 配额不足（额度超限场景）

---

## Prompt 7: 移动端适配 (基础版)

### 英文提示词 (可直接粘贴)

```text
Create a mobile responsive version of the AI novel editor MVP prototype.

IMPORTANT: The mobile version is SECONDARY to desktop. Desktop is the primary target. Mobile should be a simplified, stacked adaptation that maintains core functionality without sacrificing usability.

CORE PRINCIPLES:
- Stack all three columns (left sidebar, center editor, right sidebar) into vertical sections
- Prioritize readability and writing focus above all else
- Use large touch targets (min 44px height)
- Clean spacing, minimal distractions
- Bottom navigation for key actions
- Swipe gestures where appropriate

MOBILE LAYOUT STRUCTURE (Portrait orientation):

┌─────────────────────────────┐
│  ☰  卡牌物语  🧪 Mock  [≡]  │  ← Top Nav Bar
├─────────────────────────────┤
│                             │
│  📖 第12章: 齿轮的秘密       │  ← Chapter Header (sticky)
│  ─────────────────────────  │
│                             │
│  【章节目标】                 │  ← Collapsible Section
│  揭示发条王国的能源核心...    │
│                             │
│  ─────────────────────────  │
│                             │
│  在昏暗的地底工坊里，         │  ← Main Editor Area
│  艾琳听到了细微的嗡鸣声...    │  (Full width, scrollable)
│                             │
│  她轻轻转动最外面的齿轮，     │
│  突然听到了...              │
│                             │
│  ████ 光标                   │
│                             │
│  ─────────────────────────  │
│                             │
│  🤖 AI 建议:                 │  ← AI Results (stacked)
│  ┌───────────────────────┐  │
│  │ ✏️ 续写结果 (Mock)     │  │
│  │ 她轻轻转动最外面的...  │  │
│  │ [采纳] [保存] [丢弃]   │  │
│  └───────────────────────┘  │
│                             │
├─────────────────────────────┤
│  [章节▼] [角色▼] [AI🤖]    │  ← Bottom Tab Navigation
└─────────────────────────────┘

BOTTOM TAB NAVIGATION (3 tabs):

Tab 1: 📖 Chapters (章节)
- Shows chapter list (full screen overlay or bottom sheet)
- Chapter status indicators
- Tap to switch chapter
- Search/filter option

Tab 2: 👥 Characters (角色)
- Shows character cards (horizontal scroll or grid)
- Character summary cards (compact version)
- Tap to expand full character details
- "Use as Context" button

Tab 3: 🤖 AI Tasks (AI 任务)
- Shows AI task panel (bottom sheet or full screen)
- Task type buttons (larger touch targets)
- Task status and results
- Access to AI log

MOBILE-SPECIFIC ADAPTATIONS:

1. CHAPTER EDITOR (Mobile):
   - Full-width editing area
   - Larger font size (16-18px base)
   - Increased line height (1.8-2.0)
   - Auto-hide keyboard when scrolling
   - Word count in toolbar
   - Bold/Italic/Heading shortcuts in toolbar

2. AI RESULT CARDS (Mobile):
   - Full-width cards
   - Larger action buttons (minimum 48px touch target)
   - Stack vertically (not horizontal)
   - Swipe left/right to accept/discard (gesture alternative)
   - Haptic feedback on actions

3. CHARACTER PANEL (Mobile):
   - Bottom sheet or full-screen overlay
   - Horizontal swipeable cards
   - Compact character info (hide secret by default)
   - Tap to expand

4. AI TASK PANEL (Mobile):
   - Bottom sheet (slides up from bottom)
   - Large task type buttons (grid layout 2x2)
   - Prominent "Run" button
   - Inline progress indicator
   - Result card within same sheet

RESPONSIVE BREAKPOINTS:

- Desktop: ≥1024px (three-column layout as designed in Prompt 3)
- Tablet: 768px-1023px (two-column: editor + one collapsible sidebar)
- Mobile: <768px (single-column stacked layout as described above)

ACCESSIBILITY CONSIDERATIONS:
- Minimum touch target size: 44x44px
- Sufficient color contrast (WCAG AA minimum)
- Screen reader friendly labels
- Keyboard navigation support (for attached keyboards)
- Reduce motion option (respect system preference)

MOBILE CONSTRAINTS (Same as desktop):
- Still Mock Mode only
- No real AI models, API keys, or agent tools
- No command execution or web search
- Clear Mock Mode badge visible
- No reduction in security constraints

DO NOT INCLUDE FOR MOBILE:
- Complex multi-column layouts (won't fit)
- Hover-dependent interactions (no hover on touch)
- Right-click context menus
- Keyboard shortcuts (except for attached keyboards)
- Tiny buttons or close-spaced targets
- Horizontal scrolling (except for specific card carousels)
- Popovers or tooltips (use full-screen alternatives)
```

### 中文说明

这个提示词用于生成**移动端适配版本**。

**重要声明**：
- **移动端是次要平台**，桌面端才是主要目标
- 移动版只是**基础响应式适配**，不需要完整功能对等
- 不影响 Week 1 主闭环验证（P2 优先级）

**适配策略**：
```
桌面端 (≥1024px)          平板 (768-1023px)         手机 (<768px)
┌─────┬──────┬─────┐   ┌────────┬────────┐   ┌───────────────┐
│章节 │ 编辑器│ 角色 │   │  编辑器  │ 角色   │   │    编辑器      │
│     │      │     │   │        │(可折叠) │   │                │
│     │      │     │   └────────┴────────┘   │  [章节][角色][AI]│
└─────┴──────┴─────┘                         └───────────────┘
 三栏布局              两栏布局                单栏堆叠 + 底部导航
```

**底部导航栏**（3 个 Tab）：
1. 📖 章节 - 章节列表和切换
2. 👥 角色 - 角色卡浏览
3. 🤖 AI 任务 - AI 任务面板

---

## Prompt 8: 设计风格指南

### 英文提示词 (可直接粘贴)

```text
Define the visual design system and style guide for the AI Novel Editor MVP prototype.

DESIGN PHILOSOPHY:
"Calm, focused, modern writing workspace that feels like a professional creativity tool - not a chatbot, not a game, not a social platform."

PRIMARY DESIGN DIRECTION:

1. DESKTOP-FIRST SAAS WRITING WORKSPACE
   - Optimized for 1920x1080 or higher resolutions
   - Multi-panel layout with clear hierarchy
   - Information density balanced with whitespace
   - Professional productivity aesthetic

2. SOFT NEUTRAL BACKGROUND
   - Primary background: #FAFAFA (near white) or #F5F1E8 (warm parchment)
   - Secondary background: #FFFFFF (white cards/panels)
   - Tertiary background: #F3F4F6 (subtle section dividers)
   - Avoid pure black backgrounds (too harsh for long writing sessions)

3. WHITE OR LIGHT CONTENT CARDS
   - Card background: #FFFFFF
   - Card border: 1px solid #E5E7EB (light gray)
   - Card shadow: 0 1px 3px rgba(0,0,0,0.08) (very subtle)
   - Card radius: 8px or 12px (rounded, not fully circular)
   - Card padding: 16px or 24px (generous internal spacing)

4. SUBTLE BORDERS AND DIVIDERS
   - Border color: #E5E7EB or #F3F4F6 (very light)
   - Divider lines: 1px solid, no stronger
   - Section separators: whitespace preferred over lines
   - Avoid heavy borders or double lines

5. COMFORTABLE TYPOGRAPHY FOR LONG-FORM WRITING

   Font Families:
   - Interface/UI: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
   - Editor/Content: "Source Serif Pro", Georgia, "Noto Serif SC", serif (for Chinese content)
   - Code/Monospace: JetBrains Mono, "Fira Code", "Cascadia Code", monospace

   Font Sizes:
   - Page title: 24-28px (bold)
   - Section header: 18-20px (semibold)
   - Card title: 16-18px (semibold)
   - Body text: 14-16px (regular)
   - Caption/small: 12-13px (regular)
   - Editor content: 16-18px (for comfortable reading)

   Line Heights:
   - Body text: 1.5-1.6
   - Editor content: 1.7-1.8 (generous for long reading)
   - Dense lists: 1.3-1.4
   - Headings: 1.2-1.3

   Font Weights:
   - Regular: 400
   - Medium: 500
   - Semibold: 600
   - Bold: 700

6. CLEAR STATUS BADGES WITH COLOR CODING

   Badge Design:
   - Shape: Pill-shaped (border-radius: 9999px) or rounded rectangle (6px)
   - Size: Height 20-24px, padding horizontal 8-12px
   - Font size: 12-13px
   - Icon + Text combination preferred

   Color Palette for Statuses:
   ┌────────────────┬──────────┬──────────┬──────────────┐
   │ Status         │ Background│ Text     │ Usage         │
   ├────────────────┼──────────┼──────────┼──────────────┤
   │ Default/Gray   │ #F3F4F6  │ #6B7280  │ Neutral, info │
   │ Info/Blue      │ #DBEAFE  │ #1E40AF  │ Running, tip  │
   │ Success/Green  │ #DCFCE7  │ #166534  │ Complete, ok  │
   │ Warning/Orange │ #FEF3C7  │ #92400E  │ Caution       │
   │ Error/Red      │ #FEE2E2  │ #991B1B  │ Failed, error │
   │ Purple/Accent  │ #F3E8FF  │ #6B21A8  │ AI-related    │
   └────────────────┴──────────┴──────────┴──────────────┘

7. MINIMAL DISTRACTIONS
   - No animations unless functional (loading spinners, status transitions)
   - No decorative illustrations or graphics in workspace
   - No gradients (or very subtle, linear, low-opacity)
   - No patterns or textures on backgrounds
   - No notification badges or popups during writing
   - Sound effects: None (or very subtle, can be toggled off)

8. ELEGANT FANTASY WRITING ATMOSPHERE (NOT GAME-LIKE)
   - Subtle fantasy-inspired accents (optional):
     * Gold/amber accent color for important actions
     * Slightly warmer tones vs cold tech blues
     * Decorative serif fonts for headings (not body)
     * Optional: Subtle paper texture on editor background (very low opacity)
   - AVOID:
     * Game UI elements (HP bars, inventory grids, quest logs)
     * Medieval/fantasy ornamentation (overdone borders, crests)
     * Dark dungeon aesthetics
     * RPG-style character sheets
     * Pixel art or retro graphics

9. PRODUCTIVITY TOOL, NOT CHATBOT UI
   - Layout: Editor-centric, not message-list-centric
   - No chat bubbles or conversation threads
   - No avatar-based messaging UI
   - No "typing indicators" or "online status"
   - No emoji-heavy communication style
   - Professional, clean, tool-like appearance
   - Similar to: Notion, Scrivener, Ulysses, iA Writer, Obsidian

10. EDITOR-FIRST LAYOUT
    - Central editor area gets most space (50-60% of width)
    - Sidebars are supportive (20-25% each)
    - Sidebars can be collapsed/hidden for focus mode
    - Toolbars should be minimal and non-intrusive
    - Chrome (borders, frames, decorations) minimized around content

11. SIDE PANELS SHOULD FEEL SUPPORTIVE, NOT DOMINANT
    - Sidebar width: 240-320px max (configurable)
    - Sidebar can be resized or collapsed
    - Sidebar content: Reference material, not primary workspace
    - Sidebar styling: Lighter/less prominent than main editor
    - Sidebar scroll independently from editor

COLOR SYSTEM (Complete Palette):

Primary Colors:
- Indigo/Violet (Primary): #4338CA (main actions, links)
- Violet Light: #818CF8 (hover states, secondary actions)
- Indigo BG: #EEF2FF (light backgrounds for primary elements)

Accent Colors:
- Amber/Gold (Accent): #D97706 (important highlights, CTAs)
- Amber Light: #F59E0B (hover, warnings)
- Amber BG: #FFFBEB (light amber backgrounds)

Semantic Colors:
- Success: #10B981 (success states, positive actions)
- Success BG: #D1FAE5
- Warning: #F59E0B (caution, attention needed)
- Warning BG: #FEF3C7
- Error: #EF4444 (errors, destructive actions)
- Error BG: #FEE2E2
- Info: #3B82F6 (informational messages)
- Info BG: #DBEAE

Neutral Colors:
- Gray 900: #111827 (headings, strong text)
- Gray 700: #374151 (body text)
- Gray 500: #6B7280 (secondary text)
- Gray 400: #9CA3AF (placeholder, disabled)
- Gray 300: #D1D5DB (borders)
- Gray 200: #E5E7EB (dividers)
- Gray 100: #F3F4F6 (backgrounds)
- Gray 50: #F9FAFB (page background)
- White: #FFFFFF (cards, inputs)

SPACING SYSTEM (8px base unit):
- XS: 4px (tight spacing between related items)
- SM: 8px (standard spacing)
- MD: 16px (section padding)
- LG: 24px (component spacing)
- XL: 32px (section gaps)
- XXL: 48px (page margins)

SHADOW SYSTEM:
- Shadow SM: 0 1px 2px rgba(0,0,0,0.05) (subtle elevation)
- Shadow MD: 0 4px 6px -1px rgba(0,0,0,0.1) (cards, dropdowns)
- Shadow LG: 0 10px 15px -3px rgba(0,0,0,0.1) (modals, popovers)
- Shadow XL: 0 20px 25px -5px rgba(0,0,0,0.1) (drawers, large overlays)

BORDER RADIUS SYSTEM:
- Radius SM: 4px (small elements, tags)
- Radius MD: 8px (cards, inputs, buttons)
- Radius LG: 12px (large cards, panels)
- Radius XL: 16px (modals, drawers)
- Radius FULL: 9999px (pills, badges, avatars)

COMPONENT EXAMPLES (Visual reference):

Button (Primary):
┌─────────────────────┐
│   ✏️ 开始续写         │  Background: #4338CA, Text: White
└─────────────────────┘  Radius: 8px, Padding: 8px 16px

Button (Secondary):
┌─────────────────────┐
│   📋 保存到建议       │  Background: White, Border: #D1D5DB
└─────────────────────┘  Radius: 8px, Padding: 8px 16px

Input Field:
┌─────────────────────────────────────┐
│  输入章节标题...                      │  Border: #D1D5DB, Radius: 8px
└─────────────────────────────────────┘  Padding: 10px 14px

Status Badge (Success):
┌──────────────┐
│  ✅ 已完成     │  Background: #DCFCE7, Text: #166534
└──────────────┘  Radius: 9999px, Padding: 4px 10px

Card Container:
┌─────────────────────────────────────┐
│                                      │  Background: White
│  Card Title                          │  Border: 1px solid #E5E7EB
│                                      │  Shadow: 0 1px 3px rgba(0,0,0,.08)
│  Card content goes here...           │  Radius: 12px, Padding: 20px
│                                      │
└─────────────────────────────────────┘

MOCK MODE SPECIAL STYLING:
- Mock Mode Badge: Gradient background (amber to yellow), pulsing animation (subtle)
- Mock Mode Banner: Light amber/yellow tinted background (#FEF3C7), with icon
- Mock Result Cards: Dashed border (2px dashed #F59E0B) to distinguish from real content
- Mock Warning Text: Italic, smaller font, amber color: "(Simulated - Mock Mode)"

AVOID THESE STYLES (Anti-Patterns):
❌ Overly colorful dashboards (too many competing colors)
❌ Gaming UI elements (health bars, inventory grids, pixel art)
❌ Heavy gradients (especially rainbow/multi-color)
❌ Cyberpunk/neon aesthetics (glowing edges, dark backgrounds)
❌ Terminal/hacker aesthetics (green on black, monospace everything)
❌ Chat-first layouts (message bubbles, avatar circles)
❌ Social media style (likes, comments, shares, notifications)
❌ E-commerce product cards (prices, ratings, add-to-cart)
❌ Corporate boring (all grays, no personality)
```

### 中文说明

这个提示词用于定义**统一的视觉设计系统和风格指南**。

**核心理念**：
> "冷静、专注、现代的写作工作空间——像专业的创意工具，而不是聊天机器人、游戏或社交平台。"

**设计方向矩阵**：

| 维度 | 推荐 | 禁止 |
|-----|------|------|
| 整体风格 | 专业生产力工具 | 聊天机器人界面 |
| 配色方案 | 柔和中性色调 | 过度多彩仪表盘 |
| 背景 | 温暖灰/羊皮纸白 | 纯黑/深色主题 |
| 装饰 | 极简、无干扰 | 游戏化元素、像素风 |
| 布局 | 编辑器优先 | 消息列表优先 |
| 动画 | 仅功能性动画 | 过度装饰性动画 |
| 氛围 | 温暖创意写作氛围 | 赛博朋克/终端风格 |

**色彩系统**：
- **主色**: 靛蓝/紫罗兰 (#4338CA) - 主要操作、链接
- **强调色**: 琥珀/金色 (#D97706) - 重要高亮、CTA
- **语义色**: 绿(成功)/橙(警告)/红(错误)/蓝(信息)
- **中性色**: 灰度阶梯 (Gray 50-900)

**Mock Mode 特殊样式**：
- 徽章：琥珀色渐变背景 + 微弱脉冲动画
- Banner：浅黄色背景 + 图标
- 结果卡片：虚线边框（区分于真实内容）

---

## Prompt 9: 负面约束 (Negative Constraints)

### 英文提示词 (可直接粘贴)

```text
This prompt defines what must NOT appear in the AI Novel Editor MVP prototype.

Use this as a final check before generating or reviewing any prototype screens. If any of these elements appear, they violate the Week 1 scope and must be removed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 ABSOLUTELY PROHIBITED ELEMENTS (Must NOT appear anywhere)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CATEGORY 1: REAL AI MODEL CONFIGURATION ❌
┌─────────────────────────────────────────────────────────────────┐
│ DO NOT INCLUDE:                                                │
│ • OpenAI API settings / GPT-4 / GPT-3.5 / o1 / etc.          │
│ • Anthropic Claude settings / Claude 3 / Claude 3.5 etc.      │
│ • Google Gemini settings / Gemini Pro / Ultra etc.            │
│ • Any other LLM provider configuration panels                 │
│ • Model selection dropdowns (real models)                     │
│ • Model version selectors                                     │
│ • Temperature / Top-p / Max tokens sliders                    │
│ • System prompt editors                                       │
│ • Few-shot example configurators                              │
│ • Fine-tuned model selectors                                  │
│ • Custom endpoint URLs                                        │
│ • Proxy server settings                                       │
│                                                                 │
│ REASON: Week 1 is Mock Mode only. No real AI models.          │
│ USE INSTEAD: "FakeAgentProvider" label, Mock Mode badge       │
└─────────────────────────────────────────────────────────────────┘

CATEGORY 2: AUTHENTICATION & KEYS ❌
┌─────────────────────────────────────────────────────────────────┐
│ DO NOT INCLUDE:                                                │
│ • API Key input fields                                         │
│ • API Secret fields                                            │
│ • OAuth login buttons (Google, GitHub, etc.)                  │
│ • Email/password registration forms                           │
│ • Two-factor authentication setup                              │
│ • Session token displays                                       │
│ • Authentication status indicators                             │
│ • Account profile pages                                        │
│ • Password change forms                                        │
│ • API key generation wizards                                   │
│ • Credential storage managers                                  │
│ • Encryption key management                                   │
│                                                                 │
│ REASON: No real authentication needed for Mock Mode.          │
│ USE INSTEAD: No auth UI at all, or "Demo User" placeholder   │
└─────────────────────────────────────────────────────────────────┘

CATEGORY 3: BILLING & PAYMENT ❌
┌─────────────────────────────────────────────────────────────────┐
│ DO NOT INCLUDE:                                                │
│ • Subscription plan selectors (Free/Pro/Enterprise)           │
│ • Credit card input forms                                      │
│ • Payment method management                                    │
│ • Invoice history                                              │
│ • Usage billing summaries                                      │
│ • Cost/price displays (real currency)                          │
│ • Token usage counters (real)                                  │
│ • Budget alerts                                                │
│ • Upgrade / downgrade prompts                                  │
│ • Coupon / promo code inputs                                   │
│ • Refund request forms                                         │
│                                                                 │
│ REASON: No commercial features in MVP.                        │
│ USE INSTEAD: Nothing, or "Mock Mode - Free" label             │
└─────────────────────────────────────────────────────────────────┘

CATEGORY 4: COMMAND EXECUTION & TERMINAL ❌
┌─────────────────────────────────────────────────────────────────┐
│ DO NOT INCLUDE:                                                │
│ • Terminal emulator panels                                     │
│ • Command-line input fields                                    │
│ • Shell / Bash execution interfaces                           │
│ • PowerShell / Zsh / Fish consoles                            │
│ • Script execution buttons                                     │
│ • Command history viewers                                      │
│ • Process monitors                                            │
│ • System command outputs                                       │
│ • File system browsers (terminal-style)                        │
│ • Environment variable editors                                 │
│ • Cron job schedulers                                         │
│                                                                 │
│ REASON: High permission risk. Not for novelist users.          │
│ USE INSTEAD: No terminal at all in the UI                     │
└─────────────────────────────────────────────────────────────────┘

CATEGORY 5: WEB ACCESS TOOLS ❌
┌─────────────────────────────────────────────────────────────────┐
│ DO NOT INCLUDE:                                                │
│ • Web search input fields                                      │
│ • Browser embedding / iframe panels                           │
│ • URL fetch / scrape tools                                     │
│ • HTTP request builders                                        │
│ • API testing interfaces (Postman-like)                        │
│ • RSS feed readers                                            │
│ • Web crawler controls                                         │
│ • Link preview generators                                      │
│ • Browser bookmark managers                                    │
│ • Network request logs                                         │
│                                                                 │
│ REASON: External access risk. Isolated Mock Mode required.    │
│ USE INSTEAD: No web access features at all                    │
└─────────────────────────────────────────────────────────────────┘

CATEGORY 6: AGENT & MULTI-AGENT SYSTEMS ❌
┌─────────────────────────────────────────────────────────────────┐
│ DO NOT INCLUDE:                                                │
│ • Multi-agent orchestration dashboards                        │
│ • Agent collaboration workflows                               │
│ • Agent-to-agent communication visualizers                    │
│ • Agent marketplace or directory                               │
│ • Custom agent creation wizards                                │
│ • Agent skill/tool configurators                               │
│ • Agent memory/persistence settings                            │
│ • Agent team management interfaces                             │
│ • Swarm intelligence controls                                  │
│                                                                 │
│ REASON: Too complex for Week 1. Single FakeAgent only.        │
│ USE INSTEAD: Simple single-task interface with FakeProvider  │
└─────────────────────────────────────────────────────────────────┘

CATEGORY 7: DEPLOYMENT & DEVOPS ❌
┌─────────────────────────────────────────────────────────────────┐
│ DO NOT INCLUDE:                                                │
│ • Deployment configuration panels                              │
│ • Docker / Kubernetes cluster views                            │
│ • CI/CD pipeline status dashboards                             │
│ • Server infrastructure monitors                               │
│ • Domain / DNS management                                      │
│ • SSL certificate managers                                     │
│ • Load balancer configurations                                 │
│ • Auto-scaling settings                                        │
│ • Feature flag toggles (developer)                             │
│ • Environment variable managers (production)                   │
│ • Log aggregation services (Splunk, ELK, etc.)                │
│                                                                 │
│ REASON: Operations concern, not user-facing.                  │
│ USE INSTEAD: No devops UI at all                              │
└─────────────────────────────────────────────────────────────────┘

CATEGORY 8: PLUGIN & EXTENSION SYSTEM ❌
┌─────────────────────────────────────────────────────────────────┐
│ DO NOT INCLUDE:                                                │
│ • Plugin marketplaces                                          │
│ • Extension stores                                            │
│ • Plugin installation wizards                                  │
│ • Extension management panels                                  │
│ • Third-party integration directories                          │
│ • Plugin permissions/grant screens                             │
│ • Plugin dependency resolvers                                  │
│ • Extension update notifications                               │
│ • Plugin review/rating systems                                 │
│                                                                 │
│ REASON: Plugin system needs further architecture study.       │
│ USE INSTEAD: No plugin UI in MVP prototype                   │
└─────────────────────────────────────────────────────────────────┘

CATEGORY 9: ADMIN & USER MANAGEMENT ❌
┌─────────────────────────────────────────────────────────────────┐
│ DO NOT INCLUDE:                                                │
│ • Admin dashboards                                            │
│ • User management tables (CRUD)                                │
│ • Role-based access control (RBAC) editors                    │
│ • Permission matrices                                          │
│ • Audit logs (system-level)                                    │
│ • User activity monitoring                                     │
│ • Team/workspace management                                    │
│ • Invitation / approval workflows                              │
│ • Organization settings                                       │
│                                                                 │
│ REASON: Admin features out of scope for MVP.                 │
│ USE INSTEAD: Single-user mode, no admin UI                    │
└─────────────────────────────────────────────────────────────────┘

CATEGORY 10: SOCIAL & COLLABORATION ❌
┌─────────────────────────────────────────────────────────────────┐
│ DO NOT INCLUDE:                                                │
│ • Social feeds / timelines                                     │
│ • Comment / discussion threads                                 │
│ • Like / reaction buttons                                      │
│ • Share to social media buttons                                │
│ • Follower / following systems                                 │
│ • Real-time collaboration cursors                              │
│ • Co-editing presence indicators                               │
│ • @mention / #hashtag support                                  │
│ • Notification centers (social)                                │
│ • Activity streams                                             │
│                                                                 │
│ REASON: Social features distract from core writing workflow.  │
│ USE INSTEAD: Single-user focused, no social elements         │
└─────────────────────────────────────────────────────────────────┘

CATEGORY 11: PUBLISHING & DISTRIBUTION ❌
┌─────────────────────────────────────────────────────────────────┐
│ DO NOT INCLUDE:                                                │
│ • Publishing platform connectors (Amazon KDP, etc.)           │
│ • E-book export wizards (EPUB, MOBI, PDF)                     │
│ • Format conversion tools                                      │
│ • Print-on-demand configurations                              │
│ • ISBN management                                              │
│ • Royalty calculators                                          │
│ • Distribution channel managers                                │
│ • Marketing campaign tools                                     │
│ • Reader review aggregators                                    │
│                                                                 │
│ REASON: Publishing is post-MVP feature.                       │
│ USE INSTEAD: No publishing UI at all                          │
└─────────────────────────────────────────────────────────────────┘

CATEGORY 12: BLOCKCHAIN / WEB3 / NFT ❌
┌─────────────────────────────────────────────────────────────────┐
│ DO NOT INCLUDE:                                                │
│ • Wallet connection buttons                                    │
│ • Cryptocurrency payment options                               │
│ • NFT minting interfaces                                      │
│ • Token / coin displays                                        │
│ • Blockchain transaction histories                             │
│ • Smart contract interactors                                   │
│ • Decentralized identity (DID) managers                        │
│ • DAO governance interfaces                                   │
│                                                                 │
│ REASON: Completely irrelevant to AI novel editor.            │
│ USE INSTEAD: Absolutely nothing related to blockchain         │
└─────────────────────────────────────────────────────────────────┘

CATEGORY 13: GAMING & ENTERTAINMENT UI ❌
┌─────────────────────────────────────────────────────────────────┐
│ DO NOT INCLUDE:                                                │
│ • Health / mana / stamina bars                                 │
│ • Inventory grids / slot systems                               │
│ • Experience point (XP) displays                               │
│ • Achievement / trophy systems                                 │
│ • Quest logs / objective trackers (game-style)                │
│ • Level-up progression visuals                                 │
│ • Leaderboards / rankings                                      │
│ • Loot box / gacha mechanics                                   │
│ • Character stat sheets (RPG-style)                            │
│ • Skill tree visualizations                                    │
│ • Combat / battle interfaces                                   │
│ • Mini-games                                                  │
│                                                                 │
│ REASON: This is a writing tool, not a game.                   │
│ USE INSTEAD: Professional productivity tool aesthetics        │
└─────────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ WHAT SHOULD BE PRESENT INSTEAD (Positive Constraints)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALLOWED ELEMENTS (Week 1 MVP Scope):

✅ Mock Mode badges and banners (prominent, clear)
✅ Fiction project information display
✅ Chapter list and navigation
✅ Rich text / Markdown editor
✅ Character cards (static mock data)
✅ Worldbuilding notes (static mock data)
✅ AI task panel (4 task types only)
✅ AI result cards with Accept/Save/Discard actions
✅ AI task log drawer with history
✅ Status badges (pending/running/success/failed/cancelled)
✅ Error states (permission_denied, quota_exceeded)
✅ Empty states and loading skeletons
✅ Professional writing tool aesthetics
✅ Clean, minimal, distraction-free interface
✅ Desktop-first responsive layout

FINAL CHECKLIST BEFORE PROTOTYPING:

□ No real AI model names appear anywhere
□ No API key input fields exist
□ No billing/subscription UI exists
□ No terminal/command-line interface exists
□ No web search/browser tools exist
□ No multi-agent orchestration exists
□ No deployment/devops settings exist
□ No plugin marketplace exists
□ No admin dashboard exists
□ No social features exist
□ No publishing tools exist
□ No blockchain/NFT elements exist
□ No gaming UI elements exist
□ Mock Mode is clearly labeled everywhere
□ Only 4 AI task types (Continue/Rewrite/Summarize/Voice)
□ Only 6 business objects (Project/Sandbox/Chapter/Character/AITask/AILog)
□ FakeAgentProvider is the only provider shown
□ All data is identified as mock/simulated

If ALL checkboxes pass, the prototype is within Week 1 scope.
```

### 中文说明

这个提示词用于**限制原型范围**，防止原型工具自动扩展出不属于 Week 1 的功能。

**为什么要负面约束？**
- AI 原型工具（如 Stitch、v0、Galileo）倾向于"过度生成"
- 可能自动添加常见 SaaS 功能（登录、支付、设置等）
- 需要明确告知"不要做什么"

**13 类禁止元素**：

| 类别 | 示例 | 原因 |
|-----|------|------|
| 1. 真实模型配置 | OpenAI/Claude 设置 | Week 1 只用 Mock |
| 2. 认证密钥 | API Key 输入 | 无需真实认证 |
| 3. 计费系统 | 订阅/账单 | 无商业化功能 |
| 4. 命令行终端 | Shell/Bash 界面 | 高权限风险 |
| 5. 网络工具 | 搜索/抓取 | 外部访问风险 |
| 6. 多 Agent 系统 | Agent 编排 | 复杂度过高 |
| 7. 部署运维 | Docker/K8s 面板 | 非用户界面 |
| 8. 插件市场 | 扩展商店 | 架构未确定 |
| 9. 管理后台 | 用户管理 | 非 MVP 范围 |
| 10. 社交功能 | 评论/分享/点赞 | 干扰写作 |
| 11. 发布系统 | 导出/出版 | 后置功能 |
| 12. 区块链/NFT | 钱包/代币 | 完全无关 |
| 13. 游戏化 UI | 经验值/成就 | 不是游戏 |

**最终检查清单**（13 项全部通过才符合范围）：
- ✅ 无真实模型名称
- ✅ 无 API Key 输入
- ✅ 无计费 UI
- ✅ 无终端界面
- ✅ 无网络工具
- ✅ 无多 Agent 编排
- ✅ 无部署设置
- ✅ 无插件市场
- ✅ 无管理后台
- ✅ 无社交功能
- ✅ 无发布工具
- ✅ 无区块链元素
- ✅ 无游戏化 UI
- ✅ Mock Mode 清晰标注
- ✅ 仅 4 种 AI 任务类型
- ✅ 仅 6 个业务对象
- ✅ 仅 FakeAgentProvider

---

## 文档总结

### 生成的提示词清单

| 序号 | 提示词名称 | 页面/组件 | 优先级 | 状态 |
|:---:|-----------|----------|:-----:|:----:|
| 1 | **总体 MVP App 原型** | 完整应用总览 | P0 | ✅ 可用 |
| 2 | **项目工作台页面** | Dashboard/Home | P1 | ✅ 可用 |
| 3 | **章节编辑器页面** | Core Editor | **P0** | ✅ 可用 |
| 4 | **角色卡与世界观侧栏** | Character Panel | P1 | ✅ 可用 |
| 5 | **AI 任务面板** | AI Task Panel | **P0** | ✅ 可用 |
| 6 | **AI 日志抽屉** | AI Log Drawer | P1 | ✅ 可用 |
| 7 | **移动端适配** | Mobile Responsive | P2 | ✅ 可用 |
| 8 | **设计风格指南** | Visual Style Guide | P0 | ✅ 可用 |
| 9 | **负面约束** | Scope Limitations | **P0** | ✅ 可用 |

### 使用方式

1. **按优先级执行**：先做 P0（Prompt 1, 3, 5, 8, 9），再做 P1（Prompt 2, 4, 6），最后 P2（Prompt 7）
2. **英文提示词粘贴**：复制英文部分到 Stitch/v0/Figma AI 等工具
3. **中文说明参考**：阅读中文理解设计意图和约束条件
4. **组合使用**：先读 Prompt 8（风格）+ Prompt 9（约束），再逐一生成页面

### 范围控制确认

| 检查项 | 状态 |
|-------|:----:|
| 是否接真实 Agent | ❌ 否 |
| 是否调用真实模型 | ❌ 否 |
| 是否访问真实 API | ❌ 否 |
| 是否修改 opencode 核心源码 | ❌ 否 |
| 是否包含高权限工具 | ❌ 否 |
| 是否包含计费功能 | ❌ 否 |
| 是否包含社交功能 | ❌ 否 |
| Mock Mode 是否明确标识 | ✅ 是 |
| 是否符合最小闭环要求 | ✅ 是 |

---

*本文档基于 TabAI 评审意见 (TabAI会话_1777981039651.md) 生成*
*所有提示词均可直接粘贴到原型生成工具中使用*
*Week 1 目标：基于 Mock 数据和 FakeAgentProvider，验证 AI 小说编辑器的最小产品闭环*

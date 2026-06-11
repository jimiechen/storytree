# 小说编辑器 — Google Stitch 原型图提示词

> 以下提示词按页面拆分，可直接粘贴到 Google Stitch 中生成对应页面的原型图。所有页面保持统一的紫粉渐变品牌色系（Primary: #9C27B0 → #E91E63），深色/浅色双主题支持，圆角卡片式设计语言。

---

## 一、登录/注册页

```
Create a login page for a Chinese AI novel writing assistant app called "AI 小说创作助手". 

Layout: Center-aligned card on a deep purple-to-dark-violet gradient background with subtle star-like particles.

Top section:
- A rounded square app icon with purple-pink gradient containing a white open book symbol
- App name "AI 小说创作助手" in pink/magenta text below the icon

Login card (glassmorphism style, semi-transparent dark purple with blur):
- Two tabs at top: "登录" (active, vibrant purple-to-pink gradient) and "注册" (inactive, muted)
- Username input field with person icon placeholder "请输入用户名"
- Password input field with lock icon placeholder "请输入密码"
- "忘记密码?" link aligned right, small gray text
- Primary button "登录 →" with purple-pink gradient, full width
- Footer text: "登录即表示同意《用户协议》《隐私政策》和《服务条款》"

Design style: Modern, clean, glassmorphism, rounded corners (8-12px), Chinese UI text.
```

---

## 二、首页/我的书架（项目管理）

```
Create a bookshelf dashboard page for a Chinese AI novel writing app.

Top navigation bar:
- Hamburger menu icon (≡) on the left
- Center: Purple book icon + "我的书架" title with "3本" count badge in purple
- Refresh icon on the right

Search bar:
- Full-width search input with placeholder "搜索小说..." and help icon (?) on the right

Toolbar row (colorful icon buttons):
- Purple lightning bolt (quick action)
- Orange grid icon (templates)
- Blue document icon
- Green checkmark icon
- White "新建" button with plus icon
- Purple sparkle icon
- Two document icons with numbers

Main content area - Project cards grid (2 columns):
Each card shows:
- Book cover placeholder (gradient colored rectangle)
- Book title (e.g., "星辰变")
- Genre tag (e.g., "玄幻")
- Chapter count "共 25 章"
- Word count "共 78,000 字"
- Last edited time "最后编辑：2小时前"
- Hover overlay with edit/delete buttons

Bottom-right floating widget:
- "今日已签到" with flame icon and "3天" streak
- "成就 12/98" with star icon
- "活动 点击查看" with gift icon
- Stats: "134,053,060 字" and "256 在线"

Design: Light gray background (#f5f5f5), white cards with subtle shadows, purple accent colors, Chinese text.
```

---

## 三、创建新项目弹窗

```
Create a modal dialog for creating a new novel project in a Chinese AI writing app.

Modal title: "创建新项目" with close (×) button

Two creation mode tabs at top:
- "简易创作" (recommended, with "推荐" tag)
- "创建新项目"

Form fields (inside modal):
- 书名 input: placeholder "给你的小说起个名字"
- 类型 dropdown: options "玄幻 / 都市 / 穿越 / 科幻 / 仙侠 / 悬疑 / 其他"
- 简介 textarea: placeholder "简单描述小说要讲什么故事..." (3-4 lines)
- 主角设定 section:
  - 姓名 input
  - 性别 radio: 男 / 女
  - 年龄 input
  - 性格 textarea: placeholder "描述主角的性格特点..."
- 自定义设定 textarea: placeholder "添加修仙体系、科技设定等自定义内容..."

Bottom buttons:
- "取消" (gray outline)
- "创建" (purple-pink gradient, primary)

Design: White modal with rounded corners, overlay background, clean form layout, Chinese text.
```

---

## 四、小说项目工作台（核心编辑页面）

```
Create the main novel editing workspace for a Chinese AI novel writing app. This is a three-panel layout.

Left panel (sidebar, ~250px width):
- Tab switcher: "大纲" | "细纲" | "章节"
- Currently showing "大纲" tab
- List of outline items, each showing:
  - Chapter number "第1章"
  - Chapter title "初入江湖"
  - Checkbox for selection
  - Expand arrow (▶) for sub-items
  - Star icon for marking important
- "AI生成大纲" button at bottom (purple gradient)
- "生成细纲" button below (outline style)

Center panel (main content area):
- Top bar showing current chapter: "第1章 初入江湖"
- Content area showing outline text or chapter content
- Below content: AI generation progress bar (if generating)
  - Progress: "正在生成第3章... 67%"
  - Real-time preview text appearing
  - "暂停" button

Right panel (settings & info, ~300px width):
- "生成设置" section header
- Settings form:
  - 目标字数: "3000" with +/- buttons
  - 字数容差: "±300"
  - 参考章节数: "3" dropdown
  - AI模型: "豆包" dropdown
  - 上下文参考 checkboxes:
    ☑ 大纲和细纲
    ☑ 已有正文摘要
    ☑ 主角状态追踪
    ☑ 角色关系
    ☑ 技能和道具状态
    ☐ 重要事件
- "开始生成" button (purple-pink gradient, full width)
- "批量生成" button (outline style)

Design: Professional writing tool aesthetic, clean panels with dividers, purple accents, Chinese text.
```

---

## 五、章节编辑器页面

```
Create a chapter editor page for a Chinese AI novel writing app.

Layout: Full-width editor with toolbar and side panel.

Top toolbar:
- Back arrow + "第3章 比武大会" title
- Word count display "共 3,256 字"
- Action buttons: "历史版本" | "备注" | "AI续写" | "保存" (Ctrl+S hint)

Main editor area:
- Large text editing area with Chinese novel text content
- Clean typography, comfortable reading line-height
- Cursor blinking at end of text
- Selected text highlighted

Right side panel (~280px):
- "章节信息" section:
  - 状态: "已完成" (green badge)
  - 创建时间: "2026-05-20 14:30"
  - 最后修改: "2026-05-24 09:15"
- "AI提取信息" section:
  - 章节摘要: "主角参加门派比武大会，在决赛中..."
  - 新角色: "林清风（对手）"
  - 主角状态: "位置：比武场 | 情绪：紧张 | 实力：金丹期"
  - 获得道具: "无"
  - 重要事件: "主角获胜，获得进入秘境资格"
- "重新提取信息" button (small, outline)

Design: Distraction-free writing environment, light background, comfortable reading, Chinese text.
```

---

## 六、角色追踪面板

```
Create a character tracking panel for a Chinese AI novel writing app.

Header: "角色追踪" title with "添加角色" button (purple, + icon)

Character groups (collapsible sections):

Group 1 - "主角" (1 character):
- Character card:
  - Avatar placeholder (purple circle with initials "萧")
  - Name: "萧炎"
  - Type badge: "主角" (purple)
  - Description: "萧家少爷，天赋异禀..."
  - First appearance: "首次出场：第1章"
  - Status tracker:
    - 当前位置: "乌坦城"
    - 实力等级: "斗之气三段"
    - 情绪状态: "坚定"
    - 已获技能: "焚决（残篇）"
    - 已获道具: "戒指（神秘老爷爷）"

Group 2 - "配角" (3 characters):
- Character cards in compact list format:
  - Name + type badge
  - Brief description (1 line)
  - First appearance chapter

Group 3 - "反派" (2 characters):
- Similar compact card format

Group 4 - "其他" (expandable)

Bottom section - "人物关系图":
- Simple relationship visualization showing connections between characters with lines and labels (师徒、敌对、朋友 etc.)

Design: Card-based layout, color-coded character types, clean hierarchy, Chinese text.
```

---

## 七、世界设定页面

```
Create a world-building settings page for a Chinese AI novel writing app.

Header: "世界设定" with "AI生成设定" button (purple gradient)

Top section - "世界概览" card:
- World background: "玄幻大陆，万族林立..."
- Power system: "斗之气 → 斗者 → 斗师 → 大斗师..."
- Social structure: "家族 → 宗门 → 帝国"
- Special rules: "异火榜排名..."

Tab navigation: "地点" | "物品" | "技能" | "势力"

Currently showing "地点" tab:
- List of location cards:
  - 乌坦城: "萧家所在地，主角出生地..." | Tag: "城镇"
  - 魔兽山脉: "危险区域，有大量魔兽..." | Tag: "秘境"
  - 迦南学院: "大陆著名学府..." | Tag: "学院"
- Each card has edit/delete buttons on hover

"物品" tab content (preview):
- 青莲地心火: "异火榜第十九位..." | Tag: "异火"
- 玄重尺: "药老遗物..." | Tag: "武器"

"技能" tab content (preview):
- 焚决: "可吞噬异火进化..." | Tag: "功法"
- 八极崩: "地阶高级斗技..." | Tag: "斗技"

Bottom: "设定越详细，生成内容越符合你的想法" hint text in gray

Design: Organized card layout, tab navigation, tag-based categorization, Chinese text.
```

---

## 八、批量生成工作室

```
Create a batch generation workspace page for a Chinese AI novel writing app.

Header: "批量生成工作室" with close button

Left section - "选择大纲" (~40% width):
- Scrollable list of outline items with checkboxes:
  ☑ 第6章 拍卖会
  ☑ 第7章 异火现世
  ☑ 第8章 激烈争夺
  ☑ 第9章 意外收获
  ☑ 第10章 实力突破
- "全选" / "取消全选" buttons at top
- Selected count: "已选择 5 章"

Right section - "生成设置与进度" (~60% width):
- Settings panel:
  - 目标字数: 3000字/章
  - AI模型: 豆包
  - 生成间隔: 30秒
  - ☑ 先确认大纲再生成正文
  - ☑ 自动同步大纲更新

- Progress section (showing active generation):
  - Overall progress bar: "3/5 章已完成 60%"
  - Chapter status list:
    ✅ 第6章 拍卖会 - 已完成 (3,245字) [green]
    ✅ 第7章 异火现世 - 已完成 (3,102字) [green]
    ✅ 第8章 激烈争夺 - 已完成 (2,987字) [green]
    🔄 第9章 意外收获 - 生成中 45% [blue, animated]
    ⏳ 第10章 实力突破 - 等待中 [gray]
  - "暂停生成" button (red outline)
  - "重试失败" button (if any failed)

Bottom tip: "批量生成耗时较长，建议预留足够时间"

Design: Split-panel workspace, clear progress visualization, status color-coding, Chinese text.
```

---

## 九、个人中心页面

```
Create a user profile/account center page for a Chinese AI novel writing app.

Header: "个人中心" with settings gear icon

Top section - User info card:
- Large avatar circle with user initial
- Username: "创作者小明"
- VIP badge: "VIP会员" (gold) with expiry "到期时间：2026-08-24"
- Registration date: "注册时间：2026-03-15"

Stats row (3 cards):
- 创作字数: "156,800 字"
- 小说数量: "3 本"
- 章节数量: "52 章"

Tab navigation: "积分" | "充值" | "导出" | "导入"

"积分" tab content:
- Current points: "当前积分：850" (large, purple)
- Points history list:
  - +100 注册奖励 2026-03-15
  - -5 生成大纲（5章） 2026-05-20
  - -20 生成正文（2章） 2026-05-21
  - +10 每日签到 2026-05-24
  - -3 生成细纲（3章） 2026-05-24

"充值" tab content:
- Points packages:
  - 100积分 ¥10
  - 300积分 ¥25 (推荐, hot tag)
  - 500积分 ¥40
  - 1000积分 ¥70
- Payment method: 支付宝 icon
- Note: "充值任意金额即可获得30天VIP"

Design: Clean profile layout, card-based stats, tabbed content, Chinese text.
```

---

## 十、AI生成参数设置弹窗

```
Create an AI generation settings modal dialog for a Chinese AI novel writing app.

Modal title: "生成设置" with subtitle "自定义AI生成参数"

Section 1 - "基础设置":
- 生成数量: stepper control "10" 章 (range: 5-20)
- 目标字数: stepper control "3000" 字 (range: 1000-10000)
- 字数容差: stepper control "±300" 字
- AI模型: dropdown "豆包模型 ▼" (options: 豆包/文心/通义)

Section 2 - "上下文参考":
- 参考章节数: dropdown "3 章 ▼" (range: 1-10)
- Checkboxes grid (2 columns):
  ☑ 大纲和细纲 (必选, disabled)
  ☑ 已有正文摘要
  ☑ 主角状态追踪
  ☑ 角色关系
  ☑ 技能和道具状态
  ☐ 重要事件

Section 3 - "包含设定" (collapsible):
- Checkboxes:
  ☑ 角色设定
  ☑ 技能/法宝
  ☑ 物品/道具
  ☑ 地点场景
  ☑ 已有剧情线

Bottom buttons:
- "恢复默认" (text link, left)
- "取消" (gray outline, right)
- "开始生成" (purple-pink gradient, right, primary)

Design: Organized form sections, clear grouping, intuitive controls, Chinese text.
```

---

## 十一、新手引导/25道题引导页

```
Create a guided onboarding page for a Chinese AI novel writing app, titled "25道题引导".

Header: "✨ 创建你的专属小说" with progress "1/25"

Progress bar: thin purple gradient bar showing 4% completion

Question card (centered):
- Question number badge: "Q1"
- Question: "你想写什么类型的小说？"
- Subtitle: "选择最接近你想法的类型"
- Option cards grid (2x3):
  - 🐉 玄幻修仙
  - 🏙️ 现代都市
  - ⏰ 穿越重生
  - 🚀 科幻未来
  - 🔍 悬疑推理
  - 💕 言情甜宠
- Each card has hover effect with purple border

Bottom navigation:
- "上一步" button (gray, disabled state)
- "下一步" button (purple-pink gradient)
- "跳过引导" text link

Design: Step-by-step wizard, card-based options, encouraging tone, progress indication, Chinese text.
```

---

## 十二、成就系统页面

```
Create an achievements system page for a Chinese AI novel writing app.

Header: "成就系统" with progress "12/98 已解锁"

Stats bar:
- 🏆 总成就: 98
- ✅ 已解锁: 12
- 🔒 未解锁: 86
- 📊 完成度: 12%

Achievement categories (tab pills):
全部 | 创作 | 社交 | 成长 | 特殊

Achievement grid (3 columns):
- Unlocked achievements (colorful cards):
  - 🎯 "初出茅庐" - 完成第一章创作 | 2026-05-20
  - 📝 "笔耕不辍" - 连续3天创作 | 2026-05-22
  - 🤖 "AI助手" - 首次使用AI生成 | 2026-05-20
  - 📚 "小说家" - 创建第一本小说 | 2026-05-20

- Locked achievements (grayed out cards with lock icon):
  - 🔒 "万字长篇" - 累计创作10万字
  - 🔒 "高产作者" - 单日创作5000字
  - 🔒 "百章达成" - 创作满100章

Design: Gamification aesthetic, achievement card grid, progress tracking, colorful unlocked vs gray locked, Chinese text.
```

---

## 十三、数据导出/导入页面

```
Create a data export/import page for a Chinese AI novel writing app.

Header: "数据管理" with info icon

Two main sections side by side:

Left section - "导出数据":
- Description: "将你的小说数据导出为备份文件"
- Project selector dropdown: "选择要导出的项目 ▼"
- Export content checkboxes:
  ☑ 项目信息
  ☑ 大纲和细纲
  ☑ 章节正文
  ☑ 角色设定
  ☑ 世界设定
  ☑ 主角追踪数据
- "全部选择" link
- File format note: "导出格式：JSON（包含所有数据）"
- "导出数据" button (purple gradient)
- Tip: "💡 定期导出是个好习惯，防止数据丢失"

Right section - "导入数据":
- Description: "从备份文件恢复小说数据"
- File upload area (dashed border):
  - Cloud upload icon
  - "点击或拖拽文件到此处"
  - "支持 .json 格式"
- "开始导入" button (outline, disabled until file selected)
- Warning: "⚠️ 导入会覆盖当前项目数据，请谨慎操作"

Design: Clean dual-panel layout, clear action buttons, helpful tips, Chinese text.
```

---

## 十四、移动端响应式首页

```
Create a mobile-responsive bookshelf homepage for a Chinese AI novel writing app (375px width).

Top bar:
- Hamburger menu (≡)
- "我的书架" title with "3本" badge
- User avatar circle (small)

Search bar: full width, "搜索小说..."

Quick action buttons (horizontal scroll):
- ⚡ 快速创作
- 📝 新建项目
- 🎨 封面生成
- 📊 数据统计

Project cards (vertical list, full width):
Each card:
- Small cover thumbnail (left, 60x80px)
- Book info (right):
  - Title: "星辰变"
  - Genre: "玄幻" tag
  - Progress: "25章 | 78,000字"
  - Last edited: "2小时前"
- Chevron right arrow (›)

Bottom navigation bar (fixed):
- 📚 书架 (active, purple)
- ✨ AI创作
- 👤 我的
- ⚙️ 设置

Floating action button (bottom right, above nav):
- "+" button with purple gradient

Design: Mobile-first, touch-friendly, bottom navigation, card list layout, Chinese text.
```

---

## 十五、封面生成页面

```
Create a novel cover generation page for a Chinese AI novel writing app.

Header: "封面生成" with back arrow

Left panel - "封面设置":
- Current cover preview (large, 200x280px book cover ratio)
  - Shows generated cover image placeholder
  - "重新生成" button overlay

- Style options (radio cards):
  - 🎨 古风仙侠 (selected, purple border)
  - 🏙️ 现代都市
  - 🚀 科幻未来
  - 🌸 言情唯美
  - 🔮 暗黑奇幻

- Custom elements:
  - 主标题 input: "星辰变"
  - 副标题 input: "修仙之路"
  - 作者名 input: "我吃西红柿"
  - 配色方案: color palette selector (4 preset palettes)

Right panel - "生成历史":
- Grid of previously generated covers (2x3)
- Each thumbnail with timestamp
- Click to preview full size
- Delete button on hover

Bottom:
- "AI生成封面" button (purple-pink gradient, large)
- Cost note: "消耗 5 积分"

Design: Creative tool aesthetic, visual preview focus, style cards, Chinese text.
```

---

## 十六、首页/落地页

```
Create a landing page for a Chinese AI novel writing assistant called "AI 小说创作助手".

Full-screen hero section with deep purple-to-violet gradient background:
- Animated star-like particles floating in background
- Top navigation bar (transparent):
  - Left: Theme toggle button (sun/moon icon)
  - Right: "登录" button (outline style, white border)

Center content:
- Large app icon (rounded square, purple-pink gradient, white book symbol)
- Main headline: "释放你的创作想象力" in large white/pink gradient text
- Subtitle: "AI 小说创作助手" with sparkle emoji
- CTA button: "开始创作 →" (purple-pink gradient, large, rounded)

Feature tags row (below CTA):
- 📝 智能续写
- 👤 角色追踪
- ⚡ 批量生成
- 🎨 封面生成

Secondary CTA (bottom):
- "拆书分析" link with arrow

Footer:
- ICP备案信息: "渝ICP备2026009499号-1"
- Copyright text

Design: Modern landing page, dramatic gradient background, glassmorphism elements, Chinese text, inspiring and creative atmosphere.
```

---

## 十七、创建新项目-主角设定页

```
Create a character setup page for creating a new novel project in a Chinese AI writing app.

Modal-style page with tab navigation at top:
- Tabs: 基本信息 | 主角设定 (active, purple underline) | 世界观 | 剧情总纲 | 自定义设定 | 选择文件

Form section - "主角设定":
- 主角姓名 input with "随机" button (purple outline) on the right
  - "→ 更多名字风格" link below (small, purple text)
- 性别选择: Three pill buttons - 男 | 女 | 其他 (男 selected, purple)
- 年龄 input: number field with "岁" suffix
- 性格特点 textarea: placeholder "描述主角的性格特征..."
- 外貌描述 textarea: placeholder "描述主角的外貌特征..."
- 背景故事 textarea: placeholder "描述主角的身世背景..."
- 核心动机 textarea: placeholder "主角的目标和动机是什么..."
- 致命软肋 textarea: placeholder "主角的弱点或软肋..."

Navigation buttons at bottom:
- "上一步" (gray outline)
- "下一步" (purple-pink gradient)

Design: Form-focused layout, clean input fields, helpful placeholders, progress indication through tabs, Chinese text.
```

---

## 十八、创建新项目-世界观页

```
Create a world-building setup page for a Chinese AI novel writing app.

Tab navigation: 基本信息 | 主角设定 | 世界观 (active) | 剧情总纲 | 自定义设定 | 选择文件

Form section - "世界观设定":

Dropdown selectors (3 columns layout):
- 世界类型 dropdown: "中国古代 ▼" (options: 中国古代, 欧洲中世纪, 现代都市, 近未来, 远未来, 奇幻架空, ⚡ 自定义)
- 时代背景 dropdown: "古代 ▼" (options: 原始社会, 古代, 中世纪, 工业革命前, 工业时代, 现代, 近未来科技, 高度发达科技, 科幻设定, 魔导科技混合)
- 社会制度 dropdown: "封建制 ▼" (options: 部落制, 封建制, 帝制, 君主立宪, 共和制, 民主制, 企业寡头, 无政府)

Large text area:
- 世界观描述 textarea (full width, 6-8 lines):
  - Placeholder: "详细描述你的小说世界...\n\n包括地理环境、历史背景、特殊规则等..."
  - Character count: "0/2000"

Helper text at bottom:
- "💡 详细的世界观设定能让AI生成更符合预期的内容"

Navigation buttons:
- "上一步" (gray outline)
- "下一步" (purple-pink gradient)

Design: Structured form layout, dropdown-heavy interface, spacious text area, helpful tips, Chinese text.
```

---

## 十九、创建新项目-剧情总纲页

```
Create a plot outline setup page for a Chinese AI novel writing app.

Tab navigation: 基本信息 | 主角设定 | 世界观 | 剧情总纲 (active) | 自定义设定 | 选择文件

Form section - "剧情总纲":

Text areas for story structure (stacked vertically):

1. 核心剧情线 (required):
   - Label with red asterisk
   - Textarea (4-5 lines): placeholder "用200-500字概括整个故事的核心剧情..."
   - Character count

2. 开端:
   - Textarea (3-4 lines): placeholder "世界观建立、主角出场、核心冲突引入..."

3. 发展:
   - Textarea (3-4 lines): placeholder "冲突升级、势力对抗、小高潮迭起..."

4. 高潮:
   - Textarea (3-4 lines): placeholder "核心冲突推进、角色成长、真相揭示..."

5. 决战:
   - Textarea (3-4 lines): placeholder "最高潮对决、决战时刻..."

6. 结局:
   - Textarea (3-4 lines): placeholder "收束线索、解决结局..."

7. 最终走向:
   - Textarea (2-3 lines): placeholder "故事的最终结局描述..."

8. 核心矛盾:
   - Textarea (2-3 lines): placeholder "故事的核心矛盾冲突..."

Navigation buttons:
- "上一步" (gray outline)
- "下一步" (purple-pink gradient)

Design: Long-form content entry, clear section labels, generous text areas, story structure guidance, Chinese text.
```

---

## 二十、创建新项目-自定义设定页

```
Create a custom settings page for a Chinese AI novel writing app.

Tab navigation: 基本信息 | 主角设定 | 世界观 | 剧情总纲 | 自定义设定 (active) | 选择文件

Content area:

Preset template buttons (horizontal row):
- "修仙体系" button (purple outline, icon: ⚔️)
- "西方贵族" button (outline, icon: 👑)
- "科幻体系" button (outline, icon: 🚀)
- "都市体系" button (outline, icon: 🏙️)

Dynamic content area:
- "添加设定" button (dashed border, large, center)
- Or show existing custom settings as cards

Each custom setting card:
- Setting name input
- Setting type dropdown
- Content textarea
- Delete button (×)

Example preset content (when 修仙体系 selected):
- 修炼等级: "斗之气 → 斗者 → 斗师 → 大斗师 → 斗灵 → 斗王 → 斗皇 → 斗宗 → 斗尊 → 斗圣 → 斗帝"
- 功法分类: "天阶、地阶、玄阶、黄阶"
- 特殊设定: "异火榜、丹药品级..."

Helper text:
- "💡 自定义设定会作为AI生成的重要参考"

Navigation buttons:
- "上一步" (gray outline)
- "创建" (purple-pink gradient, primary)

Design: Template-driven interface, expandable cards, dashed placeholder for empty state, Chinese text.
```

---

## 二十一、25道题引导-首页

```
Create a guided novel creation homepage for a Chinese AI writing app.

Header bar:
- Close button (×) on right
- "返回管理中心" link on left with back arrow

Main content:
- Large title: "25道题创建引导" with sparkle emoji
- Subtitle: "通过25道精心设计的题目，帮你构建完整的小说框架"

Center illustration:
- Large illustration showing a writer with AI assistant
- Or abstract creative visualization with purple gradient

Action area:
- "新建引导项目" button (large, purple-pink gradient, with + icon)
- "如何使用？" expandable section below

Empty state (when no projects):
- Document icon (large, gray)
- "还没有引导项目" text
- "点击上方按钮创建你的第一个引导项目" hint

Design: Clean onboarding page, encouraging tone, prominent CTA, helpful guidance, Chinese text.
```

---

## 二十二、25道题引导-新建项目

```
Create a new guided project page for a Chinese AI novel writing app.

Header:
- Close button (×)
- "返回列表" link with back arrow
- Title: "新建引导项目"

Form card (centered, white background):
- 小说标题 input * (required indicator):
  - Placeholder: "给你的小说起个名字"
  - Helper: "好的标题能吸引读者"

- 小说类型 dropdown *:
  - Default: "请选择小说类型 ▼"
  - Options: 玄幻, 都市, 穿越, 科幻, 仙侠, 悬疑, 言情, 其他

- 目标字数 dropdown:
  - Default: "请选择预估字数 ▼"
  - Options with descriptions:
    - 10万字（短篇）- 适合新手练笔
    - 30万字（中篇）- 标准网文长度
    - 50万字（中长篇）- 深度故事
    - 100万字（长篇）- 宏大世界观
    - 200万字以上（超长篇）- 史诗巨作

Button row:
- "取消" (gray outline)
- "开始创建" (purple-pink gradient, disabled until required fields filled)

Design: Simple focused form, clear required indicators, helpful dropdown options, Chinese text.
```

---

## 二十三、积分充值页面

```
Create a points recharge page for a Chinese AI novel writing app.

Header: "积分充值" with back arrow

VIP banner (top, gold/purple gradient):
- "VIP会员限时特权" title with crown icon
- Benefits list:
  - ✓ 云同步功能
  - ✓ 完整追踪器恢复
  - ✓ 优先客服支持
- "立即开通" button (gold outline)

Points packages section:

1. 体验套餐 (highlighted with "推荐" tag):
   - Small card: "100积分" - "¥10"
   - "立即充值" button (purple)

2. 标准套餐 (grid of 3):
   - "300积分" - "¥25" (hot tag)
   - "500积分" - "¥40"
   - "1000积分" - "¥70"
   - Each with "立即充值" button

3. 年度套餐 (featured card):
   - Large card with purple gradient border
   - "年度VIP会员" - "¥298/年"
   - "包含无限积分 + 全部VIP特权"
   - "立即开通" button (purple-pink gradient)

Usage rules section (collapsible):
- "积分使用说明" header
- Bullet points:
  - AI生成章节按实际字数计费
  - 四舍五入到整数扣除
  - 生成失败/未保存不扣积分
  - 不同AI模型价格不同
- "查看AI模型价格" link

Payment method:
- 支付宝 icon (selected)

Design: E-commerce style, clear pricing tiers, featured recommendations, trust signals, Chinese text.
```

---

## 二十四、AI模型设置页

```
Create an AI model settings page for a Chinese AI novel writing app.

Header: "AI模型设置" with back arrow

Current model card (large, highlighted):
- Model name: "豆包Seed-Flash 2" (large text)
- Badge: "默认模型" (purple)
- Description: "字节跳动出品，中文理解能力强，生成速度快"
- Features:
  - ✓ 支持长文本生成
  - ✓ 中文语境优化
  - ✓ 性价比高
- "使用中" label (green)

Other models list (disabled/coming soon):
- Model card (grayed out):
  - "文心一言" 
  - "百度出品，知识丰富"
  - "即将上线" badge
- Model card (grayed out):
  - "通义千问"
  - "阿里出品，创意丰富"
  - "即将上线" badge

Model comparison table:
| 模型 | 价格系数 | 特点 |
|------|----------|------|
| 豆包Seed-Flash 2 | 1.0x | 默认推荐 |
| 文心一言 | 1.2x | 知识型 |
| 通义千问 | 1.1x | 创意型 |

Bottom button:
- "保存设置" (purple-pink gradient, full width)

Design: Settings page layout, model cards with clear status, comparison table, Chinese text.
```

---

## 二十五、云同步页面

```
Create a cloud sync page for a Chinese AI novel writing app.

Header: "云同步" with back arrow

Status card (top):
- Cloud icon (large, purple)
- Status text: "云同步功能" 
- Subtitle: "VIP会员专属功能"
- Current user status: "您当前是VIP会员" (green badge) or "升级VIP即可使用" (orange)

Sync status section:
- "上次同步：2026-05-24 15:30" (if synced)
- "本地项目数：3"
- "云端项目数：3"
- "同步状态：✓ 已同步" (green)

Action buttons:
- "检测本地缓存" (outline button)
- "同步选中项目" (purple gradient, disabled if no selection)

Project list with checkboxes:
- ☑ 星辰变 - "最后修改：2小时前" - "✓ 已同步"
- ☑ 斗破苍穹 - "最后修改：昨天" - "✓ 已同步"
- ☐ 新书项目 - "最后修改：刚刚" - "⚠ 未同步"

Sync log (collapsible):
- Recent sync activities with timestamps

Helper text:
- "💡 云同步可确保你的数据安全，换设备也能继续创作"

Design: Functional tool interface, status indicators, checkable list, sync log, Chinese text.
```

---

## 二十六、数据导出页面

```
Create a data export page for a Chinese AI novel writing app.

Header: "数据导出" with back arrow

Project selector:
- Dropdown: "选择要导出的项目 ▼"
- Or show all projects with checkboxes

Export content section:
- "导出内容" header
- Checkbox list:
  - ☑ 项目信息（标题、类型、简介）
  - ☑ 所有章节正文（按章节顺序排列）
  - ☑ 世界观设定
  - ☑ 角色设定（外貌、性格、背景等）
  - ☑ 物品和地点设定
  - ☐ 设定附录（角色、物品、世界观等详细设定）
- "全部选择" / "取消全选" links

Format info:
- "导出格式：JSON（包含所有数据）"
- File icon with JSON label

Warning box (yellow/orange):
- "⚠️ 导出的文件请妥善保管，避免数据泄露"

Action button:
- "导出数据" (purple-pink gradient, large)

Tip at bottom:
- "💡 定期导出是个好习惯，防止数据丢失"

Design: Data management interface, checklist pattern, warning highlights, action-oriented, Chinese text.
```

---

## 二十七、数据导入页面

```
Create a data import page for a Chinese AI novel writing app.

Header: "数据导入" with back arrow

Instructions section:
- "使用说明" header with info icon
- Numbered list:
  1. 仅支持本平台导出的JSON格式文件
  2. 导入时会创建新项目，不会覆盖现有项目
  3. 导入包含完整数据（章节、大纲、角色、世界观等）
  4. VIP用户的追踪器和剧情事件会一并恢复

File upload area (large, dashed border):
- Cloud upload icon (large, purple)
- "点击或拖拽文件到此处"
- "支持 .json 格式"
- File size limit: "最大 50MB"

Selected file display (when file selected):
- File icon
- Filename: "my_novel_backup_20260524.json"
- File size: "2.3 MB"
- Remove button (×)

Warning box (red/orange):
- "⚠️ 导入会创建新项目，不会覆盖现有数据"

Action buttons:
- "选择文件" (outline)
- "开始导入" (purple-pink gradient, disabled until file selected)

Design: File upload interface, clear instructions, drag-and-drop area, safety warnings, Chinese text.
```

---

## 二十八、名字生成器页面

```
Create a name generator page for a Chinese AI novel writing app.

Header: "名字生成器" with back arrow and "返回管理中心" link

Tab switcher:
- "随机生成" (active, purple underline)
- "AI智能生成"

Gender selection (icon buttons):
- ♂ 男 (selected, blue)
- ♀ 女 (pink)
- ⚥ 通用 (purple)

Style selection (pill buttons):
- 简约 | 古风 (selected) | 玄幻 | 现代 | 酷炫 | 可爱

Length slider:
- "名字长度" label
- Slider: 短 ←————●————→ 长
- Current value: "3-4字"

Generated names display (grid, 3x4):
- Name cards:
  - "萧炎" (large text)
  - "萧薰儿"
  - "林动"
  - "绫清竹"
  - "牧尘"
  - "洛璃"
  - ... (more names)

Each card:
- Hover effect with "复制" button
- Click to copy

Bottom:
- "生成名字" button (purple-pink gradient, large, with refresh icon)
- "消耗 1 积分" note (small, gray)

Design: Creative tool interface, gender/style selectors, results grid, copy functionality, Chinese text.
```

---

## 二十九、AI拆书工作室页面

```
Create a book analysis studio page for a Chinese AI novel writing app.

Header: "AI拆书工作室" with back arrow and "返回" link

Upload section (centered, large):
- Upload icon (large, purple, cloud with book)
- Title: "上传小说文件"
- Subtitle: "支持 .txt, .docx, .pdf 格式"
- "选择文件" button (purple outline)
- Drag-and-drop area: "或将文件拖拽到此处"

File requirements:
- "文件大小限制：最大 50MB"
- "推荐字数：10万字以上效果更佳"

Analysis features preview (below upload):
- "AI将为你分析：" header
- Feature cards (horizontal scroll):
  - 📊 情节结构分析
  - 👤 角色关系图谱
  - 📈 节奏曲线图
  - 🎯 高潮分布
  - 💡 写作技巧提取

Sample report preview (when scrolled down):
- "查看示例报告" link
- Thumbnail of sample analysis

Design: Upload-focused interface, feature preview, clear file requirements, professional tool aesthetic, Chinese text.
```

---

## 三十、新手教程页面

```
Create a tutorial/help center page for a Chinese AI novel writing app.

Header: "新手教程" with back arrow

Category grid (2 columns, icon cards):

Row 1:
- 🚀 快速开始 (purple gradient card)
  - "3篇" badge
  - 网站介绍、使用准备、5分钟创作
- 📖 核心功能详解 (blue gradient card)
  - "7篇" badge
  - 项目管理、大纲生成、细纲生成...

Row 2:
- ⚡ 进阶功能 (orange gradient card)
  - "6篇" badge
  - 批量生成、上下文连贯、自动信息提取...
- 💰 积分系统 (green gradient card)
  - "3篇" badge
  - 积分获取、积分计算、VIP特权

Row 3:
- ❓ 常见问题 (red gradient card)
  - "8篇" badge
  - 商用许可、质量问题、一致性...
- 📞 帮助与支持 (teal gradient card)
  - "2篇" badge
  - 问题反馈、关于网站

Row 4:
- 🎬 视频教学 (pink gradient card)
  - "1篇" badge
  - 视频教程入口

Each card:
- Large emoji/icon
- Category name (bold)
- Article count badge
- Brief description
- Hover effect with shadow

Search bar (top, optional):
- "搜索教程..." input

Design: Help center layout, colorful category cards, clear organization, accessible navigation, Chinese text.
```

---

## 使用说明

1. **复制提示词**：将上述任一页面的提示词完整复制
2. **粘贴到 Google Stitch**：在 Stitch 的提示词输入框中粘贴
3. **生成原型**：点击生成，Stitch 会根据描述创建对应的 UI 原型
4. **迭代调整**：根据生成结果，修改提示词中的细节进行迭代

### 页面清单汇总

| 序号 | 页面名称 | 对应PRD章节 |
|------|----------|-------------|
| 1 | 登录/注册页 | 3.2 登录/注册页 |
| 2 | 首页/我的书架 | 3.3 我的书架 |
| 3 | 创建新项目弹窗 | 3.4 创建新项目-基本信息 |
| 4 | 小说项目工作台 | 4.1.2-4.1.4 大纲/细纲/正文生成 |
| 5 | 章节编辑器页面 | 4.1.5 章节编辑 |
| 6 | 角色追踪面板 | 4.1.6 角色追踪 |
| 7 | 世界设定页面 | 4.1.7 世界设定 |
| 8 | 批量生成工作室 | 4.2.1 批量生成 |
| 9 | 个人中心页面 | 3.12 作者中心 |
| 10 | AI生成参数设置弹窗 | 4.1.2-4.1.4 生成参数 |
| 11 | 新手引导页 | 3.9-3.10 25道题引导 |
| 12 | 成就系统页面 | 3.11 成就系统 |
| 13 | 数据导出/导入页面 | 3.16-3.17 数据导出/导入 |
| 14 | 移动端响应式首页 | 6.3 兼容性需求 |
| 15 | 封面生成页面 | 4.2.4 封面生成 |
| 16 | 首页/落地页 | 3.1 首页 |
| 17 | 创建新项目-主角设定 | 3.5 创建新项目-主角设定 |
| 18 | 创建新项目-世界观 | 3.6 创建新项目-世界观 |
| 19 | 创建新项目-剧情总纲 | 3.7 创建新项目-剧情总纲 |
| 20 | 创建新项目-自定义设定 | 3.8 创建新项目-自定义设定 |
| 21 | 25道题引导-首页 | 3.9 25道题引导首页 |
| 22 | 25道题引导-新建 | 3.10 25道题引导新建 |
| 23 | 积分充值页面 | 3.13 积分充值 |
| 24 | AI模型设置页 | 3.14 AI模型设置 |
| 25 | 云同步页面 | 3.15 云同步 |
| 26 | 数据导出页面 | 3.16 数据导出 |
| 27 | 数据导入页面 | 3.17 数据导入 |
| 28 | 名字生成器页面 | 3.18 名字生成器 |
| 29 | AI拆书工作室页面 | 3.19 AI拆书工作室 |
| 30 | 新手教程页面 | 3.20 新手教程 |

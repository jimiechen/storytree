# Novel Editor Stitch 页面实现开发指导文档

> **项目**: StoryTree2 / OpenCode Creative Studio
> **文档版本**: v1.0
> **日期**: 2026-06-10
> **状态**: 待评审

---

## 一、需求概述

### 1.1 背景

基于 `/workspace/stitch/stitch_ai_novel_writing_dashboard` 的 10 份 PRD 文档，在现有 `/workspace/caiode/opencode-1.4.0/packages/app/src/novel` 模块基础上进行二次开发，实现完整的小说编辑器功能。

### 1.2 现有代码基线

当前 novel 模块已实现：
- **三栏布局**: 章节列表 | 编辑器 | 角色面板
- **Mock 数据层**: Project / Chapter / Character / AITask / AILog 5 个 Provider
- **AI 模拟层**: FakeAgentProvider（4 种任务类型）
- **测试覆盖**: 11 个 FakeAgent 场景 + 6 个 Mock Data 验证

### 1.3 设计系统

采用 ProseFlow AI 设计规范：
- **主色**: 紫色系 `#6b38d4` / `#8455ef`
- **辅色**: 橙色 `#fd761a`、蓝色 `#2170e4`
- **背景**: `#f8f9ff`（surface）/ `#ffffff`（container）
- **文字**: `#0d1c2f`（on-surface）/ `#494454`（variant）
- **字体**: Plus Jakarta Sans（英文标题）/ Work Sans（英文正文）/ PingFang SC（中文）
- **圆角**: 8px（标准）/ 12px（卡片）/ 16px（大容器）
- **间距**: 4px 基线，md=16px，lg=24px

---

## 二、Stitch 页面需求清单

| # | 页面/功能 | PRD 路径 | 优先级 | 当前状态 | 实现阶段 |
|---|----------|---------|--------|---------|---------|
| 1 | **我的书架** | `02_我的书架/` | P0 | ❌ 未实现 | Phase 1 |
| 2 | **创建新项目弹窗** | `03_创建新项目弹窗/` | P0 | ❌ 未实现 | Phase 1 |
| 3 | **小说项目工作台** | `04_小说项目工作台/` | P0 | 🔄 部分实现 | Phase 1 |
| 4 | **章节编辑器页面** | `05_章节编辑器页面/` | P0 | 🔄 部分实现 | Phase 1 |
| 5 | **角色追踪面板** | `06_角色追踪面板/` | P1 | 🔄 部分实现 | Phase 2 |
| 6 | **世界设定页面** | `07_世界设定页面/` | P1 | ❌ 未实现 | Phase 2 |
| 7 | **个人中心页面** | `09_个人中心页面/` | P0 | ❌ 未实现 | Phase 3 |
| 8 | **AI 生成参数设置弹窗** | `10_AI生成参数设置弹窗/` | P0 | ❌ 未实现 | Phase 1 |
| 9 | **成就系统页面** | `11_成就系统页面/` | P1 | ❌ 未实现 | Phase 3 |
| 10 | **25 道题引导页** | `12_25道题引导页/` | P0 | ❌ 未实现 | Phase 2 |

> **图例**: ❌ 未实现 / 🔄 部分实现 / ✅ 已实现

---

## 三、分阶段开发计划

### Phase 1: 核心创作流程（P0 优先）

**目标**: 实现从书架 → 创建项目 → 工作台 → 编辑器 → AI 生成的完整闭环

**时间预估**: 2-3 周

#### 3.1.1 我的书架（`02_我的书架`）

**需求**: 项目列表页，展示所有小说项目

**核心功能**:
- 顶部导航栏：汉堡菜单 + "我的书架"标题 + 项目数量徽章
- 搜索栏：全宽搜索框，placeholder "搜索小说..."
- 工具栏：快速操作、模板、新建按钮等彩色图标
- 项目卡片网格（2 列）：封面、书名、类型标签、章节/字数统计、最后编辑时间
- 卡片悬停：编辑/删除按钮覆盖层
- 右下角浮动组件：签到、成就、活动、统计
- 空状态：引导创建第一部小说

**新建/修改文件**:
```
novel/
├── pages/
│   └── bookshelf.tsx              # [新增] 我的书架页面
├── components/
│   ├── bookshelf/
│   │   ├── index.tsx              # [新增] 书架主组件
│   │   ├── project-card.tsx       # [新增] 项目卡片
│   │   ├── project-grid.tsx       # [新增] 项目网格
│   │   ├── search-bar.tsx         # [新增] 搜索栏
│   │   ├── toolbar.tsx            # [新增] 工具栏
│   │   ├── empty-state.tsx        # [新增] 空状态
│   │   └── floating-stats.tsx     # [新增] 浮动统计
│   └── modals/
│       └── create-project-modal.tsx # [新增] 创建项目弹窗
```

**类型扩展**:
```typescript
// types/project.ts 新增
interface ProjectStats {
  totalWordCount: number;
  chapterCount: number;
  characterCount: number;
  lastEditedAt: Date;
}

interface ProjectCard {
  id: string;
  name: string;
  genre: string;
  coverColor: string;        // 封面渐变色
  stats: ProjectStats;
  status: 'active' | 'archived' | 'draft';
}
```

#### 3.1.2 创建新项目弹窗（`03_创建新项目弹窗`）

**需求**: Modal 弹窗，支持简易创作和完整创建两种模式

**核心功能**:
- Tab 切换：简易创作（推荐标签）| 创建新项目
- 表单字段：书名*、类型*（下拉：玄幻/都市/穿越/科幻/仙侠/悬疑/其他）、简介
- 主角设定：姓名、性别（单选）、年龄、性格
- 自定义设定：textarea（修仙体系、科技设定等）
- 目标读者选项：大众 / 男频 / 女频
- 写作风格选项：默认/诙谐幽默/人性黑暗/杀伐果断/文学性强/快节奏/慢节奏/悬疑/热血/轻松/虐心/自定义
- 故事主题选项：默认/复仇/成长/爱情/冒险/救赎/权力/友情/生存/探索/竞争/家庭/自定义
- 底部按钮：取消（灰色描边）/ 创建（紫粉渐变）

**新建/修改文件**:
```
novel/
├── components/
│   └── modals/
│       ├── create-project-modal.tsx   # [新增] 创建项目弹窗主组件
│       ├── simple-create-tab.tsx      # [新增] 简易创作 Tab
│       └── full-create-tab.tsx        # [新增] 完整创建 Tab
```

**类型扩展**:
```typescript
// types/project.ts 新增
interface ProjectCreateInput {
  name: string;
  genre: NovelGenre;
  description: string;
  protagonist: ProtagonistConfig;
  customSettings: string;
  targetAudience: 'general' | 'male' | 'female';
  writingStyle: WritingStyle;
  storyTheme: StoryTheme;
}

type NovelGenre = 'fantasy' | 'urban' | 'time_travel' | 'sci_fi' | 'xianxia' | 'mystery' | 'romance' | 'other';
type WritingStyle = 'default' | 'humorous' | 'dark' | 'decisive' | 'literary' | 'fast_paced' | 'slow_paced' | 'suspense' | 'passionate' | 'relaxed' | 'heartbreaking' | 'custom';
type StoryTheme = 'default' | 'revenge' | 'growth' | 'love' | 'adventure' | 'redemption' | 'power' | 'friendship' | 'survival' | 'exploration' | 'competition' | 'family' | 'custom';
```

#### 3.1.3 小说项目工作台（`04_小说项目工作台`）

**需求**: 核心编辑工作台，三栏布局

**与现有代码的差异**:
- 现有：左侧章节列表 | 中间编辑器 | 右侧角色面板
- Stitch：左侧大纲/细纲/章节 Tab | 中间内容区 + AI 生成进度 | 右侧生成设置面板

**核心功能**:
- **左侧面板（~250px）**:
  - Tab 切换器：大纲 | 细纲 | 章节
  - 大纲列表项：章节编号、标题、选择复选框、展开箭头、星标
  - 底部按钮："AI 生成大纲"（紫色渐变）、"生成细纲"（描边）
- **中间面板**:
  - 顶部栏：当前章节标题
  - 内容区域：大纲文本或章节正文
  - AI 生成进度条："正在生成第 X 章... XX%" + 实时预览 + 暂停按钮
- **右侧面板（~300px）**:
  - 生成设置：目标字数（3000，+/- 调节）、字数容差（±300）、参考章节数（3，下拉）、AI 模型（豆包，下拉）
  - 上下文参考复选框：大纲和细纲（必选）/ 已有正文摘要 / 主角状态追踪 / 角色关系 / 技能和道具状态 / 重要事件
  - 操作按钮："开始生成"（紫粉渐变）/ "批量生成"（描边）

**新建/修改文件**:
```
novel/
├── components/
│   └── workbench/
│       ├── index.tsx                # [新增] 工作台主组件
│       ├── left-panel.tsx           # [新增] 左侧面板（大纲/细纲/章节）
│       ├── outline-tree.tsx         # [新增] 大纲树形组件
│       ├── content-area.tsx         # [新增] 中间内容区
│       ├── ai-progress-bar.tsx      # [新增] AI 生成进度条
│       ├── right-panel.tsx          # [新增] 右侧面板（生成设置）
│       └── generation-settings.tsx  # [新增] 生成设置表单
```

#### 3.1.4 章节编辑器页面（`05_章节编辑器页面`）

**需求**: 专注写作的无干扰编辑器

**与现有代码的差异**:
- 现有：ChapterEditor 组件（简单文本编辑 + AI 续写按钮）
- Stitch：专业编辑器 + 右侧信息面板 + AI 提取信息

**核心功能**:
- **顶部工具栏**: 返回箭头 + "第 X 章 XXXXX" 标题 + 字数统计 + 操作按钮（历史版本 | 备注 | AI 续写 | 保存 Ctrl+S）
- **主编辑区**: 大型文本编辑区、中文小说正文、舒适行高、选中文本高亮
- **右侧面板（~280px）**:
  - 章节信息：状态（绿色徽章）、创建时间、最后修改
  - AI 提取信息：章节摘要、新角色、主角状态（位置/情绪/实力）、获得道具、重要事件
  - "重新提取信息"按钮

**新建/修改文件**:
```
novel/
├── components/
│   └── chapter-editor/
│       ├── index.tsx                # [修改] 现有 chapter-editor.tsx 重构
│       ├── editor-toolbar.tsx       # [新增] 编辑器工具栏
│       ├── text-editor.tsx          # [新增] 文本编辑区
│       ├── chapter-info-panel.tsx   # [新增] 章节信息面板
│       └── ai-extract-panel.tsx     # [新增] AI 提取信息面板
```

**类型扩展**:
```typescript
// types/chapter.ts 新增
interface ChapterAIExtract {
  summary: string;
  newCharacters: string[];
  protagonistState: {
    location: string;
    emotion: string;
    powerLevel: string;
  };
  obtainedItems: string[];
  keyEvents: string[];
}

interface ChapterEditorState {
  content: string;
  wordCount: number;
  status: 'draft' | 'writing' | 'review' | 'completed';
  aiExtract?: ChapterAIExtract;
  versions: ChapterVersion[];
}
```

#### 3.1.5 AI 生成参数设置弹窗（`10_AI生成参数设置弹窗`）

**需求**: Modal 弹窗，自定义 AI 生成参数

**核心功能**:
- Section 1 - 基础设置：生成数量（10 章，5-20）、目标字数（3000，1000-10000）、字数容差（±300）、AI 模型（豆包/文心/通义）
- Section 2 - 上下文参考：参考章节数（1-10）、复选框网格（大纲和细纲/已有正文摘要/主角状态追踪/角色关系/技能和道具状态/重要事件）
- Section 3 - 包含设定（可折叠）：角色设定 / 技能/法宝 / 物品/道具 / 地点场景 / 已有剧情线
- 底部按钮："恢复默认" / "取消" / "开始生成"

**新建/修改文件**:
```
novel/
├── components/
│   └── modals/
│       └── ai-generation-settings-modal.tsx  # [新增] AI 生成设置弹窗
```

**类型扩展**:
```typescript
// types/ai-generation.ts [新增文件]
interface AIGenerationSettings {
  chapterCount: number;        // 5-20
  targetWordCount: number;     // 1000-10000
  wordCountTolerance: number;  // 默认 300
  aiModel: 'doubao' | 'wenxin' | 'tongyi';
  referenceChapterCount: number; // 1-10
  contextReferences: {
    outline: boolean;          // 必选，禁用
    summary: boolean;
    protagonistState: boolean;
    relationships: boolean;
    skillsAndItems: boolean;
    keyEvents: boolean;
  };
  includedSettings: {
    characters: boolean;
    skills: boolean;
    items: boolean;
    locations: boolean;
    plotLines: boolean;
  };
}
```

---

### Phase 2: 内容管理与引导（P1 + P0 引导）

**目标**: 实现角色追踪、世界设定、25 道题引导

**时间预估**: 1-2 周

#### 3.2.1 角色追踪面板（`06_角色追踪面板`）

**需求**: 角色管理面板，支持分组和关系图

**与现有代码的差异**:
- 现有：CharacterPanel（简单角色卡片列表）
- Stitch：分组折叠（主角/配角/反派/其他）+ 状态追踪器 + 人物关系图

**核心功能**:
- 头部："角色追踪"标题 + "添加角色"按钮
- 角色分组（可折叠）：
  - 主角（1 个）：头像（紫色圆形首字母）、姓名、类型徽章、描述、首次出场、状态追踪器（当前位置/实力等级/情绪状态/已获技能/已获道具）
  - 配角（紧凑列表）：姓名 + 类型徽章 + 简要描述 + 首次出场
  - 反派（同上）
  - 其他（可展开）
- 底部：人物关系图（角色间连线 + 标签）

**新建/修改文件**:
```
novel/
├── components/
│   └── character-tracking/
│       ├── index.tsx                # [新增] 角色追踪主组件
│       ├── character-group.tsx      # [新增] 角色分组（可折叠）
│       ├── character-card.tsx       # [新增] 角色卡片（详细版）
│       ├── character-list-item.tsx  # [新增] 角色列表项（紧凑版）
│       ├── status-tracker.tsx       # [新增] 状态追踪器
│       └── relationship-graph.tsx   # [新增] 人物关系图
```

**类型扩展**:
```typescript
// types/character.ts 扩展
interface CharacterStatus {
  currentLocation: string;
  powerLevel: string;
  emotionState: string;
  acquiredSkills: string[];
  acquiredItems: string[];
}

interface CharacterRelationship {
  characterId: string;
  targetCharacterId: string;
  type: 'mentor' | 'enemy' | 'friend' | 'family' | 'romantic' | 'rival';
  description: string;
}

interface CharacterGroup {
  id: string;
  name: string;        // 主角 / 配角 / 反派 / 其他
  characters: Character[];
  collapsed: boolean;
}
```

#### 3.2.2 世界设定页面（`07_世界设定页面`）

**需求**: 世界观构建页面，支持地点/物品/技能/势力分类管理

**核心功能**:
- 头部："世界设定"标题 + 副标题 + "AI 生成设定"按钮
- 世界概览卡：世界背景、力量体系、社会结构、特殊规则
- Tab 导航：地点 | 物品 | 技能 | 势力
- 地点 Tab：地点卡片列表（名称、标签、描述），悬停显示编辑/删除
- 其他 Tab 预览：物品（异火、武器）、技能（功法、斗技）
- 底部提示："设定越详细，生成内容越符合你的想法"

**新建/修改文件**:
```
novel/
├── pages/
│   └── world-building.tsx           # [新增] 世界设定页面
├── components/
│   └── world-building/
│       ├── index.tsx                # [新增] 世界设定主组件
│       ├── world-overview-card.tsx  # [新增] 世界概览卡
│       ├── location-tab.tsx         # [新增] 地点 Tab
│       ├── item-tab.tsx             # [新增] 物品 Tab
│       ├── skill-tab.tsx            # [新增] 技能 Tab
│       ├── faction-tab.tsx          # [新增] 势力 Tab
│       └── setting-card.tsx         # [新增] 设定卡片
```

**类型扩展**:
```typescript
// types/world-setting.ts [新增文件]
interface WorldSetting {
  id: string;
  projectId: string;
  background: string;
  powerSystem: string;
  socialStructure: string;
  specialRules: string;
}

interface WorldLocation {
  id: string;
  projectId: string;
  name: string;
  tag: string;         // 城镇 / 秘境 / 学院
  description: string;
}

interface WorldItem {
  id: string;
  projectId: string;
  name: string;
  category: string;    // 异火 / 武器 / 丹药
  description: string;
}

interface WorldSkill {
  id: string;
  projectId: string;
  name: string;
  category: string;    // 功法 / 斗技 / 秘术
  description: string;
}

interface WorldFaction {
  id: string;
  projectId: string;
  name: string;
  type: string;        // 家族 / 宗门 / 帝国
  description: string;
}
```

#### 3.2.3 25 道题引导页（`12_25道题引导页`）

**需求**: 分步向导，通过 25 道题帮助用户构建小说框架

**核心功能**:
- 引导首页（`/novel-guide`）：
  - 头部：关闭按钮 + "返回管理中心"
  - 主内容："25 道题创建引导"大标题 + 副标题
  - "新建引导项目"按钮（紫粉渐变）
  - "如何使用？"可展开区域
  - 空状态：文档图标 + "还没有引导项目"
- 新建引导项目（`/novel-guide/new`）：
  - 表单：小说标题*、小说类型*（下拉）、目标字数（下拉：10万/30万/50万/100万/200万+）
  - 按钮：取消 / 开始创建
- 问答流程（Q1-Q25）：
  - 进度条："创建你的专属小说" + "1/25"
  - 问题编号徽章 + 问题标题 + 副标题
  - 选项卡片网格（2x3）
  - 底部导航：上一步 / 下一步 / 跳过引导

**新建/修改文件**:
```
novel/
├── pages/
│   └── novel-guide.tsx              # [新增] 引导首页
│   └── novel-guide-new.tsx          # [新增] 新建引导项目
├── components/
│   └── novel-guide/
│       ├── index.tsx                # [新增] 引导首页组件
│       ├── guide-wizard.tsx         # [新增] 引导向导主组件
│       ├── question-card.tsx        # [新增] 问题卡片
│       ├── option-grid.tsx          # [新增] 选项网格
│       ├── progress-bar.tsx         # [新增] 进度条
│       └── guide-navigation.tsx     # [新增] 向导导航
```

**类型扩展**:
```typescript
// types/novel-guide.ts [新增文件]
interface GuideQuestion {
  id: number;
  question: string;
  subtitle: string;
  options: GuideOption[];
}

interface GuideOption {
  id: string;
  label: string;
  emoji: string;
  value: string;
}

interface GuideProject {
  id: string;
  title: string;
  genre: NovelGenre;
  targetWordCount: number;
  answers: Record<number, string>;  // questionId -> optionValue
  currentQuestion: number;
  completed: boolean;
}
```

---

### Phase 3: 用户系统与激励（P0 个人中心 + P1 成就）

**目标**: 实现个人中心、积分系统、成就系统

**时间预估**: 1-2 周

#### 3.3.1 个人中心页面（`09_个人中心页面`）

**需求**: 用户信息、创作统计、积分充值、导入导出

**核心功能**:
- 头部："个人中心"标题 + 设置齿轮
- 用户信息卡：大头像（首字母）、用户名、VIP 徽章（金色）+ 到期时间、注册时间
- 统计行（3 张卡片）：创作字数、小说数量、章节数量
- Tab 导航：积分 | 充值 | 导出 | 导入
  - 积分 Tab：当前积分（大号紫色）、积分变动记录列表
  - 充值 Tab：积分套餐（100/300/500/1000）、支付方式（支付宝）、VIP 说明

**新建/修改文件**:
```
novel/
├── pages/
│   └── profile.tsx                  # [新增] 个人中心页面
├── components/
│   └── profile/
│       ├── index.tsx                # [新增] 个人中心主组件
│       ├── user-info-card.tsx       # [新增] 用户信息卡
│       ├── stats-row.tsx            # [新增] 统计行
│       ├── points-tab.tsx           # [新增] 积分 Tab
│       ├── recharge-tab.tsx         # [新增] 充值 Tab
│       ├── export-tab.tsx           # [新增] 导出 Tab
│       └── import-tab.tsx           # [新增] 导入 Tab
```

**类型扩展**:
```typescript
// types/user.ts [新增文件]
interface UserProfile {
  id: string;
  username: string;
  avatar?: string;
  vipStatus: {
    isVip: boolean;
    expireAt?: Date;
  };
  registeredAt: Date;
  stats: {
    totalWordCount: number;
    novelCount: number;
    chapterCount: number;
  };
}

interface PointsRecord {
  id: string;
  change: number;      // +100 / -5
  reason: string;
  date: Date;
}

interface RechargePackage {
  id: string;
  points: number;
  price: number;
  label?: string;      // 推荐 / 热门
}
```

#### 3.3.2 成就系统页面（`11_成就系统页面`）

**需求**: 游戏化成就系统，98 个成就

**核心功能**:
- 头部："成就系统"标题 + 副标题 + 进度条（12/98 已解锁）
- 统计栏：总成就 / 已解锁 / 未解锁 / 完成度
- 分类标签（Tab pills）：全部 | 创作 | 社交 | 成长 | 特殊
- 成就网格（3 列）：
  - 已解锁：彩色卡片 + 成就名 + 描述 + 解锁时间
  - 未锁定：灰色卡片 + 锁图标 + 成就名 + 描述

**新建/修改文件**:
```
novel/
├── pages/
│   └── achievements.tsx             # [新增] 成就系统页面
├── components/
│   └── achievements/
│       ├── index.tsx                # [新增] 成就系统主组件
│       ├── achievement-grid.tsx     # [新增] 成就网格
│       ├── achievement-card.tsx     # [新增] 成就卡片
│       ├── category-tabs.tsx        # [新增] 分类标签
│       └── stats-bar.tsx            # [新增] 统计栏
```

**类型扩展**:
```typescript
// types/achievement.ts [新增文件]
interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'creation' | 'social' | 'growth' | 'special';
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

interface AchievementStats {
  total: number;
  unlocked: number;
  locked: number;
  completionRate: number;
}
```

---

## 四、数据模型变更总览

### 4.1 新增类型文件

| 文件 | 说明 |
|------|------|
| `types/ai-generation.ts` | AI 生成参数设置类型 |
| `types/world-setting.ts` | 世界设定类型（地点/物品/技能/势力） |
| `types/novel-guide.ts` | 25 道题引导类型 |
| `types/user.ts` | 用户/积分/充值类型 |
| `types/achievement.ts` | 成就系统类型 |

### 4.2 扩展现有类型

| 文件 | 扩展内容 |
|------|---------|
| `types/project.ts` | `ProjectCreateInput`, `NovelGenre`, `WritingStyle`, `StoryTheme`, `ProjectStats` |
| `types/chapter.ts` | `ChapterAIExtract`, `ChapterEditorState`, `ChapterVersion` |
| `types/character.ts` | `CharacterStatus`, `CharacterRelationship`, `CharacterGroup` |

### 4.3 Mock 数据扩展

| 文件 | 扩展内容 |
|------|---------|
| `mock-data/projects.ts` | 增加多项目数据（3-5 个项目） |
| `mock-data/characters.ts` | 增加配角/反派数据，补充状态追踪 |
| `mock-data/achievements.ts` | [新增] 98 个成就 Mock 数据 |
| `mock-data/user.ts` | [新增] 用户/积分 Mock 数据 |
| `mock-data/world-settings.ts` | [新增] 世界设定 Mock 数据 |

---

## 五、路由规划

### 5.1 新增路由

```typescript
// app.tsx 路由配置
const routes = [
  { path: "/novel", component: lazy(() => import("@/novel")) },           // 现有：工作台（默认）
  { path: "/novel/bookshelf", component: lazy(() => import("@/novel/pages/bookshelf")) },
  { path: "/novel/workbench/:projectId", component: lazy(() => import("@/novel")) },
  { path: "/novel/editor/:chapterId", component: lazy(() => import("@/novel/pages/chapter-editor")) },
  { path: "/novel/world", component: lazy(() => import("@/novel/pages/world-building")) },
  { path: "/novel-guide", component: lazy(() => import("@/novel/pages/novel-guide")) },
  { path: "/novel-guide/new", component: lazy(() => import("@/novel/pages/novel-guide-new")) },
  { path: "/profile", component: lazy(() => import("@/novel/pages/profile")) },
  { path: "/achievements", component: lazy(() => import("@/novel/pages/achievements")) },
];
```

---

## 六、组件复用策略

### 6.1 可复用组件（建议提取到 `components/ui/`）

| 组件 | 用途 | 使用页面 |
|------|------|---------|
| `Modal` | 弹窗容器 | 创建项目、AI 设置 |
| `Card` | 卡片容器 | 书架、成就、世界设定 |
| `Button` | 按钮（Primary/Secondary/Ghost） | 全局 |
| `Input` | 输入框 | 表单 |
| `Textarea` | 文本域 | 简介、设定 |
| `Select` | 下拉选择 | 类型、模型 |
| `Checkbox` | 复选框 | 上下文参考 |
| `RadioGroup` | 单选组 | 性别、目标读者 |
| `Tabs` | Tab 切换 | 工作台、个人中心 |
| `ProgressBar` | 进度条 | AI 生成、引导 |
| `Badge` | 徽章 | 类型标签、状态 |
| `Tooltip` | 提示 | 帮助图标 |
| `EmptyState` | 空状态 | 书架、引导 |
| `SearchBar` | 搜索栏 | 书架 |
| `Avatar` | 头像 | 角色、用户 |

### 6.2 现有组件改造计划

| 现有组件 | 改造内容 |
|---------|---------|
| `novel-editor/index.tsx` | 重构为工作台布局（左侧面板改为大纲/细纲/章节 Tab） |
| `chapter-editor.tsx` | 重构为专业编辑器（添加工具栏、右侧信息面板） |
| `character-panel.tsx` | 重构为角色追踪面板（添加分组、状态追踪、关系图） |
| `chapter-list.tsx` | 扩展为大纲树形组件（添加复选框、展开箭头、星标） |

---

## 七、测试策略

### 7.1 单元测试

| 测试文件 | 测试内容 |
|---------|---------|
| `fake-agent.test.ts` | 扩展：新增生成设置相关测试 |
| `mock-data.test.ts` | 扩展：验证新增 Mock 数据 |
| `project-create.test.ts` | [新增] 项目创建表单验证 |
| `ai-generation-settings.test.ts` | [新增] AI 生成参数验证 |
| `novel-guide.test.ts` | [新增] 引导流程测试 |
| `achievement.test.ts` | [新增] 成就解锁逻辑测试 |

### 7.2 E2E 测试

| 测试场景 | 验证内容 |
|---------|---------|
| 书架 → 创建项目 → 工作台 | 完整创作流程 |
| 编辑器 → AI 续写 | AI 任务执行 |
| 角色追踪 → 添加角色 | CRUD 操作 |
| 25 道题引导 → 完成 | 向导流程 |
| 个人中心 → 积分充值 | 积分系统 |

---

## 八、开发顺序建议

### 推荐的实现顺序（按依赖关系）

```
Week 1-2: Phase 1 - 核心创作流程
  Day 1-2:  提取可复用 UI 组件（Modal, Card, Button, Input 等）
  Day 3-4:  我的书架页面 + 创建项目弹窗
  Day 5-7:  工作台重构（左侧面板 → 大纲/细纲/章节 Tab）
  Day 8-10: 章节编辑器重构（工具栏 + 右侧信息面板）
  Day 11-14: AI 生成参数设置弹窗 + 集成测试

Week 3: Phase 2 - 内容管理与引导
  Day 1-3:  角色追踪面板重构（分组 + 状态追踪 + 关系图）
  Day 4-5:  世界设定页面
  Day 6-7:  25 道题引导页

Week 4: Phase 3 - 用户系统与激励
  Day 1-3:  个人中心页面
  Day 4-5:  成就系统页面
  Day 6-7:  集成测试 + Bug 修复
```

---

## 九、风险与注意事项

### 9.1 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| SolidJS 生态组件不足 | 部分复杂组件需自研 | 优先使用 @kobalte/core，复杂组件参考 React 实现 |
| 人物关系图渲染 | 性能问题 | 使用 Canvas 或 SVG，数据量大时启用虚拟化 |
| 大文本编辑器性能 | 长章节编辑卡顿 | 使用虚拟滚动，分块渲染 |
| Mock → 真实 API 迁移 | 后期重构成本 | 保持 Provider 接口稳定，数据层与 UI 解耦 |

### 9.2 设计一致性

- 所有新增页面必须遵循 ProseFlow AI 设计规范
- 颜色使用 design tokens，禁止硬编码
- 中文文本使用系统字体回退（PingFang SC / Microsoft YaHei）
- 移动端适配：所有页面需支持 < 768px 响应式

### 9.3 代码规范

- 每个组件文件不超过 500 行（code-file-limit.md）
- 类型定义优先使用 interface，复杂联合类型使用 type
- 组件 Props 必须显式定义类型
- 新增文件需补充单元测试

---

## 十、评审清单

### 10.1 待确认事项

- [ ] 我的书架是否作为默认入口（`/` 或 `/novel` 重定向）？
- [ ] 工作台和章节编辑器是同一页面还是分开路由？
- [ ] 25 道题引导是否需要在首次使用时强制展示？
- [ ] 积分系统是否在本次迭代中实现真实支付，还是仅 Mock？
- [ ] 成就系统的 98 个成就是否需要一次性定义，还是分批添加？
- [ ] 世界设定的"AI 生成设定"功能是否在本次迭代中实现？

### 10.2 设计确认

- [ ] ProseFlow AI 设计规范是否适用于所有 Stitch 页面？
- [ ] 移动端布局是否有专门的 PRD 或设计稿？
- [ ] 暗黑模式是否在本次迭代中支持？

---

*本文档由 AI 生成，等待评审确认*

**[READY_FOR_REVIEW]**

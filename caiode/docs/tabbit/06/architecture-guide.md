# 墨语 AI — SolidJS 组件底座架构指南 v1.0

> 日期: 2026-06-16 | 基准: stitch_ai_novel_writing_dashboard/ | 状态: READY_FOR_PHASE_X1
>
> 用途：指导 Trae 将全部 Stitch 原型重构为 opencode 四层架构的 SolidJS 组件

---

## 快速索引

| § | 内容 | 对应 Phase |
|---|---|---|
| §1 | 架构原则与技术栈 | 全局 |
| §2 | 设计系统 Design Tokens | 全局 |
| §3 | 导航状态机 | X1–X4 |
| §4 | 新增 TypeScript 类型（5 个文件）| X1–X4 |
| §5 | 新增 Mock 数据 | X1–X4 |
| §6 | 新增 Hooks（5 个）| X1–X4 |
| §7 | 原子组件库 `components/ui/` | X1 前置 |
| §8 | 各页面组件规范（7 个页面）| X1–X4 |
| §9 | Modal 完整规范 | X3 |
| §10 | 目标文件结构 | 全局 |
| §11 | 实施阶段 Phase X1–X4 | 执行参考 |
| §12 | 质量约束与验证命令 | 全局 |

---

## §1 架构原则

### 技术栈

```
SolidJS    fine-grained reactivity — createSignal / createMemo / createEffect
Tailwind   CSS v3 + 自定义 design token（必须在 tailwind.config 配置，不写裸色值）
图标       Material Symbols Outlined（Google Fonts CDN，span.material-symbols-outlined）
字体       Plus Jakarta Sans · Work Sans · Noto Serif SC
数据       Mock only — 不接真实 backend / AI / 支付
测试       bun test (unit) + Playwright (E2E)
```

### 四层架构（禁止跨层调用）

```
components/  渲染层   JSX 组件，仅调用 hooks，不直接使用 providers
hooks/       适配层   消费 providers/mock-data，暴露响应式状态
providers/   数据源层  CRUD 接口，不含 UI 逻辑
types/       类型层   纯 TypeScript interface，无运行时代码
mock-data/   种子数据  供 hooks 直接使用
```

### 硬性约束（违反则拒绝 PR）

```
① 单文件 < 500 行
② 0 href="#" / 0 alert() / 0 散落 console.log
③ 不修改 providers/ 任何已有文件
④ 不修改核心 hooks：use-novel-chapters / use-novel-outline /
   use-novel-project / use-ai-task / use-ai-log / use-workspace
⑤ types/ 只追加字段或联合成员，不改已有字段名
⑥ _legacy/ 目录永不删除
⑦ Mock only — 不接真实 backend / 真实 AI / 真实支付
```

---

## §2 设计系统 Design Tokens

> 来源：stitch/04_小说项目工作台/code.html Tailwind config（Ground Truth）

### 颜色系统

```javascript
// tailwind.config theme.extend.colors

// 主色调（紫色系）
"primary":                  "#6b38d4",   // 主按钮、激活态、强调文字
"primary-container":        "#8455ef",   // 渐变终点、深色强调
"primary-fixed":            "#e9ddff",   // 浅紫背景、SideNav 激活态
"surface-tint":             "#6d3bd7",   // 按钮 hover 背景
"on-primary":               "#ffffff",   // 主色按钮文字
"on-primary-container":     "#fffbff",

// 背景 & 表面（蓝灰白系）
"background":               "#f8f9ff",   // 全局页面背景
"surface":                  "#f8f9ff",
"surface-bright":           "#f8f9ff",
"surface-container-lowest": "#ffffff",   // 卡片、编辑区
"surface-container-low":    "#eff4ff",   // 次级容器背景
"surface-container":        "#e6eeff",   // 工具栏、容器
"surface-container-high":   "#dde9ff",   // hover 态背景
"surface-variant":          "#d5e3fd",   // 进度条轨道

// 文字 & 边框
"on-background":            "#0d1c2f",   // 主要文字
"on-surface":               "#0d1c2f",
"on-surface-variant":       "#494454",   // 次要文字、标签
"outline":                  "#7b7486",   // 边框描边
"outline-variant":          "#cbc3d7",   // 分割线

// 功能色
"error":                    "#ba1a1a",
"secondary":                "#9d4300",   // 橙色系强调
"secondary-container":      "#fd761a",
```

### 字体系统

```javascript
// theme.extend.fontFamily / fontSize
fontFamily: {
  "headline-lg": ["Plus Jakarta Sans"],  // 32px / 1.2 / 700
  "headline-md": ["Plus Jakarta Sans"],  // 24px / 1.3 / 600
  "headline-sm": ["Plus Jakarta Sans"],  // 20px / 1.4 / 600
  "body-lg":     ["Work Sans"],          // 18px / 1.8 / 400
  "body-md":     ["Work Sans"],          // 16px / 1.7 / 400
  "label-md":    ["Work Sans"],          // 14px / 1.5 / 500
  "label-sm":    ["Work Sans"],          // 12px / 1.5 / 500
}
// 小说正文额外字体：font-['Noto_Serif_SC',serif]
```

### 间距 / 圆角 / 阴影 / 微交互

```
间距: xs=4px  sm=8px  md=16px  lg=24px  xl=32px  gutter=20px  margin-desktop=40px
圆角: DEFAULT=4px  lg=8px  xl=12px  full=9999px

阴影词汇:
  卡片       shadow-[0_2px_12px_rgba(0,0,0,0.04)]
  弹窗       shadow-[0_8px_32px_rgba(0,0,0,0.12)]
  浮动面板   shadow-[0_8px_24px_rgba(0,0,0,0.08)]
  编辑器头   shadow-[0_2px_12px_rgba(0,0,0,0.02)]

微交互（所有可点击元素必须包含）:
  active:scale-95 transition-transform duration-150   按钮点击反馈
  transition-colors                                   颜色过渡
  transition-all duration-200                         复合过渡
  active:translate-x-1 duration-200                  侧边导航项激活
```

---

## §3 导航状态机

### 视图类型扩展（types/novel-view.ts，追加到联合末尾）

```typescript
  | 'achievements'   // 11 成就系统
  | 'novel-guide'    // 12 25道题引导
```

### Modal 类型扩展（types/novel-modal.ts，追加到联合末尾）

```typescript
  | 'guide-create'         // 新建引导项目弹窗
  | 'achievement-detail'   // 成就详情弹窗
```

### 完整页面流转

```
/novel → workspace（默认视图）
  workspace
    ├─ 点击章节 ───────────────► editor
    ├─ SideNav「人物」 ─────────► character-panel
    ├─ SideNav「设定」 ─────────► world-setting
    ├─ 头像按钮 ───────────────► profile
    ├─ 成就入口 ───────────────► achievements
    ├─ 引导入口 ───────────────► novel-guide
    ├─ 帮助按钮 ───────────────► tutorial
    └─ Logo 按钮 ──────────────► bookshelf

  bookshelf
    ├─ 项目卡片 ──────────────► workspace
    └─ 新建按钮 ──────────────► modal:guide-create → novel-guide

  所有子视图 ── 返回按钮 ─────► workspace

  Modals（叠加在当前视图上）:
    generation-settings（完整化）/ export / feedback / settings /
    notifications / chapter-history / batch-generation /
    guide-create（新增）/ achievement-detail（新增）
```

---

## §4 新增 TypeScript 类型

### types/editor.ts [NEW]

```typescript
export type ChapterStatus = 'draft' | 'completed' | 'published'

export interface AIExtractedInfo {
  chapterId: string
  summary: string              // 本章摘要
  newCharacters: string[]      // 新登场角色
  protagonistStatus: string    // 主角状态
  acquiredItems: string[]      // 获得物品
  keyEvents: string            // 关键事件
  extractedAt: string          // ISO date string
}

// 续写 | 改写 | 扩写 | 润色 | 摘要
export type AIWritingCommand = 'continue' | 'rewrite' | 'expand' | 'polish' | 'summarize'
```

### types/world.ts [NEW]

```typescript
export interface WorldOverview {
  background: string      // 世界背景
  powerSystem: string     // 力量体系
  socialStructure: string // 社会结构
  specialRules: string    // 特殊规则
}
export interface WorldLocation {
  id: string; name: string; tags: string[]; description: string
}
export interface WorldItem {
  id: string; name: string; type: string; tags: string[]; description: string
}
export interface WorldSkill {
  id: string; name: string; type: string; level?: string; description: string
}
export interface WorldFaction {
  id: string; name: string; type: string; description: string
  influence: 'high' | 'medium' | 'low'
}
export interface WorldSetting {
  projectId: string
  overview: WorldOverview
  locations: WorldLocation[]
  items: WorldItem[]
  skills: WorldSkill[]
  factions: WorldFaction[]
}
export type WorldTab = 'location' | 'item' | 'skill' | 'faction'
```

### types/achievement.ts [NEW]

```typescript
export type AchievementCategory = 'all' | 'creation' | 'social' | 'growth' | 'special'

export interface Achievement {
  id: string
  title: string
  description: string
  emoji: string
  category: Exclude<AchievementCategory, 'all'>
  isUnlocked: boolean
  unlockedAt?: string
  progress?: { current: number; target: number }
}
```

### types/novel-guide.ts [NEW]

```typescript
export type NovelGenre = '玄幻' | '都市' | '穿越' | '科幻' | '仙侠' | '悬疑' | '言情' | '其他'
export type NovelTargetLength = '10万字' | '30万字' | '50万字' | '100万字' | '200万字以上'

export interface GuideOption {
  value: string; label: string; emoji?: string; description?: string
}
export interface GuideQuestion {
  id: number           // 1–25
  question: string
  subtitle?: string
  type: 'single-choice' | 'multi-choice' | 'text-input'
  options?: GuideOption[]
}
export interface GuideProject {
  id: string; title: string
  genre: NovelGenre; targetLength: NovelTargetLength
  answers: Record<number, string | string[]>
  currentStep: number  // 0=未开始, 1-25=进行中, 26=完成
  createdAt: string; updatedAt: string
}
```

### types/profile.ts [NEW]

```typescript
export interface CreditRecord {
  id: string; delta: number; reason: string; date: string
}
export interface RechargePackage {
  id: string; credits: number; price: number
  isPopular?: boolean; bonus?: string
}
export type ProfileTab = 'credits' | 'recharge' | 'export' | 'import'
```

### 扩展现有类型（最小侵入）

```typescript
// types/character.ts — 追加（不改现有字段）
export type CharacterRole = 'protagonist' | 'supporting' | 'antagonist' | 'other'
// Character interface 中追加：
role?: CharacterRole
```

---

## §5 新增 Mock 数据

### mock-data/world-settings.ts [NEW]

提供 1 个项目的完整 WorldSetting：

- **overview**: 4 字段（世界背景/力量体系/社会结构/特殊规则）
- **locations**: 3 条（乌坦城·城镇 / 魔兽山脉·秘境 / 迦南学院·学院）
- **items**: 2 条（青莲地心火·fire / 玄重尺·weapon）
- **skills**: 2 条（焚诀·technique / 八极崩·combat 黄阶高级）
- **factions**: 3 条（萧家·family·medium / 加玛帝国·empire·high / 云岚宗·sect·high）

### mock-data/achievements.ts [NEW]

98 条成就，前 12 条 isUnlocked: true（含 unlockedAt 日期）：

```typescript
// 已解锁示例
{ id:'ach-001', title:'初出茅庐', emoji:'🎯', category:'creation', isUnlocked:true, unlockedAt:'2026-05-20' },
{ id:'ach-002', title:'笔耕不辍', emoji:'📝', category:'creation', isUnlocked:true, unlockedAt:'2026-05-22' },
// 进行中（含 progress）
{ id:'ach-005', title:'万字长篇', emoji:'📖', category:'growth', isUnlocked:false,
  progress:{ current:15680, target:100000 } },
{ id:'ach-006', title:'百章达成', emoji:'🏆', category:'growth', isUnlocked:false,
  progress:{ current:52, target:100 } },
```

### mock-data/guide-questions.ts [NEW]

25 道问题，每题结构：

```typescript
{ id:1, question:'你想写什么类型的小说？', type:'single-choice',
  options:[
    { value:'玄幻', label:'玄幻修仙', emoji:'🐉' },
    { value:'都市', label:'现代都市', emoji:'🏙️' },
    { value:'穿越', label:'穿越重生', emoji:'⏰' },
    { value:'科幻', label:'科幻未来', emoji:'🚀' },
    { value:'悬疑', label:'悬疑推理', emoji:'🔍' },
    { value:'言情', label:'言情甜宠', emoji:'💕' },
  ]
}
```

后续题目参考：主角性格 / 故事背景 / 节奏 / 核心矛盾 / 反派类型 / 感情线 / 结局偏好 ... 共 25 题。

### mock-data/profile.ts [NEW]

```typescript
export const mockUser = {
  name: '创作者小明', credits: 850, isVip: true,
  vipExpiresAt: '2026-12-31', registeredAt: '2026-03-15',
  stats: { wordCount: 156800, novelCount: 3, chapterCount: 52 }
}
export const mockCreditRecords: CreditRecord[] = [
  { id:'cr-001', delta:+100, reason:'注册奖励',       date:'2026-03-15' },
  { id:'cr-002', delta:-5,   reason:'生成大纲（5章）', date:'2026-05-20' },
  { id:'cr-003', delta:-20,  reason:'生成正文（2章）', date:'2026-05-21' },
  { id:'cr-004', delta:+10,  reason:'每日签到',        date:'2026-05-24' },
  { id:'cr-005', delta:+200, reason:'购买积分包',      date:'2026-06-01' },
]
export const mockRechargePackages: RechargePackage[] = [
  { id:'pkg-001', credits:100,  price:10 },
  { id:'pkg-002', credits:300,  price:25, isPopular:true, bonus:'获得30天VIP' },
  { id:'pkg-003', credits:500,  price:40 },
  { id:'pkg-004', credits:1000, price:70 },
]
```

### 扩展现有 Mock

```typescript
// mock-data/chapters.ts — 追加 export const mockAIExtractedInfo: AIExtractedInfo[]
// 提供 chapter-001 的 AI 提取数据

// mock-data/characters.ts — 为每个角色追加 role 字段
// 萧炎 → role:'protagonist' / 萧薰儿 → role:'supporting' / 云山 → role:'antagonist'
```

---

## §6 新增 Hooks

### hooks/use-chapter-editor.ts [NEW]

```typescript
export function useChapterEditor(chapterId: string) {
  const [content, setContent] = createSignal('')
  const [chapterStatus, setChapterStatus] = createSignal<ChapterStatus>('draft')
  const [isFullscreen, setIsFullscreen] = createSignal(false)
  const [isAiToolbarVisible, setAiToolbarVisible] = createSignal(false)
  const [aiToolbarPos, setAiToolbarPos] = createSignal({ top: 0, left: 0 })
  const targetWordCount = 3000

  // 字符数（去除空白）
  const wordCount = createMemo(() => content().replace(/\s/g, '').length)
  const aiExtract = mockAIExtractedInfo.find(e => e.chapterId === chapterId) ?? null

  function onTextSelect() {
    const sel = window.getSelection()
    if (!sel || !sel.toString().trim()) { setAiToolbarVisible(false); return }
    const rect = sel.getRangeAt(0).getBoundingClientRect()
    setAiToolbarPos({ top: rect.top - 48, left: rect.left + rect.width / 2 })
    setAiToolbarVisible(true)
  }
  function handleAICommand(_cmd: AIWritingCommand) { setAiToolbarVisible(false) } // Mock
  function saveDraft() { /* Mock: 无操作 */ }
  function markComplete() { setChapterStatus('completed') }

  return { content, setContent, wordCount, targetWordCount, chapterStatus,
           isFullscreen, setIsFullscreen, isAiToolbarVisible, aiToolbarPos,
           aiExtract, onTextSelect, handleAICommand, saveDraft, markComplete }
}
```

### hooks/use-world-setting.ts [NEW]

```typescript
export function useWorldSetting(_projectId: string) {
  const [activeTab, setActiveTab] = createSignal<WorldTab>('location')
  const data = mockWorldSetting  // 静态 mock
  return { activeTab, setActiveTab, overview: data.overview,
           locations: data.locations, items: data.items,
           skills: data.skills, factions: data.factions }
}
```

### hooks/use-achievements.ts [NEW]

```typescript
export function useAchievements() {
  const [activeCategory, setActiveCategory] = createSignal<AchievementCategory>('all')
  const stats = createMemo(() => ({
    total: 98, unlocked: 12, locked: 86, completionRate: 12
  }))
  const filtered = createMemo(() =>
    activeCategory() === 'all' ? mockAchievements
      : mockAchievements.filter(a => a.category === activeCategory())
  )
  return { activeCategory, setActiveCategory, stats, filtered }
}
```

### hooks/use-novel-guide.ts [NEW]

```typescript
export function useNovelGuide() {
  const [projects, setProjects] = createSignal<GuideProject[]>([])
  const [current, setCurrent] = createSignal<GuideProject | null>(null)
  const step = createMemo(() => current()?.currentStep ?? 0)
  const question = createMemo(() => guideQuestions.find(q => q.id === step()) ?? null)

  function createProject(title: string, genre: NovelGenre, targetLength: NovelTargetLength) {
    const p: GuideProject = {
      id: `guide-${Date.now()}`, title, genre, targetLength,
      answers: {}, currentStep: 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    }
    setProjects(prev => [...prev, p])
    setCurrent(p)
    return p
  }
  function answerQuestion(qId: number, answer: string | string[]) {
    setCurrent(prev => prev ? {
      ...prev, answers: { ...prev.answers, [qId]: answer },
      currentStep: Math.min(qId + 1, 26), updatedAt: new Date().toISOString()
    } : null)
  }
  function goToPrev() {
    setCurrent(prev => prev ? { ...prev, currentStep: Math.max(prev.currentStep - 1, 1) } : null)
  }
  return { projects, current, step, question, allQuestions: guideQuestions,
           createProject, answerQuestion, goToPrev }
}
```

### hooks/use-profile.ts [NEW]

```typescript
export function useProfile() {
  const [activeTab, setActiveTab] = createSignal<ProfileTab>('credits')
  return { activeTab, setActiveTab, user: mockUser,
           creditRecords: mockCreditRecords, rechargePackages: mockRechargePackages }
}
```

---

## §7 原子组件库 `components/ui/`

> X1 阶段最先完成，所有业务页面统一使用这些原子组件。

### novel-button.tsx

```
Props: variant('filled'|'tonal'|'outlined'|'text'|'icon')
       size('sm'|'md'|'lg')  loading?  disabled?
       icon?(material-symbol 名)  iconPosition?('left'|'right')
       onClick?  class?  children

Tailwind 映射:
  filled:   bg-primary text-on-primary hover:bg-surface-tint
  tonal:    bg-primary-fixed text-primary hover:bg-[#e9ddff]
  outlined: border border-outline text-primary hover:bg-primary-fixed
  text:     text-primary hover:bg-primary-fixed/50
  icon:     text-on-surface-variant hover:text-primary hover:bg-surface-container
            rounded-full p-sm

尺寸: sm=px-md py-1 label-sm / md=px-md py-sm label-md / lg=px-lg py-2.5 label-md
通用: rounded-lg transition-all duration-150 active:scale-95
      disabled: opacity-50 pointer-events-none
```

### novel-tab-bar.tsx

```
Props: tabs<{value,label,count?}[]>  active  onChange  variant('underline'|'pill')

underline: 容器 flex border-b border-outline-variant
  激活: border-b-2 border-primary text-primary font-bold font-label-md
  非激活: text-on-surface-variant hover:text-primary hover:bg-surface-container-low
  共用: px-lg py-sm cursor-pointer transition-colors

pill: flex flex-wrap gap-sm
  激活: bg-primary text-on-primary rounded-full px-md py-xs font-label-md
  非激活: bg-surface-container-low text-on-surface-variant rounded-full px-md py-xs
          hover:bg-surface-container
```

### novel-avatar.tsx

```
Props: src?  name  size('sm'|'md'|'lg'|'xl')  class?

尺寸: sm=w-8 h-8 text-label-sm / md=w-10 h-10 text-label-md /
      lg=w-14 h-14 text-headline-sm / xl=w-20 h-20 text-headline-md

有 src: <img src={src} alt={name} class="w-{n} h-{n} rounded-full object-cover
              border border-outline-variant" />
无 src: <div class="w-{n} h-{n} rounded-full bg-primary-fixed text-primary
               flex items-center justify-center font-bold">{name[0].toUpperCase()}</div>
```

### novel-progress.tsx

```
Props: value  max  showLabel?  class?

外轨: w-full bg-surface-variant rounded-full h-1.5 overflow-hidden
进度: bg-gradient-to-r from-primary to-surface-tint h-full rounded-full
      transition-all duration-500 ease-out  style={width: (value/max*100)%}
标签: text-label-sm text-on-surface-variant 显示 "value/max"（可选）
```

### novel-stat-card.tsx

```
Props: value(string|number)  label  unit?  class?

容器: bg-surface-container-lowest rounded-xl border border-outline-variant p-md text-center
大数字: text-[32px] font-bold text-primary leading-none (+ unit 若有)
标签: text-label-md text-on-surface-variant mt-xs
```

### novel-empty-state.tsx

```
Props: icon?='description'  title  description?  action?{label,onClick}

flex flex-col items-center justify-center gap-md py-xl text-center
图标: material-symbols-outlined text-[64px] text-outline
标题: font-headline-sm text-on-surface-variant
描述: text-label-md text-outline max-w-xs
按钮（可选）: <novel-button variant="tonal">
```

### novel-stepper.tsx

```
Props: value  min?=0  max?  step?=1  onChange  label?

flex items-center gap-sm
[-按钮] [input readonly text-center font-body-md border rounded-md h-8 flex-1] [+按钮]
按钮: w-8 h-8 rounded border border-outline-variant hover:bg-surface-container
图标: remove / add
```

### novel-tag.tsx / novel-badge.tsx

```
novel-tag（通用标签）:
  bg-surface-container text-on-surface-variant rounded-full
  px-sm py-0.5 text-label-sm whitespace-nowrap

novel-badge（状态徽章）:
  draft:     bg-surface-container text-on-surface-variant border border-outline-variant
  completed: bg-primary-fixed text-primary border border-primary-fixed
  published: bg-green-50 text-green-700 border border-green-200
  vip:       bg-amber-100 text-amber-700 font-bold
每种: rounded-full px-sm py-0.5 text-label-sm
```

---

## §8 各页面组件规范

---

### 8.1 章节编辑器 `novel-editor/`【Phase X1 核心，重建】

参考：`stitch/05_章节编辑器页面/code.html` | 当前完成度约 8%，目标 >90%

#### 整体布局（index.tsx）

```
flex flex-col h-screen bg-surface-bright overflow-hidden

EditorToolbar           h-16 shrink-0   顶部工具栏
div.flex.flex-1.overflow-hidden
  EditorCanvas          flex-1 min-w-0  文本编辑区
  EditorRightPanel      w-[300px] shrink-0  右侧信息面板
```

#### EditorToolbar

```
bg-surface-container-lowest border-b border-outline-variant h-16 px-lg
flex items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.02)]

左区 (flex items-center gap-md):
  [← 返回 text+arrow_back 图标]  |  [章节标题 label-md truncate max-w-[200px]]

中区 (flex items-center gap-xs):
  [字数 font-bold text-primary text-label-md] [/ 目标字数 text-on-surface-variant label-sm]

右区 (flex items-center gap-sm):
  [history icon] [fullscreen icon] [发布章节 filled] [settings icon] [novel-avatar md]
```

#### EditorCanvas

```
bg-surface-container-lowest overflow-y-auto p-margin-desktop

内容容器: max-w-3xl mx-auto

textarea:
  w-full min-h-screen bg-transparent resize-none outline-none
  font-['Noto_Serif_SC',serif] text-body-lg text-on-surface leading-loose
  placeholder="开始你的创作..."
  onMouseUp={onTextSelect} onKeyUp={onTextSelect}

浮动 AI 工具栏（Show when isAiToolbarVisible(), fixed 定位）:
  position: fixed; top: aiToolbarPos().top; left: aiToolbarPos().left
  transform: translate(-50%, -100%)
  bg-surface-container-lowest border border-outline-variant
  rounded-xl shadow-dock px-md py-sm flex items-center gap-xs
  5 按钮（竖线 h-4 w-px bg-outline-variant 分隔）:
    续写 | 改写 | 扩写 | 润色 | 摘要
    每个: text-label-sm text-primary hover:bg-primary-fixed rounded-md px-sm py-xs
```

#### EditorRightPanel

```
border-l border-outline-variant bg-surface-container-lowest flex flex-col h-full

Header: px-lg py-md border-b flex items-center gap-sm
  <info icon text-primary> + "章节信息" label-md font-bold

Body (flex-1 overflow-y-auto):
  EditorChapterMeta  章节信息区
  <hr class="border-outline-variant mx-md" />
  EditorAIExtract    AI 提取区

Footer: p-md border-t border-outline-variant flex gap-sm
  [保存草稿 outlined flex-1] [标记完成 filled flex-1]
```

#### EditorChapterMeta

```
px-lg py-md space-y-sm

字段列表（label + value 对, label=label-sm text-on-surface-variant, value=label-md）:
  章节编号   #03
  状态       <novel-badge status={chapterStatus()} />（可点击切换）
  字数       {wordCount()} 字
  创建时间   2026-06-15
  最后修改   2小时前
```

#### EditorAIExtract

```
Header: px-lg py-md flex justify-between
  左: <auto_awesome icon text-primary> + "AI 提取" label-md font-bold
  右: [refresh icon btn]

有数据（aiExtract 不为 null）:
  px-lg py-md space-y-md
  每个信息块:
    标题 label-sm font-bold text-primary mb-xs
    文字内容 → label-md text-on-surface-variant
    标签内容 → flex flex-wrap gap-xs 使用 <novel-tag>
  顺序: 本章摘要 / 新登场角色 / 主角状态 / 获得物品 / 关键事件

空数据:
  <novel-empty-state icon="auto_awesome" title="暂无AI提取信息"
    description="点击刷新提取本章关键信息" />
```

---

### 8.2 角色追踪面板 `character-panel/`【Phase X2，新建替换 PlaceholderPage】

参考：`stitch/06_角色追踪面板/code.html`

```
index.tsx
  CharacterPageHeader    顶部栏：返回 + "角色追踪" + [AI生成角色 filled+add]
  div.flex-1.overflow-y-auto.px-margin-desktop.py-xl.space-y-xl
    Section header "主角" + CharacterProtagonist（大卡）
    Section header "配角" + CharacterSupporting（卡片列表）
    Section header "反派" + CharacterAntagonist（卡片列表）
```

#### CharacterProtagonist 主角大卡

```
bg-surface-container-lowest rounded-xl border border-outline-variant p-xl flex gap-xl

左(w-24 shrink-0):
  novel-avatar xl + 姓名 headline-sm mt-sm + <novel-tag> 角色标签

右(flex-1 flex-col):
  简介段落 body-md text-on-surface-variant mb-md
  追踪网格 grid grid-cols-3 gap-md:
    每格: 数字 text-[24px] font-bold text-primary + 标签 label-sm text-on-surface-variant
    内容: 出场章节 / 对话字数 / 能力等级
```

#### CharacterCard（配角/反派通用）

```
bg-surface-container-lowest rounded-xl border border-outline-variant p-md
flex gap-md hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-shadow

左: novel-avatar lg
右 flex-1: 姓名 label-md font-bold text-on-surface
           flex flex-wrap gap-xs （novel-tag[]）
           简介 label-md text-on-surface-variant line-clamp-2
           关系/出场 label-sm text-outline
```

---

### 8.3 世界设定 `world-setting/`【Phase X2，新建替换 PlaceholderPage】

参考：`stitch/07_世界设定页面/code.html`

```
index.tsx
  WorldPageHeader    顶部栏：返回 + "世界设定" + [AI生成设定 filled]
  div.flex-1.overflow-y-auto.px-margin-desktop.py-xl.space-y-xl
    "世界概览" 标题 + WorldOverviewBento
    WorldTabNav（地点|物品|技能|势力）
    <Switch fallback={<WorldLocationList>}>
      <Match when={tab==='item'}>    <WorldItemList />
      <Match when={tab==='skill'}>   <WorldSkillList />
      <Match when={tab==='faction'}> <WorldFactionList />
    </Switch>
```

#### WorldOverviewBento

```
grid grid-cols-2 gap-md

每个 Bento 卡 (bg-surface-container-lowest rounded-xl border p-lg):
  Header: flex items-center gap-sm mb-sm
    icon material-symbol + 标题 label-md font-bold text-on-surface
  Body: text-label-md text-on-surface-variant leading-relaxed

图标对应:
  世界背景 → public   力量体系 → bolt
  社会结构 → account_balance   特殊规则 → auto_awesome
```

#### WorldEntryCard（地点/物品/技能/势力通用条目卡）

```
relative group bg-surface-container-lowest rounded-xl border border-outline-variant p-md

名称 label-md font-bold text-on-surface
flex flex-wrap gap-xs mt-xs（novel-tag[]）
描述 label-md text-on-surface-variant mt-sm line-clamp-2

group-hover 显示操作层（absolute top-sm right-sm）:
  flex gap-xs bg-surface-container-lowest rounded-lg p-xs shadow-card
  [edit icon btn] [delete icon btn]
```

---

### 8.4 个人中心 `profile/`【Phase X3，新建替换 PlaceholderPage】

参考：`stitch/09_个人中心页面/code.html`

```
index.tsx
  ProfilePageHeader      标题 + settings 图标
  div.flex-1.overflow-y-auto.px-margin-desktop.py-xl.space-y-xl
    ProfileUserCard       用户信息大卡
    ProfileStatsRow       统计三卡
    ProfileTabNav         积分|充值|导出|导入
    <Switch>
      credits  → ProfileCreditsTab
      recharge → ProfileRechargeTab
      export   → PlaceholderPage（暂用）
      import   → PlaceholderPage（暂用）
    </Switch>
```

#### ProfileUserCard

```
bg-surface-container-lowest rounded-xl border p-xl flex items-center gap-lg

左: novel-avatar xl（name首字母）
右 flex-col gap-xs:
  用户名 headline-sm
  flex items-center gap-sm:
    <novel-badge variant="vip"> VIP会员 </novel-badge>
    text-label-sm text-on-surface-variant "到期: {vipExpiresAt}"
  注册时间 label-sm text-outline "注册于 {registeredAt}"
```

#### ProfileStatsRow

```
grid grid-cols-3 gap-md

三个 novel-stat-card:
  value=156800  unit="字"  label="创作字数"
  value=3       unit="本"  label="小说数量"
  value=52      unit="章"  label="章节数量"
```

#### ProfileCreditsTab

```
积分大卡 (bg-gradient-to-br from-primary-fixed to-[#e0d4ff] rounded-xl p-xl text-center):
  大数字 text-[48px] font-bold text-primary "850"
  副标题 "当前积分" label-md text-on-surface-variant
  <novel-button variant="tonal">获取更多积分</novel-button>

积分变动列表 (space-y-0 divide-y divide-outline-variant mt-lg):
  每条 (flex items-center justify-between py-md):
    左: 增减图标(text-green-600/text-error) + flex-col(事由 label-md + 日期 label-sm)
    右: delta>=0 "text-green-600 font-bold +N" / delta<0 "text-error font-bold N"
```

#### ProfileRechargeTab

```
grid grid-cols-2 gap-md

套餐卡（isPopular → 加 border-2 border-primary，有"推荐"角标）:
  bg-surface-container-lowest rounded-xl border p-lg text-center cursor-pointer
  hover:border-primary transition-all

  积分数 text-[32px] font-bold text-primary + "积分" label-sm
  价格   headline-sm text-on-surface "¥{price}"
  bonus  label-sm text-primary mt-xs（若有）

底部:
  <novel-button variant="outlined" icon="account_balance_wallet" class="w-full mt-lg">
    支付宝支付
  </novel-button>
  <p class="text-label-sm text-outline text-center mt-sm">充值任意金额即获30天VIP</p>
```

---

### 8.5 成就系统 `achievements/`【Phase X4，新建】

参考：`stitch/11_成就系统页面/code.html`

```
index.tsx
  AchievementPageHeader   标题 + 全局进度条（12/98 已解锁，completionRate%）
  AchievementStatsRow     4 个 novel-stat-card（总/已解锁/未解锁/完成率）
  AchievementCategoryTabs tab-bar pill variant（全部|创作|社交|成长|特殊）
  AchievementGrid         成就卡片网格
```

#### AchievementGrid

```
grid grid-cols-3 gap-md px-margin-desktop pb-xl

已解锁卡片:
  bg-gradient-to-br from-primary-fixed/30 to-transparent border border-primary-fixed
  rounded-xl p-md text-center space-y-xs
  emoji text-4xl + 标题 label-md font-bold + 描述 label-sm line-clamp-2
  "🗓 {unlockedAt}" label-sm text-primary
  novel-progress（若有进度数据）

未解锁卡片:
  bg-surface-container-low border border-outline-variant opacity-60
  rounded-xl p-md text-center space-y-xs
  "🔒" text-4xl text-outline + 标题 label-md text-on-surface-variant
  描述 label-sm text-outline line-clamp-2
  novel-progress（若有进度数据）
```

---

### 8.6 25 道题引导 `novel-guide/`【Phase X4，新建】

参考：`stitch/12_25道题引导页/code.html`

```
index.tsx
  <Show when={!current()}> <GuideEntry />     空状态 + 新建按钮
  <Show when={current()}>  <GuideQAStep />    逐题作答
```

#### GuideQAStep 布局

```
flex flex-col h-screen bg-background

固定关闭按钮: fixed top-md right-md icon btn

主体 (flex-1 overflow-y-auto):
  max-w-2xl mx-auto px-md pt-xl pb-[100px]

  进度行: "创建你的专属小说" label-md font-bold + novel-progress(step/25) + "Q{step}/25"

  问题区 mt-xl:
    Q 徽章: w-8 h-8 rounded-full bg-primary text-on-primary font-bold "Q{step}"
    问题文字: headline-md mt-md
    副标题: label-md text-on-surface-variant mt-sm

  选项网格: mt-xl grid grid-cols-2 md:grid-cols-3 gap-md
    <For each={question()?.options}>{opt =>
      <GuideQAOptionCard option={opt}
        isSelected={current()?.answers[step()] === opt.value}
        onClick={() => answerQuestion(step(), opt.value)} />
    }</For>

底部导航 (sticky bottom-0 bg-surface border-t):
  max-w-2xl mx-auto px-md py-md flex items-center justify-between
  [← 上一步 outlined disabled={step()===1}] [跳过引导 text] [下一步 → filled]
```

#### GuideQAOptionCard

```
Props: option  isSelected  onClick

border-2 rounded-xl p-lg flex flex-col items-center gap-sm
cursor-pointer select-none text-center
transition-all duration-150 active:scale-95

未选: border-outline-variant bg-surface-container-lowest
      hover:border-primary hover:bg-primary-fixed/30
已选: border-primary bg-primary-fixed text-primary

内容: emoji text-3xl（若有）+ label label-md font-medium + description label-sm（若有）
```

---

### 8.7 书架追加组件【Phase X3，追加到 bookshelf/】

#### bookshelf-search-toolbar.tsx

```
bg-surface-container-lowest border-b border-outline-variant
px-margin-desktop py-md flex items-center gap-md

搜索框 (flex-1 max-w-md relative):
  input.w-full.pl-10.pr-md.py-sm.bg-surface-container-low
        .border.border-outline-variant.rounded-lg.text-label-md
        .focus:ring-1.focus:ring-primary.focus:border-primary
  <search icon absolute left-sm top-1/2 -translate-y-1/2 text-outline>

右侧工具 (flex items-center gap-sm):
  [新建小说 filled+add] [导入 outlined+upload]
  [视图切换 icon] [排序 icon]
```

#### bookshelf-float-button.tsx

```
fixed bottom-xl right-xl z-30
w-14 h-14 rounded-full bg-primary text-on-primary
shadow-[0_8px_32px_rgba(0,0,0,0.12)]
hover:bg-surface-tint active:scale-95 transition-all
aria-label="AI 创作助手"
<magic_button material icon 24px>

hover 悬浮提示 (absolute right-full mr-sm):
  bg-[#0d1c2f] text-white rounded-lg px-sm py-xs text-label-sm
  "AI 创作助手"
```

---

## §9 Modal 完整规范

### generation-settings（Phase X3 完整化）

参考：`stitch/10_AI生成参数设置弹窗/code.html`

```
标题: "生成设置"  副标题: "自定义AI生成参数"  宽度: max-w-lg

Section 1 — 基础设置:
  生成数量:  novel-stepper v=10 min=5 max=20
  目标字数:  novel-stepper v=3000 min=1000 max=10000 step=500
  字数容差:  <select> ±300字 / ±500字 / 精准匹配
  AI 模型:   <select> 豆包 / 文心一言 / 通义千问

Section 2 — 上下文参考:
  参考章节数: <select> 1~10 章
  2列 checkbox 网格（6项）:
    ☑ 大纲和细纲（disabled 禁止取消）   ☑ 已有正文摘要
    ☑ 主角状态追踪                       ☑ 角色关系
    ☑ 技能和道具状态                     ☐ 重要事件

Section 3 — 包含设定（可折叠）:
  ☑ 角色设定  ☑ 技能/法宝  ☑ 物品/道具  ☑ 地点场景  ☑ 已有剧情线

Footer（flex justify-between）:
  [恢复默认 text variant] 右侧: [取消 outlined] [开始生成 filled]
```

### guide-create（Phase X4 新增）

```
标题: "新建引导项目"  宽度: max-w-sm

字段:
  书名 *     input required placeholder="给你的小说起个名字"
  类型 *     select required: 玄幻/都市/穿越/科幻/仙侠/悬疑/言情/其他
  目标字数   select: 10万字/30万字/50万字/100万字/200万字以上

Footer:
  [取消 outlined]
  [开始创建 filled, disabled unless 书名+类型 非空]
    onClick → createProject() → openView('novel-guide') → closeModal()
```

---

## §10 目标文件结构

```
packages/app/src/novel/
├── types/
│   ├── novel-view.ts         [EXTEND +achievements +novel-guide]
│   ├── novel-modal.ts        [EXTEND +guide-create +achievement-detail]
│   ├── character.ts          [EXTEND +role?: CharacterRole]
│   ├── editor.ts             [NEW]
│   ├── world.ts              [NEW]
│   ├── achievement.ts        [NEW]
│   ├── novel-guide.ts        [NEW]
│   └── profile.ts            [NEW]
│
├── mock-data/
│   ├── chapters.ts           [EXTEND +mockAIExtractedInfo]
│   ├── characters.ts         [EXTEND +role]
│   ├── world-settings.ts     [NEW]
│   ├── achievements.ts       [NEW]
│   ├── guide-questions.ts    [NEW]
│   └── profile.ts            [NEW]
│
├── hooks/
│   ├── use-chapter-editor.ts [NEW]
│   ├── use-world-setting.ts  [NEW]
│   ├── use-achievements.ts   [NEW]
│   ├── use-novel-guide.ts    [NEW]
│   └── use-profile.ts        [NEW]
│
├── components/
│   ├── ui/                   [NEW — Phase X1 最先实现]
│   │   ├── novel-button.tsx
│   │   ├── novel-tab-bar.tsx
│   │   ├── novel-avatar.tsx
│   │   ├── novel-progress.tsx
│   │   ├── novel-stat-card.tsx
│   │   ├── novel-empty-state.tsx
│   │   ├── novel-stepper.tsx
│   │   ├── novel-tag.tsx
│   │   ├── novel-badge.tsx
│   │   └── index.ts
│   │
│   ├── layout/
│   │   ├── novel-app-shell.tsx   [MODIFY +achievements +novel-guide 路由]
│   │   └── novel-modal-host.tsx  [MODIFY generation-settings 完整化 + guide-create]
│   │
│   ├── bookshelf/
│   │   ├── index.tsx             [MODIFY 集成 search toolbar + float btn]
│   │   ├── bookshelf-search-toolbar.tsx  [NEW]
│   │   └── bookshelf-float-button.tsx    [NEW]
│   │
│   ├── novel-editor/             [REBUILD 当前~32KB→目标>200KB E2E截图]
│   │   ├── index.tsx
│   │   ├── editor-toolbar.tsx
│   │   ├── editor-canvas.tsx
│   │   ├── editor-ai-floating-toolbar.tsx
│   │   ├── editor-right-panel.tsx
│   │   ├── editor-chapter-meta.tsx
│   │   └── editor-ai-extract.tsx
│   │
│   ├── character-panel/          [NEW 替换 PlaceholderPage]
│   │   ├── index.tsx
│   │   ├── character-page-header.tsx
│   │   ├── character-protagonist.tsx
│   │   ├── character-supporting.tsx
│   │   ├── character-antagonist.tsx
│   │   └── character-card.tsx
│   │
│   ├── world-setting/            [NEW 替换 PlaceholderPage]
│   │   ├── index.tsx
│   │   ├── world-page-header.tsx
│   │   ├── world-overview-bento.tsx
│   │   ├── world-tab-nav.tsx
│   │   ├── world-entry-card.tsx
│   │   ├── world-location-list.tsx
│   │   ├── world-item-list.tsx
│   │   ├── world-skill-list.tsx
│   │   └── world-faction-list.tsx
│   │
│   ├── profile/                  [NEW 替换 PlaceholderPage]
│   │   ├── index.tsx
│   │   ├── profile-page-header.tsx
│   │   ├── profile-user-card.tsx
│   │   ├── profile-stats-row.tsx
│   │   ├── profile-tab-nav.tsx
│   │   ├── profile-credits-tab.tsx
│   │   ├── profile-recharge-tab.tsx
│   │   ├── profile-export-tab.tsx   (PlaceholderPage 暂用)
│   │   └── profile-import-tab.tsx   (PlaceholderPage 暂用)
│   │
│   ├── achievements/             [NEW]
│   │   ├── index.tsx
│   │   ├── achievement-page-header.tsx
│   │   ├── achievement-stats-row.tsx
│   │   ├── achievement-category-tabs.tsx
│   │   └── achievement-grid.tsx
│   │
│   └── novel-guide/              [NEW]
│       ├── index.tsx
│       ├── guide-entry.tsx
│       ├── guide-create-form.tsx
│       ├── guide-qa-step.tsx
│       ├── guide-qa-option-card.tsx
│       └── guide-progress-bar.tsx
│
├── providers/   永不修改已有文件
└── _legacy/     永不删除
```

---

## §11 实施阶段

### Phase X1 — 编辑器重建 + 原子组件库 【P0 立即执行】

**背景**：章节编辑器完成度约 8%（E2E截图32KB vs Stitch 415KB），是核心创作流程

**产出**（约 16 个文件）：
- `components/ui/` 全部 9 个原子组件（前置，其他 Phase 复用）
- `types/editor.ts`
- `hooks/use-chapter-editor.ts`
- `mock-data/chapters.ts`（+AIExtract 数据）
- `components/novel-editor/` 全部 6 个组件
- `components/layout/novel-app-shell.tsx`（最小修改：加编辑器路由）

**验收标准**：
- E2E editor 截图可见三区布局（toolbar + canvas + right panel）
- E2E 截图文件大小 > 200KB（vs 当前 32KB）

---

### Phase X2 — 内容管理：角色 + 世界设定 【P1】

**背景**：两个页面完成度约 8%，Stitch 设计完整，实现价值高

**产出**（约 18 个文件）：
- `types/world.ts` + `types/character.ts`(+role)
- `mock-data/world-settings.ts` + `mock-data/characters.ts`(+role)
- `hooks/use-world-setting.ts`
- `components/character-panel/` 全部 6 个组件
- `components/world-setting/` 全部 9 个组件

**验收标准**：
- 角色面板：可见主角大卡 + 配角 + 反派列表（vs 当前灰色占位）
- 世界设定：可见 Bento 概览 + Tab 切换内容

---

### Phase X3 — 用户系统 + 书架完善 + Modal 完整化 【P1】

**产出**（约 16 个文件）：
- `types/profile.ts` + `mock-data/profile.ts` + `hooks/use-profile.ts`
- `components/profile/` 全部 8 个组件
- `components/bookshelf/` 追加 2 组件 + 修改 index.tsx
- `components/layout/novel-modal-host.tsx`（generation-settings 完整 + guide-create）

---

### Phase X4 — 激励系统 + 引导流程 【P2】

**产出**（约 18 个文件）：
- 所有 achievement + novel-guide 的类型/mock/hook/组件
- `types/novel-view.ts` + `types/novel-modal.ts`（追加联合成员）

---

### 各 Phase 预期提升

| Phase | 新增组件文件 | 预期整体视觉完成度 |
|---|---|---|
| X1（完成后）| ~16 | ~50% |
| X2（完成后）| ~18 | ~65% |
| X3（完成后）| ~16 | ~78% |
| X4（完成后）| ~18 | ~88% |

---

## §12 质量约束与验证

### 每个 Phase 完成后必须运行

```bash
cd packages/app && bun typecheck
cd packages/app && bun test src/novel
cd packages/app && bunx playwright test e2e/novel --reporter=list
```

### 验收指标

| 指标 | 目标值 |
|---|---|
| bun typecheck | 0 错误 |
| bun test src/novel | ≥ 91 pass / 0 fail（不允许现有测试回归）|
| E2E | ≥ 11 passed / 0 failed / 0 skipped |
| 编辑器 E2E 截图 | > 200KB（Phase X1）|
| 角色/世界设定截图 | > 100KB（Phase X2）|
| 个人中心截图 | > 80KB（Phase X3）|

### Phase 完成报告标准格式

```
Phase X{N} 完成报告

产出文件:
  - ...（列出全部新增/修改文件）

验收项:
  ✅/❌ bun typecheck: 0 错误
  ✅/❌ bun test src/novel: XX pass / 0 fail
  ✅/❌ E2E: XX passed / 0 failed
  ✅/❌ 目标页面布局自评（主要区块是否完整）

遗留:
  - ...

[READY_FOR_PHASE_X{N}_REVIEW]
```

---

**[ARCHITECTURE_GUIDE_v1.0_COMPLETE]**

> 执行人：主控架构师  
> 日期：2026-06-16  
> 下一步：主控批准 → Trae 执行 Phase X1（编辑器 + 原子组件库）


# NovelForge UI→工作流→Agent 架构映射可行性评估

**基于 `packages/app/src/novel` 实际代码的 59 个交互点完整映射**

| 项目 | 内容 |
|---|---|
| 文档类型 | 可行性评估 / 架构设计 |
| 创建日期 | 2026-06-18 |
| 代码基线 | opencode-1.4.0/packages/app/src/novel（130+ 文件） |
| 目标读者 | 主控 / 技术决策者 |

---

## 执行摘要

本文档对 **NovelForge UI 原型中的每一个用户可操作元素** 进行了完整的"按钮→工作流→Agent/Skill/Command/Hook"四层架构映射。共识别 **59 个独立交互点**，分布在 **10 个页面区域**，按"是否需要 AI 能力"分为 **A 类（AI 驱动，28 个）** 和 **B 类（纯数据操作，31 个）** 两档。

**核心结论**：当前代码已具备完整的 UI 交互骨架和 Provider/Hook 分层。从"Mock 数据驱动"升级到"真实 AI 工作流"的关键路径是：

```
FakeAgentProvider (模板返回)
       ↓ 替换为
RealAgentRouter (多模型路由 + 流式 + Hook 拦截)
       ↓ 接入
Subagent Registry (@character-checker / @world-checker)
       ↓ 注入
Skill Context (古风/科幻/悬疑 动态适配)
       ↓ 受控于
Command Interpreter (/continue /outline /review ...)
       ↓ 守护于
Hook Pipeline (敏感词 → 一致性 → 风格 → 输出)
```

---

## 第一章：交互点全量清单

### 1.1 页面区域划分

```
┌─────────────────────────────────────────────────────────────┐
│  全局导航层                                                  │
│  ├── [SideNav] 左侧全局导航 (7 项)                            │
│  ├── [TopAppBar] 顶部应用栏                                  │
│  └── [FloatingWidgets] 右下角浮动组件                         │
├─────────────────────────────────────────────────────────────┤
│  Page 1: 书架 Bookshelf                                       │
│  ├── SearchBar (搜索)                                        │
│  ├── Toolbar (工具栏按钮组)                                   │
│  └── ProjectCard × N (项目卡片: 编辑/删除)                    │
├─────────────────────────────────────────────────────────────┤
│  Page 2: 创建项目 CreateProjectModal                           │
│  ├── 基础信息表单 (书名/类型/简介)                             │
│  ├── 完整设定 (主角/读者/风格/主题/自定义)                      │
│  └── 提交按钮                                                 │
├─────────────────────────────────────────────────────────────┤
│  Page 3: 引导创作 GuideQA                                     │
│  ├── 25 道 Q&A 步骤                                          │
│  └── 上一步/跳过/下一步                                      │
├─────────────────────────────────────────────────────────────┤
│  Page 4: 工作区 Workspace                                    │
│  ├── WorkspaceSideNav (大纲/章节/人物/设定/导出)              │
│  ├── AI生成大纲 / 生成细纲 按钮                               │
│  ├── WorkspaceOutlineList (章节列表: 展开/完成/星标)         │
│  ├── GenerationForm (目标字数/容差/参考章数/模型选择)          │
│  ├── ContextOptions (6 项上下文参考勾选)                      │
│  ├── Actions (开始生成/批量生成)                              │
│  └── AiProgressDock (暂停生成)                                │
├─────────────────────────────────────────────────────────────┤
│  Page 5: 编辑器 Editor                                        │
│  ├── EditorToolbar (返回/字数/AI续写/发布/保存/历史/全屏)     │
│  ├── EditorCanvas (标题输入/正文 contenteditable)             │
│  ├── AIFloatingToolbar (选中文本后: 续写/改写/扩写/润色/摘要) │
│  ├── ChapterInfoPanel (AI提取: 摘要/角色/状态/道具/事件预测) │
│  ├── ChapterList (章节目录切换)                              │
│  ├── CharacterPanel (角色详情: 标签/风格/目标/秘密/关系)      │
│  └── RightPanel (保存草稿/标记完成)                          │
├─────────────────────────────────────────────────────────────┤
│  Page 6: AI 任务面板 AITaskPanel                               │
│  ├── 任务队列列表 (展开/折叠)                                 │
│  └── 取消/重试                                               │
├─────────────────────────────────────────────────────────────┤
│  Page 7: AI 结果卡 AIResultCard                                │
│  └── 采纳/存为灵感/忽略                                      │
├─────────────────────────────────────────────────────────────┤
│  Page 8: 世界观设定 WorldSetting                               │
│  └── Tab 切换 (地点/物品/技能/势力)                          │
├─────────────────────────────────────────────────────────────┤
│  Page 9: 成就 Achievements                                    │
│  └── 分类 Tab + 成就网格                                     │
├─────────────────────────────────────────────────────────────┤
│  Page 10: 个人中心 Profile                                     │
│  └── 积分/充值 Tab                                           │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 59 个交互点分类总表

#### A 类：AI 驱动交互（28 个）— 需要 Agent/Skill/Command

| # | 交互点 | 所在组件 | 当前状态 | 目标工作流 |
|---|--------|---------|---------|-----------|
| **A01** | **AI 续写** | EditorToolbar "AI续写" 按钮 | FakeAgent 模板返回 | `/continue` Command → WritingAgent |
| **A02** | **AI 改写** | AIFloatingToolbar "改写" | handleAICommand 空实现 | `/rewrite` Command → WritingAgent(rewrite) |
| **A03** | **AI 扩写** | AIFloatingToolbar "扩写" | handleAICommand 空实现 | `/expand` Command → WritingAgent(expand) |
| **A04** | **AI 润色** | AIFloatingToolbar "润色" | handleAICommand 空实现 | `/polish` Command → WritingAgent(polish) |
| **A05** | **AI 摘要** | AIFloatingToolbar "摘要" | handleAICommand 空实现 | `/summarize` Command → OutlineAgent |
| **A06** | **AI 提取信息** | ChapterInfoPanel "重新提取信息" | MOCK_EXTRACTED 硬编码 | ExtractAgent → 结构化分析 |
| **A07** | **AI 生成大纲** | WorkspaceSideNav "AI生成大纲" | submitOutlineTask → FakeAgent | `/outline generate` Command → OutlineAgent |
| **A08** | **生成细纲** | WorkspaceSideNav "生成细纲" | submitDetailOutlineTask → FakeAgent | `/outline expand` Command → OutlineAgent |
| **A09** | **开始生成** | WorkspaceActions "开始生成" | submitChapterGenerationTask → FakeAgent | `/continue` Command (带配置) → WritingAgent |
| **A10** | **批量生成** | WorkspaceActions "批量生成" | 无实现 | `/batch-generate` Command → BatchAgent |
| **A11** | **暂停生成** | AiProgressDock "暂停" | 无实现 (onPause 回调空) | Agent Task Pause → 状态冻结 |
| **A12** | **取消任务** | AITaskPanel "取消" | cancelTask → clearTimeout | Agent Cancel → 资源释放 |
| **A13** | **重试任务** | AITaskPanel "重试" | onRetryTask 回调 | Agent Retry → 同模型重试 |
| **A14** | **采纳结果** | AIResultCard "采纳" | acceptSuggestion → 追加正文 | User Accept → Hook 后处理 |
| **A15** | **存为灵感** | AIResultCard "存为灵感" | addAISuggestion → 存入章节 | Save Inspiration → InspirationStore |
| **A16** | **忽略结果** | AIResultCard "忽略" | onDiscard 回调 | Discard → 日志记录 |
| **A17** | **创建项目(AI)** | CreateProjectModal "创建"(带AI图标) | createProject → 内存Map | `/project create` → ProjectInitAgent |
| **A18** | **引导创作启动** | GuideEntry "新建引导项目" | onCreate 回调 | GuideAgent (25 Q&A → 项目框架) |
| **A19** | **引导下一步** | GuideQAStep "下一步 →" | onAnswer 回调 | GuideAgent.nextQuestion() |
| **A20** | **引导跳过** | GuideQAStep "跳过引导" | onSkip 回调 | GuideAgent.skip() → 直接进入编辑器 |
| **A21** | **模型选择** | GenerationForm "AI模型" 下拉 | 硬编码 4 选项 | ModelRouter 配置变更 |
| **A22** | **上下文: 大纲细纲** | ContextOptions checkbox | ViewModel local state | ContextAssembler.添加大纲 |
| **A23** | **上下文: 正文摘要** | ContextOptions checkbox | ViewModel local state | ContextAssembler.添加摘要 |
| **A24** | **上下文: 主角状态** | ContextOptions checkbox | ViewModel local state | ContextAssembler.添加角色状态 |
| **A25** | **上下文: 角色关系** | ContextOptions checkbox | ViewModel local state | ContextAssembler.添加关系网 |
| **A26** | **上下文: 技能道具** | ContextOptions checkbox | ViewModel local state | ContextAssembler.添加道具技能 |
| **A27** | **上下文: 重要事件** | ContextOptions checkbox | ViewModel local state | ContextAssembler.添加事件线 |
| **A28** | **目标字数调整** | GenerationForm ±按钮 | updateGenerationConfig | GenerationConfig 写入 Prompt |

#### B 类：纯数据交互（31 个）— Provider CRUD 即可

| # | 交互点 | 所在组件 | 当前状态 | 对应 Provider |
|---|--------|---------|---------|--------------|
| B01 | 搜索小说 | SearchBar input | searchProjects → mock filter | NovelProjectProvider |
| B02 | 新建项目 | SideNav "立即写作" | 打开 CreateProjectModal | NovelProjectProvider.createProject |
| B03 | 选择项目 | ProjectCard click | onSelect → 进入工作区 | Router 导航 |
| B04 | 编辑项目 | ProjectCard hover "编辑" | onSelect | Router 导航 |
| B05 | 删除项目 | ProjectCard hover "删除" | e.stopPropagation (无实际删除) | NovelProjectProvider (需新增 delete) |
| B06 | 工具栏按钮 ×N | Toolbar items[] | action 回调 | 各自定义 action |
| B07 | 书名输入 | CreateProjectModal input | name signal | 表单校验 |
| B08 | 类型选择 | CreateProjectModal select | genre signal | 表单校验 |
| B09 | 简介输入 | CreateProjectModal textarea | description signal | 表单校验 |
| B10 | 主角姓名 | CreateProjectModal "完整" tab | protagonistName signal | → Character 创建 |
| B11 | 主角年龄 | CreateProjectModal number input | protagonistAge signal | → Character 创建 |
| B12 | 主角性别 | CreateProjectModal radio | protagonistGender signal | → Character 创建 |
| B13 | 主角性格 | CreateProjectModal textarea | protagonistPersonality signal | → Character 创建 |
| B14 | 目标读者 | CreateProjectModal radio group | targetAudience signal | → Project 元数据 |
| B15 | 写作风格 | CreateProjectModal select | writingStyle signal | → Skill 匹配依据 |
| B16 | 故事主题 | CreateProjectModal select | storyTheme signal | → Skill 匹配依据 |
| B17 | 自定义设定 | CreateProjectModal textarea | customSettings signal | → WorldSetting 种子 |
| B18 | 简易/完整切换 | CreateProjectModal tabs | activeTab signal | UI 状态 |
| B19 | 取消创建 | CreateProjectModal "取消" | onCancel | 关闭 Modal |
| B20 | 引导上一步 | GuideQAStep "← 上一步" | onPrev (disabled step=1) | Guide 状态回退 |
| B21 | 引导关闭 | GuideQAStep close button | onClose | 退出引导 |
| B22 | 导航: 大纲 | WorkspaceSideNav "大纲" | onOpenOutline | Panel 切换 |
| B23 | 导航: 章节 | WorkspaceSideNav "章节" | onOpenChapters | Panel 切换 |
| B24 | 导航: 人物 | WorkspaceSideNav "人物" | onOpenCharacters | Panel 切换 |
| B25 | 导航: 设定 | WorkspaceSideNav "设定" | onOpenWorldSetting | Panel 切换 |
| B26 | 导航: 导出 | WorkspaceSideNav "导出" | onOpenExport | (未实现) |
| B27 | 章节: 选择 | OutlineList chapter click | onSelectChapter | useWorkspace.selectChapter |
| B28 | 章节: 展开 | OutlineList arrow drop | onToggleExpand | ViewModel UI 状态 |
| B29 | 章节: 完成 | OutlineList checkbox | onToggleComplete | ChapterStatus 更新 |
| B30 | 章节: 星标 | OutlineList star | onToggleStar | ViewModel UI 状态 |
| B31 | 编辑器: 返回 | EditorToolbar back | onBack | 导航回工作区 |

---

## 第二章：四层架构映射

### 2.1 架构总览

```
用户点击 UI 按钮
      │
      ▼
┌─────────────────────────────────────────────────┐
│  Layer 1: Command Interpreter (命令解释器)        │
│  将 UI 点击翻译为结构化 Command 对象              │
│  例: "AI续写按钮" → Command{ type: 'continue',   │
│        chapterId, contextRefs, model, wordCount } │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  Layer 2: Hook Pipeline (钩子管道)                │
│  PreToolUse Hooks 按顺序执行:                     │
│  ① SensitiveWordHook  敏感词拦截                  │
│  ② ConsistencyHook    一致性预检                  │
│  ③ StyleMatchHook     风格匹配                    │
│  ④ ContextLimitHook   上下文预算                   │
│  任一 Hook return deny → 终止流程                  │
└──────────────────────┬──────────────────────────┘
                       │ (all passed)
                       ▼
┌─────────────────────────────────────────────────┐
│  Layer 3: Skill Context (技能上下文)              │
│  根据项目 genre 加载对应 Skill:                   │
│  · 古风武侠 → ancient-wuxia.md 注入 system prompt │
│  · 科幻 → sci-fi.md 注入科技名词库               │
│  · 悬疑 → mystery.md 注入伏笔技巧                 │
│  拼接最终 LLM Prompt                              │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  Layer 4: Agent Router (代理路由器)               │
│  根据 Command.type 路由到专业 Subagent:           │
│  · continue/rewrite/expand/polish → WritingAgent  │
│  · outline generate/expand → OutlineAgent         │
│  · summarize → SummaryAgent                       │
│  · extract → ExtractAgent                         │
│  · review consistency → @character-checker        │
│  · review plot → @world-checker                   │
│                                                   │
│  每个 Agent 内部:                                 │
│  1. 选择模型 (ModelRouter: DeepSeek/Claude/GPT)  │
│  2. 组装 prompt (Skill + Context + Command)       │
│  3. 调用 LLM API (Streaming or batch)            │
│  4. 解析响应 → AITask output                     │
│  5. Post-Hook 处理 (输出质量检查)                 │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
              AITask 结果返回 UI
              (AIResultCard 展示 → 用户采纳/丢弃)
```

### 2.2 每个 A 类交互的四层详细映射

#### A01: AI 续写（核心路径，其他 AI 操作的基础模板）

```
┌─ UI 层 ─────────────────────────────────────────┐
│  EditorToolbar "AI续写" 按钮 onClick             │
│  → props.onAIContinue()                          │
│  当前代码位置: novel-editor/index.tsx:50-53       │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌─ Command 层 ─────────────────────────────────────┐
│  Command = {                                     │
│    type: 'continue',                             │
│    chapterId: selectedChapterId(),               │
│    text: chapter.content || '续写提示',          │
│    config: {                                    │
│      targetWordCount: generationConfig.targetWords,│
│      model: generationConfig.model,              │
│      contextRefs: enabledContextOptions,        │
│      referenceChapterCount: generationConfig.refCount│
│    }                                             │
│  }                                              │
│  新增文件: src/commands/continue-command.ts       │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌─ Hook 层 ────────────────────────────────────────┐
│  Hook ①: SensitiveWordHook                      │
│    · 扫描 chapter.content + 前3章摘要             │
│    · Aho-Corasick 匹配敏感词库                    │
│    · 命中 → return { decision: 'deny', reason }   │
│                                                   │
│  Hook ②: ConsistencyHook                        │
│    · 提取当前章节角色名 ↔ character.yaml 对比      │
│    · 检查: 角色存活状态 / 所在位置 / 拥有道具      │
│    · 矛盾 → attach warning (不阻断)              │
│                                                   │
│  Hook ③: StyleMatchHook                          │
│    · 加载 project genre 对应 Skill 的风格规则      │
│    · 检查最近 3 段风格偏移度                      │
│    · 偏移 > 阈值 → attach styleHint               │
│                                                   │
│  Hook ④: ContextLimitHook (Phase 2)              │
│    · 计算 token 预估: 前文 + 角色 + 大纲 + 设定   │
│    · 超 80% 窗口 → 触发 L5 Autocompact           │
│                                                   │
│  新增文件: src/hooks/sensitive-word-hook.ts       │
│          src/hooks/consistency-hook.ts            │
│          src/hooks/style-match-hook.ts           │
└──────────────────────┬───────────────────────────┘
                       │ (passed)
                       ▼
┌─ Skill 层 ───────────────────────────────────────┐
│  根据 project.genre 匹配并加载 Skill:              │
│                                                   │
│  if (genre === '玄幻' || genre === '仙侠')        │
│    → load skill: ancient-wuxia.md                 │
│      注入: 武功招式【】标注规范 / 禁止现代词汇     │
│                                                   │
│  if (genre === '科幻')                            │
│    → load skill: sci-fi.md                       │
│      注入: 科技名词一致性 / 时间线逻辑             │
│                                                   │
│  if (genre === '悬疑')                            │
│    → load skill: mystery.md                      │
│      注入: 伏笔技巧 / 红鲱鱼手法                  │
│                                                   │
│  最终 System Prompt =                             │
│    BasePrompt + Skill.knowledgeBase +             │
│    styleHint + consistencyWarnings                │
│                                                   │
│  新增文件: src/skills/skill-loader.ts             │
│          src/skills/ancient-wuxia.md             │
│          src/skills/sci-fi.md                    │
│          src/skills/mystery.md                   │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌─ Agent 层 ───────────────────────────────────────┐
│  路由到: WritingAgent (subagent)                  │
│                                                   │
│  Agent 定义: .novelforge/agents/writing-agent.md  │
│  ---                                              │
│  description: AI 小说写作专家                     │
│  mode: subagent                                  │
│  model: ${config.model}  // 从 command 读取      │
│  tools:                                           │
│    read: true                                    │
│    grep: true                                    │
│    novel_continue: true                           │
│    write: false  // 不直接写入正文                │
│    bash: false                                   │
│  ---                                              │
│  你是一位专业的{genre}小说写作者...               │
│  根据{contextRefs}提供的上下文信息进行续写...      │
│                                                   │
│  执行流程:                                        │
│  1. ContextAssembler 收集勾选的上下文             │
│     · outline → 调用 OutlineProvider.getDetailOutline│
│     · characters → 调用 CharacterProvider.list    │
│     · worldSetting → 调用 WorldSettingProvider   │
│     · prevChapters → 取前 N 章内容摘要            │
│  2. ModelRouter.select(config.model)              │
│     · '豆包' → deepseek-api (便宜/快速)           │
│     · 'GPT-4' → openai-api (创意好)               │
│     · 'Claude' → anthropic-api (文学性强)         │
│  3. LLM Streaming Call                           │
│     · SSE stream → 边收边显示 (AiProgressDock)    │
│     · 实时更新 AITask.status: running + preview   │
│  4. 响应解析 → AITaskOutput { text, wordCount }  │
│  5. PostHook: 输出质量检查                        │
│     · 字数是否在 targetWordCount ± tolerance 范围 │
│     · 是否包含敏感词 (二次扫描)                   │
│     · 角色名一致性快速校验                         │
│                                                   │
│  新增/修改文件:                                   │
│    providers/fake-agent.ts → agent-router.ts      │
│    新增: agents/writing-agent.md                  │
│    新增: agents/outline-agent.md                  │
│    新增: agents/extract-agent.md                  │
│    新增: services/model-router.ts                 │
│    新增: services/context-assembler.ts           │
└───────────────────────────────────────────────────┘
```

#### A02-A05: 浮动工具栏命令（改写/扩写/润色/摘要）

这四个命令共享同一套架构，区别在于 **Prompt 模板** 和 **上下文范围**：

| 命令 | Prompt 差异 | 上下文差异 | 特殊处理 |
|------|------------|-----------|---------|
| **A02 改写** | "将以下文本改写为{style}风格:\n{selectedText}" | 仅选中文本 | 需传入 selectedText |
| **A03 扩写** | "对以下段落进行扩展描写:\n{selectedText}" | 选中文本 + 前后各 1 段 | 保持上下连贯 |
| **A04 润色** | "对以下文本进行文学润色:\n{selectedText}" | 仅选中文本 | 强化修辞/节奏 |
| **A05 摘要** | "总结以下章节内容:\n{chapterContent}" | 全章内容 | 输出结构化摘要 |

**关键代码改动点** — [use-chapter-editor.ts:37-39](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/hooks/use-chapter-editor.ts#L37-L39):

```typescript
// 当前: 空实现
function handleAICommand(_cmd: AIWritingCommand) {
  setAiToolbarVisible(false);
}

// 目标: 路由到 Command Interpreter
function handleAICommand(cmd: AIWritingCommand) {
  setAiToolbarVisible(false);
  const selection = window.getSelection()?.toString() || '';
  commandInterpreter.execute({
    type: cmd,  // 'rewrite' | 'expand' | 'polish' | 'summarize'
    chapterId: currentChapterId(),
    text: selection,
    selectedText: selection,
  });
}
```

#### A06: AI 提取信息（结构化分析）

**当前状态**：[chapter-info-panel.tsx:18-33](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/chapter-info-panel.tsx#L18-L33) 使用硬编码 `MOCK_EXTRACTED` 常量。

**目标工作流**：
```
用户点击 "重新提取信息"
  → ExtractAgent.submitTask({ type: 'extract', chapterId, text: fullContent })
  → LLM 分析全文，输出结构化 JSON:
    {
      summary: "本章摘要...",
      newCharacters: [{name, role}],
      protagonistStatus: {location, emotion, powerLevel},
      acquiredItems: [{name, owner}],
      keyEvents: "事件描述...",
      foreshadowingHints: ["可能的伏笔线索..."],
      prediction: "后续走向预测"
    }
  → AIExtractedInfo 类型已有定义 ([editor.ts:8-16](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/types/editor.ts#L8-L16))
  → 更新 ChapterInfoPanel 显示
```

**特别价值**：提取结果的 `foreshadowingHints` 字段可以**自动写入伏笔追踪系统**，这是方案文档中标记为 P1 的原创功能。

#### A07-A08: 大纲生成（OutlineAgent）

**当前代码路径**：
- [workspace-view-model.ts:175-183](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/workspace-view-model.ts#L175-L183) `submitOutlineTask`
- [workspace-view-model.ts:185-193](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/workspace-view-model.ts#L185-L193) `submitDetailOutlineTask`
- [workspace-side-nav.tsx:57-68](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/layout/workspace-side-nav.tsx#L57-L68) 两个按钮

**目标工作流**：
```
"AI生成大纲" 按钮
  → Command: { type: 'outline:generate', projectId }
  → OutlineAgent:
    1. 读取项目元数据 (genre / theme / style / protagonist)
    2. 读取已有角色档案 (如有)
    3. 读取世界观基础设定 (如有 customSettings)
    4. 组装大纲生成 Prompt:
       "请为一部{genre}类小说生成完整大纲\n"
       "主题: {theme}\n主角: {protagonist}\n风格: {style}\n"
       "要求: 分{volumeCount}卷，每卷{chaptersPerVolume}章\n"
       "输出格式: YAML OutlineNode 树结构"
    5. 调用 LLM (推荐 DeepSeek，逻辑强成本低)
    6. 解析 YAML → OutlineNode[] → 存入 OutlineProvider
    7. 自动触发 WorkspaceOutlineList 刷新

"生成细纲" 按钮
  → Command: { type: 'outline:expand', chapterId }
  → OutlineAgent:
    1. 读取父级大纲节点 (goal/conflict/keyPlot)
    2. 读取前一章细纲 (保持连贯)
    3. 读取角色当前位置和状态
    4. 生成本章细纲 (1000-2000 字的情节分解)
    5. 更新 Chapter.outline
```

#### A09-A11: 生成控制（开始/批量/暂停）

| 交互 | 当前代码 | 目标改造 |
|------|---------|---------|
| **A09 开始生成** | [workspace-actions.tsx:13-19](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/generation/workspace-actions.tsx#L13-19) `onStartGeneration` | 等同 A01 的完整 Command→Hook→Skill→Agent 流程，但使用 GenerationForm 的全部配置参数 |
| **A10 批量生成** | [workspace-actions.tsx:21-27](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/generation/workspace-actions.tsx#L21-27) `onBatchGeneration` (无实现) | BatchAgent: 并行提交 N 个章节的 continue-writing 任务，每个独立 AITask，共享同一个 AiProgressDock 聚合进度 |
| **A11 暂停生成** | [workspace-ai-progress-dock.tsx:56-63](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/ai-task/workspace-ai-progress-dock.tsx#L56-63) `onPause` (回调存在但无绑定) | Agent Pause: SSE 流中断 → 已生成内容暂存为 AISuggestion (pending 状态) → 用户可后续恢复 |

#### A12-A16: 任务生命周期管理

| 交互 | 当前代码 | 改造要点 |
|------|---------|---------|
| **A12 取消** | [ai-task-panel.tsx:124-130](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/ai-task-panel.tsx#L124-130) `cancelTask` → FakeAgent 清除 timer | 真实取消需调用 LLM API cancel (如支持) 或直接丢弃连接。已生成的部分内容可选: 保留为 draft / 全部丢弃 |
| **A13 重试** | [ai-task-panel.tsx:132-138](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/ai-task-panel.tsx#L132-138) `retryTask` (回调存在) | Retry 策略: 同模型重试 → 参数微调 (temperature +0.1) → 若仍失败则 fallback 到备选模型 |
| **A14 采纳** | [ai-result-card.tsx:35-38](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/ai-result-card.tsx#L35-38) `acceptSuggestion` → 追加正文 | PostHook: 采纳后触发 ConsistencyCheck (增量模式)，检查新追加内容与角色档案的矛盾 |
| **A15 存为灵感** | [ai-result-card.tsx:41-44](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/ai-result-card.tsx#L41-44) `addAISuggestion` → 存入 chapter.aiSuggestions | 扩展: InspirationStore (跨章节灵感池)，可在任意章节的 AIFloatingToolbar 中调用 |
| **A16 忽略** | [ai-result-card.tsx:126-128](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/ai-result-card.tsx#L126-128) `onDiscard` | 记录 discard log 到 AILogProvider (用于分析用户偏好，优化模型选择) |

#### A17-A20: 项目初始化（引导/创建）

| 交互 | 当前代码 | 目标工作流 |
|------|---------|---------|
| **A17 AI 创建** | [create-project-modal.tsx:394-401](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/create-project-modal/index.tsx#L394-L401) 带 AI 图标的创建按钮 | ProjectInitAgent: 根据用户填写的 (书名/类型/主角/风格/主题) → 自动生成: 项目初始大纲 + 主角完整档案 + 世界观种子 + 第 1 章细纲 |
| **A18 引导启动** | [guide-entry.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-guide/guide-entry.tsx) "新建引导项目" | GuideAgent.init(): 加载 25 道引导题 → 逐步收集用户偏好 → 最终等价于 A17 但输入更丰富 |
| **A19 引导下一步** | [guide-qa-step.tsx:84-90](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-guide/guide-qa-step.tsx#L84-90) "下一步 →" | GuideAgent.recordAnswer(step, answer) → 动态调整后续问题 (如选择"复仇"主题则跳过"爱情"相关问题) |
| **A20 引导跳过** | [guide-qa-step.tsx:76-80](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-guide/guide-qa-step.tsx#L76-80) "跳过引导" | GuideAgent.skip() → 用默认值填充所有答案 → 直接创建最小可用项目 |

#### A21-A28: 生成配置（模型/上下文/参数）

这一组交互不直接触发 AI 调用，而是**配置 Command 的参数**，影响后续 A01/A09 的行为。

```
┌─ 配置交互 ──────────────────────────────────────┐
│                                                   │
│  A21 模型选择 (GenerationForm select)              │
│    → 更新 GenerationConfig.aiModel               │
│    → 影响 ModelRouter 的模型选择                  │
│    → 需统一 [generation-config.ts] 与              │
│      [workspace-generation-form.tsx] 的选项列表    │
│                                                   │
│  A22-A27 上下文勾选 (ContextOptions checkboxes)   │
│    → 更新 Set<string> enabledContextRefs          │
│    → 影响 ContextAssembler 收集的数据范围          │
│    → 每个 option 对应一个 ContextProvider 方法:    │
│      · outline → OutlineProvider.getDetailOutline │
│      · text-summary → ChapterSummaryAgent        │
│      · protagonist → CharacterProvider.getCharacter│
│      · relationships → CharacterProvider.getRelationships│
│      · skills-items → WorldSettingProvider        │
│      · events → EventTimelineProvider (新增)     │
│                                                   │
│  A28 目标字数 (GenerationForm ± buttons)          │
│    → 更新 GenerationConfig.targetWordCount        │
│    → 写入 Command.config.targetWordCount          │
│    → Agent 用作 prompt 中的字数约束 +             │
│      PostHook 的字数校验标准                       │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

## 第三章：新增/修改文件清单与实施顺序

### 3.1 新增文件清单（按依赖顺序）

#### Phase 1: 基础设施（Week 1-2）

| 序号 | 文件路径 | 类型 | 说明 | 行数估算 |
|------|---------|------|------|---------|
| F01 | `src/hooks/sensitive-word-hook.ts` | Hook | PreToolUse 敏感词拦截 | ~120 |
| F02 | `src/hooks/consistency-hook.ts` | Hook | 角色一致性预检 | ~150 |
| F03 | `src/hooks/style-match-hook.ts` | Hook | 风格偏移检测 | ~100 |
| F04 | `src/config/sensitive-words.yaml` | 配置 | 敏感词库（按分类/语言） | ~200 |
| F05 | `src/services/command-interpreter.ts` | 核心 | Command 解析与分发器 | ~200 |
| F06 | `src/commands/continue-command.ts` | Command | 续写命令定义与 Prompt 模板 | ~80 |
| F07 | `src/commands/rewrite-command.ts` | Command | 改写命令 | ~60 |
| F08 | `src/commands/expand-command.ts` | Command | 扩写命令 | ~60 |
| F09 | `src/commands/polish-command.ts` | Command | 润色命令 | ~60 |
| F10 | `src/commands/summarize-command.ts` | Command | 摘要命令 | ~60 |
| F11 | `src/commands/outline-command.ts` | Command | 大纲生成命令 | ~80 |
| F12 | `src/commands/extract-command.ts` | Command | 信息提取命令 | ~80 |

#### Phase 2: Agent 与模型层（Week 3-4）

| 序号 | 文件路径 | 类型 | 说明 | 行数估算 |
|------|---------|------|------|---------|
| F13 | `src/services/agent-router.ts` | 核心 | Agent 注册与路由 | ~180 |
| F14 | `src/services/model-router.ts` | 服务 | 多模型选择与 fallback | ~150 |
| F15 | `src/services/context-assembler.ts` | 服务 | 上下文收集与组装 | ~200 |
| F16 | `src/services/streaming-executor.ts` | 服务 | SSE 流式执行器（替 FakeAgent） | ~250 |
| F17 | `.novelforge/agents/writing-agent.md` | Agent | 写作 Agent 定义 | ~50 |
| F18 | `.novelforge/agents/outline-agent.md` | Agent | 大纲 Agent 定义 | ~50 |
| F19 | `.novelforge/agents/extract-agent.md` | Agent | 提取 Agent 定义 | ~40 |
| F20 | `.novelforge/agents/summary-agent.md` | Agent | 摘要 Agent 定义 | ~30 |
| F21 | `src/providers/real-agent-provider.ts` | Provider | 替代 FakeAgent 的真实实现 | ~300 |

#### Phase 3: Skill 系统（Week 5-6）

| 序号 | 文件路径 | 类型 | 说明 | 行数估算 |
|------|---------|------|------|---------|
| F22 | `src/skills/skill-loader.ts` | 核心 | Skill 发现/匹配/加载引擎 | ~180 |
| F23 | `src/skills/ancient-wuxia.md` | Skill | 古风武侠写作规范 | ~100 |
| F24 | `src/skills/sci-fi.md` | Skill | 科幻设定规范 | ~80 |
| F25 | `src/skills/mystery.md` | Skill | 悬疑推理规范 | ~80 |
| F26 | `src/types/skill.ts` | 类型 | Skill 数据结构定义 | ~40 |

#### Phase 4: 持久化（Week 7-8）

| 序号 | 文件路径 | 类型 | 说明 | 行数估算 |
|------|---------|------|------|---------|
| F27 | `src/services/file-store.ts` | 服务 | YAML 文件读写（替内存 Map） | ~200 |
| F28 | `src/services/daily-log.ts` | 服务 | DailyLog 记忆读写 | ~150 |
| F29 | `src/hooks/memory-hook.ts` | Hook | session.idle/created 记忆注入 | ~100 |

### 3.2 修改现有文件清单

| 文件 | 改动内容 | 影响范围 |
|------|---------|---------|
| [providers/fake-agent.ts](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/providers/fake-agent.ts) | 重命名为 `agent-router.ts` 的 fallback 模式；或保留作为 dev/test 模式 | 所有调用方 |
| [providers/providers-index.ts](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/providers/providers-index.ts) | 导出 RealAgentProvider | import 路径 |
| [hooks/use-chapter-editor.ts](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/hooks/use-chapter-editor.ts#L37-L39) | `handleAICommand` 从空实现改为调用 commandInterpreter | 编辑器 AI 功能激活 |
| [hooks/use-ai-task.ts](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/hooks/use-ai-task.ts) | `const agentProvider = new FakeAgent()` 改为注入 RealAgentProvider | 全局 AI 调用 |
| [components/novel-workspace/generation/workspace-generation-form.tsx:24](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/generation/workspace-generation-form.tsx#L24) | MODEL_OPTIONS 改为从 AI_MODEL_OPTIONS 常量导入 | 修复 P0 bug |
| [types/generation-config.ts:9](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/types/generation-config.ts#L9) | 补充 GPT-4 / Claude 选项，统一模型列表 | 修复 P0 bug |
| [components/novel-editor/chapter-info-panel.tsx:18-33](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/chapter-info-panel.tsx#L18-L33) | MOCK_EXTRACTED 改为从 props/provider 读取动态数据 | AI 提取功能激活 |
| [components/novel-editor/sedfoXtUC](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/sedfoXtUC) | **删除此冗余文件** | 代码整洁 |

---

## 第四章：数据流详细设计

### 4.1 完整数据流：从按钮点击到文字出现在编辑器

以 **A01 AI 续写** 为例的端到端数据流：

```
时间线
  │
  ├─ T+0ms   用户点击 "AI续写" 按钮
  │           EditorToolbar.onAIContinue()
  │
  ├─ T+1ms   CommandInterpreter.interpret('continue')
  │           构建 Command 对象:
  │           {
  │             type: 'continue',
  │             chapterId: 'ch-003',
  │             text: '当前正文末尾500字...',
  │             config: { targetWordCount: 3000, model: 'DeepSeek', ... },
  │             contextRefs: ['outline', 'protagonist', 'relationships']
  │           }
  │
  ├─ T+2ms   Hook Pipeline: execute(command)
  │
  │           [Hook 1] SensitiveWordHook.check(command.text)
  │           → 扫描通过 (0 命中)
  │
  │           [Hook 2] ConsistencyHook.check(command)
  │           → 读取 character.yaml → 对比角色名 "苏瑶"/"陆长风"
  │           → 检测到: 陆长风在上章已离开，本章不应出现
  │           → attach warning: "⚠️ 陆长风在上章已退出，确认继续？"
  │           → decision: 'allow_with_warning'
  │
  │           [Hook 3] StyleMatchHook.check(command)
  │           → project.genre === '玄幻'
  │           → 加载 ancient-wuxia skill
  │           → 最近段落的风格评分: 87/100 (符合)
  │           → decision: 'allow'
  │
  │           All hooks passed ✓
  │
  ├─ T+10ms  SkillContext.assemble(command)
  │           加载 ancient-wuxia.md:
  │           - 写作规范注入 prompt
  │           - 武功招式【】格式提醒
  │           - 禁忌词汇列表加载到 Hook 1 的扫描库
  │
  ├─ T+15ms  AgentRouter.route(command) → WritingAgent
  │
  ├─ T+20ms  ContextAssembler.collect(command.contextRefs)
  │           - outline: OutlineProvider.getDetailOutline('ch-003')
  │             → { goal: '突破境界', conflict: '心魔来袭', ... }
  │           - protagonist: CharacterProvider.getCharacter('char-su-yao')
  │             → { name: '苏瑶', status: '金丹中期', location: '遗迹大殿', ... }
  │           - relationships: CharacterProvider.getRelationships('char-su-yao')
  │             → [{ target: '陆长风', type: 'ally', ... }]
  │
  ├─ T+50ms  ModelRouter.select('DeepSeek')
  │           → 返回 DeepSeek API client (endpoint, apiKey, model: 'deepseek-chat')
  │
  ├─ T+60ms  StreamingExecutor.start(agent, prompt, apiClient)
  │           → 发起 POST /v1/chat/completions { stream: true }
  │
  ├─ T+100ms ┼──────────────────────────────────────┐
  │           │  SSE stream 开始到达                  │
  │           │  chunk 1: "那巨影发出令人牙酸的..."    │
  │           │  → AITask.status = 'running'          │
  │           │  → AITask.output.preview = chunk       │
  │           │  → AiProgressDock 显示进度条 + 预览    │
  │           │                                       │
  │           │  chunk 2: "摩擦声，一柄巨大的石斧..."  │
  │           │  → preview 追加                        │
  │           │  → 进度条更新 33% → 67%               │
  │           │                                       │
  │           │  ... (持续 3-8 秒)                    │
  │           │                                       │
  │           │  final: [DONE]                         │
  │           └──────────────────────────────────────┘
  │
  ├─ T+5000ms StreamingExecutor.complete()
  │           AITask = {
  │             status: 'success',
  │             output: { text: '完整生成内容...', wordCount: 1823 },
  │             duration: 4940,
  │             completedAt: Date
  │           }
  │
  ├─ T+5010ms PostHook: OutputQualityCheck
  │           - 字数: 1823 ∈ [2700, 3300]? → ⚠️ 偏少
  │             (attach note: "建议继续续写一次")
  │           - 敏感词二次扫描: 0 命中 ✓
  │           - 角色一致性: 苏瑶行为符合档案 ✓
  │
  ├─ T+5020ms UI 更新
  │           AITaskPanel: 出现成功任务卡片
  │           AIResultCard: 展示生成内容 + 采纳/存为灵感/忽略
  │           AiProgressDock: 隐藏 (task.running = false)
  │
  └─ T+???ms  用户点击 "采纳"
              AIResultCard.onAccept(text)
              → chapter.content += '\n\n' + text
              → ChapterProvider.saveChapter(ch.id, ch.content)
              → editor canvas 更新显示
              → ConsistencyHook.incrementalCheck(newText)
              → AILogProvider.logTask(task)
              → 完成 ✅
```

### 4.2 Provider 接口扩展计划

当前 [providers/index.ts](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/providers/index.ts) 定义的接口需要扩展：

```typescript
// ===== 现有接口 (保持不变) =====
interface INovelProjectProvider { ... }     // 5 methods
interface INovelChapterProvider { ... }     // 7 methods
interface INovelCharacterProvider { ... }   // 3 methods
interface INovelAgentProvider { ... }      // 5 methods
interface IAILogProvider { ... }           // 3 methods
interface INovelOutlineProvider { ... }     // 3 methods

// ===== 新增接口 =====

/** 世界观数据访问 */
interface INovelWorldSettingProvider {
  getWorldSetting(projectId: string): Promise<WorldSetting>;
  saveWorldSetting(projectId: string, ws: WorldSetting): Promise<void>;
}

/** 伏笔追踪数据访问 */
interface IForeshadowingProvider {
  listForeshadowings(projectId: string): Promise<Foreshadowing[]>;
  createForeshadowing(projectId: string, fs: Foreshadowing): Promise<Foreshadowing>;
  resolveForeshadowing(id: string, resolvedIn: string): Promise<void>;
  checkDeadlines(projectId: string): Promise<Foreshadowing[]>; // 过期未回收
}

/** 灵感池数据访问 */
interface IInspirationProvider {
  saveInspiration(projectId: string, inspiration: Inspiration): Promise<void>;
  listInspirations(projectId: string): Promise<Inspiration[]>;
  inspireMe(projectId: string, count?: number): Promise<Inspiration[]>; // 随机推荐
}

/** 导出服务 */
interface IExportProvider {
  exportEpub(projectId: string, outputPath: string): Promise<void>;
  exportPdf(projectId: string, outputPath: string): Promise<void>;
  exportDocx(projectId: string, outputPath: string): Promise<void>;
  getExportFormats(): ExportFormat[];
}
```

---

## 第五章：风险评估与实施建议

### 5.1 技术风险矩阵

| 风险 | 概率 | 影响 | 缓解措施 | 应对阶段 |
|------|------|------|---------|---------|
| LLM API 响应延迟导致 UI 卡顿 | 高 | 中 | StreamingExecutor 必须首期实现；AiProgressDock 的 preview 给用户即时反馈 | Phase 1 |
| 多模型 API Key 管理 | 中 | 中 | 统一 ConfigService；环境变量 + 可选本地加密存储 | Phase 1 |
| 敏感词误拦（正常内容被截断） | 中 | 低 | Hook 增加"白名单机制"；用户可一键放行并加入白名单 | Phase 1 |
| 上下文组装超 token 限制 | 高 | 中 | ContextAssembler 内置 token 计数器；超限时自动降级（去掉 optional refs） | Phase 2 |
| Skill 加载导致启动变慢 | 低 | 低 | 懒加载：仅在首次 AI 调用时才 parse Skill markdown | Phase 3 |
| 文件持久化并发冲突 | 中 | 中 | 单用户场景下风险低；写入前 file-lock；YAML atomic write | Phase 4 |
| OpenCode 底座版本升级破坏插件 API | 中 | 高 | 锁定 opencode-1.4.0；抽象 PluginAdapter 接口隔离变化 | 持续 |

### 5.2 实施优先级矩阵（59 个交互点排序）

```
P0 — MVP 必须可用 (首批交付):
  ★ A01 AI 续写 (核心路径，其他 AI 操作的基础)
  ★ A06 AI 提取信息 (展示 AI 分析能力)
  ★ A07 AI 生成大纲 (项目初始化核心体验)
  ★ A14 采纳结果 (闭环验证)
  ★ A12 取消任务 (基本控制)

P1 — 完整体验 (MVP+1 周):
  ☆ A02-A05 改写/扩写/润色/摘要 (浮动工具栏激活)
  ☆ A08 生成细纲 (大纲体系完整)
  ☆ A09 开始生成 (带配置的续写)
  ☆ A15 存为灵感 (灵感系统入口)
  ☆ A21-A28 生成配置 (用户体验完整)
  ☆ A13 重试任务 (错误恢复)

P2 — 差异化能力 (MVP+2-3 周):
  ○ A10 批量生成 (效率工具)
  ○ A11 暂停生成 (高级控制)
  ○ A16 忽略结果 (数据分析)
  ○ A17-A20 项目初始化 (引导/智能创建)
  ○ B05 删除项目 (CRUD 完整性)
  ○ B26 导出 (EPUB/PDF)

P3 — 远期规划:
  ○ Hook ③ StyleMatch (Phase 2)
  ○ Hook ④ ContextLimit (Phase 3)
  ○ Skill 系统 (Phase 3)
  ○ DailyLog 记忆 (Phase 4)
  ○ 伏笔追踪 (Phase 4)
  ○ 多分支引擎 (Phase 5+)
```

### 5.3 对三份方案文档的修正建议

基于本次 59 个交互点的逐项映射，建议对原方案做以下修正：

| 原方案声明 | 修正后认知 | 理由 |
|-----------|-----------|------|
| "4 周 MVP" | **6-8 周 MVP** (P0 + P1) | A01 一个交互点的真实化就需要 Hook+Command+Agent+Streaming 四层实现 |
| "20+ Commands" | **MVP 先实现 7 个核心 Command** (continue/rewrite/expand/polish/summarize/outline/extract) | 其余 13 个是 B 类操作的 CLI 化，非紧急 |
| "Skills 系统 P0" | **调整为 P2** (MVP 期间手动选 genre 即可) | Skill 的最大价值在"动态领域适配"，但 MVP 可硬编码 3 套 prompt 模板 |
| "DailyLog P0" | **调整为 P2** | 跨会话记忆的核心需求是"角色状态不丢失"，可通过文件持久化先解决 |
| "多分支 Git Worktree P0" | **调整为 P3 (远期)** | 这是最高壁垒特性，但在用户写出 3 章之前不需要 |

---

## 第六章：决策所需的主控输入

以下事项需要主控决策后才能进入实施：

### D1: LLM API 选型与预算

| 选项 | 推荐场景 | 月成本预估 (中等用量) |
|------|---------|---------------------|
| **DeepSeek Official** | 大纲/摘要/一致性检查（便宜/快） | ￥50-200 |
| **Anthropic Claude** | 续写/润色/情感描写（文学性最佳） | $30-100 |
| **OpenAI GPT** | 创意发散/对话生成（脑洞大） | $20-80 |
| **Qwen (阿里云)** | 小语种/长上下文（200 语言/128K context） | ￥30-100 |
| **本地模型 (Ollama)** | 一致性检查/隐私场景（零成本） | 硬件成本一次性 |

**问题**: 首期接入哪几个模型？API Key 由谁管理？是否有已有 API 额度？

### D2: 数据持久化方案

| 选项 | 优点 | 缺点 | 适用阶段 |
|------|------|------|---------|
| **YAML 文件** (方案文档原设计) | 人类可读/可编辑/Git 友好 | 并发性能差 | MVP → Phase 2 |
| **SQLite (via Drizzle)** | 查询强/事务安全/可迁移 | 额外依赖 | Phase 3+ |
| **IndexedBrowser (前端)** | 无需后端/离线可用 | 容量限制 (~50MB) | 备选 |

**问题**: MVP 阶段先用 YAML 文件还是直接上 SQLite？

### D3: OpenCode 插件集成深度

| 选项 | 说明 | 工作量 |
|------|------|--------|
| **A: 纯前端** | NovelForge 作为 OpenCode 的 `packages/app` 子模块运行，自建 Agent 层 | 中等（当前路径延续） |
| **B: OpenCode 插件** | 利用 OpenCode 的 Plugin 系统（tool.execute.before 等 hook），将 NovelForge 注册为官方插件 | 较小（复用底座能力） |
| **C: 混合模式** | 前端 UI 在 app 内，Agent/Hook 通过 Plugin 系统接入 OpenCode 后端 | 最大（两套架构对齐成本高） |

**问题**: 选择哪种集成策略？这决定了 Hook 系统的实现方式（自建 vs 复用 OpenCode）。

### D4: 首批 Skill 覆盖范围

方案文档设计了 3 个基础 Skill（古风/科幻/悬疑）。考虑到当前 [GENRE_OPTIONS](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/types/project.ts#L79) 支持 8 种类型：

**问题**: MVP 阶段需要覆盖哪些 genre 的 Skill？建议至少覆盖 TOP 3 用户量最大的类型（根据目标市场数据决定）。

---

## 附录

### 附录 A: 交互点 → 代码位置速查表

| 交互 ID | 组件文件 | 关键行号 | 回调/方法名 |
|--------|---------|---------|------------|
| A01 | [editor-toolbar.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/editor-toolbar.tsx) | L50-53 | `onAIContinue` |
| A02-A05 | [editor-ai-floating-toolbar.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/editor-ai-floating-toolbar.tsx) | L16-21 | `onCommand(c.cmd)` |
| A06 | [chapter-info-panel.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/chapter-info-panel.tsx) | L149-156 | `handleReExtract` |
| A07-A08 | [workspace-side-nav.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/layout/workspace-side-nav.tsx) | L57-68 | `onGenerateOutline` / `onGenerateDetail` |
| A09-A10 | [workspace-actions.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/generation/workspace-actions.tsx) | L13-27 | `onStartGeneration` / `onBatchGeneration` |
| A11 | [workspace-ai-progress-dock.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/ai-task/workspace-ai-progress-dock.tsx) | L56-63 | `onPause` |
| A12-A13 | [ai-task-panel.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/ai-task-panel.tsx) | L124-138 | `onCancelTask` / `onRetryTask` |
| A14-A16 | [ai-result-card.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/ai-result-card.tsx) | L36-44 / L41-44 / L126-128 | `onAccept` / `onSave` / `onDiscard` |
| A17 | [create-project-modal/index.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/create-project-modal/index.tsx) | L394-401 | `handleSubmit` |
| A18 | [guide-entry.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-guide/guide-entry.tsx) | L16 | `onCreate` |
| A19-A20 | [guide-qa-step.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-guide/guide-qa-step.tsx) | L84-90 / L76-80 | `onAnswer` / `onSkip` |
| A21-A28 | [workspace-generation-form.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/generation/workspace-generation-form.tsx) + [workspace-context-options.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/generation/workspace-context-options.tsx) | L24 / L29 | `onChangeModel` / `onToggleOption` |
| A28 | [workspace-generation-form.tsx](file:///c://projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/generation/workspace-generation-form.tsx) | L38-39 | `onChangeTargetWords` |

### 附录 B: 现有 Provider 接口 vs 需要的新接口

```
现有 (6 个 Provider, 26 个方法):
  INovelProjectProvider      (5 methods)  ✅ 基础完善
  INovelChapterProvider      (7 methods)  ✅ 基础完善
  INovelCharacterProvider    (3 methods)  ⚠️ 缺 create/update/delete
  INovelAgentProvider        (5 methods)  ❌ 需替换为 RealAgent
  IAILogProvider            (3 methods)  ✅ 可用
  INovelOutlineProvider      (3 methods)  ⚠️ generateOutline 是 mock

需要新增 (5 个 Provider, ~20 个方法):
  INovelWorldSettingProvider  (~3 methods)  🆕 完全缺失
  IForeshadowingProvider      (~4 methods)  🆕 完全缺失
  IInspirationProvider       (~3 methods)  🆕 完全缺失
  IExportProvider            (~3 methods)  🆕 完全缺失
  ISkillProvider            (~4 methods)  🆕 完全缺失
```

---

*文档结束。评估人: Architecture Review Agent | 基于 opencode-1.4.0 packages/app/src/novel 全量代码审计 | 日期: 2026-06-18*

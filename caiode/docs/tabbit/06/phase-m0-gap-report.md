# Phase M0 — Stitch 对比差异报告 & 下一阶段指令

> **日期**: 2026-06-18 | **执行人**: 主控架构师
> **基准**: stitch_ai_novel_writing_dashboard/ 全部页面
> **状态**: READY_FOR_PHASE_M0_FIX

---

## 总体完成度评估

| 页面 | 核心文件行数 | Stitch 完成度 | 数据串联 | 状态 |
|---|---|---|---|---|
| 工作台 | ws/index 137行 + vm 241行 | 90% | ✅ hooks 已接 | 完整 |
| 章节编辑器 | 202行（+4个额外组件）| 85% | ✅ BUG-1 已修 | ⚠️ BUG-2/3 残留 |
| 书架 | 262行 | 95% | ✅ useNovelProject | 完整 |
| 角色追踪面板 | 42行 | 78% | ✅ mockCharacters | ⚠️ 字段名/子组件确认 |
| 世界设定 | 47行 | 80% | ✅ mockWorldSetting | ⚠️ Bento 数据待确认 |
| 个人中心 | 4 Tab 完整 | 88% | ✅ mockUser/Credits | 完整 |
| 成就系统 | 完整 | 85% | ✅ mockAchievements | 完整 |
| 25道题引导 | 完整 | 85% | ✅ guideQuestions | ⚠️ Modal 待确认 |
| 生成参数弹窗 | 未知 | ? | ? | ❓ 需确认 |

---

## 逐页详细对比

### 01 工作台（Stitch 04）

已实现 ✅:
- 三栏布局完整（260px / flex-1 / 300px）
- workspace-view-model.ts 241行，完整接 useNovelProject/useNovelChapters/useNovelOutline/useAITask
- SideNav Tab（大纲/章节/人物/设定/导出）
- AI Progress Dock（绝对定位浮动）
- 生成设置面板接 GenerationConfig mock
- TopAppBar（Logo/通知/设置/头像）完整

差距:
- SideNav 各 Tab 切换内容是否全部展示 mock 数据，需手动确认

### 02 章节编辑器（Stitch 05）

已实现 ✅:
- 三区布局（EditorToolbar / EditorCanvas / EditorRightPanel）
- BUG-1 已修：useNovelChapters(() => nav.projectId() ?? 'proj-001')
- EditorAIFloatingToolbar（文本选中时浮现，5个操作：续写/改写/扩写/润色/摘要）
- AIResultCard（AI结果展示卡）— 超出 Stitch 范围的额外功能 ✅
- AILogDrawer（AI历史日志抽屉）— 超出 Stitch 范围的额外功能 ✅
- MockModeBanner（Mock 模式提示条）
- 日期已动态读取 ch().createdAt / ch().updatedAt

残留 Bug（P1 必须修复）:

BUG-2 (L169): chapterNumber=`#`
  章节编号右侧面板显示为空"#"
  修复: chapterNumber={`#${ch().orderIndex ?? 1}`}

BUG-3 (L61): id:`suggestion-`, taskId:`task-`
  AI suggestion/task ID 为空字符串，可能导致 key 冲突
  修复: id:`suggestion-${Date.now()}`, taskId:tasks().at(-1)?.id??`task-${Date.now()}`

BUG-3 (L75): id:`suggestion-`, taskId:`task-`（同上）
  修复: id:`suggestion-save-${Date.now()}`, taskId:tasks().at(-1)?.id??`task-${Date.now()}`

### 03 角色追踪面板（Stitch 06）

已实现 ✅:
- 三区分组（protagonists / supporting / antagonists）
- CharacterPageHeader（返回 + 标题 + AI生成角色按钮）
- CharacterProtagonist / CharacterSupporting / CharacterAntagonist

待确认（P2）:
- `c.roleType` vs 架构文档定义的 `c.role`（字段名不一致，不影响运行）
- 追踪网格（出场章节/对话字数/能力等级）是否读取 mock，还是硬编码数字

### 04 世界设定（Stitch 07）

已实现 ✅:
- 四 Tab 路由结构（地点/物品/技能/势力）
- WorldPageHeader / WorldOverviewBento / WorldTabNav / 四个 List 组件
- useWorldSetting() 接入 mockWorldSetting

待确认（P2）:
- WorldOverviewBento 的 4 块卡片是否读取 mockWorldSetting.overview 字段

### 05 个人中心（Stitch 09）

已实现 ✅:
- ProfileUserCard（avatar + 用户名 + VIP徽章）
- ProfileStatsRow（创作字数/小说数量/章节数量）
- ProfileCreditsTab（积分大卡 + 变动列表）
- ProfileRechargeTab（套餐 2x2 + 热门标签 + 支付按钮）
- useProfile() 接 mockUser/mockCreditRecords/mockRechargePackages

待确认（P3）:
- 导出/导入 Tab 是 PlaceholderPage 还是已有内容

### 06 成就系统（Stitch 11）

已实现 ✅:
- 页面 Header + 进度条（12/98）
- 统计 4 卡（总/已解锁/未解锁/完成率）
- Category Tabs（全部/创作/社交/成长/特殊）
- AchievementGrid（3列，已解锁彩色卡/未解锁灰色卡）
- useAchievements() 接 mockAchievements（98条，12条已解锁）

待确认（P3）:
- 已解锁卡片是否有 bg-gradient 彩色背景效果

### 07 25道题引导（Stitch 12）

已实现 ✅:
- GuideEntry（空状态 + 新建按钮）
- GuideQAStep（Q&A步骤完整：进度条/题目/选项卡/上下导航）
- GuideQAOptionCard（选中/未选中状态切换）
- useNovelGuide() 接 guideQuestions（25道）

待确认（P2）:
- novel-modal-host.tsx 中 guide-create case 是否完整实现

### 08 书架（Stitch 02）完整 ✅

已实现（262行）:
- BookshelfSearchToolbar（搜索 + 过滤 + 视图切换）
- 项目卡片网格接 useNovelProject mock 数据
- 卡片 hover 快捷操作（编辑/删除）
- BookshelfFloatButton（右下浮动 AI 助手）
- 点击卡片 → selectProject(id) → openView('workspace') 流转正常

### 09 生成参数弹窗（Stitch 10）❓ 待确认

Stitch 设计要求 3 Section:
- Section 1: 目标字数 Stepper + 字数容差 Select + 参考章节数 Select + AI模型 Select
- Section 2: 上下文参考 6项 Checkbox
- Section 3: 包含设定（可折叠）5项 Checkbox
- Footer: 恢复默认 + 取消 + 开始生成

novel-modal-host.tsx 中该 case 当前状态未知，需 Trae 确认。

---

## P1 缺陷修复代码

```tsx
// novel-editor/index.tsx

// BUG-2 L169
// 修复前
chapterNumber={`#`}
// 修复后
chapterNumber={`#${ch().orderIndex ?? 1}`}

// BUG-3 L61
// 修复前
id: `suggestion-`,
taskId: `task-`,
// 修复后
id: `suggestion-${Date.now()}`,
taskId: tasks().at(-1)?.id ?? `task-${Date.now()}`,

// BUG-3 L75
// 修复前
id: `suggestion-`,
taskId: `task-`,
// 修复后
id: `suggestion-save-${Date.now()}`,
taskId: tasks().at(-1)?.id ?? `task-${Date.now()}`,
```

---

## Phase M0-Fix 下发指令

任务1（必须完成）: 修复 novel-editor/index.tsx BUG-2/BUG-3（见上方代码）

任务2（必须确认并汇报）: novel-modal-host.tsx generation-settings case
  - 如果是占位弹窗（仅标题+关闭）→ 完整实现（参考 stitch/10_AI生成参数设置弹窗/code.html）
  - 如果已完整 → 截图或文字描述当前实现内容

任务3（汇报即可，不强制修复）:
  - character-protagonist.tsx：追踪网格数据来源（mock 还是硬编码）
  - world-overview-bento.tsx：4块卡是否读取 mockWorldSetting.overview
  - novel-modal-host.tsx guide-create case：是否完整

禁止事项: 不接真实后端 / 不删除 _legacy / 不扩大功能范围

验证命令:
  cd packages/app && bun typecheck
  cd packages/app && bun test src/novel
  cd packages/app && bunx playwright test e2e/novel --reporter=list

完成后输出 [READY_FOR_PHASE_M0_FIX_REVIEW]

---

## Phase M1 E2E 主链路清单（M0-Fix 后进入）

| ID | 路径 | 验收标准 |
|---|---|---|
| E2E-01 | /novel 打开 | 工作台可见，标题非空 |
| E2E-02 | 工作台章节列表 | 非空列表，显示真实章节名 |
| E2E-03 | 章节点击→编辑器 | 编辑器标题/字数/编号可见 |
| E2E-04 | 编辑器章节编号 | 显示"#1"（P1-01修复后）|
| E2E-05 | 编辑器返回 | 回到工作台 |
| E2E-06 | Logo→书架 | 书架可见，项目卡片非空 |
| E2E-07 | 书架卡片→工作台 | 进入对应项目工作台 |
| E2E-08 | 人物→角色面板 | 非占位页，主角卡可见 |
| E2E-09 | 设定→世界设定 | Bento 4卡可见 |
| E2E-10 | 头像→个人中心 | 积分数字/统计3卡可见 |
| E2E-11 | 成就→成就页 | "12/98"进度可见 |
| E2E-12 | generation-settings Modal | 打开/关闭正常 |

目标: 12 passed / 0 failed / 0 skipped

---

## Phase M2 MVP Freeze 验收标准

typecheck: 0 errors
unit test: ≥91 pass / 0 fail
E2E: ≥12 passed / 0 failed / 0 skipped
href="#": 0处  alert(): 0处  console.log散落: 0处
单文件 < 500行  _legacy 未删除  Mock only（无真实 backend）

**[PHASE_M0_GAP_REPORT_COMPLETE]**

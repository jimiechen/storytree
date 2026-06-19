# Phase M0 — Stitch 对比差异报告 & 下一阶段指令

> 日期: 2026-06-18 | 执行人: 主控架构师
> 状态: READY_FOR_PHASE_M0_FIX

---

## 总体完成度评估

| 页面 | 核心文件行数 | Stitch完成度 | 数据串联 | 状态 |
|---|---|---|---|---|
| 工作台 | ws/index 137 + vm 241 | 90% | ✅ hooks 已接 | 完整 |
| 章节编辑器 | 202行（+额外组件） | 85% | ✅ BUG-1已修 | ⚠️ BUG-2/3 |
| 书架 | 262行 | 95% | ✅ | 完整 |
| 角色追踪面板 | 42行 | 78% | ✅ mockCharacters | ⚠️ 字段名/子组件 |
| 世界设定 | 47行 | 80% | ✅ mockWorldSetting | ⚠️ Bento数据待确认 |
| 个人中心 | 4Tab完整 | 88% | ✅ mockUser/Credits | 完整 |
| 成就系统 | 完整 | 85% | ✅ mockAchievements | 完整 |
| 25道题引导 | 完整 | 85% | ✅ guideQuestions | ⚠️ Modal待确认 |
| 生成参数弹窗 | 未知 | ? | ? | ❓ 需确认 |

---

## 逐页详细对比

### 章节编辑器 vs Stitch 05

已实现（超出Stitch范围）:
- AIResultCard（AI结果卡）
- AILogDrawer（AI历史日志抽屉）
- MockModeBanner（Mock模式提示条）
- EditorAIFloatingToolbar（文本选中浮现AI工具栏）✅

残留Bug:

BUG-2 (L169): chapterNumber=`#`  → 章节编号显示为空"#"
修复: chapterNumber={`#${ch().orderIndex ?? 1}`}

BUG-3 (L61): id:`suggestion-`, taskId:`task-`  → ID为空字符串
修复(L61): id:`suggestion-${Date.now()}`, taskId:tasks().at(-1)?.id??`task-${Date.now()}`

BUG-3 (L75): 同上
修复(L75): id:`suggestion-save-${Date.now()}`, taskId:tasks().at(-1)?.id??`task-${Date.now()}`

### 角色追踪面板 vs Stitch 06

实现状态:
- 入口组件仅42行（轻量）
- roleType字段（vs 架构文档定义的role字段，字段名不一致）
- 三区结构正确：protagonists/supporting/antagonists
- 追踪网格数据来源待确认（出场章节/对话字数/能力等级）

### 世界设定 vs Stitch 07

实现状态:
- 47行入口，四Tab路由正确
- 需确认WorldOverviewBento是否读取mockWorldSetting.overview

### 生成参数弹窗 vs Stitch 10

❓ novel-modal-host.tsx中generation-settings case状态未知
Stitch要求：3个Section + 完整Stepper/Select/Checkbox/Radio

---

## P1 缺陷修复指令

### BUG-2: novel-editor/index.tsx L169
```tsx
// 改前
chapterNumber={`#`}
// 改后
chapterNumber={`#${ch().orderIndex ?? 1}`}
```

### BUG-3: novel-editor/index.tsx L61
```tsx
// 改前
id: `suggestion-`,
taskId: `task-`,
// 改后
id: `suggestion-${Date.now()}`,
taskId: tasks().at(-1)?.id ?? `task-${Date.now()}`,
```

### BUG-3: novel-editor/index.tsx L75
```tsx
// 改前
id: `suggestion-`,
taskId: `task-`,
// 改后
id: `suggestion-save-${Date.now()}`,
taskId: tasks().at(-1)?.id ?? `task-${Date.now()}`,
```

---

## Phase M0-Fix 下发指令

主控批准进入 Phase M0-Fix。

任务1（必须）: novel-editor/index.tsx BUG-2/3修复
任务2（必须确认）: novel-modal-host.tsx generation-settings 状态确认
  - 占位则完整实现（参考stitch/10_AI生成参数设置弹窗/code.html）
任务3（汇报）: 子组件数据来源确认（追踪网格/Bento卡/guide-create modal）

验证: bun typecheck + bun test src/novel + bunx playwright test e2e/novel

完成后输出 [READY_FOR_PHASE_M0_FIX_REVIEW]

---

## Phase M1 E2E 覆盖清单（M0-Fix后进入）

E2E-01  /novel 默认打开工作台
E2E-02  工作台显示真实项目名和章节列表
E2E-03  章节点击进入编辑器，标题/字数可见
E2E-04  编辑器章节编号显示"#1"
E2E-05  编辑器返回→工作台
E2E-06  Logo→书架
E2E-07  书架卡片→工作台
E2E-08  人物→角色面板（非占位）
E2E-09  设定→世界设定（Bento可见）
E2E-10  头像→个人中心（积分/统计可见）
E2E-11  成就→12/98进度可见
E2E-12  generation-settings Modal开关

---

## Phase M2 MVP Freeze 验收标准

typecheck: 0 errors
unit test: ≥91 pass / 0 fail
E2E: 12+ passed / 0 failed / 0 skipped
href="#": 0  alert(): 0  console.log散落: 0
单文件<500行  _legacy未删除  Mock only

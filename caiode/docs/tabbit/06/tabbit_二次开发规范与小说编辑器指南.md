@novel trae已经完成，请审阅代码，指导下一步mock数据串联，跑起整个应用

好的，我会审阅代码并指导下一步的mock数据串联，帮助跑起整个应用。

## 代码审阅报告：@novel Mock 数据串联

### 总体结论

代码整体架构完整，**约 90% 的数据链路已经通畅**，书架→工作台→各子页面的导航骨架正常工作，绝大多数 hooks 也已正确接入 mock 数据。主要卡点集中在**编辑器内一处硬编码**和 **mock-data 导出不完整**，修复量很小，修复后整个应用即可跑通。

---

### 已通畅的链路 ✅

| 链路 | 状态 |
|---|---|
| 书架 → 选项目 → 工作台 | ✅ `selectProject(id)` + `nav.openView('workspace')` 流转正常 |
| 工作台接收 `projectId` | ✅ `<Workspace projectId={nav.projectId} />` 已正确传递 |
| 工作台 mock 数据 | ✅ `workspace-view-model` 已消费 `useNovelProject` / `useNovelChapters` / `useNovelOutline` / `useAITask` |
| 角色面板 / 世界设定 / 个人中心 | ✅ hooks 已接 mock，app-shell 路由已挂载 |
| 成就系统 / 25 题引导 | ✅ `use-achievements` / `use-novel-guide` 已正确消费 mock 数据 |

---

### 发现的问题（按优先级）

#### ⛔ BUG-1 — 阻断级：编辑器硬编码项目 ID

**文件**：`novel-editor/index.tsx` 第 19 行

```typescript
// ❌ 现状 — 永远只加载 proj-001 的章节，书架选哪个项目都没用
const chaptersHook = useNovelChapters(() => 'proj-001');

// ✅ 修复 — nav 在第 17 行已声明，直接复用
const chaptersHook = useNovelChapters(() => nav.projectId ?? 'proj-001');
```

---

#### 🔶 BUG-2 — 章节编号显示为空

**文件**：`novel-editor/index.tsx` 第 157 行

```tsx
// ❌ 模板字面量内容为空，右侧面板章节编号只显示 "#"
chapterNumber={`#`}

// ✅ 修复
chapterNumber={`#`}
```

---

#### 🔶 BUG-3 — AI 建议 ID 为空字符串

**文件**：`novel-editor/index.tsx` 第 61 行、第 75 行

```typescript
// ❌ 现状 — suggestion-id 和 task-id 都是空字符串，会导致 key 冲突
id: `suggestion-`,
taskId: `task-`,

// ✅ 修复 — 补充时间戳
id: `suggestion--`,
taskId: tasks().at(-1)?.id ?? `task-`,
```

---

#### 🔷 BUG-4 — 右侧面板日期硬编码

**文件**：`novel-editor/index.tsx` 第 160–161 行

```tsx
// ❌ 现状
createdAt="2026-06-15"
lastModified="2小时前"

// ✅ 修复 — 从 chapter 对象读取真实时间
createdAt={ch().createdAt ? new Date(ch().createdAt).toLocaleDateString('zh-CN') : '—'}
lastModified={ch().updatedAt ? new Date(ch().updatedAt).toLocaleDateString('zh-CN') : '—'}
```

---

#### 🔷 BUG-5 — mock-data 缺少 4 个新文件的统一导出

**文件**：`mock-data/index.ts`

```typescript
// 现状仅有旧的 5 个导出，缺少新功能数据

// ✅ 追加以下 4 行
export { mockWorldSetting } from './world-settings';
export { mockAchievements } from './achievements';
export { guideQuestions } from './guide-questions';
export { mockUser, mockCreditRecords, mockRechargePackages } from './profile';
```

---

#### 🔸 BUG-6 — 书架残留旧版 API（次要）

**文件**：`bookshelf/index.tsx` 第 24、52 行

```typescript
// ❌ 混用了已弃用的 useNovelView + setView
const { setView, selectProject } = useNovelView();
// ...
onWriteNow={() => setView('create-project')}

// ✅ 统一改为 nav
const { selectProject } = useNovelProject();
onWriteNow={() => nav.openView('create-project')
```

---

### 修复执行顺序

```
Step 1  novel-editor/index.tsx   ← 修复 BUG-1/2/3/4（最关键，4 处集中）
Step 2  mock-data/index.ts       ← 追加 4 行导出（BUG-5）
Step 3  bookshelf/index.tsx      ← 清理旧 API（BUG-6，可选）
Step 4  运行验证命令
```

---

### 验证命令

```bash
cd packages/app && bun typecheck
cd packages/app && bun test src/novel
cd packages/app && bunx playwright test e2e/novel --reporter=list
```

---

### 手动流转验收清单

```
[ ] /novel 打开 → 工作台显示真实项目名
[ ] 工作台侧边栏 → 显示真实章节列表（非空）
[ ] 点击章节 → 进入编辑器，标题/字数正常显示
[ ] 编辑器右侧面板：章节编号显示 "#1"，日期有值
[ ] 编辑器返回 → 回到工作台
[ ] Logo 点击 → 书架，点项目卡片 → 对应工作台
[ ] 侧边栏「人物」「设定」→ 内容页（非灰色占位）
[ ] 头像 → 个人中心，积分/统计有数据
[ ] 成就入口 → 显示 12/98 进度，已解锁彩色卡片
```

---

### Trae 完成后的汇报格式

```
Mock 串联修复完成报告

修改文件:
  - novel-editor/index.tsx（BUG-1/2/3/4）
  - mock-data/index.ts（BUG-5）
  - bookshelf/index.tsx（BUG-6）

验证结果:
  bun typecheck: 0 错误 ✅/❌
  bun test: XX pass / 0 fail ✅/❌
  E2E: XX passed / 0 failed ✅/❌

手动验收:
  编辑器显示真实章节: ✅/❌
  章节编号 #N 正常: ✅/❌
  书架→工作台流转: ✅/❌
  各子页面数据正常: ✅/❌

[READY_FOR_MOCK_INTEGRATION_REVIEW]
```

*内容由 AI 生成仅供参考*
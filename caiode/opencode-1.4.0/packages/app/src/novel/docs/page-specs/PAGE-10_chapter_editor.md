# PAGE-10 章节编辑器（统一工作台）开发文档

> PRD 来源：AI小说创作助手_PRD文档_完整版.md §1.3（章节编辑 P0）+ §7 附录
> 路由：`/novel?view=editor&projectId=xxx&chapterId=yyy`
> 状态：草稿 v1.0（待评审）
> 文档版本：v1.0
> 最后更新：2026-06-26

---

## 1. 页面定位

| 项 | 内容 |
|----|------|
| 一句话目标 | 合并 NovelEditor + Workspace 为统一工作台，提供章节列表、富文本编辑、AI 续写/改写、自动保存 |
| 用户角色 | 已登录作者 |
| 入口 | 书架页点击项目卡片 → `nav.openView('workspace')` → 侧栏点击章节 → `nav.openView('editor')` |
| 出口 | 返回 → 书架 / 保存 → 留在编辑器 / 发布 → 标记完成 |
| 关键指标 | 编辑留存率、自动保存成功率、AI 续写采纳率 |

---

## 2. 信息架构

### 2.1 统一工作台三栏布局

```
┌──────────────────────────────────────────────────────────────────────┐
│ TopAppBar: [Logo] 工作台 素材 灵感 发布 通知 设置 个人 成就            │
├──────────┬──────────────────────────────────┬─────────────────────────┤
│ SideNav  │ EditorCanvas (主编辑区)          │ RightPanel (右侧面板)    │
│          │                                  │                         │
│ 项目名   │ ┌──────────────────────────────┐ │ 章节信息                 │
│ 大纲     │ │ EditorToolbar                │ │  状态: 草稿             │
│ 章节 ▼   │ │ [返回] [历史] [全屏]         │ │  字数: 3,200 / 3,000   │
│  ├ 第1章 │ │ [AI续写] [发布] [保存]       │ │  创建: 06-26 10:00     │
│  ├ 第2章 │ │ 字数: 3200/3000              │ │  修改: 06-26 12:00     │
│  └ 第3章 │ ├──────────────────────────────┤ │                         │
│ 角色     │ │ 章节标题: [______________]   │ │ AI 提取信息              │
│ 世界     │ │                              │ │  摘要: ...             │
│ 导出     │ │  正文画布 (contenteditable) │ │  角色: [张三, 李四]    │
│ 帮助     │ │  字体: Noto Serif SC 18px    │ │  主角状态: ...          │
│ 反馈     │ │  行高: 1.8                   │ │  道具: ...             │
│          │ │                              │ │  事件预测: ...          │
│ [生成大纲]│ │                              │ │                         │
│ [生成细纲]│ │                              │ │ Info-Lite 审计 (折叠)   │
│          │ │                              │ │  原子/链接/熵ΔH/STC    │
│          │ └──────────────────────────────┘ │  审计评分: 85           │
│          │ [选区浮动工具栏: 续写/改写/扩写/润色/摘要] │ [重新提取]   │
└──────────┴──────────────────────────────────┴─────────────────────────┘
```

### 2.2 合并策略（NovelEditor + Workspace → 统一工作台）

| 来源 | 保留 | 合并目标 |
|------|------|---------|
| NovelEditor `editor-canvas.tsx` | ✅ contenteditable 富文本编辑 | 主编辑区 |
| NovelEditor `editor-toolbar.tsx` | ✅ 返回/历史/全屏/AI续写/保存 | 编辑器顶栏 |
| NovelEditor `editor-right-panel.tsx` | ✅ 章节信息 + AI提取 | 右侧面板 |
| NovelEditor `chapter-info-panel.tsx` | ✅ Info-Lite 审计块 | 右侧面板下段 |
| NovelEditor `editor-ai-floating-toolbar.tsx` | ✅ 选区浮动工具栏 | 编辑区悬浮 |
| Workspace `workspace-side-nav.tsx` | ✅ 项目名/大纲/章节/角色/世界/导出 | 左侧导航 |
| Workspace `workspace-top-app-bar.tsx` | ✅ Logo/工作台/素材/灵感/发布 | 顶部应用栏 |
| Workspace `workspace-generation-form.tsx` | ✅ 生成设置（字数/容差/参考章节） | 左侧导航底部 |
| Workspace `workspace-chapter-content.tsx` | ❌ 废弃（只读段落→改为可编辑） | — |
| NovelEditor `chapter-list.tsx` (孤立) | ❌ 废弃（被 SideNav 章节列表替代） | — |
| NovelEditor `chapter-editor.tsx` (孤立) | ❌ 废弃（简易 textarea） | — |
| NovelEditor `chapter-paper-editor.tsx` (孤立) | ❌ 废弃 | — |

### 2.3 视图路由

```
/novel                            → workspace（默认，项目级浏览）
/novel?view=editor&projectId=xxx  → editor（单章编辑）
```

- `workspace` 视图：三栏布局，章节列表只读浏览，点击章节进入 `editor`
- `editor` 视图：三栏布局，章节列表可切换，主编辑区可编辑

---

## 3. 元素清单

| 元素ID | 类型 | 描述 | 数据来源 | 交互 | 状态 |
|--------|------|------|---------|------|------|
| EL-01 | 顶部应用栏 | Logo/导航/通知/设置 | 静态 | onClick 切换视图 | ✅ 保留 |
| EL-02 | 左侧导航 | 项目名/大纲/章节/角色/世界/导出 | useNovelProject | onClick 切换面板 | ✅ 保留 |
| EL-03 | 章节列表 | 章节树（展开/完成/状态点） | useNovelChapters.listChapters | onClick → selectChapter | ✅ 保留 |
| EL-04 | 生成按钮 | 生成大纲/细纲 | useNovelWorkflow | onClick → 弹出生成表单 | ✅ 保留 |
| EL-05 | 编辑器工具栏 | 返回/历史/全屏/AI续写/发布/保存 | useChapterEditor | onClick 各功能 | ✅ 保留 |
| EL-06 | 章节标题 | 输入框 | chapter.title | onInput → saveChapter | ✅ 保留 |
| EL-07 | 正文画布 | contenteditable 富文本 | chapter.content | onInput → 自动保存 | ✅ 保留 |
| EL-08 | 字数统计 | 实时字数/目标字数 | useChapterEditor.wordCount | — | ✅ 保留 |
| EL-09 | 选区浮动工具栏 | 续写/改写/扩写/润色/摘要 | useNovelWorkflow | onClick → AI 命令 | ✅ 保留 |
| EL-10 | 右侧面板-章节信息 | 状态/字数/时间 | useNovelChapters.getChapter | — | ✅ 保留 |
| EL-11 | 右侧面板-AI提取 | 摘要/角色/主角状态/道具/事件 | chapter.extractedInfo | [重新提取] → runInfoExtract | ✅ 保留 |
| EL-12 | 右侧面板-Info审计 | 原子/链接/熵ΔH/STC/评分 | chapter.informationState | 可折叠 | ✅ 保留 |
| EL-13 | 自动保存指示器 | "保存中..."/"已保存" | saveChapter 状态 | — | ❌ 需新增 |
| EL-14 | 保存草稿按钮 | 手动保存 | saveChapter | onClick | ✅ 保留 |
| EL-15 | 标记完成按钮 | 章节状态→completed | updateChapterStatus | onClick | ✅ 保留 |

---

## 4. 用户流程

### 4.1 主流程：书架 → 编辑章节

```
[书架] → 点击项目卡片
  → nav.openView('workspace')
  → SideNav 点击"章节"展开列表
  → 点击章节
  → nav.openView('editor')
  → 编辑正文（自动保存，每 5 秒/失焦时）
  → [AI续写] → 选区浮动工具栏 → 续写/改写/扩写/润色/摘要
  → AI 结果卡片 → [接受]/[保存]/[丢弃]
  → [保存] / [标记完成]
```

### 4.2 异常流程

| 场景 | 处理 |
|------|------|
| 章节列表为空 | 显示空状态 + "创建第一章"按钮 |
| 网络断开 | 自动保存失败 → 显示"保存失败，重试"按钮 |
| AI 续写超时 | 30s 超时 → 显示"AI 响应超时，请重试" |
| 并发编辑冲突 | 最后保存优先 + 冲突提示 |

---

## 5. 状态机

### 5.1 章节状态（ChapterStatus）

```
draft ──[编辑]──→ revising ──[完成]──→ completed ──[发布]──→ published
  ↑                  │                    │
  └──[重写]──────────┘                    │
  └──────────[退回草稿]──────────────────┘
```

### 5.2 自动保存状态

```
idle ──[输入]──→ dirty ──[5s定时器/失焦]──→ saving ──[成功]──→ saved
                                                │                  │
                                                └──[失败]──→ error ──[重试]──→ saving
```

---

## 6. 数据契约

### 6.1 REST API（7 个端点）

挂载于 `InstanceRoutes`：`.route("/novel/project/:projectId/chapter", NovelChapterRoutes())`

| 方法 | 路径 | operationId | 功能 |
|------|------|-------------|------|
| GET | `/novel/project/:projectId/chapter` | novel.chapter.list | 列出项目的所有章节 |
| GET | `/novel/project/:projectId/chapter/trash` | novel.chapter.trash.list | 回收站章节列表 |
| GET | `/novel/project/:projectId/chapter/:id` | novel.chapter.get | 获取单个章节 |
| POST | `/novel/project/:projectId/chapter` | novel.chapter.create | 创建章节 |
| PATCH | `/novel/project/:projectId/chapter/:id` | novel.chapter.update | 更新章节（content/status/summary 等） |
| DELETE | `/novel/project/:projectId/chapter/:id` | novel.chapter.delete | 软删除（移入回收站） |
| POST | `/novel/project/:projectId/chapter/:id/restore` | novel.chapter.restore | 恢复已删除章节 |

**请求/响应格式**：
- 列表 `GET .../chapter` → `200 Chapter[]`
- 创建 `POST .../chapter` body `{title, orderIndex?, content?}` → `201 Chapter`
- 更新 `PATCH .../chapter/:id` body `{title?, content?, status?, summary?, wordCount?}` → `200 Chapter`
- 删除 `DELETE .../chapter/:id` → `204`
- 恢复 `POST .../chapter/:id/restore` → `200 Chapter`

### 6.2 数据库 Schema（novel-chapter.sql.ts）

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { Timestamps } from "../storage/schema.sql"

export const NovelChapterTable = sqliteTable("novel_chapter", {
  id: text().primaryKey(),
  project_id: text().notNull(),
  title: text().notNull(),
  order_index: integer().notNull().default(0),
  status: text().notNull().default("draft"),  // draft|revising|completed|published
  word_count: integer().notNull().default(0),
  content: text().notNull().default(""),
  summary: text(),
  outline: text({ mode: "json" }).$type<{ goal: string; conflict: string; keyPlot: string }>(),
  extracted_info: text({ mode: "json" }),
  information_state: text({ mode: "json" }),
  ai_suggestions: text({ mode: "json" }),
  last_edited_at: integer(),
  deleted_at: integer(),  // null=active, non-null=in trash
  ...Timestamps,
})
```

### 6.3 前端 Provider 接口扩展（INovelChapterProvider）

新增 `createChapter` / `deleteChapter` / `listDeletedChapters` / `restoreChapter`：

```typescript
export interface INovelChapterProvider {
  listChapters(projectId: string): Promise<Chapter[]>;
  getChapter(id: string): Promise<Chapter | null>;
  createChapter(projectId: string, input: { title: string; orderIndex?: number }): Promise<Chapter>;  // 新增
  saveChapter(id: string, content: string): Promise<void>;
  saveChapterSummary(id: string, summary: string): Promise<void>;
  saveChapterWordCount(id: string, wordCount: number): Promise<void>;
  saveChapterInformationState(id: string, state: ChapterInformationState): Promise<void>;
  saveChapterExtractedInfo(id: string, info: ChapterExtractedInfo): Promise<void>;
  updateChapterStatus(id: string, status: ChapterStatus): Promise<void>;
  deleteChapter(id: string): Promise<void>;  // 新增
  restoreChapter(id: string): Promise<void>;  // 新增
  listDeletedChapters(projectId: string): Promise<Chapter[]>;  // 新增
  addAISuggestion(chapterId: string, suggestion: AISuggestion): Promise<void>;
  acceptSuggestion(chapterId: string, suggestionId: string): Promise<void>;
}
```

### 6.4 HTTP Provider（NovelChapterHttpProvider）

路径：`packages/app/src/novel/providers/novel-chapter-http.ts`

- 对接后端 7 个 REST 端点
- `adapt()` 将后端 snake_case → 前端 camelCase（参考 `novel-project-http.ts`）
- `realNovelBackendEnabled` 时启用，否则 fallback 到 mock

---

## 7. 视觉规格

| 元素 | 规格 |
|------|------|
| 三栏布局 | 左 240px / 中 flex / 右 320px |
| 编辑器字体 | Noto Serif SC, 18px, line-height 1.8 |
| 主色调 | #6b38d4（紫）/ #8455ef（渐变）/ #0d1c2f（文本）/ #f8f9ff（背景） |
| 章节状态点 | draft=#cbc3d7 / revising=#f59e0b / completed=#10b981 / published=#6b38d4 |
| 自动保存指示 | 顶部小字："保存中..."(灰) / "已保存"(绿) / "保存失败"(红) |
| 选区浮动工具栏 | 浮于选区上方，5 按钮（续写/改写/扩写/润色/摘要） |

---

## 8. 测试用例

### 8.1 后端 API 测试（curl）

| ID | 场景 | 预期 |
|----|------|------|
| TC-API-01 | GET 章节列表（空） | 200 [] |
| TC-API-02 | POST 创建章节 | 201 + id |
| TC-API-03 | GET 单个章节 | 200 |
| TC-API-04 | PATCH 更新内容 | 200 |
| TC-API-05 | DELETE 软删除 | 204 |
| TC-API-06 | GET 回收站 | 200 + 已删除项 |
| TC-API-07 | POST 恢复 | 200 |

### 8.2 E2E 测试

| ID | 场景 | 验证 |
|----|------|------|
| TC-ED-001 | 书架→工作台→编辑器导航 | URL 切换 + 章节列表加载 |
| TC-ED-002 | 章节列表点击切换 | 编辑区内容切换 |
| TC-ED-003 | 编辑正文自动保存 | 5s 后保存指示器变"已保存" |
| TC-ED-004 | 章节状态切换 | draft→completed 状态点变色 |
| TC-ED-005 | 创建新章节 | 列表新增 + 编辑器聚焦 |
| TC-ED-006 | 删除章节→回收站 | 列表移除 + 撤销恢复 |
| TC-ED-007 | 视觉断言（背景/字体色/布局） | 三栏布局 + 颜色 #6b38d4 |

---

## 9. 关联割裂点

| 割裂点 | 当前状态 | 处理方案 |
|--------|---------|---------|
| NovelEditor vs Workspace 双实现 | 两套并行 | 合并为统一工作台（以 NovelEditor 为主体） |
| 孤立组件 chapter-list/chapter-editor/chapter-paper-editor | 未被引用 | 删除 |
| Chapter 无后端 API | 前端纯 mock | 新建 NovelChapterRoutes + NovelChapterTable |
| Chapter 无 HTTP Provider | 只有 mock Provider | 新建 NovelChapterHttpProvider |
| useChapterEditor.saveDraft | no-op | 实现：调 saveChapter + saveChapterWordCount |
| useChapterEditor.targetWordCount | 硬编码 3000 | 改为从 generation-config 读取 |
| NovelChapterProvider 无 createChapter/deleteChapter | 接口缺失 | 扩展接口 |

---

## 10. 实现顺序

1. **后端**：`novel-chapter.sql.ts` 表 + 迁移 → `novel-chapter.ts` 路由（7端点）→ curl 验证
2. **前端 Provider**：扩展 `INovelChapterProvider` 接口 → `novel-chapter-http.ts` → 适配器
3. **前端合并**：Workspace SideNav/TopAppBar → NovelEditor → 统一三栏布局
4. **前端完善**：自动保存指示器 + 孤立组件清理 + saveDraft 实现
5. **测试**：curl 7端点 + E2E 7用例 + 规则档案 + Git 提交

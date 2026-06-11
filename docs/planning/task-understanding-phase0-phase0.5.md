# 任务理解汇报：Phase 0 + Phase 0.5

> **版本**: v1.0
> **日期**: 2026-06-11
> **汇报等级**: L3 架构/边界改动
> **计划来源**: [PLAN.md v2.0](../../stitch/stitch_ai_novel_writing_dashboard/PLAN.md) §四
> **Agent**: GLM-5V-Turbo (项目协调 Agent)
> **当前积分**: 30/100 🚨🚨

---

## 一、Phase 0：基础重构（数据流修正）

### 1.1 任务名称

消除 NovelEditor 对 mock-data 的直接依赖，建立 UI → Hook → Provider 分层

### 1.2 目标

1. [index.tsx](../../../caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/index.tsx) 不再 import `mockChapters` / `mockCharacters`
2. 所有章节操作通过新增的 `useNovelChapters` Hook 走 [NovelChapterProvider](../../../caiode/opencode-1.4.0/packages/app/src/novel/providers/novel-chapter.ts)
3. AI 结果接受流程明确化：addAISuggestion → acceptSuggestion → 正文追加

### 1.3 不做范围

- 不新增页面、不修改视觉样式、不改类型定义
- 不修改 NovelChapterProvider 的核心方法签名（只增强 refetch）
- 不动角色面板（CharacterPanel 的 mockCharacters 问题留到 Phase 2.2）

### 1.4 所属区域

- [x] packages/app 业务扩展
- [x] novel 小说编辑器
- [ ] OpenCode 底座
- [ ] novel-canvas / novel-3d / 配置文档

### 1.5 预计修改文件

| # | 文件路径 | 操作 | 修改原因 |
|---|----------|------|----------|
| 1 | `novel/hooks/use-novel-chapters.ts` | **新增** | 封装章节数据流核心 Hook，替代组件内直接访问 mock |
| 2 | `novel/hooks/use-novel-chapters.test.ts` | **新增** | Hook 测试（loading/error/empty/mutation 4 场景） |
| 3 | `novel/components/novel-editor/index.tsx` | **修改** | 移除第 12 行 import mock-data，改用 Hook |
| 4 | `novel/providers/novel-chapter.ts` | **修改** | 增强：补充 refetch 方法 |

### 1.6 是否触及保护区域

**否** — 全部在 `packages/app/src/novel/` 内，不涉及 PLAN.md §0 硬边界清单中的 9 个禁止目录。

---

### 1.7 当前违规详情（必须修复）

从 [index.tsx](../../../caicode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/index.tsx) 分析，共 **4 处违规**：

| # | 行号 | 违规代码 | 修复方式 |
|---|------|----------|----------|
| V1 | **L12** | `import { mockChapters, mockCharacters } from '../../mock-data'` | 删除此行，改 import useNovelChapters |
| V2 | **L19,24** | `createSignal(mockChapters[0]?.id)` / `mockChapters.find(...)` | 改为 Hook 返回的 chapters signal |
| V3 | **L27-32,60-66** | 直接 mutation: `chapter.content = content` / `chapter.content += text` | 改调用 `hook.saveChapter(id, content)` / `hook.acceptSuggestion(...)` |
| V4 | **L134,170** | `<ChapterList chapters={mockChapters}>` / `<CharacterPanel characters={mockCharacters}>` | 改为 `{chapters()}` / Hook 数据 |

---

### 1.8 STDD Spec

```
1. 用户目标：
   在小说工作台中保存章节时，数据通过 Hook → Provider 流转，
   UI 层不再直接接触 mock-data 或直接 mutation 对象。

2. 输入：
   - projectId（来自 useNovelProject）
   - content（用户在编辑器中输入的文本）
   - AI result text（AI 生成结果）

3. 输出：
   - chapters: Chapter[] signal（排序后的副本列表）
   - selectedChapter: Chapter | null signal
   - loading / error 状态 signals
   - saveChapter(id, content): Promise<void>
   - selectChapter(id): void
   - acceptSuggestion(chapterId, suggestionId): Promise<void>

4. 状态变化：
   loading → data(章节列表加载完成)
   data → refreshing(保存后自动刷新)
   data → error(Provider 抛出异常)

5. 成功路径：
   NovelEditor mount → useNovelChapters 初始化 → 调用 listChapters →
   chapters signal 更新 → ChapterList 渲染 → 用户点击章节 →
   selectChapter → selectedChapter 更新 → ChapterEditor 显示内容 →
   用户保存 → handleSaveChapter → hook.saveChapter → Provider.saveChapter →
   refetch → chapters 自动更新

6. 失败路径：
   - Provider 抛 NOT_FOUND → error signal 更新 → UI 显示错误提示
   - Provider 抛 INVALID_INPUT → error signal 更新 → UI 显示验证错误
   - 网络超时（Mock 模式不会触发，但 Hook 需处理）

7. 验收标准（10 项）：
   □ #1 grep "mockChapters" components/ 返回空
   □ #2 grep "mockCharacters" components/ 返回空
   □ #3 components 无 import.*mock-data
   □ #4 Hook 不暴露 mock 引用
   □ #5 Provider 返回副本（外部修改不污染内部）
   □ #6 保存后 wordCount 通过 Provider 更新
   □ #7 AI 接受流程：先 addAISuggestion 再 acceptSuggestion
   □ #8 Hook 覆盖 loading / error / empty
   □ #9 bun test 全部通过
   □ #10 bun typecheck 无错误
```

### 1.9 Mock 策略

| 项目 | 策略 | 说明 |
|------|------|------|
| Mock Data | 复用已有 | [mock-data/chapters.ts](../../../caiode/opencode-1.4.0/packages/app/src/novel/mock-data/chapters.ts) 保持不变 |
| Mock Provider | 复用已有 | [novel-chapter.ts](../../../caicode/opencode-1.4.0/packages/app/src/novel/providers/novel-chapter.ts) 已实现复制初始化+副本返回+ProviderError+mockDelay，只需增加 refetch |
| Fake Agent | 不需要 | 本阶段不涉及 AI 任务创建 |
| 新增测试 Mock | 需要 | Hook 测试需独立创建 Provider 实例 |

### 1.10 验证计划

```bash
# 1. 类型检查
cd packages/app && bun typecheck

# 2. 单元测试（含新增 Hook 测试）
cd packages/app && bun test

# 3. 违规检查（必须返回空）
grep -r "mockChapters" packages/app/src/novel/components/
grep -r "mockCharacters" packages/app/src/novel/components/
grep -r "import.*mock-data" packages/app/src/novel/components/

# 4. 手动验证：dev server 启动后确认编辑器功能正常
```

---

## 二、Phase 0.5：项目规则与骨架约束

### 2.1 任务名称

固化边界/契约/路由模型，建立 NovelView 状态机 + 统一 ProviderError + NovelShell 壳层

### 2.2 目标

1. 定义 NovelView 状态机类型，替代后续开发中散落的条件渲染
2. 定义统一 ProviderError 类型，所有 Provider 共用
3. 创建 `useNovelView` Hook 和 `NovelShell` 组件作为应用壳层
4. 确认 providers 统一导出契约

### 2.3 不做范围

- 不新增业务页面（书架/工作台等由 Phase 1 实现）
- 不修改视觉样式
- 不接真实 API
- 不替换现有 NovelEditor（NovelShell 初期只包裹现有组件）

### 2.4 所属区域

- [x] packages/app 业务扩展
- [x] novel 小说编辑器
- [ ] OpenCode 底座
- [ ] 配置/文档/规则

### 2.5 预计修改文件

| # | 文件路径 | 操作 | 修改原因 |
|---|----------|------|----------|
| 1 | `novel/types/novel-view.ts` | **新增** | NovelView 状态机类型定义（11 个视图状态） |
| 2 | `novel/types/provider-error.ts` | **新增** | 统一 ProviderError 类型（6 种错误码） |
| 3 | `novel/types/index.ts` | **修改** | 导出新类型 |
| 4 | `novel/providers/index.ts` | **修改** | 补充统一导出契约 + ProviderError re-export |
| 5 | `novel/hooks/use-novel-view.ts` | **新增** | 页面视图切换 Hook（setView/getView/currentView） |
| 6 | `novel/hooks/use-novel-view.test.ts` | **新增** | Hook 测试（初始值/切换/非法值） |
| 7 | `novel/components/novel-shell.tsx` | **新增** | 应用壳层（视图路由容器 + 条件渲染） |

### 2.6 是否触及保护区域

**否** — 全部在 `packages/app/src/novel/` 内。

---

### 2.7 新增类型定义

```ts
// 页面/视图状态机（替代散落条件渲染）
type NovelView =
  | "bookshelf"       // 我的书架
  | "create-project"  // 创建新项目
  | "workspace"       // 小说工作台
  | "editor"          // 章节编辑（workspace 内的子视图）
  | "guide"           // 25道题引导
  | "profile"         // 个人中心
  | "achievement"      // 成就系统
  | "name-generator"  // 名字生成器
  | "book-analysis"   // 拆书分析
  | "tutorial"        // 新手教程
  | "landing";         // 首页落地页

// 统一 ProviderError（所有 Provider 共用）
type ProviderErrorCode =
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "DENIED"
  | "QUOTA"
  | "CONFLICT"
  | "UNAUTHORIZED";

interface ProviderError {
  code: ProviderErrorCode;
  message: string;
  details?: unknown;
}
```

### 2.8 STDD Spec

```
1. 用户目标：
   应用有统一的页面状态管理，各页面切换不依赖散落的条件渲染。
   所有 Provider 使用统一的错误格式。

2. 输入：
   - setView(view: NovelView) — 切换视图
   - currentView() — 读取当前视图

3. 输出：
   - NovelView 类型（11 个字面量联合类型）
   - ProviderError 接口（code + message + details?）
   - ProviderErrorCode 类型（6 种错误码）
   - useNovelView Hook（currentView signal + setView fn）
   - NovelShell 组件（根据 currentView 渲染对应子组件）

4. 状态变化：
   "bookshelf" → setView("workspace") → currentView() === "workspace"
   任意视图切换时旧视图卸载、新视图挂载

5. 成功路径：
   App mount → NovelShell 渲染 → useNovelView 初始值 "bookshelf" →
   显示 BookshelfPage 占位（或 fallback）→
   用户点击项目 → setView("workspace") →
   NovelShell 切换渲染 WorkspacePage

6. 失败路径：
   - setView(undefined) → TypeScript 编译错误（类型约束）
   - setView("invalid_view") → TypeScript 编译错误（类型约束）

7. 验收标准（7 项）：
   □ #1 NovelView 类型覆盖 11 个已知页面
   □ #2 useNovelView 可切换视图，旧视图卸载
   □ #3 NovelShell 根据 currentView 渲染正确子组件
   □ #4 ProviderError 在 ≥2 个 Provider 中使用
   □ #5 providers/index.ts 导出统一契约
   □ #6 bun typecheck 无错误
   □ #7 bun test 全部通过
```

### 2.9 Mock 策略

| 项目 | 策略 | 说明 |
|------|------|------|
| Mock Data | 不需要 | 纯类型 + 骨架阶段 |
| Mock Provider | 不需要 | useNovelView 是纯本地状态 Hook（createSignal） |
| Fake Agent | 不需要 | 不涉及 AI 功能 |
| NovelShell | 条件渲染 | 初期用 `<Show when={...}>`，后续可接路由 |

ProviderError 类型被现有 novel-chapter.ts 第 28/42/51/68 行已在使用（对象字面量形式），本阶段统一为 import 类型。

### 2.10 验证计划

```bash
# 1. 类型检查
cd packages/app && bun typecheck

# 2. 单元测试（含 useNovelView 测试）
cd packages/app && bun test

# 3. ProviderError 使用验证
grep -r "ProviderError" packages/app/src/novel/providers/

# 4. 手动验证：NovelShell 包裹后原有功能不受影响
```

---

## 三、两阶段依赖关系与执行顺序

```
Phase 0（数据流重构）     ← 先执行，消除现有违规
  │
  └──→ Phase 0.5（骨架约束）  ← 后执行，在干净的数据流上搭建骨架
        │
        └──→ Phase 1.1（书架页面）← 有了 View 状态机才能做页面切换
```

**执行理由**: Phase 0 必须先做——如果先搭 Phase 0.5 的骨架再修 Phase 0 的数据流，可能导致壳层组件也需要跟着改动。先清底座再盖楼。

---

## 四、风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| Phase 0 重构破坏现有编辑器功能 | 高 | 中 | 先跑通现有测试；增量迁移（保留原逻辑为 fallback）；每步都 bun test |
| CharacterPanel 的 mockCharacters 本次不修 | 低 | 高 | 明确记录留到 Phase 2.2；本次只聚焦 chapters |
| NovelShell 初期包裹导致布局变化 | 低 | 低 | NovelShell 只做视图容器，不改变内部布局 |

---

## 五、三层测试验收总览

### Phase 0 测试验收

```
Provider 验收 (4项):
  ✓ listChapters 返回排序后的副本
  ✓ getChapter 找不到返回 null（NOT_FOUND 场景）
  ✓ saveChapter 更新 content + wordCount + status(draft→revising)
  ✓ acceptSuggestion 追加文本到正文

Hook 验收 (4项):
  ✓ 初始加载返回 chapters 列表（loading → data）
  ✓ selectChapter 切换当前章节
  ✓ saveChapter 后 refresh 自动更新列表
  ✓ 错误场景暴露 error signal

UI 验收 (4项):
  ✓ ChapterList 通过 Hook 获取数据（非 mock-data）
  ✓ ChapterEditor onSave 触发 Hook.saveChapter
  ✓ AIResultCard onAccept 触发 Hook.acceptSuggestion
  ✓ 空章节选中时显示占位提示
```

### Phase 0.5 测试验收

```
Provider 验收 (2项):
  ✓ ProviderError 类型被至少 2 个 Provider 导入使用
  ✓ Provider 返回副本行为一致

Hook 验收 (3项):
  ✓ useNovelView 初始值为 "bookshelf"
  ✓ setView("workspace") 后 currentView() === "workspace"
  ✓ setView 不可设置为未定义值

UI 验收 (2项):
  ✓ NovelShell 根据 view 渲染正确子组件
  ✓ 视图切换无闪烁、无残留旧状态
```

---

## 六、等待确认清单

请逐项确认以下问题：

- [ ] **Q1**: Phase 0 的 4 处违规修复范围是否准确？
- [ ] **Q2**: CharacterPanel 的 `mockCharacters` 是否确实留到 Phase 2.2？
- [ ] **Q3**: 执行顺序（先 0 后 0.5）是否同意？
- [ ] **Q4**: 是否可以开始执行？

**确认后立即开始 STDD 开发流程：Types → Tests → Mock → Dev → Verify**

---

## 七、给 Tabbit 审查用摘要

```text
项目：storytree/caiode/opencode-1.4.0
任务：Phase 0 数据流重构 + Phase 0.5 骨架约束
目标：消除 UI 对 mock-data 的直接依赖；建立 NovelView 状态机和统一 ProviderError

改动范围：
Phase 0 (4文件): use-novel-chapters.ts(新) + index.tsx(改) + novel-chapter.ts(改) + 测试(新)
Phase 0.5 (7文件): novel-view.ts(新) + provider-error.ts(新) + use-novel-view.ts(新) +
                   novel-shell.tsx(新) + types/index.ts(改) + providers/index.ts(改) + 测试(新)

是否触及 OpenCode 底座：否
是否遵守 STDD：是，按 Spec→Types→Tests→Mock→Dev→Verify 执行
是否遵守 Mock Provider 原则：是，复用已有 NovelChapterProvider

核心数据流：
Phase 0:  UI(NovelEditor) → Hook(useNovelChapters) → Provider(NovelChapterProvider) → mockData(copy)
Phase 0.5: UI(NovelShell) → Hook(useNovelView) → state(createSignal) → conditional render

测试命令与结果：
1. cd packages/app && bun typecheck - 待执行
2. cd packages/app && bun test - 待执行
3. grep mockChapters components/ - 待执行（预期返回空）

集成结果：待执行
需要 Tabbit 判断的问题：
1. CharacterPanel 的 mockCharacters 是否允许留到 Phase 2.2？
2. NovelShell 初期是否可以用 Show 条件渲染（不接路由）？
下一步建议：
1. 用户确认后开始 Phase 0 执行
2. Phase 0 完成后立即执行 Phase 0.5
3. 两者完成后进入 Phase 1.1 书架页面
```

---

*文档生成时间: 2026-06-11*
*Agent: GLM-5V-Turbo*
*当前积分: 30/100 (🚨🚨 危险)*
*状态: [PENDING_CONFIRMATION] 等待用户确认*

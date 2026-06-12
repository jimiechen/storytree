# Phase 1.3b 任务理解汇报：Outline Provider + Hook（大纲/细纲数据流）

> **我是**: GLM-5V-Turbo（前端工程师），本次任务：DEV-1.3b，职责范围：`packages/app/src/novel/`
> **状态**: [PENDING_REVIEW] 待评审

---

## 一、目标概述

实现 Workspace 左侧面板的**三种视图切换**（大纲 / 细纲 / 章节），建立完整的大纲/细纲数据流。

## 二、现状分析

### 2.1 已有资产（可直接复用）

| 资产 | 路径 | 说明 |
|------|------|------|
| `ChapterOutline` 类型 | [chapter.ts:3-7](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/types/chapter.ts#L3-L7) | 含 goal/conflict/keyPlot，即"细纲"结构 |
| `Chapter.outline` 字段 | [chapters.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/mock-data/chapters.ts) | 每章已有细纲种子数据 |
| `ChapterList` 组件 | [chapter-list.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/chapter-list.tsx) | 现有章节列表 UI（52行） |
| `useNovelChapters` Hook | [use-novel-chapters.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/hooks/use-novel-chapters.ts) | 章节数据流 |
| `Workspace` 壳层 | [index.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/index.tsx) | 三栏布局容器（183行） |
| `mockDelay` 工具 | [mock-delay.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/utils/mock-delay.ts) | Provider 延迟模拟 |

### 2.2 缺失资产（需新建）

| 资产 | 说明 |
|------|------|
| **OutlineNode 类型** | 大纲树节点（支持展开/折叠/星标） |
| **OutlineViewMode 类型** | 'outline' \| 'detail' \| 'chapter' 三种视图模式 |
| **大纲种子数据** | 按卷分组的章节点树 |
| **OutlineProvider** | listOutlines / getOutline / generateOutline |
| **useNovelOutline Hook** | 视图切换 + 大纲/细纲数据加载 |
| **OutlineSidebar 组件** | 带 Tab 切换器的左侧面板 |

### 2.3 关键发现

1. **ChapterOutline 已存在**: `types/chapter.ts` 中已有 `{goal, conflict, keyPlot}` 结构，这就是 PRD 中的"细纲"。不需要重新定义 DetailOutline，直接复用。
2. **每章已有 outline 数据**: mockChapters 的 3 个章节都含 outline 字段，可作为细纲视图的数据源。
3. **左侧面板当前是纯 ChapterList**: 需要升级为带 Tab 切换的三视图面板。

## 三、技术方案

### 3.1 类型设计 (`types/outline.ts`)

```ts
/** 大纲视图模式 */
export type OutlineViewMode = 'outline' | 'detail' | 'chapter';

/** 大纲树节点 — 支持层级（卷 > 章） */
export interface OutlineNode {
  id: string;
  type: 'volume' | 'chapter';
  title: string;
  orderIndex: number;
  /** 章节ID（仅 chapter 类型有值） */
  chapterId?: string;
  /** 卷ID（仅 chapter 类型有值，指向父级 volume） */
  volumeId?: string;
  /** 是否标记重要（星标） */
  starred?: boolean;
  /** 子节点（volume 类型包含 chapters） */
  children?: OutlineNode[];
}
```

**设计决策**:
- 不新增 DetailOutline 类型，直接复用已有的 `ChapterOutline`（goal/conflict/keyPlot）
- OutlineNode 采用扁平 + children 混合结构：顶层为 volume（卷），children 为 chapter（章）
- starred 字段支持星标功能（Phase 1.3b 只做数据层，UI 星标按钮留后续）

### 3.2 Mock 数据设计 (`mock-data/outlines.ts`)

基于现有 proj-001 的 3 个章节，构造一个合理的大纲树：

```
第一卷：雪岭觉醒（volume）
  ├── 第一章：雪岭异兽（chapter, ch-001）
  ├── 第二章：流萤夜火（chapter, ch-002）
  └── 第三章：失落符牌（chapter, ch-003）
```

- 为每个 chapter 关联对应的 chapterId
- 第三章标记 starred=true（演示星标数据）

### 3.3 Provider 设计 (`providers/novel-outline.ts`)

```ts
export interface INovelOutlineProvider {
  /** 列出项目的大纲树（按 orderIndex 排序） */
  listOutlines(projectId: string): Promise<OutlineNode[]>;
  /** 获取某章节的细纲（复用 ChapterOutline） */
  getDetailOutline(chapterId: string): Promise<ChapterOutline | null>;
  /** AI 生成/刷新大纲（Mock 返回预设数据） */
  generateOutline(projectId: string): Promise<OutlineNode[]>;
}
```

遵循现有 Provider 规范：
- async 方法 + mockDelay
- 返回对象副本（防止外部修改污染内部状态）
- 错误时抛 ProviderError { code, message }

### 3.4 Hook 设计 (`hooks/use-novel-outline.ts`)

```ts
export function useNovelOutline(projectId: () => string) {
  // 视图模式切换
  const [viewMode, setViewMode] = createSignal<OutlineViewMode>('chapter');

  // 大纲树资源（响应 projectId 变化）
  const [outlines, { refetch }] = createResource(projectId, id => outlineProvider.listOutlines(id));

  // 切换视图
  const switchView = (mode: OutlineViewMode) => setViewMode(mode);

  return {
    viewMode,
    setViewMode: switchView,
    outlines,          // OutlineNode[] | undefined
    loading: outlines.loading,
    refetchOutlines: refetch,
    getDetailOutline,  // (chapterId) => Promise<ChapterOutline | null>
    generateOutline,   // () => Promise<void>
  };
}
```

### 3.5 组件设计 (`components/novel-workspace/outline-sidebar.tsx`)

替换 Workspace 左侧面板中的纯 ChapterList：

```
┌─────────────────────────┐
│ [大纲] [细纲] [章节]     │  ← Tab 切换器
├─────────────────────────┤
│                         │
│  (根据 viewMode 渲染)    │
│  - outline: 卷/章树形   │
│  - detail: 细纲卡片列表 │
│  - chapter: ChapterList │
│                         │
├─────────────────────────┤
│ [AI生成大纲] [生成细纲]  │  ← 底部操作栏
└─────────────────────────┘
```

**关键约束**:
- 组件只消费 Hook，不 import mock-data
- chapter 视图直接复用现有 ChapterList 组件
- 切换视图时不丢失 selectedChapterId（由 useWorkspace 层保持）

### 3.6 Workspace 壳层改动

[workspace/index.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/index.tsx) 左侧面板区域：
- 将 `<ChapterList>` 替换为 `<OutlineSidebar>`
- 传入 projectId 和 useWorkspace 的 selectChapter/selectedChapterId

## 四、涉及文件清单

| # | 文件路径 | 操作 | 预估行数 |
|---|---------|------|---------|
| 1 | `novel/types/outline.ts` | **新增** | ~25 行 |
| 2 | `novel/types/index.ts` | **修改** | +2 行导出 |
| 3 | `novel/mock-data/outlines.ts` | **新增** | ~50 行 |
| 4 | `novel/mock-data/index.ts` | **修改** | +1 行导出 |
| 5 | `novel/providers/index.ts` | **修改** | +INovelOutlineProvider 接口 |
| 6 | `novel/providers/novel-outline.ts` | **新增** | ~80 行 |
| 7 | `novel/providers/novel-outline.test.ts` | **新增** | ~60 行 |
| 8 | `novel/hooks/use-novel-outline.ts` | **新增** | ~60 行 |
| 9 | `novel/hooks/use-novel-outline.test.ts` | **新增** | ~50 行 |
| 10 | `novel/components/novel-workspace/outline-sidebar.tsx` | **新增** | ~180 行 |
| 11 | `novel/components/novel-workspace/index.tsx` | **修改** | 替换左侧面板 |

**总计**: 新增 ~505 行，修改 ~15 行

## 五、不做什么（边界）

1. **不做 AI 真实生成**: generateOutline 是 Mock 实现，返回预设数据
2. **不做拖拽排序**: 大纲顺序由 orderIndex 决定，不支持 UI 拖拽
3. **不做大纲 CRUD**: 不支持增删改大纲节点（后续 Phase 再做）
4. **不触碰 OpenCode 底座**: 所有变更限定在 `packages/app/src/novel/`
5. **不修改 ChapterList 组件**: 复用原组件，不重构其内部逻辑

## 六、验收标准

### Provider 测试验收
- [ ] listOutlines(projectId) 返回 OutlineNode 数组，按 orderIndex 排序
- [ ] getDetailOutline(chapterId) 返回 ChapterOutline（goal+conflict+keyPlot）
- [ ] getDetailOutline(不存在id) 返回 null
- [ ] generateOutline(projectId) 返回刷新后的大纲数据
- [ ] 返回副本验证（外部修改不污染内部状态）

### Hook 测试验收
- [ ] 初始 viewMode 为 'chapter'
- [ ] switchView('outline') 后 viewMode() === 'outline'
- [ ] outlines 数据随 projectId 加载
- [ ] 切换视图不触发 chapters 重新加载

### UI 验收
- [ ] 左侧显示三种视图 Tab（大纲/细纲/章节）
- [ ] 大纲视图显示卷/章树形结构
- [ ] 细纲视图显示每章的目标/冲突/关键情节
- [ ] 章节视图保持原有 ChapterList 行为
- [ ] 点击章节点选中对应章节（与中间编辑器联动）
- [ ] 底部操作栏可见（AI生成大纲/生成细纲按钮）

### 全局验证
- [ ] `cd packages/app && bun typecheck` 无错误
- [ ] `cd packages/app && bun test` 全部通过
- [ ] `grep -r "import.*mock-data" components/novel-workspace/` 返回空

## 七、风险与缓解

| 风险 | 级别 | 缓解措施 |
|------|------|---------|
| OutlineSidebar 行数可能超 500 | 低 | 拆分为 outline-list + detail-list + tab-bar 三个子组件 |
| 与 useWorkspace 的 selectedChapterId 同步 | 中 | 通过 props 传递回调函数，不在内部维护独立状态 |
| ChapterOutline 复用 vs 新建类型 | 低 | 已确认复用，在文档中说明映射关系 |

---

*请评审以上方案。通过后将按 STDD 流程执行：Types → Tests → Mock → Dev → Verify*

**[READY_FOR_REVIEW]**

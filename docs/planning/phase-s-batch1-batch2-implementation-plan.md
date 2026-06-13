# Phase S 批次 1~2 实施方案 — 04 工作台拆分与数据流接入

> **来源**: `TabAI会话_1781278060682.md` + `TabAI会话_1781278075396.md`
> **任务**: 以 Stitch 04 code.html 为模板，模块化拆分 novel-workspace 并接入现有 Hook 数据流
> **日期**: 2026-06-12
> **Agent**: Kimi-K2.6 (前端工程师)

---

## 一、主控要求摘要

### 冻结边界
- **只重建**: `packages/app/src/novel/components/novel-workspace/`
- **保留不动**: `providers/`, `hooks/`, `types/`, `styles/`, `layout/`, `bookshelf/`, `create-project-modal/`, `novel-editor/`
- **旧工作台备份**: `_legacy/novel-workspace-20260612/`（已备份完成）

### 核心原则
1. **按区域分目录**拆分组件，不堆在根目录
2. **UI 不直接 import mock-data**，数据来自 Hook → ViewModel Adapter → UI props
3. **点击事件从父级传入**，子组件不自己调导航
4. **先拆 UI → 再套数据流 → 再补点击 → 最后做全局导航**
5. **当前只做批次 1+2**，不提前做 `NovelNavigation` / `ModalHost`

### 第一阶段验收标准
```
/novel 默认打开 04 工作台：
- 视觉结构接近 code.html
- 章节列表来自现有 Hook
- 当前章节正文来自 Hook
- AI 生成 Dock 来自 Hook
- 右侧生成设置可交互
- 主要按钮点击已接通（允许目标页先占位）
- bun typecheck 通过
- bun test 通过
```

---

## 二、现有资产盘点

### 已完成的拆分组件（批次 0）
```
components/novel-workspace/
├── layout/
│   ├── workspace-layout.tsx          # 三栏骨架
│   ├── workspace-top-app-bar.tsx     # 顶部导航
│   └── workspace-side-nav.tsx        # 左侧导航
├── outline/
│   └── workspace-outline-list.tsx    # 章节大纲列表
├── editor/
│   ├── workspace-editor-header.tsx   # 编辑器头部
│   └── workspace-chapter-content.tsx # 正文内容
├── ai-task/
│   └── workspace-ai-progress-dock.tsx# AI 进度浮窗
└── generation/
    ├── workspace-generation-form.tsx  # 生成参数表单
    ├── workspace-context-options.tsx  # 上下文选项
    └── workspace-actions.tsx         # 底部操作按钮
```

### 已组装但未接数据流
- `index.tsx`（216 行）—— 目前使用本地静态 state，未接入 Hook

### 现有可用 Hook
- `useWorkspace(projectId)` — 面板状态、项目上下文
- `useNovelChapters(projectId)` — 章节列表、选中章节、保存、AI 建议
- `useNovelOutline(projectId)` — 大纲数据
- `useAITask()` — AI 任务提交/取消/查询
- `useAILog()` — AI 操作日志

---

## 三、批次 1：接入数据流（ViewModel Adapter）

### 新增文件
```
components/novel-workspace/
└── workspace-view-model.ts          # Hook → UI Props 适配层
```

### 职责
- 把 `useWorkspace` / `useNovelChapters` / `useAITask` 数据转为 UI 需要的 props
- 处理 fallback 展示值（如空章节时的默认标题）
- 隔离字段差异，UI 组件不感知 Provider 原始结构

### 适配映射示例

```ts
// workspace-view-model.ts
export function createWorkspaceViewModel(projectId: () => string) {
  const ws = useWorkspace(projectId);
  const chapters = useNovelChapters(projectId);
  const ai = useAITask();

  const projectTitle = () => ws.project()?.title ?? '长篇小说项目';

  const outlineChapters = () =>
    chapters.chapters().map((ch) => ({
      id: ch.id,
      title: ch.title,
      expanded: false,           // 现有 Chapter 类型无 expanded，后续扩展
      completed: ch.status === 'completed',
      starred: false,            // 现有 Chapter 类型无 starred，后续扩展
    }));

  const currentChapterTitle = () => chapters.selectedChapter()?.title ?? '未命名章节';

  const currentParagraphs = () => {
    const content = chapters.selectedChapter()?.content ?? '';
    return content.split('\n\n').filter(Boolean);
  };

  const aiTaskView = () => {
    const task = ai.tasks().find((t) => t.status === 'running');
    if (!task) return undefined;
    return {
      running: true,
      title: task.title,
      progress: task.progress ?? 0,
      preview: task.preview ?? '',
    };
  };

  return {
    projectTitle,
    outlineChapters,
    selectedChapterId: chapters.selectedChapterId,
    currentChapterTitle,
    currentParagraphs,
    aiTaskView,
    // 事件委托
    selectChapter: chapters.selectChapter,
    saveChapter: chapters.saveChapter,
    submitTask: ai.submitTask,
    cancelTask: ai.cancelTask,
  };
}
```

---

## 四、批次 2：改造 index.tsx 接入真实数据

### 改造点
1. **删除静态 mock state**，改为调用 `createWorkspaceViewModel(projectId)`
2. **保留交互回调**（toggleStar / toggleExpand / changeTargetWords 等），但数据底层走 Hook
3. **点击事件**先接入 `useNovelView` 的 `setView`，实现基本页面跳转

### 事件映射表

| UI 元素 | 点击行为 | 实现方式 |
|---------|---------|---------|
| Logo | 回到书架 | `setView('bookshelf')` |
| 工作台 | 刷新当前页 | 无操作或 reload workspace |
| 素材库 | 占位 | `console.log('素材库')` |
| 灵感区 | 占位 | `console.log('灵感区')` |
| 发布章节 | 打开编辑器 | `setView('editor')` |
| 大纲 | 保持工作台 | 无操作 |
| 章节 | 打开编辑器 | `setView('editor')` |
| 人物 | 占位 | `console.log('人物')` |
| 设定 | 占位 | `console.log('设定')` |
| 导出 | 占位 | `console.log('导出')` |
| AI生成大纲 | 调用 submitTask | `submitTask({type:'outline'})` |
| 生成细纲 | 调用 submitTask | `submitTask({type:'detail'})` |
| 历史版本 | 占位 | `console.log('历史版本')` |
| 全屏 | 占位 | `console.log('全屏')` |
| 暂停 | 取消任务 | `cancelTask(taskId)` |
| 开始生成 | 调用 submitTask | `submitTask({type:'generate'})` |
| 批量生成 | 占位 | `console.log('批量生成')` |

---

## 五、风险与依赖

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| `useNovelChapters` 返回的 `Chapter` 类型缺少 `expanded`/`starred` | outline-list 无法完全对齐 code.html | 先在 ViewModel 中硬编码 fallback，后续扩展 types |
| `useAITask` 的 task 结构可能与 AI Task ViewModel 不匹配 | 进度浮窗显示异常 | 在 adapter 中做字段映射和默认值 |
| `useWorkspace` 的 `generationConfig` 可能不存在 | 右侧生成设置面板空值 | 使用 `DEFAULT_GENERATION_CONFIG` fallback |
| 页面跳转目标（人物/设定/素材库）尚未实现 | 点击后无内容 | 先用 `console.log` 占位，不阻塞工作台验收 |

---

## 六、验证清单

- [ ] `bun typecheck` 0 错误
- [ ] `bun test src/novel` 全量通过
- [ ] `index.tsx` 行数 < 500 行（如超过则提取 ViewModel）
- [ ] 未触碰 `providers/`, `hooks/`, `types/` 核心目录
- [ ] 无 `alert()` / `href="#"` / 直接 import mock-data
- [ ] `_legacy` 目录未删除（等待闭环后再清理）

---

## 七、执行顺序建议

```
Step 1: 新建 workspace-view-model.ts（适配层）
Step 2: 改造 index.tsx（替换静态 state 为 ViewModel）
Step 3: 补全点击事件映射
Step 4: 运行 typecheck + test
Step 5: 提交代码
```

---

**请主控确认以上方案后，开始执行。**

[READY_FOR_REVIEW]

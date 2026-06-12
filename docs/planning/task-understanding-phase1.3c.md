# Phase 1.3c 任务理解汇报：Editor 嵌入与生成面板接入

> **我是**: GLM-5V-Turbo（前端工程师），本次任务：DEV-1.3c，职责范围：`packages/app/src/novel/`
> **状态**: [PENDING_REVIEW] 待评审

---

## 一、目标概述

将 **AI 生成设置面板** 接入 Workspace 右侧，作为第三种可切换面板（与角色面板、AI 任务面板并列）。用户可通过此面板配置 AI 生成参数并触发生成。

## 二、现状分析

### 2.1 已有资产（可直接复用）

| 资产 | 路径 | 说明 |
|------|------|------|
| `WorkspacePanelId` | [workspace.ts:6](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/types/workspace.ts#L6) | 当前仅 `'character' \| 'ai-task'`，需扩展 |
| `WorkspaceHeader` | [workspace-header.tsx](file:///c:/projects/storytree/caicode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/workspace-header.tsx) | 面板开关按钮组，需加"生成设置"按钮 |
| `useAITask` Hook | [use-ai-task.ts](file:///c:/projects/storytree/caicode/opencode-1.4.0/packages/app/src/novel/hooks/use-ai-task.ts) | submitTask / cancelTask / tasks / isRunning |
| `AITask` 类型 + 协议 | [ai-task.ts](file:///c:/projects/storytree/caicode/opencode-1.4.0/packages/app/src/novel/types/ai-task.ts) | pending→running→success/failed 状态机 |
| `FakeAgentProvider` | providers 层 | Mock AI 代理（submitTask 返回 AITask） |
| Workspace 右侧面板区 | [index.tsx:152-168](file:///c:/projects/storytree/caicode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/index.tsx#L152-L168) | Show when 模式切换 character/ai-task |

### 2.2 缺失资产（需新建）

| 资产 | 说明 |
|------|------|
| **GenerationConfig 类型** | 目标字数/容差/参考章节数/AI模型/上下文参考选项 |
| **GenerationSettings 组件** | 右侧 ~300px 生成配置面板 UI |

### 2.3 关键发现

1. **不需要新 Provider**: 生成配置是纯前端 local state，提交时调用已有的 `useAITask.submitTask`
2. **WorkspacePanelId 需扩展**: 从 `'character'|'ai-task'` → `'character'|'ai-task'|'generation'`
3. **Editor 已经嵌入**: Phase 1.3a 的 Workspace 中间面板已包含 ChapterEditor + AIResultCard，"Editor 嵌入"部分已完成
4. **本阶段核心工作是**: 新增 GenerationConfig 类型 + GenerationSettings 组件 + 集成到右侧面板切换系统

## 三、技术方案

### 3.1 类型设计 (`types/generation-config.ts`)

```ts
/** 可选 AI 模型列表 */
export const AI_MODEL_OPTIONS = ['豆包', '通义千问', 'DeepSeek', 'GLM-4'];

/** 上下文参考选项 */
export interface ContextReference {
  id: string;
  label: string;
  /** 是否默认勾选 */
  defaultChecked: boolean;
  /** 是否禁用（不可取消） */
  disabled?: boolean;
}

/** 默认上下文参考配置 */
export const DEFAULT_CONTEXT_REFS: ContextReference[] = [
  { id: 'outline', label: '大纲和细纲', defaultChecked: true, disabled: true },
  { id: 'text-summary', label: '已有正文摘要', defaultChecked: false },
  { id: 'protagonist', label: '主角状态追踪', defaultChecked: false },
  { id: 'relationships', label: '角色关系', defaultChecked: false },
  { id: 'skills-items', label: '技能和道具', defaultChecked: false },
  { id: 'events', label: '重要事件', defaultChecked: false },
];

/** 生成配置 */
export interface GenerationConfig {
  targetWordCount: number;       // 目标字数 (300-10000)
  wordCountTolerance: number;    // 字数容差 (±N)
  referenceChapterCount: number; // 参考章节数 (1-10)
  aiModel: string;               // AI 模型
  contextRefs: Set<string>;      // 已选中的上下文参考 ID
}
```

### 3.2 组件设计 (`components/novel-workspace/generation-settings.tsx`)

```
┌──────────────────────────────┐
│  AI 生成设置                  │
├──────────────────────────────┤
│                              │
│  目标字数                    │
│  [====3000====] 3000 字     │
│                              │
│  字数容差                    │
│  ± [300] 字                 │
│                              │
│  参考章节数                  │
│  [3 ▼] 章                   │
│                              │
│  AI 模型                     │
│  [豆包 ▼]                    │
│                              │
│  ── 上下文参考 ──            │
│  ☑ 大纲和细纲 (禁用)        │
│  ☐ 已有正文摘要              │
│  ☐ 主角状态追踪              │
│  ☐ 角色关系                  │
│  ☐ 技能和道具                │
│  ☐ 重要事件                  │
│                              │
├──────────────────────────────┤
│  [▶ 开始生成]  (紫粉渐变)   │
│  [  批量生成 ] (描边)       │
└──────────────────────────────┘
```

**Props 设计**:
```ts
interface GenerationSettingsProps {
  /** 当前是否有选中章节（无章节时禁用生成） */
  hasSelectedChapter: boolean;
  /** AI 是否正在运行 */
  isRunning: boolean;
  /** 触发单章生成 */
  onGenerate: (config: GenerationConfig) => void;
  /** 触发批量生成 */
  onBatchGenerate?: (config: GenerationConfig) => void;
}
```

**内部状态**: 用 createSignal 管理 GenerationConfig 各字段（纯组件内 state，不需全局 Provider）。

### 3.3 集成改动

#### 3.3.1 WorkspacePanelId 扩展
```ts
// workspace.ts
export type WorkspacePanelId = 'character' | 'ai-task' | 'generation';
```

#### 3.3.2 WorkspaceHeader 加按钮
在现有 `[角色面板] [AI 任务]` 后增加 `[生成设置]` 按钮。

#### 3.3.3 Workspace 右侧面板加条件渲染
在 character / ai-task Show 块后增加:
```tsx
<Show when={ws.isPanelVisible('generation')}>
  <GenerationSettings
    hasSelectedChapter={!!ws.selectedChapterId()}
    isRunning={isRunning}
    onGenerate={handleGenerate}
  />
</Show>
```

#### 3.3.4 handleGenerate 回调
```ts
const handleGenerate = async (config: GenerationConfig) => {
  const ch = ws.selectedChapter();
  if (!ch) return;
  await submitTask({
    type: 'continue-writing',
    chapterId: ch.id,
    text: ch.content,
  });
};
```

## 四、涉及文件清单

| # | 文件路径 | 操作 | 预估行数 |
|---|---------|------|---------|
| 1 | `novel/types/generation-config.ts` | **新增** | ~55 行 |
| 2 | `novel/types/index.ts` | **修改** | +2 行导出 |
| 3 | `novel/types/workspace.ts` | **修改** | +1 行 ('generation') |
| 4 | `novel/components/novel-workspace/generation-settings.tsx` | **新增** | ~220 行 |
| 5 | `novel/components/novel-workspace/workspace-header.tsx` | **修改** | +1 按钮 |
| 6 | `novel/components/novel-workspace/index.tsx` | **修改** | 接入生成面板 |

**总计**: 新增 ~275 行，修改 ~15 行

## 五、不做什么（边界）

1. **不做真实 AI 调用**: submitTask 走已有 FakeAgentProvider（Mock 返回）
2. **不做批量生成逻辑**: onBatchGenerate 占位空实现
3. **不修改 Editor 中间面板**: Editor 嵌入已在 Phase 1.3a 完成
4. **不触碰 OpenCode 底座**
5. **不新增 Provider/Hook**: 生成配置为组件内 local state

## 六、验收标准

### 类型验收
- [ ] GenerationConfig 包含所有必需字段
- [ ] ContextReference 支持 disabled 标记
- [ ] AI_MODEL_OPTIONS 为非空数组

### UI 验收
- [ ] Header 有"生成设置"按钮，点击可切换显示/隐藏
- [ ] 生成面板在右侧 ~300px 区域正确渲染
- [ ] 目标字数滑块范围 300-10000，默认值 3000
- [ ] 字数容差输入框接受正整数
- [ ] 参考章节数下拉 1-10
- [ ] AI 模型下拉包含预设选项
- [ ] "大纲和细纲"复选框禁用且默认勾选
- [ ] 其余 5 个复选框可自由勾选/取消
- [ ] "开始生成"按钮：紫粉渐变样式，无选中章节或运行中时 disabled
- [ ] "批量生成"按钮：描边样式
- [ ] 点击"开始生成"触发 submitTask（走 AITask 协议）
- [ ] 生成中 isRunning=true 时按钮显示禁用态

### 全局验证
- [ ] `cd packages/app && bun test` 全部通过
- [ ] `cd packages/app && bun typecheck` 无新增错误
- [ ] `grep -r "import.*mock-data" components/novel-workspace/` 返回空
- [ ] 所有文件行数 < 500

## 七、风险与缓解

| 风险 | 级别 | 缓解措施 |
|------|------|---------|
| generation-settings.tsx 可能超 500 行 | 低 | 将复选框组提取为子组件 ContextRefCheckboxes |
| WorkspacePanelId 扩展影响 useWorkspace 初始值 | 低 | 在 useWorkspace 默认 Set 中加入 'generation' |
| 与 ai-task 面板功能重叠 | 低 | 区分：ai-task=查看任务列表，generation=配置+发起生成 |

---

*请评审以上方案。通过后将按 STDD 流程执行：Types → Component → 集成 → Verify*

**[READY_FOR_REVIEW]**

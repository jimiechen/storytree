# StoryTree 二次开发规则 (STORYTREE_RULES)

> **版本**: v1.0
> **日期**: 2026-06-11
> **来源**: 主控下发的三份开发规则文档（06/TabAI会话）
> **适用范围**: `caiode/opencode-1.4.0` 全局 + `packages/app/src/novel` 业务模块

---

## 目录

1. [项目定位与边界](#一项目定位与边界)
2. [目录权限矩阵](#二目录权限矩阵)
3. [技术栈与依赖规则](#三技术栈与依赖规则)
4. [代码风格规范](#四代码风格规范)
5. [小说编辑器分层架构](#五小说编辑器分层架构)
6. [STDD 开发方法论](#六stdd-开发方法论)
7. [Mock Provider 规范](#七mock-provider-规范)
8. [AI Agent 规范](#八ai-agent-规范)
9. [UI 组件规范](#九ui-组件规范)
10. [Hook 规范](#十hook-规范)
11. [测试规范](#十一测试规范)
12. [验证命令清单](#十二验证命令清单)
13. [开发工作流](#十三开发工作流)
14. [优先路线图](#十四优先路线图)

---

## 一、项目定位与边界

### 1.1 双层模型

`opencode-1.4.0` 不是普通前端项目，而是**上游底座 + 本地业务扩展**的双层 monorepo：

| 层级 | 定位 | 示例 |
|------|------|------|
| 上游底座 | AI 编程代理基础设施 | CLI / Server / SDK / Plugin / Desktop / UI |
| 业务扩展 | StoryTree 独有功能 | 小说编辑器 / StoryCanvas / 3D 镜头 |

**核心原则**: Trae 可以开发业务扩展，但不能随意改动 OpenCode 核心协议、CLI、Server、SDK、构建链和上游通用能力。

### 1.2 三条底线

```
1. 如果一个功能还不能用 Mock Provider 跑通，就不应该接真实后端或真实 AI。
2. 如果一个功能没有验收标准，就不应该开始写 UI。
3. 如果 UI 需要直接 import mock-data 才能工作，说明分层失败。
```

---

## 二、目录权限矩阵

### 2.1 默认只读区域（上游核心底座）

| 目录 | 原因 | 修改门槛 |
|------|------|----------|
| `packages/opencode/` | Server/API/CLI 核心 | 必须说明业务层无法解决 |
| `packages/sdk/` | SDK 生成物和对外协议 | 涉及 API 变更时必须运行生成脚本 |
| `packages/plugin/` | 插件接口影响外部扩展 | 影响范围评估 |
| `packages/desktop/` | Tauri 桌面壳 | 平台构建风险 |
| `packages/ui/` | 全局 UI 基础库 | 影响范围大 |
| `script/` | 自动化脚本 | 发布/生成风险 |
| `infra/` | 基础设施 | 运维风险 |
| `patches/` | 上游依赖补丁 | 高风险 |
| 根目录 `package.json` | 影响 monorepo 依赖和脚本 | 谨慎修改 |
| 根目录 `turbo.json` | CI / 缓存 / 构建拓扑 | 谨慎修改 |
| `tsconfig.json` / `vite.config.ts` | 全局编译与构建 | 谨慎修改 |

**如必须修改底座，必须先输出**:
- 为什么业务层无法解决
- 需要修改的文件清单
- 对 OpenCode 原有功能的影响
- 是否涉及 SDK/API 生成
- 回归验证命令
- 回滚方案

### 2.2 主要开发区（App 扩展层）

```
packages/app/src/novel          ← 小说编辑器（核心业务域）
packages/app/src/novel-canvas    ← 故事画布
packages/app/src/novel-3d       ← 3D 镜头编辑器
packages/app/src/pages/         ← 对应路由入口
packages/app/src/testing/       ← 业务测试辅助
packages/app/e2e/               ← 业务 E2E
```

### 2.3 全局目录使用限制

只有当能力确实**跨业务复用**时才允许改动全局目录：

| 目录 | 允许 | 禁止 |
|------|------|------|
| `packages/app/src/components/` | 通用弹窗、快捷键、布局组件 | 小说章节列表、角色面板、镜头编辑器 |
| `packages/app/src/hooks/` | 跨业务复用的 Hook | 单业务 Hook |
| `packages/app/src/context/` | 全局上下文 | 业务状态 |

---

## 三、技术栈与依赖规则

### 3.1 技术栈

| 项目 | 技术 | 版本约束 |
|------|------|----------|
| 包管理器 | Bun | `bun@1.3.11` |
| Monorepo | Turborepo | workspace catalog |
| 前端框架 | SolidJS | - |
| 构建工具 | Vite | - |
| 样式 | Tailwind CSS | - |
| 状态管理 | Solid Primitives (`createStore`) | 禁止多 `createSignal` 维护同一对象 |
| 数据请求 | TanStack Solid Query | - |
| 3D 渲染 | Three.js | - |
| 测试框架 | Bun Test + happy-dom | - |
| E2E | Playwright | - |
| 校验 | Zod | - |
| 工具库 | Remeda / Effect | - |

### 3.2 依赖规则

1. **默认不新增依赖**
2. 优先使用已有依赖：`solid-js`, `@solid-primitives/*`, `@tanstack/solid-query`, `three`, `tailwindcss`, `zod`, `remeda`, `effect`
3. 新增依赖前必须在 `package.json` 中搜索确认无等价能力
4. 新增依赖必须说明：为什么已有依赖无法满足、影响哪个 package、是否需要 catalog 管理、bundle/runtime 影响
5. 不允许为单个小组件引入大型 UI 框架
6. 不允许混入 React/Vue 状态模型

---

## 四、代码风格规范

遵循上游 `AGENTS.md` 风格偏好：

| 规则 | 要求 |
|------|------|
| 变量声明 | 默认 `const`，避免 `let` |
| 控制流 | 避免 `else`，优先 early return |
| 错误处理 | 避免 `try/catch`，能用 `.catch(...)` 就用 `.catch(...)` |
| 类型安全 | 避免 `any`，必须精确类型或类型推断 |
| 属性访问 | 避免不必要解构，优先 `obj.a` / `obj.b` 保留上下文 |
| 命名 | 底座代码严格短单词名；业务领域模型保持语义清晰（如 `chapterId` 不缩成 `cid`） |
| 内联 | 只使用一次的变量尽量内联 |
| 数组操作 | 优先 `map/filter/flatMap` 等函数式方法 |
| API | 能用 `Bun.file` 等 Bun API 时优先使用 |
| 类型导出 | 导出类型、公共接口、领域模型可以显式声明类型 |
| 反模式 | 不要为了"看起来清楚"引入大量中间变量和包装函数 |

---

## 五、小说编辑器分层架构

### 5.1 六层结构

```
packages/app/src/novel/
├── types/           # 领域模型和接口契约（契约源头）
├── mock-data/       # 静态种子数据（测试和演示）
├── providers/       # 数据访问封装（Mock 和真实实现的隔离层）
├── hooks/           # 连接 Provider 与 UI 的适配层
├── components/      # 展示和交互（只消费 Hook）
└── utils/           # 小型工具函数
```

### 5.2 各层职责

| 层 | 职责 | 禁止 |
|----|------|------|
| `types/` | 定义领域模型、接口契约、状态机 | 在组件中重复声明类型 |
| `mock-data/` | 存放项目/章节/角色/AI任务种子数据 | 写业务逻辑 |
| `providers/` | 封装数据访问、AI调用、抛统一错误 | 暴露内部引用给 UI |
| `hooks/` | 加载/刷新/错误/提交/取消等流程编排 | 直接 new Provider |
| `components/` | 呈现和交互、页面编排 | 直接 import mock-data 或直接改数据源 |
| `utils/` | 小型工具函数（如 mock-delay） | 组件内随便写 setTimeout |

### 5.3 新增能力原则

新增能力优先放在既有分层中。只有当某类功能持续膨胀时才新增子目录：

| 功能示例 | 新增子目录 |
|---------|-----------|
| 版本历史 | `types/version.ts` → `providers/novel-version.ts` → `hooks/use-chapter-version.ts` |
| 大纲/世界观 | `types/world.ts` → `providers/novel-world.ts` → `components/novel-editor/world-panel.tsx` |

不要把所有内容塞进主组件。

### 5.4 类型设计规范

| 规范项 | 要求 |
|--------|------|
| ID | 所有核心对象必须有稳定 `id`（`chapterId`, `characterId`, `projectId`） |
| 时间 | 编辑/生成/保存必须记录时间（`createdAt`, `updatedAt`, `completedAt`） |
| 状态 | 异步任务必须显式状态机（`pending`, `running`, `success`, `failed`） |
| 归属 | 子资源必须带父级归属（章节归属 `projectId`，任务归属 `chapterId`） |
| AI 输出 | AI 结果不可直接覆盖正文，先进入 suggestion/result 再由用户接受 |

类型变更必须同时更新 `types/index.ts` 的导出。

### 5.5 组件职责边界

| 组件 | 职责 | 禁止 |
|------|------|------|
| `NovelEditor` | 页面布局、面板开关、选中章节 | 不直接写数据源 |
| `ChapterList` | 展示章节列表、切换章节 | 不保存正文 |
| `ChapterEditor` | 正文编辑、选区操作、触发 AI | 不拼装复杂 AI 上下文 |
| `CharacterPanel` | 展示角色卡、关系、口吻 | 不直接生成 AI 结果 |
| `AITaskPanel` | 展示任务队列、取消/重试 | 不决定正文如何合并 |
| `AIResultCard` | 展示结果、接受/保存/丢弃 | 不直接访问 Mock 数据 |
| `AILogDrawer` | 展示调用日志 | 不参与业务状态 |

---

## 六、STDD 开发方法论

### 6.1 定义

```
STDD = Spec & Test Driven Development（规格与测试驱动开发）
```

不是单纯 TDD，也不是单纯写需求文档。每个功能先形成三层约束：

| 层级 | 产物 | 作用 |
|------|------|------|
| Spec | 功能规格、验收标准、边界条件 | 确定要做什么 |
| Test | 单元测试、Provider 测试、组件行为测试 | 确定如何证明做对了 |
| Dev | 类型、Provider、Hook、UI 实现 | 完成可运行功能 |

### 6.2 标准开发顺序

```
1. 写 Spec: 明确用户故事、输入、输出、状态、失败场景
2. 写 Types: 定义领域模型和接口契约
3. 写 Tests: 先写 Provider/Hook/核心逻辑测试
4. 写 Mock: 用 Mock Provider 跑通完整数据流
5. 写 Dev: 实现真实组件和交互
6. Run Verify: 运行 typecheck/test/build
7. Review: 检查是否越界、是否直接依赖 Mock、是否破坏底座
```

### 6.3 Spec 模板

每个功能的 Spec 必须包含：

```text
Spec:
用户目标：
输入：
输出：
状态变化：
成功场景：
失败场景：
验收标准：
```

**示例（接受 AI 续写结果）**:

> 用户看到 AI 结果卡片后，可以点击"接受"，系统将结果追加到当前章节正文末尾，并更新字数和编辑时间。AI 结果状态变为 accepted。若章节不存在，应返回 ProviderError。
>
> Acceptance:
> 1. 正文追加 AI 文本。
> 2. wordCount 更新。
> 3. lastEditedAt 更新。
> 4. suggestion/task 状态更新。
> 5. 章节不存在时抛出 NOT_FOUND。
> 6. UI 不直接修改 mockChapters。

### 6.4 STDD 硬规则

1. 每个功能必须先写清楚 Spec，再实现代码
2. Spec 至少包含用户目标、输入、输出、状态变化、失败场景、验收标准
3. 新功能必须先确认属于 OpenCode 底座能力还是 StoryTree 业务扩展
4. 业务功能优先在 `packages/app/src/novel` 内实现
5. 不允许无 Spec 直接大规模改 UI
6. 不允许为了让测试通过而复制实现逻辑到测试里
7. 不允许只测成功路径，至少覆盖一个失败路径
8. 通过测试后仍必须运行对应 package 的 typecheck
9. 根目录禁止直接运行 `bun test`
10. 每次完成后必须输出 Spec、修改文件、验证命令和结果

---

## 七、Mock Provider 规范

### 7.1 Mock 分层

```
mock-data        静态种子数据
mock-provider    模拟真实数据访问
fake-agent       模拟 AI 任务执行
mock-delay       模拟网络/异步延迟
```

### 7.2 各层约束

| 层 | 可以做 | 不可以做 |
|----|---------|----------|
| `mock-data/` | 存放项目、章节、角色、AI 任务种子数据 | 写业务逻辑 |
| `providers/` | 复制 mock 数据、增删改查、抛错 | 暴露内部引用给 UI |
| `fake-agent.ts` | 模拟 AI 任务状态流 | 直接改章节正文 |
| `utils/mock-delay.ts` | 统一异步延迟 | 组件内随便写 `setTimeout` |

### 7.3 Mock Provider 设计原则

1. Provider 初始化时**复制** mock-data，避免污染原始数据
2. Provider 返回**对象副本**，避免 UI 拿到内部引用后直接污染状态
3. Provider 方法必须是 **async**，即使当前只是内存数据
4. Provider 必须**模拟合理延迟**
5. Provider 必须抛**统一 ProviderError**
6. Provider **不允许依赖组件状态**
7. Provider **不允许 import UI 组件**
8. Provider **不允许把 AI 结果直接写入正文**，必须通过明确方法接受

### 7.4 统一错误格式

```ts
type ProviderError = {
  code: "NOT_FOUND" | "INVALID_INPUT" | "DENIED" | "QUOTA" | "CONFLICT"
  message: string
  details?: unknown
}
```

### 7.5 Mock 必须覆盖的场景

| 场景 | 触发方式 |
|------|----------|
| 成功 | 普通输入 |
| 失败 | 输入包含 `fail` 或测试关键词 |
| 权限拒绝 | 输入包含权限类测试关键词 |
| 额度不足 | 调用次数超过阈值 |
| 取消 | 用户取消 running 任务 |
| 空输入 | 返回 `INVALID_INPUT` |
| 章节不存在 | 返回 `NOT_FOUND` |

---

## 八、AI Agent 规范

### 8.1 核心原则

AI 能力**不要直接嵌入按钮回调**。所有 AI 操作都必须走 AITask 协议。

### 8.2 AITask 状态机

所有 AI 功能必须遵守以下状态流转：

```
pending → running → success
                    → failed
                    → cancelled
                    → denied
                    → quota
```

### 8.3 AITask 协议

```ts
// 发起
type AITaskInput = {
  type: AITaskType      // continue-writing / rewrite-selection / summarize-chapter / character-voice ...
  chapterId: string
  text: string
  selectedText?: string
  characterId?: string
}

// 产出
type AITaskOutput = {
  text: string
  wordCount: number
}
```

### 8.4 AI 流程铁律

1. 所有 AI 调用必须创建 AITask
2. AITask 必须包含 type、chapterId、input、status、createdAt
3. 成功时返回 output，失败时返回 error
4. 必须支持 cancel
5. 必须支持 retry
6. 必须支持日志记录
7. **AI 结果必须由用户接受、保存或丢弃**
8. **AI 不直接覆盖用户正文**

正确流程：生成任务 → 产出结果 → UI 展示结果卡片 → 用户选择接受/保存/丢弃

### 8.5 扩展任务类型建议

| 任务类型 | 用途 |
|----------|------|
| `outline-chapter` | 根据大纲生成章节草稿 |
| `expand-scene` | 扩写场景 |
| `polish-style` | 润色文风 |
| `check-continuity` | 检查设定一致性 |
| `extract-timeline` | 提取时间线 |
| `character-dialogue` | 生成角色对话 |
| `summarize-project` | 汇总整本书进度 |

### 8.6 新增 AI 能力顺序

```
1. types/ai-task.ts 增加 AITaskType
2. fake-agent.ts 增加 mockTemplates 和生成逻辑
3. use-ai-task.ts 暴露调用方法
4. 组件中增加入口按钮
5. AIResultCard / AITaskPanel 中验证状态展示
6. 添加 provider 或 mock-data 测试
```

---

## 九、Hook 规范

### 9.1 定位

Hook 是 UI 与 Provider 之间的适配层。组件只消费 Hook 返回的 signal/resource/method，不直接 new Provider。

### 9.2 命名约定

```
use-novel-project.ts      # 项目管理
use-novel-chapters.ts      # 章节列表（待新增）
use-novel-characters.ts    # 角色管理
use-ai-task.ts             # AI 任务
use-ai-log.ts              # AI 日志
use-chapter-autosave.ts    # 自动保存（待新增）
use-editor-selection.ts    # 编辑器选区（待新增）
use-chapter-version.ts     # 版本历史（待新增）
```

### 9.3 Hook 应负责

- 加载、刷新、错误处理
- 提交、取消流程编排
- 给 UI 暴露响应式状态和方法

### 9.4 反模式迁移

```ts
// ❌ 错误：直接修改内部状态
chapter.content = content;
chapter.wordCount = content.length;

// ✅ 正确：通过 Provider/Hook
await saveChapter(chapter.id, content);
await refetchChapters();
```

---

## 十、测试规范

### 10.1 测试优先级

```
1. 类型和纯函数测试
2. Provider 测试        ← 最优先（决定数据契约）
3. Hook 测试
4. 组件行为测试
5. E2E 测试
```

### 10.2 测试硬规则

1. **不从 repo root 运行 `bun test`**
2. `packages/app` 内使用 `bun test` 或 `bun test:unit`
3. 测试真实实现，不复制实现逻辑
4. 每个 Provider 新增方法至少有成功路径 + 失败路径
5. 涉及 UI 的功能至少验证关键用户行为
6. 随机输出必须可控，不能导致测试不稳定

### 10.3 Provider 测试示例（NovelChapterProvider）

1. listChapters 按 orderIndex 排序
2. getChapter 找到时返回副本
3. getChapter 找不到时返回 null
4. saveChapter 更新 content 和 wordCount
5. draft 保存后变为 revising
6. acceptSuggestion 追加文本
7. suggestion 不存在时抛 NOT_FOUND

### 10.4 Mock 测试规范

| 项目 | 规范 |
|------|------|
| Mock 数据 | 必须覆盖正常、空列表、异常边界 |
| Mock 延迟 | 使用 `utils/mock-delay.ts` |
| Mock Agent | 必须覆盖成功、失败、权限拒绝、额度不足、取消 |
| 测试命名 | 与被测对象同目录，使用 `*.test.ts` |
| 数据隔离 | Provider 内部复制 mock 数据，避免测试互相污染 |

---

## 十一、验证命令清单

### 11.1 常用命令

| 场景 | 命令 |
|------|------|
| 安装依赖 | `bun install` |
| 根级类型检查 | `bun typecheck` |
| App 类型检查 | `cd packages/app && bun typecheck` |
| App 单元测试 | `cd packages/app && bun test` |
| App 测试 watch | `cd packages/app && bun test:unit:watch` |
| App 构建 | `cd packages/app && bun build` |
| App E2E | `cd packages/app && bun test:e2e` |
| 后端 dev server | `cd packages/opencode && bun run --conditions=browser ./src/index.ts serve --port 4096` |
| App dev server | `cd packages/app && bun dev -- --port 4444` |
| Desktop dev | `bun run --cwd packages/desktop tauri dev` |

### 11.2 本地 UI 验证流程

```
❌ 不要使用 opencode dev web（本地 UI/CSS 改动不会在那里显示）

✅ 正确流程：
   1. 后端: cd packages/opencode && bun run --conditions=browser ./src/index.ts serve --port 4096
   2. 前端: cd packages/app && bun dev -- --port 4444
   3. 浏览器打开 http://localhost:4444
```

### 11.3 禁止事项

- 不要主动重启用户已有 app/server 进程
- 不要从 root 运行 `bun test`（根目录脚本是 `echo 'do not run tests from root' && exit 1`）
- 不要直接运行 `tsc`（应使用 `bun typecheck`）

---

## 十二、开发工作流

### 12.1 Trae 标准执行流程

```
1. 阅读 packages/app/src/novel 当前结构
2. 明确本次只做一个垂直功能切片
3. 先修改 types，定义领域契约
4. 再修改 mock-data，补充测试数据
5. 再修改 providers，补充数据访问能力
6. 再修改 hooks，给 UI 暴露状态和动作
7. 最后修改 components，接入交互
8. 补充或更新测试
9. 运行类型检查和测试
10. 输出变更说明、风险点、下一步
```

### 12.2 每次任务完成必须输出

```text
- 本次改动目标
- 涉及文件
- 数据流说明
- 新增/修改的类型
- 新增/修改的 Provider 方法
- UI 行为变化
- 测试结果
- 未完成事项
- 是否触及 OpenCode 底座
```

### 12.3 禁止输出

- "我全面优化了项目"
- "我重构了架构"
- 空泛的大段总结
- 无法审查的描述

每次只允许**一个可验证目标**。

---

## 十三、优先路线图

### Phase 1: 重构章节数据流（当前推荐首个任务）

**目标**: 移除 NovelEditor 对 mockChapters 的直接修改

```
任务：重构小说编辑器章节数据流

验收标准：
1. 新增 hooks/use-novel-chapters.ts
2. Hook 内部使用 NovelChapterProvider 管理全部章节操作
3. NovelEditor 不再 import 或修改 mockChapters
4. ChapterList/ChapterEditor/AIResultCard 行为不变
5. Mock 模式可运行
6. 测试覆盖：保存章节、接受建议、章节不存在错误
```

### Phase 2: 编辑器基础能力

自动保存、字数统计、章节状态切换、选区获取、撤销提示、未保存提醒

### Phase 3: AI 写作闭环

续写、改写、总结、角色口吻、结果卡片、任务队列、失败重试、取消任务、日志抽屉

### Phase 4: 小说工程化能力

角色一致性、世界观设定、时间线、伏笔、章节大纲、版本历史、导入导出

### Phase 5: 接真实存储/Agent

此时只替换 Provider 实现，UI 和 Hook 尽量不动

---

## 十四、附录

### A. 来源文档索引

| 序号 | 文档 | 核心内容 |
|------|------|----------|
| 1 | `TabAI会话_1781156798969.md` | 项目边界、技术栈、代码风格、验证命令 |
| 2 | `TabAI会话_1781160970681.md` | 分层架构、Provider/Hook/UI/AI 规范、路线图 |
| 3 | `TabAI会话_1781161014976.md` | STDD 方法论、Mock 分层、测试规范 |

### B. 当前 novel 模块现状确认

已存在完整六层结构：

```
types/     → project.ts, chapter.ts, character.ts, ai-task.ts, ai-log.ts, sandbox.ts
mock-data/ → projects.ts, chapters.ts, characters.ts, ai-tasks.ts (+ mock-data.test.ts)
providers/ → novel-project.ts, novel-chapter.ts, novel-character.ts, ai-log.ts, fake-agent.ts (+ fake-agent.test.ts)
hooks/     → use-novel-project.ts, use-ai-task.ts, use-ai-log.ts
components/→ novel-editor/ (index, chapter-list, chapter-editor, character-panel,
              ai-task-panel, ai-log-drawer, ai-result-card) + mock-mode-banner
utils/     → mock-delay.ts
```

### C. 关键改进点（Phase 1 重点）

当前 `NovelEditor` 主组件中仍存在直接修改 `mockChapters` 的痕迹（handleSaveChapter、handleAcceptAIResult、handleSaveAIResult），需迁移至 Provider/Hook 模式。

---

*本文档由主控下发规则整合而成，作为 StoryTree 二次开发的最高约束文档。*

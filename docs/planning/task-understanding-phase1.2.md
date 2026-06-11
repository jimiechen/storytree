# Phase 1.2 任务理解汇报：创建新项目弹窗（CreateProjectModal）

> **我是**：GLM-5V-Turbo，本次任务：Phase 1.2 创建项目弹窗，职责范围：`caiode/opencode-1.4.0/packages/app/src/novel/`
> **当前积分**: 30/100 (危险)
> **状态**：📋 待评审

---

## 一、任务目标

替换 Phase 1.1 的 `CreateProjectPlaceholder` 占位组件，实现**完整的创建项目弹窗**，包含表单、校验和 Provider 接入。

### 1.1 用户目标

| 角色 | 目标 | 输入 | 输出 |
|------|------|------|------|
| 作者 | 快速创建小说项目 | 填写书名/类型/简介 | 项目被创建并出现在书架 |
| 作者 | 设定主角信息 | 填写主角姓名/性别/年龄/性格 | 主角数据随项目保存 |
| 作者 | 取消创建 | 点击取消按钮 | 弹窗关闭，无副作用 |

### 1.2 状态变化

```
用户在书架点击"创建新项目"
  → setView('create-project')
  → NovelShell 渲染 CreateProjectModal (替代 Placeholder)
  → 用户填写表单:
     - Tab 切换: 简易创作(推荐) / 创建新项目(完整)
     - 基本信息: 书名* / 类型* / 简介
     - 主角设定: 姓名 / 性别 / 年龄 / 性格
  → 校验: 必填项未填时禁用"创建"按钮
  → 点击"创建":
     → NovelProjectProvider.createProject(form) 被调用
     → 成功后 setView('bookshelf') + refetchProjects()
  → 点击"取消"/×:
     → setView('bookshelf') 关闭弹窗
```

---

## 二、范围界定

### 2.1 本阶段包含（In Scope）

| # | 功能 | 实现深度 | 依据 |
|---|------|---------|------|
| 1 | 弹窗容器（遮罩+居中模态框+标题栏+关闭） | 完整 | PRD 3.4 |
| 2 | Tab 切换（简易创作 / 创建新项目） | 完整 | PRD 3.4 |
| 3 | 基本信息表单（书名*/类型*/简介） | 完整 + 校验 | PRD 3.4 |
| 4 | 主角设定区域（姓名/性别/年龄/性格） | 完整 | PRD 3.4 |
| 5 | 底部按钮（取消/创建） | 完整 + 禁用逻辑 | PRD 3.4 |
| 6 | 表单校验（必填项未填→禁用提交） | 完整 | PLAN |
| 7 | Provider.createProject 方法 | 完整（Mock 写入 Map） | PLAN |
| 8 | 创建成功后自动返回书架并刷新 | 完整 | 最小闭环 |
| 9 | 替换 CreateProjectPlaceholder | 完整 | 继承自 Phase 1.1 |

### 2.2 本阶段不含（Out of Scope — 明确延期）

| 功能 | 延期到 | 原因 |
|------|--------|------|
| 世界观设定 Tab（WorldTab） | Phase 1.3b | 非最小闭环必需 |
| 故事情节 Tab（PlotTab） | Phase 1.3b | 需要大纲系统支撑 |
| 自定义设定高级功能 | Phase 2.x | 需要模板系统 |
| 目标读者选项（男频/女频） | Phase 1.x 后续 | 非核心字段 |
| 写作风格/故事主题选择器 | Phase 2.x | 需要配置体系 |
| 真实后端 API 接入 | Phase 2.x | Mock 阶段不需要 |
| 项目名称查重 | Phase 1.x 后续 | 非阻塞 |

### 2.3 底座保护区域（绝对不触碰）

```
❌ packages/opencode/    — Server/API/CLI 核心
❌ packages/sdk/          — SDK 协议
❌ packages/plugin/       — 插件接口
❌ packages/desktop/      — 桌面壳
❌ packages/ui/           — 全局 UI 库
```

---

## 三、现有资产分析

### 3.1 需替换的资产

| 文件 | 当前状态 | 操作 |
|------|---------|------|
| [create-project-placeholder.tsx](../caicode/opencode-1.4.0/packages/app/src/novel/components/create-project-placeholder.tsx) | 占位组件（25行） | **删除或重写**为完整 Modal |

### 3.2 需增强的资产

| 文件 | 当前状态 | 增强 |
|------|---------|------|
| [providers/novel-project.ts](../caicode/opencode-1.4.0/packages/app/src/novel/providers/novel-project.ts) | 无 createProject | **新增** `createProject(input)` 方法 |
| [providers/index.ts](../caicode/opencode-1.4.0/packages/app/src/novel/providers/index.ts) | INovelProjectProvider 接口 | **新增** `createProject` 方法签名 |
| [types/project.ts](../caicode/opencode-1.4.0/packages/app/src/novel/types/project.ts) | Project 接口 | **新增** `CreateProjectInput` 类型 |

### 3.3 可复用资产

| 资产 | 复用方式 |
|------|---------|
| useNovelView Hook | `setView('bookshelf')` 关闭弹窗 |
| useNovelProject Hook | `refetchProjects()` 刷新列表 |
| NovelShell | 已支持 `'create-project'` 视图渲染 |
| mock-data/projects.ts | 参考现有 Project 数据结构 |

---

## 四、STDD 执行计划

### Step 1: Types（类型定义）

| 文件 | 内容 | 行数估算 |
|------|------|---------|
| `types/project.ts` (改) | 新增 `CreateProjectInput`, `ProtagonistInput`, `GenreOption` | ~40 行新增 |
| `types/bookshelf.ts` (改) | 新增 `FormValidationError` 类型 | ~10 行新增 |

### Step 2: Tests（测试先行）

| 文件 | 用例数 | 覆盖内容 |
|------|--------|---------|
| `providers/novel-project.test.ts` (改) | 4-5 | createProject 成功/必填校验/ID生成/副本隔离 |
| `types/` 校验测试 | 2-3 | GenreOption 枚举完整性 / CreateProjectInput 结构 |

### Step 3: Mock（复用）

无需新增 Mock 数据。`createProject` 将新 Project 写入内部 Map，下次 `listProjects` 即可返回。

### Step 4: Dev（实现）

| 文件 | 操作 | 内容 |
|------|------|------|
| `providers/index.ts` (改) | INovelProjectProvider 新增 `createProject` | 方法签名 |
| `providers/novel-project.ts` (改) | 实现 `createProject` | 校验+生成ID+写入Map+返回副本 |
| `components/create-project-modal/index.tsx` | **新增** | Modal 主容器（遮罩+居中+标题栏+关闭） |
| `components/create-project-modal/form-tabs.tsx` | **新增** | Tab 切换栏（简易创作/创建新项目） |
| `components/create-project-modal/basic-info-form.tsx` | **新增** | 基本信息（书名*/类型*/简介） |
| `components/create-project-modal/protagonist-form.tsx` | **新增** | 主角设定（姓名/性别/年龄/性格） |
| `components/create-project-modal/modal-footer.tsx` | **新增** | 底部按钮（取消/创建+禁用逻辑） |
| `components/create-project-placeholder.tsx` | **删除** | 替换为完整 Modal |
| `components/index.ts` (改) | 导出更新 | CreateProjectModal 替代 Placeholder |

### Step 5: Verify（验证）

```bash
cd caiode/opencode-1.4.0/packages/app && bun test   # 全量通过
```

---

## 五、数据流设计

```
┌──────────────────────────────────────────────────────────┐
│                  CreateProjectModal                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Header: "创建新项目"                    [×关闭]    │  │
│  ├────────────────────────────────────────────────────┤  │
│  │  Tabs: [简易创作 推荐]  [创建新项目]               │  │
│  ├────────────────────────────────────────────────────┤  │
│  │                                                    │  │
│  │  BasicInfoForm                                     │  │
│  │  ├── 书名 *  [input: "给你的小说起个名字"]           │  │
│  │  ├── 类型 *  [dropdown: 玄幻/都市/穿越/...]        │  │
│  │  └── 简介    [textarea: "简单描述..."]              │  │
│  │                                                    │  │
│  │  ProtagonistForm                                   │  │
│  │  ├── 姓名    [input]                               │  │
│  │  ├── 性别    [radio: 男/女]                         │  │
│  │  ├── 年龄    [input: number]                        │  │
│  │  └── 性格    [textarea]                             │  │
│  │                                                    │  │
│  ├────────────────────────────────────────────────────┤  │
│  │  Footer:  [取消]                    [创建] (禁用/启用)│  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                          │
                          │ onClick "创建" (表单有效时)
                          ▼
┌──────────────────────────────────────────────────────────┐
│            useCreateProject() Hook (新增)                 │
│  formData: Signal<CreateProjectInput>                     │
│  errors: Signal<Record<string, string>>                   │
│  isValid: () => boolean                                  │
│  isSubmitting: Signal<boolean>                            │
│  createProject(): Promise<Project | null>                 │
│  resetForm(): void                                       │
└──────────────────────────────────────────────────────────┘
                          │
                          │ call
                          ▼
┌──────────────────────────────────────────────────────────┐
│         NovelProjectProvider.createProject(input)           │
│  1. 校验: name/gender 必填                                │
│  2. 生成 ID: 'proj-' + Date.now()                        │
│  3. 构建 Project 对象                                    │
│  4. 写入内部 Map                                         │
│  5. 返回 { ...project } 副本                              │
└──────────────────────────────────────────────────────────┘
                          │
                          │ success → setView('bookshelf')
                          │         + refetchProjects()
```

**关键约束**: UI 层 **禁止直接 import mock-data**，所有数据通过 Hook → Provider 获取。

---

## 六、文件行数预估与合规检查

| 文件 | 预估行数 | < 500? |
|------|---------|--------|
| types/project.ts (改) | ~50 (原11 + ~40新增) | ✅ |
| types/bookshelf.ts (改) | ~40 (原28 + ~10新增) | ✅ |
| providers/novel-project.ts (改) | ~60 (原44 + ~20新增) | ✅ |
| providers/novel-project.test.ts (改) | ~100 (原56 + ~45新增) | ✅ |
| components/create-project-modal/index.tsx | ~50 | ✅ |
| components/create-project-modal/form-tabs.tsx | ~30 | ✅ |
| components/create-project-modal/basic-info-form.tsx | ~80 | ✅ |
| components/create-project-modal/protagonist-form.tsx | ~70 | ✅ |
| components/create-project-modal/modal-footer.tsx | ~35 | ✅ |
| hooks/use-create-project.ts (可选) | ~50 | ✅ |

**预估总新增/修改**: ~550 行（含测试），每个文件均 < 500 行 ✅

---

## 七、Exit Criteria 验收标准

| # | 检查项 | 目标值 | 验证方法 |
|---|--------|--------|---------|
| 1 | 新增测试通过率 | 100% | `bun test` |
| 2 | 累计测试无回归 | 0 fail | 对比 Phase 1.1 的 338 pass |
| 3 | UI 不直接 import mock-data | 0 处 | Grep 验证 |
| 4 | 所有文件 < 500 行 | 100% | wc -l 检查 |
| 5 | OpenCode 底座未触碰 | 0 处 | git diff 范围检查 |
| 6 | 表单校验生效 | 必填未填→禁用提交 | 组件行为验证 |
| 7 | createProject 写入 Map 后 listProjects 可见 | 一致性 | Provider 测试 |
| 8 | Placeholder 已替换 | 旧文件不存在 | LS 验证 |
| 9 | STDD 顺序执行 | Types→Tests→Mock→Dev→Verify | 步骤记录 |

---

## 八、风险与依赖

| 风险 | 级别 | 缓解措施 |
|------|------|---------|
| 表单状态管理复杂度 | 中 | 使用 SolidJS createSignal 集中管理，不引入额外库 |
| createProject 与 listProjects 数据一致性 | 低 | 共享同一个 Map 存储实例 |
| Tab 切换暂只有一个有内容 | 低 | 第二个 Tab 显示 TBD 占位提示 |
| 弹窗动画/过渡效果 | 低 | Phase 1.x 不做 CSS 动画，纯条件渲染 |

---

*文档版本*: v1.0
*创建时间*: 2026-06-11
*状态*: ⏳ PENDING_REVIEW — 请审查后开始编码

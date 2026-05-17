# NOVEL-WORKTREE-AND-CANVAS.md

> **角色**: 项目协调 Agent (Kimi-K2.6)  
> **任务ID**: DOC-PHASE0-015  
> **日期**: 2026-05-15  
> **版本**: v1.0  
> **状态**: [READY_FOR_REVIEW]

---

## 一、需求校准

这套需求是三个独立子系统的组合：

```text
1. Worktree 沙箱 = 每个分支一份独立的小说工程数据 + 独立的 AI Agent 进程 + 独立的模型/Provider 配置
2. 小说画布（Canvas）= 每个分支里的故事可视化工作面（角色/场景/章节的图谱式呈现，类 Figma/白板）
3. 分支对话与对比合并 = 在 OpenCode chat 里跨分支查询进度、对比章节差异、做"小说分支合并"
```

灵感来源：

```text
- Claude Code 里 Fork agents、Worktree 模式（不同子 Agent 跑不同 worktree）
- Git worktree（同仓库多目录、多分支并行）
- AI 写作工具的"多结局/多版本探索"模式
- 白板类工具（FigJam、tldraw）做的故事画布
```

---

## 二、子系统可行性评估

### 2.1 Worktree 沙箱

**可行性**：高，和 Agent Runtime 架构天然契合。

**核心抽象**：

```text
NovelWorktree
  ├── id                         分支 id
  ├── projectId                  所属项目
  ├── branchName                 分支名（main / draft-A / explore-villain-arc）
  ├── workspacePath              磁盘上独立目录
  ├── agentSession               独立的 Agent Runtime 会话
  ├── providerConfig             独立的 LLM Provider 配置
  ├── status                     idle / writing / generating / merging / archived
  ├── lastActivityAt
  └── lockFile                   防止两个 Agent 同时写一个分支
```

**关键工程点**：

```text
1. 每个分支必须是磁盘上一份独立的工程数据，不能共享 store
2. 每个分支必须有独立的 Agent 上下文
3. Provider 配置必须挂在分支级，不在全局
4. 必须有 lock 机制，防止多个 chat 实例并发写同一个分支文件
```

**结论**：值得做，但不是 MVP，建议落在 M2 末或 M3 初。

---

### 2.2 小说画布 Canvas

**可行性**：中等，技术不难，难在"画什么"。

**第一版只做两种视图**：

```text
A. 故事结构图（章节-场景-镜头的树/网）
B. 角色关系图（角色之间的关系、立场、冲突）
```

**关键原则**：

```text
Canvas 是数据的"视图"，不是数据本身。
用户在 Canvas 上加节点 = 在小说数据里加 Scene/Character。
Canvas 不存独立的故事内容，永远从 NovelProject 派生。
```

**数据结构**：

```typescript
interface NovelCanvas {
  viewMode: 'structure' | 'character' | 'timeline' | 'free';
  viewport: { x: number; y: number; zoom: number };
  nodeOverrides: Record<string, { x: number; y: number; pinned?: boolean }>;
  // 节点和边都从故事数据派生，这里只存"用户的视图覆盖"
}
```

**结论**：值得做，但第一版只做"结构图视图"，作为 M2 的内容。

---

### 2.3 分支对话 + 分支对比 + 分支合并

**可行性**：

```text
分支对话（在 chat 里查询某个分支的进度）       ✅ 高
分支对比（看两个分支章节文本差异）             ✅ 高
分支合并（自动合并两个分支的小说内容）         ⚠️ 低，慎做
```

**分支合并的正确做法**：

```text
不要做自动 merge。
做"挑选式 cherry-pick"：以场景/镜头为粒度，让用户从分支 A 选 N 个场景、从分支 B 选 M 个场景，组装成一个新分支。
合并冲突 = "选哪个版本"，而不是"算法解决"。
```

**结论**：分支对话和分支对比可以做，分支合并要换个产品定义，全部建议落在 M3。

---

## 三、嵌入路线图

### 3.1 修订后的阶段表

```text
M1（第 1–2 周）：Novel MVP（单分支、单画布占位）        ← 范围不变
M2（第 3–4 周）：Worktree 数据骨架 + 结构图 Canvas v0
M3（第 5–8 周）：分支对话 + 分支对比 + 多分支模型配置 + Cherry-pick 合并 v0
M4（第 9–12 周）：Storyboard 插件 + Canvas 多视图 + 一致性检查
```

### 3.2 每阶段范围

**M1（Novel MVP）**

```text
做：
  单一项目 = 单一分支 = 单一画布
  数据形态预留 worktree 字段：内部用 defaultWorktreeId = 'main'
  Canvas 暂不实现 UI，但 NovelCanvas 数据结构在 types.ts 中预留
  Provider 配置先做项目级（后期可下沉到分支级）

明确不做：
  分支切换 / 分支创建 UI
  Canvas 渲染
  跨分支对话
  分支对比 / 合并
```

**M2（Worktree 骨架 + Canvas v0）**

```text
做：
  NovelWorktree 数据模型与磁盘布局
  分支创建 / 切换 / 重命名 / 归档 UI
  每分支独立的 Provider 配置（模型 + 密钥 + 温度）
  每分支独立的 Agent 会话与 chat 历史
  Canvas v0：结构图视图，节点 = 章节 / 场景，自动布局
  锁机制：分支级单写入

明确不做：
  分支对比 UI
  分支合并
  Canvas 多视图
```

**M3（分支对话 + 对比 + Cherry-pick）**

```text
做：
  Chat 里支持 @branch 语法跨分支查询
  章节 / 场景 / 镜头三档 diff 视图
  Cherry-pick 合并：以场景/镜头为粒度组装新分支
  AI 冲突辅助：选 A / 选 B / 改写折中
  Canvas 加角色关系视图

明确不做：
  自动 merge
  全文 AI 改写式合并
```

**M4（Storyboard 插件 + 一致性 + 多视图）**

```text
做：
  Storyboard Studio Plugin 接入 Canvas（分镜流图）
  Consistency Checker Lite：跨分支角色 / 地点描述漂移
  Canvas 时间线视图

明确不做：
  自由白板（推迟）
  云同步
  协作
```

---

## 四、Worktree 与 Git 的关系

**不用真正的 git worktree**。

```text
真正用 git worktree：
  优点：用户的小说目录就是一个 git 仓库，原生版本控制
  缺点：
    - 二进制资产（图像/视频）爆仓库
    - 用户不一定懂 git
    - .novelproj 目录结构和 git 工作目录强耦合，未来云同步麻烦

不用 git worktree（推荐）：
  自己实现"逻辑分支"概念，每个分支是 worktrees/ 下的一个子目录
  自己实现 fork / diff / cherry-pick
  概念上叫 "Worktree" 是借词，向用户传达"独立沙箱"语义
```

---

## 五、Provider 配置下沉到分支

```text
Provider 配置必须挂在 Worktree 级，不在 Project 级，更不在 Global 级
当用户在分支 A 跑一个 Skill 时，Agent 必须读 worktreeA.providerConfig 而不是全局
分支切换 = Agent 实例切换 = Provider 实例切换
```

**解析顺序**：worktree.providerConfig → project.defaultProvider → global.fallback

**UI 设计**：

```text
分支创建对话框最下方有"模型配置"折叠区
默认继承父分支配置
可以点"覆盖"独立指定模型 / 温度 / 上下文窗口大小
分支顶部 Tab 永远显示当前分支用的模型名（小标签）
```

---

## 六、Canvas 技术选型

```text
首选：tldraw（开箱即用 + Solid 集成需自己包一层）
次选：自己用 SVG + dagre / elk.js 做自动布局
不选：Konva / Pixi（过重，故事画布不需要 60fps WebGL）
```

---

*[READY_FOR_REVIEW]*

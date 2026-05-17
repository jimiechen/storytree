# Week 0：AI 小说编辑器二开可行性检查报告

**文档版本**: v1.0 (2026-05-05 最终版)
**检查日期**: 2026-05-03 ~ 2026-05-05
**检查人**: DevOps 工程师 (GLM-5V-Turbo)
**数据来源**: opencode v1.4.0 源码静态分析 + 实际运行验证

---

## 1. 检查结论

**初步可行，基础工程已通过验证，适合作为 Week 1 Mock 接入阶段的基础。**

opencode v1.4.0 源码结构完整、工程化成熟、构建运行链路已全部跑通。AI 小说编辑器可通过 Workspace Mode / 新页面 / Panel 等方式接入，Mock + Provider 抽象 + FakeAgentProvider 路线风险可控。

> ⚠️ **范围限定**: 本结论基于源码分析和基础运行验证，不代表真实 Agent 接入、权限边界、沙箱限制等已经完成。

---

## 2. 推荐接入方式 (按优先级)

| 优先级 | 接入方式 | 可行性 | 推荐程度 | 说明 |
|--------|---------|:------:|:-------:|------|
| **1** | **Workspace Mode** | 高 | **强推荐** | 最符合 opencode 工作区形态，适合承载小说项目 |
| **2** | **新页面** | 高 | **推荐** | 适合快速做小说编辑器独立界面 |
| **3** | **Panel / Sidebar** | 中高 | 推荐 | 适合 AI 任务、角色卡、章节信息辅助面板 |
| 4 | Provider 抽象 | 高 | 强推荐 | 业务层隔离的关键，必须做 |
| 5 | FakeAgentProvider | 高 | 强推荐 | 模拟 AI 续写、改写、摘要等 |
| 6 | 插件机制 | 中 | 暂缓 | 需进一步确认插件边界 |
| 7 | 真实 Agent 接入 | 中 | 暂缓 | 权限/工具/沙箱未完成前不接 |
| 8 | 真实模型调用 | 中 | 暂缓 | Week 1 不引入成本和网络问题 |

### 为什么 Workspace Mode 优先？

1. **原生支持**: opencode 已有完整的 workspace 管理 (`control-plane/workspace.ts`)
2. **项目概念契合**: 小说项目天然符合 workspace 的"目录+配置"模型
3. **扩展点清晰**: 可定义 `novel-project` workspace type
4. **非侵入式**: 不需要修改 opencode 核心源码，只需添加 adaptor

---

## 3. Mock 模式开发路线

Week 1 应严格遵循 Mock 模式：

```
✅ 允许:
  - 读取文件、检查目录结构
  - 创建新文件（在 caiode 自有目录下）
  - 定义接口和类型
  - 实现 Fake/Mock 类
  - 输出分析文档和测试报告

❌ 禁止:
  - 接真实 Agent
  - 调用真实模型 API
  - 执行真实远程请求
  - 修改 opencode 上游核心源码
  - 提交 node_modules 或临时文件
  - 把"未实际验证"写成"已完成"
```

---

## 4. 最小业务对象 (Week 1 范围)

| 对象 | 用途 | Week 1 是否需要 | 字段示例 |
|------|------|:-------------:|---------|
| **Project** | 小说项目 | **必需** | id, name, path, type, metadata |
| **Sandbox** | 创作沙箱/世界观空间 | **必需** | id, projectId, name, settings |
| **Chapter** | 章节 | **必需** | id, title, content, order, status |
| **Character** | 角色 | **必需** | id, name, description, traits, voice |
| **AITask** | AI 任务状态 | **必需** | id, type, status, input, output, createdAt |
| **AILog** | AI 调用记录 | **必需** | taskId, provider, model, prompt, response, duration |

**范围控制**: 不要在 Week 1 扩展灵感库、剧情树、多 Agent 协作、版本分支、发布系统等。

---

## 5. Provider 抽象草案

只写职责和方法名，不写实现代码：

```typescript
// NovelProjectProvider - 项目管理
interface NovelProjectProvider {
  listProjects(): Promise<Project[]>
  getProject(id: string): Promise<Project>
  createProject(data: CreateProjectInput): Promise<Project>
}

// NovelChapterProvider - 章节管理
interface NovelChapterProvider {
  listChapters(projectId: string): Promise<Chapter[]>
  getChapter(id: string): Promise<Chapter>
  saveChapter(id: string, content: string): Promise<void>
  writeAIResult(chapterId: string, result: string): Promise<void>
}

// NovelCharacterProvider - 角色管理
interface NovelCharacterProvider {
  listCharacters(projectId: string): Promise<Character[]>
  getCharacter(id: string): Promise<Character>
  updateCharacter(id: string, data: Partial<Character>): Promise<void>
}

// NovelAgentProvider - AI 任务 (核心)
interface NovelAgentProvider {
  submitTask(task: AITaskInput): Promise<AITask>
  getTaskStatus(taskId: string): Promise<AITask>
  cancelTask(taskId: string): Promise<void>
}

// NovelSyncProvider - 同步 (Week 1 仅 Mock)
interface NovelSyncProvider {
  syncToLocal(): Promise<void>
  syncToRemote(): Promise<void>
}
```

---

## 6. FakeAgentProvider 模拟行为

`NovelAgentProvider` 在 Week 1 应先接 `FakeAgentProvider`，模拟以下场景：

| 场景 | 模拟结果 | 返回值示例 |
|------|---------|-----------|
| **AI 续写成功** | 返回续写文本 | `{ status: "success", content: "...续写内容..." }` |
| **AI 改写成功** | 返回改写后文本 | `{ status: "success", content: "...改写后..." }` |
| **AI 摘要成功** | 返回章节摘要 | `{ status: "success", summary: "本章讲述..." }` |
| **角色语气改写** | 返回角色对话 | `{ status: "success", dialogue: "..." }` |
| **任务失败** | 错误状态和信息 | `{ status: "failed", error: "模型超时" }` |
| **用户取消** | 取消状态 | `{ status: "cancelled" }` |
| **权限不足** | 权限拒绝 | `{ status: "permission_denied", error: "..." }` |
| **配额不足** | 配额限制 | `{ status: "quota_exceeded", error: "..." }` |
| **长任务处理中** | 运行中状态 | `{ status: "running", progress: 0.6 }` |

**意义**: 在没有真实 AI 的情况下，把产品体验、任务流、异常处理和日志系统先跑通。

---

## 7. AgentBridge 安全边界

### 允许的工具 (小说编辑器所需)

| 工具 | 用途 | 风险等级 |
|------|------|---------|
| Read | 读取章节文件 | 低 |
| Edit | 编辑章节草稿 | 低 |
| Write | 写入 AI 结果到建议区 | 低 |
| Glob | 搜索文件 | 低 |
| Grep | 内容搜索 | 低 |
| 小说专用工具 | 自定义业务工具 | 低 |

### 禁用的工具 (高风险)

| 工具 | 原因 | 风险等级 |
|------|------|---------|
| Bash | 命令执行 | 🔴 高 |
| WebFetch | 远程请求 | 🔴 高 |
| WebSearch | 网络搜索 | 🟡 中 |
| Agent | 子 Agent 调用 | 🔴 高 |
| Task | 任务调度 | 🔴 高 |
| 环境变量读取 | 信息泄露 | 🟡 中 |
| 系统目录访问 | 安全边界 | 🔴 高 |
| 沙箱外路径访问 | 隔离破坏 | 🔴 高 |

---

## 8. 风险点

| 风险项 | 等级 | 影响 | 缓解措施 |
|--------|------|------|---------|
| 真实 Agent 权限边界未实现 | 中 | Week 2+ 问题 | Week 1 只用 FakeAgentProvider |
| 沙箱限制未验证 | 中 | Week 2+ 问题 | 先限定操作路径在项目目录内 |
| 数据结构可能演进 | 低 | 返工风险 | Mock 数据结构认真设计，作为未来雏形 |
| opencode 版本升级兼容性 | 低 | 上游变更 | 不修改上游核心源码 |
| 多平台适配 | 低 | 当前仅 Windows | 后续验证 macOS/Linux |

---

## 9. Week 1 建议

只有在 Week 0 依赖和构建验证完成后（✅ 已完成），才进入以下任务：

### Week 1 主线任务 (按顺序)

1. **创建功能分支**: `feat/week1-mock-provider-novel-editor`
2. **实现 FakeAgentProvider**: 模拟 8 种 AI 任务状态
3. **实现首个 Novel Tool**: read_chapter / write_chapter
4. **扩展 Workspace UI**: novel-project 类型 + 侧边栏入口
5. **验证最小闭环**: Mock 数据 → Provider → 页面 → FakeAgent → 结果展示

### Week 1 通过标准

| 检查项 | 通过标准 |
|--------|---------|
| Mock 项目数据 | 能加载 1 个小说项目 |
| Mock 章节数据 | 能显示至少 3 个章节 |
| Mock 角色数据 | 能显示至少 3 个角色 |
| Provider 抽象 | UI 不直接依赖静态数据文件 |
| FakeAgentProvider | 能模拟续写、改写、摘要、失败、取消 |
| AITask 状态 | 能展示 pending/running/success/failed/cancelled |
| AILog | 能记录任务输入、输出、状态、时间 |
| 编辑器写回 | AI 结果能进入建议区或草稿区 |
| 权限边界 | 不调用真实 Bash/WebFetch/WebSearch/Agent/Task |
| 构建验证 | typecheck/build 仍然通过 |

---

*文档完成时间: 2026-05-05 19:29:00*
*状态: [READY_FOR_REVIEW]*

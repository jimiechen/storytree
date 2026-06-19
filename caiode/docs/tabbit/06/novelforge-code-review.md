# NovelForge 方案评审意见 — 代码实现差距分析

**基于 `packages/app/src/novel` 实际代码，对三份方案文档的逐项对标评审**

| 项目 | 内容 |
|---|---|
| 文档类型 | 方案评审 / 代码审计 |
| 创建日期 | 2026-06-18 |
| 评审对象 | novelforge-scheme-review.md + novelforge-workflow-optimization.md + novelforge-mvp-plan.md |
| 代码基线 | opencode-1.4.0/packages/app/src/novel（共 ~130 文件） |

---

## 总体评估

### 一句话结论

**方案文档描述的是"AI 原生小说操作系统"，实际代码是一个"高质量 UI 原型"——两者之间存在断层级的差距。**

| 维度 | 方案承诺 | 代码现状 | 差距评级 |
|------|---------|---------|---------|
| 架构成熟度 | 15 项 Claude Code 级核心机制 | 前端 UI 组件库 | **严重脱节** |
| 数据持久化 | YAML + Git Worktree + DailyLog | 全量内存 Map（刷新即失） | **未启动** |
| AI 能力 | 多模型路由 + 流式执行 + Agent 协作 | FakeAgent 模板返回（setTimeout 模拟） | **零真实集成** |
| 领域深度 | 角色档案 YAML + 伏笔追踪 + 世界观引擎 | 基础 CRUD 类型定义 | **骨架阶段** |
| 工程质量 | STDD + 500 行限制 + 测试 > 80% | 分层清晰、部分有测试、存在冗余文件 | **良好基础** |

### 代码亮点（在指出问题前先肯定）

1. **分层架构严格执行**：types → mock-data → providers → hooks → components 五层分离，符合 STDD 方法论
2. **组件丰富度超出预期**：书架/角色面板/世界观/编辑器/工作区/Guide/Profile/Achievements 共 90+ 组件
3. **AI 任务协议设计合理**：AITask 的 pending → running → success/failed/cancelled/denied/quota 七状态机覆盖完整
4. **Hook 层响应式设计规范**：SolidJS createStore/createResource 用法正确，避免多 signal 反模式
5. **测试意识存在**：use-novel-outline / use-ai-task / use-novel-project / use-workspace 等有 .test.ts

---

## 第一章：逐项机制对标评审

### 1.1 Hook 增强系统（方案 P0）

| 检查项 | 方案描述 | 代码现状 | 判定 |
|--------|---------|---------|------|
| 敏感词拦截 | tool.execute.before 中注入 Aho-Corasick 匹配 | **零实现**。Grep "sensitive\|敏感词" 无任何命中 | ❌ 未启动 |
| 一致性预检 | 角色行为矛盾检测 | **零实现**。Grep "consistency\|一致性" 无业务逻辑命中 | ❌ 未启动 |
| 风格匹配检查 | 风格相似度计算 + styleHint 注入 | **零实现** | ❌ 未启动 |
| 条件触发 | 按 toolName glob 匹配 | OpenCode 底层支持 `tool.execute.before` 钩子，但 novel 插件层未接入 | ⚠️ 底座可用 |

**评审意见**：

> Hook 系统是三份方案共同认定的 P0 最高优先级，但代码中**完全缺失**。好消息是 OpenCode 底座的插件系统已提供 `tool.execute.before` 和 `tool.execute.after` 钩子（[opencode-storytree.md](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/../../../AGENTS.md) 确认），技术路径清晰。
>
> **建议立即行动**：创建 `src/hooks/` 目录下的 `sensitive-word-hook.ts` 和 `consistency-check-hook.ts`，作为首个接入 OpenCode 插件系统的 NovelForge 扩展。这是从"UI 原型"到"AI 原生编辑器"的关键跨越点。

### 1.2 Named Subagents（方案 P0）

| 检查项 | 方案描述 | 代码现状 | 判定 |
|--------|---------|---------|------|
| 角色审校 Agent | @character-checker Markdown 定义 | **零实现**。无 `.novelforge/agents/` 目录 | ❌ 未启动 |
| 世界观检查 Agent | @world-checker Markdown 定义 | **零实现** | ❌ 未启动 |
| 工具白名单 | read:true / write:false 控制 | **零实现** | ❌ 未启动 |
| @mention 调用 | @agent-name 语法 | **零实现** | ❌ 未启动 |

**评审意见**：

> 当前 [FakeAgentProvider](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/providers/fake-agent.ts) 是一个单体类，处理所有 AI 任务类型（continue-writing / rewrite-selection / summarize-chapter / character-voice）。方案要求将其拆分为专业化 Subagent，这是一个**架构升级**而非功能修补。
>
> **关键差距**：FakeAgentProvider 的 `submitTask` 方法是扁平的，没有 agent 路由逻辑。需要引入 Agent Registry + Dispatcher 层。

### 1.3 Daily-Log 记忆系统（方案 P0）

| 检查项 | 方案描述 | 代码现状 | 判定 |
|--------|---------|---------|------|
| 记忆文件结构 | .novelforge/memory/logs/YYYY/MM/*.md | **零实现**。无 memory/ 目录 | ❌ 未启动 |
| session.idle 写入 | 自动提取关键变更 | **零实现** | ❌ 未启动 |
| session.created 读取 | 注入历史记忆到 system prompt | **零实现** | ❌ 未启动 |
| 7 天滚动窗口 | 限制加载范围 | **零实现** | ❌ 未启动 |

**评审意见**：

> 所有 Provider 使用 `new Map()` 内存存储，项目关闭即数据丢失。这与方案中"跨会话角色状态持久化"的核心目标直接矛盾。
>
> **当前代码中的唯一"记忆"痕迹**：[chapter-info-panel.tsx:97](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/chapter-info-panel.tsx#L97) 有一个名为 "memory" 的图标，但这只是 UI 装饰，无实际功能。

### 1.4 Skills 渐进式披露系统（方案 P0）

| 检查项 | 方案描述 | 代码现状 | 判定 |
|--------|---------|---------|------|
| Skill 文件格式 | YAML frontmatter + Markdown 知识库 | **零实现**。无 skills/ 目录 | ❌ 未启动 |
| match 条件 | glob 文件匹配 + regex 内容匹配 | **零实现** | ❌ 未启动 |
| 加载引擎 | 发现 → 匹配 → 加载 → 缓存 | **零实现** | ❌ 未启动 |
| 古风/科幻/悬疑 Skill | 3 个基础 Skill | **零实现** | ❌ 未启动 |

**评审意见**：

> 这是方案中"竞争壁垒最高"的特性（方案评审矩阵给"极高"用户价值 + "高"竞争壁垒），但代码中完全没有对应实现。
>
> **类型系统中也没有 Skill 相关定义**：[types/index.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/types/index.ts) 导出了 23 种类型，但没有 Skill 类型。

### 1.5 Commands 三层指令体系（方案 P0）

| 检查项 | 方案描述 | 代码现状 | 判定 |
|--------|---------|---------|------|
| /outline generate | 结构化大纲生成 | **部分等价**：workspace-view-model.ts 有 `submitOutlineTask` 但非 CLI 式命令 | ⚠️ UI 替代 |
| /continue | 续写指令 | **部分等价**：editor-ai-floating-toolbar 有"续写"按钮 | ⚠️ UI 替代 |
| /branch create/list/switch | 分支管理 | **零实现** | ❌ 未启动 |
| /review consistency | 一致性审校 | **零实现** | ❌ 未启动 |
| /export epub/pdf | 导出功能 | **零实现** | ❌ 未启动 |
| /model switch | 模型切换 | **部分等价**：generation-config.ts 有模型下拉选择 | ⚠️ UI 替代 |

**评审意见**：

> 代码中有 [AIWritingCommand](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/types/editor.ts#L18) 类型（continue / rewrite / expand / polish / summarize）和对应的 [EditorAIFloatingToolbar](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/editor-ai-floating-toolbar.tsx) 组件，这是"Commands"的 UI 版本。
>
> **差距**：方案设计的 `/command` 是一个完整的指令体系（20+ 命令，含 local/prompt/local-jsx 三种类型），而当前只有 5 个编辑器内嵌按钮。从"工具栏按钮"到"指令系统"的距离不亚于从头构建。

### 1.6 StreamingToolExecutor（方案 P0）

| 检查项 | 方案描述 | 代码现状 | 判定 |
|--------|---------|---------|------|
| 边收边跑 | tool_use block 解析完即执行 | **未实现**。FakeAgent 用 setTimeout 一次性返回 | ❌ 模拟 |
| 状态机 | queued → executing → completed → yielded | **未实现**。只有 pending → running → terminal | ❌ 简化版 |
| tombstone 清理 | 中断时清理孤儿消息 | **未实现** | ❌ 未启动 |
| fallback 模型切换 | 流式失败时降级 | **未实现** | ❌ 未启动 |

**评审意见**：

> [FakeAgentProvider](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/providers/fake-agent.ts#L56-L67) 的 `simulateTaskExecution` 方法用 `setTimeout(1000~2000ms)` 模拟网络延迟，然后一次性调用 `completeTask`。这不是流式执行，而是"延迟批处理"。
>
> **但架构预留尚可**：`onTaskUpdate(callback)` 监听器模式可以扩展为真正的 SSE 流式推送，无需重构组件层。

### 1.7 多分支故事引擎（方案 P0 → 原创）

| 检查项 | 方案描述 | 代码现状 | 判定 |
|--------|---------|---------|------|
| Git Worktree 隔离 | 物理文件系统隔离 | **零实现**。Grep "worktree\|WorkTree" 无业务命中 | ❌ 未启动 |
| What-if 分支 | 平行世界管理 | **零实现** | ❌ 未启动 |
| /branch CLI | 分支操作命令集 | **零实现** | ❌ 未启动 |
| branch diff/compare | AI 对比差异 | **零实现** | ❌ 未启动 |

**评审意见**：

> 多分支故事引擎被方案评审标记为"极高竞争壁垒"的核心差异化特性，也是"没有任何现有编辑器支持"的蓝海功能。当前代码中完全空白。
>
> **技术风险提示**：Git Worktree 在 Windows 上的文件系统兼容性（长路径、中文文件名、大小写敏感性）需要提前验证。建议在 Phase 2 启动前完成 PoC。

### 1.8 九种 Continue 语义（方案 P1）

| 检查项 | 方案描述 | 代码现状 | 判定 |
|--------|---------|---------|------|
| continue / yield / abort | 基础控制流 | **部分实现**：AITaskStatus 有 success/failed/cancelled | ⚠️ 子集 |
| ask_followup | 主动追问 | **未实现** | ❌ 未启动 |
| switch_mode | 模式切换 | **未实现** | ❌ 未启动 |
| delegate | 委托子 Agent | **未实现** | ❌ 未启动 |
| retry / fallback | 重试与降级 | **未实现** | ❌ 未启动 |
| compact | 触发压缩 | **未实现** | ❌ 未启动 |

**评审意见**：

> 当前 AITaskStatus 只有 7 种状态（pending/running/success/failed/cancelled/denied/quota），缺少 yield / ask_followup / switch_mode / delegate / retry / fallback / compact 等"中间态"和"控制态"。对于 MVP 来说，现有 7 种状态够用，但扩展性不足。

### 1.9 四级错误恢复（方案 P1）

| 检查项 | 方案描述 | 代码现状 | 判定 |
|--------|---------|---------|------|
| Retry | 同模型重试 | **未实现** | ❌ 未启动 |
| Fallback | 切换备用模型 | **未实现** | ❌ 未启动 |
| Degrade | 降级功能 | **部分模拟**：FakeAgent 有 quota/denied 状态 | ⚠️ Mock |
| Abort | 终止任务 | **已实现**：cancelTask 方法 | ✅ 可用 |

**评审意见**：

> FakeAgentProvider 的 [shouldFail/shouldDeny/shouldQuotaExceeded](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/providers/fake-agent.ts#L140-L152) 方法提供了测试用的错误场景模拟，这是好的测试工程实践。但这些是硬编码的 mock 逻辑，不是生产级错误恢复策略。

### 1.10 五级上下文压缩（方案 P1）

| 检查项 | 方案描述 | 代码现状 | 判定 |
|--------|---------|---------|------|
| L1 Tool Result Budget | 截断工具输出 | **未实现** | ❌ 未启动 |
| L2 History Snip | 移除最早消息 | **未实现** | ❌ 未启动 |
| L3 Microcompact | 合并同类消息 | **未实现** | ❌ 未启动 |
| L4 Context Collapse | 历史压缩为摘要 | **未实现** | ❌ 未启动 |
| L5 Autocompact | 全量重构 | **未实现** | ❌ 未启动 |

**评审意见**：

> 整个代码库中 Grep "compress\|compaction\|collapse" 仅在 [chapter-paper-editor.tsx:132](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/chapter-paper-editor.tsx#L132) 命中一个 UI 图标名（折叠/展开编辑器的按钮图标），与上下文压缩无关。
>
> **优先级调整建议**：五级上下文压缩是"长篇小说"场景的核心需求（10 万字+ 项目）。当前代码全部运行在内存中，上下文 = 全量 Map 数据，不存在 token 预算概念。在接入真实 LLM API 之前，此项可暂缓。

### 1.11 QueryEngine 七阶段循环（方案 P1）

| 检查项 | 方案描述 | 代码现状 | 判定 |
|--------|---------|---------|------|
| Context Projection | 领域定制投影 | **未实现** | ❌ 未启动 |
| Auto-Compaction Check | 自动压缩检查 | **未实现** | ❌ 未启动 |
| API Streaming | API 流式调用 | **未实现**（FakeAgent 用 setTimeout） | ❌ Mock |
| Error Recovery | 错误恢复 | **未实现** | ❌ 未启动 |
| Tool Execution | 工具执行 | **N/A**（前端无工具执行概念） | N/A |
| Attachment Processing | 附件处理 | **未实现** | ❌ 未启动 |
| Continuation Decision | 继续决策 | **未实现** | ❌ 未启动 |

**评审意见**：

> QueryEngine 是 Claude Code 的服务端编排引擎，属于后端架构。当前代码纯前端，不存在 QueryEngine 的对应物。此项需要在接入 OpenCode 后端 Agent Loop 时才适用。

### 1.12 多模型智能路由（方案 P1）

| 检查项 | 方案描述 | 代码现状 | 判定 |
|--------|---------|---------|------|
| 路由决策矩阵 | 按任务类型选模型 | **部分**：generation-config.ts 有模型下拉（豆包/GPT-4/Claude 3） | ⚠️ 手动选择 |
| 75+ 模型支持 | 大规模模型池 | **4 个硬编码选项** | ❌ 差距巨大 |
| 成本优化 | 动态成本平衡 | **未实现** | ❌ 未启动 |
| 用户反馈优化 | 路由策略迭代 | **未实现** | ❌ 未启动 |

**评审意见**：

> [AI_MODEL_OPTIONS](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/types/generation-config.ts#L9) 硬编码了 `['豆包', '通义千问', 'DeepSeek', 'GLM-4']` 四个选项，而 [workspace-generation-form.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/generation/workspace-generation-form.tsx#L24) 又硬编码了 `['豆包', 'GPT-4', 'Claude 3']` —— **两处模型列表不一致**，这是一个明显的 bug。

### 1.13 Buddy 写作伙伴（方案 P2）

| 检查项 | 方案描述 | 代码现状 | 判定 |
|--------|---------|---------|------|
| 终端电子宠物 | Agent 状态可视化 | **未实现** | ❌ 未启动 |
| 自定义外观 | 用户个性化 | **未实现** | ❌ 未启动 |
| 写作鼓励 | 达成目标时反馈 | Achievements 组件存在，但不与写作目标关联 | ⚠️ 部分 |

### 1.14 伏笔追踪系统（方案 P1 → 原创）

| 检查项 | 方案描述 | 代码现状 | 判定 |
|--------|---------|---------|------|
| Foreshadowing 类型 | id/description/planted/resolved/status | **零实现**。Grep "foreshadow\|伏笔" 无类型定义 | ❌ 未启动 |
| 伏笔列表 UI | /foreshadow list | **未实现** | ❌ 未启动 |
| 笔回收检测 | deadline_chapter 超期提醒 | **未实现** | ❌ 未启动 |

**评审意见**：

> 方案文档中设计了完整的 [foreshadowing.yaml](file:///c:/projects/storytree/caiode/docs/tabbit/06/novelforge-scheme-review.md#L263-L279) 数据结构，但 types/ 目录下没有对应定义。考虑到伏笔追踪是小说编辑器区别于通用文本编辑器的**核心领域功能**，建议尽早补齐类型定义。

### 1.15 多语言 UI（方案 P0）

| 检查项 | 方案描述 | 代码现状 | 判定 |
|--------|---------|---------|------|
| i18n 框架 | locales/{lang}/ 翻译文件 | **未实现**。无 locales/ 目录 | ❌ 未启动 |
| 语言切换 | 运行时切换 | **未实现** | ❌ 未启动 |
| 中文/英文/日文/韩文 | 4 语言 MVP 目标 | **全部硬编码中文**（zh-CN） | ❌ 仅中文 |
| RTL 预留 | 阿拉伯语/希伯来语 | **未实现** | ❌ 未启动 |

**评审意见**：

> 代码中存在大量硬编码中文字符串：
> - "请选择一个章节"（出现 2 次）
> - "AI 正在生成内容..." / "等待 AI 处理..."
> - "采纳" / "存为灵感" / "忽略"
> - "目标字数" / "字数容差" / "参考章节数" / "AI模型"
> - 所有 `toLocaleDateString('zh-CN')` 调用（12 处）
>
> **好消息**：字符串集中在组件层，尚未抽象出 i18n key，这意味着**现在切入 i18n 的成本最低**（不需要做 key 迁移，直接新建 i18n 系统即可）。

### 1.16 Ultraplan 远程卸载 & Agent Teams（方案 P2）

两项均为高难度、低优先级的远期规划。当前代码无需关注。

---

## 第二章：代码质量专项审计

### 2.1 正面发现

| # | 发现 | 位置 | 评价 |
|---|------|------|------|
| 1 | Provider 返回对象副本（防止 UI 污染） | [novel-character.ts:15](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/providers/novel-character.ts#L15) `{ ...c, relationships: [...c.relationships] }` | 符合 STDD Mock 规范 |
| 2 | AI 结果不自动覆盖正文 | [novel-chapter.ts:72](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/providers/novel-chapter.ts#L72) `acceptSuggestion` 才追加 | 符合 AI Agent 规则 |
| 3 | 统一 ProviderError 类型 | [provider-error.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/types/provider-error.ts) | 错误处理规范化 |
| 4 | ViewModel 模式隔离 UI 状态 | [workspace-view-model.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/workspace-view-model.ts) | 关注点分离良好 |
| 5 | 上下文参考配置可扩展 | [generation-config.ts:24-31](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/types/generation-config.ts#L24-L31) DEFAULT_CONTEXT_REFS | 为未来上下文压缩预留接口 |

### 2.2 问题清单

| # | 问题 | 严重度 | 位置 | 说明 |
|---|------|--------|------|------|
| **P0-1** | **模型列表硬编码不一致** | High | [generation-config.ts:9](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/types/generation-config.ts#L9) vs [workspace-generation-form.tsx:24](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-workspace/generation/workspace-generation-form.tsx#L24) | 前者：豆包/通义千问/DeepSeek/GLM-4；后者：豆包/GPT-4/Claude 3。必须统一为单一数据源 |
| **P0-2** | **sedfoXtUC 冗余文件** | Medium | [novel-editor/sedfoXtUC](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/components/novel-editor/sedfoXtUC) | 与 index.tsx 高度重复（~100 行相同代码），疑似临时文件误提交。应删除 |
| **P0-3** | **Provider 单例全局状态** | Medium | 所有 Provider 在模块顶层 `new XxxProvider()` | SolidJS 服务端渲染（SSR）场景下可能导致内存泄漏。应考虑依赖注入或 context 管理 |
| **P1-1** | **Character 类型缺字段** | Low | [character.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/types/character.ts) | 缺少方案中的 aliases / age / appearance / MBTI / speech_pattern / arc 字段。当前仅 name/role/personalityTags/speakingStyle |
| **P1-2** | **Project 类型缺字段** | Low | [project.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/types/project.ts) | 无 worldSettingId / outlineId / branchInfo / memoryLastSync 等关联字段 |
| **P1-3** | **Chapter 类型缺字段** | Low | [chapter.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/types/chapter.ts) | 无 branchId / version / foreshadowingRefs 等多分支所需字段 |
| **P1-4** | **FakeAgent quota 逻辑过于简单** | Low | [fake-agent.ts:151](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/providers/fake-agent.ts#L151) | `callCount > 10` 即触发 quota，无时间窗口重置，不适合演示场景 |
| **P2-1** | **无世界观数据 Provider** | Info | providers/ 下无 NovelWorldSettingProvider | 世界观组件直接消费 mock-data，违反"UI 禁止直接 import mock-data"规则 |

---

## 第三章：MVP Plan 可行性再评估

### 原定 MVP 范围 vs 实际基线

| Week | MVP Plan 目标 | 实际已有代码 | 差距评估 |
|------|--------------|-------------|---------|
| **W1** | Fork OpenCode + Hook 增强系统 | 已 fork（opencode-1.4.0）；Hook 系统**零代码** | 需从零开发 |
| **W2** | Named Subagents + Daily-Log | **零代码** | 需从零开发 |
| **W3** | Skills + Commands（20+） | 5 个 AIWritingCommand 按钮（≠ Commands 体系） | 需大幅扩展 |
| **W4** | 多语言 UI + E2E 测试 | 全中文硬编码；部分 hook 测试存在 | i18n 从零；测试补充 |

### 修正后的 MVP 建议

原定 4 周 MVP 计划**过于乐观**。基于代码现状，建议调整为：

#### MVP v0.1 — "可用原型"（6 周）

| 阶段 | 内容 | 周数 | 交付标准 |
|------|------|------|---------|
| **Phase A** | 接入 OpenCode 插件系统 + 实现 1 个真实 Hook（敏感词拦截） | W1-2 | `tool.execute.before` 可拦截包含敏感词的 AI 输出 |
| **Phase B** | FakeAgent 替换为真实 LLM API 调用（单模型） | W3 | AI 续写返回真实模型生成内容（非模板） |
| **Phase C** | 本地文件持久化（YAML）替代内存 Map | W4 | 关闭重启后项目/角色/章节数据保留 |
| **Phase D** | Commands 指令体系 v0.1（10 个核心命令） | W5 | `/continue` `/outline` `/character` `/polish` 等可用 |
| **Phase E** | i18n 基础框架 + 中英双语 | W6 | UI 可切换中/英文 |

#### 延后到 v0.2 的功能

- Skills 渐进式披露系统
- Named Subagents（@mention）
- Daily-Log 跨会话记忆
- 多分支故事引擎（Git Worktree）
- 多模型智能路由
- 五级上下文压缩
- 伏笔追踪系统
- Buddy 写作伙伴
- 日/韩语言支持

---

## 第四章：方案文档自身问题

### 4.1 三份文档间的矛盾

| # | 矛盾点 | scheme-review | workflow-optimization | mvp-plan |
|---|--------|---------------|----------------------|----------|
| 1 | **实施周期** | 26 周（5 Phase） | 13 周（5 Phase） | **4 周（MVP）** | 三份文档的时间线不自洽 |
| 2 | **Hook 优先级** | P0 / 3 天 | P0 / 低难度 | W1 Day 3-5 | 基本一致 ✓ |
| 3 | **StreamingToolExecutor** | P0 / 10 天 | P0 / 中难度 | **未列入 MVP 范围** | MVP plan 遗漏 |
| 4 | **多语言** | P0 / 与 Skills 并行 | **未提及** | W4（中英日韩） | coverage 不一致 |
| 5 | **OpenCode 版本** | v1.17.3 | v1.17.3 | v1.17.3 | 实际代码已是 **v1.4.0** | 版本号矛盾！ |

### 4.2 方案文档的技术过度承诺

1. **"75+ 模型自由选择"**：当前 OpenCode 的模型配置远达不到此规模，且多模型路由需要后端调度能力
2. **"UI 25+ 语言"**：i18n 工程量巨大，每个语言不仅需要翻译还需 RTL/LTR 布局适配
3. **"AI 创作 200+ 语言"**：这取决于底层 LLM 能力（Qwen 3.5 的 200 语言），非编辑器本身可控
4. **"4 周交付差异化 MVP"**：基于代码审计，4 周仅够完成"真实 API 接入 + 文件持久化"

### 4.3 方案文档缺失的内容

| 缺失项 | 说明 | 建议 |
|--------|------|------|
| 前端架构选型论证 | 为什么选 SolidJS 而非 React？Electron 还是 Tauri？ | 补充技术选型 ADR |
| 数据 schema 迁移策略 | 内存 Map → YAML → 未来 DB 的迁移路径 | 补充数据演进路线图 |
| OpenCode 版本升级策略 | 当前 v1.4.0 vs 方案的 v1.17.3 | 明确版本锁定策略 |
| 离线/在线混合模式 | 纯本地编辑器还是需要云同步？ | 明确产品形态 |
| 性能预算 | 百万字小说的加载/搜索/编辑性能指标 | 补充性能 SLO |

---

## 第五章：最终结论与行动建议

### 核心结论

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   方案文档：★★★★☆ 愿景宏大，架构思考深入            │
│   代码实现：★★★☆☆  UI 原型扎实，后端/AI 零起步     │
│   两者对齐度：★☆☆☆☆  存在断层级差距                  │
│                                                     │
│   判断：方案文档是"产品愿景规格书"                   │
│        不是可在 4 周内执行的"工程实施计划"            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Top 5 行动建议（按优先级排序）

| # | 行动 | 理由 | 预计工作量 |
|---|------|------|-----------|
| **1** | **统一版本基线**：确认以 opencode-1.4.0（非 v1.17.3）为基础 | 三份文档均引用错误版本号 | 0.5 天 |
| **2** | **修复 P0 bug**：统一 AI_MODEL_OPTIONS 数据源，删除 sedfoXtUC | 影响功能正确性和代码整洁 | 0.5 天 |
| **3** | **编写"方案→代码"桥接文档**：明确哪些方案特性对应哪些代码文件/目录 | 降低后续开发者认知负荷 | 2 天 |
| **4** | **重新规划 MVP**：基于代码审计结果，输出 6 周"可用原型"计划替代表 4 周 MVP | 4 周计划不可达成 | 2 天 |
| **5** | **启动第一个真实 Hook 实现**：以敏感词拦截为切入点打通 OpenCode 插件链路 | 这是验证整个技术路径的关键 PoC | 3-5 天 |

### 风险预警

| 风险 | 等级 | 说明 |
|------|------|------|
| **期望值错位** | **Critical** | 方案文档对外传达的能力信号（15 项 Claude Code 级机制）与代码实际能力（UI 原型）相差 12+ 个月工作量。若按方案文档进行任何对外沟通或融资展示，将产生严重的信用风险 |
| **版本漂移** | High | opencode 迭代极快（日均 30-40 次 commit），v1.4.0 到 v1.17.3 之间可能存在 API breaking changes |
| **技术栈锁定** | Medium | SolidJS + Bun 技术栈生态较小，招聘和社区支持需考虑 |

---

*审计完成。评审人：Code Review Agent | 基线：opencode-1.4.0/packages/app/src/novel（~130 文件） | 日期：2026-06-18*

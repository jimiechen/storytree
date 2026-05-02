# AI 小说编辑器 Mock 数据设计上下文索引

**生成时间**: 2026-05-02

---

## 1. 当前可用文档列表

| 文档路径 | 文档用途 | 关键内容 | P0 必读 |
|---------|---------|---------|--------|
| [`docs/planning/PRD-v1.0-MVP-AI-Novel-Editor.md`](file:///workspace/caiode/docs/planning/PRD-v1.0-MVP-AI-Novel-Editor.md) | 完整的 MVP 产品需求文档 | 业务对象定义、用户流程、MVP 功能范围、验收标准 | ✅ |
| [`docs/planning/source-analysis/OPENCODE-STRUCTURE-FOR-NOVEL-EDITOR.md`](file:///workspace/caiode/docs/planning/source-analysis/OPENCODE-STRUCTURE-FOR-NOVEL-EDITOR.md) | OpenCode 架构分析 | Monorepo 结构、Solid.js 前端、Context + Provider 模式、工具系统、本地优先架构 | ✅ |
| [`docs/planning/source-analysis/CLAUDE-CODE-AGENT-TOOLING-FOR-NOVEL-EDITOR.md`](file:///workspace/caiode/docs/planning/source-analysis/CLAUDE-CODE-AGENT-TOOLING-FOR-NOVEL-EDITOR.md) | Claude Code 架构分析 | QueryEngine、工具系统、权限机制、会话管理、版本保护 | ✅ |
| [`docs/planning/source-analysis/NOVEL-EDITOR-BUSINESS-OBJECTS-AND-SCENARIOS.md`](file:///workspace/caiode/docs/planning/source-analysis/NOVEL-EDITOR-BUSINESS-OBJECTS-AND-SCENARIOS.md) | 业务对象和场景分析 | 13 个核心业务对象、6 个用户流程、10 个 Mock 场景、6 个状态机定义 | ✅ |
| [`docs/code-wiki/opencode.md`](file:///workspace/caiode/docs/code-wiki/opencode.md) | OpenCode 代码 Wiki | 目录结构、Effect 系统、插件系统、数据库模式、开发指南 | ✅ |
| [`docs/code-wiki/claude-code-src.md`](file:///workspace/caiode/docs/code-wiki/claude-code-src.md) | Claude Code 代码 Wiki | QueryEngine、工具系统、权限系统、数据流图、服务层架构 | ✅ |

---

## 2. 对 Mock 数据设计最重要的 20 条结论

### 业务对象与架构
1. **13 个核心业务对象**: Project、Sandbox、Chapter、Character、WorldSetting、BranchNode、BranchEdge、AITask、AILog、SyncRecord、Quota、Asset、CircleBinding
2. **Provider 模式贯穿始终**: OpenCode 和 Claude Code 都采用 Provider 模式，Mock 数据可以通过 FakeProvider 注入
3. **Sandbox 隔离机制**: Claude Code 提供了路径检查和权限控制，可复用保护小说沙箱
4. **状态机完整定义**: ChapterStatus、AITaskStatus、SyncStatus、SandboxStatus、BranchNodeType、ReviewStatus 六个状态机
5. **10 个完整 Mock 场景**: 从空项目到配额超限的完整测试场景已定义

### 工具与权限
6. **buildTool() 工具工厂**: Claude Code 提供了工具定义和注册的标准模式，可扩展小说专用工具
7. **分层权限检查**: 规则匹配 → 工具特定检查 → 沙箱安全检查，三级权限体系
8. **工具白名单/黑名单**: 明确允许 Read、Edit、Write、Glob、Grep，禁止 Bash、WebFetch、WebSearch、Agent
9. **版本快照机制**: FileEditTool 提供完整的版本快照、冲突检测、历史追踪
10. **Token 成本追踪**: Claude Code 内置 token 统计和成本追踪功能

### 数据存储与同步
11. **本地优先架构**: OpenCode 采用 SQLite 本地存储，适合离线小说创作
12. **GlobalSync 模式**: OpenCode 的状态同步模式可复用管理小说项目状态
13. **SyncRecord 同步记录**: 完整的同步状态、版本冲突处理机制
14. **资源管理 Asset**: 封面、插图、角色图、异兽图的资产管理

### Agent 与任务
15. **QueryEngine 核心**: Claude Code 的异步迭代器模式适合处理流式 AI 输出
16. **AITask 12 种类型**: Continue、Rewrite、Expand、Outline、Summary、ConsistencyCheck、CharacterCheck、WorldCheck、BranchGenerate、BatchGenerate、Polish、TitleSuggest
17. **AILog 详细审计**: 完整的 AI 调用日志记录
18. **任务中断和重试**: 支持 interrupt() 中断和失败重试

### UI 与组件
19. **Solid.js + Context + Provider**: 可复用的 Context 模式管理小说项目状态
20. **组件库成熟**: @opencode-ai/ui 提供 Button、Dialog、FileTree、Tabs 等组件可复用

---

## 3. 推荐 Mock 数据目录结构

基于 OpenCode Monorepo 结构，推荐在 `packages/app/src/` 下创建：

```
caiode/
└── packages/app/src/
    ├── novel/                           # 小说编辑器模块
    │   ├── context/                      # 状态管理
    │   │   ├── NovelContext.tsx         # 主 Context
    │   │   ├── ChapterContext.tsx       # 章节管理
    │   │   ├── CharacterContext.tsx      # 角色卡
    │   │   ├── WorldSettingContext.tsx  # 世界观设定
    │   │   └── BranchContext.tsx        # 分支剧情
    │   │
    │   ├── provider/                    # Provider 模式
    │   │   ├── NovelProvider.tsx       # 接口定义
    │   │   ├── fake/                    # Mock 实现
    │   │   │   ├── FakeNovelProvider.tsx
    │   │   │   ├── FakeChapterProvider.tsx
    │   │   │   ├── FakeCharacterProvider.tsx
    │   │   │   ├── FakeAITaskProvider.tsx
    │   │   │   └── FakeAgentProvider.tsx
    │   │   └── real/                    # 真实实现 (TODO)
    │   │       ├── RealNovelProvider.tsx
    │   │       ├── RealChapterProvider.tsx
    │   │       └── RealAgentProvider.tsx
    │   │
    │   ├── mock/                        # Mock 数据
    │   │   ├── fixtures/                # 场景数据
    │   │   │   ├── empty-project.json
    │   │   │   ├── shanhai-demo.json
    │   │   │   ├── ten-chapter-project.json
    │   │   │   ├── thirty-card-project.json
    │   │   │   ├── branch-heavy-project.json
    │   │   │   ├── multi-sandbox-project.json
    │   │   │   ├── ai-task-failed.json
    │   │   │   ├── sync-conflict.json
    │   │   │   ├── quota-exceeded.json
    │   │   │   └── published-readonly.json
    │   │   ├── sample-chapters/         # 示例章节内容
    │   │   ├── sample-characters/       # 示例角色卡
    │   │   └── sample-world-settings/   # 示例世界观设定
    │   │
    │   ├── components/                   # UI 组件
    │   │   ├── ChapterTree.tsx
    │   │   ├── CharacterCard.tsx
    │   │   ├── BranchGraph.tsx
    │   │   └── AITaskStatus.tsx
    │   │
    │   ├── pages/                        # 页面
    │   │   ├── ProjectDashboard.tsx
    │   │   ├── NovelEditor.tsx
    │   │   └── CharacterGallery.tsx
    │   │
    │   ├── agent-bridge/                # Agent 桥接层
    │   │   ├── types.ts
    │   │   ├── AgentBridge.ts
    │   │   ├── tools/
    │   │   │   ├── whitelist.ts
    │   │   │   ├── novel-continue.ts
    │   │   │   ├── novel-branch.ts
    │   │   │   └── novel-edit.ts
    │   │   └── providers/
    │   │       ├── FakeAgentProvider.ts
    │   │       ├── RealAgentProvider.ts
    │   │       └── ModelGatewayProvider.ts
    │   │
    │   ├── types/                        # 类型定义
    │   │   ├── index.ts
    │   │   ├── project.ts
    │   │   ├── chapter.ts
    │   │   ├── character.ts
    │   │   ├── aitask.ts
    │   │   └── sync.ts
    │   │
    │   └── index.ts
```

---

## 4. 推荐 Provider 命名规范

### Fake/Real 分层命名

| 功能 | Fake Provider | Real Provider | 接口类型 |
|---|---|---|---|
| 小说项目整体 | `FakeNovelProvider` | `RealNovelProvider` | `NovelProvider` |
| 章节管理 | `FakeChapterProvider` | `RealChapterProvider` | `ChapterProvider` |
| 角色卡管理 | `FakeCharacterProvider` | `RealCharacterProvider` | `CharacterProvider` |
| 世界观设定 | `FakeWorldSettingProvider` | `RealWorldSettingProvider` | `WorldSettingProvider` |
| 分支剧情 | `FakeBranchProvider` | `RealBranchProvider` | `BranchProvider` |
| AI 任务 | `FakeAITaskProvider` | `RealAITaskProvider` | `AITaskProvider` |
| 同步状态 | `FakeSyncProvider` | `RealSyncProvider` | `SyncProvider` |
| Agent 调用 | `FakeAgentProvider` | `RealAgentProvider` | `AgentProvider` |
| 配额管理 | `FakeQuotaProvider` | `RealQuotaProvider` | `QuotaProvider` |
| 资源管理 | `FakeAssetProvider` | `RealAssetProvider` | `AssetProvider` |

### 网关模式

为了灵活切换 Fake 和 Real，建议实现 `ModelGatewayProvider`：

```typescript
export class ModelGatewayProvider implements NovelProvider {
  constructor(
    private fake: FakeNovelProvider,
    private real: RealNovelProvider,
    private mode: 'mock' | 'real' | 'hybrid'
  ) {}
  
  async *generate(prompt: string): AsyncGenerator<string> {
    if (this.mode === 'mock') {
      yield* this.fake.generate(prompt)
    } else {
      yield* this.real.generate(prompt)
    }
  }
}
```

---

## 5. 仍然缺失的信息

### 1. 数据库 Schema 详细设计
虽然业务对象字段已定义，但缺少：
- 数据库表结构
- 索引设计
- 外键关系
- Drizzle ORM 模型定义

### 2. 多语言支持细节
PRD 提到语言枚举为 `en`/`zh`，但缺少：
- 翻译文本管理
- i18n 集成方案
- 多语言的角色/世界观设定存储

### 3. 分支剧情渲染算法
有 BranchNode 和 BranchEdge 类型，但缺少：
- 分支图可视化算法
- 路径选择逻辑
- 分支遍历和展开机制
- 画布坐标分配

### 4. 异兽卡牌生成详细流程
卡牌物语是核心功能，但缺少：
- 卡牌规格定义
- 图生成提示词模板
- 卡牌版式设计
- 图片存储和 CDN 集成

### 5. Circle 权限模型
CircleBinding 已定义，但缺少：
- 各角色详细权限矩阵
- 共享编辑冲突处理
- 评论和协作流程

### 6. 导出/导入文件格式
需要设计：
- 小说项目 ZIP 包结构
- 单个章节导出格式
- 批量导出/导入流程
- 与其他小说编辑工具的兼容性

### 7. 性能基准数据
- 单项目 100 章节响应
- 大章节加载和编辑
- 分支图渲染性能
- 本地存储优化

---

## 6. 给外部 AI 的上下文摘要（1000-1500字）

### 项目背景
这是在 OpenCode 基础上二次开发的"卡牌物语 AI 小说编辑器"，采用 TDD + Mock 数据 + Provider 抽象方式开发。项目基于 Claude Code 的 Agent 系统和 OpenCode 的前端/本地存储架构。

### 核心架构
**Monorepo 结构**: OpenCode 采用 Turbo + Bun，核心包是 `packages/opencode`（逻辑层）和 `packages/app`（Web 层）。
**前端框架**: Solid.js（响应式）+ Effect（函数式副作用）+ Tailwind CSS
**数据存储**: 本地优先架构，使用 Drizzle ORM + SQLite
**Agent 系统**: Claude Code 的 QueryEngine + buildTool() 工具工厂

### 关键概念
**业务对象**: 13 个核心对象包括 Project（小说项目）、Sandbox（沙箱隔离）、Chapter（章节）、Character（角色卡）、WorldSetting（世界观设定）、BranchNode/BranchEdge（分支剧情）、AITask/AILog（AI 任务和日志）、SyncRecord（同步记录）、Quota（配额）、Asset（资源）、CircleBinding（圈子绑定）。

**状态机定义**: 6 个完整状态机：ChapterStatus（草稿→编辑→待审→审核→发布→归档）、AITaskStatus（等待→运行→完成/失败/取消）、SyncStatus（待同步→同步中→已同步/冲突/失败）、SandboxStatus（活跃→归档→删除）、BranchNodeType（章节/选择/问答/隐藏/汇合/结局）、ReviewStatus（未提交→待审→通过/拒绝→需修改）。

**Agent 桥接层**: 参考 Claude Code 的 QueryEngine 和工具系统，需要实现 FakeAgentProvider 和 RealAgentProvider，支持工具白名单（允许 Read/Edit/Write/Glob/Grep/小说专用工具，禁止 Bash/WebFetch/WebSearch/Agent）。

**Mock 场景**: 10 个完整测试场景：empty-project（空项目创建）、shanhai-demo（山海关怀节演示项目）、ten-chapter-project（10 章节测试性能）、thirty-card-project（30 角色卡测试管理）、branch-heavy-project（复杂分支剧情测试）、multi-sandbox-project（多沙箱隔离测试）、ai-task-failed（AI 失败处理测试）、sync-conflict（同步冲突处理测试）、quota-exceeded（配额超限处理测试）、published-readonly（已发布章节只读保护测试）。

### 技术要点
**Provider 模式**: 所有数据访问通过 Provider 抽象，支持 Fake/Real 无缝切换，建议实现 ModelGatewayProvider 统一管理。
**版本保护**: Claude Code 的 FileEditTool 提供修改前读取、冲突检测、快照生成，可复用保护小说章节。
**权限系统**: 分层权限检查（规则→工具→沙箱），确保 Agent 只能操作当前沙箱内容，不能访问系统目录或执行任意命令。
**本地优先**: 采用 OpenCode 的 GlobalSync 模式，确保离线可用，数据主权在用户。

### 开发优先级
**P0 必做**: FakeProvider 实现、Mock 数据设计、基础 UI、状态管理、单元测试。
**开发路线**: 第 2 周假数据真流程演示 → 第 4 周本地真实数据 → 第 6 周真实 Agent → 第 8 周同步发布 → 第 10 周 Alpha 验收。

### 关键文档
需要参考的核心文档（本索引文档列出的第 1 部分）是优先级最高的，特别是三个 source-analysis 文档和 PRD。

---

## 附录：快速参考

### 关键文件链接（可点击）
- [PRD-v1.0-MVP-AI-Novel-Editor.md](file:///workspace/caiode/docs/planning/PRD-v1.0-MVP-AI-Novel-Editor.md)
- [OPENCODE-STRUCTURE-FOR-NOVEL-EDITOR.md](file:///workspace/caiode/docs/planning/source-analysis/OPENCODE-STRUCTURE-FOR-NOVEL-EDITOR.md)
- [CLAUDE-CODE-AGENT-TOOLING-FOR-NOVEL-EDITOR.md](file:///workspace/caiode/docs/planning/source-analysis/CLAUDE-CODE-AGENT-TOOLING-FOR-NOVEL-EDITOR.md)
- [NOVEL-EDITOR-BUSINESS-OBJECTS-AND-SCENARIOS.md](file:///workspace/caiode/docs/planning/source-analysis/NOVEL-EDITOR-BUSINESS-OBJECTS-AND-SCENARIOS.md)

### 关键代码片段
- **buildTool()**: `packages/opencode/src/tool/tool.ts`
- **QueryEngine**: `claude-code-src/QueryEngine.ts`
- **GlobalSync Context**: `packages/app/src/context/global-sync/`

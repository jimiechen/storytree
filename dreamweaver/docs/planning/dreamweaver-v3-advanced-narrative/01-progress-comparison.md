# 进度对比与差距分析报告 (Gap Analysis) - V3

## 1. 当前代码状态 (V2 验收总结)

基于对项目源码 `/Users/mac/StudioProjects/storytree2/dreamweaver` 的审阅，目前系统已经完成了 **基础写作闭环 (Stage 1)** 和 **知识资产与 AI 引擎破冰 (Stage 2)**，并全面过渡到了真实数据库（SQLite 测试集成）。所有 E2E 测试和单元测试均达到 100% 通过率。

### 已完成的基建与业务能力：
- **全栈架构底座**: Next.js 15 App Router, Prisma ORM, 真实数据库读写与 Auth 鉴权。
- **工作台核心**: TipTap 富文本编辑器集成、章节导航、基于 2 秒防抖的自动保存机制。
- **知识资产系统**: 结构化的角色管理、世界观设定 CRUD，且具备数据流向设计。
- **AI 引擎破冰**: 
  - Vercel AI SDK 服务端路由网关。
  - AI 聊天面板流式响应交互，具备加载状态与错误重试机制。
  - 编辑器划词选区与 AI 快捷指令（润色、续写、扩写、总结）联动，一键插入与替换正文。
  - 上下文自动提取与组装（基于 `useChat` hook）。

## 2. 与 PRD v5 的进度对比

将当前代码进度与 `多AI模型多分支长篇小说写作平台PRD_v5.md` 进行对比，存在以下核心功能差距：

| PRD 模块 | 当前代码状态 | 差距描述 (Gap) |
| --- | --- | --- |
| **知识资产与RAG** | 🚧 基础管理完成 | 缺乏针对海量世界观设定和角色的向量化检索 (RAG)，AI 上下文仍是静态组装，可能超出 Token 窗口。 |
| **多分支叙事** | ❌ 未开始 | 这是 DreamWeaver 的核心护城河。目前仅有静态分支树的 UI 壳，缺失底层的 Git-like 版本控制、分支创建、切换与合并逻辑。 |
| **Harness 工程** | ❌ 未开始 | 缺失 PRD v5 强调的 Prompt Cache Harness (降低 API 成本)、Permission Harness (细粒度权限)、Compaction Harness (上下文压缩)。 |
| **智能代理系统** | ❌ 未开始 | AI 目前仍是“被动响应”模式，缺乏主动规划、长程记忆积累与多模型调度 (Claude Code 模式代理)。 |
| **全球化双语** | ❌ 未开始 | 暂无中英双语切换引擎，缺乏 Stripe 支付订阅和跨区部署机制。 |

## 3. 演进策略 (Next Stage Strategy)

根据项目当前进度与 PRD v5 的愿景，V3 的迭代将重点攻克最核心的两大技术难点，即 **多分支叙事系统** 与 **AI Harness/RAG 工程架构**。

1. **多分支叙事系统 (Branching Narrative System)**:
   - 为 `Chapter` 和 `Project` 引入版本控制树 (Git-like 数据结构)。
   - 实现分支的创建、保存点 (Commit)、切换以及简单的可视化视图。
2. **检索增强生成与 Harness (RAG & Prompt Cache Harness)**:
   - 建立向量化机制，将 V2 建立的“角色”与“世界观”数据进行 Embeddings。
   - 在向 AI 发送请求时，动态检索相关的设定作为 Context 注入。
   - 引入 Prompt Cache 机制，优化多轮对话中的 Token 成本。
3. **高级 AI 交互**:
   - 结合多分支，提供 "假设性写作"（What-if exploration）的 AI 推演能力。

因此，V3 迭代的核心代号定为：**高级叙事与检索引擎 (Advanced Narrative & RAG Harness)**。
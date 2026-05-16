# CLAUDE-CODE-SRC-ARCHITECTURE-BASELINE.md

> **角色**: 项目协调 Agent (Kimi-K2.6)  
> **任务ID**: DOC-PHASE0-008  
> **日期**: 2026-05-15  
> **版本**: v1.0  
> **状态**: [READY_FOR_REVIEW]

---

## 一、调研背景

`caiode/claude-code-src` 是 `@anthropic-ai/claude-code@2.1.88` 发布包 source map 暴露后被提取/反编译的研究材料，不等同于正式开源授权代码。本项目采用 **clean-room architecture rewrite**：借鉴架构、抽象、流程和模块边界，不直接复制源码实现。

---

## 二、claude-code-src 核心模块分析

### 2.1 QueryEngine.ts

| 属性 | 内容 |
|------|------|
| **职责** | 会话生命周期管理、Agent 请求入口、流式响应输出 |
| **核心抽象** | QueryEngine 管理一次完整的用户请求-响应周期 |
| **数据流** | 用户输入 → QueryEngine → AgentLoop → 流式输出 |
| **可借鉴点** | 会话状态机、流式响应处理、上下文压缩 |
| **不可复制点** | Anthropic SDK 强耦合、内部 API 调用 |
| **对应 Creative Runtime** | `CreativeQueryEngine` |

### 2.2 query.ts

| 属性 | 内容 |
|------|------|
| **职责** | 主 Agent Loop：模型响应、工具调用、观察结果、继续推理 |
| **核心抽象** | AsyncGenerator Agent Loop |
| **数据流** | 模型响应 → 解析工具调用 → 执行工具 → 观察结果 → 继续推理 |
| **可借鉴点** | 流式工具执行、并发读工具、写工具串行化 |
| **不可复制点** | 特定模型响应格式解析 |
| **对应 Creative Runtime** | `AgentLoop` |

### 2.3 Tool.ts / tools.ts / tools/

| 属性 | 内容 |
|------|------|
| **职责** | 所有工具的统一接口和权限模型 |
| **核心抽象** | Tool 接口：name/description/inputSchema/execute |
| **数据流** | AgentLoop 解析工具调用 → ToolRuntime 执行 → 返回结果 |
| **可借鉴点** | 统一 Tool 接口、权限管理、错误处理 |
| **不可复制点** | 具体工具实现（Bash/WebFetch 等） |
| **对应 Creative Runtime** | `CreativeTool` / `ToolRegistry` |

### 2.4 Task.ts / tasks.ts / tasks/

| 属性 | 内容 |
|------|------|
| **职责** | 任务生命周期管理 |
| **核心抽象** | Task 状态机：pending/running/completed/failed |
| **数据流** | 创建任务 → 执行任务 → 更新状态 → 保存结果 |
| **可借鉴点** | 任务状态机、重试机制、取消机制 |
| **不可复制点** | 特定任务类型实现 |
| **对应 Creative Runtime** | `TaskRuntime` |

### 2.5 skills/

| 属性 | 内容 |
|------|------|
| **职责** | Skill 发现与加载 |
| **核心抽象** | "元数据先发现、内容按需加载" |
| **数据流** | 扫描目录 → 发现 SKILL.md → 按需加载 |
| **可借鉴点** | Skill 目录结构、元数据发现机制 |
| **不可复制点** | 特定 Skill 内容 |
| **对应 Creative Runtime** | `SkillLoader` |

### 2.6 plugins/

| 属性 | 内容 |
|------|------|
| **职责** | 插件扩展入口 |
| **核心抽象** | 插件注册与生命周期管理 |
| **数据流** | 加载插件 → 注册扩展点 → 激活插件 |
| **可借鉴点** | 插件生命周期管理、扩展点设计 |
| **不可复制点** | 特定插件实现 |
| **对应 Creative Runtime** | `PluginRuntime` |

### 2.7 commands.ts / commands/

| 属性 | 内容 |
|------|------|
| **职责** | 命令注册与分发 |
| **核心抽象** | Command Registry：slash command、快捷键 |
| **数据流** | 用户输入命令 → 解析 → 分发到对应处理器 |
| **可借鉴点** | 命令注册表、命令解析 |
| **不可复制点** | 特定命令实现 |
| **对应 Creative Runtime** | `CommandRegistry` |

### 2.8 context.ts / context/

| 属性 | 内容 |
|------|------|
| **职责** | 上下文构造与管理 |
| **核心抽象** | Context Builder：系统提示、用户输入、工具结果 |
| **数据流** | 收集上下文 → 压缩 → 发送给模型 |
| **可借鉴点** | 上下文压缩、Token 管理 |
| **不可复制点** | 特定上下文格式 |
| **对应 Creative Runtime** | `CreativeContextBuilder` |

### 2.9 state/

| 属性 | 内容 |
|------|------|
| **职责** | 状态持久化与管理 |
| **核心抽象** | State Store：会话、任务、文件缓存 |
| **数据流** | 状态变更 → 持久化 → 恢复 |
| **可借鉴点** | 状态分层、持久化策略 |
| **不可复制点** | 特定状态格式 |
| **对应 Creative Runtime** | `StateStore` |

### 2.10 services/

| 属性 | 内容 |
|------|------|
| **职责** | 服务层：Provider、License、Asset、Project、Cost |
| **核心抽象** | Service Layer：业务逻辑抽象 |
| **数据流** | 上层调用 → 服务处理 → 返回结果 |
| **可借鉴点** | 服务分层、依赖注入 |
| **不可复制点** | 特定服务实现 |
| **对应 Creative Runtime** | `ServiceLayer` |

### 2.11 bridge/

| 属性 | 内容 |
|------|------|
| **职责** | 外部服务桥接 |
| **核心抽象** | Provider Bridge：OpenRouter、图像、视频、TTS |
| **数据流** | 内部调用 → 桥接转换 → 外部服务 |
| **可借鉴点** | 桥接模式、适配器模式 |
| **不可复制点** | 特定桥接实现 |
| **对应 Creative Runtime** | `ProviderBridge` |

### 2.12 coordinator/

| 属性 | 内容 |
|------|------|
| **职责** | 多步骤工作流协调 |
| **核心抽象** | Workflow Orchestrator：子 Agent 协作 |
| **数据流** | 工作流定义 → 步骤执行 → 结果汇总 |
| **可借鉴点** | 工作流编排、子 Agent 协调 |
| **不可复制点** | 特定工作流实现 |
| **对应 Creative Runtime** | `WorkflowOrchestrator` |

### 2.13 hooks/

| 属性 | 内容 |
|------|------|
| **职责** | 生命周期扩展点 |
| **核心抽象** | Hook Pipeline：插件生命周期、任务前后触发 |
| **数据流** | 事件触发 → Hook 执行 → 结果处理 |
| **可借鉴点** | Hook 机制、事件驱动 |
| **不可复制点** | 特定 Hook 实现 |
| **对应 Creative Runtime** | `HookPipeline` |

### 2.14 cost-tracker.ts

| 属性 | 内容 |
|------|------|
| **职责** | 成本追踪 |
| **核心抽象** | Cost Tracker：Token 消耗、API 费用 |
| **数据流** | 调用记录 → 成本计算 → 统计报告 |
| **可借鉴点** | 成本追踪、预算管理 |
| **不可复制点** | 特定计费模型 |
| **对应 Creative Runtime** | `CostTracker` |

---

## 三、可迁移设计总结

| 设计模式 | 来源 | Creative Runtime 实现 |
|---------|------|----------------------|
| Agent Loop | query.ts | `AgentLoop` |
| Tool 抽象 | Tool.ts | `CreativeTool` |
| Task 状态机 | Task.ts | `TaskRuntime` |
| Skill 加载 | skills/ | `SkillLoader` |
| Plugin 生命周期 | plugins/ | `PluginRuntime` |
| Command 注册 | commands.ts | `CommandRegistry` |
| Context 构建 | context.ts | `CreativeContextBuilder` |
| State 管理 | state/ | `StateStore` |
| Service 分层 | services/ | `ServiceLayer` |
| Provider 桥接 | bridge/ | `ProviderBridge` |
| 工作流编排 | coordinator/ | `WorkflowOrchestrator` |
| Hook 机制 | hooks/ | `HookPipeline` |
| 成本追踪 | cost-tracker.ts | `CostTracker` |

---

## 四、不可直接复制风险

1. **版权风险**: claude-code-src 不是开源代码，直接复制可能侵犯版权
2. **API 耦合**: 原代码与 Anthropic SDK 强耦合，不适合直接复用
3. **内部实现**: 特定工具、命令、服务的实现细节不适合复制
4. **安全漏洞**: 反编译代码可能包含安全漏洞

---

*[READY_FOR_REVIEW]*

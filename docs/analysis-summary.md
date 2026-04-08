# 小说平台技术架构分析报告

## 1. 技术选型分析

### 1.1 LLM 集成方案对比

| 方案 | 优势 | 劣势 | 推荐度 |
|------|------|------|--------|
| **Vercel AI SDK** | - 轻量级，专注于AI交互<br>- 多模型支持<br>- 流式响应<br>- 已在项目中使用 | - 功能相对基础 | ✅ 推荐 |
| **LangChain** | - 功能丰富<br>- 生态成熟<br>- 工具集成 | - 重量级<br>- 学习曲线陡峭 | ❌ 不推荐 |

**现状**：项目已使用 Vercel AI SDK (`"ai": "^6.0.146"`)，无需引入 LangChain。

**参考文件**：[dreamweaver/package.json](file:///workspace/dreamweaver/package.json)

### 1.2 自定义 LLM 开源方案

**推荐开源模型**：
- **DeepSeek V3**：中文理解能力强，性价比高
- **Qwen 3**：阿里云出品，中文创作优化
- **Llama 4**：Meta 开源，可本地部署，适合隐私场景
- **GLM-5**：智谱AI，中文优化，指令遵循好

**Trae 基础与 LLM 关系**：
- Trae 提供 CDP 注入和任务自动化，属于纯自动化工具
- 小说创作 AI 功能需要 LLM 支持
- 两者互补，Trae 负责自动化流程，LLM 负责创作内容

**参考文件**：[Trae-Ralph-main/README.md](file:///workspace/caiode/Trae-Ralph-main/README.md)

## 2. 上下文压缩与提示词处理

### 2.1 Claude Code 实现

**上下文压缩**：
- **四级压缩体系**：L1-L4 渐进压缩
- **AI 驱动摘要**：使用专门的压缩 agent
- **工具调用剪枝**：自动清理旧工具结果

**提示词处理**：
- **5级优先级体系**：从核心指令到用户输入
- **静态/动态分离**：DYNAMIC_BOUNDARY 机制
- **Prompt Cache 优化**：三层缓存策略

**参考文件**：
- [compact.ts](file:///workspace/caiode/claude-code-src/services/compact/compact.ts)
- [systemPrompt.ts](file:///workspace/caiode/claude-code-src/utils/systemPrompt.ts)

### 2.2 Opencode 实现

**上下文压缩**：
- **会话压缩**：使用专门的压缩 agent
- **工具调用剪枝**：PRUNE_MINIMUM = 20,000 tokens
- **模板化摘要**：5段式压缩模板

**提示词处理**：
- **Vercel AI SDK 集成**：多 provider 支持
- **插件系统**：支持提示词注入

**参考文件**：
- [compaction.ts](file:///workspace/caiode/opencode/packages/opencode/src/session/compaction.ts)
- [provider.ts](file:///workspace/caiode/opencode/packages/opencode/src/provider/provider.ts)

## 3. 记忆系统分析

### 3.1 必要性评估

**结论**：记忆系统对小说平台**绝对必要**，原因：
- ✅ 长篇小说需要保持叙事一致性
- ✅ 跨会话保持创作上下文
- ✅ 自动提取关键信息（角色变化、情节进展等）
- ✅ PRD 已明确规划（P1优先级，8周工期）

### 3.2 Claude Code 记忆系统

**核心特性**：
- **三层记忆范围**：user（全局）、project（项目）、local（本地）
- **MEMORY.md 存储**：Markdown 文件持久化
- **安全路径管理**：路径遍历防护

**参考文件**：[agentMemory.ts](file:///workspace/caiode/claude-code-src/tools/AgentTool/agentMemory.ts)

### 3.3 Opencode 记忆系统

**核心特性**：
- **会话压缩**：使用压缩 agent 生成摘要
- **工具调用剪枝**：自动清理旧工具结果
- **Effect 框架**：服务化架构

**参考文件**：[compaction.ts](file:///workspace/caiode/opencode/packages/opencode/src/session/compaction.ts)

### 3.4 PRD 记忆系统规划

**核心功能**：
- **NOVEL.md 多层发现**：全局偏好→项目指南→章节指令→场景指令
- **自动记忆提取**：角色变化、情节进展、伏笔状态、设定更新
- **会话记忆**：跨会话保持写作上下文
- **记忆压缩**：9段摘要模板

**参考文件**：[多AI模型多分支长篇小说写作平台PRD_v5.md](file:///workspace/.trae/documents/多AI模型长篇小说写作平台PRD/多AI模型多分支长篇小说写作平台PRD_v5.md)

## 4. 架构设计建议

### 4.1 记忆系统架构

**推荐方案**：基于 Claude Code 记忆架构，结合 Opencode 压缩机制

**架构要点**：
1. **多层记忆存储**：
   - 全局记忆：用户写作偏好
   - 项目记忆：小说级指令和设定
   - 章节记忆：章节特定指令
   - 场景记忆：场景精确指令

2. **记忆提取与压缩**：
   - 自动提取关键信息
   - 小说定制版 9 段摘要模板
   - 四级压缩体系

3. **与其他系统集成**：
   - 智能代理系统：REPL + QueryEngine + Tool
   - 提示词工程系统：静态/动态分离
   - 世界观构建器：设定一致性检查

### 4.2 技术实现路径

1. **第一阶段**：实现基础记忆存储
   - NOVEL.md 多层结构
   - 基本记忆提取
   - 会话记忆

2. **第二阶段**：优化与扩展
   - 记忆压缩机制
   - 自动记忆提取增强
   - 与智能代理集成

3. **第三阶段**：高级功能
   - 记忆检索优化
   - 多模态记忆支持
   - 个性化记忆管理

## 5. 结论

1. **技术选型**：继续使用 Vercel AI SDK，无需引入 LangChain
2. **LLM 选择**：根据场景选择合适的开源模型
3. **记忆系统**：基于 Claude Code 架构实现，优先级 P1
4. **架构集成**：记忆系统与智能代理、提示词工程深度集成

**建议**：立即开始记忆系统的设计和实现，这是小说平台的核心功能之一。
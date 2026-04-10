# Claude Code 压缩会话机制分析文档

## 一、核心概念与原理

### 1. 压缩会话的定义

压缩会话是 Claude Code 中的一种机制，用于管理长时间运行的对话历史，通过将较早的对话内容总结为摘要，减少上下文大小，提高模型响应速度和质量。

### 2. 压缩的核心原理

- **摘要生成**：使用模型对较早的对话内容生成摘要
- **边界标记**：在会话中插入压缩边界标记，指示哪些内容已被压缩
- **上下文保留**：保留最近的对话历史和重要的上下文信息
- **缓存优化**：通过缓存共享机制减少重复计算

## 二、压缩数据的存储位置

### 1. 存储位置

压缩数据存储在**原始会话文件**中，采用 JSONL（JSON Lines）格式：

- **文件路径**：`~/.trae/projects/{sanitized-cwd}/{session-id}.jsonl`
- **存储格式**：每个消息作为单独的 JSON 对象，一行一个

### 2. 存储内容

压缩后的数据包含以下关键组件：

| 组件类型 | 描述 | 存储格式 |
|---------|------|---------|
| 压缩边界标记 | 指示压缩操作的执行 | 系统消息，`type: 'system'`, `subtype: 'compact_boundary'` |
| 压缩摘要 | 对压缩内容的总结 | 用户消息，`isCompactSummary: true` |
| 保留的消息 | 未被压缩的近期消息 | 原始消息格式 |
| 上下文附件 | 重新注入的重要上下文 | 附件消息，如文件状态、技能使用情况 |

### 3. 存储示例

```json
// 压缩边界标记
{"type": "system", "subtype": "compact_boundary", "uuid": "...", "compactMetadata": {...}}

// 压缩摘要
{"type": "user", "isCompactSummary": true, "message": {"content": "Conversation summary: ..."}, "uuid": "..."}

// 保留的消息
{"type": "user", "message": {"content": "Recent message..."}, "uuid": "..."}
{"type": "assistant", "message": {"content": "Recent response..."}, "uuid": "..."}
```

## 三、压缩规则与策略

### 1. 触发条件

- **自动压缩**：当会话达到 token 阈值时自动触发
- **手动压缩**：用户通过 `/compact` 命令手动触发
- **部分压缩**：用户选择特定消息进行压缩

### 2. 压缩策略

#### 2.1 完全压缩（Full Compact）

- **适用场景**：整个会话历史较长
- **处理方式**：
  1. 生成整个会话的摘要
  2. 保留压缩边界后的新消息
  3. 重新注入重要上下文（文件状态、技能使用）
  4. 重置相关缓存

#### 2.2 部分压缩（Partial Compact）

- **适用场景**：只需要压缩对话的一部分
- **方向**：
  - `up_to`：压缩指定消息之前的内容
  - `from`：压缩指定消息之后的内容
- **处理方式**：
  1. 只对指定范围的消息生成摘要
  2. 保留未压缩部分的完整历史
  3. 维护消息链的完整性

### 3. 压缩边界元数据

压缩边界包含以下元数据：

| 字段 | 描述 | 用途 |
|------|------|------|
| `trigger` | 压缩触发方式（auto/manual） | 区分自动和手动压缩 |
| `preCompactTokenCount` | 压缩前的 token 数量 | 用于统计和监控 |
| `preCompactDiscoveredTools` | 压缩前发现的工具 | 确保压缩后工具上下文不丢失 |
| `preservedSegment` | 保留的消息段信息 | 用于维护消息链完整性 |

## 四、压缩数据的匹配与使用

### 1. 加载机制

当加载会话时，系统会：

1. **从最近的压缩边界开始**：使用 `getMessagesAfterCompactBoundary` 函数跳过已压缩的内容
2. **加载压缩摘要**：将压缩摘要作为对话的上下文
3. **恢复保留的消息**：加载压缩边界后的完整消息
4. **重建消息链**：使用 `preservedSegment` 信息重建消息之间的父子关系

### 2. 缓存机制

#### 2.1 提示缓存共享

- **机制**：通过 `runForkedAgent` 重用主对话的缓存前缀
- **优势**：减少压缩过程的 token 消耗，提高速度
- **回退**：当缓存共享失败时，使用常规流式路径

#### 2.2 缓存清理

压缩过程中会清理以下缓存：
- **文件状态缓存**：`context.readFileState.clear()`
- **嵌套内存路径缓存**：`context.loadedNestedMemoryPaths?.clear()`

#### 2.3 缓存保留

- **技能名称缓存**：不重置 `sentSkillNames`，避免重复注入技能列表
- **会话元数据**：压缩后重新追加会话元数据，确保其保持在读取窗口内

### 3. 上下文重建

压缩后会重新注入以下上下文信息：

| 上下文类型 | 描述 | 注入方式 |
|-----------|------|---------|
| 文件状态 | 最近访问的文件 | 文件附件消息 |
| 技能使用 | 已使用的技能 | 技能附件消息 |
| 工具信息 | 可用的工具 | 工具附件消息 |
| 计划模式 | 当前计划模式状态 | 计划模式附件消息 |

## 五、压缩缓存机制

### 1. 缓存层次

| 缓存类型 | 作用 | 生命周期 |
|---------|------|---------|
| 提示缓存 | 重用系统提示和工具定义 | 跨会话 |
| 文件状态缓存 | 缓存文件内容 | 会话内 |
| 技能发现缓存 | 缓存已发现的技能 | 会话内 |
| 内存路径缓存 | 缓存嵌套内存路径 | 会话内 |

### 2. 缓存优化策略

- **缓存前缀共享**：压缩过程重用主对话的缓存前缀
- **选择性缓存清理**：只清理必要的缓存，保留有用的状态
- **缓存命中跟踪**：通过 `tengu_compact_cache_sharing_success` 事件跟踪缓存命中率
- **智能回退**：当缓存共享失败时，自动回退到常规路径

## 六、代码实现分析

### 1. 核心函数

#### 1.1 `compactConversation`

- **功能**：执行完全压缩
- **参数**：
  - `messages`：要压缩的消息数组
  - `context`：工具使用上下文
  - `cacheSafeParams`：缓存安全参数
  - `suppressFollowUpQuestions`：是否抑制后续问题
- **返回值**：`CompactionResult` 对象，包含压缩边界、摘要消息等

#### 1.2 `partialCompactConversation`

- **功能**：执行部分压缩
- **参数**：
  - `allMessages`：所有消息
  - `pivotIndex`：压缩的 pivot 索引
  - `direction`：压缩方向（up_to/from）
- **返回值**：`CompactionResult` 对象

#### 1.3 `streamCompactSummary`

- **功能**：流式生成压缩摘要
- **实现**：
  1. 尝试使用缓存共享路径
  2. 失败时回退到常规流式路径
  3. 支持重试机制

### 2. 关键数据结构

#### 2.1 `CompactionResult`

```typescript
interface CompactionResult {
  boundaryMarker: SystemMessage;       // 压缩边界标记
  summaryMessages: UserMessage[];      // 压缩摘要消息
  attachments: AttachmentMessage[];    // 附加的上下文信息
  hookResults: HookResultMessage[];    // 钩子执行结果
  messagesToKeep?: Message[];          // 保留的消息
  userDisplayMessage?: string;         // 用户显示消息
  preCompactTokenCount?: number;       // 压缩前的 token 数
  postCompactTokenCount?: number;      // 压缩后的 token 数
  truePostCompactTokenCount?: number;  // 实际压缩后的 token 数
  compactionUsage?: ReturnType<typeof getTokenUsage>;  // 压缩 API 使用情况
}
```

#### 2.2 `SystemCompactBoundaryMessage`

```typescript
interface SystemCompactBoundaryMessage extends SystemMessage {
  subtype: 'compact_boundary';
  compactMetadata: {
    trigger: 'auto' | 'manual';
    preCompactTokenCount: number;
    preCompactDiscoveredTools?: string[];
    preservedSegment?: {
      headUuid: UUID;
      anchorUuid: UUID;
      tailUuid: UUID;
    };
  };
}
```

## 七、压缩会话的工作流程

### 1. 压缩触发

1. **检测触发条件**：
   - 自动压缩：检查 token 数量是否达到阈值
   - 手动压缩：用户执行 `/compact` 命令
   - 部分压缩：用户选择消息执行压缩

2. **执行压缩前钩子**：`executePreCompactHooks`

### 2. 压缩执行

1. **生成摘要**：
   - 调用 `streamCompactSummary` 生成对话摘要
   - 尝试使用缓存共享提高效率
   - 处理提示过长的情况（截断并重试）

2. **清理缓存**：
   - 清除文件状态缓存
   - 清除嵌套内存路径缓存

3. **重建上下文**：
   - 生成文件附件
   - 生成技能附件
   - 生成工具附件

4. **创建压缩边界**：
   - 创建 `compact_boundary` 系统消息
   - 添加压缩元数据

5. **写入会话**：
   - 写入压缩边界标记
   - 写入压缩摘要
   - 写入保留的消息
   - 写入附加的上下文信息
   - 重新追加会话元数据

### 3. 压缩后处理

1. **执行压缩后钩子**：`executePostCompactHooks`
2. **重置缓存基线**：`notifyCompaction`
3. **标记压缩完成**：`markPostCompaction`
4. **写入会话片段**：（仅代理模式）`writeSessionTranscriptSegment`

## 八、最佳实践与优化建议

### 1. 最佳实践

- **合理使用压缩**：当对话历史较长时，及时执行压缩
- **部分压缩**：对于特定部分的对话，使用部分压缩保留重要内容
- **监控压缩效果**：关注压缩前后的 token 数量变化
- **利用缓存**：确保缓存共享机制正常工作，提高压缩效率

### 2. 优化建议

- **调整压缩阈值**：根据实际使用场景调整自动压缩的 token 阈值
- **优化摘要质量**：通过自定义指令提高压缩摘要的质量
- **增强缓存策略**：进一步优化缓存共享机制，提高命中率
- **监控压缩性能**：跟踪压缩执行时间和资源消耗

## 九、结论

Claude Code 的压缩会话机制是一个精心设计的系统，通过以下方式优化对话管理：

1. **智能压缩**：自动或手动压缩对话历史，生成高质量摘要
2. **高效存储**：在原始会话文件中存储压缩信息，保持数据完整性
3. **缓存优化**：通过缓存共享机制减少重复计算，提高压缩效率
4. **上下文重建**：压缩后重新注入重要上下文，确保模型有足够的信息
5. **灵活配置**：支持完全压缩和部分压缩，适应不同场景需求

这种机制不仅减少了模型的上下文负担，提高了响应速度，还确保了对话的连续性和一致性，为用户提供了更好的使用体验。

## 十、代码参考

| 文件 | 功能 | 路径 |
|------|------|------|
| compact.ts | 压缩核心实现 | [compact.ts](file:///workspace/caiode/claude-code-src/services/compact/compact.ts) |
| sessionStorage.ts | 会话存储管理 | [sessionStorage.ts](file:///workspace/caiode/claude-code-src/utils/sessionStorage.ts) |
| sessionStoragePortable.ts | 可移植会话存储 | [sessionStoragePortable.ts](file:///workspace/caiode/claude-code-src/utils/sessionStoragePortable.ts) |
| messages.ts | 消息处理和压缩边界创建 | [messages.ts](file:///workspace/caiode/claude-code-src/utils/messages.ts) |

[READY_FOR_REVIEW]
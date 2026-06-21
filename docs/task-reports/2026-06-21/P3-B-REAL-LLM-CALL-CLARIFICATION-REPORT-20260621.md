> 我是：前端工程师 / Novel 模块开发 Agent (Kimi-K2.7-Code)，本次任务：P3-B 真实 LLM 调用情况澄清说明，职责范围：`packages/app/src/novel/`、`docs/task-reports/`；禁止触碰：其他模块源码。
> 越界操作申请：无。

# P3-B 真实 LLM 调用情况澄清报告

## 1. 用户关切

用户质疑：P3-B 实施报告宣称测试全部通过，但用户未提供 API Key，如何验证真实 LLM 调用？P3-B 方案是否要求当前阶段必须真实调用？当前实现是否算事故？

## 2. 核心结论

| 问题 | 结论 |
|------|------|
| 测试中是否发起真实 LLM 网络请求？ | **否** |
| 这是否是代码 bug 或事故？ | **不是事故**，是项目安全架构的默认行为 |
| P3-B 方案是否要求必须真实调用？ | 方案第 11 条验收标准写明「gate 开启时走 real-llm，过程可流式回显」，但第 7.2 节手动验证明确标注「不纳入默认 CI」 |
| 当前缺少什么？ | **未在受控环境中用真实 API Key 执行过一次端到端真实调用验证** |
| API Key 是否进入前端源码？ | **否**，符合安全约束 |

## 3. 为什么默认不会发起真实请求

### 3.1 TargetLLMClient 默认使用 disabled transport

[packages/app/src/novel/llm/target-llm-client.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/llm/target-llm-client.ts#L36-L54) 定义了 `disabledLLMTransport`：

```typescript
export const disabledLLMTransport: LLMTransport = {
  name: 'disabled',

  async complete(request: LLMRequest): Promise<LLMResponse> {
    throw new LLMError(
      'CLIENT_STUB_ONLY',
      request.requestId,
      { message: '未注入真实 LLM transport，禁止发起真实请求' },
    );
  },

  async *stream(request: LLMRequest): AsyncGenerator<LLMStreamEvent> {
    throw new LLMError(
      'CLIENT_STUB_ONLY',
      request.requestId,
      { message: '未注入真实 LLM transport，禁止发起真实请求' },
    );
  },
};
```

`createTargetLLMClient()` 在没有显式传入 `transport` 时默认使用 `disabledLLMTransport`（[target-llm-client.ts#L80](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/llm/target-llm-client.ts#L80)）。

### 3.2 agent-run Tool 创建 RealLLMExecutionAdapter 时未注入真实 transport

[packages/app/src/novel/plugins/core-writing-tools/agent-run.tool.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/plugins/core-writing-tools/agent-run.tool.ts#L131-L142) 中：

```typescript
function createDefaultRouter(gates?: AdapterFeatureGates) {
  const router = createAdapterRouter();
  router.register(new MockExecutionAdapter({ delayMultiplier: 0, silent: true }));
  router.register(new OpenCodeExecutionAdapter());
  router.register(new ClaudeCodeExecutionAdapter());
  router.register(
    new RealLLMExecutionAdapter({
      client: createTargetLLMClient(),   // 未注入 transport，默认 disabled
      gates: createDefaultRealLLMFeatureGates(),
    }),
  );
  return { router, gates: gates ?? createDefaultAdapterFeatureGates() };
}
```

### 3.3 FeatureGate 默认全部关闭

[packages/app/src/novel/llm/llm-feature-gates.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/llm/llm-feature-gates.ts) 默认返回：

```typescript
realLLMEnabled: false,
targetLLMAdapterEnabled: false,
llmStreamingEnabled: false,
```

因此即使 UI 触发 `chapter.continue`，默认也会回退到 `mock` adapter。

### 3.4 即使 gate 全开，无 transport 也会失败而不是误调用

[packages/app/src/novel/adapters/real-llm-adapter.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel/adapters/real-llm-adapter.ts#L159-L179) 的 `executeStream` 流程：

1. 先校验双 gate + 流式 gate；
2. 构造 LLMRequest；
3. 若 `dryRun=true` 只返回预览事件；
4. 否则调用 `this.client.stream(llmRequest)`；
5. 由于 client 默认使用 `disabledLLMTransport`，会抛出 `CLIENT_STUB_ONLY` 错误，被 catch 后转换为 `llm.request.failed` 事件。

这正是 `agent-run.tool.test.ts` 中「gate 开启时默认选择 real-llm（stub transport 返回执行错误，但不是 ADAPTER_DISABLED）」这条测试所验证的行为。

## 4. P3-B 实际验证了什么

`bun test src/novel` 362 条测试全部通过，验证的是：

| 验证项 | 说明 |
|--------|------|
| 工作流改造 | `chapter.continue.yaml` 正确路由到 `agent-run` Tool |
| Adapter 路由 | gate 关闭默认 mock；gate 开启默认 real-llm；显式 real-llm + gate 关闭返回 `ADAPTER_DISABLED` |
| 流式事件聚合 | `useNovelLLMTask` 能把 mock token 事件聚合成 `AITask` 的 `preview` / `output` |
| UI 状态展示 | AI Task Panel / Progress Dock / Result Card 能显示 running / completed / failed / cancelled |
| 安全策略 | `novel:precommit` 拦截硬编码 API Key、`process.env.*API_KEY`、真实 LLM endpoint |
| 错误路径 | gate 未开、stream 未开、缺少 transport 时均返回结构化错误，不伪成功 |

**没有验证的是**：用真实 DeepSeek API Key 注入 `DeepSeekTransport` 后，从 UI 点击「AI 续写」到收到真实 token 的端到端调用。

## 5. 为什么当初没有执行真实调用验证

1. **项目安全约束**（见 [project_memory.md](file:///c:/Users/MAC/.trae-cn/memory/projects/-c-projects-storytree/project_memory.md)）：
   - "API Key must not enter frontend source code"
   - "default transport is mock/disabled"
   - "real transport is only explicitly injected in controlled environments"
2. **用户未提供 API Key**，无法构造合法的 `DeepSeekTransport`；
3. 方案第 7.2 节把真实 LLM 验证标记为「手动验证（不纳入默认 CI）」，与当前自动化测试策略一致；
4. P3-A 的 Chat Debug  pilot 同样只在 `dryRun=true` 或 stub transport 下验证，未要求真实调用。

## 6. 是否算事故

**不算事故，但算验收缺口。**

- 不是事故：代码按设计运行，没有误发请求、没有泄露密钥、没有破坏现有 mock 路径。
- 是验收缺口：P3-B 方案第 11.5 条验收标准「gate 开启时走 real-llm，过程可流式回显」尚未在真实网络环境中验证过。

## 7. 若要补齐真实调用验证，需要做什么

### 7.1 受控手动验证步骤

1. 准备 DeepSeek API Key（通过环境变量或安全 vault，不写入源码）。
2. 在 VS Code 设置中开启：
   - `realLLMEnabled: true`
   - `targetLLMAdapterEnabled: true`
   - `llmStreamingEnabled: true`
3. 启动应用，打开小说编辑器，选择一段文本，点击「AI 续写」。
4. 观察：
   - AI Task Panel 出现 running + streaming preview；
   - Workspace AI Progress Dock 显示流式进度；
   - AI Result Card 显示完整结果；
   - 点击「采纳」后写入正文；
   - 关闭 gate 后再次点击，走 mock 且不报错。

### 7.2 代码侧需要注入真实 transport

当前 `agent-run.tool.ts` 的 `createDefaultRouter` 未注入真实 transport。若要真实调用，需要：

- 在受控入口（如 extension 启动时或设置变更时）根据配置创建 `DeepSeekTransport`；
- 通过依赖注入传入 `createDefaultRouter(transport)`；
- 或者新增一个仅用于手动测试的 tool/registry 覆盖路径。

### 7.3 建议的验证命令

方案中提到的手动测试命令尚未实现：

```bash
# 当前不存在该文件
REAL_LLM_PILOT=1 bun test src/novel/hooks/use-novel-llm-task.manual.test.ts
```

如需补齐，可新增一个手动测试文件，在测试中读取环境变量 `DEEPSEEK_API_KEY`，构造 `DeepSeekTransport` 并注入 client，验证真实流式调用。

## 8. 建议的后续处理

| 选项 | 操作 | 风险 |
|------|------|------|
| A | 保持现状，P3-B 标记为「实现完成，真实调用验证待 P3-C 前补齐」 | 低，但验收缺口遗留 |
| B | 用户提供 API Key，我执行一次受控手动端到端验证 | 中，需确保密钥不进入源码/日志 |
| C | 新增手动测试文件，读取环境变量验证真实调用，但不纳入默认 CI | 中，测试环境需配置密钥 |

## 9. 完成标记

本澄清报告输出后，P3-B 状态调整为：

```text
[READY_FOR_P3C_REAL_LLM_CHAPTER_GENERATION_WITH_MANUAL_VERIFY_PENDING]
```

真实 LLM 端到端调用验证待用户决定是否补齐。

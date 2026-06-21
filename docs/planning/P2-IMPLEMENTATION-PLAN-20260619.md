# NovelForge Phase P2 实施方案

> 我是：前端工程师 / Novel 模块开发 Agent (Kimi-K2.7-Code)
> 本次任务：P2-IMPLEMENTATION-PLAN-20260619
> 职责范围：`packages/app/src/novel/`、`docs/planning/`

---

## 一、目标

在 Phase P1 Mock 数据流已冻结的基础上，将 NovelForge 小说编辑器从“硬编码函数编排”升级为“配置化、可测试、可扩展、非侵入式”的小说工作流执行架构。

核心目标：

1. 建立 YAML Workflow Engine，支持章节生成、续写、大纲、细纲、信息提取等流程配置化。
2. 建立 Plugin Tool Registry，使工作流步骤可调用注册工具。
3. 建立信息论建模服务，输出章节级信息状态。
4. 建立 Adapter Router + Mock / OpenCode Stub / ClaudeCode Stub 三级执行器。
5. 建立 Chat Debug Console，支持开发态通过命令触发工作流 dry run。
6. 完成 6-8 个核心 P0 按钮与 YAML Workflow 的动作绑定。
7. 不侵入 OpenCode Core，不接入真实 LLM / 数据库 / 支付 / 云同步。

---

## 二、调整后的阶段路线

基于评审意见，将原方案的 7 个阶段调整为推荐执行顺序，允许在依赖满足时并行。

| 阶段 | 名称 | 目标 | 依赖 | 完成标记 |
|------|------|------|------|---------|
| P2-0 | PRD + Action + FeatureGate 基线 | 输出 3 个核心基线文档 + 1 个接口契约文档 | P1 验收完成 | `[READY_FOR_P2A0]` |
| P2-A0 | Chat Debug Console | 开发态命令行入口，可触发 Mock workflow dry run | P2-0 | `[READY_FOR_P2A]` |
| P2-A | YAML Workflow Engine | 定义 schema、loader、engine，至少 3 个 YAML 工作流 | P2-0 / 可与 P2-A0 并行 | `[READY_FOR_P2B]` |
| P2-B | Plugin Tool Registry | Tool 注册、查询、执行；5 个 core tools | P2-A | `[READY_FOR_P2C]` |
| P2-C | Information Theory Modeling | 信息论指标计算服务 + auditor | P2-A | `[READY_FOR_P2D]` |
| P2-D | 核心按钮动作对齐 | 绑定 6-8 个 P0 按钮到 YAML Workflow | P2-B / P2-C | `[READY_FOR_P2E]` |
| P2-E | Adapter Router + Stub | Mock / OpenCode / ClaudeCode Adapter Stub | P2-A | `[PHASE_P2_ACCEPTED_CANDIDATE]` |

---

## 三、关键接口设计

### 3.1 NovelCommand

```typescript
export interface NovelCommand {
  id: string;
  type: 'chapter.generate' | 'chapter.continue' | 'outline.generate' | 'outline.detail' | 'info.extract';
  projectId: string;
  chapterId?: string;
  payload: Record<string, unknown>;
}
```

### 3.2 NovelWorkflowEngine

```typescript
export interface NovelWorkflowEngine {
  load(yamlPath: string): Promise<WorkflowDefinition>;
  execute(command: NovelCommand, context: WorkflowContext): AsyncGenerator<WorkflowStepResult>;
}

export interface WorkflowDefinition {
  id: string;
  version: number;
  steps: WorkflowStep[];
  outputSchema: JSONSchema;
}

export interface WorkflowStep {
  id: string;
  tool: string;
  adapter: 'mock' | 'opencode-stub' | 'claudecode-stub';
  inputs: Record<string, string | number | boolean>;
  outputs: Record<string, string>;
}
```

### 3.3 NovelTool

```typescript
export interface NovelTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
  execute(input: unknown, context: ToolContext): Promise<ToolResult>;
}

export interface ToolContext {
  projectId: string;
  chapterId?: string;
  workflowContext: WorkflowContext;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}
```

### 3.4 AgentExecutionAdapter

```typescript
export interface AgentExecutionAdapter {
  readonly name: string;
  canHandle(command: NovelCommand): boolean;
  execute(command: NovelCommand, context: AdapterContext): Promise<NovelAgentResult>;
}

export interface AdapterContext {
  projectId: string;
  chapterId?: string;
  targetWordCount: number;
  genre: string;
}
```

### 3.5 NovelWorkflowEvent 扩展

在 P1 事件基础上扩展：

```typescript
export type NovelWorkflowEvent =
  | P1NovelWorkflowEvent
  | { type: 'workflow.step.started'; stepId: string }
  | { type: 'workflow.step.completed'; stepId: string; result: unknown }
  | { type: 'info.theory.calculated'; chapterId: string; score: InformationScore }
  | { type: 'adapter.routed'; adapter: string };
```

---

## 四、文件组织

```
packages/app/src/novel/
├── adapters/
│   ├── agent-execution-adapter.ts      # 统一 Adapter 接口
│   ├── mock-execution-adapter.ts       # Mock 执行器
│   ├── opencode-adapter.ts             # OpenCode Stub
│   ├── claudecode-adapter.ts           # ClaudeCode Stub
│   └── adapter-router.ts               # 路由选择
├── chat-debug/
│   ├── novel-debug-command-parser.ts
│   ├── novel-debug-command-runner.ts
│   ├── novel-debug-log-store.ts
│   └── novel-debug-log-types.ts
├── info-theory/
│   ├── information-types.ts
│   ├── entropy-calculator.ts
│   ├── mutual-information-calculator.ts
│   └── information-auditor.ts
├── plugins/
│   ├── novel-tool-registry.ts
│   ├── novel-tool-plugin.ts
│   ├── core-writing-tools/
│   │   ├── chapter-generate.tool.ts
│   │   ├── chapter-continue.tool.ts
│   │   └── outline-generate.tool.ts
│   └── core-info-theory-tools/
│       └── info-extract.tool.ts
├── workflows/
│   ├── yaml/
│   │   ├── chapter.generate.yaml
│   │   ├── chapter.continue.yaml
│   │   ├── outline.generate.yaml
│   │   └── info.extract.yaml
│   ├── engine/
│   │   ├── workflow-engine.ts
│   │   ├── workflow-loader.ts
│   │   └── workflow-context.ts
│   └── mock-generation-workflow.ts     # 保留，逐步迁移
└── docs/phase-p2/
    ├── p2-baseline-matrix.md
    ├── p2-feature-gate-plan.md
    ├── p2-gap-report.md
    └── p2-interface-contract.md
```

---

## 五、Mock → YAML 渐进迁移策略

为避免“另起炉灶”导致既有 E2E 回归，按以下路径迁移：

1. **P2-A 早期**：YAML Engine 先包装现有 `mock-generation-workflow.ts`，即 YAML 定义只描述步骤名称，实际执行仍复用现有函数。
2. **P2-B**：将 YAML 中的每个步骤映射到 Tool Registry 中的 Tool，Tool 内部复用现有逻辑。
3. **P2-C**：在 YAML 中插入 `info-theory-audit` 步骤，信息论服务计算后输出事件。
4. **P2-E**：将 YAML 中的 `adapter: mock` 逐步扩展为 `mock | opencode-stub | claudecode-stub`，AdapterRouter 根据配置路由。
5. **P2 结束**：`mock-generation-workflow.ts` 可被 YAML 工作流完全替代，保留为回归测试参考。

每个阶段都必须满足：

- `bun typecheck` 通过
- `bun test src/novel` 通过
- `bunx playwright test e2e/novel` 不回归

---

## 六、FeatureGate 计划

沿用并精简评审后的 FeatureGate 清单：

| Gate Key | 默认值 | 控制范围 |
|----------|--------|---------|
| `realLLMEnabled` | false | 真实 LLM 接入 |
| `openCodeAdapterEnabled` | false | OpenCode 真实执行 |
| `claudeCodeAdapterEnabled` | false | ClaudeCode 真实执行 |
| `paymentEnabled` | false | 积分充值 / 付费 |
| `cloudSyncEnabled` | false | 云同步 |
| `exportEnabled` | false | 数据导出 |
| `importEnabled` | false | 数据导入 |
| `bookAnalysisEnabled` | false | AI 拆书工作室 |
| `nameGeneratorEnabled` | false | 名字生成器 |
| `guide25Enabled` | false | 25 道题引导 |
| `batchGenerationEnabled` | false | 批量生成 |

P2 阶段所有 gate 默认关闭，未开启时 UI 显示“暂未开放”或禁用按钮。

---

## 七、验收标准

### 7.1 单阶段验收

| 检查项 | 目标 |
|--------|------|
| `bun typecheck` | 0 errors |
| `bun test src/novel` | 100% pass |
| `bunx playwright test e2e/novel` | 不回归 |
| 新增核心逻辑 | 必须有单元测试 |
| UI 主链路变更 | 必须更新 E2E |

### 7.2 Phase P2 整体验收

1. YAML Workflow 至少覆盖：章节生成、AI 续写、大纲生成、信息提取。
2. Tool Registry 可注册、查询、执行 Tool。
3. 信息论服务可输出 `ChapterInformationState`。
4. AdapterRouter 可路由到 Mock / OpenCode Stub / ClaudeCode Stub。
5. Chat Debug 可触发至少一个 Workflow dry run。
6. 6-8 个核心 P0 按钮完成 YAML Workflow 绑定。
7. 不修改 OpenCode Core。
8. 不接真实 LLM。
9. 输出完整 P2 验收报告。

---

## 八、时间估算

| 阶段 | 预估时间 | 说明 |
|------|---------|------|
| P2-0 | 0.5-1 天 | 文档为主，可脚本辅助 |
| P2-A0 | 1 天 | Chat Debug Console 最小实现 |
| P2-A | 2-3 天 | YAML Engine + 3 个工作流 |
| P2-B | 2 天 | Tool Registry + 5 tools |
| P2-C | 2 天 | Info Theory 服务 |
| P2-D | 2 天 | 核心按钮绑定 |
| P2-E | 1-2 天 | Adapter Stub + Router |
| **总计** | **10.5-13 天** | 允许部分阶段并行 |

---

## 九、风险与对策

| 风险 | 对策 |
|------|------|
| 文档驱动过重，延迟编码 | P2-0 合并为 3+1 文档，限制在 1 天内完成 |
| 112 Action 全量核对遗漏 | 脚本扫描 + 聚焦 P0/P1，其余默认 FeatureGate |
| YAML Engine 替换导致 E2E 回归 | 渐进迁移，每个阶段保持 E2E 不回归 |
| 接口理解不一致 | P2-0 输出 `p2-interface-contract.md` |
| FeatureGate 过多导致 UI 碎片化 | 统一 gate 检查 Hook，默认行为一致 |
| 阶段顺序刚性导致阻塞 | 改为推荐顺序，允许依赖满足后并行 |

---

## 十、下一步行动

1. 主控评审通过本方案。
2. 进入 P2-0：输出 `p2-baseline-matrix.md`、`p2-feature-gate-plan.md`、`p2-gap-report.md`、`p2-interface-contract.md`。
3. P2-0 完成后输出 `[READY_FOR_P2A0]`。

---

[READY_FOR_MAIN_CONTROL_REVIEW]

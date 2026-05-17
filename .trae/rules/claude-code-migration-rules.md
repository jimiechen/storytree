# Claude-Code 移植规则

> **⚠️ 全局生效**: 此规则适用于所有 Claude-Code 相关的移植任务，所有 Agent 必须无条件遵守。

## 规则 1：闭源依赖三级降级链（强制）

任何 Agent 遇到无法 import 的闭源模块时，必须按顺序执行：
1. **查 opencode** - 检查 `packages/opencode/src/` 是否有同功能实现
2. **查 npm 公开包** - 查找 TypeScript 支持且 stars > 1000 的成熟替代
3. **自研最小实现** - 仅实现当前阶段需要的功能子集

跳过任何一级直接自研，视为违规，PR 不予合并。

## 规则 2：自研模块必须有 ADR（强制）

凡是走到第三级自研的模块，必须在 `docs/vscode-oss-integration/` 下创建对应 ADR 文档（从 ADR-003 开始编号），说明：
- 为何无法从 opencode 或第三方找到替代
- 自研接口的契约定义
- 实现范围和边界

没有 ADR 的自研 PR 不予合并。

## 规则 3：工具接口必须向 claude-code 原版对齐（强制）

所有工具实现必须满足 `Tool` 接口：
```typescript
interface Tool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  execute(input: unknown, context: ToolContext): Promise<ToolResult>;
}
```

`ToolContext` 必须包含 `worktreePath` 和 `permissionManager`，不允许工具内部直接操作文件系统绝对路径。

## 规则 4：stub 占位策略（推荐）

工具注册表在功能未完成时必须用 stub 占位，返回：
```typescript
{ success: false, error: 'not implemented', tool: '<name>' }
```

禁止因为工具未实现就跳过注册，否则 AgentLoop 无法感知工具存在。

## 规则 5：Session 层来源约束（推荐）

Session 管理层优先从 opencode 移植，不从 claude-code 的 Session 实现直接复制——opencode 的 Session 已解耦 provider，天然支持多模型场景，claude-code 的 Session 与 Anthropic SDK 强耦合。
/**
 * @file adapters/index.ts
 * @description Novel Agent Adapter 统一导出 — P2-E
 */

export type {
  AdapterKind,
  AdapterContext,
  AdapterExecutionResult,
  AdapterFeatureGates,
  AdapterRouterError,
  AdapterRouterErrorCode,
  AgentExecutionAdapter,
  AdapterRouter,
} from './adapter-types';

export { createAdapterRouter } from './adapter-router';
export { MockExecutionAdapter, type MockExecutionAdapterOptions } from './mock-execution-adapter';
export { OpenCodeExecutionAdapter } from './opencode-execution-adapter';
export { ClaudeCodeExecutionAdapter } from './claudecode-execution-adapter';

// 保留 P1/P2-D 旧接口与默认实例，保证现有代码不回归
export type { NovelAgentAdapter } from './novel-agent-adapter';
export { MockAgentAdapter, mockAgentAdapter } from './mock-agent-adapter';

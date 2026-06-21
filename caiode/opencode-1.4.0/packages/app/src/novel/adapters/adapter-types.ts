/**
 * @file adapters/adapter-types.ts
 * @description Agent Execution Adapter 统一类型 — P2-E
 *
 * P2-E 引入 AdapterRouter，把"调用哪个执行器"从 Workflow Engine / Tool 中解耦出来。
 * 当前阶段只提供 mock、opencode-stub、claudecode-stub 三类执行器；
 * 真实 LLM / OpenCode / ClaudeCode 能力默认被 FeatureGate 关闭，P3 再逐步打开。
 */

import type { NovelCommand } from '../workflows/novel-command';
import type { NovelAgentResult } from '../types/ai-task';

/** P2-E 支持的 Adapter 种类 */
export type AdapterKind = 'mock' | 'opencode-stub' | 'claudecode-stub';

/**
 * Adapter 执行上下文。
 *
 * - workspaceId / branchId / worktreeId / modelProfileId / modelRole 在 P2 阶段只透传，
 *   不执行真实 Git Worktree、不触发真实多模型路由。
 * - dryRun 仅用于调试，P2 阶段所有 adapter 在 dryRun=true 时返回稳定结果，不写文件。
 */
export interface AdapterContext {
  workspaceId?: string;
  projectId: string;
  chapterId?: string;

  branchId?: string;
  worktreeId?: string;

  modelProfileId?: string;
  modelRole?: 'draft' | 'rewrite' | 'audit' | 'outline' | 'summary' | 'critic';

  targetWordCount?: number;
  genre?: string;
  dryRun?: boolean;
}

/**
 * Adapter 执行结果。
 *
 * 成功时返回 NovelAgentResult；失败时返回结构化错误码，避免 UI / Tool 层伪成功。
 */
export interface AdapterExecutionResult {
  success: boolean;
  result?: NovelAgentResult;
  errorCode?: string;
  error?: string;
}

/**
 * Agent 执行器接口。
 *
 * P2-E 只做接口边界，真实执行器放到后续阶段。
 * 每个 adapter 自己声明能处理哪些命令；Router 根据 FeatureGate 选择实际使用的 adapter。
 */
export interface AgentExecutionAdapter {
  readonly name: AdapterKind;

  /** 当前 adapter 是否能处理该命令 */
  canHandle(command: NovelCommand, context: AdapterContext): boolean;

  /** 执行命令并返回结果 */
  execute(command: NovelCommand, context: AdapterContext): Promise<AdapterExecutionResult>;
}

/**
 * Adapter 路由错误码。
 *
 * - ADAPTER_DISABLED：显式请求了被 FeatureGate 关闭的 adapter。
 * - ADAPTER_NOT_FOUND：未注册或无法匹配到可用 adapter。
 * - ADAPTER_EXECUTION_FAILED：adapter 执行过程中抛错。
 */
export type AdapterRouterErrorCode =
  | 'ADAPTER_DISABLED'
  | 'ADAPTER_NOT_FOUND'
  | 'ADAPTER_EXECUTION_FAILED';

/** AdapterRouter 接口 */
export interface AdapterRouter {
  /** 注册一个 adapter */
  register(adapter: AgentExecutionAdapter): void;

  /**
   * 根据请求与 FeatureGate 选择并返回可用 adapter。
   *
   * - 未指定 adapter 时默认返回 mock。
   * - 显式请求被关闭的 adapter 时返回 ADAPTER_DISABLED 错误，不伪成功。
   * - 未注册 adapter 时返回 ADAPTER_NOT_FOUND。
   */
  route(
    requested: AdapterKind | undefined,
    command: NovelCommand,
    context: AdapterContext,
    gates: AdapterFeatureGates,
  ): AgentExecutionAdapter | AdapterRouterError;
}

/** AdapterRouter 路由错误 */
export interface AdapterRouterError {
  success: false;
  errorCode: AdapterRouterErrorCode;
  error: string;
}

/** 控制 adapter 可见性的 FeatureGate */
export interface AdapterFeatureGates {
  realLLMEnabled: boolean;
  openCodeAdapterEnabled: boolean;
  claudeCodeAdapterEnabled: boolean;
}

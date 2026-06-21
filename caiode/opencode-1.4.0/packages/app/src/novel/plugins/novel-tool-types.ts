/**
 * @file plugins/novel-tool-types.ts
 * @description Novel Tool Registry 核心类型 — P2-B
 */

import type { NovelCommand } from '../workflows/novel-command';

/** JSON Schema 占位类型，P2 阶段先用 unknown */
export type JSONSchema = unknown;

/**
 * Tool 执行上下文。
 * 从 WorkflowExecutionContext 派生，并透传原始 NovelCommand 供包装现有工作流使用。
 */
export interface ToolContext {
  workflowId: string;
  commandId: string;
  commandType: string;

  workspaceId?: string;
  projectId: string;
  chapterId?: string;

  branchId?: string;
  worktreeId?: string;
  modelProfileId?: string;
  skillId?: string;

  variables: Record<string, unknown>;
  stepResults: Record<string, unknown>;

  /** 原始 NovelCommand，由 Engine 注入 */
  command: NovelCommand;
}

/** Tool 执行结果 */
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  errorCode?: string;
  events?: unknown[];
}

/** 单个 Tool 定义 */
export interface NovelTool {
  name: string;
  description: string;
  inputSchema?: JSONSchema;
  outputSchema?: JSONSchema;
  execute(input: unknown, context: ToolContext): Promise<ToolResult>;
}

/** Tool Registry */
export interface NovelToolRegistry {
  register(tool: NovelTool): void;
  has(name: string): boolean;
  get(name: string): NovelTool | undefined;
  list(): NovelTool[];
  execute(name: string, input: unknown, context: ToolContext): Promise<ToolResult>;
}

/** Tool Plugin 契约 */
export interface NovelToolPlugin {
  id: string;
  name: string;
  version: string;
  tools: NovelTool[];
}

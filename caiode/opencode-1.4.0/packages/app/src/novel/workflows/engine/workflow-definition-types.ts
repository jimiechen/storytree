/**
 * @file workflows/engine/workflow-definition-types.ts
 * @description Workspace-aware YAML Workflow Engine 类型定义 — P2-A
 */

import type { NovelCommand } from '../novel-command';

export type WorkflowAdapterKind = 'mock' | 'opencode-stub' | 'claudecode-stub';

export interface WorkflowDefinition {
  id: string;
  version: number;
  commandType: string;
  description?: string;
  steps: WorkflowStep[];
  outputSchema?: unknown;
}

export interface WorkflowStep {
  id: string;
  name?: string;
  tool: string;
  adapter?: WorkflowAdapterKind;
  inputs: Record<string, unknown>;
  outputs?: Record<string, string>;
  continueOnError?: boolean;
}

export interface WorkflowExecutionContext {
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
  status: 'idle' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface WorkflowStepResult {
  stepId: string;
  status: 'started' | 'completed' | 'failed';
  output?: unknown;
  error?: string;
}

export interface NormalizedNovelCommand {
  id: string;
  type: NovelCommand['type'];

  workspaceId?: string;
  projectId: string;
  chapterId: string;

  branchId: string;
  worktreeId?: string;
  modelProfileId?: string;
  skillId: string;
  workflowId: string;

  payload: Record<string, unknown>;
}

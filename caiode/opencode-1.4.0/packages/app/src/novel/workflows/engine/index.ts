/**
 * @file workflows/engine/index.ts
 * @description Workspace-aware YAML Workflow Engine 统一导出 — P2-A
 */

export type {
  WorkflowAdapterKind,
  WorkflowDefinition,
  WorkflowStep,
  WorkflowExecutionContext,
  WorkflowStepResult,
  NormalizedNovelCommand,
} from './workflow-definition-types';

export {
  WorkflowEngineError,
  WorkflowLoadError,
  WorkflowResolveError,
  WorkflowExecutionError,
} from './workflow-engine-errors';

export { normalizeNovelCommand } from './workflow-command-normalizer';
export { loadWorkflowDefinition, loadWorkflowDefinitionFromText } from './workflow-loader';
export {
  resolveWorkflowId,
  getBuiltinWorkflowPath,
  resolveBuiltinWorkflowPath,
} from './workflow-resolver';
export { createNovelWorkflowEngine, type NovelWorkflowEngine } from './workflow-engine';

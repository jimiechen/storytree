/**
 * @file workflows/engine/workflow-engine-errors.ts
 * @description Workflow Engine 可控错误 — P2-A
 */

export class WorkflowEngineError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = 'WorkflowEngineError';
  }
}

export class WorkflowLoadError extends WorkflowEngineError {
  constructor(message: string) {
    super(message, 'WORKFLOW_LOAD_ERROR');
    this.name = 'WorkflowLoadError';
  }
}

export class WorkflowResolveError extends WorkflowEngineError {
  constructor(message: string) {
    super(message, 'WORKFLOW_RESOLVE_ERROR');
    this.name = 'WorkflowResolveError';
  }
}

export class WorkflowExecutionError extends WorkflowEngineError {
  constructor(message: string) {
    super(message, 'WORKFLOW_EXECUTION_ERROR');
    this.name = 'WorkflowExecutionError';
  }
}

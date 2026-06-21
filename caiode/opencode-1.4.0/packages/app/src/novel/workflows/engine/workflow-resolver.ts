/**
 * @file workflows/engine/workflow-resolver.ts
 * @description Workflow Resolver：根据 NormalizedNovelCommand 找到 workflowId / 路径 — P2-A
 */

import path from 'node:path';
import type { NormalizedNovelCommand } from './workflow-definition-types';
import { WorkflowResolveError } from './workflow-engine-errors';

const COMMAND_TO_WORKFLOW: Record<string, string> = {
  'chapter.generate': 'chapter.generate',
  'chapter.rewrite': 'chapter.continue',
  'chapter.expand': 'chapter.continue',
  'chapter.polish': 'chapter.continue',
  'chapter.summarize': 'chapter.continue',
  'chapter.extract-info': 'info.extract',
  'outline.generate': 'outline.generate',
  'outline.detail': 'outline.detail',
};

/**
 * 根据命令解析 workflowId。
 */
export function resolveWorkflowId(command: NormalizedNovelCommand): string {
  if (command.workflowId) return command.workflowId;

  const workflowId = COMMAND_TO_WORKFLOW[command.type];
  if (!workflowId) {
    throw new WorkflowResolveError(`Unknown command type: ${command.type}`);
  }
  return workflowId;
}

/**
 * 返回内置 YAML workflow 文件路径。
 */
export function getBuiltinWorkflowPath(workflowId: string): string {
  return path.resolve(
    import.meta.dir,
    '..',
    'yaml',
    `${workflowId}.yaml`,
  );
}

/**
 * 根据 NormalizedNovelCommand 直接得到内置 workflow 路径。
 */
export function resolveBuiltinWorkflowPath(command: NormalizedNovelCommand): string {
  return getBuiltinWorkflowPath(resolveWorkflowId(command));
}

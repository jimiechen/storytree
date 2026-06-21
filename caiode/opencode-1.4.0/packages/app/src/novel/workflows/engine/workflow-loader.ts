/**
 * @file workflows/engine/workflow-loader.ts
 * @description YAML Workflow Loader — P2-A
 */

import { parse } from 'yaml';
import type { WorkflowDefinition } from './workflow-definition-types';
import { WorkflowLoadError } from './workflow-engine-errors';

function assertDefinition(value: unknown): asserts value is WorkflowDefinition {
  if (!value || typeof value !== 'object') {
    throw new WorkflowLoadError('Workflow definition must be an object');
  }

  const def = value as Record<string, unknown>;

  if (typeof def.id !== 'string' || def.id.length === 0) {
    throw new WorkflowLoadError('Workflow definition must have a non-empty "id"');
  }

  if (typeof def.version !== 'number') {
    throw new WorkflowLoadError('Workflow definition must have a numeric "version"');
  }

  if (typeof def.commandType !== 'string' || def.commandType.length === 0) {
    throw new WorkflowLoadError('Workflow definition must have a non-empty "commandType"');
  }

  if (!Array.isArray(def.steps) || def.steps.length === 0) {
    throw new WorkflowLoadError('Workflow definition must have a non-empty "steps" array');
  }

  for (const step of def.steps) {
    if (!step || typeof step !== 'object') {
      throw new WorkflowLoadError('Each workflow step must be an object');
    }
    const s = step as Record<string, unknown>;
    if (typeof s.id !== 'string' || s.id.length === 0) {
      throw new WorkflowLoadError('Each workflow step must have a non-empty "id"');
    }
    if (typeof s.tool !== 'string' || s.tool.length === 0) {
      throw new WorkflowLoadError('Each workflow step must have a non-empty "tool"');
    }
  }
}

/**
 * 从 YAML 文本加载 WorkflowDefinition。
 */
export function loadWorkflowDefinitionFromText(text: string): WorkflowDefinition {
  const parsed = parse(text);
  assertDefinition(parsed);
  return parsed;
}

/**
 * 从文件路径加载 YAML WorkflowDefinition。
 * P2-A 依赖 Bun 文件系统；浏览器环境需另行封装。
 */
export async function loadWorkflowDefinition(workflowPath: string): Promise<WorkflowDefinition> {
  if (typeof Bun === 'undefined') {
    throw new WorkflowLoadError('Filesystem loader requires Bun runtime in P2-A');
  }

  const text = await Bun.file(workflowPath).text();
  return loadWorkflowDefinitionFromText(text);
}

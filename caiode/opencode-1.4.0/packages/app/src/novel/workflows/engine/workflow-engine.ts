/**
 * @file workflows/engine/workflow-engine.ts
 * @description Workspace-aware YAML Workflow Engine（P2-B 使用 Tool Registry）
 */

import type { NovelAgentAdapter } from '../../adapters/novel-agent-adapter';
import type { AdapterFeatureGates } from '../../adapters/adapter-types';
import type { NovelCommand } from '../novel-command';
import type {
  NormalizedNovelCommand,
  WorkflowDefinition,
  WorkflowExecutionContext,
  WorkflowStep,
  WorkflowStepResult,
} from './workflow-definition-types';
import { WorkflowExecutionError } from './workflow-engine-errors';
import { normalizeNovelCommand } from './workflow-command-normalizer';
import { loadWorkflowDefinition } from './workflow-loader';
import { resolveBuiltinWorkflowPath, resolveWorkflowId } from './workflow-resolver';
import type { NovelToolRegistry, ToolContext } from '../../plugins/novel-tool-types';
import { createBuiltinNovelToolRegistry } from '../../plugins/builtin-novel-tools';

export interface NovelWorkflowEngine {
  load(workflowId: string): Promise<WorkflowDefinition>;
  execute(command: NovelCommand, definition?: WorkflowDefinition): AsyncGenerator<WorkflowStepResult>;
}

export interface WorkflowEngineOptions {
  adapter?: NovelAgentAdapter;
  registry?: NovelToolRegistry;
  /** 测试注入用：控制 agent-run 默认路由，避免真实 LLM gate 开启时测试超时 */
  gates?: AdapterFeatureGates;
}

function createExecutionContext(
  command: NormalizedNovelCommand,
  definition: WorkflowDefinition,
): WorkflowExecutionContext {
  return {
    workflowId: definition.id,
    commandId: command.id,
    commandType: command.type,

    workspaceId: command.workspaceId,
    projectId: command.projectId,
    chapterId: command.chapterId,
    branchId: command.branchId,
    worktreeId: command.worktreeId,
    modelProfileId: command.modelProfileId,
    skillId: command.skillId,

    variables: {},
    stepResults: {},
    status: 'idle',
    createdAt: new Date(),
  };
}

function buildVariables(command: NormalizedNovelCommand): Record<string, unknown> {
  return {
    id: command.id,
    type: command.type,
    workspaceId: command.workspaceId,
    projectId: command.projectId,
    chapterId: command.chapterId,
    branchId: command.branchId,
    worktreeId: command.worktreeId,
    modelProfileId: command.modelProfileId,
    skillId: command.skillId,
    workflowId: command.workflowId,
    ...command.payload,
  };
}

function interpolateInputs(
  inputs: Record<string, unknown>,
  variables: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(inputs)) {
    if (typeof value === 'string') {
      result[key] = value.replace(/\{\{(\w+)\}\}/g, (_, name) => {
        const replacement = variables[name];
        return replacement !== undefined ? String(replacement) : `{{${name}}}`;
      });
    } else {
      result[key] = value;
    }
  }
  return result;
}

function createToolContext(
  context: WorkflowExecutionContext,
  command: NovelCommand,
): ToolContext {
  return {
    workflowId: context.workflowId,
    commandId: context.commandId,
    commandType: context.commandType,

    workspaceId: context.workspaceId,
    projectId: context.projectId,
    chapterId: context.chapterId,
    branchId: context.branchId,
    worktreeId: context.worktreeId,
    modelProfileId: context.modelProfileId,
    skillId: context.skillId,

    variables: context.variables,
    stepResults: context.stepResults,
    command,
  };
}

function applyStepOutputs(
  variables: Record<string, unknown>,
  step: WorkflowStep,
  data: unknown,
): void {
  if (!step.outputs) return;
  for (const [varName, fieldName] of Object.entries(step.outputs)) {
    if (data && typeof data === 'object' && fieldName in (data as Record<string, unknown>)) {
      variables[varName] = (data as Record<string, unknown>)[fieldName];
    }
  }
}

export function createNovelWorkflowEngine(options?: WorkflowEngineOptions): NovelWorkflowEngine {
  const registry =
    options?.registry ??
    createBuiltinNovelToolRegistry({
      adapter: options?.adapter,
      gates: options?.gates,
    });

  return {
    async load(workflowId) {
      const path = resolveBuiltinWorkflowPath({
        ...normalizeNovelCommand({
          type: 'chapter.generate',
          projectId: 'dummy',
          chapterId: 'dummy',
          chapterIndex: 0,
          genre: '',
          text: '',
          createdAt: new Date(),
        }),
        workflowId,
      });
      return loadWorkflowDefinition(path);
    },

    async* execute(command, definition) {
      const normalized = normalizeNovelCommand(command);
      const workflowId = resolveWorkflowId(normalized);
      const resolvedDefinition =
        definition ??
        (await loadWorkflowDefinition(resolveBuiltinWorkflowPath(normalized)));
      const context = createExecutionContext(normalized, resolvedDefinition);
      context.status = 'running';

      const variables = buildVariables(normalized);
      let finalResult: unknown;
      let hasFailed = false;

      for (const step of resolvedDefinition.steps) {
        const toolContext = createToolContext(context, command);
        const inputs = interpolateInputs(step.inputs, variables);

        yield { stepId: step.id, status: 'started' };

        const toolResult = await registry.execute(step.tool, inputs, toolContext);

        if (toolResult.success) {
          yield {
            stepId: step.id,
            status: 'completed',
            output: toolResult.data,
          };
          context.stepResults[step.id] = toolResult.data;
          applyStepOutputs(variables, step, toolResult.data);
          finalResult = toolResult.data;
        } else {
          hasFailed = true;
          yield {
            stepId: step.id,
            status: 'failed',
            error: toolResult.error,
          };
          if (!step.continueOnError) {
            throw new WorkflowExecutionError(
              toolResult.error || `Tool ${step.tool} failed`,
            );
          }
        }
      }

      context.status = hasFailed ? 'failed' : 'completed';
      context.completedAt = new Date();

      if (finalResult) {
        yield {
          stepId: 'workflow-completed',
          status: 'completed',
          output: finalResult,
        };
      }
    },
  };
}

/**
 * @file workflows/engine/workflow-loader.test.ts
 * @description Workflow Loader 单元测试 — P2-A
 */

import { describe, it, expect } from 'vitest';
import { loadWorkflowDefinition, loadWorkflowDefinitionFromText } from './workflow-loader';
import { getBuiltinWorkflowPath } from './workflow-resolver';
import { WorkflowLoadError } from './workflow-engine-errors';

describe('WorkflowLoader', () => {
  it('loads chapter.generate.yaml from file', async () => {
    const def = await loadWorkflowDefinition(getBuiltinWorkflowPath('chapter.generate'));
    expect(def.id).toBe('chapter.generate');
    expect(def.version).toBe(2);
    expect(def.commandType).toBe('chapter.generate');
    expect(def.steps.length).toBeGreaterThan(0);
    expect(def.steps[0].tool).toBe('agent-run');
  });

  it('loads chapter.continue.yaml from file', async () => {
    const def = await loadWorkflowDefinition(getBuiltinWorkflowPath('chapter.continue'));
    expect(def.id).toBe('chapter.continue');
    expect(def.version).toBe(2);
    expect(def.commandType).toBe('chapter.continue');
    expect(def.steps[0].tool).toBe('agent-run');
  });

  it('loads info.extract.yaml from file', async () => {
    const def = await loadWorkflowDefinition(getBuiltinWorkflowPath('info.extract'));
    expect(def.id).toBe('info.extract');
    expect(def.commandType).toBe('info.extract');
    expect(def.steps[0].tool).toBe('info-theory-audit');
  });

  it('loads from text', () => {
    const yaml = `
id: test.workflow
version: 1
commandType: chapter.generate
steps:
  - id: step-1
    tool: mock-generation-wrapper
    inputs:
      projectId: "{{projectId}}"
`;
    const def = loadWorkflowDefinitionFromText(yaml);
    expect(def.id).toBe('test.workflow');
    expect(def.steps[0].id).toBe('step-1');
  });

  it('throws WorkflowLoadError when id is missing', () => {
    const yaml = `
version: 1
commandType: chapter.generate
steps:
  - id: step-1
    tool: mock-generation-wrapper
`;
    expect(() => loadWorkflowDefinitionFromText(yaml)).toThrow(WorkflowLoadError);
  });

  it('throws WorkflowLoadError when steps are empty', () => {
    const yaml = `
id: empty.workflow
version: 1
commandType: chapter.generate
steps: []
`;
    expect(() => loadWorkflowDefinitionFromText(yaml)).toThrow(WorkflowLoadError);
  });

  it('throws WorkflowLoadError when step id is missing', () => {
    const yaml = `
id: bad.step
version: 1
commandType: chapter.generate
steps:
  - tool: mock-generation-wrapper
`;
    expect(() => loadWorkflowDefinitionFromText(yaml)).toThrow(WorkflowLoadError);
  });
});

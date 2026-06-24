/**
 * @file workflows/engine/workflow-loader.ts
 * @description YAML Workflow Loader — P2-A / P3-D
 *
 * P3-D 修复：浏览器环境无法访问 Bun 文件系统，改为通过 Vite 的 import.meta.glob
 * 在构建时将所有 YAML workflow 打包为 raw 字符串，运行时按 workflowId 查找。
 */

import { parse } from 'yaml';
import type { WorkflowDefinition } from './workflow-definition-types';
import { WorkflowLoadError } from './workflow-engine-errors';

// Vite 构建时收集所有 YAML workflow 内容为 raw 字符串。
// Bun 测试环境中没有 import.meta.glob，直接返回空对象，由下方 Bun.file 分支读取真实文件。
// 注意：import.meta.glob 是 Vite 编译期宏，必须使用直接调用语法，不能通过 (import.meta as any).glob 动态访问，
// 否则 Vite 不会替换它，浏览器运行时就无法打包 YAML 文件。
const workflowModules: Record<string, string> =
  typeof Bun === 'undefined'
    ? (import.meta.glob('../yaml/*.yaml', {
        query: '?raw',
        import: 'default',
        eager: true,
      }) as Record<string, string>)
    : {};

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
 * 从 workflowId 查找并加载 YAML WorkflowDefinition。
 *
 * P3-D：优先使用 Vite 构建时打包的 raw 字符串（浏览器可用），
 * 回退到 Bun 文件系统（单元测试 / Node 环境）。
 */
export async function loadWorkflowDefinition(workflowPath: string): Promise<WorkflowDefinition> {
  // workflowPath 可能为：
  // - "/src/novel/workflows/yaml/chapter.continue.yaml"（旧路径格式）
  // - "chapter.continue.yaml"（P3-D 新格式，由 getBuiltinWorkflowPath 返回）
  const workflowId = workflowPath.replace(/^.*\//, '').replace(/\.yaml$/, '');

  // 1) 浏览器 / Vite 环境：从 import.meta.glob 结果查找
  const keys = Object.keys(workflowModules);
  const matchedKey = keys.find(k => k.includes(`/${workflowId}.yaml`));
  if (matchedKey) {
    return loadWorkflowDefinitionFromText(workflowModules[matchedKey]);
  }

  // 2) Bun / Node 环境：将 workflowId 转换为实际文件路径后读取
  if (typeof Bun !== 'undefined') {
    // 单元测试期望 getBuiltinWorkflowPath 仍能解析到真实 YAML 文件
    // 使用 import.meta.dir 定位当前文件所在目录，再拼接 yaml/ 子目录
    const actualPath = workflowPath.includes('/yaml/')
      ? workflowPath
      : `${import.meta.dir}/../yaml/${workflowId}.yaml`;
    const text = await Bun.file(actualPath).text();
    return loadWorkflowDefinitionFromText(text);
  }

  throw new WorkflowLoadError(
    `Workflow "${workflowId}" not found in bundled YAML modules (available: ${keys.length}). ` +
    `Path: ${workflowPath}`,
  );
}

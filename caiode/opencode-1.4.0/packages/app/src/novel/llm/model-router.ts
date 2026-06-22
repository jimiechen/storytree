/**
 * @file llm/model-router.ts
 * @description 模型路由 — P3-D
 *
 * 根据 command / modelRole / 用户指定 profileId 解析最终使用的 ModelProfile。
 */

import type { NovelCommand } from '../workflows/novel-command';
import type { AdapterContext } from '../adapters/adapter-types';
import type { ModelProfile, ModelRole } from './model-profile';
import type { ModelProfileRegistry } from './model-profile-registry';
import { createDefaultModelProfileRegistry } from './model-profile-registry';

/** 模型路由器接口。 */
export interface ModelRouter {
  resolveProfile(command: NovelCommand, context: AdapterContext): ModelProfile;
}

/** 命令类型 → 默认 model role 的映射。 */
function defaultRoleForCommand(command: NovelCommand): ModelRole {
  switch (command.type) {
    case 'chapter.generate':
      return 'draft';
    case 'chapter.rewrite':
      switch (command.command) {
        case 'continue':
        case 'expand':
          return 'draft';
        case 'rewrite':
        case 'polish':
          return 'rewrite';
        case 'summarize':
          return 'summary';
        default:
          return 'draft';
      }
    case 'chapter.expand':
      return 'draft';
    case 'chapter.polish':
      return 'rewrite';
    case 'chapter.summarize':
      return 'summary';
    case 'chapter.extract-info':
      return 'audit';
    default:
      return 'draft';
  }
}

/** Model role → 默认 profile id 的映射。 */
function defaultProfileIdForRole(role: ModelRole): string {
  switch (role) {
    case 'draft':
    case 'outline':
    case 'summary':
    case 'audit':
      return 'deepseek-flash';
    case 'rewrite':
    case 'critic':
      return 'deepseek-chat';
    default:
      return 'deepseek-flash';
  }
}

/**
 * 创建模型路由器。
 */
export function createModelRouter(
  registry: ModelProfileRegistry = createDefaultModelProfileRegistry(),
): ModelRouter {
  return {
    resolveProfile(command, context) {
      if (context.modelProfileId) {
        const explicit = registry.get(context.modelProfileId);
        if (explicit) return explicit;
      }

      const role = context.modelRole ?? defaultRoleForCommand(command);
      const profileId = defaultProfileIdForRole(role);
      const fallback = registry.list()[0];
      return registry.get(profileId) ?? fallback ?? createDefaultModelProfileRegistry().get('mock-default')!;
    },
  };
}

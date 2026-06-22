/**
 * @file llm/model-profile-registry.ts
 * @description 模型配置注册表 — P3-D
 *
 * 提供 ModelProfile 的注册、查询与默认注册表实例。
 * 测试可注入自定义 profile，避免依赖全局默认配置。
 */

import type { ModelProfile } from './model-profile';
import { DEFAULT_MODEL_PROFILES } from './model-profile';

/** 模型配置注册表接口。 */
export interface ModelProfileRegistry {
  register(profile: ModelProfile): void;
  unregister(profileId: string): void;
  get(profileId: string): ModelProfile | undefined;
  list(): ModelProfile[];
}

/**
 * 创建模型配置注册表。
 */
export function createModelProfileRegistry(
  initialProfiles: ModelProfile[] = [],
): ModelProfileRegistry {
  const profiles = new Map<string, ModelProfile>();

  for (const profile of initialProfiles) {
    profiles.set(profile.id, profile);
  }

  return {
    register(profile) {
      profiles.set(profile.id, profile);
    },

    unregister(profileId) {
      profiles.delete(profileId);
    },

    get(profileId) {
      return profiles.get(profileId);
    },

    list() {
      return Array.from(profiles.values());
    },
  };
}

/** 默认模型配置注册表，包含 DEFAULT_MODEL_PROFILES。 */
export function createDefaultModelProfileRegistry(): ModelProfileRegistry {
  return createModelProfileRegistry(DEFAULT_MODEL_PROFILES);
}
